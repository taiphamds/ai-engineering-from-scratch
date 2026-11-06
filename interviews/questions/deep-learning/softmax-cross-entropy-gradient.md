---
id: softmax-cross-entropy-gradient
title: Three lines that differentiate the cross-entropy loss
card: deep-learning
kind: code-reading
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, ml-depth]
tags: [cross-entropy, softmax, gradient, loss-functions]
minutes: 8
lessons: [phases/03-deep-learning-core/05-loss-functions]
manuals: []
practice: [softmax-cross-entropy]
cheatsheet: [deep-learning-training]
related: [deep-learning/mse-predicts-half-for-everything, deep-learning/loss-stuck-at-log-classes]
updated: 2026-11-03
---

Hàm này tuyên bố trả về, cho mỗi logit, đạo hàm của loss cross-entropy.

```python
def cce_gradient(logits, target_index):
    probs = softmax(logits)
    grads = list(probs)
    grads[target_index] -= 1.0
    return grads
```

Giải thích tại sao ba dòng là đủ. Rồi mô tả vector gradient khi mô hình chắc chắn và đúng, và khi nó chắc chắn và sai.

## Short answer

Với softmax theo sau bởi cross-entropy trên một mục tiêu one-hot, đạo hàm của loss theo logit i là xác suất được dự đoán của lớp i trừ mục tiêu cho lớp i. Hàm sao chép các xác suất và trừ 1 tại lớp đúng, chính là vector đó. Khi mô hình tự tin và đúng, mọi phần tử gần không. Khi nó tự tin và sai, phần tử tại lớp đúng gần âm 1 và phần tử tại lớp nó chọn gần dương 1.

## Full answer

### Why the form is so simple

Loss là âm log của xác suất lớp đúng, và xác suất đó là exp của logit đúng chia tổng exp của mọi logit. Lấy đạo hàm theo logit i: log của mẫu số đóng góp dương p_i cho mọi i, và log của tử số đóng góp âm 1 chỉ cho lớp đúng. Chỉ riêng đạo hàm softmax là một ma trận đầy đủ; kết hợp với log nó rút gọn thành p trừ mục tiêu one-hot. Cách nói của bài học là softmax và cross-entropy được chủ ý ghép cặp.

### Reading the vector

- Tự tin đúng: p tại lớp đúng gần 1, vì vậy phần tử đó gần 0, và mọi p khác gần 0. Gần như không có cập nhật.
- Tự tin sai: p tại lớp đúng gần 0, vì vậy phần tử đó gần âm 1; lớp được chọn có p gần 1 và một phần tử gần dương 1. Một cập nhật lớn hạ logit được chọn và nâng logit đúng.
- Tổng các phần tử bằng không, vì tổng các xác suất bằng 1 và mục tiêu one-hot cũng vậy. Đó là một phép kiểm tra nhanh cho một phiên bản viết tay.

### What the three lines rely on

Lời gọi softmax phải là phiên bản ổn định, với logit lớn nhất được trừ trước hàm mũ, nếu không các logit lớn cho inf. Một framework hợp nhất log-softmax và negative log-likelihood thành một loss nhận logits, vì cùng lý do; quy tắc của bài học là gọi loss hợp nhất đó thay vì một softmax theo sau bởi một log riêng.

### With label smoothing

Thay mục tiêu one-hot bằng vector được làm trơn: với alpha 0.1 trên mười lớp lớp đúng nhận 0.91 và các lớp khác 0.01. Gradient là p trừ vector đó, vì vậy nó đạt không tại 0.91, không tại 1.0, giữ các logit không chạy đến vô cực.

## Follow-ups

- **Level 2:** Tổng vector gradient bằng bao nhiêu? Expected: không; tổng các xác suất bằng 1 và tổng mục tiêu one-hot bằng 1.
- **Level 2:** Tại sao ghép softmax với cross-entropy thay vì với sai số bình phương? Expected: log đảo ngược hàm mũ, vì vậy gradient tuyến tính theo sai số và không bao giờ phẳng ra.
- **Level 3:** Gradient thay đổi như thế nào với label smoothing 0.1 trên mười lớp? Expected: mục tiêu trở thành 0.91 tại lớp đúng và 0.01 ở nơi khác, vì vậy gradient là p trừ vector đó và đạt không tại 0.91, không tại 1.0.
- **Level 3:** Một framework cung cấp một loss trên logits và một loss trên log xác suất. Bạn gọi cái nào? Expected: cái trên logits, hợp nhất log-softmax và negative log-likelihood trong một bước ổn định số học.

## Wrong answers

- "Gradient là âm 1 chia p tại lớp đúng, như binary cross-entropy." Đó là đạo hàm theo xác suất; qua softmax, đạo hàm theo logit là p trừ mục tiêu.
- "Chỉ lớp đúng có một gradient, vì chỉ nó xuất hiện trong loss." Mọi logit xuất hiện trong mẫu số softmax, vì vậy mọi logit nhận p của nó làm gradient.
- "Chia cho số lớp." Gradient mỗi mẫu là p trừ mục tiêu; lấy trung bình trên một batch chia cho kích thước batch, không phải số lớp.

## Taught in

[Bài học các hàm loss](../../../phases/03-deep-learning-core/05-loss-functions/) viết hàm này và giải thích tại sao việc ghép cặp đơn giản hóa.
