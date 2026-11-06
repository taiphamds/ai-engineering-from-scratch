---
name: skill-depth-to-pointcloud
description: Build point clouds from depth maps with correct intrinsics handling and export to .ply
version: 1.0.0
phase: 4
lesson: 26
tags: [depth, point-cloud, 3d, intrinsics]
---

# Depth to Point Cloud

Biến bản đồ độ sâu cộng hình ảnh màu thành đám mây điểm có kết cấu, xuất được để trực quan hóa hoặc làm việc 3D tiếp.

## When to use

- Trực quan hóa các dự đoán độ sâu thành cảnh 3D thật.
- Khởi tạo tái tạo 3D thưa từ một hình ảnh.
- Tạo đầu vào huấn luyện 3DGS khi SfM thất bại.
- So sánh độ sâu dự đoán với sự thật nền LiDAR.

## Inputs

- `depth`: mảng numpy `(H, W)` các độ sâu theo cùng đơn vị bạn muốn ở đầu ra (khuyến nghị mét).
- `rgb`: mảng numpy `(H, W, 3)` các màu (uint8 hoặc float32 [0, 1]).
- `intrinsics`: `(fx, fy, cx, cy)` theo đơn vị pixel.
- `depth_scale` tùy chọn: hệ số nhân chuyển đơn vị độ sâu dự đoán sang mét.

## Pipeline

1. **Xác thực** — độ sâu phải dương và hữu hạn ở mọi nơi bạn định bao gồm. Che các pixel không hợp lệ.
2. **Nâng** — `X = (u - cx) * d / fx`, `Y = (v - cy) * d / fy`, `Z = d` mỗi pixel.
3. **Ghép** với RGB — mỗi điểm 3D có bộ ba `(r, g, b)` từ pixel tương ứng.
4. **Xuất** — PLY (di động), `.xyz` (nhẹ), `.pcd` (gốc Open3D), `.las`/`.laz` (địa không gian).

## Implementation template

```python
import numpy as np

def depth_to_point_cloud(depth, intrinsics, depth_scale=1.0, min_depth=0.1, max_depth=100.0):
    H, W = depth.shape
    fx, fy, cx, cy = intrinsics
    v, u = np.meshgrid(np.arange(H), np.arange(W), indexing="ij")
    z = depth.astype(np.float32) * depth_scale
    valid = (z > min_depth) & (z < max_depth) & np.isfinite(z)
    x = (u - cx) * z / fx
    y = (v - cy) * z / fy
    points = np.stack([x, y, z], axis=-1)
    return points, valid


def write_ply(path, points, colors=None, valid_mask=None):
    p = points.reshape(-1, 3)
    if valid_mask is not None:
        p = p[valid_mask.flatten()]
    lines = [
        "ply",
        "format ascii 1.0",
        f"element vertex {p.shape[0]}",
        "property float x", "property float y", "property float z",
    ]
    if colors is not None:
        c = colors.reshape(-1, 3).astype(np.uint8)
        if valid_mask is not None:
            c = c[valid_mask.flatten()]
        lines += ["property uchar red", "property uchar green", "property uchar blue"]
    lines.append("end_header")
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")
        if colors is not None:
            for pt, col in zip(p, c):
                f.write(f"{pt[0]:.4f} {pt[1]:.4f} {pt[2]:.4f} {col[0]} {col[1]} {col[2]}\n")
        else:
            for pt in p:
                f.write(f"{pt[0]:.4f} {pt[1]:.4f} {pt[2]:.4f}\n")
```

## Report

```
[export]
  input depth shape:  (H, W)
  valid points:       <N> of <H*W>
  output format:      ply | xyz | pcd | las
  coordinate system:  camera (+X right, +Y down, +Z forward)
  scale:              metres | millimetres | normalised
```

## Rules

- Luôn che độ sâu không hợp lệ (không, NaN, inf, bão hòa); bao gồm chúng tạo đám mây điểm rác ở gốc.
- Với dự đoán từ mô hình độ sâu tương đối, KHÔNG xuất như theo đơn vị đo; thêm tiền tố `relative_` vào tên file đầu ra để báo quy ước.
- Giữ quy ước tọa độ máy ảnh nhất quán (OpenCV: +X phải, +Y xuống, +Z trước). Đổi dấu nếu công cụ phía sau kỳ vọng OpenGL (+Y lên).
- Với cảnh dày đặc (> 1M điểm), cung cấp tham số lấy mẫu con; file PLY > 500 MB khó tải ở mọi nơi.
- Không bao giờ âm thầm cắt độ sâu để tạo đầu ra "hợp lý"; cắt rõ ràng với các ngưỡng được cảnh báo để người dùng biết thứ gì bị bỏ.
