---
id: draft-lost-across-replicas
title: The draft that vanished on the second replica
card: protocols
kind: debug
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [debugging, system-design]
tags: [mcp, stateless, replicas, state-handle, load-balancer]
minutes: 10
lessons: [phases/13-tools-and-protocols/09-mcp-transports, phases/19-capstone-projects/13-mcp-server-with-registry]
manuals: []
practice: []
cheatsheet: [mcp-server-build]
related: [protocols/post-only-streamable-http, protocols/stateless-request-metadata]
updated: 2026-11-03
---

Một MCP server tài liệu chạy dưới dạng hai replica phía sau một bộ cân bằng tải. Công cụ `draft_create` giữ bản nháp mới trong một dictionary bên trong tiến trình và trả về `{"ok": true}`. Lệnh gọi tiếp theo, `draft_append`, thất bại khoảng một nửa số lần với "không có bản nháp", và các lỗi dừng lại khi người vận hành bật định tuyến cố định. Giải thích lỗi, nói tại sao cách sửa của người vận hành là sai, và thiết kế lại hai công cụ.

## Short answer

Lệnh gọi đầu tạo bản nháp trong bộ nhớ của một replica và không trả về tên cho nó, vì thiết kế giả định kết nối định danh bản nháp. Lệnh gọi thứ hai là một POST mới có thể đến replica khác, nơi có metadata giao thức hợp lệ và không có cách nạp bản nháp. Định tuyến cố định che giấu lỗi cho đến khi một lần khởi động lại, rollout hoặc failover chuyển yêu cầu tiếp theo. Trả về một handle mờ do server tạo từ `draft_create`, giữ bản nháp trong một kho bền vững dùng chung, và cho `draft_append` nhận handle như một đối số thông thường.

## Full answer

### The mechanical failure

1. Yêu cầu A đến replica một và tạo một bản nháp trong tiến trình đó.
2. Phản hồi không trả về handle bản nháp.
3. Yêu cầu B là một POST mới và đến replica hai.
4. Replica hai không thể gọi tên hoặc nạp bản nháp, nên lệnh gọi thất bại hoặc đọc sai đối tượng cục bộ.
5. Định tuyến cố định có vẻ sửa triệu chứng cho đến khi yêu cầu tiếp theo chuyển đi.

Một nửa các lần thêm thất bại vì một nửa các yêu cầu đến replica khác. Không có gì trong bản sửa đổi hiện tại gắn hai yêu cầu với nhau: không có `Mcp-Session-Id`, và mọi yêu cầu đều có thể được diễn giải độc lập.

### The correct boundary

Ngữ cảnh giao thức nằm trong từng yêu cầu. Trạng thái ứng dụng bền vững nằm trong một kho dùng chung dưới một handle mà server tạo và trả về client. Lệnh gọi tiếp theo cung cấp handle, bất kỳ replica nào cũng nạp cùng bản ghi, và ủy quyền gắn bản ghi với principal và tenant đã xác thực. Bộ nhớ replica có thể cache bản ghi. Nó không thể là bản sao duy nhất mà tính đúng đắn cần.

### The redesigned pair

- `draft_create` trả về `{"draftId": "<unguessable>"}` từ một kho dùng chung, gắn với principal, với một thời hạn.
- `draft_append` nhận `draftId` làm đối số, ủy quyền principal cho bản nháp đó trên mỗi lệnh gọi, và áp dụng kiểm soát đồng thời và idempotency cho thao tác thêm.

### Choose the mechanism by lifetime

| Thời gian tồn tại | Cơ chế |
|---|---|
| một lệnh gọi | các biến cục bộ theo yêu cầu |
| một lần tiếp tục MRTR ngắn | `requestState` được bảo vệ tính toàn vẹn và được client gửi lại |
| một bản nháp hoặc tác vụ bền vững | một handle tường minh cùng lưu trữ bền vững dùng chung, thời hạn, kiểm soát đồng thời và idempotency |

Không thứ nào trong số này là một phiên giao thức MCP.

### Prove it

Đặt hai replica stateless phía sau một bộ cân bằng và gửi ít nhất `100` yêu cầu đồng thời. Định tuyến các lệnh gọi liên tiếp tới các replica luân phiên và cho thấy tính đúng đắn không phụ thuộc vào affinity. Thay bộ nhớ tiến trình ẩn bằng một handle tường minh ở bất cứ nơi nào workflow cần lưu trữ bền vững.

## Follow-ups

- **Level 3:** Bộ nhớ replica vẫn được dùng ở đâu? Expected: làm cache của bản ghi đã lưu, không bao giờ là bản sao duy nhất cần cho tính đúng đắn.
- **Level 3:** Bạn kiểm thử cách sửa có đứng vững bằng cách nào? Expected: luân phiên các replica cho các lệnh gọi liên tiếp và chạy nhiều yêu cầu đồng thời; mọi lần thêm phải tìm được bản nháp của nó mà không có affinity.
- **Level 4:** Handle cần gì ngoài tính ngẫu nhiên? Expected: gắn với principal và tenant đã xác thực, thời hạn, ủy quyền ở mỗi lần dùng, và các quy tắc đồng thời cùng idempotency cho các lần thêm.
- **Level 4:** Tại sao không mang bản nháp trong `requestState` thay vì một kho? Expected: `requestState` phù hợp với một lần tiếp tục input-required ngắn; một bản nháp bền vững cần lưu trữ bền vững dùng chung, và một giá trị được client gửi lại không phải lưu trữ.

## Wrong answers

- "Định tuyến cố định đã sửa nó, nên phát hành đi." Affinity bị phá vỡ khi khởi động lại, rollout, lên lịch lại hoặc failover. Tính đúng đắn không được phụ thuộc replica nào trả lời.
- "Sao chép dictionary giữa hai tiến trình." Điều đó giấu ngữ cảnh giao thức trong một kho như một thứ thay thế cho phiên đã bị loại bỏ. Cách sửa là một handle tường minh và lưu trữ dùng chung mà client có thể gọi tên.
- "Dùng `Mcp-Session-Id` để tìm bản nháp." Bản sửa đổi hiện tại bỏ qua header đó và không bao giờ tạo nó.

## Taught in

[Bài học về transport](../../../phases/13-tools-and-protocols/09-mcp-transports/) lần theo lỗi replica ẩn từng bước, và [capstone](../../../phases/19-capstone-projects/13-mcp-server-with-registry/) yêu cầu hai replica không có affinity.
