# Video Generation

> Một ảnh là một tensor 2-D. Một video là một tensor 3-D. Lý thuyết giống nhau; tính toán khó hơn 10-100x. Sora của OpenAI (tháng 2 năm 2024) chứng minh điều đó là có thể. Đến năm 2026 Veo 2, Kling 1.5, Runway Gen-3, Pika 2.0 và WAN 2.2 cung cấp video production từ văn bản ở 1080p — và bộ công cụ trọng số mở (CogVideoX, HunyuanVideo, Mochi-1, WAN 2.2) chậm hơn 12 tháng.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 07 (Latent Diffusion), Phase 7 · 09 (ViT), Phase 8 · 06 (DDPM)
**Time:** ~45 minutes

## The Problem

Một video 1080p dài 10 giây ở 24fps là 240 khung hình 1920×1080×3 pixel. Đó là ~1.5 GB dữ liệu thô mỗi clip. Khuếch tán trong không gian pixel không khả thi. Bạn cần:

1. **Nén không gian-thời gian.** Một VAE mã hóa video, không phải khung hình, thành một chuỗi patch không gian-thời gian.
2. **Nhất quán thời gian.** Các khung hình cần chia sẻ nội dung, ánh sáng và danh tính vật thể qua nhiều giây. Mạng phải mô hình hóa chuyển động.
3. **Ngân sách tính toán.** Huấn luyện video tốn kém hơn ảnh 10-100x với cùng kích thước mô hình.
4. **Điều kiện hóa.** Văn bản, ảnh (khung hình đầu tiên), âm thanh, hoặc một video khác. Hầu hết mô hình production nhận cả bốn.

Kiến trúc giải quyết điều này là **Diffusion Transformer (DiT)** được áp dụng cho các patch không gian-thời gian, được huấn luyện trên các tập dữ liệu (prompt, chú thích, video) khổng lồ. Cùng hàm mất mát khuếch tán như Bài 06.

## The Concept

![Video diffusion: patchify, DiT, decode](../assets/video-generation.svg)

### Patchify

Mã hóa video bằng một VAE 3D (nén không gian-thời gian được học). Latent có hình dạng `[T_latent, H_latent, W_latent, C_latent]`. Chia thành các patch kích thước `[t_p, h_p, w_p]`. Với các mô hình kiểu Sora, `t_p = 1` (patch theo khung hình) hoặc `t_p = 2` (mỗi hai khung hình). Một video 1080p dài 10 giây nén thành ~20,000-100,000 patch.

### Spatiotemporal DiT

Một transformer xử lý chuỗi patch phẳng. Mỗi patch có một embedding vị trí 3D (thời gian + y + x). Attention thường được phân tách:

- **Attention không gian** trong các patch của mỗi khung hình.
- **Attention thời gian** xuyên các khung hình ở cùng vị trí không gian.
- **Attention 3D đầy đủ** tốn kém hơn 16-100x; chỉ dùng ở độ phân giải thấp hoặc trong nghiên cứu.

### Text conditioning

Cross-attention với một encoder văn bản lớn (T5-XXL cho Sora, CogVideoX-5B dùng T5-XXL). Prompt dài quan trọng — tập huấn luyện của Sora có các chú thích lại dày đặc do GPT sinh, trung bình 200 token mỗi clip.

### Training

Hàm mất mát khuếch tán tiêu chuẩn (dự đoán ε hoặc v) trên các latent không gian-thời gian. Dữ liệu: video web + ~100M clip tuyển chọn + chú thích văn bản tổng hợp. Tính toán: 10,000+ giờ GPU cho ngay cả một lần chạy nghiên cứu nhỏ; quy mô Sora là 100,000+.

## The 2026 production landscape

| Mô hình | Thời điểm | Thời lượng tối đa | Độ phân giải tối đa | Trọng số mở? | Đáng chú ý |
|-------|------|--------------|---------|---------------|---------|
| Sora (OpenAI) | 2024-02 | 60s | 1080p | Không | Mô hình đầu tiên cho thấy các tính chất mô phỏng thế giới ở quy mô lớn |
| Sora Turbo | 2024-12 | 20s | 1080p | Không | Sora production với suy luận nhanh hơn 5x |
| Veo 2 (Google) | 2024-12 | 8s | 4K | Không | Chất lượng + vật lý cao nhất năm 2025 |
| Veo 3 | 2025 Q3 | 15s | 4K | Không | Âm thanh gốc và điều khiển camera mạnh hơn |
| Kling 1.5 / 2.1 (Kuaishou) | 2024-2025 | 10s | 1080p | Không | Chuyển động con người tốt nhất trong Q1 năm 2025 |
| Runway Gen-3 Alpha | 2024-06 | 10s | 768p | Không | Các công cụ video chuyên nghiệp ở trên |
| Pika 2.0 | 2024-10 | 5s | 1080p | Không | Tính nhất quán nhân vật mạnh nhất |
| CogVideoX (THUDM) | 2024 | 10s | 720p | Có (2B, 5B) | Video mở quy mô 5B đầu tiên |
| HunyuanVideo (Tencent) | 2024-12 | 5s | 720p | Có (13B) | SOTA mở cuối năm 2024 |
| Mochi-1 (Genmo) | 2024-10 | 5.4s | 480p | Có (10B) | Có giấy phép ít hạn chế nhất |
| WAN 2.2 (Alibaba) | 2025-07 | 5s | 720p | Có | Mô hình mở mạnh nhất giữa năm 2025 |

Trọng số mở đang thu hẹp khoảng cách nhanh hơn trong không gian ảnh: HunyuanVideo + các LoRA WAN 2.2 đã hỗ trợ hầu hết các quy trình mã nguồn mở vào giữa năm 2026.

```figure
video-diffusion-denoise
```

## Build It

`code/main.py` mô phỏng ý tưởng DiT không gian-thời gian cốt lõi: chia một video tổng hợp nhỏ thành patch, thêm một embedding vị trí theo patch, và khử nhiễu toàn bộ chuỗi bằng attention kiểu transformer trên các patch. Không numpy; Python thuần. Chúng ta cho thấy tính nhất quán thời gian xuất hiện ngay cả trong 1-D khi các patch khung hình liền kề chia sẻ một bộ khử nhiễu và các embedding vị trí.

### Step 1: patchify a synthetic 1-D "video"

```python
def make_video(T_frames=8, rng=None):
    # a "video" is a sequence of 1-D values following a smooth trajectory
    base = rng.gauss(0, 1)
    return [base + 0.3 * t + rng.gauss(0, 0.1) for t in range(T_frames)]
```

### Step 2: position embedding per frame

```python
def pos_embed(t, dim):
    return sinusoidal(t, dim)
```

### Step 3: denoiser sees the whole sequence

Thay vì khử nhiễu mỗi khung hình độc lập, mạng nhỏ của chúng ta nối tất cả các giá trị khung hình + embedding vị trí của chúng và dự đoán nhiễu cho tất cả khung hình cùng nhau.

### Step 4: temporal coherence test

Sau huấn luyện, lấy mẫu một video. Đo chênh lệch giữa các khung hình. Nếu mô hình đã học cấu trúc thời gian, các chênh lệch nhỏ hơn so với lấy mẫu từng khung hình độc lập.

## Pitfalls

- **Lấy mẫu độc lập theo khung hình = nhấp nháy.** Nếu bạn chạy khuếch tán ảnh trên từng khung hình riêng, đầu ra nhấp nháy vì nhiễu của mỗi khung hình độc lập. Khuếch tán video khắc phục điều này bằng cách liên kết các khung hình qua attention hoặc nhiễu chung.
- **Attention 3D đơn giản = OOM.** Attention 3D đầy đủ trên một latent 1080p dài 10 giây là hàng trăm tỷ phép toán. Phân tách thành không gian + thời gian.
- **Chú thích dữ liệu quan trọng hơn kích thước.** Nâng cấp chính của Sora so với công trình trước là huấn luyện trên các chú thích chi tiết hơn ~10x (clip được GPT-4 gán nhãn lại). Báo cáo kỹ thuật của OpenAI nói rõ điều này.
- **Điều kiện hóa khung hình đầu tiên.** Hầu hết mô hình production cũng nhận một ảnh làm khung hình đầu tiên. Đây là chế độ "ảnh thành video"; huấn luyện bao gồm biến thể này.
- **Trôi vật lý.** Clip dài (>10s) tích lũy các bất nhất tinh vi. Sinh theo cửa sổ trượt + neo khung hình chính giúp ích.

## Use It

| Trường hợp sử dụng | Lựa chọn năm 2026 |
|----------|-----------|
| Văn bản thành video chất lượng cao nhất, được lưu trữ | Veo 3 hoặc Sora |
| Điện ảnh có điều khiển camera | Runway Gen-3 với cọ chuyển động |
| Tính nhất quán nhân vật xuyên các clip | Pika 2.0 hoặc Kling 2.1 |
| Trọng số mở, tinh chỉnh nhanh | WAN 2.2 + LoRA |
| Ảnh thành video | WAN 2.2-I2V, Kling 2.1 I2V, hoặc Runway |
| Đồng bộ môi âm thanh thành video | Veo 3 (âm thanh gốc) hoặc một mô hình đồng bộ môi chuyên dụng |
| Chỉnh sửa video | Runway Act-Two, Kling Motion Brush, Flux-Kontext (khung hình tĩnh) |

Chi phí mỗi giây video ở chất lượng tương đương đã giảm 20x từ năm 2024 đến năm 2026.

## Ship It

Lưu `outputs/skill-video-brief.md`. Skill nhận một bản yêu cầu video (thời lượng, tỷ lệ khung hình, phong cách, kế hoạch camera, tính nhất quán chủ thể, âm thanh) và xuất ra: mô hình + nơi lưu trữ, khung prompt (ngôn ngữ camera, mô tả chủ thể, các mô tả chuyển động), seed + quy trình tái lập, và một danh sách kiểm tra QA cấp khung hình.

## Exercises

1. **Dễ.** Trong `code/main.py`, so sánh chênh lệch giữa các khung hình cho (a) lấy mẫu độc lập theo khung hình, (b) lấy mẫu chuỗi chung. Báo cáo trung bình và phương sai của các chênh lệch.
2. **Trung bình.** Thêm một điều kiện khung hình đầu tiên: cố định khung hình 0 ở một giá trị cho trước và lấy mẫu phần còn lại. Đo cách giá trị cố định lan truyền.
3. **Khó.** Dùng HuggingFace diffusers để chạy CogVideoX-2B trên một GPU cục bộ. Đo thời gian 20 bước suy luận ở 720p cho một clip dài 6 giây. Profile attention không gian-thời gian để xác định nút thắt cổ chai.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Video VAE (VAE video) | "VAE 3-D" | Encoder nén `(T, H, W, C)` → latent không gian-thời gian. |
| Patches (Các patch) | "Các token" | Các khối 3-D kích thước cố định của latent; đầu vào cho DiT. |
| Factorized attention (Attention phân tách) | "Không gian + thời gian" | Chạy attention trên không gian, rồi trên thời gian; bỏ attention 3-D đầy đủ. |
| Image-to-video (I2V) (Ảnh thành video) | "Làm ảnh chụp này chuyển động" | Mô hình nhận một ảnh + văn bản, xuất ra một video bắt đầu từ nó. |
| Keyframe conditioning (Điều kiện hóa khung hình chính) | "Các khung hình neo" | Cố định các khung hình cụ thể để điều khiển diễn tiến video. |
| Motion brush (Cọ chuyển động) | "Gợi ý hướng" | Đầu vào UI nơi người dùng vẽ các vector chuyển động lên ảnh. |
| Re-captioning (Chú thích lại) | "Chú thích dày đặc" | Dùng một LLM để gán nhãn lại các clip huấn luyện bằng prompt chi tiết. |
| Flicker (Nhấp nháy) | "Lỗi giả thời gian" | Bất nhất giữa các khung hình; khắc phục bằng khử nhiễu liên kết. |

## Production note: video latents are a memory-bandwidth problem

Một clip 1080p dài 10 giây ở 24 fps là 240 khung hình × 1920 × 1080 × 3 ≈ 1.5 GB pixel thô. Sau nén VAE video 4× (`2 × spatial × 2 × temporal`), latent là ~100 MB mỗi yêu cầu. Chạy thứ này qua một DiT không gian-thời gian trong 30 bước ở batch 1 và bạn đang chuyển ~3 GB/bước qua HBM — băng thông bộ nhớ, không phải FLOPs, là nút thắt cổ chai.

Ba nút điều chỉnh production, tất cả đều lấy thẳng từ chương suy luận trong tài liệu suy luận production:

- **TP xuyên DiT.** Các mô hình văn bản thành video thường có ≥10B tham số. TP=4 trên 4 H100 là tiêu chuẩn; PP=2 × TP=2 cho các mô hình hạng 405B. Độ trễ mỗi bước giảm gần tuyến tính theo TP cho đến giới hạn all-reduce.
- **Gom batch khung hình = continuous batching.** Khi sinh, về khái niệm video là một batch các khung hình liên kết bởi attention. Continuous batching (lập lịch đang xử lý) áp dụng được: bắt đầu kết xuất khung hình `t+1` trong khi khung hình `t-1` đang được trả về, nếu kiến trúc mô hình cho phép sinh theo cửa sổ trượt.
- **Cache prefill cấp clip.** Với ảnh thành video, điều kiện hóa khung hình đầu tiên tương tự prompt prefill của một LLM: tính nó một lần, tái sử dụng qua các lượt decoder thời gian. Đây thực chất là một KV-cache cho video.

## Further Reading

- [Brooks et al. (2024). Video generation models as world simulators](https://openai.com/index/video-generation-models-as-world-simulators/) — báo cáo kỹ thuật Sora.
- [Yang et al. (2024). CogVideoX: Text-to-Video Diffusion Models with An Expert Transformer](https://arxiv.org/abs/2408.06072) — CogVideoX.
- [Kong et al. (2024). HunyuanVideo: A Systematic Framework for Large Video Generative Models](https://arxiv.org/abs/2412.03603) — HunyuanVideo.
- [Genmo (2024). Mochi 1 preview model card](https://huggingface.co/genmo/mochi-1-preview) — Mochi-1.
- [Alibaba (2025). WAN 2.2](https://wanvideo.io/) — SOTA mở giữa năm 2025.
- [Ho, Salimans, Gritsenko et al. (2022). Video Diffusion Models](https://arxiv.org/abs/2204.03458) — bài báo khuếch tán video có tính khai phá.
- [Blattmann et al. (2023). Align your Latents (Video LDM)](https://arxiv.org/abs/2304.08818) — tiền thân của Stable Video Diffusion.
