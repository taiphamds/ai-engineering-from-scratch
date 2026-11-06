---
name: task-store-designer
description: Design durable MCP work with the current Tasks extension, stateless requests, explicit ownership, polling, input updates, and cancellation.
version: 2.0.0
phase: 13
lesson: 13
tags: [mcp, tasks, extension, durable-state, stateless]
---

Thiết kế công việc MCP chạy lâu theo phần mở rộng `io.modelcontextprotocol/tasks`.

Tạo ra:

1. Quyết định đủ điều kiện. Giải thích tại sao thao tác cần tác vụ thay `tools/call` đồng bộ.
2. Hợp đồng khả năng. Cho thấy `supportedVersions`, khả năng, `ttlMs` và `cacheScope` chính xác trong `server/discover`, cộng phần mở rộng Tasks trong khả năng client mỗi yêu cầu. Nếu công bố công cụ, gồm bộ mô tả `tools/list` bắt buộc tất định với `inputSchema` đối tượng hợp lệ, siêu dữ liệu danh tính máy chủ và gợi ý bộ đệm. Dùng `-32021` với đối tượng `requiredCapabilities` khi vắng phần mở rộng và `-32022` với dữ liệu `supported` và `requested` chính xác cho phiên bản không hỗ trợ.
3. Giao dịch tạo. Lưu bền vững tác vụ đến khi `tasks/get` phân giải được, rồi trả `resultType: "task"` do máy chủ quyết định.
4. Hình dạng trạng thái. Gồm `taskId`, `status`, `statusMessage`, dấu thời gian ISO, `ttlMs`, `pollIntervalMs`, chủ sở hữu có thẩm quyền, tham chiếu thao tác gốc, kết quả hoặc lỗi, yêu cầu đầu vào chờ và mọi khóa đầu vào đã cấp. `CallToolResult` lồng của tác vụ hoàn tất có `resultType: "complete"` bắt buộc và NÊN gồm siêu dữ liệu `io.modelcontextprotocol/serverInfo` riêng.
5. Phương thức hiện tại. Định nghĩa `tasks/get`, `tasks/update` và `tasks/cancel`. Với Streamable HTTP, mỗi yêu cầu đặt `Mcp-Name` thành `params.taskId`. Không đưa vào `tasks/status`, `tasks/result` hoặc `tasks/list`.
6. Tiếp nối đầu vào. Tách MRTR trước tạo khỏi `tasks/get` cộng `tasks/update` sau tạo. Yêu cầu khóa đầu vào duy nhất suốt vòng đời và xử lý phản hồi từng phần.
7. Kế hoạch bền vững. Chọn lưu trữ hệ thống file nguyên tử, cơ sở dữ liệu giao dịch hoặc hàng đợi và kho dùng chung. Gồm leasing worker và hành vi khởi động lại.
8. Chính sách sở hữu. Cấp quyền mọi phương thức tác vụ và đăng ký theo tenant và chủ thể. Không bao giờ coi biết id tác vụ là quyền.
9. Hợp đồng hủy. Nêu xác nhận là hợp tác và có thể không dẫn đến `cancelled`.
10. Tùy chọn thông báo. Dùng `subscriptions/listen` trên luồng SSE phản hồi POST và `notifications/tasks`, lấy thăm dò làm nền tảng. Đặt `io.modelcontextprotocol/subscriptionId`, bằng id yêu cầu listen, trong xác nhận và mọi thông báo tác vụ. Thông báo không id không nhận phản hồi JSON-RPC; thông báo HTTP được chấp nhận nhận `202` không phần thân.
11. Chính sách hết hạn. Diễn giải `ttlMs` từ lúc tạo, định nghĩa hành vi xóa sạch và tránh rò việc tác vụ tenant khác tồn tại hay không.
12. Bản đồ chuyển đổi. Thay cờ tác vụ do client yêu cầu và phương thức thử nghiệm đã bỏ bằng luồng phần mở rộng hiện tại.

Các trường hợp bác bỏ tuyệt đối:

- Trả handle tác vụ trước khả năng đọc thấy bền vững.
- Trả `resultType: "task"` cho yêu cầu không công bố phần mở rộng.
- Dùng `params._meta.task.required`, `tasks/status`, `tasks/result` hoặc `tasks/list` làm API hiện tại.
- Dùng `initialize`, `Mcp-Session-Id`, định tuyến bám dính hoặc trạng thái phiên vận chuyển ẩn làm kho tác vụ.
- Coi xác nhận `tasks/cancel` là bằng chứng worker đã dừng.
- Dùng lại khóa `inputRequests` trong một vòng đời tác vụ.
- Trả tác vụ cho bên gọi không phải chủ sở hữu có thẩm quyền.
- Triển khai phân phối thông báo qua GET độc lập, SSE phiên hoặc phát lại `Last-Event-ID`.

Quy tắc từ chối:

- Từ chối tác vụ cho tra cứu tất định nhanh trừ khi bên gọi cho yêu cầu bền vững cụ thể.
- Từ chối kho sản xuất chỉ trong bộ nhớ khi công việc phải sống qua khởi động lại tiến trình.
- Từ chối payload kết quả không giới hạn; lưu sản phẩm lớn bên ngoài và trả handle tài nguyên được cấp quyền.
- Từ chối endpoint lịch sử không có sở hữu tenant, lọc, phân trang và chính sách giữ lại tường minh.

Xuất thiết kế một trang với bảng vòng đời, phương thức đường truyền, giao dịch lưu bền vững, quy tắc sở hữu, luồng đầu vào, nhịp thăm dò, ngữ nghĩa hủy, tùy chọn đăng ký, dọn hết hạn, mô hình thất bại và bản đồ chuyển đổi cũ.
