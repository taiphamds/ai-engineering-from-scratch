# Latent Diffusion & Stable Diffusion

> Khuếch tán trong không gian pixel trên ảnh 512×512 là một tội ác chiến tranh về tính toán. Rombach và cộng sự (2022) nhận thấy bạn không cần toàn bộ 786k chiều để sinh một ảnh — bạn cần đủ để nắm bắt cấu trúc ngữ nghĩa, và một decoder riêng cho phần còn lại. Chạy khuếch tán bên trong không gian latent của một VAE. Ý tưởng đó chính là Stable Diffusion.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 02 (VAE), Phase 8 · 06 (DDPM), Phase 7 · 09 (ViT)
**Time:** ~75 minutes

## The Problem

Khuếch tán trong không gian pixel ở 512² nghĩa là U-Net chạy trên các tensor có hình dạng `[B, 3, 512, 512]`. Mỗi bước lấy mẫu là ~100 GFLOPS cho một U-Net 500M tham số. Năm mươi bước là 5 TFLOPS mỗi ảnh. Huấn luyện trên một tỷ ảnh và hóa đơn tính toán là phi lý.

Hầu hết FLOPs đó dùng để đẩy các chi tiết không quan trọng về cảm nhận qua mạng — kết cấu tần số cao mà một VAE có mất mát có thể nén đi. Ý tưởng của Rombach: huấn luyện một VAE một lần (*giai đoạn thứ nhất*), đóng băng nó, và chạy khuếch tán hoàn toàn trong không gian latent 64×64 có 4 kênh (*giai đoạn thứ hai*). Cùng U-Net. 1/16 số pixel. Ít FLOPs hơn ~64x cho chất lượng tương đương.

Đây là công thức Stable Diffusion. SD 1.x / 2.x dùng một U-Net 860M trên các latent `64×64×4`, SDXL dùng một U-Net 2.6B trên `128×128×4`, SD3 thay U-Net bằng một Diffusion Transformer (DiT) với flow matching. Flux.1-dev (Black Forest Labs, 2024) cung cấp một DiT-MMDiT 12B tham số. Tất cả đều chạy trên cùng nền tảng hai giai đoạn.

## The Concept

![Latent diffusion: VAE compression + diffusion in latent space](../assets/latent-diffusion.svg)

**Hai giai đoạn, được huấn luyện riêng.**

1. **Giai đoạn 1 — VAE.** Encoder `E(x) → z`, decoder `D(z) → x`. Mục tiêu nén: giảm mẫu 8× ở mỗi trục không gian + điều chỉnh kênh để tổng kích thước latent bằng ~1/16 số pixel. Hàm mất mát = tái dựng (L1 + cảm nhận LPIPS) + KL (trọng số nhỏ để `z` không bị buộc quá Gaussian, vì chúng ta không cần lấy mẫu chính xác từ `z`). Thường được huấn luyện với một hàm mất mát đối kháng để ảnh được giải mã sắc nét.

2. **Giai đoạn 2 — khuếch tán trên `z`.** Coi `z = E(x_real)` là dữ liệu. Huấn luyện một U-Net (hoặc DiT) để khử nhiễu `z_t`. Khi suy luận: lấy mẫu `z_0` qua khuếch tán, rồi `x = D(z_0)`.

**Điều kiện hóa bằng văn bản.** Hai thành phần bổ sung. Một encoder văn bản đóng băng (CLIP-L cho SD 1.x, CLIP-L+OpenCLIP-G cho SD 2/XL, T5-XXL cho SD3 và Flux). Một cơ chế đưa vào bằng cross-attention: mỗi khối U-Net nhận `[Q = image features, K = V = text tokens]` và trộn chúng vào. Các token là cách duy nhất văn bản ảnh hưởng đến ảnh.

**Hàm mất mát giống hệt Bài 06.** Cùng MSE DDPM / flow matching trên nhiễu. Bạn chỉ đổi miền dữ liệu.

## Architecture variants

| Mô hình | Năm | Backbone | Hình dạng latent | Encoder văn bản | Tham số |
|-------|------|----------|--------------|--------------|--------|
| SD 1.5 | 2022 | U-Net | 64×64×4 | CLIP-L (77 token) | 860M |
| SD 2.1 | 2022 | U-Net | 64×64×4 | OpenCLIP-H | 865M |
| SDXL | 2023 | U-Net + bộ tinh chỉnh | 128×128×4 | CLIP-L + OpenCLIP-G | 2.6B + 6.6B |
| SDXL-Turbo | 2023 | Được chưng cất | 128×128×4 | như trên | lấy mẫu 1-4 bước |
| SD3 | 2024 | MMDiT (DiT đa phương thức) | 128×128×16 | T5-XXL + CLIP-L + CLIP-G | 2B / 8B |
| Flux.1-dev | 2024 | MMDiT | 128×128×16 | T5-XXL + CLIP-L | 12B |
| Flux.1-schnell | 2024 | MMDiT được chưng cất | 128×128×16 | T5-XXL + CLIP-L | 12B, 1-4 bước |

Xu hướng: thay U-Net bằng DiT (transformer trên các patch latent), mở rộng encoder văn bản (T5 đánh bại CLIP về bám sát prompt), tăng số kênh latent (4 → 16 cho nhiều dư địa chi tiết hơn).

```figure
noise-schedule
```

## Build It

`code/main.py` xếp một "VAE" 1-D đồ chơi (encoder + decoder đồng nhất, để minh họa; một VAE thực sẽ là một mạng conv) lên DDPM từ Bài 06 và thêm điều kiện hóa theo lớp với classifier-free guidance. Nó cho thấy cùng hàm mất mát khuếch tán hoạt động dù bạn chạy trên các giá trị 1-D thô hay trên các giá trị được mã hóa — nhận thức then chốt.

### Step 1: encoder/decoder

```python
def encode(x):    return x * 0.5          # toy "compression" to smaller scale
def decode(z):    return z * 2.0
```

Một VAE thực có các trọng số đã huấn luyện. Vì mục đích sư phạm, ánh xạ tuyến tính này đủ để cho thấy khuếch tán hoạt động trên `z` mà không quan tâm không gian dữ liệu gốc.

### Step 2: diffusion in `z`-space

Cùng DDPM như Bài 06. Dữ liệu mạng thấy là `z = E(x)`. Sau khi lấy mẫu `z_0`, giải mã bằng `D(z_0)`.

### Step 3: classifier-free guidance

Trong huấn luyện, bỏ nhãn lớp 10% thời gian (thay bằng một null token). Khi suy luận, tính cả `ε_cond` và `ε_uncond`, rồi:

```python
eps_cfg = (1 + w) * eps_cond - w * eps_uncond
```

`w = 0` = không guidance (đa dạng đầy đủ), `w = 3` = mặc định, `w = 7+` = bão hòa / quá sắc nét.

### Step 4: text conditioning (concept, not code)

Thay nhãn lớp bằng đầu ra encoder văn bản đóng băng. Đưa embedding văn bản vào U-Net qua cross-attention:

```python
h = h + CrossAttention(Q=h, K=text_embed, V=text_embed)
```

Đây là khác biệt đáng kể duy nhất giữa một mô hình khuếch tán có điều kiện theo lớp và Stable Diffusion.

## Pitfalls

- **Tỷ lệ VAE không khớp.** Các VAE SD 1.x có một hằng số tỷ lệ (`scaling_factor ≈ 0.18215`) được áp dụng sau mã hóa. Quên điều này khiến U-Net huấn luyện trên các latent có phương sai sai lệch rất lớn. Mỗi checkpoint đều kèm một hằng số.
- **Encoder văn bản âm thầm sai.** SD3 cần T5-XXL với >=128 token, và chuyển về chỉ CLIP gây mất mát. Luôn kiểm tra `use_t5=True` nếu không độ trung thành với prompt lao dốc.
- **Trộn không gian latent.** SDXL, SD3, Flux đều dùng các VAE khác nhau. Một LoRA được huấn luyện trên latent SDXL sẽ không hoạt động trên SD3. Hugging Face diffusers 0.30+ từ chối tải các checkpoint không khớp.
- **CFG quá cao.** `w > 10` tạo ra các ảnh bão hòa, bóng dầu và overfit prompt với cái giá là sự đa dạng. Khoảng tốt nhất là `w = 3-7`.
- **Prompt âm rò rỉ.** Prompt âm rỗng trở thành null token; một prompt âm có nội dung trở thành `ε_uncond`. Chúng không giống nhau; một số pipeline âm thầm mặc định về null.

## Use It

Các bộ công cụ production năm 2026:

| Mục tiêu | Backbone được đề xuất |
|--------|----------------------|
| Miền hẹp, dữ liệu ghép cặp, huấn luyện một mô hình từ đầu | Tinh chỉnh SDXL (LoRA / toàn bộ) — nhanh nhất để triển khai |
| Văn bản thành ảnh miền mở, trọng số mở | Flux.1-dev (12B, Apache / phi thương mại) hoặc SD3.5-Large |
| Suy luận nhanh nhất, trọng số mở | Flux.1-schnell (1-4 bước, Apache) hoặc SDXL-Lightning |
| Bám sát prompt tốt nhất, được lưu trữ | GPT-Image / DALL-E 3 (vẫn vậy), Midjourney v7, Imagen 4 |
| Quy trình chỉnh sửa | Flux.1-Kontext (tháng 12 năm 2024) — nhận ảnh + văn bản một cách tự nhiên |
| Nghiên cứu, baseline | SD 1.5 — cổ xưa nhưng được nghiên cứu kỹ |

## Ship It

Lưu `outputs/skill-sd-prompter.md`. Skill nhận một prompt văn bản + phong cách mục tiêu và xuất ra: mô hình + checkpoint, mức CFG, bộ lấy mẫu, prompt âm, độ phân giải, tổ hợp ControlNet/IP-Adapter tùy chọn, và một danh sách kiểm tra QA theo bước.

## Exercises

1. **Dễ.** Chạy `code/main.py` với guidance `w ∈ {0, 1, 3, 7, 15}`. Ghi lại trung bình mẫu theo lớp. Ở `w` nào trung bình các lớp phân kỳ vượt quá trung bình dữ liệu thật?
2. **Trung bình.** Thay encoder tuyến tính đồ chơi bằng một cặp encoder/decoder tanh-MLP với một hàm mất mát tái dựng. Huấn luyện lại khuếch tán trên các latent mới. Chất lượng mẫu có thay đổi không?
3. **Khó.** Thiết lập suy luận Stable Diffusion thực với diffusers: tải `sdxl-base`, chạy 30 bước Euler với CFG=7, đo thời gian. Giờ chuyển sang `sdxl-turbo` với 4 bước và CFG=0. Cùng chủ thể, chất lượng khác — mô tả điều gì đã thay đổi và vì sao.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| First stage (Giai đoạn thứ nhất) | "VAE" | Cặp encoder/decoder đã huấn luyện; nén 512² xuống 64². |
| Second stage (Giai đoạn thứ hai) | "U-Net" | Mô hình khuếch tán trên không gian latent. |
| CFG | "Mức guidance" | `(1+w)·ε_cond - w·ε_uncond`; điều chỉnh cường độ điều kiện hóa. |
| Null token (Token rỗng) | "Embedding prompt rỗng" | Embedding vô điều kiện dùng cho `ε_uncond`. |
| Cross-attention (Chú ý chéo) | "Cách văn bản đi vào" | Mỗi khối U-Net chú ý đến các token văn bản làm K và V. |
| DiT | "Diffusion Transformer" | Thay U-Net bằng một transformer trên các patch latent; mở rộng quy mô tốt hơn. |
| MMDiT | "DiT đa phương thức" | Kiến trúc của SD3: các luồng văn bản và ảnh với attention chung. |
| VAE scaling factor (Hệ số tỷ lệ VAE) | "Con số ma thuật" | Chia các latent cho ~5.4 để khuếch tán hoạt động trong không gian phương sai đơn vị. |

## Production note: running Flux-12B on an 8GB consumer GPU

tích hợp Flux tham chiếu là công thức chuẩn cho "Tôi có một GPU phổ thông, tôi có thể triển khai cái này không?" Thủ thuật là cùng công thức ba nút điều chỉnh mà tài liệu suy luận production liệt kê được áp dụng cho một DiT khuếch tán:

1. **Tải so le.** Flux có ba mạng không bao giờ cần cùng tồn tại trong VRAM: encoder văn bản T5-XXL (~10 GB ở fp32), CLIP-L (nhỏ), MMDiT 12B, và VAE. Mã hóa prompt trước, *xóa* các encoder, tải DiT, khử nhiễu, *xóa* DiT, tải VAE, giải mã. GPU phổ thông 8GB chỉ chứa được một giai đoạn mỗi lần.
2. **Lượng tử hóa 4-bit qua bitsandbytes.** `BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_compute_dtype=torch.bfloat16)` trên cả encoder T5 và DiT. Giảm bộ nhớ 8×, suy giảm chất lượng không thể nhận thấy cho văn bản thành ảnh theo các benchmark của Aritra (được liên kết trong notebook).
3. **CPU offload.** `pipe.enable_model_cpu_offload()` tự động hoán đổi các mô-đun giữa CPU và GPU khi mỗi lượt truyền xuôi tiến triển. Thêm độ trễ 10-20% nhưng khiến pipeline có thể chạy được.

Hạch toán bộ nhớ là: `10 GB T5 / 8 = 1.25 GB` đã lượng tử hóa, `12 B params × 0.5 bytes = ~6 GB` DiT đã lượng tử hóa, cộng với activation. Theo thuật ngữ của stas00 đây là cực hạn của suy luận TP=1 — không song song mô hình, lượng tử hóa tối đa. Cho production bạn sẽ chạy TP=2 hoặc TP=4 trên H100; cho một laptop phát triển duy nhất, đây là công thức.

## Further Reading

- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) — Stable Diffusion.
- [Podell et al. (2023). SDXL: Improving Latent Diffusion Models for High-Resolution Image Synthesis](https://arxiv.org/abs/2307.01952) — SDXL.
- [Peebles & Xie (2023). Scalable Diffusion Models with Transformers (DiT)](https://arxiv.org/abs/2212.09748) — DiT.
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) — SD3, MMDiT.
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) — CFG.
- [Labs (2024). Flux.1 — Black Forest Labs announcement](https://blackforestlabs.ai/announcing-black-forest-labs/) — họ Flux.1.
- [Hugging Face Diffusers docs](https://huggingface.co/docs/diffusers/index) — triển khai tham chiếu cho mọi checkpoint ở trên.
