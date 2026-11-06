# Inpainting, Outpainting & Image Editing

> Văn bản thành ảnh tạo ra những thứ mới. Inpainting sửa những thứ cũ. Trong production, 70% công việc ảnh có thể tính phí là chỉnh sửa — đổi nền, xóa logo, mở rộng khung vẽ, sinh lại một bàn tay. Inpainting là nơi khuếch tán chứng tỏ giá trị.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 8 · 08 (ControlNet & LoRA)
**Time:** ~75 minutes

## The Problem

Một khách hàng gửi một ảnh sản phẩm hoàn hảo với một biển hiệu gây mất tập trung ở nền. Bạn muốn xóa biển hiệu và giữ mọi thứ khác giống hệt từng pixel. Bạn không thể chạy văn bản thành ảnh từ đầu — kết quả sẽ có màu khác, ánh sáng khác, góc sản phẩm khác. Bạn muốn sinh lại *chỉ* vùng được che, và bạn muốn việc sinh lại tôn trọng ngữ cảnh xung quanh.

Đó là inpainting. Các biến thể:

- **Inpainting.** Sinh lại bên trong một mặt nạ, giữ các pixel bên ngoài.
- **Outpainting.** Sinh lại bên ngoài một mặt nạ (hoặc vượt ra ngoài khung vẽ), giữ bên trong.
- **Chỉnh sửa ảnh.** Sinh lại toàn bộ ảnh nhưng giữ độ trung thành ngữ nghĩa hoặc cấu trúc với bản gốc (SDEdit, InstructPix2Pix).

Mọi pipeline khuếch tán năm 2026 đều cung cấp một chế độ inpainting. Flux.1-Fill, Stable Diffusion Inpaint, SDXL-Inpaint, DALL-E 3 Edit. Chúng hoạt động theo cùng nguyên tắc.

## The Concept

![Inpainting: mask-aware denoising with context-preserving reinjection](../assets/inpainting.svg)

### The naive approach (and why it's wrong)

Chạy văn bản thành ảnh tiêu chuẩn với một mặt nạ. Ở mỗi bước lấy mẫu, thay vùng không được che của latent có nhiễu bằng ảnh sạch được khuếch tán xuôi. Nó hoạt động... tệ. Các lỗi giả ở biên lọt qua vì mô hình không có thông tin về những gì ở trong vùng được che.

### The proper inpainting model

Huấn luyện một U-Net sửa đổi nhận 9 kênh đầu vào thay vì 4:

```
input = concat([ noisy_latent (4ch), encoded_image (4ch), mask (1ch) ], dim=channel)
```

Các kênh bổ sung là một bản sao của ảnh nguồn được mã hóa bằng VAE cộng với một mặt nạ một kênh. Khi huấn luyện, bạn che ngẫu nhiên các vùng của ảnh và huấn luyện mô hình chỉ khử nhiễu vùng được che trong khi vùng không được che được cho làm tín hiệu điều kiện hóa sạch. Khi suy luận, mô hình có thể "thấy" những gì bao quanh vùng được che và tạo ra các phần điền hoàn chỉnh nhất quán.

SD-Inpaint, SDXL-Inpaint, Flux-Fill đều dùng đầu vào 9 kênh (hoặc tương tự) này. Diffusers `StableDiffusionInpaintPipeline`, `FluxFillPipeline`.

### SDEdit (Meng et al., 2022) — free editing

Thêm nhiễu vào ảnh nguồn đến một `t` trung gian nào đó, rồi chạy chuỗi ngược từ `t` xuống 0 với một prompt mới. Không huấn luyện lại. Lựa chọn `t` bắt đầu đánh đổi độ trung thực lấy tự do sáng tạo:

- `t/T = 0.3` → gần giống hệt nguồn, thay đổi nhỏ về phong cách
- `t/T = 0.6` → chỉnh sửa vừa phải, giữ cấu trúc thô
- `t/T = 0.9` → sinh từ gần nhiễu, giữ nguồn tối thiểu

### InstructPix2Pix (Brooks et al., 2023)

Tinh chỉnh một mô hình khuếch tán trên các bộ ba `(input_image, instruction, output_image)`. Khi suy luận, điều kiện hóa theo cả ảnh đầu vào và một chỉ dẫn văn bản ("biến thành hoàng hôn", "thêm một con rồng"). Hai mức CFG: mức ảnh và mức văn bản.

### RePaint (Lugmayr et al., 2022)

Giữ một mô hình khuếch tán vô điều kiện tiêu chuẩn. Ở mỗi bước ngược, lấy mẫu lại — thỉnh thoảng nhảy trở lại một trạng thái nhiều nhiễu hơn và sinh lại. Tránh các lỗi giả ở biên. Dùng khi bạn không có một mô hình inpainting đã huấn luyện.

```figure
inpaint-mask-reinject
```

## Build It

`code/main.py` triển khai một cách inpainting 1-D đồ chơi trên dữ liệu 5 chiều. Chúng ta huấn luyện một DDPM trên dữ liệu hỗn hợp 5-D trong đó mỗi mẫu là 5 số float từ một trong hai cụm. Khi suy luận, chúng ta "che" 2 trong 5 chiều, đưa phiên bản xuôi có nhiễu của ba chiều không được che vào ở mỗi bước, và chỉ sinh lại các chiều được che.

### Step 1: 5-D DDPM data

```python
def sample_data(rng):
    cluster = rng.choice([0, 1])
    center = [-1.0] * 5 if cluster == 0 else [1.0] * 5
    return [c + rng.gauss(0, 0.2) for c in center], cluster
```

### Step 2: train denoiser over all 5 dims

DDPM tiêu chuẩn. Mạng xuất ra dự đoán nhiễu 5-D cho đầu vào có nhiễu 5-D.

### Step 3: at inference, mask-aware reverse

```python
def inpaint_step(x_t, mask, clean_image, alpha_bars, t, rng):
    # replace unmasked dims with a freshly noised version of the clean source
    a_bar = alpha_bars[t]
    for i in range(len(x_t)):
        if not mask[i]:
            x_t[i] = math.sqrt(a_bar) * clean_image[i] + math.sqrt(1 - a_bar) * rng.gauss(0, 1)
    # ...then run the normal reverse step on x_t
```

Đây là cách tiếp cận đơn giản và nó hoạt động trên dữ liệu 1-D đồ chơi. Inpainting ảnh thực dùng đầu vào 9 kênh vì tính nhất quán kết cấu quan trọng hơn.

### Step 4: outpainting

Outpainting là inpainting với mặt nạ đảo ngược: che phần khung vẽ mới (trước đó chưa tồn tại), điền phần còn lại bằng bản gốc. Mục tiêu huấn luyện giống hệt.

## Pitfalls

- **Đường nối.** Cách tiếp cận đơn giản để lại các ranh giới nhìn thấy vì thông tin gradient không truyền qua mặt nạ. Cách khắc phục: giãn mặt nạ thêm 8-16 pixel, hoặc dùng một mô hình inpainting đúng nghĩa.
- **Rò rỉ mặt nạ.** Nếu vùng không được che của ảnh điều kiện hóa có chất lượng thấp hoặc nhiều nhiễu, nó làm ô nhiễm phần sinh bên trong mặt nạ. Khử nhiễu hoặc làm mờ nhẹ.
- **CFG tương tác với kích thước mặt nạ.** CFG cao trên một mặt nạ nhỏ = patch bão hòa. Giảm CFG cho các chỉnh sửa nhỏ.
- **Vách độ trung thực SDEdit.** Đi từ `t/T = 0.5` đến `t/T = 0.6` có thể làm mất danh tính chủ thể. Quét và lưu checkpoint.
- **Prompt không khớp.** Prompt nên mô tả *toàn bộ* ảnh, không chỉ nội dung mới. "Một con mèo ngồi trên một chiếc ghế" chứ không phải "một con mèo".

## Use It

| Tác vụ | Pipeline |
|------|----------|
| Xóa vật thể, mặt nạ nhỏ | SD-Inpaint hoặc Flux-Fill, prompt tiêu chuẩn |
| Thay bầu trời | SD-Inpaint + "bầu trời xanh lúc hoàng hôn" |
| Mở rộng khung vẽ | Chế độ outpaint SDXL (làm mềm biên 8px) hoặc Flux-Fill với mặt nạ outpaint |
| Sinh lại bàn tay / khuôn mặt | SD-Inpaint với prompt mô tả lại chủ thể + ControlNet-Openpose |
| Thay phong cách một vùng | SDEdit ở `t/T=0.5` trên vùng được che |
| "Biến thành hoàng hôn" | InstructPix2Pix hoặc Flux-Kontext |
| Thay nền | Mặt nạ SAM → SD-Inpaint |
| Độ trung thực cực cao | Flux-Fill hoặc GPT-Image (được lưu trữ) cho các trường hợp khó nhất |

SAM (Segment Anything của Meta, 2023) + inpaint khuếch tán là pipeline xóa nền năm 2026. SAM 2 (2024) hoạt động trên video.

## Ship It

Lưu `outputs/skill-editing-pipeline.md`. Skill nhận một ảnh gốc + mô tả chỉnh sửa + mặt nạ tùy chọn (hoặc prompt SAM) và xuất ra: cách tạo mặt nạ, mô hình cơ sở, các mức CFG (ảnh + văn bản), SDEdit-t hoặc chế độ inpainting, và danh sách kiểm tra QA.

## Exercises

1. **Dễ.** Trong `code/main.py`, thay đổi tỷ lệ các chiều được che từ 0.2 đến 0.8. Ở tỷ lệ nào chất lượng inpaint (phần dư ở các chiều được che) bằng sinh vô điều kiện?
2. **Trung bình.** Triển khai RePaint: ở mỗi bước ngược thứ 10, nhảy lại 5 bước (thêm nhiễu) và khử nhiễu lại. Đo xem nó có giảm phần dư biên ở cạnh mặt nạ không.
3. **Khó.** Dùng Hugging Face diffusers để so sánh: SD 1.5 Inpaint + ControlNet-Openpose so với Flux.1-Fill trên 20 tác vụ sinh lại khuôn mặt. Chấm điểm bám sát tư thế và giữ danh tính riêng biệt.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Inpainting | "Điền lỗ trống" | Sinh lại bên trong một mặt nạ; giữ các pixel bên ngoài. |
| Outpainting | "Mở rộng khung vẽ" | Sinh lại bên ngoài khung vẽ; giữ bên trong. |
| 9-channel U-Net (U-Net 9 kênh) | "Mô hình inpainting đúng nghĩa" | U-Net với `noisy \| encoded-source \| mask` làm đầu vào. |
| SDEdit | "Img2img với mức nhiễu" | Thêm nhiễu đến thời điểm `t`, khử nhiễu với prompt mới. |
| InstructPix2Pix | "Chỉnh sửa chỉ bằng văn bản" | Khuếch tán được tinh chỉnh trên các bộ ba (ảnh, chỉ dẫn, đầu ra). |
| RePaint | "Không huấn luyện lại" | Thêm nhiễu lại định kỳ trong quá trình ngược để giảm đường nối. |
| SAM | "Segment Anything" | Bộ sinh mặt nạ qua nhấp chuột hoặc hộp; kết hợp với inpaint. |
| Flux-Kontext | "Chỉnh sửa với ngữ cảnh" | Biến thể Flux nhận một ảnh tham chiếu + chỉ dẫn để chỉnh sửa. |

## Production note: edit pipelines are latency-sensitive

Người dùng chỉnh sửa một ảnh mong đợi các vòng phản hồi dưới 5 giây. Một SDXL-Inpaint 30 bước ở 1024² mất 3-4 s trên một L4, cộng tạo mặt nạ SAM (~200 ms) và mã hóa/giải mã VAE (tổng ~500 ms). Theo cách đặt vấn đề production, điều này bị giới hạn bởi TTFT thay vì thông lượng — batch 1, mức đồng thời thấp, tối thiểu hóa mọi giai đoạn:

- **SAM-H là cái chậm.** SAM-H ở 1024² mất ~200 ms; SAM-ViT-B mất ~40 ms với mất mát chất lượng nhỏ. SAM 2 (video) thêm chi phí thời gian; đừng dùng nó cho chỉnh sửa một ảnh.
- **Bỏ mã hóa khi có thể.** `pipe.image_processor.preprocess(img)` mã hóa thành latent. Nếu bạn có các latent từ lần sinh trước (điển hình trong các UI chỉnh sửa lặp), truyền chúng trực tiếp qua `latents=...` để bỏ một lần mã hóa VAE.
- **Giãn mặt nạ cũng quan trọng cho thông lượng.** Một mặt nạ nhỏ nghĩa là hầu hết lượt truyền xuôi U-Net bị lãng phí (các pixel không được che dù sao cũng bị cố định). Trong `diffusers`, `StableDiffusionInpaintPipeline` chạy toàn bộ U-Net bất kể thế nào; chỉ các biến thể inpaint đúng nghĩa 9 kênh tận dụng tính toán được che.
- **Flux-Kontext là câu trả lời năm 2025.** Một lượt truyền xuôi duy nhất trên `(source_image, instruction)` — không mặt nạ riêng, không quét nhiễu SDEdit. Trên một H100 nó đưa ra một chỉnh sửa trong ~1.5 s. Bài học kiến trúc: gộp các giai đoạn.

## Further Reading

- [Lugmayr et al. (2022). RePaint: Inpainting using Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2201.09865) — inpainting không cần huấn luyện.
- [Meng et al. (2022). SDEdit: Guided Image Synthesis and Editing with Stochastic Differential Equations](https://arxiv.org/abs/2108.01073) — SDEdit.
- [Brooks, Holynski, Efros (2023). InstructPix2Pix](https://arxiv.org/abs/2211.09800) — chỉnh sửa bằng chỉ dẫn văn bản.
- [Kirillov et al. (2023). Segment Anything](https://arxiv.org/abs/2304.02643) — SAM, nguồn mặt nạ.
- [Ravi et al. (2024). SAM 2: Segment Anything in Images and Videos](https://arxiv.org/abs/2408.00714) — SAM video.
- [Hertz et al. (2022). Prompt-to-Prompt Image Editing with Cross-Attention Control](https://arxiv.org/abs/2208.01626) — chỉnh sửa ở cấp attention.
- [Black Forest Labs (2024). Flux.1-Fill and Flux.1-Kontext](https://blackforestlabs.ai/flux-1-tools/) — bộ công cụ năm 2024.
