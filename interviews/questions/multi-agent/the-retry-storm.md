---
id: the-retry-storm
title: A payment failure took the inventory service down
card: multi-agent
kind: debug
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, system-design]
tags: [retry-storm, circuit-breaker, cascading-failure, retry-budget, mast]
minutes: 12
lessons: [phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink]
manuals: []
practice: []
cheatsheet: [agent-failure-modes, multi-agent]
related: [multi-agent/a-worker-died-mid-run]
updated: 2026-11-03
---

Một dịch vụ thanh toán bắt đầu thất bại khoảng 10 phần trăm yêu cầu của nó. Trong vài phút, dịch vụ tồn kho, chưa từng thất bại, ngừng hoạt động, và các agent đơn hàng gọi cả hai bị khựng. Bản thân dịch vụ thanh toán tự phục hồi. Giải thích chuỗi, nêu họ lỗi, và nói bạn thêm gì để nó không thể lặp lại.

## Short answer

Đây là một bão thử lại, một lỗi độ tin cậy dây chuyền. Agent đơn hàng thử lại mỗi thanh toán thất bại, mỗi lần thử lại chạy một kiểm tra tồn kho mới, tồn kho thấy tải gấp đôi bình thường và bắt đầu timeout, mọi đơn hàng sau đó cũng thử lại kiểm tra tồn kho, và tồn kho thấy tải gấp mười lần rồi sụp. Cách sửa là cổ điển: một circuit breaker trên mọi lời gọi đi ra mở khi tỷ lệ lỗi phía sau vượt một ngưỡng và phục vụ một kết quả đã cache hoặc mặc định, cộng một ngân sách thử lại bị giới hạn mỗi yêu cầu.

## Full answer

### The chain

```text
payment fails about 10 percent of requests
  -> the order agent retries payment, with backoff but no cap
  -> each retry runs a new order-inventory check
  -> inventory sees about twice its normal load
  -> inventory starts to time out
  -> every order retries the inventory check
  -> inventory sees about ten times its normal load
  -> the cluster goes down
```

Không có gì trong chuỗi là một lỗi mô hình. Nó là một lỗi phối hợp giữa các thành phần có logic thử lại được viết từng thành phần một.

### The family

Hệ phân loại của bài học đặt điều này dưới các lỗi độ tin cậy dây chuyền, một trong năm mẫu nơi các agent khuếch đại lỗi của nhau. Nó nằm cạnh đơn canh, tuân theo, thiếu một mô hình về niềm tin của nhau, và trôi thỏa hiệp. Trong tất cả biện pháp giảm thiểu trong hệ phân loại, circuit breaker là một trong số ít bạn lấy từ các hệ thống phân tán mà không thay đổi.

### The breaker

| Trạng thái | Hành vi |
|---|---|
| Đóng | Các lời gọi đi qua, và breaker ghi mỗi kết quả trên một cửa sổ |
| Mở | Các lời gọi bị từ chối và một kết quả đã cache hoặc mặc định được phục vụ, đến khi qua một thời gian nghỉ |
| Nửa mở | Một lời gọi thăm dò đi qua; thành công đóng breaker và thất bại mở lại nó |

Mặc định triển khai của bài học là mở ở tỷ lệ lỗi 5 đến 10 phần trăm. Trong mô phỏng của bài học, breaker giới hạn khuếch đại: số thành công có thể giảm, và phía sau sống sót.

### The retry budget

Một breaker bảo vệ bên được gọi. Một ngân sách thử lại mỗi yêu cầu bảo vệ hệ thống khỏi bên gọi: một số lần thử cố định, sau đó yêu cầu thất bại và thất bại được ghi lại. Các lần thử lại không có giới hạn là cơn bão.

### Detect it earlier

Tỷ lệ thử lại là một trong các chỉ dấu lỗi chậm bài học liệt kê, với tỷ lệ đồng thuận, phân phối độ dài đầu ra và khoảng cách chỉnh sửa giữa các phiên bản agent. Một agent phát hiện quan sát một đợt tăng thử lại gọi tên mẫu trước khi tồn kho sụp.

## Follow-ups

- **Level 3:** Tại sao dịch vụ tồn kho thất bại khi thanh toán là bên có lỗi? Expected: vòng lặp thử lại của agent đơn hàng chạy lại kiểm tra tồn kho trên mọi lần thử lại thanh toán, nên tải tồn kho theo các lỗi thanh toán.
- **Level 3:** Breaker phục vụ gì trong khi mở? Expected: một kết quả đã cache hoặc mặc định mà agent đơn hàng có thể hành động dựa trên trong chế độ suy giảm, để người dùng nhận một câu trả lời chậm hơn thay vì không có.
- **Level 4:** Ngưỡng breaker thuộc về đâu, và ai sở hữu nó? Expected: trong cấu hình của bên gọi theo dịch vụ phía sau, được nhóm chạy bên gọi sở hữu, và được xem xét khi tỷ lệ lỗi bình thường của phụ thuộc thay đổi.
- **Level 4:** Bạn kiểm thử cách sửa không có một sự cố production như thế nào? Expected: một bộ mô phỏng chèn một tỷ lệ thất bại 10 phần trăm phía sau và đo tổng lời gọi có và không có breaker, như bài học làm.

## Wrong answers

- "Thêm exponential backoff vào các lần thử lại thanh toán." Backoff làm chậm cơn bão và không giới hạn nó, và kiểm tra tồn kho vẫn chạy trên mọi lần thử lại.
- "Mở rộng dịch vụ tồn kho để hấp thụ đỉnh." Đỉnh gấp mười lần bình thường và được tạo từ các lần thử lại lãng phí, và mở rộng trả tiền cho cơn bão thay vì dừng nó.
- "Đây là một vấn đề mô hình, nên cải thiện prompt của agent." Không có quyết định mô hình nào trong chuỗi, và một prompt không thể thấy tỷ lệ lỗi của một dịch vụ phía sau.

## Taught in

[Bài học các chế độ lỗi](../../../phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/) mô phỏng bão thử lại có và không có circuit breaker.
