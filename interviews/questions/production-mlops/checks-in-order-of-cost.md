---
id: checks-in-order-of-cost
title: Order the checks before a paid model call
card: production-mlops
kind: design
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [rate-limiting, validation, http-status, demo]
minutes: 10
lessons: [phases/17-infrastructure-and-production/29-model-demo-interfaces]
manuals: []
practice: []
cheatsheet: [production-llm-app]
related: [production-mlops/stream-fails-after-200]
updated: 2026-11-03
---

Bạn sắp chia sẻ một liên kết công khai đến một demo mô hình. Mọi yêu cầu đến mô hình tốn tiền. Thiết kế chuỗi kiểm tra một yêu cầu vượt qua trước khi mô hình chạy, và đưa ra trạng thái HTTP cho mỗi từ chối.

## Short answer

Chạy các kiểm tra rẻ trước và bước trả phí cuối. Từ chối một body quá lớn từ header `Content-Length` trước khi đọc nó, kiểm tra token truy cập, lấy một token từ bucket tốc độ của client, phân tích và xác thực JSON, tính vào giới hạn sử dụng hằng ngày, và chỉ sau đó gọi mô hình. Mỗi từ chối trả về một lỗi JSON với một mã ổn định, một thông báo và một gợi ý, và các trạng thái theo thứ tự đó là 413, 401, 429, 422 và 503.

## Full answer

### Why the order matters

Một yêu cầu xấu dừng ở kiểm tra đầu nó thất bại, và kiểm tra đó nên tốn máy chủ gần như không gì. Lời gọi mô hình là bước duy nhất tốn tiền, nên nó đến cuối. Trình duyệt có thể lặp một số kiểm tra với `maxlength` và `required`, nhưng chúng chỉ giúp các người dùng trung thực. Bất kỳ client nào có thể gửi một yêu cầu không có trang, nên máy chủ lặp mọi kiểm tra.

### The sequence

| Bước | Từ chối | Trạng thái |
|---|---|---|
| route tồn tại | endpoint không biết | 404 |
| `Content-Length` có mặt và là số | thiếu, hoặc không phải số | 411, 400 |
| kích thước body dưới giới hạn | trên 4,096 byte, bị từ chối trước khi đọc | 413 |
| body đến đúng thời gian | client ngừng gửi | 408 |
| token truy cập, khi được cấu hình | thiếu hoặc sai | 401 |
| token bucket mỗi client | bucket trống, với `Retry-After` | 429 |
| content type và đối tượng JSON | sai kiểu, hoặc không phải đối tượng | 415, 400 |
| các trường | thiếu, trống, quá dài, ký tự điều khiển | 422 |
| giới hạn sử dụng hằng ngày | ngân sách ngày đã hết, với `Retry-After` | 503 |
| lời gọi mô hình | | 200 |

Giới hạn được tính sau xác thực, để chỉ các yêu cầu hợp lệ tính vào ngày.

### The error shape

Mọi từ chối có cùng body JSON: một `code` mà mã client và kiểm thử so sánh, một `message` nêu sự thật với các con số, một `hint` có một hành động, và một `request_id` nối một báo cáo người dùng với một bản ghi log.

### Two limits, not one

Token bucket chặn mỗi client: một dung lượng cho đợt bùng phát và một tốc độ nạp lại cho dài hạn. Nó không chặn tổng. Một trăm client mỗi client giữ dưới giới hạn vẫn có thể dùng toàn bộ ngân sách, nên giới hạn sử dụng đếm tất cả lời gọi mô hình trong một ngày và từ chối sau một số cố định.

### Behind a proxy

Khóa bucket là địa chỉ client. Sau một reverse proxy, mọi yêu cầu đến từ proxy, nên tất cả client chia sẻ một bucket. Đọc địa chỉ client từ header proxy riêng của bạn đặt, và chỉ tin header đó từ proxy.

### Log every request

Một bản ghi mỗi yêu cầu, trong block `finally`, gồm các yêu cầu bị từ chối: route, trạng thái, mã lỗi, độ trễ và độ dài đầu vào. Địa chỉ client thành một hash có khóa. Văn bản không bao giờ được lưu, và trang nói rõ.

## Follow-ups

- **Level 2:** Tại sao giới hạn sử dụng đến sau các kiểm tra trường? Expected: để chỉ các yêu cầu hợp lệ tính vào tổng ngày.
- **Level 2:** Tại sao từ chối trên header trước khi đọc body? Expected: nó dừng một lần tải lên lớn trước khi máy chủ dùng bộ nhớ và thời gian cho nó.
- **Level 3:** Sau một reverse proxy, một người dùng nặng khiến mọi người bị giới hạn tốc độ. Tại sao? Expected: mọi yêu cầu đến từ địa chỉ proxy, nên tất cả client chia sẻ một bucket. Đọc địa chỉ client từ header của proxy, và chỉ tin nó từ proxy.
- **Level 3:** Máy chủ làm gì với một body bị từ chối trước khi trả lời 413? Expected: nó đọc và bỏ đến 64 KiB, vì đóng với dữ liệu chưa đọc có thể gây một TCP reset và client mất phản hồi.

## Wrong answers

- "Xác thực văn bản trước, rồi kiểm tra kích thước." Đọc body trước kiểm tra kích thước dùng chi phí mà kiểm tra tồn tại để tránh.
- "Một giới hạn tốc độ đủ, bỏ giới hạn sử dụng." Một giới hạn theo client chặn mỗi client. Một trăm client dưới giới hạn vẫn dùng toàn bộ ngân sách.
- "Trả về 500 với stack trace, các nhà phát triển có thể đọc nó." Một người lạ không thể hành động dựa trên một stack trace. Một lỗi cần một mã, một sự thật và một hành động tiếp theo.

## Taught in

[Bài học giao diện demo mô hình](../../../phases/17-infrastructure-and-production/29-model-demo-interfaces/) sắp các kiểm tra theo chi phí và định nghĩa hình dạng lỗi, token bucket và giới hạn sử dụng.
