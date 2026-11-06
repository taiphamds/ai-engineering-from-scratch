---
id: mse-predicts-half-for-everything
title: A classifier that predicts 0.5 and has a low loss
card: deep-learning
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [ml-depth, screen]
tags: [loss-functions, cross-entropy, mse, classification]
minutes: 8
lessons: [phases/03-deep-learning-core/05-loss-functions]
manuals: []
practice: [softmax-cross-entropy]
cheatsheet: [deep-learning-training]
related: [deep-learning/softmax-cross-entropy-gradient, deep-learning/loss-stuck-at-log-classes]
updated: 2026-11-03
---

Một bộ phân loại nhị phân được huấn luyện bằng sai số bình phương trung bình trên một dataset cân bằng ổn định ở một đầu ra gần 0.5 cho mọi đầu vào. Loss thấp và ổn định, và bộ tối ưu hóa không báo vấn đề. Giải thích tại sao bộ tối ưu hóa hài lòng và bạn chuyển sang loss nào.

## Short answer

Với hai lớp chia đều, một đầu ra hằng 0.5 cho một sai số bình phương 0.25 trên mọi hàng, điều mà bài học gọi là MSE tối thiểu một mô hình có thể đạt mà không học gì, và các vùng phẳng của sigmoid cho MSE gần như không có gradient gần một câu trả lời tự tin nhưng sai. Cross-entropy tính âm log của xác suất được dự đoán của lớp đúng: 0.693 cho 0.5, 0.01 cho 0.99 và 4.6 cho 0.01, vì vậy nó đẩy mỗi dự đoán về nhãn của nó. Chuyển sang binary cross-entropy.

## Full answer

### Why MSE is content

MSE lấy trung bình khoảng cách bình phương giữa dự đoán và nhãn. Gradient của nó theo một dự đoán tuyến tính theo khoảng cách. Dự đoán đi qua một sigmoid, có đạo hàm p(1 - p) và gần không khi p gần 0 hoặc 1. Một câu trả lời tự tin nhưng sai, p gần 0 cho một hàng dương, nằm đúng nơi sigmoid phẳng, vì vậy cập nhật rất nhỏ. Một mô hình có thể hạ loss một chút bằng cách chuyển mọi thứ về giữa rồi dừng, vì gradient còn ít điều để nói.

### Why cross-entropy is not

Binary cross-entropy là âm y log p trừ (1 - y) log (1 - p). Đạo hàm của nó theo p là âm y chia p cộng (1 - y) chia (1 - p). Với một hàng dương có p gần 0 đó là khoảng âm 1 chia p, tăng không giới hạn khi p giảm. Log đảo ngược sigmoid: đạo hàm của loss theo logit là dự đoán trừ mục tiêu, tuyến tính theo sai số và không bao giờ phẳng. Thang của bài học: một câu trả lời đúng ở 0.99 tốn 0.01, một câu trả lời sai ở 0.01 tốn 4.6, một tỷ số khoảng 460.

### The multi-class version

Categorical cross-entropy trên một mục tiêu one-hot rút gọn thành âm log của xác suất lớp đúng. Một phỏng đoán ngẫu nhiên giữa 10 lớp đặt xác suất 0.1 ở đó và tốn 2.3; một xác suất 0.9 tốn 0.105. Một loss kẹt gần 2.3 trên một bài toán 10 lớp là bản song sinh đa lớp của triệu chứng 0.5.

### When the switch does not help

Việc chuyển chỉ giúp khi các đầu vào mang tín hiệu về nhãn. Trên dữ liệu cân bằng không có đặc trưng dự báo, cả hai loss thấp nhất tại một hằng 0.5, vì vậy cross-entropy cũng ổn định ở đó. Kiểm tra rằng một mô hình đơn giản thắng hằng số trước khi bạn đổ lỗi cho loss.

### Where MSE belongs

Hồi quy trên các mục tiêu giá trị thực, nơi một gradient tuyến tính theo sai số là điều bạn muốn. Với các mục tiêu có ngoại lệ nặng, MAE hoặc một Huber loss là các lựa chọn thay thế của bài học.

## Follow-ups

- **Level 2:** Viết đạo hàm của binary cross-entropy theo p. Expected: âm y chia p cộng (1 - y) chia (1 - p), tăng không giới hạn khi p gần 0 cho một hàng dương.
- **Level 2:** Tại sao một dự đoán 0.5 tốn 0.693 dưới cross-entropy? Expected: đó là âm log tự nhiên của 0.5.
- **Level 3:** Sau sigmoid, lấy đạo hàm cross-entropy theo logit. Bạn nhận được gì? Expected: dự đoán trừ mục tiêu; log triệt tiêu đạo hàm của sigmoid.
- **Level 3:** Khi nào MSE là loss đúng? Expected: hồi quy trên các mục tiêu giá trị thực; với các ngoại lệ nặng, MAE hoặc một Huber loss.

## Wrong answers

- "Hạ learning rate để MSE hội tụ đúng." Đầu ra 0.5 là nơi MSE hài lòng; một bước nhỏ hơn đến đó chậm hơn.
- "MSE và cross-entropy có cùng điểm cực tiểu, vì vậy không quan trọng." Chúng chỉ đồng ý tại một khớp hoàn hảo. Xa khỏi nó, gradient của MSE phẳng ra nơi gradient của cross-entropy tăng.
- "Thay vào đó dùng độ chính xác làm loss." Độ chính xác không có gradient hữu ích; bộ tối ưu hóa cần một loss trơn.

## Taught in

[Bài học các hàm loss](../../../phases/03-deep-learning-core/05-loss-functions/) mở đầu bằng sự cố này và suy ra cả hai gradient.
