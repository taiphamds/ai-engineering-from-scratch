# MCP Tasks Extension: Durable Work on a Stateless Core

> MCP không trạng thái không nghĩa mọi thao tác phải xong trong một yêu cầu. Phần mở rộng Tasks chính thức cho công việc chạy lâu một handle bền vững tường minh. Máy chủ có thể trả handle đó từ `tools/call`, mọi thực thể có thể trả lời `tasks/get`, và đầu vào client đến qua `tasks/update` không làm sống lại phiên giao thức.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 11 (stateless MRTR), Phase 13 · 12 (elicitation)
**Time:** ~90 minutes

## Learning Objectives

- Phân biệt vận chuyển giao thức không trạng thái với trạng thái tác vụ ứng dụng bền vững.
- Thương lượng phần mở rộng `io.modelcontextprotocol/tasks` trong khả năng mỗi yêu cầu và `server/discover`.
- Chỉ trả `CreateTaskResult` do máy chủ quyết định với `resultType: "task"` sau khi tạo bền vững.
- Thăm dò bằng `tasks/get`, hoàn thành đầu vào tác vụ bằng `tasks/update` và yêu cầu hủy hợp tác bằng `tasks/cancel`.
- Bỏ giả định `tasks/status`, `tasks/result` và `tasks/list` cũ.
- Đăng ký thông báo tác vụ tùy chọn qua `subscriptions/listen` trên luồng SSE phản hồi POST.
- Mô hình hóa đúng hết hạn tác vụ, phục hồi khởi động lại, khử trùng khóa đầu vào và lỗi thực thi.

## Why Tasks Are an Extension

Tasks xuất hiện đầu tiên như tính năng lõi thử nghiệm trong 2025-11-25. Thiết kế lại tháng 7 năm 2026 chuyển chúng vào phần mở rộng chính thức `io.modelcontextprotocol/tasks` để client và máy chủ có thể chọn vòng đời thêm mà không mở rộng giao thức lõi cho mọi người.

Đặc tả phần mở rộng vẫn là bề mặt dự thảo dù là nơi chính thức hiện tại cho Tasks. Ghim phiên bản phần mở rộng SDK hỗ trợ, chạy kịch bản tuân thủ và cô lập adapter đường truyền khỏi miền worker và lưu trữ.

Dùng tác vụ khi thao tác có một hoặc nhiều thuộc tính này:

- Có thể tồn tại lâu hơn thời gian chờ yêu cầu thường.
- Hàng đợi worker hoặc hệ thống công việc ngoài đã sở hữu thực thi.
- Client cần phục hồi sau chính nó khởi động lại.
- Thao tác tạm dừng để có đầu vào người dùng hoặc mô hình trong thực thi.
- Hủy và lấy kết quả bền vững là yêu cầu sản phẩm.

Không tạo tác vụ cho tra cứu tất định rẻ. Handle, lưu trữ bền vững, thăm dò, hết hạn và hủy là độ phức tạp thật.

## Stateless Core, Stateful Application

MCP 2026-07-28 bỏ `initialize`, `notifications/initialized`, phiên giao thức và `Mcp-Session-Id`. Điều đó không cấm sản phẩm có trạng thái.

Id tác vụ là trạng thái ứng dụng tường minh:

- Máy chủ lưu bền vững trước trả.
- Client có thể lưu và thăm dò lại sau khởi động lại.
- Id có thể định tuyến đến mọi bản sao dùng cùng kho bền vững.
- Cấp quyền được kiểm tra trên mọi phương thức tác vụ.
- Hết hạn và xóa được định nghĩa bằng trường tác vụ, không phải vòng đời vận chuyển.

Điều này khác về vận hành với trạng thái ẩn gắn vào kết nối.

Giữ bốn vòng đời riêng:

| Trạng thái | Vòng đời | Nơi thuộc về |
|---|---|---|
| Siêu dữ liệu giao thức | Một yêu cầu | `params._meta`, xác thực lại trên mọi lời gọi |
| Công việc vận chuyển | Một yêu cầu stdio hoặc phản hồi HTTP | Bộ điều phối đang xử lý với thời hạn có giới hạn |
| Tiếp nối MRTR | Một chuỗi thử lại | `requestState` bảo vệ toàn vẹn, cộng kiểm soát phát lại khi cần |
| Tác vụ bền vững | Qua yêu cầu, bản sao, khởi động lại và kết nối lại | Kho ứng dụng dùng chung có khóa là `taskId` được cấp quyền |

Chuyển bản ghi tác vụ vào bộ nhớ tiến trình không làm MCP có trạng thái. Nó làm ứng dụng không đáng tin. Giao thức vẫn không trạng thái, nhưng `tasks/get` sau định tuyến đến bản sao khác không khôi phục được bản ghi. Lưu bền vững trước trả handle, rồi làm mọi phương thức tác vụ phân giải cùng bản ghi dùng chung dưới kiểm tra tenant và chủ thể.

## Capability Negotiation

Client công bố hỗ trợ trên mọi yêu cầu đủ điều kiện:

```json
{
  "_meta": {
    "io.modelcontextprotocol/protocolVersion": "2026-07-28",
    "io.modelcontextprotocol/clientCapabilities": {
      "extensions": {
        "io.modelcontextprotocol/tasks": {}
      }
    },
    "io.modelcontextprotocol/clientInfo": {
      "name": "lesson-client",
      "version": "1.0.0"
    }
  }
}
```

Máy chủ trả `supportedVersions`, khả năng, `ttlMs` và `cacheScope` chính xác từ `server/discover`, với cùng phần mở rộng dưới khả năng. Vì công bố công cụ, nó cũng triển khai `tools/list` bắt buộc. Kết quả trả bộ mô tả `generate_report` tất định, `inputSchema` đối tượng hợp lệ, `resultType: "complete"`, siêu dữ liệu danh tính máy chủ và gợi ý bộ đệm công khai.

Phương thức tác vụ từ client không khai báo phần mở rộng trả `-32021`, Thiếu khả năng client bắt buộc, với `data.requiredCapabilities` đặt thành `{"extensions":{"io.modelcontextprotocol/tasks":{}}}`. Chuỗi giao thức không hỗ trợ trả `-32022` với dữ liệu `supported` và `requested` chính xác; phiên bản thiếu hoặc không chuỗi trả `-32602`.

Vỏ không có `id` JSON-RPC là thông báo. Bên nhận có thể xử lý, nhưng không phát kết quả hoặc lỗi JSON-RPC. Adapter Streamable HTTP trả `202 Accepted` không phần thân cho thông báo được chấp nhận.

Hiện tại chỉ `tools/call` hỗ trợ thực thi tăng cường tác vụ. Thiết kế trừu tượng nội bộ để kiểu yêu cầu tương lai không đòi viết lại lưu trữ.

## Server-Directed Task Creation

Cờ client cũ `params._meta.task.required` đã bỏ. Client khai báo hỗ trợ phần mở rộng, rồi máy chủ quyết định `tools/call` cụ thể có thành tác vụ không.

Yêu cầu:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_report",
    "arguments": {"size": "large"},
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Phản hồi:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "resultType": "task",
    "taskId": "tsk_786512e29e0d",
    "status": "working",
    "statusMessage": "Preparing report outline.",
    "createdAt": "2026-08-21T10:30:00Z",
    "lastUpdatedAt": "2026-08-21T10:30:00Z",
    "ttlMs": 900000,
    "pollIntervalMs": 1000
  }
}
```

Máy chủ không được trả handle này đến khi `tasks/get` cho id phân giải được. Trong kho nhất quán cuối cùng, chờ khả năng đọc thấy trước trả lời. Nếu không, client có thể nhận id trông hợp lệ rồi lập tức nhận "không tìm thấy."

Phản hồi tác vụ không được yêu cầu theo nghĩa client không yêu cầu chế độ tác vụ. Không phải không được thương lượng: yêu cầu hiện tại vẫn phải công bố phần mở rộng.

## The Task Shape

Mọi tác vụ mang:

- `taskId`: định danh ổn định do máy chủ tạo;
- `status`: `working`, `input_required`, `completed`, `cancelled` hoặc `failed`;
- `createdAt` và `lastUpdatedAt`: dấu thời gian ISO 8601;
- `ttlMs`: thời gian hết hạn từ lúc tạo, hoặc `null` nếu không công bố giới hạn;
- `pollIntervalMs` tùy chọn: nhịp thăm dò tối thiểu máy chủ hiện gợi ý;
- `statusMessage` tùy chọn: ngữ cảnh hướng người dùng hoặc mô hình.

Trường riêng trạng thái chỉ xuất hiện khi liên quan:

- `input_required` gồm `inputRequests`.
- `completed` gồm hình dạng `result` của yêu cầu gốc.
- `failed` gồm đối tượng `error` JSON-RPC.

Client nên tôn trọng `pollIntervalMs`. Máy chủ có thể giới hạn tốc độ thăm dò mạnh hơn và có thể đổi khoảng trong vòng đời tác vụ.

## Poll with `tasks/get`

Client yêu cầu ảnh chụp hiện tại:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/get
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tasks/get",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Bản thân `tasks/get` đã xong, nên kết quả luôn có `resultType: "complete"`. Tác vụ lồng vẫn có thể có `status: "working"` hoặc `status: "input_required"`.

Phân biệt này ngăn lỗi bộ phân tích phổ biến:

```text
result.resultType = complete    means the tasks/get RPC finished
result.status = working        means the represented job is still running
```

Không có lời gọi `tasks/result`. Khi tác vụ xong, phản hồi `tasks/get` tiếp nhúng `CallToolResult` gốc dưới `result`:

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "completed",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:34:12Z",
  "ttlMs": 900000,
  "result": {
    "resultType": "complete",
    "content": [
      {"type": "text", "text": "Generated large report with approved outline."}
    ],
    "structuredContent": {"size": "large", "approved": true},
    "isError": false,
    "_meta": {
      "io.modelcontextprotocol/serverInfo": {
        "name": "tasks-demo",
        "version": "1.0.0"
      }
    }
  },
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "tasks-demo",
      "version": "1.0.0"
    }
  }
}
```

`resultType` ngoài nói RPC `tasks/get` đã xong. `result.resultType` lồng nói lời gọi công cụ gốc đã xong. Trường phân biệt lồng đó bắt buộc. `CallToolResult` lồng cũng NÊN mang `io.modelcontextprotocol/serverInfo` riêng; bài này đưa vào thay vì lưu payload không kiểu.

Không có `tasks/list`. Máy chủ không phiên không thể suy an toàn tác vụ nào thuộc danh sách phạm vi kết nối. Ứng dụng cần lịch sử nên cung cấp công cụ miền được cấp quyền với bộ lọc và quy tắc sở hữu tường minh.

## Input During Task Execution

Đầu vào tác vụ và MRTR lõi trông giống nhưng dùng tiếp nối khác nhau.

### Input needed before task creation

Trả `resultType: "input_required"` lõi từ `tools/call` gốc. Client hoàn thành rồi thử lại lời gọi gốc đó. Chỉ tạo tác vụ sau khi vòng MRTR đồng bộ đó xong.

### Input needed after task creation

Đặt tác vụ thành `input_required`. `tasks/get` đưa `inputRequests` chờ ra và client gửi phản hồi qua `tasks/update`. Client không thử lại `tools/call` gốc.

Ảnh chụp:

```json
{
  "resultType": "complete",
  "taskId": "tsk_786512e29e0d",
  "status": "input_required",
  "createdAt": "2026-08-21T10:30:00Z",
  "lastUpdatedAt": "2026-08-21T10:31:00Z",
  "ttlMs": 900000,
  "inputRequests": {
    "approve_outline": {
      "method": "elicitation/create",
      "params": {
        "mode": "form",
        "message": "Approve the generated report outline?",
        "requestedSchema": {
          "type": "object",
          "properties": {"approved": {"type": "boolean"}},
          "required": ["approved"]
        }
      }
    }
  }
}
```

Cập nhật:

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/update
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tasks/update",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "inputResponses": {
      "approve_outline": {
        "action": "accept",
        "content": {"approved": true}
      }
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Phản hồi thành công là xác nhận rỗng cộng `resultType: "complete"`. Thay đổi trạng thái có thể nhất quán cuối cùng, nên client tiếp tục thăm dò hoặc lắng nghe.

Mỗi khóa `inputRequests` phải duy nhất trong toàn vòng đời tác vụ. Ảnh chụp `tasks/get` lặp có thể cho cùng khóa đang chờ; client khử trùng UI và máy chủ bỏ phản hồi cho khóa không biết, bị thay thế hoặc đã hoàn thành. Cập nhật từng phần có thể để tác vụ ở `input_required` đến khi mọi khóa bắt buộc được trả lời.

## Cancellation Is Cooperative

`tasks/cancel` báo ý định và trả xác nhận đầy đủ rỗng. Xác nhận đó không bảo đảm worker dừng. Công việc có thể xong trước, bỏ qua hủy hoặc chuyển sau.

```http
POST /mcp HTTP/1.1
Content-Type: application/json
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tasks/cancel
Mcp-Name: tsk_786512e29e0d
```

```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tasks/cancel",
  "params": {
    "taskId": "tsk_786512e29e0d",
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/tasks": {}
        }
      }
    }
  }
}
```

Với cả ba phương thức tác vụ, `Mcp-Name` phản chiếu `params.taskId`. Nó không lặp tên phương thức JSON-RPC. `code/main.py` tập trung quy tắc này trong `make_http_request`.

Worker bài học tôn trọng hủy ngay, khiến lời gọi lặp lũy đẳng. Client sản xuất vẫn phải coi hủy là hợp tác thay vì suy trạng thái tác vụ cuối từ xác nhận.

Không dùng `notifications/cancelled` để hủy tác vụ. Thông báo đó thuộc hủy yêu cầu, không phải Tasks bền vững.

Phân biệt quan trọng tại ranh giới định tuyến. Hủy yêu cầu nhắm một thao tác JSON-RPC đang xử lý hoặc phản hồi HTTP phạm vi yêu cầu của nó. Nếu `tools/call` đã trả `resultType: "task"`, yêu cầu đó xong và đóng vận chuyển không thể gọi tên hoặc dừng công việc bền vững. `tasks/cancel` là RPC mới được cấp quyền. Nó mang `params.taskId`, phản chiếu id trong `Mcp-Name`, phân giải backend sở hữu tác vụ, ghi ý định hủy hợp tác và trả xác nhận không khẳng định worker đã dừng.

Vì vậy gateway phải giữ bộ điều phối yêu cầu và tuyến tác vụ trong bảng khác nhau. Bảng yêu cầu có thể biến mất khi phản hồi xong. Tuyến tác vụ phải tồn tại đến trạng thái kết thúc và hết hạn giữ lại. [Bài 29: Độ tin cậy, Hủy và Kiểm soát luồng MCP](../../29-mcp-reliability-cancellation-and-flow-control/docs/en.md) xây quy tắc tranh chấp, hết thời gian, tính lũy đẳng, backpressure và thử lại cho cả hai nhánh.

## Optional Notifications

Thăm dò là nền tảng. Client muốn cập nhật đẩy gửi `subscriptions/listen` với id tác vụ. Với Streamable HTTP, đây là POST có phản hồi là luồng SSE phạm vi yêu cầu. Không có luồng sự kiện GET độc lập và không phiên giao thức để giữ sống.

Máy chủ xác nhận id chấp nhận bằng `notifications/subscriptions/acknowledged` rồi có thể gửi ảnh chụp đầy đủ qua `notifications/tasks`. Xác nhận và mọi thông báo tác vụ mang `io.modelcontextprotocol/subscriptionId` trong `_meta`, bằng id yêu cầu `subscriptions/listen`. Mỗi thông báo tác vụ ngoài ra tương đương thứ `tasks/get` trả vào lúc đó.

Client vẫn phải khai báo phần mở rộng Tasks. Nên kết nối lại và tiếp tục từ id tác vụ bền vững thay vì phụ thuộc phát lại sự kiện hoặc `Last-Event-ID`.

## Failure Semantics

Dùng đúng hai tầng lỗi.

### Protocol error

Tham số phương thức không hợp lệ hoặc id tác vụ không biết trả lỗi JSON-RPC, thường `-32602`. Thiếu hỗ trợ phần mở rộng trả `-32021` với đối tượng khả năng bắt buộc.

### Task execution outcome

- Kết quả công cụ thường với `isError: true` vẫn là tác vụ `completed` vì lời gọi công cụ đã tạo kết quả định nghĩa của nó.
- Lỗi JSON-RPC trong thực thi trì hoãn làm tác vụ `failed` và lưu lỗi JSON-RPC đó dưới `error`.
- Người dùng từ chối có thể tạo `cancelled`, kết quả từ chối đã hoàn tất hoặc kết quả an toàn khác riêng miền. Ghi lại lựa chọn.

## Durability, Expiry, and Ownership

Lưu bền vững ít nhất id tác vụ, trạng thái, dấu thời gian, ttl, khoảng thăm dò, sở hữu thao tác gốc, kết quả hoặc lỗi, yêu cầu đầu vào chờ và mọi khóa đầu vào đã cấp.

Khóa lưu trữ phải gồm hoặc phân giải tenant và chủ thể có thẩm quyền. Biết id tác vụ không được cấp quyền truy cập. Kiểm tra sở hữu trên mọi `tasks/get`, `tasks/update`, `tasks/cancel` và đăng ký.

`ttlMs` đo từ lúc tạo và có thể đổi. Client có thể coi là chốt dự phòng khi tác vụ ngừng tạo cập nhật quan sát được. Máy chủ có thể làm thất bại rồi xóa tác vụ hết hạn. Không mô tả như lời hứa giữ kết quả hoàn tất trong từng ấy mili giây sau hoàn tất.

Dùng ghi nguyên tử hoặc giao dịch. Bài học ghi file tạm rồi đổi tên nguyên tử. Dịch vụ nhiều bản sao nên dùng kho bền vững dùng chung và lease worker hoặc kiểm soát đồng thời tương đương.

```figure
tp-task-lifecycle
```

## Build It

`code/main.py` triển khai dịch vụ tác vụ tất định:

- `server/discover` trả `supportedVersions`, gợi ý bộ đệm và phần mở rộng Tasks.
- `tools/list` trả bộ mô tả `generate_report` tất định, có thể lưu đệm với lược đồ đầu vào hợp lệ.
- `tools/call` tạo và lưu bền vững tác vụ trước trả `resultType: "task"`.
- Thực thể dịch vụ mới tải lại cùng tác vụ, minh họa phục hồi khởi động lại.
- `tasks/get` trả ảnh chụp tác vụ đầy đủ.
- Worker chuyển từ `working` sang `input_required`.
- `tasks/update` nhận phản hồi biểu mẫu và trả xác nhận đầy đủ rỗng.
- Worker lưu `CallToolResult` lồng với `resultType` và danh tính máy chủ riêng, rồi chuyển sang `completed`.
- `tasks/cancel` lũy đẳng trong triển khai này.
- Bộ xây HTTP đặt `Mcp-Name` thành `params.taskId` cho `tasks/get`, `tasks/update` và `tasks/cancel`.
- Hàm hỗ trợ thông báo dùng `notifications/subscriptions/acknowledged` và `notifications/tasks`, đều gắn id yêu cầu listen.
- Thông báo không id không tạo phản hồi JSON-RPC.

Worker tiến tường minh thay vì ngủ trong luồng nền. Điều đó làm mọi chuyển trạng thái tất định và giữ ví dụ giao thức riêng cơ chế hàng đợi.

## Use It

Từ thư mục gốc repo:

```bash
cd phases/13-tools-and-protocols/13-mcp-async-tasks/code
python3 main.py
python3 -m unittest discover tests -v
```

Chuỗi kết quả kỳ vọng:

```text
id=0 resultType=complete status=ack
id=1 resultType=task status=working
id=2 resultType=complete status=working
id=3 resultType=complete status=input_required
id=4 resultType=complete status=ack
id=5 resultType=complete status=completed
```

Cũng xác minh `tasks/status`, `tasks/result` và `tasks/list` trả không tìm thấy phương thức trong dịch vụ hiện đại.
Xác minh `tools/list` tất định và mọi phương thức tác vụ HTTP hiện tại phản chiếu id tác vụ qua `Mcp-Name`.

## Ship It

`outputs/skill-task-store-designer.md` giờ tạo thiết kế nhận biết phần mở rộng: thương lượng khả năng, tạo bền vững trước trả, phương thức hiện tại, luồng cập nhật đầu vào, sở hữu, hết hạn, hủy, đăng ký và chuyển từ phương thức thử nghiệm đã bỏ.

## Exercises

1. Thêm khóa đầu vào chờ thứ hai. Gửi `tasks/update` từng phần và chứng minh tác vụ vẫn `input_required` đến khi cả hai khóa được trả lời.
2. Thêm sở hữu tenant vào kho và từ chối id tác vụ hợp lệ do sai chủ thể đã xác thực đưa ra.
3. Thêm lease worker có hết hạn. Minh họa hai thực thể dịch vụ không thể hoàn tất cùng tác vụ đồng thời.
4. Triển khai adapter SSE phản hồi POST cho `subscriptions/listen`. Không thêm GET, `Last-Event-ID` hoặc header phiên.
5. Thêm dọn hết hạn. Phân biệt tác vụ hết hạn với id tác vụ sai dạng không làm rò tồn tại chéo tenant.

## Key Terms

| Thuật ngữ | Ý nghĩa trong phần mở rộng hiện tại |
|------|----------------------------------|
| Tasks extension (Phần mở rộng Tasks) | Khả năng `io.modelcontextprotocol/tasks` tùy chọn cho công việc bất đồng bộ bền vững |
| `CreateTaskResult` | Phản hồi `resultType: "task"` do máy chủ quyết định cho yêu cầu đủ điều kiện |
| `tasks/get` | Thăm dò ảnh chụp tác vụ hiện tại đầy đủ, gồm kết quả kết thúc hoặc đầu vào chờ |
| `tasks/update` | Gửi phản hồi cho `inputRequests` đang chờ của tác vụ |
| `tasks/cancel` | Xác nhận ý định hủy hợp tác |
| `input_required` | Trạng thái tác vụ chỉ đầu vào client đang chờ |
| `pollIntervalMs` | Độ trễ tối thiểu máy chủ gợi ý trước lần thăm dò khác |
| `ttlMs` | Thời gian hết hạn đo từ lúc tạo tác vụ |
| Durable-before-return (Bền vững trước trả) | Quy tắc id tác vụ phải phân giải được trước khi handle được gửi |
| `notifications/tasks` | Ảnh chụp tác vụ đầy đủ tùy chọn phân phối trên phản hồi SSE đã đăng ký |

## Legacy Compatibility

Bề mặt thử nghiệm 2025-11-25 dùng tăng cường tác vụ do client yêu cầu, `tasks/status`, `tasks/result` và `tasks/list` tùy chọn. Chỉ giữ tên đó trong adapter cũ ghim. Client hiện tại dùng khả năng phần mở rộng, nhận handle do máy chủ quyết định, thăm dò `tasks/get`, cung cấp đầu vào bằng `tasks/update` và đọc kết quả cuối từ ảnh chụp tác vụ.

## Further Reading

- [Official MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
- [MCP 2026-07-28 Multi Round-Trip Requests](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr)
- [MCP 2026-07-28 Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
