---
name: patch-geometry-reader
description: Read a ViT config and produce a patch-token, parameter, and VRAM analysis for downstream VLM planning.
version: 1.0.0
phase: 12
lesson: 01
tags: [vit, patch-tokens, dinov2, siglip, vlm-backbone]
---

Với cấu hình backbone thị giác (kích thước patch, độ phân giải, chiều ẩn, độ sâu, head, thanh ghi tùy chọn), tạo phân tích hình học cho người gọi biết encoder sẽ phát bao nhiêu token, tốn bao nhiêu VRAM để chạy và có phải lựa chọn đúng cho VLM hoặc tác vụ dự đoán dày đặc downstream không.

Tạo:

1. Lưới patch và độ dài chuỗi. Hình dạng lưới (H/P, W/P). Độ dài chuỗi gồm CLS, thanh ghi và mọi token pooling. Nêu bật hỗ trợ đa độ phân giải (NaFlex, AnyRes) khi được khai báo.
2. Phân tích tham số. Embedding patch, embedding vị trí, khối transformer (attention + MLP), LN cuối, tổng ở cả số chính xác và dễ đọc (ví dụ 86.4M).
3. FLOPs mỗi forward. Attention (4 N D^2 + 2 N^2 D mỗi khối) và MLP (16 N D^2 mỗi khối), cộng trên độ sâu. Đánh dấu chi phí bậc hai theo N sẽ gây hại ở độ phân giải cao.
4. Ước lượng VRAM. Bộ nhớ activation khi suy luận cho một forward trên một ảnh, cộng cache tương đương KV nếu encoder cung cấp cho LLM downstream.
5. Khuyến nghị pooling. CLS, trung bình patch, dựa trên thanh ghi hoặc bỏ pooling cho VLM, theo tác vụ downstream đã khai báo.

Các trường hợp loại bỏ dứt khoát:
- Mọi phân tích xem token patch giống hệt pixel đầu vào. Phép chiếu là ánh xạ tuyến tính được học; patch là vector trừu tượng, không phải pixel.
- Tuyên bố CLS luôn là pooling đúng. Đường đặc trưng dày đặc và VLM hiện đại bỏ hoàn toàn CLS.
- Xem 2D-RoPE và embedding vị trí được học là hoán đổi được mà không lưu ý tính linh hoạt độ phân giải nguyên bản kiểu NaFlex.

Quy tắc từ chối:
- Nếu cấu hình cung cấp khai báo kích thước patch không chia hết kích thước ảnh, từ chối — đây không phải cấu hình tương thích NaFlex khi không có cơ chế padding được khai báo.
- Nếu người gọi hỏi số trọng số tiền huấn luyện chính xác cho mô hình độc quyền (Gemini, Claude, GPT-5), từ chối — chúng không được công bố.
- Nếu VRAM triển khai đích dưới 4GB cho mô hình loại ViT-g/14, từ chối và khuyến nghị SigLIP SO400m/14 hoặc backbone nhỏ hơn.

Đầu ra: phân tích hình học một trang với số token, phân tích tham số, ước lượng FLOPs, ngân sách VRAM và chiến lược pooling khuyến nghị. Kết thúc bằng đoạn "đọc gì tiếp" chỉ đến bài báo SigLIP 2 (arXiv:2502.14786) để biết chi tiết NaFlex, bài báo DINOv2 cho đặc trưng dày đặc hoặc Bài 12.06 cho triển khai patch-n'-pack.
