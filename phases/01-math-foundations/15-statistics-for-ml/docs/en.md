# Statistics for Machine Learning

> Thống kê là cách bạn biết mô hình thực sự hoạt động hay chỉ gặp may.

**Type:** Build
**Language:** Python
**Prerequisites:** Phase 1, Lessons 06 (Probability and Distributions), 07 (Bayes' Theorem)
**Time:** ~120 minutes

## Learning Objectives

- Tính thống kê mô tả, tương quan Pearson/Spearman và các ma trận hiệp phương sai từ đầu
- Thực hiện kiểm định giả thuyết (t-test, chi bình phương) và diễn giải đúng p-value cùng khoảng tin cậy
- Sử dụng lấy mẫu lại bootstrap để xây dựng khoảng tin cậy cho bất kỳ chỉ số nào mà không cần giả định phân phối
- Phân biệt ý nghĩa thống kê với ý nghĩa thực tiễn bằng các thước đo kích thước hiệu ứng

## The Problem

Bạn đã huấn luyện hai mô hình. Mô hình A đạt 0.87 trên tập kiểm tra của bạn. Mô hình B đạt 0.89. Bạn triển khai Mô hình B. Ba tuần sau, các chỉ số sản xuất tệ hơn trước. Chuyện gì đã xảy ra?

Mô hình B thực sự không vượt Mô hình A. Chênh lệch 0.02 là nhiễu. Tập kiểm tra của bạn quá nhỏ, hoặc phương sai quá cao, hoặc cả hai. Bạn đã đưa tính ngẫu nhiên khoác áo cải thiện vào sử dụng.

Điều này xảy ra liên tục. Những xáo trộn bảng xếp hạng Kaggle. Các bài báo không tái lập được. Các kiểm thử A/B tuyên bố bên thắng dựa trên vài trăm mẫu. Nguyên nhân gốc rễ luôn giống nhau: ai đó đã bỏ qua thống kê.

Thống kê cho bạn các công cụ để phân biệt tín hiệu với nhiễu. Nó cho bạn biết khi nào một khác biệt là thật, bạn nên tự tin đến mức nào và cần bao nhiêu dữ liệu trước khi có thể tin một kết quả. Mọi quy trình ML, mọi so sánh mô hình, mọi thí nghiệm đều cần thống kê. Không có nó, bạn đang đoán.

## The Concept

### Descriptive Statistics: Summarizing Your Data

Trước khi mô hình hóa bất cứ thứ gì, bạn cần biết dữ liệu trông như thế nào. Thống kê mô tả nén một tập dữ liệu thành vài con số nắm bắt hình dạng của nó.

**Các thước đo xu hướng trung tâm** trả lời "giữa nằm ở đâu?"

```
Mean:   sum of all values / count
        mu = (1/n) * sum(x_i)

Median: middle value when sorted
        Robust to outliers. If you have [1, 2, 3, 4, 1000], the mean is 202
        but the median is 3.

Mode:   most frequent value
        Useful for categorical data. For continuous data, rarely informative.
```

Trung bình là điểm cân bằng. Trung vị là mốc chia đôi. Khi chúng khác nhau, phân phối của bạn bị lệch. Các phân phối thu nhập có $\text{mean} \gg \text{median}$ (lệch phải từ các tỷ phú). Các phân phối loss trong quá trình huấn luyện thường có $\text{mean} \ll \text{median}$ (lệch trái từ các mẫu dễ).

**Các thước đo độ phân tán** trả lời "dữ liệu phân tán đến mức nào?"

```
Variance:   average squared deviation from the mean
            sigma^2 = (1/n) * sum((x_i - mu)^2)

Standard deviation:  square root of variance
                     sigma = sqrt(sigma^2)
                     Same units as the data, so more interpretable.

Range:      max - min
            Sensitive to outliers. Almost never useful alone.

IQR:        Q3 - Q1 (interquartile range)
            The range of the middle 50% of the data.
            Robust to outliers. Used for box plots and outlier detection.
```

**Các phân vị phần trăm** chia dữ liệu đã sắp xếp thành 100 phần bằng nhau. Phân vị phần trăm thứ 25 (Q1) có nghĩa là 25% giá trị nằm dưới điểm này. Phân vị phần trăm thứ 50 là trung vị. Phân vị phần trăm thứ 75 là Q3.

```
For latency monitoring:
  P50 = median latency        (typical user experience)
  P95 = 95th percentile       (bad but not worst case)
  P99 = 99th percentile       (tail latency, often 10x the median)
```

Trong ML, bạn quan tâm đến các phân vị phần trăm cho độ trễ suy luận, phân phối độ tự tin dự đoán và việc hiểu các phân phối sai số. Một mô hình có sai số trung bình thấp nhưng sai số P99 tệ có thể vô ích cho các ứng dụng thiết yếu về an toàn.

**Thống kê mẫu so với tổng thể.** Khi tính phương sai từ một mẫu, chia cho $(n-1)$ thay vì $n$. Đây là hiệu chỉnh Bessel. Nó bù cho việc trung bình mẫu không phải trung bình tổng thể thực. Với $n$ ở mẫu số, bạn đánh giá thấp phương sai thực một cách có hệ thống. Với $(n-1)$, ước lượng không chệch.

```math
\begin{aligned}
\text{Population variance:} \quad \sigma^2 &= \frac{1}{N} \sum (x_i - \mu)^2 \\
\text{Sample variance:} \quad s^2 &= \frac{1}{n-1} \sum (x_i - \bar{x})^2
\end{aligned}
```

Trong thực tế: nếu $n$ lớn (hàng nghìn mẫu), sự khác biệt không đáng kể. Nếu $n$ nhỏ (hàng chục mẫu), nó quan trọng.

### Correlation: How Variables Move Together

Tương quan đo độ mạnh và hướng của một quan hệ tuyến tính giữa hai biến.

**Hệ số tương quan Pearson** đo sự liên hệ tuyến tính:

```
r = sum((x_i - x_bar)(y_i - y_bar)) / (n * s_x * s_y)

r = +1:  perfect positive linear relationship
r = -1:  perfect negative linear relationship
r =  0:  no linear relationship (but there might be a nonlinear one!)

Range: [-1, 1]
```

Pearson giả định quan hệ tuyến tính và cả hai biến xấp xỉ phân phối chuẩn. Nó nhạy với ngoại lệ. Một điểm cực đoan duy nhất có thể kéo $r$ từ 0.1 đến 0.9.

**Tương quan hạng Spearman** đo sự liên hệ đơn điệu:

```
1. Replace each value with its rank (1, 2, 3, ...)
2. Compute Pearson correlation on the ranks

Spearman catches any monotonic relationship, not just linear.
If y = x^3, Pearson gives r < 1 but Spearman gives rho = 1.
```

**Khi nào sử dụng từng loại:**

```
Pearson:    Both variables are continuous and roughly normal.
            You care about the linear relationship specifically.
            No extreme outliers.

Spearman:   Ordinal data (rankings, ratings).
            Data is not normally distributed.
            You suspect a monotonic but not linear relationship.
            Outliers are present.
```

**Quy tắc vàng:** tương quan không hàm ý nhân quả. Doanh số kem và số người chết đuối tương quan vì cả hai đều tăng vào mùa hè. Độ chính xác mô hình và số tham số tương quan, nhưng thêm tham số không tự động cải thiện độ chính xác (xem: khớp quá mức).

### Covariance Matrix

Hiệp phương sai giữa hai biến đo cách chúng cùng biến thiên:

```
Cov(X, Y) = (1/n) * sum((x_i - x_bar)(y_i - y_bar))

Cov(X, Y) > 0:  X and Y tend to increase together
Cov(X, Y) < 0:  when X increases, Y tends to decrease
Cov(X, Y) = 0:  no linear co-movement
```

Với $d$ đặc trưng, ma trận hiệp phương sai $C$ là một ma trận $d \times d$ trong đó $C[i][j] = \mathop{\mathrm{Cov}}(\text{feature}_i, \text{feature}_j)$. Các phần tử đường chéo $C[i][i]$ là phương sai của mỗi đặc trưng.

```
C = | Var(x1)      Cov(x1,x2)  Cov(x1,x3) |
    | Cov(x2,x1)  Var(x2)      Cov(x2,x3) |
    | Cov(x3,x1)  Cov(x3,x2)  Var(x3)     |

Properties:
  - Symmetric: C[i][j] = C[j][i]
  - Positive semi-definite: all eigenvalues >= 0
  - Diagonal = variances
  - Off-diagonal = covariances
```

**Mối liên hệ với PCA.** PCA phân rã riêng ma trận hiệp phương sai. Các vector riêng là các thành phần chính (hướng phương sai lớn nhất). Các giá trị riêng cho bạn biết mỗi thành phần nắm bắt bao nhiêu phương sai. Đây chính xác là những gì Bài học 10 đã đề cập, nhưng giờ bạn thấy tại sao ma trận hiệp phương sai là thứ phù hợp để phân rã: nó mã hóa mọi quan hệ tuyến tính từng cặp trong dữ liệu.

**Mối liên hệ với tương quan.** Ma trận tương quan là ma trận hiệp phương sai của các biến đã chuẩn hóa (mỗi biến chia cho độ lệch chuẩn của nó). Tương quan chuẩn hóa hiệp phương sai để mọi giá trị nằm trong $[-1, 1]$.

### Hypothesis Testing

Kiểm định giả thuyết là một khuôn khổ ra quyết định dưới sự không chắc chắn. Bạn bắt đầu với một khẳng định, thu thập dữ liệu và xác định xem dữ liệu có nhất quán với khẳng định hay không.

**Thiết lập:**

```
Null hypothesis (H0):        the default assumption, usually "no effect"
Alternative hypothesis (H1): what you are trying to show

Example:
  H0: Model A and Model B have the same accuracy
  H1: Model B has higher accuracy than Model A
```

**p-value** là xác suất thấy dữ liệu cực đoan ít nhất như những gì bạn đã quan sát, giả định H0 đúng. Nó KHÔNG phải xác suất H0 đúng. Đây là hiểu lầm phổ biến nhất trong thống kê.

```
p-value = P(data this extreme | H0 is true)

If p-value < alpha (typically 0.05):
    Reject H0. The result is "statistically significant."
If p-value >= alpha:
    Fail to reject H0. You do not have enough evidence.
    This does NOT mean H0 is true.
```

**Khoảng tin cậy** cho một khoảng các giá trị hợp lý cho một tham số:

```
95% confidence interval for the mean:
    x_bar +/- z * (s / sqrt(n))

where z = 1.96 for 95% confidence

Interpretation: if you repeated this experiment many times, 95% of the
computed intervals would contain the true mean. It does NOT mean there
is a 95% probability the true mean is in this specific interval.
```

Độ rộng khoảng tin cậy cho bạn biết về độ chụm. Các khoảng rộng nghĩa là sự không chắc chắn cao. Các khoảng hẹp nghĩa là ước lượng có độ chụm cao (nhưng không nhất thiết đúng, nếu dữ liệu bị chệch).

### The t-test

t-test so sánh các trung bình. Có một số dạng.

**t-test một mẫu:** trung bình tổng thể có khác một giá trị giả thuyết không?

```math
\begin{aligned}
t &= \frac{\bar{x} - \mu_0}{s / \sqrt{n}} \\[4pt]
\text{degrees of freedom} &= n - 1
\end{aligned}
```

**t-test hai mẫu (độc lập):** trung bình hai nhóm có khác nhau không?

```
t = (x_bar_1 - x_bar_2) / sqrt(s1^2/n1 + s2^2/n2)

This is Welch's t-test, which does not assume equal variances.
Always use Welch's unless you have a specific reason for equal variances.
```

**t-test ghép cặp:** khi các số đo theo cặp (cùng mô hình được đánh giá trên cùng các phần chia dữ liệu):

```
Compute d_i = x_i - y_i for each pair
Then run a one-sample t-test on the d_i values against mu_0 = 0
```

Trong ML, t-test ghép cặp phổ biến: bạn chạy cả hai mô hình trên cùng 10 fold xác thực chéo và so sánh điểm số của chúng theo cặp.

### Chi-squared Test

Kiểm định chi bình phương kiểm tra xem các tần suất quan sát có khớp tần suất kỳ vọng hay không. Hữu ích cho dữ liệu phân loại.

```
chi^2 = sum((observed - expected)^2 / expected)

Example: does a language model's output distribution match the
training distribution across categories?

Category    Observed   Expected
Positive       120        100
Negative        80        100
chi^2 = (120-100)^2/100 + (80-100)^2/100 = 4 + 4 = 8

With 1 degree of freedom, chi^2 = 8 gives p < 0.005.
The difference is significant.
```

### A/B Testing for ML Models

Kiểm thử A/B trong ML không giống kiểm thử A/B trên web. So sánh mô hình có các thách thức cụ thể:

```
1. Same test set:    Both models must be evaluated on identical data.
                     Different test sets make comparison meaningless.

2. Multiple metrics: Accuracy alone is not enough. You need precision,
                     recall, F1, latency, and fairness metrics.

3. Variance:         Use cross-validation or bootstrap to estimate
                     the variance of each metric, not just point estimates.

4. Data leakage:     If the test set was used during model selection,
                     your comparison is biased. Hold out a final test set.
```

**Quy trình:**

```
1. Define your metric and significance level (alpha = 0.05)
2. Run both models on the same k-fold cross-validation splits
3. Collect paired scores: [(a1, b1), (a2, b2), ..., (ak, bk)]
4. Compute differences: d_i = b_i - a_i
5. Run a paired t-test on the differences
6. Check: is the mean difference significantly different from 0?
7. Compute a confidence interval for the mean difference
8. Compute effect size (Cohen's d) to judge practical significance
```

### Statistical Significance vs Practical Significance

Một kết quả có thể có ý nghĩa thống kê nhưng vô nghĩa về mặt thực tiễn. Với đủ dữ liệu, ngay cả một khác biệt rất nhỏ cũng trở nên có ý nghĩa thống kê.

```
Example:
  Model A accuracy: 0.9234
  Model B accuracy: 0.9237
  n = 1,000,000 test samples
  p-value = 0.001

Statistically significant? Yes.
Practically significant? A 0.03% improvement is not worth the
engineering cost of deploying a new model.
```

**Kích thước hiệu ứng** định lượng độ lớn của khác biệt, độc lập với kích thước mẫu:

```math
\begin{aligned}
\text{Cohen's } d &= \frac{\text{mean}_1 - \text{mean}_2}{\text{pooled\_std}} \\[4pt]
d &= 0.2: \quad \text{small effect} \\
d &= 0.5: \quad \text{medium effect} \\
d &= 0.8: \quad \text{large effect}
\end{aligned}
```

Luôn báo cáo cả p-value lẫn kích thước hiệu ứng. p-value cho bạn biết khác biệt có thật không. Kích thước hiệu ứng cho bạn biết nó có quan trọng không.

### Multiple Comparison Problem

Khi bạn kiểm định nhiều giả thuyết, một số sẽ "có ý nghĩa" do ngẫu nhiên. Nếu kiểm định 20 thứ tại $\alpha = 0.05$, bạn kỳ vọng 1 dương tính giả ngay cả khi không có gì là thật.

```
P(at least one false positive) = 1 - (1 - alpha)^m

m = 20 tests, alpha = 0.05:
P(false positive) = 1 - 0.95^20 = 0.64

You have a 64% chance of at least one false positive.
```

**Hiệu chỉnh Bonferroni:** chia $\alpha$ cho số kiểm định.

```
Adjusted alpha = alpha / m = 0.05 / 20 = 0.0025

Only reject H0 if p-value < 0.0025.
Conservative but simple. Works when tests are independent.
```

Trong ML, điều này quan trọng khi bạn so sánh một mô hình trên nhiều chỉ số, kiểm tra nhiều cấu hình siêu tham số hoặc đánh giá trên nhiều tập dữ liệu.

### Bootstrap Methods

Bootstrapping ước lượng phân phối lấy mẫu của một thống kê bằng cách lấy mẫu lại dữ liệu có hoàn lại. Không cần giả định về phân phối nền tảng.

**Thuật toán:**

```
1. You have n data points
2. Draw n samples WITH replacement (some points appear multiple times,
   some not at all)
3. Compute your statistic on this bootstrap sample
4. Repeat B times (typically B = 1000 to 10000)
5. The distribution of bootstrap statistics approximates the
   sampling distribution
```

**Khoảng tin cậy bootstrap (phương pháp phân vị phần trăm):**

```
Sort the B bootstrap statistics
95% CI = [2.5th percentile, 97.5th percentile]
```

**Tại sao bootstrap quan trọng đối với ML:**

```
- Test set accuracy is a point estimate. Bootstrap gives you
  confidence intervals.
- You cannot assume metric distributions are normal (especially
  for AUC, F1, precision at k).
- Bootstrap works for ANY statistic: median, ratio of two means,
  difference in AUC between two models.
- No closed-form formula needed.
```

**Bootstrap để so sánh mô hình:**

```
1. You have predictions from Model A and Model B on the same test set
2. For each bootstrap iteration:
   a. Resample test indices with replacement
   b. Compute metric_A and metric_B on the resampled set
   c. Store diff = metric_B - metric_A
3. 95% CI for the difference:
   [2.5th percentile of diffs, 97.5th percentile of diffs]
4. If the CI does not contain 0, the difference is significant
```

Cách này bền vững hơn t-test ghép cặp vì nó không đưa ra giả định phân phối.

### Parametric vs Non-parametric Tests

**Các kiểm định tham số** giả định một phân phối cụ thể (thường là chuẩn):

```
t-test:         assumes normally distributed data (or large n by CLT)
ANOVA:          assumes normality and equal variances
Pearson r:      assumes bivariate normality
```

**Các kiểm định phi tham số** không đưa ra giả định phân phối:

```
Mann-Whitney U:     compares two groups (replaces independent t-test)
Wilcoxon signed-rank: compares paired data (replaces paired t-test)
Spearman rho:       correlation on ranks (replaces Pearson)
Kruskal-Wallis:     compares multiple groups (replaces ANOVA)
```

**Khi nào sử dụng phi tham số:**

```
- Small sample size (n < 30) and data is clearly non-normal
- Ordinal data (ratings, rankings)
- Heavy outliers you cannot remove
- Skewed distributions
```

**Khi nào sử dụng tham số:**

```
- Large sample size (CLT makes the test statistic approximately normal)
- Data is roughly symmetric without extreme outliers
- More statistical power (better at detecting real differences)
```

Trong các thí nghiệm ML, bạn thường có $n$ nhỏ (5 hoặc 10 fold xác thực chéo), nên các kiểm định phi tham số như Wilcoxon signed-rank thường thích hợp hơn t-test.

### Central Limit Theorem: Practical Implications

CLT nói rằng phân phối của các trung bình mẫu tiến đến một phân phối chuẩn khi $n$ tăng, bất kể phân phối tổng thể nền tảng.

```
If X_1, X_2, ..., X_n are iid with mean mu and variance sigma^2:

    X_bar ~ Normal(mu, sigma^2 / n)    as n -> infinity

Works for n >= 30 in most cases.
For highly skewed distributions, you might need n >= 100.
```

**Tại sao điều này quan trọng đối với ML:**

```
1. Justifies confidence intervals and t-tests on aggregated metrics
2. Explains why averaging over cross-validation folds gives stable
   estimates even when individual folds vary wildly
3. Mini-batch gradient descent works because the average gradient
   over a batch approximates the true gradient (CLT in action)
4. Ensemble methods: averaging predictions from many models gives
   more stable output than any single model
```

**Những gì CLT KHÔNG làm:**

```
- Does NOT make your data normal. It makes the MEAN of samples normal.
- Does NOT work for heavy-tailed distributions with infinite variance
  (Cauchy distribution).
- Does NOT apply to dependent data (time series without correction).
```

### Common Statistical Mistakes in ML Papers

1. **Kiểm tra trên tập huấn luyện.** Bảo đảm khớp quá mức. Luôn giữ lại dữ liệu mô hình không bao giờ thấy trong huấn luyện.

2. **Không có khoảng tin cậy.** Báo cáo một con số độ chính xác đơn lẻ không kèm sự không chắc chắn khiến kết quả không thể tái lập và xác minh.

3. **Bỏ qua nhiều phép so sánh.** Kiểm tra 50 cấu hình và báo cáo cấu hình tốt nhất mà không hiệu chỉnh làm tăng tỉ lệ dương tính giả.

4. **Nhầm lẫn ý nghĩa thống kê và thực tiễn.** Một p-value 0.001 trên mức cải thiện độ chính xác 0.01% không có ý nghĩa.

5. **Sử dụng accuracy trên dữ liệu mất cân bằng.** Accuracy 99% trên một tập dữ liệu có 99% lớp âm nghĩa là mô hình không học được gì. Sử dụng precision, recall, F1 hoặc AUC.

6. **Chọn lọc chỉ số.** Chỉ báo cáo chỉ số mà mô hình của bạn thắng. Đánh giá trung thực báo cáo mọi chỉ số liên quan.

7. **Rò rỉ thông tin giữa các phần chia huấn luyện/kiểm tra.** Chuẩn hóa trước khi chia, hoặc sử dụng dữ liệu tương lai để dự đoán quá khứ.

8. **Tập kiểm tra nhỏ không có ước lượng phương sai.** Đánh giá trên 100 mẫu và tuyên bố cải thiện 2% là nhiễu, không phải tín hiệu.

9. **Giả định độc lập khi dữ liệu không độc lập.** Các hình ảnh y khoa từ cùng một bệnh nhân, nhiều câu từ cùng một tài liệu. Các quan sát trong một nhóm tương quan.

10. **P-hacking.** Thử các kiểm định, tập con hoặc tiêu chí loại trừ khác nhau cho đến khi có $p < 0.05$. Kết quả là sản phẩm của quá trình tìm kiếm.

## Building It

Bạn sẽ triển khai:

1. **Thống kê mô tả từ đầu** (trung bình, trung vị, mốt, độ lệch chuẩn, các phân vị phần trăm, IQR)
2. **Các hàm tương quan** (Pearson và Spearman, với ma trận hiệp phương sai)
3. **Các kiểm định giả thuyết** (t-test một mẫu, t-test hai mẫu, kiểm định chi bình phương)
4. **Các khoảng tin cậy bootstrap** (cho bất kỳ thống kê nào, không cần giả định)
5. **Bộ mô phỏng kiểm thử A/B** (tạo dữ liệu, kiểm định, kiểm tra sai lầm Loại I và Loại II)
6. **Demo ý nghĩa thống kê so với thực tiễn** (cho thấy $n$ lớn làm mọi thứ "có ý nghĩa")

Tất cả từ đầu, chỉ sử dụng `math` và `random`. Không numpy, không scipy.

```figure
f3-bootstrap-resample
```

## Key Terms

| Thuật ngữ | Định nghĩa |
|---|---|
| Mean (Trung bình) | Tổng các giá trị chia số lượng. Nhạy với ngoại lệ. |
| Median (Trung vị) | Giá trị ở giữa của dữ liệu đã sắp xếp. Bền vững với ngoại lệ. |
| Standard deviation (Độ lệch chuẩn) | Căn bậc hai của phương sai. Đo độ phân tán theo đơn vị gốc. |
| Percentile (Phân vị phần trăm) | Giá trị mà dưới đó có một tỉ lệ phần trăm dữ liệu nhất định. |
| IQR | Khoảng tứ phân vị. Q3 trừ Q1. Độ phân tán của 50% ở giữa. |
| Pearson correlation (Tương quan Pearson) | Đo sự liên hệ tuyến tính giữa hai biến. Phạm vi $[-1, 1]$. |
| Spearman correlation (Tương quan Spearman) | Đo sự liên hệ đơn điệu bằng thứ hạng. |
| Covariance matrix (Ma trận hiệp phương sai) | Ma trận hiệp phương sai từng cặp giữa tất cả đặc trưng. |
| Null hypothesis (Giả thuyết không) | Giả định mặc định không có hiệu ứng hoặc không có khác biệt. |
| p-value | Xác suất của dữ liệu cực đoan như vậy với giả định giả thuyết không là đúng. |
| Confidence interval (Khoảng tin cậy) | Khoảng các giá trị hợp lý cho một tham số ở một mức tin cậy nhất định. |
| t-test | Kiểm định xem các trung bình có khác nhau đáng kể không. Sử dụng phân phối t. |
| Chi-squared test (Kiểm định chi bình phương) | Kiểm định xem các tần suất quan sát có khác tần suất kỳ vọng không. |
| Effect size (Kích thước hiệu ứng) | Độ lớn của một khác biệt, độc lập với kích thước mẫu. Cohen's d phổ biến. |
| Bonferroni correction (Hiệu chỉnh Bonferroni) | Chia ngưỡng ý nghĩa cho số kiểm định để kiểm soát dương tính giả. |
| Bootstrap | Lấy mẫu lại có hoàn lại để ước lượng các phân phối lấy mẫu. |
| Type I error (Sai lầm Loại I) | Dương tính giả. Bác bỏ H0 khi nó đúng. |
| Type II error (Sai lầm Loại II) | Âm tính giả. Không bác bỏ H0 khi nó sai. |
| Statistical power (Lực kiểm định) | Xác suất bác bỏ đúng một H0 sai. Lực kiểm định = 1 trừ tỉ lệ sai lầm Loại II. |
| Central limit theorem (Định lý giới hạn trung tâm) | Các trung bình mẫu hội tụ về một phân phối chuẩn khi kích thước mẫu tăng. |
| Parametric test (Kiểm định tham số) | Giả định một phân phối cụ thể cho dữ liệu (thường là chuẩn). |
| Non-parametric test (Kiểm định phi tham số) | Không đưa ra giả định phân phối. Hoạt động trên thứ hạng hoặc dấu. |
