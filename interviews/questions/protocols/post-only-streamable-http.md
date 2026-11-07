---
id: post-only-streamable-http
title: Sticky sessions, GET streams and resume on the modern wire
card: protocols
kind: concept
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, ml-breadth]
tags: [mcp, streamable-http, transport, sse, subscriptions]
minutes: 9
lessons: [phases/13-tools-and-protocols/09-mcp-transports]
manuals: []
practice: []
cheatsheet: [mcp-client-transports]
related: [protocols/stateless-request-metadata, protocols/draft-lost-across-replicas]
updated: 2026-11-03
---

Một nhóm nền tảng triển khai một MCP server qua Streamable HTTP phía sau một bộ cân bằng tải với hai replica. Họ cấu hình định tuyến cố định được khóa theo `Mcp-Session-Id`, giữ một stream `GET /mcp` độc lập cho các thông báo thay đổi, và lên kế hoạch tiếp tục một stream bị ngắt bằng `Last-Event-ID`. Những thứ nào thuộc bản sửa đổi hiện tại, và điều gì thay thế phần còn lại?

## Short answer

Không thứ nào trong ba thứ thuộc bản sửa đổi hiện tại. Endpoint chỉ chấp nhận POST: `GET /mcp` và `DELETE /mcp` trả về `405`, `Mcp-Session-Id` bị bỏ qua và không bao giờ được tạo, và `Last-Event-ID` bị bỏ qua vì các stream không tiếp tục lại. Các thông báo thay đổi đến trên một POST `subscriptions/listen` do client mở có phản hồi giữ mở dưới dạng SSE, và một stream bị rớt được thay bằng một yêu cầu listen mới và một lần lấy lại dữ liệu bị ảnh hưởng.

## Full answer

### The modern wire in one table

| Thông điệp | Hình dạng HTTP |
|---|---|
| bất kỳ yêu cầu JSON-RPC nào | một POST mới với một thông điệp trong phần thân |
| phản hồi | `application/json` với một phản hồi, hoặc `text/event-stream` với các thông báo liên quan rồi đến phản hồi cuối cùng |
| một thông báo được chấp nhận | `202 Accepted` không có phần thân |
| `GET` hoặc `DELETE` trên endpoint | `405 Method Not Allowed` |

Client quảng bá cả hai kiểu phản hồi bằng `Accept: application/json, text/event-stream`.

### Why stickiness is not needed

Mọi yêu cầu mang phiên bản giao thức và các capability client trong `params._meta`, nên bất kỳ worker khỏe mạnh nào cũng có thể xác thực nó. Ba header phản chiếu phần thân để định tuyến và áp dụng chính sách: `MCP-Protocol-Version`, `Mcp-Method`, và `Mcp-Name` cho `tools/call`, `resources/read` và `prompts/get`. Server so sánh mỗi header với phần thân trước khi thực thi. Một header thiếu hoặc không khớp là HTTP `400` với JSON-RPC `-32020`.

### Where notifications come from

Client gửi `subscriptions/listen` như một yêu cầu thông thường với một bộ lọc `notifications`, chẳng hạn `toolsListChanged: true` và một danh sách `resourceSubscriptions`. Thông điệp đầu tiên trên stream là `notifications/subscriptions/acknowledged`. Mọi sự kiện và kết quả cuối cùng mang `io.modelcontextprotocol/subscriptionId`, bằng id yêu cầu listen. Khi stream rớt, client phát hành lại yêu cầu với một id mới và lấy lại các công cụ, resource hoặc prompt. `resources/subscribe` thuộc thời kỳ legacy.

### What a broken request-scoped stream means

Yêu cầu đang thực hiện bị mất. Client có thể phát hành một yêu cầu mới với một id JSON-RPC mới khi thử lại là an toàn. Nó không được cố tiếp tục stream, và server không được thêm các id SSE để phát lại.

### Two more rules at the boundary

- Xác thực `Origin` bằng khớp chính xác, và trả về `403` khi nó hiện diện và không được cho phép. Các server cục bộ bind vào `127.0.0.1`. Điều này bảo vệ chống DNS rebinding và không phải xác thực danh tính.
- Giữ một cầu nối HTTP+SSE legacy, nếu bạn cần, trên các endpoint riêng, và không bao giờ mô tả stream GET, id phiên hoặc việc phát lại của nó là một phần của bản sửa đổi hiện tại.

## Follow-ups

- **Level 2:** Client hủy một yêu cầu đang thực hiện qua transport này bằng cách nào? Expected: nó đóng stream phản hồi của yêu cầu đó; không có POST hủy.
- **Level 3:** Tại sao một phép kiểm tra `startswith` trên origin đáng tin cậy không an toàn? Expected: nó chấp nhận một hậu tố do kẻ tấn công kiểm soát trên tên host; khớp chính xác origin chuẩn.
- **Level 3:** Một client hai thời kỳ nhận `405` từ một server không xác định. Nó có quay về endpoint GET cũ không? Expected: chỉ sau khi đọc phần thân; một lỗi JSON-RPC hiện đại được nhận diện chứng minh server là hiện đại, và chỉ một phần thân trống hoặc không được nhận diện mới biện minh cho lần thử legacy.
- **Level 4:** Một workflow cần trạng thái qua hai lệnh gọi trên hai replica. Nó nằm ở đâu? Expected: phía sau một handle mờ do server tạo trong một kho dùng chung, được trả về như một kết quả thông thường, gắn với principal, có thời hạn, và được ủy quyền ở mỗi lần dùng.

## Wrong answers

- "Định tuyến cố định vô hại, nên giữ nó như một lưới an toàn." Nó che giấu một lỗi về tính đúng đắn cho đến khi một rollout, một lần lên lịch lại hoặc một failover chuyển yêu cầu tiếp theo sang replica khác.
- "Thêm các id sự kiện SSE để client có thể tiếp tục." Các stream hiện đại không thể tiếp tục lại. Một yêu cầu bị mất được thử lại với một id mới khi thao tác cho phép.
- "Xác thực Origin xác thực danh tính bên gọi." Nó chỉ ngăn DNS rebinding. Một dịch vụ mạng vẫn xác thực danh tính và ủy quyền mọi yêu cầu.

## Taught in

[Bài học về transport](../../../phases/13-tools-and-protocols/09-mcp-transports/) định nghĩa endpoint chỉ dùng POST, các header được phản chiếu và stream `subscriptions/listen`.
