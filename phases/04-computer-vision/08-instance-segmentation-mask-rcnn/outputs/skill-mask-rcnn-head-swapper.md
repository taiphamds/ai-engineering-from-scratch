---
name: skill-mask-rcnn-head-swapper
description: Generate the exact code for swapping box and mask heads on a torchvision Mask R-CNN for a custom num_classes
version: 1.0.0
phase: 4
lesson: 8
tags: [computer-vision, mask-rcnn, fine-tuning, torchvision]
---

# Mask R-CNN Head Swapper

Tạo mã khuôn đổi đầu riêng cho Mask R-CNN. Khuôn bên dưới giả định `model.roi_heads.box_predictor` và `model.roi_heads.mask_predictor`, chỉ tồn tại trên `maskrcnn_resnet50_fpn` và `maskrcnn_resnet50_fpn_v2`. Faster R-CNN có bộ dự đoán hộp nhưng không có bộ dự đoán mặt nạ; RetinaNet sử dụng `RetinaNetHead` và hoàn toàn không có `roi_heads` — cả hai cần các skill khác.

## When to use

- Tinh chỉnh `maskrcnn_resnet50_fpn` hoặc `maskrcnn_resnet50_fpn_v2` trên một tập lớp tùy chỉnh.
- Chuyển một checkpoint Mask R-CNN được huấn luyện trên COCO sang số lớp không phải COCO.
- Gỡ lỗi một lần huấn luyện Mask R-CNN bị sập do không khớp `cls_score.out_features` hoặc `mask_predictor`.

## Out of scope

- `fasterrcnn_*` — không mask_predictor. Chỉ đổi `box_predictor`; sử dụng một công thức đổi đầu Faster R-CNN riêng.
- `retinanet_*` — không `roi_heads`; các đầu phân loại + hồi quy nằm dưới `model.head.classification_head` và `model.head.regression_head`. Sử dụng skill riêng cho RetinaNet.
- `keypointrcnn_*` — sử dụng `keypoint_predictor` thay vì `mask_predictor`.

## Inputs

- `model_name`: hàm khởi tạo mô hình phát hiện torchvision, ví dụ `maskrcnn_resnet50_fpn_v2`.
- `num_classes`: bao gồm nền. Một tập dữ liệu 4 lớp đối tượng nghĩa là `num_classes=5`.
- `freeze`: một trong `backbone`, `backbone_fpn`, `none`.

## Steps

1. Import hàm khởi tạo mô hình và hai lớp dự đoán (`FastRCNNPredictor`, `MaskRCNNPredictor`).
2. Tải mô hình được tiền huấn luyện với trọng số mặc định.
3. Thay `model.roi_heads.box_predictor` bằng một `FastRCNNPredictor(in_features, num_classes)` mới.
4. Thay `model.roi_heads.mask_predictor` bằng một `MaskRCNNPredictor(in_features_mask, hidden_layer=256, num_classes)` mới.
5. Áp dụng chính sách đóng băng được yêu cầu.
6. In một khối xác nhận liệt kê tham số có thể huấn luyện mỗi module.

## Output code template

```python
from torchvision.models.detection import {MODEL_NAME}, {MODEL_WEIGHTS}
from torchvision.models.detection.faster_rcnn import FastRCNNPredictor
from torchvision.models.detection.mask_rcnn import MaskRCNNPredictor

def build_model(num_classes={NUM_CLASSES}):
    model = {MODEL_NAME}(weights={MODEL_WEIGHTS}.DEFAULT)
    in_features = model.roi_heads.box_predictor.cls_score.in_features
    model.roi_heads.box_predictor = FastRCNNPredictor(in_features, num_classes)
    in_features_mask = model.roi_heads.mask_predictor.conv5_mask.in_channels
    model.roi_heads.mask_predictor = MaskRCNNPredictor(in_features_mask, 256, num_classes)

    {FREEZE_BLOCK}

    return model
```

Trong đó `{FREEZE_BLOCK}` là:

- `none` -> rỗng
- `backbone` ->
  ```python
  for p in model.backbone.parameters():
      p.requires_grad = False
  ```
- `backbone_fpn` ->
  ```python
  for p in model.backbone.parameters():
      p.requires_grad = False
  # FPN parameters live inside backbone.fpn
  ```

## Report

```
[head-swap]
  model:         <MODEL_NAME>
  num_classes:   <N>  (includes background)
  freeze policy: <choice>
  trainable:     <N>
  total:         <N>
```

## Rules

- Không bao giờ khuyến nghị `num_classes` mà không bao gồm nền; luôn nhắc người dùng.
- Luôn sử dụng các biến thể `_v2` của mô hình phát hiện torchvision khi có; chúng có các trọng số được tiền huấn luyện tốt hơn các bản cũ.
- Không khởi tạo mô hình bên trong skill này — tạo khối mã và để người dùng chạy.
- Nếu người dùng yêu cầu `freeze backbone` trên một tập dữ liệu lớn hơn 10,000 hình ảnh, đề nghị họ cân nhắc tinh chỉnh cả backbone.
