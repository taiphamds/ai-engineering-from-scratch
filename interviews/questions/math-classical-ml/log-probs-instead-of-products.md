---
id: log-probs-instead-of-products
title: A sentence score that comes out as exactly zero
card: math-classical-ml
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [screen, ml-breadth]
tags: [probability, log-probability, underflow, cross-entropy]
minutes: 5
lessons: [phases/01-math-foundations/06-probability-and-distributions]
manuals: []
practice: []
cheatsheet: [probability-statistics]
related: [math-classical-ml/softmax-inf-at-large-logits]
updated: 2026-11-03
---

Một mô hình ngôn ngữ chấm điểm một câu bằng tích xác suất của mỗi từ. Với các câu dài, điểm bằng đúng không, và hai câu dài không còn có thể so sánh. Điều gì đã sai, và thay vào đó bạn tính gì?

## Short answer

Tích của nhiều xác suất nhỏ underflow về không trong số dấu phẩy động. Thay vào đó cộng các log xác suất, và tổng vẫn là một số âm hữu hạn. Một tổng âm hơn có nghĩa một câu ít khả năng hơn, và thứ tự các câu không đổi.

## Full answer

### Why the product dies

Mỗi từ có một xác suất dưới 1, thường thấp hơn nhiều. Bài học cho thấy tích giảm về 0.0 sau khoảng 30 số hạng. Một khi tích bằng không, mọi câu dài hơn nhận cùng điểm, và một so sánh giữa chúng là vô nghĩa.

### What the log does

Log biến một tích thành một tổng: log(a nhân b) bằng log(a) cộng log(b). Mỗi số hạng tối đa là 0, vì mỗi xác suất tối đa là 1, nên tổng là một số âm tăng về độ lớn theo độ dài câu nhưng không bao giờ underflow. Bài học đưa ra trường hợp cực đoan: 50 từ với xác suất 0.01 mỗi từ có xác suất thô là 10 mũ âm 100, và log xác suất khoảng âm 230.26.

### Where you already use it

Cross-entropy loss là âm log xác suất của lớp đúng. Huấn luyện một bộ phân loại hoặc một mô hình ngôn ngữ đã hoạt động trong không gian log. Log-softmax tính các log xác suất thẳng từ các logit, nên các xác suất rất nhỏ không bao giờ được tạo ra.

### Comparing sentences

Một câu dài hơn có một tổng âm hơn ngay cả khi mọi từ có khả năng cao. Để so sánh một câu ngắn với một câu dài, chia cho số token, hoặc báo cáo perplexity, là hàm mũ của âm log xác suất trung bình.

## Follow-ups

- **Level 1:** Tại sao mọi log xác suất bằng không hoặc âm? Expected: một xác suất nằm giữa 0 và 1, và log của một số như vậy tối đa là 0.
- **Level 2:** Bạn so sánh hai câu khác độ dài như thế nào? Expected: so sánh log xác suất trung bình mỗi token, hoặc perplexity, không phải tổng thô.
- **Level 2:** Điều này xuất hiện ở đâu trong một hàm loss? Expected: cross-entropy là âm log xác suất của lớp đúng, nên huấn luyện đã chạy trong không gian log.
- **Level 3:** Bạn lấy log xác suất từ các logit mà không tạo các xác suất trước như thế nào? Expected: log-softmax, trừ log-sum-exp của các logit khỏi mỗi logit.

## Wrong answers

- "Dùng một kiểu float rộng hơn và tích sẽ ổn." Một định dạng rộng hơn chỉ di chuyển điểm underflow. Năm mươi từ với xác suất 0.01 cho 10 mũ âm 100, và một câu dài hơn đẩy nó xuống xa hơn.
- "Nhân các xác suất và lấy log ở cuối." Tích đã bằng không trước log, và log của không là âm vô cực.
- "Chặn mỗi xác suất ở một giá trị tối thiểu." Điều đó thay đổi điểm của mọi từ hiếm và vẫn underflow với một câu đủ dài.

## Taught in

[Bài học xác suất](../../../phases/01-math-foundations/06-probability-and-distributions/) cho thấy underflow, các quy tắc log, và hàm log-softmax.
