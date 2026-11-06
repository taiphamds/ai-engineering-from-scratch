---
id: temperature-knob
title: What temperature does to sampling
card: coding
kind: concept
level: 1
roles: [applied-ai-engineer, inference-engineer, ai-developer-relations-engineer]
rounds: [coding, screen]
tags: [sampling, temperature, generation]
minutes: 6
lessons: [phases/19-capstone-projects/35-gpt-model-assembly]
manuals: []
practice: [lab-sampling-temperature]
cheatsheet: [bert-gpt-t5]
related: [coding/top-k-then-sample, coding/top-p-crossing-token]
updated: 2026-11-03
---

Viết một dòng áp dụng temperature lấy mẫu cho một vector logits, rồi cho tôi biết điều gì xảy ra với phân phối khi temperature tiến về không, bằng một, và vượt quá một.

## Short answer

Chia logits cho temperature trước softmax. Gần không phép chia kéo giãn các khoảng cách giữa các logit, vì vậy logit lớn nhất chiếm gần như toàn bộ khối lượng và việc lấy mẫu trở thành greedy. Ở một phân phối riêng của mô hình được dùng, và trên một các khoảng cách co lại, phân phối phẳng ra, và các token hiếm được lấy thường xuyên hơn.

## Full answer

### The line

```python
probs = softmax(logits / temperature)
```

Thứ tự quan trọng trong một bộ lấy mẫu đầy đủ: vòng lặp sinh đọc logits của vị trí cuối cùng, chia cho temperature, áp dụng bất kỳ bộ lọc top-k hoặc top-p nào, lấy softmax, và lấy một token.

### Three regimes

| Temperature | Tác động lên các khoảng cách giữa các logit | Hành vi |
|---|---|---|
| Tiến về không | Các khoảng cách tăng không giới hạn | Argmax; cùng một token mỗi lần |
| Bằng một | Không thay đổi | Phân phối tự nhiên của mô hình |
| Trên một | Các khoảng cách co lại | Phân phối phẳng hơn, nhiều bất ngờ hơn, nhiều lỗi hơn |

### Why division and not multiplication

Nhân logits với temperature làm điều ngược lại với điều mọi người mong đợi: một giá trị cao hơn làm phân phối sắc hơn. Bài lab thực hành có một biến thể lỗi mắc sai lầm này, và dấu của tác động là điều đầu tiên các kiểm thử của nó kiểm tra.

### Reading the effect

Hai phép đo cho thấy một temperature đã làm gì: xác suất của token đứng đầu, và entropy của phân phối. Khi temperature tăng xác suất đứng đầu giảm và entropy tăng. Một phép quét qua các temperature trên logits cố định làm cả hai đường cong hiện rõ mà không có mô hình trong vòng lặp.

## Follow-ups

- **Level 1:** Tại sao temperature bằng không cần một trường hợp đặc biệt trong mã? Expected: chia cho không; triển khai nó thành argmax thay vì chia.
- **Level 2:** Một sản phẩm muốn đầu ra có tính xác định. Temperature bằng không có đủ không? Expected: nó loại bỏ tính ngẫu nhiên của việc lấy mẫu, nhưng các trường hợp bằng nhau và khác biệt số học giữa các batch vẫn có thể thay đổi argmax.
- **Level 2:** Temperature tương tác với một ngưỡng cắt top-p như thế nào? Expected: ngưỡng cắt phải chạy trên các xác suất đã điều chỉnh theo temperature, nếu không nó cắt phân phối ở temperature bằng một và thiết lập có ít tác dụng hơn mong đợi.

## Wrong answers

- "Temperature điều chỉnh tỷ lệ các xác suất sau softmax." Điều chỉnh tỷ lệ các xác suất rồi chuẩn hóa lại không thay đổi gì; phép chia diễn ra trên logits.
- "Một temperature cao hơn làm mô hình thông minh hơn." Nó chỉ làm phẳng phân phối, đánh đổi sự lặp lại để có nhiều sai sót hơn.
- "Temperature bằng một nghĩa là không lấy mẫu." Nó có nghĩa là lấy mẫu từ phân phối không thay đổi; greedy là temperature bằng không hoặc argmax.

## Taught in

[Bài học lắp ráp GPT](../../../phases/19-capstone-projects/35-gpt-model-assembly/) mô tả ba chế độ temperature trong vòng lặp sinh của nó, và [bài lab temperature](../../../practice/lab-sampling-temperature/) quét chúng trên logits cố định.
