---
name: mcp-request-tracer
description: Audit MCP transcripts message by message across modern stateless and explicit legacy protocol eras.
version: 2.0.0
phase: 13
lesson: 06
tags: [mcp, json-rpc, stateless, metadata, compatibility]
---

Với chuỗi vỏ JSON-RPC MCP, kiểm tra độc lập mỗi thông điệp theo MCP `2026-07-28`. Phát hiện lưu lượng cũ, nhưng không bao giờ giả định có bắt tay hoặc phiên giao thức.

Tạo ra:

1. Chú giải thông điệp. Nêu hướng, loại JSON-RPC, phương thức, thành phần cơ bản, id yêu cầu và thời kỳ phát hiện.
2. Kiểm tra siêu dữ liệu hiện đại. Với mọi yêu cầu, xác minh `params._meta.io.modelcontextprotocol/protocolVersion` và `params._meta.io.modelcontextprotocol/clientCapabilities`. Ghi có `clientInfo` được khuyến nghị hay không.
3. Kiểm tra kết quả. Xác minh mọi thành công hiện đại có `resultType: "complete"` hoặc kiểu kết quả khác được chỉ định, cộng danh tính máy chủ được khuyến nghị trong `_meta` kết quả.
4. Kiểm tra khám phá và phiên bản. Xác minh máy chủ hiện đại triển khai `server/discover`. Diễn giải `-32022` làm bằng chứng hiện đại và kiểm tra `data.requested` cộng `data.supported`.
5. Kiểm tra bộ đệm. Với `server/discover`, phương thức liệt kê và `resources/read`, yêu cầu `ttlMs` và `cacheScope`. Đánh dấu thứ tự danh sách không tất định.
6. Kiểm tra hướng. Từ chối yêu cầu JSON-RPC do máy chủ khởi tạo trong lưu lượng hiện đại. Cho phép thông báo liên quan yêu cầu và luồng `subscriptions/listen` do client mở.
7. Kiểm tra tương thích. Chỉ gắn nhãn `initialize` và `notifications/initialized` là cũ. Không yêu cầu chúng trong lưu lượng hiện đại.

Các trường hợp bác bỏ tuyệt đối:

- Coi tiến trình stdio, kết nối HTTP hoặc `Mcp-Session-Id` là trạng thái giao thức hiện đại.
- Suy khả năng client từ yêu cầu trước.
- Dự phòng về cũ sau lỗi hiện đại đã nhận biết như `-32020`, `-32021` hoặc `-32022`.
- Chấp nhận thành công hiện đại không có `resultType`.

Quy tắc từ chối:

- Nếu bản ghi không phải JSON-RPC 2.0, dừng và xác định vỏ không tương thích.
- Nếu được yêu cầu âm thầm viết lại bằng chứng, từ chối. Giữ bản ghi gốc và tạo ví dụ đã sửa riêng.

Xuất một dòng mỗi thông điệp theo thứ tự đến:

```text
[request/modern/tools] id=7 tools/list metadata=valid
```

Kết thúc bằng số lượng thông điệp hiện đại, cũ, không hợp lệ và mơ hồ, theo sau là hành động khắc phục đầu tiên.
