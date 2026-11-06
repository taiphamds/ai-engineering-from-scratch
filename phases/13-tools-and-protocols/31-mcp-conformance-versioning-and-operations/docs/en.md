# MCP Conformance Engineering: Versioning, Evidence, and Operations

> Một máy chủ không tuân thủ chỉ vì luồng thành công của nó hoạt động qua một SDK. Sự tuân thủ nằm ở dữ liệu truyền, ở ranh giới phiên bản, qua các trung gian và trong quá trình khôi phục.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13 · 09 (transports), Phase 13 · 17 (gateways), Phase 13 · 30 (registry admission)
**Time:** ~100 minutes

## Learning Objectives

- Chuyển các quy tắc MCP mang tính quy phạm thành các bản ghi dữ liệu truyền chuẩn và âm tính.
- Giữ hành vi `2026-07-28` nghiêm ngặt tách biệt với cơ chế dự phòng cũ có giới hạn.
- Phân biệt các trường không xác định được bổ sung với một `resultType` không xác định không hợp lệ.
- So sánh bằng chứng JSON-RPC thô với một dạng xem được SDK chuẩn hóa.
- Chứng minh tính toàn vẹn của header và body qua một ranh giới proxy thực.
- Kiểm soát các bản phát hành bằng bằng chứng bản ghi đã che dữ liệu, tình trạng hoạt động và khôi phục.

## The Problem

Client của bạn gọi `tools/list` qua một SDK và nhận được các công cụ. Kiểm thử tích hợp đạt.

Kết quả đó để lại những câu hỏi quan trọng chưa được trả lời:

- Yêu cầu có mang siêu dữ liệu giao thức hiện đại cho từng yêu cầu không?
- `MCP-Protocol-Version`, `Mcp-Method` và `Mcp-Name` có khớp với body JSON-RPC không?
- Phản hồi có chứa một `resultType` hợp lệ trên đường truyền, hay SDK đã tổng hợp một giá trị?
- Client có giữ lại một trường bổ sung trong tương lai không?
- Một lỗi hiện đại đã nhận diện có vô tình kích hoạt một lần bắt tay cũ không?
- Proxy có giữ nguyên trạng thái nguồn và lỗi JSON-RPC không?
- Bộ tuần tự hóa thông báo có phát ra một phản hồi bị cấm không?
- Bộ phận vận hành có thể chứng minh vì sao một bản phát hành được đưa lên hoặc khôi phục mà không lưu bí mật không?

Sự tuân thủ là một tập hợp các bất biến có thể quan sát. Xây dựng một bộ kiểm thử ghi lại các bất biến đó trước khi lưu lượng sản xuất phải phát hiện chúng.

```figure
mcp-conformance-operations
```

## Start With Version Eras

MCP `2026-07-28` sử dụng siêu dữ liệu độc lập cho từng yêu cầu. Một yêu cầu hiện đại mang `params._meta.io.modelcontextprotocol/protocolVersion` và `params._meta.io.modelcontextprotocol/clientCapabilities`. Các khóa có không gian tên chính xác rất quan trọng; các bí danh đơn thuần `protocolVersion` hoặc `clientCapabilities` là sai định dạng. Khi các header định tuyến phản chiếu hiện diện ở ranh giới HTTP, giá trị của chúng phải khớp với body JSON-RPC. Các kết quả thành công hiện đại mang `resultType`.

Các phiên bản đến `2025-11-25` sử dụng thời kỳ khởi tạo trước đó. Một kết quả cũ không có `resultType` chỉ được diễn giải là hoàn tất sau khi client đã chọn thời kỳ trước đó.

Đừng tạo một bộ xác thực dễ dãi chấp nhận đồng thời cả hai dạng. Sử dụng hai nhánh:

| Nhánh | Bằng chứng đầu vào | Thiếu `resultType` | Khởi tạo |
|---|---|---|---|
| Hiện đại | `server/discover` thành công hoặc phản hồi hiện đại đã nhận diện | Không hợp lệ | Không phải đường đi mặc định |
| Cũ | Danh sách cho phép được cấu hình cộng với một kết quả `initialize` cũ hợp lệ sau một lần thăm dò hiện đại không kết luận được | Được diễn giải là hoàn tất | Được thời kỳ đó yêu cầu |

Sự tách biệt ngăn một đối tác hiện đại sai định dạng được thưởng bằng việc xác thực yếu hơn.

### Strict mode

Chế độ nghiêm ngặt yêu cầu bằng chứng về hành vi hiện đại. Một `server/discover` thành công chứng minh nhánh hiện đại. Một lỗi JSON-RPC hiện đại đã nhận diện cũng chứng minh điều đó. Sửa yêu cầu hoặc dừng lại. Không bao giờ hạ cấp vì máy chủ trả về `-32020`, `-32021` hoặc `-32022`.

### Fallback mode

Chế độ dự phòng thực hiện một lần thăm dò hiện đại có giới hạn. Hết thời gian chờ, trả lời rỗng, kết nối đóng hoặc phản hồi không nhận diện được là không kết luận được. Điều đó không chứng minh đối tác là cũ. Chỉ một endpoint được cấu hình rõ ràng hoặc đưa vào danh sách cho phép để tương thích mới có thể nhận một lần thăm dò cũ có giới hạn sau đó, và client chỉ chọn nhánh cũ sau khi xác thực kết quả `initialize` và bản sửa đổi cũ được thương lượng của lần thăm dò đó.

Dự phòng không phải là “thử kiểu cũ sau bất kỳ lỗi nào.” Một lỗi hiện đại đã nhận diện chứa thông tin sửa chữa hữu ích. Hạ cấp sau lỗi đó có thể che giấu một sự không khớp header, khai báo khả năng bị thiếu hoặc phiên bản không được hỗ trợ.

Điều này ngăn kẻ tấn công, sự cố ngừng hoạt động hoặc proxy lọc ép hạ cấp bằng cách loại bỏ phản hồi hiện đại. Ghi lại cùng nhau chính sách endpoint, quan sát hiện đại không kết luận được, bằng chứng cũ khẳng định chính xác và thời kỳ được chọn.

Ghi lại thời kỳ được chọn bên cạnh mỗi bản ghi. Không có thông tin đó, một trường bị thiếu có thể trông chấp nhận được trong một lần chạy kiểm thử và không hợp lệ trong lần khác.

## Build a Transcript Corpus

Một mẫu bản ghi ghi lại những gì đi qua ranh giới, chứ không chỉ lời gọi SDK:

```json
{
  "name": "golden-modern-list",
  "era": "modern",
  "headers": {
    "MCP-Protocol-Version": "2026-07-28",
    "Mcp-Method": "tools/list"
  },
  "request": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {
      "_meta": {
        "io.modelcontextprotocol/protocolVersion": "2026-07-28",
        "io.modelcontextprotocol/clientCapabilities": {}
      }
    }
  },
  "responseStatus": 200,
  "responseBody": {
    "jsonrpc": "2.0",
    "id": 1,
    "result": {
      "resultType": "complete",
      "tools": []
    }
  }
}
```

Giữ hai lớp mẫu.

### Golden transcripts

Các bản ghi chuẩn chứng minh hành vi được chấp nhận:

- yêu cầu khám phá hoặc phương thức hiện đại với siêu dữ liệu và header khớp nhau
- kết quả hoàn tất với các trường bắt buộc
- kết quả `input_required` khi phương thức có thể yêu cầu thêm đầu vào
- kết quả phần mở rộng chỉ sau khi khả năng tương ứng đã được công bố
- kết quả cũ không có `resultType`, nhưng chỉ trong thời kỳ cũ được chọn
- xử lý thông báo không có phản hồi JSON-RPC

Một bản ghi chuẩn phải chính xác, không phải lớn. Giữ các ID và dấu thời gian biến động mang tính xác định hoặc chuẩn hóa chúng trước khi so sánh.

### Negative transcripts

Các bản ghi âm tính chứng minh hành vi từ chối:

- header và body không khớp
- thiếu khả năng cho từng yêu cầu
- phiên bản giao thức khớp nhưng không được hỗ trợ
- thiếu `resultType` hiện đại
- `resultType` không xác định hoặc chưa được công bố
- `jsonrpc` của phản hồi khác `2.0` hoặc một ID khác về giá trị hoặc kiểu JSON
- một phản hồi chứa cả `result` và `error`, hoặc không chứa cái nào
- một lỗi không có `code` kiểu số nguyên và `message` kiểu chuỗi
- một lỗi giao thức đã biết được ánh xạ sang trạng thái HTTP sai
- phản hồi được phát ra cho một thông báo
- phong bì JSON-RPC sai định dạng
- proxy gộp một lỗi giao thức

Với mỗi trường hợp âm tính, khẳng định ranh giới từ chối và mã lỗi ổn định. “Lời gọi thất bại” là quá yếu. Một lỗi 500 do proxy tạo ra và một `-32020` từ nguồn đều có thể trông như thất bại trong khi kể cho người vận hành những câu chuyện hoàn toàn khác nhau.

Mẫu không khớp header phải bao gồm phản hồi JSON-RPC HTTP 400 thực tế của máy chủ với ID yêu cầu khớp và mã lỗi `-32020`. Tự động thực thi điều đó bất cứ khi nào bộ xác thực cục bộ quan sát thấy `HeaderMismatch`; đừng biến việc xác minh phản hồi thành một cờ mẫu tùy chọn. Một trường hợp có HTTP 500 và không có body là thất bại ngay cả khi mã từ chối cục bộ đúng. Một bộ kiểm thử dừng sau khi bộ xác thực yêu cầu của chính nó ném ngoại lệ chỉ kiểm thử chính nó, chứ không phải hành vi trên đường truyền của máy chủ.

Dự án kiểm thử tuân thủ MCP chính thức hữu ích như một bộ kiểm thử bên ngoài và tài liệu tham chiếu có phiên bản. Cũng giữ các bản ghi cục bộ của bạn. Chúng ghi lại proxy, SDK, xác thực, phần mở rộng và đường phát hành của bạn, những điều một bộ kiểm thử tổng quát không thể biết.

## Header Values Must Match the RPC Body

Trong Streamable HTTP hiện đại, các trung gian có thể định tuyến hoặc thực thi chính sách bằng các header phản chiếu. Body JSON-RPC vẫn là nguồn sự thật của giao thức. Một sự không khớp là lỗi tính toàn vẹn, không phải gợi ý để chọn một giá trị.

Xác thực theo thứ tự này:

1. Phân tích và xác thực phong bì JSON-RPC cùng các kiểu siêu dữ liệu.
2. So sánh `MCP-Protocol-Version` với `params._meta.io.modelcontextprotocol/protocolVersion`.
3. So sánh `Mcp-Method` với `method`.
4. Khi phương thức có một tên định tuyến, so sánh `Mcp-Name` với giá trị body tương ứng.
5. Sau khi tính bằng nhau được thiết lập, quyết định liệu phiên bản và tập khả năng khớp có được hỗ trợ không.

Thứ tự này phân biệt sự không khớp `-32020` với phiên bản không được hỗ trợ `-32022`. Nó cũng ngăn một gateway cấp quyền cho tên trong header trong khi nguồn thực thi một tên khác trong body.

Tên trường HTTP không phân biệt chữ hoa chữ thường, trong khi giá trị của chúng vẫn phân biệt chữ hoa chữ thường. Chuẩn hóa tên header trước khi tra cứu và từ chối các bản trùng lặp xung đột. Với một `Mcp-Name` không an toàn, không phải ASCII hoặc có khoảng trắng đầu hay cuối, giải mã chính xác dấu hiệu `=?base64?{Base64EncodedValue}?=` UTF-8 trước khi so sánh nó với body. Từ chối một dấu hiệu không hoàn chỉnh, Base64 không hợp lệ, UTF-8 không hợp lệ hoặc giá trị thô không an toàn bằng `-32020`. Khoảng trắng bao quanh ở dạng thô là không hợp lệ ngay cả khi body chứa cùng các ký tự vì giá trị đó yêu cầu mã hóa bằng dấu hiệu trước khi truyền.

Một trung gian có thể từ chối HTTP sai định dạng trước khi yêu cầu đến máy chủ MCP, vì vậy lỗi của nó có thể là một lỗi HTTP không có JSON-RPC. Ghi lại liệu sự từ chối đến từ trung gian hay nguồn. Máy chủ MCP nguồn nên sử dụng hợp đồng lỗi giao thức khi nó đã xử lý một yêu cầu JSON-RPC hợp lệ.

## Unknown Fields Are Not Unknown Results

Khả năng tương thích về sau yêu cầu hai quy tắc khác nhau.

### Additive unknown fields

Các đối tượng kết quả và bản đồ `_meta` có thể có thêm trường. Một bộ xác thực nên giữ lại hoặc bỏ qua một trường bổ sung theo vai trò của nó, trừ khi trường đó vi phạm một hợp đồng dành riêng. Ví dụ giữ kết quả thô đầy đủ trong bằng chứng và chấp nhận `futureHint` bên cạnh một kết quả đã biết.

Nếu bạn là một proxy trong suốt, giữ lại một trường không xác định thường an toàn hơn loại bỏ nó. Nếu bạn là một client ứng dụng, bỏ qua nó có thể hợp lệ. Kiểm thử so sánh khác biệt của bạn vẫn nên cho thấy SDK đã bỏ qua nó để hành vi là có chủ ý.

### Unknown `resultType`

`resultType` là một trường phân biệt. Các kết quả hiện đại cốt lõi sử dụng `complete` hoặc `input_required`. Một phần mở rộng chỉ có thể thêm một giá trị khác khi khả năng của nó đã được công bố. Ví dụ, phần mở rộng Tasks có thể thêm `task` trong ngữ cảnh khả năng được thương lượng đó.

Một trường phân biệt không xác định hoặc chưa được công bố không thể được coi là hoàn tất một cách an toàn. Client không biết vòng đời mà nó sẽ loại bỏ. Hãy từ chối nó.

Vì vậy, cùng một phản hồi thô có thể chứa một trường không xác định chấp nhận được và một kiểu kết quả không xác định không chấp nhận được. Kiểm thử cả hai trường hợp.

Trường phân biệt chỉ là lớp đầu tiên. Xác thực payload dành riêng cho phương thức sau đó. Một kết quả `tools/list` hoàn tất cần một mảng `tools` có các bộ mô tả với tên duy nhất không rỗng, mô tả hữu ích và các giá trị `inputSchema` có gốc là đối tượng. Một kết quả `task` chỉ hợp lệ cho một `tools/call` đủ điều kiện với khả năng Tasks và yêu cầu `taskId`, trạng thái đã biết, dấu thời gian tạo và cập nhật, cùng `ttlMs`, cộng với khoảng thăm dò tùy chọn hợp lệ. Một kết quả `completion/complete` hoàn tất yêu cầu một đối tượng `completion` với không quá 100 giá trị chuỗi, một `total` kiểu số nguyên không âm tùy chọn không nhỏ hơn các giá trị được trả về, và một `hasMore` kiểu Boolean tùy chọn. Một `resultType` viết đúng không thể làm cho một payload sai định dạng trở nên tuân thủ.

## The Notification Invariant

Một thông báo JSON-RPC không có `id`. Bên nhận không được gửi phản hồi thành công hoặc lỗi JSON-RPC.

Với một dạng thông báo HTTP được chấp nhận, bộ kiểm thử mong đợi một HTTP `202` với body rỗng. MCP `2026-07-28` không định nghĩa thông báo cốt lõi nào từ client đến máy chủ qua Streamable HTTP. Ví dụ sử dụng một thông báo phần mở rộng khóa học có không gian tên chỉ để kiểm thử bất biến của bộ tuần tự hóa một chiều. Đừng trình bày nó như một phương thức cốt lõi mới.

Kiểm thử bộ tuần tự hóa, chứ không chỉ bộ xử lý. Một bộ xử lý có thể trả về `None` trong khi middleware bọc nó trong một đối tượng JSON thành công. Ghi lại các byte đầu ra cuối cùng.

## Add an SDK Differential

Các SDK thường chuyển các đối tượng trên đường truyền thành các kiểu ngôn ngữ tiện lợi. Điều đó hữu ích, nhưng một đối tượng đã chuẩn hóa không thể chứng minh những gì đã nhận được.

Với mỗi mẫu rủi ro cao, ghi lại:

1. Trạng thái, header và body phản hồi thô trước khi SDK giải mã.
2. Giá trị trả về hoặc ngoại lệ được SDK chuẩn hóa.
3. Phép chiếu ngữ nghĩa được mong đợi cho thời kỳ được chọn.
4. Các trường được SDK đưa lên, tổng hợp, loại bỏ hoặc thay đổi.

Ví dụ cho phép việc chỉ SDK loại bỏ các trường ghi sổ trên đường truyền đã biết như `resultType`, `_meta`, `ttlMs` và `cacheScope` trong khi so sánh payload ứng dụng. Nó báo cáo một `futureHint` bị loại bỏ vì trường ngữ nghĩa không xác định đó đã biến mất.

Đừng cho rằng mọi khác biệt đều là một lỗi SDK. Mục đích là làm cho phép biến đổi trở nên nhìn thấy được. Quyết định liệu thành phần của bạn là một endpoint ứng dụng, có thể bỏ qua một trường bổ sung, hay một trung gian trong suốt, nên giữ lại nó.

Chạy phép so sánh khác biệt đối với mọi SDK và phiên bản bạn phân phối. Nếu hai SDK chuẩn hóa cùng một bản ghi theo cách khác nhau, chính sách phát hành nên nêu hành vi nào chấp nhận được thay vì chọn đầu ra thuận tiện nhất sau đó.

## Capture Proxy Evidence

Hầu hết các lỗi MCP trong sản xuất xảy ra qua nhiều hơn một tiến trình. Ghi lại ba dạng xem:

| Dạng xem | Bằng chứng tối thiểu |
|---|---|
| Đầu vào | header yêu cầu, body JSON-RPC, kiểu nội dung, tuyến đã xác thực, thời gian nhận |
| Nguồn | header được chuyển tiếp và digest của body, trạng thái nguồn, header và body phản hồi |
| Đầu ra | trạng thái, header, body mà client nhìn thấy và thời gian gửi |

Ví dụ phát hiện hai phép biến đổi thường gặp:

- một lỗi JSON-RPC HTTP 400 hoặc 404 từ nguồn trở thành một lỗi 500 proxy chung
- body JSON-RPC đầu ra khác với body nguồn

Thêm các khẳng định dành riêng cho triển khai về kiểu nội dung, `Accept`, nén, SSE trong phạm vi yêu cầu, header bộ nhớ đệm và tương quan trace. Ghi lại cả hai phía của điểm kết thúc TLS khi chính sách cho phép. Không bao giờ ghi log thông tin xác thực chỉ để chứng minh đường đi.

## Redact Before Evidence Leaves Memory

Che dữ liệu là một phần của vận hành tuân thủ, không phải một công việc dọn dẹp về sau. Áp dụng nó trước khi tuần tự hóa, băm, ghi log, tạo sản phẩm kiểm thử hoặc tải lỗi lên.

Ví dụ chuyển tên khóa về cùng kiểu chữ và loại bỏ các dấu phân cách trước khi khớp, rồi thay thế đệ quy các giá trị dưới các khóa như `Authorization`, `Cookie`, `Set-Cookie`, `X-Api-Key`, `accessToken`, `clientSecret`, `registrationAccessToken`, `token`, `password`, `secret` và `api_key`. Chuẩn hóa và danh sách từ chối phải sử dụng cùng một dạng để các biến thể camelCase, có gạch nối, có gạch dưới và có dấu chấm không thể vượt qua chính sách của nhau. Một bộ thu thập trong sản xuất nên thêm chính sách đối số dành riêng cho phương thức, vì một khóa vô hại như `query` vẫn có thể chứa dữ liệu cá nhân hoặc chịu quản lý.

Băm bundle bằng chứng đã che dữ liệu. Chỉ giữ các bản ghi thô trong một hệ thống ngắn hạn được phê duyệt khi một cuộc điều tra cụ thể yêu cầu chúng. Một digest chứng minh bundle đã che dữ liệu nào dẫn đến quyết định; nó không tiết lộ giá trị bị loại bỏ.

## Make Health and Rollback Part of the Gate

Tuân thủ giao thức là cần thiết nhưng chưa đủ để phát hành. Một ứng viên tuân thủ vẫn có thể hết thời gian chờ, rò rỉ bộ nhớ hoặc làm quá tải một phụ thuộc.

Xác định một cửa sổ tình trạng hoạt động trước khi triển khai:

- số mẫu tối thiểu
- tỷ lệ lỗi tối đa
- phân vị độ trễ tối đa
- mức bão hòa hoặc giới hạn tài nguyên
- thời lượng quan sát
- so sánh với đường cơ sở đã được tiếp nhận

Cũng xác định bằng chứng khôi phục trước khi triển khai:

- phiên bản trước chính xác
- digest bằng chứng tiếp nhận
- các ghim SHA-256 của sản phẩm và bộ mô tả
- trạng thái Registry hiện tại
- kết quả tình trạng hoạt động hiện tại
- quy trình khôi phục tuyến
- một chứng thực trên chính xác các trường đó từ một danh tính bộ điều khiển phát hành đáng tin cậy

Yêu cầu đích khôi phục đó được xác minh và hoạt động tốt trước khi đưa lên, không chỉ sau khi ứng viên thất bại. Một bản phát hành thành công mà không có đường phục hồi sử dụng được thì chưa sẵn sàng cho sản xuất.

Nếu một ứng viên thất bại và đích khôi phục thiếu bằng chứng đó, giữ lưu lượng thay vì đoán. “Khôi phục về bất cứ thứ gì đã ở đó” không phải là một biện pháp kiểm soát vận hành.

Đừng rút gọn sự sẵn sàng thành các kiểm tra tính đúng như một phiên bản không rỗng, `healthy: "yes"` hoặc một chuỗi bằng chứng tùy ý. Ví dụ yêu cầu các kiểu chính xác, một trạng thái hoạt động, ba digest SHA-256, một bên ký đáng tin cậy và một chứng thực HMAC-SHA-256 hợp lệ trên toàn bộ payload khôi phục. Khóa demo mang tính xác định của nó là một mẫu không bí mật. Đưa một khóa được bảo vệ, kết quả xác minh KMS hoặc bộ xác minh chứng thực khóa công khai vào ranh giới phát hành trong sản xuất.

Cổng phát hành cũng từ chối bằng chứng bản ghi, so sánh khác biệt SDK hoặc proxy rỗng. Mỗi nguồn phải mang các digest bằng chứng hợp lệ. Một cửa sổ tình trạng hoạt động xanh không thể lấp đầy một ranh giới chưa từng được quan sát.

## Build It

Chạy bộ kiểm thử dùng thư viện chuẩn:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
```

Bản demo chạy chính xác mười lăm bản ghi chuẩn và âm tính, bao gồm các kết quả hoàn thành hợp lệ và sai định dạng, so sánh một kết quả thô với một dạng xem SDK, kiểm tra một proxy đã gộp một lỗi nguồn, đánh giá tình trạng hoạt động, xác thực bằng chứng khôi phục và chọn đích đó.

Dạng được mong đợi:

```json
{
  "transcriptsPassed": 15,
  "transcriptsTotal": 15,
  "sdkDroppedFields": ["futureHint"],
  "proxyIssues": [
    "proxy collapsed a protocol error into HTTP 500",
    "proxy changed the origin JSON-RPC body"
  ],
  "releaseAction": "rollback",
  "evidenceDigest": "..."
}
```

Đọc `code/main.py` theo thứ tự này:

1. `validate_request()` thực thi các quy tắc yêu cầu và header dành riêng cho từng thời kỳ.
2. `validate_result()` tách biệt các trường phân biệt cũ bị thiếu, giá trị hiện đại hợp lệ, phần mở rộng và giá trị không xác định.
3. `select_era()` triển khai chính sách nghiêm ngặt và dự phòng có giới hạn.
4. `run_transcript()` đánh giá các mẫu chuẩn và âm tính.
5. `compare_sdk_view()` phơi bày các khác biệt chuẩn hóa.
6. `inspect_proxy()` so sánh bằng chứng đầu vào, nguồn và đầu ra.
7. `redact()` loại bỏ các bí mật rõ ràng trước khi băm bằng chứng.
8. `rollback_evidence_ready()` xác thực các trường ghim chính xác và chứng thực phát hành đáng tin cậy.
9. `ReleaseGate.evaluate()` kết hợp bằng chứng tuân thủ, SDK, proxy, tình trạng hoạt động và khôi phục không rỗng.

## Use It

Chạy bộ kiểm thử tại bốn điểm:

1. Trên mỗi thay đổi triển khai với một bộ điều hợp kiểm thử trong tiến trình.
2. Đối với các tệp nhị phân client và máy chủ đã xây dựng qua phương thức truyền tải thực.
3. Qua proxy hoặc gateway đã triển khai trong một môi trường staging.
4. Trong quá trình triển khai canary với bằng chứng tình trạng hoạt động và khôi phục trực tiếp.

Giữ cùng các tên trường hợp ổn định xuyên suốt các lớp. `negative-header-body-mismatch` nên có nghĩa là cùng một bất biến trong các báo cáo đơn vị, đầu cuối, proxy và canary. Digest bằng chứng sẽ khác vì ranh giới đã thay đổi; yêu cầu thì không nên thay đổi.

Lưu các schema mẫu trong hệ thống quản lý phiên bản. Lưu bằng chứng chạy đã che dữ liệu trong hệ thống phát hành của bạn. Chỉ lưu các bản ghi thô ngắn hạn dưới các biện pháp kiểm soát truy cập sự cố.

## Interactive Lab

### Lab A: prove the era boundary

Từ thư mục `code`, mở Python:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations/code
python3 -q
```

Chạy:

```python
from main import *
validate_result({"tools": []}, "legacy")
validate_result({"tools": []}, "modern")
```

Lời gọi cũ suy ra `complete`. Lời gọi hiện đại phát sinh `ProtocolViolation`. Bây giờ kiểm thử cơ chế dự phòng:

```python
select_era({"kind": "timeout"}, "fallback")
select_era(
    {"kind": "timeout"},
    "fallback",
    legacy_allowed=True,
    legacy_evidence={"kind": "initialize_success", "protocolVersion": LEGACY_VERSION},
)
select_era({"kind": "jsonrpc_error", "code": -32021}, "fallback")
```

Lần hết thời gian chờ đầu tiên thất bại theo hướng đóng vì sự im lặng không phải bằng chứng cũ. Lời gọi thứ hai chỉ chọn kiểu cũ vì cấu hình cho phép và một kết quả khởi tạo cũ hợp lệ đã được quan sát. Lỗi thiếu khả năng đã nhận diện chứng minh nhánh hiện đại.

### Lab B: additive field versus discriminator

```python
validate_result({"resultType": "complete", "tools": [], "futureHint": True}, "modern")
validate_result({"resultType": "future_mode", "tools": []}, "modern")
```

Kết quả đầu tiên giữ lại `futureHint`. Kết quả thứ hai bị từ chối vì trường phân biệt vòng đời không xác định.

### Lab C: inspect an SDK transformation

```python
compare_sdk_view(
    {"resultType": "complete", "tools": [], "futureHint": {"mode": "new"}},
    {"tools": []},
)
```

Quyết định liệu thành phần của bạn có thể bỏ qua `futureHint` hay phải chuyển tiếp nó. Ghi lựa chọn đó vào chính sách phát hành. Đừng âm thầm xóa sự khác biệt.

### Lab D: repair the proxy

Sửa trao đổi demo để đầu ra giữ nguyên trạng thái và body nguồn. Chạy lại `python3 main.py`. Các vấn đề proxy sẽ biến mất, nhưng sự khác biệt SDK vẫn chặn việc đưa lên. Sau đó đưa `futureHint` vào dạng xem SDK và quan sát hành động thay đổi thành `promote` khi mọi nguồn bằng chứng đều đạt.

## Practice Lab

Thêm các bản ghi SSE trong phạm vi yêu cầu vào bộ kiểm thử.

Các yêu cầu:

- Ghi lại trạng thái phản hồi, kiểu nội dung, các sự kiện SSE có thứ tự và việc kết thúc luồng.
- Chứng minh mỗi sự kiện JSON-RPC có một kết quả hoặc lỗi hợp lệ dành riêng cho thời kỳ.
- Thêm một trường hợp âm tính cho một proxy lưu đệm toàn bộ luồng trước khi chuyển tiếp.
- Thêm một trường hợp âm tính cho một sự kiện SSE có id JSON-RPC khác với yêu cầu.
- Che dữ liệu sự kiện trước khi ghi bằng chứng.
- Đưa thời lượng luồng, độ trễ sự kiện đầu tiên và số sự kiện vào cửa sổ tình trạng hoạt động.
- Làm cho cổng phát hành chỉ chọn một đích khôi phục có bằng chứng khi luồng thất bại.

Thành công có nghĩa là cùng một trường hợp chạy trực tiếp và qua proxy, với một báo cáo xác định chính xác ranh giới đã thay đổi hành vi.

## Shipped Artifact

Bài học này cung cấp `outputs/skill-mcp-conformance-release-gate.md`. Sử dụng nó để biến một thay đổi máy chủ, client, gateway hoặc SDK thành một ma trận tuân thủ có phiên bản và quyết định phát hành. Sản phẩm yêu cầu bằng chứng dữ liệu truyền thô, các trường hợp âm tính, lựa chọn thời kỳ rõ ràng, các khác biệt SDK, bằng chứng proxy, che dữ liệu, ngưỡng tình trạng hoạt động và bằng chứng khôi phục.

## Verify It

Chạy bản demo và bộ kiểm thử mang tính xác định:

```bash
cd phases/13-tools-and-protocols/31-mcp-conformance-versioning-and-operations
python3 code/main.py
python3 -m unittest discover -s code/tests -v
```

Việc xác minh nên chứng minh:

- mọi bản ghi chuẩn và âm tính được đưa vào đều đạt kết quả được mong đợi
- các yêu cầu hiện đại yêu cầu các khóa siêu dữ liệu có không gian tên chính xác
- tên header HTTP được khớp không phân biệt chữ hoa chữ thường và các giá trị `Mcp-Name` đã mã hóa được giải mã chính xác
- sự không khớp header và body trả về mã không khớp hiện đại
- phiên bản phản hồi, ID, tính loại trừ giữa kết quả hoặc lỗi, dạng lỗi và ánh xạ HTTP được xác thực
- các yêu cầu payload danh sách công cụ, tác vụ và hoàn thành dành riêng cho phương thức được thực thi
- mọi `HeaderMismatch` được quan sát đều yêu cầu một phản hồi JSON-RPC HTTP 400 `-32020` thực tế
- khoảng trắng `Mcp-Name` thô bị từ chối trong khi khoảng trắng được mã hóa bằng dấu hiệu chính xác đi và về nguyên vẹn
- một `resultType` bị thiếu chỉ hợp lệ trong thời kỳ cũ được chọn
- các trường bổ sung vượt qua xác thực thô trong khi các kiểu kết quả không xác định thất bại
- các kiểu kết quả phần mở rộng yêu cầu khả năng đã công bố của chúng
- các lỗi hiện đại đã nhận diện không bao giờ gây ra cơ chế dự phòng cũ
- các thông báo không tạo phản hồi JSON-RPC
- việc loại bỏ các trường ghi sổ của SDK và mất trường ngữ nghĩa được phân biệt
- việc proxy gộp lỗi được phát hiện và thông tin xác thực được che đệ quy xuyên suốt các biến thể camelCase và dấu phân cách
- việc đưa lên yêu cầu bằng chứng bản ghi, SDK, proxy không rỗng và bằng chứng vận hành tốt
- việc đưa lên và khôi phục đều yêu cầu một đích khôi phục đã xác thực, được ghim, đang hoạt động và hoạt động tốt

## Production Failure Modes

| Lỗi | Kiểm thử yếu báo cáo gì | Bộ kiểm thử phải chứng minh điều gì |
|---|---|---|
| SDK tổng hợp một trường phân biệt bị thiếu | “tools/list đạt” | Kết quả hiện đại thô thiếu `resultType` và không hợp lệ |
| Client hạ cấp sau `-32021` | “thử lại kiểu cũ hoạt động” | Lỗi hiện đại đã nhận diện cấm cơ chế dự phòng |
| Kiểu kết quả không xác định được coi là hoàn tất | “phản hồi đã được phân tích” | Trường phân biệt vòng đời chưa được công bố bị từ chối |
| Proxy cấp quyền cho một công cụ và nguồn thực thi công cụ khác | “yêu cầu đã đến máy chủ” | `Mcp-Name` bằng tên định tuyến trong body tại mọi chặng |
| Bộ kiểm thử ném ngoại lệ trước khi đọc phản hồi máy chủ | “kiểm thử không khớp header đạt” | Phản hồi HTTP 400 và JSON-RPC `-32020` được ghi lại và xác thực |
| Proxy biến lỗi 400 từ nguồn thành lỗi 500 chung | “lỗi thượng nguồn” | Các trạng thái và body JSON-RPC nguồn và đầu ra được giữ nguyên |
| Middleware thông báo phát ra `{result: null}` | “bộ xử lý trả về none” | Body đầu ra cuối cùng rỗng và không tồn tại phản hồi JSON-RPC |
| SDK loại bỏ một trường bổ sung | “các đối tượng có kiểu khớp nhau” | Dạng xem thô và chuẩn hóa cho thấy chính xác trường bị loại bỏ |
| Sản phẩm lỗi làm rò rỉ một bearer token | “bundle gỡ lỗi đã được tải lên” | Việc che dữ liệu diễn ra trước khi băm, ghi log hoặc tải lên |
| Kiểu khóa thông tin xác thực vượt qua việc che dữ liệu | “danh sách từ chối chứa api_key” | Các biến thể CamelCase và dấu phân cách chia sẻ một dạng danh sách từ chối chuẩn duy nhất |
| Canary không có mẫu nhưng trông hoạt động tốt | “không có lỗi” | Số mẫu tối thiểu được thực thi |
| Khôi phục chọn một bản dựng không xác định | “triển khai trước đã được khôi phục” | Phiên bản đích, digest tiếp nhận, các ghim, trạng thái và tình trạng hoạt động hiện diện |

## Operational Rule

Kiểm thử các byte bạn gửi, các byte mà mọi trung gian chuyển tiếp, ngữ nghĩa mà mỗi SDK phơi bày và bằng chứng mà bộ phận vận hành sẽ sử dụng dưới áp lực. Tương thích là một nhánh rõ ràng. Khôi phục là một hành động phát hành có bằng chứng hỗ trợ. Không điều nào nên là một tác dụng phụ vô tình của một bộ phân tích dễ dãi.

## Further Reading

- [MCP 2026-07-28 base protocol](https://modelcontextprotocol.io/specification/2026-07-28/basic)
- [MCP version negotiation](https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [Official MCP conformance project](https://github.com/modelcontextprotocol/conformance)
