---
id: budget-circuit-breaker
title: Controls that stop a bug from spending the month
card: cost-capacity
kind: design
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer]
rounds: [system-design, design-review]
tags: [budget, circuit-breaker, rate-limiting, finops]
minutes: 10
lessons: [phases/11-llm-engineering/11-caching-cost, phases/17-infrastructure-and-production/27-finops-llms]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [cost-capacity/cost-per-outcome]
updated: 2026-11-03
---

Tháng trước một lỗi trong một vòng lặp retry tiêu hết ngân sách mô hình cả tháng trong hai ngày, và không ai thấy nó cho đến khi có hóa đơn. Thiết kế các biện pháp kiểm soát ngăn lần tiếp theo, với các ngưỡng và việc mỗi ngưỡng làm.

## Short answer

Đặt một bộ theo dõi chi phí trên mọi lời gọi và một thang ngưỡng ở trên nó. Ở 70 phần trăm ngân sách cảnh báo, ở 85 phần trăm điều tiết để mọi request đi đến mô hình rẻ nhất, và ở 95 phần trăm dừng để chỉ các câu trả lời đã cache được phục vụ và các lời gọi mới bị từ chối. Trước thang đó, thêm một giới hạn tốc độ và một giới hạn chi tiêu hằng ngày cho mỗi tenant, và một kill switch tạm dừng một tenant có chi tiêu nhảy vọt cao hơn nhiều so với lịch sử của chính nó.

## Full answer

### The tracker

Mọi lời gọi ghi log dấu thời gian, mô hình, các token đầu vào và đầu ra, độ trễ, chi phí được tính, người dùng, trạng thái cache và loại request. Tổng lũy kế so với ngân sách tháng là đầu vào của mọi biện pháp kiểm soát bên dưới. Một phép kiểm tra chạy hằng đêm quá chậm, vì một vòng lặp retry tiêu ngân sách một ngày trong vài phút.

### The budget ladder

| Tỷ lệ đã chi | Hành động |
|---|---|
| 70 phần trăm | gửi một cảnh báo |
| 85 phần trăm | điều tiết: định tuyến mọi request đến mô hình rẻ nhất |
| 95 phần trăm | dừng: chỉ phục vụ các phản hồi đã cache, từ chối các request mới |

Mỗi bước mua thời gian cho bước tiếp theo. Cảnh báo cho mọi người một cơ hội hành động, việc điều tiết giữ dịch vụ hoạt động ở chất lượng thấp hơn trong khi chi tiêu chậm lại, và việc dừng bảo vệ ngân sách khi không ai hành động.

### The per-tenant ladder

Bài học FinOps đưa ra ba biện pháp kiểm soát cho mỗi tenant đối với một sản phẩm đa tenant:

1. Một giới hạn tốc độ ở mức 2 đến 3 lần đỉnh dự kiến, với một trạng thái giới hạn tốc độ và một retry header. Tenant cảm thấy trở ngại và không nhận hóa đơn bất ngờ.
2. Một giới hạn chi tiêu hằng ngày ở mức 1.5 đến 3 lần mức trần trong hợp đồng. Vượt qua nó siết giới hạn tốc độ và cảnh báo bộ phận customer success.
3. Một kill switch khi z-score của chi tiêu so với baseline riêng của tenant vượt 4. Nó tạm dừng tenant và gọi trực.

Z-score quan trọng vì các tenant khác nhau theo các bậc độ lớn. Một số tiền cố định là nhiễu đối với một tenant lớn và là ngân sách một tháng đối với một tenant nhỏ.

### Test the ladder

Bài tập của bài học caching mô phỏng 1,000 request so với một ngân sách 1.00 đô la và kiểm tra rằng mỗi ngưỡng kích hoạt. Bài tập dự báo của nó dự báo tháng từ trung bình 7 ngày gần nhất và cảnh báo khi dự báo vượt ngân sách hơn 20 phần trăm. Cả hai thuộc về bộ kiểm thử, vì một circuit breaker chưa bao giờ được chủ ý kích hoạt là một niềm hy vọng.

### Where it runs

Tại gateway, nơi mọi lời gọi đi qua. Một biện pháp kiểm soát nằm trong một ứng dụng bỏ sót ứng dụng có lỗi.

## Follow-ups

- **Level 2:** Tại sao ba ngưỡng chứ không phải một lần dừng cứng? Expected: cảnh báo cho mọi người thời gian, việc điều tiết mua thêm thời gian ở chất lượng thấp hơn, và việc dừng bảo vệ ngân sách. Một lần dừng cứng gây bất ngờ cho người dùng mà không có cảnh báo.
- **Level 3:** Điều gì thay đổi đối với người dùng trong bước điều tiết? Expected: chất lượng, vì mọi request đi đến mô hình rẻ nhất. Dịch vụ vẫn hoạt động trong khi chi tiêu chậm lại.
- **Level 3:** Tại sao kill switch tương đối so với lịch sử của tenant? Expected: các tenant khác nhau theo các bậc độ lớn. Một z-score bắt được một bước nhảy đối với một tenant nhỏ và bỏ qua một ngày bình thường đối với một tenant lớn.
- **Level 4:** Lỗi retry tiêu hết ngân sách trong hai ngày. Biện pháp kiểm soát nào kích hoạt trước? Expected: giới hạn chi tiêu hằng ngày hoặc kill switch z-score kích hoạt trong ngày đầu tiên. Thang hằng tháng sẽ chỉ cảnh báo ở 70 phần trăm.

## Wrong answers

- "Đặt một giới hạn cứng ở nhà cung cấp rồi dừng ở đó." Giới hạn nhà cung cấp dừng mọi tenant cùng lúc mà không có cảnh báo. Thang giảm cấp trước và cách ly tenant.
- "Một cảnh báo đến kênh của nhóm là đủ." Sự cố là một lỗi ban đêm. Việc điều tiết và dừng hành động mà không có một người.
- "Kiểm tra ngân sách hằng đêm." Một vòng lặp retry tiêu ngân sách một ngày trong vài phút. Bộ theo dõi phải chạy trên mọi lời gọi.

## Taught in

[Bài học caching và chi phí](../../../phases/11-llm-engineering/11-caching-cost/) đặt ba ngưỡng ngân sách, và [bài học FinOps](../../../phases/17-infrastructure-and-production/27-finops-llms/) thêm thang thực thi theo tenant.
