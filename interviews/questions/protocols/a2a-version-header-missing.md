---
id: a2a-version-header-missing
title: Two errors from a client that forgot the version
card: protocols
kind: debug
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-developer-relations-engineer]
rounds: [debugging, coding]
tags: [a2a, versioning, json-rpc, migration, headers]
minutes: 8
lessons: []
manuals: [a2a-101#s-version-and-extension-headers, a2a-101#s-from-0-3-to-1-0]
practice: []
cheatsheet: [a2a, a2a-and-agent-messaging]
related: [protocols/a2a-card-before-the-call, protocols/a2a-rejected-task-loop]
updated: 2026-11-03
---

Một client được viết cho một bản phát hành A2A cũ hơn gọi một agent hiện tại. `SendMessage` đầu tiên của nó chỉ mang các header `Host` và `Content-Type` và nhận HTTP 200 với một lỗi JSON-RPC, mã `-32009`. Lệnh gọi thứ hai gửi `A2A-Version: 1.0`, đặt tên phương thức là `message/send` và nhận mã `-32601`. Giải thích cả hai phản hồi, và nêu hai thay đổi mà client cần.

## Short answer

Cả hai phản hồi là một server hiện tại đang đọc một client cũ. Một `A2A-Version` trống phải được đọc là phiên bản 0.3, và một giao diện chỉ phục vụ 1.0 trả lời `VersionNotSupportedError`; lần chạy được ghi lại báo cáo yêu cầu là `0.3 (no header)` so với `supported: 1.0`. `message/send` là tên phương thức cũ, và 1.0 dùng các tên rpc PascalCase như `SendMessage`, nên lệnh gọi thứ hai là không tìm thấy phương thức. Client phải gửi `A2A-Version: 1.0` trên mọi yêu cầu và chuyển sang các tên 1.0.

## Full answer

### The version header

`A2A-Version` và `A2A-Extensions` là các tham số dịch vụ. Chúng đi dưới dạng header yêu cầu HTTP trong các binding JSON-RPC và HTTP+JSON và dưới dạng các khóa metadata chữ thường trong gRPC. Một phiên bản là `Major.Minor`, và các yêu cầu, phản hồi và card không nên mang một số patch. Server có hai nhiệm vụ: xử lý yêu cầu với ngữ nghĩa của phiên bản đó, và trả về `VersionNotSupportedError` khi giao diện không hỗ trợ nó. Lỗi là `-32009` trong JSON-RPC, `400` trong HTTP+JSON và `FAILED_PRECONDITION` trong gRPC.

Không bao giờ dựa vào server để từ chối một header bị thiếu. Trong so sánh SDK được ghi lại, một server hoàn toàn không bao giờ đọc header, và một server khác chấp nhận header bị thiếu là 1.0. Ba mẫu trong chính đặc tả vẫn gửi giá trị cũ, nên sao chép giá trị từ `protocolVersion` của card, không phải từ một mẫu.

### What else changed

| Khu vực | Cũ | 1.0 |
|---|---|---|
| tên phương thức | `message/send`, `tasks/get`, `tasks/resubscribe` | `SendMessage`, `GetTask`, `SubscribeToTask` |
| các trạng thái tác vụ và vai trò | `"working"`, `"user"` | `TASK_STATE_WORKING`, `ROLE_USER` |
| các part | `TextPart`, `FilePart`, `DataPart` với `kind` | một `Part` có thành viên `text`, `raw`, `url` hoặc `data` nêu kiểu |
| kết thúc một stream | `final: true` trên cập nhật trạng thái cuối | binding đóng stream |
| endpoint của card | `url`, `preferredTransport`, `additionalInterfaces` | `supportedInterfaces[]` với `url`, `protocolBinding`, `protocolVersion` |
| các lỗi | chi tiết vấn đề | một đối tượng `Status` với một chi tiết `ErrorInfo`, cộng `-32008` và `-32009` |

### The change the migration guide misses

Cờ `blocking` cũ mặc định là false, nên một lệnh gửi trả về ngay. Thứ thay thế nó là `returnImmediately` cũng mặc định là false, điều giờ đây nghĩa là lệnh gửi chờ một trạng thái kết thúc hoặc bị gián đoạn. Một client được di trú thăm dò sau một lệnh gửi phải đặt `returnImmediately: true`, nếu không nó giữ một yêu cầu mở cho toàn bộ tác vụ.

### Serving old clients during the overlap

Mỗi SDK có một lớp 0.3. SDK tham chiếu nhận một cờ trên các bộ dựng route cùng một `AgentInterface` thứ hai với `protocolVersion` `0.3` trên card, và định tuyến theo tên phương thức trước kiểm tra phiên bản. Các SDK khác định tuyến theo header hoặc theo một URL thứ hai. Proto mang tính quy phạm ở nơi hướng dẫn di trú nêu một trường mà proto thiếu.

## Follow-ups

- **Level 2:** Tại sao gửi `1.0` mà không phải bản phát hành `1.0.1`? Expected: phiên bản là `Major.Minor`; không số patch nào đi trong các yêu cầu, phản hồi hoặc card.
- **Level 3:** Sau khi sửa, các lệnh gửi của client treo trong suốt mỗi tác vụ. Tại sao? Expected: mặc định `blocking` cũ là false và mặc định `returnImmediately` mới cũng là false, điều giờ đây nghĩa là chờ; đặt nó thành true và thăm dò hoặc đăng ký.
- **Level 3:** Mọi server có từ chối một yêu cầu hoàn toàn không mang phiên bản không? Expected: không; một SDK không bao giờ đọc header và một SDK khác chấp nhận sự vắng mặt của nó, nên client phải gửi nó trên mỗi lệnh gọi.
- **Level 4:** Bạn phải phục vụ cả client cũ và mới trong một quý. Bạn thay đổi gì trên server? Expected: bật lớp 0.3 của SDK, thêm một giao diện thứ hai với `protocolVersion` `0.3` vào card, và định tuyến theo header, tên phương thức hoặc URL như SDK đó làm.

## Wrong answers

- "HTTP 200 nghĩa là lệnh gọi đã hoạt động." Các lỗi JSON-RPC đến bên trong một phản hồi 200; đọc thành viên `error` trước `result`.
- "Gửi phiên bản dưới dạng một tham số truy vấn thay vào đó." Cả hai binding JSON yêu cầu header, và SDK tham chiếu chỉ đọc header.
- "Tên phương thức không phân biệt hoa thường." Các tên là tên rpc PascalCase chính xác, và dạng có dấu gạch chéo cũ là không xác định đối với một server 1.0.

## Taught in

[Phần header phiên bản](../../../manuals/a2a-101/sections/5-4-version-and-extension-headers.md) cho thấy `-32009` được ghi lại và hành vi của từng SDK, và [phần di trú](../../../manuals/a2a-101/sections/7-4-from-0-3-to-1-0.md) ánh xạ mọi trường được đổi tên.
