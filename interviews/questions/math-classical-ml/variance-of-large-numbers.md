---
id: variance-of-large-numbers
title: A variance that comes out wrong on large values
card: math-classical-ml
kind: debug
level: 3
roles: [ai-data-engineer, applied-ai-engineer, inference-engineer]
rounds: [debugging, ml-depth]
tags: [numerical-stability, catastrophic-cancellation, float32, variance]
minutes: 10
lessons: [phases/01-math-foundations/13-numerical-stability]
manuals: []
practice: []
cheatsheet: [information-numerics]
related: [math-classical-ml/softmax-inf-at-large-logits, math-classical-ml/gradient-check-step-size]
updated: 2026-11-03
---

Một pipeline đặc trưng tính phương sai của một cột bằng công thức trung bình của x bình phương trừ bình phương của trung bình, trong float32. Trên một cột có các giá trị gần một triệu, kết quả xa giá trị thật và đôi khi âm. Giải thích nguyên nhân và đề xuất một công thức vững.

## Short answer

Hai số hạng mỗi số khoảng 10 mũ 12 và gần bằng nhau, và hiệu của chúng là phương sai thật nhỏ. Trong float32, khoảng cách giữa các số lân cận ở độ lớn đó lớn hơn phương sai rất nhiều, nên phép trừ trả về nhiễu làm tròn, có thể âm. Thay vào đó tính phương sai từ các giá trị đã định tâm: trừ trung bình trước, hoặc dùng cập nhật chạy mà bài học gọi là thuật toán Welford.

## Full answer

### Catastrophic cancellation

Khi hai số dấu phẩy động gần bằng nhau được trừ, các chữ số đứng đầu của chúng triệt tiêu và sai số làm tròn của mỗi toán hạng trở thành các chữ số đứng đầu của kết quả. Ví dụ nhỏ của bài học trừ 1.0000001 và 1.0 trong float32 và nhận một sai số tương đối 19.2 phần trăm từ một phép toán duy nhất. Công thức phương sai làm điều này ở một thang lớn hơn nhiều.

### The numbers in the question

float32 giữ khoảng 7 chữ số thập phân. Với các giá trị gần một triệu, x bình phương gần 10 mũ 12, và khoảng cách giữa các số biểu diễn được ở đó lớn hơn 1 nhiều. Phương sai thật của các giá trị bài tập trong bài học, 1000000.0, 1000001.0 và 1000002.0, là 0.6667. Cả hai số hạng của công thức làm tròn về giá trị biểu diễn được gần nhất, và hiệu mang sự làm tròn, không phải phương sai. Một kết quả âm là có thể vì không có gì trong công thức ngăn sự làm tròn đảo dấu.

### A formula that holds

Định tâm trước, rồi bình phương:

```text
mean = sum(x) / n
variance = sum((x - mean)^2) / n
```

Các độ lệch là những số nhỏ, bình phương của chúng nhỏ, và không có các số hạng lớn gần bằng nhau bị trừ. Với một luồng giá trị mà hai lượt qua dữ liệu tốn quá nhiều, cập nhật Welford giữ một trung bình chạy và một tổng chạy của các độ lệch bình phương, và cập nhật cả hai với mỗi giá trị mới. Cả hai cách tiếp cận cho một kết quả gần 0.6667 cho các giá trị bài tập nơi công thức ngây thơ thất bại.

### The same shape elsewhere

Bài học liệt kê những nơi khác mẫu này xuất hiện: trừ các log xác suất gần bằng nhau, và một sai phân hữu hạn với một bước quá nhỏ. Cách chữa giống nhau mỗi lần: sắp xếp lại phép tính để các số hạng lớn gần bằng nhau không bao giờ bị trừ.

## Follow-ups

- **Level 3:** Tại sao kết quả ngây thơ có thể âm khi một phương sai không thể? Expected: kết quả là nhiễu làm tròn, và không có gì trong công thức chặn dấu của nhiễu.
- **Level 3:** Float64 có sửa pipeline không? Expected: nó di chuyển vấn đề đến các giá trị lớn hơn, khoảng 10 mũ 15 chữ số độ chính xác, nhưng cùng đầu vào được tăng tỷ lệ lại làm hỏng nó; công thức định tâm sửa nó ở mọi thang đo.
- **Level 4:** Cột đến như một luồng và bạn không thể giữ nó trong bộ nhớ cho hai lượt. Bạn làm gì? Expected: dùng cập nhật Welford, giữ một trung bình chạy và một tổng chạy của các độ lệch bình phương trong một lượt.
- **Level 4:** Cùng sự triệt tiêu này ẩn ở đâu bên trong một lớp chuẩn hóa? Expected: một layer norm hoặc batch norm tính phương sai bằng trung bình các bình phương trừ bình phương trung bình trên các activation có trung bình lớn; các triển khai định tâm trước vì lý do này.

## Wrong answers

- "Công thức là đại số đúng, nên mã chắc hẳn có lỗi gõ." Đại số chính xác và phép tính thì không. Hai số hạng mỗi số đúng đến khoảng 7 chữ số, và phương sai nằm dưới mức đó.
- "Chặn kết quả ở không." Điều đó giấu dấu và giữ độ lớn sai.
- "Chia cột cho một triệu trước và nhân phương sai trở lại." Scaling giúp ở đây, nhưng nó di chuyển trung bình, không phải vấn đề; một cột có trung bình lớn và độ trải rất nhỏ vẫn triệt tiêu. Định tâm trước.

## Taught in

[Bài học tính ổn định số](../../../phases/01-math-foundations/13-numerical-stability/) giải thích cách các số gần bằng nhau triệt tiêu và đặt phương sai này làm bài tập đầu tiên.
