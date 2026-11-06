---
name: skill-point-cloud-loader
description: Write a PyTorch Dataset for .ply / .pcd / .xyz files with correct normalisation, centring, and point sampling
version: 1.0.0
phase: 4
lesson: 13
tags: [3d-vision, point-cloud, data-loading, pytorch]
---

# Point Cloud Loader

Biến một thư mục file quét 3D thành một `Dataset` PyTorch sẵn sàng huấn luyện.

## When to use

- Bắt đầu một dự án phân loại / phân đoạn đám mây điểm mới.
- Chuyển giữa các định dạng `.ply`, `.pcd` và `.xyz`.
- Gỡ lỗi một mô hình huấn luyện không lỗi nhưng hội tụ kém; thường chuẩn hóa bộ tải dữ liệu sai.

## Inputs

- `data_root`: thư mục các file đám mây điểm và CSV nhãn tùy chọn.
- `file_format`: ply | pcd | xyz | npy.
- `num_points`: kích thước lấy mẫu cố định, thường 1024 hoặc 2048.
- `augmentation`: none | rotate | jitter | mixup.

## Normalisation policy

Mọi pipeline đám mây điểm production áp dụng theo thứ tự:

1. **Đặt tâm** đám mây: trừ trọng tâm.
2. **Co giãn** về hình cầu đơn vị: chia cho khoảng cách lớn nhất từ tâm.
3. **Lấy mẫu** `num_points` điểm. Nếu đám mây có nhiều hơn, sử dụng **lấy mẫu điểm xa nhất** (FPS) để biểu diễn hình dạng trung thành hoặc lấy mẫu ngẫu nhiên để nhanh. Nếu ít hơn, lặp các điểm.
4. **Xáo trộn** thứ tự điểm (thứ tự dù sao cũng không nên quan trọng với mô hình, nhưng xáo trộn phá vỡ các phụ thuộc thứ tự vô tình).

## Output template

```python
import numpy as np
import torch
from torch.utils.data import Dataset

try:
    import open3d as o3d
    HAS_O3D = True
except ImportError:
    HAS_O3D = False

def _read_ply(path):
    if HAS_O3D:
        pc = o3d.io.read_point_cloud(path)
        return np.asarray(pc.points, dtype=np.float32)
    # Fallback: minimal ascii-ply reader
    ...

def _fps(points, k):
    idx = np.zeros(k, dtype=np.int64)
    dist = np.full(len(points), np.inf)
    seed = np.random.randint(len(points))
    idx[0] = seed
    for i in range(1, k):
        dist = np.minimum(dist, ((points - points[idx[i-1]]) ** 2).sum(axis=1))
        idx[i] = int(np.argmax(dist))
    return idx

def normalise(points):
    centre = points.mean(axis=0)
    points = points - centre
    scale = np.max(np.linalg.norm(points, axis=1))
    return points / max(scale, 1e-8)

class PointCloudDataset(Dataset):
    def __init__(self, files, labels, num_points=1024, augment=False):
        self.files = files
        self.labels = labels
        self.num_points = num_points
        self.augment = augment

    def __len__(self):
        return len(self.files)

    def __getitem__(self, i):
        pts = _read_ply(self.files[i])
        pts = normalise(pts)
        if len(pts) >= self.num_points:
            idx = _fps(pts, self.num_points)
            pts = pts[idx]
        else:
            reps = int(np.ceil(self.num_points / len(pts)))
            pts = np.tile(pts, (reps, 1))[:self.num_points]
        # Shuffle point order to break any accidental dependencies (especially
        # important when tiling repeats points in deterministic order).
        np.random.shuffle(pts)
        if self.augment:
            theta = np.random.uniform(0, 2 * np.pi)
            R = np.array([[np.cos(theta), 0, np.sin(theta)],
                          [0, 1, 0],
                          [-np.sin(theta), 0, np.cos(theta)]], dtype=np.float32)
            pts = pts @ R
            pts = pts + np.random.normal(0, 0.02, pts.shape).astype(np.float32)
        pts = np.ascontiguousarray(pts, dtype=np.float32)
        return torch.from_numpy(pts).transpose(0, 1), int(self.labels[i])
```

## Report

```
[dataset]
  files:          <N>
  format:         <ply|pcd|xyz|npy>
  points_per_sample: <int>
  normalise:      centre + unit sphere
  sampling:       FPS | random
  augmentation:   <list>
```

## Rules

- Luôn đặt tâm trước co giãn; đổi thứ tự làm thay đổi ý nghĩa "hình cầu đơn vị".
- Ưu tiên FPS hơn lấy mẫu ngẫu nhiên cho các tác vụ hình dạng; ngẫu nhiên ổn cho phân đoạn nơi mọi điểm đều quan trọng.
- Không bao giờ tăng cường trong đánh giá; chỉ trong huấn luyện.
- Nếu các file đám mây điểm bao gồm màu hoặc pháp tuyến làm các kênh bổ sung, mở rộng Dataset để trả về tensor `(3 + C, num_points)`, không chỉ xyz.
