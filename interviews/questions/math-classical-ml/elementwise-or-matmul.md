---
id: elementwise-or-matmul
title: Two products in NumPy that print different numbers
card: math-classical-ml
kind: code-reading
level: 1
roles: [ai-data-engineer, applied-ai-engineer]
rounds: [screen, coding]
tags: [linear-algebra, matrix-multiply, element-wise, numpy]
minutes: 5
lessons: [phases/01-math-foundations/02-vectors-matrices-operations]
manuals: []
practice: []
cheatsheet: [linear-algebra]
related: [math-classical-ml/dense-layer-weight-shape]
updated: 2026-11-03
---

Đọc mã này và nói mỗi lệnh print hiển thị gì. Sau đó cho tôi biết một lớp dense dùng phép toán nào trong hai phép toán, và tại sao.

```python
import numpy as np

A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])
print(A * B)
print(A @ B)
```

## Short answer

Dấu sao nhân các vị trí tương ứng, nên lệnh print đầu tiên hiển thị 5, 12, 21 và 32. Dấu at tạo các tích vô hướng của hàng với cột, nên lệnh print thứ hai hiển thị 19, 22, 43 và 50. Một lớp dùng dấu at, vì mọi đầu ra phải lấy tổng trên mọi đầu vào.

## Full answer

### Element-wise product

Cả hai mảng có cùng shape, nên dấu sao ghép mỗi ô với ô ở cùng vị trí:

```text
1*5 = 5    2*6 = 12
3*7 = 21   4*8 = 32
```

Thứ tự của A và B không thay đổi kết quả.

### Matrix product

Dấu at gọi phương thức matmul. Ô (i, j) của kết quả là tích vô hướng của hàng i của A với cột j của B:

```text
1*5 + 2*7 = 19    1*6 + 2*8 = 22
3*5 + 4*7 = 43    3*6 + 4*8 = 50
```

Thứ tự quan trọng. B nhân A cho các con số khác. Các kích thước bên trong phải khớp nhau, và kết quả có các hàng của A và các cột của B.

### Which one a layer uses

Một lớp dense tính một activation của W nhân x cộng b. Mỗi đầu ra trộn tất cả đầu vào với hàng trọng số riêng của nó, là tích vô hướng bên trong một tích ma trận. Tích theo từng phần tử xuất hiện ở các nơi khác trong huấn luyện, ví dụ khi learning rate điều chỉnh một gradient, hoặc khi một mask đưa một số giá trị về không. NumPy chạy tích ma trận với các routine BLAS được tinh chỉnh viết bằng C và Fortran, mà bài học đo là nhanh hơn khoảng 100 lần một vòng lặp Python trên cùng các số.

## Follow-ups

- **Level 1:** Thứ tự của A và B có quan trọng trong mỗi trường hợp không? Expected: không với tích theo từng phần tử, có với tích ma trận.
- **Level 2:** Một bước learning rate dùng phép toán nào trong hai phép toán? Expected: một vô hướng nhân gradient, là một phép điều chỉnh theo từng phần tử.
- **Level 2:** Tại sao dấu at nhanh hơn rất nhiều so với một vòng lặp trong Python? Expected: nó gọi các routine BLAS trong C và Fortran. Bài học đưa ra khoảng 100 lần.
- **Level 3:** Ai đó viết dấu sao cho lớp và mã chạy mà không có lỗi. Điều đó có thể như thế nào? Expected: các shape tình cờ bằng nhau, nên tích theo từng phần tử chạy và cho các giá trị sai mà không có lỗi.

## Wrong answers

- "Cả hai in cùng ma trận, dấu sao là một cách viết khác của dấu at." Hai phép toán tuân theo các quy tắc khác nhau và cho các con số khác nhau.
- "Dấu at là tích theo từng phần tử và dấu sao là tích ma trận." Dấu at gọi matmul, tạo các tích vô hướng của hàng và cột. Dấu sao hoạt động trên các vị trí tương ứng.
- "Một lớp dense nhân mỗi trọng số với đầu vào của nó, nên nó là theo từng phần tử." Mỗi đầu ra cũng lấy tổng trên tất cả đầu vào. Tổng đó là tích vô hướng bên trong một tích ma trận.

## Taught in

[Bài học vector và ma trận](../../../phases/01-math-foundations/02-vectors-matrices-operations/) tính cả hai tích bằng tay rồi bằng NumPy.
