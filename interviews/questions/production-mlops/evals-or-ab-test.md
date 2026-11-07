---
id: evals-or-ab-test
title: Why a higher eval score still needs an experiment
card: production-mlops
kind: concept
level: 1
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [screen, ml-breadth]
tags: [evals, ab-testing, experiments, product-metrics]
minutes: 5
lessons: [phases/17-infrastructure-and-production/21-ab-testing-llm-features, phases/17-infrastructure-and-production/20-shadow-canary-progressive]
manuals: []
practice: []
cheatsheet: [progressive-delivery, llm-evaluation]
related: [production-mlops/peeking-at-an-ab-test, production-mlops/shadow-mode-is-a-smoke-test]
updated: 2026-11-03
---

Prompt mới của bạn đạt điểm cao hơn prompt cũ trên tập có nhãn. Một quản lý sản phẩm hỏi tại sao bạn vẫn muốn một kiểm thử online ngẫu nhiên trước khi ra mắt đầy đủ. Đưa ra phiên bản hai phút.

## Short answer

Một đánh giá cho bạn biết liệu mô hình có thể làm tác vụ trên một phân phối cố định có nhãn. Một kiểm thử ngẫu nhiên với người dùng thật cho bạn biết liệu người dùng nhận thấy và quan tâm. Một prompt có thể thắng trên tập có nhãn và không thay đổi chỉ số sản phẩm nào, hoặc thay đổi theo hướng sai. Bạn cần cả hai: đánh giá chặn một suy giảm trước khi bất kỳ người dùng nào thấy nó, và thí nghiệm xác nhận tác động sản phẩm sau đó.

## Full answer

### Two different questions

Một đánh giá chạy offline trên một tập có nhãn với một giám khảo, có thể là một rubric, một mô hình hoặc một người. Nó trả lời: đầu ra có đúng, hữu ích và an toàn trên phân phối này không?

Một A/B test chạy online với những người dùng thật được phân ngẫu nhiên. Nó trả lời: biến thể có thay đổi chỉ số cấp người dùng quan trọng, như giữ chân hoặc hoàn thành tác vụ không?

### Why one is not enough

Mọi kỹ sư cao cấp có thể nêu một tính năng đã triển khai vì cảm thấy tốt hơn, không có thí nghiệm. Nhiều tính năng làm suy giảm một chỉ số sản phẩm không ai theo dõi trong nhiều tháng. Đánh giá không thể thấy preference người dùng. Thí nghiệm không thể bắt một suy giảm trước phơi lộ. Mỗi loại bao phủ điểm mù của loại kia.

### What to test online

Bài học nêu ba trục kiểm thử được:

1. Cách diễn đạt và cấu trúc prompt. Chỉ số: thành công tác vụ, giữ chân, chi phí mỗi yêu cầu.
2. Lựa chọn mô hình. Chỉ số: độ chính xác tác vụ, chi phí mỗi yêu cầu và độ trễ P99 cùng nhau.
3. Các tham số sinh như temperature và top-p. Chỉ số: theo tác vụ.

### The order

Đánh giá trước. Rồi shadow và một canary để chứng minh biến thể ổn định. Rồi một A/B test ở phần chia 50 phần trăm khi biến thể là một lựa chọn khác biệt. Khi nó chỉ là một phiên bản cải thiện của cùng hành vi, canary có thể đến 100 phần trăm không có bước A/B. Cải thiện có nghĩa đánh giá cho thấy mức tăng. Các cổng canary không đo hoàn thành tác vụ, nên việc bỏ qua tin đánh giá cho điều đó.

## Follow-ups

- **Level 1:** Nêu một chỉ số một thí nghiệm tạo mà một đánh giá không thể. Expected: một chỉ số cấp người dùng như giữ chân, chuyển đổi hoặc tỷ lệ không thích.
- **Level 2:** Canary đạt, và thí nghiệm cho thấy một mức giảm nhỏ về chuyển đổi. Triển khai? Expected: không mặc định. Viết tiêu chí chuyển lên trước khi kiểm thử bắt đầu, và xem một chỉ số chính âm là một điểm dừng.
- **Level 2:** Khi nào bạn bỏ thí nghiệm sau một canary? Expected: khi phiên bản mới là một cải thiện của cùng hành vi, không phải một lựa chọn có đường cong chi phí hoặc giọng điệu khác.
- **Level 3:** Tại sao tính không xác định của mô hình thay đổi kích thước mẫu? Expected: các đầu vào giống hệt cho các đầu ra khác nhau, nên mẫu hiệu dụng nhỏ hơn mẫu danh nghĩa. Bài học nhân mẫu cần thiết với khoảng 1.3 đến 1.5.

## Wrong answers

- "Tập đánh giá lớn hơn, nên đáng tin cậy hơn." Tập đánh giá cố định và có nhãn, và nó đo tính đúng đắn, không phải những gì người dùng thích.
- "Chạy thí nghiệm và bỏ đánh giá để tiết kiệm một tuần." Không có đánh giá, một suy giảm đến người dùng trước khi ai đó có thể thấy nó.
- "Nếu đánh giá và thí nghiệm bất đồng, thí nghiệm sai." Chúng đo những thứ khác nhau. Một câu trả lời đúng mà người dùng không thích là một kết quả thật.

## Taught in

[Bài học A/B testing](../../../phases/17-infrastructure-and-production/21-ab-testing-llm-features/) tách đánh giá khỏi thí nghiệm, và [bài học triển khai tiến dần](../../../phases/17-infrastructure-and-production/20-shadow-canary-progressive/) đặt thí nghiệm sau canary.
