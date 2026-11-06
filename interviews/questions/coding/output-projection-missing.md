---
id: output-projection-missing
title: Attention heads that never mix
card: coding
kind: debug
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, debugging, ml-depth]
tags: [multi-head-attention, output-projection, softmax-axis]
minutes: 10
lessons: [phases/07-transformers-deep-dive/03-multi-head-attention]
manuals: []
practice: [multi-head-split-merge]
cheatsheet: [transformers-attention]
related: [coding/split-heads-reshape, coding/gqa-repeat-not-tile]
updated: 2026-11-03
---

Một lượt truyền tiến multi-head attention vượt qua các kiểm thử tách và gộp nhưng thất bại trong kiểm thử đầu cuối so với một bản tham chiếu, và một checkpoint đã huấn luyện được nạp vào nó sinh ra thứ vô nghĩa:

```python
def multi_head_attention(x, w_q, w_k, w_v, w_o, n_heads):
    Q, K, V = split_heads(x @ w_q, n_heads), split_heads(x @ w_k, n_heads), split_heads(x @ w_v, n_heads)
    d_head = Q.shape[-1]
    scores = Q @ K.swapaxes(-1, -2) / np.sqrt(d_head)
    weights = softmax(scores, axis=-2)
    return merge_heads(weights @ V), weights
```

Tìm cả hai khiếm khuyết và giải thích mỗi khiếm khuyết làm gì với mô hình.

## Short answer

Softmax chuẩn hóa trên trục query thay vì trục key, vì vậy tổng của mỗi cột bằng một và các trọng số của một query không còn tạo thành một phân phối trên các key. Phép chiếu đầu ra cũng bị thiếu: các head đã gộp được trả về mà không nhân với `w_o`, là nơi duy nhất các head trao đổi thông tin. Chuẩn hóa trên trục cuối cùng và nhân kết quả đã gộp với ma trận đầu ra.

## Full answer

### Defect one: the softmax axis

Các điểm số có hình dạng batch, head, query, key. Mỗi hàng query phải trở thành một phân phối trên các key, vì vậy softmax chạy trên trục cuối cùng. Trên trục áp chót thay vào đó tổng của mỗi cột key bằng một trên các query, và tổng có trọng số của các value không còn mang nghĩa "token này attend vào cái gì".

### Defect two: the output projection

Mỗi head tính attention trong không gian con riêng của nó và các head không bao giờ tương tác trong chính phép tính attention. Phép nối theo sau bởi ma trận đầu ra là nơi các head trộn với nhau. Không có nó, đầu ra của mô hình là một chồng các kết quả độc lập theo từng head, lớp tiếp theo thấy một hàm khác với hàm mà các trọng số đã được huấn luyện cho, và một checkpoint được nạp tạo ra nhiễu.

### The corrected function

```python
def multi_head_attention(x, w_q, w_k, w_v, w_o, n_heads):
    Q = split_heads(x @ w_q, n_heads)
    K = split_heads(x @ w_k, n_heads)
    V = split_heads(x @ w_v, n_heads)
    d_head = Q.shape[-1]
    scores = Q @ K.swapaxes(-1, -2) / np.sqrt(d_head)
    weights = softmax(scores, axis=-1)
    return merge_heads(weights @ V) @ w_o, weights
```

### Why the reshape tests passed

Cả hai khiếm khuyết nằm sau phép tách và trước phép gộp, hoặc sau phép gộp. Các hàm trợ giúp reshape đúng, và hình dạng của đầu ra cuối cùng khớp với bản tham chiếu vì `w_o` vuông. Chỉ một phép so sánh giá trị với một bản tham chiếu, hoặc một checkpoint thực, mới phát hiện chúng.

### Why the scale is still right

Phép chia dùng kích thước head, không phải toàn bộ chiều rộng. Phần đó của bài nộp là đúng; chia cho căn bậc hai của toàn bộ chiều rộng là một lỗi phổ biến thứ ba mà bài thực hành cũng kiểm tra.

## Follow-ups

- **Level 3:** Tại sao phép chiếu đầu ra có hình dạng toàn bộ chiều rộng nhân toàn bộ chiều rộng? Expected: nó ánh xạ phép nối của mọi head, có toàn bộ chiều rộng, trở lại chiều rộng mô hình, và nó là ma trận duy nhất đọc từ mọi head.
- **Level 3:** Bạn sẽ thêm kiểm thử nào để phát hiện sớm việc thiếu phép chiếu? Expected: một trường hợp mà `w_o` không phải ma trận đơn vị, để các đầu ra đã chiếu và chưa chiếu khác nhau.
- **Level 4:** Một nghiên cứu thăm dò phát hiện một head attend vào token trước. Trong mã này kết quả của head đó đi đến luồng residual ở đâu? Expected: chỉ qua khối cột của nó trong phép nối và các hàng của `w_o` đọc nó; `w_o` quyết định lớp tiếp theo thấy bao nhiêu từ head đó.

## Wrong answers

- "Trục softmax không quan trọng vì các điểm số đối xứng." Các điểm số là query theo key và không đối xứng; hai phép chuẩn hóa khác nhau đối với mọi đầu vào thực.
- "Bỏ phép chiếu đầu ra để tiết kiệm tham số; phép gộp đã kết hợp lại các head." Phép gộp chỉ nối; không có phép chiếu các head không bao giờ tương tác.
- "Dùng ma trận đơn vị cho phép chiếu đầu ra khi một checkpoint thiếu nó." Một checkpoint đã huấn luyện luôn có nó; một tensor bị thiếu có nghĩa là ánh xạ tên bị sai.

## Taught in

[Bài học multi-head attention](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) giải thích rằng các head chỉ trộn qua phép chiếu đầu ra, và [bài thực hành tách và gộp](../../../practice/multi-head-split-merge/) kiểm tra trục softmax và phép chiếu.
