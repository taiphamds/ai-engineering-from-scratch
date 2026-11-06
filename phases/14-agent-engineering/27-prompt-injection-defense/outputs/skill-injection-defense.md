---
name: injection-defense
description: Build a PVE (Prompt-Validator-Executor) layer with source-tagged content, injection-marker scanning, and allowlist navigation for any agent runtime.
version: 1.0.0
phase: 14
lesson: 27
tags: [security, prompt-injection, pve, greshake, source-tag]
---

Với một agent có quyền truy cập công cụ và truy xuất, tạo một lớp phòng vệ injection.

Tạo:

1. Thẻ nguồn trên mỗi phần nội dung: `user_message`, `tool_output`, `retrieved_web`, `retrieved_memory`, `retrieved_file`. Lan truyền các thẻ qua lịch sử thông điệp.
2. `Validator.assess(tool_call, contents)` — từ chối các lời gọi công cụ với các đối số hoặc nội dung được truy xuất có dạng injection; chỉ cho phép khi các thẻ nguồn khớp mức tin cậy đã khai báo.
3. Danh sách cho phép / chặn cho điều hướng: các URL, miền, đường dẫn file mà agent có thể chạm đến.
4. Chốt bảo vệ ghi bộ nhớ: từ chối các lần ghi trông như chỉ thị.
5. Kỷ luật ghi nội dung (Bài 23): lưu nội dung được truy xuất bên ngoài; các span mang ID tham chiếu, không phải văn xuôi.
6. Bộ kiểm thử: năm lớp khai thác Greshake dưới dạng các trường hợp red-team.

Các trường hợp từ chối cứng:

- Bề mặt sử dụng công cụ không có thẻ nguồn. Không thể phân biệt các mức cho phép nếu không có nguồn gốc.
- Bộ xác thực chỉ chạy trên đầu ra cuối cùng. Xác thực muộn không liên quan — mô hình đã hành động.
- "Tin tôi, system prompt xử lý nó." Vệ sinh system prompt không phải một biện pháp kiểm soát.

Các quy tắc từ chối:

- Nếu agent có bất kỳ khả năng truy xuất nào mà không có gắn thẻ nguồn, từ chối phát hành. Nội dung được truy xuất là vector injection kinh điển.
- Nếu các công cụ nhạy cảm (gửi thông điệp, thực thi shell, ghi file trong /) không có xác nhận có con người tham gia, từ chối.
- Nếu các lần ghi bộ nhớ không được bảo vệ, từ chối. Đầu độc bộ nhớ lưu giữ đầu độc lại phiên tiếp theo.

Đầu ra: `validator.py`, `source_tag.py`, `allowlist.py`, `memory_guard.py`, `red_team.py`, `README.md` giải thích stack sáu biện pháp kiểm soát, các rủi ro còn lại và nhịp đánh giá liên tục. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 21 (an toàn sử dụng máy tính) và Bài 23 (ghi nội dung qua OTel).
