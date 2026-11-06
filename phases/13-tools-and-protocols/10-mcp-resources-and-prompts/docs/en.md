# MCP Resources and Prompts: Addressable Context for Stateless Servers

> Công cụ thực hiện thao tác. Tài nguyên cung cấp nội dung định địa chỉ được. Prompt đóng gói mẫu thông điệp do người dùng chọn. Máy chủ MCP tốt giữ các hợp đồng đó riêng và đoán trước được.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lesson 07 (Building an MCP Server), Phase 13, Lesson 09 (MCP Transports)
**Time:** ~60 minutes

## Learning Objectives

- Chọn giữa công cụ, tài nguyên và prompt từ ý định bên sử dụng.
- Công bố bề mặt tài nguyên và prompt qua `server/discover` bắt buộc.
- Xây kết quả `resources/list` và `prompts/list` tất định.
- Áp dụng `ttlMs` và `cacheScope` không rò dữ liệu riêng người dùng.
- Trả lỗi JSON-RPC `-32602` cho URI tài nguyên không hợp lệ hoặc không biết.
- Mở luồng phản hồi POST `subscriptions/listen` và liên hệ mọi sự kiện bằng ID đăng ký.
- Coi nội dung tài nguyên và mẫu prompt là đầu ra máy chủ không đáng tin cậy.

## Start With the Consumer

Cách dễ nhất dùng sai MCP là bắt đầu bằng mã triển khai. Truy vấn cơ sở dữ liệu thành công cụ vì hàm quen thuộc. Quy trình tái sử dụng thành tài nguyên vì được lưu trong file. Prompt thành chính sách ẩn vì host có thể chèn nó.

Bắt đầu bằng ai chọn và họ kỳ vọng gì.

| Thành phần cơ bản | Ý định chính | Bên sở hữu lựa chọn | Kết quả điển hình |
|---|---|---|---|
| Công cụ | Thực hiện thao tác | Mô hình hoặc ứng dụng | Kết quả hành động có cấu trúc |
| Tài nguyên | Đọc nội dung ở URI | Host, ứng dụng hoặc người dùng | Nội dung văn bản hoặc nhị phân |
| Prompt | Bắt đầu quy trình thông điệp tái sử dụng | Người dùng qua UI host | Một hoặc nhiều thông điệp prompt |

Ghi chú tại `notes://note-1` là tài nguyên vì là nội dung định địa chỉ được. `delete_note` là công cụ vì thay đổi trạng thái. `review_note` là prompt vì người dùng chọn quy trình đánh giá chuẩn bị sẵn.

Không đưa một thao tác ra dưới cả ba chỉ để có vẻ đầy đủ. Mỗi bề mặt thêm cần khám phá, cấp quyền, lưu đệm, xử lý lỗi, kiểm thử và tài liệu.

## The 2026-07-28 Stateless Envelope

Bài này nhắm bản sửa đổi giao thức MCP `2026-07-28`. Không có bắt tay khởi tạo hoặc phiên giao thức trong hồ sơ này. Mọi yêu cầu mang phiên bản giao thức và khả năng client trong khóa `_meta` dành riêng.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/list",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      },
      "io.modelcontextprotocol/clientCapabilities": {}
    }
  }
}
```

Máy chủ phải triển khai `server/discover`. Kết quả công bố các phiên bản
hỗ trợ, khả năng tài nguyên và prompt, danh tính triển khai và
gợi ý bộ đệm. Client có thể gọi trực tiếp phương thức khác, nhưng khám phá cho nó
một ảnh chụp ổn định trước khi xây UI.

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "resources": {"listChanged": true, "subscribe": true},
    "prompts": {"listChanged": true}
  },
  "ttlMs": 3600000,
  "cacheScope": "public"
}
```

Kết quả thường khai báo `"resultType": "complete"`. `_meta` phản hồi định danh triển khai phục vụ bằng `io.modelcontextprotocol/serverInfo`. Thông tin này hữu ích cho chẩn đoán. Không phải danh tính xác thực. Yêu cầu mang bản sửa đổi không hỗ trợ trả `-32022` với cả bản sửa đổi yêu cầu lẫn các bản sửa đổi máy chủ hỗ trợ.

Hợp đồng không trạng thái thay đổi trực giác thiết kế. Danh sách không thể phụ thuộc lời gọi trước trên một kết nối. Cấp quyền có thể đổi tập hiển thị vì thông tin xác thực là đầu vào yêu cầu, nhưng lịch sử kết nối thì không được.

## Resources Are Stable URI Contracts

Tài nguyên là nội dung nhận diện bằng URI. Thiết kế URI trước trình xử lý.

Thuộc tính URI tốt:

- Đủ ổn định để đánh dấu hoặc truyền giữa yêu cầu.
- Có không gian tên theo miền máy chủ.
- Độc lập với ID tiến trình hoặc kết nối.
- Được xác thực trước truy cập lưu trữ.
- Được cấp quyền trên mọi lần đọc.

`notes://note-1` tốt hơn `note-1` vì không gian tên tường minh. Máy chủ file có thể dùng URI `file://`, nhưng vẫn phải kiểm tra ranh giới thư mục cấu hình sau phân giải liên kết tượng trưng và đoạn tương đối.

`resources/list` trả tài nguyên hiện hiển thị với bên gọi. Sắp xếp theo khóa ổn định như URI. Thứ tự tất định ngăn trượt bộ đệm nhiễu, ảnh chụp thay đổi và UI host nhảy giữa lần làm mới.

```json
{
  "resultType": "complete",
  "resources": [
    {
      "uri": "notes://note-1",
      "name": "Architecture decision",
      "description": "Why the service uses a stateless boundary",
      "mimeType": "text/markdown"
    }
  ],
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "notes-server",
      "version": "2.0.0"
    }
  }
}
```

`resources/read` trả một hoặc nhiều mục nội dung. URI không biết không phải lần đọc rỗng thành công. Đặc tả Resources hiện tại gán URI tài nguyên không hợp lệ hoặc không biết vào tham số JSON-RPC không hợp lệ, mã `-32602`.

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "error": {
    "code": -32602,
    "message": "Unknown or invalid resource URI",
    "data": {
      "uri": "notes://missing"
    }
  }
}
```

Phân biệt đó cho client tách vắng mặt khỏi tài liệu rỗng hợp lệ. Nó cũng ngăn vô tình dự phòng sang tra cứu rộng hơn.

### Resource templates

Mẫu tài nguyên mô tả họ URI có tham số. Dùng khi liệt kê mọi mục cụ thể tốn kém hoặc không giới hạn. Ví dụ, `notes://projects/{project}/decisions/{decision}` cho client biết cách tạo địa chỉ hợp lệ không trả mọi quyết định.

Mẫu không làm yếu xác thực. Phân tích biến, áp dụng cấp quyền, thực thi giới hạn độ dài và ký tự, xây truy vấn lưu trữ bằng tham số có kiểu. Không bao giờ nối đuôi URI tùy ý vào đường dẫn hệ thống file hoặc câu lệnh cơ sở dữ liệu.

### Content is not trusted instruction

Văn bản tài nguyên có thể chứa prompt injection, bí mật, lệnh gây hiểu lầm hoặc mã đánh dấu sai dạng. Host nên giữ xuất xứ và coi nội dung tài nguyên là dữ liệu. Máy chủ nên giới hạn kích thước nội dung, trả MIME type chính xác, che trường bên gọi không được truy cập và tránh trả bản ghi không liên quan.

## Prompts Are User-Controlled Templates

Prompt MCP được thiết kế cho người dùng chọn tường minh. Host có thể kết xuất thành slash command, mục menu hoặc nút quy trình. Giao thức không yêu cầu một UI.

`prompts/list` nên tất định cho cùng cấp quyền yêu cầu. Mỗi prompt cần tên ổn định, mô tả hữu ích và khai báo đối số cho host thu thập đầu vào trước `prompts/get`.

```json
{
  "resultType": "complete",
  "prompts": [
    {
      "name": "review_note",
      "title": "Review a note",
      "description": "Review one note for a named concern",
      "arguments": [
        {
          "name": "uri",
          "description": "The note resource URI",
          "required": true
        }
      ]
    }
  ],
  "ttlMs": 600000,
  "cacheScope": "public"
}
```

`prompts/get` phân giải đối số thành thông điệp. Nó không thay chỉ dẫn hệ thống của host. Host quyết định thông điệp trả về vào ngữ cảnh mô hình thế nào và giữ chính sách đáng tin cậy riêng ở ưu tiên cao hơn.

Xác thực đối số prompt tại ranh giới máy chủ. URI prompt nên qua cùng kiểm tra cấp quyền như đọc tài nguyên trực tiếp. Không biến prompt thành kênh phụ vòng qua truy cập tài nguyên.

## Cache Hints Are Part of Correctness

`ttlMs` cho client biết kết quả có thể dùng lại bao lâu. `cacheScope` mô tả ai có thể chia sẻ giá trị lưu đệm đó.

| Phạm vi | Ý nghĩa | Sử dụng điển hình |
|---|---|---|
| `public` | Có thể dùng lại giữa người dùng khi cấp quyền cho phép | Danh mục prompt công khai |
| `private` | Gắn với người dùng yêu cầu hoặc ngữ cảnh thông tin xác thực | Nội dung ghi chú thuộc người dùng |

Chọn TTL từ tốc độ thay đổi dữ liệu và thiệt hại do cũ. Năm phút có thể hợp danh mục prompt công khai. Đọc ghi chú riêng có thể dùng một phút.

MCP chỉ định nghĩa `public` và `private` làm giá trị `cacheScope`. Với kết quả mang bí mật hoặc đổi nhanh, trả `cacheScope: "private"` với `ttlMs: 0`, rồi áp dụng quy tắc không lưu nghiêm hơn trong chính sách bộ đệm host. Bản thân `no-store` không phải giá trị `cacheScope` MCP.

Gợi ý bộ đệm không bao giờ thay cấp quyền. Khóa bộ đệm phải gồm mọi chiều yêu cầu thay đổi khả năng hiển thị, gồm tenant, người dùng, scope, locale và con trỏ phân trang. Nếu bộ đệm dùng chung không diễn đạt các chiều đó an toàn, dùng `private` với TTL bằng không và chính sách không lưu cấp host.

## Subscriptions Use a Client-Opened Response Stream

Mẫu đăng ký hiện đại thay RPC `resources/subscribe` trước đây và endpoint sự kiện HTTP GET cũ.

Client gửi `subscriptions/listen` như yêu cầu JSON-RPC thường. Trên Streamable HTTP đây là POST có phản hồi giữ mở như luồng SSE. Đối tượng `notifications` là danh sách cho phép. Máy chủ không được phân phối kiểu thông báo không được yêu cầu.

```json
{
  "jsonrpc": "2.0",
  "id": 17,
  "method": "subscriptions/listen",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": {
        "name": "course-client",
        "version": "1.0.0"
      }
    },
    "notifications": {
      "resourcesListChanged": true,
      "promptsListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

ID yêu cầu là ID đăng ký. Trước mọi sự kiện yêu cầu, máy chủ gửi `notifications/subscriptions/acknowledged`. Bộ lọc chỉ chứa tập con máy chủ chấp nhận.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/subscriptions/acknowledged",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "notifications": {
      "resourcesListChanged": true,
      "resourceSubscriptions": [
        "notes://note-1"
      ]
    }
  }
}
```

Mọi sự kiện sau trên luồng đó mang cùng siêu dữ liệu.

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/resources/updated",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/subscriptionId": 17
    },
    "uri": "notes://note-1"
  }
}
```

Thông báo nói tài nguyên thay đổi. Client đọc lại qua `resources/read`, chịu cấp quyền hiện tại. Nó không giả định sự kiện chứa tài liệu mới.

Nhiều đăng ký có thể dùng chung một kênh stdio. ID đăng ký cho client phân kênh chúng. Trên HTTP, đóng luồng phản hồi hủy đăng ký. Máy chủ kết thúc luồng có trật tự trả phản hồi cuối `resultType: "complete"` liên hệ với yêu cầu gốc.

Không dùng luồng đăng ký làm phiên giao thức. Lần đọc sau vẫn là yêu cầu đầy đủ có thể đến bất kỳ thực thể máy chủ khỏe nào.

```figure
t3-primitive-sort
```

## Interactive Lab

Dùng hình để phân loại năm khả năng từ trình theo dõi dự án: chi tiết vấn đề, tạo vấn đề, mẫu đánh giá sprint, chính sách dự án và đóng vấn đề. Rồi quyết định danh sách nào có thể lưu đệm công khai, lần đọc nào phải riêng và tài nguyên nào đáng có thông báo cập nhật.

Với mỗi phân loại, nêu bên chọn. Nếu mô hình thực hiện hành động, dùng công cụ. Nếu host đọc nội dung định địa chỉ URI, dùng tài nguyên. Nếu người dùng bắt đầu quy trình thông điệp chuẩn bị sẵn, dùng prompt.

## Practice Lab

Chạy mô phỏng từ thư mục gốc repo:

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

Kiểm tra bản ghi theo thứ tự này:

1. Xác nhận `server/discover` công bố bản sửa đổi hiện tại và cả hai khả năng.
2. Xác nhận cả hai kết quả danh sách được sắp xếp và dùng `resultType: "complete"`.
3. Xác nhận kết quả danh sách và đọc mang gợi ý bộ đệm có chủ ý.
4. Đổi URI đọc thành `notes://missing` và quan sát `-32602`.
5. Xác nhận xác nhận đăng ký đứng trước sự kiện tài nguyên.
6. Xác nhận sự kiện và đóng có trật tự đều mang ID đăng ký `5`.

Mô hình Python không mở kết nối HTTP thật. Nó biểu diễn thông điệp SDK phải đặt lên luồng phản hồi phạm vi yêu cầu. Dùng SDK chính thức để đóng khung và vận chuyển trong sản xuất.

## Shipped Artifact

`outputs/skill-primitive-splitter.md` là đánh giá thiết kế tái sử dụng để chọn thành phần cơ bản MCP. Nó hiện kiểm tra khám phá tất định, phạm vi bộ đệm, hành vi URI không hợp lệ và bộ lọc đăng ký hiện đại.

Bài cũng cung cấp `assets/primitive-split.svg`, bản tĩnh ranh giới thành phần cơ bản và đăng ký để học ngoại tuyến.

## Verify It

```bash
cd phases/13-tools-and-protocols/10-mcp-resources-and-prompts/code
python3 main.py
python3 -m unittest discover tests -v
```

Kết quả kỳ vọng: chương trình chính in bản ghi JSON và lệnh kiểm thử báo ít nhất mười hai kiểm thử đạt.

## Capstone Connection

Dùng hợp đồng này khi máy chủ tổng kết của bạn cung cấp kiến thức định địa chỉ được bên cạnh hành động. Gồm một ảnh chụp danh mục tất định, một lần đọc tài nguyên có cấp quyền, một phân giải prompt, một trường hợp URI không hợp lệ và một bản ghi đăng ký.

Bằng chứng nên cho thấy không danh sách nào phụ thuộc lịch sử kết nối và sự kiện đăng ký không bao giờ cấp quyền truy cập tài nguyên bên dưới.

## Exercises

1. Thêm mẫu tài nguyên `notes://projects/{project}/notes/{id}` và xác thực cả hai biến.
2. Thêm phân trang vào `resources/list` trong khi giữ thứ tự tất định.
3. Đổi một tài nguyên thành `cacheScope: "private"` với `ttlMs: 0`, thêm chính sách không lưu cấp host và giải thích mối đe dọa biện minh cho cả hai kiểm soát.
4. Thêm đăng ký thay đổi danh sách prompt và chứng minh không sự kiện nào được gửi khi bộ lọc bỏ `promptsListChanged`.
5. Tạo hai đăng ký đồng thời và chứng minh mỗi sự kiện mang đúng ID yêu cầu.
6. Thêm chủ thể cấp quyền vào trình xử lý đọc và chứng minh mục bộ đệm không thể đi qua chủ thể.

## Key Terms

- **Resource (Tài nguyên):** Nội dung định địa chỉ URI do máy chủ MCP cung cấp.
- **Prompt:** Mẫu thông điệp do người dùng kiểm soát được máy chủ MCP cung cấp.
- **Deterministic list (Danh sách tất định):** Kết quả khám phá có thành viên và thứ tự ổn định cho cùng đầu vào yêu cầu.
- **`ttlMs`:** Thời gian độ mới bộ đệm theo mili giây.
- **`cacheScope`:** Ranh giới chia sẻ cho kết quả lưu đệm.
- **`subscriptions/listen`:** Yêu cầu sống lâu có luồng phản hồi phân phối thông báo được lọc tường minh.
- **Subscription ID (ID đăng ký):** ID yêu cầu listen gốc, lặp trong siêu dữ liệu thông báo.
- **Invalid parameters (Tham số không hợp lệ):** Lỗi JSON-RPC `-32602`, dùng cho URI tài nguyên không hợp lệ hoặc không biết.
- **Unsupported protocol version (Phiên bản giao thức không hỗ trợ):** Lỗi JSON-RPC `-32022`, gồm bản sửa đổi `supported` và `requested`.
- **`server/discover`:** Phương thức máy chủ bắt buộc trả bản sửa đổi hỗ trợ, khả năng, danh tính và gợi ý bộ đệm tùy chọn.

## Further Reading

- [MCP 2026-07-28 Resources](https://modelcontextprotocol.io/specification/2026-07-28/server/resources)
- [MCP 2026-07-28 Prompts](https://modelcontextprotocol.io/specification/2026-07-28/server/prompts)
- [MCP 2026-07-28 Subscriptions](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/subscriptions)
- [MCP 2026-07-28 Caching](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching)
