---
name: handoff-designer
description: Design a handoff topology for a Swarm/Agents-SDK-style system: which agents exist, which handoffs they can call, what context transfers.
version: 1.0.0
phase: 16
lesson: 11
tags: [multi-agent, swarm, handoff, openai-agents-sdk]
---

Với một tác vụ hướng tới người dùng (thường là phân loại hoặc định tuyến dựa trên kỹ năng), tạo một cấu trúc liên kết bàn giao sẵn sàng ánh xạ lên OpenAI Swarm hoặc OpenAI Agents SDK.

Tạo ra:

1. **Danh sách agent.** Mỗi agent: tên, mục đích một câu, công cụ, và những agent khác nào nó có thể bàn giao tới.
2. **Các hàm bàn giao.** Các chữ ký công cụ theo từng agent. Mỗi hàm bàn giao trả về một Agent đích.
3. **Chính sách chuyển ngữ cảnh.** Trên mỗi cạnh bàn giao: toàn bộ lịch sử, N thông điệp cuối, hoặc snapshot được tóm tắt. Giải thích.
4. **Các rào chắn.** Xác thực đầu vào theo từng agent (các prompt nào được phép kích hoạt các bàn giao tới các chuyên gia nhạy cảm), xác thực trên bàn giao khi cần.
5. **Phát hiện vòng lặp.** Quy tắc phát hiện bóng bàn (ví dụ: “A bàn giao tới B; B bàn giao trở lại A” xảy ra nhiều hơn một lần liên tiếp).
6. **Hành vi dự phòng.** Nếu một đích bàn giao thiếu (agent bị loại bỏ, lỗi xác thực), agent nào xử lý phiên.
7. **Kế hoạch phiên / bộ nhớ.** Liệu sử dụng các phiên Agents SDK, bộ nhớ do bên gọi quản lý, hay hoàn toàn không có bộ nhớ.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ thiết kế bàn giao nào không có phát hiện vòng lặp.
- Các hàm bàn giao chuyển toàn bộ lịch sử tới các chuyên gia có quyền công cụ khác (rủi ro bảo mật).
- Các thiết kế giả định hành vi không trạng thái của Swarm nhưng rồi yêu cầu bộ nhớ nhiều lượt — thay vào đó sử dụng các phiên Agents SDK.

Các quy tắc từ chối:

- Nếu tác vụ cần thực thi song song, từ chối Swarm và thay vào đó đề xuất bộ giám sát (Bài 05).
- Nếu tác vụ cần kiểm toán/phát lại xác định, từ chối và đề xuất đồ thị tĩnh LangGraph.
- Nếu tác vụ là một DAG các giai đoạn đơn giản (nghiên cứu → mã → xem xét), thay vào đó đề xuất CrewAI Sequential.

Đầu ra: một bản tóm lược bàn giao một trang. Kết thúc bằng một ghi chú bảo mật về cách chèn prompt có thể kích hoạt các bàn giao ngoài ý muốn và những rào chắn nào chặn nó.
