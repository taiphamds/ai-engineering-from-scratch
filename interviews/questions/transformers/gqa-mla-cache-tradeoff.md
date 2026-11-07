---
id: gqa-mla-cache-tradeoff
title: Pick the attention variant for a 70B decoder
card: transformers
kind: tradeoff
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, system-design]
tags: [grouped-query-attention, multi-query-attention, latent-attention, kv-cache]
minutes: 10
lessons: [phases/07-transformers-deep-dive/03-multi-head-attention, phases/07-transformers-deep-dive/12-kv-cache-flash-attention]
manuals: []
practice: [grouped-query-attention]
cheatsheet: [attention-variants]
related: [transformers/heads-are-nearly-free, inference-serving/kv-pool-users-fit]
updated: 2026-11-03
---

Bạn đang chọn biến thể attention cho decoder mới thuộc lớp 70B: full multi-head, multi-query, grouped-query, hoặc MLA với latent được nén. Mỗi loại làm gì với bộ nhớ mà decoding giữ trên mỗi token, và bạn đánh đổi gì với từng loại?

## Short answer

Cả bốn giữ cùng số query head; chúng khác nhau ở số key head và value head tồn tại, và chỉ key cùng value được lưu trong decoding. Multi-query chia sẻ một key-value head trên mọi query head, cache nhỏ nhất và mất một phần chất lượng. Grouped-query dùng một nhóm key-value head, cắt cache theo `n_heads / n_kv_heads` và giữ gần như đầy đủ chất lượng, đó là lý do nó là mặc định. Latent attention nén key và value thành vector hạng thấp và giải nén lúc attention, nên tiết kiệm thêm bộ nhớ và trả thêm FLOP.

## Full answer

### The lineage

| Biến thể | Query head | Key-value head | Chi phí cache |
|---|---|---|---|
| Multi-head | N | N | đầy đủ |
| Multi-query | N | 1 | nhỏ nhất, mất chất lượng |
| Grouped-query | N | G, ví dụ N / 8 | thu nhỏ theo N / G |
| Multi-head latent | N | được nén thành latent hạng thấp | còn nhỏ hơn, tính toán nhiều hơn |

### What the cache holds

Trên mỗi lớp và mỗi token, số byte được lưu là `2 * n_kv_heads * d_head * dtype_size`, trong đó 2 đếm key và value. Query của token quá khứ không bao giờ cần lại, nên không được lưu. Mô hình thuộc lớp 70B với 80 lớp, kích thước head 128 và 8 key-value head ở kiểu 16-bit giữ 4096 byte trên mỗi token mỗi lớp, khoảng 10 GiB cho ngữ cảnh 32K và 40 GiB ở 128K. Cùng mô hình với 64 key-value head sẽ giữ nhiều hơn 8 lần, khoảng 80 GiB ở 32K. Đó là toàn bộ bộ nhớ của một bộ tăng tốc lớn dành cho một yêu cầu.

### The quality side

Grouped-query giữ các query head, nên mỗi head vẫn hỏi câu hỏi riêng; nó chỉ chia sẻ các câu trả lời có thể tra cứu. Công trình đã công bố chuyển các checkpoint multi-head đã huấn luyện sang grouped-query bằng một lượt fine-tune và báo cáo chất lượng gần như đầy đủ. Multi-query chia sẻ một tập câu trả lời duy nhất trên tất cả head và mất nhiều hơn. Latent attention đánh đổi tính toán lấy bộ nhớ: latent phải được chiếu ngược thành key và value ở mỗi bước.

### Grouped-query in code

Chỉ các phép chiếu key và value thay đổi. Chúng tạo `n_kv_heads` head, và mỗi head được lặp để khớp query head:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)
```

Khi suy luận chỉ các bản sao `n_kv_heads` nằm trong cache, không phải các bản được lặp.

### The pick

Với decoder 70B cần phục vụ ngữ cảnh dài, grouped-query với nhóm nhỏ là mặc định an toàn. Latent attention là lựa chọn khi bộ nhớ là ràng buộc giới hạn và bạn chấp nhận chi phí tính toán cùng công việc kỹ thuật.

## Follow-ups

- **Level 2:** Những con số nào quyết định số byte được lưu trên mỗi token? Expected: các lớp, key-value head, kích thước head và byte trên mỗi giá trị, nhân 2 cho key và value; số tham số không tham gia.
- **Level 3:** Tại sao latent attention tốn tính toán hơn mỗi bước? Expected: latent được lưu phải được chiếu ngược thành key và value đầy đủ ở mọi bước decode trước khi tính điểm số.
- **Level 3:** Bạn có thể chuyển checkpoint multi-head hiện có sang grouped-query không? Expected: có, bài báo grouped-query chuyển các checkpoint đã huấn luyện và fine-tune; đo chất lượng trên eval của bạn trước khi phát hành.
- **Level 4:** Sản phẩm muốn ngữ cảnh 128K ở kích thước batch một trên card 40 GB. Biến thể nào và còn gì nữa? Expected: chỉ riêng grouped-query đã lấp đầy card ở 128K, nên cần latent attention hoặc kiểu key-value nhỏ hơn, và trọng số vẫn cần bộ nhớ riêng.

## Wrong answers

- "Grouped-query giảm tính toán của attention." Điểm số vẫn được tính cho mọi query head; khoản tiết kiệm nằm ở key và value được lưu.
- "Multi-query không tốn gì." Nó chia sẻ một tập câu trả lời trên tất cả head và bài học ghi nhận mất chất lượng.
- "Kích thước cache đi theo số tham số." Nó đi theo các key-value head, các lớp, kích thước head và kiểu dữ liệu.

## Taught in

[Bài học về multi-head attention](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) đưa ra các biến thể và mã grouped-query, còn [bài học về KV cache](../../../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/) thực hiện tính toán bộ nhớ.
