# Explicit Scope and Stateless Elicitation

> Roots ngừng được khuyến nghị trong MCP 2026-07-28 và chưa bao giờ là sandbox bảo mật. Đặt phạm vi trong đối số công cụ hoặc URI tài nguyên hiển thị, cấp quyền trên máy chủ và dùng MRTR khi công cụ thực sự cần đầu vào người dùng. Người dùng thấy quyết định, mô hình thấy handle và mọi thực thể máy chủ có thể xử lý lần thử lại.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 11 (stateless MRTR)
**Time:** ~60 minutes

## Learning Objectives

- Thay Roots ngừng được khuyến nghị bằng tham số workspace, URI tài nguyên hoặc cấu hình máy chủ tường minh.
- Tách gợi ý phạm vi khỏi cấp quyền, giới hạn đường dẫn và sandbox hệ điều hành.
- Phân phối `elicitation/create` chế độ biểu mẫu qua kết quả MRTR `input_required`.
- Công bố hỗ trợ elicitation trong khả năng client mỗi yêu cầu và từ chối chế độ không hỗ trợ.
- Xác thực `accept`, `decline` và `cancel` là kết quả riêng.
- Gắn xác nhận phá hủy với chủ thể đã xác thực, đối số gốc, tập ứng viên và hết hạn.

## Two Problems That Look Similar

Công cụ ghi chú nhận yêu cầu này: "Xóa báo cáo TPS cũ."

Máy chủ phải trả lời hai câu hỏi khác nhau.

1. Thao tác này được chạm workspace nào?
2. Người dùng muốn nói ghi chú nào trong ba ghi chú khớp?

Câu đầu là phạm vi và cấp quyền. Câu hai là phân biệt tương tác. Trộn chúng dẫn đến thiết kế nguy hiểm, như coi thư mục client cung cấp là bằng chứng bên gọi được xóa mọi thứ bên trong.

## Roots Are a Migration Surface

Bản sửa đổi MCP trước cho client công bố Roots và thông báo máy chủ khi danh sách thay đổi. Roots là hướng dẫn thông tin. Chúng không giới hạn thứ tiến trình máy chủ đọc được, không cấp quyền bên gọi và không tạo sandbox hệ điều hành.

MCP 2026-07-28 ngừng khuyến nghị `roots/list` và `notifications/roots/list_changed` cho thiết kế mới. Ưu tiên một trong các thay thế tường minh:

- Đối số công cụ `workspaceUri` hoặc `directory` khi phạm vi đổi theo lời gọi.
- URI tài nguyên khi thao tác đã nhắm tài nguyên.
- Cấu hình máy chủ khi một triển khai sở hữu một workspace cố định.
- Sandbox tiến trình hoặc hệ thống file bị giam khi mã phải không thể thoát về mặt kỹ thuật.

Nếu tích hợp 2026-07-28 hiện có vẫn cần `roots/list` trong thời gian ngừng dùng, máy chủ nhúng nó trong MRTR `inputRequests`. Không được gửi yêu cầu ngược trực tiếp. Đó là adapter chuyển đổi; trình xử lý mới nên nhận phạm vi tường minh.

Mô hình có thể thấy và lặp handle tường minh. Phạm vi phiên vận chuyển ẩn khó kiểm tra, phát lại, kiểm toán và định tuyến hơn.

### The three-layer rule

URI tường minh vẫn không tự cấp quyền. Thực thi cả ba tầng:

1. **Cấp quyền:** Chủ thể đã xác thực này có được dùng workspace này không?
2. **Giới hạn:** URI đích chuẩn hóa có ở trong ranh giới workspace được cấp quyền không?
3. **Sandbox:** Hệ điều hành có thể ngăn máy chủ bị xâm phạm thoát ra dù vậy không?

Máy chủ chạy được giữ danh sách cho phép URI workspace được cấp quyền, chuẩn hóa đường dẫn mã hóa phần trăm, kiểm tra ranh giới thành phần đường dẫn thật và kiểm tra lại giới hạn ngay trước xóa.

Kiểm tra tiền tố chuỗi sơ khai là sai:

```text
allowed:   file:///work/notes
attacker:  file:///work/notes-evil/secret.md
traversal: file:///work/notes/%2e%2e/private.md
```

Cả hai đường dẫn thù địch bắt đầu bằng chuỗi gây hiểu lầm. Chuẩn hóa trước, rồi so thành phần đường dẫn. Máy chủ hệ thống file sản xuất cũng phải phòng tranh chấp liên kết tượng trưng và ngữ nghĩa đường dẫn riêng nền tảng.

## Elicitation Still Exists, but Delivery Changed

Elicitation là tính năng client hiện tại để thu đầu vào người dùng trong `tools/call`, `prompts/get` hoặc `resources/read`. Tên phương thức vẫn là `elicitation/create`. Thứ đổi là hướng luồng đường truyền.

Máy chủ 2026-07-28 không gửi yêu cầu JSON-RPC ngược. Nó trả `InputRequiredResult`:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "input_required",
    "inputRequests": {
      "delete_choice": {
        "method": "elicitation/create",
        "params": {
          "mode": "form",
          "message": "Choose one matching note and confirm deletion.",
          "requestedSchema": {
            "type": "object",
            "properties": {
              "note_id": {
                "type": "string",
                "enum": ["note-3", "note-7", "note-14"]
              },
              "confirm": {"type": "boolean"}
            },
            "required": ["note_id", "confirm"]
          }
        }
      }
    },
    "requestState": "integrity-protected-delete-state"
  }
}
```

Host kết xuất biểu mẫu. Người dùng có thể chấp nhận, từ chối rõ hoặc đóng nó. Client rồi thử lại `tools/call` gốc với id mới:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "notes_delete",
    "arguments": {
      "workspaceUri": "file:///Users/alice/Documents/Notes",
      "title": "TPS report"
    },
    "inputResponses": {
      "delete_choice": {
        "action": "accept",
        "content": {"note_id": "note-14", "confirm": true}
      }
    },
    "requestState": "integrity-protected-delete-state",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "elicitation": {"form": {}}
      }
    }
  }
}
```

Không có phiên giao thức giữa hai lời gọi. Máy chủ xác minh trạng thái phản hồi, xác thực phản hồi theo lược đồ kỳ vọng, kiểm tra ghi chú đã chọn thuộc tập ứng viên có chữ ký, cấp quyền lại workspace, kiểm tra lại giới hạn rồi xóa.

## Capability Negotiation Is Per Request

Client hỗ trợ elicitation chế độ biểu mẫu khai báo:

```json
{
  "io.modelcontextprotocol/clientCapabilities": {
    "elicitation": {"form": {}}
  }
}
```

Khả năng elicitation rỗng, `"elicitation": {}`, vẫn tương đương hỗ trợ chỉ biểu mẫu để tương thích. `"elicitation": {"form": {}}` tường minh cũng hỗ trợ chế độ biểu mẫu. Khai báo chỉ URL, `"elicitation": {"url": {}}`, thì không. Máy chủ không được nhúng chế độ vắng trong khả năng yêu cầu hiện tại, ngay cả khi yêu cầu trước công bố.

Mọi yêu cầu cũng mang `io.modelcontextprotocol/protocolVersion`. Phiên bản thiếu hoặc không chuỗi trả `-32602`. Chuỗi không hỗ trợ trả `-32022` với dữ liệu `supported` và `requested` chính xác. Hỗ trợ elicitation thiếu hoặc chỉ URL trả `-32021` với `data.requiredCapabilities` đặt thành `{"elicitation":{"form":{}}}`.

Vỏ không có `id` JSON-RPC là thông báo. Xử lý mà không phát phản hồi thành công hoặc lỗi JSON-RPC. Trên Streamable HTTP, thông báo được chấp nhận nhận `202 Accepted` không phần thân.

Nên gồm `clientInfo` để chẩn đoán, nhưng là tự khai và không thể nhận diện người dùng để cấp quyền.

Máy chủ triển khai `server/discover` và trả `supportedVersions`, khả năng, `ttlMs` và `cacheScope` với `resultType: "complete"`. Nó không công bố Roots cho thiết kế hiện đại này. Vì công bố công cụ, nó cũng triển khai `tools/list` bắt buộc. Kết quả trả bộ mô tả `notes_delete` tất định, `inputSchema` đối tượng hợp lệ, siêu dữ liệu danh tính máy chủ và gợi ý bộ đệm công khai.

## Form Mode

Chế độ biểu mẫu dùng JSON Schema hạn chế thiết kế cho hộp thoại dùng được. Gốc là đối tượng và thuộc tính là trường nguyên thủy phẳng hoặc mảng enum hỗ trợ. Đối tượng lồng sâu và lược đồ tài liệu đa dụng không thuộc hộp thoại xác nhận.

Dùng chế độ biểu mẫu để:

- chọn một trong nhiều ứng viên;
- xác nhận thao tác phá hủy;
- thu ưu tiên không nhạy cảm;
- thu số ít giá trị mà người dùng, không phải mô hình, phải quyết định.

Không dùng chế độ biểu mẫu cho mật khẩu, khóa API, token truy cập hoặc thông tin xác thực thanh toán. Bí mật đó đi qua client MCP và có thể đến nhật ký hoặc ngữ cảnh mô hình.

Máy chủ xác thực lại nội dung trả về. Xác thực biểu mẫu phía client cải thiện UX nhưng không tạo tin cậy.

## URL Mode

Chế độ URL gửi URL web an toàn cho tương tác ngoài băng:

```json
{
  "method": "elicitation/create",
  "params": {
    "mode": "url",
    "message": "Connect the report service to continue.",
    "url": "https://mcp.example.com/connect/report-service"
  }
}
```

Dùng khi thông tin nhạy cảm phải đi thẳng đến luồng web do máy chủ kiểm soát, như cấp quyền bên thứ ba. Client hiển thị đích đầy đủ và lấy đồng ý trước mở. Không được lấy trước URL.

Phản hồi `accept` nghĩa người dùng đồng ý mở URL. Không chứng minh luồng bên ngoài hoàn tất. Khi thử lại, máy chủ kiểm tra trạng thái riêng rồi hoàn tất hoặc trả kết quả `input_required` khác.

Elicitation URL không thay cấp quyền giữa client MCP và máy chủ MCP. Dành cho tương tác bên ngoài máy chủ MCP cần thực hiện thay người dùng. Máy chủ phải gắn người dùng trình duyệt với cùng chủ thể đã xác thực bắt đầu thao tác MCP.

## Response Branches

Coi hành động là quyết định sản phẩm, không phải bí danh:

| Hành động | Ý nghĩa | Hành vi máy chủ an toàn |
|--------|---------|----------------------|
| `accept` | Người dùng gửi tương tác | Xác thực nội dung và tiếp tục |
| `decline` | Người dùng từ chối rõ | Trả kết quả từ chối đầy đủ, không lỗi |
| `cancel` | Người dùng đóng hoặc không thể xong | Dừng an toàn và cho thử lại sau |

Không bao giờ diễn giải thiếu nội dung là đồng ý. Không bao giờ chuyển từ chối thành vòng lặp hỏi lặp lại.

## Protecting Destructive MRTR State

Danh sách ứng viên không thể chỉ nằm trong prompt hoặc giá trị Base64 không chữ ký. Client kiểm soát mọi thứ nó gửi lại.

Bài học ký payload trạng thái chứa:

- chủ thể đã xác thực;
- phương thức nguồn;
- bản băm `workspaceUri` và `title`;
- id ghi chú được phép hiển thị trong biểu mẫu;
- giai đoạn thao tác;
- thời hạn ngắn.

Trước thay đổi, máy chủ cũng kiểm tra bản ghi ghi chú đang tồn tại. Điều này bắt tranh chấp xóa và đích chuyển ra ngoài workspace sau khi biểu mẫu hiển thị.

Với hành động tài chính một lần hoặc không thể đảo ngược, chỉ HMAC không ngăn trạng thái hợp lệ phát lại trong hạn. Lưu và tiêu thụ nonce đúng một lần trong kho chống phát lại dùng chung mọi thực thể trình xử lý. Bài học tiêm kho có giới hạn, dọn theo TTL và giữ quyền chiếm nguyên tử trong khi xóa trong bộ nhớ. Cơ sở dữ liệu sản xuất nên ghép chiếm nonce và thay đổi trong một giao dịch hoặc ranh giới ghi có điều kiện tương đương.

Xác thực tương tác trước chiếm nonce. Phản hồi sai dạng hoặc `cancel` không thay đổi gì và để trạng thái thử lại được đến hết hạn. `decline` tường minh là kết thúc, nên bài học tiêu thụ nonce không xóa gì.

```figure
t3-roots-boundary
```

## Build It

`code/main.py` minh họa công cụ `notes_delete` hiện đại:

- `tools/list` trả bộ mô tả tất định, có thể lưu đệm với lược đồ workspace và tiêu đề bắt buộc.
- Phạm vi là đối số `workspaceUri` tường minh.
- Cấu hình máy chủ cấp quyền workspace đó cho chủ thể bài học.
- Chuẩn hóa URI từ chối nhầm lẫn tiền tố và duyệt đường dẫn mã hóa.
- Mọi lần xóa phá hủy cần elicitation chế độ biểu mẫu.
- Elicitation đi bên trong `resultType: "input_required"`.
- `requestState` có chữ ký gắn đúng danh sách ứng viên và đối số gốc.
- Kho chống phát lại được tiêm từ chối cùng trạng thái chấp nhận hoặc từ chối trên các thực thể máy chủ.
- Lần thử lại dùng id yêu cầu mới và trả `resultType: "complete"`.

Kho dữ liệu ở trong bộ nhớ để hành vi giao thức dễ kiểm tra. Quy tắc bảo mật vẫn như vậy với cơ sở dữ liệu.

## Use It

Từ thư mục gốc repo:

```bash
cd phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/code
python3 main.py
python3 -m unittest discover tests -v
```

Điểm kiểm tra kỳ vọng:

- Khám phá công bố công cụ không Roots.
- Khám phá công cụ trả `notes_delete` với `resultType`, danh tính máy chủ và gợi ý bộ đệm.
- Id yêu cầu `1` trả biểu mẫu trong `inputRequests.delete_choice`.
- Id yêu cầu `2` phản hồi trạng thái có chữ ký và hoàn tất xóa.
- Đường dẫn tiền tố và đường dẫn duyệt mã hóa đều thất bại kiểm tra giới hạn.
- Tiêu đề đổi không thể dùng lại trạng thái xác nhận gốc.
- Từ chối giữ ghi chú không đổi.
- Hai đối tượng máy chủ dùng chung trạng thái ghi chú và phát lại không thể cùng thực thi một xác nhận.
- Khai báo biểu mẫu rỗng và tường minh hoạt động, trong khi hỗ trợ chỉ URL trả yêu cầu biểu mẫu `-32021` chính xác.
- Thất bại phiên bản không hỗ trợ dùng hình dạng dữ liệu `-32022` chính xác.
- Thông báo không id không tạo phản hồi JSON-RPC.

## Ship It

`outputs/skill-elicitation-form-designer.md` thiết kế phạm vi tường minh, kiểm tra cấp quyền, biểu mẫu MRTR, nhánh phản hồi và gắn trạng thái. Nó từ chối coi Roots ngừng được khuyến nghị là sandbox hoặc thu bí mật qua chế độ biểu mẫu.

## Exercises

1. Thay kho chống phát lại trong bộ nhớ bằng SQLite. Dùng một giao dịch để chiếm nonce và xóa ghi chú, rồi chứng minh hai tiến trình không thể cùng commit.
2. Thêm thương lượng khả năng `url` và luồng thiết lập ngoài băng. Giữ thông tin xác thực bên thứ ba ngoài `inputResponses`.
3. Thay ánh xạ ghi chú trong bộ nhớ bằng cơ sở dữ liệu SQLite tạm. Kiểm tra lại cấp quyền và giới hạn trong giao dịch thay đổi.
4. Thêm chính sách liên kết tượng trưng cho triển khai hệ thống file thật. Giải thích tại sao chỉ giới hạn từ vựng URI không chặn được thoát qua symlink.
5. Thiết kế adapter 2025-11-25 ánh xạ đầu ra trình xử lý MRTR hiện đại sang elicitation cũ do máy chủ khởi tạo. Giữ cô lập khỏi trình xử lý hiện tại.

## Key Terms

| Thuật ngữ | Ý nghĩa trong 2026-07-28 |
|------|------------------------|
| Roots | Gợi ý workspace thông tin ngừng được khuyến nghị, không phải cấp quyền hoặc sandbox |
| Explicit scope (Phạm vi tường minh) | Workspace, thư mục hoặc handle tài nguyên hiển thị trong đối số yêu cầu |
| Containment (Giới hạn) | Kiểm tra thành phần đường dẫn chuẩn hóa giữ đích trong ranh giới |
| Elicitation (Thu thập đầu vào) | Tính năng client lấy đầu vào người dùng trong thao tác MCP |
| Form mode (Chế độ biểu mẫu) | Đầu vào người dùng có cấu trúc trong băng dùng lược đồ phẳng hạn chế |
| URL mode (Chế độ URL) | Tương tác ngoài băng cho quy trình nhạy cảm hoặc bên ngoài |
| MRTR | Kết quả cần đầu vào không trạng thái theo sau là thử lại mới |
| `requestState` | Trạng thái mờ phản hồi chính xác và được máy chủ kiểm tra toàn vẹn |
| Decline (Từ chối) | Người dùng từ chối tường minh |
| Cancel (Hủy) | Đóng hoặc tương tác chưa xong không có phê duyệt |

## Legacy Compatibility

Với peer ghim ở 2025-11-25, `roots/list`, `notifications/roots/list_changed` và `elicitation/create` trực tiếp do máy chủ khởi tạo có thể vẫn tồn tại. Gắn nhãn adapter đó là cũ. Không cho danh sách Root cũ bỏ qua cấp quyền máy chủ và không mang giả định phiên giao thức vào trình xử lý hiện đại.

## Further Reading

- [MCP 2026-07-28 Elicitation](https://modelcontextprotocol.io/specification/2026-07-28/client/elicitation)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Roots deprecation](https://modelcontextprotocol.io/specification/2026-07-28/client/roots)
- [MCP 2026-07-28 server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
