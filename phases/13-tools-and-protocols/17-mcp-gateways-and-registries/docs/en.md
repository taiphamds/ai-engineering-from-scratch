# Stateless MCP Gateways and Registry Admission

> Gateway nên làm mọi tuyến tường minh. Giao thức 2026-07-28 cho nó ranh giới phương thức, tên, phiên bản, khả năng, danh tính, bộ đệm và trace không có phiên vận chuyển.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 13 · 15 (security), Phase 13 · 16 (authorization)
**Time:** ~75 minutes

## Learning Objectives

- Tập hợp nhiều máy chủ MCP sau một endpoint 2026-07-28 không có tính gắn kết phiên.
- Xác thực siêu dữ liệu mỗi yêu cầu và header định tuyến trước chính sách hoặc chuyển tiếp.
- Gộp công cụ với không gian tên ổn định, thứ tự tất định, ghim bộ mô tả, RBAC và lưu đệm riêng.
- Coi bản ghi registry là bằng chứng khám phá vẫn cần chính sách tiếp nhận.
- Định tuyến đúng SSE phạm vi yêu cầu, `subscriptions/listen`, thử lại MRTR và lời gọi phần mở rộng Tasks.
- Cô lập hỗ trợ bắt tay và phiên cũ khỏi nhánh hiện đại.

## The Problem

Kết nối một client thẳng đến một máy chủ đơn giản. Triển khai lớn hơn cần câu trả lời nhất quán cho câu hỏi khó hơn:

- Máy chủ nào được phép?
- Chủ thể nào có thể thấy và gọi mỗi công cụ?
- Điều gì xảy ra khi hai backend cung cấp cùng tên?
- Thay đổi bộ mô tả được xem xét thế nào?
- Giới hạn tốc độ và sự kiện kiểm toán áp ở đâu?
- Mọi thực thể có thể xử lý yêu cầu tiếp không?

Gateway nằm giữa client và máy chủ MCP backend. Nó trình bày một endpoint MCP, áp chính sách xuyên suốt và chuyển tiếp yêu cầu đã phê duyệt.

Thiết kế gateway cũ thường ghép một phiên client thành nhiều phiên backend và viết lại `Mcp-Session-Id`. Đó là thiết kế tương thích cũ. Lõi 2026-07-28 không có phiên giao thức.

## The Concept

### The modern gateway path

Với mỗi yêu cầu:

1. Xác thực chủ thể từ cấp quyền vận chuyển.
2. Xác thực `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name` và `params._meta`.
3. Cấp quyền chủ thể, tài nguyên, phương thức, công cụ và đối số.
4. Áp chính sách bộ mô tả, registry, tốc độ và dữ liệu.
5. Tạo yêu cầu tự đầy đủ mới cho backend đã chọn.
6. Xác thực kết quả backend và trả kết quả gateway.
7. Ghi sự kiện kiểm toán không ghi bí mật.

Không bước nào cần phiên giao thức ẩn. Trạng thái ứng dụng vẫn có thể tồn tại trong cơ sở dữ liệu, handle tường minh, Tasks hoặc trạng thái MRTR được bảo vệ toàn vẹn.

### Runtime policy is the primary gateway decision

Tiếp nhận quyết định phiên bản backend nào được vào gateway. Không cấp quyền lời gọi trực tiếp. Với mọi yêu cầu, gateway tính lại chính sách từ chủ thể đã xác thực, bên phát hành và tài nguyên, tenant, phương thức và tên đã khớp, đối số chuẩn hóa, ghim bộ mô tả được tiếp nhận, tình trạng backend hiện tại, giao khả năng, phân loại dữ liệu, trạng thái tốc độ và mọi phê duyệt gắn hành động.

Thứ tự này quan trọng. Bản ghi Registry có thể còn hoạt động khi vai trò người dùng bị thu hồi. Bộ mô tả có thể còn ghim khi đối số đích vượt ranh giới tenant. Backend có thể còn được phê duyệt khi chính sách sự cố cách ly lời gọi đổi trạng thái. Vì vậy chính sách runtime là quyết định cho phép hoặc từ chối chính, với bằng chứng Registry và bộ mô tả làm đầu vào.

Không lưu đệm quyết định cho phép dưới kết nối hoặc định danh phiên đã bỏ. Nếu chính sách không sẵn, theo chính sách thất bại khai báo theo lớp thao tác. Mặc định an toàn là thất bại theo hướng đóng cho đổi trạng thái và đọc nhạy cảm, trong khi nhánh đọc công khai được phê duyệt rõ có thể dùng chính sách biết gần nhất ngắn hạn chỉ khi mô hình rủi ro cho phép. Ghi phiên bản chính sách và nhánh thất bại nào tạo quyết định, rồi xác thực kết quả backend trước trả.

### One POST endpoint

Streamable HTTP hiện đại gửi mỗi thông điệp JSON-RPC qua POST:

```text
POST /mcp
Authorization: Bearer <gateway-token>
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: notes.search
Accept: application/json, text/event-stream
```

Gateway có thể trả JSON hoặc SSE phạm vi yêu cầu cho POST đó. GET và DELETE trả 405 cho yêu cầu hiện đại. `Mcp-Session-Id` và `Last-Event-ID` không tạo thẩm quyền, tính gắn kết hoặc hành vi phát lại.

Giá trị header và phần thân phải đồng ý. Từ chối không khớp bằng `-32020` trước tra backend. Điều này cho bộ cân bằng tải, gateway và bộ giới hạn tốc độ định tuyến không phân tích toàn phần thân trong khi giữ toàn vẹn đầu cuối.

Xác thực theo một thứ tự chính xác: JSON-RPC và kiểu siêu dữ liệu, header và phần thân bằng nhau, rồi hỗ trợ phiên bản khớp. Không khớp trả HTTP 400 với `-32020`. Nếu header và phần thân đồng ý phiên bản không hỗ trợ, trả HTTP 400 với `-32022` và `data` chính xác `{"supported":["2026-07-28"],"requested":"<actual>"}`. Phương thức không biết trả HTTP 404 với `-32601`.

`ProtocolError` mang `data` tùy chọn và gateway tuần tự hóa vào đối tượng lỗi JSON-RPC. Thông báo không có `id`, nên không bao giờ nhận thành công hoặc lỗi JSON-RPC. Thông báo HTTP được chấp nhận trả 202 với phần thân rỗng.

### Implement discovery at every layer

Gateway triển khai `server/discover` cho client. Nó cũng khám phá mỗi backend để biết phiên bản giao thức, khả năng và phần mở rộng.

Ví dụ kết quả gateway:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {"listChanged": true}
  },
  "ttlMs": 30000,
  "cacheScope": "private",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "enterprise-gateway",
      "version": "2.0.0"
    }
  }
}
```

Chỉ công bố giao khả năng gateway tôn trọng được đầu cuối. Tính năng backend không tự động an toàn để đưa ra. Tính năng gateway không có nhánh backend không hữu ích để công bố.

`serverInfo` là dữ liệu hiển thị và chẩn đoán tự khai. Không dùng làm bằng chứng registry hoặc nhà phát hành.

### Per-request client capabilities

Mọi yêu cầu chuyển tiếp cần vỏ `_meta` hiện tại:

```json
{
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": {
    "name": "enterprise-gateway",
    "version": "1.0.0"
  }
}
```

Không sao chép mù quáng khả năng client ngoài vào backend. Gateway là client của backend. Chỉ công bố tính năng gateway làm trung gian đúng.

### Deterministic namespacing

Gộp công cụ backend dưới tên công khai ổn định:

```text
notes.search
notes.create
issues.list
issues.open
```

Giữ ánh xạ từ tên công khai đến backend và tên công cụ gốc. Không bao giờ chọn xung đột đầu hoặc cuối. Tên công khai là phần hợp đồng phê duyệt và kiểm toán, nên đổi tên là chuyển đổi.

`tools/list` phải tất định. Khi hiển thị khác theo chủ thể, trả `cacheScope: private`. `ttlMs` có giới hạn giảm tải khám phá backend không cho danh sách riêng người dùng rò qua ngữ cảnh cấp quyền.

Mọi bộ mô tả công cụ đưa ra gồm tên ổn định, mô tả và `inputSchema` gốc đối tượng. Không gian tên không thể bỏ trường bộ mô tả bắt buộc. Kết quả danh sách đầy đủ cũng gồm `resultType`, siêu dữ liệu danh tính máy chủ và gợi ý bộ đệm.

### Pin approved descriptors

Lúc tiếp nhận, chuẩn hóa toàn bộ bộ mô tả và lưu bản băm dưới tên công khai định danh đầy đủ. Lúc liệt kê và gọi, so bộ mô tả trực tiếp với bản băm phê duyệt.

Nếu đổi:

- Bỏ khỏi `tools/list`.
- Từ chối lời gọi trực tiếp.
- Phát sự kiện kiểm toán.
- Yêu cầu chính sách hoặc con người phê duyệt lại trước cập nhật ghim.

Gateway là điểm cưỡng chế trung tâm hữu ích, nhưng không biến bộ mô tả thấy lần đầu thành an toàn. Đánh giá ban đầu vẫn cần.

### Registries help discover, not decide

`server.json` Registry cung cấp siêu dữ liệu công bố. Bản ghi dựa trên gói có thể như sau:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json",
  "name": "com.example/notes",
  "description": "Example notes MCP server.",
  "version": "1.0.0",
  "packages": [
    {
      "registryType": "npm",
      "identifier": "@example/notes-mcp",
      "version": "1.0.0",
      "transport": {"type": "stdio"}
    }
  ]
}
```

Siêu dữ liệu công bố không mang quyết định bảo mật gateway. Giữ bằng chứng nhà phát hành đã xác minh và xuất xứ trong trạng thái tiếp nhận riêng:

```json
{
  "registryName": "com.example/notes",
  "registryVersion": "1.0.0",
  "publisher": {"namespace": "com.example", "status": "verified"},
  "provenance": {
    "source": "registry.modelcontextprotocol.io",
    "recordId": "com.example/notes@1.0.0"
  },
  "admission": {"status": "approved", "reviewedBy": "gateway-policy"}
}
```

Gateway kiểm tra hình dạng `server.json` và nối với trạng thái ngoài đó. Gateway vẫn cần chính sách tiếp nhận.

Với mỗi backend tiếp nhận, ghi:

- Registry và định danh bản ghi chính xác.
- Bằng chứng không gian tên hoặc miền nhà phát hành đã xác minh.
- Vận chuyển và endpoint được phép.
- Phiên bản ghim hoặc chính sách nâng cấp phê duyệt.
- Bản băm sản phẩm hoặc bộ mô tả.
- Bên phát hành cấp quyền và tài nguyên.
- Người xem xét, thời điểm phê duyệt và hết hạn.

Không nhận máy chủ vì tên hiển thị giống sản phẩm quen. Không coi hiện diện registry là đánh giá bảo mật vận hành. Máy chủ riêng có thể tiếp nhận qua cùng lược đồ bằng chứng dù không bao giờ xuất hiện trong registry công khai.

Bài này triển khai mối nối gateway: nối bằng chứng công bố với tiếp nhận cục bộ trước backend định tuyến được. [Bài 30: Chuỗi cung ứng, Tiếp nhận, Sai lệch và Hoàn tác MCP Registry](../../30-mcp-registry-supply-chain-and-drift/docs/en.md) xây mặt phẳng điều khiển đầy đủ cho bằng chứng không gian tên chính xác, xuất xứ sản phẩm, ghim bất biến, sai lệch bộ mô tả trực tiếp, đối soát trạng thái Registry, sổ tiếp nhận phát hiện sửa đổi và hoàn tác có bằng chứng. Giữ trạng thái chuỗi cung ứng đó riêng quyết định runtime mỗi yêu cầu bên trên.

### Credential mediation

Gateway xác thực bên gọi và xác thực riêng với backend. Thông tin xác thực backend không bao giờ đến client.

Giữ các liên kết này tường minh:

```text
outer principal -> gateway role and policy
backend issuer + resource -> backend registration and token
```

Không bao giờ truyền token gateway ngoài đến backend. Không bao giờ dùng lại token backend tại bên phát hành hoặc tài nguyên khác. Nếu công cụ hành động thay người dùng cuối, giữ ủy nhiệm bằng mô hình trao đổi hoặc claims được thiết kế thay vì mạo danh người dùng bằng thông tin xác thực dịch vụ dùng chung.

### Rate limits without sessions

Đặt khóa giới hạn theo chủ thể đã xác thực, bên phát hành, tài nguyên, công cụ công khai, lớp chi phí và cửa sổ thời gian. Id phiên vắng mặt và dù tồn tại cũng dễ xoay.

Áp xác thực rẻ trước tiêu thụ công việc đắt. Quyết định lời gọi từ chối có tính vào giới hạn lạm dụng, hạn ngạch nghiệp vụ hay cả hai.

### Audit the decision chain

Ghi đủ để dựng lại lời gọi:

- Định danh yêu cầu và trace.
- Chủ thể đã xác thực và bên phát hành.
- Công cụ công khai và tuyến backend.
- Phiên bản ghim bộ mô tả.
- Quyết định chính sách và lý do.
- Độ trễ và lớp kết quả.
- Vòng MRTR hoặc định danh tác vụ khi áp dụng.

Che bearer token, mã cấp quyền, refresh token, bí mật thô và đối số nhạy cảm không cần thiết.

### Request-scoped SSE

POST thường có thể trả SSE phạm vi yêu cầu khi công việc truyền luồng trong một yêu cầu đó. Đóng luồng phản hồi hủy yêu cầu HTTP hiện đại đang xử lý.

Không tạo luồng GET riêng và không hứa phát lại Last-Event-ID. Đó là giả định vận chuyển cũ.

### Long-lived change notifications

Với thông báo thay đổi danh sách và tài nguyên, client hiện tại gửi `subscriptions/listen` qua POST và nhận phản hồi SSE. Bộ lọc thông báo dùng đúng trường phẳng `toolsListChanged`, `promptsListChanged`, `resourcesListChanged` và `resourceSubscriptions`:

```json
{
  "jsonrpc": "2.0",
  "id": "listen-tools",
  "method": "subscriptions/listen",
  "params": {
    "notifications": {
      "toolsListChanged": true
    },
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

Sự kiện đầu xác nhận tập con hỗ trợ. Định danh đăng ký là id JSON-RPC của yêu cầu mở luồng:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": "listen-tools"
    },
    "notifications": {
      "toolsListChanged": true
    }
  }
}
```

Gateway rồi chỉ chuyển tiếp kiểu thay đổi đã xác nhận. Mọi thông báo trên luồng mang cùng `io.modelcontextprotocol/subscriptionId` trong `params._meta`. Không có tự động phát lại hoặc tự động listen lại. Khi kết nối lại, client mở lại đăng ký và làm mới danh sách dựa vào. Đóng có trật tự do máy chủ khởi tạo trả kết quả đầy đủ cuối gắn cùng id đăng ký.

Nhánh hiện đại thay `resources/subscribe`, `resources/unsubscribe` và truyền luồng GET độc lập không yêu cầu. Chỉ giữ trong nhánh cũ chặn theo phiên bản.

### MRTR through a gateway

Khi backend trả `resultType: input_required`, gateway chỉ có thể chuyển tiếp nếu client ngoài hỗ trợ yêu cầu đầu vào cần. Giữ `requestState` từng byte giống hệt trừ khi gateway chủ ý kết thúc và phát lại tương tác.

Client thử lại công cụ công khai gốc với id JSON-RPC mới và `inputResponses`. Gateway cấp quyền lại lần thử, kiểm tra cùng tuyến công khai rồi chuyển tiếp yêu cầu backend mới. Không được giả định vòng trước cấp phê duyệt vô hạn.

### Tasks extension routing

Tasks là phần mở rộng chính thức định danh bằng `io.modelcontextprotocol/tasks`. Không phải thay phiên lõi.

Client khai báo phần mở rộng trong khả năng client mỗi yêu cầu và gateway chỉ công bố trong khám phá khi giữ được vòng đời đầu cuối. Với `tools/call` hỗ trợ, chỉ backend quyết định trả kết quả thường hay `resultType: task`. Kết quả tác vụ mang `taskId`, `status`, dấu thời gian, `ttlMs` và `pollIntervalMs` tùy chọn trực tiếp trong kết quả. Tác vụ phải đã đọc được bền vững trước gửi kết quả.

Gateway ghi chủ thể đã xác thực và tuyến backend cho định danh tác vụ mờ. Lời gọi `tasks/get`, `tasks/update` và `tasks/cancel` sau dùng `params.taskId` làm `Mcp-Name`, cho trung gian khóa định tuyến. `tasks/get` trả `resultType: complete` với trạng thái tác vụ hiện tại và nhúng kết quả cuối hoặc lỗi giao thức ở trạng thái kết thúc. `tasks/update` gửi `inputResponses` theo khóa cho đầu vào tác vụ chờ và trả xác nhận đầy đủ rỗng. `tasks/cancel` là ý định hợp tác với xác nhận đầy đủ rỗng, không bảo đảm công việc dừng.

Không triển khai phương thức `tasks/list` hoặc `tasks/result` mới. Chúng thuộc mô hình thử nghiệm cũ. Tác vụ cần đầu vào đưa yêu cầu nhúng đầy đủ qua `tasks/get`; client trả lời qua `tasks/update`, không bằng thử lại lời gọi công cụ gốc. Client vẫn thăm dò ở khoảng gợi ý; tạo tác vụ vẫn do máy chủ quyết định.

Trạng thái tuyến tác vụ bền vững là dữ liệu ứng dụng khóa theo handle tác vụ, không phải phiên giao thức.

### Compatibility boundary

Nếu gateway phải phục vụ client hoặc backend cũ:

- Phát hiện thời kỳ tường minh.
- Giữ khởi tạo, phiên vận chuyển, luồng GET, đăng ký tài nguyên và từ vựng tác vụ cũ trong adapter cũ.
- Không bao giờ để id phiên cũ rò vào định tuyến hoặc cấp quyền hiện đại.
- Ưu tiên thăm dò khám phá có giới hạn và chính sách dự phòng tường minh thay hạ cấp âm thầm.

```figure
t3-gateway-funnel
```

## Build It

`code/main.py` triển khai gateway giao thức trong tiến trình và hai máy chủ backend. Mỗi backend nhận yêu cầu giao thức hiện tại mới. Gateway cung cấp khám phá, `tools/list` tất định lọc người dùng, định tuyến có không gian tên, `server.json` Registry cộng trạng thái tiếp nhận ngoài, ghim bộ mô tả, RBAC, giới hạn tốc độ khóa theo chủ thể, quyết định kiểm toán và xác nhận SSE `subscriptions/listen` mô hình hóa.

Mô hình nhận phần thân yêu cầu, header định tuyến đã phân tích và danh tính bearer đã xác thực. Không phải adapter HTTP đầy đủ và không phân tích `Content-Type` hoặc toàn hợp đồng `Accept`. Nối với adapter Streamable HTTP Bài 09 yêu cầu `Content-Type: application/json` và giá trị `Accept` chứa cả `application/json` và `text/event-stream`.

Chạy:

```bash
cd phases/13-tools-and-protocols/17-mcp-gateways-and-registries
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Demo in id yêu cầu ngoài và id yêu cầu backend mới để bước chuyển không trạng thái rõ.

## Use It

Thay đối tượng backend trong tiến trình bằng client giao thức hiện tại thật. Giữ cùng mối nối:

- Bản ghi tiếp nhận trước kết nối.
- Khám phá backend trước đưa khả năng ra.
- Tên công khai định danh đầy đủ trước cấp quyền.
- Ghim bộ mô tả trước liệt kê hoặc gọi.
- Siêu dữ liệu mỗi yêu cầu mới trước chuyển tiếp.
- Xác thực kết quả trước trả.

## Ship It

Bài học này cung cấp `outputs/skill-gateway-bootstrap.md`. Nó tạo thiết kế gateway hiện đại bao phủ đầu vào, khám phá, tiếp nhận, không gian tên, cấp quyền, lưu đệm, truyền luồng, đăng ký, MRTR, Tasks, quan sát và cô lập cũ.

## Exercises

1. Thêm ngữ cảnh trace vào siêu dữ liệu yêu cầu ngoài và chuyển tiếp, ghi liên hệ trong sự kiện kiểm toán.
2. Thêm backend có khả năng Tasks và định tuyến `tasks/get` theo id tác vụ trong `Mcp-Name`.
3. Đổi một bộ mô tả backend và chứng minh cả khám phá lẫn gọi trực tiếp bị chặn.
4. Thêm khả năng máy chủ riêng chủ thể và giải thích tại sao khám phá phải giữ lưu đệm riêng.
5. Viết giao diện adapter cũ không thêm trạng thái cũ vào lớp `Gateway` hiện đại.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| MCP gateway (Gateway MCP) | Máy chủ chính sách và định tuyến giữa client và máy chủ MCP backend |
| Admission record (Bản ghi tiếp nhận) | Bằng chứng và quyết định chính sách cho một backend vào gateway |
| Qualified tool name (Tên công cụ định danh đầy đủ) | Tuyến công khai ổn định như `notes.search` |
| Descriptor pin (Ghim bộ mô tả) | Bản băm phê duyệt kiểm tra trong khám phá và phân phối |
| Private cache scope (Phạm vi bộ đệm riêng) | Kết quả lưu đệm hạn chế ở một ngữ cảnh cấp quyền |
| Request-scoped SSE (SSE phạm vi yêu cầu) | Phản hồi truyền luồng gắn một yêu cầu POST |
| `subscriptions/listen` | Luồng SSE do client mở cho thông báo thay đổi sống lâu đã chọn |
| Task route (Tuyến tác vụ) | Ánh xạ ứng dụng từ id tác vụ mờ đến backend |
| Legacy adapter (Adapter cũ) | Ranh giới chặn phiên bản tường minh cho hành vi bắt tay và phiên cũ |

## Further Reading

- [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [Server discovery](https://modelcontextprotocol.io/specification/2026-07-28/server/discover)
- [Official Registry server.json requirements](https://github.com/modelcontextprotocol/registry/blob/main/docs/reference/server-json/official-registry-requirements.md)
- [MCP Tasks extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
