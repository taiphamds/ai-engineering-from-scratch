# Monitoring Models in Production — Data Drift and Concept Drift

> Một mô hình đã triển khai thất bại mà không có thông báo lỗi. Nó tiếp tục trả về điểm trong khi thế giới rời xa dữ liệu huấn luyện của nó, và chỉ việc giám sát cho thấy khoảng cách.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 2, Lessons 09 (Model Evaluation), 16 (Anomaly Detection), and 19 (ML System Design)
**Time:** ~110 minutes

## Learning Objectives

- Chọn các tín hiệu giám sát ở bốn tầng: sức khỏe hệ thống, đầu vào, dự đoán và kết quả
- Phân biệt covariate drift, prior drift và concept drift theo phần của phân phối đồng thời thay đổi
- Triển khai Population Stability Index, thống kê Kolmogorov-Smirnov hai mẫu và kiểm định chi-square từ đầu
- So sánh một cửa sổ tham chiếu cố định với các cửa sổ hiện tại trượt, và giải thích cách kích thước cửa sổ thay đổi nhiễu và độ trễ
- Thiết kế một chính sách cảnh báo giới hạn báo động giả bằng kích thước hiệu ứng, hiệu chỉnh đa kiểm định và một quy tắc duy trì
- Quyết định loại drift nào cần huấn luyện lại, loại nào cần nhãn mới và loại nào không cần hành động

## The Problem

Một mô hình rủi ro thanh toán đi vào hoạt động với độ chính xác 95 phần trăm. Hai tháng sau, một chiến dịch marketing đưa đến những người dùng ứng dụng với giỏ hàng lớn hơn. Bốn tháng sau, những kẻ gian lận thay đổi chiến thuật, và các khoản thanh toán từng an toàn bắt đầu trở thành chargeback.

Dịch vụ mô hình trả về HTTP 200 cho mọi yêu cầu trong suốt tất cả những điều này. Độ trễ bình thường, và nhật ký không cho thấy lỗi nào. Dấu hiệu rắc rối đầu tiên là một báo cáo tài chính về chargeback, nhiều tuần sau thiệt hại.

Giám sát phần mềm kiểm tra liệu một dịch vụ có trả lời hay không. Giám sát mô hình kiểm tra liệu các câu trả lời còn đúng hay không, và liệu dữ liệu còn giống dữ liệu đã huấn luyện mô hình hay không. Bài học này xây dựng các thống kê, các cửa sổ và chính sách cảnh báo cho công việc thứ hai đó. Bạn chạy chúng trên một luồng tổng hợp với hai thay đổi được chèn và theo dõi monitor nào phản ứng với thay đổi nào.

## The Concept

### What to monitor

Giám sát bốn tầng. Ba tầng đầu đưa ra cảnh báo sớm. Chỉ tầng thứ tư đo tính đúng, và nó đến muộn.

| Tầng | Tín hiệu | Có sẵn | Câu hỏi nó trả lời |
|---|---|---|---|
| Sức khỏe hệ thống | Độ trễ p50 và p99, tỷ lệ lỗi, throughput, bộ nhớ | Ngay lập tức | Dịch vụ có trả lời không? |
| Đầu vào | Phân phối của mỗi đặc trưng, tỷ lệ giá trị thiếu, schema, danh mục mới | Ngay lập tức | Dữ liệu thực có giống dữ liệu huấn luyện không? |
| Dự đoán | Phân phối điểm, tỷ lệ dương tính, tỷ lệ câu trả lời mặc định | Ngay lập tức | Mô hình có hành xử như trước không? |
| Kết quả | Accuracy, precision, calibration, chỉ số kinh doanh | Sau độ trễ nhãn | Mô hình còn đúng không? |

Giám sát đầu vào là chủ đề chính của bài học này, vì nó hoạt động trước khi nhãn đến. Nó có một giới hạn mà demo cho thấy: một số thay đổi để các đầu vào nguyên vẹn.

### Three kinds of drift

Viết phân phối đồng thời của đầu vào `x` và nhãn `y` theo hai cách:

```math
P(x, y) = P(x) \cdot P(y \mid x) = P(y) \cdot P(x \mid y)
```

Mỗi loại drift thay đổi một thừa số khác nhau:

| Drift | Điều thay đổi | Điều giữ nguyên | Ví dụ thanh toán | Monitor nào thấy nó |
|---|---|---|---|---|
| Covariate drift | `P(x)` | `P(y \| x)` | Nhiều người dùng ứng dụng hơn với giỏ hàng lớn hơn | Monitor đầu vào |
| Prior drift | `P(y)` | `P(x \| y)` | Tỷ lệ gian lận tăng gấp đôi trong một cuộc tấn công, và gian lận trông vẫn như cũ | Monitor dự đoán và kết quả |
| Concept drift | `P(y \| x)` | Có thể giữ nguyên | Cùng giỏ hàng giờ có một rủi ro gian lận khác | Chỉ monitor kết quả |

Gama và cộng sự gọi một thay đổi trong `P(y | x)` là concept drift thực. Họ gọi một thay đổi trong `P(x)` để `P(y | x)` nguyên vẹn là drift ảo. Khảo sát của họ cũng phân loại drift theo cách nó xảy ra theo thời gian: đột ngột, tăng dần, từ từ hoặc như một khái niệm quay trở lại.

Covariate drift không phải lúc nào cũng gây hại. Nếu mô hình học `P(y | x)` tốt, nó vẫn đúng cho mỗi đầu vào. Nó vẫn có thể mất độ chính xác khi lưu lượng chuyển vào các vùng có ít dữ liệu huấn luyện hoặc gần ranh giới quyết định.

### Delayed labels

Kết quả đến sau dự đoán. Độ trễ phụ thuộc vấn đề:

| Vấn đề | Khi nhãn đến |
|---|---|
| Nhấp quảng cáo | Vài giây |
| Churn trong 30 ngày tới | 30 ngày |
| Gian lận thẻ | Khi chargeback đến, thường nhiều tuần sau |
| Vỡ nợ khoản vay | Nhiều tháng hoặc năm |

Trong khoảng trễ, bạn có đầu vào và dự đoán nhưng không có kết quả. Giám sát đầu vào và dự đoán, nối các nhãn khi chúng đến và chỉ tính các chỉ số kết quả trên phần đã có nhãn. Demo sử dụng độ trễ nhãn 500 sự kiện, nên monitor kết quả luôn nhìn 500 sự kiện vào quá khứ.

### Reference and current windows

Mọi kiểm định drift so sánh hai mẫu:

- **Cửa sổ tham chiếu.** Dữ liệu huấn luyện, hoặc một giai đoạn production mà bạn đã kiểm tra thủ công. Nó giữ cố định cho đến khi bạn huấn luyện lại.
- **Cửa sổ hiện tại.** Các sự kiện gần nhất, hoặc `N` sự kiện cuối hoặc `T` giờ cuối.

Một cửa sổ trượt tiến lên theo một bước nhỏ hơn kích thước của nó, nên các cửa sổ liên tiếp chồng lấp. Một cửa sổ tumbling di chuyển bằng toàn bộ kích thước của nó. Kích thước cửa sổ là một đánh đổi. Một cửa sổ nhỏ phản ứng nhanh nhưng chấm nhiễu thành drift. Một cửa sổ lớn ổn định nhưng báo cáo thay đổi muộn.

Tính mùa vụ phá các cửa sổ ngây thơ. Lưu lượng thứ Hai khác lưu lượng thứ Bảy trong nhiều sản phẩm. Làm cho tham chiếu bao quát một chu kỳ đầy đủ, hoặc so sánh mỗi cửa sổ với cùng giai đoạn trong một chu kỳ trước.

### Population Stability Index

PSI đến từ chấm điểm tín dụng. Cắt các giá trị tham chiếu thành bin, thường mười bin tại các thập phân vị tham chiếu, để mỗi bin chứa 10 phần trăm tham chiếu. Đếm tỷ lệ các giá trị hiện tại trong mỗi bin. Rồi cộng một số hạng theo mỗi bin:

```math
\text{PSI} = \sum_{\text{bins}} (\text{current\_share} - \text{reference\_share}) \cdot \ln\left(\frac{\text{current\_share}}{\text{reference\_share}}\right)
```

Một bin có tỷ lệ bằng không làm log vô hạn, nên chặn mỗi tỷ lệ ở một giá trị nhỏ chẳng hạn 0.0001. PSI đối xứng. Nó bằng KL divergence từ hiện tại đến tham chiếu cộng KL divergence từ tham chiếu đến hiện tại.

Người thực hành đọc PSI với các dải cố định: dưới 0.1 là ổn định, 0.1 đến 0.25 là dịch chuyển vừa phải và trên 0.25 là dịch chuyển đáng kể. Coi các dải này là một quy ước, không phải kiểm định. PSI tăng theo số bin và giảm theo kích thước mẫu. Trong demo, các cửa sổ 500 sự kiện không có drift có điểm từ 0.01 đến 0.04.

### Kolmogorov-Smirnov statistic

Thống kê KS hai mẫu `D` là khoảng cách thẳng đứng lớn nhất giữa hai hàm phân phối tích lũy thực nghiệm:

```math
D = \max_x \left\lvert F_{\text{reference}}(x) - F_{\text{current}}(x) \right\rvert
```

`D` là 0 cho các mẫu giống hệt và 1 cho các mẫu không chồng lấp. Nó không cần bin. P-value đến từ phân phối Kolmogorov với kích thước mẫu hiệu dụng `n * m / (n + m)`.

Với các mẫu lớn, p-value về không cho một khoảng cách mà không ai quan tâm. Một dịch chuyển 0.02 độ lệch chuẩn là "có ý nghĩa" với một triệu sự kiện mỗi cửa sổ. Sử dụng chính `D` làm kích thước hiệu ứng, và chỉ cảnh báo khi cả `D` và p-value vượt các ngưỡng của chúng.

### Chi-square test for categorical features

Với một đặc trưng phân loại, chẳng hạn kênh thanh toán, xây dựng một bảng hai hàng (tham chiếu, hiện tại) và một cột mỗi danh mục. Số đếm kỳ vọng trong mỗi ô đến từ tổng hàng và cột:

```math
\begin{aligned}
\text{expected}[r][c] &= \text{row\_total}[r] \cdot \text{column\_total}[c] / \text{grand\_total} \\
\text{chi2} &= \sum_{\text{cells}} (\text{observed} - \text{expected})^2 / \text{expected}
\end{aligned}
```

Kiểm định có `k - 1` bậc tự do cho `k` danh mục. Một danh mục chỉ xuất hiện trong cửa sổ hiện tại thêm một số hạng lớn, nên kiểm định phản ứng với các giá trị mới. Cramér's V là kích thước hiệu ứng. Với một bảng hai hàng, nó bằng căn bậc hai của `chi2 / grand_total`.

### Alert thresholds and false alarms

Mỗi kiểm định có một tỷ lệ báo động giả `alpha` khi không có gì thay đổi. Giám sát chạy nhiều kiểm định. Với 50 đặc trưng được kiểm tra mỗi giờ ở `alpha = 0.05`, bạn kỳ vọng khoảng 60 báo động giả mỗi ngày khi không có gì thay đổi. Mọi người ngừng đọc cảnh báo từ rất lâu trước đó.

Bốn quy tắc giữ tỷ lệ cảnh báo hữu ích:

1. **Hiệu chỉnh đa kiểm định.** Hiệu chỉnh Bonferroni chia `alpha` cho số kiểm định. Demo sử dụng `alpha` họ 0.01 trên hai kiểm định, nên mỗi kiểm định sử dụng 0.005.
2. **Yêu cầu một kích thước hiệu ứng.** Chỉ cảnh báo khi PSI, `D` hoặc Cramér's V cũng vượt một ngưỡng.
3. **Yêu cầu tính duy trì.** Chỉ cảnh báo sau `k` cửa sổ drift liên tiếp. Demo sử dụng `k = 2`.
4. **Tách lời cảnh báo khỏi báo động.** Một lời cảnh báo đi đến dashboard. Một báo động đi đến một người.

Demo cho thấy quy tắc 2 hoạt động. Một cửa sổ sạch có chi-square p-value 0.0009, dưới `alpha` mỗi kiểm định. Cramér's V của nó dưới 0.1, nên chính sách ghi nhật ký một lời cảnh báo, không phải một báo động.

### Retraining triggers

Có ba trigger phổ biến để huấn luyện lại:

- **Lịch.** Huấn luyện lại mỗi tuần hoặc tháng. Điều này đơn giản, nhưng nó huấn luyện lại khi không có gì thay đổi và chờ khi có điều thay đổi.
- **Drift.** Huấn luyện lại khi drift đầu vào trên các đặc trưng quan trọng duy trì trên ngưỡng.
- **Hiệu năng.** Huấn luyện lại khi một chỉ số kết quả giảm xuống dưới giá trị tham chiếu trừ một dung sai.

Loại drift quyết định huấn luyện lại có thể làm gì:

| Drift | Hành động hữu ích |
|---|---|
| Covariate drift, độ chính xác ổn định | Thường không có gì. Tiếp tục theo dõi chỉ số kết quả. |
| Covariate drift vào các vùng có ít dữ liệu | Huấn luyện lại trên dữ liệu gần đây bao gồm các vùng đó |
| Prior drift | Hiệu chuẩn lại các điểm hoặc di chuyển ngưỡng quyết định |
| Concept drift | Thu thập nhãn mới trước. Huấn luyện lại trên nhãn cũ dạy lại khái niệm cũ. |

Sau huấn luyện lại, kiểm tra mô hình mới trên dữ liệu đã có nhãn gần nhất. Rollout nó với các giai đoạn shadow và canary từ bài thiết kế hệ thống. Rồi đặt lại cửa sổ tham chiếu về dữ liệu huấn luyện mới.

```figure
mlprod-drift-psi
```

## Build It

Mã trong `code/main.py` chỉ sử dụng thư viện chuẩn.

### Step 1: Quantile bins and PSI

Các cạnh bin là các thập phân vị tham chiếu. `bisect_right` tìm bin của mỗi giá trị.

```python
def quantile_edges(reference: list[float], bins: int = 10) -> list[float]:
    ordered = sorted(reference)
    n = len(ordered)
    edges = [ordered[min(n - 1, (n * i) // bins)] for i in range(1, bins)]
    return sorted(set(edges))


def psi_from_fractions(expected: list[float], actual: list[float], eps: float = 1e-4) -> float:
    total = 0.0
    for e, a in zip(expected, actual):
        e, a = max(e, eps), max(a, eps)
        total += (a - e) * math.log(a / e)
    return total
```

### Step 2: The KS statistic and its p-value

Duyệt cả hai mẫu đã sắp xếp cùng nhau. Tại mỗi giá trị phân biệt, di chuyển qua mọi bản sao của nó trong cả hai mẫu, rồi so sánh hai tỷ lệ tích lũy. Điều này xử lý đúng các giá trị hòa.

```python
def ks_statistic(sample_a: list[float], sample_b: list[float]) -> float:
    a, b = sorted(sample_a), sorted(sample_b)
    n, m = len(a), len(b)
    i = j = 0
    d = 0.0
    while i < n and j < m:
        x = min(a[i], b[j])
        while i < n and a[i] <= x:
            i += 1
        while j < m and b[j] <= x:
            j += 1
        d = max(d, abs(i / n - j / m))
    return d
```

P-value sử dụng chuỗi cho phân phối Kolmogorov, `2 * sum((-1)^(k-1) * exp(-2 k^2 lambda^2))`, với `lambda = sqrt(n * m / (n + m)) * D`.

### Step 3: The chi-square test

`chi2_sf` tính hàm sống sót chi-square qua hàm gamma không đầy đủ phía trên được chuẩn hóa. Nó sử dụng một chuỗi cho các đối số nhỏ và một phân số liên tục cho các đối số lớn. `chi_square_test` xây dựng bảng hai hàng, tính thống kê và trả về p-value cùng Cramér's V.

```python
def chi_square_test(reference_counts: dict[str, int], current_counts: dict[str, int]) -> ChiSquareResult:
    categories = [c for c in sorted(set(reference_counts) | set(current_counts))
                  if reference_counts.get(c, 0) + current_counts.get(c, 0) > 0]
    rows = [[reference_counts.get(c, 0) for c in categories], [current_counts.get(c, 0) for c in categories]]
    row_totals = [sum(r) for r in rows]
    grand = sum(row_totals)
    if len(categories) < 2 or 0 in row_totals:
        return ChiSquareResult(0.0, 0, 1.0, 0.0)
    statistic = 0.0
    for col, _ in enumerate(categories):
        col_total = rows[0][col] + rows[1][col]
        for r in range(2):
            expected = row_totals[r] * col_total / grand
            statistic += (rows[r][col] - expected) ** 2 / expected
    dof = len(categories) - 1
    return ChiSquareResult(statistic, dof, chi2_sf(statistic, dof), math.sqrt(statistic / grand))
```

### Step 4: Windows and the drift monitor

`SlidingWindow` giữ `size` sự kiện cuối trong một `deque`. `DriftMonitor` tính các bin và số đếm tham chiếu một lần. Phương thức `check` của nó trả về PSI, `D` và KS p-value cho mỗi đặc trưng số, và kết quả chi-square cho mỗi đặc trưng phân loại.

### Step 5: The alert policy

Chính sách biến mỗi tập chỉ số thành một mức và đếm các cửa sổ drift liên tiếp theo tín hiệu:

```python
def level(self, metrics: dict[str, float]) -> str:
    if "psi" in metrics:
        if metrics["psi"] >= self.psi_drift or (metrics["ks"] >= self.ks_drift and metrics["ks_p"] < self.alpha):
            return "drift"
        return "warn" if metrics["psi"] >= self.psi_warn else "ok"
    if metrics["p"] < self.alpha and metrics["v"] >= self.min_cramers_v:
        return "drift"
    return "warn" if metrics["p"] < self.alpha else "ok"
```

`update` trả về `ALERT` trên cửa sổ hoàn thành chuỗi liên tiếp, và `resolved` trên cửa sổ sạch đầu tiên sau một báo động.

### Step 6: A stream with injected drift

Luồng có 9000 sự kiện thanh toán với một `amount`, một `channel` và một `label` gian lận. Bốn đoạn định nghĩa nó:

| Sự kiện | Số tiền | Cơ cấu kênh (app, store, web) | Ranh giới nhãn | Thay đổi |
|---|---|---|---|---|
| 0 đến 2999 | trung bình 100, sd 20 | 35, 15, 50 phần trăm | 120 | Giai đoạn tham chiếu |
| 3000 đến 4999 | trung bình 118, sd 24 | 60, 10, 30 phần trăm | 120 | Covariate drift |
| 5000 đến 6499 | trung bình 100, sd 20 | 35, 15, 50 phần trăm | 120 | Trở lại bình thường |
| 6500 đến 8999 | trung bình 100, sd 20 | 35, 15, 50 phần trăm | 105 | Concept drift |

Mô hình là một ngưỡng trên `amount`, được khớp trên 2000 sự kiện đầu. Các cửa sổ chứa 500 sự kiện và di chuyển 250. Nhãn đến muộn 500 sự kiện.

```bash
python3 code/main.py
```

```console
  end    PSI   KS D   chi2 p    acc  levels (amount/channel/accuracy)  events
 3000  0.010  0.041  3.0e-01  0.932  ok/ok/ok
 3250  0.152  0.163  7.6e-06  0.924  drift/warn/ok
 3500  0.463  0.298  2.8e-26  0.936  drift/drift/ok                     ALERT amount
 3750  0.609  0.343  3.5e-35  0.942  drift/drift/ok                     ALERT channel
 ...
 5500  0.026  0.044  2.6e-01  0.898  ok/ok/ok                           resolved amount, resolved channel
 ...
 7250  0.040  0.048  7.1e-01  0.848  ok/ok/drift
 7500  0.022  0.039  6.1e-01  0.778  ok/ok/drift                        ALERT accuracy
```

Đọc kết quả theo ba phần:

- **Covariate drift.** Drift bắt đầu ở sự kiện 3000, và báo động `amount` theo sau ở 3500. Độ chính xác giữ từ 0.89 đến 0.95, vì quy tắc nhãn không thay đổi.
- **Khôi phục.** Các đầu vào trở lại bình thường ở 5000, và cả hai báo động được giải quyết ở 5500.
- **Concept drift.** Drift bắt đầu ở 6500, và các monitor đầu vào giữ im lặng vì đầu vào không thay đổi. Độ chính xác giảm từ 0.946 xuống từ 0.76 đến 0.79. Báo động độ chính xác đến ở 7500, 1000 sự kiện sau thay đổi, và độ trễ nhãn chiếm 500 trong số đó.

## Use It

**scipy.** `scipy.stats` triển khai cả hai kiểm định. Các thống kê khớp mã viết từ đầu. scipy không cần thiết để chạy bài học này.

```python
from scipy import stats

result = stats.ks_2samp(reference_amounts, current_amounts)
print(result.statistic, result.pvalue)

table = [[1000, 700, 300], [140, 290, 70]]
chi2 = stats.chi2_contingency(table)
print(chi2.statistic, chi2.pvalue, chi2.dof)
```

Chúng tôi kiểm tra `ks_statistic` và `chi_square_test` với scipy 1.18.1 trên các mẫu ngẫu nhiên. Thống kê KS, thống kê chi-square và chi-square p-value khớp đến độ chính xác dấu phẩy động. Trên 200 cặp mẫu ngẫu nhiên, các KS p-value khác của scipy tới 18 phần trăm giá trị của scipy. Các khoảng cách lớn nhất ở các p-value rất nhỏ.

Khoảng cách đến từ phương pháp. Mã của chúng ta sử dụng phân phối Kolmogorov giới hạn. Mặc định, `ks_2samp` sử dụng một phương pháp chính xác khi cả hai mẫu có tối đa 10,000 giá trị. Chế độ tiệm cận của nó sử dụng một phân phối mẫu hữu hạn với kích thước mẫu hiệu dụng được làm tròn. Với hai danh mục, `chi2_contingency` áp dụng hiệu chỉnh liên tục Yates mặc định, nên các thống kê khác nhau ở đó.

**Thư viện giám sát.** Nhiều thư viện mã nguồn mở đóng gói các kiểm định này với báo cáo và dashboard:

- **Evidently** chọn một kiểm định drift theo cột. Với một tham chiếu 1000 hàng hoặc ít hơn, nó sử dụng kiểm định KS cho cột số và kiểm định chi-square cho cột phân loại. Với dữ liệu lớn hơn, nó sử dụng khoảng cách Wasserstein và Jensen-Shannon divergence với ngưỡng 0.1. PSI là một trong các phương pháp khác mà bạn có thể chọn.
- **NannyML** ước tính hiệu năng mô hình trước khi nhãn đến. Confidence-based Performance Estimation (CBPE) của nó sử dụng các xác suất dự đoán của mô hình, phải được hiệu chuẩn tốt. Tài liệu NannyML nêu rằng CBPE xử lý covariate shift nhưng không đối phó được concept drift. Luồng demo cho thấy vì sao: chỉ các nhãn tiết lộ concept drift.
- **TensorFlow Data Validation** so sánh các span dữ liệu liên tiếp. Nó sử dụng khoảng cách L-infinity cho các đặc trưng phân loại và một Jensen-Shannon divergence xấp xỉ cho các đặc trưng số. Nó cũng so sánh dữ liệu huấn luyện với dữ liệu phục vụ, điều bài feature store bao quát.

Mã viết từ đầu cho thấy mỗi trong các công cụ này tính gì. Các công cụ thêm lưu trữ, lên lịch, dashboard và nhiều kiểm định hơn nữa.

Với các ứng dụng LLM, [bài khả năng quan sát LLM](../../../17-infrastructure-and-production/13-llm-observability/docs/en.md) trong giai đoạn hạ tầng bao quát các công cụ tracing và đánh giá. Các ý tưởng trong bài học này vẫn áp dụng cho đầu vào và đầu ra của các hệ thống đó.

## Ship It

Bài học này tạo ra `outputs/skill-drift-monitoring.md`. Skill lập kế hoạch các monitor cho một mô hình mới và phân loại một báo động drift. Nó hỏi tầng nào đã kích hoạt, loại drift nào khớp bằng chứng và liệu hành động đúng là chờ, hiệu chuẩn lại, thu thập nhãn hay huấn luyện lại.

## Exercises

1. Chạy luồng với các cửa sổ 200 và 2000 sự kiện. Ghi lại các lời cảnh báo giả trước sự kiện 3000 và độ trễ báo động.
2. Đặt `n_tests=1`, `patience=1` và `min_cramers_v=0`. Đếm các báo động trong giai đoạn sạch từ 5000 đến 6500.
3. Thêm một đặc trưng có trung bình tăng 0.01 mỗi 100 sự kiện. Tìm tín hiệu nào, PSI hay KS, phản ứng trước.
4. Triển khai khoảng cách Jensen-Shannon trên cùng các bin thập phân vị. So sánh nó với PSI trên mọi cửa sổ.
5. Thêm một monitor cho tỷ lệ dự đoán dương tính của mô hình. Giải thích vì sao nó giữ im lặng trong concept drift.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa |
|------|----------------|----------------------|
| Data drift — Trôi dạt dữ liệu | "Dữ liệu đã thay đổi" | Một thay đổi trong phân phối đầu vào, dự đoán hoặc nhãn so với một cửa sổ tham chiếu |
| Covariate drift | "Các loại người dùng mới" | `P(x)` thay đổi trong khi `P(y \| x)` giữ nguyên |
| Prior drift | "Nhiều dương tính hơn trước" | `P(y)` thay đổi trong khi `P(x \| y)` giữ nguyên, còn gọi là label shift |
| Concept drift | "Luật chơi đã thay đổi" | `P(y \| x)` thay đổi, nên cùng đầu vào giờ có một câu trả lời đúng khác |
| Reference window — Cửa sổ tham chiếu | "Dữ liệu đường cơ sở" | Một mẫu cố định, thường là dữ liệu huấn luyện, mà mọi cửa sổ hiện tại được so sánh với |
| PSI | "Điểm ổn định" | Một tổng đối xứng trên các bin của (tỷ lệ hiện tại trừ tỷ lệ tham chiếu) nhân log tỷ số của chúng |
| KS statistic — Thống kê KS | "Kiểm định KS" | Khoảng cách lớn nhất giữa hai hàm phân phối tích lũy thực nghiệm |
| Cramér's V | "Kích thước hiệu ứng cho danh mục" | Thống kê chi-square được đưa về phạm vi 0 đến 1 |
| Label delay — Độ trễ nhãn | "Ground truth đến sau" | Thời gian giữa một dự đoán và sự xuất hiện của kết quả thật của nó |
| Alert fatigue — Mệt mỏi cảnh báo | "Quá nhiều thông báo khẩn" | Mọi người bỏ qua cảnh báo vì phần lớn chúng là báo động giả |

## Further Reading

- [Gama et al., A Survey on Concept Drift Adaptation (ACM Computing Surveys, 2014)](https://research.tue.nl/en/publications/a-survey-on-concept-drift-adaptation): drift thực và ảo, các mẫu drift và các phương pháp thích ứng
- [Rabanser, Günnemann, and Lipton, Failing Loudly: An Empirical Study of Methods for Detecting Dataset Shift (NeurIPS 2019)](https://arxiv.org/abs/1810.11953): các kiểm định hai mẫu để phát hiện dịch chuyển
- [Lu et al., Learning under Concept Drift: A Review (2020)](https://arxiv.org/abs/2004.05785): các phương pháp phát hiện, hiểu và thích ứng drift
- [Yurdakul, Statistical Properties of Population Stability Index (Western Michigan University, 2018)](https://scholarworks.wmich.edu/dissertations/3208/): cách PSI hành xử theo kích thước mẫu và số bin
- [Tài liệu scipy.stats.ks_2samp](https://docs.scipy.org/doc/scipy/reference/generated/scipy.stats.ks_2samp.html): các phương pháp p-value chính xác và tiệm cận cho kiểm định KS hai mẫu
- [Evidently, How data drift detection works](https://docs.evidentlyai.com/metrics/explainer_drift): lựa chọn kiểm định mặc định theo loại cột và kích thước dữ liệu
- [NannyML, Performance estimation](https://nannyml.readthedocs.io/en/stable/how_it_works/performance_estimation.html): CBPE và các giả định của nó
