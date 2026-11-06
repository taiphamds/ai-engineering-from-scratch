---
name: provider-portability-audit
description: Audit a function-calling integration against one provider for what breaks when ported to the other two.
version: 1.0.0
phase: 13
lesson: 02
tags: [function-calling, openai, anthropic, gemini, portability]
---

Với tích hợp function calling trên một nhà cung cấp (OpenAI, Anthropic hoặc Gemini), tạo bản kiểm tra khả năng chuyển đổi liệt kê mọi đổi tên trường, khác biệt hành vi và xung đột giới hạn cứng xuất hiện khi cùng logic được phát hành trên hai nhà cung cấp kia.

Tạo ra:

1. Đối chiếu khai báo. Với mỗi công cụ trong tích hợp, cho thấy vỏ / đổi tên trường / chuyển lược đồ cần cho mỗi bên trong hai nhà cung cấp kia. Đánh dấu mọi cấu trúc JSON Schema nhà cung cấp đích không hỗ trợ (Gemini: tập con OpenAPI 3.0; OpenAI nghiêm ngặt: không `$ref`, không `oneOf` mơ hồ).
2. Đối chiếu phản hồi. Ghi nơi lời gọi công cụ nằm trong hình dạng phản hồi mỗi nhà cung cấp (`tool_calls[]` so với khối `content[]` so với mục `parts[]`) và ai chịu trách nhiệm phân tích `arguments` (chuỗi trên OpenAI, đối tượng trên Anthropic và Gemini).
3. Đối chiếu `tool_choice`. Ánh xạ thiết lập lựa chọn hiện tại của tích hợp (tự động / cấm / ép / bắt buộc) sang hình dạng nhà cung cấp đích; đánh dấu chế độ thiếu.
4. Xung đột giới hạn. Báo cáo số công cụ (128 / 64 / 64), độ sâu lược đồ (5 / 10 / về thực chất không giới hạn) và giới hạn độ dài mỗi đối số. Nâng mức nghiêm trọng chặn với tích hợp vượt giới hạn nhà cung cấp đích.
5. Ánh xạ chế độ nghiêm ngặt. Nêu ngữ nghĩa chế độ nghiêm ngặt có được giữ trên đích không. `strict: true` của OpenAI không có tương đương chính xác trên Anthropic; `responseSchema` của Gemini gần đúng nhưng ở cấp yêu cầu.

Các trường hợp bác bỏ tuyệt đối:
- Bất kỳ tích hợp nào giả định `arguments` là chuỗi trên đích không phải OpenAI. Sẽ âm thầm tạo kết quả sai.
- Bất kỳ tích hợp nào có số công cụ vượt 64 khi chuyển sang Anthropic hoặc Gemini mà không có bộ định tuyến.
- Bất kỳ tích hợp nào dùng `$ref` trong lược đồ khi đích là chế độ nghiêm ngặt OpenAI.

Quy tắc từ chối:
- Nếu được yêu cầu chuyển tích hợp phụ thuộc tính năng riêng nhà cung cấp không có tương tự (ví dụ lượt có trạng thái của OpenAI Responses API, khối sử dụng máy tính Anthropic), từ chối và giải thích tính năng nào không có tương đương đích.
- Nếu được yêu cầu chọn bên thắng, từ chối. Lựa chọn phụ thuộc nhu cầu chế độ nghiêm ngặt, hồ sơ chi phí và yêu cầu lời gọi song song của host.

Đầu ra: bản kiểm tra một trang với bảng đối chiếu mỗi công cụ, bảng giới hạn và "kết luận chuyển đổi" cuối cho mỗi nhà cung cấp đích (phát hành / cần-bộ-định-tuyến / bị-chặn-bởi-tính-năng). Kết thúc bằng một câu nêu thay đổi chuyển đổi có tác động lớn nhất.
