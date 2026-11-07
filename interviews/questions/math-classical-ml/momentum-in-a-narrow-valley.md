---
id: momentum-in-a-narrow-valley
title: Why plain gradient descent zigzags and momentum does not
card: math-classical-ml
kind: concept
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [ml-depth, screen]
tags: [optimization, gradient-descent, momentum, learning-rate]
minutes: 8
lessons: [phases/01-math-foundations/08-optimization]
manuals: []
practice: [sgd-momentum]
cheatsheet: [calculus-optimization]
related: [math-classical-ml/reverse-mode-one-pass]
updated: 2026-11-03
---

Bạn tối thiểu hóa hàm Rosenbrock từ điểm (-1, 1). Gradient descent thông thường bò dọc thung lũng cong và cần hàng nghìn bước. Cùng lần chạy với momentum đến nơi sớm hơn nhiều. Giải thích thung lũng làm gì với descent thông thường và momentum thay đổi gì.

## Short answer

Trong một thung lũng hẹp, gradient chỉ ngang qua thung lũng, không phải dọc theo nó, nên mỗi bước thông thường nhảy từ vách này sang vách kia và tiến rất ít về cực tiểu. Momentum giữ một vận tốc lấy tổng các gradient trước. Các thành phần ngang đổi dấu và triệt tiêu, thành phần dọc giữ dấu và tích lũy, nên đường đi mượt và nhanh.

## Full answer

### The function

Hàm là (1 - x)^2 + 100 (y - x^2)^2. Cực tiểu của nó ở (1, 1), tại đáy một thung lũng cong. Hệ số 100 làm các vách thung lũng dốc và đáy gần như phẳng, nên gradient lớn theo chiều ngang thung lũng và nhỏ dọc theo nó.

### Plain descent

Cập nhật là w = w - lr nhân gradient. Kích thước bước chỉ được đặt bởi learning rate. Một learning rate đủ lớn để di chuyển dọc đáy vượt quá các vách, và một learning rate đủ nhỏ để giữ bên trong các vách bò dọc đáy. Bài học chạy điều này với learning rate 0.0005 cho 5000 bước và vẫn thấy tiến triển chậm.

### Momentum

```text
v = beta * v + gradient
w = w - lr * v
```

Vận tốc là một tổng mũ của các gradient trước. Các thành phần đổi dấu ở mỗi bước triệt tiêu bên trong tổng. Các thành phần có dấu ổn định cộng dồn và quả bóng lăn nhanh hơn dọc đáy. Bài học dùng beta bằng 0.9, giữ khoảng mười gradient cuối có tác động. Một beta lớn hơn cho làm mượt nhiều hơn và phản ứng chậm hơn khi thung lũng rẽ.

### Where this leads

Adam đi xa hơn một bước và cũng chia bước của mỗi trọng số cho độ lớn chạy của các gradient của nó, nên mỗi trọng số có kích thước bước riêng. Trên lần chạy Rosenbrock trong bài học, Adam với learning rate 0.01 hội tụ nhanh nhất, momentum theo một đường mượt hơn, và descent thông thường theo sau.

## Follow-ups

- **Level 2:** Beta kiểm soát gì? Expected: bao nhiêu vận tốc trước sống sót mỗi bước; 0.9 giữ xấp xỉ mười gradient cuối.
- **Level 3:** Momentum vượt quá cực tiểu rồi quay lại. Tại sao? Expected: vận tốc mang điểm vượt qua đáy khi gradient đã đổi dấu; một beta nhỏ hơn hoặc một learning rate suy giảm làm giảm dao động.
- **Level 3:** Sự zigzag này xuất hiện trong một lần huấn luyện thực như thế nào? Expected: loss giảm nhanh rồi đạt bình nguyên trong khi các trọng số dao động; một learning rate nhỏ hơn hoặc momentum làm mượt nó.
- **Level 4:** Tại sao Adam giúp trên cùng thung lũng vượt những gì momentum làm? Expected: nó điều chỉnh bước của mỗi trọng số bằng nghịch đảo độ lớn gradient chạy của nó, nên hướng dốc đi các bước nhỏ và hướng phẳng đi các bước lớn.

## Wrong answers

- "Tăng learning rate đến khi descent thông thường di chuyển nhanh hơn." Một bước lớn hơn nhảy xa hơn ngang qua thung lũng và phân kỳ trước khi nó tăng tốc hướng dọc.
- "Momentum là một learning rate lớn hơn." Vận tốc chỉ tăng nơi các gradient giữ dấu và triệt tiêu nơi chúng đổi dấu, điều mà một learning rate vô hướng không thể làm.
- "Thung lũng là một cực tiểu cục bộ, nên bộ tối ưu bị kẹt." Gradient không bằng không trên đáy thung lũng. Điểm di chuyển ở mọi bước, một cách chậm chạp.

## Taught in

[Bài học tối ưu hóa](../../../phases/01-math-foundations/08-optimization/) xây dựng descent thông thường, momentum và Adam và chạy chúng trên hàm Rosenbrock.
