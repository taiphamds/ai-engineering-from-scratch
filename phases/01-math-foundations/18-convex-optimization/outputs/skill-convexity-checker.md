---
name: skill-convexity-checker
description: Determine if an optimization problem is convex and choose the right solver
version: 1.0.0
phase: 1
lesson: 18
tags: [optimization, convexity, solvers]
---

# Convexity Checker

Cách xác minh một bài toán tối ưu hóa có lồi hay không, và làm gì với câu trả lời.

## Decision Checklist

1. Hàm mục tiêu có lồi không? (Kiểm tra tính nửa xác định dương của Hessian hoặc sử dụng các quy tắc hợp thành.)
2. Tất cả các ràng buộc bất đẳng thức có dạng g_i(x) <= 0 trong đó mỗi g_i lồi không?
3. Tất cả các ràng buộc đẳng thức có affine (tuyến tính) không?
4. Nếu cả ba đều có, bài toán lồi. Sử dụng một bộ giải lồi với bảo đảm hội tụ.
5. Nếu có bất kỳ câu nào không, bài toán không lồi. Sử dụng SGD/Adam và chấp nhận các nghiệm tối ưu cục bộ.

## How to test convexity of a function

| Phép kiểm tra | Áp dụng cho | Phương pháp |
|---|---|---|
| Đạo hàm bậc hai >= 0 | Các hàm vô hướng f(x) | Tính f''(x). Nếu f''(x) >= 0 với mọi x, lồi. |
| Hessian là PSD | Các hàm đa biến f(x) | Tính H(x). Nếu mọi giá trị riêng >= 0 ở mọi nơi, lồi. |
| Kiểm tra định nghĩa | Bất kỳ hàm nào | Kiểm tra f(tx + (1-t)y) <= t*f(x) + (1-t)*f(y) với các x, y, t được lấy mẫu. |
| Quy tắc hợp thành | Các hàm hợp | Xem bảng hợp thành bên dưới. |
| Hạn chế trên một đường thẳng | f đa biến | f lồi khi và chỉ khi g(t) = f(x + tv) lồi theo t với mọi x, v. |

## Composition rules (preserving convexity)

| Phép toán | Kết quả |
|---|---|
| f + g (cả hai lồi) | Lồi |
| c * f (c > 0, f lồi) | Lồi |
| max(f, g) (cả hai lồi) | Lồi |
| f(Ax + b) trong đó f lồi | Lồi |
| g(f(x)) trong đó g lồi không giảm và f lồi | Lồi |
| g(f(x)) trong đó g lồi không tăng và f lõm | Lồi |
| tổng các hàm lồi | Lồi |
| supremum theo từng điểm của các hàm lồi | Lồi |

## Common ML objectives: convex or not?

| Mục tiêu | Lồi? | Lý do |
|---|---|---|
| MSE: (1/n) sum(y - Xw)^2 | Có | Bậc hai theo w, Hessian = (2/n) X^T X là PSD |
| Mất mát logistic: sum(log(1 + exp(-y_i * w^T x_i))) | Có | Tổng các hàm lồi (họ log-sum-exp) |
| Mất mát hinge: sum(max(0, 1 - y_i * w^T x_i)) | Có | Cực đại của các hàm lồi (tuyến tính) |
| L2 regularization: lambda * \|\|w\|\|^2 | Có | Bậc hai, Hessian = 2*lambda*I |
| L1 regularization: lambda * \|\|w\|\|_1 | Có | Tổng các giá trị tuyệt đối (lồi nhưng không khả vi) |
| Hồi quy ridge: MSE + L2 | Có | Tổng hai hàm lồi |
| LASSO: MSE + L1 | Có | Tổng hai hàm lồi |
| Elastic net: MSE + L1 + L2 | Có | Tổng các hàm lồi |
| SVM (gốc): hinge + L2 | Có | Tổng các hàm lồi |
| Cross-entropy với softmax | Có (theo logits) | Log-sum-exp lồi |
| Mạng nơ-ron (bất kỳ mất mát nào) | Không | Các kích hoạt phi tuyến tạo phép hợp thành không lồi |
| Mục tiêu k-means | Không | Bước gán rời rạc |
| Phân tích ma trận thành nhân tử: \|\|X - UV^T\|\|^2 | Không | Song tuyến tính theo U và V |
| Mất mát GAN | Không | Minimax, không lồi theo bộ sinh |
| Mất mát tương phản (InfoNCE) | Không | Log của tỉ số các hàm mũ với các mẫu âm |

## Solver selection based on convexity

| Loại bài toán | Bộ giải | Bảo đảm hội tụ |
|---|---|---|
| Lồi, trơn, không ràng buộc | Gradient descent | O(1/k) đến cực tiểu toàn cục |
| Lồi, trơn, không ràng buộc | L-BFGS | Siêu tuyến tính đến cực tiểu toàn cục |
| Lồi, trơn, không ràng buộc | Phương pháp Newton | Bậc hai gần cực tiểu (nếu Hessian tính được) |
| Lồi, trơn, có ràng buộc | Phương pháp điểm trong | Thời gian đa thức |
| Lồi, không trơn (L1) | Gradient proximal / ISTA | O(1/k) đến cực tiểu toàn cục |
| Lồi, không trơn (L1) | ADMM | Linh hoạt, xử lý ràng buộc |
| Lồi, bậc hai | Gradient liên hợp | Chính xác trong n bước |
| Không lồi, trơn | SGD / Adam | Hội tụ đến cực tiểu cục bộ |
| Không lồi, trơn | SGD + khởi động lại | Trung bình cực tiểu cục bộ tốt hơn |
| Không lồi, trơn | Thừa tham số + SGD | Cực tiểu phẳng, tổng quát hóa tốt |

## Common mistakes

- Giả định một bài toán lồi vì hàm mất mát lồi. Mất mát phải lồi theo các tham số bạn đang tối ưu. Cross-entropy lồi theo logits, nhưng toàn bộ ánh xạ mạng nơ-ron từ đầu vào đến logits không lồi.
- Sử dụng phương pháp Newton trên một bài toán không lồi. Hessian có thể có các giá trị riêng âm, khiến Newton di chuyển về các điểm yên ngựa hoặc cực đại thay vì cực tiểu.
- Quên rằng L1 regularization làm mục tiêu không khả vi tại không. Gradient descent tiêu chuẩn không hoạt động tốt. Sử dụng gradient descent proximal hoặc các phương pháp dưới gradient.
- Bình phương số điều kiện bằng cách tạo A^T A. Nếu bạn cần giải một bài toán bình phương tối thiểu và A có điều kiện kém, sử dụng QR hoặc SVD thay vì các phương trình chuẩn.
- Tuyên bố một bài toán không lồi mà không kiểm tra. Nhiều bài toán ML (mô hình tuyến tính, SVM, hồi quy logistic) lồi và hưởng lợi từ các bộ giải mạnh hơn.

## Quick test: is my problem convex?

```
1. Write out the objective: minimize f(w) subject to constraints
2. For each term in f(w):
   - Is it quadratic with PSD matrix? -> Convex
   - Is it a norm? -> Convex
   - Is it log-sum-exp? -> Convex
   - Does it involve w nonlinearly (sigmoid(w), w1*w2)? -> Likely non-convex
3. Are all constraints linear or convex inequalities?
4. If ALL terms are convex and constraints are convex/linear -> problem is convex
5. If ANY term is non-convex -> problem is non-convex
```
