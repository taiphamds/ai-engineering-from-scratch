---
id: gqa-checkpoint-pooling
title: Convert a multi-head checkpoint to grouped-query heads
card: coding
kind: estimate
level: 4
roles: [inference-engineer, applied-ai-engineer]
rounds: [coding, ml-depth]
tags: [gqa, kv-cache, checkpoint-conversion, memory]
minutes: 15
lessons: [phases/07-transformers-deep-dive/03-multi-head-attention]
manuals: []
practice: [grouped-query-attention]
cheatsheet: [attention-variants, inference-optimization]
related: [coding/gqa-repeat-not-tile, coding/split-heads-reshape]
updated: 2026-11-03
---

Bạn có một mô hình đã huấn luyện với 64 query head và 64 key và value head, và bạn muốn phục vụ nó với 8 key và value head để thu nhỏ cache. Viết hàm gộp phép chiếu key của checkpoint thành các nhóm, cho biết bộ nhớ cache cho các key và value giảm theo hệ số nào, và giải thích tại sao mô hình đã gộp cần huấn luyện thêm trước khi dùng được.

## Short answer

Nhóm `g` của phép chiếu mới là trung bình của các head liên tiếp từ `g r` đến `g r + r - 1`, trong đó `r` là số query head mỗi nhóm, được lấy trên các cột của ma trận chiếu. Cache giữ các key và value cho 8 head thay vì 64, vì vậy bộ nhớ đó giảm theo hệ số tám. Trung bình của nhiều head không phải là một head mà mô hình đã được huấn luyện cùng, vì vậy chất lượng giảm cho đến khi một lần huấn luyện tiếp ngắn điều chỉnh các query head thích nghi với nhóm dùng chung của chúng.

## Full answer

### The pooling

```python
def mean_pool_kv_heads(w, n_heads, n_kv_heads):
    if n_heads % n_kv_heads:
        raise ValueError("query heads must be a multiple of kv heads")
    D, cols = w.shape
    d_head = cols // n_heads
    r = n_heads // n_kv_heads
    grouped = w.reshape(D, n_kv_heads, r, d_head)
    return grouped.mean(axis=2).reshape(D, n_kv_heads * d_head)
```

Phép reshape đặt các nhóm trước và các head bên trong một nhóm tiếp theo, vì các head của một nhóm là các khối cột liên tiếp. Reshape thành `(D, r, G, d_head)` gộp các head cách nhau `G`, tạo ra hình dạng đúng với các nhóm sai. Trung bình, không phải tổng, giữ tỷ lệ của các key đã chiếu gần với ban đầu, để các điểm số attention vẫn nằm trong phạm vi.

### The memory factor

Cache lưu một vector key và một vector value cho mỗi lớp, mỗi head, mỗi token. Số query head không tham gia. Đi từ 64 xuống 8 key và value head chia số byte được lưu cho mỗi token cho tám, là ví dụ mà bài học multi-head đưa ra cho một mô hình mở lớn. Trọng số giảm ít hơn nhiều, vì các phép chiếu query và đầu ra không thay đổi và chỉ các phép chiếu key và value co lại.

### Why it needs training

Các query head đã được huấn luyện với các key head riêng của chúng. Sau khi gộp, tám query head đọc một key head trung bình mà không head nào trong số chúng đã thấy trong huấn luyện. Phần dòng dõi trong bài học mô tả việc chuyển checkpoint multi-head thành checkpoint grouped-query như một công thức có một bước huấn luyện tiếp; việc gộp cung cấp một điểm bắt đầu gần với ban đầu, và việc huấn luyện bổ sung khôi phục phần lớn chất lượng. Phục vụ trực tiếp các trọng số đã gộp hoạt động, nhưng đánh giá phải được chạy lại trước khi phát hành.

### What does not change

Kích thước head, phép chiếu query, phép chiếu đầu ra và chính hàm attention là như nhau. Chỉ các phép chiếu key và value cùng phép lặp bên trong attention thay đổi, vì vậy phần còn lại của bộ nạp và block được giữ nguyên.

## Follow-ups

- **Level 3:** Tại sao gộp các head liên tiếp chứ không phải mỗi head thứ tám? Expected: attention đọc nhóm `h` chia lấy phần nguyên cho `r` đối với query head `h`, vì vậy các head được gộp phải là những head sẽ dùng chung một nhóm.
- **Level 4:** Mức tiết kiệm cache thay đổi như thế nào khi mô hình được phục vụ với một ngữ cảnh dài hơn? Expected: nó không thay đổi về hệ số; mức tiết kiệm tính theo mỗi token, vì vậy số byte tiết kiệm tuyệt đối tăng theo số token được giữ.
- **Level 4:** Biến thể multi-head latent nén các key và value thành một latent hạng thấp. Nó đánh đổi điều gì để có mức tiết kiệm thêm? Expected: tính toán, vì latent phải được chiếu trở lại thành các key và value đầy đủ tại thời điểm attention.

## Wrong answers

- "Việc gộp không mất mát vì trung bình giữ nguyên key trung bình." Các head riêng lẻ bị mất; các query đã được huấn luyện với chúng, vì vậy chất lượng giảm cho đến khi mô hình được điều chỉnh.
- "Cache co lại theo tỷ lệ query head trên tổng số head." Chỉ các key và value head nằm trong cache; hệ số là số key và value head cũ trên số mới.
- "Cộng các head để không mất thông tin." Tổng nhân tỷ lệ các key với kích thước nhóm và đẩy các điểm số ra khỏi phạm vi mà softmax đã được huấn luyện cho.

## Taught in

[Bài học multi-head attention](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) đưa ra dòng dõi grouped-query và hệ số cache, và [bài thực hành grouped-query](../../../practice/grouped-query-attention/) triển khai việc gộp một checkpoint multi-head.
