---
id: weight-matrix-rows-and-columns
title: Read the shapes of a 2-3-1 network from its Layer class
card: deep-learning
kind: code-reading
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [coding, screen]
tags: [forward-pass, shapes, weight-matrix, debugging]
minutes: 8
lessons: [phases/03-deep-learning-core/02-multi-layer-networks]
manuals: []
practice: []
cheatsheet: [neural-net-basics]
related: [deep-learning/xor-needs-a-hidden-layer, deep-learning/missing-zero-grad]
updated: 2026-11-03
---

Lớp Layer này đến từ một lượt truyền tiến Python thuần.

```python
class Layer:
    def __init__(self, n_inputs, n_neurons, weights=None, biases=None):
        if weights is not None:
            self.weights = weights
        else:
            self.weights = [
                [random.uniform(-1, 1) for _ in range(n_inputs)]
                for _ in range(n_neurons)
            ]
        self.biases = biases if biases is not None else [0.0] * n_neurons

    def forward(self, inputs):
        self.last_output = []
        for neuron_idx in range(len(self.weights)):
            z = sum(w * x for w, x in zip(self.weights[neuron_idx], inputs))
            z += self.biases[neuron_idx]
            self.last_output.append(sigmoid(z))
        return self.last_output
```

Với một mạng 2-3-1, đưa ra hình dạng của mỗi ma trận trọng số và bias. Rồi nói điều gì xảy ra khi ai đó xây dựng lớp ẩn thành `Layer(n_inputs=3, n_neurons=2)` do nhầm lẫn.

## Short answer

Các trọng số ẩn tạo thành một ma trận 3 nhân 2, một hàng cho mỗi neuron và một cột cho mỗi đầu vào, với một bias dài 3; các trọng số đầu ra tạo thành một ma trận 1 nhân 3 với một bias dài 1. Lời gọi hoán đổi xây dựng một ma trận 2 nhân 3: zip ghép ba trọng số của mỗi hàng với hai đầu vào và dừng ở bên ngắn hơn, lớp trả về hai giá trị thay vì ba, và zip của lớp đầu ra lại cắt cụt. Không có gì phát sinh lỗi, và mạng tính hàm sai.

## Full answer

### The rule and the table

Ma trận trọng số của một lớp có hình dạng (neuron trong lớp này, neuron trong lớp trước). Các hàng khớp lớp hiện tại, các cột khớp lớp trước.

| Bước | Thao tác | Hình dạng | Kết quả |
|---|---|---|---|
| Đầu vào | x | | (2,) |
| Tuyến tính ẩn | W1 x + b1 | W1 (3, 2), b1 (3,) | (3,) |
| Activation ẩn | sigmoid | | (3,) |
| Tuyến tính đầu ra | W2 h + b2 | W2 (1, 3), b2 (1,) | (1,) |
| Activation đầu ra | sigmoid | | (1,) |

Trong lớp, `len(self.weights)` là số neuron và mỗi hàng có `n_inputs` phần tử. Vòng lặp truyền tiến tính một tích vô hướng mỗi hàng, cộng bias của hàng đó, và áp dụng sigmoid. Đầu ra của một lớp là danh sách đầu vào của lớp tiếp theo.

### What the swapped call does

`Layer(n_inputs=3, n_neurons=2)` cấp phát hai hàng ba trọng số. Lượt truyền tiến nhận một đầu vào hai phần tử. Zip của Python dừng ở chuỗi ngắn hơn, vì vậy mỗi hàng chỉ dùng hai trọng số đầu của nó và trọng số thứ ba bị bỏ qua. Lớp trả về hai giá trị. Lớp đầu ra được xây dựng cho ba đầu vào, vì vậy zip của nó cũng bỏ một trọng số. Không ngoại lệ, không cảnh báo, và một mô hình có các tham số chết một phần. Một thư viện ma trận sẽ phát sinh lỗi khi kích thước bên trong không khớp; vòng lặp này thì không, là lý do bài học gọi việc theo dõi hình dạng là kỹ năng gỡ lỗi quan trọng nhất trong deep learning.

### Make it fail loudly

Thêm một khẳng định trong forward rằng độ dài đầu vào bằng số cột, hoặc để lớp Network kiểm tra rằng số đầu vào của mỗi lớp bằng số neuron của lớp trước khi nó được xây dựng.

## Follow-ups

- **Level 2:** Mạng 2-3-1 có bao nhiêu tham số? Expected: chín trong lớp ẩn, sáu trọng số và ba bias, và bốn trong lớp đầu ra, ba trọng số và một bias.
- **Level 2:** Tại sao vòng lặp không phát sinh lỗi trên các hình dạng hoán đổi? Expected: zip dừng ở chuỗi ngắn hơn, vì vậy các trọng số thừa bị bỏ qua và không có lỗi xảy ra; một thư viện ma trận sẽ phát sinh lỗi khi không khớp.
- **Level 3:** Bạn đặt một phép kiểm tra ở đâu để lỗi thất bại ngay? Expected: một khẳng định trong forward rằng độ dài đầu vào bằng số cột, hoặc một phép kiểm tra hình dạng giữa các lớp khi Network được xây dựng.
- **Level 3:** Một mô hình văn bản có một trạng thái ẩn rộng 768 và đầu vào của nó là một token id. Quy tắc còn đúng không? Expected: có; embedding ánh xạ token đến một vector 768, và mỗi ma trận sau có số hàng bằng chiều rộng riêng và số cột bằng chiều rộng trước.

## Wrong answers

- "Ma trận trọng số là đầu vào nhân neuron, vì vậy 2 nhân 3 cho lớp ẩn." Trong lớp này mỗi hàng giữ các trọng số của một neuron trên mọi đầu vào, vì vậy ma trận là neuron nhân đầu vào.
- "Một hình dạng sai luôn phát sinh một lỗi." Một matmul thư viện phát sinh lỗi; vòng lặp với zip này thì không, và một framework có thể broadcast một hình dạng sai âm thầm.
- "Có một bias cho mỗi đầu vào." Một bias thuộc về một neuron, vì vậy có một bias cho mỗi đầu ra của lớp.

## Taught in

[Bài học các mạng nhiều lớp](../../../phases/03-deep-learning-core/02-multi-layer-networks/) xây dựng lớp Layer này và lần theo các chiều của mạng 2-3-1.
