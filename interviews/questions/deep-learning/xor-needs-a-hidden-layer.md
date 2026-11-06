---
id: xor-needs-a-hidden-layer
title: Why one perceptron never learns XOR
card: deep-learning
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [screen, ml-breadth]
tags: [perceptron, xor, linear-separability, hidden-layer]
minutes: 5
lessons: [phases/03-deep-learning-core/01-the-perceptron, phases/03-deep-learning-core/02-multi-layer-networks]
manuals: []
practice: [train-xor-mlp]
cheatsheet: [neural-net-basics]
related: [deep-learning/stacked-linear-layers-collapse, deep-learning/weight-matrix-rows-and-columns]
updated: 2026-11-03
---

Một perceptron duy nhất học các cổng AND và OR trong vài epoch. Trên cổng XOR nó không bao giờ hội tụ, ngay cả sau 1000 epoch. Tại sao không, và thay đổi nhỏ nhất cho mô hình khiến XOR học được là gì?

## Short answer

Một perceptron lấy một tổng có trọng số, cộng một bias và áp dụng một ngưỡng, vì vậy ranh giới quyết định của nó là một đường thẳng. AND và OR đặt các số một của chúng ở một phía của một đường. XOR đặt các số một tại (0, 1) và (1, 0) và các số không tại (0, 0) và (1, 1), và không một đường duy nhất nào tách hai cặp đó. Thêm một lớp ẩn: hai neuron tính OR và NAND, và một neuron đầu ra thực hiện AND chúng, cho XOR chính xác.

## Full answer

### What one perceptron can draw

Đầu ra là 1 khi w1 x1 + w2 x2 + b ít nhất bằng 0 và 0 trong trường hợp khác. Tập các điểm nơi tổng bằng 0 là một đường, và huấn luyện di chuyển đường đó. Quy tắc học nhỏ: khi một dự đoán sai, cộng learning rate nhân sai số nhân đầu vào vào mỗi trọng số, và sai số vào bias. Khi dự đoán đúng, sai số là 0 và không gì di chuyển. Trên một dataset phân tách tuyến tính được điều này tìm một đường phân tách. Trên XOR không có đường nào, vì vậy các trọng số tiếp tục thay đổi mãi. Lần chạy của bài học với 1000 epoch báo cáo rằng nó không hội tụ.

### The fix

XOR bằng (x1 OR x2) AND NOT (x1 AND x2). Ba perceptron trong hai lớp tính nó:

```text
OR neuron:    weights [1.0, 1.0],   bias -0.5
NAND neuron:  weights [-1.0, -1.0], bias 1.5
AND neuron:   weights [1.0, 1.0],   bias -1.5   on the two hidden outputs
```

Lớp đầu biến bốn điểm đầu vào thành các đặc trưng mới. Trong không gian đặc trưng đó hai lớp phân tách được, và neuron đầu ra vẽ một đường ở đó.

### From hand-wired to learned

Hàm bước không có gradient hữu ích, vì vậy các trọng số ẩn không thể được học bằng backpropagation. Thay nó bằng một sigmoid, trơn, và cùng hình dạng 2-2-1 học XOR từ các trọng số ngẫu nhiên. Bài học nhiều lớp cho thấy phiên bản sigmoid nối tay, với các trọng số 20 và -20 và các bias -10, 30 và -30, nơi các trọng số lớn khiến sigmoid hoạt động như một bước. Đây là điểm nơi một perceptron trở thành một mạng neuron.

## Follow-ups

- **Level 1:** Quy tắc học làm gì khi một dự đoán đúng? Expected: sai số là 0, vì vậy không trọng số nào thay đổi.
- **Level 2:** Tại sao hàm bước chặn việc học trong phiên bản hai lớp? Expected: nó không có gradient hữu ích, vì vậy backpropagation không thể phân bổ trách nhiệm cho các trọng số ẩn; sigmoid trơn và có một gradient ở mọi nơi.
- **Level 2:** Tại sao các trọng số 20 và -20 hoạt động trong phiên bản sigmoid? Expected: các trọng số lớn khiến sigmoid hoạt động như một bước, vì vậy mỗi neuron ẩn là một OR hoặc NAND rõ ràng.
- **Level 3:** Một hàm đa số ba đầu vào có phân tách tuyến tính được không? Expected: có; xuất ra 1 khi ít nhất hai đầu vào là 1 là một nửa không gian, vì vậy một perceptron học nó.

## Wrong answers

- "Huấn luyện lâu hơn hoặc tăng learning rate." Không đường nào tách các điểm XOR, vì vậy không số epoch nào tìm được một đường.
- "Thêm đầu vào hoặc thêm neuron trong cùng lớp." Một lớp đơn rộng hơn vẫn vẽ một đường qua cùng mặt phẳng.
- "Một lớp ẩn không có activation sửa nó." Hai lớp tuyến tính hợp thành một ánh xạ tuyến tính, lại là một đường. Lớp ẩn cần một tính phi tuyến.

## Taught in

[Bài học perceptron](../../../phases/03-deep-learning-core/01-the-perceptron/) cho thấy sự cố XOR và lời giải ba cổng, và [bài học các mạng nhiều lớp](../../../phases/03-deep-learning-core/02-multi-layer-networks/) xây dựng phiên bản sigmoid.
