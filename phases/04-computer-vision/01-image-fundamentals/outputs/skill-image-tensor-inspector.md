---
name: skill-image-tensor-inspector
description: Inspect any image-shaped tensor or array and report dtype, layout, range, and whether it looks raw, normalized, or standardized
version: 1.0.0
phase: 4
lesson: 1
tags: [computer-vision, debugging, preprocessing, tensors]
---

# Image Tensor Inspector

Một skill chẩn đoán cho bất kỳ điểm nào trong pipeline thị giác mà bạn đang có một mảng có hình dạng ảnh và cần biết chính xác nó ở trạng thái nào.

## When to use

- Một mô hình được tiền huấn luyện trả về các dự đoán rác và bạn nghi ngờ tiền xử lý.
- Di chuyển một pipeline giữa OpenCV và torchvision và thứ tự kênh không rõ ràng.
- Xếp chồng các lớp từ nhiều framework và trục batch cứ xuất hiện sai chỗ.
- Gỡ lỗi một vòng lặp huấn luyện có mất mát mắc kẹt ở `log(num_classes)`.

## Inputs

- `x`: bất kỳ đối tượng dạng mảng 2-D, 3-D hoặc 4-D nào (NumPy, PyTorch, JAX).
- `expected` tùy chọn: một dict các bất biến để kiểm tra, ví dụ `{"layout": "CHW", "range": "standardized"}`.

## Steps

1. **Xác định backend** — phát hiện `x` là NumPy, Torch hay JAX. Chuyển sang NumPy để xem xét mà không thay đổi bản gốc.

2. **Phân loại số chiều**:
   - số chiều 2 -> hình ảnh một kênh (H, W).
   - số chiều 3 -> `HWC` nếu trục cuối là 1, 3 hoặc 4 và nhỏ hơn hẳn hai trục kia; nếu không là `CHW`.
   - số chiều 4 -> ưu tiên `NCHW` nếu trục 1 thuộc {1, 3, 4} **và** trục 2 hoặc trục 3 lớn hơn 16; nếu không ưu tiên `NHWC`. Chỉ kiểm tra trục 1 phân loại sai các batch NHWC hình ảnh nhỏ như `(3, 4, 224, 3)`.
   - Luôn đánh dấu các trường hợp mơ hồ (ví dụ `(1, 3, 3, 3)`) là `ambiguous` thay vì đoán; yêu cầu bên gọi cung cấp `expected`.

3. **Phân loại dtype và phạm vi**:
   - `uint8` trong [0, 255] -> `raw`.
   - `float*` với min >= 0 và max <= 1.01 -> `normalized`.
   - `float*` với min < 0 và |mean| < 0.5 và 0.5 <= std <= 1.5 -> `standardized`.
   - Mọi thứ khác -> `unusual`, in histogram.

4. **Thống kê từng kênh** — báo cáo trung bình và độ lệch chuẩn từng kênh. So sánh với trung bình/độ lệch chuẩn ImageNet nếu mảng trông được chuẩn hóa thống kê và đưa ra độ tin cậy khớp.

5. **Báo cáo** theo đúng khối này:

```
[inspector]
  backend:   numpy | torch | jax
  rank:      2 | 3 | 4
  layout:    HW | HWC | CHW | NHWC | NCHW
  dtype:     <dtype>
  shape:     <shape>
  range:     raw | normalized | standardized | unusual
  min/max:   <min> / <max>
  per-channel mean: [ ... ]
  per-channel std:  [ ... ]
  likely source:    camera | PIL | OpenCV | torchvision | random init
  likely target:    display | training | inference
```

6. **Khuyến nghị hành động tiếp theo** dựa trên `likely target`:
   - Với `display`: chuyển vị sang HWC, cắt ngưỡng, chuyển sang uint8.
   - Với `training`: chuẩn hóa thống kê bằng thống kê tập dữ liệu, chuyển vị sang CHW, thêm trục batch.
   - Với `inference`: khớp đúng các bất biến trong model card.

## Rules

- Không bao giờ thay đổi đầu vào. Chỉ in chẩn đoán.
- Nếu `expected` được cung cấp, đánh dấu mọi điểm không khớp bằng `[expected X got Y]`.
- Chỉ ra các nguy cơ thất bại âm thầm khi bố cục hoặc thứ tự kênh mơ hồ.
- Khuyến nghị một hành động mỗi lần, không phải một danh sách lựa chọn.
