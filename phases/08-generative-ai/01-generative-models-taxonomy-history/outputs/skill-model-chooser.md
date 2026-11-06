---
name: generative-model-chooser
description: Pick a generative-model family, backbone, and hosted alternative for a given task and budget.
version: 1.0.0
phase: 8
lesson: 01
tags: [generative, taxonomy]
---

Với một mô tả tác vụ (phương thức, miền, ngân sách độ trễ, ngân sách tính toán, tín hiệu điều kiện hóa), xuất ra:

1. Họ. Tường minh-tính toán được, tường minh-xấp xỉ (VAE / khuếch tán), ẩn (GAN), score / flow matching, hoặc token-AR. Lý do một câu gắn với phương thức + độ trễ.
2. Backbone + tham chiếu mở. Một mô hình được huấn luyện trước có trọng số mở mà người dùng có thể tinh chỉnh ngay hôm nay (ví dụ Stable Diffusion 3, Flux.1-dev, AudioCraft 2, StyleGAN3, 3D Gaussian Splatting).
3. Các lựa chọn được lưu trữ. Ba API production được xếp hạng theo đánh đổi chất lượng / chi phí / độ trễ (fal.ai, Replicate, Stability, Runway, Veo, Kling, ElevenLabs, v.v.).
4. Kiểu thất bại. Vấn đề đã biết của họ được chọn (mode collapse, exposure bias, trôi bộ lấy mẫu, lỗi giả do tokenizer, thao túng điểm CLIP).
5. Ngân sách. Số giờ huấn luyện ước chừng trên một A100, chi phí suy luận mỗi mẫu, mức VRAM tối thiểu.

Từ chối đề xuất GAN khi tác vụ đòi hỏi chấm điểm độ hợp lý. Từ chối đề xuất tự hồi quy trên pixel cho sử dụng thời gian thực ở độ phân giải cao. Đánh dấu bất kỳ đề xuất "huấn luyện từ đầu" nào nếu backbone mở được liệt kê đã bao phủ miền đó.
