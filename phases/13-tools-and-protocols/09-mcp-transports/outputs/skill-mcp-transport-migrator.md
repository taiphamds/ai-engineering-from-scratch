---
name: mcp-transport-migrator
description: Migrate legacy MCP HTTP transports to the stateless, POST-only 2026-07-28 contract.
version: 2.0.0
phase: 13
lesson: 09
tags: [mcp, streamable-http, stateless, migration, headers]
---

Với máy chủ Streamable HTTP dựa trên phiên hoặc HTTP+SSE, tạo sổ tay chuyển đổi sang MCP `2026-07-28`.

Tạo ra:

1. Bản đồ endpoint. Định nghĩa một endpoint MCP hiện đại nhận POST. Mỗi yêu cầu hoặc thông báo JSON-RPC nhận POST mới.
2. Bản đồ phản hồi. Dùng `application/json` cho một phản hồi hoặc `text/event-stream` phạm vi yêu cầu cho thông báo liên quan theo sau là phản hồi cuối.
3. Hành vi đã bỏ. Trả `405` cho GET và DELETE hiện đại. Bỏ qua `Mcp-Session-Id` và `Last-Event-ID`; không bao giờ tạo, phản hồi lại, thu hồi hoặc tiếp tục chúng.
4. Siêu dữ liệu yêu cầu. Yêu cầu phiên bản giao thức và khả năng client trong mọi `_meta` phần thân, với danh tính client được khuyến nghị.
5. Xác thực header. Yêu cầu `MCP-Protocol-Version`, `Mcp-Method` và `Mcp-Name` có điều kiện. Giải mã dấu báo hiệu Base64 và so header với phần thân. Trả `-32020` khi không khớp. Trả `-32022` khi phiên bản khớp không được hỗ trợ với khóa dữ liệu chính xác `supported` và `requested`.
6. Chuyển đổi đăng ký. Thay GET độc lập, `resources/subscribe` và `resources/unsubscribe` bằng POST `subscriptions/listen`. Gắn xác nhận, mọi thông báo và kết quả cuối với `io.modelcontextprotocol/subscriptionId` bằng id yêu cầu listen.
7. Chuyển đổi trạng thái. Thay tính gắn kết kết nối bằng handle ứng dụng mờ tường minh gắn với chủ thể đã xác thực.
8. Khoảng thời gian tương thích. Giữ endpoint cũ riêng và gắn nhãn rõ. Lỗi POST hiện đại phải được kiểm tra trước mọi dự phòng cũ. Không chuyển hướng POST bằng `301` hoặc `302` vì bảo toàn phương thức và phần thân không an toàn.
9. Xác minh. Kiểm thử từ chối Origin, thương lượng loại nội dung POST, siêu dữ liệu phần thân, header phản chiếu, phản hồi JSON, thông báo được chấp nhận `202` không phần thân, siêu dữ liệu đăng ký SSE có phạm vi, GET và DELETE `405`, header đã bỏ bị bỏ qua và thử lại luồng hỏng với id mới.

Các trường hợp bác bỏ tuyệt đối:

- Trình bày id phiên, GET độc lập, DELETE hoặc phát lại là hành vi hiện đại.
- Chia sẻ khả năng mỗi yêu cầu qua bộ nhớ tiến trình hoặc kết nối.
- Gửi yêu cầu JSON-RPC do máy chủ khởi tạo.
- Tiếp tục luồng SSE hiện đại bằng `Last-Event-ID`.
- Dự phòng cũ sau lỗi hiện đại đã nhận biết.
- Dùng chuyển hướng để di chuyển JSON-RPC POST trong chuyển đổi.

Quy tắc từ chối:

- Từ chối công khai khi không có xác thực danh tính, cấp quyền và chính sách Origin chính xác.
- Từ chối định tuyến bám dính ẩn thay cho trạng thái quy trình tường minh.
- Từ chối tự động thử lại thao tác không lũy đẳng khi không có kiểm soát lũy đẳng ứng dụng.

Xuất bảng endpoint trước-và-sau, triển khai theo giai đoạn, ranh giới hoàn tác và danh sách kiểm tra tuân thủ thực thi được. Kết thúc bằng ngày chính xác tuyến cũ sẽ bị bỏ.
