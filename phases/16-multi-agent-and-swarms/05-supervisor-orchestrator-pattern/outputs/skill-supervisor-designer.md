---
name: supervisor-designer
description: Design a supervisor/orchestrator-worker system for a given research-style query, specifying lead prompt, worker roles, decomposition rules, and synthesis template.
version: 1.0.0
phase: 16
lesson: 05
tags: [multi-agent, supervisor, orchestrator, anthropic-research, langgraph]
---

Với một truy vấn người dùng hưởng lợi từ nghiên cứu agent con song song, tạo một thiết kế mẫu bộ giám sát sẵn sàng kết nối vào bất kỳ framework nào (LangGraph, OpenAI Agents SDK, CrewAI Hierarchical).

Tạo ra:

1. **Ước tính độ phức tạp.** Truy vấn này đơn giản (1 agent, 3-10 lệnh gọi công cụ), trung bình (2-4 worker), hay phức tạp (5+ worker)? Giải thích trong một câu bằng heuristic điều chỉnh nỗ lực của Anthropic.
2. **Prompt hệ thống agent trưởng.** Phải bao gồm: (a) các chỉ dẫn phân rã, (b) các chỉ dẫn tổng hợp, (c) quy tắc tường minh rằng agent trưởng không bao giờ đọc nội dung nguồn thô, chỉ các tóm tắt của worker.
3. **Các prompt hệ thống worker.** Một cho mỗi vai trò, mỗi prompt nêu phạm vi hẹp và định dạng đầu ra agent trưởng kỳ vọng.
4. **Các quy tắc phân rã câu hỏi con.** Agent trưởng chia truy vấn như thế nào? Rộng trước rồi hẹp, hay phân rã trực tiếp? Điều gì loại một câu hỏi con (chồng lấp với câu khác, quá rộng)?
5. **Mẫu tổng hợp.** Quy tắc xử lý xung đột tường minh: nếu hai worker trả về các sự kiện mâu thuẫn, tổng hợp phải trình bày bất đồng thay vì âm thầm chọn một.
6. **Ghép mô hình.** Mô hình nào cho agent trưởng (tầng suy luận), mô hình nào cho worker (tầng nhanh hơn/rẻ hơn). Giải thích đánh đổi.
7. **Các yêu cầu khả năng quan sát.** Các điểm truy vết tối thiểu: kế hoạch, bắt đầu/kết thúc từng worker, đầu vào tổng hợp, đầu ra tổng hợp.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ thiết kế nào mà agent trưởng tự sử dụng công cụ. Agent trưởng chỉ lập kế hoạch và tổng hợp.
- Các prompt worker cho phép trôi phạm vi (ví dụ: “nghiên cứu bất cứ điều gì liên quan tới X” mà không có giới hạn).
- Các mẫu tổng hợp che giấu xung đột.

Các quy tắc từ chối:

- Nếu truy vấn đơn giản (ước tính tổng cộng dưới 10 lệnh gọi công cụ), từ chối thiết kế và thay vào đó đề xuất một agent đơn lẻ. Trích dẫn phát hiện chi phí token 15× của Anthropic.
- Nếu truy vấn tuần tự (bước 2 cần đầu ra bước 1), từ chối và thay vào đó đề xuất một mẫu pipeline/chuỗi.
- Nếu người dùng đang tối ưu cho tính xác định và kiểm toán, từ chối bộ giám sát và đề xuất một đồ thị tĩnh LangGraph.

Đầu ra: bản tóm lược thiết kế một trang. Bắt đầu bằng ước tính độ phức tạp và một kết luận độ phù hợp mẫu (“bộ giám sát phù hợp”). Kết thúc bằng một nhắc nhở triển khai cầu vồng nếu hệ thống sẽ chạy liên tục.
