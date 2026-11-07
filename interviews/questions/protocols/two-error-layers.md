---
id: two-error-layers
title: A protocol error is not a tool error
card: protocols
kind: concept
level: 1
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, coding]
tags: [mcp, json-rpc, iserror, output-schema, tools]
minutes: 6
lessons: [phases/13-tools-and-protocols/07-building-an-mcp-server, phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content]
manuals: []
practice: []
cheatsheet: [mcp-server-build]
related: [protocols/tool-resource-or-prompt]
updated: 2026-11-03
---

MCP server của bạn có một tool `route_report` đọc một báo cáo từ một nguồn phía trước. Một người review đọc handler và tìm thấy hai điều. Khi nguồn phía trước ngừng hoạt động, handler trả về một lỗi JSON-RPC. Khi một client gửi một tên tool mà server không biết, handler trả về một kết quả với `isError: true`. Đó có phải cách phân chia đúng không?

## Short answer

Không, cả hai trường hợp đều bị ngược. Một lỗi JSON-RPC nghĩa là yêu cầu hoàn toàn không thể được điều phối: một tên tool không xác định, một vỏ thông điệp sai định dạng, metadata yêu cầu bị thiếu hoặc một cursor không hợp lệ. Một kết quả hoàn chỉnh với `isError: true` nghĩa là một lệnh gọi hợp lệ đã đến tool và tool báo cáo một lỗi mà mô hình có thể hành động dựa vào, như một nguồn hiện đang không khả dụng.

## Full answer

### Two layers, two audiences

| Lớp | Dùng cho | Ai sửa nó |
|---|---|---|
| `error` JSON-RPC | vỏ thông điệp hoặc các tham số phương thức không hợp lệ | client hoặc lập trình viên |
| kết quả với `isError: true` | tool đã chạy và báo cáo một lỗi có thể hành động | thường là mô hình, bằng cách đổi các đối số hoặc chờ |

Một mô hình có thể đọc "nguồn báo cáo không khả dụng" và thử sau hoặc báo cho người dùng. Nó không thể sửa một server đã từ chối một yêu cầu đúng định dạng như một lỗi tool, vì nó không biết yêu cầu chưa bao giờ chạy.

### The output schema still holds

Một khi server công bố một `outputSchema`, mọi kết quả hoàn chỉnh cam kết `structuredContent` tuân thủ. Cờ `isError` phân loại kết quả. Nó không miễn hợp đồng. Vì vậy hãy mô hình hóa lỗi bên trong schema. Lỗi `route_report` mẫu trả về vùng được yêu cầu với `accepted: false`, cộng văn bản lỗi, cộng `isError: true`.

### Wrong codes send the wrong signal

Metadata yêu cầu bị thiếu là invalid params, `-32602`. Một phiên bản giao thức không được hỗ trợ là `-32022` với `requested` và `supported` trong dữ liệu lỗi. Một phương thức không xác định là một lỗi không tìm thấy phương thức. Giữ những điều đó riêng biệt, vì client đọc mã để quyết định sửa yêu cầu, thử lại một phiên bản khác, hay dừng.

### Annotations do not decide any of this

`readOnlyHint`, `destructiveHint`, `idempotentHint` và `openWorldHint` là các gợi ý cho trình bày và xác nhận. Server vẫn thực thi ủy quyền, và client vẫn xác thực kết quả.

## Follow-ups

- **Level 1:** Một yêu cầu đến mà không có phiên bản giao thức trong `params._meta`. Mã nào? Expected: `-32602`, invalid params, không bao giờ được điền từ một lệnh gọi trước đó.
- **Level 2:** Tool công bố một schema đầu ra. Một kết quả lỗi có phải khớp với nó không? Expected: có; mọi kết quả hoàn chỉnh, bao gồm cả `isError: true`, phải trả về `structuredContent` tuân thủ.
- **Level 2:** Tại sao host xác thực `structuredContent` thay vì tin descriptor? Expected: một server có thể vi phạm schema riêng, một mô hình không thể sửa điều đó, nên client xác thực trước khi mô hình dùng.
- **Level 3:** Một lệnh gọi tool hợp lệ có một đối số không vượt qua schema đầu vào. Lớp nào? Expected: các tham số phương thức không hợp lệ, nên là một lỗi JSON-RPC; mô hình TypeScript của capstone thay vào đó trả về một kết quả hoàn chỉnh với `isError: true` mà không gọi bộ thực thi, nên hãy nêu lựa chọn của bạn và áp dụng nó ở mọi nơi.

## Wrong answers

- "Trả về `isError` cho mọi thứ để mô hình luôn nhận được văn bản." Một vỏ thông điệp sai định dạng khi đó trông như một lỗi tool, và mô hình thử lại một yêu cầu không bao giờ có thể chạy.
- "Một tool không xác định là một lỗi tool." Lệnh gọi chưa bao giờ đến một tool, nên nó là một lỗi điều phối ở lớp giao thức.
- "Một kết quả lỗi có thể bỏ qua schema đầu ra." Cờ phân loại kết quả, và hợp đồng đã công bố vẫn được giữ.

## Taught in

[Bài học về server](../../../phases/13-tools-and-protocols/07-building-an-mcp-server/) nêu hai lớp, và [bài học về hợp đồng tool](../../../phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/) ràng buộc các kết quả lỗi với schema đầu ra.
