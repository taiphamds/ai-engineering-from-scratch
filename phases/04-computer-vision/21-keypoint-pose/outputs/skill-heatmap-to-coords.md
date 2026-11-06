---
name: skill-heatmap-to-coords
description: Write the sub-pixel heatmap-to-coordinate routine used by every production pose model
version: 1.0.0
phase: 4
lesson: 21
tags: [keypoint, pose, subpixel, inference]
---

# Heatmap to Coords

Biến các bản đồ nhiệt điểm đặc trưng thô thành tọa độ chính xác dưới pixel. Nâng cấp accuracy rẻ nhất trong mọi pipeline tư thế.

## When to use

- Triển khai một mô hình điểm đặc trưng dựa trên bản đồ nhiệt.
- Đo các thước đo tư thế — OKS cực kỳ nhạy với độ chính xác dưới pixel.
- Chuyển mã tư thế từ framework này sang framework khác.

## Inputs

- `heatmaps`: tensor `(N, K, H, W)`, các bản đồ nhiệt từng điểm từ mô hình.
- `confidence_threshold`: loại các điểm có đỉnh dưới giá trị này.

## Steps

1. **Argmax** mỗi bản đồ nhiệt để tìm vị trí đỉnh nguyên.
2. **Độ lệch sai phân bậc nhất** — ước lượng độ lệch dưới pixel từ các pixel lân cận. Hệ số `0.25` là quy tắc kinh nghiệm hiệu chuẩn cho bản đồ nhiệt Gaussian có `sigma >= 1`; để khôi phục dưới pixel có cơ sở, dùng khớp bậc hai đầy đủ (DARK) hoặc khớp Gaussian.

```
dx = 0.25 * sign(heatmap[y, x+1] - heatmap[y, x-1])
dy = 0.25 * sign(heatmap[y+1, x] - heatmap[y-1, x])
```

Với biến thể DARK / bậc hai, xấp xỉ bằng một hàm bậc hai cục bộ:

```
dx = -0.5 * (heatmap[y, x+1] - heatmap[y, x-1])
        / (heatmap[y, x+1] - 2 * heatmap[y, x] + heatmap[y, x-1] + eps)
```

Khớp bậc hai chính xác hơn trên bản đồ nhiệt có đỉnh rõ; độ lệch dựa trên dấu là mặc định an toàn hơn khi bản đồ nhiệt nhiễu.

3. **Cộng độ lệch** vào đỉnh nguyên.
4. **Độ tin cậy** — trả giá trị đỉnh mỗi điểm; các máy khách dùng để che các dự đoán tin cậy thấp.
5. **Trường hợp biên** — khi đỉnh ở pixel đầu hoặc cuối dọc một trục, một láng giềng được chặn; độ lệch sụp về không, là dự phòng an toàn nhất.

## Output template

```python
import torch

def heatmap_to_coords_subpixel(heatmaps, threshold=0.2):
    N, K, H, W = heatmaps.shape
    flat = heatmaps.reshape(N, K, -1)
    conf, idx = flat.max(dim=-1)
    ys = (idx // W).float()
    xs = (idx % W).float()

    ys_int = ys.long()
    xs_int = xs.long()

    x_minus = (xs_int - 1).clamp(min=0)
    x_plus = (xs_int + 1).clamp(max=W - 1)
    y_minus = (ys_int - 1).clamp(min=0)
    y_plus = (ys_int + 1).clamp(max=H - 1)

    batch_idx = torch.arange(N).view(-1, 1).expand(-1, K)
    kp_idx = torch.arange(K).view(1, -1).expand(N, -1)

    dx_raw = (heatmaps[batch_idx, kp_idx, ys_int, x_plus]
              - heatmaps[batch_idx, kp_idx, ys_int, x_minus])
    dy_raw = (heatmaps[batch_idx, kp_idx, y_plus, xs_int]
              - heatmaps[batch_idx, kp_idx, y_minus, xs_int])
    dx = 0.25 * torch.sign(dx_raw)
    dy = 0.25 * torch.sign(dy_raw)

    at_left = xs_int == 0
    at_right = xs_int == (W - 1)
    at_top = ys_int == 0
    at_bottom = ys_int == (H - 1)
    dx = torch.where(at_left | at_right, torch.zeros_like(dx), dx)
    dy = torch.where(at_top | at_bottom, torch.zeros_like(dy), dy)

    refined_x = xs + dx
    refined_y = ys + dy
    coords = torch.stack([refined_x, refined_y], dim=-1)
    mask = conf >= threshold
    return coords, conf, mask
```

## Report

```
[subpixel decode]
  keypoints:   K
  threshold:   <float>
  valid_rate:  fraction of keypoints above threshold
```

## Rules

- Luôn chặn chỉ số láng giềng về phạm vi hợp lệ; các điểm ngoài cạnh có độ lệch sai phân bằng không nhưng không sập.
- Trả độ tin cậy cùng tọa độ để máy khách có thể che các điểm tin cậy thấp.
- Tinh chỉnh dưới pixel chỉ giúp khi bản đồ nhiệt trơn quanh đỉnh — kiểm tra huấn luyện dùng mục tiêu Gaussian có sigma >= 1.
- Với độ phân giải bản đồ nhiệt rất nhỏ (< 48x48), cân nhắc tăng mẫu lên kích thước ảnh đầy đủ trước khi trích tọa độ; độ lệch dưới pixel co giãn theo stride.
