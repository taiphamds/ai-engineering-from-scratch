---
id: gqa-repeat-not-tile
title: GQA that pairs query heads with the wrong group
card: coding
kind: code-reading
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [coding, ml-depth]
tags: [gqa, kv-heads, attention-variants]
minutes: 10
lessons: [phases/07-transformers-deep-dive/03-multi-head-attention]
manuals: []
practice: [grouped-query-attention]
cheatsheet: [attention-variants]
related: [coding/gqa-checkpoint-pooling, coding/split-heads-reshape]
updated: 2026-11-03
---

Một cách triển khai GQA lặp các key và value head lên đến số lượng query head bằng dòng này, trong đó `kv` có hình dạng batch, nhóm, token, kích thước head:

```python
kv_full = np.tile(kv, (1, n_heads // n_kv_heads, 1, 1))
```

Các hình dạng khớp và các đầu ra sai với mọi cấu hình có nhiều hơn một nhóm. Giải thích query head nào cuối cùng nhận nhóm nào, và viết phép mở rộng đúng.

## Short answer

Tiling lặp lại toàn bộ khối nhóm, vì vậy query head `h` đọc nhóm `h` modulo số nhóm. Quy ước là các query head liên tiếp dùng chung một nhóm: head `h` đọc nhóm `h` chia lấy phần nguyên cho hệ số lặp. Lặp từng nhóm tại chỗ dọc theo trục head thay vì tile khối.

## Full answer

### The two layouts

Với bốn query head và hai nhóm hệ số lặp là hai. Phép mở rộng đúng cho chuỗi nhóm `0, 0, 1, 1`: hai query head đầu dùng chung nhóm không và hai head tiếp theo dùng chung nhóm một. Tiling cho `0, 1, 0, 1`, vì vậy các head một và hai đổi đối tác. Mỗi head vẫn có một tensor key và value đúng hình dạng, là lý do không phép kiểm tra hình dạng nào thất bại, nhưng một nửa các head attend với các key sai.

### The fix

```python
def repeat_kv(kv, n_heads):
    B, G, T, d_head = kv.shape
    if n_heads % G:
        raise ValueError("query heads must be a multiple of kv heads")
    r = n_heads // G
    return np.repeat(kv, r, axis=1)
```

`np.repeat` dọc theo trục nhóm sao chép mỗi nhóm `r` lần ngay bên cạnh chính nó, tạo ra ánh xạ chia lấy phần nguyên. Phép kiểm tra tính chia hết thuộc về đây, vì một hệ số lặp không nguyên âm thầm bị cắt cụt và làm mất các head.

### Why the mapping is a convention and not a choice

Các trọng số chiếu của một checkpoint đã huấn luyện được học theo một ánh xạ. Bài học multi-head mô tả dòng dõi: multi-head attention với một nhóm cho mỗi head, multi-query attention với một nhóm dùng chung duy nhất, và dạng grouped ở giữa với `r` head đầu tiên trên nhóm không. Một mô hình được chuyển từ các trọng số multi-head bằng cách gộp các head liên tiếp chỉ hoạt động nếu attention đọc các nhóm theo cùng thứ tự liên tiếp.

### Why it exists

Chỉ `G` key và value head nằm trong cache thay vì `H`, vì vậy cache co lại theo hệ số `H / G` trong khi chất lượng vẫn gần với multi-head attention tiêu chuẩn. Ví dụ của bài học là một mô hình mở lớn ghép 64 query head với chỉ 8 nhóm dùng chung.

## Follow-ups

- **Level 3:** Với một nhóm, hàm tính điều gì? Expected: multi-query attention; mọi query head dùng chung key và value head duy nhất.
- **Level 3:** Hệ số tỷ lệ đến từ đâu sau phép lặp? Expected: căn bậc hai của kích thước head, giống như trong multi-head attention; chia cho căn bậc hai của toàn bộ chiều rộng là một lỗi phổ biến riêng biệt.
- **Level 4:** Một framework tránh tạo thực các bản sao lặp lại như thế nào? Expected: nó broadcast trục nhóm bên trong attention kernel, hoặc lời gọi attention chấp nhận trực tiếp ít key và value head hơn, để bộ nhớ chỉ giữ các nhóm.

## Wrong answers

- "Tile và repeat cho cùng kết quả khi các hình dạng khớp." Chúng cho các cách gán head vào nhóm khác nhau; chỉ một cách khớp với các trọng số đã huấn luyện.
- "Lấy trung bình các nhóm và dùng một tensor key cho mọi head." Điều đó biến mô hình thành multi-query attention với các trọng số mà nó không được huấn luyện cho.
- "Ánh xạ không quan trọng vì attention bất biến với hoán vị." Attention bất biến trên các key bên trong một head, không phải trên việc một query head đọc key head nào.

## Taught in

[Bài học multi-head attention](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) đưa ra biến thể grouped-query và phép lặp của nó, và [bài thực hành grouped-query](../../../practice/grouped-query-attention/) kiểm tra ánh xạ head vào nhóm.
