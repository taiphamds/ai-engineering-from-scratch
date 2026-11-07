---
id: grad-accumulate-plus-equals
title: Why autograd adds gradients instead of setting them
card: math-classical-ml
kind: code-reading
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [coding, ml-depth]
tags: [autodiff, chain-rule, gradient-accumulation, gradient-checking]
minutes: 8
lessons: [phases/01-math-foundations/05-chain-rule-and-autodiff]
manuals: []
practice: [mlp-backprop]
cheatsheet: [calculus-optimization]
related: [math-classical-ml/reverse-mode-one-pass, math-classical-ml/gradient-check-step-size]
updated: 2026-11-03
---

Đây là phép nhân của một engine autograd nhỏ.

```python
def __mul__(self, other):
    other = other if isinstance(other, Value) else Value(other)
    out = Value(self.data * other.data, (self, other), '*')
    def _backward():
        self.grad += other.data * out.grad
        other.grad += self.data * out.grad
    out._backward = _backward
    return out
```

Một người đóng góp thay cả hai `+=` bằng `=`, với nhận xét rằng một gradient nên được gán, không phải cộng. Vòng lặp huấn luyện XOR vẫn chạy và loss vẫn giảm. Thay đổi đã làm hỏng gì, và bạn chứng minh nó trong một kiểm thử nhỏ như thế nào?

## Short answer

Một giá trị cấp đầu vào cho hai hoặc nhiều phép toán nhận một gradient từ mỗi bên sử dụng, và quy tắc chuỗi nói các đóng góp đó cộng lại. Với phép gán, bên sử dụng chạy cuối ghi đè các bên khác, nên mọi node dùng chung nhận một gradient sai, bao gồm mỗi trọng số mà loss được lấy tổng dùng một lần mỗi mẫu. Một kiểm tra gradient số phơi bày lỗi trong một lời gọi.

## Full answer

### What the chain rule says about shared nodes

Khi y phụ thuộc vào x qua hai đường, đạo hàm của y theo x là tổng các đạo hàm dọc mỗi đường. Trong engine, một node được dùng hai lần có hai closure ghi vào `grad` của nó. Thứ tự tô pô chạy mọi bên sử dụng trước khi node truyền gradient cho các con của chính nó, nên cả hai closure chạy, và closure thứ hai phải cộng vào closure thứ nhất.

### Why the loop still ran

Trong vòng lặp XOR, loss là tổng bốn sai số bình phương, một mỗi mẫu, và mọi trọng số tham gia cả bốn lượt forward. Với phép gán, mỗi trọng số chỉ giữ đóng góp của mẫu chạy cuối. Đó vẫn là một hướng thường chỉ xuống dốc, nên loss thay đổi. Dù vậy gradient sai cho mọi tham số.

### The one-line test

```python
x = Value(3.0)
y = x * x
y.backward()
```

Ở đây `self` và `other` là cùng một đối tượng. Gradient đúng của x bình phương tại 3 là 6.0. Hai closure mỗi closure cộng 3.0, cho 6.0. Với phép gán, kết quả là 3.0. `gradient_check` của bài học làm cùng việc cho bất kỳ biểu thức nào: nó so sánh engine với một sai phân hữu hạn trung tâm và báo cáo chênh lệch, phải thấp hơn nhiều so với 1e-5.

### The other side of the same rule

Vì các gradient cộng lại, vòng lặp huấn luyện phải đặt mọi `grad` về 0.0 trước mỗi lời gọi backward. Bài học làm điều này bằng một vòng lặp trên các tham số. Một framework làm tương tự bằng một lời gọi zero_grad. Cả hai thói quen đến từ cùng một thực tế: nơi lưu gradient là một bộ tích lũy.

## Follow-ups

- **Level 2:** Tại sao vòng lặp huấn luyện phải đặt mọi gradient về không trước backward? Expected: các gradient tích lũy, nên một backward thứ hai sẽ chồng lên lần đầu; vòng lặp đặt grad của mỗi tham số thành 0.0.
- **Level 3:** Viết biểu thức nhỏ nhất thất bại với phép gán. Expected: một giá trị nhân với chính nó; gradient tại 3 phải là 6.0, và phép gán cho 3.0.
- **Level 3:** Tại sao thứ tự tô pô quan trọng đối với bug này? Expected: tất cả bên sử dụng của một node phải chạy trước khi node truyền gradient tiếp; với phép gán, câu trả lời phụ thuộc vào bên sử dụng nào chạy cuối.
- **Level 4:** Cùng quy tắc tích lũy xuất hiện ở đâu trong một framework bạn dùng? Expected: grad của một tensor tích lũy qua các lần sử dụng và qua các lời gọi backward, đó là lý do zero_grad của bộ tối ưu chạy trước mỗi bước.

## Wrong answers

- "Phép gán ổn vì mỗi node có một cha." Một node cấp đầu vào cho hai phép toán có hai bên sử dụng trong đồ thị, và một trọng số trong một loss được lấy tổng có một bên sử dụng mỗi mẫu.
- "Loss vẫn đi xuống, nên các gradient đúng." Một gradient sai vẫn có thể chỉ một phần xuống dốc. Chỉ một kiểm tra số chứng minh nó.
- "Dùng một trung bình chạy thay vì một tổng." Quy tắc chuỗi lấy tổng các đóng góp theo đường. Một trung bình chia gradient thật cho số bên sử dụng.

## Taught in

[Bài học quy tắc chuỗi và autodiff](../../../phases/01-math-foundations/05-chain-rule-and-autodiff/) xây dựng lớp Value và kiểm tra gradient bắt bug này.
