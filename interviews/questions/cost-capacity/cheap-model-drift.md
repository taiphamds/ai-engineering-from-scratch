---
id: cheap-model-drift
title: The router saved half the bill, then the escalations climbed
card: cost-capacity
kind: debug
level: 3
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer]
rounds: [debugging, ml-depth]
tags: [model-routing, cascade, drift, online-quality]
minutes: 12
lessons: [phases/17-infrastructure-and-production/16-model-routing]
manuals: []
practice: []
cheatsheet: [llm-routing-gateways]
related: [cost-capacity/semantic-threshold, cost-capacity/gateway-latency-budget]
updated: 2026-11-03
---

Sáu tháng trước một router dạng cascade cắt hóa đơn hơn một nửa mà không có tổn thất chất lượng đo được. Kể từ đó tỷ lệ chuyển lên đã tăng dần từ 8 phần trăm lên 22 phần trăm, và một kỹ sư bán hàng báo cáo rằng bản demo của một đối thủ giờ trả lời tốt hơn sản phẩm của bạn. Chẩn đoán nó.

## Short answer

Lưu lượng đã thay đổi dần và router thì không. Bộ phân loại của nó học cơ cấu câu hỏi của sáu tháng trước, người dùng giờ hỏi các câu dài và khó hơn, và lượt đầu của mô hình rẻ thất bại trong phép kiểm tra độ tin cậy của chính nó thường xuyên hơn, là điều mà tỷ lệ chuyển lên tăng ghi lại. Chất lượng giảm âm thầm trên các request không được chuyển lên. Kiểm soát mọi tuyến bằng các metric chất lượng trực tuyến, huấn luyện lại bộ phân loại trên lưu lượng hiện tại, và coi tỷ lệ chuyển lên trên khoảng 30 phần trăm là bằng chứng rằng mô hình rẻ bị định tuyến quá mức.

## Full answer

### The failure mode the lesson warns about

Một tuyến gửi một tỷ lệ lớn lưu lượng đến một mô hình yếu hơn. Qua nhiều tháng phân phối nhiệm vụ dịch chuyển: người dùng trở nên thành thạo hơn và hỏi các câu dài hơn. Router không nhận ra, vì bộ phân loại của nó được huấn luyện trên quý trước. Chất lượng giảm vài phần trăm trên các nhiệm vụ suy luận, không ai phàn nàn đủ lớn, và nhóm biết được từ một benchmark của đối thủ. Các con số của bài học cho mẫu này: 40 phần trăm được định tuyến rẻ, giảm chất lượng 3 đến 5 phần trăm, không được nhận ra trong một quý.

### Three causes of a rising escalation rate

1. **Dịch chuyển phân phối.** Nhiều prompt dài hơn và nhiều câu hỏi nhiều bước hơn. Tín hiệu độ dài của bài học nói các prompt trên 4K token thường cần mô hình frontier, và các prompt dưới 500 token thường không cần. Nếu cơ cấu chuyển lên, nhiều lượt đầu thất bại hơn.
2. **Mô hình rẻ đã thay đổi.** Một cập nhật của nhà cung cấp đằng sau cùng alias, hoặc một lần tăng phiên bản thông thường, dịch chuyển tín hiệu độ tin cậy và hành vi từ chối.
3. **Các ngưỡng lỗi thời.** Ngưỡng độ tin cậy và tập embedding của các câu hỏi đã biết là khó được điều chỉnh trên lưu lượng cũ.

Mỗi nguyên nhân có cách sửa riêng: huấn luyện lại bộ phân loại trên lưu lượng được gán nhãn gần đây, ghim phiên bản mô hình và ghi log mô hình được phục vụ trên mọi lời gọi, và làm mới tập khó cùng ngưỡng trên một đánh giá mới.

### Gates on live traffic

Bài học kiểm soát các tuyến bằng các tín hiệu trực tiếp, không bằng tập offline:

- thích và không thích theo từng tuyến;
- một bộ chấm tự động trên một mẫu giữ lại 5 phần trăm theo từng tuyến;
- tỷ lệ chuyển lên, trong đó một cascade chuyển lên hơn 30 phần trăm request là đang định tuyến quá mức;
- tỷ lệ từ chối theo từng tuyến.

### What the cascade now costs

Mẫu cascade được thiết kế cho độ trễ trung vị khoảng 1.2 lần và khoảng 2 lần trên phần được chuyển lên, với khoảng 10 phần trăm được chuyển lên. Ở mức 22 phần trăm được chuyển lên, một phần năm số request trả cho hai lời gọi mô hình và đường chậm, vì vậy mức tiết kiệm co lại trong khi chất lượng giảm.

## Follow-ups

- **Level 3:** Tại sao đánh giá offline không phát hiện tổn thất? Expected: tập đánh giá được xây dựng từ phân phối cũ. Nó chấm mô hình trên các câu hỏi mà người dùng không còn hỏi.
- **Level 3:** Metric trực tuyến nào cho cảnh báo sớm nhất? Expected: tỷ lệ chuyển lên theo từng tuyến. Nó tăng khi mô hình rẻ thất bại trong phép kiểm tra độ tin cậy của chính nó thường xuyên hơn, trước khi các lượt thích hoặc một mẫu bộ chấm cho thấy tổn thất.
- **Level 4:** Nhà cung cấp cập nhật mô hình rẻ đằng sau cùng alias. Bạn biết bằng cách nào? Expected: một thay đổi đột ngột trong số lần chuyển lên hoặc điểm bộ chấm vào một ngày không có triển khai ở phía bạn. Ghim phiên bản mô hình và ghi log mô hình được phục vụ trên mọi lời gọi.
- **Level 4:** Bạn đặt cảnh báo cho tỷ lệ chuyển lên ở đâu? Expected: gần mục tiêu thiết kế, khoảng 10 phần trăm được chuyển lên cho mẫu cascade, với mức 30 phần trăm của bài học làm ranh giới cứng cho việc định tuyến quá mức.

## Wrong answers

- "Mô hình rẻ trở nên tệ hơn, thay nó." Có thể, và nghi phạm đầu tiên là bộ phân loại lỗi thời của router trước lưu lượng đã thay đổi dần.
- "Chất lượng ổn, điểm đánh giá không dịch chuyển." Tập đánh giá đến từ phân phối cũ và không thể thấy các câu hỏi mới.
- "Tăng ngưỡng độ tin cậy để nhiều hơn đi đến mô hình frontier." Điều đó mua lại chất lượng với một chi phí mà không tìm ra nguyên nhân. Huấn luyện lại router và kiểm soát nó trực tuyến.

## Taught in

[Bài học định tuyến mô hình](../../../phases/17-infrastructure-and-production/16-model-routing/) nêu sự thay đổi dần của mô hình rẻ và các cổng chất lượng trực tuyến phát hiện nó.
