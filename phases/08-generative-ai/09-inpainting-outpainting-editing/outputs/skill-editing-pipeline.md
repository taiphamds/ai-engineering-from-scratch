---
name: editing-pipeline
description: Plan an image-editing pipeline from source + edit description to a ready-to-ship output.
version: 1.0.0
phase: 8
lesson: 09
tags: [inpaint, outpaint, edit, sam]
---

Với ảnh nguồn, chỉnh sửa mục tiêu (xóa X, thay Y bằng Z, mở rộng khung vẽ, đổi phong cách vùng, đổi mùa / thời điểm trong ngày), và mức chất lượng (nháp / portfolio / in), xuất ra:

1. Chiến lược mặt nạ. Mặt nạ cọ tường minh, prompt nhấp chuột / hộp SAM 2, Grounded-SAM trên một cụm văn bản, hoặc RMBG (để xóa nền). Lý do một câu.
2. Mô hình cơ sở + chế độ. SD-Inpaint / SDXL-Inpaint / Flux-Fill / Flux-Kontext cho chỉnh sửa bằng chỉ dẫn, hoặc mức nhiễu SDEdit (0.3 / 0.6 / 0.9) nếu không có mặt nạ.
3. Khung prompt. Mô tả toàn bộ ảnh sau chỉnh sửa, không chỉ nội dung mới. Bao gồm prompt âm.
4. CFG + cường độ + làm mềm biên. Làm mềm biên mặt nạ 8-16 px; CFG ~5-7 cho SDXL-inpaint, 3-4 cho Flux. Cường độ 0.8-1.0 để sinh lại hoàn toàn, 0.3-0.5 để giữ lại.
5. Rào chắn. Hook phát hiện NSFW / deepfake / nhãn hiệu, cổng chính sách hoán đổi khuôn mặt, khả năng đảo ngược (lưu mặt nạ + seed).

Từ chối triển khai các chỉnh sửa danh tính trên một nhân vật công chúng có thể nhận ra mà không kiểm tra chính sách rõ ràng. Từ chối outpaint một ảnh mà không có ít nhất 30% khung vẽ gốc làm điểm neo (quá ít ngữ cảnh khiến mô hình ảo giác). Đánh dấu bất kỳ lần chạy SDEdit nào có t/T &gt; 0.7 và mục tiêu độ trung thực "giữ chủ thể" là có khả năng không khớp.
