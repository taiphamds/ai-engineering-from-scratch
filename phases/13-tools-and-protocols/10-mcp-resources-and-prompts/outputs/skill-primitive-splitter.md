---
name: primitive-splitter
description: Review an MCP server design and separate tools, resources, prompts, caching, and subscriptions using the 2026-07-28 contract.
version: 2.0.0
phase: 13
lesson: 10
tags: [mcp, resources, prompts, subscriptions, caching]
---

Đánh giá máy chủ MCP được đề xuất từ góc nhìn bên sử dụng.

Tạo ra:

1. Kết quả `server/discover` công bố bản sửa đổi `2026-07-28` và khả năng tài nguyên, prompt chính xác.
2. Bảng có `name`, `chooser`, `primitive` và `reason`.
3. Lược đồ URI tài nguyên ổn định và mọi mẫu tài nguyên có giới hạn.
4. Tên prompt, mô tả và đối số bắt buộc hoặc tùy chọn.
5. Quy tắc thứ tự tất định cho mọi phương thức danh sách.
6. Chính sách bộ đệm với `ttlMs` và `cacheScope` cho mỗi kết quả có thể lưu đệm.
7. Bộ lọc `subscriptions/listen` cho tài nguyên hoặc thay đổi danh sách cần cập nhật.
8. Một ví dụ tài nguyên không hợp lệ trả JSON-RPC `-32602`, cộng ví dụ bản sửa đổi không hỗ trợ trả `-32022` với `supported` và `requested`.

Dùng các quy tắc quyết định này:

- Thao tác do mô hình chọn là công cụ.
- Nội dung định địa chỉ URI mà host đọc được là tài nguyên.
- Quy trình thông điệp do người dùng chọn là prompt.
- Luồng cập nhật được client mở qua `subscriptions/listen`.
- ID yêu cầu listen thành `io.modelcontextprotocol/subscriptionId`.
- Xác nhận phải đứng trước mọi sự kiện trên đăng ký đó.
- Thông báo không bao giờ bỏ qua cấp quyền cho lần đọc sau.
- `server/discover` bắt buộc ngay cả khi client chọn gọi phương thức khác trước.

Từ chối thiết kế khi:

- Danh sách thay đổi do lịch sử kết nối.
- Kết quả riêng được đặt trong bộ đệm công khai.
- URI tài nguyên được chấp nhận không qua phân tích, cấp quyền và kiểm tra ranh giới.
- Thiết kế dùng `resources/subscribe` hoặc coi đăng ký là phiên giao thức.
- Prompt được phép ghi đè chỉ dẫn host đáng tin cậy.

Trả đánh giá hợp đồng một trang. Kết thúc bằng lỗi thành phần cơ bản, bộ đệm hoặc đăng ký rủi ro cao nhất và sửa đổi nhỏ nhất.
