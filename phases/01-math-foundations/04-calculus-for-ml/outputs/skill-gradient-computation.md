---
name: skill-gradient-computation
description: Compute gradients of common ML loss functions and choose the right derivative approach
version: 1.0.0
phase: 1
lesson: 4
tags: [calculus, gradients, backpropagation]
---

# Gradient Computation for ML

Tài liệu tham khảo thực hành để tính gradient của các hàm mất mát, hàm kích hoạt và phép toán lớp được sử dụng trong mạng nơ-ron.

## Decision Checklist

1. Hàm có được hợp thành từ các phép cơ bản đơn giản (lũy thừa, exp, log, lượng giác) không? Sử dụng đạo hàm giải tích và quy tắc dây chuyền.
2. Hàm có phải một phép toán tùy chỉnh hoặc hộp đen không? Sử dụng vi phân số: `(f(x+h) - f(x-h)) / (2h)` với h = 1e-7.
3. Hàm có được xây dựng từ các phép toán tensor trong PyTorch/JAX không? Để autograd xử lý nó. Xác minh bằng kiểm tra số.
4. Bạn có cần gradient của một mất mát vô hướng theo một ma trận trọng số không? Áp dụng quy tắc dây chuyền qua đồ thị tính toán, từng nút một.
5. Có phép toán không khả vi (argmax, làm tròn, lấy mẫu) không? Sử dụng bộ ước lượng straight-through hoặc thủ thuật tái tham số hóa.

## When to use each approach

| Cách tiếp cận | Khi nào sử dụng | Chi phí |
|---|---|---|
| Giải tích (suy ra bằng tay) | Các hàm đơn giản, xác minh đầu ra autograd | Không tốn chi phí lúc chạy |
| Số (sai phân hữu hạn) | Gỡ lỗi, kiểm tra gradient, các hàm hộp đen | 2n lượt truyền xuôi cho n tham số |
| Vi phân tự động | Bất kỳ đồ thị tính toán khả vi nào (mặc định) | Một lượt truyền ngược |
| Ký hiệu (SymPy, Mathematica) | Suy ra gradient dạng đóng cho các bài báo | Chỉ lúc biên dịch |

## Quick reference: common derivatives

| Hàm | f(x) | f'(x) | Ngữ cảnh ML |
|---|---|---|---|
| Mất mát MSE | (1/n) sum(y_hat - y)^2 | (2/n)(y_hat - y) | Hồi quy |
| Cross-entropy (nhị phân) | -(y log(p) + (1-y) log(1-p)) | p - y (sau sigmoid) | Phân loại nhị phân |
| Cross-entropy (đa lớp) | -log(p_true_class) | p - one_hot(y) (sau softmax) | Phân loại đa lớp |
| Sigmoid | 1 / (1 + e^(-x)) | sigma(x) * (1 - sigma(x)) | Các cổng đầu ra, đầu ra nhị phân |
| Tanh | (e^x - e^(-x)) / (e^x + e^(-x)) | 1 - tanh(x)^2 | Các kích hoạt ẩn (kiểu cũ) |
| ReLU | max(0, x) | 1 nếu x > 0, 0 nếu x < 0 | Kích hoạt ẩn mặc định |
| Leaky ReLU | max(0.01x, x) | 1 nếu x > 0, 0.01 nếu x < 0 | Tránh các nơ-ron chết |
| GELU | x * Phi(x) | Phi(x) + x * phi(x) | Transformer |
| Softmax_i | e^(x_i) / sum(e^(x_j)) | s_i(1 - s_i) khi i=j, -s_i*s_j khi i!=j | Lớp đầu ra (Jacobian) |
| Log-softmax | x_i - log(sum(e^(x_j))) | 1 - softmax(x_i) cho phần tử thứ i | CE ổn định về mặt số học |
| Lớp tuyến tính | y = Wx + b | dL/dW = dL/dy * x^T, dL/db = dL/dy | Mọi lớp |
| L2 regularization | lambda * sum(w^2) | 2 * lambda * w | Suy giảm trọng số |
| L1 regularization | lambda * sum(\|w\|) | lambda * sign(w) | Tính thưa |

## Common mistakes

- Quên hệ số 1/n trong các hàm mất mát lấy trung bình theo batch (MSE, cross-entropy). Gradient được nhân tỉ lệ theo kích thước batch.
- Tính gradient softmax dưới dạng một vector khi nó thực ra là một ma trận Jacobian. Với cross-entropy + softmax kết hợp, gradient đơn giản thành (p - y), tránh được Jacobian đầy đủ.
- Áp dụng quy tắc dây chuyền sai thứ tự. Làm ngược từ mất mát: dL/dW = dL/dy * dy/dW.
- Sử dụng h quá lớn (h = 0.1) hoặc quá nhỏ (h = 1e-15) cho đạo hàm số. Giữ h = 1e-7 cho float64.
- Quên rằng ReLU có gradient không xác định tại đúng x = 0. Trong thực tế, đặt nó thành 0 hoặc 0.5.

## Gradient checking recipe

```
For each parameter w:
  numeric_grad = (loss(w + h) - loss(w - h)) / (2h)
  auto_grad = backward pass value
  relative_error = |numeric - auto| / max(|numeric|, |auto|, 1e-8)
  assert relative_error < 1e-5
```

Sai số tương đối trên 1e-3 nghĩa là có gì đó sai. Giữa 1e-5 và 1e-3, hãy điều tra.
