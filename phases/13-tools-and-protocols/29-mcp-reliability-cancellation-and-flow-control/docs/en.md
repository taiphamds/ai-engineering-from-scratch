# MCP Reliability, Cancellation, and Flow Control

> ID yêu cầu liên hệ thông điệp. Không làm tác dụng phụ an toàn, dừng worker hoặc bảo vệ luồng khỏi bên tiếp nhận chậm.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 13, Lessons 09 and 13
**Time:** ~120 minutes

## Learning Objectives

- Triển khai đúng tín hiệu hủy cho stdio và Streamable HTTP.
- Giải quyết tranh chấp hoàn tất và hủy không gửi thông điệp sau hủy.
- Tách hủy yêu cầu khỏi ngữ nghĩa `tasks/cancel` bền vững.
- Xây quyết định thử lại từ tác dụng phụ và khóa lũy đẳng tường minh.
- Giới hạn hàng đợi tiến độ trong khi giữ phản hồi cuối.
- Phục hồi luồng qua kết nối lại, lấy lại và backoff có jitter.

## The Problem

Nhánh thành công giấu lỗi hệ thống phân tán đắt nhất.

Client gọi công cụ. Máy chủ bắt đầu làm. Tiến độ đến. Proxy đệm luồng. Client hết thời gian và ngắt kết nối. Máy chủ xong sau một mili giây. Client thử lại với id JSON-RPC mới. Thay đổi chạy hai lần.

Mọi thành phần hành xử cục bộ. Hệ thống thất bại toàn cục.

MCP định nghĩa hành vi thông điệp và vận chuyển, nhưng ứng dụng vẫn sở hữu:

- ngân sách thời gian;
- tính lũy đẳng nghiệp vụ;
- hàng đợi có giới hạn;
- phân loại thử lại;
- trạng thái tác vụ bền vững;
- chính sách kết nối lại và lấy lại.

Bài này xây quyết định vào mô phỏng tất định. Không có
sleep, socket hoặc thất bại ngẫu nhiên. Bạn kiểm soát thứ tự sự kiện hủy
trực tiếp. Một kiểm thử luồng đồng bộ ép hai client sổ cùng tranh
một khóa lũy đẳng.

## Request Cancellation Is Transport-Specific

Ý định giống trên mọi vận chuyển: client không còn cần kết quả đang xử lý. Tín hiệu đường truyền khác.

### stdio

stdio dùng một kênh hai chiều dùng chung. Client gửi thông báo:

```json
{
  "jsonrpc": "2.0",
  "method": "notifications/cancelled",
  "params": {
    "requestId": 41,
    "reason": "User closed the operation"
  }
}
```

Thông báo gửi rồi quên. Máy chủ không phát phản hồi JSON-RPC cho nó.

Máy chủ nên dừng công việc, giải phóng tài nguyên và tránh gửi phản hồi cho yêu cầu hủy. Có thể bỏ hủy khi yêu cầu không biết, đã xong hoặc không dừng an toàn được.

Thông báo hủy sai dạng, không biết và đã hoàn tất bị bỏ qua. Biến tranh chấp đó thành lỗi mới tạo thêm tranh chấp.

### Streamable HTTP

Streamable HTTP hiện đại cho mỗi yêu cầu phản hồi HTTP hoặc luồng phản hồi SSE riêng. Client hủy bằng đóng luồng phản hồi yêu cầu đó.

Không POST `notifications/cancelled` cho yêu cầu HTTP thường. Đóng luồng là tín hiệu hủy.

Khi máy chủ quan sát ngắt kết nối, nên dừng công việc và không được gửi thêm thông điệp cho yêu cầu đó.

### Server-sent cancellation is narrow

Máy chủ không dùng `notifications/cancelled` để hủy lời gọi client tùy ý. Trên stdio, hủy do máy chủ gửi dành cho kết thúc yêu cầu `subscriptions/listen`. Giữ nhánh đó riêng hủy yêu cầu client thường.

## Cancellation Is a Race

Hai thứ tự sự kiện đều hợp lệ.

### Cancellation wins

```text
request starts
client sends cancellation signal
server marks request cancelled
worker reaches completion
server suppresses the response
```

### Completion wins

```text
request starts
worker commits the result
server sends the response
cancellation arrives late
server ignores the late notification
```

Client cũng phải bỏ phản hồi trễ cho yêu cầu đã bỏ. Độ trễ mạng nghĩa không bên nào chứng minh được bên kia quan sát sự kiện nào trước.

```figure
mcp-reliability-race
```

`RequestCoordinator` bài lưu một trạng thái kết thúc. `complete()` không trả phản hồi sau hủy. Hủy trễ không đổi bản ghi hoàn tất.

## Timeouts Need Two Clocks

Một bộ đếm bất hoạt không đủ.

Dùng hai giới hạn:

1. **Thời gian chờ nhàn rỗi.** Yêu cầu được không tạo hoạt động hữu ích bao lâu.
2. **Thời gian chờ tối đa.** Ngân sách thời gian thực tuyệt đối từ bắt đầu yêu cầu.

Tiến độ có thể đặt lại đồng hồ nhàn rỗi. Không bao giờ được bỏ thời hạn tối đa.

```text
start: 0 ms
progress: 400 ms
progress: 800 ms
progress: 1200 ms
idle timeout: 500 ms
maximum timeout: 2000 ms
```

Ở 1500 ms, yêu cầu còn hoạt động vì tiến độ mới nhất chỉ cũ 300 ms. Ở 2000 ms, thời hạn tối đa hủy dù sự kiện tiến độ khác đến ở 1999 ms.

Tiến độ tùy chọn. Máy chủ có thể nhận token tiến độ và không phát cập nhật. Không bao giờ biến có token thành chờ vô hạn.

Giá trị tiến độ MCP phải tăng. Thông báo dừng sau hoàn tất hoặc hủy. Giới hạn tốc độ tiến độ để worker nhanh không làm ngập vận chuyển.

## Request Cancellation Is Not `tasks/cancel`

Các cơ chế giải vòng đời khác.

| Cơ chế | Đích | Tín hiệu | Thành công nghĩa gì |
|-----------|--------|--------|--------------------|
| Hủy yêu cầu trên stdio | Một RPC đang xử lý | `notifications/cancelled` | Client bỏ yêu cầu; máy chủ nên dừng nếu thực tế cho phép |
| Hủy yêu cầu trên HTTP | Một luồng phản hồi đang xử lý | Đóng luồng | Client bỏ yêu cầu; máy chủ nên dừng nếu thực tế cho phép |
| `tasks/cancel` | Một Task bền vững | Yêu cầu MCP thường | Máy chủ xác nhận ý định hủy |

Kết quả `tasks/cancel` thành công không chứng minh worker dừng. Tác vụ có thể còn `working` đến khi điểm kiểm tra worker thấy cờ. Công việc có thể xong trước điểm đó.

Không xóa trạng thái tác vụ bền vững khi kết nối HTTP đóng. Lý do tạo Task là vòng đời vượt một yêu cầu và một kết nối.

## A New JSON-RPC ID Is Not Idempotency

Id JSON-RPC liên hệ yêu cầu và phản hồi. Không định danh thao tác nghiệp vụ.

Giả sử client gửi khoản thu với id `41`, mất phản hồi và thử lại id `42`. Máy chủ thấy hai thông điệp khác. Không khóa ứng dụng, không biết chúng biểu diễn một lần thanh toán.

Khóa lũy đẳng định danh ý định nghiệp vụ:

```json
{
  "name": "charge_account",
  "arguments": {
    "account": "acct-7",
    "cents": 1200,
    "idempotencyKey": "checkout-7"
  }
}
```

Máy chủ lưu:

- khóa;
- dấu vân tay đối số thao tác;
- kết quả đã commit.

Cùng khóa và cùng đối số trả kết quả lưu. Cùng khóa với đối số khác bị từ chối. Ngăn dùng lại khóa vô tình làm đổi thao tác nghiệp vụ khác.

### The ledger boundary must be atomic and durable

Chuỗi này không an toàn:

```text
check key
run mutation
store result
```

Hai worker đều có thể quan sát khóa thiếu và cùng chạy thay đổi. Sập
sau hiệu ứng nhưng trước lưu tạo cùng mơ hồ khi thử lại.

Bài dùng sổ SQLite dựa file. `BEGIN IMMEDIATE` tuần tự hóa
kiểm tra khóa, hiệu ứng nghiệp vụ mô phỏng, bộ đếm thực thi và kết quả lưu vào
một giao dịch. Vì vậy hai kết nối sổ độc lập tranh cùng khóa
quan sát một kết quả commit và một lần thực thi. Đóng và mở lại
sổ giữ bản ghi đó.

Mọi giá trị trả dựng lại từ JSON lưu. Bên gọi không bao giờ nhận
đối tượng thay đổi được do sổ giữ, nên đổi từ điển trả không thể
làm hỏng kết quả phát lại sau.

Hiệu ứng nghiệp vụ mô phỏng là biên nhận và bộ đếm thực thi trong
cùng giao dịch SQLite. Thanh toán, triển khai hoặc lời gọi API ngoài thật
không thành nguyên tử chỉ bằng ghi bảng cục bộ. Sản xuất cần giao dịch
cơ sở dữ liệu dùng chung bền vững, transactional outbox hoặc nhà cung cấp phía trước
cưỡng chế cùng khóa lũy đẳng. Chỉ khóa tiến trình không bảo vệ
nhiều bản sao hoặc sống qua khởi động lại.

### Retry matrix

Phân loại thử lại trước triển khai.

| Lớp | Ví dụ | Quy tắc thử lại |
|------|---------|------------|
| An toàn | Đọc tất định không tác dụng phụ | Thử lại với id JSON-RPC mới sau hiểu ranh giới thất bại |
| Có điều kiện | Thay đổi với khóa lũy đẳng bền vững | Thử lại cùng khóa và đối số giống hệt |
| Không an toàn | Thay đổi không khử trùng nghiệp vụ | Không tự thử lại; đối soát trước |

Chú giải công cụ như `readOnlyHint` và `idempotentHint` vẫn là gợi ý không đáng tin. Hợp đồng ứng dụng và triển khai máy chủ quyết định an toàn thử lại.

## Backpressure Is Part of Correctness

Bên tạo SSE có thể tạo tiến độ nhanh hơn client, proxy hoặc mạng tiếp nhận được. Hàng đợi vô hạn biến chậm thành cạn bộ nhớ.

Dùng hàng đợi có giới hạn và định nghĩa mất được gì.

Tiến độ thay thế được. Giá trị tiến độ sau thay trước cho cùng token. Phản hồi JSON-RPC cuối không thay thế được.

Bộ đệm bài áp chính sách:

1. Gộp tiến độ liền kề cùng token.
2. Bỏ tiến độ cũ nhất khi đạt sức chứa.
3. Đánh dấu luồng cần lấy lại từ nguồn có thẩm quyền.
4. Giữ phản hồi cuối.
5. Từ chối trạng thái giữ phản hồi cuối đòi bỏ phản hồi cuối khác.

Đây là mất có giới hạn với phục hồi tường minh. Mất âm thầm không là chiến lược.

### Proxy buffering

Máy chủ có thể truyền luồng đúng trong khi reverse proxy giữ sự kiện trong bộ đệm.

Với phản hồi SSE, gửi:

```http
Content-Type: text/event-stream
Cache-Control: no-cache
X-Accel-Buffering: no
```

Đặc tả Streamable HTTP năm 2026 khuyến nghị `X-Accel-Buffering: no` để proxy tương thích phân phối sự kiện ngay.

Với luồng sống lâu yên, định kỳ phát bình luận SSE:

```text
:
```

Client bỏ dòng bình luận. Trung gian thấy lưu lượng và ít đóng kết nối nhàn hơn.

Keepalive không là tiến độ. Không đặt lại thời gian chờ nhàn ngữ nghĩa thao tác chỉ vì bình luận vận chuyển đến.

## Reconnect Means Refetch

Streamable HTTP hiện đại không hỗ trợ SSE tiếp tục qua `Last-Event-ID`.

Sau luồng `subscriptions/listen` rớt:

1. Mở yêu cầu listen mới với id JSON-RPC mới.
2. Khôi phục bộ lọc đăng ký mong muốn.
3. Lấy lại công cụ, tài nguyên, prompt hoặc Tasks bị ảnh hưởng từ phương thức có thẩm quyền.
4. Khử trùng trạng thái ứng dụng bằng định danh ổn định.
5. Không phát lại thay đổi không an toàn chỉ vì mất phản hồi.

Kế hoạch phục hồi mẫu đặt rõ `sendLastEventId` false và liệt kê tài nguyên lấy lại.

### Prevent a reconnect herd

Nếu 10,000 client kết nối lại đúng một giây, máy chủ đang phục hồi lại thất bại.

Dùng backoff hàm mũ có jitter và trần. Bài tính jitter tất định từ id client và số lần thử để kiểm thử tái hiện được:

```text
attempt 0: up to 250 ms
attempt 1: up to 500 ms
attempt 2: up to 1000 ms
...
cap: 8000 ms
```

Sản xuất có thể dùng ngẫu nhiên an toàn mật mã hoặc runtime. Bất biến là phân tán, không công thức cụ thể.

## Build It

`code/main.py` xây năm thành phần độ tin cậy nhỏ.

### `RequestCoordinator`

- bắt đầu yêu cầu đang xử lý với thời hạn nhàn và tối đa;
- phát thông báo tiến độ đơn điệu;
- tạo đúng tín hiệu hủy stdio hoặc HTTP;
- bỏ thông báo hủy không hợp lệ;
- làm tranh chấp kết thúc giữa hủy và hoàn tất tường minh;
- dành hủy máy chủ gửi cho đăng ký stdio.

### `MutationLedger`

- chứng minh hai id JSON-RPC thực thi hai lần không khóa nghiệp vụ;
- dùng giao dịch SQLite dựa file cho kiểm tra khóa, hiệu ứng mô phỏng,
  bộ đếm thực thi và commit kết quả;
- khử trùng đối số khớp dưới một khóa lũy đẳng qua kết nối
  sổ độc lập;
- từ chối một khóa dùng lại với đối số khác;
- trả bản sao phòng vệ và giữ bản ghi commit qua mở lại.

### `DurableTaskService`

- xác nhận yêu cầu hủy;
- giữ tác vụ `working` đến điểm kiểm tra worker;
- minh họa tại sao xác nhận không là trạng thái cuối.

### `BoundedSseBuffer`

- gộp hoặc bỏ tiến độ dưới áp lực;
- ghi cần lấy lại từ nguồn có thẩm quyền;
- không bao giờ bỏ phản hồi cuối.

### Recovery helpers

- trả header SSE an toàn proxy và bình luận keepalive;
- tạo kế hoạch kết nối lại và lấy lại;
- phân tán thử lại bằng backoff hàm mũ và jitter tất định.

## Use It

Từ thư mục gốc repo:

```bash
cd phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/code
python3 main.py
python3 -m unittest discover tests -v
```

Demo chạy cả hai phía tranh chấp trung tâm, thực thi thay đổi
khử trùng bằng giao dịch trong sổ dựa file tạm, làm quá tải bộ đệm
tiến độ có giới hạn và cho thấy Task bền vững chuyển từ xác nhận hủy
sang hủy worker quan sát.

## Interactive Lab

Chạy bốn thứ tự sự kiện không thêm sleep.

1. Bắt đầu yêu cầu `A`, hủy rồi gọi `complete()`.
2. Bắt đầu yêu cầu `B`, hoàn tất rồi đưa hủy đến.
3. Bắt đầu yêu cầu `C`, phát tiến độ trước mọi thời hạn nhàn rồi vượt thời hạn tối đa.
4. Bắt đầu yêu cầu `D` trên Streamable HTTP và đóng luồng phản hồi.

Ghi mỗi kịch bản:

- trạng thái yêu cầu kết thúc;
- có phản hồi cuối không;
- tín hiệu hủy đặt trên đường truyền;
- sự kiện nào client nên bỏ.

Rồi đổi `D` sang stdio. Thao tác giống hệt nhưng tín hiệu hủy phải đổi.

## Practice Lab

Thêm thay đổi `reserve_inventory` vào `MutationLedger`.

Yêu cầu:

1. Khóa gắn SKU, số lượng, tenant và tên thao tác.
2. Thử lại cùng khóa và đối số trả lần giữ hàng đầu.
3. Thử lại số lượng đổi thất bại không giữ hàng thêm.
4. Thực thi đã commit nhưng mất phản hồi đối soát theo khóa được.
5. Kết quả không ghi bí mật hoặc dữ liệu thanh toán.
6. Thử lại tự động tắt khi client không cho khóa.
7. Thêm rớt đăng ký mô phỏng và lấy lại bản ghi tồn kho trước quyết định làm gì tiếp.
8. Bắt đầu hai kết nối sổ tại barrier và gửi cùng khóa
   đồng thời. Xác nhận một lần giữ hàng được commit.
9. Sửa đối tượng giữ hàng trả đầu. Phát lại khóa và chứng minh
   kết quả lưu không đổi.
10. Đóng và mở lại file sổ rồi đối soát giữ hàng theo khóa.

Giữ lab trung thực: nếu tồn kho ở dịch vụ khác, giải thích liệu
dịch vụ đó nhận cùng khóa lũy đẳng hoặc transactional outbox
nối commit cục bộ với hiệu ứng từ xa.

## Shipped Artifact

`outputs/skill-mcp-reliability-reviewer.md` là skill đánh giá độ tin cậy phẳng. Cho thao tác MCP, vận chuyển, chính sách thời gian chờ, hành vi thử lại, chính sách hàng đợi và kế hoạch phục hồi. Trả bảng tranh chấp, phân loại thử lại, ranh giới lũy đẳng, kiểm tra kiểm soát luồng và fixture thất bại.

## Verify It

Bài hoàn tất khi tuyên bố này đúng:

- Hủy stdio gửi `notifications/cancelled` và không nhận phản hồi.
- Hủy Streamable HTTP đóng luồng yêu cầu và không gửi POST hủy.
- Hủy-trước-hoàn-tất chặn phản hồi cuối.
- Hoàn-tất-trước-hủy giữ phản hồi và bỏ hủy trễ.
- Tiến độ có thể đặt lại chờ nhàn nhưng không bao giờ chờ tối đa.
- Chỉ id JSON-RPC mới thực thi thay đổi lần nữa.
- Một khóa lũy đẳng và đối số giống hệt thực thi một lần trong tranh chấp
  đồng thời hai kết nối.
- Bản ghi commit sống qua mở lại và phát lại trả bản sao phòng vệ.
- Sửa một kết quả trả không đổi kết quả lưu được.
- Bộ đệm có giới hạn giữ trong sức chứa và giữ phản hồi cuối.
- Kết nối lại dùng yêu cầu mới, không gửi `Last-Event-ID` và lấy lại trạng thái bị ảnh hưởng.
- Xác nhận `tasks/cancel` để tác vụ chưa kết thúc đến khi worker thấy.

## Production Failure Modes

| Thất bại | Triệu chứng quan sát | Phản ứng đúng |
|---------|--------------------|------------------|
| Client HTTP POST thông báo hủy | Máy chủ và client bất đồng vòng đời yêu cầu | Đóng luồng phản hồi SSE của yêu cầu |
| Máy chủ trả sau hủy chấp nhận | Client nhận kết quả trễ không dùng được | Dừng làm và chặn thông điệp thêm khi hủy thắng |
| Tiến độ đặt lại mọi thời hạn | Công việc treo sống mãi | Giữ thời gian chờ tối đa tuyệt đối riêng |
| Id RPC mới coi là khử trùng | Thu tiền, triển khai hoặc xóa chạy hai lần | Thêm khóa lũy đẳng ứng dụng bền vững |
| Kiểm tra khóa và hiệu ứng riêng | Worker đồng thời cùng thấy khóa thiếu | Commit chiếm khóa, bản ghi hiệu ứng và kết quả nguyên tử |
| Sổ trong bộ nhớ dùng qua bản sao | Khởi động lại hoặc worker khác quên commit trước | Dùng lưu trữ bền vững chung hoặc lũy đẳng phía trước |
| Kết quả lưu thay đổi được trả trực tiếp | Bên gọi sửa làm hỏng phát lại sau | Tuần tự hóa kết quả commit và trả bản sao phòng vệ |
| Khóa dùng lại với đối số đổi | Một khóa là bí danh hai ý định nghiệp vụ | Lưu và so dấu vân tay đối số |
| Hàng đợi tiến độ không giới hạn | Bộ nhớ tăng với bên tiếp nhận chậm | Gộp và bỏ tiến độ thay thế được trong giới hạn |
| Phản hồi cuối bỏ dưới áp lực | Client không biết kết quả yêu cầu | Dành sức chứa hoặc đẩy tiến độ, không bao giờ phản hồi cuối |
| Proxy đệm SSE | Tiến độ đến thành đợt hoặc sau hết thời gian | Tắt đệm và cấu hình thời gian chờ proxy tương thích |
| Giả định `Last-Event-ID` | Client tiếp tục từ trạng thái máy chủ không hỗ trợ | Kết nối lại với yêu cầu mới và lấy lại |
| Mọi client kết nối lại ngay | Phục hồi tạo mất dịch vụ khác | Dùng backoff hàm mũ có trần với jitter |
| Ack tác vụ coi là hủy cuối | Worker còn chạy sau UI nói dừng | Thăm dò Task đến trạng thái kết thúc |

## Capstone Connection

Bài tổng kết hệ sinh thái công cụ nên coi độ tin cậy là bằng chứng thực thi được, không đoạn trong sơ đồ kiến trúc.

Yêu cầu sản phẩm này:

- một bản ghi tranh chấp hủy mỗi vận chuyển;
- bảng thử lại cho mọi thay đổi đưa ra;
- bản ghi khóa lũy đẳng và fixture không khớp;
- bản ghi cùng khóa đồng thời, kiểm tra mở lại và kiểm tra bí danh thay đổi;
- kết quả quá tải bộ đệm có giới hạn;
- header SSE reverse proxy và chính sách nhàn;
- kế hoạch kết nối lại nêu phương thức lấy lại có thẩm quyền;
- trace hủy Task bền vững khi bài tổng kết dùng Tasks.

Yêu cầu xanh trong tiến trình cục bộ chỉ chứng minh nhánh thành công. Bài tổng kết sẵn sàng sản xuất khi mất phản hồi, hủy trễ, bên tiếp nhận chậm và bầy kết nối lại có kết quả tất định.

## Key Terms

| Thuật ngữ | Ý nghĩa |
|------|---------|
| Request cancellation (Hủy yêu cầu) | Bỏ một yêu cầu MCP đang xử lý |
| Cancellation race (Tranh chấp hủy) | Cạnh tranh giữa sự kiện hoàn tất kết thúc và hủy |
| Idle timeout (Thời gian chờ nhàn rỗi) | Giới hạn từ hoạt động yêu cầu hữu ích cuối |
| Maximum timeout (Thời gian chờ tối đa) | Giới hạn tuyệt đối từ bắt đầu yêu cầu, không bị tiến độ ảnh hưởng |
| Idempotency key (Khóa lũy đẳng) | Định danh ứng dụng khử trùng một ý định nghiệp vụ |
| Atomic ledger (Sổ nguyên tử) | Ranh giới bền vững commit chiếm khóa, bản ghi hiệu ứng và kết quả thành một đơn vị |
| Backpressure (Áp lực ngược) | Kiểm soát áp khi bên tạo nhanh hơn bên tiếp nhận |
| Progress coalescing (Gộp tiến độ) | Thay tiến độ cũ bằng giá trị có thẩm quyền mới hơn |
| Refetch (Lấy lại) | Đọc trạng thái hiện tại lần nữa sau khoảng trống luồng |
| Jitter (Độ biến thiên) | Biến thiên chủ ý phân tán thử lại theo thời gian |

## Further Reading

- [MCP Cancellation](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation)
- [MCP Progress](https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress)
- [MCP Streamable HTTP](https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http)
- [MCP Tasks Extension](https://tasks.extensions.modelcontextprotocol.io/specification/draft/tasks)
