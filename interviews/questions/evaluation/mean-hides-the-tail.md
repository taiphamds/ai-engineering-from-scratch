---
id: mean-hides-the-tail
title: The mean is green and users see failures
card: evaluation
kind: debug
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [debugging, ml-depth]
tags: [aggregation, pass-rate, bottom-quantile, faithfulness]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks, phases/10-llms-from-scratch/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/judge-calibration-before-trust]
updated: 2026-11-03
---

Một dashboard tính trung thành báo cáo một trung bình 0.85 trên một nghìn trường hợp, trên ngưỡng phát hành 0.8. Các ticket hỗ trợ nói trợ lý bịa chi tiết chính sách trong một số câu trả lời. Người phụ trách đánh giá nói metric xanh. Bạn nhìn ở đâu, và bạn thay đổi gì trong báo cáo?

## Short answer

Một trung bình che giấu phần đuôi. Một trung bình 0.85 tương thích với một phần 5 phần trăm các thất bại thảm họa, và phần đó là thứ trở thành ticket. Sắp xếp các trường hợp theo điểm và đọc 10 phần trăm thấp nhất. Rồi thêm một tỷ lệ đạt tại một ngưỡng và một cảnh báo phân vị đáy vào báo cáo, cạnh trung bình.

## Full answer

### Why the dashboard is green

Phần lớn các trường hợp đạt điểm cao trong khi một phần nhỏ đạt gần không. Trung bình gần như không dịch chuyển, vì phần đó nhỏ. Những người dùng trong phần đó nhận một chính sách bị bịa, và không trung bình nào nói với họ rằng nó hiếm.

### What to report

- **Tỷ lệ đạt.** Tỷ lệ trường hợp trên một ngưỡng. Nó đo độ tin cậy, là thứ người dùng cảm nhận, vì vậy nó có thể hành động hơn trung bình.
- **Phân vị đáy.** Bài học từ chối báo cáo chỉ tổng hợp mà không đưa 10 phần trăm thấp nhất ra. Đọc tay những trường hợp đó mỗi lần chạy.
- **Điểm theo hạng mục.** Nếu phần đuôi đến từ một hạng mục, cách sửa cục bộ và cổng nên theo dõi hạng mục đó.

### How to debug it

1. Lấy các trường hợp điểm thấp nhất và đọc chúng. Xác nhận chúng khớp các ticket.
2. Kiểm tra các điểm thiếu được đếm như thế nào. Một bộ chấm trả về JSON xấu tạo ra một điểm thiếu, và bỏ các điểm thiếu nâng trung bình.
3. Kiểm tra rằng bộ chấm đã được hiệu chuẩn ở đầu thấp. Một tập gán nhãn tay gồm các trường hợp dễ không nói gì về phần đuôi.

## Follow-ups

- **Level 2:** Tại sao bài học ưu tiên tỷ lệ trường hợp trên một ngưỡng cắt hơn trung bình? Expected: nó đếm bao nhiêu trường hợp đủ tốt, vì vậy nó đo độ tin cậy.
- **Level 2:** Các trường hợp thấp nhất đều đến từ một hạng mục. Điều gì thay đổi? Expected: cách sửa cục bộ; báo cáo các điểm theo hạng mục và kiểm soát trên hạng mục yếu nhất, không phải điểm tổng hợp.
- **Level 3:** Các điểm thiếu từ lỗi phân tích cú pháp bị bỏ trước khi lấy trung bình. Điều đó đã làm gì? Expected: nó nâng trung bình, vì các đầu ra tệ nhất thường không phân tích cú pháp được; tính chúng là thất bại hoặc báo cáo riêng.
- **Level 3:** Bạn thêm cảnh báo nào vào cổng phát hành? Expected: một mức sàn trên 10 phần trăm thấp nhất và một ngưỡng tỷ lệ đạt, cả hai cạnh trung bình.

## Wrong answers

- "Trung bình đạt, vì vậy bản phát hành đạt." Một trung bình 0.85 thường che giấu một phần thảm họa 5 phần trăm; cổng cần phần đuôi.
- "Tăng ngưỡng trung bình lên 0.9." Một ngưỡng trung bình cao hơn vẫn che giấu một phần nhỏ các số không; thêm một phép đo phân phối.
- "Bộ chấm nhiễu ở đáy, vì vậy bỏ qua những trường hợp đó." Đó là nơi các thất bại nằm; hiệu chuẩn bộ chấm trên cả các trường hợp điểm thấp.

## Taught in

[Bài học các framework đánh giá LLM](../../../phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/) liệt kê bẫy tổng hợp thô và quy tắc phân vị đáy, và [bài học đánh giá](../../../phases/10-llms-from-scratch/10-evaluation/) định nghĩa tỷ lệ đạt là tóm tắt có thể hành động hơn.
