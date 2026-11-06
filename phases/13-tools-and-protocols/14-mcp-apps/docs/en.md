# MCP Apps on the Stateless Protocol

> Kết quả tương tác vẫn là trao đổi công cụ và tài nguyên MCP. Lõi 2026-07-28 làm trao đổi đó tự đầy đủ, trong khi phần mở rộng Apps thêm bề mặt trình duyệt trong sandbox.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 10 (resources)
**Time:** ~75 minutes

## Learning Objectives

- Công bố MCP Apps qua `server/discover` và khả năng phần mở rộng mỗi yêu cầu.
- Khai báo tài nguyên `ui://` trên công cụ trước khi công cụ được gọi.
- Trả kết quả công cụ và tài nguyên đầy đủ trên đường truyền không trạng thái 2026-07-28.
- Tách thông điệp bridge Apps `ui/initialize` khỏi bắt tay lõi MCP đã bỏ.
- Áp dụng xác thực origin, sandbox, CSP và quyền tối thiểu.

## The Problem

Kết quả văn bản có thể mô tả dòng thời gian. Không thể cho người dùng dòng thời gian họ lọc, kiểm tra hoặc thao tác được.

MCP Apps giải quyết vấn đề trình bày bằng phần mở rộng tùy chọn. Định nghĩa công cụ trỏ đến tài nguyên `ui://`. Host có thể lấy và xem xét tài nguyên trước khi công cụ chạy, kết xuất trong iframe sandbox và làm trung gian mọi hành động ứng dụng qua bridge JSON-RPC.

Giao thức lõi đổi trong 2026-07-28. Không bọc App trong vòng đời kết nối cũ:

- Không có yêu cầu lõi `initialize` hoặc thông báo `notifications/initialized`.
- Không có header `Mcp-Session-Id`.
- Mọi yêu cầu mang phiên bản giao thức và khả năng client trong `params._meta`.
- Máy chủ triển khai `server/discover` để client kiểm tra phiên bản, khả năng lõi và phần mở rộng.
- Mọi kết quả thành công có trường phân biệt `resultType`.
- Streamable HTTP dùng một POST mỗi yêu cầu. Điểm vào GET và DELETE hiện đại trả 405.

Bridge Apps vẫn có phương thức tên `ui/initialize`. Nó thuộc phương ngữ postMessage của iframe. Không tái tạo phiên MCP lõi.

## The Concept

### Two protocols, one feature

Giữ các tầng tường minh:

1. Lõi MCP mang `server/discover`, `tools/list`, `tools/call`, `resources/list` và `resources/read`.
2. Phần mở rộng MCP Apps khai báo UI và định nghĩa bridge iframe-sang-host.
3. Quy tắc sandbox trình duyệt giới hạn thứ UI tiếp cận được.

Định danh phần mở rộng là `io.modelcontextprotocol/ui`. Cả hai peer chọn tham gia. Client gửi hỗ trợ phần mở rộng bên trong đối tượng khả năng trên mỗi yêu cầu:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "server/discover",
  "params": {
    "_meta": {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {
        "extensions": {
          "io.modelcontextprotocol/ui": {}
        }
      },
      "io.modelcontextprotocol/clientInfo": {
        "name": "timeline-host",
        "version": "1.0.0"
      }
    }
  }
}
```

`clientInfo` được khuyến nghị để chẩn đoán. Là dữ liệu tự khai, không phải danh tính cấp quyền.

### Discover before rendering

Kết quả khám phá máy chủ công bố phần mở rộng:

```json
{
  "resultType": "complete",
  "supportedVersions": ["2026-07-28"],
  "capabilities": {
    "tools": {},
    "resources": {},
    "extensions": {
      "io.modelcontextprotocol/ui": {}
    }
  },
  "ttlMs": 300000,
  "cacheScope": "public",
  "_meta": {
    "io.modelcontextprotocol/serverInfo": {
      "name": "timeline-app-server",
      "version": "2.0.0"
    }
  }
}
```

Máy chủ phải hỗ trợ khám phá. Client không bị buộc gọi khám phá trước mọi hành động vì mỗi hành động mang khả năng riêng.

### Declare the UI on the tool definition

Hợp đồng Apps hiện đại gắn UI với công cụ trong `tools/list`:

```json
{
  "name": "notes_timeline",
  "description": "Render a timeline of notes.",
  "inputSchema": {
    "type": "object",
    "properties": {}
  },
  "_meta": {
    "ui": {
      "resourceUri": "ui://notes/timeline.html"
    }
  }
}
```

Đây cố ý là siêu dữ liệu trước lời gọi. Host có thể nạp trước, lưu đệm và xem xét bảo mật HTML trước khi kết quả yêu cầu hiển thị. Khóa siêu dữ liệu phẳng cũ có thể được mã tương thích chấp nhận, nhưng máy chủ mới nên phát dạng `_meta.ui.resourceUri` lồng.

`tools/list` có thể lưu đệm trong lõi hiện tại. Gồm thứ tự tất định, `ttlMs` và `cacheScope`. Dùng `private` khi công cụ hiển thị thay đổi theo người dùng hoặc token.

### Return data, then let the host bind the view

Lời gọi công cụ trả nội dung thường cộng dữ liệu có cấu trúc:

```json
{
  "resultType": "complete",
  "content": [
    {"type": "text", "text": "Timeline ready."}
  ],
  "structuredContent": {
    "notes": [
      {"id": "note-1", "title": "Discover", "created": "2026-07-28"}
    ]
  },
  "isError": false
}
```

Host đã biết view nào thuộc công cụ. Tránh bịa khối nội dung mới chỉ để lặp URI.

### Serve the app as a resource

Máy chủ công bố `resources` trong khám phá, nên cũng triển khai thao tác `resources/list` bắt buộc. Mục danh sách tất định gồm URI chuẩn, tên ổn định, mô tả và MIME type. Kết quả danh sách gồm `resultType`, siêu dữ liệu danh tính máy chủ, `ttlMs` và `cacheScope`, như danh sách công cụ tất định.

Host gửi `resources/read`. Trên Streamable HTTP, yêu cầu có:

```text
POST /mcp
MCP-Protocol-Version: 2026-07-28
Mcp-Method: resources/read
Mcp-Name: ui://notes/timeline.html
```

Giá trị header và phần thân JSON-RPC phải khớp. Không khớp là lỗi giao thức `-32020`.

Kết quả chứa tài nguyên HTML và gợi ý bộ đệm:

```json
{
  "resultType": "complete",
  "contents": [
    {
      "uri": "ui://notes/timeline.html",
      "mimeType": "text/html;profile=mcp-app",
      "text": "<!doctype html>...",
      "_meta": {
        "ui": {
          "csp": {
            "connectDomains": [],
            "resourceDomains": [],
            "frameDomains": [],
            "baseUriDomains": []
          },
          "permissions": {}
        }
      }
    }
  ],
  "ttlMs": 60000,
  "cacheScope": "public"
}
```

### Cache UI resources as executable content

Tài nguyên App không thể hoán đổi với văn xuôi thường. Mục bộ đệm có thể thực thi mã bridge, kết xuất dữ liệu công cụ và yêu cầu hành động qua host. Đặt khóa theo URI `ui://` chuẩn, danh tính và phiên bản máy chủ được chấp nhận, bản băm nội dung tài nguyên và ngữ cảnh cấp quyền khi `cacheScope` riêng. Không bao giờ dùng lại tài nguyên App riêng giữa chủ thể vì HTML hoặc siêu dữ liệu chính sách có thể khác dù URI giống.

Vô hiệu mục khi `ttlMs` hết hạn, liên kết `_meta.ui.resourceUri` của công cụ đổi, phiên bản máy chủ hoặc bản ghim bộ mô tả được chấp nhận đổi, hoặc đăng ký thay đổi tài nguyên đã xác nhận nêu URI. Lấy lại và áp dụng lại đánh giá CSP và quyền trước gắn lại. Iframe cũ không được giữ quyền rộng hơn chỉ vì phiên bản tài nguyên mới chưa tải.

### Reject wire ambiguity before feature policy

Xác thực có thứ tự chủ ý. Trước xác thực hình dạng JSON-RPC và yêu cầu siêu dữ liệu giao thức chuỗi cộng ánh xạ khả năng client đối tượng. Tiếp so header định tuyến với phần thân. Chỉ sau đó quyết định phiên bản giao thức khớp có được hỗ trợ không. Thứ tự ngăn proxy và máy chủ diễn giải yêu cầu khác nhau.

| Điều kiện | HTTP | Lỗi JSON-RPC |
|-----------|------|----------------|
| Phiên bản, phương thức hoặc tên header và phần thân không đồng ý | 400 | `-32020` |
| Header và phần thân đồng ý phiên bản không hỗ trợ | 400 | `-32022`, với `data` chính xác `{"supported":["2026-07-28"],"requested":"<actual>"}` |
| `resources/read` thiếu khả năng phần mở rộng Apps | 400 | `-32021`, với `data.requiredCapabilities.extensions.io.modelcontextprotocol/ui` |
| Phương thức không biết | 404 | `-32601` |

Thông báo JSON-RPC không có `id`, nên máy chủ không bao giờ phát phản hồi JSON-RPC cho nó. Thông báo HTTP được chấp nhận trả 202 với phần thân rỗng. Lỗi có thể đổi trạng thái HTTP, nhưng vẫn không thể tạo phần thân lỗi JSON-RPC cho thông báo.

### The sandbox is a boundary, not a trust verdict

Host kiểm soát iframe. App không thể trực tiếp đọc cookie, local storage hoặc DOM trang của host. Mọi công việc đặc quyền phải qua bridge.

Dùng mặc định này:

- Để mọi danh sách miền CSP rỗng, rồi chỉ thêm origin App cần. Dùng `connectDomains` cho fetch, XHR và WebSocket; dùng `resourceDomains` cho script, style, ảnh và phông chữ.
- Đóng gói mã và dữ liệu khi thực tế cho phép.
- Không yêu cầu quyền camera, mic hoặc vị trí trừ khi tính năng hiển thị cần.
- Ghim `postMessage` vào đúng origin peer và từ chối sự kiện từ mọi origin khác.
- Coi đối số công cụ, kết quả công cụ, văn bản tài nguyên và thông điệp bridge là đầu vào không đáng tin.
- Giữ đồng ý người dùng trong host. Iframe không thể tự phê duyệt hành động có hệ quả.

Không sao chép thuộc tính `sandbox` cố định từ hướng dẫn vào mọi host. Host phải chọn cờ dựa trên mô hình origin App và thiết kế cô lập riêng.

Miền được phép vẫn là đường rút dữ liệu. `connectDomains: ["https://api.example.com"]` nghĩa mọi script thực thi trong App có thể gửi dữ liệu được phép đến đó. Khớp origin chính xác ngăn nhầm đích, nhưng không quyết định payload phù hợp hay không. Giữ truy cập connect rỗng mặc định, tránh đặt bearer token trong iframe, proxy thao tác hẹp qua host khi thực tế cho phép, giới hạn kích thước phản hồi và yêu cầu, kiểm toán hành động người dùng nào gây mỗi yêu cầu đi ra. Xử lý `resourceDomains` riêng `connectDomains`; quyền tải phông hoặc script không nên cấp tải dữ liệu lên tùy ý.

### The Apps bridge has its own lifecycle

Bridge Apps là phương ngữ JSON-RPC trên `postMessage`. Nó có thể trao đổi `ui/initialize` và thông báo `ui/*`, đồng thời proxy phương thức giống lõi như `tools/call`.

View gửi `ui/initialize` với `appInfo` và đối tượng `appCapabilities`. Host trả khả năng và ngữ cảnh host. Chỉ sau phản hồi đó View mới gửi `ui/notifications/initialized`. Host phải chờ thông báo Apps này trước gửi thông điệp đến View.

Bắt tay cục bộ đó tạo bridge giữa một iframe và một khung host. Nó không thương lượng phiên bản giao thức MCP, tạo trạng thái máy chủ hoặc tạo phiên vận chuyển. Chú ý đúng tiền tố: `notifications/initialized` lõi đã bỏ, trong khi `ui/notifications/initialized` Apps còn. Yêu cầu lõi tạo bởi lời gọi công cụ qua bridge là yêu cầu tự đầy đủ mới với id JSON-RPC mới và siêu dữ liệu yêu cầu đầy đủ.

### Host context, actions, and revocation

Host vẫn là bên có thẩm quyền sau khởi tạo bridge. View chỉ có thể yêu cầu hành động công cụ, điều hướng, dùng clipboard hoặc hiệu ứng đặc quyền khác qua khả năng host công bố. Host xác thực yêu cầu có kiểu, người dùng hiện tại, đích và đối số, áp dụng chính sách phê duyệt và có thể từ chối. Nhấp nút và thông điệp bridge hợp lệ biểu đạt ý định; không bên nào cấp thẩm quyền.

Coi theme, kích thước và trợ năng là ngữ cảnh host thay đổi thay vì đầu vào kết xuất một lần:

- Áp dụng token màu và kiểu chữ host cung cấp, rồi phản ứng khi theme hoặc ưu tiên tương phản đổi.
- Cho View báo kích thước mong muốn, nhưng để host giới hạn và áp dụng kích thước iframe để nội dung không thoát bố cục hoặc tạo lớp phủ lừa đảo.
- Giữ thứ tự bàn phím, focus hiển thị, tên trợ năng, trạng thái trình đọc màn hình, tương phản đủ, phóng to và hành vi giảm chuyển động trong iframe.
- Kiểm thử lại chuyển focus giữa điều khiển host và View sau đổi kích thước và kết xuất lại.

Khả năng có thể bị thu hồi khi App mở vì người dùng đổi tài khoản, chính sách đổi, máy chủ bị cách ly hoặc host thu hẹp đồng ý. Kiểm tra khả năng và cấp quyền lúc hành động, không chỉ trong `ui/initialize`. Khi thu hồi, từ chối lời gọi đặc quyền chờ, dừng hoạt động mạng không còn hợp chính sách, xóa trạng thái nhạy cảm đã kết xuất và gắn lại hoặc dự phòng văn bản khi chính tài nguyên UI không còn được chấp nhận. View phải xử lý từ chối như kết quả thường, không thử lại đến khi host nhượng bộ.

### Fallback is part of the contract

Máy chủ nhận biết Apps vẫn có thể phục vụ host không công bố phần mở rộng UI:

- Trả cùng công cụ không `_meta.ui` trong `tools/list`.
- Giữ kết quả văn bản hữu ích cho `tools/call`.
- Từ chối `resources/read` cho UI bằng lỗi thiếu khả năng.
- Không bao giờ giả định iframe tồn tại khi quyết định công cụ xong hay chưa.

```figure
t3-ui-sandbox
```

## Build It

`code/main.py` xây mô hình giao thức nhỏ trong tiến trình không SDK. Nó xác thực vỏ yêu cầu hiện tại và giá trị định tuyến Streamable HTTP, công bố Apps qua `server/discover`, liệt kê công cụ và tài nguyên, thực thi công cụ và phục vụ tài nguyên HTML tự đầy đủ.

Mô hình nhận phần thân và header định tuyến đã phân tích. Không phải adapter HTTP đầy đủ và không phân tích `Content-Type` hoặc `Accept`. Dùng Bài 09 cho adapter Streamable HTTP đầy đủ yêu cầu `Content-Type: application/json` và giá trị `Accept` chứa cả `application/json` và `text/event-stream`.

Chạy:

```bash
cd phases/13-tools-and-protocols/14-mcp-apps
python3 code/main.py
python3 -m unittest discover code/tests -v
```

Kiểm tra bốn thứ trong đầu ra:

1. Mọi lời gọi độc lập.
2. Mọi yêu cầu có khả năng `_meta`.
3. `resources/list` trả bộ mô tả ổn định trước mọi lần đọc tài nguyên.
4. Mọi kết quả có `resultType` và siêu dữ liệu danh tính máy chủ.
5. Không định danh phiên lõi xuất hiện.

## Use It

Bắt đầu với `server/discover`. Xác nhận `io.modelcontextprotocol/ui` xuất hiện trong ánh xạ phần mở rộng máy chủ. Rồi gọi `tools/list` hai lần, một có khả năng Apps và một không. Phản hồi đầu khai báo tài nguyên. Phản hồi hai vẫn là công cụ chỉ văn bản dùng được.

Đọc `ui://notes/timeline.html`. Tìm `hostOrigin` và chốt bảo vệ `event.origin` trong HTML. Hai dòng đó là bằng chứng hiển thị tối thiểu bridge không dùng đích ký tự đại diện.

## Ship It

Bài học này cung cấp `outputs/skill-mcp-apps-spec.md`. Dùng để đánh giá hợp đồng App trước viết mã framework. Nó buộc tác giả nêu vỏ lõi hiện tại, thương lượng phần mở rộng, dự phòng, tài nguyên UI, chính sách bộ đệm, CSP, quyền, phương thức bridge và ranh giới đồng ý.

## Exercises

1. Đổi khả năng client thành ánh xạ phần mở rộng rỗng. Xác nhận `tools/list` giữ công cụ nhưng bỏ liên kết UI.
2. Gửi `Mcp-Name: ui://notes/other.html` với phần thân đọc dòng thời gian. Xác nhận lỗi `-32020`.
3. Đổi tài nguyên thành `cacheScope: private`. Mô tả điều kiện riêng người dùng biện minh.
4. Chuyển script đến `https://static.example.com/app.js`. Thêm origin đó vào `resourceDomains` và giải thích rủi ro chuỗi cung ứng mới.
5. Thêm công cụ `notes_open` và định tuyến nhấp nút qua host. Giữ phê duyệt người dùng trong host.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| MCP Apps | Phần mở rộng tùy chọn cho HTML tương tác được host MCP kết xuất |
| `io.modelcontextprotocol/ui` | Định danh phần mở rộng cả hai peer công bố |
| `ui://` | Lược đồ tài nguyên cho mẫu UI của App |
| `text/html;profile=mcp-app` | MIME type cho HTML MCP App |
| `server/discover` | RPC hiện tại để khám phá giao thức và khả năng |
| `resources/list` | Phương thức liệt kê tài nguyên bắt buộc khi máy chủ công bố tài nguyên |
| `resultType` | Trường phân biệt bắt buộc cho kết quả hiện đại thành công |
| `ui/initialize` | Yêu cầu bridge Apps đầu tiên, riêng khởi tạo lõi đã bỏ |
| `ui/notifications/initialized` | Thông báo sẵn sàng Apps View gửi sau host phản hồi |
| CSP | Chính sách trình duyệt hạn chế script, style, ảnh và origin mạng |
| Text fallback (Dự phòng văn bản) | Hành vi công cụ giữ cho host không hỗ trợ Apps |

## Further Reading

- [MCP 2026-07-28 base protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP Apps overview](https://modelcontextprotocol.io/extensions/apps/overview)
- [MCP Apps build guide](https://modelcontextprotocol.io/extensions/apps/build)
- [Official extension support matrix](https://modelcontextprotocol.io/extensions/client-matrix)
