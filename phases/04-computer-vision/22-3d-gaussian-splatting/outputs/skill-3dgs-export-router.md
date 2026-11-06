---
name: skill-3dgs-export-router
description: Pick the right 3DGS export format (.ply / .splat / glTF KHR_gaussian_splatting / USD) given the downstream viewer or engine
version: 1.0.0
phase: 4
lesson: 22
tags: [3d-gaussian-splatting, export, glTF, OpenUSD, pipeline]
---

# 3DGS Export Router

Ánh xạ đích phía sau tới định dạng file 3DGS đúng. Tiết kiệm hàng giờ gỡ lỗi "nó không tải".

## When to use

- Sau huấn luyện cảnh 3DGS, trước khi chia sẻ với pipeline nội dung.
- Chọn giữa định dạng cấp nghiên cứu (.ply) và cấp production (glTF / USD).
- Bàn giao pipeline: nhóm thu nhận -> kỹ sư 3DGS -> nhà thiết kế trò chơi / nghệ sĩ VFX / nhà phát triển web.

## Inputs

- `target_engine`: unreal | unity | omniverse | blender | vision_pro | three_js | babylon_js | cesium | playcanvas | supersplat
- `priority`: portability | file_size | quality_preservation
- `include_sh_degree`: 0 | 1 | 2 | 3

## Format decision

| Đích | Định dạng khuyến nghị | Tại sao |
|--------|--------------------|-----|
| Unreal Engine (sản xuất ảo) | Plugin Volinga hoặc glTF KHR_gaussian_splatting | Đường SDK Unreal gốc |
| Unity (XR / trò chơi) | .ply qua plugin Aras-P Unity-GaussianSplatting | Pipeline Unity tiêu chuẩn cộng đồng |
| NVIDIA Omniverse, công cụ Pixar | OpenUSD 26.03 (UsdVolParticleField3DGaussianSplat) | Loại prim USD gốc |
| Apple Vision Pro | OpenUSD 26.03 | Gốc visionOS 2.x |
| Blender | .ply + add-on KIRI Engine | Add-on cộng đồng đọc splat thô |
| Trình xem web Three.js | glTF KHR_gaussian_splatting hoặc .splat | Tiêu chuẩn trình duyệt, hoạt động với `GaussianSplats3D` |
| Babylon.js V9+ | glTF KHR_gaussian_splatting | V9 thêm hỗ trợ gốc |
| Cesium (CesiumJS 1.139+, Cesium for Unreal 2.23+) | glTF KHR_gaussian_splatting | Đã phát hành hỗ trợ tường minh |
| PlayCanvas | .splat | Định dạng lượng tử hóa gốc PlayCanvas |
| SuperSplat (trình biên tập) | .ply hoặc .splat | Nhập + xuất |

## Quantisation trade-offs

- `.ply` độ chính xác đầy đủ: file lớn nhất, không mất mát, mọi trình xem.
- `.splat`: nhỏ hơn 4-8 lần, mất chất lượng nhẹ trên hệ số SH3, tiêu chuẩn hệ sinh thái PlayCanvas.
- glTF KHR: cấu hình được qua EXT_meshopt_compression; nhỏ nhất với tương thích cao nhất.
- USD: nén bằng đóng gói USDZ; nhỏ nhất cho pipeline Apple.

## Output report

```
[export plan]
  target:         <engine>
  format:         <name>
  sh degree:      <0|1|2|3>
  compression:    <none|meshopt|quantisation|usdz>
  expected size:  <MB>
  compatible with: <list of viewers>

[pipeline]
  1. source: <.ply from training>
  2. optional: SuperSplat cleanup pass
  3. convert: <tool + CLI or API call>
  4. package: <.gltf / .glb / .usd / .usdz / .splat / .ply>
  5. validate: <viewer sanity check>
```

## Rules

- Không bao giờ âm thầm bỏ các hệ số SH3 — nó thay đổi rõ các phản xạ gương.
- Nếu `priority == file_size`, khuyến nghị `.splat` hoặc glTF với meshopt; cảnh báo mất chất lượng.
- Với nền tảng Apple, ưu tiên USD / USDZ hơn glTF năm 2026; USDZ có hỗ trợ visionOS hạng nhất.
- Nếu hỗ trợ 3DGS của trình xem đích có trước tiêu chuẩn (trước tháng 2 năm 2026), khuyến nghị `.ply` và bộ tải tùy chỉnh của trình xem; glTF tiêu chuẩn Khronos sẽ chưa được nhận dạng.
- Luôn xác thực file xuất trong ít nhất một trình xem trước bàn giao; hỏng âm thầm xảy ra khi lượng tử hóa.
