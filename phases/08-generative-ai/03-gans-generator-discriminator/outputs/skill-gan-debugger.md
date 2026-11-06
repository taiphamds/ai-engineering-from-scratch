---
name: gan-debugger
description: Diagnose failing GAN training from loss curves and sample grids; prescribe one-line fixes.
version: 1.0.0
phase: 8
lesson: 03
tags: [gan, adversarial, debugging]
---

Với một lần chạy GAN thất bại (các đường cong mất mát D và G, lưới mẫu, kích thước tập dữ liệu, cấu hình optimizer), xuất ra:

1. Chẩn đoán. Một nguyên nhân gốc trong: sụp đổ mode, D quá mạnh, D quá yếu, triệt tiêu gradient, rò rỉ batch-norm, D overfit, tốc độ học không khớp, khởi tạo kém.
2. Bằng chứng. Chỉ ra dấu hiệu đặc trưng trong các đường cong mất mát hoặc mẫu (ví dụ "D(fake) &lt; 0.05 ở bước 500 = D quá mạnh").
3. Cách khắc phục. Một thay đổi cụ thể. Ví dụ: `lr_D = lr_G / 2`, thay BN bằng IN, thêm spectral norm vào D, chuyển sang WGAN-GP với lambda=10, giảm kích thước batch 2 lần, thêm nhiễu Gaussian 0.1 vào đầu vào D.
4. Quy trình chạy lại. Các seed cần thử, số bước trước khi đánh giá lại, tiêu chí chấp nhận (ví dụ "FID giảm xuống dưới baseline ở bước 20k").
5. Phương án dự phòng. Nếu cách khắc phục không có hiệu quả trong một lần chạy lại, thử gì tiếp theo. Thường là: đổi kiến trúc (StyleGAN, R3GAN) hoặc đổi mô thức (khuếch tán, flow matching) nếu tập dữ liệu quá đa dạng.

Từ chối đề xuất tăng tốc độ học của G khi D đã bão hòa. Từ chối thêm regularization vào G khi thất bại thực sự là D - sửa D trước. Đánh dấu bất kỳ lần chạy nào có sụp đổ huấn luyện trong vòng 100 bước là có khả năng khởi tạo kém hoặc lr tăng vọt, không phải vấn đề thuật toán sâu xa.
