---
name: skill-sampling-strategy
description: Choose the right sampling method for generation, estimation, or inference
version: 1.0.0
phase: 1
lesson: 16
tags: [sampling, mcmc, generation]
---

# Sampling Strategy Selection

Cách chọn phương pháp lấy mẫu phù hợp cho sinh văn bản, suy luận Bayes, ước lượng Monte Carlo và huấn luyện.

## Decision Checklist

1. Bạn đang sinh đầu ra (văn bản, hình ảnh) hay ước lượng một đại lượng (tích phân, kỳ vọng)?
2. Bạn có thể lấy mẫu trực tiếp từ phân phối mục tiêu hay chỉ tính mật độ của nó?
3. Phân phối mục tiêu rời rạc hay liên tục?
4. Không gian mẫu có số chiều nào? Thấp (< 5), trung bình (5-100) hay cao (> 100)?
5. Bạn cần các mẫu chính xác hay xấp xỉ?
6. Bạn có cần gradient qua phép lấy mẫu không?

## When to use each method

| Phương pháp | Khi nào sử dụng | Độ phức tạp | Chính xác? |
|---|---|---|---|
| Lấy mẫu trực tiếp | Bạn có CDF hoặc có thể sử dụng một hàm thư viện | O(1) mỗi mẫu | Có |
| CDF ngược | Biết nghịch đảo CDF dạng đóng (mũ, Cauchy) | O(1) mỗi mẫu | Có |
| Box-Muller | Cần các mẫu chuẩn mà không có thư viện | O(1) mỗi mẫu | Có |
| Lấy mẫu loại bỏ | Có thể tính PDF mục tiêu, số chiều thấp (1-3) | O(1/acceptance) mỗi mẫu | Có |
| Lấy mẫu quan trọng | Cần kỳ vọng, không phải các mẫu riêng lẻ | O(n) cho n mẫu | Xấp xỉ |
| Lấy mẫu phân tầng | Ước lượng Monte Carlo, muốn phương sai thấp hơn | O(n) cho n mẫu | Xấp xỉ |
| Metropolis-Hastings | Nhiều chiều, có thể tính mật độ chưa chuẩn hóa | O(1) mỗi bước + burn-in | Tiệm cận |
| Lấy mẫu Gibbs | Có thể lấy mẫu từ mỗi phân phối có điều kiện | O(d) mỗi lượt quét đầy đủ | Tiệm cận |
| HMC/NUTS | Liên tục nhiều chiều, mật độ trơn | O(L * d) mỗi bước | Tiệm cận |
| Lấy mẫu temperature | Sinh văn bản LLM, điều khiển tính sáng tạo | O(V) cho kích thước từ vựng V | N/A |
| Lấy mẫu top-k | Sinh LLM, loại các token ít có khả năng | O(V log k) | N/A |
| Top-p (nucleus) | Sinh LLM, tập ứng viên thích nghi | O(V log V) | N/A |
| Tái tham số hóa | Cần gradient qua lấy mẫu Gaussian (VAE) | O(d) | Có |
| Gumbel-Softmax | Cần gradient qua lấy mẫu categorical | O(k) cho k lớp | Xấp xỉ |

## LLM generation settings

| Trường hợp sử dụng | Temperature | Top-p | Top-k | Ghi chú |
|---|---|---|---|---|
| Hỏi đáp dựa trên sự kiện | 0.0 (tham lam) | -- | -- | Tất định, không ngẫu nhiên |
| Sinh mã | 0.2-0.5 | 0.9 | -- | Ít sáng tạo, mạch lạc cao |
| Trò chuyện chung | 0.7 | 0.9 | -- | Cân bằng |
| Viết sáng tạo | 0.9-1.2 | 0.95 | -- | Đa dạng cao hơn |
| Động não | 1.0-1.5 | 0.95 | -- | Đa dạng tối đa, có thể mất mạch lạc |

Temperature và top-p có thể kết hợp. Áp dụng temperature trước (điều chỉnh tỉ lệ logits), rồi áp dụng lọc top-p.

## MCMC method selection

| Tính chất | Metropolis-Hastings | Gibbs | HMC/NUTS |
|---|---|---|---|
| Số chiều | Bất kỳ | Bất kỳ (tốt nhất < 100) | Cao (100+) |
| Cần các phân phối có điều kiện | Không | Có | Không |
| Cần gradient | Không | Không | Có |
| Tỉ lệ chấp nhận | Điều chỉnh đến ~23% | Luôn 100% | Điều chỉnh đến ~65% |
| Tương quan | Cao (bước đi ngẫu nhiên) | Vừa phải | Thấp |
| Burn-in | Dài | Vừa phải | Ngắn |
| Tốt nhất cho | Khám phá, các mô hình đơn giản | Các mô hình liên hợp, mạng Bayes | Hậu nghiệm liên tục, mô hình xác suất sâu |

## Common mistakes

- Sử dụng lấy mẫu loại bỏ trong không gian nhiều chiều. Tỉ lệ chấp nhận giảm theo hàm mũ với số chiều. Trên 5 chiều, chuyển sang MCMC.
- Đặt phương sai đề xuất MCMC quá cao hoặc quá thấp. Quá cao: hầu hết đề xuất bị loại, chuỗi bị kẹt. Quá thấp: mọi đề xuất được chấp nhận, chuỗi di chuyển chậm. Nhắm đến ~23% chấp nhận cho MH bước đi ngẫu nhiên.
- Quên burn-in. N mẫu đầu tiên từ MCMC bị chệch bởi điểm bắt đầu. Loại bỏ ít nhất 1000 bước (hoặc nhiều hơn với các phân phối phức tạp).
- Sử dụng lấy mẫu quan trọng với một đề xuất rất khác mục tiêu. Một vài mẫu nhận trọng số khổng lồ, làm ước lượng không đáng tin cậy. Theo dõi kích thước mẫu hiệu dụng: ESS = (sum w_i)^2 / sum(w_i^2).
- Sử dụng temperature > 0 cho các tác vụ cần đầu ra tất định (ví dụ, phân loại, trích xuất có cấu trúc). Thay vào đó sử dụng tham lam (T=0) hoặc tìm kiếm chùm.
- Không kết hợp top-p với temperature. Chỉ temperature không loại các token rác khỏi đuôi dài. Top-p có làm điều đó.
- Lan truyền ngược qua một phép lấy mẫu tiêu chuẩn. Sử dụng thủ thuật tái tham số hóa cho liên tục (Gaussian) và Gumbel-Softmax cho rời rạc (categorical).

## Quick reference: variance reduction techniques

| Kỹ thuật | Cách hoạt động | Giảm phương sai |
|---|---|---|
| Lấy mẫu phân tầng | Chia không gian thành các tầng, lấy mẫu từng tầng | Luôn <= MC tiêu chuẩn |
| Biến đối nghịch | Sử dụng cả U và 1-U | Hoạt động cho các hàm đơn điệu |
| Biến kiểm soát | Trừ một biến có trung bình đã biết | Tỉ lệ với tương quan |
| Lấy mẫu quan trọng | Điều chỉnh lại trọng số các mẫu từ một đề xuất tốt hơn | Phụ thuộc chất lượng đề xuất |
| Siêu lập phương Latin | Phân tầng từng chiều độc lập | Tốt hơn phân tầng trong không gian nhiều chiều |
