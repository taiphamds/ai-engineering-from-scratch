# GloVe, FastText, and Subword Embeddings

> Word2Vec huấn luyện một embedding cho mỗi từ. GloVe phân rã ma trận đồng xuất hiện. FastText embedding các mảnh. BPE nối sang transformer.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 03 (Word2Vec from Scratch)
**Time:** ~45 minutes

## The Problem

Word2Vec để lại hai câu hỏi mở.

Thứ nhất, có một hướng nghiên cứu song song phân rã trực tiếp ma trận đồng xuất hiện (LSA, HAL) thay vì thực hiện các cập nhật skip-gram trực tuyến. Cách tiếp cận lặp của Word2Vec có tốt hơn về cơ bản, hay sự khác biệt là sản phẩm của cách hai phương pháp xử lý các số đếm? **GloVe** trả lời điều đó: phân rã ma trận với một loss được chọn kỹ khớp hoặc thắng Word2Vec và tốn ít chi phí huấn luyện hơn.

Thứ hai, cả hai phương pháp đều không có cách xử lý các từ chúng chưa từng thấy. `Zoomer-approved`, `dogecoin`, bất kỳ danh từ riêng nào được đặt tuần trước, mọi dạng biến tố của một gốc hiếm. **FastText** sửa điều này bằng cách embedding các n-gram ký tự: một từ là tổng các phần của nó, bao gồm các hình vị, nên ngay cả các từ ngoài từ vựng cũng có một vector hợp lý.

Thứ ba, khi transformer xuất hiện, câu hỏi lại thay đổi. Từ vựng cấp từ đạt trần khoảng một triệu mục; ngôn ngữ thực mở hơn thế. **Mã hóa cặp byte (BPE)** và các phương pháp liên quan giải quyết điều này bằng cách học một từ vựng các đơn vị từ con thường gặp bao phủ mọi thứ. Mọi tokenizer hiện đại cho mọi LLM hiện đại đều là tokenizer từ con.

Bài học này đi qua cả ba, rồi giải thích nên chọn phương pháp nào vào lúc nào.

## The Concept

**GloVe (Global Vectors).** Xây dựng ma trận đồng xuất hiện từ-từ `X` trong đó `X[i][j]` là tần suất từ `j` xuất hiện trong ngữ cảnh của từ `i`. Huấn luyện các vector sao cho `v_i · v_j + b_i + b_j ≈ log(X[i][j])`. Gán trọng số loss để các cặp thường gặp không chi phối. Xong.

**FastText.** Một từ là tổng các n-gram ký tự của nó cộng chính từ đó. `where` trở thành `<wh, whe, her, ere, re>, <where>`. Vector từ là tổng của các vector thành phần đó. Huấn luyện như Word2Vec. Lợi ích: các từ chưa thấy (`whereupon`) được kết hợp từ các n-gram đã biết.

**BPE (Byte-Pair Encoding).** Bắt đầu với một từ vựng gồm các byte riêng lẻ (hoặc ký tự). Đếm mọi cặp liền kề trong kho ngữ liệu. Gộp cặp phổ biến nhất thành một token mới. Lặp lại trong `k` vòng. Kết quả: một từ vựng gồm các ký hiệu cơ sở cộng `k` lần gộp (`k + 256` token khi bạn bắt đầu từ byte), trong đó các chuỗi thường gặp (`ing`, `tion`, `the`) là các token đơn và các từ hiếm được tách thành những phần quen thuộc. Mọi câu đều được tách thành các token nào đó.

```figure
n5-subword-merge
```

## Build It

### GloVe: factorize the co-occurrence matrix

```python
import numpy as np
from collections import Counter


def build_cooccurrence(docs, window=5):
    pair_counts = Counter()
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    for doc in docs:
        indexed = [vocab[t] for t in doc]
        for i, center in enumerate(indexed):
            for j in range(max(0, i - window), min(len(indexed), i + window + 1)):
                if i != j:
                    distance = abs(i - j)
                    pair_counts[(center, indexed[j])] += 1.0 / distance
    return vocab, pair_counts


def glove_train(vocab, pair_counts, dim=16, epochs=100, lr=0.05, x_max=100, alpha=0.75, seed=0):
    n = len(vocab)
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(n, dim))
    W_tilde = rng.normal(0, 0.1, size=(n, dim))
    b = np.zeros(n)
    b_tilde = np.zeros(n)

    for epoch in range(epochs):
        for (i, j), x_ij in pair_counts.items():
            weight = (x_ij / x_max) ** alpha if x_ij < x_max else 1.0
            diff = W[i] @ W_tilde[j] + b[i] + b_tilde[j] - np.log(x_ij)
            coef = weight * diff

            grad_W_i = coef * W_tilde[j]
            grad_W_tilde_j = coef * W[i]
            W[i] -= lr * grad_W_i
            W_tilde[j] -= lr * grad_W_tilde_j
            b[i] -= lr * coef
            b_tilde[j] -= lr * coef

    return W + W_tilde
```

Hai thành phần cần nêu tên. Hàm gán trọng số `f(x) = (x/x_max)^alpha` giảm trọng số các cặp rất thường gặp (như `(the, and)`) để chúng không chi phối loss. Embedding cuối là tổng của các bảng `W` (trung tâm) và `W_tilde` (ngữ cảnh). Cộng cả hai là một thủ thuật đã công bố có xu hướng vượt việc chỉ dùng một.

### FastText: subword-aware embeddings

```python
def char_ngrams(word, n_min=3, n_max=6):
    wrapped = f"<{word}>"
    grams = {wrapped}
    for n in range(n_min, n_max + 1):
        for i in range(len(wrapped) - n + 1):
            grams.add(wrapped[i:i + n])
    return grams
```

```python
>>> char_ngrams("where")
{'<where>', '<wh', 'whe', 'her', 'ere', 're>', '<whe', 'wher', 'here', 'ere>', '<wher', 'where', 'here>'}
```

Mỗi từ được biểu diễn bằng tập n-gram của nó (thường từ 3 đến 6 ký tự). Embedding từ là tổng các embedding n-gram của nó. Đối với huấn luyện skip-gram, thay nó vào nơi Word2Vec dùng một vector duy nhất.

```python
def fasttext_vector(word, ngram_table):
    grams = char_ngrams(word)
    vecs = [ngram_table[g] for g in grams if g in ngram_table]
    if not vecs:
        return None
    return np.sum(vecs, axis=0)
```

Với một từ chưa thấy, bạn vẫn có một vector miễn là một số n-gram của nó đã được biết. `whereupon` có chung `<wh`, `her`, `ere` và `<where` với `where`, nên hai từ nằm gần nhau.

### BPE: learned subword vocabulary

```python
def learn_bpe(corpus, k_merges):
    vocab = Counter()
    for word, freq in corpus.items():
        tokens = tuple(word) + ("</w>",)
        vocab[tokens] = freq

    merges = []
    for _ in range(k_merges):
        pair_freq = Counter()
        for tokens, freq in vocab.items():
            for a, b in zip(tokens, tokens[1:]):
                pair_freq[(a, b)] += freq
        if not pair_freq:
            break
        best = pair_freq.most_common(1)[0][0]
        merges.append(best)

        new_vocab = Counter()
        for tokens, freq in vocab.items():
            new_tokens = []
            i = 0
            while i < len(tokens):
                if i + 1 < len(tokens) and (tokens[i], tokens[i + 1]) == best:
                    new_tokens.append(tokens[i] + tokens[i + 1])
                    i += 2
                else:
                    new_tokens.append(tokens[i])
                    i += 1
            new_vocab[tuple(new_tokens)] = freq
        vocab = new_vocab
    return merges


def apply_bpe(word, merges):
    tokens = list(word) + ["</w>"]
    for a, b in merges:
        new_tokens = []
        i = 0
        while i < len(tokens):
            if i + 1 < len(tokens) and tokens[i] == a and tokens[i + 1] == b:
                new_tokens.append(a + b)
                i += 2
            else:
                new_tokens.append(tokens[i])
                i += 1
        tokens = new_tokens
    return tokens
```

```python
>>> corpus = Counter({"low": 5, "lower": 2, "newest": 6, "widest": 3})
>>> merges = learn_bpe(corpus, k_merges=10)
>>> apply_bpe("lowest", merges)
['low', 'est</w>']
```

Lần lặp đầu gộp cặp liền kề thường gặp nhất. Sau đủ lần lặp, các chuỗi con thường gặp (`low`, `est`, `tion`) trở thành token đơn và các từ hiếm được chia gọn gàng.

Các tokenizer GPT / BERT / T5 thực học 30k-100k phép gộp. Kết quả: bất kỳ văn bản nào đều tokenize thành một chuỗi có độ dài bị chặn gồm các ID đã biết, không bao giờ có OOV.

## Use It

Trong thực tế, bạn hiếm khi tự huấn luyện bất kỳ phương pháp nào trong số này. Bạn tải các checkpoint được tiền huấn luyện.

```python
import fasttext.util
fasttext.util.download_model("en", if_exists="ignore")
ft = fasttext.load_model("cc.en.300.bin")
print(ft.get_word_vector("whereupon").shape)
print(ft.get_word_vector("zoomerapproved").shape)
```

Cho tokenization từ con kiểu BPE trong kỷ nguyên transformer:

```python
from transformers import AutoTokenizer

tok = AutoTokenizer.from_pretrained("gpt2")
print(tok.tokenize("unbelievably tokenized"))
```

```
['un', 'bel', 'iev', 'ably', 'Ġtoken', 'ized']
```

Tiền tố `Ġ` đánh dấu ranh giới từ (một quy ước của GPT-2). Mọi tokenizer hiện đại là một biến thể BPE, WordPiece (BERT) hoặc SentencePiece (T5, LLaMA).

### When to pick which

| Tình huống | Chọn |
|-----------|------|
| Các vector từ đa dụng được tiền huấn luyện, không cần khả năng chịu OOV | GloVe 300d |
| Các vector từ đa dụng được tiền huấn luyện, phải xử lý lỗi chính tả / từ mới / các ngôn ngữ giàu hình thái | FastText |
| Bất kỳ thứ gì đi vào một transformer (huấn luyện hoặc suy luận) | Bất kỳ tokenizer nào đi kèm mô hình. Không bao giờ hoán đổi. |
| Huấn luyện mô hình ngôn ngữ của riêng bạn từ đầu | Huấn luyện một tokenizer BPE hoặc SentencePiece trên ngữ liệu của bạn trước |
| Phân loại văn bản production với một mô hình tuyến tính | Vẫn là TF-IDF. Bài 02. |

## Ship It

Lưu thành `outputs/skill-embeddings-picker.md`:

```markdown
---
name: tokenizer-picker
description: Pick a tokenization approach for a new language model or text pipeline.
version: 1.0.0
phase: 5
lesson: 04
tags: [nlp, tokenization, embeddings]
---

Given a task and dataset description, you output:

1. Tokenization strategy (word-level, BPE, WordPiece, SentencePiece, byte-level). One-sentence reason.
2. Vocabulary size target (e.g., 32k for an English-only LM, 64k-100k for multilingual).
3. Library call with the exact training command. Name the library. Quote the arguments.
4. One reproducibility pitfall. Tokenizer-model mismatch is the single most common silent production bug; call out which pair must be used together.

Refuse to recommend training a custom tokenizer when the user is fine-tuning a pretrained LLM. Refuse to recommend word-level tokenization for any model targeting production inference. Flag non-English / multi-script corpora as needing SentencePiece with byte fallback.
```

## Exercises

1. **Dễ.** Chạy `char_ngrams("playing")` và `char_ngrams("played")`. Tính phần giao Jaccard của hai tập n-gram. Bạn sẽ thấy các mảnh chung đáng kể (`pla`, `lay`, `play`), đó là lý do FastText chuyển giao tốt giữa các biến thể hình thái.
2. **Trung bình.** Mở rộng `learn_bpe` để theo dõi sự tăng trưởng từ vựng. Vẽ số token trên mỗi ký tự ngữ liệu theo số lượng phép gộp. Bạn sẽ thấy sự nén nhanh lúc đầu, tiệm cận gần ~2-3 ký tự mỗi token.
3. **Khó.** Huấn luyện một BPE 1k phép gộp trên toàn bộ tác phẩm của Shakespeare. So sánh tokenization của các từ thường gặp với các danh từ riêng hiếm. Đo số token trung bình mỗi từ trước và sau. Viết lại điều khiến bạn ngạc nhiên.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Co-occurrence matrix (Ma trận đồng xuất hiện) | Bảng tần suất từ-từ | `X[i][j]` = tần suất từ `j` xuất hiện trong một cửa sổ quanh từ `i`. |
| Subword (Từ con) | Mảnh của một từ | Một n-gram ký tự (FastText) hoặc token được học (BPE/WordPiece/SentencePiece). |
| BPE | Mã hóa cặp byte | Lặp việc gộp các cặp liền kề thường gặp nhất cho đến khi từ vựng đạt kích thước mục tiêu. |
| OOV | Ngoài từ vựng | Từ mô hình chưa từng thấy. Word2Vec/GloVe thất bại. FastText và BPE xử lý được. |
| Byte-level BPE (BPE cấp byte) | BPE trên các byte thô | Hệ của GPT-2. Từ vựng bắt đầu với 256 byte, nên không có gì là OOV. |

## Further Reading

- [Pennington, Socher, Manning (2014). GloVe: Global Vectors for Word Representation](https://nlp.stanford.edu/pubs/glove.pdf) — bài báo GloVe, bảy trang, vẫn là suy dẫn loss tốt nhất.
- [Bojanowski et al. (2017). Enriching Word Vectors with Subword Information](https://arxiv.org/abs/1607.04606) — FastText.
- [Sennrich, Haddow, Birch (2016). Neural Machine Translation of Rare Words with Subword Units](https://arxiv.org/abs/1508.07909) — bài báo đưa BPE vào NLP hiện đại.
- [Hugging Face tokenizer summary](https://huggingface.co/docs/transformers/tokenizer_summary) — cách BPE, WordPiece và SentencePiece thực sự khác nhau trong thực tế.
