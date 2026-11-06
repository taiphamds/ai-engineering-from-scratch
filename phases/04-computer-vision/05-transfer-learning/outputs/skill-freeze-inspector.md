---
name: skill-freeze-inspector
description: Report which parameters are trainable, which BatchNorm layers are in eval mode, and whether the optimizer is actually consuming the trainable parameters
version: 1.0.0
phase: 4
lesson: 5
tags: [computer-vision, transfer-learning, debugging, pytorch]
---

# Freeze Inspector

Các lỗi học chuyển giao ẩn ở ba nơi: các tham số đáng lẽ đóng băng nhưng không, các tham số đáng lẽ có thể huấn luyện nhưng không và các bộ tối ưu hóa được xây trước khi trạng thái đóng băng thay đổi. Skill này làm lộ cả ba trong một lượt.

## When to use

- Ngay sau khi đặt `requires_grad` trên một tập con tham số.
- Trước bước huấn luyện đầu tiên của một lần tinh chỉnh.
- Sau khi gọi `freeze_bn_stats` hoặc bất kỳ hàm hỗ trợ nào chuyển chế độ BN.
- Khi accuracy validation mắc kẹt ở ngẫu nhiên và bạn nghi ngờ không gì thực sự được huấn luyện.

## Inputs

- `model`: một `nn.Module` PyTorch.
- `optimizer`: bộ tối ưu hóa sắp được sử dụng để huấn luyện.
- `expected_frozen_prefixes` tùy chọn: danh sách các tiền tố tên tham số nên được đóng băng (ví dụ `["conv1", "bn1", "layer1"]`).

## Steps

1. **Duyệt các tham số.** Với mỗi `(name, param)`:
   - ghi lại `requires_grad`
   - ghi lại `shape` và `numel`

2. **Duyệt các module.** Với mỗi module:
   - nếu là BatchNorm, ghi lại liệu nó ở chế độ eval và liệu các tham số affine của nó có thể huấn luyện không.

3. **Xem xét bộ tối ưu hóa.** Với mỗi nhóm tham số:
   - làm phẳng `params` của nó thành một tập hợp `id(p)`.
   - so sánh với tập hợp tất cả `id(p)` cho các tham số có `requires_grad == True`.

4. **Phát hiện bốn kiểu thất bại:**
   - `leaked_train`: một tham số có `requires_grad=True` nhưng không xuất hiện trong bộ tối ưu hóa (gradient được tính nhưng không bao giờ áp dụng).
   - `ghost_train`: một tham số xuất hiện trong bộ tối ưu hóa nhưng có `requires_grad=False` (trạng thái bộ tối ưu hóa bị lãng phí; cũng có thể gây lỗi nếu sau đó bạn bật lại requires_grad).
   - `bn_mismatch`: hoặc (a) một lớp BN ở chế độ train (tích lũy thống kê) trong khi các tham số affine (`weight`, `bias`) đóng băng, hoặc (b) một lớp BN ở chế độ eval (thống kê đóng băng) trong khi các tham số affine có thể huấn luyện. Cả hai trạng thái không nhất quán và gần như luôn là lỗi.
   - `expected_vs_actual`: bất kỳ tiền tố nào liệt kê trong `expected_frozen_prefixes` vẫn có một tham số có thể huấn luyện.

## Report

```
[freeze-inspector]
  model trainable params: <N>
  model frozen params:    <N>
  batchnorm layers in eval mode: <count>
  batchnorm layers in train mode: <count>

[optimizer coverage]
  trainable params fed to optimizer: <M> of <N>
  leaked_train: <list of names> (trainable but not in optimizer)
  ghost_train:  <list of names> (in optimizer but frozen)

[bn audit]
  mismatched layers: <list of names>

[expectations]
  expected_frozen_prefixes: <...>
  violating params:         <list>

[verdict]
  ok | <one-line summary of the most severe issue>
```

## Rules

- Chỉ báo cáo tên tham số; không bao giờ in bản thân các trọng số.
- Sắp xếp mọi danh sách theo bảng chữ cái tên tham số.
- Nếu độ bao phủ bộ tối ưu hóa là 100% và không có điểm không khớp, trả về `ok` rồi dừng.
- Với `leaked_train`, luôn khuyến nghị xây lại bộ tối ưu hóa sau khi trạng thái đóng băng thay đổi.
- Với `ghost_train`, khuyến nghị loại bỏ nhóm tham số hoặc đặt `requires_grad=True` nếu ý định là huấn luyện nó.
