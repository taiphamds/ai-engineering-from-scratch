# Building an MCP Server: Stateless Python and TypeScript

> Máy chủ MCP hiện đại không nhớ bắt tay. Nó xác thực siêu dữ liệu trên mọi yêu cầu, chạy một trình xử lý và trả một kết quả có kiểu.

**Type:** Build
**Languages:** Python, TypeScript
**Prerequisites:** Phase 13, Lesson 06
**Time:** ~85 minutes

## Learning Objectives

- Triển khai `server/discover` bắt buộc cho MCP `2026-07-28`.
- Xác thực phiên bản giao thức và khả năng client trên mọi yêu cầu.
- Cung cấp công cụ, tài nguyên và prompt với thứ tự danh sách tất định.
- Trả `resultType`, danh tính máy chủ và gợi ý bộ đệm trên đúng kết quả.
- Phục vụ cùng hợp đồng không trạng thái qua stdio phân cách bằng dòng mới trong Python và TypeScript.

## The Problem

Máy chủ lưu khả năng client sau thông điệp đầu dễ xây và khó vận hành. Cùng tiến trình có thể phục vụ các client tuần tự. Yêu cầu từ xa có thể đến worker khác. Khai báo khả năng cũ có thể làm rò hành vi qua ranh giới cấp quyền.

MCP `2026-07-28` giải quyết phần giao thức của vấn đề bằng làm mỗi yêu cầu tự mô tả. Ứng dụng vẫn có thể giữ ghi chú, công việc hoặc handle trạng thái tường minh bền vững. Thứ nó không thể giữ là trạng thái giao thức ẩn thay đổi cách giải mã yêu cầu sau.

Bài này xây máy chủ ghi chú hai lần. Bản Python và TypeScript chỉ dùng thư viện chuẩn cho lõi giao thức. Cả hai cung cấp cùng phương thức và bắt buộc cùng hợp đồng đường truyền.

## The Concept

### The modern dispatch loop

```text
read one JSON-RPC line
parse the envelope
if it is a notification, do not respond
validate params._meta for this request
route by method
wrap success with resultType and serverInfo
write one JSON-RPC response line
forget request-scoped metadata
```

Ba quy tắc stdio vẫn quan trọng:

- Chỉ ghi thông điệp JSON-RPC vào stdout. Gửi chẩn đoán đến stderr.
- Phân cách thông điệp bằng dòng mới và đẩy bộ đệm mỗi phản hồi.
- Thoát nhanh khi stdin đến EOF.

Vòng đời tiến trình là vòng đời vận chuyển. Nó không phải phiên MCP hiện đại.

### Request validation

Mọi yêu cầu phải có:

```json
{
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "notes-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Hai trường đầu bắt buộc. `clientInfo` được khuyến nghị. Xác thực hình dạng danh tính khi có, nhưng không coi là xác thực danh tính.

Nếu phiên bản không được hỗ trợ, trả mã `-32022` với `requested` và `supported`. Thiếu siêu dữ liệu yêu cầu là params không hợp lệ, mã `-32602`. Không bao giờ điền trường thiếu từ lời gọi trước.

### Mandatory discovery

Máy chủ hiện đại phải triển khai `server/discover`. Kết quả khám phá đầy đủ gồm phiên bản hiện đại hỗ trợ, khả năng, chỉ dẫn tùy chọn, gợi ý bộ đệm và danh tính máy chủ trong `_meta` kết quả:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": false},
    "resources": {"listChanged": false, "subscribe": false},
    "prompts": {"listChanged": false}
  },
  "ttlMs": 3600000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

Khám phá không mở khóa máy chủ. Client có thể gọi `tools/list` mà không gọi khám phá vì `tools/list` đã mang cùng siêu dữ liệu yêu cầu.

### Tools

`tools/list` trả danh sách bộ mô tả công cụ tất định. Thứ tự ổn định cải thiện lưu đệm phản hồi và giữ ngữ cảnh mô hình ổn định. Kết quả cũng yêu cầu `ttlMs` và `cacheScope`.

`tools/call` trả khối nội dung và `isError`. Dùng lỗi JSON-RPC khi vỏ giao thức hoặc tham số phương thức không hợp lệ. Dùng `isError: true` khi lần gọi công cụ hợp lệ chạy nhưng bản thân công cụ thất bại.

Chú giải công cụ vẫn là gợi ý, không phải cưỡng chế:

- `readOnlyHint`
- `destructiveHint`
- `idempotentHint`
- `openWorldHint`

Host nên dùng chúng để xác nhận và trình bày. Máy chủ vẫn phải thực thi cấp quyền thật.

### Resources

`resources/list` trả bộ mô tả URI ổn định. `resources/read` trả nội dung có kiểu. Cả hai có thể lưu đệm trong `2026-07-28`, nên đều gồm `ttlMs` và `cacheScope`.

Dùng `cacheScope: "private"` cho dữ liệu ghi chú riêng người dùng. Bộ đệm dùng chung không được dùng lại phản hồi riêng qua ngữ cảnh cấp quyền.

Phân phối thay đổi hiện đại không dùng `resources/subscribe`. Client mở `subscriptions/listen` và yêu cầu `resourceSubscriptions` hoặc nhóm thay đổi danh sách. Bài 10 xây luồng đó.

### Prompts

`prompts/list` có thể lưu đệm và tất định. `prompts/get` kết xuất prompt có tên với đối số. Kết quả prompt đã kết xuất là đầy đủ, nhưng không phải một trong các kết quả danh sách hoặc đọc có thể lưu đệm cần gợi ý bộ đệm.

### Every successful result is typed

Ví dụ dùng một lớp bọc cho mọi thành công:

```python
def complete(payload):
    return {
        "resultType": "complete",
        **payload,
        "_meta": {SERVER_INFO_KEY: SERVER_INFO},
    }
```

Trình xử lý danh sách, đọc và khám phá thêm `ttlMs` cộng `cacheScope`. Tập trung lớp bọc này ngăn một trình xử lý âm thầm bỏ trường kết quả hiện đại.

### No server-initiated requests

Máy chủ hiện đại có thể gửi thông báo liên quan yêu cầu client hoặc thông báo trên luồng `subscriptions/listen` do client mở. Nó không được gửi yêu cầu JSON-RPC riêng.

Khi trình xử lý cần đầu vào sampling, elicitation hoặc roots, nó trả kết quả `input_required`. Client hoàn thành các yêu cầu đầu vào nhúng và thử lại phương thức gốc với id yêu cầu mới. Bài 11 đề cập mẫu Yêu cầu nhiều lượt khứ hồi đó.

### Explicit legacy compatibility

Máy chủ hai thời kỳ cũng có thể triển khai bắt tay `2025-11-25` trên nhánh cũ riêng rõ ràng. Nó chọn hành vi hiện đại khi có các trường `_meta` hiện đại bắt buộc và hành vi cũ khi nhận `initialize`.

Không đưa yêu cầu `2026-07-28` qua nhánh bắt tay cũ. Không đóng trường `resultType` hiện đại lên kết quả khởi tạo cũ. Mã bài này cố ý chỉ hiện đại để bất biến luôn rõ.

```figure
t3-dispatch-loop
```

## Use It

Chạy demo hữu hạn và kiểm thử của máy chủ Python:

```bash
cd code
python3 main.py --demo
python3 -m unittest discover tests -v
```

Chạy bản chuyển TypeScript với trình chạy TypeScript:

```bash
npx tsx main.ts --demo
```

Demo gửi `server/discover`, liệt kê từng thành phần cơ bản, gọi công cụ và hiển thị lỗi phiên bản không hỗ trợ. Mọi yêu cầu hiện đại lặp siêu dữ liệu. Mọi thành công gồm danh tính máy chủ.

## Ship It

Bài học này cung cấp `outputs/skill-mcp-server-scaffolder.md`. Nó tạo kế hoạch máy chủ hiện đại với hợp đồng khám phá, xác thực mỗi yêu cầu, danh sách có thể lưu đệm tất định và adapter cũ cô lập tùy chọn.

## Exercises

1. Bỏ khả năng khỏi một yêu cầu và chứng minh máy chủ không dùng lại khai báo yêu cầu trước.
2. Đảo `TOOLS`, `PROMPTS` và thứ tự chèn ghi chú. Xác nhận mọi kết quả danh sách giữ ổn định.
3. Thêm công cụ phá hủy `notes_delete` và yêu cầu kiểm tra cấp quyền trong bộ thực thi. Giữ `destructiveHint` chỉ là gợi ý UX.
4. Thêm `resources/templates/list` với `ttlMs`, `cacheScope` và thứ tự tất định.
5. Xây adapter cũ riêng cho `2025-11-25`. Thêm kiểm thử chứng minh yêu cầu hiện đại không bao giờ đi vào nó.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| Stateless server (Máy chủ không trạng thái) | Xử lý mỗi yêu cầu từ siêu dữ liệu riêng không có bộ nhớ phiên giao thức |
| `server/discover` | Phương thức hiện đại bắt buộc công bố phiên bản và khả năng |
| Complete result (Kết quả đầy đủ) | Kết quả hiện đại thành công với `resultType: "complete"` |
| Cacheable result (Kết quả có thể lưu đệm) | Kết quả khám phá, danh sách hoặc đọc tài nguyên với `ttlMs` và `cacheScope` |
| Deterministic list (Danh sách tất định) | Cùng sổ đăng ký logic tạo cùng thứ tự mục |
| Server identity (Danh tính máy chủ) | `io.modelcontextprotocol/serverInfo` được khuyến nghị trong `_meta` kết quả |
| Tool error (Lỗi công cụ) | Lời gọi công cụ hợp lệ trả nội dung với `isError: true` |
| Protocol error (Lỗi giao thức) | Yêu cầu JSON-RPC hoặc MCP không hợp lệ trả qua `error` |

## Further Reading

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
