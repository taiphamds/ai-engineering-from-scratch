---
name: skill-information-theory
description: Apply information theory concepts to ML loss functions, model evaluation, and feature selection
version: 1.0.0
phase: 1
lesson: 9
tags: [information-theory, entropy, loss-functions]
---

# Information Theory for ML

Khi nào sử dụng entropy, cross-entropy, phân kỳ KL và thông tin tương hỗ trong các hệ thống học máy.

## Decision Checklist

1. Đo sự không chắc chắn trong một phân phối đơn lẻ? Sử dụng **entropy**.
2. Đo mức độ một mô hình xấp xỉ các nhãn thực? Sử dụng **cross-entropy** (đây là mất mát phân loại của bạn).
3. Đo khoảng cách giữa hai phân phối? Sử dụng **phân kỳ KL**.
4. Kiểm tra xem hai biến có liên quan không? Sử dụng **thông tin tương hỗ**.
5. Báo cáo chất lượng mô hình ngôn ngữ? Sử dụng **perplexity** (hàm mũ của cross-entropy).
6. Chưng cất một mô hình vào một mô hình khác? Tối thiểu hóa **phân kỳ KL** từ thầy sang trò.

## When to use each measure

| Thước đo | Công thức | Trường hợp sử dụng | Ứng dụng ML |
|---|---|---|---|
| Entropy H(P) | -sum(p log p) | Phân phối này không chắc chắn đến mức nào? | Độ phức tạp dữ liệu, các mô hình entropy cực đại |
| Cross-entropy H(P,Q) | -sum(p log q) | Mô hình Q dự đoán P thực tốt đến mức nào? | Mất mát phân loại, mất mát mô hình ngôn ngữ |
| Phân kỳ KL D(P\|\|Q) | sum(p log(p/q)) | P và Q khác nhau đến mức nào? | Mất mát VAE (ELBO), chưng cất tri thức, RLHF |
| Thông tin tương hỗ I(X;Y) | H(X) - H(X\|Y) | Y cho chúng ta biết bao nhiêu về X? | Lựa chọn đặc trưng, học biểu diễn |
| Perplexity | exp(H(P,Q)) hoặc 2^H | Mô hình bối rối đến mức nào? | Đánh giá mô hình ngôn ngữ |
| Entropy có điều kiện H(X\|Y) | -sum(p(x,y) log p(x\|y)) | Sự không chắc chắn còn lại trong X sau khi biết Y | Mức độ cung cấp thông tin của đặc trưng |

## Key relationships

```
Cross-entropy  = Entropy + KL divergence
H(P, Q)        = H(P)   + D_KL(P || Q)

Since H(P) is constant during training:
  Minimizing cross-entropy = Minimizing KL divergence

Mutual information = Entropy - Conditional entropy
I(X; Y) = H(X) - H(X|Y) = H(Y) - H(Y|X)

Perplexity = exp(cross-entropy in nats)
           = 2^(cross-entropy in bits)
```

## Quick reference: formulas and units

| Công thức | Bit (log cơ số 2) | Nat (log cơ số e) |
|---|---|---|
| Thông tin: -log(p) | -log2(p) | -ln(p) |
| Entropy: -sum(p log p) | bit | nat |
| 1 nat = | 1.4427 bit | 1 nat |
| Mặc định PyTorch | -- | nat |
| Các bài báo lý thuyết thông tin | bit | -- |

## Interpreting values

| Giá trị entropy | Ý nghĩa |
|---|---|
| 0 | Tất định. Một kết quả có xác suất 1. |
| log(n) | Sự không chắc chắn lớn nhất. Phân phối đều trên n kết quả. |
| Thấp | Phân phối có đỉnh nhọn. Mô hình tự tin. |
| Cao | Phân phối phẳng. Mô hình không chắc chắn. |

| Giá trị perplexity | Chất lượng mô hình ngôn ngữ |
|---|---|
| 1 | Dự đoán hoàn hảo (không bao giờ xảy ra trong thực tế) |
| 10 | Trung bình lựa chọn giữa ~10 token có khả năng như nhau |
| 50 | Mức GPT-2 trên các chuẩn đánh giá tiêu chuẩn |
| < 10 | Tiên tiến nhất cho các miền được biểu diễn tốt |

## Common mistakes

- Tính phân kỳ KL và xem nó là đối xứng. D_KL(P||Q) != D_KL(Q||P). Để có một thước đo đối xứng, sử dụng phân kỳ Jensen-Shannon: JS = 0.5 * KL(P||M) + 0.5 * KL(Q||M) trong đó M = 0.5*(P+Q).
- Quên rằng cross-entropy với các nhãn one-hot đơn giản thành -log(p_true_class). Bạn không cần lấy tổng trên tất cả các lớp khi phân phối thực là one-hot.
- Sử dụng log cơ số 2 trong mã nhưng báo cáo nat (hoặc ngược lại). PyTorch sử dụng log tự nhiên theo mặc định. Nhân với log2(e) = 1.4427 để chuyển nat thành bit.
- Tính entropy của một biến cố rỗng hoặc có xác suất bằng không. Quy ước: 0 * log(0) = 0, vì lim(p->0) p*log(p) = 0.
- So sánh perplexity giữa các từ vựng khác nhau. Một mô hình có kích thước từ vựng 50k và perplexity 30 không thể được so sánh trực tiếp với một mô hình có kích thước từ vựng 10k và perplexity 30.

## Where each concept appears in production ML

| Khái niệm | Nơi bạn thấy nó |
|---|---|
| Mất mát cross-entropy | Mọi mô hình phân loại (nn.CrossEntropyLoss) |
| Phân kỳ KL | VAE ELBO, cắt PPO, chưng cất tri thức |
| Entropy regularization | Phần thưởng khám phá trong RL (entropy cao hơn = khám phá nhiều hơn) |
| Thông tin tương hỗ | Lựa chọn đặc trưng, mất mát InfoNCE (học tương phản) |
| Perplexity | Các chuẩn đánh giá mô hình ngôn ngữ (thấp hơn = tốt hơn) |
| Làm trơn nhãn | Thay thế one-hot bằng các mục tiêu mềm, giảm sự quá tự tin của cross-entropy |
| Điều chỉnh nhiệt độ | Chia logits cho T trước softmax, điều khiển entropy của đầu ra |
