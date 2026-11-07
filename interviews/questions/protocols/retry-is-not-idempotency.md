---
id: retry-is-not-idempotency
title: The charge that ran twice after a timeout
card: protocols
kind: design
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, debugging]
tags: [mcp, idempotency, retry, cancellation, timeout, backpressure]
minutes: 12
lessons: [phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control]
manuals: []
practice: []
cheatsheet: [mcp-gateways-operations]
related: [protocols/cancel-signal-per-transport, protocols/draft-lost-across-replicas]
updated: 2026-11-03
---

Qua Streamable HTTP, một client gọi `charge_account`. Một reverse proxy đệm stream phản hồi, client chạm timeout và ngắt kết nối, và server ghi nhận khoản thu một lúc sau. Client gửi lại lệnh gọi với một id JSON-RPC mới, và khách hàng bị thu tiền hai lần. Nhóm đề xuất khử trùng lặp theo id JSON-RPC. Thiết kế cách sửa.

## Short answer

Một id JSON-RPC liên kết một thông điệp và không bao giờ định danh một thao tác nghiệp vụ, nên hai id là hai khoản thu đối với server. Thêm một idempotency key ứng dụng vào các đối số, và cho server lưu khóa, một dấu vân tay của các đối số và kết quả đã ghi nhận trong một giao dịch bền vững nguyên tử. Cùng khóa với cùng đối số trả về kết quả đã lưu, và cùng khóa với các đối số khác bị từ chối.

## Full answer

### The key, not the id

```json
{
  "name": "charge_account",
  "arguments": {"account": "acct-7", "cents": 1200, "idempotencyKey": "checkout-7"}
}
```

Bài học cho thấy trường hợp hai id: một khoản thu với id `41` mất phản hồi, lần thử lại mang id `42`, và server thấy hai thông điệp khác nhau. Không có khóa ứng dụng, nó không thể biết chúng là một lần thanh toán.

### The ledger boundary must be atomic and durable

Trình tự này không an toàn:

```text
check key
run mutation
store result
```

Hai worker đều có thể quan sát một khóa bị thiếu và cả hai chạy biến đổi. Một sự cố sau tác động và trước khi lưu tạo ra cùng sự mơ hồ khi thử lại. Bài học dùng một sổ SQLite lưu bằng file với `BEGIN IMMEDIATE`, nên kiểm tra khóa, tác động nghiệp vụ, bộ đếm thực thi và kết quả đã lưu được ghi nhận như một đơn vị, và hai kết nối đua nhau trên một khóa tạo ra một lần thực thi. Trả về các bản sao phòng vệ của các kết quả đã lưu để một biến đổi của bên gọi không thể làm hỏng một lần phát lại sau đó.

Một bảng cục bộ không khiến một thanh toán thực trở nên nguyên tử. Production cần một giao dịch bền vững dùng chung, một transactional outbox, hoặc một nhà cung cấp phía trước thực thi cùng khóa. Một khóa tiến trình không bảo vệ replica lẫn khởi động lại.

### Classify every mutation before you retry

| Lớp | Ví dụ | Quy tắc |
|---|---|---|
| an toàn | một lần đọc xác định | thử lại với một id mới sau khi đã hiểu ranh giới lỗi |
| có điều kiện | một biến đổi với một khóa bền vững | thử lại với cùng khóa và các đối số giống hệt |
| không an toàn | một biến đổi không có khử trùng lặp | không tự động thử lại; đối chiếu trước |

`idempotentHint` và `readOnlyHint` là các gợi ý không đáng tin cậy. Hợp đồng ứng dụng và triển khai server quyết định.

### Fix the timeout too

Dùng hai đồng hồ: một timeout không hoạt động mà tiến độ có thể đặt lại, và một timeout tối đa tính từ lúc bắt đầu yêu cầu mà không gì đặt lại. Trong ví dụ của bài học, tiến độ tại `400`, `800` và `1200` ms giữ đồng hồ không hoạt động `500` ms còn sống, và mức tối đa `2000` ms vẫn hủy yêu cầu. Với proxy đệm, gửi `Content-Type: text/event-stream`, `Cache-Control: no-cache` và `X-Accel-Buffering: no`, và phát ra các keepalive bình luận SSE trên các stream yên lặng. Một keepalive không phải tiến độ và không được đặt lại đồng hồ không hoạt động.

### The race the fix must respect

Việc hủy và hoàn tất đua nhau. Nếu việc hủy thắng, server không gửi phản hồi. Nếu việc hoàn tất thắng, client bỏ qua lần hủy muộn và server bỏ qua thông báo muộn. Trên HTTP, tín hiệu hủy là đóng stream phản hồi của yêu cầu, nên việc ngắt kết nối trong tình huống là một lần hủy mà server quan sát quá muộn để dừng ghi nhận. Khóa khiến điều đó vô hại.

## Follow-ups

- **Level 3:** Cùng khóa đến với một giá trị `cents` khác. Điều gì xảy ra? Expected: server so sánh dấu vân tay đối số và từ chối lệnh gọi, vì một khóa không được làm bí danh cho hai ý định nghiệp vụ.
- **Level 3:** Hai worker thấy khóa bị thiếu ở cùng thời điểm. Điều gì ngăn hai khoản thu? Expected: việc chiếm khóa, tác động và kết quả được ghi nhận trong một giao dịch bền vững nguyên tử; một trình tự kiểm-tra-rồi-ghi không thể.
- **Level 4:** Khoản thu được thực thi bởi một nhà cung cấp thanh toán bên ngoài. Sổ cục bộ có khiến nó nguyên tử không? Expected: không; hoặc nhà cung cấp chấp nhận cùng idempotency key, hoặc một transactional outbox nối việc ghi nhận cục bộ với tác động từ xa.
- **Level 4:** Client kết nối lại một stream `subscriptions/listen` bị rớt. Nó có gửi lại khoản thu bị mất không? Expected: không; nó mở một yêu cầu listen mới, lấy lại trạng thái có thẩm quyền, khử trùng lặp theo các định danh ổn định, và không bao giờ phát lại một biến đổi không an toàn vì một phản hồi bị mất.

## Wrong answers

- "Khử trùng lặp theo id JSON-RPC." Các id liên kết thông điệp, và một lần thử lại mang một id mới theo thiết kế.
- "Đặt `idempotentHint` và để client tự do thử lại." Annotation là các gợi ý không đáng tin cậy. Hợp đồng ứng dụng và sổ theo dõi quyết định mức an toàn khi thử lại.
- "Kiểm tra khóa, chạy khoản thu, rồi lưu kết quả." Hai worker đều có thể bỏ lỡ khóa, và một sự cố giữa tác động và việc lưu để lần thử lại ở trạng thái mơ hồ.

## Taught in

[Bài học về độ tin cậy](../../../phases/13-tools-and-protocols/29-mcp-reliability-cancellation-and-flow-control/) xây dựng sổ nguyên tử, hai đồng hồ và ma trận thử lại.
