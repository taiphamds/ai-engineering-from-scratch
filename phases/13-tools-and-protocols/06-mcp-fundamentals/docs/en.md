# MCP Fundamentals: Stateless Requests and JSON-RPC

> MCP hiện đại không có bắt tay và không có phiên giao thức. Mỗi yêu cầu phải mang đủ siêu dữ liệu để được hiểu, cấp quyền, định tuyến và thử lại độc lập.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 01 through 05
**Time:** ~55 minutes

## Learning Objectives

- Phân biệt thành phần cơ bản phía máy chủ của MCP với tính năng phía client.
- Xây yêu cầu và phản hồi JSON-RPC 2.0 hợp lệ cho MCP `2026-07-28`.
- Gắn phiên bản giao thức, khả năng client và danh tính client vào mọi yêu cầu.
- Dùng `server/discover` và xử lý `UnsupportedProtocolVersionError` không có bắt tay.
- Lần theo một yêu cầu độc lập từ xác thực đến kết quả đầy đủ.

## The Problem

Máy chủ MCP có thể nhận hai yêu cầu liên tiếp từ các client khác nhau, với khả năng khác nhau, trên cùng tiến trình hoặc worker HTTP. Nếu máy chủ nhớ yêu cầu trước khai báo gì, nó có thể áp dụng sai quyền hoặc trả sai hình dạng đường truyền.

MCP `2026-07-28` loại bỏ sự mơ hồ đó. Lõi giao thức không trạng thái. Máy chủ phải quyết định cách xử lý yêu cầu hiện tại từ yêu cầu hiện tại, không từ lịch sử kết nối.

Điều này thay đổi mô hình tư duy. Chuỗi cũ là kết nối trước, bắt tay thứ hai, thao tác thứ ba. Chuỗi hiện đại đơn giản hơn:

1. Client gửi yêu cầu tự mô tả.
2. Máy chủ xác thực phiên bản và khả năng của yêu cầu đó.
3. Máy chủ xử lý phương thức.
4. Máy chủ trả kết quả có kiểu hoặc lỗi JSON-RPC.

Yêu cầu tiếp theo lặp lại cùng quá trình từ đầu.

## The Concept

### Server primitives

Máy chủ MCP cung cấp ba thành phần cơ bản chính:

1. **Công cụ** là hành động do mô hình kiểm soát, được khám phá bằng `tools/list` và gọi bằng `tools/call`.
2. **Tài nguyên** là dữ liệu định địa chỉ bằng URI, được khám phá bằng `resources/list` và lấy bằng `resources/read`.
3. **Prompt** là mẫu tái sử dụng, được khám phá bằng `prompts/list` và kết xuất bằng `prompts/get`.

Roots, sampling và logging vẫn trong lược đồ `2026-07-28` để tương thích, nhưng đã ngừng được khuyến nghị. Triển khai mới nên dùng đầu vào công cụ hoặc tài nguyên tường minh cho roots, API nhà cung cấp mô hình trực tiếp cho sampling và stderr hoặc OpenTelemetry cho logging. Elicitation vẫn có qua Yêu cầu nhiều lượt khứ hồi, nơi máy chủ trả yêu cầu đầu vào và client thử lại thao tác gốc. Máy chủ hiện đại không bao giờ khởi tạo yêu cầu JSON-RPC độc lập.

### JSON-RPC envelopes

MCP dùng JSON-RPC 2.0:

- Yêu cầu: `{jsonrpc, id, method, params}`
- Phản hồi: `{jsonrpc, id, result}` hoặc `{jsonrpc, id, error}`
- Thông báo: `{jsonrpc, method, params}` không có `id`

`id` yêu cầu liên hệ một phản hồi. Nó không tạo phiên giao thức.

### Required request metadata

Mọi yêu cầu hiện đại mang đối tượng `_meta` bên trong `params`:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Phiên bản giao thức và khả năng client là bắt buộc. Danh tính client được khuyến nghị. Nó là dữ liệu hiển thị và gỡ lỗi tự khai, không phải thông tin xác thực bảo mật.

Máy chủ không được suy ra bất kỳ giá trị nào trong số này từ yêu cầu trước, tiến trình stdio, kết nối HTTP hoặc chỉ header vận chuyển.

### Complete results and server identity

Mọi kết quả hiện đại thành công gồm `resultType`. Kết quả cuối thông thường dùng `"complete"`. Máy chủ cũng nên định danh mình trong siêu dữ liệu kết quả:

```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "result": {
    "resultType": "complete",
    "tools": [],
    "ttlMs": 30000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "notes-server",
        "version": "1.0.0"
      }
    }
  }
}
```

`tools/list`, `resources/list`, `prompts/list`, `resources/templates/list`, `resources/read` và `server/discover` là kết quả có thể lưu đệm. Chúng gồm `ttlMs` và `cacheScope`. Mặc định an toàn là `ttlMs: 0` và `cacheScope: "private"`. Mục danh sách nên có thứ tự tất định để phản hồi tương đương tạo khóa bộ đệm ổn định và ngữ cảnh mô hình ổn định.

### Discovery without a handshake

Mọi máy chủ hiện đại phải triển khai `server/discover`. Client có thể gọi trước phương thức khác để lấy:

- `supportedVersions`
- `capabilities` máy chủ
- `instructions` sử dụng tùy chọn
- danh tính máy chủ trong `_meta` kết quả
- gợi ý bộ đệm

Khám phá hữu ích nhưng không phải cổng kiểm soát. Client có thể gửi `tools/list` trước vì yêu cầu đó đã mang phiên bản giao thức và khả năng.

Nếu phiên bản yêu cầu không được hỗ trợ, máy chủ trả mã JSON-RPC `-32022` với:

```json
{
  "requested": "2027-01-01",
  "supported": ["2026-07-28"]
}
```

Client chọn phiên bản hiện đại được cả hai hỗ trợ và thử lại với id yêu cầu JSON-RPC mới.

### One request lifecycle

Lần theo yêu cầu hiện đại theo thứ tự này:

1. Phân tích một vỏ JSON-RPC.
2. Xác nhận `jsonrpc` là `"2.0"`, có `id`, `method` là chuỗi và `params` là đối tượng.
3. Yêu cầu chuỗi phiên bản và đối tượng khả năng trong `params._meta`; siêu dữ liệu sai dạng hoặc thiếu là `-32602`.
4. Tại ranh giới HTTP, so phiên bản, phương thức và header tên áp dụng với phần thân. Không khớp là `-32020` ngay cả khi một trong hai giá trị phiên bản không được hỗ trợ.
5. Sau khi xác lập bằng nhau, từ chối phiên bản khớp nhưng không được hỗ trợ bằng `-32022`.
6. Kiểm tra khả năng bắt buộc, rồi định tuyến theo `method` và xác thực đối số riêng phương thức.
7. Xác thực danh tính và cấp quyền thao tác cụ thể trước khi trình xử lý chạy.
8. Trả kết quả đầy đủ với danh tính máy chủ.
9. Quên siêu dữ liệu giao thức phạm vi yêu cầu.

Thứ tự đó ngăn hai thành phần diễn giải các lời gọi khác nhau. Gateway không được cấp quyền `Mcp-Name: notes.read` trong khi máy chủ gốc thực thi `params.name: notes.delete`. Nó cũng giữ đầu vào sai dạng, nhầm lẫn header, thương lượng phiên bản, lỗi khả năng, cấp quyền và lỗi trình xử lý thành bằng chứng riêng biệt.

Đóng stdin hoặc phản hồi HTTP kết thúc hoạt động vận chuyển. Nó không kết thúc phiên giao thức vì MCP hiện đại không có phiên giao thức.

### Explicit legacy compatibility

Các phiên bản đến `2025-11-25` dùng `initialize`, `notifications/initialized`, khả năng phạm vi kết nối và, trên Streamable HTTP trước đây, phiên giao thức tùy chọn. Hành vi đó vẫn liên quan khi client hai thời kỳ nói chuyện với máy chủ cũ.

Giữ các thời kỳ riêng biệt. Yêu cầu hiện đại được nhận biết bằng siêu dữ liệu bắt buộc mỗi yêu cầu. Kết nối cũ chỉ được chọn qua nhánh dự phòng đã ghi lại. Không gửi `initialize` làm mặc định cho máy chủ `2026-07-28`.

Do đó “không trạng thái” có nghĩa riêng theo thời kỳ. Trong `2026-07-28`, đó là bất biến giao thức: mọi yêu cầu thông thường diễn giải được độc lập và không có phiên MCP. Trong các phiên bản đến `2025-11-25`, khởi tạo và khả năng đã thương lượng thuộc kết nối, nên adapter tương thích có thể giữ trạng thái kết nối cũ đó. Triển khai hai thời kỳ không phải một máy trạng thái dễ dãi. Nó là lõi hiện đại không trạng thái bên cạnh adapter cũ cô lập, với quyết định chọn tường minh trước khi một trong hai bộ phân tích chạy.

Không nghĩa nào cấm trạng thái ứng dụng bền vững. Quy trình, tác vụ hoặc bản nháp có thể tồn tại sau handle mờ trong kho dùng chung. Client gửi handle đó như đầu vào thường, và mọi bản sao xác thực danh tính và cấp quyền sử dụng nó. Ngữ cảnh giao thức không được rò vào kho đó để thay thế phiên đã bỏ.

```figure
mcp-tool-call
```

## Use It

`code/main.py` xây dựng, xác thực, lần vết và phân phối thông điệp MCP hiện đại không có framework. Chạy:

```bash
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Quan sát ba bất biến trong đầu ra:

- Mọi yêu cầu lặp các trường `_meta` của nó.
- Mọi kết quả thành công là `resultType: "complete"` và gồm danh tính máy chủ.
- Kết quả danh sách được sắp thứ tự tất định và có gợi ý bộ đệm tường minh.

## Ship It

Bài học này cung cấp `outputs/skill-mcp-handshake-tracer.md`. Tên file lịch sử giữ ổn định, nhưng sản phẩm giờ là bộ lần vết yêu cầu không trạng thái. Nó kiểm tra độc lập mỗi thông điệp và chỉ gắn nhãn lưu lượng bắt tay cũ khi thực sự có.

## Exercises

1. Đổi phiên bản giao thức của một yêu cầu thành `2027-01-01`. Xác nhận mã lỗi `-32022` và dữ liệu công bố phiên bản hỗ trợ.
2. Bỏ `io.modelcontextprotocol/clientCapabilities` khỏi yêu cầu thứ hai. Xác nhận máy chủ không dùng lại khả năng từ yêu cầu đầu.
3. Đảo sổ đăng ký công cụ trong bộ nhớ. Xác nhận `tools/list` vẫn trả cùng thứ tự tất định.
4. Đổi `cacheScope` từ `public` sang `private`. Giải thích ngữ cảnh cấp quyền nào có thể dùng lại phản hồi trong mỗi trường hợp.
5. Thêm kiểm thử bỏ `clientInfo` tùy chọn. Yêu cầu nên vẫn hợp lệ vì danh tính client được khuyến nghị, không bắt buộc.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| Stateless protocol (Giao thức không trạng thái) | Mọi yêu cầu cung cấp siêu dữ liệu cần để diễn giải nó |
| Request metadata (Siêu dữ liệu yêu cầu) | Phiên bản, khả năng client và danh tính client được khuyến nghị trong `params._meta` |
| `server/discover` | Phương thức máy chủ bắt buộc cho phiên bản, khả năng, chỉ dẫn và danh tính |
| `resultType` | Trường phân biệt trên mọi kết quả hiện đại thành công |
| Cacheable result (Kết quả có thể lưu đệm) | Kết quả gồm gợi ý `ttlMs` và `cacheScope` bắt buộc |
| Protocol era (Thời kỳ giao thức) | Siêu dữ liệu hiện đại mỗi yêu cầu hoặc khởi tạo cũ phạm vi kết nối |
| Transport lifetime (Vòng đời vận chuyển) | Vòng đời tiến trình, kết nối hoặc luồng phản hồi, không phải trạng thái phiên giao thức |
| `-32022` | Lỗi phiên bản giao thức không được hỗ trợ với phiên bản yêu cầu và hỗ trợ |

## Further Reading

- [MCP Architecture](https://modelcontextprotocol.io/specification/2026-07-28/architecture)
- [MCP Base Protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
