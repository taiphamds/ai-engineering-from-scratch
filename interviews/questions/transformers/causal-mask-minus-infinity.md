---
id: causal-mask-minus-infinity
title: Where the triangle of minus infinity comes from
card: transformers
kind: concept
level: 2
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [ml-depth, coding]
tags: [causal-mask, softmax, decoder, prefix-average]
minutes: 8
lessons: [phases/07-transformers-deep-dive/07-gpt-causal-language-modeling, phases/19-capstone-projects/33-multihead-self-attention, phases/19-capstone-projects/34-transformer-block]
manuals: []
practice: []
cheatsheet: [transformers-attention, gpt-from-scratch-training]
related: []
updated: 2026-11-03
---

Một decoder không được đọc các token đứng sau vị trí hiện tại. Một đồng đội đề xuất chạy softmax trước rồi đặt trọng số của các vị trí phía sau về không. Tại sao điều đó sai, và tam giác âm vô cực thông thường thực sự đến từ đâu?

## Short answer

Đặt trọng số về không sau softmax để lại các hàng không còn có tổng bằng một, và các token phía sau đã định hình phép chuẩn hóa. Mask cộng âm vô cực vào các điểm số trước softmax, nên hàm mũ cho giá trị không chính xác tại đó và mỗi hàng là một phân phối chỉ trên quá khứ. Tam giác không phải một bản vá cho attention: trung bình trượt nhân quả là một ma trận tam giác dưới được chuẩn hóa theo hàng, và mask là cùng mẫu giá trị không đó được viết trong miền đầu vào của softmax.

## Full answer

### Three stages, one invariant

Bắt đầu với bản tóm tắt nhân quả đơn giản nhất: vị trí i trở thành trung bình của các vị trí 0 đến i. Dưới dạng ma trận:

```python
A = np.tril(np.ones((n, n)))
A = A / A.sum(axis=1, keepdims=True)
out = A @ X
```

Các giá trị không phía trên đường chéo chính là tính nhân quả. Không có gì bị che; tương lai chưa bao giờ có trong tổng.

Bây giờ thay các giá trị một bằng điểm số S được học. Các hàng không còn có tổng bằng một, nên chuẩn hóa từng hàng bằng softmax. Softmax không bao giờ xuất ra giá trị không chính xác, nên các phần tử tương lai phải đi vào dưới dạng âm vô cực, vì `exp(-inf) = 0`:

```python
S = S + np.triu(np.full((n, n), -np.inf), k=1)
A = softmax(S, axis=1)
```

Cuối cùng để điểm số phụ thuộc vào các token: `S = Q @ K.T / sqrt(d_k)`. Mask, softmax, matmul. Mask được giữ lại từ phép lấy trung bình; nó chưa bao giờ được thêm vào attention.

### Why minus infinity and not zero

Điểm số bằng không vẫn nhận trọng số `exp(0) = 1` trước chuẩn hóa. Chỉ âm vô cực mới cho trọng số bằng không.

### What it buys at training time

Khi có mask, một lượt truyền xuôi trên chuỗi N token cho N dự đoán token tiếp theo, mỗi dự đoán chỉ thấy quá khứ của nó. Đó là lý do huấn luyện song song dọc theo chuỗi. Không có mask, mô hình đọc chính mục tiêu của nó và loss sụp xuống trong khi mô hình không học được gì hữu ích.

### How a production block stores it

Đăng ký mask làm buffer khi khởi tạo, có kích thước bằng ngữ cảnh tối đa, và cắt góc trên bên trái (T, T) khi truyền xuôi. Khi đó nó nằm trên cùng thiết bị với trọng số và không bao giờ đi vào đồ thị gradient. Tạo lại nó ở mỗi lần gọi biến mask thành điểm nóng của bộ cấp phát khi ngữ cảnh dài.

## Follow-ups

- **Level 2:** Tại sao không nhân các điểm số tương lai với không? Expected: điểm số bằng không vẫn nhận trọng số `exp(0)` trước chuẩn hóa, nên tương lai vẫn đóng góp.
- **Level 2:** Mask nằm ở đâu trong một khối thực và tại sao? Expected: một buffer được đăng ký ở độ dài ngữ cảnh tối đa, được cắt cho mỗi lượt truyền xuôi, để nó nằm trên đúng thiết bị và không được cấp phát ở mọi lần gọi.
- **Level 3:** Encoder có cần tam giác này không? Expected: không, encoder là hai chiều; nó cần padding mask, cũng dùng âm vô cực nhưng theo batch, không theo đường chéo.
- **Level 3:** Mask liên quan gì đến huấn luyện song song? Expected: nó cho phép một lượt tạo mọi dự đoán token tiếp theo cùng lúc trong khi mỗi dự đoán chỉ thấy quá khứ của nó, nên N loss cùng hợp lệ.

## Wrong answers

- "Đặt các điểm số tương lai về không." Không là một điểm số hợp lệ và vẫn nhận trọng số sau hàm mũ; chỉ âm vô cực mới cho trọng số bằng không.
- "Mask là thủ thuật chỉ dành cho huấn luyện, nên khi phục vụ có thể bỏ nó." Prompt được xử lý trong một lượt khi phục vụ, và không có mask thì các token trong prompt sẽ đọc tương lai của chính chúng.
- "Encoder cũng cần tam giác." Encoder nhìn cả hai phía theo thiết kế; tam giác là thứ làm cho decoder trở thành decoder.

## Taught in

[Bài học về mô hình hóa ngôn ngữ nhân quả](../../../phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/) suy ra tam giác từ trung bình tiền tố, còn [capstone attention](../../../phases/19-capstone-projects/33-multihead-self-attention/) và [capstone khối](../../../phases/19-capstone-projects/34-transformer-block/) đăng ký nó làm buffer.
