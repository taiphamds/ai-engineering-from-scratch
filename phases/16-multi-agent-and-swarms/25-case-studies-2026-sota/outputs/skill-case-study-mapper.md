---
name: case-study-mapper
description: Map a proposed multi-agent system design to the closest 2026 production reference (Anthropic Research, MetaGPT/ChatDev, or OpenClaw/Moltbook). Surface known trade-offs, recommended framework, and the specific design decisions already tested in production.
version: 1.0.0
phase: 16
lesson: 25
tags: [multi-agent, case-studies, production, framework-selection, reference-architectures]
---

Với một thiết kế hệ thống đa agent được đề xuất, chọn nghiên cứu tình huống chuẩn năm 2026 gần nhất và điều chỉnh.

Tạo ra:

1. **Dấu vân tay thiết kế.** Loại tác vụ (nghiên cứu / kỹ thuật / quần thể / tự động hóa), số agent, yêu cầu xác minh, thời lượng chạy, độ phân biệt vai trò, mức tiếp xúc mạng hướng người dùng.
2. **Nghiên cứu tình huống gần nhất.**
   - **Anthropic Research** nếu: tác vụ nghiên cứu hoặc truy xuất tri thức, xác minh bắt buộc, các lần chạy nhiều giờ, các agent khác nhau chủ yếu về ngữ cảnh và phạm vi (các agent con ngữ cảnh mới thắng).
   - **MetaGPT / ChatDev** nếu: kỹ thuật hoặc quy trình có cấu trúc, các vai trò có thể phân biệt rõ (bộ lập kế hoạch / người viết mã / người xem xét / người kiểm thử), các hiện vật bàn giao được định kiểu tốt.
   - **OpenClaw / Moltbook** nếu: quy mô quần thể, mạng agent hướng người dùng, chèn prompt là một mối đe dọa đáng kể, nền kinh tế nổi lên quan trọng.
3. **Các mẫu cần sao chép.** Các quyết định thiết kế cụ thể từ nghiên cứu tình huống đã chọn có áp dụng: các agent con ngữ cảnh mới, triển khai cầu vồng, khử ảo giác bằng giao tiếp, định tuyến DAG, bộ xác minh không thể ghi, bảo mật cấp nền tảng.
4. **Khuyến nghị framework.** LangGraph, CrewAI, AG2, Microsoft Agent Framework, OpenAI Agents SDK, Google ADK, Anthropic Claude Agent SDK, hoặc tùy chỉnh. Mặc định dùng framework điển hình của nghiên cứu tình huống; ghi nhận nếu có một lựa chọn phù hợp hơn cho thiết kế cụ thể.
5. **Các phản mẫu từ trường hợp.** Những điều trường hợp tham chiếu thấy KHÔNG hoạt động. Tránh trong thiết kế mới.
6. **Dự phóng chi phí.** Hệ số nhân token kỳ vọng (Anthropic Research: ~15x; MetaGPT: ~5x; OpenClaw: phụ thuộc các hiệu ứng mạng). Khoảng thời gian thực và chi phí đô la kỳ vọng.
7. **Cách tiếp cận đánh giá.** Benchmark nào (MARBLE, SWE-bench Pro, nội bộ) liên quan; chênh lệch nào so với đường cơ sở nghiên cứu tình huống là mục tiêu hợp lý.

Các trường hợp loại bỏ dứt khoát:

- Các thiết kế bỏ qua xác minh khi tác vụ có các yêu cầu tính đúng đắn. Mọi nghiên cứu tình huống trả thuế xác minh.
- Các thiết kế tuyên bố một nền tảng mới mà không thừa nhận chèn prompt như một bề mặt tấn công. Trường hợp OpenClaw/Moltbook cho thấy đây là một mối quan ngại sản xuất, không phải giả định.
- Các tuyên bố “cách mạng” không ánh xạ tới bất kỳ nghiên cứu tình huống nào. Đa agent đã ở trong sản xuất từ năm 2024; các tuyên bố mới cần so sánh tường minh.
- Các thiết kế bỏ qua áp dụng MCP hoặc A2A không có lý giải. Hỗ trợ giao thức là yêu cầu tối thiểu.

Các quy tắc từ chối:

- Nếu thiết kế không có loại tác vụ rõ ràng, đề xuất xác định phạm vi tác vụ trước khi chọn một nghiên cứu tình huống. “Đa agent cho mọi thứ” không phải một thiết kế.
- Nếu thiết kế tuyên bố sẵn sàng sản xuất nhưng không có kiểm toán chế độ lỗi, đề xuất một kiểm toán kiểu MAST (Bài 23) trước ánh xạ tham chiếu.
- Nếu thiết kế thuần thử nghiệm / nghiên cứu, ghi nhận các khía cạnh nào sẽ cần gia cố trước khi áp dụng các mẫu sản xuất của bất kỳ nghiên cứu tình huống nào.

Đầu ra: một bản tóm lược hai trang. Bắt đầu với một tóm tắt một câu (“Nghiên cứu tình huống gần nhất: MetaGPT / ChatDev. Áp dụng phân rã vai trò-SOP, khử ảo giác bằng giao tiếp, và các hiện vật bàn giao có cấu trúc; sử dụng CrewAI hoặc tùy chỉnh.”), rồi bảy phần ở trên. Kết thúc bằng một kế hoạch điều chỉnh 90 ngày: sao chép gì từ tham chiếu, tùy chỉnh gì, và xác thực gì theo các benchmark.
