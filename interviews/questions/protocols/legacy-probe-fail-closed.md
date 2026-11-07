---
id: legacy-probe-fail-closed
title: When an old server is really old
card: protocols
kind: design
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [mcp, client, stdio, legacy, discovery, fail-closed]
minutes: 12
lessons: [phases/13-tools-and-protocols/08-building-an-mcp-client]
manuals: []
practice: []
cheatsheet: [mcp-client-transports]
related: [protocols/stateless-request-metadata, protocols/post-only-streamable-http]
updated: 2026-11-03
---

Host agent của bạn khởi chạy nhiều MCP server qua stdio. Một server là hiện tại. Một server là server lưu trữ cũ chỉ hiểu `initialize`. Một server là hiện tại nhưng khởi động chậm. Một đồng đội đề xuất một quy tắc đơn giản: gửi `server/discover`, và với bất kỳ lỗi hoặc timeout nào thì gửi `initialize`. Thiết kế khởi động để server chậm không bao giờ bị hạ cấp và server lưu trữ vẫn hoạt động.

## Short answer

Xem một tín hiệu mơ hồ là mơ hồ. Một timeout, một lần đóng kết nối, một phản hồi trống hoặc một lỗi không được nhận diện không định danh một thời kỳ, nên client đóng khi thất bại trừ khi đúng peer đó được cấu hình với `allow_legacy=True`. Một lỗi hiện đại được nhận diện như `-32022` chứng minh server là hiện tại và cấm `initialize`. Với peer lưu trữ trong danh sách cho phép, gửi một `initialize` dưới một thời hạn do transport thực thi và chỉ chọn thời kỳ legacy sau một kết quả dương tính hợp lệ về cấu trúc.

## Full answer

### Three outcome classes for the probe

| Kết quả của `server/discover` | Ý nghĩa | Bước tiếp theo |
|---|---|---|
| một `DiscoverResult` | server hiện tại | chọn phiên bản cao nhất được cả hai hỗ trợ và tiếp tục với metadata theo từng yêu cầu |
| một lỗi hiện đại được nhận diện | server hiện tại | sửa yêu cầu hoặc thử lại một phiên bản được quảng bá; không bao giờ gửi `initialize` |
| một tín hiệu mơ hồ | không xác định | đóng khi thất bại, trừ khi peer đã ghim này cho phép một lần thăm dò legacy có giới hạn |

Các lỗi hiện đại được nhận diện là `-32020` HeaderMismatch, `-32021` MissingRequiredClientCapability và `-32022` UnsupportedProtocolVersion. Chúng vẫn là hiện đại ngay cả khi peer nằm trong danh sách legacy được cho phép, vì một server sử dụng vốn từ lỗi hiện đại sẽ bị hạ cấp bởi `initialize`.

`-32601` không phải bằng chứng legacy dương tính. Nó chỉ khiến một peer được cho phép tường minh đủ điều kiện cho một lần thăm dò, và một timeout, một lần đóng kết nối hoặc một phản hồi trống cũng vậy.

### The allowlist is intent, not evidence

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

Gắn lựa chọn với lệnh hoặc endpoint đã cấu hình. Một wildcard sẽ cho phép một server tùy ý tự chọn vào ngữ nghĩa yếu hơn. Một peer không có cờ thất bại sau một kết quả mơ hồ và không bao giờ nhận `initialize`.

### Positive legacy evidence

Lần `initialize` duy nhất chạy dưới `legacy_probe_timeout_ms`, mà một adapter thực phải thực thi. Client sau đó yêu cầu tất cả những điều sau:

- một phản hồi JSON-RPC `2.0` với id yêu cầu khớp;
- đúng một `result` và không có `error`;
- một `protocolVersion` trong tập bản sửa đổi legacy đã cấu hình của client;
- một `capabilities` có giá trị đối tượng;
- một đối tượng `serverInfo` với các chuỗi `name` và `version` không trống.

Bất kỳ điều gì khác để peer ở `unknown` và không khả dụng. Chỉ sau khi mọi kiểm tra đạt, client mới gửi `notifications/initialized` và dùng các hình dạng yêu cầu legacy trong thời gian tồn tại của transport đó.

### After the era is chosen

Cache thời kỳ theo từng peer transport và không thăm dò trước mỗi lệnh gọi. Khi transport khởi động lại hoặc endpoint thay đổi, bỏ cache và thương lượng lại. Sau đó gọi `tools/list`, sắp xếp kết quả trước khi gộp, và áp dụng một chính sách va chạm đã khai báo: thêm tiền tố cho các tên trùng sau thành `<server>/<tool>` hoặc từ chối tên trùng với cả hai tên peer trong lỗi. Không bao giờ ghi đè âm thầm.

### Why the slow server survives

Lần thăm dò đầu tiên của nó hết thời gian chờ, đó là một tín hiệu mơ hồ. Nó không nằm trong danh sách cho phép, nên client đánh dấu nó không khả dụng thay vì gửi `initialize`. Một lần thử lại `server/discover` sau đó thành công và peer tham gia như một server hiện tại với thời kỳ đúng.

## Follow-ups

- **Level 3:** Peer lưu trữ được cho phép trả lời `-32022` cho discovery. Thời kỳ nào? Expected: hiện tại; một lỗi hiện đại được nhận diện cấm thăm dò legacy, nên chọn từ `data.supported` và thử lại với một id yêu cầu mới.
- **Level 3:** Lần thăm dò `initialize` hết thời gian chờ. Peer ở trạng thái nào? Expected: `unknown` và không khả dụng; không thời kỳ nào được chọn và `notifications/initialized` không bao giờ được gửi.
- **Level 4:** Một server legacy chấp nhận `tools/list` trước khởi tạo. Tại sao điều đó khiến khám phá trước an toàn hơn trên stdio? Expected: thành công mơ hồ sẽ che giấu thời kỳ; `server/discover` tạo một ranh giới thời kỳ rõ ràng trước bất kỳ thao tác nào.
- **Level 4:** Tiến trình lưu trữ gặp sự cố và khởi động lại. Bạn có dùng lại thời kỳ legacy đã cache không? Expected: không; bỏ cache thời kỳ peer, khám phá lại, liệt kê lại, mở lại các subscription, và chỉ thử lại các thao tác an toàn với id mới.

## Wrong answers

- "Bất kỳ lỗi nào từ discovery nghĩa là server cũ." Một yêu cầu sai định dạng, một server quá tải, một tiến trình đã chết và một server cũ đều có thể tạo cùng một timeout hoặc lần đóng.
- "Gửi `initialize` trước; một server hiện tại sẽ từ chối nó." Gửi `initialize` đến một server hiện tại là hạ cấp và không bao giờ được là đường mặc định.
- "Một lỗi không tìm thấy phương thức chứng minh server là legacy." Nó chỉ khiến một peer được cho phép đủ điều kiện cho một lần thăm dò có giới hạn; bằng chứng dương tính là một kết quả `initialize` hợp lệ.

## Taught in

[Bài học về client](../../../phases/13-tools-and-protocols/08-building-an-mcp-client/) định nghĩa các kết quả thăm dò, danh sách cho phép và danh sách kiểm tra bằng chứng dương tính.
