---
id: split-heads-reshape
title: Split heads with the right shape and the wrong numbers
card: coding
kind: code-reading
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, debugging]
tags: [multi-head-attention, reshape, transpose]
minutes: 8
lessons: [phases/07-transformers-deep-dive/03-multi-head-attention]
manuals: []
practice: [multi-head-split-merge]
cheatsheet: [transformers-attention]
related: [coding/output-projection-missing, coding/gqa-repeat-not-tile]
updated: 2026-11-03
---

Một bài nộp tách một tensor có hình dạng batch, token, đặc trưng thành các head bằng một lời gọi:

```python
def split_heads(x, n_heads):
    B, T, D = x.shape
    return x.reshape(B, n_heads, T, D // n_heads)
```

Kiểm thử hình dạng đạt và mọi kiểm thử attention thất bại. Giải thích hàm thực sự đã làm gì với dữ liệu và viết phiên bản đúng.

## Short answer

Chỉ phép reshape diễn giải lại bộ nhớ. Nó giữ các byte theo thứ tự và gắn lại nhãn cho chúng, vì vậy trục head cắt ngang các token và đặc trưng thay vì cắt trục đặc trưng. Phép tách đúng reshape thành batch, token, head, kích thước head rồi chuyển vị các trục token và head, để head `h` giữ một khối liên tục gồm `d_head` cột kề nhau cho mọi token.

## Full answer

### What the bug does

Bộ nhớ theo hàng liệt kê các đặc trưng của token không, rồi các đặc trưng của token một, và cứ như vậy. Reshape thẳng thành batch, head, token, kích thước head cắt danh sách phẳng đó thành các phần bằng nhau. "Head" đầu tiên khi đó giữ `T` nhân `d_head` số đầu tiên, là các vector đặc trưng đầy đủ của vài token đầu tiên, không phải một lát cắt của mọi token. Hình dạng khớp. Các số bị xáo trộn.

### The fix

```python
def split_heads(x, n_heads):
    B, T, D = x.shape
    if D % n_heads:
        raise ValueError("features must divide into heads")
    d_head = D // n_heads
    return x.reshape(B, T, n_heads, d_head).transpose(0, 2, 1, 3)


def merge_heads(x):
    B, H, T, d_head = x.shape
    return x.transpose(0, 2, 1, 3).reshape(B, T, H * d_head)
```

Reshape thành batch, token, head, kích thước head trước, chỉ tách trục cuối cùng. Rồi chuyển vị để trục head đến trước trục token. Phép gộp là cùng hai thao tác theo thứ tự ngược. Một reshape và một chuyển vị, không có vòng lặp; đó cũng là điều phiên bản framework thực hiện bên dưới.

### The strided variant of the bug

Một phiên bản sai thứ hai cho head `h` các cột `h`, `h + H`, `h + 2H` và cứ như vậy. Điều đó cắt trục đặc trưng, vì vậy attention theo từng head chạy, nhưng nó không khớp với quy ước rằng một head sở hữu một khối cột liên tục, và một checkpoint được huấn luyện với bố trí chuẩn không còn nạp vào nó được.

### How to test it

`merge_heads(split_heads(x, H))` phải trả về chính xác `x`, và `split_heads(x, H)[b, h, t, j]` phải bằng `x[b, t, h * d_head + j]`. Phép kiểm tra thứ hai là phép thất bại đối với cả hai phiên bản sai.

## Follow-ups

- **Level 2:** Tại sao kiểm thử khứ hồi phát hiện lỗi reshape đơn thuần? Expected: `merge_heads` chuyển vị các trục head và token trước khi reshape, vì vậy nó không đảo ngược một reshape đơn thuần và các đặc trưng trở lại theo một thứ tự khác; chỉ một phép gộp được viết dưới dạng reshape đơn thuần mới che giấu lỗi.
- **Level 2:** Hệ số tỷ lệ trở thành gì sau phép tách? Expected: căn bậc hai của kích thước head, không phải của toàn bộ số chiều đặc trưng.
- **Level 3:** Sau phép tách, attention chạy cho tất cả các head cùng lúc như thế nào? Expected: dưới dạng một matmul theo batch trên các trục batch và head ở đầu, vì vậy thêm các head không tốn thêm lần khởi chạy kernel.

## Wrong answers

- "Reshape giống chuyển vị với các kích thước bằng nhau." Reshape gắn lại nhãn bộ nhớ tại chỗ; chuyển vị sắp xếp lại nó.
- "Bất kỳ phép tách nào cũng được miễn là phép gộp đảo ngược nó." Các kiểm thử attention và bất kỳ checkpoint nào được nạp đều phụ thuộc vào việc mỗi head sở hữu một khối các cột kề nhau.
- "Lặp qua các head và cắt các cột." Nó đúng nhưng chậm; reshape và chuyển vị cho cùng kết quả trong hai thao tác.

## Taught in

[Bài học multi-head attention](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) đưa ra cặp tách và kết hợp dưới dạng một reshape theo sau bởi một chuyển vị, và [bài thực hành tách và gộp](../../../practice/multi-head-split-merge/) kiểm tra mỗi phần tử của phép tách.
