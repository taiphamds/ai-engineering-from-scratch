---
id: read-split-and-combine-heads
title: One reshape is right and one scrambles the heads
card: transformers
kind: code-reading
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, ml-depth]
tags: [multi-head-attention, reshape, transpose, shapes, code-reading]
minutes: 8
lessons: [phases/07-transformers-deep-dive/03-multi-head-attention, phases/19-capstone-projects/33-multihead-self-attention]
manuals: []
practice: [multi-head-split-merge]
cheatsheet: [transformers-attention]
related: [transformers/heads-are-nearly-free]
updated: 2026-11-03
---

Hai phiên bản phép chia head được đưa vào đánh giá. `X` có hình dạng `(n, d)` với `n` token và `d` đặc trưng.

```python
def split_a(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)

def split_b(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n_heads, n, d_head)
```

Cả hai trả về tensor có hình dạng `(n_heads, n, d_head)` và cả hai chạy không lỗi. Phiên bản nào đúng, phiên bản kia làm gì với dữ liệu, và kiểm thử nào sẽ phát hiện nó?

## Short answer

Phiên bản đầu đúng: `split_a` nhóm `d` đặc trưng của mỗi token thành `n_heads` lát có chiều rộng `d_head` rồi chuyển trục head ra trước. `split_b` đọc cùng bộ nhớ theo thứ tự sai: nó cắt buffer phẳng thành `n_heads` khối bằng nhau và gọi mỗi khối là một head, nên một head giờ chứa các dãy token liên tiếp, một khối có thể kết thúc bên trong token, và các cột không còn khớp phép chiếu đã tạo chúng. Kiểm thử là lượt đi về: kết hợp phần chia phải trả lại `X` chính xác, và head `h` phải bằng lát cột `X[:, h * d_head:(h + 1) * d_head]`.

## Full answer

### What the shapes mean

Sau phép chiếu, `d` đặc trưng của mỗi token là phần nối của `n_heads` nhóm gồm `d_head` đặc trưng. Head là một lát cột qua mọi token. Reshape `(n, n_heads, d_head)` giữ nguyên hàng của mỗi token và chỉ nhóm lại các cột; transpose sau đó đặt trục head đầu tiên để attention theo từng head trở thành phép toán theo batch trên các head.

### Why the wrong version still runs

Cả hai tensor có `n * d` phần tử, nên NumPy và PyTorch sẵn sàng diễn giải lại bộ nhớ. Reshape một mảng liên tục không di chuyển dữ liệu; nó chỉ thay đổi cách lập chỉ mục buffer phẳng. Vì vậy `split_b` cắt buffer thành `n_heads` khối bằng nhau. Khi `n` chia hết cho `n_heads`, head có chỉ số không chứa `n / n_heads` token đầu tiên với tất cả đặc trưng của chúng; nếu không thì khối kết thúc bên trong token. Điểm số trong head đó so sánh các vector sai, và mô hình huấn luyện thành một thứ gì đó, đó là lý do lỗi này có thể tồn tại hàng tuần.

### The combine must be the exact inverse

```python
def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

Transpose trở lại trước, rồi reshape. Reshape trực tiếp từ `(h, n, d_head)` sang `(n, h * d_head)` mắc cùng lỗi theo chiều ngược, và phép chiếu đầu ra thấy các đặc trưng bị xáo trộn.

### The production shape contract

Với chiều batch, các tensor trung gian là `(B, H, T, d_head)`. Chiều head nằm cạnh batch để bộ tăng tốc xem attention theo từng head là `B * H` bài toán độc lập, và `d_head` nằm cuối để `Q @ K.transpose(-2, -1)` co nó lại. Ràng buộc là `D % H == 0`.

### Tests that catch it

1. `combine_heads(split_heads(X)) == X`.
2. `split_heads(X)[h] == X[:, h * d_head:(h + 1) * d_head]` cho mọi head.
3. Attention một head trên lát cắt bằng đầu ra của head từ nhánh theo batch.

## Follow-ups

- **Level 2:** Tại sao reshape không bao giờ báo lỗi ở đây? Expected: nó chỉ diễn giải lại buffer có cùng số phần tử; dữ liệu không được kiểm tra ý nghĩa.
- **Level 2:** Tại sao `d_head` phải giữ ở trục cuối? Expected: matmul điểm số co trục cuối của Q với trục áp cuối của K đã chuyển vị.
- **Level 3:** Grouped-query attention tái sử dụng mã này như thế nào? Expected: chia K và V thành `n_kv_heads` head và lặp mỗi cái dọc trục head `n_heads // n_kv_heads` lần để khớp Q.
- **Level 3:** Mô hình huấn luyện với phép chia sai đạt loss khá tốt. Tại sao điều đó không loại trừ lỗi? Expected: các phép chiếu học cách làm việc với bố cục bị xáo trộn, nhưng các head không còn tương ứng với các không gian con của đầu vào và mọi trọng số pretrained hoặc checkpoint được xuất sẽ sai.

## Wrong answers

- "Reshape và transpose có thể thay thế nhau khi hình dạng khớp." Reshape diễn giải lại bộ nhớ và transpose di chuyển các trục; thứ tự quyết định những phần tử nào nằm cùng nhau.
- "Nếu nó chạy và loss giảm, nó đúng." Loss cũng giảm với bố cục sai; chỉ kiểm thử đi về và lát cắt mới chứng minh bố cục.
- "Mỗi head cần ma trận trọng số riêng, nên phép chia không liên quan." Các head là lát của một phép chiếu; phép chia là thứ định nghĩa chúng.

## Taught in

[Bài học về multi-head attention](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) đưa ra cặp chia và kết hợp, còn [capstone attention](../../../phases/19-capstone-projects/33-multihead-self-attention/) đặt quy ước hình dạng theo batch.
