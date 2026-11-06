---
name: skill-conv-shape-calculator
description: Walk a CNN spec layer by layer and report output shape, receptive field, and parameter count for every block
version: 1.0.0
phase: 4
lesson: 2
tags: [computer-vision, cnn, architecture, debugging]
---

# Conv Shape Calculator

Một công cụ hỗ trợ tất định để lên kế hoạch hoặc gỡ lỗi một CNN. Với một hình dạng đầu vào và một danh sách đặc tả lớp, theo dõi các hình dạng, trường tiếp nhận và số tham số mà không chạy mô hình.

## When to use

- Thiết kế một CNN mới và bạn muốn xác minh mọi lần giảm mẫu đều đạt một kích thước gọn.
- Đọc một bài báo và chuyển bảng kiến trúc của nó thành mã.
- Một backbone được tiền huấn luyện sập do không khớp hình dạng tại đầu phân loại và bạn cần biết lớp nào đã thay đổi kích thước không gian.
- So sánh hai backbone về hiệu quả tham số trước khi huấn luyện bất kỳ cái nào.

## Inputs

- `input_shape`: `(C, H, W)`.
- `layers`: danh sách có thứ tự các dict lớp. Mỗi dict hỗ trợ:
  - `{type: "conv", c_out, k, s, p, groups=1, bias=true}`
  - `{type: "pool", mode: "max"|"avg", k, s, p=0}`
  - `{type: "adaptive_pool", out_h, out_w}`
  - `{type: "flatten"}`
  - `{type: "linear", out_features, bias=true}`

## Steps

1. **Khởi tạo bản theo dõi** với `(C, H, W)`, trường tiếp nhận `1`, stride hiệu dụng `1`, tham số cộng dồn `0`.

2. **Với mỗi lớp**, cập nhật theo thứ tự này:
   - Tính `C_out` (conv/linear), hoặc giữ `C_in` xuyên qua (pool).
   - Tính đầu ra không gian bằng `(H + 2P - K) / S + 1` cho conv và pool, `out_h/out_w` cho adaptive pool, `(1, 1)` cho hình dạng đầu ra flatten `(C * H * W, 1, 1)` trước linear, và số vô hướng `1x1` cho linear.
   - Cập nhật trường tiếp nhận và stride hiệu dụng:
     - Conv/pool: `RF_new = RF_old + (K - 1) * effective_stride`, `effective_stride *= S`.
     - Adaptive pool: coi như một pool có `S = H_in / out_h` hiệu dụng (làm tròn xuống). `RF_new = RF_old + (H_in - 1) * effective_stride_old`; `effective_stride *= S`. Lưu ý RF của adaptive pool bằng toàn bộ phạm vi không gian trước đó.
     - Flatten / linear: RF và stride hiệu dụng không còn ý nghĩa; đóng băng chúng ở các giá trị trước flatten và bỏ khỏi các hàng tiếp theo.
   - Tính các tham số:
     - Conv: `C_out * (C_in / groups) * K * K + (C_out if bias else 0)`.
     - Linear: `out_features * in_features + (out_features if bias else 0)`.
     - Pool và flatten: 0.

3. **Phát hiện các vấn đề** và đánh dấu:
   - Kích thước đầu ra không nguyên (stride/padding không căn chỉnh).
   - `H_out <= 0` trước cuối chồng lớp.
   - Trường tiếp nhận vượt kích thước đầu vào (có thể lãng phí tính toán sau điểm đó).
   - Số tham số mỗi lớp đột ngột tăng 10 lần gợi ý kế hoạch kênh sai.

4. **Báo cáo** dưới dạng một bảng duy nhất:

```
idx  layer                C_in  C_out  K  S  P  H_out  W_out  RF    params     cum_params
1    conv 3x3 s=1 p=1     3     32     3  1  1  224    224    3     896        896
2    conv 3x3 s=2 p=1     32    64     3  2  1  112    112    7     18,496     19,392
3    pool max 2x2         64    64     2  2  0  56     56     11    0          19,392
...
```

5. **Dòng tóm tắt**: `(C, H, W)` cuối, trường tiếp nhận cuối, tổng số tham số, các cảnh báo.

## Rules

- Luôn trả về số nguyên cho kích thước không gian. Nếu công thức tạo ra số không nguyên, đánh dấu là lỗi và không âm thầm làm tròn xuống.
- Khi `groups > 1`, xác minh `C_in % groups == 0` và `C_out % groups == 0`; nếu không báo lỗi.
- Với tích chập depthwise (`groups == C_in`), ghi nhãn nó trong cột `layer` để người đọc thấy tại sao ít tham số.
- Nếu người dùng cung cấp các lớp BatchNorm hoặc kích hoạt, bỏ qua chúng về hình dạng nhưng cộng tiếp tham số (`2 * C` mỗi BatchNorm).
- Không bao giờ đoán mặc định cho các trường thiếu. Yêu cầu `k`, `s`, `p` trên mọi conv và pool.
