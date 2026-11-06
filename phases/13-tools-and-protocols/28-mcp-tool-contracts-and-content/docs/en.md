# MCP Tool Contracts and Content

> Công cụ chỉ an toàn để tự động hóa khi khám phá, đối số, kết quả, phân trang và siêu dữ liệu vận chuyển đồng ý một hợp đồng.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 07, 09, and 10
**Time:** ~120 minutes

## Learning Objectives

- Định nghĩa đầu vào và đầu ra công cụ bằng JSON Schema 2020-12.
- Xác thực kết quả có cấu trúc không giả định là đối tượng JSON.
- Chọn giữa văn bản, ảnh, âm thanh, liên kết tài nguyên và tài nguyên nhúng.
- Từ chối định nghĩa `x-mcp-header` không an toàn trước công cụ đến mô hình.
- Mã hóa giá trị header tham số và xác minh header-phần thân bằng nhau chính xác.
- Duyệt phân trang con trỏ không diễn giải giá trị con trỏ.
- Giới hạn và cấp quyền gợi ý `completion/complete`.

## The Problem

Gọi hàm Python dễ. Gọi khả năng từ xa qua host AI là vấn đề hợp đồng.

Máy chủ công bố bộ mô tả. Client chuyển thành ngữ cảnh mô hình và giao diện người dùng. Mô hình tạo đối số. Gateway có thể định tuyến yêu cầu từ header phản chiếu. Máy chủ thực thi công cụ. Client rồi quyết định kết quả đủ an toàn và hợp lệ để trả cho mô hình chưa.

Một ranh giới yếu làm hỏng toàn chuỗi.

Xét năm thất bại:

- Bộ mô tả nói kết quả là đối tượng nhưng máy chủ trả mảng.
- Client dừng phân trang khi `nextCursor` là chuỗi rỗng.
- Tham số token phản chiếu vào header HTTP và hiển thị với trung gian.
- Giá trị định tuyến Unicode gửi dưới header thô, rồi gateway và máy chủ gốc diễn giải byte khác.
- Endpoint completion gợi ý môi trường sản xuất cho bên gọi không truy cập được.

Không thất bại nào được sửa bằng prompting tốt hơn. Cần hợp đồng giao thức và ứng dụng tường minh.

## The Contract Pipeline

Coi mỗi lời gọi công cụ như năm cổng:

1. **Khám phá.** Đọc danh sách công cụ tất định, phân trang.
2. **Tiếp nhận.** Xác thực mỗi bộ mô tả và áp chính sách bảo mật cục bộ.
3. **Gọi.** Xác thực đối số và xây siêu dữ liệu vận chuyển.
4. **Thực thi.** Chạy trình xử lý và phân loại thất bại đúng.
5. **Tiếp nhận kết quả.** Xác thực khối nội dung và đầu ra có cấu trúc trước mô hình dùng.

```figure
mcp-contract-pipeline
```

Host sở hữu cổng tiếp nhận công cụ và tiếp nhận kết quả. Máy chủ không thể ép client tin chú giải, lược đồ hoặc đầu ra.

## JSON Schema Is a Runtime Boundary

Trong MCP `2026-07-28`, `inputSchema` và `outputSchema` dùng JSON Schema. Khi `$schema` vắng, phương ngữ mặc định 2020-12.

Lược đồ đầu vào phải là đối tượng lược đồ. Công cụ không đối số vẫn nên nói chính xác nhận gì:

```json
{
  "type": "object",
  "additionalProperties": false
}
```

Nghiêm hơn `{ "type": "object" }`, vốn nhận thuộc tính tùy ý.

Lược đồ đầu ra tùy chọn. Khi máy chủ công bố, mọi kết quả công cụ
đầy đủ cam kết trả `structuredContent` tuân thủ, gồm kết quả
với `isError: true`. Cờ lỗi phân loại kết quả thực thi; không
miễn hợp đồng đầu ra công bố. Client nên xác thực kết quả thay
tin bộ mô tả.

### Structured content is any JSON value

Không mã hóa cứng `structuredContent` thành từ điển. Có thể là:

- đối tượng;
- mảng;
- chuỗi;
- số;
- boolean;
- `null`.

Công cụ này trả mảng:

```json
{
  "name": "tag_catalog",
  "inputSchema": {
    "type": "object",
    "additionalProperties": false
  },
  "outputSchema": {
    "type": "array",
    "items": {"type": "string"}
  }
}
```

Kết quả thành công hợp lệ:

```json
{
  "resultType": "complete",
  "content": [
    {
      "type": "text",
      "text": "[\"contracts\", \"mcp\", \"stateless\"]"
    }
  ],
  "structuredContent": ["contracts", "mcp", "stateless"],
  "isError": false
}
```

Để tương thích, kết quả có cấu trúc cũng nên gồm JSON tuần tự hóa trong khối văn bản. Văn bản không là nguồn xác thực. `structuredContent` mới là.

### A small validator still teaches the boundary

Bài dùng tập con JSON Schema có chủ ý vì giữ trong thư viện chuẩn Python. Kiểm tra cơ chế công cụ mẫu dùng:

- kiểu object, array, string, integer, number, boolean và null;
- thuộc tính bắt buộc;
- `additionalProperties: false`;
- phần tử mảng;
- giá trị enum;
- độ dài chuỗi tối thiểu.

Không thay bộ xác thực sản xuất đầy đủ. Bài học tái sử dụng là nơi xác thực xảy ra: sau khám phá cho bộ mô tả, trước thực thi cho đối số và trước tiếp nhận cho kết quả có cấu trúc.

## Content Blocks Carry Different Costs

Mảng `content` có thể kết hợp nhiều kiểu nội dung.

| Kiểu | Dùng cho | Ranh giới chính |
|------|------------|---------------|
| `text` | Tóm tắt con người và mô hình đọc được | Coi văn bản là đầu ra không đáng tin |
| `image` | Bằng chứng thị giác mã hóa base64 | Xác thực media type và kích thước |
| `audio` | Đầu ra nói hoặc ghi âm mã hóa base64 | Xác thực media type và giới hạn thời lượng |
| `resource_link` | URI client có thể lấy sau | Cấp quyền lại lần đọc tài nguyên sau |
| `resource` | Dữ liệu nhúng thẳng trong kết quả | Thực thi giới hạn payload và nội dung ngay |

Liên kết tài nguyên không phải bằng chứng tài nguyên xuất hiện trong `resources/list`. Là tham chiếu lời gọi công cụ này trả. Client vẫn áp chính sách tài nguyên khi theo URI.

Tài nguyên nhúng tránh thêm lượt khứ hồi nhưng tăng kích thước phản hồi hiện tại. Dùng liên kết cho sản phẩm lớn hoặc đổi độc lập. Dùng tài nguyên nhúng cho bằng chứng nhỏ phải đi nguyên tử cùng kết quả.

Kết quả `evidence_bundle` của bài gồm cả năm kiểu. Client xác thực mỗi khối trước nhận kết quả.

## `x-mcp-header` Is Routing Metadata

Thuộc tính trong `inputSchema` có thể khai báo `x-mcp-header`. Trên Streamable HTTP, client phản chiếu đối số đó vào `Mcp-Param-{name}`.

```json
{
  "region": {
    "type": "string",
    "x-mcp-header": "Region"
  }
}
```

Với `region: "eu-west"`, vận chuyển có thể phát:

```http
Mcp-Param-Region: eu-west
```

Chú giải tồn tại để bộ cân bằng tải, gateway hoặc máy chính sách định tuyến không phân tích phần thân JSON. Không phải nơi đặt thông tin xác thực.

Giao thức ràng buộc chú giải:

- tên header không rỗng và theo cú pháp token tên trường HTTP;
- tên header duy nhất không xét hoa thường;
- kiểu thuộc tính là string, integer hoặc boolean;
- `number` không được phép;
- chú giải chỉ xuất hiện trên thành viên trực tiếp của `inputSchema.properties`;
- giá trị integer ở trong `-9007199254740991` đến `9007199254740991`.

Quy tắc vị trí mang tính cú pháp và thất bại theo hướng đóng. Duyệt toàn cây lược đồ,
không chỉ thuộc tính bộ xác thực tình cờ hiểu. Từ chối
chú giải dưới `properties` đối tượng lồng, nhánh `oneOf`, `items`,
định nghĩa qua `$ref` hoặc mọi lược đồ đầu ra. Phân giải tham chiếu
không biến nút tham chiếu thành thuộc tính cấp cao nhất trực tiếp.

Bài thêm chính sách triển khai: từ chối bộ mô tả phản chiếu tên như `password`, `secret`, `token`, `api_key` hoặc `authorization`. Đặc tả chính thức khuyên tác giả máy chủ không phản chiếu tham số nhạy cảm. Client có thể biến lời khuyên thành quy tắc tiếp nhận cứng.

Kiểm toán tên header, không giá trị. Mã mẫu ghi `Mcp-Param-Region` trong khi giữ `eu-west` ngoài sự kiện kiểm toán.

### Encode values before building HTTP headers

Giá trị tham số chỉ đi dạng văn bản thuần khi là chuỗi không rỗng
gồm ký tự ASCII hiển thị từ `!` đến `~` và không giống
dấu báo hiệu mã hóa. Mọi thứ khác dùng đúng dạng:

```text
=?base64?{Base64UTF8}?=
```

`Base64UTF8` là base64 chuẩn trên đúng byte UTF-8. Không cắt,
chuẩn hóa hoặc thay giá trị trước. Mã hóa Unicode, chuỗi rỗng, khoảng trắng,
tab, ký tự điều khiển, CR hoặc LF, khoảng trắng đầu hoặc cuối và mọi
giá trị bắt đầu `=?base64?`. Mã hóa lại giá trị giống dấu báo hiệu
cho bên nhận khôi phục văn bản gốc nguyên văn thay vì giải mã
như cú pháp vận chuyển.

Boolean kết xuất chữ thường `true` hoặc `false`. Số nguyên kết xuất cơ số 10 và
phải trong dải số nguyên an toàn JavaScript. Giá trị ngoài dải
bị từ chối thay bị trung gian làm tròn.

### The server checks the mirrored copy

Tạo header chỉ là nửa client. Tại ranh giới Streamable HTTP,
máy chủ phải:

1. tìm tên `Mcp-Param-*` nhận biết không xét hoa thường tên header;
2. giải mã đúng dạng dấu báo hiệu base64 khi có;
3. so văn bản giải mã chính xác với đối số phần thân JSON tương ứng;
4. từ chối header nhận biết thiếu, trùng, ngoài dự kiến, sai dạng hoặc không khớp
   trước phân phối.

Từ chối là HTTP `400` với mã lỗi JSON-RPC `-32020`. Cả
giá trị phần thân lẫn dạng header mã hóa không thuộc bản ghi kiểm toán. Chỉ ghi
tên header nhận biết và loại từ chối.

`code/main.py` mô hình hóa ranh giới trực tiếp. [Bài 09](../../09-mcp-transports/)
đề cập thứ tự xác thực Streamable HTTP rộng hơn, gồm phương thức và
phiên bản giao thức bằng nhau.

## Pagination Cursors Are Opaque

Thao tác danh sách MCP dùng phân trang con trỏ. Máy chủ chọn cỡ trang và định dạng con trỏ. Client có một quyết định:

```python
if result.get("nextCursor") is None:
    break
cursor = result["nextCursor"]
```

Không viết thế này:

```python
if not result.get("nextCursor"):
    break
```

Chuỗi rỗng là con trỏ hợp lệ. Xét tính đúng sẽ dừng quá sớm.

Client không được giải mã con trỏ, tăng, so với con trỏ trước để xếp thứ tự hoặc suy số trang. Máy chủ có thể ký con trỏ, gắn phiên bản danh mục hoặc ánh xạ trạng thái riêng. Đó là chi tiết triển khai máy chủ.

Máy chủ mẫu cố ý trả `""` sau trang đầu. Client phải gửi đúng giá trị trên yêu cầu thứ hai. Trace là:

```text
<first request with no cursor>
<second request with cursor "">
```

Con trỏ không hợp lệ tạo params JSON-RPC không hợp lệ, mã `-32602`.

## Completion Is an Authorization Surface

`completion/complete` cung cấp gợi ý cho đối số prompt và đối số mẫu tài nguyên. Hữu ích cho biểu mẫu tương tác, nhưng có thể rò tên phương thức danh sách thường bảo vệ.

Yêu cầu completion nêu tham chiếu và đối số đang hoàn thành:

```json
{
  "method": "completion/complete",
  "params": {
    "ref": {
      "type": "ref/prompt",
      "name": "deployment_review"
    },
    "argument": {
      "name": "environment",
      "value": "st"
    }
  }
}
```

Kết quả trả tối đa 100 giá trị và có thể báo `total` cộng `hasMore`.

Áp cùng ranh giới cấp quyền dùng bởi prompt hoặc tài nguyên tham chiếu. Analyst trong mẫu nhận `development` và `staging`. Chỉ operator có thể nhận `production`.

Completion sản xuất cũng cần:

- xác thực đầu vào;
- lọc nhận biết bên gọi;
- debounce yêu cầu trong client;
- giới hạn tốc độ trong máy chủ;
- số kết quả có giới hạn;
- nhật ký không lộ giá trị gợi ý nhạy cảm.

Completion là trợ giúp, không bỏ qua khám phá.

## Two Error Layers

Giữ lỗi giao thức riêng lỗi thực thi công cụ.

Dùng lỗi JSON-RPC khi yêu cầu MCP không phân phối đúng được:

- tên công cụ không biết;
- hình dạng yêu cầu sai;
- thiếu siêu dữ liệu yêu cầu;
- con trỏ không hợp lệ.

Dùng kết quả công cụ đầy đủ với `isError: true` khi lần gọi đến công cụ và công cụ báo thất bại xử lý được:

- nguồn báo cáo không sẵn;
- ngày ngoài dải hỗ trợ;
- quy tắc nghiệp vụ từ chối thao tác yêu cầu.

Mô hình thường sửa được lỗi thực thi công cụ. Không sửa được máy chủ vi phạm lược đồ đầu ra riêng.

Nếu công cụ khai báo lược đồ đầu ra, mô hình hóa thất bại xử lý được trong
lược đồ đó. Thất bại `route_report` mẫu trả vùng yêu cầu với
`accepted: false`, cùng văn bản lỗi con người đọc được và `isError: true`.

## Build It

`code/main.py` xây cả hai phía ranh giới bằng thư viện chuẩn Python.

Máy chủ triển khai:

- xác thực siêu dữ liệu MCP mỗi yêu cầu;
- `server/discover` với khả năng công cụ và completion;
- phân trang `tools/list` tất định;
- bốn bộ mô tả công cụ, gồm một phải từ chối;
- đầu ra có cấu trúc mảng;
- mọi kiểu khối nội dung công cụ hiện tại;
- cổng bằng nhau Streamable HTTP giải mã header tham số nhận biết và
  trả HTTP `400` cộng JSON-RPC `-32020` khi không khớp;
- completion có cấp quyền và giới hạn tốc độ.

Client triển khai:

- tiếp nhận bộ mô tả;
- xác thực vị trí `x-mcp-header` toàn cây và chính sách trường nhạy cảm;
- mã hóa giá trị ASCII hiển thị thuần hoặc base64 UTF-8 chính xác;
- vòng con trỏ mờ theo chuỗi rỗng;
- xác thực đối số và kết quả;
- xác thực khối nội dung;
- sự kiện kiểm toán header chứa tên không giá trị.

Bộ mô tả cố ý không an toàn là dữ liệu giảng dạy. Chứng minh một công cụ bị từ chối không ngăn công cụ hợp lệ tải.

## Use It

Từ thư mục gốc repo:

```bash
cd phases/13-tools-and-protocols/28-mcp-tool-contracts-and-content/code
python3 main.py
python3 -m unittest discover tests -v
```

Demo in công cụ tiếp nhận, bộ mô tả từ chối, cả hai yêu cầu
phân trang, nội dung mảng có cấu trúc, kiểu khối nội dung, tên header
phản chiếu, giá trị có cần mã hóa không, trạng thái HTTP bằng nhau và
giá trị completion lọc bên gọi.

## Interactive Lab

Mở `code/main.py` và tìm `TOOLS`.

1. Đổi `tag_catalog.outputSchema.type` từ `array` thành `object`.
2. Chạy demo. Client nên từ chối mảng trả về.
3. Khôi phục lược đồ.
4. Giữ `nextCursor` trang đầu là `""`, rồi làm trang cuối trả
   `nextCursor: None` thay bỏ trường.
5. Chạy kiểm thử và so trace con trỏ.
6. Thêm `x-mcp-header: "Authorization"` vào thuộc tính chuỗi.
7. Xác nhận tiếp nhận bộ mô tả từ chối trước gọi.
8. Thử giá trị `region` chứa Unicode, dòng mới, khoảng trắng quanh và
   văn bản nguyên văn `=?base64?SGVsbG8=?=`. Giải mã mỗi header phát và chứng minh
   giá trị gốc tồn tại chính xác.
9. Chuyển chú giải dưới `oneOf`, `items` hoặc định nghĩa `$ref`. Xác nhận
   mỗi bộ mô tả bị từ chối dù nhánh đó không bao giờ dùng trong demo.
10. Bỏ header nhận biết hoặc đổi giá trị giải mã. Xác nhận ranh giới HTTP
    trả trạng thái `400` và mã JSON-RPC `-32020`.

Mục đích không phải nhớ hình dạng JSON. Là quan sát mỗi cổng thất bại tại ranh giới sở hữu.

## Practice Lab

Mở rộng lab hợp đồng với công cụ `search_evidence`.

Yêu cầu:

1. Lược đồ đầu vào nhận `query`, `limit` và trường định tuyến `region` an toàn.
2. Lược đồ đầu ra là mảng đối tượng có `uri`, `title` và `score`.
3. Kết quả gồm văn bản tương thích và liên kết tài nguyên mỗi mục.
4. Đối số từ chối thuộc tính không biết.
5. `limit` giới hạn bằng xác thực ứng dụng.
6. Bên gọi không truy cập một URI không bao giờ thấy URI đó qua completion hoặc đầu ra công cụ.
7. Kiểm thử gồm điểm không tuân thủ, chú giải header không hợp lệ và danh sách hai trang.
8. Kiểm thử giá trị header bao phủ ASCII hiển thị, Unicode, ký tự điều khiển,
   khoảng trắng, văn bản giống dấu báo hiệu và cả hai biên số nguyên an toàn JavaScript.
9. Fixture HTTP nhận tên header không phân biệt hoa thường nhưng từ chối giá trị nhận biết thiếu
   hoặc không khớp bằng trạng thái `400` và mã `-32020`.

## Shipped Artifact

`outputs/skill-mcp-contract-reviewer.md` là skill đánh giá phẳng tái sử dụng. Cho bộ mô tả công cụ, kết quả mẫu, hành vi phân trang và chính sách completion. Trả quyết định tiếp nhận, kế hoạch xác thực kết quả, chính sách header và kiểm thử thất bại cụ thể.

## Verify It

Bài hoàn tất khi tuyên bố này đúng:

- `tools/list` trả cùng thứ tự logic trên lời gọi lặp.
- Client thực hiện yêu cầu thứ hai khi `nextCursor` là `""`.
- Bộ mô tả header nhạy cảm không an toàn bị loại trong khi công cụ khác còn sẵn.
- Mảng qua lược đồ đầu ra mảng.
- Đối tượng trượt cùng lược đồ mảng đó.
- Kết quả lỗi không thể bỏ hoặc vi phạm lược đồ đầu ra công bố.
- Khối văn bản, ảnh, âm thanh, liên kết tài nguyên và tài nguyên nhúng xác thực được.
- Sự kiện kiểm toán header chứa tên và không giá trị.
- ASCII hiển thị thuần giữ thuần; Unicode, điều khiển, có đệm, rỗng và
  giá trị giống dấu báo hiệu đi-về qua mã hóa base64 UTF-8 chính xác.
- Số nguyên phản chiếu ngoài dải an toàn JavaScript bị từ chối.
- Chú giải dưới `oneOf`, `items`, đối tượng lồng, định nghĩa `$ref` hoặc
  lược đồ đầu ra bị từ chối khi tiếp nhận.
- Tên header nhận biết không phân biệt hoa thường chỉ đạt khi giá trị giải mã
  khớp chính xác phần thân; bản sao thiếu hoặc không khớp tạo HTTP `400`
  và JSON-RPC `-32020`.
- Completion analyst không bao giờ trả `production`.
- Thất bại công cụ dùng `isError: true`; lời gọi giao thức sai dạng dùng JSON-RPC `error`.

## Production Failure Modes

| Thất bại | Người học thấy gì | Phản ứng đúng |
|---------|-----------------------|------------------|
| Client giả định đầu ra đối tượng | Mảng hợp lệ trượt hoặc bị âm thầm bọc | Xác thực theo lược đồ công bố không kiểu chỉ đối tượng |
| Con trỏ rỗng coi là false | Trang cuối biến mất | Tiếp tục bất cứ khi nào `nextCursor` có và khác null |
| Giá trị nhạy cảm phản chiếu | Bí mật xuất hiện trong proxy, WAF hoặc dữ liệu trace | Từ chối bộ mô tả và giữ bí mật trong dữ liệu yêu cầu được bảo vệ |
| Unicode hoặc khoảng trắng thô phản chiếu | Gateway và máy chủ gốc bất đồng hoặc giá trị chuẩn hóa | Dùng đúng mã hóa dấu báo hiệu base64 UTF-8 và so sau giải mã |
| Chú giải giấu trong nhánh lược đồ | Client bỏ lỡ siêu dữ liệu định tuyến lúc tiếp nhận | Duyệt toàn cây lược đồ và chỉ cho thuộc tính cấp cao nhất trực tiếp |
| Số nguyên lớn phản chiếu | Trung gian JavaScript làm tròn giá trị định tuyến | Từ chối giá trị ngoài dải số nguyên an toàn JavaScript |
| Header và phần thân bất đồng | Gateway định tuyến đích này trong khi máy chủ gốc thực thi đích khác | Từ chối trước phân phối bằng HTTP `400` và JSON-RPC `-32020` |
| Lược đồ đầu ra bị bỏ qua | Mã phía sau tiếp nhận cấu trúc hỏng | Xác thực trước mô hình hoặc ứng dụng dùng |
| Liên kết tài nguyên tự động tin | Bên gọi theo URI không được cấp quyền | Cấp quyền lại mọi lần đọc tài nguyên |
| Completion chia gợi ý toàn cục | Tên tenant ẩn rò | Lọc theo bên gọi, tham chiếu và cấp quyền |
| Chú giải công cụ coi là chính sách | Thao tác phá hủy bỏ qua xác nhận | Cưỡng chế cấp quyền và phê duyệt ngoài chú giải |
| Một công cụ sai dạng phá khám phá | Toàn máy chủ không sẵn | Từ chối bộ mô tả xấu và tiếp nhận công cụ hợp lệ độc lập |

## Capstone Connection

Bài tổng kết Giai đoạn 13 cần gateway gộp công cụ từ nhiều máy chủ. Bài này cung cấp lõi tiếp nhận.

Dùng sản phẩm chấm bốn phần bằng chứng tổng kết:

- khám phá phân trang tất định và đầy đủ;
- xác thực bộ mô tả trước đưa cho mô hình;
- đầu ra có cấu trúc đã xác thực cộng khối nội dung có giới hạn;
- completion và siêu dữ liệu định tuyến giữ ranh giới cấp quyền.

Không tuyên bố tương thích gateway chỉ từ `tools/call` thành công. Thu bộ mô tả, trace trang, tập công cụ tiếp nhận, tập công cụ từ chối và một kết quả đã xác thực.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| `inputSchema` | Đối tượng JSON Schema định nghĩa đối số công cụ chấp nhận |
| `outputSchema` | JSON Schema tùy chọn định nghĩa `structuredContent` |
| `structuredContent` | Mọi giá trị JSON do kết quả công cụ tạo |
| Content block (Khối nội dung) | Văn bản, ảnh, âm thanh, liên kết tài nguyên hoặc tài nguyên nhúng có kiểu |
| `x-mcp-header` | Chú giải lược đồ phản chiếu đối số nguyên thủy vào siêu dữ liệu Streamable HTTP |
| Opaque cursor (Con trỏ mờ) | Token phân trang máy chủ cấp có giá trị client không diễn giải |
| Completion reference (Tham chiếu hoàn thành) | Tên prompt hoặc URI/mẫu tài nguyên có đối số đang được hoàn thành |
| Admission (Tiếp nhận) | Quyết định client đưa ra hoặc từ chối bộ mô tả khám phá |

## Further Reading

- [MCP Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)
- [MCP Completion](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/completion)
- [MCP Pagination](https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination)
- [MCP Streamable HTTP Parameter Headers](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http#custom-headers-from-tool-parameters)
