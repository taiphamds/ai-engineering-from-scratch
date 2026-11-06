---
name: mcp-client-harness
description: Scaffold a multi-server MCP client with modern metadata, safe era negotiation, deterministic merge, and routing.
version: 2.1.0
phase: 13
lesson: 08
tags: [mcp, client, stateless, compatibility, routing]
---

Với danh sách vận chuyển máy chủ MCP, tạo bộ khung client ưu tiên MCP `2026-07-28` và cô lập tương thích cũ.

Tạo ra:

1. Cấu hình peer. Ánh xạ tên máy chủ ổn định đến lệnh hoặc endpoint ghim, đối số, danh sách cho phép môi trường, ngữ cảnh cấp quyền, loại vận chuyển và cờ `allow_legacy` tường minh mặc định false.
2. Bộ xây yêu cầu hiện đại. Đóng phiên bản giao thức, khả năng client hiện tại và danh tính client được khuyến nghị vào mọi `params._meta` ngay trước tuần tự hóa.
3. Thăm dò thời kỳ stdio. Gửi `server/discover` trước. Nhận DiscoverResult hợp lệ, thử lại `-32022` ở phiên bản hiện đại cả hai hỗ trợ và coi `-32020` cộng `-32021` là lỗi hiện đại có thể sửa.
4. Thăm dò tương thích cũ. Coi lỗi không nhận biết, hết thời gian, đóng kết nối hoặc phản hồi rỗng là mơ hồ. Chỉ gửi một `initialize` có thời hạn khi đúng peer đó có `allow_legacy: true`. Chỉ chọn cũ sau thành công JSON-RPC liên hệ đúng chứa bản sửa đổi cũ đã cấu hình, khả năng đối tượng và danh tính máy chủ không rỗng. Nếu không, thất bại theo hướng đóng.
5. Bộ đệm công cụ. Tôn trọng `ttlMs` và `cacheScope` trong ngữ cảnh cấp quyền đã thương lượng. Coi `resultType` cũ vắng mặt là `"complete"`.
6. Gộp không gian tên. Sắp xếp peer và công cụ. Thêm tiền tố hoặc từ chối xung đột. Cấm ghi đè âm thầm.
7. Bộ định tuyến. Ánh xạ tên công cụ chuẩn đến peer cộng tên cục bộ, tạo id yêu cầu mới, gửi yêu cầu đúng thời kỳ và xác minh id phản hồi.
8. Phục hồi. Khi mất vận chuyển, làm công việc đang xử lý thất bại, khởi động lại hoặc kết nối lại, lặp khám phá và danh sách, mở lại đăng ký và chỉ thử lại thao tác được chính sách an toàn cho phép.

Các trường hợp bác bỏ tuyệt đối:

- Gửi yêu cầu hiện đại không có `_meta` hiện tại.
- Dự phòng về khởi tạo sau lỗi hiện đại đã nhận biết.
- Gửi `initialize` đến peer không được cho phép rõ để tương thích cũ.
- Coi hết thời gian, đóng kết nối, phản hồi rỗng, lỗi không nhận biết, kết quả sai dạng hoặc bản sửa đổi không hỗ trợ là bằng chứng hành vi cũ.
- Coi tiến trình, kết nối hoặc `Mcp-Session-Id` là trạng thái giao thức hiện đại.
- Chia sẻ danh sách lưu đệm riêng qua ngữ cảnh cấp quyền.
- Âm thầm ghi đè tên công cụ trùng.
- Chấp nhận thành công hiện đại không có `resultType`.

Quy tắc từ chối:

- Từ chối sinh lệnh ngoài danh sách cho phép đã ghim.
- Từ chối định tuyến công cụ khi chủ sở hữu mơ hồ.
- Từ chối tự động thử lại lời gọi không lũy đẳng khi không có khóa lũy đẳng ứng dụng hoặc quyết định người dùng.

Xuất bộ khung Python đầy đủ, ít nhất sáu kiểm thử tuân thủ và báo cáo khởi động liệt kê peer, thời kỳ chọn, phiên bản chọn, phạm vi bộ đệm và tên công cụ chuẩn.
