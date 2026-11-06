# Generative Models — Taxonomy & History

> Mọi mô hình ảnh, mô hình văn bản, mô hình video và mô hình 3D đều thuộc một trong năm nhóm. Chọn sai nhóm và bạn sẽ vật lộn với toán học suốt nhiều tuần. Chọn đúng nhóm và tiến bộ trong mười hai năm qua của lĩnh vực này sẽ được xếp ngay ngắn trong đầu bạn.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 2 (ML Fundamentals), Phase 3 (Deep Learning Core), Phase 7 · 14 (Transformers)
**Time:** ~45 minutes

## The Problem

Một mô hình sinh làm một việc: với các mẫu huấn luyện được lấy từ một phân phối chưa biết nào đó $p_{\text{data}}(x)$, xuất ra các mẫu mới trông như thể chúng đến từ cùng phân phối đó. Khuôn mặt, câu, tệp MIDI, cấu trúc protein — tất cả đều là cùng một bài toán nếu bạn nheo mắt.

Điểm khó là $p_{\text{data}}$ nằm trong một không gian có hàng triệu chiều (một ảnh RGB 512x512 có ~786k chiều), các mẫu nằm trên một đa tạp mỏng bên trong không gian đó, và bạn có lẽ chỉ có 10M ví dụ. Vét cạn mật độ là vô vọng. Mọi mô hình sinh đều là một sự thỏa hiệp đổi một bài toán khó lấy một bài toán ít khó hơn một chút.

Năm họ đã tồn tại qua mười hai năm vừa qua. Biết mỗi họ đưa ra sự thỏa hiệp nào cho bạn biết vì sao nó thắng ở một số tác vụ và sụp đổ ở những tác vụ khác.

## The Concept

![Five families of generative models — taxonomy by what they model](../assets/taxonomy.svg)

**1. Mật độ tường minh, tính toán được.** Viết $\log p(x)$ thành một tổng mà bạn thực sự có thể tính. Các mô hình tự hồi quy (PixelCNN, WaveNet, GPT) phân tích $p(x) = \prod_i p(x_i \mid x_{<i})$. Normalizing flow (RealNVP, Glow) xây dựng $p(x)$ như một phép biến đổi khả nghịch của một phân phối cơ sở đơn giản. Ưu điểm: độ hợp lý chính xác, hàm mất mát huấn luyện rõ ràng. Nhược điểm: suy luận tự hồi quy là tuần tự (chậm với các chuỗi dài), flow cần kiến trúc khả nghịch (hạn chế về kiến trúc).

**2. Mật độ tường minh, xấp xỉ.** Chặn $\log p(x)$ từ dưới (ELBO) và tối ưu cận đó. VAE (Kingma 2013) dùng một encoder-decoder với một hậu nghiệm biến phân. Các mô hình khuếch tán (DDPM, Ho 2020) huấn luyện một bộ khử nhiễu tối ưu ngầm một ELBO có trọng số. Khuếch tán là backbone chủ đạo cho ảnh, video và 3D vào năm 2026.

**3. Mật độ ẩn.** Bỏ qua mật độ hoàn toàn; học một bộ sinh $G(z)$ tạo ra các mẫu và một bộ phân biệt $D(x)$ phân biệt thật với giả. GAN (Goodfellow 2014). Nhanh khi suy luận (một lượt truyền xuôi) nhưng nổi tiếng không ổn định khi huấn luyện. StyleGAN 1/2/3 vẫn đạt mức tiên tiến nhất về độ chân thực như ảnh chụp trong miền cố định (khuôn mặt, phòng ngủ) ngay cả vào năm 2026.

**4. Dựa trên score / thời gian liên tục.** Học trực tiếp gradient của log mật độ $\nabla_x \log p(x)$ (score). Song & Ermon (2019) cho thấy score matching khái quát hóa khuếch tán thành một SDE. Flow matching (Lipman 2023) là xu hướng nóng giai đoạn 2024-2026: huấn luyện không cần mô phỏng, đường đi thẳng hơn, lấy mẫu nhanh hơn DDPM 4-10x. Stable Diffusion 3, Flux, AudioCraft 2 đều dùng flow matching.

**5. Tự hồi quy dựa trên token trên các mã rời rạc.** Nén dữ liệu nhiều chiều bằng một VQ-VAE hoặc bộ lượng tử hóa phần dư thành một chuỗi ngắn các token rời rạc, rồi dùng một Transformer để mô hình hóa chuỗi token. Parti, MuseNet, AudioLM, VALL-E, bộ tokenizer patch của Sora đều dùng cách này. Đây là nhóm 1 cộng với một tokenizer được học.

## A brief history

| Năm | Mô hình | Vì sao nó quan trọng |
|------|-------|-----------------|
| 2013 | VAE (Kingma) | Mô hình sinh sâu đầu tiên có hàm mất mát huấn luyện dùng được. |
| 2014 | GAN (Goodfellow) | Mật độ ẩn, không có độ hợp lý — các mẫu sắc nét đến kinh ngạc. |
| 2015 | DRAW, PixelCNN | Sinh ảnh tuần tự. |
| 2017 | Glow, RealNVP | Flow khả nghịch; độ hợp lý chính xác với độ sâu. |
| 2017 | Progressive GAN | Những khuôn mặt megapixel đầu tiên. |
| 2019 | StyleGAN / StyleGAN2 | Những khuôn mặt chân thực như ảnh chụp vẫn khó bị vượt qua trong riêng miền đó. |
| 2020 | DDPM (Ho) | Khuếch tán trở nên thực tiễn. |
| 2021 | CLIP, DALL-E 1, VQGAN | Văn bản thành ảnh trở nên phổ biến. |
| 2022 | Imagen, Stable Diffusion 1, DALL-E 2 | Khuếch tán tiềm ẩn + điều kiện hóa bằng văn bản = hàng hóa phổ thông. |
| 2022 | ControlNet, LoRA | Điều khiển tinh đối với khuếch tán được huấn luyện trước. |
| 2023 | SDXL, Midjourney v5, Flow matching | Quy mô + động lực huấn luyện tốt hơn. |
| 2024 | Sora, Stable Diffusion 3, Flux.1 | Khuếch tán video; flow matching chiến thắng. |
| 2025 | Veo 2, Kling 1.5, Runway Gen-3, Nano Banana | Video đạt cấp độ production. |
| 2026 | Consistency + Rectified Flow | Lấy mẫu một bước từ các backbone khuếch tán. |

## The five-question triage

Khi một bài báo mô hình sinh mới xuất hiện, hãy trả lời năm câu hỏi này trước khi đọc phần phương pháp.

1. **Cái gì đang được mô hình hóa?** Pixel, latent, token rời rạc, Gaussian 3D, mesh, dạng sóng?
2. **Mật độ là tường minh hay ẩn?** Họ có viết ra $\log p(x)$ không?
3. **Lấy mẫu: một lần hay lặp?** Lặp có nghĩa là suy luận chậm hơn; một lần thường có nghĩa là đối kháng hoặc được chưng cất.
4. **Điều kiện hóa: vô điều kiện, lớp, văn bản, ảnh, tư thế?** Điều này quyết định hàm mất mát và khung kiến trúc.
5. **Đánh giá: FID, điểm CLIP, IS, sở thích của con người, độ chính xác tác vụ?** Mỗi loại đều có các kiểu thất bại đã biết (xem Bài 14).

Bạn sẽ trả lời lại năm câu này cho mỗi bài học trong giai đoạn này. Đến cuối, chúng sẽ thành phản xạ.

```figure
autoencoder-bottleneck
```

## Build It

Mã cho bài học này là một trực quan hóa nhẹ: khớp một hỗn hợp Gaussian 1-D từ các mẫu bằng ba cách tiếp cận đồ chơi (mật độ kernel, histogram rời rạc và một bộ sinh "kiểu GAN" theo mẫu gần nhất) để bạn có thể thấy sự khác biệt giữa mật độ tường minh và ẩn trên một bài toán bạn có thể in ra trên một màn hình.

Chạy `code/main.py`. Nó lấy 2000 mẫu từ một hỗn hợp Gaussian hai mode, rồi in:

```
explicit density (histogram): p(x in [-0.5, 0.5]) ≈ 0.38
approximate density (KDE):     p(x in [-0.5, 0.5]) ≈ 0.41
implicit (nearest-sample gen): 20 new samples printed, no p(x)
```

Lưu ý: hai cách đầu cho phép bạn hỏi "điểm này có khả năng xảy ra đến đâu?" Cách thứ ba thì không. Đây là sự phân biệt *tường minh so với ẩn* sẽ quan trọng đối với mọi bài học về sau.

## Use It

Họ nào, cho tác vụ nào, vào năm 2026?

| Tác vụ | Họ tốt nhất | Vì sao |
|------|-------------|-----|
| Khuôn mặt chân thực như ảnh chụp, miền hẹp | StyleGAN 2/3 | Vẫn sắc nét nhất, suy luận nhanh nhất. |
| Văn bản thành ảnh tổng quát | Khuếch tán tiềm ẩn + flow matching | SD3, Flux.1, DALL-E 3. |
| Văn bản thành ảnh nhanh | Rectified flow + chưng cất | SDXL-Turbo, SD3-Turbo, LCM. |
| Văn bản thành video | Diffusion Transformer + flow matching | Sora, Veo 2, Kling. |
| Tiếng nói + âm nhạc | AR dựa trên token (AudioLM, VALL-E, MusicGen) hoặc flow matching (AudioCraft 2) | Token rời rạc mở rộng quy mô với chi phí thấp. |
| Cảnh 3D | Khớp Gaussian Splatting, tiên nghiệm khuếch tán | 3D-GS cho tái dựng, khuếch tán cho góc nhìn mới. |
| Ước lượng mật độ (không lấy mẫu) | Flow | Họ duy nhất có $\log p(x)$ chính xác. |
| Mô phỏng / vật lý | Flow matching, score SDE | Đường đi thẳng, trường vector trơn. |

## Ship It

Lưu thành `outputs/skill-model-chooser.md`.

Skill nhận mô tả tác vụ và xuất ra: (1) nên dùng họ nào, (2) một danh sách xếp hạng gồm ba lựa chọn mở và ba lựa chọn được lưu trữ, (3) kiểu thất bại có khả năng xảy ra mà bạn nên theo dõi, và (4) ngân sách tính toán/thời gian.

## Exercises

1. **Dễ.** Với mỗi sản phẩm trong năm sản phẩm này, xác định họ và backbone: ChatGPT image, Midjourney v7, Sora, Runway Gen-3, ElevenLabs. Bằng chứng nên đến từ các báo cáo kỹ thuật công khai.
2. **Trung bình.** Bài báo bạn sắp đọc ngày mai tuyên bố lấy mẫu nhanh hơn khuếch tán 100x. Viết ra ba câu hỏi để kiểm tra liệu mức tăng tốc đó có còn khi điều kiện hóa và ở độ phân giải cao hay không.
3. **Khó.** Chọn một miền bạn quan tâm (ví dụ cấu trúc protein, CAD, phân tử, quỹ đạo). Trả lời bộ năm câu hỏi sàng lọc cho mô hình SOTA hiện tại trong miền đó và phác thảo những gì một mô hình tốt hơn sẽ thay đổi.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Generative model (Mô hình sinh) | "Nó tạo ra những thứ mới" | Học một bộ lấy mẫu cho $p_{\text{data}}(x)$, có thể cung cấp $\log p(x)$. |
| Explicit density (Mật độ tường minh) | "Bạn có thể tính nó" | Mô hình cung cấp $\log p(x)$ dạng đóng hoặc tính toán được. |
| Implicit density (Mật độ ẩn) | "Kiểu GAN" | Chỉ có một bộ lấy mẫu — không có cách tính $p(x)$ của một điểm cho trước. |
| ELBO | "Cận dưới bằng chứng" | Một cận dưới tính toán được của $\log p(x)$; VAE và khuếch tán tối ưu nó. |
| Score | "Gradient của log mật độ" | $\nabla_x \log p(x)$; các mô hình khuếch tán và SDE học trường này. |
| Manifold hypothesis (Giả thuyết đa tạp) | "Dữ liệu nằm trên một bề mặt" | Dữ liệu nhiều chiều tập trung trên một đa tạp ít chiều; lý do giảm chiều hoạt động. |
| Autoregressive (Tự hồi quy) | "Dự đoán phần tiếp theo" | Phân tích phân phối đồng thời thành tích các phân phối có điều kiện. |
| Latent (Tiềm ẩn) | "Mã được nén" | Biểu diễn ít chiều mà từ đó một decoder có thể tái dựng đầu vào. |

## Production note: five families, five inference shapes

Mỗi họ tương ứng với một đường cong chi phí máy chủ suy luận khác nhau. Tài liệu về suy luận production trình bày suy luận LLM như prefill + decode; cùng cách phân rã này áp dụng ở đây:

- **Tự hồi quy (nhóm 1 và 5).** Decode tuần tự chi phối độ trễ; KV-cache, continuous batching và speculative decoding đều áp dụng trực tiếp.
- **VAE / khuếch tán / flow-matching (nhóm 2 và 4).** Không có decode theo nghĩa LLM. Chi phí = `num_steps × step_cost`, và `step_cost` là một lượt truyền xuôi transformer hoặc U-Net ở toàn bộ độ phân giải latent. Các nút điều chỉnh production là số bước (DDIM / DPM-Solver / chưng cất), kích thước batch và độ chính xác (bf16 / fp8 / int4).
- **GAN (nhóm 3).** Một lượt truyền xuôi. Không có lịch, không có KV-cache. TTFT ≈ tổng độ trễ. Đây là lý do StyleGAN vẫn thắng về UX trong miền hẹp.

Khi bạn thấy "nhanh hơn khuếch tán" trong phần tóm tắt một bài báo, hãy chuyển nó thành "ít bước hơn × cùng chi phí mỗi bước" hoặc "cùng số bước × chi phí mỗi bước rẻ hơn". Mọi thứ khác là tiếp thị.

## Further Reading

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) — bài báo GAN.
- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) — bài báo VAE.
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) — bài báo DDPM.
- [Song et al. (2021). Score-Based Generative Modeling through SDEs](https://arxiv.org/abs/2011.13456) — khuếch tán dưới dạng một SDE.
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) — bài báo flow matching.
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) — Stable Diffusion 3.
