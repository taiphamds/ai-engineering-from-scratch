---
id: public-demo-controls
title: Put a model demo behind a public link safely
card: system-design
kind: design
level: 2
roles: [applied-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [system-design]
tags: [demo, rate-limit, token-bucket, validation, privacy]
minutes: 15
lessons: [phases/17-infrastructure-and-production/29-model-demo-interfaces]
manuals: []
practice: []
cheatsheet: [production-llm-app]
related: [system-design/demo-to-product-signals, system-design/streaming-and-fallback]
updated: 2026-11-03
---

Một người review và một khách hàng muốn thử mô hình của bạn từ một liên kết, trên một điện thoại, không có notebook của bạn. Mỗi lệnh gọi mô hình tốn tiền. Thiết kế demo: hợp đồng đầu vào, thứ tự các kiểm tra, các biện pháp kiểm soát cho một liên kết công khai, và những gì nhật ký được phép giữ.

## Short answer

Viết hợp đồng trước: một chuỗi từ 1 đến 500 ký tự không có ký tự điều khiển, một lệnh gọi mô hình với một chi phí đã biết, và một đầu ra bao gồm một lỗi JSON với một gợi ý. Chạy các kiểm tra theo thứ tự chi phí, kích thước phần thân, access token, token bucket theo từng client, xác thực đầu vào, trần hàng ngày, và chỉ sau đó lệnh gọi mô hình. Trả về một mã lỗi ổn định với một thông điệp, một gợi ý và một id yêu cầu, và ghi nhật ký route, trạng thái, độ trễ và độ dài đầu vào với một hash có khóa của client, không bao giờ văn bản hoặc địa chỉ.

## Full answer

### The contract

| Phần | Câu hỏi | Câu trả lời trong bài học |
|---|---|---|
| Đầu vào | Kiểu, kích thước và ký tự nào | Một chuỗi từ 1 đến 500 ký tự, không ký tự điều khiển |
| Lệnh gọi mô hình | Bao lâu và bao nhiêu | Độ trễ và chi phí mỗi lệnh gọi đã biết |
| Đầu ra | Người dùng thấy gì khi thành công và thất bại | Một nhãn và một câu trả lời, hoặc một lỗi JSON với một gợi ý |

Một notebook không có giới hạn trên bất kỳ phần nào. Demo đặt một giới hạn trên mỗi phần, và server áp dụng nó cho mọi client, vì bất kỳ client nào có thể bỏ qua trang.

### Checks in order of cost

1. Đọc content length và từ chối một phần thân trên 4,096 byte trước khi đọc nó.
2. Kiểm tra access token khi được yêu cầu.
3. Lấy một token từ bucket của client; từ chối bằng 429 và một header `Retry-After` khi trống.
4. Parse và xác thực phần thân: đối tượng JSON, văn bản hiện diện, trong giới hạn, không ký tự điều khiển, với 422 cho một trường xấu.
5. Tính vào trần hàng ngày; từ chối bằng 503 và `Retry-After` khi ngân sách ngày đã tiêu hết.
6. Gọi mô hình.

Một yêu cầu xấu dừng ở kiểm tra thất bại đầu tiên và gần như không tốn gì. Bước trả phí ở cuối, nên chỉ các yêu cầu hợp lệ tính vào trần.

### Controls once the link is public

| Rủi ro | Biện pháp kiểm soát |
|---|---|
| Một client làm ngập | Một token bucket mỗi client: một dung lượng cho các đợt bùng và một tốc độ nạp lại cho dài hạn |
| Người lạ tìm thấy liên kết | Một access token tùy chọn trong header authorization |
| Tổng chi phí tăng | Một trần sử dụng hàng ngày trên mọi client, được đếm trong các cửa sổ 86,400 giây |
| Đầu vào lớn hoặc lạ | Giới hạn phần thân, giới hạn văn bản, kiểm tra ký tự điều khiển |
| Nhật ký giữ đầu vào riêng tư | Các bản ghi với độ dài đầu vào và một hash có khóa của client |

Một giới hạn tốc độ kiểm soát mỗi client chứ không tổng; một trăm client lịch sự vẫn có thể tiêu ngân sách, đó là mục đích của trần.

### Errors a user can act on

Mọi lỗi có cùng hình dạng: một `code` ổn định cho các client và kiểm thử, một `message` với các con số người dùng cần, một `hint` với một hành động, và một `request_id` nối một báo cáo người dùng với một bản ghi nhật ký. Một stack trace không làm việc nào trong số này cho một người lạ.

### Feedback and streaming

Trang vô hiệu hóa nút trong khi một yêu cầu chạy, hiển thị thời gian đã trôi, và hiển thị thời gian tới token đầu khi nó đến, để người dùng phân biệt một mô hình chậm với một trang hỏng và không click lại. Các token stream như server-sent events trên một phần thân POST, không phải một URL GET, để đầu vào không bao giờ rơi vào một access log.

### What the log keeps

Route, trạng thái, mã lỗi, độ trễ và độ dài đầu vào, cùng một hash có khóa của địa chỉ client cho các số đếm theo từng client. Không bao giờ văn bản đầu vào, không bao giờ đường dẫn thô, không bao giờ địa chỉ. Trang cho người dùng biết những gì được giữ.

## Follow-ups

- **Level 2:** Tại sao trần hàng ngày chạy sau xác thực chứ không phải trước? Expected: để chỉ các yêu cầu hợp lệ tính vào ngân sách; một yêu cầu bị từ chối không nên tiêu nó.
- **Level 2:** Phía sau một reverse proxy, mọi yêu cầu có địa chỉ proxy. Điều gì hỏng? Expected: mọi người dùng dùng chung một bucket; đọc địa chỉ client từ một header chỉ proxy của bạn đặt và không tin nó từ bất kỳ đâu khác.
- **Level 3:** Tại sao gửi đầu vào trong một phần thân POST thay vì URL cho event stream? Expected: các server và proxy ghi URL vào access log, nên một GET sẽ lưu văn bản người dùng.
- **Level 3:** Một framework xây trang cho bạn. Các biện pháp kiểm soát nào vẫn là việc của bạn? Expected: giới hạn tốc độ, trần chi phí và tính riêng tư nhật ký; các framework tiết kiệm việc trên biểu mẫu và streaming, không trên các rủi ro của một liên kết công khai.

## Wrong answers

- "Xác thực trong trình duyệt bằng một thuộc tính độ dài tối đa." Trình duyệt chỉ giúp người dùng trung thực; server lặp mọi kiểm tra.
- "Một giới hạn tốc độ theo từng client đủ để kiểm soát chi phí." Nó chặn mỗi client, không phải tổng; trần hàng ngày chặn tổng.
- "Ghi nhật ký toàn bộ yêu cầu để bạn có thể gỡ lỗi các báo cáo." Nhật ký khi đó giữ văn bản và địa chỉ người dùng; một id yêu cầu nối một báo cáo với một bản ghi mà không cần cả hai.

## Taught in

[Bài học giao diện demo mô hình](../../../phases/17-infrastructure-and-production/29-model-demo-interfaces/) cung cấp hợp đồng, các kiểm tra có thứ tự, token bucket, trần sử dụng và nhật ký riêng tư.
