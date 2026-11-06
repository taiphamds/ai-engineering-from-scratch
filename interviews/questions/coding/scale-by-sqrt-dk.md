---
id: scale-by-sqrt-dk
title: The scale factor in dot-product attention
card: coding
kind: code-reading
level: 1
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, screen, ml-depth]
tags: [attention, scaling, softmax-saturation]
minutes: 6
lessons: [phases/07-transformers-deep-dive/02-self-attention-from-scratch]
manuals: []
practice: [scaled-dot-product-attention]
cheatsheet: [transformers-attention]
related: [coding/softmax-shift-max, coding/causal-mask-off-by-one]
updated: 2026-11-03
---

Đây là một hàm attention từ một bài nộp làm ở nhà:

```python
def attention(Q, K, V):
    scores = Q @ K.T / Q.shape[-1]
    return softmax(scores) @ V
```

Các kiểm thử hình dạng đạt và các kiểm thử trọng số attention thất bại. Tìm lỗi và giải thích hệ số đúng bảo vệ trước điều gì.

## Short answer

Các điểm số bị chia cho số chiều key thay vì căn bậc hai của nó. Các tích vô hướng của các vector ngẫu nhiên tăng theo số chiều, vì vậy không có căn bậc hai đầu vào softmax hoặc quá lớn, làm nó bão hòa và triệt tiêu gradient, hoặc quá nhỏ, làm phẳng mỗi hàng về gần đồng đều. Dòng đúng chia cho căn bậc hai của chiều cuối cùng của các key.

## Full answer

### The fix

```python
def attention(Q, K, V):
    d_k = Q.shape[-1]
    scores = Q @ K.T / np.sqrt(d_k)
    return softmax(scores) @ V
```

### Why the square root

Khi các phần tử của một query và một key có phương sai đơn vị, tích vô hướng của chúng có phương sai bằng số chiều. Kích thước điển hình của nó vì vậy là căn bậc hai của số chiều. Chia cho kích thước đó đưa các điểm số trở lại thang đơn vị, nơi softmax có các gradient hữu ích. Chia cho chính số chiều hiệu chỉnh quá mức và làm mỗi hàng gần đồng đều, vì vậy đầu ra gần như là trung bình của các value bất kể query.

### Two neighbors of this bug

- Hoàn toàn không có điều chỉnh tỷ lệ: ở kích thước head 64 các điểm số thô lên đến hàng chục và softmax bão hòa thành các hàng one hot.
- `K.T` trên một tensor có batch: `.T` đảo ngược mọi trục, vì vậy một hình dạng batch nhân token nhân đặc trưng trở thành đặc trưng nhân token nhân batch. Với các kích thước khác nhau matmul phát sinh lỗi hình dạng, và khi các kích thước tình cờ khớp nó trộn các batch mà không báo lỗi. Chỉ hoán đổi hai trục cuối cùng.

### How the practice checks it

Nhiệm vụ thực hành so sánh các trọng số, không chỉ hình dạng đầu ra. Một hệ số tỷ lệ sai thay đổi mọi trọng số, vì vậy một ma trận trọng số tham chiếu phát hiện nó ngay lập tức.

## Follow-ups

- **Level 1:** Hình dạng của các điểm số cho một chuỗi là gì? Expected: token nhân token, một hàng cho mỗi query trên tất cả các key.
- **Level 2:** Tại sao các kiểm thử hình dạng đạt với hệ số sai? Expected: điều chỉnh tỷ lệ không thay đổi hình dạng; chỉ các giá trị thay đổi.
- **Level 2:** Bạn chuyển vị các key cho một đầu vào có batch như thế nào? Expected: chỉ hoán đổi hai trục cuối cùng, ví dụ bằng `swapaxes(-1, -2)`.

## Wrong answers

- "Bất kỳ hằng số nào cũng được, mô hình học để thích nghi với nó." Các phép chiếu được học có thể bù trong huấn luyện, nhưng bài thực hành kiểm tra một bản tham chiếu cố định, và trong một mô hình đã huấn luyện hệ số sai thay đổi mọi head.
- "Chia cho độ dài chuỗi." Sự tăng trưởng đến từ số chiều đặc trưng, không phải từ số lượng token.
- "Điều chỉnh tỷ lệ chỉ dành cho tràn số." Phép dịch theo giá trị lớn nhất bên trong softmax xử lý tràn; hệ số tỷ lệ giữ softmax tránh các vùng bão hòa và phẳng của nó.

## Taught in

[Bài học self-attention](../../../phases/07-transformers-deep-dive/02-self-attention-from-scratch/) giải thích hệ số tỷ lệ căn bậc hai, và [bài thực hành attention](../../../practice/scaled-dot-product-attention/) kiểm tra các trọng số với một bản tham chiếu.
