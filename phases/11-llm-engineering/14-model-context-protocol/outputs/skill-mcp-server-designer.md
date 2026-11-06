---
name: mcp-server-designer
description: Design a stateless MCP 2026-07-28 server with explicit discovery, state, transport, and safety contracts.
version: 2.0.0
phase: 11
lesson: 14
tags: [llm-engineering, mcp, stateless, tool-use]
---

Với một miền (API nội bộ, cơ sở dữ liệu, nguồn file) và các host sẽ gắn máy chủ, xuất:

1. Bản đồ thành phần cơ bản. Năng lực nào thành `tools` (hành động), năng lực nào thành `resources` (dữ liệu chỉ đọc), năng lực nào thành `prompts` (khuôn mẫu do người dùng gọi). Một dòng mỗi thành phần.
2. Hợp đồng khám phá. Soạn `server/discover` với đúng các phiên bản triển khai hỗ trợ, năng lực, danh tính máy chủ, chỉ dẫn, `ttlMs` và `cacheScope`.
3. Hợp đồng yêu cầu. Yêu cầu phiên bản giao thức dạng chuỗi và năng lực client dạng đối tượng trong `params._meta` trên mọi yêu cầu. Khuyến nghị danh tính client. Trả Invalid Params (`-32602`) khi metadata bắt buộc thiếu hoặc sai kiểu. Chỉ trả `UnsupportedProtocolVersionError` (`-32022`) với `data.supported` và `data.requested` cho chuỗi phiên bản được cung cấp mà máy chủ không triển khai.
4. Hợp đồng kết quả. Thêm `resultType`, metadata danh tính máy chủ, thứ tự danh sách tất định và chính sách cache vào mọi kết quả áp dụng.
5. Kế hoạch MRTR. Chỉ dùng `input_required` cho `tools/call`, `resources/read` hoặc `prompts/get`. Bao gồm ít nhất một trong `inputRequests` hoặc `requestState` mờ; thử lại phương thức gốc với ID JSON-RPC mới, phản hồi đầu vào tương ứng khi được yêu cầu và đúng giá trị trạng thái khi có.
6. Kế hoạch trạng thái. Với mọi quy trình nhiều lệnh gọi, định nghĩa handle mờ do máy chủ tạo, truyền như đối số công cụ thông thường. Không ẩn trạng thái sau kết nối hoặc phiên giao thức.
7. Kế hoạch truyền tải và phân quyền. Chọn stdio hoặc endpoint POST Streamable HTTP 2026-07-28. Với HTTP, định nghĩa xác thực Origin và phân quyền mỗi yêu cầu. Yêu cầu `MCP-Protocol-Version` trên yêu cầu POST, `Mcp-Method` trên yêu cầu JSON-RPC và `Mcp-Name` chỉ cho `tools/call`, `resources/read` và `prompts/get`. POST thông báo được chấp nhận trả HTTP 202 không thân.
8. Bản nháp schema. Viết JSON Schema cho mọi tham số công cụ, với mô tả tinh chỉnh để mô hình chọn và giới hạn rõ cho đầu vào không đáng tin.
9. Danh sách hành động phá hủy. Đánh dấu mọi công cụ thay đổi dữ liệu bằng `destructiveHint: true` và yêu cầu con người phê duyệt.
10. Kế hoạch xác minh. Bao quát thông báo không tạo phản hồi JSON-RPC, phong bì và ID yêu cầu sai định dạng, từ chối metadata, khám phá, danh sách tất định, không khớp phiên bản, trường cache, không khớp header-thân, phân quyền, phê duyệt và một trường hợp prompt-injection.

Loại thiết kế dùng `initialize`, `notifications/initialized`, `Mcp-Session-Id`, HTTP GET độc lập, HTTP DELETE hoặc `Last-Event-ID` làm đường hiện đại. Chỉ cho phép cơ chế đó trong adapter cô lập rõ cho các phiên bản giao thức đến hết 2025-11-25. Không thêm Roots, Sampling hoặc Logging đã ngừng khuyến nghị vào triển khai mới; hỗ trợ tương thích phải được gắn nhãn và đầu vào Roots hoặc Sampling phải dùng MRTR. Từ chối máy chủ ghi đĩa hoặc gọi API bên ngoài mà không phân quyền, xác thực và đường phê duyệt.
