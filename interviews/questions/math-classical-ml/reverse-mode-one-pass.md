---
id: reverse-mode-one-pass
title: Why backpropagation runs the chain rule in reverse
card: math-classical-ml
kind: concept
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [ml-depth, screen]
tags: [autodiff, chain-rule, reverse-mode, backpropagation]
minutes: 8
lessons: [phases/01-math-foundations/05-chain-rule-and-autodiff]
manuals: []
practice: []
cheatsheet: [calculus-optimization]
related: [math-classical-ml/grad-accumulate-plus-equals]
updated: 2026-11-03
---

Vi phân tự động có thể đẩy các đạo hàm tiến từ đầu vào hoặc kéo chúng lùi từ đầu ra. Các framework huấn luyện chọn hướng lùi. Tại sao, và trong tình huống nào hướng tiến sẽ là lựa chọn tốt hơn?

## Short answer

Một mạng có hàng triệu tham số và một loss vô hướng. Reverse mode khởi tạo đầu ra với một gradient 1 và lấy gradient của mọi tham số trong một lượt quét lùi. Forward mode cần một lượt quét cho mỗi biến đầu vào, nên nó chỉ thắng khi đầu vào ít và đầu ra nhiều.

## Full answer

### The two modes

Cả hai chế độ áp dụng quy tắc chuỗi ở mọi node của đồ thị tính toán. Chúng khác nhau ở nơi đặt giá trị khởi tạo.

| Chế độ | Giá trị khởi tạo | Hướng | Tốt nhất khi |
|---|---|---|---|
| Forward | đạo hàm của một đầu vào theo chính nó, đặt thành 1 | đầu vào đến đầu ra | ít đầu vào, nhiều đầu ra |
| Reverse | đạo hàm của đầu ra theo chính nó, đặt thành 1 | đầu ra đến đầu vào | nhiều đầu vào, ít đầu ra |

Forward mode mang một đạo hàm qua đồ thị. Để lấy gradient của một loss theo một triệu trọng số, bạn sẽ chạy nó một triệu lần. Reverse mode mang gradient của loss đơn trở lại mọi node, và mỗi node nhân với đạo hàm cục bộ của nó và truyền kết quả cho các con của nó.

### What reverse mode costs

Lượt quét lùi thăm mỗi node một lần, nên thời gian tỷ lệ với một lượt forward. Engine phải sắp thứ tự các node trước. Một sắp xếp tô pô bảo đảm một node đã nhận gradient từ mọi bên sử dụng trước khi nó truyền gradient tiếp. Khi một giá trị cấp đầu vào cho nhiều phép toán, các đóng góp cộng lại.

### When forward mode is the right choice

Forward mode phù hợp với một hàm có một hoặc hai đầu vào và một đầu ra lớn, vì một lượt quét cho đạo hàm của toàn bộ đầu ra dọc một hướng đầu vào. Các số đối ngẫu triển khai nó với gần như không có mã: một cặp giá trị và đạo hàm, với quy tắc bình phương của phần đạo hàm bằng không, nên quy tắc tích xuất hiện từ phép tính.

## Follow-ups

- **Level 2:** Tại sao lượt quét lùi cần một thứ tự tô pô? Expected: một node phải nhận toàn bộ gradient từ mọi bên sử dụng trước khi nó truyền gradient cho các con của nó.
- **Level 3:** Một mô hình có một triệu trọng số cần bao nhiêu lượt quét forward-mode cho một gradient? Expected: một triệu, một cho mỗi biến đầu vào, đó là lý do không ai huấn luyện theo cách đó.
- **Level 3:** Một số đối ngẫu là gì và nó mang một đạo hàm như thế nào? Expected: một cặp giá trị và đạo hàm, nơi phần đạo hàm bình phương bằng không, nên mỗi quy tắc số học mang đạo hàm theo.
- **Level 4:** Nêu một trường hợp trong một hệ thống ML mà bạn sẽ chọn forward mode. Expected: một hàm có một hoặc hai đầu vào và một đầu ra vector lớn, nơi một lượt quét cho đạo hàm của toàn bộ đầu ra dọc một hướng đầu vào.

## Wrong answers

- "Reverse mode chính xác hơn forward mode." Cả hai chính xác đến mức làm tròn dấu phẩy động. Khác biệt là chi phí, không phải kết quả.
- "Forward mode không thể xử lý một hợp hàm." Cả hai chế độ áp dụng quy tắc chuỗi qua mọi liên kết. Forward mode đẩy đạo hàm từ phía đầu vào.
- "Backpropagation là một thuật toán khác với reverse-mode autodiff." Backpropagation là reverse-mode autodiff được áp dụng cho đồ thị mạng, với loss là đầu ra duy nhất.

## Taught in

[Bài học quy tắc chuỗi và autodiff](../../../phases/01-math-foundations/05-chain-rule-and-autodiff/) so sánh hai chế độ và xây dựng một engine reverse-mode.
