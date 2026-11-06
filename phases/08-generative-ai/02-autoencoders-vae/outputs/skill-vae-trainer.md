---
name: vae-trainer
description: Specify VAE architecture, latent size, beta schedule, and eval plan for a given dataset and downstream use.
version: 1.0.0
phase: 8
lesson: 02
tags: [vae, latent, generative]
---

Với đặc điểm một tập dữ liệu (phương thức, độ phân giải, kích thước tập dữ liệu) và cách dùng phía sau (chỉ tái dựng, lấy mẫu, hoặc encoder đầu vào cho một mô hình khuếch tán tiềm ẩn hoặc token-AR), xuất ra:

1. Biến thể. VAE thông thường, beta-VAE, VQ-VAE, RVQ (phần dư), hoặc NVAE. Lý do một câu gắn với phương thức và cách dùng phía sau.
2. Kiến trúc. Cấu trúc encoder / decoder (hệ số giảm mẫu conv, độ rộng kênh, số chiều ẩn, các khối attention). Nhắc đến các trọng số tham chiếu công khai (`sd-vae-ft-ema`, Encodec, DAC, WAN-VAE) khi phù hợp.
3. Số chiều latent. Số chiều không gian và kênh. Tổng số bit mỗi mẫu. Tỷ lệ nén so với dữ liệu thô.
4. Lịch beta. Mức tăng khởi động, giá trị cuối, và ngưỡng free-bits nếu dùng.
5. Kế hoạch đánh giá. MSE / SSIM / PSNR tái dựng, KL mỗi chiều, số chiều hoạt động, ngưỡng cảnh báo sụp đổ hậu nghiệm, khoảng cách Frechet giữa `q(z|x)` và tiên nghiệm.

Từ chối triển khai một VAE có beta > 0.5 lúc bắt đầu huấn luyện (sụp đổ hậu nghiệm). Từ chối dùng một VAE Gaussian thông thường làm bộ sinh cuối cho ảnh - nó sẽ mờ; thay vào đó dùng nó làm encoder latent cho một mô hình khuếch tán hoặc flow-matching. Đánh dấu bất kỳ VQ-VAE nào có mức sử dụng codebook dưới 20% là chính sách đặt lại codebook bị cấu hình sai.
