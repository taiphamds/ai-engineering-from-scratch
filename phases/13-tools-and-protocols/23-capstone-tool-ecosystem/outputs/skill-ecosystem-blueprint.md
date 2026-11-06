---
name: ecosystem-blueprint
description: Produce a full Phase 13 ecosystem architecture given a product need; name primitives, security posture, telemetry, and packaging.
version: "1.0.0"
phase: "13"
lesson: "23"
tags: [mcp, capstone, ecosystem, architecture, a2a, otel]
---

Với nhu cầu sản phẩm (nghiên cứu, tóm tắt, tự động hóa, mọi quy trình do agent dẫn), tạo kiến trúc đầy đủ.

Tạo ra:

1. Bề mặt MCP. Định nghĩa `server/discover`, siêu dữ liệu giao thức mỗi yêu cầu, công cụ, tài nguyên, prompt và chính sách bộ đệm. Nêu mọi Apps `ui://`.
2. Phần mở rộng. Nếu công việc bất đồng bộ, khai báo `io.modelcontextprotocol/tasks` và thiết kế `tasks/get`, `tasks/update` và `tasks/cancel`. Giữ handle đầu ở `resultType: task`, làm kết quả thăm dò `resultType: complete` và không dùng `tasks/result` hoặc `tasks/list`.
3. Tư thế bảo mật. Tập phạm vi OAuth 2.1, ma trận RBAC gateway, manifest hash ghim, kiểm toán Quy tắc Hai.
4. Cộng tác A2A. Xác định mọi lời gọi agent phụ. Định nghĩa Agent Card.
5. Telemetry. Phân cấp span OTel GenAI. Chọn exporter và backend.
6. Đóng gói. AGENTS.md, SKILL.md và bề mặt triển khai (Docker Compose, K8s).
7. Ánh xạ đến bài Giai đoạn 13. Mỗi lựa chọn thiết kế truy về bài nào.

Các trường hợp bác bỏ tuyệt đối:
- Mọi kiến trúc kết hợp đầu vào không đáng tin, dữ liệu nhạy cảm và hành động có hệ quả trong một lượt (Quy tắc Hai).
- Mọi kiến trúc không lan truyền trace qua bước chuyển MCP và A2A.
- Mọi kiến trúc không ít nhất một nhà cung cấp dự phòng ở tầng LLM.
- Mọi thiết kế MCP hiện tại phụ thuộc `initialize`, `Mcp-Session-Id`, `tasks/result` hoặc `tasks/list`.

Quy tắc từ chối:
- Nếu nhu cầu sản phẩm được phục vụ tốt hơn bằng lời gọi LLM trực tiếp, từ chối dựng khung toàn hệ sinh thái.
- Nếu nhóm thiếu năng lực vận hành gateway, khuyến nghị gateway được quản lý và ghi chuyển giao tin cậy.
- Nếu kiến trúc liên quan thanh toán, yêu cầu giao thức cấp quyền thanh toán được đánh giá riêng và ký duyệt tường minh.

Đầu ra: bản thiết kế một trang với thành phần cơ bản, tư thế bảo mật, bước chuyển A2A, kế hoạch telemetry, đóng gói và bản đồ bài học. Kết thúc bằng một câu xác định rủi ro vận hành khó nhất duy nhất cho triển khai.
