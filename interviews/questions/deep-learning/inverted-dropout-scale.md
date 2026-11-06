---
id: inverted-dropout-scale
title: Why the dropout mask holds 1 over (1 minus p)
card: deep-learning
kind: code-reading
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, ml-depth]
tags: [dropout, regularization, backward-pass, eval-mode]
minutes: 8
lessons: [phases/03-deep-learning-core/07-regularization, phases/03-deep-learning-core/10-mini-framework]
manuals: []
practice: [inverted-dropout]
cheatsheet: [deep-learning-training]
related: [deep-learning/train-mode-and-eval-mode, deep-learning/layernorm-not-batchnorm]
updated: 2026-11-03
---

Module dropout này đến từ một framework nhỏ.

```python
class Dropout(Module):
    def __init__(self, p=0.5):
        super().__init__()
        self.p = p
        self.mask = None

    def forward(self, x):
        if not self.training:
            return x
        self.mask = [0.0 if random.random() < self.p else 1.0 / (1 - self.p) for _ in x]
        return [v * m for v, m in zip(x, self.mask)]

    def backward(self, grad):
        if self.mask is None:
            return grad
        return [g * m for g, m in zip(grad, self.mask)]
```

Tại sao các phần tử được giữ lại của mask giữ 1 chia (1 trừ p) thay vì 1, và tại sao backward tái sử dụng cùng mask? Điều gì sẽ thay đổi nếu forward giữ 1 và việc điều chỉnh tỷ lệ chuyển sang thời điểm đánh giá?

## Short answer

Mỗi đơn vị được đặt về không với xác suất p, vì vậy giá trị kỳ vọng của một đơn vị giảm xuống (1 - p) lần giá trị ban đầu. Chia các đơn vị được giữ lại cho (1 - p) khôi phục kỳ vọng đó trong huấn luyện, để đánh giá chạy mạng thông thường không có thay đổi. Backward nhân với cùng mask vì lượt truyền tiến là một phép điều chỉnh tỷ lệ theo từng đơn vị, và đạo hàm của một phép điều chỉnh tỷ lệ là hệ số tỷ lệ. Chuyển hệ số sang thời điểm đánh giá cũng hoạt động, nhưng khi đó mọi đường suy luận phải biết tỷ lệ dropout.

## Full answer

### The expectation argument

Một phần tử mask là 0 với xác suất p và 1 chia (1 - p) trong trường hợp khác. Giá trị kỳ vọng của nó là (1 - p) nhân 1 chia (1 - p), bằng 1. Vì vậy đầu ra kỳ vọng của mỗi đơn vị trong huấn luyện bằng đầu ra của nó khi tắt dropout. Mạng thấy cùng tỷ lệ trong cả hai chế độ, và đường đánh giá hoàn toàn không có mã dropout. Bài học gọi đây là inverted dropout. Dạng ban đầu giữ mask ở 1 và nhân với (1 - p) lúc kiểm thử, buộc mã suy luận biết p.

### The backward pass

Dropout là một phép điều chỉnh tỷ lệ từng phần tử bằng mask. Gradient của đầu vào là gradient của đầu ra nhân cùng mask: các đơn vị bị bỏ nhận 0, các đơn vị được giữ nhận gradient được nhân tỷ lệ 1 chia (1 - p). Mask phải là mask từ lượt truyền tiến tương ứng, vì lượt truyền ngược vi phân hàm đã chạy truyền tiến. Một mask mới sẽ truyền gradient đến các đơn vị đã tắt và điều chỉnh tỷ lệ các đơn vị đã bật. Điều kiện bảo vệ khi thiếu mask chỉ bao phủ một lời gọi backward trước bất kỳ lượt truyền tiến huấn luyện nào. Nhánh đánh giá trả về trước khi thay đổi mask, vì vậy một lời gọi backward sau một lượt truyền tiến đánh giá tái sử dụng mask của lượt truyền tiến huấn luyện cuối.

### What dropout buys

Đặt các đơn vị ngẫu nhiên về không ngăn neuron dựa vào việc những neuron cụ thể khác hiện diện, điều mà bài học gọi là co-adaptation. Mỗi mask chọn một mạng con, vì vậy huấn luyện lấy mẫu từ khoảng 2 lũy thừa N mạng con của N đơn vị, và đánh giá lấy trung bình chúng trong một lượt bằng cách chạy toàn bộ mạng tại kỳ vọng đã điều chỉnh tỷ lệ. Các tỷ lệ mặc định: 0.1 cho transformer, 0.5 cho MLP, 0.2 đến 0.3 cho CNN. p cao hơn là regularization mạnh hơn và nhiều rủi ro underfitting hơn.

## Follow-ups

- **Level 2:** Một đơn vị bị bỏ nhận gradient gì? Expected: không, vì phần tử mask của nó là 0.
- **Level 2:** Tại sao backward phải dùng mask từ cùng lượt truyền tiến? Expected: lượt truyền ngược vi phân hàm đã chạy truyền tiến; một mask mới sẽ điều chỉnh tỷ lệ các đơn vị hoạt động sai và truyền gradient đến các đơn vị không hoạt động.
- **Level 3:** Cách hiểu ensemble của dropout là gì? Expected: mỗi mask xác định một mạng con, vì vậy huấn luyện lấy mẫu từ khoảng 2 lũy thừa N mạng con, và đánh giá lấy trung bình chúng bằng cách chạy toàn bộ mạng tại kỳ vọng đã điều chỉnh tỷ lệ.
- **Level 3:** Bài học đưa ra tỷ lệ nào cho một transformer, và tại sao nó thấp hơn cho một MLP? Expected: 0.1 so với 0.5; một tỷ lệ cao hơn là regularization mạnh hơn với nhiều rủi ro underfitting hơn, và mặc định transformer là tỷ lệ nhẹ hơn.

## Wrong answers

- "Hệ số tỷ lệ làm tổng các đầu ra bằng một." Nó khôi phục giá trị kỳ vọng của mỗi đơn vị, không phải một tổng.
- "Backward nên lấy một mask mới để khám phá." Lượt truyền ngược vi phân hàm đã chạy truyền tiến; một mask khác cho gradient của một hàm khác.
- "Trong chế độ đánh giá cũng nhân với (1 - p)." Với inverted dropout việc điều chỉnh tỷ lệ đã xảy ra trong huấn luyện; điều chỉnh tỷ lệ lần nữa khi đánh giá làm co mọi activation.

## Taught in

[Bài học regularization](../../../phases/03-deep-learning-core/07-regularization/) suy ra inverted dropout, và [bài học framework nhỏ](../../../phases/03-deep-learning-core/10-mini-framework/) biến nó thành module này.
