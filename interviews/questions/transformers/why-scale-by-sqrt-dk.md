---
id: why-scale-by-sqrt-dk
title: Why the attention scores are divided before the softmax
card: transformers
kind: concept
level: 1
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [screen, ml-depth]
tags: [attention, softmax, scaling, gradients]
minutes: 6
lessons: [phases/07-transformers-deep-dive/02-self-attention-from-scratch, phases/07-transformers-deep-dive/03-multi-head-attention, phases/19-capstone-projects/33-multihead-self-attention]
manuals: []
practice: [scaled-dot-product-attention]
cheatsheet: [transformers-attention]
related: []
updated: 2026-11-03
---

Trong công thức attention, điểm số thô đi qua một phép chia trước softmax. Kỹ sư mới gọi phép chia là quy ước và bỏ nó để tiết kiệm một phép nhân. Điều gì xảy ra với huấn luyện, và bạn sẽ cho thấy tác động trong mười phút như thế nào?

## Short answer

Tích vô hướng của hai vector tăng theo độ dài của chúng, nên không có phép chia, điểm số tăng theo số chiều key. Điểm số lớn đẩy softmax vào vùng mà một key lấy gần hết trọng số và gradient đến mọi key khác gần không, nên việc học đình trệ. Phép chia cho `sqrt(d_k)` giữ phương sai điểm số gần như không đổi với mọi kích thước head. Cho thấy bằng Q và K ngẫu nhiên tại `d_k = 64`: in khoảng điểm số và trọng số softmax có và không có phép chia.

## Full answer

### The size of a score

Điểm số là tổng của `d_k` tích. Khi các thành phần Q và K có phương sai đơn vị, tổng có phương sai `d_k`, nên điểm số điển hình có độ lớn khoảng `sqrt(d_k)`. Ở `d_k = 64`, điểm số thô nằm trong khoảng hàng chục. Softmax trên các điểm số hàng chục đặt gần hết khối lượng lên phần tử lớn nhất.

### Why the model stops learning

Gradient của softmax theo một điểm số nhỏ khi một trọng số gần một và các trọng số khác gần không. Lớp attention khi đó hành xử như phép tra cứu cố định. Loss đi ngang, và không có gì báo lỗi rõ ràng. Bài học gọi đây là chế độ mà "một phần tử có gần hết khối lượng còn các phần tử khác nhỏ đến mức gần biến mất".

### The fix and its range

Chia điểm số cho `sqrt(d_k)` trước softmax:

```text
weights = softmax(Q @ K.T / sqrt(d_k))
output  = weights @ V
```

Trong multi-head attention, số chiều dưới căn là chiều rộng head, `d_head = d_model / n_heads`, không phải chiều rộng mô hình. Mô hình production đặt `d_head` ở 64 hoặc 128. Scaling giữ phương sai điểm số không đổi ở mọi chiều rộng. Quy tắc kinh nghiệm của bài học giữ head ở 32 hoặc rộng hơn, vì head hẹp hơn thấy quá ít chiều, và dưới 256, vì head rộng hơn mất lợi ích của nhiều chuyên gia nhỏ.

### The ten-minute demonstration

1. Lấy Q và K từ phân phối chuẩn tắc với `d_k = 64`.
2. In `(Q @ K.T).max()` có và không có phép chia.
3. In trọng số softmax lớn nhất trong một hàng cho cả hai trường hợp. Không có phép chia, nó nằm gần một.

## Follow-ups

- **Level 1:** Hình dạng ma trận điểm số cho chuỗi n token là gì? Expected: (n, n), một hàng mỗi query và một cột mỗi key.
- **Level 2:** Tại sao thiếu phép chia gây lỗi âm thầm thay vì ngoại lệ? Expected: softmax bão hòa, gradient trở nên rất nhỏ, và loss đi ngang mà không có lỗi.
- **Level 2:** Phép chia có thay đổi những gì lớp biểu diễn được không? Expected: không, các phép chiếu có thể hấp thụ một hằng số; nó thay đổi thang đo điểm số khi khởi tạo, là nơi huấn luyện diễn ra hoặc đình trệ.
- **Level 3:** Với tám head có chiều rộng 64 trong mô hình chiều rộng 512, số nào nằm dưới căn? Expected: 64, chiều rộng head, vì mỗi head tính softmax riêng trên điểm số riêng.

## Wrong answers

- "Phép chia giữ các trọng số attention có tổng bằng một." Softmax chuẩn hóa mọi điểm số để có tổng bằng một; phép chia kiểm soát độ phân tán của chúng, không phải tổng.
- "Learning rate lớn hơn khôi phục gradient đã mất." Khi softmax bão hòa, gradient hầu như không mang thông tin về các key khác, và bước lớn hơn không tạo thông tin.
- "Điều chỉnh value thay vì điểm số." Các value được cộng sau khi trọng số đã cố định, nên thang đo của chúng không chạm đến softmax.

## Taught in

[Bài học về self-attention](../../../phases/07-transformers-deep-dive/02-self-attention-from-scratch/) giải thích sự bão hòa, [bài học về multi-head](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) đưa ra các chiều rộng head, và [khối attention capstone](../../../phases/19-capstone-projects/33-multihead-self-attention/) áp dụng scaling bên trong khối theo batch.
