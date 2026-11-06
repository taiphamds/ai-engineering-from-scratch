---
id: per-token-or-per-minute
title: Per-token or per-minute billing for a daytime load
card: cost-capacity
kind: tradeoff
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, inference-engineer]
rounds: [system-design, customer]
tags: [pricing, utilization, dedicated-capacity, inference-platforms]
minutes: 8
lessons: [phases/17-infrastructure-and-production/02-inference-platform-economics, phases/17-infrastructure-and-production/01-managed-llm-platforms]
manuals: []
practice: []
cheatsheet: [managed-llm-platforms]
related: [cost-capacity/warm-pool-or-cold-start, cost-capacity/batch-lane-triage]
updated: 2026-11-03
---

Hai nền tảng suy luận báo giá cho bạn cùng một mô hình mở. Một tính phí trên mỗi triệu token. Nền tảng còn lại cho thuê một GPU chuyên dụng theo phút. Lưu lượng của bạn ổn định trong ngày làm việc và gần không vào ban đêm. Cách định giá nào thắng, và con số nào quyết định nó?

## Short answer

Mức sử dụng duy trì quyết định nó. Tính phí theo token chỉ thu cho những gì bạn dùng, vì vậy nó thắng khi lưu lượng bùng phát hoặc thấp và một GPU chuyên dụng sẽ nhàn rỗi. Tính phí theo phút thu cho thời gian thực trôi qua, vì vậy nó thắng khi bạn giữ GPU bận, và quy tắc kinh nghiệm của bài học đặt điểm giao gần 30 phần trăm mức sử dụng duy trì. Một tải chỉ chạy ban ngày nằm gần ranh giới đó, vì vậy đo mức sử dụng của bạn trong cả một tuần trước khi ký.

## Full answer

### Two cost functions for one output

Định giá theo token phản ánh đường cong mức sử dụng riêng của nền tảng trên tất cả khách hàng của nó, và bạn không trả cho thời gian nhàn rỗi. Định giá theo phút hoặc theo giây phản ánh tính độc quyền: GPU là của bạn, và hóa đơn chạy dù có request đến hay không. Đầu ra, một phản hồi mô hình, là như nhau.

### The crossover

Bài học kinh tế nêu quy tắc: trên khoảng 30 phần trăm mức sử dụng duy trì của một GPU chuyên dụng, theo phút bắt đầu thắng theo token. Dưới mức đó, theo token thắng vì bạn không trả cho nhàn rỗi. Bài học về các nền tảng được quản lý cho thấy cùng dạng cho năng lực đặt trước trên một hyperscaler: điểm hòa vốn nằm quanh 40 đến 60 phần trăm mức sử dụng duy trì, tiết kiệm đạt đến 70 phần trăm ở mức sử dụng cao, và phần đặt trước được tính phí khi nhàn rỗi.

### Compute it for your own traffic

1. Lấy số request theo giờ trong ngày cho một tuần, và số token mỗi request.
2. Hóa đơn theo token là tổng token nhân mức giá.
3. Hóa đơn theo phút là số giờ thuê nhân mức giá. Đó là mọi giờ trừ khi bạn thu về không vào ban đêm, mang lại một cold start mỗi sáng.
4. Mức sử dụng là thời gian bận chia cho thời gian thuê. So sánh nó với điểm giao.

### What the price does not show

- Năng lực chuyên dụng tránh việc xếp hàng sau các tenant khác. Bài học về các nền tảng được quản lý đo một trung vị token đầu tiên thấp hơn trên năng lực đặt trước so với dùng chung theo nhu cầu cho cùng nhóm mô hình.
- Một mô hình fine-tune có thể thay đổi giá theo token. Một nền tảng trong bài học phục vụ một bản fine-tune ở mức giá của mô hình cơ sở, là một điểm khác biệt. Một GPU chuyên dụng phục vụ nó ở cùng giá theo giờ dù cách nào.
- Công việc không tương tác có một lựa chọn thứ ba: một tầng batch ở khoảng một nửa giá serverless.

### A mixed answer

Thuê năng lực chuyên dụng cho mức nền ban ngày, và gửi phần vượt cùng batch qua đêm sang định giá theo token hoặc batch. Mức sử dụng của phần chuyên dụng khi đó giữ cao, và các đợt bùng phát không bao giờ trả cho một GPU nhàn rỗi.

## Follow-ups

- **Level 2:** Tại sao định giá theo token tốn hơn trên mỗi token so với thời gian GPU riêng của bạn ở mức sử dụng cao? Expected: biên lợi nhuận và thời gian nhàn rỗi của nền tảng được tính vào giá theo token. Ở mức sử dụng cao bạn trả cho sự nhàn rỗi mà bạn không có.
- **Level 2:** Điều gì thay đổi khi bạn thu GPU chuyên dụng về không vào ban đêm? Expected: bạn ngừng trả cho ban đêm và mua một cold start mỗi sáng, vì vậy các request đầu ngày trả bằng độ trễ.
- **Level 3:** Tại sao lựa chọn chuyên dụng nhanh hơn ở đuôi? Expected: năng lực dùng chung theo nhu cầu cạnh tranh với lưu lượng của mọi khách hàng khác, và năng lực chuyên dụng thì không. Đó là khoảng cách mà bài học về các nền tảng được quản lý đo giữa độ trễ token đầu tiên đặt trước và theo nhu cầu.
- **Level 3:** Một mô hình fine-tune thay đổi phép so sánh như thế nào? Expected: một nền tảng theo token có thể phục vụ bản fine-tune ở giá cơ sở hoặc thu thêm cho nó. Một GPU chuyên dụng phục vụ nó ở cùng giá theo giờ dù cách nào.

## Wrong answers

- "Theo token luôn rẻ hơn vì bạn không bao giờ trả cho nhàn rỗi." Trên điểm giao mức sử dụng, giá theo token mang sự nhàn rỗi và biên lợi nhuận của nền tảng, và GPU riêng của bạn rẻ hơn.
- "Chuyên dụng luôn rẻ hơn ở quy mô lớn." Chỉ khi bạn giữ nó bận. Một tải chỉ ban ngày để nó nhàn rỗi một nửa thời gian.
- "So sánh các giá niêm yết nổi bật." Hai giá có các đơn vị khác nhau. Chỉ hồ sơ lưu lượng của bạn biến chúng thành một hóa đơn.

## Taught in

[Bài học kinh tế nền tảng suy luận](../../../phases/17-infrastructure-and-production/02-inference-platform-economics/) đưa ra điểm giao giữa theo token và theo phút, và [bài học các nền tảng được quản lý](../../../phases/17-infrastructure-and-production/01-managed-llm-platforms/) đưa ra điểm hòa vốn cho năng lực đặt trước.
