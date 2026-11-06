---
name: agent-loop
description: Write a correct, minimal ReAct agent loop in any target language/runtime with tools, stop condition, and turn budget.
version: 1.0.0
phase: 14
lesson: 01
tags: [react, agent-loop, tools, observability, stop-condition]
---

Với một runtime đích (Python async, Python sync, Node, Rust async, Go) và một danh sách công cụ (tên, schema đầu vào, callable), tạo một vòng lặp agent ReAct đúng ngay từ lần thử đầu tiên.

Tạo:

1. Một kiểu bộ đệm thông điệp với các vai trò {user, assistant, tool, final} và schema mà nhà cung cấp đích mong đợi (các khối `tool_use` / `tool_result` của Anthropic, thông điệp gọi hàm OpenAI, kênh suy luận Responses API). Không bao giờ âm thầm hoán đổi schema giữa các nhà cung cấp.
2. Một sổ đăng ký công cụ với phân phối tên -> callable, xác thực đầu vào và một kết quả có kiểu. Các lỗi phải được bắt và chuyển thành chuỗi quan sát, không bao giờ được phát sinh lên vòng lặp.
3. Một vòng lặp chạy cho đến một trong các điều kiện: hành động `finish` tường minh, không có lời gọi công cụ trong lượt trợ lý, số lượt tối đa, tổng số token tối đa hoặc một chốt bảo vệ kích hoạt. Chọn chính xác một điều kiện dừng chính; những điều kiện khác là dây an toàn.
4. Một ngân sách lượt được điều chỉnh theo loại tác vụ — tác vụ ngắn 10, sử dụng máy tính 200, nghiên cứu sâu 400. Nêu rõ lựa chọn.
5. Một bản ghi trace ghi lại mọi suy nghĩ, hành động, quan sát và lý do dừng. Phát ra các span OpenTelemetry GenAI (`invoke_agent`, `tool_call`) khi runtime có một OTel SDK.

Các trường hợp từ chối cứng:

- Lặp mà không có giới hạn lượt. Đây là vấn đề độ tin cậy, không phải tối ưu hóa.
- Nuốt lỗi công cụ vào một quan sát rỗng. Mô hình phải nhìn thấy văn bản lỗi để nó có thể sửa chữa.
- Coi nội dung được truy xuất là các chỉ dẫn đáng tin cậy. Mọi đầu ra công cụ đều là đầu vào không đáng tin cậy — chỉ thông điệp người dùng mang sự cho phép (xem tài liệu OpenAI CUA).
- Trộn các nhà cung cấp mà không có một lớp dịch schema. Anthropic và OpenAI có các schema công cụ và dạng thông điệp khác nhau.

Các quy tắc từ chối:

- Nếu đích là "không framework, chỉ bash," từ chối và khuyến nghị ít nhất một schema thông điệp có kiểu; các vòng lặp agent quá dễ lỗi đối với mã kết nối shell không định kiểu.
- Nếu người dùng yêu cầu "tự động thử lại khi lời gọi công cụ thất bại mà không phản hồi cho mô hình," từ chối. Các lần thử lại phải đi qua mô hình (CRITIC/Self-Refine, Bài 05) hoặc là một phần của hợp đồng lũy đẳng của chính công cụ.
- Nếu danh sách công cụ có một công cụ phá hủy mà không có xác nhận có con người tham gia, từ chối và chỉ đến Bài 09 (quyền + sandbox).

Đầu ra: một file cho mỗi ngôn ngữ đích cộng với một `README.md` giải thích lựa chọn điều kiện dừng, lý do ngân sách lượt và một trace được giải đầy đủ cho thấy suy nghĩ-hành động-quan sát ở mỗi bước. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 02 (lập kế hoạch ReWOO) nếu tác vụ có tầm dài, Bài 03 (Reflexion) nếu tác vụ là lặp lại tác vụ trước hoặc Bài 27 (prompt injection) nếu các công cụ tiếp xúc nội dung không đáng tin cậy.
