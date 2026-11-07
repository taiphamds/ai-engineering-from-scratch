---
id: mrtr-confirmation-state
title: Confirm a deletion without a session
card: protocols
kind: design
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [mcp, elicitation, mrtr, request-state, replay, confirmation]
minutes: 12
lessons: [phases/13-tools-and-protocols/12-mcp-roots-and-elicitation, phases/13-tools-and-protocols/15-mcp-security-tool-poisoning]
manuals: []
practice: []
cheatsheet: [mcp-tasks-elicitation-apps, mcp-security-auth]
related: [protocols/roots-are-not-a-sandbox, protocols/header-body-mismatch-order]
updated: 2026-11-03
---

Một công cụ xóa ghi chú, `notes_delete`, tìm thấy ba ghi chú khớp với tiêu đề người dùng đưa ra. Thiết kế luồng xác nhận theo bản sửa đổi MCP hiện tại: server yêu cầu người dùng chọn một ghi chú và xác nhận bằng cách nào, câu trả lời quay về bằng cách nào, và điều gì ngăn một client trả lời một câu hỏi khác hoặc phát lại một xác nhận với các đối số đã thay đổi.

## Short answer

Server trả lời bằng một kết quả có kiểu `input_required` nhúng một yêu cầu biểu mẫu `elicitation/create` liệt kê ba id ứng viên và một boolean `confirm`, cùng một `requestState` được bảo vệ tính toàn vẹn. Client hiển thị biểu mẫu và thử lại `tools/call` ban đầu với một id yêu cầu mới, gửi lại `requestState` và các `inputResponses`. Server ký trạng thái bao phủ principal, phương thức, một digest của các đối số, tập ứng viên, giai đoạn và một thời hạn, xác minh phần gửi lại, kiểm tra id được chọn nằm trong tập đã ký, ủy quyền lại workspace và kiểm tra lại sự chứa bên trong, và tiêu thụ một nonce dùng một lần trong một kho chống phát lại dùng chung trước khi xóa.

## Full answer

### The first response

```json
{
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
            "note_id": {"type": "string", "enum": ["note-3", "note-7", "note-14"]},
            "confirm": {"type": "boolean"}
          },
          "required": ["note_id", "confirm"]
        }
      }
    }
  },
  "requestState": "integrity-protected-delete-state"
}
```

Một server hiện tại không gửi yêu cầu JSON-RPC ngược. Yêu cầu được nhúng là hoàn chỉnh, với `method` và `params`, và khóa của nó phải khớp với mục trong `inputResponses` ở lần thử lại.

### Capabilities are checked on this request

Server chỉ được nhúng một biểu mẫu khi `clientCapabilities` của yêu cầu hiện tại hỗ trợ nó. `{"elicitation": {}}` và `{"elicitation": {"form": {}}}` đều hỗ trợ chế độ form. Một khai báo chỉ có URL thì không, và server trả về `-32021` với `data.requiredCapabilities` bằng `{"elicitation":{"form":{}}}`. Khai báo của một yêu cầu trước đó không bao giờ được tính.

### Form mode has limits

Gốc là một đối tượng với các trường nguyên thủy phẳng hoặc các enum được hỗ trợ. Dùng nó để chọn giữa các ứng viên, xác nhận một thao tác phá hoại hoặc thu thập các tùy chọn không nhạy cảm. Không bao giờ thu thập mật khẩu, API key hoặc thông tin xác thực thanh toán trong đó, vì chúng sẽ đi qua client và có thể đến nhật ký hoặc ngữ cảnh mô hình. Chế độ URL tồn tại cho luồng bên ngoài đó.

### Three outcomes, three behaviors

| Hành động | Ý nghĩa | Hành vi server |
|---|---|---|
| `accept` | người dùng đã gửi biểu mẫu | xác thực nội dung và tiếp tục |
| `decline` | người dùng đã từ chối | trả về một sự từ chối hoàn chỉnh, không phải lỗi; tiêu thụ nonce mà không xóa |
| `cancel` | người dùng đã bỏ qua hoặc không thể hoàn tất | dừng an toàn; trạng thái vẫn có thể thử lại cho đến khi hết hạn |

Không bao giờ đọc nội dung thiếu là sự đồng ý, và không bao giờ biến một lần từ chối thành một lời nhắc lặp lại.

### What the signed state binds

Trạng thái giữ principal đã xác thực, phương thức gốc, một digest của `workspaceUri` và `title`, các id ghi chú được cho phép đã hiển thị trong biểu mẫu, giai đoạn thao tác và một thời hạn ngắn. Ở lần thử lại, server xác minh chữ ký, xác thực phản hồi theo schema, kiểm tra `note_id` nằm trong tập ứng viên đã ký, ủy quyền lại workspace, kiểm tra lại sự chứa bên trong, và chỉ sau đó mới thay đổi dữ liệu. Một tiêu đề đã thay đổi không thể dùng lại trạng thái ban đầu.

### Why HMAC alone is not enough

Một trạng thái hợp lệ có thể được phát lại trong thời hạn của nó. Lưu và tiêu thụ một nonce đúng một lần trong một kho chống phát lại được mọi instance handler dùng chung, và giữ quyền chiếm nguyên tử trong lúc việc xóa chạy. Một cơ sở dữ liệu ghép việc chiếm và biến đổi trong một giao dịch. Xác thực trước khi chiếm: một phản hồi sai định dạng hoặc một lần cancel không chiếm gì.

## Follow-ups

- **Level 3:** Client chỉ khai báo `{"elicitation": {"url": {}}}`. Server làm gì? Expected: trả về `-32021` với capability form bắt buộc trong `data`; nó không được nhúng một chế độ mà yêu cầu hiện tại không khai báo.
- **Level 3:** Người dùng đóng hộp thoại. Hành động nào, và điều gì xảy ra với trạng thái? Expected: `cancel`; không có gì bị thay đổi và trạng thái vẫn có thể thử lại cho đến khi hết hạn, khác với `decline`, vốn là kết thúc.
- **Level 4:** Hai instance server dùng chung kho ghi chú. Bạn ngăn cả hai thực thi một xác nhận bằng cách nào? Expected: một kho chống phát lại dùng chung với việc chiếm nonce nguyên tử ghép với biến đổi; kiểm thử của bài học chạy hai đối tượng server trên một trạng thái.
- **Level 4:** Một ghi chú di chuyển ra ngoài workspace sau khi biểu mẫu được hiển thị. Điều gì bắt được nó? Expected: kiểm tra bản ghi trực tiếp và kiểm tra lại sự chứa bên trong trước biến đổi, không phải chỉ trạng thái đã ký.

## Wrong answers

- "Giữ danh sách ứng viên trong bộ nhớ server được khóa theo kết nối." Không có phiên, và lần thử lại có thể đến bất kỳ instance nào. Các ứng viên đi bên trong trạng thái đã ký.
- "Host đã xác thực biểu mẫu, nên server có thể tin nội dung." Client kiểm soát mọi thứ nó gửi. Server xác thực lại schema và tập ứng viên.
- "Yêu cầu mật khẩu của người dùng trong biểu mẫu làm xác nhận." Chế độ form không được mang bí mật. Một luồng thông tin xác thực bên ngoài dùng chế độ URL và gắn người dùng trình duyệt với cùng principal.

## Taught in

[Bài học về roots và elicitation](../../../phases/13-tools-and-protocols/12-mcp-roots-and-elicitation/) xây dựng luồng này với một kho chống phát lại, và [bài học bảo mật](../../../phases/13-tools-and-protocols/15-mcp-security-tool-poisoning/) xem `requestState` là đầu vào thù địch.
