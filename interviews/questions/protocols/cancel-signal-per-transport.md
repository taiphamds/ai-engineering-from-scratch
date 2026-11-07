---
id: cancel-signal-per-transport
title: Three cancellations that look like one
card: protocols
kind: concept
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [ml-depth, coding]
tags: [mcp, cancellation, stdio, streamable-http, tasks]
minutes: 8
lessons: [phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control]
manuals: []
practice: []
cheatsheet: [mcp-client-transports, mcp-tasks-elicitation-apps]
related: [protocols/retry-is-not-idempotency]
updated: 2026-11-03
---

Một thư viện client cung cấp một phương thức `cancel(request)` hoạt động giống nhau trên stdio và trên Streamable HTTP: nó ghi hoặc POST một thông báo `notifications/cancelled` cho id yêu cầu. Qua HTTP, các server tiếp tục chạy công việc và đôi khi gửi một phản hồi sau khi hủy. Một phương thức thứ hai, `cancelTask`, trả về thành công, giao diện hiển thị "đã dừng", và worker tiếp tục chạy. Cả hai phương thức sai ở đâu?

## Short answer

Việc hủy phụ thuộc vào transport, và một tác vụ bền vững là một thứ thứ ba. Trên stdio, client gửi `notifications/cancelled` với id yêu cầu và không nhận phản hồi. Trên Streamable HTTP, tín hiệu là đóng stream phản hồi của yêu cầu đó, và một thông báo hủy được POST là tín hiệu sai. `tasks/cancel` xác nhận ý định cho một tác vụ bền vững có thể ở `working` cho đến khi một checkpoint của worker quan sát cờ, nên giao diện phải thăm dò cho đến một trạng thái kết thúc.

## Full answer

### Three mechanisms

| Cơ chế | Đích | Tín hiệu | Thành công nghĩa là gì |
|---|---|---|---|
| hủy yêu cầu trên stdio | một RPC đang thực hiện | `notifications/cancelled` | client đã từ bỏ yêu cầu; server nên dừng nếu khả thi |
| hủy yêu cầu trên HTTP | một stream phản hồi đang thực hiện | đóng stream | tương tự |
| `tasks/cancel` | một Task bền vững | một yêu cầu MCP thông thường | server đã xác nhận ý định |

Ý định giống nhau trên cả hai transport: client không còn cần kết quả. Tín hiệu trên đường truyền khác nhau vì stdio chia sẻ một kênh cho mọi thứ, trong khi mỗi yêu cầu HTTP sở hữu phản hồi hoặc SSE stream riêng.

### Cancellation is a race

Hai thứ tự đều hợp lệ. Nếu việc hủy đến trước, server đánh dấu yêu cầu đã hủy và không gửi phản hồi khi worker hoàn tất. Nếu worker ghi nhận trước, server gửi phản hồi và bỏ qua thông báo muộn, và client bỏ qua một phản hồi muộn cho yêu cầu nó đã từ bỏ. Không bên nào có thể chứng minh bên kia thấy sự kiện nào trước. Các lần hủy sai định dạng, không xác định và đã hoàn tất bị bỏ qua, vì biến những cuộc đua đó thành lỗi sẽ tạo ra nhiều cuộc đua hơn.

### What a server may send

Một server không dùng `notifications/cancelled` để hủy các lệnh gọi client tùy ý. Trên stdio, việc hủy do server gửi được dành riêng cho việc chấm dứt một yêu cầu `subscriptions/listen`. Các thông báo tiến độ phải tăng và dừng sau khi hoàn tất hoặc hủy.

### Why the task outlives the connection

Lý do tạo một Task là vòng đời của nó kéo dài hơn một yêu cầu và một kết nối. Không xóa trạng thái tác vụ khi kết nối HTTP đóng, và không xem một kết quả `tasks/cancel` là bằng chứng worker đã dừng. Thăm dò Task cho đến một trạng thái kết thúc.

### Two timeouts, not one

Một lần hủy thường đến từ một timeout. Dùng một timeout không hoạt động mà tiến độ có thể đặt lại và một timeout tối đa tính từ lúc bắt đầu yêu cầu mà không gì đặt lại. Một bình luận keepalive trên stream không phải tiến độ.

## Follow-ups

- **Level 2:** Server nhận một lần hủy cho một yêu cầu đã hoàn tất. Nó có trả về một lỗi không? Expected: không, nó bỏ qua thông báo; trong mọi trường hợp, một thông báo không nhận phản hồi.
- **Level 3:** Worker ghi nhận một biến đổi ngay trước khi việc hủy đến server. Mỗi bên làm gì? Expected: server đã gửi phản hồi và bỏ qua thông báo muộn; client bỏ qua phản hồi muộn, và hợp đồng idempotency quyết định liệu thử lại có an toàn không.
- **Level 3:** Khi nào chính server được gửi `notifications/cancelled`? Expected: chỉ trên stdio, để chấm dứt một yêu cầu `subscriptions/listen`; không bao giờ cho các lệnh gọi client thông thường.
- **Level 4:** Một stream `subscriptions/listen` rớt giữa tác vụ. Task phía sau nó có thay đổi trạng thái không? Expected: không; client mở một yêu cầu listen mới với một id mới và lấy lại Task, và trạng thái bền vững không bị ảnh hưởng bởi stream bị rớt.

## Wrong answers

- "Cũng POST `notifications/cancelled` qua HTTP, cho đối xứng." Mỗi yêu cầu HTTP sở hữu stream phản hồi của nó, và đóng nó là tín hiệu khớp với thời gian tồn tại của yêu cầu.
- "Một `tasks/cancel` thành công nghĩa là worker đã dừng." Nó xác nhận yêu cầu. Tác vụ có thể giữ ở `working` cho đến một checkpoint, và công việc có thể hoàn tất trước.
- "Trả về một lỗi cho việc hủy một id yêu cầu không xác định." Các lần hủy không xác định, sai định dạng và đã hoàn tất bị bỏ qua theo thiết kế.

## Taught in

[Bài học về độ tin cậy](../../../phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/) cung cấp ba cơ chế và cả hai thứ tự của cuộc đua.
