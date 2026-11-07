---
id: block-parameter-count
title: Count the parameters of a decoder stack by hand
card: transformers
kind: estimate
level: 3
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [ml-depth, screen]
tags: [parameter-count, feed-forward, swiglu, embeddings, estimation]
minutes: 10
lessons: [phases/07-transformers-deep-dive/05-full-transformer]
manuals: []
practice: []
cheatsheet: [transformers-attention]
related: [transformers/residual-stream-and-dropout]
updated: 2026-11-03
---

Đếm các tham số của một chồng decoder có chiều rộng mô hình là 4096, 32 lớp và mạng feed-forward SwiGLU với hệ số mở rộng 2.6. Sau đó thêm embedding và head đầu ra không dùng chung trọng số cho một từ vựng 128K. Tổng số vào khoảng nào, và tại sao mô hình đã công bố ở kích thước đó lại hơi khác?

## Short answer

Mỗi khối, attention cần `4 d^2` cho bốn phép chiếu và SwiGLU cần `3 d (r d)`, khoảng `3 r d^2`. Với chiều rộng và hệ số mở rộng đã cho, đó là khoảng 67M cộng 131M, khoảng 198M mỗi khối, và 32 khối cho khoảng 6.3B. Embedding và head không dùng chung trọng số thêm khoảng 1B, nên chồng này đạt gần mức 8B đã công bố. Mô hình thực dùng grouped-query attention, làm nhỏ các phép chiếu key và value, và FFN rộng hơn với hệ số mở rộng 3.5, chuyển tham số từ attention sang FFN trong khi tổng số vẫn gần như cũ.

## Full answer

### The per-block arithmetic

```text
attention:  Q, K, V, O projections, each d x d        -> 4 d^2
FFN:        three matrices of d x (r d)               -> 3 r d^2
norms:      two vectors of length d                   -> negligible
```

Với `d = 4096` và `r = 2.6`:

```text
4 * 4096^2        = about 67M
3 * 2.6 * 4096^2  = about 131M
per block         = about 198M
32 blocks         = about 6.3B
```

### The embeddings

Mô hình không dùng chung trọng số có token embedding với hình dạng `(vocab, d)` và một head riêng có cùng kích thước. Ở mức 128K nhân 4096, cặp này thêm khoảng 1B. Mô hình dùng chung trọng số chia sẻ ma trận và tiết kiệm một nửa số đó.

### Why the published number differs

Hai lựa chọn kiến trúc làm thay đổi số đếm mà không thay đổi nhiều tổng số:

1. **Grouped-query attention.** Các phép chiếu key và value ánh xạ `d` sang `n_kv_heads * d_head` thay vì `d` sang `d`, nên attention chứa ít hơn `4 d^2` tham số.
2. **FFN rộng hơn.** Mô hình đã công bố dùng hệ số mở rộng khoảng 3.5, nên FFN chứa nhiều hơn mức `3 * 2.6 * d^2` đã đếm ở trên.

Tổng số vẫn gần 8B. FFN chứa khoảng hai phần ba tham số của khối trong cả hai phiên bản.

### What the count is for

Bộ nhớ cho trọng số ở một kiểu dữ liệu cho trước, giới hạn ngân sách cache còn lại trên card, và một phép kiểm tra tính hợp lý khi file cấu hình hoặc model card có vẻ sai.

## Follow-ups

- **Level 2:** Tại sao các norm không đáng kể? Expected: mỗi norm là một hoặc hai vector có độ dài d, hàng nghìn tham số so với hàng triệu trên mỗi ma trận.
- **Level 3:** Grouped-query attention thay đổi số đếm mỗi khối như thế nào? Expected: các phép chiếu K và V thu nhỏ thành `d` nhân `n_kv_heads * d_head`, nên attention chứa ít hơn `4 d^2`.
- **Level 3:** Tại sao hệ số mở rộng 4 với hai ma trận tương đương hệ số mở rộng khoảng 2.6 với ba ma trận? Expected: `2 * 4 d^2 = 8 d^2` và `3 * 2.6 d^2` là khoảng `8 d^2`; khối hiện đại giữ nguyên ngân sách tham số và thay đổi hàm kích hoạt.
- **Level 4:** Nhóm dùng chung trọng số embedding và head. Điều gì thay đổi trong số đếm và bạn kiểm tra điều gì? Expected: khoảng một nửa của 1B biến mất; kiểm tra rằng logits đầu ra vẫn dùng chuyển vị của embedding và chất lượng được duy trì.

## Wrong answers

- "Số tham số tăng theo độ dài chuỗi." Không trọng số nào phụ thuộc vào chuỗi; độ dài thay đổi bộ nhớ activation và tính toán, không thay đổi tham số.
- "Embedding là một sai số làm tròn." Ở mức 128K nhân 4096, nó vào khoảng 1B, hơn một phần mười mô hình.
- "Attention là nơi chứa phần lớn tham số." FFN chứa khoảng hai phần ba của mỗi khối.

## Taught in

[Bài học về transformer đầy đủ](../../../phases/07-transformers-deep-dive/05-full-transformer/) thực hiện phép đếm này và giải thích khác biệt đã công bố.
