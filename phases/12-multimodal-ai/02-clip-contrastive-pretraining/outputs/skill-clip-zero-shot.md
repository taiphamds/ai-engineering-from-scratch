---
name: clip-zero-shot
description: Run zero-shot image classification with a CLIP / SigLIP checkpoint, producing ranked predictions with similarity scores.
version: 1.0.0
phase: 12
lesson: 02
tags: [clip, siglip, zero-shot, vision-language]
---

Với danh sách ảnh (đường dẫn file hoặc URL) và danh sách tên lớp ứng viên, tạo phân loại zero-shot được xếp hạng bằng checkpoint CLIP hoặc SigLIP đã khai báo. Skill thuần dự đoán; không huấn luyện hay finetune.

Tạo:

1. Xây prompt. Với mỗi lớp, tạo N khuôn mẫu văn bản (mặc định: `a photo of a {class}`, `a picture of a {class}`, `an image of a {class}`). Nhúng mỗi prompt bằng encoder văn bản và lấy trung bình để tạo nguyên mẫu lớp.
2. Embedding ảnh. Nhúng mỗi ảnh đầu vào bằng encoder thị giác đã nêu. Chuẩn hóa cả hai phía về độ dài đơn vị.
3. Dự đoán xếp hạng. Tính cosine similarity giữa mỗi embedding ảnh và mỗi nguyên mẫu lớp. Trả top-1 và top-5 kèm điểm.
4. Metadata checkpoint. Nêu đúng checkpoint Hugging Face dùng (ví dụ `openai/clip-vit-large-patch14` hoặc `google/siglip2-so400m-patch14-384`) và độ phân giải nó kỳ vọng.
5. Thông báo trung thực. Nêu zero-shot trên lớp ngoài phân phối tiền huấn luyện không đáng tin; hiển thị điểm top-1 như đại diện độ tin cậy và cảnh báo khi dưới 0.2.

Các trường hợp loại bỏ dứt khoát:
- Mọi cách dùng xem đầu ra là nhãn dứt khoát cho lớp không trong danh sách người gọi cung cấp.
- Tuyên bố điểm giữa các checkpoint khác nhau so sánh được; SigLIP và CLIP chấm trên thang khác nhau.
- Chạy trên ảnh biết có người mà không có chính sách đồng thuận downstream.

Quy tắc từ chối:
- Nếu người gọi yêu cầu phân loại vào loại y tế, pháp lý hoặc then chốt an toàn (chẩn đoán, danh tính, thuộc tính được bảo vệ), từ chối và chuyển sang mô hình có giám sát với dấu vết kiểm toán.
- Nếu người gọi cung cấp một tên lớp duy nhất (phân loại một chiều không phương án khác), từ chối — zero-shot cần ít nhất hai ứng viên để có ý nghĩa.
- Nếu chưa chỉ định checkpoint, từ chối và hỏi loại nào trong (CLIP, OpenCLIP, SigLIP, SigLIP 2) cộng quy mô nào.

Đầu ra: danh sách xếp hạng top-5 dự đoán mỗi ảnh với điểm cosine similarity, tên checkpoint, khuôn mẫu prompt đã dùng và cờ độ tin cậy. Kết thúc bằng đoạn "đọc gì tiếp" chỉ đến Bài 12.06 cho NaFlex (xử lý tỷ lệ khung hình thay đổi) hoặc bài báo SigLIP 2 để tìm hiểu sâu.
