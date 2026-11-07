---
id: stateless-request-metadata
title: Why every MCP request repeats its metadata
card: protocols
kind: concept
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [ml-breadth, system-design]
tags: [mcp, stateless, json-rpc, discovery, protocol-version]
minutes: 8
lessons: [phases/13-tools-and-protocols/06-mcp-fundamentals, phases/13-tools-and-protocols/07-building-an-mcp-server]
manuals: []
practice: []
cheatsheet: [mcp, mcp-server-build]
related: [protocols/two-error-layers, protocols/post-only-streamable-http]
updated: 2026-11-03
---

Một đồng nghiệp chuyển một MCP server từ bản sửa đổi 2025. Bản chuyển giữ handshake `initialize` và lưu các capability mà client khai báo trên đối tượng kết nối cho các yêu cầu sau. Mọi kiểm thử cũ đều đạt. Điều gì bị phá vỡ theo bản sửa đổi hiện tại, và metadata phải nằm ở đâu thay vào đó?

## Short answer

Bản sửa đổi hiện tại không có handshake và không có phiên giao thức. Một server nhớ capability từ một thông điệp trước đó có thể áp dụng sai quyền hoặc sai hình dạng trên đường truyền cho yêu cầu tiếp theo, có thể đến từ một client khác trên cùng tiến trình hoặc đến một worker khác. Mọi yêu cầu mang `io.modelcontextprotocol/protocolVersion` và `io.modelcontextprotocol/clientCapabilities` trong `params._meta`, và server xác thực chúng trên mỗi yêu cầu và quên chúng sau khi trả lời.

## Full answer

### The request is the unit of interpretation

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {"name": "course-client", "version": "1.0.0"}
    }
  }
}
```

Phiên bản và các capability là bắt buộc. `clientInfo` được khuyến nghị, tự báo cáo, và không bao giờ là thông tin xác thực. Server không được suy ra bất kỳ thứ nào trong số này từ một yêu cầu trước đó, một tiến trình stdio, một kết nối HTTP hoặc chỉ một header transport.

### What the server returns

Mọi kết quả thành công bao gồm `resultType: "complete"` và nên mang `io.modelcontextprotocol/serverInfo` trong `_meta` của nó. Các kết quả danh sách, `resources/read` và `server/discover` cũng mang `ttlMs` và `cacheScope`, với thứ tự xác định để các kết quả bằng nhau cho các khóa cache ổn định.

### Discovery is a method, not a gate

Mọi server phải triển khai `server/discover`. Nó trả về `supportedVersions`, các capability, các chỉ dẫn tùy chọn và danh tính server. Một client có thể gọi nó trước, nhưng cũng có thể gửi `tools/list` ngay, vì yêu cầu đó đã mang metadata.

### The error codes that replace negotiation

| Trường hợp | Mã |
|---|---|
| metadata thiếu hoặc sai định dạng | `-32602` |
| header không thống nhất với phần thân tại một ranh giới HTTP | `-32020` |
| phiên bản đã khớp nhưng không được hỗ trợ | `-32022`, với `requested` và `supported` |

Client chọn một phiên bản được cả hai hỗ trợ từ `supported` và thử lại với một id yêu cầu mới.

### Keep the eras apart

Các bản sửa đổi đến `2025-11-25` dùng `initialize`, `notifications/initialized` và các capability có phạm vi theo kết nối. Một server hai thời kỳ có thể giữ đường đó như một adapter legacy cô lập mà nó chỉ chọn khi nhận `initialize`. Nó không bao giờ định tuyến một yêu cầu hiện tại qua đường handshake và không bao giờ đóng dấu `resultType` lên các kết quả legacy.

### Application state is still allowed

Một workflow hoặc một bản nháp có thể nằm phía sau một handle mờ trong một kho dùng chung. Client gửi handle như một đối số thông thường, và mọi replica xác thực danh tính và ủy quyền việc dùng nó. Ngữ cảnh giao thức không được rò vào kho đó như một thứ thay thế cho phiên đã bị loại bỏ.

## Follow-ups

- **Level 2:** `clientInfo` có bắt buộc không, và bạn có thể ủy quyền dựa trên nó không? Expected: nó được khuyến nghị, không bắt buộc; nó là dữ liệu hiển thị và gỡ lỗi và không bao giờ là thông tin xác thực.
- **Level 2:** Một client gửi `tools/list` mà không gọi `server/discover`. Server có từ chối nó không? Expected: không; yêu cầu mang phiên bản và các capability, nên discovery không phải một cổng.
- **Level 3:** Việc đóng stdin hoặc kết thúc một phản hồi HTTP chấm dứt điều gì? Expected: chỉ hoạt động transport; không có phiên giao thức để kết thúc, và yêu cầu tiếp theo vẫn phải tự mô tả.
- **Level 4:** Một workflow nhiều bước giữ trạng thái ở đâu bây giờ? Expected: phía sau một handle mờ do server tạo trong một kho bền vững dùng chung, được trả về như một kết quả thông thường, gắn với principal đã xác thực, có thời hạn, và được ủy quyền ở mọi lần dùng.

## Wrong answers

- "Stateless nghĩa là server không thể giữ bất kỳ trạng thái nào." Trạng thái ứng dụng bền vững phía sau một handle tường minh được cho phép. Chỉ ngữ cảnh giao thức ẩn bị loại bỏ.
- "Gửi `initialize` trước để an toàn với mọi server." Một server hiện tại không được nhận `initialize` theo mặc định. Legacy là một phương án dự phòng được ghi tài liệu cho một peer đã ghim.
- "Kết nối định danh client, nên một kiểm tra capability cho mỗi kết nối là đủ." Hai client có thể dùng chung một tiến trình hoặc worker HTTP theo trình tự, và một yêu cầu từ xa có thể đến bất kỳ replica nào.

## Taught in

[Bài học nền tảng](../../../phases/13-tools-and-protocols/06-mcp-fundamentals/) lần theo một yêu cầu từ xác thực đến một kết quả hoàn chỉnh, và [bài học về server](../../../phases/13-tools-and-protocols/07-building-an-mcp-server/) xây dựng vòng lặp điều phối.
