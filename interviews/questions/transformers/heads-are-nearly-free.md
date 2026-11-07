---
id: heads-are-nearly-free
title: What eight heads cost that one head does not
card: transformers
kind: concept
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, screen]
tags: [multi-head-attention, head-dimension, output-projection, fused-qkv]
minutes: 8
lessons: [phases/07-transformers-deep-dive/03-multi-head-attention, phases/19-capstone-projects/33-multihead-self-attention]
manuals: []
practice: [multi-head-split-merge]
cheatsheet: [transformers-attention, attention-variants]
related: [transformers/why-scale-by-sqrt-dk]
updated: 2026-11-03
---

Bạn thay một lớp attention từ một head thành tám head và giữ cố định chiều rộng mô hình. Điều gì xảy ra với số tham số, lượng tính toán, và những gì lớp có thể biểu diễn? Và tại sao người thực hành từ chối làm head hẹp hơn khoảng 32?

## Short answer

Các tham số không thay đổi: bốn phép chiếu vẫn là `d_model` nhân `d_model`, và các head chỉ là reshape của cùng các ma trận thành các lát có chiều rộng `d_model / n_heads`. Lượng tính toán giữ gần như cũ vì attention theo từng head chạy như một batched matmul trên trục head. Mỗi head có thể chuyên biệt hóa trên quan hệ riêng, và phép chiếu đầu ra là nơi các head trộn với nhau. Quy tắc kinh nghiệm của bài học giữ head ở chiều rộng 32 trở lên, vì head hẹp hơn thấy quá ít chiều, và trên 256 bạn mất lợi ích của nhiều chuyên gia nhỏ, trong khi bản thân scaling `sqrt` giữ phương sai điểm số không đổi ở bất kỳ chiều rộng nào.

## Full answer

### Split, attend, combine

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

Chiếu X thành Q, K và V, chia mỗi cái thành các head, chạy scaled dot-product attention theo từng head, xếp các head trở lại và nhân với ma trận đầu ra `W_o`. GPU thấy các điểm số theo từng head như một batched matmul duy nhất có hình dạng `(heads, N, d_head)` nhân `(heads, d_head, N)`. Thêm head là thêm phần tử batch, không phải trọng số.

### Why the output projection matters

Các head không bao giờ nói chuyện trong chính bước attention; chúng làm việc trên các không gian con khác nhau. `W_o`, có hình dạng `(d_model, d_model)`, là nơi đầu ra của chúng trộn với nhau. Không có nó, các head chỉ có thể kết hợp lại qua các lớp phía sau và khối sẽ bị ràng buộc một cách nhân tạo.

### What heads learn

Công trình thăm dò từ 2019 đến 2024 tìm thấy các vai trò riêng biệt: head chú ý đến token trước, head sao chép, head theo dõi thực thể có tên, và induction head, các cặp phát hiện lần xuất hiện trước của token hiện tại rồi sao chép thứ theo sau nó, làm nền tảng cho in-context learning. Một head sẽ phải dồn tất cả những điều này vào một softmax.

### Picking the head width

| Kích thước mô hình | d_model | n_heads | d_head |
|---|---|---|---|
| Nhỏ (khoảng 125M) | 768 | 12 | 64 |
| Cơ sở (khoảng 350M) | 1024 | 16 | 64 |
| Lớn (khoảng 1B) | 2048 | 16 | 128 |
| Tiên phong (khoảng 70B) | 8192 | 64 | 128 |

Chiều rộng head hầu như luôn rơi vào 64 hoặc 128. Nó là đơn vị biểu thị một head có thể thấy bao nhiêu.

### The production implementation

Một lớp tuyến tính ánh xạ D sang 3D và được cắt thành Q, K và V. Ba lớp riêng tính cùng một thứ, vì ba matmul với trọng số `(D, D)` bằng một matmul với trọng số xếp chồng `(3D, D)`, nhưng lớp hợp nhất khởi chạy một kernel thay vì ba.

## Follow-ups

- **Level 2:** Tại sao phép chiếu QKV hợp nhất nhanh hơn nếu toán học giống nhau? Expected: một lần khởi chạy kernel và một matmul thay vì ba; trọng số xếp chồng cho cùng kết quả.
- **Level 3:** Điều gì sai nếu bạn bỏ phép chiếu đầu ra? Expected: các head chỉ có thể trộn qua các lớp phía sau, nên khối mất năng lực biểu đạt dù hình dạng vẫn hoạt động.
- **Level 3:** Induction head là gì? Expected: một cặp head tìm lần xuất hiện trước của token hiện tại và sao chép token theo sau nó; mạch phía sau in-context learning.
- **Level 4:** Grouped-query attention giữ các query head và thu nhỏ thứ khác. Thứ gì và tại sao? Expected: các key head và value head, vì chỉ chúng nằm trong cache lúc decode; ít chúng hơn cắt bộ nhớ cache trong khi các query head giữ chất lượng.

## Wrong answers

- "Nhiều head hơn nghĩa là nhiều tham số hơn." Các phép chiếu giữ nguyên kích thước; các head là reshape của cùng các ma trận.
- "Các head trao đổi thông tin khi chúng chú ý." Chúng làm việc trên các không gian con riêng; việc trộn chỉ xảy ra trong phép chiếu đầu ra và các lớp phía sau.
- "Dùng nhiều head nhất mà chiều rộng cho phép." Head hẹp hơn mức 32 theo quy tắc kinh nghiệm của bài học thấy quá ít; các chiều rộng phổ biến là 64 và 128.

## Taught in

[Bài học về multi-head attention](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) xây dựng phép chia và bảng chiều rộng, còn [capstone attention](../../../phases/19-capstone-projects/33-multihead-self-attention/) hợp nhất phép chiếu và giải thích ma trận đầu ra.
