---
id: sinusoidal-table-swap
title: Swap the learned position table for a fixed one
card: coding
kind: take-home
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, take-home]
tags: [positional-encoding, sinusoidal, parameter-count]
minutes: 20
lessons: [phases/19-capstone-projects/35-gpt-model-assembly]
manuals: []
practice: [sinusoidal-positional-encoding]
cheatsheet: [positional-encoding, gpt-from-scratch-training]
related: [coding/top-k-then-sample]
updated: 2026-11-03
---

Cấu hình GPT nhỏ tham chiếu dùng một position embedding được học có hình dạng 1024 nhân 768. Thay nó bằng một bảng hình sin được tính tại thời điểm khởi tạo, cộng nó vào một batch token embedding, và cho tôi biết số lượng tham số thay đổi bao nhiêu và tại sao mô hình vẫn truyền tiến được.

## Short answer

Xây dựng một bảng có một hàng cho mỗi vị trí và một cột cho mỗi đặc trưng, trong đó cột `2i` giữ sine và cột `2i + 1` giữ cosine của vị trí chia cho cơ số lũy thừa `2i` trên chiều rộng mô hình. Đăng ký nó làm một buffer, cắt lấy `T` hàng đầu ở mỗi lượt truyền tiến và cộng chúng vào các token embedding mà không thay đổi mảng của bên gọi. Bảng có cùng hình dạng với bảng được học, vì vậy lượt truyền tiến không thay đổi, và số lượng giảm 786,432 tham số vì bảng không còn được học.

## Full answer

### The table

```python
def sinusoidal_pe(max_len, d_model, base):
    pos = np.arange(max_len)[:, None]
    end = 2 * (d_model // 2)
    i = np.arange(0, end, 2)
    angle = pos / base ** (i / d_model)
    pe = np.zeros((max_len, d_model))
    pe[:, 0:end:2] = np.sin(angle)
    pe[:, 1:end:2] = np.cos(angle)
    return pe


class SinusoidalPositions(nn.Module):
    def __init__(self, max_len, d_model, base):
        super().__init__()
        table = torch.as_tensor(sinusoidal_pe(max_len, d_model, base)).float()
        self.register_buffer("pe", table)

    def forward(self, x):
        return x + self.pe[: x.shape[1]]
```

Số mũ là `2i` trên chiều rộng, vì vậy các tần số giảm từ một xuống một trên cơ số dọc theo các cột. Các cột xen kẽ giữa sine và cosine; đặt tất cả sine ở nửa đầu và tất cả cosine ở nửa sau là một bố trí khác và không khớp với bản tham chiếu. Các vị trí bắt đầu từ không. Một chiều rộng lẻ không có cặp cho cột cuối cùng của nó, vì vậy cột đó giữ giá trị không. Bảng được xây dựng một lần bằng numpy và được lưu làm một torch buffer, vì vậy nó di chuyển đến thiết bị của mô hình và phép cộng thấy hai tensor trên cùng thiết bị.

### Why the forward pass is unchanged

Phần lắp ráp cộng một vector vị trí vào mỗi vector token trước block đầu tiên. Không có gì phía sau biết vector đó đến từ một bảng được học hay một bảng cố định. Hợp đồng hình dạng như nhau, vì vậy các block, LayerNorm cuối cùng và head buộc chung chạy không thay đổi.

### The parameter count

Bảng được học giữ 1024 hàng mỗi hàng 768 giá trị. Loại nó khỏi danh sách tham số giảm số tham số duy nhất đi 786,432. Bộ đếm tham số phải đếm các tensor duy nhất, để head mô hình ngôn ngữ buộc chung không bị đếm hai lần, và nó không được đếm các buffer.

### Two mistakes to avoid

- Cộng bảng tại chỗ bằng `+=` thay đổi các embedding của bên gọi, mà vòng lặp huấn luyện vẫn giữ.
- Chia số mũ cho chiều rộng của phần chẵn thay vì toàn bộ chiều rộng cho một chiều rộng lẻ các tần số của một mô hình hẹp hơn.

## Follow-ups

- **Level 2:** Tại sao xen kẽ sine và cosine thay vì đặt chúng vào hai nửa? Expected: một checkpoint được huấn luyện với bố trí xen kẽ mong đợi mỗi cặp cột kề nhau tạo thành một phép quay, và hai bố trí không thể thay thế cho nhau.
- **Level 2:** Cơ số kiểm soát điều gì? Expected: tần số thấp nhất, và do đó khoảng vị trí dài nhất trước khi các cột chậm nhất lặp lại.
- **Level 3:** Bài học lắp ráp nói sơ đồ vị trí nào biến mô hình này thành họ mô hình tiếp theo? Expected: một sơ đồ rotary được áp dụng bên trong attention thay thế bảng cộng và giữ block cùng head không thay đổi.
- **Level 3:** Một bảng cố định không có tham số; mô hình mất điều gì? Expected: khả năng học các đặc trưng vị trí từ dữ liệu, đổi lại một bảng mở rộng đến bất kỳ độ dài nào khi khởi tạo.

## Wrong answers

- "Đăng ký bảng làm một tham số để bộ tối ưu hóa có thể tinh chỉnh nó." Khi đó nó lại là một bảng được học và số lượng không giảm.
- "Bắt đầu các vị trí từ một để hàng đầu tiên không toàn số không và số một." Bản tham chiếu bắt đầu từ không; hàng không là mã của vị trí không.
- "Dùng cùng số mũ cho các cột sine và cosine nhưng một cơ số khác." Cả hai cột của một cặp dùng chung một góc; chỉ hàm là khác.

## Taught in

[Bài học lắp ráp GPT](../../../phases/19-capstone-projects/35-gpt-model-assembly/) đặt việc thay đổi này làm một bài tập và đưa ra chênh lệch tham số, và [bài thực hành mã hóa hình sin](../../../practice/sinusoidal-positional-encoding/) kiểm tra bố trí xen kẽ.
