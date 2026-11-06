# Model Context Protocol (MCP)

> MCP cung cấp cho host AI một giao thức để khám phá và gọi công cụ, tài nguyên và prompt. Bản sửa đổi 2026-07-28 khiến giao thức đó không trạng thái: ngữ cảnh năng lực và phiên bản đi cùng mỗi yêu cầu, không nằm trong bắt tay gắn với kết nối.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 03 (Structured Outputs)
**Time:** ~75 minutes

## Learning Objectives

- Phân biệt host, client, máy chủ, lớp truyền tải và thành phần cơ bản phía máy chủ của MCP.
- Xây yêu cầu JSON-RPC với metadata mà MCP 2026-07-28 yêu cầu.
- Dùng `server/discover` để kiểm tra phiên bản, danh tính và năng lực.
- Trả kết quả có kiểu và nhận biết cache từ công cụ, tài nguyên và prompt.
- Giải thích cách MCP không trạng thái hiện đại tương tác với máy chủ thời kỳ bắt tay.
- Chọn ranh giới trạng thái, truyền tải và phê duyệt an toàn cho máy chủ.

## The Problem

Ứng dụng của bạn cần truy vấn cơ sở dữ liệu, thao tác lịch và bộ đọc file. Không giao thức chung, mỗi host AI cần phần kết nối tùy chỉnh cho khám phá, gọi, lỗi, truyền tải và phân quyền của cùng các năng lực đó.

MCP giảm ma trận tích hợp đó. Máy chủ công bố giao diện JSON-RPC tiêu chuẩn. Client tuân thủ có thể khám phá giao diện, trình bày cho mô hình hoặc người dùng, gọi và diễn giải kết quả mà không cần adapter riêng cho máy chủ.

Ranh giới quan trọng dễ bị bỏ lỡ. MCP chuẩn hóa giao tiếp. Nó không quyết định công cụ nào mô hình nên gọi, làm nội dung không đáng tin trở nên an toàn hay biến yêu cầu không trạng thái thành trạng thái ứng dụng bền vững. Host và máy chủ vẫn sở hữu các quyết định đó.

## The Concept

![MCP host, stateless request, and server primitives](../assets/mcp-architecture.svg)

### The three server primitives

1. **Công cụ** là hành động có thể gọi. Mỗi công cụ có tên, mô tả, đầu vào JSON Schema và hàm xử lý.
2. **Tài nguyên** là nội dung có tên, địa chỉ URI mà client có thể đọc.
3. **Prompt** là khuôn mẫu tái sử dụng mà host có thể cung cấp cho người dùng.

Host là ứng dụng AI. Một client MCP trong host đó giao tiếp với một máy chủ. Lớp truyền tải mang thông điệp JSON-RPC giữa chúng.

### Stateless requests replace the handshake

MCP 2026-07-28 bỏ `initialize` và `notifications/initialized`. Nó cũng bỏ phiên cấp giao thức. Mọi yêu cầu mang ngữ cảnh cần để diễn giải trong `params._meta`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Phiên bản giao thức và năng lực client là bắt buộc. Danh tính client được khuyến nghị. Thiếu `_meta`, thiếu trường bắt buộc hoặc trường bắt buộc sai kiểu là sai định dạng và trả Invalid Params (`-32602`). Chuỗi phiên bản đúng định dạng mà máy chủ không hỗ trợ trả `UnsupportedProtocolVersionError` (`-32022`). Máy chủ có thể xử lý yêu cầu hợp lệ mà không khôi phục bản ghi đàm phán trước.

Không trạng thái không nghĩa là ứng dụng không bao giờ duy trì trạng thái. Nó nghĩa là trạng thái không ẩn sau kết nối MCP hoặc `Mcp-Session-Id`. Nếu quy trình cần tính liên tục, máy chủ tạo handle mờ và client truyền handle đó như đối số công cụ thông thường trong các lệnh gọi sau. Phân quyền vẫn phải được kiểm tra trên mọi yêu cầu.

### Discovery and version selection

Mọi máy chủ hiện đại triển khai `server/discover`. Kết quả công bố phiên bản hỗ trợ, năng lực và danh tính máy chủ:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "complete",
    "supportedVersions": ["2026-07-28"],
    "capabilities": {
      "tools": {},
      "resources": {},
      "prompts": {}
    },
    "ttlMs": 3600000,
    "cacheScope": "public",
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "demo-server",
        "version": "1.0.0"
      }
    }
  }
}
```

Client có thể gọi trực tiếp phương thức khác và xử lý lỗi phiên bản, nhưng khám phá làm việc hiển thị năng lực và lựa chọn phiên bản rõ ràng. Phiên bản không hỗ trợ trả `UnsupportedProtocolVersionError` với mã `-32022`. Dữ liệu chứa `supported`, mảng bản sửa đổi máy chủ, và `requested`, bản sửa đổi bị từ chối.

Trên stdio, client hỗ trợ hai thời kỳ dò bằng `server/discover`. Kết quả khám phá hoặc lỗi hiện đại được nhận biết như `UnsupportedProtocolVersionError` xác định máy chủ hiện đại. Mọi lỗi hoặc timeout không được nhận biết là hiện đại cho phép dự phòng về luồng `initialize` 2025-11-25. Hành vi cũ là mã tương thích, không phải mặc định hiện đại.

### Results are explicit

Mọi kết quả cốt lõi 2026-07-28 có `resultType`:

- `complete` nghĩa là thao tác hoàn tất.
- `input_required` nghĩa là máy chủ cần lượt đi-về khác qua mẫu Multi Round-Trip Requests. Máy chủ cốt lõi chỉ có thể trả từ `tools/call`, `resources/read` hoặc `prompts/get`.

Client phải xem kết quả cũ thiếu `resultType` là hoàn tất.

Máy chủ nên bao gồm `io.modelcontextprotocol/serverInfo` trong `_meta` mỗi kết quả. Danh tính này tự báo cáo và dùng cho hiển thị, ghi log, gỡ lỗi, không dùng cho quyết định bảo mật.

Kết quả liệt kê và đọc cũng mang `ttlMs` và `cacheScope`. Thứ tự `tools/list` tất định cùng gợi ý độ mới cho client cache khám phá an toàn và cải thiện ổn định cache prompt. `cacheScope: public` cho phép cache chia sẻ; `private` giới hạn tái sử dụng trong ngữ cảnh gọi.

### The wire format and transport

MCP dùng JSON-RPC 2.0 trên stdio hoặc Streamable HTTP.

- Yêu cầu có `jsonrpc`, `id`, `method` và `params`.
- Phản hồi có `id` khớp và `result` hoặc `error`.
- Thông báo không có `id` và không kỳ vọng phản hồi.

Streamable HTTP hiện đại mở một endpoint nhận POST. Mỗi thông điệp JSON-RPC có POST riêng. POST yêu cầu nhận một đối tượng JSON hoặc stream Server-Sent Events theo phạm vi yêu cầu kết thúc bằng phản hồi cuối. POST thông báo được chấp nhận nhận HTTP 202 không thân phản hồi; bản sửa đổi cốt lõi này không định nghĩa thông báo từ client đến máy chủ trên Streamable HTTP.

Không có stream MCP GET độc lập, endpoint phiên DELETE, `Mcp-Session-Id` hay phát lại `Last-Event-ID` trong 2026-07-28. Thông báo thay đổi dài hạn dùng POST `subscriptions/listen` có phản hồi giữ mở thành stream SSE.

### Client input without server-initiated requests

Bản sửa đổi cũ cho máy chủ gửi yêu cầu như `sampling/createMessage`, `roots/list` hoặc `elicitation/create` qua stream. Giao thức hiện tại dùng Multi Round-Trip Requests thay thế. Lệnh gọi công cụ, đọc tài nguyên hoặc lấy prompt đủ điều kiện trả `resultType: input_required` với ít nhất một trong `inputRequests` hoặc `requestState`. Client thu đầu vào được yêu cầu, thử lại phương thức gốc với ID JSON-RPC mới và `inputResponses` tương ứng, đồng thời gửi lại đúng `requestState` khi được cung cấp. Nếu không có `inputRequests`, lần thử lại bỏ `inputResponses`.

Roots, Sampling và Logging vẫn hoạt động nhưng đã ngừng khuyến nghị, nên triển khai mới không nên áp dụng. Yêu cầu Roots hoặc Sampling hiện có đi trong `inputRequests` của MRTR, không bao giờ là yêu cầu JSON-RPC độc lập từ máy chủ đến client. Ưu tiên tham số file hoặc thư mục rõ ràng, URI tài nguyên, cấu hình máy chủ và tích hợp trực tiếp nhà cung cấp mô hình. Dùng stderr cho chẩn đoán stdio và OpenTelemetry cho telemetry sản xuất.

```figure
mcp-nxm-collapse
```

## Build It

### Step 1: register a server surface

Đăng ký vẫn đơn giản dù hợp đồng yêu cầu đã thay đổi:

```python
server = MCPServer("demo-server")

@server.tool(
    "add",
    "Add two integers.",
    {
        "type": "object",
        "properties": {
            "a": {"type": "integer"},
            "b": {"type": "integer"}
        },
        "required": ["a", "b"]
    }
)
def add(a: int, b: int) -> dict:
    return {"sum": a + b}
```

Triển khai được cung cấp trong `code/main.py` cũng đăng ký tài nguyên và prompt. Nó cố ý dùng thư viện tiêu chuẩn để bạn thấy từng phong bì thay vì giao giao thức cho SDK.

### Step 2: attach metadata to every request

```python
def request(method, params=None):
    body_params = dict(params or {})
    body_params["_meta"] = {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {},
        "io.modelcontextprotocol/clientInfo": {
            "name": "demo-client",
            "version": "1.0.0"
        }
    }
    return {
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": body_params
    }
```

Không chỉ cache metadata này trong đối tượng kết nối. Máy chủ xác thực nó trên mỗi yêu cầu.

### Step 3: optionally discover before listing

Gọi `server/discover`, chọn phiên bản được hỗ trợ rồi gọi `tools/list`. `tools/list` trực tiếp cũng hợp lệ nếu đã biết phiên bản và có thể xử lý `-32022`.

Demo trả danh sách công cụ theo thứ tự tên và đính kèm `ttlMs`, `cacheScope`, `resultType` và danh tính máy chủ. Lệnh gọi công cụ trả kết quả hoàn tất, không cache được vì đầu ra có thể phụ thuộc trạng thái hiện tại.

### Step 4: map the same request to HTTP

POST `tools/call` từ xa bao gồm header phản chiếu thân JSON-RPC:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
Accept: application/json, text/event-stream
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: add
```

Header `MCP-Protocol-Version` phải khớp phiên bản trong `_meta`. `Mcp-Method` bắt buộc trên mọi yêu cầu JSON-RPC và phải khớp `method`. `Mcp-Name` chỉ bắt buộc cho `tools/call`, `resources/read` và `prompts/get`, nơi nó phải khớp tên công cụ, URI tài nguyên hoặc tên prompt. Thiếu header bắt buộc hoặc không khớp trả HTTP 400 với mã `HeaderMismatch` `-32020`.

### Step 5: enforce safety outside protocol state

- Xác thực phân quyền và đối tượng nhận trên mọi yêu cầu HTTP.
- Gắn máy chủ cục bộ vào localhost và xác thực `Origin` trên Streamable HTTP.
- Đánh dấu công cụ thay đổi dữ liệu bằng `destructiveHint: true` và yêu cầu host phê duyệt.
- Truyền phạm vi thư mục và file rõ ràng thay vì phụ thuộc Roots đã ngừng khuyến nghị.
- Xem tài nguyên và đầu ra công cụ là dữ liệu không đáng tin.
- Giữ stdout dành riêng cho JSON-RPC khi dùng stdio; ghi chẩn đoán vào stderr.

## Use It

Chạy bài học từ thư mục của nó:

```bash
python3 code/main.py
cd code
python3 -m unittest discover tests -v
```

Dòng đầu phải báo khám phá `demo-server` ở giao thức `2026-07-28`. Rồi kiểm tra `MCPClient.request`: nó dựng lại `_meta` cho mỗi lệnh gọi. Bỏ metadata khỏi một yêu cầu và quan sát máy chủ từ chối.

## Ship It

`outputs/skill-mcp-server-designer.md` biến một miền thành thiết kế MCP không trạng thái. Cổng chấp nhận yêu cầu kết quả khám phá, chính sách metadata mỗi yêu cầu, danh sách tất định nhận biết cache, handle trạng thái rõ ràng, header truyền tải, phân quyền và quy tắc phê duyệt.

## Continue the MCP Deep Dive

Bài học này cho bạn mô hình giao thức. Giai đoạn 13 biến bốn ranh giới sản xuất thành các bài xây dựng-và-xác minh riêng:

1. [MCP Tool Contracts and Content](../../../13-tools-and-protocols/28-mcp-tool-contracts-and-content/docs/en.md) trình bày schema đầu vào đóng, nội dung có cấu trúc, metadata định tuyến, phân trang mờ, phân quyền completion và khác biệt giữa lỗi giao thức và lỗi miền công cụ.
2. [MCP Reliability, Cancellation, and Flow Control](../../../13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/docs/en.md) trình bày hủy yêu cầu, hủy tác vụ bền vững, hạn chót, tính lũy đẳng, backpressure, bộ đệm proxy và hành vi kết nối lại.
3. [MCP Registry Supply Chain, Admission, Drift, and Rollback](../../../13-tools-and-protocols/30-mcp-registry-supply-chain-and-drift/docs/en.md) trình bày chứng minh namespace, nguồn gốc artifact, ghim bất biến, trôi trực tiếp, trạng thái Registry, bằng chứng tiếp nhận và hoàn tác.
4. [MCP Conformance Engineering](../../../13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/docs/en.md) trình bày bản ghi truyền tải vàng và âm, thời kỳ phiên bản nghiêm ngặt, đối chiếu SDK, bằng chứng proxy, che dữ liệu, cổng sức khỏe và hoàn tác phát hành.

Làm theo thứ tự khi máy chủ sẽ vượt ranh giới nhóm hoặc tin cậy. Cùng nhau chúng chuyển từ “phương thức hoạt động” sang “hợp đồng vẫn an toàn và chẩn đoán được qua triển khai.”

## Exercises

1. Thêm công cụ `subtract` và xác nhận `tools/list` vẫn theo thứ tự chữ cái.
2. Bỏ khóa phiên bản giao thức và xác minh Invalid Params (`-32602`). Rồi gửi phiên bản đúng định dạng nhưng không hỗ trợ `2025-11-25`, xác minh `-32022`, xác nhận `requested` phản hồi đúng bản sửa đổi đó và chọn từ `supported`.
3. Thêm `draftId` do máy chủ tạo vào thao tác tạo, rồi yêu cầu nó làm đối số cập nhật. Giải thích tại sao đó là trạng thái ứng dụng thay vì phiên giao thức.
4. Trả `input_required` từ công cụ cần người dùng xác nhận. Thử lại lệnh gọi gốc với ID mới, mục `inputResponses` và đúng `requestState` thay vì tự tạo yêu cầu JSON-RPC từ máy chủ đến client.
5. Phác thảo client stdio hỗ trợ hai thời kỳ. Xem kết quả hoặc lỗi hiện đại được nhận biết là hiện đại, và chỉ cho phép dự phòng về `initialize` khi lỗi không nhận biết hoặc timeout.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| MCP | "Giao thức công cụ cho LLM" | Giao thức JSON-RPC cho khám phá máy chủ, công cụ, tài nguyên, prompt và phần mở rộng |
| Host (Ứng dụng chủ) | "Ứng dụng AI" | Sở hữu mô hình và UI, gắn một hoặc nhiều client MCP |
| Client (Máy khách) | "Bộ kết nối" | Giao tiếp MCP với một máy chủ thay mặt host |
| Stateless MCP (MCP không trạng thái) | "Không phiên" | Mỗi yêu cầu mang phiên bản và năng lực; không trạng thái giao thức nào có khóa theo kết nối |
| `server/discover` | "Dò năng lực" | Phương thức máy chủ bắt buộc công bố phiên bản, năng lực và danh tính |
| `resultType` | "Trạng thái kết quả" | Đánh dấu kết quả là `complete` hoặc `input_required` |
| State handle (Handle trạng thái) | "ID quy trình" | Định danh ứng dụng do máy chủ tạo, truyền như đối số thông thường |
| Streamable HTTP | "Truyền tải từ xa" | Một endpoint POST với phản hồi JSON hoặc SSE theo phạm vi yêu cầu |
| MRTR | "Hỏi và thử lại" | Yêu cầu đầu vào nhúng trong kết quả, theo sau bởi thử lại thao tác gốc |

## Further Reading

- [MCP 2026-07-28 key changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP deprecated features](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
