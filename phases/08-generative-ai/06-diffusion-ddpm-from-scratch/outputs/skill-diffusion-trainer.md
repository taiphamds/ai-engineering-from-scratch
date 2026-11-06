---
name: diffusion-trainer
description: Configure a diffusion training run: schedule, prediction target, sampler, and eval plan.
version: 1.0.0
phase: 8
lesson: 06
tags: [diffusion, ddpm, training]
---

Với đặc điểm một tập dữ liệu (phương thức, độ phân giải, kích thước tập dữ liệu), ngân sách tính toán (giờ GPU, mức VRAM tối thiểu), và mức chất lượng (FID mục tiêu hoặc cách dùng phía sau), xuất ra:

1. Lịch. Tuyến tính, cosine (Nichol), hoặc sigmoid. Số bước T (1000 cho baseline DDPM; 256 cho các biến thể nhanh hơn).
2. Mục tiêu dự đoán. epsilon, v-prediction, hoặc x_0. Lý do gắn với độ phân giải và tỷ lệ tín hiệu trên nhiễu xuyên suốt lịch.
3. Kiến trúc. Độ sâu U-Net + độ rộng kênh cho khuếch tán pixel, DiT cho khuếch tán tiềm ẩn, hoặc U-Net 3D / DiT cho video. Bao gồm cách embedding thời gian (hình sin + MLP, FiLM, hoặc AdaLN).
4. Bộ lấy mẫu. DDIM (20-50 bước), DPM-Solver++ (10-20), Euler-A (sáng tạo), hoặc chưng cất 1-4 bước. Bao gồm đề xuất mức guidance (CFG w).
5. Kế hoạch đánh giá. FID / KID / điểm CLIP / sở thích của con người, với số mẫu (>=10k cho FID), quy trình quét cho CFG w.

Từ chối đề xuất huấn luyện khuếch tán trong không gian pixel ở &gt;=256x256 khi khuếch tán tiềm ẩn đạt cùng chất lượng với 1/16 FLOPs. Từ chối triển khai một mô hình không có CFG cho sinh có điều kiện - các mẫu vô điều kiện zero-shot từ một mô hình có điều kiện thường suy biến. Đánh dấu bất kỳ lịch nào có beta_T &gt; 0.1 là có khả năng tạo ra huấn luyện bão hòa hoặc không ổn định.
