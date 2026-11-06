# Text Generation Before Transformers — N-gram Language Models

> Nếu một từ gây bất ngờ, mô hình tệ. Perplexity biến sự bất ngờ thành một con số. Làm trơn giữ nó hữu hạn.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 14 (Naive Bayes)
**Time:** ~45 minutes

## The Problem

Trước transformer, trước RNN, trước embedding từ, một mô hình ngôn ngữ dự đoán từ tiếp theo bằng cách đếm tần suất nó theo sau `n-1` từ trước. Đếm "the cat" → "sat" 47 lần, "the cat" → "jumped" 12 lần, "the cat" → "refrigerator" 0 lần. Chuẩn hóa để có một phân phối xác suất.

Đó là một mô hình ngôn ngữ n-gram. Nó chạy mọi bộ nhận dạng tiếng nói, mọi bộ kiểm tra chính tả và mọi hệ thống dịch máy dựa trên cụm từ từ 1980 đến 2015. Nó vẫn chạy khi bạn cần mô hình hóa ngôn ngữ trên thiết bị với chi phí thấp.

Vấn đề thú vị là phải làm gì với các n-gram chưa thấy. Một mô hình dựa trên số đếm thô gán xác suất bằng không cho bất kỳ thứ gì nó chưa thấy, điều thảm họa vì các câu dài và gần như mọi câu dài chứa ít nhất một chuỗi chưa thấy. Năm mươi năm nghiên cứu làm trơn sửa điều đó. Làm trơn Kneser-Ney là kết quả, và deep learning hiện đại kế thừa truyền thống thực nghiệm của nó.

## The Concept

![N-gram model: count, smooth, generate](../assets/ngram.svg)

### The prediction game

Trước khi bất kỳ bộ máy nào trong số này tồn tại, một thử nghiệm định nghĩa mô hình ngôn ngữ là gì. Che chữ cái tiếp theo của một câu tiếng Anh. Yêu cầu ai đó đoán nó, mỗi lần một dự đoán, đến khi họ đoán đúng. Ghi lại số lần đoán. Lặp lại cho vài trăm chữ cái.

Các số lần đoán không phải chuyện vụn vặt. Chúng là một cách tái mã hóa không mất mát của văn bản: đưa chuỗi số đếm cho một người đoán thứ hai giống hệt và họ có thể dựng lại mọi chữ cái, vì ở mỗi vị trí họ biết chính xác những dự đoán nào đến trước. Một thông điệp bạn có thể tái mã hóa bằng ít ký hiệu hơn mang ít thông tin hơn trên mỗi ký hiệu, nên các thống kê số lần đoán đặt một mức trần cho entropy của tiếng Anh.

Shannon thực hiện điều này năm 1951 và có một con số vẫn chi phối lĩnh vực. Một bảng chữ cái 27 ký hiệu (26 chữ cái cộng khoảng trắng) có thể mang `log2(27) ≈ 4.75` bit mỗi chữ cái. Những người đoán có ngữ cảnh 100 chữ cái đạt từ 0.6 đến 1.3 bit mỗi chữ cái. Tiếng Anh có khoảng ba phần tư là các nước đi bắt buộc. Cấu trúc một mô hình phải học đã được đo trước khi bất kỳ mô hình nào có thể học nó.

Mọi mô hình ngôn ngữ kể từ đó là một người chơi máy móc của trò chơi này, và mọi con số đánh giá trong bài học này là trò chơi được chấm điểm:

- **Cross-entropy loss** là số bit trung bình mô hình cần cho mỗi ký hiệu. Huấn luyện một LM theo nghĩa đen là giảm thiểu điểm của nó trong trò chơi đoán.
- **Perplexity** là `2^bits` (hoặc `e^nats`): hệ số phân nhánh vẫn đối mặt mô hình sau việc đoán của nó. Đoán đều trên 27 ký hiệu là perplexity 27; một người chơi 1 bit mỗi chữ cái có perplexity 2.
- **Độ dài ngữ cảnh là bộ nhớ của người chơi.** Một mô hình trigram chơi với bộ nhớ hai token. Một transformer chơi cùng trò chơi với 100K token. Các quy tắc không bao giờ đổi; người chơi giỏi hơn.

Một chuyển đổi đơn vị cần theo dõi: trò chơi chấm theo chữ cái bằng bit (`log2`), trong khi các công thức n-gram bên dưới chấm theo token từ bằng nat (log tự nhiên) — và vì perplexity `e^H` bằng nat bằng `2^H` bằng bit, hai cách nhìn là cùng một phép đo theo các đơn vị khác nhau.

```figure
prediction-game
```

**Xác suất n-gram:** `P(w_i | w_{i-n+1}, ..., w_{i-1})`. Cố định `n` (thường 3 cho trigram, 4 cho 4-gram). Tính từ các số đếm:

```text
P(w | context) = count(context, w) / count(context)
```

**Vấn đề số đếm bằng không.** Bất kỳ n-gram nào không thấy trong huấn luyện nhận xác suất bằng không. Một nghiên cứu năm 2007 trên ngữ liệu Brown phát hiện ngay cả mô hình 4-gram có 30% các 4-gram được giữ lại chưa thấy trong huấn luyện. Bạn không thể đánh giá trên bất kỳ văn bản thực nào nếu không làm trơn.

**Các cách tiếp cận làm trơn, theo thứ tự độ tinh vi:**

1. **Laplace (cộng một).** Cộng 1 vào mọi số đếm. Đơn giản, rất tệ với các sự kiện hiếm.
2. **Good-Turing.** Phân bổ lại khối lượng xác suất từ các sự kiện tần suất cao hơn sang các sự kiện chưa thấy dựa trên tần suất của các tần suất.
3. **Nội suy.** Kết hợp các ước lượng n-gram, (n-1)-gram, v.v., với các trọng số có thể tinh chỉnh.
4. **Backoff.** Nếu n-gram có số đếm bằng không, quay về (n-1)-gram. Katz backoff chuẩn hóa điều này.
5. **Chiết khấu tuyệt đối.** Trừ một lượng chiết khấu cố định `D` khỏi mọi số đếm, phân phối lại cho các trường hợp chưa thấy.
6. **Kneser-Ney.** Chiết khấu tuyệt đối cộng một lựa chọn thông minh cho mô hình bậc thấp hơn: dùng *xác suất tiếp diễn* (một từ xuất hiện trong bao nhiêu ngữ cảnh) thay vì tần suất thô.

Nhận thức của Kneser-Ney sâu sắc. "San Francisco" là một bigram phổ biến. Unigram "Francisco" xuất hiện chủ yếu sau "San." Chiết khấu tuyệt đối ngây thơ cho "Francisco" xác suất unigram cao (vì số đếm cao). Kneser-Ney nhận ra "Francisco" chỉ xuất hiện trong một ngữ cảnh và hạ xác suất tiếp diễn tương ứng. Kết quả: một bigram mới kết thúc bằng "Francisco" nhận xác suất thấp thích hợp.

**Đánh giá: perplexity.** Hàm mũ của negative log-likelihood trung bình mỗi từ trên một tập kiểm thử được giữ lại. Thấp hơn là tốt hơn. Perplexity 100 nghĩa là mô hình bối rối như khi chọn đều giữa 100 từ.

```text
perplexity = exp(- (1/N) * Σ log P(w_i | context_i))
```

```figure
ngram-backoff
```

## Build It

### Step 1: trigram counts

```python
from collections import Counter, defaultdict


def train_ngram(corpus_tokens, n=3):
    ngrams = Counter()
    contexts = Counter()
    for sentence in corpus_tokens:
        padded = ["<s>"] * (n - 1) + sentence + ["</s>"]
        for i in range(len(padded) - n + 1):
            ctx = tuple(padded[i:i + n - 1])
            word = padded[i + n - 1]
            ngrams[ctx + (word,)] += 1
            contexts[ctx] += 1
    return ngrams, contexts


def raw_probability(ngrams, contexts, context, word):
    ctx = tuple(context)
    if contexts.get(ctx, 0) == 0:
        return 0.0
    return ngrams.get(ctx + (word,), 0) / contexts[ctx]
```

Đầu vào là một danh sách các câu đã tokenize. Đầu ra là các số đếm n-gram và các số đếm ngữ cảnh. `<s>` và `</s>` là các ranh giới câu.

### Step 2: Laplace smoothing

```python
def laplace_probability(ngrams, contexts, vocab_size, context, word):
    ctx = tuple(context)
    numerator = ngrams.get(ctx + (word,), 0) + 1
    denominator = contexts.get(ctx, 0) + vocab_size
    return numerator / denominator
```

Cộng 1 vào mọi số đếm. Làm trơn nhưng phân bổ quá nhiều khối lượng cho các sự kiện chưa thấy, cũng gây hại các sự kiện đã biết hiếm.

### Step 3: Kneser-Ney (bigram, interpolated)

```python
def kneser_ney_bigram_model(corpus_tokens, discount=0.75):
    unigrams = Counter()
    bigrams = Counter()
    unigram_contexts = defaultdict(set)

    for sentence in corpus_tokens:
        padded = ["<s>"] + sentence + ["</s>"]
        for i, w in enumerate(padded):
            unigrams[w] += 1
            if i > 0:
                prev = padded[i - 1]
                bigrams[(prev, w)] += 1
                unigram_contexts[w].add(prev)

    total_unique_bigrams = sum(len(ctx_set) for ctx_set in unigram_contexts.values())
    continuation_prob = {
        w: len(ctx_set) / total_unique_bigrams for w, ctx_set in unigram_contexts.items()
    }

    context_totals = Counter()
    for (prev, w), count in bigrams.items():
        context_totals[prev] += count

    unique_follow = defaultdict(set)
    for (prev, w) in bigrams:
        unique_follow[prev].add(w)

    def prob(prev, w):
        count = bigrams.get((prev, w), 0)
        denom = context_totals.get(prev, 0)
        if denom == 0:
            return continuation_prob.get(w, 1e-9)
        first_term = max(count - discount, 0) / denom
        lambda_prev = discount * len(unique_follow[prev]) / denom
        return first_term + lambda_prev * continuation_prob.get(w, 1e-9)

    return prob
```

Ba thành phần. `continuation_prob` nắm bắt "từ này xuất hiện trong bao nhiêu ngữ cảnh khác nhau?" (đổi mới của Kneser-Ney). `lambda_prev` là khối lượng được giải phóng bởi chiết khấu, được dùng để gán trọng số backoff. Xác suất cuối là số hạng chính được chiết khấu cộng số hạng tiếp diễn được gán trọng số.

### Step 4: generating text with sampling

```python
import random


def generate(prob_fn, vocab, prefix, max_len=30, seed=0):
    rng = random.Random(seed)
    tokens = list(prefix)
    for _ in range(max_len):
        candidates = [(w, prob_fn(tokens[-1], w)) for w in vocab]
        total = sum(p for _, p in candidates)
        r = rng.random() * total
        acc = 0.0
        for w, p in candidates:
            acc += p
            if r <= acc:
                tokens.append(w)
                break
        if tokens[-1] == "</s>":
            break
    return tokens
```

Lấy mẫu tỷ lệ với xác suất. Luôn cho đầu ra khác theo mỗi seed. Để có đầu ra giống beam search, chọn argmax ở mỗi bước (tham lam) và thêm một nút điều chỉnh tính ngẫu nhiên nhỏ (temperature).

### Step 5: perplexity

```python
import math


def perplexity(prob_fn, sentences):
    total_log_prob = 0.0
    total_tokens = 0
    for sentence in sentences:
        padded = ["<s>"] + sentence + ["</s>"]
        for i in range(1, len(padded)):
            p = prob_fn(padded[i - 1], padded[i])
            total_log_prob += math.log(max(p, 1e-12))
            total_tokens += 1
    return math.exp(-total_log_prob / total_tokens)
```

Thấp hơn là tốt hơn. Với ngữ liệu Brown, một mô hình KN 4-gram được tinh chỉnh tốt đạt perplexity khoảng 140. Một LM transformer đạt 15-30 trên cùng tập kiểm thử. Khoảng cách khoảng 10 lần. Khoảng cách đó là lý do lĩnh vực chuyển đi.

## Use It

- **Giảng dạy NLP cổ điển.** Sự tiếp xúc rõ ràng nhất với làm trơn, MLE và perplexity mà bạn có thể có.
- **KenLM.** Thư viện n-gram production. Được dùng làm bộ chấm lại trong các hệ thống tiếng nói và MT nơi độ trễ thấp quan trọng.
- **Tự động hoàn thành trên thiết bị.** Các mô hình trigram trong bàn phím. Vẫn vậy.
- **Baseline.** Luôn tính perplexity LM n-gram trước khi tuyên bố LM nơ-ron của bạn tốt. Nếu transformer của bạn không thắng KN với cách biệt lớn, có gì đó sai.

## Ship It

Lưu thành `outputs/prompt-lm-baseline.md`:

```markdown
---
name: lm-baseline
description: Build a reproducible n-gram language model baseline before training a neural LM.
phase: 5
lesson: 16
---

Given a corpus and target use (next-word prediction, rescoring, perplexity baseline), output:

1. N-gram order. Trigram for general English, 4-gram if corpus is large, 5-gram for speech rescoring.
2. Smoothing. Modified Kneser-Ney is the default; Laplace only for teaching.
3. Library. `kenlm` for production, `nltk.lm` for teaching, roll your own only to learn.
4. Evaluation. Held-out perplexity with consistent tokenization between train and test sets.

Refuse to report perplexity computed with different tokenization between systems being compared — perplexity numbers are comparable only under identical tokenization. Flag OOV rate in test set; KN handles OOV poorly unless you reserve a special <UNK> token during training.
```

## Exercises

1. **Dễ.** Huấn luyện một LM trigram trên một ngữ liệu Shakespeare 1,000 câu. Sinh 20 câu. Chúng sẽ hợp lý cục bộ nhưng không mạch lạc toàn cục. Đây là bản minh họa kinh điển.
2. **Trung bình.** Triển khai perplexity cho mô hình KN của bạn trên một phần chia Shakespeare được giữ lại. So sánh với Laplace. Bạn sẽ thấy KN hạ perplexity 30-50%.
3. **Khó.** Xây dựng một bộ sửa chính tả trigram: với một từ sai chính tả và ngữ cảnh của nó, sinh các bản sửa và xếp hạng theo xác suất ngữ cảnh dưới LM. Đánh giá trên ngữ liệu chính tả Birkbeck (công khai).

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| N-gram | Chuỗi từ | Chuỗi `n` token liên tiếp. |
| Smoothing (Làm trơn) | Tránh các số không | Phân bổ lại khối lượng xác suất để các sự kiện chưa thấy nhận xác suất khác không. |
| Perplexity | Thước đo chất lượng LM | `exp(-average log-prob)` trên dữ liệu được giữ lại. Thấp hơn là tốt hơn. |
| Backoff | Quay về ngữ cảnh ngắn hơn | Nếu số đếm trigram bằng không, dùng bigram. Katz backoff hình thức hóa điều này. |
| Kneser-Ney | Làm trơn tốt nhất cho n-gram | Chiết khấu tuyệt đối + xác suất tiếp diễn cho mô hình bậc thấp hơn. |
| Continuation probability (Xác suất tiếp diễn) | Riêng cho KN | `P(w)` được gán trọng số theo số ngữ cảnh `w` xuất hiện, không theo số đếm thô. |
| Entropy of text (Entropy của văn bản) | Thông tin trên mỗi ký hiệu | Số bit trung bình cần để mã hóa ký hiệu tiếp theo khi biết ngữ cảnh. Ước lượng năm 1951 của Shannon cho tiếng Anh in với ngữ cảnh lên đến 100 chữ cái: 0.6-1.3 bit/chữ cái, được đo trước khi bất kỳ mô hình nào tồn tại. |

## Further Reading

- [Shannon (1951). Prediction and Entropy of Printed English](https://www.princeton.edu/~wbialek/rome/refs/shannon_51.pdf) — thử nghiệm trò chơi đoán định nghĩa mục tiêu mà mọi mô hình ngôn ngữ vẫn tối ưu.
- [Jurafsky and Martin — Speech and Language Processing, Chapter 3 (2026 draft)](https://web.stanford.edu/~jurafsky/slp3/3.pdf) — cách trình bày kinh điển về các LM n-gram và làm trơn.
- [Chen and Goodman (1998). An Empirical Study of Smoothing Techniques for Language Modeling](https://dash.harvard.edu/handle/1/25104739) — bài báo xác lập Kneser-Ney là bộ làm trơn n-gram tốt nhất.
- [Kneser and Ney (1995). Improved Backing-off for M-gram Language Modeling](https://ieeexplore.ieee.org/document/479394) — bài báo KN gốc.
- [KenLM](https://kheafield.com/code/kenlm/) — LM n-gram production nhanh, vẫn được dùng năm 2026 cho các ứng dụng nhạy độ trễ.
