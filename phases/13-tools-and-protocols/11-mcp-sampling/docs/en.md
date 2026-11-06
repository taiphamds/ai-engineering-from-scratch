# MCP Model Input: Sampling Migration and Stateless MRTR

> MCP 2026-07-28 ngừng khuyến nghị Sampling cho thiết kế mới và bỏ kênh yêu cầu máy chủ-sang-client. Nếu quy trình hiện có vẫn cần mô hình của client, máy chủ trả kết quả `input_required` và client thử lại yêu cầu gốc với đầu ra mô hình. Vòng lặp suy luận trở nên tường minh, có giới hạn và không trạng thái ở tầng giao thức.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources and prompts)
**Time:** ~75 minutes

## Learning Objectives

- Giải thích tại sao Sampling ngừng được khuyến nghị trong MCP 2026-07-28 và chọn mặc định tích hợp mô hình trực tiếp cho máy chủ mới.
- Triển khai quy trình tương thích mang `sampling/createMessage` qua Yêu cầu nhiều lượt khứ hồi (MRTR).
- Đặt bản sửa đổi giao thức và khả năng client trong mọi đối tượng `_meta` yêu cầu.
- Trả `resultType: "input_required"` và thử lại phương thức gốc với id JSON-RPC mới.
- Bảo vệ tính toàn vẹn `requestState` và gắn với chủ thể, phương thức, đối số và hết hạn.
- Giới hạn vòng lặp có mô hình hỗ trợ bằng kiểm tra khả năng, phê duyệt, xác thực phản hồi và giới hạn vòng.

## The Decision Before the Protocol

Công cụ như `summarize_repo` cần hai loại công việc:

1. Công việc tất định: liệt kê file, đọc file được phép, xác thực đường dẫn và tập hợp nội dung.
2. Công việc mô hình: chọn file đại diện và tổng hợp bản tóm tắt.

Giờ bạn có hai kiến trúc hợp lệ.

### New server: integrate with a model provider directly

Đây là mặc định hiện tại. Máy chủ sở hữu lựa chọn mô hình, thông tin xác thực, ngân sách, thử lại và khả năng quan sát. Nó trả một kết quả `tools/call` thường cho client MCP.

Chọn khi máy chủ đã là dịch vụ được host hoặc khi hành vi mô hình đoán trước được quan trọng hơn dùng mô hình host.

### Existing Sampling workflow: migrate it to MRTR

Sampling vẫn tồn tại trong khoảng thời gian ngừng dùng. Máy chủ nhắm 2026-07-28 không thể gửi yêu cầu `sampling/createMessage` trực tiếp trở lại client. Thay vào đó nhúng yêu cầu đó trong `InputRequiredResult`.

Chỉ chọn nhánh tương thích này khi dùng mô hình và thông tin xác thực của client là yêu cầu sản phẩm thật. Ghi kế hoạch loại bỏ vì triển khai mới không nên tiếp nhận Sampling đã ngừng khuyến nghị.

## The Stateless Contract

Giao thức tháng 7 năm 2026 không có trao đổi `initialize`, không `notifications/initialized` và không `Mcp-Session-Id`. Mọi yêu cầu mang thông tin trước đây nằm trong bắt tay:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}},
      "io.modelcontextprotocol/clientInfo": {
        "name": "lesson-client",
        "version": "1.0.0"
      }
    }
  }
}
```

Máy chủ xác thực bản sửa đổi trên mọi yêu cầu. Phiên bản thiếu hoặc không phải chuỗi là params không hợp lệ, `-32602`. Chuỗi không hỗ trợ trả `-32022` với dữ liệu chính xác `{"supported":["2026-07-28"],"requested":"<client version>"}`. Thiếu khả năng Sampling trả `-32021` với `data.requiredCapabilities` đặt thành `{"sampling":{}}`.

Vỏ không có `id` JSON-RPC là thông báo. Bên nhận có thể xử lý, nhưng không phát phản hồi thành công lẫn phản hồi lỗi. Adapter Streamable HTTP trả `202 Accepted` không phần thân cho thông báo được chấp nhận.

Máy chủ cũng triển khai `server/discover` với khóa chính xác `supportedVersions`, khả năng, `ttlMs` và `cacheScope` để client có thể học và lưu đệm hợp đồng máy chủ trước gọi công cụ. Vì khám phá công bố `tools`, máy chủ cũng triển khai `tools/list` bắt buộc. Bộ mô tả `summarize_repo` tất định gồm `inputSchema` đối tượng hợp lệ, `resultType: "complete"`, siêu dữ liệu danh tính máy chủ và gợi ý bộ đệm công khai.

Mọi kết quả hiện đại thành công có trường phân biệt:

- `resultType: "complete"` nghĩa thao tác đã xong.
- `resultType: "input_required"` nghĩa client phải hoàn thành yêu cầu nhúng và thử lại.
- Phần mở rộng có thể định nghĩa kiểu kết quả thêm. Phần mở rộng Tasks thêm `"task"` ở Bài 13.

## One MRTR Round

Máy chủ không thể gọi client trong khi xử lý yêu cầu. Thay vào đó trả kết quả này:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "pick_files": {
        "method": "sampling/createMessage",
        "params": {
          "messages": [
            {
              "role": "user",
              "content": {
                "type": "text",
                "text": "Choose three representative files and return a JSON array."
              }
            }
          ],
          "systemPrompt": "Return only the requested value.",
          "modelPreferences": {
            "costPriority": 0.8,
            "intelligencePriority": 0.2
          },
          "maxTokens": 400
        }
      }
    },
    "requestState": "opaque-integrity-protected-value"
  }
}
```

Client xác minh hỗ trợ Sampling, áp dụng chính sách phê duyệt và mô hình, rồi lấy phản hồi mô hình. Sau đó gửi yêu cầu mới với id JSON-RPC khác:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "summarize_repo",
    "arguments": {"audience": "developer"},
    "inputResponses": {
      "pick_files": {
        "role": "assistant",
        "content": {
          "type": "text",
          "text": "[\"README.md\", \"server.py\", \"docs/intro.md\"]"
        },
        "model": "host-model",
        "stopReason": "endTurn"
      }
    },
    "requestState": "opaque-integrity-protected-value",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {"sampling": {}}
    }
  }
}
```

Lần thử lại không phải tiếp nối phiên giao thức. Đó là yêu cầu mới lặp phương thức và đối số gốc, chỉ thêm `inputResponses` vòng hiện tại và phản hồi `requestState` từng byte giống hệt.

MRTR chỉ được phép trên `tools/call`, `prompts/get` và `resources/read`. Máy chủ không được trả `input_required` từ phương thức không liên quan.

## Multi-Round State

Bài này cần hai lời gọi mô hình:

1. `pick_files` trả mảng JSON.
2. `summary` trả văn xuôi cuối.

Mỗi lần thử lại chỉ mang phản hồi cho vòng đó. Vì vậy máy chủ đặt giai đoạn và dữ liệu trung gian đã xác thực vào `requestState` tiếp theo.

Coi giá trị đó do kẻ tấn công kiểm soát. Chỉ ký tên giai đoạn thô không đủ. Gắn trạng thái với:

- chủ thể đã xác thực, không phải `clientInfo` tự khai;
- phương thức nguồn;
- bản băm đối số gốc;
- thời hạn ngắn;
- giai đoạn hiện tại và giá trị trung gian đã xác thực.

Dùng HMAC khi không cần tính bí mật. Dùng mã hóa có xác thực khi client không được đọc trạng thái. Từ chối chữ ký xấu, giá trị hết hạn, chủ thể đổi hoặc đối số đổi bằng `-32602`.

Client không được phân tích hoặc sửa `requestState`. Việc duy nhất là phản hồi đúng chuỗi trong lần thử lại.

## Model Preferences Are Hints

`costPriority`, `speedPriority` và `intelligencePriority` là ưu tiên độc lập. Không phải phân phối xác suất và không cần tổng bằng một. Client có thể bỏ qua vì client sở hữu chính sách mô hình.

Giữ `includeContext` ở `"none"` nếu duy trì luồng Sampling cũ. Chế độ ngữ cảnh khác tăng rủi ro rò rỉ và bản thân cũng ngừng được khuyến nghị. Truyền ngữ cảnh tường minh tối thiểu trong yêu cầu.

## Safety Invariants

Client là ranh giới tin cậy cho yêu cầu Sampling nhúng.

- Cho người dùng thấy máy chủ đang yêu cầu mô hình làm gì khi chính sách cần phê duyệt.
- Giới hạn vòng MRTR. Nếu không, máy chủ độc hại có thể tạo vòng lặp tiêu tiền mô hình.
- Xác thực mọi phản hồi sampling trước dùng làm tên file, URL hoặc đầu vào công cụ.
- Giới hạn byte và token mỗi vòng.
- Từ chối yêu cầu đầu vào chưa khai báo trong khả năng client hiện tại.
- Giữ đầu ra mô hình ngoài quyết định cấp quyền.
- Ghi phương thức nguồn và khóa yêu cầu đầu vào không ghi nội dung prompt nhạy cảm.

`clientInfo` và `serverInfo` là siêu dữ liệu hiển thị và chẩn đoán. Không bao giờ dùng bên nào làm danh tính đã xác thực.

```figure
t3-sampling-flip
```

## Build It

`code/main.py` triển khai toàn bộ luồng hai vòng không có gói bên thứ ba:

- `server/discover` trả `supportedVersions`, công bố hỗ trợ công cụ và trả gợi ý bộ đệm.
- `tools/list` trả bộ mô tả `summarize_repo` tất định, có thể lưu đệm với lược đồ đầu vào đối tượng.
- `tools/call` xác thực siêu dữ liệu mỗi yêu cầu.
- Kết quả đầu nhúng `sampling/createMessage` để chọn file.
- Lần thử lại đầu xác thực kết quả mô hình và nhúng yêu cầu thứ hai.
- `requestState` được HMAC bảo vệ mang giai đoạn giữa yêu cầu độc lập.
- Kết quả cuối dùng `resultType: "complete"`.

Mô hình host giả làm ví dụ tất định. Chỉ thay `fake_host_model` khi kết nối host thật. Máy trạng thái phía máy chủ nên giữ tất định và kiểm thử được.

## Use It

Từ thư mục gốc repo:

```bash
cd phases/13-tools-and-protocols/11-mcp-sampling/code
python3 main.py
python3 -m unittest discover tests -v
```

Điểm kiểm tra kỳ vọng:

- Khám phá trả kết quả đầy đủ với `ttlMs` và `cacheScope`.
- Khám phá công cụ trả cùng bộ mô tả đã sắp xếp với `resultType`, danh tính máy chủ và gợi ý bộ đệm.
- Thiếu khả năng và phiên bản không hỗ trợ dùng dữ liệu lỗi `-32021` và `-32022` chính xác.
- Thông báo không id không tạo phản hồi JSON-RPC.
- Id yêu cầu là `[1, 2, 3]`, chứng minh mỗi vòng MRTR độc lập.
- Hai kết quả đầu là `input_required`.
- Kết quả cuối là `complete` và chứa file đã chọn cộng tóm tắt.
- Đổi đối số gốc trong lần thử lại làm kiểm tra trạng thái yêu cầu thất bại.

## Ship It

`outputs/skill-sampling-loop-designer.md` giờ là bộ lập kế hoạch chuyển đổi. Trước hết quyết định có nên bỏ Sampling để tích hợp mô hình trực tiếp không. Nếu cần tương thích, nó tạo vòng MRTR, gắn trạng thái, cổng khả năng, ngân sách, xác thực và kế hoạch loại bỏ.

## Exercises

1. Đổi phản hồi chọn file thành JSON không hợp lệ. Xác nhận máy chủ trả `-32602` thay vì tin đầu ra mô hình.
2. Đổi `audience` giữa lời gọi đầu và thử lại. Giải thích tại sao trạng thái niêm phong chặn dùng lại chéo yêu cầu.
3. Thêm vòng thứ ba yêu cầu host phê bình bản tóm tắt. Mang bản tóm tắt trước bên trong trạng thái có chữ ký và giới hạn toàn luồng ở ba vòng.
4. Bỏ Sampling bằng thay callback host giả với adapter mô hình do máy chủ sở hữu. Liệt kê trách nhiệm phê duyệt, tính phí và quan sát nào chuyển sang máy chủ.
5. Thêm kiểm thử hết hạn bằng giá trị trạng thái quá thời hạn một giây.

## Key Terms

| Thuật ngữ | Ý nghĩa trong 2026-07-28 |
|------|------------------------|
| Sampling (Lấy mẫu) | Tính năng ngừng được khuyến nghị yêu cầu mô hình client tạo phần hoàn thành |
| MRTR | Mẫu thử lại không trạng thái cho đầu vào client cần trong yêu cầu |
| `InputRequiredResult` | Kết quả với `resultType: "input_required"` |
| `inputRequests` | Ánh xạ do máy chủ gán của yêu cầu elicitation, sampling hoặc roots nhúng |
| `inputResponses` | Kết quả client vòng hiện tại có khóa như `inputRequests` |
| `requestState` | Trạng thái máy chủ mờ được client phản hồi chính xác và máy chủ xác minh |
| `resultType` | Trường phân biệt bắt buộc cho kết quả MCP hiện đại |
| Direct model integration (Tích hợp mô hình trực tiếp) | Thay thế được khuyến nghị cho máy chủ mới cần suy luận mô hình |
| Capability gate (Cổng khả năng) | Quy tắc ngăn gửi yêu cầu nhúng client không công bố |
| Loop budget (Ngân sách vòng lặp) | Số vòng, token, byte, thời gian và chi tiêu tối đa cho phép của thao tác |

## Legacy Compatibility

Client ghim ở 2025-11-25 vẫn có thể dùng luồng `sampling/createMessage` do máy chủ khởi tạo cũ trên kết nối đang mở. Chỉ giữ hành vi đó trong adapter riêng phiên bản. Không biến nhánh có phiên thành kiến trúc cho máy chủ 2026-07-28.

SDK chính thức có thể chuyển trình xử lý `input_required` hiện đại cho peer cũ. Lớp chuyển tiếp đó là ranh giới tương thích, không phải quyền thêm logic phụ thuộc phiên mới.

## Further Reading

- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 changelog](https://modelcontextprotocol.io/specification/2026-07-28/changelog)
- [MCP Sampling deprecation](https://modelcontextprotocol.io/seps/2577-deprecate-roots-sampling-and-logging)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
