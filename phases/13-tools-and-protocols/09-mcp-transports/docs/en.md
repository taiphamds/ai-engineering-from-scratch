# MCP Transports: stdio and Stateless Streamable HTTP

> Vận chuyển mang thông điệp MCP. Nó không cung cấp trạng thái giao thức thiếu. Trong `2026-07-28`, cả stdio cục bộ lẫn Streamable HTTP từ xa đều mang yêu cầu tự mô tả.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 07 and 08
**Time:** ~65 minutes

## Learning Objectives

- Chọn stdio cho tiến trình con cục bộ và Streamable HTTP cho dịch vụ mạng.
- Triển khai hợp đồng Streamable HTTP hiện đại một endpoint, chỉ POST.
- Phản chiếu và xác thực header phiên bản, phương thức và tên MCP theo phần thân JSON-RPC.
- Phân phối đúng SSE phạm vi yêu cầu và luồng `subscriptions/listen` sống lâu.
- Chuyển triển khai dựa trên phiên và HTTP+SSE cũ mà không trình bày hành vi cũ là hiện đại.

## The Problem

Các bản sửa đổi Streamable HTTP trước kết hợp thương lượng giao thức với hành vi kết nối và phiên. Máy chủ có thể tạo `Mcp-Session-Id`, cung cấp luồng GET độc lập, nhận DELETE để kết thúc phiên và tiếp tục SSE bằng `Last-Event-ID`.

MCP `2026-07-28` bỏ các cơ chế đó khỏi đường truyền hiện đại. Mọi yêu cầu có thể đến bất kỳ worker khỏe nào vì phiên bản giao thức và khả năng client đi trong phần thân yêu cầu. Header HTTP phản chiếu trường được chọn để định tuyến và chính sách, nhưng máy chủ xác thực header đó theo phần thân trước thực thi.

Kết quả dễ mở rộng và dễ suy luận hơn. Điều này cũng nghĩa máy chủ dạy vận chuyển năm 2025 như hiện hành đang dạy sai mô hình thất bại và bảo mật.

## The Concept

### stdio

Liên kết stdio dành cho tiến trình con do client khởi chạy:

- Client ghi một thông điệp JSON-RPC UTF-8 mỗi dòng vào stdin.
- Máy chủ ghi một thông điệp JSON-RPC UTF-8 mỗi dòng vào stdout.
- Máy chủ ghi chẩn đoán vào stderr.
- Máy chủ thoát nhanh khi stdin EOF.
- Mọi yêu cầu hiện đại mang phiên bản và khả năng client trong `params._meta`.

Tiến trình có thể tồn tại nhiều lời gọi, nhưng không phải phiên giao thức hiện đại. Nếu thoát bất ngờ, yêu cầu đang xử lý bị mất. Khởi động lại tiến trình, khám phá lại, liệt kê lại, mở lại đăng ký và thử lại thao tác an toàn với id yêu cầu mới.

### Streamable HTTP in 2026-07-28

Máy chủ hiện đại cung cấp một endpoint MCP, như `/mcp`, nhận POST.

Mọi yêu cầu hoặc thông báo JSON-RPC là HTTP POST mới. Phần thân chứa một thông điệp JSON-RPC. Client không gửi phản hồi JSON-RPC đến máy chủ.

Với yêu cầu, máy chủ trả một trong hai:

- `Content-Type: application/json` với một phản hồi JSON-RPC; hoặc
- `Content-Type: text/event-stream` với thông báo liên quan yêu cầu đó, theo sau là phản hồi JSON-RPC cuối.

Với thông báo được chấp nhận, máy chủ trả `202 Accepted` không có phần thân.

Client công bố cả hai kiểu phản hồi:

```http
Accept: application/json, text/event-stream
```

### POST-only means POST-only

Streamable HTTP hiện đại không có luồng GET độc lập và không endpoint phiên DELETE.

- `GET /mcp` trả `405 Method Not Allowed`.
- `DELETE /mcp` trả `405 Method Not Allowed`.
- `Mcp-Session-Id` bị bỏ qua và không bao giờ được tạo hoặc phản hồi lại.
- `Last-Event-ID` bị bỏ qua vì luồng hiện đại không thể tiếp tục.

Nếu luồng phạm vi yêu cầu hỏng trước phản hồi cuối, client mất yêu cầu đang xử lý đó. Nó có thể đưa yêu cầu mới với id JSON-RPC mới khi thử lại an toàn. Nó không được cố tiếp tục luồng.

### Origin validation

Máy chủ xác thực `Origin` trên kết nối đến để ngăn DNS rebinding. Nếu có header và không được cho phép rõ, trả `403 Forbidden`. Client không phải trình duyệt có thể bỏ `Origin`, điều quy tắc vận chuyển chính thức cho phép.

Máy chủ cục bộ nên bind vào `127.0.0.1`, không phải mọi giao diện. Dịch vụ mạng vẫn cần xác thực danh tính và cấp quyền trên mọi yêu cầu. Xác thực Origin không phải xác thực danh tính.

Dùng khớp origin chính xác sau cấu hình chuẩn. Kiểm tra tiền tố như `origin.startswith("https://trusted.example")` không an toàn vì có thể nhận hậu tố do kẻ tấn công kiểm soát.

### Required HTTP metadata headers

Mọi yêu cầu POST hiện đại gồm:

```http
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes_search
```

Quy tắc header:

- `MCP-Protocol-Version` bắt buộc và phải bằng `params._meta.io.modelcontextprotocol/protocolVersion`.
- `Mcp-Method` bắt buộc và phải bằng `method` JSON-RPC.
- `Mcp-Name` bắt buộc cho `tools/call`, `resources/read` và `prompts/get`.
- `Mcp-Name` bằng `params.name`, hoặc `params.uri` cho `resources/read`.
- Giá trị header phân biệt hoa thường dù tên header không phân biệt hoa thường.

Giá trị `Mcp-Name` không an toàn hoặc ngoài ASCII dùng dấu báo hiệu Base64 UTF-8 chính xác:

```text
=?base64?{Base64EncodedValue}?=
```

Máy chủ giải mã giá trị đó trước khi so với phần thân.

Header phản chiếu thiếu, sai dạng hoặc không khớp trả HTTP `400` với mã JSON-RPC `-32020`. Nếu header và phần thân đồng ý về phiên bản máy chủ không hỗ trợ, trả HTTP `400` với `-32022` và dữ liệu lỗi chính xác như `{"supported":["2026-07-28"],"requested":"2027-01-01"}`.

Phương thức hiện đại không biết trả HTTP `404` với JSON-RPC `-32601`. Phần thân JSON-RPC quan trọng vì client hai thời kỳ dùng nó để phân biệt lỗi hiện đại với không tìm thấy endpoint cũ.

### Request-scoped SSE

Máy chủ có thể chọn SSE cho một yêu cầu chạy lâu:

```text
POST tools/call id=41
  <- notifications/progress related to id=41
  <- notifications/progress related to id=41
  <- JSON-RPC response id=41
stream closes
```

Máy chủ không được gửi yêu cầu JSON-RPC độc lập trên luồng này. Tương tác sampling, elicitation và roots dùng kết quả Yêu cầu nhiều lượt khứ hồi. Đóng luồng phản hồi hủy yêu cầu đó.

Không thêm id sự kiện SSE để phát lại. Tiếp tục bằng `Last-Event-ID` không thuộc bản sửa đổi hiện đại.

### Long-lived changes use subscriptions/listen

Thông báo thay đổi dùng yêu cầu do client mở, không GET độc lập:

```json
{
  "jsonrpc": "2.0",
  "id": "listen-1",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true,
      "resourceSubscriptions": ["notes://note-1"]
    },
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

Phản hồi POST là luồng SSE sống lâu. Thông điệp giao thức đầu tiên là `notifications/subscriptions/acknowledged`. Xác nhận, mọi thông báo thay đổi và kết quả cuối mang `io.modelcontextprotocol/subscriptionId` trong `_meta`, bằng id yêu cầu listen. Máy chủ có thể phát bình luận SSE để duy trì kết nối. Khi luồng rớt, client gửi lại `subscriptions/listen` với id yêu cầu mới và lấy lại dữ liệu bị ảnh hưởng.

`resources/subscribe` và `resources/unsubscribe` thuộc thời kỳ cũ. Không dùng trên kết nối hiện đại.

### Explicit application state

Bỏ phiên giao thức không cấm quy trình có trạng thái. Máy chủ có thể tạo handle trạng thái mờ và trả như kết quả công cụ thường. Client truyền handle đó như đối số tường minh ở lời gọi sau.

Gắn handle với chủ thể đã xác thực, làm không thể đoán, đặt hết hạn và cấp quyền mọi lần dùng. Điều này làm trạng thái hiển thị ở tầng ứng dụng thay vì giấu trong tính gắn kết vận chuyển.

Thất bại do trạng thái bản sao ẩn mang tính cơ học:

1. Yêu cầu A đến bản sao 1 và tạo bản nháp trong bộ nhớ tiến trình đó.
2. Phản hồi không trả handle bản nháp vì triển khai giả định kết nối định danh bản nháp.
3. Yêu cầu B là POST mới và đến bản sao 2.
4. Bản sao 2 có siêu dữ liệu giao thức hợp lệ nhưng không cách gọi tên hoặc tải bản nháp, nên quy trình thất bại hoặc đọc sai đối tượng cục bộ.
5. Định tuyến bám dính có vẻ sửa triệu chứng cho đến khi khởi động lại, triển khai, lập lịch lại hoặc chuyển đổi dự phòng chuyển yêu cầu tiếp.

Ranh giới đúng có hai phần. Ngữ cảnh giao thức ở trong mỗi yêu cầu. Trạng thái ứng dụng bền vững nằm trong kho dùng chung dưới handle do máy chủ tạo trả về client. Lời gọi tiếp cung cấp handle đó, mọi bản sao tải cùng bản ghi và cấp quyền gắn bản ghi với chủ thể đã xác thực và tenant. Bộ nhớ bản sao có thể lưu đệm bản ghi, nhưng không thể là bản sao duy nhất cần để đúng.

Chọn cơ chế trạng thái theo vòng đời. Biến cục bộ yêu cầu có thể phục vụ một lời gọi. Phần tiếp nối MRTR ngắn có thể dùng `requestState` được bảo vệ tính toàn vẹn. Bản nháp hoặc tác vụ bền vững cần handle tường minh cộng lưu trữ bền vững dùng chung, hết hạn, kiểm soát đồng thời và tính lũy đẳng. Không đối tượng nào trong số đó là phiên giao thức MCP.

### HTTP dual-era compatibility

Client hỗ trợ máy chủ hiện đại và cũ thử POST hiện đại trước. Nếu nhận HTTP `400`, `404` hoặc `405`, nó kiểm tra phần thân:

- Lỗi JSON-RPC hiện đại đã nhận biết chứng minh máy chủ hiện đại. Sửa yêu cầu hoặc thử lại phiên bản công bố. Không hạ cấp.
- Phần thân rỗng hoặc phản hồi không nhận biết có thể chỉ máy chủ HTTP+SSE cũ. Chỉ khi đó thử endpoint GET cũ và chờ sự kiện `endpoint` cũ của nó.

Máy chủ có thể hỗ trợ hai thời kỳ trong chuyển đổi bằng định tuyến siêu dữ liệu hiện đại đến triển khai chỉ POST hiện đại và giữ endpoint cũ riêng cho client cũ. Không bao giờ mô tả hành vi GET, DELETE, id phiên hoặc phát lại cũ là phần của `2026-07-28`.

```figure
tp-transport-handshake
```

## Use It

`code/main.py` triển khai máy chủ Streamable HTTP hiện đại hữu hạn với thư viện chuẩn Python. Nó xác thực Origin và header phản chiếu, bỏ qua header phiên đã bỏ, trả JSON cho lời gọi thường và minh họa luồng SSE `subscriptions/listen` hữu hạn.

```bash
cd code
python3 main.py --probe
python3 -m unittest discover tests -v
```

Thăm dò kiểm tra:

- Origin không hợp lệ bị từ chối;
- khám phá thành công không có id phiên;
- `Mcp-Session-Id` và `Last-Event-ID` bị bỏ qua;
- header không khớp trả `-32020`;
- phiên bản không hỗ trợ trả `-32022` với dữ liệu `supported` và `requested` chính xác;
- thông báo không id được chấp nhận trả HTTP `202` không phần thân;
- GET và DELETE trả `405`;
- `subscriptions/listen` là luồng phản hồi POST có xác nhận, thông báo và kết quả cuối mang id đăng ký của nó.

## Ship It

Bài học này cung cấp `outputs/skill-mcp-transport-migrator.md`. Nó bỏ phiên giao thức hiện đại, thêm xác thực header-phần thân, thay GET độc lập bằng `subscriptions/listen` và giữ mọi cầu nối cũ riêng rõ ràng.

## Exercises

1. Bỏ `Mcp-Method` khỏi POST. Xác nhận HTTP `400` và lỗi `-32020`.
2. Gửi phiên bản header và phần thân khớp `2027-01-01`. Xác nhận HTTP `400`, lỗi `-32022` và dữ liệu chính xác `{"supported":["2026-07-28"],"requested":"2027-01-01"}`.
3. Gửi `Mcp-Name` dấu báo hiệu Base64 cho URI tài nguyên ngoài ASCII. Xác nhận giá trị giải mã được so với `params.uri`.
4. Làm hỏng luồng listen hữu hạn trước phản hồi cuối. Gửi lại với id JSON-RPC mới và lấy lại công cụ.
5. Thêm handle quy trình tường minh vào công cụ ping. Gắn với chủ thể cấp quyền không dùng tính gắn kết kết nối.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| stdio | JSON-RPC phân cách dòng mới trên tiến trình con do client khởi chạy |
| Streamable HTTP | Một endpoint nơi mỗi thông điệp hiện đại là POST mới |
| Request-scoped SSE (SSE phạm vi yêu cầu) | Luồng phản hồi POST chứa thông báo liên quan và phản hồi cuối |
| `subscriptions/listen` | Yêu cầu POST sống lâu cho thông báo thay đổi đã chọn nhận |
| Header mismatch (Header không khớp) | HTTP `400` và JSON-RPC `-32020` khi header phản chiếu không đồng ý với phần thân |
| Origin validation (Xác thực Origin) | Phòng vệ DNS rebinding cho kết nối đến, không phải xác thực danh tính |
| Explicit state handle (Handle trạng thái tường minh) | Token ứng dụng truyền như đối số thường thay trạng thái phiên ẩn |
| Legacy bridge (Cầu nối cũ) | Hành vi thời kỳ trước riêng chỉ giữ để tương thích |

## Further Reading

- [MCP Transport Overview](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
