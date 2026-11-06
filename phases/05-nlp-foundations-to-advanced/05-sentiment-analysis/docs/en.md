# Sentiment Analysis

> Tác vụ NLP kinh điển. Hầu hết những gì bạn cần biết về phân loại văn bản cổ điển xuất hiện ở đây.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 02 (BoW + TF-IDF), Phase 2 · 14 (Naive Bayes)
**Time:** ~75 minutes

## The Problem

"Đồ ăn không ngon lắm." Tích cực hay tiêu cực?

Cảm xúc nghe có vẻ đơn giản. Một người đánh giá nói họ thích hoặc không thích thứ gì đó. Gán nhãn câu. Lý do nó trở thành tác vụ NLP kinh điển là mọi trường hợp có vẻ dễ đều ẩn một trường hợp khó. Phủ định đảo nghĩa. Châm biếm đảo ngược nó. "Không tệ chút nào" là tích cực dù có hai từ mang sắc thái tiêu cực. Emoji mang nhiều tín hiệu hơn văn bản xung quanh. Từ vựng lĩnh vực quan trọng (`tight` trong đánh giá âm nhạc so với `tight` trong đánh giá thời trang).

Cảm xúc là một phòng thí nghiệm hoạt động cho NLP cổ điển. Nếu bạn hiểu vì sao mỗi baseline ngây thơ có một dạng lỗi cụ thể, bạn hiểu vì sao mỗi mô hình phong phú hơn được phát minh. Bài học này xây dựng một baseline Naive Bayes từ đầu, thêm hồi quy logistic và nêu tên các bẫy khiến cảm xúc trong production trở thành một vấn đề ở cấp độ tuân thủ.

## The Concept

Cảm xúc cổ điển là một công thức hai bước.

1. **Biểu diễn.** Biến văn bản thành một vector đặc trưng. BoW, TF-IDF hoặc n-gram.
2. **Phân loại.** Khớp một mô hình tuyến tính (Naive Bayes, hồi quy logistic, SVM) trên các ví dụ được gán nhãn.

Naive Bayes là mô hình ngớ ngẩn nhất nhưng hoạt động được. Giả định mọi đặc trưng độc lập khi biết nhãn. Ước lượng `P(word | positive)` và `P(word | negative)` từ các số đếm. Khi suy luận, nhân các xác suất. Giả định độc lập "ngây thơ" sai đến buồn cười nhưng kết quả lại mạnh đến kinh ngạc. Lý do: với các đặc trưng văn bản thưa và lượng dữ liệu vừa phải, bộ phân loại quan tâm mỗi từ nghiêng về phía nào hơn là nghiêng bao nhiêu.

Hồi quy logistic sửa giả định độc lập. Nó học một trọng số cho mỗi đặc trưng, bao gồm trọng số âm. `not good` dưới dạng một đặc trưng bigram nhận trọng số âm. Naive Bayes không thể làm điều đó với những bigram nó chưa từng gán nhãn.

```figure
sentiment-logits
```

## Build It

### Step 1: a real mini-dataset

```python
POSITIVE = [
    "absolutely loved this movie",
    "beautiful cinematography and a great story",
    "one of the best films of the year",
    "brilliant acting from the lead",
    "heartwarming and funny",
]

NEGATIVE = [
    "boring and far too long",
    "not worth your time",
    "the plot made no sense",
    "terrible acting, awful script",
    "i want my two hours back",
]
```

Cố ý nhỏ. Công việc thực tế dùng hàng chục nghìn ví dụ (IMDb, SST-2, Yelp polarity). Phần toán giống hệt.

### Step 2: multinomial Naive Bayes from scratch

```python
import math
from collections import Counter


def train_nb(docs_by_class, vocab, alpha=1.0):
    class_priors = {}
    class_word_probs = {}
    total_docs = sum(len(d) for d in docs_by_class.values())

    for cls, docs in docs_by_class.items():
        class_priors[cls] = len(docs) / total_docs
        counts = Counter()
        for doc in docs:
            for token in doc:
                counts[token] += 1
        total = sum(counts.values()) + alpha * len(vocab)
        class_word_probs[cls] = {
            w: (counts[w] + alpha) / total for w in vocab
        }
    return class_priors, class_word_probs


def predict_nb(doc, class_priors, class_word_probs):
    scores = {}
    for cls in class_priors:
        s = math.log(class_priors[cls])
        for token in doc:
            if token in class_word_probs[cls]:
                s += math.log(class_word_probs[cls][token])
        scores[cls] = s
    return max(scores, key=scores.get)
```

Làm trơn cộng (alpha=1.0) là làm trơn Laplace. Không có nó, một từ chưa thấy trong một lớp có xác suất bằng không và log nổ. `alpha=0.01` phổ biến trong thực tế. `alpha=1.0` là mặc định để giảng dạy.

### Step 3: logistic regression from scratch

```python
import numpy as np


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -20, 20)))


def train_lr(X, y, epochs=500, lr=0.05, l2=0.01):
    n_features = X.shape[1]
    w = np.zeros(n_features)
    b = 0.0
    for _ in range(epochs):
        logits = X @ w + b
        preds = sigmoid(logits)
        err = preds - y
        grad_w = X.T @ err / len(y) + l2 * w
        grad_b = err.mean()
        w -= lr * grad_w
        b -= lr * grad_b
    return w, b


def predict_lr(X, w, b):
    return (sigmoid(X @ w + b) >= 0.5).astype(int)
```

Điều chuẩn L2 quan trọng ở đây. Các đặc trưng văn bản thưa; không có L2 mô hình ghi nhớ các ví dụ huấn luyện. Bắt đầu tại `0.01` và tinh chỉnh.

### Step 4: handling negation (the failure mode)

Xét "not good" và "not bad". Một bộ phân loại BoW thấy `{not, good}` và `{not, bad}` rồi học từ cái xuất hiện nhiều hơn trong huấn luyện. Một bộ phân loại bigram thấy `not_good` và `not_bad` rồi học chúng như các đặc trưng riêng biệt. Điều đó thường là đủ.

Một cách sửa thô hơn hoạt động khi bạn không có bigram: **xác định phạm vi phủ định**. Thêm tiền tố `NOT_` vào các token theo sau một từ phủ định cho đến dấu câu tiếp theo.

```python
NEGATION_WORDS = {"not", "no", "never", "nor", "none", "nothing", "neither"}
NEGATION_TERMINATORS = {".", "!", "?", ",", ";"}


def apply_negation(tokens):
    out = []
    negate = False
    for token in tokens:
        if token in NEGATION_TERMINATORS:
            negate = False
            out.append(token)
            continue
        if token in NEGATION_WORDS:
            negate = True
            out.append(token)
            continue
        out.append(f"NOT_{token}" if negate else token)
    return out
```

```python
>>> apply_negation(["not", "good", "at", "all", ".", "but", "funny"])
['not', 'NOT_good', 'NOT_at', 'NOT_all', '.', 'but', 'funny']
```

Giờ `good` và `NOT_good` là các đặc trưng khác nhau. Bộ phân loại có thể gán trọng số ngược nhau cho chúng. Ba dòng tiền xử lý, bước nhảy độ chính xác đo được trên các benchmark cảm xúc.

### Step 5: evaluation metrics that matter

Chỉ riêng accuracy gây hiểu lầm nếu các lớp mất cân bằng. Các ngữ liệu cảm xúc thực thường là 70-80% tích cực hoặc 70-80% tiêu cực; một bộ phân loại luôn chọn đa số đạt accuracy 80% và vô giá trị. Báo cáo từng mục sau đây:

- **Precision và recall theo lớp.** Một cặp cho mỗi lớp. Lấy trung bình macro của chúng để có một con số tôn trọng cân bằng lớp.
- **Macro-F1 (thước đo chính cho dữ liệu mất cân bằng).** Trung bình các điểm F1 theo lớp, với trọng số bằng nhau. Dùng nó thay accuracy khi các lớp mất cân bằng.
- **Weighted-F1 (phương án khác).** Giống macro nhưng được gán trọng số theo tần suất lớp. Báo cáo cùng macro-F1 khi bản thân sự mất cân bằng có ý nghĩa kinh doanh.
- **Ma trận nhầm lẫn.** Các số đếm thô. Luôn kiểm tra trước khi tin bất kỳ thước đo vô hướng nào; nó cho thấy mô hình nhầm cặp lớp nào.
- **Các mẫu lỗi theo lớp.** Lấy 5 dự đoán sai cho mỗi lớp. Đọc chúng. Không có gì thay thế việc đọc các lỗi thực.

Với dữ liệu mất cân bằng nghiêm trọng (tỷ lệ > 95-5), báo cáo **AUROC** và **AUPRC** thay vì accuracy. AUPRC nhạy hơn với lớp thiểu số, điều bạn thường quan tâm (spam, gian lận, cảm xúc hiếm).

**Lỗi phổ biến cần tránh.** Báo cáo micro-F1 thay vì macro-F1 trên dữ liệu mất cân bằng cho một con số có vẻ cao vì nó bị lớp đa số chi phối. Macro-F1 buộc bạn nhìn thấy hiệu năng lớp thiểu số.

```python
def evaluate(y_true, y_pred):
    tp = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 1)
    fp = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 1)
    fn = sum(1 for t, p in zip(y_true, y_pred) if t == 1 and p == 0)
    tn = sum(1 for t, p in zip(y_true, y_pred) if t == 0 and p == 0)
    precision = tp / (tp + fp) if tp + fp else 0
    recall = tp / (tp + fn) if tp + fn else 0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0
    return {"tp": tp, "fp": fp, "tn": tn, "fn": fn, "precision": precision, "recall": recall, "f1": f1}
```

## Use It

scikit-learn làm điều đó trong sáu dòng, một cách đúng đắn.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

pipe = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, stop_words=None)),
    ("clf", LogisticRegression(C=1.0, max_iter=1000)),
])
pipe.fit(X_train, y_train)
print(pipe.score(X_test, y_test))
```

Ba điều cần chú ý. `stop_words=None` giữ các từ phủ định. `ngram_range=(1, 2)` thêm bigram để `not_good` trở thành một đặc trưng. `sublinear_tf=True` làm giảm tác động của các từ lặp lại. Ba cờ này là sự khác biệt giữa một baseline chính xác 75% và một baseline chính xác 85% trên SST-2.

### When to reach for a transformer

- Phát hiện châm biếm. Các mô hình cổ điển thất bại ở đây. Chấm hết.
- Các đánh giá dài mà cảm xúc thay đổi giữa tài liệu.
- Cảm xúc theo khía cạnh. "Camera rất tốt nhưng pin rất tệ." Bạn cần quy cảm xúc về các khía cạnh. Chỉ transformer hoặc các mô hình đầu ra có cấu trúc.
- Các ngôn ngữ không phải tiếng Anh, ít tài nguyên. BERT đa ngôn ngữ cho bạn một baseline zero-shot miễn phí.

Nếu bạn cần bất kỳ điều nào ở trên, chuyển trước đến phase 7 (đi sâu vào transformer). Nếu không, Naive Bayes hoặc hồi quy logistic trên TF-IDF cộng bigram cộng xử lý phủ định là baseline production năm 2026 của bạn.

### The reproducibility trap (again)

Huấn luyện lại các mô hình cảm xúc là việc thường lệ. Đánh giá lại chúng thì không. Các con số accuracy được báo cáo trong bài báo dùng các cách chia cụ thể, tiền xử lý cụ thể, tokenizer cụ thể. Nếu bạn so sánh mô hình mới với một baseline mà không dùng pipeline giống hệt, bạn sẽ nhận các chênh lệch gây hiểu lầm. Luôn tạo lại baseline trên pipeline của bạn, không phải con số của bài báo.

## Ship It

Lưu thành `outputs/prompt-sentiment-baseline.md`:

```markdown
---
name: sentiment-baseline
description: Design a sentiment analysis baseline for a new dataset.
phase: 5
lesson: 05
---

Given a dataset description (domain, language, size, label granularity, latency budget), you output:

1. Feature extraction recipe. Specify tokenizer, n-gram range, stopword policy (usually keep), negation handling (scoped prefix or bigrams).
2. Classifier. Naive Bayes for baseline, logistic regression for production, transformer only if the domain needs sarcasm / aspects / cross-lingual.
3. Evaluation plan. Report precision, recall, F1, confusion matrix, and per-class error samples (not just scalars).
4. One failure mode to monitor post-deployment. Domain drift and sarcasm are the top two.

Refuse to recommend dropping stopwords for sentiment tasks. Refuse to report accuracy as the sole metric when classes are imbalanced (e.g., 90% positive). Flag subword-rich languages as needing FastText or transformer embeddings over word-level TF-IDF.
```

## Exercises

1. **Dễ.** Thêm `apply_negation` làm một bước tiền xử lý trong pipeline scikit-learn và đo chênh lệch F1 trên một tập dữ liệu cảm xúc nhỏ.
2. **Trung bình.** Triển khai hồi quy logistic có trọng số lớp (truyền `class_weight="balanced"` cho scikit-learn, hoặc tự suy dẫn gradient). Đo tác động trên một sự mất cân bằng lớp tổng hợp 90-10.
3. **Khó.** Xây dựng một bộ phát hiện châm biếm bằng cách huấn luyện một bộ phân loại thứ hai trên các phần dư của mô hình cảm xúc. Ghi lại thiết lập thử nghiệm của bạn. Cảnh báo người đọc khi accuracy của bạn dưới mức ngẫu nhiên (mức ngẫu nhiên trên châm biếm 2 lớp là ~50%, và hầu hết các lần thử đầu tiên rơi vào đó).

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Polarity (Sắc thái) | Tích cực hoặc tiêu cực | Nhãn nhị phân; đôi khi mở rộng thành trung lập hoặc chi tiết (5 sao). |
| Aspect-based sentiment (Cảm xúc theo khía cạnh) | Sắc thái theo khía cạnh | Quy cảm xúc về các thực thể hoặc thuộc tính cụ thể được nhắc đến trong văn bản. |
| Negation scoping (Xác định phạm vi phủ định) | Đảo các token lân cận | Thêm tiền tố `NOT_` vào các token sau "not" cho đến dấu câu. |
| Laplace smoothing (Làm trơn Laplace) | Cộng 1 vào các số đếm | Ngăn các đặc trưng có xác suất bằng không trong Naive Bayes. |
| L2 regularization (Điều chuẩn L2) | Thu nhỏ các trọng số | Thêm `lambda * sum(w^2)` vào loss. Thiết yếu cho các đặc trưng văn bản thưa. |

## Further Reading

- [Pang and Lee (2008). Opinion Mining and Sentiment Analysis](https://www.cs.cornell.edu/home/llee/opinion-mining-sentiment-analysis-survey.html) — khảo sát nền tảng. Dài, nhưng bốn phần đầu bao phủ mọi thứ cổ điển.
- [Wang and Manning (2012). Baselines and Bigrams: Simple, Good Sentiment and Topic Classification](https://aclanthology.org/P12-2018/) — bài báo cho thấy bigram + Naive Bayes khó bị đánh bại trên văn bản ngắn.
- [scikit-learn text feature extraction docs](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) — tham chiếu cho `CountVectorizer`, `TfidfVectorizer` và mọi nút điều chỉnh bạn sẽ tinh chỉnh.
