---
id: a2a-card-before-the-call
title: What an A2A client reads before its first message
card: protocols
kind: concept
level: 1
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, system-design]
tags: [a2a, agent-card, discovery, capabilities]
minutes: 7
lessons: []
manuals: [a2a-101#s-agentcard-fields, a2a-101#s-discovery-and-supported-interfaces]
practice: []
cheatsheet: [a2a]
related: [protocols/a2a-rejected-task-loop]
updated: 2026-11-03
---

Agent lập kế hoạch của bạn phải giao một lần chạy kiểm thử cho một agent từ xa mà nó chỉ biết qua host và cổng. Mô tả nó lấy gì trước, nó quyết định gọi endpoint nào bằng cách nào, và nó kiểm tra gì trước khi yêu cầu agent đó cung cấp một stream.

## Short answer

Nó lấy agent card bằng một GET thuần tới `/.well-known/agent-card.json`. Từ `supportedInterfaces`, nó lấy mục đầu tiên có binding và phiên bản mà nó sử dụng được, và nó gọi URL của mục đó. Trước `SendStreamingMessage`, nó đọc `capabilities.streaming`, vì một server phải từ chối lệnh gọi bằng `UnsupportedOperationError` khi cờ vắng mặt hoặc false.

## Full answer

### One GET, one document

Đặc tả nêu ba đường đến một card: URI well-known, một registry hoặc catalog, và cấu hình trực tiếp. Nó chỉ chuẩn hóa đường thứ nhất. Một bộ lập kế hoạch có các host trong cấu hình lấy từng card từ đường dẫn well-known.

Proto cho `AgentCard` 14 trường, và tám trường là BẮT BUỘC: `name`, `description`, `supportedInterfaces`, `version`, `capabilities`, `defaultInputModes`, `defaultOutputModes` và `skills`. Bốn trong số đó là danh sách, và một danh sách bắt buộc phải chứa ít nhất một phần tử. Từ chối một card thiếu một trường.

### The endpoint comes from the interface list

Mỗi mục `supportedInterfaces` có `url`, `protocolBinding` và `protocolVersion` BẮT BUỘC. Danh sách có thứ tự, và client chọn mục đầu tiên mà nó hỗ trợ. Hỗ trợ nghĩa là một binding và một phiên bản mà client triển khai. Client cũng sao chép `tenant` của mục đó vào mọi yêu cầu, và bỏ trường đó khi mục không có.

### Flags decide which operations exist

| Cờ trong `capabilities` | Các thao tác nó cho phép | Lỗi khi vắng mặt hoặc `false` |
|---|---|---|
| `streaming` | `SendStreamingMessage`, `SubscribeToTask` | `UnsupportedOperationError`, `-32004` |
| `pushNotifications` | bốn thao tác cấu hình push | `PushNotificationNotSupportedError`, `-32003` |
| `extendedAgentCard` | `GetExtendedAgentCard` | `UnsupportedOperationError`, `-32004` |

Một cờ vắng mặt được tính là `false`. Trong lần chạy lỗi được ghi lại, một cấu hình push gửi tới một agent không có cờ nhận `-32003` cho một id tác vụ thậm chí không tồn tại. Card đã trả lời rồi.

### Cache it like any document

Một card hiếm khi thay đổi. Server nên gửi `Cache-Control` với `max-age` và một `ETag`. Client tôn trọng chúng và xác thực lại bằng `If-None-Match`.

## Follow-ups

- **Level 1:** Trường nào cho bạn biết agent có thể làm công việc gì? Expected: `skills`, mỗi skill có một `id`, một `name`, một `description` và ít nhất một tag; chọn agent theo các skill và chế độ media.
- **Level 2:** Card liệt kê một mục gRPC trước và một mục JSON-RPC thứ hai, và client của bạn chỉ sử dụng được JSON-RPC. Bạn gọi URL nào? Expected: URL JSON-RPC, vì quy tắc là mục đầu tiên mà bạn hỗ trợ.
- **Level 2:** Các kiểu media đến agent bằng cách nào? Expected: `defaultInputModes` và `defaultOutputModes` của card, `inputModes` và `outputModes` riêng của một skill, và một `mediaType` trên mỗi part mà client gửi.
- **Level 3:** Bạn giữ một bearer token và card đặt `extendedAgentCard`. Điều gì thay đổi? Expected: gọi `GetExtendedAgentCard` với thông tin xác thực đã khai báo và dùng card đầy đủ hơn thay cho card công khai đã cache trong phiên đó, hoặc cho đến khi `version` của card thay đổi.

## Wrong answers

- "Đọc trường `url` cấp cao nhất của card." Phiên bản hiện tại đã chuyển endpoint vào `supportedInterfaces`, và không có `url` cấp cao nhất.
- "Thử stream và quay về phương án khác khi nó thất bại." Cờ trả lời câu hỏi trước. Lệnh gọi thất bại tốn một vòng khứ hồi vô ích.
- "Đặt id skill trong thông điệp để server chạy skill đó." Không trường nào của `SendMessageRequest` hoặc `Message` nêu tên một skill. Danh sách mô tả agent.

## Taught in

[Phần các trường AgentCard](../../../manuals/a2a-101/sections/2-1-agentcard-fields.md) liệt kê các trường, và [phần khám phá](../../../manuals/a2a-101/sections/2-2-discovery-and-supported-interfaces.md) cung cấp quy tắc giao diện và bảng cờ.
