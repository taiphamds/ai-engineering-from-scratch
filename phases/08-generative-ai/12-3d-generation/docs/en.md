# 3D Generation

> 3D là phương thức mà việc tận dụng 2D sang 3D mạnh nhất. Đột phá năm 2023 là 3D Gaussian Splatting. Làn sóng sinh giai đoạn 2024-2026 xếp khuếch tán đa góc nhìn + tái dựng 3D lên trên để tạo ra vật thể và cảnh từ một prompt hoặc ảnh chụp duy nhất.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 4 (Vision), Phase 8 · 07 (Latent Diffusion)
**Time:** ~45 minutes

## The Problem

Nội dung 3D gây đau đầu:

- **Biểu diễn.** Mesh, đám mây điểm, lưới voxel, trường khoảng cách có dấu (SDF), trường bức xạ nơ-ron (NeRF), Gaussian 3D. Mỗi loại có những đánh đổi.
- **Khan hiếm dữ liệu.** ImageNet có 14M ảnh. Tập dữ liệu 3D sạch lớn nhất (Objaverse-XL, 2023) có ~10M vật thể, phần lớn chất lượng thấp.
- **Bộ nhớ.** Một lưới voxel 512³ là 128M voxel; một NeRF cảnh hữu ích cần 1M mẫu/tia. Sinh khó hơn tái dựng.
- **Giám sát.** Với một ảnh 2D bạn có các pixel. Với 3D bạn thường có một vài góc nhìn 2D và phải nâng lên 3D.

Bộ công cụ năm 2026 tách hai bài toán. Đầu tiên, sinh *ảnh 2D đa góc nhìn* bằng một mô hình khuếch tán. Thứ hai, khớp một *biểu diễn 3D* (thường là Gaussian splatting) với các ảnh đó.

## The Concept

![3D generation: multi-view diffusion + 3D reconstruction](../assets/3d-generation.svg)

### Representation: 3D Gaussian Splatting (Kerbl et al., 2023)

Biểu diễn một cảnh như một đám mây gồm ~1M Gaussian 3D. Mỗi Gaussian có 59 tham số: vị trí (3), hiệp phương sai (6, hoặc quaternion 4 + tỷ lệ 3), độ mờ đục (1), màu điều hòa cầu (48 ở bậc 3, 3 ở bậc 0).

Kết xuất = phép chiếu + alpha-compositing. Nhanh (~100 fps ở 1080p trên một 4090). Khả vi. Khớp bằng gradient descent so với ảnh chụp ground-truth. Một cảnh được khớp trong 5-30 phút trên một GPU phổ thông.

Hai đổi mới giai đoạn 2023-2024 ở trên:
- **Gaussian splat sinh.** Các mô hình như LGM, LRM, InstantMesh dự đoán trực tiếp một đám mây Gaussian từ một hoặc một vài ảnh.
- **4D Gaussian Splatting.** Các Gaussian với độ lệch theo khung hình cho các cảnh động.

### Multi-view diffusion

Tinh chỉnh một mô hình khuếch tán ảnh được huấn luyện trước để sinh nhiều góc nhìn nhất quán của cùng vật thể từ một prompt văn bản hoặc một ảnh duy nhất. Zero123 (Liu và cộng sự, 2023), MVDream (Shi và cộng sự, 2023), SV3D (Stability, 2024), CAT3D (Google, 2024). Thường xuất ra 4-16 góc nhìn quanh vật thể, được nâng lên 3D qua Gaussian splatting hoặc NeRF.

### Text-to-3D pipelines

| Mô hình | Đầu vào | Đầu ra | Thời gian |
|-------|-------|--------|------|
| DreamFusion (2022) | văn bản | NeRF qua SDS | ~1 giờ mỗi tài nguyên |
| Magic3D | văn bản | mesh + kết cấu | ~40 phút |
| Shap-E (OpenAI, 2023) | văn bản | 3D ẩn | ~1 phút |
| SJC / ProlificDreamer | văn bản | NeRF / mesh | ~30 phút |
| LRM (Meta, 2023) | ảnh | triplane | ~5 s |
| InstantMesh (2024) | ảnh | mesh | ~10 s |
| SV3D (Stability, 2024) | ảnh | góc nhìn mới | ~2 phút |
| CAT3D (Google, 2024) | 1-64 ảnh | NeRF 3D | ~1 phút |
| TripoSR (2024) | ảnh | mesh | ~1 s |
| Meshy 4 (2025) | văn bản + ảnh | mesh PBR | ~30 s |
| Rodin Gen-1.5 (2025) | văn bản + ảnh | mesh PBR | ~60 s |
| Tencent Hunyuan3D 2.0 (2025) | ảnh | mesh | ~30 s |

Hướng 2025-2026: các mô hình văn bản thành mesh trực tiếp với vật liệu PBR phù hợp cho game engine. Bước trung gian khuếch tán đa góc nhìn vẫn là công thức có hiệu năng tốt nhất cho các vật thể tổng quát.

### NeRF (for context)

Trường bức xạ nơ-ron (Mildenhall và cộng sự, 2020). Một MLP nhỏ nhận `(x, y, z, view direction)` và xuất ra `(color, density)`. Kết xuất bằng tích phân dọc các tia. Đánh bại tổng hợp góc nhìn mới dựa trên mesh về chất lượng nhưng kết xuất chậm hơn 100-1000x. Được Gaussian splatting thay thế cho hầu hết sử dụng thời gian thực nhưng vẫn chi phối nghiên cứu.

```figure
v4-3d-multiview
```

## Build It

`code/main.py` triển khai một phép khớp "Gaussian splatting" 2D đồ chơi: biểu diễn một ảnh mục tiêu tổng hợp (một gradient trơn) thành tổng các Gaussian splat 2D. Tối ưu vị trí, màu và hiệp phương sai bằng gradient descent để khớp mục tiêu. Bạn thấy hai phép toán cốt lõi: kết xuất xuôi (splat + alpha-composite) và khớp bằng gradient descent.

### Step 1: 2D Gaussian splat

```python
def gaussian_at(x, y, gaussian):
    px, py = gaussian["pos"]
    sigma = gaussian["sigma"]
    d2 = (x - px) ** 2 + (y - py) ** 2
    return math.exp(-d2 / (2 * sigma * sigma))
```

### Step 2: render by summing splats

```python
def render(image_size, gaussians):
    img = [[0.0] * image_size for _ in range(image_size)]
    for g in gaussians:
        for y in range(image_size):
            for x in range(image_size):
                img[y][x] += g["color"] * gaussian_at(x, y, g)
    return img
```

Gaussian splatting 3D thực sắp xếp các Gaussian theo độ sâu và alpha-composite theo thứ tự. Mô hình đồ chơi 2D của chúng ta chỉ cộng.

### Step 3: fit by gradient descent

```python
for step in range(steps):
    pred = render(size, gaussians)
    loss = mse(pred, target)
    gradients = compute_grads(pred, target, gaussians)
    update(gaussians, gradients, lr)
```

## Pitfalls

- **Bất nhất góc nhìn.** Nếu bạn sinh 4 góc nhìn độc lập và chúng không thống nhất về cấu trúc vật thể, phép khớp 3D bị mờ. Cách khắc phục: khuếch tán đa góc nhìn với attention chung.
- **Ảo giác mặt sau.** Một ảnh → 3D phải bịa ra mặt không nhìn thấy. Chất lượng biến thiên rất lớn.
- **Bùng nổ Gaussian splat.** Huấn luyện không ràng buộc tăng đến 10M splat và overfit. Các heuristic tăng mật độ + cắt tỉa (từ bài báo 3D-GS gốc) là thiết yếu.
- **Vấn đề topology.** Mesh từ các trường ẩn (SDF) thường có lỗ hoặc tự giao nhau. Chạy một bộ tạo lại mesh (ví dụ voxel remesh của blender) trước khi phát hành.
- **Giấy phép dữ liệu huấn luyện.** Objaverse có các giấy phép hỗn hợp; sử dụng thương mại khác nhau theo mô hình.

## Use It

| Tác vụ | Lựa chọn năm 2026 |
|------|-----------|
| Tái dựng cảnh từ ảnh chụp | Gaussian splatting (3DGS, Gsplat, Scaniverse) |
| Vật thể văn bản thành 3D cho trò chơi | Meshy 4 hoặc Rodin Gen-1.5 (đầu ra PBR) |
| Ảnh thành 3D | Hunyuan3D 2.0, TripoSR, InstantMesh |
| Tổng hợp góc nhìn mới từ vài ảnh | CAT3D, SV3D |
| Tái dựng cảnh động | 4D Gaussian Splatting |
| Avatar / người mặc quần áo | Gaussian Avatar, HUGS |
| Nghiên cứu / SOTA | Bất cứ thứ gì xuất hiện tuần trước |

Để triển khai 3D production trong một pipeline trò chơi hoặc thương mại điện tử: Meshy 4 hoặc Rodin Gen-1.5 xuất ra các mesh PBR đi thẳng vào Unity / Unreal.

## Ship It

Lưu `outputs/skill-3d-pipeline.md`. Skill nhận một bản yêu cầu 3D (đầu vào: văn bản / một ảnh / vài ảnh; đầu ra: mesh / splat / NeRF; sử dụng: kết xuất / trò chơi / VR) và xuất ra: pipeline (khuếch tán đa góc nhìn + khớp, hoặc mô hình mesh trực tiếp), mô hình cơ sở, ngân sách lặp, hậu xử lý topology, các kênh vật liệu cần thiết.

## Exercises

1. **Dễ.** Chạy `code/main.py` với 4, 16, 64 Gaussian. Báo cáo MSE cuối cùng so với mục tiêu.
2. **Trung bình.** Mở rộng sang Gaussian màu (RGB). Xác nhận tái dựng khớp mẫu màu mục tiêu.
3. **Khó.** Dùng gsplat hoặc Nerfstudio, tái dựng một vật thể thật từ một bộ chụp 50 ảnh. Báo cáo thời gian khớp và SSIM cuối cùng trên các góc nhìn giữ lại.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| 3D Gaussian Splatting | "3DGS" | Cảnh như một đám mây Gaussian 3D; kết xuất alpha-composite khả vi. |
| NeRF | "Trường bức xạ nơ-ron" | MLP xuất ra màu + mật độ tại một điểm 3D; kết xuất bằng tích phân tia. |
| Triplane (Ba mặt phẳng) | "Ba mặt phẳng 2-D" | Phân tách 3D thành ba lưới đặc trưng 2-D thẳng hàng với trục; rẻ hơn thể tích. |
| SDS | "Lấy mẫu chưng cất score" | Huấn luyện mô hình 3D bằng cách dùng score khuếch tán 2D làm giả gradient. |
| Multi-view diffusion (Khuếch tán đa góc nhìn) | "Nhiều góc nhìn cùng lúc" | Mô hình khuếch tán xuất ra một batch các góc nhìn camera nhất quán. |
| PBR | "Kết xuất dựa trên vật lý" | Vật liệu có các kênh albedo, độ nhám, độ kim loại, pháp tuyến. |
| Densification (Tăng mật độ) | "Phát triển splat" | Heuristic huấn luyện 3DGS: tách / sao chép splat ở các vùng gradient cao. |

## Production note: 3D has no shared substrate yet

Khác với ảnh (khuếch tán tiềm ẩn + DiT) và video (DiT không gian-thời gian), 3D không có một runtime chi phối duy nhất vào năm 2026. Cây quyết định production phân nhánh theo biểu diễn:

- **NeRF / triplane.** Suy luận là ray-marching + một lượt truyền xuôi MLP mỗi mẫu. Một lần kết xuất 512² cần hàng triệu lượt truyền xuôi MLP. Gom batch các mẫu tia mạnh tay; SDPA/xformers áp dụng được.
- **Khuếch tán đa góc nhìn + tái dựng LRM.** Pipeline hai giai đoạn. Giai đoạn 1 (DiT đa góc nhìn) là một máy chủ khuếch tán giống Bài 07. Giai đoạn 2 (transformer LRM) là một lượt truyền xuôi một lần trên các góc nhìn. Hồ sơ độ trễ tổng thể là "khuếch tán + một lần" — chọn các thành phần phục vụ cho từng giai đoạn tương ứng.
- **SDS / DreamFusion.** Tối ưu theo tài nguyên, không phải suy luận. Xây dựng các job, không phải bộ xử lý yêu cầu.

Với hầu hết sản phẩm năm 2026, câu trả lời đúng là "chạy một mô hình khuếch tán đa góc nhìn theo yêu cầu, tái dựng thành 3DGS bất đồng bộ, phục vụ 3DGS để xem thời gian thực". Điều này chia khối lượng công việc rõ ràng giữa một máy chủ suy luận GPU (nhanh) và một bộ tối ưu ngoại tuyến (chậm).

## Further Reading

- [Mildenhall et al. (2020). NeRF: Representing Scenes as Neural Radiance Fields](https://arxiv.org/abs/2003.08934) — NeRF.
- [Kerbl et al. (2023). 3D Gaussian Splatting for Real-Time Radiance Field Rendering](https://arxiv.org/abs/2308.04079) — 3DGS.
- [Poole et al. (2022). DreamFusion: Text-to-3D using 2D Diffusion](https://arxiv.org/abs/2209.14988) — SDS.
- [Liu et al. (2023). Zero-1-to-3: Zero-shot One Image to 3D Object](https://arxiv.org/abs/2303.11328) — Zero123.
- [Shi et al. (2023). MVDream](https://arxiv.org/abs/2308.16512) — khuếch tán đa góc nhìn.
- [Hong et al. (2023). LRM: Large Reconstruction Model for Single Image to 3D](https://arxiv.org/abs/2311.04400) — LRM.
- [Gao et al. (2024). CAT3D: Create Anything in 3D with Multi-View Diffusion Models](https://arxiv.org/abs/2405.10314) — CAT3D.
- [Stability AI (2024). Stable Video 3D (SV3D)](https://stability.ai/research/sv3d-novel-multi-view-synthesis-and-3d-generation-from-a-single-image-using-latent-video-diffusion) — SV3D.
