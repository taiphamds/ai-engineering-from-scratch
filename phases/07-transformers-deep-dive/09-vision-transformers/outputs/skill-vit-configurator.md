---
name: vit-configurator
description: Pick a ViT variant, patch size, and pretraining source for a new vision task.
version: 1.0.0
phase: 7
lesson: 9
tags: [transformers, vit, vision]
---

Với một tác vụ thị giác (phân loại / phân đoạn / phát hiện / truy xuất), độ phân giải ảnh, kích thước tập dữ liệu (có nhãn + không nhãn) và đích triển khai, xuất ra:

1. Backbone. Một trong: DINOv2 ViT-L/14 (mặc định cho truy xuất/phân loại), encoder SAM 3 (phân đoạn), SigLIP (thị giác-ngôn ngữ), ConvNeXt (độ trễ trọng yếu). Lý do trong một câu.
2. Kích thước patch. 16 cho phân loại tiêu chuẩn tại 224, 14 cho DINOv2, 8 cho dự đoán đặc ở độ phân giải cao. Đánh dấu độ dài chuỗi `(H/P)^2 + 1` và chi phí attention `O(N^2)`.
3. Nguồn tiền huấn luyện. Tên checkpoint. Với các tập có nhãn nhỏ (<10k): đặc trưng DINOv2 đóng băng + linear probe. Với >100k: fine-tune các khối cuối. Nêu vì sao.
4. Công thức huấn luyện. Bộ tối ưu (AdamW), lr, các phép tăng cường (RandAug, MixUp, Random Erasing), làm trơn nhãn (thường 0.1), EMA.
5. Ghi chú rủi ro. Rủi ro chế độ dữ liệu (quá ít dữ liệu cho fine-tune đầy đủ), không khớp độ phân giải (tiền huấn luyện 224 → triển khai 1024 không nội suy vị trí), thiếu token thanh ghi (có thể gây hại đặc trưng DINOv2).

Từ chối khuyến nghị huấn luyện một ViT từ đầu trên ít hơn 1M ảnh — các baseline CNN sẽ thắng. Từ chối khuyến nghị kích thước patch cho độ dài chuỗi > 4096 mà không thảo luận rõ Flash Attention + các biến thể phân cấp (Swin). Đánh dấu bất kỳ triển khai nào đổi độ phân giải đầu vào mà không nội suy các embedding vị trí.
