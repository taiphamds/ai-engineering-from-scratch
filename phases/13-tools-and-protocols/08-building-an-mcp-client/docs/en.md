# Building an MCP Client: Discovery, Routing, and Dual-Era Fallback

> Client MCP hiện đại lặp hợp đồng trên mọi yêu cầu. Quyết định tương thích khó nhất là biết khi nào máy chủ cũ thực sự cũ và khi nào máy chủ hiện đại báo lỗi có thể sửa.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07
**Time:** ~85 minutes

## Learning Objectives

- Xây mọi yêu cầu MCP `2026-07-28` với siêu dữ liệu hiện tại.
- Thăm dò máy chủ stdio bằng `server/discover` và chọn phiên bản cả hai hỗ trợ.
- Chỉ cấp quyền thăm dò cũ có giới hạn cho peer nằm rõ trong danh sách cho phép.
- Chỉ chấp nhận thời kỳ cũ sau khi xác thực kết quả `initialize` thành công cho bản sửa đổi hỗ trợ.
- Gộp danh sách công cụ tất định không âm thầm ghi đè xung đột.
- Định tuyến lời gọi đến peer sở hữu mỗi công cụ không bịa phiên giao thức.

## The Problem

Host agent thường nói chuyện với hơn một máy chủ MCP. Nó phải khám phá từng máy chủ, gộp danh mục công cụ, giải quyết tên trùng, định tuyến lời gọi và phục hồi sau lỗi vận chuyển.

Bản sửa đổi `2026-07-28` làm trạng thái ổn định đơn giản hơn vì mỗi yêu cầu tự đầy đủ. Tương thích khiến khởi động tinh tế hơn. Client có thể gặp:

- máy chủ hiện đại hỗ trợ phiên bản ưu tiên;
- máy chủ hiện đại trả lỗi phiên bản hoặc header đã nhận biết;
- máy chủ cũ chưa từng biết `server/discover`;
- máy chủ cũ im lặng đến khi nhận `initialize`.

Coi mọi lỗi thăm dò là cũ rất nguy hiểm. Yêu cầu hiện đại sai dạng, máy chủ quá tải, tiến trình chết và máy chủ cũ đều có thể tạo cùng hết thời gian hoặc đóng kết nối. Các tín hiệu đó mơ hồ. Client phải kết hợp ý định người vận hành tường minh với bằng chứng giao thức xác thực trước khi chọn thời kỳ cũ.

## The Concept

### A peer, not a protocol session

Giữ một bản ghi peer vận chuyển cho mỗi tiến trình máy chủ hoặc endpoint:

- handle vận chuyển hoặc hàm gửi;
- thời kỳ và phiên bản giao thức đã chọn;
- khả năng máy chủ khám phá gần nhất;
- danh sách công cụ tất định gần nhất;
- id yêu cầu chờ để liên hệ;
- tình trạng vận chuyển.

Đây là ghi chép phía client. Không phải trạng thái phiên giao thức. Trên MCP hiện đại, máy chủ vẫn nhận phiên bản và khả năng hiện tại trên mọi yêu cầu.

### Build every modern request from scratch

```python
def modern_request(request_id, method, params, version, capabilities):
    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "method": method,
        "params": {
            **params,
            "_meta": {
                "io.modelcontextprotocol/protocolVersion": version,
                "io.modelcontextprotocol/clientCapabilities": capabilities,
                "io.modelcontextprotocol/clientInfo": CLIENT_INFO,
            },
        },
    }
```

Không gắn siêu dữ liệu một lần vào đối tượng kết nối rồi giả định đã đến đường truyền. Đóng và kiểm tra yêu cầu tuần tự hóa cuối cùng.

### Modern discovery

`server/discover` trả phiên bản hỗ trợ, khả năng máy chủ, chỉ dẫn, gợi ý bộ đệm và danh tính máy chủ được khuyến nghị. Client chọn phiên bản hiện đại cao nhất cả hai hỗ trợ.

Khám phá là tùy chọn với client chỉ hiện đại, nhưng được khuyến nghị trên stdio. Một số máy chủ cũ nhận thao tác trước khởi tạo, nên gửi `tools/list` trước có thể tạo thành công mơ hồ. `server/discover` tạo ranh giới thời kỳ rõ.

### The stdio compatibility probe

Client stdio hai thời kỳ gửi `server/discover` với siêu dữ liệu hiện đại ưu tiên trước mọi yêu cầu khác. Có ba lớp kết quả:

1. **DiscoverResult.** Máy chủ hiện đại. Chọn phiên bản cả hai hỗ trợ và tiếp tục với siêu dữ liệu mỗi yêu cầu.
2. **Lỗi hiện đại đã nhận biết.** Máy chủ hiện đại. Với `-32022`, chọn từ `data.supported` và thử lại với id yêu cầu mới. Với lỗi header hoặc khả năng, sửa yêu cầu. Không gửi `initialize`.
3. **Tín hiệu mơ hồ.** Lỗi JSON-RPC không nhận biết, hết thời gian, đóng kết nối hoặc phản hồi rỗng không xác định thời kỳ. Thất bại theo hướng đóng trừ khi đúng peer đó được cấu hình tương thích cũ.

Lỗi giao thức hiện đại đã nhận biết gồm:

- `-32020` HeaderMismatch
- `-32021` MissingRequiredClientCapability
- `-32022` UnsupportedProtocolVersion

Lỗi hiện đại đã nhận biết vẫn là hiện đại ngay cả khi peer nằm trong danh sách cho phép cũ. Khi máy chủ chứng minh hiểu từ vựng lỗi hiện đại, gửi `initialize` sẽ là hạ cấp.

Không coi `-32601` là bằng chứng xác thực của cũ. Nó chỉ làm peer được cho phép rõ đủ điều kiện một lần thăm dò cũ. Cùng quy tắc áp dụng cho hết thời gian, đóng kết nối hoặc phản hồi rỗng.

### Allowlisting is operator intent, not evidence

Tương thích cũ phải là thuộc tính tường minh của một cấu hình peer được ghim:

```python
client.add_server("archive", archive_transport, allow_legacy=True)
```

Gắn lựa chọn đó với lệnh hoặc endpoint đã cấu hình. Không dùng ký tự đại diện cho phép máy chủ tùy ý tự chọn ngữ nghĩa yếu hơn. Peer không có `allow_legacy=True` thất bại sau kết quả khám phá mơ hồ và không bao giờ nhận `initialize`.

Danh sách cho phép cấp quyền thăm dò. Nó không chọn thời kỳ. Client gửi một `initialize` dưới thời hạn do vận chuyển thực thi, rồi yêu cầu tất cả điều sau:

- phản hồi JSON-RPC `2.0` với id yêu cầu khớp;
- đúng một `result` và không `error`;
- `protocolVersion` trong tập bản sửa đổi cũ cấu hình của client;
- trường `capabilities` có giá trị đối tượng;
- đối tượng `serverInfo` với trường chuỗi `name` và `version` không rỗng.

Hết thời gian, đóng kết nối, phản hồi lỗi, kết quả sai dạng, id không khớp hoặc bản sửa đổi không hỗ trợ đều thất bại theo hướng đóng. Chỉ kết quả thành công hợp lệ về cấu trúc chọn thời kỳ cũ. Mã truyền `legacy_probe_timeout_ms` vào adapter vận chuyển; adapter stdio hoặc HTTP thật phải thực thi thời hạn đó thay vì chỉ ghi lại.

Lưu đệm thời kỳ đã chọn cho peer vận chuyển. Không thăm dò lại trước mỗi lời gọi.

### Legacy is a compatibility branch

Khi thăm dò có giới hạn trả bằng chứng cũ xác thực hợp lệ, client dùng phiên bản cũ đã chọn đúng như bản sửa đổi đó định nghĩa:

1. Xác minh vỏ phản hồi và id liên hệ.
2. Xác minh bản sửa đổi đã thương lượng nằm trong tập cũ đã cấu hình.
3. Ghi khả năng và danh tính máy chủ đã xác thực.
4. Chỉ gửi `notifications/initialized` sau mọi kiểm tra đạt.
5. Dùng hình dạng yêu cầu cũ cho vòng đời vận chuyển đó.

Nhánh này tồn tại để tương tác với peer đã biết. Không phải thiết kế mặc định cho máy chủ mới hoặc yêu cầu mới. Nếu vận chuyển khởi động lại hoặc endpoint đổi, bỏ bộ đệm thời kỳ peer và thương lượng lại.

### Discovering and caching tools

Với mỗi peer hoạt động, gọi `tools/list`. Kết quả hiện đại gồm `resultType`, `ttlMs` và `cacheScope`. Tôn trọng gợi ý độ mới trong đúng ngữ cảnh cấp quyền. Lấy lại sau hết hạn hoặc sự kiện thay đổi danh sách đã đăng ký.

Client phải coi `resultType` thiếu từ máy chủ cũ là `"complete"`. Không yêu cầu trường bộ đệm hiện đại trên phản hồi từ thời kỳ trước đã thương lượng.

Máy chủ nên trả thứ tự tất định. Client cũng nên sắp xếp trước gộp để thứ tự sổ đăng ký cục bộ không phụ thuộc thời điểm khởi động tiến trình.

### Collision-safe namespace merge

Hai máy chủ đều có thể cung cấp `search`. Chọn chính sách đã khai báo:

1. **Thêm tiền tố khi xung đột.** Giữ tên chuẩn đầu tiên và đưa xung đột sau ra dưới dạng `<server>/<tool>`.
2. **Từ chối khi xung đột.** Không tải bản trùng và đưa lỗi cấu hình rõ ràng.
3. **Ghi đè âm thầm.** Không bao giờ dùng. Nó giấu máy chủ nào nhận hành động do mô hình chọn.

Lưu cả tên chuẩn lẫn tên cục bộ. Mô hình thấy tên chuẩn. `tools/call` đi ra dùng tên cục bộ máy chủ sở hữu đã khai báo.

### Routing a call

Định tuyến là tra cứu thuần:

```text
canonical tool name
  -> peer name + local tool name
  -> new JSON-RPC request id
  -> modern request metadata or explicit legacy shape
  -> matching response id
```

Không gửi lời gọi khi vận chuyển sở hữu không sẵn có. Kết nối lại hoặc khởi động lại vận chuyển, rồi chạy lại khám phá và `tools/list`. Yêu cầu hiện đại đang xử lý bị mất trên vận chuyển hỏng có thể thử lại với id JSON-RPC mới khi chính sách an toàn thao tác cho phép.

### Notifications and subscriptions

Thay đổi danh sách và tài nguyên hiện đại chỉ đến trên luồng `subscriptions/listen` do client mở. Client gửi bộ lọc thông báo, chờ `notifications/subscriptions/acknowledged` và liên hệ sự kiện với id yêu cầu listen trong siêu dữ liệu thông báo.

Khi ngắt kết nối, mở yêu cầu listen mới và lấy lại danh sách hoặc tài nguyên liên quan. Luồng hiện đại không tiếp tục bằng `Last-Event-ID`.

### No server-initiated requests

Máy chủ hiện đại không gọi client bằng yêu cầu JSON-RPC độc lập cho sampling, elicitation hoặc roots. Chúng trả `input_required`, và client thử lại yêu cầu gốc sau khi hoàn thành yêu cầu đầu vào nhúng.

Không chặn bộ đọc phản hồi của peer khi hoàn thành đầu vào. Giữ liên hệ và tạo id JSON-RPC mới cho lần thử lại.

```figure
tp-client-merge
```

## Use It

`code/main.py` dùng hàm peer trong tiến trình để quyết định giao thức rõ ràng. Nó kết nối hai peer hiện đại và một peer cũ được cố ý cho phép, rồi gộp và định tuyến công cụ của chúng. Callable vận chuyển nhận ngân sách hết thời gian để nhánh tương thích không thể giấu thăm dò không giới hạn.

```bash
cd code
python3 main.py
python3 -m unittest discover tests -v
```

Kiểm thử chứng minh ranh giới demo thường bỏ lỡ:

- yêu cầu hiện đại lặp siêu dữ liệu;
- `-32022` thử lại khám phá hiện đại không khởi tạo;
- lỗi hiện đại đã nhận biết không bao giờ hạ cấp, ngay cả với peer được cho phép;
- hết thời gian, đóng kết nối, phản hồi rỗng và lỗi không nhận biết không kích hoạt `initialize` nếu không có danh sách cho phép;
- peer được cho phép chỉ thành cũ sau kết quả `initialize` hợp lệ, được hỗ trợ;
- kết quả cũ sai dạng và không hỗ trợ để peer không sẵn có;
- thời kỳ được chọn thành công được lưu đệm cho vòng đời vận chuyển.

## Ship It

Bài học này cung cấp `outputs/skill-mcp-client-harness.md`. Nó dựng khung đóng yêu cầu hiện đại, thương lượng thời kỳ stdio, gộp không gian tên tất định, định tuyến và nhánh tương thích cũ thất bại theo hướng đóng.

## Exercises

1. Làm máy chủ giả trả `-32022` không có phiên bản cả hai hỗ trợ. Xác nhận client thất bại thay vì gửi `initialize`.
2. Đưa máy chủ cũ giả vào danh sách cho phép, làm thăm dò `initialize` có giới hạn hết thời gian và chứng minh peer vẫn `unknown` và không sẵn có.
3. Thêm danh sách công cụ `cacheScope: "private"` cho hai ngữ cảnh cấp quyền. Xác nhận client không bao giờ chia sẻ kết quả lưu đệm của ngữ cảnh này với ngữ cảnh kia.
4. Đổi chính sách xung đột thành từ chối và làm khởi động thất bại với tên cả hai peer trong lỗi.
5. Thêm mô phỏng `subscriptions/listen` hữu hạn. Khi mất luồng, listen lại với id yêu cầu mới và lấy lại công cụ.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| Peer (Đối tác) | Bản ghi phía client cho một vận chuyển máy chủ và dữ liệu đã khám phá |
| Protocol era (Thời kỳ giao thức) | Siêu dữ liệu hiện đại mỗi yêu cầu hoặc ngữ nghĩa khởi tạo cũ |
| Discovery probe (Thăm dò khám phá) | `server/discover` ban đầu dùng nhận biết thời kỳ stdio |
| Recognized modern error (Lỗi hiện đại đã nhận biết) | Lỗi chứng minh hành vi hiện đại và cấm dự phòng cũ |
| Legacy allowlist (Danh sách cho phép cũ) | Cấu hình người vận hành cho phép một thăm dò tương thích có giới hạn cho peer ghim |
| Positive legacy evidence (Bằng chứng xác thực về cũ) | Kết quả `initialize` hợp lệ, liên hệ đúng cho bản sửa đổi cũ được hỗ trợ rõ |
| Merged namespace (Không gian tên đã gộp) | Tên công cụ chuẩn trên mọi peer hoạt động |
| Collision policy (Chính sách xung đột) | Quy tắc tiền tố hoặc từ chối cho tên công cụ trùng |
| Era cache (Bộ đệm thời kỳ) | Hành vi hiện đại hoặc cũ đã chọn lưu cho một peer vận chuyển |
| Transport recovery (Phục hồi vận chuyển) | Khởi động lại hoặc kết nối lại, khám phá lại, liệt kê lại và thử lại an toàn với id mới |

## Further Reading

- [MCP Specification 2026-07-28](https://modelcontextprotocol.io/specification/2026-07-28/)
- [MCP Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [MCP stdio Transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/stdio)
- [MCP Versioning](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
