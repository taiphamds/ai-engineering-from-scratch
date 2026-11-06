# Probability and Distributions

> Xác suất là ngôn ngữ AI sử dụng để biểu đạt sự không chắc chắn.

**Type:** Learn
**Language:** Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~75 minutes

## Learning Objectives

- Triển khai PMF và PDF từ đầu cho các phân phối Bernoulli, categorical, Poisson, đều và chuẩn
- Tính kỳ vọng, phương sai và sử dụng Định lý Giới hạn Trung tâm để giải thích tại sao Gaussian chiếm ưu thế
- Xây dựng các hàm softmax và log-softmax với thủ thuật ổn định số học (trừ logit lớn nhất)
- Tính mất mát cross-entropy từ logits và kết nối nó với âm log-hợp lý

## The Problem

Một bộ phân loại xuất ra `[0.03, 0.91, 0.06]`. Một mô hình ngôn ngữ chọn từ tiếp theo từ 50,000 ứng viên. Một mô hình khuếch tán tạo hình ảnh bằng cách lấy mẫu từ các phân phối đã học. Tất cả đều là xác suất đang hoạt động.

Mọi dự đoán mà một mô hình đưa ra là một phân phối xác suất. Mỗi hàm mất mát đo mức độ phân phối dự đoán cách xa phân phối thực. Mỗi bước huấn luyện điều chỉnh các tham số để làm một phân phối trông giống một phân phối khác hơn. Không có xác suất, bạn không thể đọc một bài báo ML nào, gỡ lỗi một mô hình nào hoặc hiểu tại sao mất mát huấn luyện của bạn là NaN.

## The Concept

### Events, Sample Spaces, and Probability

Không gian mẫu S là tập hợp tất cả các kết quả có thể. Một biến cố là một tập con của không gian mẫu. Xác suất ánh xạ các biến cố thành các số giữa 0 và 1.

```
Coin flip:
  S = {H, T}
  P(H) = 0.5,  P(T) = 0.5

Single die roll:
  S = {1, 2, 3, 4, 5, 6}
  P(even) = P({2, 4, 6}) = 3/6 = 0.5
```

Ba tiên đề xác định toàn bộ xác suất:
1. P(A) >= 0 với mọi biến cố A
2. P(S) = 1 (luôn có điều gì đó xảy ra)
3. P(A hoặc B) = P(A) + P(B) khi A và B không thể cùng xảy ra

Mọi thứ khác (định lý Bayes, kỳ vọng, phân phối) đều suy ra từ ba quy tắc này.

### Conditional Probability and Independence

P(A|B) là xác suất của A khi biết B đã xảy ra.

```
P(A|B) = P(A and B) / P(B)

Example: deck of cards
  P(King | Face card) = P(King and Face card) / P(Face card)
                      = (4/52) / (12/52)
                      = 4/12 = 1/3
```

Hai biến cố độc lập khi biết một biến cố không cho bạn biết gì về biến cố còn lại:

```
Independent:   P(A|B) = P(A)
Equivalent to: P(A and B) = P(A) * P(B)
```

Các lần tung đồng xu độc lập. Rút bài không hoàn lại thì không.

### Probability Mass Functions vs Probability Density Functions

Các biến ngẫu nhiên rời rạc có một hàm khối xác suất (PMF). Mỗi kết quả có một xác suất cụ thể mà bạn có thể đọc trực tiếp.

```
PMF: P(X = k)

Fair die:
  P(X = 1) = 1/6
  P(X = 2) = 1/6
  ...
  P(X = 6) = 1/6

  Sum of all probabilities = 1
```

Các biến ngẫu nhiên liên tục có một hàm mật độ xác suất (PDF). Mật độ tại một điểm đơn lẻ không phải là xác suất. Xác suất đến từ việc lấy tích phân mật độ trên một khoảng.

```
PDF: f(x)

P(a <= X <= b) = integral of f(x) from a to b

f(x) can be greater than 1 (density, not probability)
integral from -inf to +inf of f(x) dx = 1
```

Sự phân biệt này quan trọng trong ML. Đầu ra phân loại là PMF (các lựa chọn rời rạc). Không gian ẩn VAE sử dụng PDF (liên tục).

### Common Distributions

**Bernoulli:** một phép thử, hai kết quả. Mô hình hóa phân loại nhị phân.

```
P(X = 1) = p
P(X = 0) = 1 - p
Mean = p,  Variance = p(1-p)
```

**Categorical:** một phép thử, k kết quả. Mô hình hóa phân loại đa lớp (đầu ra softmax).

```
P(X = i) = p_i,  where sum of p_i = 1
Example: P(cat) = 0.7,  P(dog) = 0.2,  P(bird) = 0.1
```

**Đều:** mọi kết quả có khả năng như nhau. Được sử dụng để khởi tạo ngẫu nhiên.

```
Discrete: P(X = k) = 1/n for k in {1, ..., n}
Continuous: f(x) = 1/(b-a) for x in [a, b]
```

**Chuẩn (Gaussian):** đường cong hình chuông. Được tham số hóa bằng trung bình (mu) và phương sai (sigma^2).

```
f(x) = (1 / sqrt(2*pi*sigma^2)) * exp(-(x - mu)^2 / (2*sigma^2))

Standard normal: mu = 0, sigma = 1
  68% of data within 1 sigma
  95% within 2 sigma
  99.7% within 3 sigma
```

**Poisson:** số lần các biến cố hiếm xảy ra trong một khoảng cố định. Mô hình hóa tần suất biến cố.

```
P(X = k) = (lambda^k * e^(-lambda)) / k!
Mean = lambda,  Variance = lambda
```

### Expected Value and Variance

Kỳ vọng là kết quả trung bình có trọng số.

```
Discrete:   E[X] = sum of x_i * P(X = x_i)
Continuous: E[X] = integral of x * f(x) dx
```

Phương sai đo độ phân tán quanh trung bình.

```
Var(X) = E[(X - E[X])^2] = E[X^2] - (E[X])^2
Standard deviation = sqrt(Var(X))
```

Trong ML, kỳ vọng xuất hiện dưới dạng hàm mất mát (mất mát trung bình trên phân phối dữ liệu). Phương sai cho bạn biết về tính ổn định của mô hình. Phương sai cao trong gradient có nghĩa là huấn luyện nhiều nhiễu.

### Joint and Marginal Distributions

Một phân phối đồng thời P(X, Y) mô tả hai biến ngẫu nhiên cùng nhau.

Ví dụ PMF đồng thời (X = thời tiết, Y = ô):

| | Y=0 (không có ô) | Y=1 (có ô) | P(X) biên |
|---|---|---|---|
| X=0 (nắng) | 0.40 | 0.10 | P(X=0) = 0.50 |
| X=1 (mưa) | 0.05 | 0.45 | P(X=1) = 0.50 |
| **P(Y) biên** | P(Y=0) = 0.45 | P(Y=1) = 0.55 | 1.00 |

Phân phối biên lấy tổng để loại biến còn lại:

```
P(X = x) = sum over all y of P(X = x, Y = y)
```

Các tổng hàng và cột trong bảng trên là các phân phối biên.

### Why the Normal Distribution Shows Up Everywhere

Định lý Giới hạn Trung tâm: tổng (hoặc trung bình) của nhiều biến ngẫu nhiên độc lập hội tụ về một phân phối chuẩn, bất kể phân phối ban đầu.

```
Roll 1 die:  uniform distribution (flat)
Average of 2 dice:  triangular (peaked)
Average of 30 dice: nearly perfect bell curve

This works for ANY starting distribution.
```

Đây là lý do:
- Sai số đo lường xấp xỉ chuẩn (nhiều nguồn nhỏ độc lập)
- Việc khởi tạo trọng số trong mạng nơ-ron sử dụng các phân phối chuẩn
- Nhiễu gradient trong SGD xấp xỉ chuẩn (tổng nhiều gradient mẫu)
- Phân phối chuẩn là phân phối có entropy lớn nhất với trung bình và phương sai cho trước

### Log Probabilities

Xác suất thô gây ra các vấn đề số học. Nhân nhiều xác suất nhỏ với nhau nhanh chóng gây hụt dưới về không.

```
P(sentence) = P(word1) * P(word2) * ... * P(word_n)
            = 0.01 * 0.003 * 0.02 * ...
            -> 0.0 (underflow after ~30 terms)
```

Xác suất log khắc phục điều này. Phép nhân trở thành phép cộng.

```
log P(sentence) = log P(word1) + log P(word2) + ... + log P(word_n)
                = -4.6 + -5.8 + -3.9 + ...
                -> finite number (no underflow)
```

Các quy tắc:
- log(a * b) = log(a) + log(b)
- xác suất log luôn <= 0 (vì 0 < P <= 1)
- Âm hơn = ít có khả năng hơn
- Mất mát cross-entropy là âm xác suất log của lớp đúng

### Softmax as a Probability Distribution

Mạng nơ-ron xuất ra các điểm số thô (logits). Softmax chuyển đổi chúng thành một phân phối xác suất hợp lệ.

```
softmax(z_i) = exp(z_i) / sum(exp(z_j) for all j)

Properties:
  - All outputs are in (0, 1)
  - All outputs sum to 1
  - Preserves relative ordering of inputs
  - exp() amplifies differences between logits
```

Thủ thuật softmax: trừ logit lớn nhất trước khi lấy hàm mũ để ngăn tràn số.

```
z = [100, 101, 102]
exp(102) = overflow

z_shifted = z - max(z) = [-2, -1, 0]
exp(0) = 1  (safe)

Same result, no overflow.
```

Log-softmax kết hợp softmax và log để ổn định số học. PyTorch sử dụng điều này nội bộ cho mất mát cross-entropy.

### Sampling

Lấy mẫu nghĩa là rút các giá trị ngẫu nhiên từ một phân phối. Trong ML:
- Dropout lấy mẫu ngẫu nhiên những nơ-ron sẽ được đặt về không
- Tăng cường dữ liệu lấy mẫu các phép biến đổi ngẫu nhiên
- Các mô hình ngôn ngữ lấy mẫu token tiếp theo từ phân phối dự đoán
- Các mô hình khuếch tán lấy mẫu nhiễu và dần khử nhiễu

Lấy mẫu từ các phân phối tùy ý đòi hỏi các kỹ thuật như lấy mẫu biến đổi ngược, lấy mẫu loại bỏ hoặc thủ thuật tái tham số hóa (được sử dụng trong VAE).

```figure
gaussian-pdf
```

## Build It

### Step 1: Probability basics

```python
import math
import random

def factorial(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result

def combinations(n, k):
    return factorial(n) // (factorial(k) * factorial(n - k))

def conditional_probability(p_a_and_b, p_b):
    return p_a_and_b / p_b

p_king_given_face = conditional_probability(4/52, 12/52)
print(f"P(King | Face card) = {p_king_given_face:.4f}")
```

### Step 2: PMF and PDF from scratch

```python
def bernoulli_pmf(k, p):
    return p if k == 1 else (1 - p)

def categorical_pmf(k, probs):
    return probs[k]

def poisson_pmf(k, lam):
    return (lam ** k) * math.exp(-lam) / factorial(k)

def uniform_pdf(x, a, b):
    if a <= x <= b:
        return 1.0 / (b - a)
    return 0.0

def normal_pdf(x, mu, sigma):
    coeff = 1.0 / (sigma * math.sqrt(2 * math.pi))
    exponent = -0.5 * ((x - mu) / sigma) ** 2
    return coeff * math.exp(exponent)
```

### Step 3: Expected value and variance

```python
def expected_value(values, probabilities):
    return sum(v * p for v, p in zip(values, probabilities))

def variance(values, probabilities):
    mu = expected_value(values, probabilities)
    return sum(p * (v - mu) ** 2 for v, p in zip(values, probabilities))

die_values = [1, 2, 3, 4, 5, 6]
die_probs = [1/6] * 6
mu = expected_value(die_values, die_probs)
var = variance(die_values, die_probs)
print(f"Die: E[X] = {mu:.4f}, Var(X) = {var:.4f}, SD = {var**0.5:.4f}")
```

### Step 4: Sampling from distributions

```python
def sample_bernoulli(p, n=1):
    return [1 if random.random() < p else 0 for _ in range(n)]

def sample_categorical(probs, n=1):
    cumulative = []
    total = 0
    for p in probs:
        total += p
        cumulative.append(total)
    samples = []
    for _ in range(n):
        r = random.random()
        for i, c in enumerate(cumulative):
            if r <= c:
                samples.append(i)
                break
    return samples

def sample_normal_box_muller(mu, sigma, n=1):
    samples = []
    for _ in range(n):
        u1 = random.random()
        u2 = random.random()
        z = math.sqrt(-2 * math.log(u1)) * math.cos(2 * math.pi * u2)
        samples.append(mu + sigma * z)
    return samples
```

### Step 5: Softmax and log probabilities

```python
def softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    exps = [math.exp(z) for z in shifted]
    total = sum(exps)
    return [e / total for e in exps]

def log_softmax(logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = max_logit + math.log(sum(math.exp(z) for z in shifted))
    return [z - log_sum_exp for z in logits]

def cross_entropy_loss(logits, target_index):
    log_probs = log_softmax(logits)
    return -log_probs[target_index]
```

### Step 6: Central Limit Theorem demonstration

```python
def demonstrate_clt(dist_fn, n_samples, n_averages):
    averages = []
    for _ in range(n_averages):
        samples = [dist_fn() for _ in range(n_samples)]
        averages.append(sum(samples) / len(samples))
    return averages
```

### Step 7: Visualization

```python
import matplotlib.pyplot as plt

xs = [mu + sigma * (i - 500) / 100 for i in range(1001)]
ys = [normal_pdf(x, mu, sigma) for x, mu, sigma in ...]
plt.plot(xs, ys)
```

Các triển khai đầy đủ với tất cả các hình trực quan hóa nằm trong `code/probability.py`.

## Use It

Với NumPy và SciPy, mọi thứ ở trên chỉ là các dòng lệnh đơn:

```python
import numpy as np
from scipy import stats

normal = stats.norm(loc=0, scale=1)
samples = normal.rvs(size=10000)
print(f"Mean: {np.mean(samples):.4f}, Std: {np.std(samples):.4f}")
print(f"P(X < 1.96) = {normal.cdf(1.96):.4f}")

logits = np.array([2.0, 1.0, 0.1])
from scipy.special import softmax, log_softmax
probs = softmax(logits)
log_probs = log_softmax(logits)
print(f"Softmax: {probs}")
print(f"Log-softmax: {log_probs}")
```

Bạn đã xây dựng chúng từ đầu. Giờ bạn biết các lời gọi thư viện đang làm gì.

## Exercises

1. Triển khai lấy mẫu biến đổi ngược cho phân phối mũ. Xác minh bằng cách lấy mẫu 10,000 giá trị và so sánh biểu đồ tần suất với PDF thực.

2. Xây dựng một bảng phân phối đồng thời cho hai xúc xắc không cân bằng. Tính các phân phối biên và kiểm tra xem các xúc xắc có độc lập hay không.

3. Tính mất mát cross-entropy cho một bộ phân loại 5 lớp xuất ra logits `[2.0, 0.5, -1.0, 3.0, 0.1]` khi lớp đúng là chỉ số 3. Sau đó xác minh câu trả lời của bạn bằng `nn.CrossEntropyLoss` của PyTorch.

4. Viết một hàm nhận một danh sách xác suất log và trả về chuỗi có khả năng nhất, tổng xác suất log và xác suất thô tương đương. Kiểm tra nó với một câu gồm 50 từ trong đó mỗi từ có xác suất 0.01.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| Sample space (Không gian mẫu) | "Tất cả các khả năng" | Tập S của mọi kết quả có thể của một thí nghiệm |
| PMF | "Hàm xác suất" | Một hàm cho xác suất chính xác của mỗi kết quả rời rạc, có tổng bằng 1 |
| PDF | "Đường cong xác suất" | Một hàm mật độ cho các biến liên tục. Lấy tích phân nó trên một khoảng để có xác suất |
| Conditional probability (Xác suất có điều kiện) | "Xác suất khi biết điều gì đó" | P(A\|B) = P(A và B) / P(B). Nền tảng của tư duy Bayes và định lý Bayes |
| Independence (Tính độc lập) | "Chúng không ảnh hưởng lẫn nhau" | P(A và B) = P(A) * P(B). Biết một biến cố không cho bạn biết gì về biến cố còn lại |
| Expected value (Kỳ vọng) | "Trung bình" | Tổng tất cả các kết quả có trọng số theo xác suất. Hàm mất mát là một kỳ vọng |
| Variance (Phương sai) | "Phân tán đến mức nào" | Kỳ vọng của độ lệch bình phương so với trung bình. Phương sai cao = các ước lượng nhiều nhiễu, không ổn định |
| Normal distribution (Phân phối chuẩn) | "Đường cong hình chuông" | f(x) = (1/sqrt(2*pi*sigma^2)) * exp(-(x-mu)^2/(2*sigma^2)). Xuất hiện khắp nơi nhờ CLT |
| Central Limit Theorem (Định lý Giới hạn Trung tâm) | "Các trung bình trở nên chuẩn" | Trung bình của nhiều mẫu độc lập hội tụ về một phân phối chuẩn bất kể nguồn |
| Joint distribution (Phân phối đồng thời) | "Hai biến cùng nhau" | P(X, Y) mô tả xác suất của mọi tổ hợp kết quả X và Y |
| Marginal distribution (Phân phối biên) | "Lấy tổng để loại biến còn lại" | P(X) = sum_y P(X, Y). Khôi phục phân phối của một biến từ phân phối đồng thời |
| Log probability (Xác suất log) | "Log của xác suất" | log P(x). Biến tích thành tổng, ngăn hụt dưới số học trong các chuỗi dài |
| Softmax | "Biến điểm số thành xác suất" | softmax(z_i) = exp(z_i) / sum(exp(z_j)). Ánh xạ logits có giá trị thực thành một phân phối xác suất hợp lệ |
| Cross-entropy | "Hàm mất mát" | -sum(p_true * log(p_predicted)). Đo mức độ khác nhau giữa hai phân phối. Thấp hơn là tốt hơn |
| Logits | "Đầu ra mô hình thô" | Các điểm số chưa chuẩn hóa trước softmax. Được đặt tên theo hàm logistic |
| Sampling (Lấy mẫu) | "Rút các giá trị ngẫu nhiên" | Tạo các giá trị theo một phân phối xác suất. Cách các mô hình tạo đầu ra |

## Further Reading

- [3Blue1Brown: But what is the Central Limit Theorem?](https://www.youtube.com/watch?v=zeJD6dqJ5lo) - chứng minh trực quan tại sao các trung bình trở nên chuẩn
- [Stanford CS229 Probability Review](https://cs229.stanford.edu/section/cs229-prob.pdf) - tài liệu tham khảo ngắn gọn bao quát mọi thứ ở đây và hơn thế nữa
- [The Log-Sum-Exp Trick](https://gregorygundersen.com/blog/2020/02/09/log-sum-exp/) - tại sao ổn định số học quan trọng và cách đạt được nó
