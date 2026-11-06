# Numerical Stability

> Dấu phẩy động là một lớp trừu tượng bị rò rỉ. Nó sẽ gây rắc rối cho bạn trong quá trình huấn luyện, và bạn sẽ không thấy trước được.

**Type:** Build
**Language:** Python
**Prerequisites:** Phase 1, Lessons 01-04
**Time:** ~120 minutes

## Learning Objectives

- Triển khai softmax và log-sum-exp ổn định về mặt số học bằng thủ thuật trừ giá trị lớn nhất
- Xác định tràn số, hụt dưới và triệt tiêu nghiêm trọng trong các phép tính dấu phẩy động
- Xác minh gradient giải tích với gradient số bằng sai phân hữu hạn trung tâm
- Giải thích tại sao bfloat16 được ưu tiên hơn float16 để huấn luyện và cách điều chỉnh tỉ lệ mất mát ngăn gradient hụt dưới

## The Problem

Mô hình của bạn huấn luyện trong ba giờ, rồi mất mát trở thành NaN. Bạn thêm một lệnh in. Logits bình thường ở bước 9,000. Tại bước 9,001 chúng là `inf`. Đến bước 9,002 mọi gradient đều là `nan` và huấn luyện đã chết.

Hoặc: mô hình huấn luyện đến hết nhưng độ chính xác kém hơn 2% so với tuyên bố trong bài báo. Bạn kiểm tra mọi thứ. Kiến trúc khớp. Các siêu tham số khớp. Dữ liệu khớp. Vấn đề là bài báo sử dụng float32 còn bạn sử dụng float16 mà không có điều chỉnh tỉ lệ phù hợp. Ba mươi hai bit sai số làm tròn tích lũy âm thầm ăn mất độ chính xác của bạn.

Hoặc: bạn triển khai mất mát cross-entropy từ đầu. Nó hoạt động với logits nhỏ. Khi logits vượt 100, nó trả về `inf`. Softmax bị tràn vì `exp(100)` lớn hơn giá trị float32 có thể biểu diễn. Mọi framework ML đều xử lý điều này bằng một thủ thuật hai dòng. Bạn không biết thủ thuật đó tồn tại.

Độ ổn định số học không phải là mối quan tâm lý thuyết. Nó là sự khác biệt giữa một lần huấn luyện thành công và một lần âm thầm thất bại. Mọi lỗi ML nghiêm trọng mà bạn sẽ gỡ lỗi cuối cùng đều quy về dấu phẩy động.

## The Concept

### IEEE 754: How Computers Store Real Numbers

Máy tính lưu các số thực dưới dạng giá trị dấu phẩy động theo tiêu chuẩn IEEE 754. Một số dấu phẩy động có ba phần: một bit dấu, một số mũ và một phần định trị (phần có nghĩa).

```
Float32 layout (32 bits total):
[1 sign] [8 exponent] [23 mantissa]

Value = (-1)^sign * 2^(exponent - 127) * 1.mantissa
```

Phần định trị quyết định độ chính xác (bao nhiêu chữ số có nghĩa). Số mũ quyết định phạm vi (một số có thể lớn hoặc nhỏ đến mức nào).

```
Format     Bits   Exponent  Mantissa  Decimal digits  Range (approx)
float64    64     11        52        ~15-16          +/- 1.8e308
float32    32     8         23        ~7-8            +/- 3.4e38
float16    16     5         10        ~3-4            +/- 65,504
bfloat16   16     8         7         ~2-3            +/- 3.4e38
```

float32 cho bạn khoảng 7 chữ số thập phân chính xác. Điều đó có nghĩa là nó có thể phân biệt 1.0000001 và 1.0000002, nhưng không phân biệt 1.00000001 và 1.00000002. Sau 7 chữ số, mọi thứ là nhiễu làm tròn.

float16 cho bạn khoảng 3 chữ số. Số lớn nhất nó có thể biểu diễn là 65,504. Con số đó nhỏ đến đáng lo đối với ML, nơi logits, gradient và kích hoạt thường xuyên vượt quá mức này.

bfloat16 là câu trả lời của Google cho vấn đề phạm vi của float16. Nó có cùng số mũ 8-bit như float32 (cùng phạm vi, lên đến 3.4e38) nhưng chỉ có 7 bit định trị (độ chính xác thấp hơn float16). Để huấn luyện mạng nơ-ron, phạm vi quan trọng hơn độ chính xác, nên bfloat16 thường thắng.

### Why 0.1 + 0.2 != 0.3

Số 0.1 không thể được biểu diễn chính xác trong dấu phẩy động nhị phân. Trong cơ số 2, nó là một phân số lặp:

```
0.1 in binary = 0.0001100110011001100110011... (repeating forever)
```

Float32 cắt nó xuống 23 bit định trị. Giá trị được lưu xấp xỉ là 0.100000001490116. Tương tự, 0.2 được lưu xấp xỉ là 0.200000002980232. Tổng của chúng là 0.300000004470348, không phải 0.3.

```
In Python:
>>> 0.1 + 0.2
0.30000000000000004

>>> 0.1 + 0.2 == 0.3
False
```

Điều này quan trọng đối với ML vì:

1. Các so sánh mất mát như `if loss < threshold` có thể cho câu trả lời sai
2. Tích lũy nhiều giá trị nhỏ (cập nhật gradient qua hàng nghìn bước) lệch khỏi tổng thực
3. Các phép kiểm tra tổng kiểm tra và tính tái lập thất bại nếu bạn so sánh số dấu phẩy động bằng `==`

Cách khắc phục: không bao giờ so sánh số dấu phẩy động bằng `==`. Sử dụng `abs(a - b) < epsilon` hoặc `math.isclose()`.

### Catastrophic Cancellation

Khi bạn trừ hai số dấu phẩy động gần bằng nhau, các chữ số có nghĩa triệt tiêu và bạn chỉ còn nhiễu làm tròn được đẩy lên thành các chữ số đầu.

```
a = 1.0000001    (stored as 1.00000011920929 in float32)
b = 1.0000000    (stored as 1.00000000000000 in float32)

True difference:  0.0000001
Computed:         0.00000011920929

Relative error: 19.2%
```

Đó là sai số tương đối 19% từ một phép trừ duy nhất. Trong ML, điều này xảy ra bất cứ khi nào bạn:

- Tính phương sai của dữ liệu có trung bình lớn: `E[x^2] - E[x]^2` khi E[x] lớn
- Trừ các xác suất log gần bằng nhau
- Tính gradient sai phân hữu hạn với epsilon quá nhỏ

Cách khắc phục: sắp xếp lại các công thức để tránh trừ các số lớn, gần bằng nhau. Với phương sai, sử dụng thuật toán Welford hoặc đưa dữ liệu về tâm trước. Với xác suất log, làm việc trong không gian log xuyên suốt.

### Overflow and Underflow

Tràn số xảy ra khi một kết quả quá lớn để biểu diễn. Hụt dưới xảy ra khi nó quá nhỏ (gần không hơn số dương nhỏ nhất có thể biểu diễn).

```
Float32 boundaries:
  Maximum:  3.4028235e+38
  Minimum positive (normal): 1.175e-38
  Minimum positive (denorm): 1.401e-45
  Overflow:  anything > 3.4e38 becomes inf
  Underflow: anything < 1.4e-45 becomes 0.0
```

Hàm `exp()` là nguồn tràn số chính trong ML:

```
exp(88.7)  = 3.40e+38   (barely fits in float32)
exp(89.0)  = inf         (overflow)
exp(-87.3) = 1.18e-38   (barely above underflow)
exp(-104)  = 0.0         (underflow to zero)
```

Hàm `log()` gặp vấn đề ở hướng ngược lại:

```
log(0.0)   = -inf
log(-1.0)  = nan
log(1e-45) = -103.3      (fine)
log(1e-46) = -inf        (input underflowed to 0, then log(0) = -inf)
```

Trong ML, `exp()` xuất hiện trong softmax, sigmoid và các phép tính xác suất. `log()` xuất hiện trong cross-entropy, log-hợp lý và phân kỳ KL. Tổ hợp `log(exp(x))` là một bãi mìn nếu không có các thủ thuật phù hợp.

### The Log-Sum-Exp Trick

Tính trực tiếp `log(sum(exp(x_i)))` nguy hiểm về mặt số học. Nếu bất kỳ `x_i` nào lớn, `exp(x_i)` tràn số. Nếu tất cả `x_i` đều rất âm, mọi `exp(x_i)` hụt dưới về không và `log(0)` là `-inf`.

Thủ thuật: trừ giá trị lớn nhất trước khi lấy hàm mũ.

```
log(sum(exp(x_i))) = max(x) + log(sum(exp(x_i - max(x))))
```

Tại sao điều này hoạt động: sau khi trừ `max(x)`, hàm mũ lớn nhất là `exp(0) = 1`. Không thể có tràn số. Ít nhất một số hạng trong tổng là 1, nên tổng ít nhất là 1, và `log(1) = 0`. Không thể hụt dưới về `-inf`.

Chứng minh:

```
log(sum(exp(x_i)))
= log(sum(exp(x_i - c + c)))                    (add and subtract c)
= log(sum(exp(x_i - c) * exp(c)))               (exp(a+b) = exp(a)*exp(b))
= log(exp(c) * sum(exp(x_i - c)))               (factor out exp(c))
= c + log(sum(exp(x_i - c)))                    (log(a*b) = log(a) + log(b))
```

Đặt `c = max(x)` và tràn số được loại bỏ.

Thủ thuật này xuất hiện khắp nơi trong ML:
- Chuẩn hóa softmax
- Tính mất mát cross-entropy
- Cộng xác suất log trong các mô hình chuỗi
- Hỗn hợp Gaussian
- Suy luận biến phân

### Why Softmax Needs the Max-Subtraction Trick

Softmax chuyển logits thành xác suất:

```
softmax(x_i) = exp(x_i) / sum(exp(x_j))
```

Không có thủ thuật, logits [100, 101, 102] gây tràn số:

```
exp(100) = 2.69e43
exp(101) = 7.31e43
exp(102) = 1.99e44
sum      = 2.99e44

These overflow float32 (max ~3.4e38)? No, 2.69e43 < 3.4e38? Actually:
exp(88.7) is already at the float32 limit.
exp(100) = inf in float32.
```

Với thủ thuật, trừ max(x) = 102:

```
exp(100 - 102) = exp(-2) = 0.135
exp(101 - 102) = exp(-1) = 0.368
exp(102 - 102) = exp(0)  = 1.000
sum = 1.503

softmax = [0.090, 0.245, 0.665]
```

Các xác suất giống hệt nhau. Phép tính an toàn. Đây không phải một tối ưu hóa. Nó là yêu cầu để có tính đúng đắn.

### NaN and Inf: Detection and Prevention

`nan` (Không phải Số) và `inf` (vô cực) lan truyền như virus qua phép tính. Một `nan` trong cập nhật gradient làm trọng số thành `nan`, khiến mọi đầu ra sau đó thành `nan`. Huấn luyện chết trong một bước.

Cách `inf` xuất hiện:
- `exp()` của một số dương lớn
- Chia cho không: `1.0 / 0.0`
- Tràn `float32` trong các phép tích lũy

Cách `nan` xuất hiện:
- `0.0 / 0.0`
- `inf - inf`
- `inf * 0`
- `sqrt()` của một số âm
- `log()` của một số âm
- Bất kỳ phép tính số học nào có một `nan` đã tồn tại

Phát hiện:

```python
import math

math.isnan(x)       # True if x is nan
math.isinf(x)       # True if x is +inf or -inf
math.isfinite(x)    # True if x is neither nan nor inf
```

Các chiến lược phòng ngừa:

1. Chặn đầu vào của `exp()`: `exp(clamp(x, -80, 80))`
2. Thêm epsilon vào các mẫu số: `x / (y + 1e-8)`
3. Thêm epsilon bên trong `log()`: `log(x + 1e-8)`
4. Sử dụng các triển khai ổn định (log-sum-exp, softmax ổn định)
5. Cắt gradient để ngăn trọng số bùng nổ
6. Kiểm tra `nan`/`inf` sau mỗi lượt truyền xuôi khi gỡ lỗi

### Numerical Gradient Checking

Gradient giải tích (từ lan truyền ngược) có thể có lỗi. Kiểm tra gradient số xác minh chúng bằng cách tính gradient với sai phân hữu hạn.

Công thức sai phân trung tâm:

```
df/dx ~= (f(x + h) - f(x - h)) / (2h)
```

Công thức này có độ chính xác O(h^2), tốt hơn nhiều so với sai phân tiến `(f(x+h) - f(x)) / h` chỉ có độ chính xác O(h).

Chọn h: quá lớn và xấp xỉ sai. Quá nhỏ và triệt tiêu nghiêm trọng phá hủy câu trả lời. `h = 1e-5` đến `1e-7` là điển hình.

Cách kiểm tra: tính chênh lệch tương đối giữa gradient giải tích và gradient số.

```
relative_error = |grad_analytical - grad_numerical| / max(|grad_analytical|, |grad_numerical|, 1e-8)
```

Các quy tắc kinh nghiệm:
- relative_error < 1e-7: hoàn hảo, gradient đúng
- relative_error < 1e-5: chấp nhận được, có lẽ đúng
- relative_error > 1e-3: có gì đó sai
- relative_error > 1: gradient hoàn toàn sai

Luôn kiểm tra gradient khi triển khai một lớp hoặc hàm mất mát mới. PyTorch cung cấp `torch.autograd.gradcheck()` cho việc này.

### Mixed Precision Training

Các GPU hiện đại có phần cứng chuyên dụng (Tensor Core) tính phép nhân ma trận float16 nhanh hơn float32 2-8 lần. Huấn luyện độ chính xác hỗn hợp khai thác điều này:

```
1. Maintain float32 master copy of weights
2. Forward pass in float16 (fast)
3. Compute loss in float32 (prevents overflow)
4. Backward pass in float16 (fast)
5. Scale gradients to float32
6. Update float32 master weights
```

Vấn đề với huấn luyện float16 thuần: gradient thường rất nhỏ (1e-8 hoặc nhỏ hơn). Float16 làm hụt dưới bất cứ thứ gì dưới ~6e-8 về không. Mô hình ngừng học vì tất cả cập nhật gradient đều bằng không.

Cách khắc phục là điều chỉnh tỉ lệ mất mát:

```
1. Multiply loss by a large scale factor (e.g., 1024)
2. Backward pass computes gradients of (loss * 1024)
3. All gradients are 1024x larger (pushed above float16 underflow)
4. Divide gradients by 1024 before updating weights
5. Net effect: same update, but no underflow
```

Điều chỉnh tỉ lệ mất mát động tự động điều chỉnh hệ số tỉ lệ. Bắt đầu với một giá trị lớn (65536). Nếu gradient tràn thành `inf`, giảm nó một nửa. Nếu N bước trôi qua không tràn số, tăng gấp đôi nó.

### bfloat16 vs float16: Why bfloat16 Wins for Training

```
float16:   [1 sign] [5 exponent]  [10 mantissa]
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]
```

float16 có độ chính xác cao hơn (10 bit định trị so với 7) nhưng phạm vi giới hạn (tối đa ~65,504). bfloat16 có độ chính xác thấp hơn nhưng cùng phạm vi với float32 (tối đa ~3.4e38).

Đối với huấn luyện mạng nơ-ron:

- Kích hoạt và logits thường xuyên vượt 65,504 trong các đợt tăng đột biến khi huấn luyện. float16 tràn số; bfloat16 xử lý được.
- Điều chỉnh tỉ lệ mất mát là bắt buộc với float16 nhưng thường không cần với bfloat16 vì phạm vi của nó bao phủ phổ độ lớn gradient.
- bfloat16 là phép cắt đơn giản của float32: bỏ 16 bit thấp của phần định trị. Chuyển đổi đơn giản và không mất mát ở số mũ.

float16 được ưu tiên cho suy luận khi các giá trị bị chặn và độ chính xác quan trọng hơn. bfloat16 được ưu tiên cho huấn luyện khi phạm vi quan trọng hơn. Đây là lý do TPU và GPU NVIDIA hiện đại (A100, H100) hỗ trợ bfloat16 trực tiếp.

### Gradient Clipping

Gradient bùng nổ xảy ra khi gradient tăng theo hàm mũ qua nhiều lớp (phổ biến trong RNN, mạng sâu và transformer). Một gradient lớn duy nhất có thể làm hỏng tất cả trọng số trong một bước.

Hai loại cắt:

**Cắt theo giá trị:** chặn từng phần tử gradient một cách độc lập.

```
grad = clamp(grad, -max_val, max_val)
```

Đơn giản nhưng có thể thay đổi hướng của vector gradient.

**Cắt theo chuẩn:** điều chỉnh tỉ lệ toàn bộ vector gradient sao cho chuẩn của nó không vượt quá một ngưỡng.

```
if ||grad|| > max_norm:
    grad = grad * (max_norm / ||grad||)
```

Bảo toàn hướng gradient. Đây là những gì `torch.nn.utils.clip_grad_norm_()` thực hiện. Nó là lựa chọn tiêu chuẩn.

Các giá trị điển hình: `max_norm=1.0` cho transformer, `max_norm=0.5` cho RL, `max_norm=5.0` cho các mạng đơn giản hơn.

Cắt gradient không phải một mẹo chắp vá. Nó là một cơ chế an toàn. Không có nó, một batch ngoại lệ duy nhất có thể tạo ra gradient đủ lớn để phá hỏng nhiều tuần huấn luyện.

### Normalization Layers as Numerical Stabilizers

Chuẩn hóa batch, chuẩn hóa lớp và chuẩn hóa RMS thường được trình bày như các phương pháp regularization giúp huấn luyện hội tụ. Chúng cũng là các bộ ổn định số học.

Không có chuẩn hóa, các kích hoạt có thể tăng hoặc giảm theo hàm mũ qua các lớp:

```
Layer 1: values in [0, 1]
Layer 5: values in [0, 100]
Layer 10: values in [0, 10,000]
Layer 50: values in [0, inf]
```

Chuẩn hóa đưa các kích hoạt về tâm và điều chỉnh lại tỉ lệ ở mọi lớp:

```
LayerNorm(x) = (x - mean(x)) / (std(x) + epsilon) * gamma + beta
```

`epsilon` (thường là 1e-5) ngăn chia cho không khi mọi kích hoạt giống hệt nhau. Các tham số học được `gamma` và `beta` cho phép mạng khôi phục bất kỳ thang đo nào nó cần.

Điều này giữ các giá trị trong phạm vi an toàn về mặt số học xuyên suốt mạng, ngăn cả tràn số trong lượt truyền xuôi và gradient bùng nổ trong lượt truyền ngược.

### Common ML Numerical Bugs

**Lỗi: Mất mát là NaN sau vài epoch.**
Nguyên nhân: logits tăng quá lớn, softmax tràn số. Hoặc tốc độ học quá cao và trọng số phân kỳ.
Cách sửa: sử dụng softmax ổn định (trừ giá trị lớn nhất), giảm tốc độ học, thêm cắt gradient.

**Lỗi: Mất mát bị kẹt tại log(num_classes).**
Nguyên nhân: đầu ra mô hình là các xác suất gần đều. Thường có nghĩa là gradient đang tiêu biến hoặc mô hình hoàn toàn không học.
Cách sửa: kiểm tra nhãn dữ liệu đúng, xác minh hàm mất mát, kiểm tra các ReLU chết.

**Lỗi: Độ chính xác xác thực thấp hơn kỳ vọng 1-3%.**
Nguyên nhân: độ chính xác hỗn hợp không có điều chỉnh tỉ lệ mất mát phù hợp. Gradient hụt dưới âm thầm đặt các cập nhật nhỏ về không.
Cách sửa: bật điều chỉnh tỉ lệ mất mát động, hoặc chuyển sang bfloat16.

**Lỗi: Chuẩn gradient là 0.0 đối với một số lớp.**
Nguyên nhân: các nơ-ron ReLU chết (mọi đầu vào âm), hoặc float16 hụt dưới.
Cách sửa: sử dụng LeakyReLU hoặc GELU, sử dụng điều chỉnh tỉ lệ gradient, kiểm tra khởi tạo trọng số.

**Lỗi: Mô hình hoạt động trên một GPU nhưng cho kết quả khác trên GPU khác.**
Nguyên nhân: thứ tự tích lũy dấu phẩy động không tất định. Các phép rút gọn song song GPU lấy tổng theo thứ tự khác nhau trên phần cứng khác nhau, và phép cộng dấu phẩy động không có tính kết hợp.
Cách sửa: chấp nhận các khác biệt nhỏ (1e-6), hoặc đặt `torch.use_deterministic_algorithms(True)` và chấp nhận đánh đổi tốc độ.

**Lỗi: `exp()` trả về `inf` khi tính mất mát.**
Nguyên nhân: logits thô được truyền vào `exp()` mà không có thủ thuật trừ giá trị lớn nhất.
Cách sửa: sử dụng `torch.nn.functional.log_softmax()` triển khai log-sum-exp nội bộ.

**Lỗi: Huấn luyện phân kỳ sau khi chuyển từ float32 sang float16.**
Nguyên nhân: float16 không thể biểu diễn độ lớn gradient dưới 6e-8 hoặc kích hoạt trên 65,504.
Cách sửa: sử dụng độ chính xác hỗn hợp với điều chỉnh tỉ lệ mất mát (AMP), hoặc thay bằng bfloat16.

```figure
logsumexp-stability
```

## Build It

### Step 1: Demonstrate floating point precision limits

```python
print("=== Floating Point Precision ===")
print(f"0.1 + 0.2 = {0.1 + 0.2}")
print(f"0.1 + 0.2 == 0.3? {0.1 + 0.2 == 0.3}")
print(f"Difference: {(0.1 + 0.2) - 0.3:.2e}")
```

### Step 2: Implement naive vs stable softmax

```python
import math

def softmax_naive(logits):
    exps = [math.exp(z) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

def softmax_stable(logits):
    max_logit = max(logits)
    exps = [math.exp(z - max_logit) for z in logits]
    total = sum(exps)
    return [e / total for e in exps]

safe_logits = [2.0, 1.0, 0.1]
print(f"Naive:  {softmax_naive(safe_logits)}")
print(f"Stable: {softmax_stable(safe_logits)}")

dangerous_logits = [100.0, 101.0, 102.0]
print(f"Stable: {softmax_stable(dangerous_logits)}")
# softmax_naive(dangerous_logits) would return [nan, nan, nan]
```

### Step 3: Implement stable log-sum-exp

```python
def logsumexp_naive(values):
    return math.log(sum(math.exp(v) for v in values))

def logsumexp_stable(values):
    c = max(values)
    return c + math.log(sum(math.exp(v - c) for v in values))

safe = [1.0, 2.0, 3.0]
print(f"Naive:  {logsumexp_naive(safe):.6f}")
print(f"Stable: {logsumexp_stable(safe):.6f}")

large = [500.0, 501.0, 502.0]
print(f"Stable: {logsumexp_stable(large):.6f}")
# logsumexp_naive(large) returns inf
```

### Step 4: Implement stable cross-entropy

```python
def cross_entropy_naive(true_class, logits):
    probs = softmax_naive(logits)
    return -math.log(probs[true_class])

def cross_entropy_stable(true_class, logits):
    max_logit = max(logits)
    shifted = [z - max_logit for z in logits]
    log_sum_exp = math.log(sum(math.exp(s) for s in shifted))
    log_prob = shifted[true_class] - log_sum_exp
    return -log_prob

logits = [2.0, 5.0, 1.0]
true_class = 1
print(f"Naive:  {cross_entropy_naive(true_class, logits):.6f}")
print(f"Stable: {cross_entropy_stable(true_class, logits):.6f}")
```

### Step 5: Gradient checking

```python
def numerical_gradient(f, x, h=1e-5):
    grad = []
    for i in range(len(x)):
        x_plus = x[:]
        x_minus = x[:]
        x_plus[i] += h
        x_minus[i] -= h
        grad.append((f(x_plus) - f(x_minus)) / (2 * h))
    return grad

def check_gradient(analytical, numerical, tolerance=1e-5):
    for i, (a, n) in enumerate(zip(analytical, numerical)):
        denom = max(abs(a), abs(n), 1e-8)
        rel_error = abs(a - n) / denom
        status = "OK" if rel_error < tolerance else "FAIL"
        print(f"  param {i}: analytical={a:.8f} numerical={n:.8f} "
              f"rel_error={rel_error:.2e} [{status}]")

def f(params):
    x, y = params
    return x**2 + 3*x*y + y**3

def f_grad(params):
    x, y = params
    return [2*x + 3*y, 3*x + 3*y**2]

point = [2.0, 1.0]
analytical = f_grad(point)
numerical = numerical_gradient(f, point)
check_gradient(analytical, numerical)
```

## Use It

### Mixed precision simulation

```python
import struct

def float32_to_float16_round(x):
    packed = struct.pack('f', x)
    f32 = struct.unpack('f', packed)[0]
    packed16 = struct.pack('e', f32)
    return struct.unpack('e', packed16)[0]

def simulate_bfloat16(x):
    packed = struct.pack('f', x)
    as_int = int.from_bytes(packed, 'little')
    truncated = as_int & 0xFFFF0000
    repacked = truncated.to_bytes(4, 'little')
    return struct.unpack('f', repacked)[0]
```

### Gradient clipping

```python
def clip_by_norm(gradients, max_norm):
    total_norm = math.sqrt(sum(g**2 for g in gradients))
    if total_norm > max_norm:
        scale = max_norm / total_norm
        return [g * scale for g in gradients]
    return gradients

grads = [10.0, 20.0, 30.0]
clipped = clip_by_norm(grads, max_norm=5.0)
print(f"Original norm: {math.sqrt(sum(g**2 for g in grads)):.2f}")
print(f"Clipped norm:  {math.sqrt(sum(g**2 for g in clipped)):.2f}")
print(f"Direction preserved: {[c/clipped[0] for c in clipped]} == {[g/grads[0] for g in grads]}")
```

### NaN/Inf detection

```python
def check_tensor(name, values):
    has_nan = any(math.isnan(v) for v in values)
    has_inf = any(math.isinf(v) for v in values)
    if has_nan or has_inf:
        print(f"WARNING {name}: nan={has_nan} inf={has_inf}")
        return False
    return True

check_tensor("good", [1.0, 2.0, 3.0])
check_tensor("bad",  [1.0, float('nan'), 3.0])
check_tensor("ugly", [1.0, float('inf'), 3.0])
```

Xem `code/numerical.py` để có các triển khai hoàn chỉnh minh họa mọi trường hợp biên.

## Ship It

Bài học này tạo ra:
- `code/numerical.py` với softmax ổn định, log-sum-exp, cross-entropy, kiểm tra gradient và mô phỏng độ chính xác hỗn hợp
- `outputs/prompt-numerical-debugger.md` để chẩn đoán NaN/Inf và các vấn đề số học trong huấn luyện

Các triển khai ổn định này xuất hiện lại ở Giai đoạn 3 khi xây dựng vòng lặp huấn luyện và ở Giai đoạn 4 khi triển khai các cơ chế attention.

## Exercises

1. **Triệt tiêu nghiêm trọng.** Tính phương sai của [1000000.0, 1000001.0, 1000002.0] bằng công thức ngây thơ `E[x^2] - E[x]^2` trong float32. Sau đó tính bằng thuật toán trực tuyến Welford. So sánh các sai số với phương sai thực (0.6667).

2. **Săn độ chính xác.** Tìm giá trị float32 dương nhỏ nhất `x` sao cho `1.0 + x == 1.0` trong Python. Đây là epsilon máy. Xác minh nó khớp với `numpy.finfo(numpy.float32).eps`.

3. **Các trường hợp biên log-sum-exp.** Kiểm tra hàm `logsumexp_stable` với: (a) mọi giá trị bằng nhau, (b) một giá trị lớn hơn phần còn lại rất nhiều, (c) mọi giá trị rất âm (-1000). Xác minh nó cho kết quả đúng ở nơi phiên bản ngây thơ thất bại.

4. **Kiểm tra gradient một lớp mạng nơ-ron.** Triển khai một lớp tuyến tính đơn `y = Wx + b` và lượt truyền ngược giải tích của nó. Sử dụng `numerical_gradient` để xác minh tính đúng đắn cho một ma trận trọng số 3x2.

5. **Thí nghiệm điều chỉnh tỉ lệ mất mát.** Mô phỏng huấn luyện với float16: tạo các gradient ngẫu nhiên trong khoảng [1e-9, 1e-3], chuyển sang float16 và đo tỉ lệ trở thành không. Sau đó áp dụng điều chỉnh tỉ lệ mất mát (nhân với 1024), chuyển sang float16, đưa tỉ lệ trở lại và đo lại tỉ lệ bằng không.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| IEEE 754 | "Tiêu chuẩn số dấu phẩy động" | Tiêu chuẩn quốc tế xác định các định dạng dấu phẩy động nhị phân, quy tắc làm tròn và giá trị đặc biệt (inf, nan). Mọi CPU và GPU hiện đại đều triển khai nó. |
| Machine epsilon (Epsilon máy) | "Giới hạn độ chính xác" | Giá trị e nhỏ nhất sao cho 1.0 + e != 1.0 trong một định dạng dấu phẩy động cho trước. Với float32, nó khoảng 1.19e-7. |
| Catastrophic cancellation (Triệt tiêu nghiêm trọng) | "Mất độ chính xác do phép trừ" | Khi trừ các số dấu phẩy động gần bằng nhau, các chữ số có nghĩa triệt tiêu và nhiễu làm tròn chi phối kết quả. |
| Overflow (Tràn số) | "Số quá lớn" | Một kết quả vượt giá trị lớn nhất có thể biểu diễn và trở thành inf. exp(89) làm tràn float32. |
| Underflow (Hụt dưới) | "Số quá nhỏ" | Một kết quả gần không hơn số dương nhỏ nhất có thể biểu diễn và trở thành 0.0. exp(-104) làm hụt dưới float32. |
| Log-sum-exp trick (Thủ thuật log-sum-exp) | "Trừ giá trị lớn nhất trước" | Tính log(sum(exp(x))) bằng cách đưa exp(max(x)) ra làm nhân tử chung để ngăn tràn số và hụt dưới. Được sử dụng trong softmax, cross-entropy và toán xác suất log. |
| Stable softmax (Softmax ổn định) | "Softmax không bùng nổ" | Trừ max(logits) trước khi lấy hàm mũ. Kết quả giống hệt về mặt số học, không thể tràn số. |
| Gradient checking (Kiểm tra gradient) | "Xác minh lan truyền ngược của bạn" | So sánh gradient giải tích từ lan truyền ngược với gradient số từ sai phân hữu hạn để phát hiện lỗi triển khai. |
| Mixed precision (Độ chính xác hỗn hợp) | "Float16 truyền xuôi, float32 truyền ngược" | Sử dụng số dấu phẩy động độ chính xác thấp hơn cho các phép toán cần tốc độ và độ chính xác cao hơn cho các phép toán nhạy về số học. Mức tăng tốc điển hình là 2-3 lần. |
| Loss scaling (Điều chỉnh tỉ lệ mất mát) | "Ngăn gradient hụt dưới" | Nhân mất mát với một hằng số lớn trước lan truyền ngược để gradient nằm trong phạm vi biểu diễn của float16, rồi chia cho cùng hằng số trước các cập nhật trọng số. |
| bfloat16 | "Dấu phẩy động bộ não" | Định dạng 16-bit của Google với 8 bit số mũ (cùng phạm vi với float32) và 7 bit định trị (độ chính xác thấp hơn float16). Được ưu tiên cho huấn luyện. |
| Gradient clipping (Cắt gradient) | "Chặn chuẩn gradient" | Điều chỉnh tỉ lệ vector gradient để chuẩn của nó không vượt quá một ngưỡng. Ngăn gradient bùng nổ phá hỏng trọng số. |
| NaN | "Không phải Số" | Giá trị dấu phẩy động đặc biệt từ các phép toán không xác định (0/0, inf-inf, sqrt(-1)). Lan truyền qua tất cả các phép tính số học sau đó. |
| Inf | "Vô cực" | Giá trị dấu phẩy động đặc biệt từ tràn số hoặc chia cho không. Có thể kết hợp tạo ra NaN (inf - inf, inf * 0). |
| Numerical gradient (Gradient số) | "Đạo hàm vét cạn" | Xấp xỉ một đạo hàm bằng cách tính f(x+h) và f(x-h) rồi chia cho 2h. Chậm nhưng đáng tin cậy để xác minh. |

## Further Reading

- [What Every Computer Scientist Should Know About Floating-Point Arithmetic (Goldberg 1991)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) -- tài liệu tham khảo chuẩn mực, dày đặc nhưng đầy đủ
- [Mixed Precision Training (Micikevicius et al., 2018)](https://arxiv.org/abs/1710.03740) -- bài báo NVIDIA giới thiệu điều chỉnh tỉ lệ mất mát cho huấn luyện float16
- [AMP: Automatic Mixed Precision (PyTorch docs)](https://pytorch.org/docs/stable/amp.html) -- hướng dẫn thực hành về độ chính xác hỗn hợp trong PyTorch
- [bfloat16 format (Google Cloud TPU docs)](https://cloud.google.com/tpu/docs/bfloat16) -- tại sao Google chọn định dạng này cho TPU
- [Kahan Summation (Wikipedia)](https://en.wikipedia.org/wiki/Kahan_summation_algorithm) -- thuật toán giảm sai số làm tròn trong các tổng dấu phẩy động
