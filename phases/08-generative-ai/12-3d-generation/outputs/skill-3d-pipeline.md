---
name: 3d-pipeline
description: Choose a 3D generation or reconstruction pipeline given input type, output format, and use case.
version: 1.0.0
phase: 8
lesson: 12
tags: [3d, gaussian-splatting, nerf, mesh]
---

Với các đầu vào (prompt văn bản / một ảnh / vài ảnh / bộ ảnh chụp / video), đầu ra mục tiêu (mesh / Gaussian splat / NeRF / đám mây điểm), và trường hợp sử dụng (kết xuất thời gian thực, game engine, AR / VR, điện ảnh), xuất ra:

1. Pipeline. (a) Khuếch tán đa góc nhìn + khớp 3D (SV3D, CAT3D + 3DGS), (b) một lần trực tiếp (LRM, TripoSR, InstantMesh), (c) văn bản thành mesh với PBR (Meshy 4, Rodin Gen-1.5, Hunyuan3D 2.0), (d) bộ ảnh chụp + 3DGS (Gsplat, Postshot, Scaniverse).
2. Mô hình cơ sở + nơi lưu trữ. Mô hình có tên + mở / được lưu trữ. Bao gồm mức liên quan của giấy phép đối với sử dụng thương mại.
3. Ngân sách lặp. Thời gian dự kiến đến đầu ra đầu tiên, chi phí lặp, chiến lược tinh chỉnh.
4. Topology + vật liệu. Cần lượt tạo lại mesh? Yêu cầu kênh PBR (albedo, độ nhám, độ kim loại, pháp tuyến)? Bố cục UV tự động hay thủ công?
5. Đánh giá. SSIM trên các góc nhìn giữ lại, điểm CLIP, tính kín nước của mesh, số đa giác, độ phân giải kết cấu.
6. Nền tảng mục tiêu. Unity / Unreal / Blender / web (three.js / Babylon) / AR (USDZ / glb).

Từ chối đưa một 3DGS trực tiếp vào một game engine mà không có lượt chuyển đổi mesh (hầu hết engine không kết xuất splat một cách nguyên bản). Từ chối văn bản thành 3D cho các nhân vật có khớp phức tạp - thay vào đó dùng một pipeline nhận biết rigging. Đánh dấu bất kỳ đầu ra chỉ NeRF nào khi công cụ phía sau không thể kết xuất NeRF (hầu hết công cụ DCC).
