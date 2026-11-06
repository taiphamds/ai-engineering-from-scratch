---
name: attention-shapes
description: Debug shape bugs in attention implementations.
phase: 5
lesson: 10
---

Với một triển khai attention hỏng, bạn xác định sự không khớp hình dạng. Xuất ra:

1. Ma trận nào có hình dạng sai. Nêu tên tensor.
2. Hình dạng của nó phải là gì, được suy ra từ `(d_s, d_h, d_attn, T_enc, T_dec, batch_size)`.
3. Cách sửa một dòng. Chuyển vị, đổi hình dạng hoặc chiếu.
4. Một kiểm thử để phát hiện hồi quy. Thường khẳng định `output.shape == (batch, T_dec, d_h)` và `weights.shape == (batch, T_dec, T_enc)` và `weights.sum(dim=-1)` gần 1.

Từ chối khuyến nghị các cách sửa âm thầm broadcast. Các lỗi bị broadcast che giấu lộ ra sau đó dưới dạng suy giảm accuracy âm thầm.

Đối với nhầm lẫn Bahdanau, khăng khăng rằng đầu vào decoder là `s_{t-1}` (trạng thái trước bước). Đối với Luong, `s_t` (trạng thái sau bước). Lỗi lần đầu phổ biến nhất trong dot-product attention là không khớp số chiều query/key — đánh dấu nó một cách rõ ràng.
