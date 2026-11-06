---
name: mcp-apps-spec
description: Design and review an MCP App contract on the stateless 2026-07-28 protocol.
version: 2.0.0
phase: 13
lesson: 14
tags: [mcp, apps, stateless, ui-resources, csp, sandbox]
---

Với công cụ MCP có thể cần view tương tác, tạo hợp đồng không phụ thuộc framework.

## Required inputs

- Tên công cụ, đối số, kết quả văn bản thường và kết quả có cấu trúc.
- Tương tác người dùng view phải hỗ trợ.
- Độ nhạy dữ liệu và phản hồi có đổi theo ngữ cảnh cấp quyền không.
- Quyền trình duyệt và origin ngoài view cần.
- Hành vi chỉ văn bản cho host không hỗ trợ Apps.

## Produce

1. Vỏ lõi hiện tại. Cho thấy `2026-07-28`, `protocolVersion`, `clientCapabilities` mỗi yêu cầu, `clientInfo` khuyến nghị, header `Mcp-Method` và `Mcp-Name` khớp và phản hồi `resultType`.
2. Mục khám phá. Công bố `io.modelcontextprotocol/ui` trong `server/discover`, với `ttlMs` và `cacheScope` thận trọng.
3. Khai báo công cụ. Đặt `_meta.ui.resourceUri` lồng trên công cụ `tools/list` trả. Không chờ `tools/call` để lộ UI.
4. Hợp đồng tài nguyên. Gồm siêu dữ liệu `resources/list` tất định trước `resources/read`. Cho một URI `ui://` chuẩn, tên và mô tả ổn định, `text/html;profile=mcp-app`, gợi ý bộ đệm, danh sách miền CSP (`connectDomains`, `resourceDomains`, `frameDomains`, `baseUriDomains`) và đối tượng quyền tối thiểu.
5. Hợp đồng kết quả. Trả văn bản hữu ích và dữ liệu có cấu trúc dù host kết xuất App hay không.
6. Hợp đồng bridge. Liệt kê mọi `ui/*` Apps hoặc phương thức proxy, origin thông điệp chính xác, lược đồ đối số, lược đồ kết quả và kiểm tra đồng ý phía host.
7. Dự phòng. Mô tả công cụ và kết quả khi client bỏ khả năng phần mở rộng Apps.
8. Bảng xác minh. Bao phủ HTTP 400 `-32020` header không khớp trước định tuyến, HTTP 400 `-32022` với dữ liệu phiên bản hỗ trợ và yêu cầu chính xác, HTTP 400 `-32021` với `data.requiredCapabilities`, HTTP 404 `-32601`, thông báo 202 phần thân rỗng, vi phạm CSP, nội dung không đáng tin, lời gọi bridge không được cấp quyền và dự phòng văn bản.
9. Ranh giới vận chuyển. Nếu triển khai nhận yêu cầu và header đã phân tích, gắn nhãn mô hình giao thức trong tiến trình và nối với adapter Streamable HTTP đầy đủ Bài 09. Adapter thật phải yêu cầu Content-Type JSON và giá trị Accept chứa JSON cộng SSE.

## Hard rejects

- Nhánh `initialize`, `notifications/initialized` hoặc `Mcp-Session-Id` lõi trình bày như MCP hiện tại.
- Origin đích `postMessage` ký tự đại diện hoặc bên nhận bỏ xác thực `event.origin`.
- Liên kết UI chỉ lộ sau công cụ chạy.
- Danh sách miền CSP ký tự đại diện, origin mạng không giới hạn hoặc quyền không có tính năng hiển thị.
- HTML do người dùng kiểm soát chèn không có ranh giới làm sạch xác định.
- Hành động UI có hệ quả coi nhấp iframe là cấp quyền host.
- Máy chủ công bố tài nguyên nhưng bỏ `resources/list`.
- Mọi phần thân phản hồi JSON-RPC cho thông báo không có `id`.

## Compatibility boundary

Siêu dữ liệu UI phẳng cũ có thể đọc để dự phòng, nhưng đầu ra mới dùng `_meta.ui.resourceUri` lồng. `ui/initialize` chỉ được phép khi xác định là bắt tay postMessage Apps. Không bao giờ thay cho khởi tạo lõi MCP đã bỏ.

## Output format

Trả thiết kế gọn với tiêu đề này: Core Wire, Discovery, Tool, Resource, Result, Bridge, Security, Fallback, Verification. Kết thúc bằng giả định origin, quyền hoặc đồng ý rủi ro nhất.
