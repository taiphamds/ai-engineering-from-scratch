# Naive Bayes

> Giả định "ngây thơ" sai, và nó vẫn hoạt động. Đó là vẻ đẹp của nó.

**Type:** Build
**Language:** Python
**Prerequisites:** Phase 2, Lessons 01-07 (classification, Bayes' theorem)
**Time:** ~75 minutes

## Learning Objectives

- Triển khai Multinomial Naive Bayes từ đầu với làm trơn Laplace cho phân loại văn bản
- Giải thích tại sao giả định độc lập ngây thơ sai về toán học nhưng tạo ra các thứ hạng lớp đúng trong thực tế
- So sánh các biến thể Multinomial, Bernoulli và Gaussian Naive Bayes và chọn biến thể phù hợp cho một loại đặc trưng nhất định
- Đánh giá Naive Bayes so với hồi quy logistic trên dữ liệu thưa nhiều chiều và giải thích sự đánh đổi độ chệch-phương sai đang hoạt động

## The Problem

Bạn cần phân loại văn bản. Email thành thư rác hoặc không phải thư rác. Đánh giá khách hàng thành tích cực hoặc tiêu cực. Phiếu hỗ trợ thành các loại. Bạn có hàng nghìn đặc trưng (một cho mỗi từ) và dữ liệu huấn luyện hạn chế.

Hầu hết các bộ phân loại nghẹn ở đây. Hồi quy logistic cần đủ mẫu để ước lượng hàng nghìn trọng số một cách đáng tin cậy. Cây quyết định chia theo từng từ một và khớp quá mức dữ dội. KNN trong 10,000 chiều vô nghĩa vì mỗi điểm cách mọi điểm khác xa như nhau.

Naive Bayes xử lý điều này. Nó đưa ra một giả định sai về toán học (rằng mọi đặc trưng độc lập với mọi đặc trưng khác khi biết lớp), và vẫn vượt các mô hình "thông minh hơn" trên phân loại văn bản, đặc biệt với các tập huấn luyện nhỏ. Nó huấn luyện trong một lượt qua dữ liệu. Nó mở rộng đến hàng triệu đặc trưng. Nó tạo các ước lượng xác suất (dù thường được hiệu chỉnh kém do giả định độc lập).

Hiểu tại sao một giả định sai dẫn đến các dự đoán tốt dạy bạn một điều cơ bản về học máy: mô hình tốt nhất không phải mô hình đúng nhất, mà là mô hình có sự đánh đổi độ chệch-phương sai tốt nhất cho dữ liệu của bạn.

## The Concept

### Bayes' Theorem (Quick Review)

Định lý Bayes đảo các xác suất có điều kiện:

```
P(class | features) = P(features | class) * P(class) / P(features)
```

Chúng ta muốn `P(class | features)` -- xác suất một tài liệu thuộc một lớp khi biết các từ trong nó. Chúng ta có thể tính từ:
- `P(features | class)` -- hợp lý của việc thấy các từ này trong các tài liệu thuộc lớp này
- `P(class)` -- xác suất tiên nghiệm của lớp (thư rác phổ biến đến mức nào nói chung?)
- `P(features)` -- bằng chứng, giống nhau cho tất cả các lớp, nên có thể bỏ qua khi so sánh

Lớp có `P(class | features)` cao nhất thắng.

### The Naive Independence Assumption

Tính chính xác `P(features | class)` đòi hỏi ước lượng xác suất đồng thời của tất cả đặc trưng cùng nhau. Với từ vựng 10,000 từ, bạn cần ước lượng một phân phối trên 2^10,000 tổ hợp có thể. Bất khả thi.

Giả định ngây thơ: mọi đặc trưng độc lập có điều kiện khi biết lớp.

```
P(w1, w2, ..., wn | class) = P(w1 | class) * P(w2 | class) * ... * P(wn | class)
```

Thay vì một phân phối đồng thời bất khả thi, bạn ước lượng n phân phối đơn giản theo từng đặc trưng. Mỗi phân phối chỉ cần một số đếm.

Giả định này rõ ràng sai. Các từ "machine" và "learning" không độc lập trong bất kỳ tài liệu nào. Nhưng bộ phân loại không cần các ước lượng xác suất đúng. Nó cần các thứ hạng đúng -- lớp nào có xác suất cao nhất. Giả định độc lập đưa vào các sai số hệ thống, nhưng các sai số đó ảnh hưởng mọi lớp tương tự nhau, nên thứ hạng giữ đúng.

### Why It Still Works

Ba lý do:

1. **Xếp hạng hơn hiệu chỉnh.** Phân loại chỉ cần lớp được xếp hạng đầu đúng. Ngay cả nếu P(spam) = 0.99999 khi xác suất thực là 0.7, bộ phân loại vẫn chọn thư rác đúng. Chúng ta không cần các xác suất đúng. Chúng ta cần bên thắng đúng.

2. **Độ chệch cao, phương sai thấp.** Giả định độc lập là một tiên nghiệm mạnh. Nó ràng buộc mô hình nặng, ngăn khớp quá mức. Với dữ liệu huấn luyện hạn chế, một mô hình hơi sai nhưng ổn định thắng một mô hình đúng về lý thuyết nhưng rất không ổn định. Đây là sự đánh đổi độ chệch-phương sai trong thực tế.

3. **Sự dư thừa đặc trưng triệt tiêu.** Các đặc trưng tương quan cung cấp bằng chứng dư thừa. Bộ phân loại đếm đôi bằng chứng này, nhưng cũng đếm đôi cho lớp đúng. Nếu "machine" và "learning" luôn xuất hiện cùng nhau, cả hai cung cấp bằng chứng cho lớp "tech". NB đếm chúng hai lần, nhưng đếm hai lần cho lớp đúng.

Một lý do thứ tư, thực tế: Naive Bayes cực kỳ nhanh. Huấn luyện là một lượt qua dữ liệu để đếm tần suất. Dự đoán là một phép nhân ma trận. Bạn có thể huấn luyện trên một triệu tài liệu trong vài giây. Tốc độ này nghĩa là bạn có thể lặp nhanh hơn, thử nhiều tập đặc trưng hơn và chạy nhiều thí nghiệm hơn các mô hình chậm.

### The Math Step by Step

Hãy theo dõi một ví dụ cụ thể. Giả sử chúng ta có hai lớp: thư rác và không phải thư rác. Từ vựng có ba từ: "free", "money", "meeting".

Dữ liệu huấn luyện:
- Email thư rác nhắc "free" 80 lần, "money" 60 lần, "meeting" 10 lần (tổng 150 từ)
- Email không phải thư rác nhắc "free" 5 lần, "money" 10 lần, "meeting" 100 lần (tổng 115 từ)
- 40% email là thư rác, 60% không phải thư rác

Với làm trơn Laplace (alpha=1):

```
P(free | spam)    = (80 + 1) / (150 + 3) = 81/153 = 0.529
P(money | spam)   = (60 + 1) / (150 + 3) = 61/153 = 0.399
P(meeting | spam) = (10 + 1) / (150 + 3) = 11/153 = 0.072

P(free | not-spam)    = (5 + 1) / (115 + 3) = 6/118 = 0.051
P(money | not-spam)   = (10 + 1) / (115 + 3) = 11/118 = 0.093
P(meeting | not-spam) = (100 + 1) / (115 + 3) = 101/118 = 0.856
```

Email mới chứa: "free" (2 lần), "money" (1 lần), "meeting" (0 lần).

```
log P(spam | email) = log(0.4) + 2*log(0.529) + 1*log(0.399) + 0*log(0.072)
                    = -0.916 + 2*(-0.637) + (-0.919) + 0
                    = -3.109

log P(not-spam | email) = log(0.6) + 2*log(0.051) + 1*log(0.093) + 0*log(0.856)
                        = -0.511 + 2*(-2.976) + (-2.375) + 0
                        = -8.838
```

Thư rác thắng với cách biệt lớn. Từ "free" xuất hiện hai lần là bằng chứng mạnh cho thư rác. Lưu ý "meeting" không xuất hiện đóng góp bằng không vào cả hai tổng log (0 * log(P)) -- trong Multinomial NB, các từ vắng mặt không có tác động. Chính Bernoulli NB mô hình hóa tường minh sự vắng mặt của từ.

### Three Variants

Naive Bayes có ba dạng. Mỗi dạng mô hình hóa `P(feature | class)` khác nhau.

#### Multinomial Naive Bayes

Mô hình hóa mỗi đặc trưng thành một số đếm. Tốt nhất cho dữ liệu văn bản nơi các đặc trưng là tần suất từ hoặc giá trị TF-IDF.

```
P(word_i | class) = (count of word_i in class + alpha) / (total words in class + alpha * vocab_size)
```

`alpha` là làm trơn Laplace (giải thích bên dưới). Biến thể này là công cụ chủ lực cho phân loại văn bản.

#### Gaussian Naive Bayes

Mô hình hóa mỗi đặc trưng thành một phân phối chuẩn. Tốt nhất cho các đặc trưng liên tục.

```
P(x_i | class) = (1 / sqrt(2 * pi * var)) * exp(-(x_i - mean)^2 / (2 * var))
```

Mỗi lớp có trung bình và phương sai riêng theo từng đặc trưng. Cách này hoạt động tốt khi các đặc trưng thực sự theo đường cong hình chuông trong mỗi lớp.

#### Bernoulli Naive Bayes

Mô hình hóa mỗi đặc trưng là nhị phân (hiện diện hoặc vắng mặt). Tốt nhất cho văn bản ngắn hoặc các vector đặc trưng nhị phân.

```
P(word_i | class) = (docs in class containing word_i + alpha) / (total docs in class + 2 * alpha)
```

Khác Multinomial, Bernoulli phạt tường minh sự vắng mặt của một từ. Nếu "free" thường xuất hiện trong thư rác nhưng vắng mặt trong email này, Bernoulli tính đó là bằng chứng chống thư rác.

### When to Use Each Variant

| Biến thể | Loại Đặc trưng | Tốt nhất Cho | Ví dụ |
|---------|-------------|----------|---------|
| Multinomial | Số đếm hoặc tần suất | Phân loại văn bản, bag-of-words | Thư rác email, phân loại chủ đề |
| Gaussian | Các giá trị liên tục | Dữ liệu dạng bảng với các đặc trưng gần chuẩn | Phân loại Iris, dữ liệu cảm biến |
| Bernoulli | Nhị phân (0/1) | Văn bản ngắn, vector đặc trưng nhị phân | Thư rác SMS, các đặc trưng hiện diện/vắng mặt |

### Laplace Smoothing

Điều gì xảy ra khi một từ xuất hiện trong dữ liệu kiểm tra nhưng chưa từng xuất hiện trong dữ liệu huấn luyện cho một lớp cụ thể?

Không làm trơn: `P(word | class) = 0/N = 0`. Một số không nhân xuyên toàn bộ tích làm `P(class | features) = 0`, bất kể mọi bằng chứng khác. Một từ chưa thấy duy nhất phá hủy toàn bộ dự đoán, bất kể có bao nhiêu bằng chứng khác hỗ trợ nó.

Làm trơn Laplace thêm một số đếm nhỏ `alpha` (thường là 1) vào mọi số đếm đặc trưng:

```
P(word_i | class) = (count(word_i, class) + alpha) / (total_words_in_class + alpha * vocab_size)
```

Với alpha=1, mọi từ có ít nhất một xác suất rất nhỏ. Từ "discombobulate" xuất hiện trong một email kiểm tra không còn triệt tiêu xác suất thư rác. Làm trơn có một diễn giải Bayes: nó tương đương với đặt một tiên nghiệm Dirichlet đều trên các phân phối từ.

Alpha cao hơn nghĩa là làm trơn mạnh hơn (các phân phối đều hơn). Alpha thấp hơn nghĩa là mô hình tin dữ liệu hơn. Alpha là một siêu tham số bạn điều chỉnh.

Tác động của alpha:

| Alpha | Tác động | Khi nào sử dụng |
|-------|--------|-------------|
| 0.001 | Gần như không làm trơn, tin dữ liệu | Tập huấn luyện rất lớn, không kỳ vọng đặc trưng chưa thấy |
| 0.1 | Làm trơn nhẹ | Tập huấn luyện lớn |
| 1.0 | Làm trơn Laplace tiêu chuẩn | Điểm bắt đầu mặc định |
| 10.0 | Làm trơn nặng, làm phẳng các phân phối | Tập huấn luyện rất nhỏ, kỳ vọng nhiều đặc trưng chưa thấy |

### Log-Space Computation

Nhân hàng trăm xác suất (mỗi xác suất nhỏ hơn 1) gây hụt dưới dấu phẩy động. Tích trở thành không trong dấu phẩy động dù giá trị thực là một số dương rất nhỏ.

Giải pháp: làm việc trong không gian log. Thay vì nhân các xác suất, cộng các logarit:

```
log P(class | x1, x2, ..., xn) = log P(class) + sum_i log P(xi | class)
```

Điều này biến dự đoán thành một tích vô hướng:

```
log_scores = X @ log_feature_probs.T + log_class_priors
prediction = argmax(log_scores)
```

Phép nhân ma trận. Đó là lý do dự đoán Naive Bayes rất nhanh -- nó là cùng phép toán với một mô hình tuyến tính một lớp.

### Naive Bayes vs Logistic Regression

Cả hai là các bộ phân loại tuyến tính cho văn bản. Khác biệt nằm ở những gì chúng mô hình hóa.

| Khía cạnh | Naive Bayes | Hồi quy Logistic |
|--------|------------|-------------------|
| Loại | Tạo sinh (mô hình hóa P(X\|Y)) | Phân biệt (mô hình hóa P(Y\|X)) |
| Huấn luyện | Đếm các tần suất | Tối ưu hóa hàm mất mát |
| Dữ liệu nhỏ | Tốt hơn (tiên nghiệm mạnh giúp) | Kém hơn (không đủ để ước lượng trọng số) |
| Dữ liệu lớn | Kém hơn (giả định sai gây hại) | Tốt hơn (biên linh hoạt) |
| Các đặc trưng | Giả định độc lập | Xử lý các tương quan |
| Tốc độ | Một lượt, rất nhanh | Tối ưu hóa lặp |
| Hiệu chỉnh | Các xác suất kém | Các xác suất tốt hơn |

Quy tắc kinh nghiệm: bắt đầu với Naive Bayes. Nếu có đủ dữ liệu và NB chững lại, chuyển sang hồi quy logistic.

### Classification Pipeline

```mermaid
flowchart LR
    A[Raw Text] --> B[Tokenize]
    B --> C[Build Vocabulary]
    C --> D[Count Word Frequencies]
    D --> E[Apply Smoothing]
    E --> F[Compute Log Probabilities]
    F --> G[Predict: argmax P class given words]

    style A fill:#f9f,stroke:#333
    style G fill:#9f9,stroke:#333
```

Trong thực tế, chúng ta làm việc trong không gian log để tránh hụt dưới dấu phẩy động. Thay vì nhân nhiều xác suất nhỏ, chúng ta cộng các logarit:

```
log P(class | features) = log P(class) + sum_i log P(feature_i | class)
```

```figure
naive-bayes
```

## Build It

Mã trong `code/naive_bayes.py` triển khai cả MultinomialNB và GaussianNB từ đầu.

### MultinomialNB

Triển khai từ đầu:

1. **fit(X, y)**: Với mỗi lớp, đếm tần suất mỗi đặc trưng. Thêm làm trơn Laplace. Tính xác suất log. Lưu các tiên nghiệm lớp (log của các tần suất lớp).

2. **predict_log_proba(X)**: Với mỗi mẫu, tính log P(class) + tổng log P(feature_i | class) cho mọi lớp. Đây là phép nhân ma trận: X @ log_probs.T + log_priors.

3. **predict(X)**: Trả về lớp có xác suất log cao nhất.

```python
class MultinomialNB:
    def __init__(self, alpha=1.0):
        self.alpha = alpha

    def fit(self, X, y):
        classes = np.unique(y)
        n_classes = len(classes)
        n_features = X.shape[1]

        self.classes_ = classes
        self.class_log_prior_ = np.zeros(n_classes)
        self.feature_log_prob_ = np.zeros((n_classes, n_features))

        for i, c in enumerate(classes):
            X_c = X[y == c]
            self.class_log_prior_[i] = np.log(X_c.shape[0] / X.shape[0])
            counts = X_c.sum(axis=0) + self.alpha
            self.feature_log_prob_[i] = np.log(counts / counts.sum())

        return self
```

Điểm cốt yếu: sau khi khớp, dự đoán chỉ là nhân ma trận cộng một bias. Đây là lý do Naive Bayes rất nhanh.

### GaussianNB

Với các đặc trưng liên tục, chúng ta ước lượng trung bình và phương sai theo từng lớp cho từng đặc trưng:

```python
class GaussianNB:
    def __init__(self):
        pass

    def fit(self, X, y):
        classes = np.unique(y)
        self.classes_ = classes
        self.means_ = np.zeros((len(classes), X.shape[1]))
        self.vars_ = np.zeros((len(classes), X.shape[1]))
        self.priors_ = np.zeros(len(classes))

        for i, c in enumerate(classes):
            X_c = X[y == c]
            self.means_[i] = X_c.mean(axis=0)
            self.vars_[i] = X_c.var(axis=0) + 1e-9
            self.priors_[i] = X_c.shape[0] / X.shape[0]

        return self
```

Dự đoán sử dụng PDF Gaussian theo từng đặc trưng, được nhân trên các đặc trưng (cộng trong không gian log).

### Demo: Text Classification

Mã tạo dữ liệu bag-of-words tổng hợp mô phỏng hai lớp (bài viết công nghệ so với bài viết thể thao). Mỗi lớp có một phân phối tần suất từ khác nhau. MultinomialNB phân loại bằng số đếm từ.

Dữ liệu tổng hợp hoạt động như sau: chúng ta tạo 200 "từ" (các cột đặc trưng). Các từ 0-39 có tần suất cao trong bài công nghệ và thấp trong thể thao. Các từ 80-119 có tần suất cao trong thể thao và thấp trong công nghệ. Các từ 40-79 có tần suất trung bình trong cả hai. Điều này tạo một tình huống thực tế nơi một số từ là các chỉ báo lớp mạnh và các từ khác là nhiễu.

### Demo: Continuous Features

Mã tạo dữ liệu giống Iris (3 lớp, 4 đặc trưng, các cụm Gaussian). GaussianNB phân loại bằng trung bình và phương sai theo từng lớp. Mỗi lớp có một tâm khác (vector trung bình) và độ phân tán khác (phương sai), mô phỏng dữ liệu thực tế nơi các số đo khác nhau có hệ thống giữa các loại.

Mã cũng minh họa:
- **So sánh làm trơn:** Huấn luyện MultinomialNB với các giá trị alpha khác nhau để cho thấy tác động của cường độ làm trơn lên độ chính xác.
- **Thí nghiệm kích thước huấn luyện:** Cách độ chính xác NB cải thiện khi dữ liệu huấn luyện tăng từ 20 lên 1600 mẫu. NB đạt độ chính xác khá ngay cả với rất ít mẫu -- đây là lợi thế chính.
- **Ma trận nhầm lẫn:** Precision, recall và điểm F1 theo từng lớp để cho thấy NB mắc lỗi ở đâu.

### Prediction Speed

Dự đoán Naive Bayes là phép nhân ma trận. Với n mẫu có d đặc trưng và k lớp:
- MultinomialNB: một phép nhân ma trận (n x d) @ (d x k) = O(n * d * k)
- GaussianNB: n * k lần tính PDF Gaussian, mỗi lần trên d đặc trưng = O(n * d * k)

Cả hai tuyến tính theo mọi chiều. So sánh với KNN (đòi hỏi tính khoảng cách đến tất cả điểm huấn luyện) hoặc SVM với kernel RBF (đòi hỏi tính kernel với tất cả vector hỗ trợ). NB nhanh hơn nhiều bậc độ lớn tại thời điểm dự đoán.

## Use It

Với sklearn, cả hai biến thể chỉ là các dòng lệnh đơn:

```python
from sklearn.naive_bayes import GaussianNB, MultinomialNB

gnb = GaussianNB()
gnb.fit(X_train, y_train)
print(f"GaussianNB accuracy: {gnb.score(X_test, y_test):.3f}")

mnb = MultinomialNB(alpha=1.0)
mnb.fit(X_train_counts, y_train)
print(f"MultinomialNB accuracy: {mnb.score(X_test_counts, y_test):.3f}")
```

Cho phân loại văn bản với sklearn:

```python
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

text_clf = Pipeline([
    ("vectorizer", CountVectorizer()),
    ("classifier", MultinomialNB(alpha=1.0)),
])

text_clf.fit(train_texts, train_labels)
accuracy = text_clf.score(test_texts, test_labels)
```

Mã trong `naive_bayes.py` so sánh các triển khai từ đầu với sklearn trên cùng dữ liệu để xác minh tính đúng đắn.

### TF-IDF with Naive Bayes

Số đếm từ thô cho mọi từ trọng số như nhau mỗi lần xuất hiện. Nhưng các từ phổ biến như "the" và "is" xuất hiện thường xuyên trong mọi lớp -- chúng không mang thông tin. TF-IDF (Tần suất Thuật ngữ - Tần suất Tài liệu Nghịch đảo) giảm trọng số các từ phổ biến và tăng trọng số các từ hiếm, có tính phân biệt.

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline

text_clf = Pipeline([
    ("tfidf", TfidfVectorizer()),
    ("classifier", MultinomialNB(alpha=0.1)),
])
```

Các giá trị TF-IDF không âm, nên hoạt động với MultinomialNB. Kết hợp TF-IDF + MultinomialNB là một trong những mốc cơ sở mạnh nhất cho phân loại văn bản. Nó thường vượt các mô hình phức tạp hơn trên các tập dữ liệu có ít hơn 10,000 mẫu huấn luyện.

### BernoulliNB for Short Text

Với văn bản ngắn (tweet, SMS, tin nhắn trò chuyện), BernoulliNB có thể vượt MultinomialNB. Các văn bản ngắn có số đếm từ thấp, nên thông tin tần suất mà MultinomialNB dựa vào nhiều nhiễu. BernoulliNB chỉ quan tâm hiện diện hay vắng mặt, đáng tin cậy hơn với văn bản ngắn.

```python
from sklearn.naive_bayes import BernoulliNB
from sklearn.feature_extraction.text import CountVectorizer

text_clf = Pipeline([
    ("vectorizer", CountVectorizer(binary=True)),
    ("classifier", BernoulliNB(alpha=1.0)),
])
```

Cờ `binary=True` trong CountVectorizer chuyển mọi số đếm thành 0/1. Không có nó, BernoulliNB vẫn hoạt động nhưng đang thấy các số đếm mà nó không được thiết kế để xử lý.

### Calibrating NB Probabilities

Các xác suất NB được hiệu chỉnh kém. Khi NB nói P(spam) = 0.95, xác suất thực có thể là 0.7. Nếu cần các ước lượng xác suất đáng tin cậy (ví dụ, để đặt ngưỡng hoặc kết hợp với các mô hình khác), sử dụng CalibratedClassifierCV của sklearn:

```python
from sklearn.calibration import CalibratedClassifierCV

calibrated_nb = CalibratedClassifierCV(MultinomialNB(), cv=5, method="sigmoid")
calibrated_nb.fit(X_train, y_train)
proba = calibrated_nb.predict_proba(X_test)
```

Điều này khớp một hồi quy logistic trên các điểm thô của NB bằng xác thực chéo. Các xác suất kết quả gần các tần suất lớp thực hơn nhiều.

### Common Gotchas

1. **Các giá trị đặc trưng âm.** MultinomialNB đòi hỏi các đặc trưng không âm. Nếu có các giá trị âm (như TF-IDF với một số thiết lập hoặc các đặc trưng đã chuẩn hóa), sử dụng GaussianNB thay thế hoặc dịch các đặc trưng để chúng dương.

2. **Các đặc trưng phương sai bằng không.** GaussianNB chia cho phương sai. Nếu một đặc trưng có phương sai bằng không cho một lớp (mọi giá trị giống hệt), phép tính xác suất hỏng. Mã thêm một số hạng làm trơn nhỏ (1e-9) vào mọi phương sai để ngăn điều này.

3. **Mất cân bằng lớp.** Nếu 99% email không phải thư rác, tiên nghiệm P(not-spam) = 0.99 mạnh đến mức lấn át bằng chứng hợp lý. Bạn có thể đặt các tiên nghiệm lớp thủ công hoặc sử dụng tham số class_prior trong sklearn.

4. **Co giãn đặc trưng.** MultinomialNB không cần co giãn (nó làm việc trên số đếm). GaussianNB cũng không cần co giãn (nó ước lượng các thống kê theo từng đặc trưng). Đây là lợi thế so với hồi quy logistic và SVM, vốn nhạy với thang đo đặc trưng.

## Ship It

Bài học này tạo ra:
- `outputs/skill-naive-bayes-chooser.md` -- một skill quyết định để chọn biến thể NB phù hợp
- `code/naive_bayes.py` -- MultinomialNB và GaussianNB từ đầu, với so sánh sklearn

### When Naive Bayes Fails

NB thất bại khi giả định độc lập gây ra các thứ hạng sai (không chỉ các xác suất sai). Điều này xảy ra khi:

1. **Các tương tác đặc trưng mạnh.** Nếu lớp phụ thuộc vào kết hợp hai đặc trưng nhưng không phụ thuộc từng đặc trưng riêng (các mẫu giống XOR), NB sẽ bỏ lỡ hoàn toàn. Mỗi đặc trưng riêng không cung cấp bằng chứng, và NB không thể kết hợp chúng phi tuyến.

2. **Các đặc trưng tương quan cao với bằng chứng đối lập.** Nếu đặc trưng A nói "thư rác" và đặc trưng B nói "không phải thư rác", nhưng A và B tương quan hoàn hảo (chúng luôn đồng ý trong thực tế), NB sẽ thấy bằng chứng mâu thuẫn ở nơi không có.

3. **Các tập huấn luyện rất lớn.** Với đủ dữ liệu, các mô hình phân biệt như hồi quy logistic học biên quyết định thực và vượt NB. Giả định độc lập đã giúp với dữ liệu nhỏ giờ cản trở mô hình.

Trong thực tế, các kiểu thất bại này hiếm đối với phân loại văn bản. Các đặc trưng văn bản nhiều, riêng lẻ yếu và sai số của giả định độc lập có xu hướng triệt tiêu. Với dữ liệu dạng bảng có ít đặc trưng tương quan mạnh, cân nhắc hồi quy logistic hoặc các mô hình dựa trên cây trước.

## Exercises

1. **Thí nghiệm làm trơn.** Huấn luyện MultinomialNB trên dữ liệu văn bản với các giá trị alpha 0.01, 0.1, 1.0, 10.0 và 100.0. Vẽ độ chính xác theo alpha. Hiệu năng đạt đỉnh ở đâu? Tại sao alpha rất cao gây hại?

2. **Kiểm tra độc lập đặc trưng.** Lấy một tập dữ liệu văn bản thực. Chọn hai từ rõ ràng tương quan ("machine" và "learning"). Tính P(word1 | class) * P(word2 | class) và so sánh với P(word1 AND word2 | class). Giả định độc lập sai đến mức nào? Nó có ảnh hưởng độ chính xác phân loại không?

3. **Triển khai Bernoulli.** Mở rộng mã với một lớp BernoulliNB. Chuyển bag-of-words thành nhị phân (hiện diện/vắng mặt) và so sánh độ chính xác với MultinomialNB trên dữ liệu văn bản. Khi nào Bernoulli thắng?

4. **NB so với Hồi quy Logistic.** Huấn luyện cả hai trên dữ liệu văn bản. Bắt đầu với 100 mẫu huấn luyện và tăng đến 10,000. Vẽ độ chính xác theo kích thước tập huấn luyện cho cả hai. Tại điểm nào Hồi quy Logistic vượt Naive Bayes?

5. **Bộ lọc thư rác.** Xây dựng một bộ phân loại thư rác hoàn chỉnh: tách token văn bản email thô, xây dựng từ vựng, tạo các đặc trưng bag-of-words, huấn luyện MultinomialNB, đánh giá bằng precision và recall (không chỉ accuracy -- tại sao?).

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| Naive Bayes | "Bộ phân loại xác suất đơn giản" | Một bộ phân loại áp dụng định lý Bayes với giả định các đặc trưng độc lập có điều kiện khi biết lớp |
| Conditional independence (Độc lập có điều kiện) | "Các đặc trưng không ảnh hưởng lẫn nhau" | P(A, B \| C) = P(A \| C) * P(B \| C) -- biết B không cho thêm điều gì mới về A một khi đã biết C |
| Laplace smoothing (Làm trơn Laplace) | "Làm trơn cộng một" | Thêm một số đếm nhỏ vào mọi đặc trưng để ngăn các xác suất bằng không chi phối dự đoán |
| Prior (Tiên nghiệm) | "Những gì bạn tin trước khi thấy dữ liệu" | P(class) -- xác suất mỗi lớp trước khi quan sát bất kỳ đặc trưng nào |
| Likelihood (Hợp lý) | "Dữ liệu khớp tốt đến mức nào" | P(features \| class) -- xác suất quan sát các đặc trưng này nếu lớp đã biết |
| Posterior (Hậu nghiệm) | "Những gì bạn tin sau khi thấy dữ liệu" | P(class \| features) -- xác suất lớp đã cập nhật sau khi quan sát các đặc trưng |
| Generative model (Mô hình tạo sinh) | "Mô hình hóa cách dữ liệu được sinh" | Một mô hình học P(X \| Y) và P(Y), rồi sử dụng định lý Bayes để có P(Y \| X) |
| Discriminative model (Mô hình phân biệt) | "Mô hình hóa biên quyết định" | Một mô hình học trực tiếp P(Y \| X) mà không mô hình hóa cách X được sinh |
| Log probability (Xác suất log) | "Tránh hụt dưới" | Làm việc với log P thay vì P để ngăn tích của nhiều số nhỏ trở thành không trong dấu phẩy động |

## Further Reading

- [Tài liệu scikit-learn Naive Bayes](https://scikit-learn.org/stable/modules/naive_bayes.html) -- cả ba biến thể với chi tiết toán học
- [McCallum and Nigam, A Comparison of Event Models for Naive Bayes Text Classification (1998)](https://www.cs.cmu.edu/~knigam/papers/multinomial-aaaiws98.pdf) -- so sánh kinh điển Multinomial với Bernoulli cho văn bản
- [Rennie et al., Tackling the Poor Assumptions of Naive Bayes Text Classifiers (2003)](https://people.csail.mit.edu/jrennie/papers/icml03-nb.pdf) -- các cải tiến NB cho văn bản
- [Ng and Jordan, On Discriminative vs. Generative Classifiers (2001)](https://ai.stanford.edu/~ang/papers/nips01-discriminativegenerative.pdf) -- chứng minh NB hội tụ nhanh hơn LR với ít dữ liệu hơn
