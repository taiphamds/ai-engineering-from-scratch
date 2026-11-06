---
id: scale-to-zero-policy
title: Warm replicas per tier, with the arithmetic
card: cost-capacity
kind: design
level: 4
roles: [inference-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [warm-pool, scale-to-zero, cold-start, tiers]
minutes: 18
lessons: [phases/17-infrastructure-and-production/10-cold-start-mitigation, phases/17-infrastructure-and-production/02-inference-platform-economics]
manuals: []
practice: []
cheatsheet: [llm-cost-caching, serving-engines-compared]
related: [cost-capacity/warm-pool-or-cold-start, cost-capacity/cold-start-anatomy, cost-capacity/per-token-or-per-minute]
updated: 2026-11-03
---

Bạn chạy ba tầng trên một nền tảng GPU serverless: người dùng trả phí trên một cuộc chat trực tiếp, người dùng dùng thử trên cùng cuộc chat, và một pipeline batch hằng đêm. Thiết kế chính sách warm-pool theo từng tầng, cho thấy phép tính đằng sau nó, và nói bạn sẽ đo gì sau một tháng để xem xét lại nó.

## Short answer

Cho chat trả phí một hoặc hai replica ấm, vì mục tiêu token đầu tiên của nó không thể hấp thụ một cold start dài nhiều phút trên một mô hình lớn. Cho người dùng dùng thử một khoảng dự phòng nhỏ hơn, hoặc để họ dùng năng lực dư của pool trả phí, và để pipeline batch thu về không, vì nó chịu được một cold start vài phút. Phép tính là giá GPU theo giờ nhân số giờ nhàn rỗi so với các request sẽ trượt mục tiêu trong một cold start, và sau một tháng bạn so sánh mức sử dụng đo được, số cold start và số lần trượt mục tiêu theo tầng.

## Full answer

### The arithmetic the lesson gives

Một replica ấm tốn một giờ GPU mỗi giờ. Một replica cho mỗi sản phẩm là cả một tháng giờ GPU dù có ai gọi hay không, và ví dụ của bài học về năm sản phẩm với mỗi sản phẩm một replica ấm thành 3,600 giờ GPU mỗi tháng nhàn rỗi. Bài học gọi sự đánh đổi là khắc nghiệt trên các mô hình nhỏ, nơi bạn trả 0.85 đến 1.50 đô la một giờ để tránh một lần khởi động 30 giây, và dễ chịu trên các mô hình lớn, nơi khoảng 4 đô la một giờ tránh một lần khởi động 5 phút. Ngưỡng của nó cho một warm pool bắt buộc: một mục tiêu token đầu tiên tại P99 dưới 60 giây trên một mô hình 70B hoặc hơn.

### The policy per tier

| Tầng | Chính sách | Tại sao |
|---|---|---|
| chat trực tiếp trả phí | một đến hai replica ấm | đường tương tác giá trị cao của bài học, nơi một cold start là một lần gián đoạn |
| chat dùng thử | không replica ấm, hoặc tràn vào pool trả phí ở ưu tiên thấp hơn | tổn thất là một chuyển đổi, mà bạn có thể đo, so với một tháng giờ GPU |
| batch hằng đêm | thu về không | bài học chấp nhận một cold start 5 đến 10 phút trên các đường nền |

Bài tập của bài học yêu cầu đúng cách chia này và yêu cầu phép tính. Tầng trả phí được quyết định bởi SLA. Tầng batch được quyết định bởi khả năng chịu đựng của nó. Tầng dùng thử là quyết định thực sự, và nó là một thử nghiệm: tổn thất chuyển đổi từ một cold start trong phiên đầu tiên so với giá một GPU nhàn rỗi.

### Make the policy cheaper by shrinking the start

Mỗi lớp giảm thiểu đưa một tầng về gần không. Một node image được chuẩn bị sẵn loại bỏ việc kéo image, model streaming giảm một nửa thời gian nạp trọng số, một snapshot bộ nhớ GPU khôi phục trạng thái đã nạp trong một phần nhỏ thời gian, và nạp phân tầng giữ các trọng số trong bộ nhớ host. Bảng của bài học đưa một cold start 328 giây xuống khoảng 15 giây. Với một lần khởi động 15 giây, tầng dùng thử có thể thu về không với một tổn thất nhỏ, và pool trả phí có thể giữ một replica thay vì hai.

### Match the billing to the tier

Các replica ấm chạy ở mức sử dụng cao, là nơi tính phí theo phút thắng theo token, trên khoảng 30 phần trăm mức sử dụng duy trì trong bài học kinh tế. Các đợt bùng phát dùng thử và batch qua đêm nằm dưới ranh giới đó, vì vậy theo token hoặc một tầng batch ở khoảng một nửa giá serverless phù hợp với chúng.

### What to measure after a month

- Mức sử dụng theo tầng, từng giờ.
- Cold start mỗi ngày và thời lượng của chúng.
- Các request trượt mục tiêu token đầu tiên, và liệu chúng có rơi vào một cold start không.
- Các chuyển đổi dùng thử cho những phiên gặp một cold start so với các phiên không gặp.
- Tốc độ request hòa vốn theo tầng từ bộ mô phỏng của bài học, so với rate đo được.

## Follow-ups

- **Level 3:** Tại sao không cho người dùng dùng thử cùng warm pool với người dùng trả phí? Expected: một replica ấm tốn một tháng giờ GPU dù lưu lượng dùng thử đến hay không. Quyết định là tổn thất chuyển đổi từ một cold start so với chi phí đó, và tháng đo lường trả lời nó.
- **Level 4:** Một cold start 15 giây thay đổi chính sách như thế nào? Expected: các tầng chịu được vài giây thu về không, vì vậy warm pool co lại chỉ còn các đường có mục tiêu một hoặc hai giây.
- **Level 4:** Tín hiệu nào cho biết số replica ấm quá thấp? Expected: tỷ lệ request trượt mục tiêu token đầu tiên trong các lần mở rộng, cùng với số cold start mỗi ngày.

## Wrong answers

- "Replica ấm cho mọi tầng, chi phí nhỏ." Một replica cho mỗi sản phẩm là một tháng giờ GPU mỗi sản phẩm. Năm sản phẩm nhàn rỗi thành hàng nghìn giờ.
- "Thu dùng thử về không, những người dùng đó miễn phí." Một cold start nhiều phút trong phiên dùng thử đầu tiên là một chuyển đổi bị mất. Đo nó trước khi bạn quyết định.
- "Giữ pipeline batch ấm để nó kết thúc sớm hơn." Batch chịu được nhiều phút. Một GPU ấm cho nó là thời gian nhàn rỗi được trả tiền trong phần còn lại của ngày.

## Taught in

[Bài học cold start](../../../phases/17-infrastructure-and-production/10-cold-start-mitigation/) đưa ra phép tính warm-pool và bài tập chính sách theo tầng, và [bài học kinh tế nền tảng suy luận](../../../phases/17-infrastructure-and-production/02-inference-platform-economics/) đưa ra điểm giao giữa theo phút và theo token.
