---
name: skill-segmentation-mask-inspector
description: Report class distribution, predicted-mask statistics, and the classes most likely to be under-predicted or boundary-blurred
version: 1.0.0
phase: 4
lesson: 7
tags: [computer-vision, segmentation, debugging, evaluation]
---

# Segmentation Mask Inspector

Một chẩn đoán cho khoảng cách giữa "mất mát đã giảm" và "các mặt nạ thực sự trông đúng".

## When to use

- Ngay sau một lần huấn luyện khi mIoU trông ổn nhưng xem trực quan nói khác.
- Trước triển khai: kiểm tra cân bằng lớp của các dự đoán so với sự thật nền.
- Khi IoU từng lớp cao cho các đối tượng lớn nhưng thấp cho các đối tượng nhỏ.
- Gỡ lỗi các giả ảnh biên không xuất hiện trong IoU vì chúng có ít pixel.

## Inputs

- `preds`: tensor (N, H, W) các ID lớp dự đoán.
- `targets`: tensor (N, H, W) các ID lớp sự thật nền.
- `num_classes`: số nguyên.
- `class_names` tùy chọn: danh sách C chuỗi.

## Steps

1. **Histogram pixel lớp.** Tính phần trăm pixel mỗi lớp cho `preds` và `targets`. Đánh dấu mọi lớp có `|pred% - gt%| / max(gt%, 1e-6) > 0.30` (độ lệch tương đối trên 30%). Với các lớp vắng mặt trong sự thật nền (`gt% == 0`), trực tiếp đánh dấu mọi tỷ phần dự đoán trên `0.3`.

2. **IoU từng lớp** và **F1 biên từng lớp**. F1 biên được tính bằng cách giãn mỗi mặt nạ 3 pixel, lấy giao và chấm điểm. Các lớp có IoU > 0.7 nhưng F1 biên < 0.5 đang làm mờ cạnh.

3. **Recall đối tượng nhỏ.** Tách mỗi thành phần liên thông sự thật nền vào các nhóm kích thước (rất nhỏ < 100 px, nhỏ < 1000 px, vừa < 10000 px, lớn >= 10000 px). Báo cáo recall mỗi nhóm mỗi lớp. Recall đối tượng nhỏ dưới 0.3 trong khi recall đối tượng lớn trên 0.9 cho thấy một vấn đề độ phân giải / trường tiếp nhận.

4. **Các cặp nhầm lẫn.** Với mỗi lớp, tìm lớp nó thường nhầm nhất (lớp dự đoán sai phổ biến nhất trong mặt nạ sự thật nền của nó). Báo cáo 3 cặp đứng đầu.

5. **Kiểm tra bão hòa (cần `probs` hoặc `logits`, không chỉ `preds`).** Nếu bên gọi truyền phân phối xác suất từng pixel thô `probs: (N, C, H, W)`, tính tỷ lệ pixel có `probs.max(dim=1) > 0.99` mỗi lớp. Bão hòa cao (>0.9 pixel của một lớp) gợi ý quá tự tin — ứng viên cho làm trơn nhãn hoặc hiệu chỉnh. Khi chỉ có `preds` đã argmax, bỏ bước này và ghi chú trong báo cáo.

## Report format

```
[mask-inspector]
  classes: C

[class distribution]
  name       gt %    pred %   delta
  ...

[metrics]
  class       IoU     bF1    recall_tiny  recall_small  recall_medium  recall_large
  ...

[confusion pairs]
  class A confused with class B: <N> pixels (most common)
  class B confused with class A: <N> pixels
  ...

[verdict]
  most impactful issue: <one sentence>
```

## Rules

- Sắp xếp các hàng lớp theo tỷ phần pixel gt giảm dần để các lớp thường gặp nhất đứng đầu.
- Đánh dấu các lớp có IoU < 0.4 hoặc F1 biên < 0.3 là `critical`.
- Khi recall đối tượng nhỏ là thất bại chủ đạo, khuyến nghị: huấn luyện độ phân giải cao hơn, stride nhỏ hơn ở giai đoạn encoder cuối hoặc decoder tháp đặc trưng.
- Khi F1 biên là thất bại chủ đạo, khuyến nghị: mất mát nhận biết biên (Lovasz hoặc BoundaryLoss), TTA với lật ngang và decoder không stride.
- Không bao giờ xuất chỉ số lớp làm định danh duy nhất; nếu `class_names` được cung cấp, sử dụng nó ở mọi hàng.
