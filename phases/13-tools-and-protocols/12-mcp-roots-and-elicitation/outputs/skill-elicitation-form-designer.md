---
name: elicitation-form-designer
description: Design explicit resource scope and stateless MCP 2026-07-28 elicitation with authorization, safe forms, and signed retry state.
version: 2.0.0
phase: 13
lesson: 12
tags: [mcp, elicitation, mrtr, scope, authorization]
---

Thiết kế bước đầu vào người dùng cho thao tác MCP nhắm bản sửa đổi giao thức `2026-07-28`.

Tạo ra:

1. Hợp đồng phạm vi. Đặt workspace, thư mục hoặc URI tài nguyên trong đối số công cụ hiển thị hoặc cấu hình máy chủ. Nêu chủ thể đã xác thực nào được dùng.
2. Kiểm tra ranh giới. Định nghĩa chuẩn hóa URI, giới hạn thành phần đường dẫn, chính sách liên kết tượng trưng và sandbox hệ điều hành.
3. Điều kiện kích hoạt. Nêu đúng sự mơ hồ, xác nhận hoặc tương tác bên ngoài cần đầu vào người dùng.
4. Cổng khám phá và khả năng. Trả `supportedVersions`, khả năng, `ttlMs` và `cacheScope` chính xác từ `server/discover`. Nếu công bố công cụ, gồm bộ mô tả `tools/list` bắt buộc tất định với `inputSchema` đối tượng hợp lệ, siêu dữ liệu danh tính máy chủ và gợi ý bộ đệm. Coi `elicitation: {}` và `elicitation.form` tường minh là hỗ trợ biểu mẫu. Từ chối hỗ trợ thiếu hoặc chỉ URL bằng `-32021` và `data.requiredCapabilities.elicitation.form`; dùng `-32022` với dữ liệu `supported` và `requested` chính xác cho phiên bản không hỗ trợ.
5. Kết quả MRTR. Trả `resultType: "input_required"` với khóa `inputRequests` ổn định và yêu cầu `elicitation/create`.
6. Thiết kế tương tác. Với chế độ biểu mẫu, cung cấp thông điệp thuần và lược đồ phẳng hạn chế. Với chế độ URL, hiển thị đích HTTPS và quy tắc hoàn thành ngoài băng.
7. Hợp đồng thử lại. Yêu cầu id JSON-RPC mới, phương thức và đối số gốc, `inputResponses` hiện tại, `_meta` mỗi yêu cầu và phản hồi `requestState` chính xác.
   Thông báo không id không bao giờ nhận kết quả hoặc lỗi JSON-RPC; thông báo Streamable HTTP được chấp nhận nhận `202` không phần thân.
8. Xử lý nhánh. Ánh xạ `accept`, `decline` và `cancel` sang kết quả an toàn khác nhau.
9. Bảo vệ trạng thái. Gắn HMAC hoặc mã hóa có xác thực với chủ thể đã xác thực, bản băm đối số gốc, tập ứng viên, giai đoạn thao tác, hết hạn và nonce một lần. Tiêu thụ nonce nguyên tử trong kho chống phát lại có giới hạn, dọn theo TTL dùng chung mọi thực thể trình xử lý.
10. Xác thực lại cuối. Kiểm tra lại cấp quyền, trạng thái bản ghi trực tiếp và giới hạn ngay trước thay đổi.

Các trường hợp bác bỏ tuyệt đối:

- Coi Roots ngừng được khuyến nghị là cấp quyền, giới hạn hoặc sandbox.
- Dùng `roots/list` hoặc `notifications/roots/list_changed` trong thiết kế 2026-07-28 mới.
- Gửi yêu cầu `elicitation/create` ngược thay vì trả qua MRTR.
- Thu mật khẩu, khóa API, token truy cập hoặc thông tin xác thực thanh toán trong chế độ biểu mẫu.
- Gửi chế độ elicitation vắng trong khả năng mỗi yêu cầu hiện tại.
- Coi `clientInfo` là danh tính người dùng đã xác thực.
- Thực hiện hành động phá hủy trước chấp nhận đã xác thực và kiểm tra cấp quyền cuối.
- `requestState` không chữ ký mang ứng viên hoặc dữ liệu liên quan quyền.

Quy tắc từ chối:

- Từ chối hỏi lặp lại sau từ chối tường minh.
- Từ chối elicitation cho giá trị máy chủ có thể suy ra hoặc xác thực không cần người dùng.
- Từ chối URL chứa thông tin xác thực, bí mật người dùng hoặc giá trị bearer đã xác thực trước.
- Từ chối yêu cầu dùng trạng thái phiên giao thức ẩn, `initialize` hoặc `Mcp-Session-Id`.

Xuất thiết kế một trang với phạm vi, cấp quyền, giới hạn, chế độ tương tác, lược đồ hoặc URL, hình dạng đường truyền MRTR, trường trạng thái, nhánh phản hồi, chính sách phát lại và danh sách kiểm tra xác thực lại cuối.
