---
name: llava-vibes-eval
description: Run a 10-prompt vibes-eval on a LLaVA-family VLM and produce a human-readable scorecard.
version: 1.0.0
phase: 12
lesson: 05
tags: [llava, vlm, vibes-eval, instruction-tuning]
---

Với VLM họ LLaVA (LLaVA-1.5, LLaVA-NeXT, LLaVA-OneVision hoặc fork cộng đồng) và tập ảnh kiểm thử, chạy kiểm thử khói 10 prompt bao quát chú thích, VQA, suy luận, từ chối và tuân thủ định dạng. Tạo bảng điểm xác nhận projector và LLM kết nối đúng.

Tạo:

1. Mười prompt với mô tả hành vi kỳ vọng:
   - Ba chú thích (ngắn, chi tiết, sáng tạo).
   - Ba VQA (đếm, màu, sự có mặt đối tượng).
   - Hai suy luận (so hai vùng, nguyên nhân-kết quả).
   - Hai từ chối (cá nhân riêng tư, nhận diện PII).
2. Điểm mỗi prompt. Đạt / một phần / không đạt với lý giải một dòng.
3. Chẩn đoán mẫu tổng thể. Nếu chú thích đạt nhưng VQA thất bại, nghi hỗn hợp dữ liệu giai đoạn 2. Nếu chú thích chi tiết cho thấy ảo giác, nghi thiếu dữ liệu kiểu ShareGPT4V. Nếu từ chối thất bại, đánh dấu thiếu dữ liệu an toàn.
4. Kiểm tra độ phân giải. Chạy một prompt cần OCR ở cơ sở 336x336 rồi lại ở AnyRes; ghi chênh lệch. Thất bại độ phân giải thấp được kỳ vọng; thất bại độ phân giải cao nghĩa là AnyRes cấu hình sai.
5. Tiếp nối đề xuất. Ba bổ sung dữ liệu huấn luyện cụ thể người gọi có thể chạy nếu các loại cụ thể thất bại.

Các trường hợp loại bỏ dứt khoát:
- Chấm VLM theo số benchmark mà không chạy bộ cảm tính. Benchmark có thể bị thao túng; cảm tính cho thấy sẵn sàng triển khai thực.
- Đánh đồng ảo giác với dài dòng phong cách. Đánh dấu cụ thể đối tượng nào bịa ra so với chỉ được mô tả cầu kỳ.
- Tuyên bố đạt prompt suy luận mà không kiểm tra chuỗi suy luận, không chỉ câu trả lời cuối.

Quy tắc từ chối:
- Nếu người gọi yêu cầu đánh giá cảm tính VLM độc quyền (Gemini, Claude, GPT-5V) mà không truy cập API, từ chối — kiểm thử cần suy luận thực.
- Nếu trường hợp sử dụng đích là chẩn đoán y tế hoặc tư vấn pháp lý, từ chối — đánh giá cảm tính không phải chứng nhận và không được dùng cho miền hệ trọng.
- Nếu không cung cấp ảnh, từ chối — kiểm thử dựa trên ảnh theo định nghĩa.

Đầu ra: bảng điểm 10 hàng (prompt, ảnh, kỳ vọng, thực tế, đạt/một phần/không đạt), chẩn đoán mẫu tổng thể và danh sách tiếp nối ba mục. Kết thúc bằng đoạn "đọc gì tiếp" chỉ đến Bài 12.06 (AnyRes) cho thất bại liên quan độ phân giải hoặc Bài 12.07 (loại bỏ thành phần) cho tinh chỉnh hỗn hợp dữ liệu.
