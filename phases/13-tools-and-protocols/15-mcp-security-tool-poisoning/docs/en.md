# MCP Security: Poisoned Metadata, Routing, and MRTR State

> Không trạng thái không nghĩa không cần tin cậy. Nghĩa là mỗi yêu cầu đưa ra bằng chứng máy chủ và gateway cần để xác thực lời gọi độc lập.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~60 minutes

## Learning Objectives

- Coi mô tả công cụ, chú giải, thông tin client và thông tin máy chủ là dữ liệu không đáng tin.
- Phát hiện đầu độc siêu dữ liệu, thay đổi bộ mô tả và xung đột tên chéo máy chủ.
- Xác thực siêu dữ liệu yêu cầu 2026-07-28 và header định tuyến Streamable HTTP.
- Bảo vệ MRTR `requestState` khỏi sửa đổi và gắn xác nhận với đối số chính xác.
- Áp dụng cấp quyền và giới hạn tốc độ cho chủ thể, không phải phiên giao thức đã bỏ.

## The Problem

Mô hình đọc mô tả công cụ để quyết định gọi gì. Bộ định tuyến đọc tên công cụ để quyết định gửi yêu cầu đâu. Người dùng đọc nhãn để quyết định phê duyệt gì. Một bộ mô tả độc hại có thể nhắm cả ba.

Hướng dẫn bảo mật MCP chính thức nói thẳng: mô tả và chú giải nên coi là không đáng tin trừ khi đến từ máy chủ đáng tin. Ngay cả vậy, tin cậy triển khai có thể đổi. Cập nhật máy chủ, gói bị xâm phạm, lỗi registry hoặc gộp gateway có thể đổi thứ mô hình thấy.

Giao thức hiện tại cũng đổi ranh giới bảo mật. Trong 2026-07-28 không có bắt tay lõi và không phiên vận chuyển. Thiết kế bảo mật đặt khóa phê duyệt, giới hạn tốc độ hoặc lịch sử kiểm toán chỉ theo `Mcp-Session-Id` không phải thiết kế hiện tại.

## The Concept

### Seven attack surfaces worth checking

Dùng danh sách cụ thể thay chỉ dẫn mơ hồ phải cẩn thận.

1. **Đầu độc siêu dữ liệu.** Mô tả chứa chỉ dẫn không liên quan hành vi công cụ khai báo.
2. **Lật bộ mô tả.** Tên, mô tả, lược đồ hoặc chú giải đã phê duyệt trước thay đổi.
3. **Che khuất chéo máy chủ.** Hai backend cung cấp cùng tên công cụ không định danh đầy đủ và định tuyến âm thầm chọn một.
4. **Nhầm lẫn header và phần thân.** `Mcp-Method` hoặc `Mcp-Name` không đồng ý với yêu cầu JSON-RPC.
5. **Leo thang khả năng.** Peer tuyên bố phần mở rộng hoặc tính năng client và máy chủ nhầm khai báo đó là cấp quyền.
6. **Sửa đổi trạng thái MRTR.** Client đổi `requestState`, trả lời câu hỏi khác hoặc dùng lại xác nhận với đối số khác.
7. **Nhầm danh tính chuỗi cung ứng.** Tên hiển thị quen thuộc được coi là bằng chứng danh tính nhà phát hành hoặc máy chủ.

Các bề mặt chồng lấn. Ghim hash giúp với thay đổi bộ mô tả nhưng không chứng minh bộ mô tả đầu an toàn. Quét tĩnh bắt cụm từ rõ nhưng không chỉ dẫn tinh vi. Không gian tên ngăn một lớp xung đột nhưng không ngăn máy chủ có không gian tên độc hại. Xếp chồng kiểm soát.

### The current request envelope is evidence, not identity

Mọi yêu cầu 2026-07-28 chứa:

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "elicitation": {"form": {}}
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "security-lab",
      "version": "1.0.0"
    }
  }
}
```

Xác thực phiên bản và hình dạng khả năng trên mọi yêu cầu. Dùng khả năng để chọn hình dạng phản hồi tương thích. Không dùng `clientInfo` làm chủ thể đã xác thực. Nó tự khai.

Cùng cảnh báo áp dụng cho `io.modelcontextprotocol/serverInfo` trong siêu dữ liệu kết quả. Hữu ích cho nhật ký và gỡ lỗi. Không phải chứng chỉ, bằng chứng registry hoặc quyết định cấp quyền.

### Validate routing before policy

Với `tools/call`, Streamable HTTP gồm:

```text
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.export
```

Phương thức header phải bằng phương thức phần thân. Tên header phải bằng `params.name`. Từ chối bất đồng bằng `-32020` trước chọn backend, áp dụng RBAC hoặc tiêu thụ token giới hạn tốc độ.

Thứ tự này khép mơ hồ phổ biến: một thành phần cấp quyền phần thân trong khi bên khác định tuyến theo header.

Xác thực đường truyền theo một chuỗi chính xác. Xác thực JSON-RPC và kiểu siêu dữ liệu, so giá trị header với phần thân, rồi kiểm tra phiên bản khớp có hỗ trợ không. Header không khớp trả HTTP 400 với `-32020`. Nếu header và phần thân đồng ý phiên bản không hỗ trợ, trả HTTP 400 với `-32022` và `data` chính xác `{"supported":["2026-07-28"],"requested":"<actual>"}`. Phương thức không biết trả HTTP 404 với `-32601`.

Mọi đối tượng lỗi gồm `data` tùy chọn khi hợp đồng cần thông tin phục hồi có cấu trúc. Thông báo không có `id`, nên không bao giờ nhận phản hồi thành công hoặc lỗi JSON-RPC. Thông báo HTTP được chấp nhận trả 202 với phần thân rỗng.

### Pin the whole descriptor

Chỉ hash mô tả bỏ lỡ thay đổi lược đồ và chú giải. Chuẩn hóa và hash trường bộ mô tả người dùng phê duyệt:

```python
normalized = json.dumps(tool, sort_keys=True, separators=(",", ":"))
digest = hashlib.sha256(normalized.encode()).hexdigest()
```

Lưu bản băm dưới khóa định danh đầy đủ như `notes.export`, cùng bằng chứng nhà phát hành và thời điểm phê duyệt ngoài ví dụ đơn giản này.

Trên mọi lần làm mới:

- Khóa không biết: cách ly đến khi xem xét.
- Cùng khóa, khác bản băm: cách ly như lật bộ mô tả đến khi phê duyệt lại.
- Tên không định danh đầy đủ trùng: yêu cầu không gian tên tất định.
- Máy quét phát hiện: chặn và xem xét toàn bộ bộ mô tả.

Hash bằng nhau chứng minh ổn định, không phải an toàn. Bộ mô tả bị đầu độc vẫn bị đầu độc khi ghim hoàn hảo.

### Static scanning is a tripwire

Mẫu đơn giản có thể đánh dấu thẻ vai trò, ghi đè chỉ dẫn, che giấu, truy cập bí mật và đích mạng bị làm mờ. Chúng đủ rẻ cho lúc cài và CI.

Không phải chứng minh ngữ nghĩa. Mô tả an toàn có thể chứa cụm từ bị đánh dấu trong cảnh báo hợp lệ. Mô tả độc hại có thể tránh mọi cụm từ. Coi đầu ra máy quét là bằng chứng xem xét, không phải điểm vô tội tự động.

### Namespace before merging

Giả sử hai máy chủ đều cung cấp `search`. Không bao giờ để thứ tự khám phá quyết định bên thắng.

```text
notes.search
issues.search
```

Tên định danh đầy đủ là tên gateway công khai. Ghi ánh xạ backend riêng. Tên ổn định làm phê duyệt, kiểm toán, ghim hash và định tuyến `Mcp-Name` tham chiếu cùng đối tượng.

### Capabilities are compatibility declarations

`clientCapabilities` mỗi yêu cầu cho máy chủ biết tính năng giao thức client xử lý được. Không cấp client quyền truy cập công cụ, dữ liệu hoặc hành động.

Cấp quyền vẫn đến từ chủ thể đã xác thực và chính sách tài nguyên. Chuỗi là:

1. Xác thực thông tin xác thực vận chuyển.
2. Xác thực phiên bản, header và hình dạng yêu cầu.
3. Kiểm tra tương thích khả năng.
4. Cấp quyền chủ thể, công cụ, tài nguyên và đối số.
5. Thực thi hoặc yêu cầu đầu vào người dùng.

### Protect stateless MRTR confirmation

Công cụ có hệ quả có thể cần xác nhận người dùng. MCP hiện tại dùng Yêu cầu nhiều lượt khứ hồi thay callback máy chủ-sang-client.

Phản hồi đầu:

```json
{
  "resultType": "input_required",
  "inputRequests": {
    "confirm": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Export notes to archive?",
        "requestedSchema": {
          "type": "object",
          "properties": {
            "confirm": {"type": "boolean"}
          },
          "required": ["confirm"]
        }
      }
    }
  },
  "requestState": "opaque-integrity-protected-value"
}
```

Client lấy đầu vào và thử lại phương thức gốc với id JSON-RPC mới:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes.export",
    "arguments": {"query": "private", "destination": "archive"},
    "requestState": "opaque-integrity-protected-value",
    "inputResponses": {
      "confirm": {
        "action": "accept",
        "content": {"confirm": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

Mỗi giá trị `inputRequests` là yêu cầu nhúng đầy đủ với `method` và `params`. Khóa phải khớp mục tương ứng trong `inputResponses`. Elicitation biểu mẫu dùng `requestedSchema` gốc đối tượng và client phải khai báo khả năng elicitation biểu mẫu trước khi máy chủ yêu cầu.

Khả năng hiện tại có hai khai báo biểu mẫu hợp lệ. `{"elicitation":{}}` ngầm hỗ trợ elicitation biểu mẫu, còn `{"elicitation":{"form":{}}}` nêu tường minh. Khai báo chỉ URL như `{"elicitation":{"url":{}}}` không hỗ trợ yêu cầu biểu mẫu. Máy chủ trả HTTP 400 với `-32021` và `data.requiredCapabilities` bằng `{"elicitation":{"form":{}}}`.

Coi `requestState` là đầu vào thù địch. Ký hoặc mã hóa, xác thực và gắn với phương thức, công cụ, đối số chính xác, mục đích, hết hạn, chủ thể và nonce một lần khi phát lại quan trọng. Mã bài dùng HMAC và khớp đối số chính xác để ranh giới rõ.

Sổ nonce không được chỉ nằm trong một đối tượng gateway. Mô hình chạy được tiêm kho chống phát lại có giới hạn, dọn theo TTL có thể dùng chung nhiều thực thể gateway. Chiếm nguyên tử là ranh giới thực thi: chỉ chấp nhận đã xác thực hoặc từ chối kết thúc tường minh tiêu thụ trạng thái. Phản hồi sai dạng hoặc `cancel` không thực thi gì và còn thử lại được đến hết hạn. Cụm sản xuất cần cùng chiếm có điều kiện trong lưu trữ bền vững dùng chung.

Không lưu ngữ cảnh xác nhận ẩn trong phiên giao thức. Mọi thực thể máy chủ nên xác thực được lần thử lại.

### Rule of two for high-risk calls

Phân loại lời gọi theo ba trục:

- Nó tiếp nhận đầu vào không đáng tin.
- Nó có thể truy cập dữ liệu nhạy cảm.
- Nó gây hành động bên ngoài có hệ quả.

Một bước tự động không nên kết hợp cả ba. Tách, giảm đặc quyền hoặc yêu cầu đầu vào người dùng tường minh qua MRTR. Đây là heuristic thiết kế, không phải khả năng giao thức.

### Reduce authority before execution

Chỉ không trạng thái không phải an toàn. Nó bỏ lịch sử giao thức ẩn, nhưng yêu cầu tự đầy đủ vẫn có thể yêu cầu trình xử lý quá quyền rò dữ liệu hoặc thay đổi không thể đảo ngược. An toàn đến từ giảm thẩm quyền tại mỗi ranh giới:

1. **Động từ có kiểu.** Cung cấp một thao tác có giới hạn như `archive_note`, không phải công cụ `run` hoặc `request` tổng quát diễn đạt quyền lực không liên quan.
2. **Đối số đã xác thực.** Dùng lược đồ đóng khi thực tế cho phép, từ chối trường không biết, chuẩn hóa định danh một lần, giới hạn kích thước và xác thực đích, tenant và sở hữu tài nguyên trước đánh giá chính sách.
3. **Cấp quyền hiện tại.** Gắn chủ thể đã xác thực với đúng động từ, tài nguyên, môi trường và đối số chuẩn hóa. Chú giải công cụ và khả năng client không cấp thẩm quyền này.
4. **Phê duyệt gắn hành động.** Với lời gọi có hệ quả, gắn phê duyệt với bản băm động từ có kiểu và đối số chuẩn hóa, cộng chủ thể, hết hạn và chính sách một lần. Mọi trường đổi cần quyết định mới.
5. **Từ chối hạng nhất.** Mô hình hóa từ chối, phê duyệt hết hạn, người dùng từ chối và đích không an toàn như kết quả thường không thực thi tác dụng phụ. Không chuyển từ chối thành công cụ dự phòng yếu hơn.
6. **Bằng chứng kiểm toán đã che.** Ghi ai yêu cầu, bộ mô tả được chấp nhận và phiên bản chính sách nào dùng, đích chuẩn hóa nào được cấp quyền, tại sao quyết định cho phép hoặc từ chối và thực thi có bắt đầu không. Lưu bản băm hoặc giá trị đã che thay bí mật.

Mỗi bước thu hẹp thứ thành phần tiếp được làm. Trình xử lý cuối nên nhận lệnh miền đã xác thực, không phải văn bản mô hình thô cộng thông tin xác thực rộng. Lặp toàn chuỗi trên lần thử lại MRTR, cập nhật tác vụ hoặc lời gọi gateway chuyển tiếp. Phê duyệt trước không biến yêu cầu sau thành lưu lượng phiên đáng tin.

### Current and legacy interaction paths

Roots, Sampling và Logging ngừng được khuyến nghị cho triển khai 2026-07-28 mới. Gateway chỉ có thể giữ mã kênh yêu cầu cũ làm nhánh tương thích chặn theo phiên bản.

Không xây phòng vệ mới quanh bộ giới hạn sampling mỗi phiên. Áp hạn ngạch cho chủ thể đã xác thực, bên phát hành, tài nguyên, công cụ và cửa sổ thời gian. Với công việc tương tác hiện tại, kiểm tra yêu cầu và phản hồi đầu vào MRTR.

### Stateless transport checks

- Nhận thông điệp MCP hiện đại tại endpoint POST duy nhất.
- Trả 405 cho GET và DELETE hiện đại.
- Không tạo hoặc phụ thuộc `Mcp-Session-Id`.
- Bỏ qua header phiên và phát lại cũ làm đầu vào thẩm quyền.
- Trả JSON hoặc SSE phạm vi yêu cầu cho POST đó.
- Chỉ dùng `subscriptions/listen` cho thông báo thay đổi sống lâu đã chọn nhận.

```figure
tp-tool-poisoning
```

## Build It

`code/main.py` triển khai mô hình gateway bảo mật nhỏ trong tiến trình. Nó chuẩn hóa và ghim toàn bộ bộ mô tả công cụ, báo đầu độc siêu dữ liệu và che khuất, xác thực vỏ yêu cầu hiện đại và giá trị định tuyến, thực hiện xuất có xác nhận hai vòng với `requestState` có chữ ký và kho chống phát lại dùng chung được tiêm.

Mô hình bắt đầu sau adapter HTTP đã phân tích phần thân JSON và header định tuyến. Không xác thực `Content-Type` hoặc `Accept`. Nối cùng bộ phân phối với adapter Streamable HTTP đầy đủ Bài 09, yêu cầu `Content-Type: application/json` và giá trị `Accept` chứa cả `application/json` và `text/event-stream`.

Chạy:

```bash
cd phases/13-tools-and-protocols/15-mcp-security-tool-poisoning
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Mẫu cố ý sửa bộ mô tả. Máy quét và so bản băm tạo phát hiện độc lập. Sau đó phần xuất minh họa phản hồi `input_required` và thử lại không trạng thái.

## Use It

Thay `SAFE_TOOLS` bằng ảnh chụp chuẩn hóa từ máy chủ đã phê duyệt của bạn. Giữ thông tin xác thực và bí mật ngoài ảnh chụp. Xem xét mọi bộ mô tả mới hoặc đổi trước cập nhật bản băm.

Tại gateway, chạy cùng kiểm tra trong khám phá và lần nữa trước phân phối. Bộ đệm có thể giảm công việc khám phá, nhưng phê duyệt lưu đệm phải hết hạn hoặc vô hiệu khi bộ mô tả đổi.

## Ship It

Bài học này cung cấp `outputs/skill-mcp-threat-model.md`. Nó tạo mô hình đe dọa giao thức hiện tại qua ranh giới siêu dữ liệu, định tuyến, khả năng, cấp quyền, MRTR, lưu đệm, registry và tương thích.

## Exercises

1. Gắn chủ thể đã xác thực và quyết định cấp quyền hiện tại với trạng thái MRTR niêm phong, rồi từ chối thử lại dưới chủ thể khác.
2. Thay kho chống phát lại trong bộ nhớ bằng chèn có điều kiện bền vững và chứng minh hai tiến trình không thể cùng chiếm một nonce.
3. Tiêm lỗi sau chiếm chống phát lại nhưng trước xuất mô phỏng. Định nghĩa và kiểm thử quy tắc giao dịch hoặc lũy đẳng làm phục hồi an toàn.
4. Đổi `inputSchema` công cụ không đổi mô tả. Xác nhận ghim toàn bộ bộ mô tả bắt được.
5. Thêm chính sách từ chối lưu đệm công khai khi `tools/list` khác theo chủ thể.
6. Mô hình hóa máy chủ cũ sau gateway. Đặt mọi hành vi bắt tay và phiên sau nhánh tương thích `2025-11-25` tường minh.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| Metadata poisoning (Đầu độc siêu dữ liệu) | Chỉ dẫn hoặc tuyên bố lừa đảo nhúng trong bộ mô tả công cụ |
| Rug pull (Lật bộ mô tả) | Thay đổi bộ mô tả đã phê duyệt trước |
| Tool shadowing (Che khuất công cụ) | Định tuyến mơ hồ do tên không định danh đầy đủ trùng |
| Header mismatch (Header không khớp) | Header định tuyến và phần thân JSON-RPC bất đồng, lỗi `-32020` |
| Hash pin (Ghim hash) | Bản băm toàn bộ bộ mô tả đã phê duyệt |
| MRTR | Mẫu phản hồi và thử lại không trạng thái cho đầu vào do máy chủ yêu cầu |
| `requestState` | Giá trị khứ hồi mờ phải coi là đầu vào không đáng tin |
| Capability declaration (Khai báo khả năng) | Tuyên bố tương thích giao thức, không phải cấp quyền |
| Implicit form support (Hỗ trợ biểu mẫu ngầm) | Đối tượng khả năng `elicitation` rỗng, tương đương hỗ trợ biểu mẫu |
| Qualified tool name (Tên công cụ định danh đầy đủ) | Tên gateway ổn định như `notes.search` |

## Further Reading

- [MCP security and trust guidance](https://modelcontextprotocol.io/specification/2026-07-28#security-and-trust--safety)
- [Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [Deprecated features](https://modelcontextprotocol.io/specification/2026-07-28/deprecated)
