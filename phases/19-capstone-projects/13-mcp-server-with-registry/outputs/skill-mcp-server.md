---
name: mcp-server-platform
description: Design a stateless MCP 2026-07-28 server with registry metadata, live discovery, authorization, policy, audit, and scale evidence.
version: 2.0.0
phase: 19
lesson: 13
tags: [capstone, mcp, stateless, streamable-http, oauth, registry, governance]
---

Với một nhu cầu nền tảng nội bộ được cung cấp, thiết kế một máy chủ MCP phi trạng thái và ranh giới quản trị nhắm đến bản sửa đổi giao thức `2026-07-28`.

Kế hoạch xây dựng:

1. Một `server.json` hợp lệ theo lược đồ có tên DNS đảo ngược khớp với không gian tên được xác thực của nhà phát hành.
2. `server/discover` bắt buộc cho các phiên bản, khả năng, phần mở rộng, và danh tính máy chủ trực tiếp.
3. Phiên bản và khả năng máy khách trong `_meta` của mọi yêu cầu; `resultType` và danh tính máy chủ trong mọi kết quả.
4. `tools/list` tất định với `ttlMs` và `cacheScope`.
5. Streamable HTTP chỉ POST với các header phiên bản, phương thức, và tên bắt buộc; không có phiên giao thức, luồng GET, DELETE phiên, hoặc header phát lại.
6. Ủy quyền xác thực bên phát hành, đối tượng nhận, hạn dùng, và các phạm vi trên mọi lệnh gọi.
7. Chính sách trên tác nhân, công cụ, đích, và các đối số được chuẩn hóa. Ràng buộc các phê duyệt rủi ro cao với hành động và hạn dùng chính xác, rồi chứng minh rằng thay đổi một đối số sẽ từ chối phát lại.
8. Bằng chứng kiểm toán và trace được che bên ngoài ngữ cảnh mô hình có thể thấy.
9. Một adapter registry xác thực `server.json`, thăm dò `server/discover`, và báo cáo độ trôi siêu dữ liệu/runtime.
10. Hai bản sao có thể thay thế nhau và một phép thăm dò tải đồng thời không có tính gắn kết phiên.

Thang đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Tính đúng đắn giao thức | Phong bì phi trạng thái, khám phá, kết quả, header, và các trường hợp âm tính |
| 20 | Ủy quyền | Các trường hợp bên phát hành, đối tượng nhận, hạn dùng, phạm vi, và phê duyệt hành động chính xác |
| 15 | Tính toàn vẹn Registry | `server.json` hợp lệ, phép thăm dò trực tiếp, và báo cáo độ trôi |
| 15 | Chính sách và an toàn | Các trường hợp cho phép, từ chối, sai định dạng, phê duyệt cũ, và dữ liệu nhạy cảm |
| 15 | Quy mô | Hai bản sao không phụ thuộc tính gắn kết cùng hủy và phục hồi |
| 10 | Khả năng kiểm toán | Bằng chứng kiểm toán và trace phía nhận được che |

Các trường hợp loại thẳng:

- Một thiết kế MCP hiện tại sử dụng `initialize`, `notifications/initialized`, hoặc `Mcp-Session-Id`.
- Coi `server.json` là khám phá khả năng trực tiếp hoặc tự tạo `.well-known/mcp-capabilities` thành một yêu cầu MCP.
- Công bố một tên máy chủ bên ngoài không gian tên được xác thực cho nhà phát hành đó.
- Chấp nhận một token mà không xác thực bên phát hành và đối tượng nhận hoặc tài nguyên.
- Coi annotation công cụ hoặc một phê duyệt trò chuyện là ủy quyền.
- Các bản ghi kiểm toán lưu bền vững bí mật hoặc dữ liệu nhạy cảm thô.

Quy tắc từ chối:

- Từ chối tuyên bố sẵn sàng sản xuất chỉ từ các mô phỏng cục bộ.
- Từ chối cung cấp một công cụ thay đổi trạng thái mà không có bằng chứng chính sách và phê duyệt gắn với hành động.
- Từ chối công bố siêu dữ liệu trỏ đến một endpoint không thể xác minh khám phá trực tiếp của nó.

Đầu ra: một kế hoạch xây dựng và ma trận bằng chứng bao phủ siêu dữ liệu công bố, khám phá trực tiếp, truyền tải phi trạng thái, lược đồ công cụ, ủy quyền, chính sách, phê duyệt, kiểm toán, và quy mô. Kết thúc bằng ranh giới rủi ro cao nhất và kiểm thử lỗi chính xác chứng minh nó đóng khi thất bại.
