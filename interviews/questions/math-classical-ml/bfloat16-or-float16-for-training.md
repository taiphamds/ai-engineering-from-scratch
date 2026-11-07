---
id: bfloat16-or-float16-for-training
title: Pick a 16-bit format for training and one for inference
card: math-classical-ml
kind: tradeoff
level: 3
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [ml-depth, system-design]
tags: [numerical-stability, bfloat16, float16, mixed-precision, loss-scaling]
minutes: 12
lessons: [phases/01-math-foundations/13-numerical-stability]
manuals: []
practice: []
cheatsheet: [information-numerics]
related: [math-classical-ml/variance-of-large-numbers, math-classical-ml/softmax-inf-at-large-logits]
updated: 2026-11-03
---

Stack huấn luyện của bạn có thể chạy trong float16 hoặc bfloat16. Một đồng đội chọn float16 vì nó giữ nhiều chữ số hơn. Bạn chọn định dạng nào cho huấn luyện, định dạng nào cho suy luận, và một trong chúng cần cơ chế bổ sung gì?

## Short answer

Chọn bfloat16 cho huấn luyện. Nó có cùng số mũ 8-bit như float32, nên nó bao phủ cùng khoảng đến khoảng 3.4e38, và các activation, logit và gradient tăng vọt quá 65,504 không overflow. float16 có 10 bit mantissa và độ chính xác cao hơn, nhưng số mũ 5-bit của nó đạt trần ở 65,504 và underflow các gradient dưới khoảng 6e-8, nên nó cần loss scaling để huấn luyện. Với suy luận, nơi các giá trị bị chặn và độ chính xác quan trọng hơn, float16 là lựa chọn thông thường.

## Full answer

### The two layouts

```text
float16:   [1 sign] [5 exponent]  [10 mantissa]   max about 65,504
bfloat16:  [1 sign] [8 exponent]  [7 mantissa]    max about 3.4e38
```

Mantissa quyết định độ chính xác, số mũ quyết định khoảng. Huấn luyện cần khoảng: một loss tăng vọt, một logit lớn hoặc một gradient rất nhỏ đều nằm xa 1. Các giá trị suy luận bị chặn bởi các trọng số đã huấn luyện, nên ba bit mantissa bổ sung của float16 đáng giá hơn ở đó.

### What goes wrong in float16

- Overflow: một activation trên 65,504 trở thành inf, và inf làm hỏng mọi giá trị phía sau.
- Underflow: các gradient thường quanh 1e-8 hoặc nhỏ hơn, và float16 làm tròn mọi thứ dưới khoảng 6e-8 về không. Các trọng số ngừng thay đổi, không có lỗi.

### Loss scaling

Mixed precision giữ một bản sao chính float32 của trọng số, chạy các lượt forward và backward trong định dạng 16-bit, và tính loss trong float32. Để giữ các gradient float16 trên ngưỡng underflow, nhân loss với một hằng số lớn như 1024 trước backward, để mọi gradient lớn hơn 1024 lần, rồi chia các gradient cho cùng hằng số trước cập nhật. Cập nhật không thay đổi. Dynamic loss scaling bắt đầu cao, ở 65536 trong bài học, giảm scale một nửa khi có gradient inf đầu tiên, và tăng gấp đôi lại sau một chuỗi bước sạch.

### Why bfloat16 skips most of this

bfloat16 là 16 bit trên cùng của một float32: bỏ các bit mantissa thấp và số mũ không đổi. Khoảng của nó bao phủ phổ gradient, nên loss scaling thường không cần thiết, và chuyển đổi là một phép cắt. Cái giá là độ chính xác: khoảng 2 đến 3 chữ số thập phân, so với 3 đến 4 cho float16.

### Symptoms that point here

Danh sách bug của bài học có ba mục với nguyên nhân này: độ chính xác validation thấp hơn bài báo 1 đến 3 phần trăm sau khi chuyển sang float16, các norm gradient bằng 0.0 trong một số lớp, và một lần chạy phân kỳ sau khi chuyển từ float32 sang float16. Các cách sửa là loss scaling hoặc bfloat16.

## Follow-ups

- **Level 3:** Tại sao các gradient nhỏ biến mất trong float16 và không trong bfloat16? Expected: các giá trị chuẩn nhỏ nhất của float16 nằm gần 6e-8 và các gradient nhỏ hơn làm tròn về 0; số mũ của bfloat16 đạt khoảng của float32.
- **Level 3:** Dynamic loss scaling làm gì khi một gradient thành inf? Expected: bỏ qua bước, giảm scale một nửa, và tăng gấp đôi lại sau một chuỗi bước sạch.
- **Level 4:** Bạn chuyển từ float32 sang float16 và độ chính xác validation giảm vài phần trăm mà không có lỗi. Điều gì đã xảy ra? Expected: underflow gradient đưa các cập nhật nhỏ về không; bật loss scaling hoặc chuyển sang bfloat16.
- **Level 4:** Tại sao bfloat16 ít tốn kém khi chuyển từ float32? Expected: nó là 16 bit trên cùng của một float32, nên chuyển đổi bỏ các bit mantissa thấp và số mũ không đổi.

## Wrong answers

- "Nhiều bit mantissa hơn có nghĩa là huấn luyện tốt hơn, nên float16 thắng." Huấn luyện bị giới hạn bởi khoảng; một logit tăng vọt quá 65,504 thành inf trong float16 và vẫn ổn trong bfloat16.
- "Loss scaling thay đổi kết quả huấn luyện." Chia các gradient cho cùng hệ số trước cập nhật cho cùng cập nhật; scale chỉ nâng các giá trị nhỏ lên trên ngưỡng underflow.
- "Dùng bfloat16 ở mọi nơi, kể cả suy luận." Các giá trị suy luận bị chặn và độ chính xác float16 bổ sung giúp ích ở đó; bài học đặt float16 làm mặc định suy luận.

## Taught in

[Bài học về tính ổn định số](../../../phases/01-math-foundations/13-numerical-stability/) so sánh các định dạng, giải thích loss scaling, và liệt kê các bug mixed precision.
