---
id: rope-relative-from-absolute
title: Absolute angles, relative distances
card: transformers
kind: concept
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, coding]
tags: [rope, positional-encoding, relative-position, rotation]
minutes: 8
lessons: [phases/07-transformers-deep-dive/04-positional-encoding]
manuals: []
practice: [rope]
cheatsheet: [positional-encoding]
related: [transformers/permutation-blind-attention]
updated: 2026-11-03
---

Cơ chế rotary quay mọi query và mọi key theo góc tỷ lệ với vị trí tuyệt đối của token. Tuy nhiên mọi người đều nói nó mã hóa vị trí tương đối. Giải quyết mâu thuẫn bề ngoài đó, và nói một unit test bạn sẽ viết để chứng minh thuộc tính này.

## Short answer

Phép quay tác động lên các cặp tọa độ với góc `pos * theta_i`. Khi query từ vị trí m gặp key từ vị trí n, tích vô hướng trên mỗi cặp nhận `cos((m - n) * theta_i)`, nên chỉ khoảng cách còn lại và hai vị trí tuyệt đối triệt tiêu. Kiểm thử: quay hai vector ngẫu nhiên ở các vị trí (a, b) rồi lại ở (a + k, b + k), sau đó khẳng định hai tích vô hướng khớp trong sai số dấu phẩy động.

## Full answer

### The rotation

Với mỗi cặp chiều (2i, 2i + 1) trong head có chiều rộng `d_head`:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

Mỗi cặp là một điểm trên mặt phẳng, và phép quay xoay nó theo `pos * theta_i`. Các giá trị i thấp quay nhanh và giá trị cao quay chậm, vì `theta_i = base ** (-2i / d_head)`.

### Why the dot product only sees the gap

Phép quay góc alpha được theo sau bởi tích vô hướng với vector quay góc beta bằng tích vô hướng của các vector gốc được quay theo `alpha - beta`. Áp dụng cùng hàm cho Q ở vị trí m và K ở vị trí n, và mỗi cặp đóng góp hệ số phụ thuộc vào `(m - n) * theta_i`. Điểm số phụ thuộc vào khoảng cách dù phép quay dựa trên vị trí tuyệt đối. Attention nhận vị trí tương đối không tốn thêm, không có bảng và không có tham số.

### Where it applies

Phép quay áp dụng lên Q và K sau phép chiếu và trước matmul điểm số. Nó không bao giờ chạm V, vì các value mang nội dung không nên bị quay theo vị trí, và không bao giờ chạm input embedding.

### Why it won

Nó lắp vào attention mà không thay đổi kiến trúc. `base` của nó là nút điều chỉnh rõ ràng: điều chỉnh nó và mô hình đạt ngữ cảnh dài hơn, là cách một họ mô hình đạt ngữ cảnh 128K từ 8K bằng các cơ chế scaling như nội suy NTK-aware và YaRN.

### The unit test

```text
a, b = random vectors of width d_head
s1 = dot(apply_rope(a, pos_a), apply_rope(b, pos_b))
s2 = dot(apply_rope(a, pos_a + k), apply_rope(b, pos_b + k))
assert abs(s1 - s2) < tolerance
```

Thuộc tính là toàn bộ mục đích của phương pháp. Nếu kiểm thử thất bại, phép quay được áp dụng chỉ một phía, hoặc hai phía dùng các cặp hay góc khác nhau. Đạt kiểm thử không chứng minh cách ghép cặp hoặc các góc khớp tham chiếu: cách ghép cặp sai nhất quán cũng đạt, nên cũng so sánh một vector đã quay với giá trị tính tay.

## Follow-ups

- **Level 2:** Tại sao quay Q và K mà không quay V? Expected: vị trí nên định hình sự khớp giữa các token, không phải nội dung được trả về khi token được chọn.
- **Level 3:** Điều gì xảy ra ở vị trí mô hình chưa bao giờ thấy trong huấn luyện? Expected: các cặp quay nhanh đạt các góc mô hình chưa bao giờ học cách đọc; điều chỉnh cơ số hoặc nội suy vị trí đưa chúng trở lại khoảng đã huấn luyện.
- **Level 3:** Linear-bias attention có vị trí tương đối mà không có phép quay bằng cách nào? Expected: nó cộng hình phạt tỷ lệ với `|i - j|` vào điểm số, một độ dốc mỗi head.
- **Level 4:** Tại sao tăng cơ số giúp ngữ cảnh dài hơn? Expected: cơ số lớn hơn hạ mọi tần số trừ cặp đầu tiên, luôn quay một radian mỗi vị trí, nên các cặp tần số cao không bị ép vào góc chưa thấy khi ngữ cảnh tăng; quy tắc NTK-aware điều chỉnh cơ số theo hệ số mở rộng lũy thừa `d / (d - 2)`.

## Wrong answers

- "RoPE thêm vector vị trí vào embedding." Nó quay các query và key bên trong attention; embedding không bị chạm.
- "RoPE cần bảng có kích thước độ dài tối đa nhân chiều rộng." Các góc đến từ công thức; không có bảng và không có tham số.
- "Chỉ quay key và tiết kiệm nửa công việc." Khi đó điểm số phụ thuộc vào vị trí tuyệt đối của key, và thuộc tính tương đối mất đi.

## Taught in

[Bài học về mã hóa vị trí](../../../phases/07-transformers-deep-dive/04-positional-encoding/) suy ra phép quay và đưa phép kiểm tra khoảng cách tương đối làm một bước xây dựng.
