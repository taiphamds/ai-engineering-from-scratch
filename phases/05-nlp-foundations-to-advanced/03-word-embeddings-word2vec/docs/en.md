# Word Embeddings — Word2Vec from Scratch

> Một từ là những gì đi cùng nó. Huấn luyện một mạng nông trên ý tưởng đó và hình học tự xuất hiện.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 3 · 03 (Backpropagation from Scratch)
**Time:** ~75 minutes

## The Problem

TF-IDF biết `dog` và `puppy` là những từ khác nhau. Nó không biết chúng có nghĩa gần như giống nhau. Một bộ phân loại được huấn luyện trên `dog` không thể khái quát sang một đánh giá về `puppy`. Bạn có thể che lấp điều này bằng cách liệt kê các từ đồng nghĩa, nhưng cách đó thất bại với các thuật ngữ hiếm, biệt ngữ lĩnh vực và mọi ngôn ngữ bạn không dự liệu.

Bạn muốn một biểu diễn mà `dog` và `puppy` nằm gần nhau trong không gian. Mà `king - man + woman` nằm gần `queen`. Mà một mô hình được huấn luyện trên `dog` chuyển một phần tín hiệu sang `puppy` miễn phí.

Word2Vec cho chúng ta không gian đó. Mạng nơ-ron hai tầng, các lượt huấn luyện nghìn tỷ token, được công bố năm 2013. Kiến trúc gần như đơn giản đến ngượng ngùng. Các kết quả đã định hình lại NLP trong một thập kỷ.

## The Concept

**Giả thuyết phân bố** (Firth, 1957): "Bạn sẽ biết một từ qua những gì đi cùng nó." Nếu hai từ xuất hiện trong những ngữ cảnh tương tự, chúng có lẽ mang ý nghĩa tương tự.

Word2Vec có hai dạng, cả hai khai thác ý tưởng đó.

- **Skip-gram.** Cho một từ trung tâm, dự đoán các từ xung quanh. `cat -> (the, sat, on)` với kích thước cửa sổ 2.
- **CBOW (bag of words liên tục).** Cho các từ xung quanh, dự đoán từ trung tâm. `(the, sat, on) -> cat`.

Skip-gram huấn luyện chậm hơn nhưng xử lý các từ hiếm tốt hơn. Nó trở thành mặc định.

Mạng có một tầng ẩn không có tính phi tuyến. Đầu vào là một vector one-hot trên từ vựng. Đầu ra là một softmax trên từ vựng. Sau huấn luyện, bạn bỏ tầng đầu ra. Các trọng số tầng ẩn là các embedding.

```
one-hot(center) ── W ──▶ hidden (d-dim) ── W' ──▶ softmax(vocab)
                          ^
                          this is the embedding
```

Thủ thuật: softmax trên 100k từ tốn kém đến mức không thể chấp nhận. Word2Vec dùng **lấy mẫu âm** để biến nó thành một tác vụ phân loại nhị phân. Dự đoán "từ ngữ cảnh này có xuất hiện gần từ trung tâm này không, có hay không". Lấy mẫu một số ít từ âm (không đồng xuất hiện) cho mỗi cặp huấn luyện thay vì tính softmax trên toàn bộ từ vựng.

```figure
word-vector-arithmetic
```

## Build It

### Step 1: training pairs from a corpus

```python
def skipgram_pairs(docs, window=2):
    pairs = []
    for doc in docs:
        for i, center in enumerate(doc):
            for j in range(max(0, i - window), min(len(doc), i + window + 1)):
                if i == j:
                    continue
                pairs.append((center, doc[j]))
    return pairs
```

```python
>>> skipgram_pairs([["the", "cat", "sat", "on", "mat"]], window=2)
[('the', 'cat'), ('the', 'sat'),
 ('cat', 'the'), ('cat', 'sat'), ('cat', 'on'),
 ('sat', 'the'), ('sat', 'cat'), ('sat', 'on'), ('sat', 'mat'),
 ...]
```

Mỗi cặp (trung tâm, ngữ cảnh) trong một cửa sổ là một ví dụ huấn luyện dương.

### Step 2: embedding tables

Hai ma trận. `W` là bảng embedding từ trung tâm (bảng bạn giữ). `W'` là bảng từ ngữ cảnh (thường bị bỏ, đôi khi được lấy trung bình với `W`).

```python
import numpy as np


def init_embeddings(vocab_size, dim, seed=0):
    rng = np.random.default_rng(seed)
    W = rng.normal(0, 0.1, size=(vocab_size, dim))
    W_prime = rng.normal(0, 0.1, size=(vocab_size, dim))
    return W, W_prime
```

Khởi tạo ngẫu nhiên nhỏ. Kích thước từ vựng 10k và số chiều 100 là thực tế; để giảng dạy, từ vựng 50 x số chiều 16 là đủ để thấy hình học.

### Step 3: negative sampling objective

Với mỗi cặp dương `(center, context)`, lấy mẫu `k` từ ngẫu nhiên từ từ vựng làm mẫu âm. Huấn luyện mô hình sao cho tích vô hướng `W[center] · W'[context]` cao với mẫu dương và thấp với mẫu âm.

```python
def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -20, 20)))


def train_pair(W, W_prime, center_idx, context_idx, negative_indices, lr):
    v_c = W[center_idx]
    u_pos = W_prime[context_idx]
    u_negs = W_prime[negative_indices]

    pos_score = sigmoid(v_c @ u_pos)
    neg_scores = sigmoid(u_negs @ v_c)

    grad_center = (pos_score - 1) * u_pos
    for i, u in enumerate(u_negs):
        grad_center += neg_scores[i] * u

    W[context_idx] = W[context_idx]
    W_prime[context_idx] -= lr * (pos_score - 1) * v_c
    for i, neg_idx in enumerate(negative_indices):
        W_prime[neg_idx] -= lr * neg_scores[i] * v_c
    W[center_idx] -= lr * grad_center
```

Công thức kỳ diệu: logistic loss trên cặp dương (muốn sigmoid gần 1) cộng logistic loss trên các cặp âm (muốn sigmoid gần 0). Gradient truyền đến cả hai bảng. Suy dẫn đầy đủ nằm trong bài báo gốc; đi qua nó một lần bằng bút và giấy nếu bạn muốn nhớ lâu.

### Step 4: train on a toy corpus

```python
def train(docs, dim=16, window=2, k_neg=5, epochs=100, lr=0.05, seed=0):
    vocab = build_vocab(docs)
    vocab_size = len(vocab)
    rng = np.random.default_rng(seed)
    W, W_prime = init_embeddings(vocab_size, dim, seed=seed)
    pairs = skipgram_pairs(docs, window=window)

    for epoch in range(epochs):
        rng.shuffle(pairs)
        for center, context in pairs:
            c_idx = vocab[center]
            ctx_idx = vocab[context]
            negs = rng.integers(0, vocab_size, size=k_neg)
            negs = [n for n in negs if n != ctx_idx and n != c_idx]
            train_pair(W, W_prime, c_idx, ctx_idx, negs, lr)
    return vocab, W
```

Sau đủ epoch trên một ngữ liệu lớn, các từ có chung ngữ cảnh có các embedding trung tâm tương tự. Trên một ngữ liệu đồ chơi, bạn thấy hiệu ứng mờ nhạt. Trên hàng tỷ token, bạn thấy nó rõ rệt.

### Step 5: the analogy trick

```python
def nearest(vocab, W, target_vec, topk=5, exclude=None):
    exclude = exclude or set()
    inv_vocab = {i: w for w, i in vocab.items()}
    norms = np.linalg.norm(W, axis=1, keepdims=True) + 1e-9
    W_norm = W / norms
    target = target_vec / (np.linalg.norm(target_vec) + 1e-9)
    sims = W_norm @ target
    order = np.argsort(-sims)
    out = []
    for i in order:
        if i in exclude:
            continue
        out.append((inv_vocab[i], float(sims[i])))
        if len(out) == topk:
            break
    return out


def analogy(vocab, W, a, b, c, topk=5):
    v = W[vocab[b]] - W[vocab[a]] + W[vocab[c]]
    return nearest(vocab, W, v, topk=topk, exclude={vocab[a], vocab[b], vocab[c]})
```

Trên các vector Google News 300d được tiền huấn luyện:

```python
>>> analogy(vocab, W, "man", "king", "woman")
[('queen', 0.71), ('monarch', 0.62), ('princess', 0.59), ...]
```

`king - man + woman = queen`. Không phải vì mô hình biết hoàng gia là gì. Vì vector `(king - man)` nắm bắt một thứ như "thuộc hoàng gia", và cộng nó vào `woman` đưa đến gần vùng nữ-hoàng gia.

## Use It

Viết Word2Vec từ đầu là giảng dạy. NLP production dùng `gensim`.

```python
from gensim.models import Word2Vec

sentences = [
    ["the", "cat", "sat", "on", "the", "mat"],
    ["the", "dog", "ran", "across", "the", "room"],
]

model = Word2Vec(
    sentences,
    vector_size=100,
    window=5,
    min_count=1,
    sg=1,
    negative=5,
    workers=4,
    epochs=30,
)

print(model.wv["cat"])
print(model.wv.most_similar("cat", topn=3))
```

Cho công việc thực tế, bạn gần như không bao giờ tự huấn luyện Word2Vec. Bạn tải các vector được tiền huấn luyện.

- **GloVe** — cách tiếp cận phân rã ma trận đồng xuất hiện của Stanford. Các checkpoint 50d, 100d, 200d, 300d. Độ bao phủ tổng quát tốt. Bài 04 đề cập riêng GloVe.
- **fastText** — phần mở rộng Word2Vec của Facebook embedding các n-gram ký tự. Xử lý các từ ngoài từ vựng bằng cách kết hợp các từ con. Bài 04.
- **Word2Vec được tiền huấn luyện trên Google News** — 300d, từ vựng 3M từ, công bố năm 2013. Vẫn được tải hằng ngày.

### When Word2Vec still wins in 2026

- Truy xuất nhẹ theo lĩnh vực. Huấn luyện trên các tóm tắt y khoa trong một giờ trên máy tính xách tay, có được các vector chuyên biệt mà không mô hình tổng quát nào nắm bắt.
- Kỹ thuật đặc trưng kiểu tương tự. `gender_vector = mean(man - woman pairs)`. Trừ nó khỏi các từ khác để có một trục trung lập về giới. Vẫn được dùng trong nghiên cứu công bằng.
- Khả năng diễn giải. 100d đủ nhỏ để vẽ qua PCA hoặc t-SNE và thực sự thấy các cụm hình thành.
- Bất kỳ nơi nào suy luận phải chạy trên thiết bị mà không có GPU. Tra cứu Word2Vec là lấy một hàng duy nhất.

### Where Word2Vec fails

Bức tường đa nghĩa. `bank` có một vector. `river bank` và `financial bank` dùng chung nó. `table` (bảng tính so với đồ nội thất) dùng chung nó. Một bộ phân loại phía sau không thể phân biệt các nghĩa từ vector.

Embedding theo ngữ cảnh (ELMo, BERT, mọi transformer kể từ đó) giải quyết điều này bằng cách tạo một vector khác cho mỗi lần xuất hiện của từ dựa trên ngữ cảnh xung quanh. Đó là bước nhảy từ Word2Vec sang BERT: từ tĩnh sang theo ngữ cảnh. Phase 7 đề cập nửa transformer.

Vấn đề ngoài từ vựng là lỗi còn lại. Word2Vec chưa bao giờ thấy `Zoomer-approved` nếu nó không nằm trong dữ liệu huấn luyện. Không có phương án dự phòng. fastText sửa điều này bằng kết hợp từ con (bài 04).

## Ship It

Lưu thành `outputs/skill-embedding-probe.md`:

```markdown
---
name: embedding-probe
description: Inspect a word2vec model. Run analogies, find neighbors, diagnose quality.
version: 1.0.0
phase: 5
lesson: 03
tags: [nlp, embeddings, debugging]
---

You probe trained word embeddings to verify they are working. Given a `gensim.models.KeyedVectors` object and a vocabulary, you run:

1. Three canonical analogy tests. `king : man :: queen : woman`. `paris : france :: tokyo : japan`. `walking : walked :: swimming : ?`. Report the top-1 result and its cosine.
2. Five nearest-neighbor tests on domain-specific words the user supplies. Print top-5 neighbors with cosines.
3. One symmetry check. `similarity(a, b) == similarity(b, a)` to within float precision.
4. One degenerate check. If any embedding has a norm below 0.01 or above 100, the model has a training bug. Flag it.

Refuse to declare a model good on analogy accuracy alone. Analogy benchmarks are gameable and do not transfer to downstream tasks. Recommend intrinsic + downstream evaluation together.
```

## Exercises

1. **Dễ.** Chạy vòng lặp huấn luyện trên một ngữ liệu nhỏ (20 câu về mèo và chó). Sau 200 epoch, xác minh `nearest(vocab, W, W[vocab["cat"]])` trả `dog` trong top 3. Nếu không, tăng số epoch hoặc từ vựng.
2. **Trung bình.** Thêm lấy mẫu giảm các từ thường gặp. Các từ có tần suất trên `10^-5` bị loại khỏi các cặp huấn luyện với xác suất tỷ lệ với tần suất của chúng. Đo tác động lên độ tương đồng từ hiếm.
3. **Khó.** Huấn luyện một mô hình trên ngữ liệu 20 Newsgroups. Tính hai trục thiên lệch: `he - she` và `doctor - nurse`. Chiếu các từ nghề nghiệp lên cả hai trục. Báo cáo những nghề nào có khoảng cách thiên lệch lớn nhất. Đây là loại phép thăm dò các nhà nghiên cứu công bằng sử dụng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Word embedding (Embedding từ) | Từ dưới dạng vector | Một biểu diễn đặc, ít chiều (thường 100-300) được học từ ngữ cảnh. |
| Skip-gram | Thủ thuật Word2Vec | Dự đoán các từ ngữ cảnh từ từ trung tâm. Chậm hơn CBOW, tốt hơn cho từ hiếm. |
| Negative sampling (Lấy mẫu âm) | Lối tắt huấn luyện | Thay softmax trên toàn bộ từ vựng bằng phân loại nhị phân với `k` từ ngẫu nhiên. |
| Static embedding (Embedding tĩnh) | Một vector cho mỗi từ | Cùng một vector bất kể ngữ cảnh. Thất bại với đa nghĩa. |
| Contextual embedding (Embedding theo ngữ cảnh) | Vector nhạy với ngữ cảnh | Vector khác cho mỗi lần xuất hiện dựa trên các từ xung quanh. Thứ transformer tạo ra. |
| OOV | Ngoài từ vựng | Từ chưa được thấy trong huấn luyện. Word2Vec không thể tạo một vector cho chúng. |

## Further Reading

- [Mikolov et al. (2013). Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546) — bài báo lấy mẫu âm. Ngắn và dễ đọc.
- [Rong, X. (2014). word2vec Parameter Learning Explained](https://arxiv.org/abs/1411.2738) — suy dẫn các gradient rõ ràng nhất, nếu toán trong bài báo gốc có vẻ dày đặc.
- [gensim Word2Vec tutorial](https://radimrehurek.com/gensim/models/word2vec.html) — các thiết lập huấn luyện production thực sự hoạt động.
