---
id: retries-that-amplify
title: The provider slowed down and your service fell over
card: production-mlops
kind: debug
level: 3
roles: [ai-evaluation-reliability-engineer, inference-engineer, applied-ai-engineer]
rounds: [debugging, system-design]
tags: [retries, backoff, fallback, rate-limits]
minutes: 12
lessons: [phases/11-llm-engineering/13-production-app, phases/17-infrastructure-and-production/24-chaos-engineering-llm]
manuals: []
practice: []
cheatsheet: [production-llm-app, sre-for-ai]
related: [production-mlops/budget-burn-pauses-chaos, production-mlops/checks-in-order-of-cost]
updated: 2026-11-03
---

Trong một lần nhà cung cấp chậm, nhà cung cấp bắt đầu trả về các lỗi giới hạn tốc độ. Trong vài phút, dịch vụ riêng của bạn hết bộ nhớ và crash, dù lưu lượng đến không thay đổi. Tái dựng điều gì xảy ra, và sửa policy thử lại.

## Short answer

Gateway thử lại mọi lời gọi bị giới hạn tốc độ, và mỗi lần thử lại đang chờ giữ kết nối, buffer và trạng thái yêu cầu trong bộ nhớ. Các lần thử lại nhân mức đồng thời đang diễn ra gấp nhiều lần lưu lượng thật, và bộ nhớ theo nó. Sửa policy bằng exponential backoff và jitter, một số lần thử cố định nhỏ, một giới hạn các yêu cầu đang diễn ra, và một chuỗi fallback chuyển sang dự phòng thay vì chờ.

## Full answer

### The chain of events

1. Nhà cung cấp trả về 429 cho một tỷ phần lời gọi.
2. Gateway thử lại mỗi lời gọi. Mỗi lần thử lại giữ một kết nối, một buffer và trạng thái yêu cầu trong khi chờ.
3. Các yêu cầu đang diễn ra thành lưu lượng nhân số lần thử. Bài học chaos gọi đây là mức đồng thời bị khuếch đại bởi thử lại.
4. Bộ nhớ theo số đang diễn ra, và dịch vụ khỏe mạnh một phút trước hết chỗ.

### The retry policy in the production application capstone

Exponential backoff với jitter: chờ khoảng 1 giây, rồi 2, rồi 4, với một độ trải ngẫu nhiên thêm vào mỗi lần chờ, và bỏ cuộc sau 3 lần thử lại với một phản hồi fallback. Bảng của bài học tách các trường hợp:

| Lỗi | Thử lại | Fallback |
|---|---|---|
| 429, giới hạn tốc độ | có, với backoff | xếp hàng yêu cầu và nói người dùng nó đang được xử lý |
| 500, lỗi máy chủ | có, 3 lần thử | chuyển sang mô hình fallback |
| timeout trên 30 giây | có, 1 lần thử | một prompt ngắn hơn hoặc một mô hình nhỏ hơn |

Jitter quan trọng bằng backoff. Không có nó, mọi client thử lại cùng lúc và nhà cung cấp thấy một làn sóng ở mỗi chu kỳ.

### Bound the concurrency, not only the attempts

Số lần thử chặn các lần thử lại của một yêu cầu. Không gì chặn bao nhiêu yêu cầu chờ cùng lúc. Thêm một giới hạn các yêu cầu đang diễn ra tại gateway và một ngân sách thử lại như một tỷ phần lưu lượng. Khi đạt giới hạn, thất bại nhanh vào hàng đợi hoặc fallback thay vì giữ bộ nhớ.

### The fallback chain

Mô hình chính, rồi một mô hình thứ cấp, rồi một phản hồi đã cache, rồi một thông báo không khả dụng ngắn. Mỗi bước đánh đổi chất lượng lấy tính sẵn sàng, và người dùng luôn nhận gì đó.

### Test it before the next slowdown

Thí nghiệm đầu dành riêng mô hình của bài học chaos chèn một giới hạn tốc độ nhà cung cấp trong vài phút và quan sát fallback. Phần lớn nhóm học ở đó rằng fallback chưa bao giờ được thực thi đầy đủ.

## Follow-ups

- **Level 3:** Tại sao chỉ backoff không dừng tăng bộ nhớ? Expected: backoff phân bố các lần thử lại theo thời gian, và mỗi lần thử lại đang chờ vẫn giữ trạng thái. Cách sửa cần một giới hạn các yêu cầu đang diễn ra.
- **Level 3:** Một hàng đợi làm gì mà một lần thử lại không làm? Expected: nó lưu yêu cầu mà không có một kết nối hoặc một worker, và cho người dùng một thông báo tiến độ thay vì một timeout.
- **Level 4:** Mô hình fallback rẻ hơn và yếu hơn. Ai quyết định nó chấp nhận được, và bạn theo dõi nó như thế nào? Expected: chủ sản phẩm nêu các đường có thể suy giảm. Ghi log tỷ lệ fallback mỗi đường, và cảnh báo khi nó giữ cao.

## Wrong answers

- "Thử lại nhanh hơn để hàng đợi rút hết trước khi bộ nhớ hết." Các lần thử lại nhanh hơn tăng tốc độ yêu cầu đến một nhà cung cấp đã đang giới hạn bạn.
- "Tăng số lần thử lại tối đa để người dùng không bao giờ thấy một lỗi." Mỗi lần thử giữ bộ nhớ. Nhiều lần thử hơn nhân trạng thái đang diễn ra.
- "Nhà cung cấp gây gián đoạn, không có gì để sửa ở đây." Nhà cung cấp gây các lỗi. Policy thử lại biến chúng thành một gián đoạn.

## Taught in

[Bài học ứng dụng production](../../../phases/11-llm-engineering/13-production-app/) đưa ra backoff, các giới hạn thử lại và chuỗi fallback, và [bài học chaos engineering](../../../phases/17-infrastructure-and-production/24-chaos-engineering-llm/) nêu bão thử lại là lỗi để kiểm thử.
