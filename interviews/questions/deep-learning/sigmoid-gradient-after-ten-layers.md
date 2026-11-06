---
id: sigmoid-gradient-after-ten-layers
title: How much gradient survives ten sigmoid layers
card: deep-learning
kind: estimate
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [ml-depth, screen]
tags: [vanishing-gradient, sigmoid, backpropagation, activation-functions]
minutes: 8
lessons: [phases/03-deep-learning-core/03-backpropagation, phases/03-deep-learning-core/04-activation-functions]
manuals: []
practice: [mlp-backprop]
cheatsheet: [neural-net-basics]
related: [deep-learning/stacked-linear-layers-collapse, deep-learning/half-the-relus-are-dead]
updated: 2026-11-03
---

Một mạng có mười lớp ẩn, mỗi lớp với một sigmoid activation. Ước tính hệ số lớn nhất mà chỉ các đạo hàm sigmoid cho một gradient giữ được trên đường từ loss đến lớp đầu tiên, và nói con số đó có nghĩa gì cho huấn luyện.

## Short answer

Đạo hàm sigmoid là s nhân (1 - s), đạt đỉnh ở 0.25 khi đầu ra là 0.5. Backpropagation nhân với đạo hàm đó một lần mỗi lớp, vì vậy sau mười lớp các hệ số activation nhân thành tối đa 0.25 lũy thừa mười, khoảng một phần triệu. Mỗi lớp cũng nhân với ma trận trọng số chuyển vị của nó, và các trọng số có chuẩn trên 1 có thể phóng lớn gradient, vì vậy con số chỉ chặn phần activation. Với các trọng số ban đầu nhỏ của bài học, những lớp đầu nhận gần như không có tín hiệu và giữ gần khởi tạo trong khi những lớp cuối học, chính là vấn đề gradient tiêu biến.

## Full answer

### The chain through the layers

Tại mỗi lớp lượt truyền ngược tính gradient của loss theo pre-activation bằng gradient đi vào nhân đạo hàm của activation tại điểm đó. Với một sigmoid đạo hàm đó là a(1 - a) cho một đầu ra a. Giá trị lớn nhất của nó là 0.25, tại a bằng 0.5. Sâu ba lớp tích tối đa là 0.25 lập phương, bằng 0.0156. Sâu mười lớp nó là 0.25 lũy thừa mười, mà các bài học viết là 0.000001 và là 0.000000953674.

### Why the bound is optimistic

Giá trị 0.25 chỉ đúng cho một đơn vị có đầu ra chính xác là 0.5. Một đơn vị gần 0 hoặc gần 1 bị bão hòa và có một đạo hàm gần 0. Các mạng thực có nhiều đơn vị bão hòa, vì vậy phần activation co lại nhiều hơn một phần triệu. Giới hạn cũng bỏ qua các ma trận trọng số. Backpropagation nhân với trọng số chuyển vị của mỗi lớp, và các trọng số có chuẩn trên 1 có thể phóng lớn gradient, trong khi các trọng số nhỏ thu nhỏ nó thêm. Một chi phí thứ hai: các đầu ra sigmoid luôn dương, vì vậy các gradient trên trọng số của một lớp có chung một dấu và quá trình giảm đi zigzag.

### What changes the arithmetic

- Tanh có một đạo hàm đạt đỉnh ở 1.0, gấp bốn sigmoid, nhưng nó vẫn giảm về 0 với các đầu vào lớn, vì vậy các chồng tanh sâu cũng tiêu biến, chỉ chậm hơn.
- ReLU có một đạo hàm chính xác là 1 cho các đầu vào dương. Gradient đi qua không thay đổi và tích không co lại. Đây là thay đổi làm các mạng sâu huấn luyện được.
- GELU giữ một gradient trơn và tránh sự cố đơn vị chết của ReLU, là lý do transformer dùng nó.
- Mạng riêng của bài học điều chỉnh tỷ lệ các trọng số ban đầu của nó bằng căn bậc hai của 2 chia số đầu vào, để giữ các đơn vị sigmoid sớm ngoài bão hòa.

### How to see it in a run

Ghi log gradient tuyệt đối trung bình mỗi lớp. Trong một mạng khỏe các lớp nằm trong một hệ số nhỏ của nhau. Trong một mạng tiêu biến lớp đầu thấp hơn lớp cuối nhiều bậc độ lớn.

## Follow-ups

- **Level 2:** Tại sao 0.25 là một cận trên chứ không phải giá trị điển hình? Expected: đạo hàm chỉ là 0.25 tại một đầu ra 0.5; các đơn vị bão hòa gần 0 hoặc 1 có các đạo hàm gần 0, vì vậy mức co thực tệ hơn.
- **Level 2:** Tanh so sánh như thế nào? Expected: đạo hàm của nó đạt đỉnh ở 1.0, tốt hơn bốn lần, nhưng nó vẫn giảm về 0 với các đầu vào lớn, vì vậy các chồng tanh sâu cũng tiêu biến.
- **Level 3:** ReLU thay đổi điều gì trong phép tính? Expected: đạo hàm chính xác là 1 cho các đầu vào dương, vì vậy gradient đi qua không thay đổi và tích không co lại.
- **Level 3:** Bạn quan sát vấn đề mà không có công thức như thế nào? Expected: ghi log gradient tuyệt đối trung bình mỗi lớp; các lớp đầu cho thấy các giá trị thấp hơn lớp cuối nhiều bậc độ lớn.

## Wrong answers

- "Gradient tiêu biến vì learning rate quá nhỏ." Một learning rate lớn hơn điều chỉnh tỷ lệ mọi lớp; tỷ số giữa các lớp đầu và cuối giữ gần một phần triệu.
- "Các đầu ra sigmoid nằm giữa 0 và 1, vì vậy gradient nằm giữa 0 và 1 và điều đó ổn." Đạo hàm, không phải đầu ra, nhân xuyên các lớp, và giá trị lớn nhất của nó là 0.25.
- "Backpropagation bị hỏng cho các mạng sâu." Backpropagation tính gradient chính xác; chính gradient rất nhỏ vì những gì nó đi qua.

## Taught in

[Bài học backpropagation](../../../phases/03-deep-learning-core/03-backpropagation/) tính tích qua các lớp, và [bài học các hàm activation](../../../phases/03-deep-learning-core/04-activation-functions/) so sánh các đạo hàm của sigmoid, tanh, ReLU và GELU.
