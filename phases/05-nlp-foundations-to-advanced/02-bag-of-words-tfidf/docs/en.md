# Bag of Words, TF-IDF, and Text Representation

> Đếm trước, nghĩ sau. TF-IDF vẫn thắng embedding trên các tác vụ được xác định rõ vào năm 2026.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 01 (Text Processing), Phase 2 · 02 (Linear Regression from Scratch)
**Time:** ~75 minutes

## The Problem

Mô hình cần các con số. Bạn có các chuỗi.

Mọi pipeline NLP đều phải trả lời cùng một câu hỏi. Làm thế nào chúng ta biến một luồng token có độ dài thay đổi thành một vector kích thước cố định mà một bộ phân loại có thể tiêu thụ. Câu trả lời đầu tiên mà lĩnh vực này chọn là câu ngớ ngẩn nhất nhưng hoạt động được. Đếm các từ. Tạo một vector.

Vector đó đã gánh nhiều NLP production hơn bất kỳ mô hình embedding nào. Bộ lọc spam, bộ phân loại chủ đề, phát hiện bất thường nhật ký, xếp hạng tìm kiếm (trước BM25), làn sóng phân tích cảm xúc đầu tiên, thập kỷ đầu của các benchmark NLP học thuật. Những người thực hành năm 2026 vẫn chọn nó đầu tiên cho các tác vụ phân loại hẹp. Nó nhanh, có thể diễn giải và thường không thể phân biệt với một mô hình embedding 400M tham số trên các tác vụ mà sự hiện diện của từ là điều quan trọng.

Bài học này xây dựng bag of words, rồi TF-IDF, từ đầu. Sau đó cho thấy scikit-learn làm điều tương tự trong ba dòng. Rồi nêu tên dạng lỗi khiến bạn tìm đến embedding.

## The Concept

**Bag of Words (BoW)** loại bỏ thứ tự. Với mỗi tài liệu, đếm số lần mỗi từ trong từ vựng xuất hiện. Độ dài vector là kích thước từ vựng. Vị trí `i` là số đếm của từ `i`.

**TF-IDF** gán lại trọng số cho BoW. Một từ xuất hiện trong mọi tài liệu không mang thông tin, nên giảm trọng số của nó. Một từ hiếm trong toàn ngữ liệu nhưng thường gặp trong một tài liệu là tín hiệu, nên tăng trọng số của nó.

```math
\begin{aligned}
\text{TF-IDF}(w, d) &= \text{TF}(w, d) \cdot \text{IDF}(w) \\
&= \frac{\mathop{\mathrm{count}}(w \text{ in } d)}{|d|} \cdot \log\frac{N}{\mathop{\mathrm{df}}(w)}
\end{aligned}
```

Trong đó `TF` là tần suất thuật ngữ trong tài liệu, `df` là tần suất tài liệu (bao nhiêu tài liệu chứa từ đó), `N` là tổng số tài liệu. `log` giữ trọng số trong giới hạn cho các từ có mặt khắp nơi.

Thuộc tính then chốt: cả hai tạo ra các vector thưa với các trục có thể diễn giải. Bạn có thể nhìn các trọng số của một bộ phân loại được huấn luyện và đọc ra những từ nào đẩy một tài liệu về mỗi lớp. Bạn không thể làm điều này với một embedding BERT 768 chiều.

```figure
bow-tfidf
```

## Build It

### Step 1: build the vocabulary

```python
def build_vocab(docs):
    vocab = {}
    for doc in docs:
        for token in doc:
            if token not in vocab:
                vocab[token] = len(vocab)
    return vocab
```

Đầu vào: danh sách các tài liệu đã tokenize (bất kỳ tokenizer cấp từ nào cũng được; `code/main.py` trong bài học này dùng một biến thể chữ thường được đơn giản hóa). Đầu ra: dict `{word: index}`. Thứ tự chèn ổn định nghĩa là chỉ số từ 0 là từ đầu tiên gặp trong tài liệu đầu tiên. Quy ước có thể khác nhau; scikit-learn sắp xếp theo bảng chữ cái.

### Step 2: bag of words

```python
def bag_of_words(docs, vocab):
    matrix = [[0] * len(vocab) for _ in docs]
    for i, doc in enumerate(docs):
        for token in doc:
            if token in vocab:
                matrix[i][vocab[token]] += 1
    return matrix
```

```python
>>> docs = [["cat", "sat", "on", "mat"], ["cat", "cat", "ran"]]
>>> vocab = build_vocab(docs)
>>> bag_of_words(docs, vocab)
[[1, 1, 1, 1, 0], [2, 0, 0, 0, 1]]
```

Hàng là các tài liệu. Cột là các chỉ số từ vựng. Phần tử `[i][j]` là "số lần từ `j` xuất hiện trong tài liệu `i`." Tài liệu 1 có `cat` hai lần vì nó đã xuất hiện như vậy. Tài liệu 0 có `ran` không lần nào vì nó không xuất hiện.

### Step 3: term frequency and document frequency

```python
import math


def term_frequency(doc_bow, doc_length):
    return [c / doc_length if doc_length else 0 for c in doc_bow]


def document_frequency(bow_matrix):
    df = [0] * len(bow_matrix[0])
    for row in bow_matrix:
        for j, count in enumerate(row):
            if count > 0:
                df[j] += 1
    return df


def inverse_document_frequency(df, n_docs):
    return [math.log((n_docs + 1) / (d + 1)) + 1 for d in df]
```

Hai thủ thuật làm trơn cần nêu tên. `(n+1)/(d+1)` tránh `log(x/0)`. `+1` ở cuối bảo đảm một từ trong mọi tài liệu vẫn có IDF 1 (không phải 0), khớp mặc định của scikit-learn. Các triển khai khác dùng `log(N/df)` thô. Cả hai đều hoạt động; phiên bản được làm trơn thân thiện hơn.

### Step 4: TF-IDF

```python
def tfidf(bow_matrix):
    n_docs = len(bow_matrix)
    df = document_frequency(bow_matrix)
    idf = inverse_document_frequency(df, n_docs)
    out = []
    for row in bow_matrix:
        length = sum(row)
        tf = term_frequency(row, length)
        out.append([tf_j * idf_j for tf_j, idf_j in zip(tf, idf)])
    return out
```

```python
>>> docs = [
...     ["the", "cat", "sat"],
...     ["the", "dog", "sat"],
...     ["the", "cat", "ran"],
... ]
>>> vocab = build_vocab(docs)
>>> bow = bag_of_words(docs, vocab)
>>> tfidf(bow)
```

Ba tài liệu, năm từ vựng (`the`, `cat`, `sat`, `dog`, `ran`). `the` xuất hiện trong cả ba, vì vậy IDF của nó thấp. `dog` xuất hiện trong một tài liệu, vì vậy IDF của nó cao. Với một từ vựng thực có hàng nghìn từ, các vector này thưa (phần lớn phần tử bằng không). Ngay cả trong ví dụ đồ chơi này, các từ có khả năng phân biệt vẫn nổi bật.

### Step 5: L2-normalize rows

```python
def l2_normalize(matrix):
    out = []
    for row in matrix:
        norm = math.sqrt(sum(x * x for x in row))
        out.append([x / norm if norm else 0 for x in row])
    return out
```

Không có chuẩn hóa, một tài liệu dài hơn có một vector lớn hơn và chi phối các điểm tương đồng. Chuẩn hóa L2 đặt mọi tài liệu lên siêu cầu đơn vị. Cosine similarity giữa các hàng giờ chỉ là một tích vô hướng.

## Use It

scikit-learn cung cấp phiên bản production.

```python
from sklearn.feature_extraction.text import CountVectorizer, TfidfVectorizer

docs = ["the cat sat on the mat", "the dog sat on the mat", "the cat ran"]

bow_vectorizer = CountVectorizer()
bow = bow_vectorizer.fit_transform(docs)
print(bow_vectorizer.get_feature_names_out())
print(bow.toarray())

tfidf_vectorizer = TfidfVectorizer()
tfidf = tfidf_vectorizer.fit_transform(docs)
print(tfidf.toarray().round(3))
```

`CountVectorizer` thực hiện tokenization, từ vựng và BoW trong một lời gọi. `TfidfVectorizer` thêm gán trọng số IDF và chuẩn hóa L2. Cả hai trả về ma trận thưa. Với 100k tài liệu, phiên bản đặc không vừa bộ nhớ; giữ dạng thưa cho đến khi bộ phân loại đòi hỏi dạng đặc.

Các nút điều chỉnh thay đổi mọi thứ:

| Tham số | Tác dụng |
|-----|--------|
| `ngram_range=(1, 2)` | Bao gồm bigram. Thường cải thiện phân loại. |
| `min_df=2` | Loại các từ trong ít hơn 2 tài liệu. Cắt gọn từ vựng trên dữ liệu nhiễu. |
| `max_df=0.95` | Loại các từ trong hơn 95% tài liệu. Xấp xỉ việc loại bỏ stopword mà không cần danh sách viết cứng. |
| `stop_words="english"` | Danh sách stopword tích hợp của scikit-learn. Phụ thuộc tác vụ — phân tích cảm xúc *không* nên loại các từ phủ định. |
| `sublinear_tf=True` | Dùng `1 + log(tf)` thay cho `tf` thô. Hữu ích khi một thuật ngữ lặp lại nhiều lần trong một tài liệu. |

### When TF-IDF still wins (as of 2026)

- Phát hiện spam, gán nhãn chủ đề, đánh dấu bất thường nhật ký. Sự hiện diện của từ là điều quan trọng; sắc thái ngữ nghĩa thì không.
- Các chế độ ít dữ liệu (hàng trăm ví dụ được gán nhãn). TF-IDF cộng hồi quy logistic không có chi phí tiền huấn luyện.
- Bất kỳ nơi nào độ trễ quan trọng. TF-IDF cộng một mô hình tuyến tính trả lời trong vài micro giây. Embedding một tài liệu qua một transformer mất 10-100ms.
- Các hệ thống phải giải thích dự đoán của chúng. Kiểm tra các hệ số của bộ phân loại. Các từ dương hàng đầu là lý do.

### When TF-IDF fails

Lỗi mù ngữ nghĩa. Xét hai tài liệu này:

- "Bộ phim chẳng hay chút nào."
- "Bộ phim rất xuất sắc."

Một là đánh giá tiêu cực. Một là tích cực. Phần giao TF-IDF của chúng chính xác là `{the, movie, was}`. Một bộ phân loại bag-of-words phải ghi nhớ rằng từ `not` gần `good` đảo nhãn. Nó có thể học điều này với đủ dữ liệu, nhưng không bao giờ tự nhiên bằng một mô hình hiểu cú pháp.

Lỗi còn lại: các từ ngoài từ vựng khi suy luận. Một mô hình BoW được huấn luyện trên các đánh giá IMDb không biết phải làm gì với `Zoomer-approved` nếu token đó chưa từng xuất hiện trong huấn luyện. Embedding từ con (bài 04) xử lý điều này. TF-IDF không thể.

### Hybrid: TF-IDF weighted embeddings

Lựa chọn mặc định thực dụng năm 2026 cho phân loại với lượng dữ liệu trung bình: dùng các trọng số TF-IDF làm attention trên các embedding từ.

```python
def tfidf_weighted_embedding(doc, tfidf_scores, embedding_table, dim):
    vec = [0.0] * dim
    total_weight = 0.0
    for token in doc:
        if token not in embedding_table or token not in tfidf_scores:
            continue
        weight = tfidf_scores[token]
        emb = embedding_table[token]
        for i in range(dim):
            vec[i] += weight * emb[i]
        total_weight += weight
    if total_weight == 0:
        return vec
    return [v / total_weight for v in vec]
```

Bạn có được năng lực ngữ nghĩa từ embedding và sự nhấn mạnh từ hiếm từ TF-IDF. Bộ phân loại huấn luyện trên vector được pooling. Cách này vượt từng phương pháp riêng lẻ trong phân loại cảm xúc, chủ đề và ý định dưới khoảng 50k ví dụ được gán nhãn.

## Ship It

Lưu thành `outputs/prompt-vectorization-picker.md`:

```markdown
---
name: vectorization-picker
description: Given a text-classification task, recommend BoW, TF-IDF, embeddings, or a hybrid.
phase: 5
lesson: 02
---

You recommend a text-vectorization strategy. Given a task description, output:

1. Representation (BoW, TF-IDF, transformer embeddings, or a hybrid). Explain why in one sentence.
2. Specific vectorizer configuration. Name the library. Quote the arguments (`ngram_range`, `min_df`, `max_df`, `sublinear_tf`, `stop_words`).
3. One failure mode to test before shipping.

Refuse to recommend embeddings when the user has under 500 labeled examples unless they show evidence of semantic failure in a TF-IDF baseline. Refuse to remove stopwords for sentiment analysis (negations carry signal). Flag class imbalance as needing more than a vectorizer change.

Example input: "Classifying 30k customer support tickets into 12 categories. Most tickets are 2-3 sentences. English only. Need explainability for audit logs."

Example output:

- Representation: TF-IDF. 30k examples is not small; explainability requirement rules out dense embeddings.
- Config: `TfidfVectorizer(ngram_range=(1, 2), min_df=3, max_df=0.95, sublinear_tf=True, stop_words=None)`. Keep stopwords because category keywords sometimes are stopwords ("not working" vs "working").
- Failure to test: verify `min_df=3` does not drop rare category keywords. Run `get_feature_names_out` filtered by class and eyeball.
```

## Exercises

1. **Dễ.** Triển khai `cosine_similarity(doc_vec_a, doc_vec_b)` trên đầu ra TF-IDF được chuẩn hóa L2. Xác minh rằng các tài liệu giống hệt có điểm 1.0 và các tài liệu có từ vựng không giao nhau có điểm 0.0.
2. **Trung bình.** Thêm hỗ trợ `n-gram` vào `bag_of_words`. Tham số `n` tạo số đếm trên các `n`-gram. Kiểm thử rằng `n=2` trên `["the", "cat", "sat"]` tạo ra các số đếm bigram cho `["the cat", "cat sat"]`.
3. **Khó.** Xây dựng dạng lai embedding được gán trọng số TF-IDF ở trên bằng các vector GloVe 100d (tải một lần, lưu bộ nhớ đệm). So sánh độ chính xác phân loại với TF-IDF thuần và embedding pooling trung bình thuần trên tập dữ liệu 20 Newsgroups. Báo cáo phương pháp nào thắng ở đâu.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| BoW | Vector tần suất từ | Số đếm của các từ trong từ vựng ở một tài liệu. Loại bỏ thứ tự. |
| TF | Tần suất thuật ngữ | Số đếm của một từ trong một tài liệu, có thể được chuẩn hóa theo độ dài tài liệu. |
| DF | Tần suất tài liệu | Số đếm các tài liệu chứa từ đó ít nhất một lần. |
| IDF | Tần suất tài liệu nghịch đảo | `log(N / df)` được làm trơn. Giảm trọng số các từ xuất hiện khắp nơi. |
| Sparse vector (Vector thưa) | Chủ yếu là các số không | Từ vựng thường có 10k-100k từ; hầu hết vắng mặt trong bất kỳ tài liệu nhất định nào. |
| Cosine similarity (Độ tương đồng cosine) | Góc vector | Tích vô hướng của các vector được chuẩn hóa L2. 1 là giống hệt, 0 là trực giao. |

## Further Reading

- [scikit-learn — feature extraction from text](https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction) — tham chiếu API chuẩn, cộng ghi chú về mọi nút điều chỉnh.
- [Salton, G., & Buckley, C. (1988). Term-weighting approaches in automatic text retrieval](https://www.sciencedirect.com/science/article/pii/0306457388900210) — bài báo khiến TF-IDF trở thành mặc định trong một thập kỷ.
- ["Why TF-IDF Still Beats Embeddings" — Ashfaque Thonikkadavan (Medium)](https://medium.com/@cmtwskb/why-tf-idf-still-beats-embeddings-ad85c123e1b2) — góc nhìn năm 2026 về khi nào phương pháp cũ thắng và vì sao.
