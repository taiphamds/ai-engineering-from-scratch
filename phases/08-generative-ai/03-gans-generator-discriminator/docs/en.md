# GANs — Generator vs Discriminator

> Thủ thuật của Goodfellow năm 2014 là bỏ qua mật độ hoàn toàn. Hai mạng. Một mạng tạo hàng giả. Một mạng bắt chúng. Chúng chiến đấu cho đến khi hàng giả không thể phân biệt với hàng thật. Đáng ra nó không hoạt động. Nó thường không hoạt động. Khi nó hoạt động, các mẫu vẫn là những mẫu sắc nét nhất trong tài liệu nghiên cứu cho các miền hẹp.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 08 (Optimizers), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## The Problem

VAE tạo ra các mẫu mờ vì hàm mất mát decoder MSE của chúng tối ưu Bayes cho ảnh *trung bình* — và trung bình của nhiều chữ số có vẻ hợp lý là một chữ số nhòe. Bạn muốn một hàm mất mát thưởng cho *tính hợp lý*, chứ không phải độ gần theo từng pixel với bất kỳ mục tiêu đơn lẻ nào. Không có dạng đóng cho tính hợp lý. Bạn phải học nó.

Ý tưởng của Goodfellow: huấn luyện một bộ phân loại $D(x)$ để phân biệt ảnh thật với hàng giả. Huấn luyện một bộ sinh $G(z)$ để đánh lừa $D$. Tín hiệu mất mát cho $G$ là bất cứ thứ gì $D$ hiện cho rằng khiến một thứ trông thật. Tín hiệu này cập nhật khi $G$ cải thiện, đuổi theo một mục tiêu di động. Nếu cả hai mạng hội tụ, $G$ đã học phân phối dữ liệu mà chưa từng viết ra `log p(x)`.

Đây là huấn luyện đối kháng. Toán học là một trò chơi minimax:

```math
\min_G \max_D \; \mathbb{E}_{\text{real}}[\log D(x)] + \mathbb{E}_{\text{fake}}[\log(1 - D(G(z)))]
```

Vào năm 2026 GAN không còn là bộ sinh SOTA (khuếch tán và flow matching đã chiếm ngôi đó). Nhưng StyleGAN 2/3 vẫn là những mô hình khuôn mặt sắc nét nhất từng được phát hành, các bộ phân biệt GAN được dùng làm *hàm mất mát cảm nhận* trong huấn luyện khuếch tán, và huấn luyện đối kháng hỗ trợ các phép chưng cất 1 bước nhanh (SDXL-Turbo, SD3-Turbo, LCM) cho phép bạn triển khai khuếch tán thời gian thực.

## The Concept

![GAN training: generator and discriminator in minimax](../assets/gan.svg)

**Bộ sinh $G(z)$.** Ánh xạ một vector nhiễu $z \sim \mathcal{N}(0, I)$ sang một mẫu $\hat{x}$. Một mạng có hình dạng decoder (dense hoặc conv chuyển vị).

**Bộ phân biệt $D(x)$.** Ánh xạ một mẫu sang một xác suất vô hướng (hoặc điểm). Thật → 1, giả → 0.

**Hàm mất mát.** Hai cập nhật luân phiên:

- **Huấn luyện $D$:** $\text{loss}_D = -[ \log D(x) + \log(1 - D(G(z))) ]$. Binary cross-entropy trên thật=1, giả=0.
- **Huấn luyện $G$:** $\text{loss}_G = -\log D(G(z))$. Đây là dạng *không bão hòa* Goodfellow đã dùng ($\log(1 - D(G(z)))$ ban đầu bão hòa và giết gradient khi $D$ tự tin).

**Vòng lặp huấn luyện.** Một bước của $D$, một bước của $G$. Lặp lại.

**Vì sao nó hoạt động.** Nếu $G$ khớp hoàn hảo với $p_{\text{data}}$, thì $D$ không thể làm tốt hơn ngẫu nhiên và xuất ra 0.5 ở mọi nơi; $G$ không nhận thêm gradient. Cân bằng.

**Vì sao nó hỏng.** Sụp đổ mode ($G$ tìm được một mode mà $D$ không thể phân loại và tạo ra nó mãi mãi), triệt tiêu gradient ($D$ học quá nhanh và $\log D$ bão hòa), huấn luyện không ổn định (tốc độ học, kích thước batch, bất cứ thứ gì).

## Variants that made GANs work

| Năm | Đổi mới | Cách khắc phục |
|------|------------|-----|
| 2015 | DCGAN | Conv/deconv, batch norm, LeakyReLU — kiến trúc ổn định đầu tiên. |
| 2017 | WGAN, WGAN-GP | Thay BCE bằng khoảng cách Wasserstein + phạt gradient. Khắc phục triệt tiêu gradient. |
| 2017 | Chuẩn hóa phổ | Ràng buộc Lipschitz cho bộ phân biệt. Vẫn được dùng trong các bộ phân biệt năm 2026. |
| 2018 | Progressive GAN | Huấn luyện độ phân giải thấp trước, thêm lớp. Những kết quả megapixel đầu tiên. |
| 2019 | StyleGAN / StyleGAN2 | Mạng ánh xạ + chuẩn hóa instance thích nghi. Tiên tiến nhất cho độ chân thực như ảnh chụp trong miền cố định. |
| 2021 | StyleGAN3 | Không alias, đẳng biến tịnh tiến — vẫn là tiêu chuẩn vàng về khuôn mặt vào năm 2026. |
| 2022 | StyleGAN-XL | Có điều kiện, nhận biết lớp, quy mô lớn hơn. |
| 2024 | R3GAN | Đổi thương hiệu với regularization mạnh hơn; hoạt động ở 1024² không cần thủ thuật. |

```figure
gan-minimax
```

## Build It

`code/main.py` huấn luyện một GAN nhỏ trên dữ liệu 1-D: một hỗn hợp hai Gaussian. Bộ sinh và bộ phân biệt là các MLP một lớp ẩn. Chúng ta triển khai truyền xuôi, truyền ngược và vòng lặp minimax bằng tay. Mục tiêu là thấy hai kiểu thất bại chính (sụp đổ mode + triệt tiêu gradient) khi chúng xảy ra.

### Step 1: non-saturating loss

Hàm mất mát Goodfellow nguyên bản $\log(1 - D(G(z)))$ tiến về 0 khi D phân loại hàng giả của G là giả với độ tự tin cao. Ở thời điểm đó gradient cho G về cơ bản bằng không — G không thể cải thiện. Dạng không bão hòa $-\log D(G(z))$ có tiệm cận ngược lại: nó tăng vọt khi D tự tin, cho G một tín hiệu mạnh.

```python
def g_loss(d_fake):
    # maximize log D(G(z))  <=>  minimize -log D(G(z))
    return -sum(math.log(max(p, 1e-8)) for p in d_fake) / len(d_fake)
```

### Step 2: one discriminator step per generator step

```python
for step in range(steps):
    # train D
    real_batch = sample_real(batch_size)
    fake_batch = [G(z) for z in sample_noise(batch_size)]
    update_D(real_batch, fake_batch)

    # train G
    fake_batch = [G(z) for z in sample_noise(batch_size)]  # fresh fakes
    update_G(fake_batch)
```

Hàng giả mới cho G, nếu không gradient đã cũ.

### Step 3: watch for mode collapse

```python
if step % 200 == 0:
    samples = [G(z) for z in sample_noise(500)]
    mode_a = sum(1 for s in samples if s < 0)
    mode_b = 500 - mode_a
    if min(mode_a, mode_b) < 50:
        print("  [!] mode collapse: one mode is starved")
```

Triệu chứng điển hình: một trong hai mode thật ngừng được sinh. Bộ phân biệt ngừng sửa nó vì nó chưa bao giờ được thấy như hàng giả.

## Pitfalls

- **Bộ phân biệt quá mạnh.** Giảm tốc độ học của D 2-5x, hoặc thêm nhiễu instance/lớp. Nếu D đạt độ chính xác >95%, G đã chết.
- **Bộ sinh ghi nhớ một mode.** Thêm nhiễu vào đầu vào D, dùng một lớp minibatch-discriminator, hoặc chuyển sang WGAN-GP.
- **Batch norm rò rỉ thống kê.** Batch thật + batch giả đi qua cùng lớp BN trộn các thống kê của chúng. Thay vào đó dùng instance norm hoặc spectral norm.
- **Thao túng Inception-score.** FID và IS nhiều nhiễu khi số mẫu thấp. Dùng ≥10k mẫu khi đánh giá.
- **Lấy mẫu một lần là một lời nói dối cho các tác vụ có điều kiện.** Bạn vẫn cần các mức CFG, thủ thuật truncation và lấy mẫu lại để có đầu ra dùng được.

## Use It

Bộ công cụ GAN năm 2026:

| Tình huống | Lựa chọn |
|-----------|------|
| Khuôn mặt người chân thực như ảnh chụp, tư thế cố định | StyleGAN3 (sắc nét nhất, nhỏ nhất) |
| Khuôn mặt anime / cách điệu | StyleGAN-XL hoặc Stable Diffusion LoRA |
| Chuyển đổi ảnh sang ảnh | Pix2Pix / CycleGAN (Giai đoạn 8 · 04) hoặc ControlNet (Giai đoạn 8 · 08) |
| Văn bản thành ảnh 1 bước nhanh | Chưng cất đối kháng của khuếch tán (SDXL-Turbo, SD3-Turbo) |
| Hàm mất mát cảm nhận bên trong một bộ huấn luyện khuếch tán | Bộ phân biệt GAN nhỏ trên các phần cắt ảnh |
| Bất cứ thứ gì đa phương thức, mở | Đừng — dùng khuếch tán hoặc flow matching |

GAN sắc nét nhưng hẹp. Một khi miền của bạn mở rộng — ảnh chụp, prompt văn bản tùy ý, video — hãy chuyển sang khuếch tán. Thủ thuật đối kháng tiếp tục tồn tại như một thành phần (hàm mất mát cảm nhận, chưng cất), không phải một bộ sinh độc lập.

## Ship It

Lưu `outputs/skill-gan-debugger.md`. Skill nhận một lần chạy GAN thất bại (các đường cong mất mát, lưới mẫu, kích thước tập dữ liệu) và xuất ra một danh sách xếp hạng các nguyên nhân có khả năng, cách khắc phục một dòng và một quy trình chạy lại.

## Exercises

1. **Dễ.** Chạy `code/main.py` với thiết lập mặc định. Sau đó đặt `D_LR = 5 * G_LR` và chạy lại. Hàm mất mát của G sụp xuống một hằng số nhanh đến mức nào?
2. **Trung bình.** Thay hàm mất mát BCE Goodfellow bằng hàm mất mát WGAN: $\text{loss}_D = \mathbb{E}[D(\text{fake})] - \mathbb{E}[D(\text{real})]$, $\text{loss}_G = -\mathbb{E}[D(\text{fake})]$, và cắt trọng số của D về `[-0.01, 0.01]`. Huấn luyện có ổn định hơn không? So sánh hội tụ theo thời gian thực.
3. **Khó.** Mở rộng ví dụ 1-D sang dữ liệu 2-D (hỗn hợp 8 Gaussian trên một vòng tròn). Theo dõi bộ sinh nắm bắt bao nhiêu trong 8 mode ở các bước 1k, 5k, 10k. Triển khai minibatch discrimination và đo lại.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Generator (Bộ sinh) | "G" | Mạng từ nhiễu sang mẫu, `G: z → x̂`. |
| Discriminator (Bộ phân biệt) | "D" | Bộ phân loại `D: x → [0, 1]`, thật so với giả. |
| Minimax | "Trò chơi" | $\min_G \max_D$ của một mục tiêu chung. |
| Non-saturating loss (Hàm mất mát không bão hòa) | "Cách khắc phục" | Dùng $-\log D(G(z))$ cho G thay vì $\log(1 - D(G(z)))$. |
| Mode collapse (Sụp đổ mode) | "G đã ghi nhớ một thứ" | Bộ sinh tạo ra ít đầu ra khác biệt dù dữ liệu đa dạng. |
| WGAN | "Wasserstein" | Thay BCE bằng khoảng cách Earth-Mover + phạt gradient; gradient trơn hơn. |
| Spectral norm (Chuẩn hóa phổ) | "Thủ thuật Lipschitz" | Ràng buộc chuẩn trọng số của D để chặn độ dốc của nó; ổn định huấn luyện. |
| StyleGAN | "Cái hoạt động được" | Mạng ánh xạ + AdaIN; tốt nhất trong nhóm cho khuôn mặt, vẫn vậy vào năm 2026. |

## Production note: one-shot inference is GAN's lasting advantage

GAN không còn thắng về chất lượng mẫu cho sinh trong miền mở, nhưng chúng vẫn thắng về chi phí suy luận. Theo từ vựng trong tài liệu suy luận production, một GAN có:

- **Không có giai đoạn prefill, không có decode.** Một lượt truyền xuôi $G(z)$ duy nhất. TTFT ≈ tổng độ trễ.
- **Không có áp lực KV-cache.** Trạng thái duy nhất là các trọng số. Kích thước batch bị chặn bởi bộ nhớ activation, không phải cache.
- **Continuous batching đơn giản.** Vì mọi yêu cầu có cùng FLOPs cố định, một batch tĩnh ở mức chiếm dụng mục tiêu của máy chủ thường là tối ưu. Không cần bộ lập lịch cho các yêu cầu đang xử lý.

Đây là lý do chưng cất GAN (SDXL-Turbo, SD3-Turbo, ADD, LCM) là kỹ thuật chủ đạo cho văn bản thành ảnh nhanh vào năm 2026: nó thu một pipeline khuếch tán 20-50 bước thành 1-4 lượt truyền xuôi kiểu GAN trong khi giữ phân phối của một mô hình khuếch tán cơ sở. Hàm mất mát đối kháng tồn tại như một nút điều chỉnh lúc huấn luyện để biến các bộ sinh chậm thành nhanh.

## Further Reading

- [Goodfellow et al. (2014). Generative Adversarial Nets](https://arxiv.org/abs/1406.2661) — bài báo GAN gốc.
- [Radford et al. (2015). Unsupervised Representation Learning with DCGAN](https://arxiv.org/abs/1511.06434) — kiến trúc ổn định đầu tiên.
- [Arjovsky, Chintala, Bottou (2017). Wasserstein GAN](https://arxiv.org/abs/1701.07875) — WGAN.
- [Miyato et al. (2018). Spectral Normalization for GANs](https://arxiv.org/abs/1802.05957) — SN.
- [Karras et al. (2020). Analyzing and Improving the Image Quality of StyleGAN](https://arxiv.org/abs/1912.04958) — StyleGAN2.
- [Karras et al. (2021). Alias-Free Generative Adversarial Networks](https://arxiv.org/abs/2106.12423) — StyleGAN3.
- [Sauer et al. (2023). Adversarial Diffusion Distillation](https://arxiv.org/abs/2311.17042) — SDXL-Turbo.
