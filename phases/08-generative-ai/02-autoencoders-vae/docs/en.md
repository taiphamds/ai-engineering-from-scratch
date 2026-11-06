# Autoencoders & Variational Autoencoders (VAE)

> Một autoencoder thông thường nén rồi tái dựng. Nó ghi nhớ. Nó không sinh. Thêm một thủ thuật — buộc mã trông như Gaussian — và bạn có một bộ lấy mẫu. Chính thủ thuật đó, phép tái tham số hóa `z = μ + σ·ε`, là lý do mọi mô hình ảnh khuếch tán tiềm ẩn và flow-matching mà bạn dùng vào năm 2026 đều có VAE ở đầu vào.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 3 · 07 (CNNs), Phase 8 · 01 (Taxonomy)
**Time:** ~75 minutes

## The Problem

Nén một chữ số MNIST 784 pixel thành một mã gồm 16 số, rồi tái dựng. Một autoencoder thông thường sẽ đạt điểm cao về MSE tái dựng nhưng không gian mã là một mớ lổn nhổn. Chọn một điểm ngẫu nhiên trong không gian mã, giải mã nó, và bạn nhận được nhiễu. Nó không có bộ lấy mẫu. Nó là một mô hình nén được khoác áo.

Điều bạn thực sự muốn là: (a) không gian mã là một phân phối gọn gàng, trơn mà bạn có thể lấy mẫu — chẳng hạn một Gaussian đẳng hướng `N(0, I)`, (b) giải mã bất kỳ mẫu nào cũng tạo ra một chữ số có vẻ hợp lý, và (c) encoder và decoder vẫn nén tốt. Ba mục tiêu, một kiến trúc, một hàm mất mát.

VAE năm 2013 của Kingma giải quyết điều này bằng cách huấn luyện encoder xuất ra một *phân phối* `q(z|x) = N(μ(x), σ(x)²)`, kéo phân phối đó về tiên nghiệm `N(0, I)` qua một khoản phạt KL, rồi lấy mẫu `z` từ `q(z|x)` trước khi giải mã. Khi suy luận, bỏ encoder, lấy mẫu `z ~ N(0, I)`, giải mã. Khoản phạt KL là thứ buộc không gian mã có cấu trúc.

Vào năm 2026 VAE hiếm khi được triển khai độc lập — chúng đã bị khuếch tán vượt qua về chất lượng ảnh thuần túy — nhưng chúng là encoder được lựa chọn cho mọi mô hình khuếch tán tiềm ẩn (SD 1/2/XL/3, Flux, AudioCraft). Học VAE và bạn học lớp đầu tiên vô hình của mọi pipeline ảnh bạn dùng.

## The Concept

![Autoencoder vs VAE: the reparameterization trick](../assets/vae.svg)

**Autoencoder.** `z = encoder(x)`, `x̂ = decoder(z)`, hàm mất mát = `||x - x̂||²`. Không gian mã không có cấu trúc.

**Encoder VAE.** Xuất ra hai vector: `μ(x)` và `log σ²(x)`. Chúng xác định `q(z|x) = N(μ, diag(σ²))`.

**Thủ thuật tái tham số hóa.** Lấy mẫu từ `q(z|x)` không khả vi. Viết lại mẫu thành `z = μ + σ·ε` trong đó `ε ~ N(0, I)`. Giờ `z` là một hàm tất định của `(μ, σ)` cộng với nhiễu không phải tham số — gradient truyền qua `μ` và `σ`.

**Hàm mất mát.** Cận dưới bằng chứng (ELBO), hai hạng tử:

```
loss = reconstruction + β · KL[q(z|x) || N(0, I)]
     = ||x - x̂||²  + β · Σ_i ( σ_i² + μ_i² - log σ_i² - 1 ) / 2
```

Tái dựng đẩy `x̂` về phía `x`. KL đẩy `q(z|x)` về tiên nghiệm. Chúng đánh đổi với nhau. β nhỏ (<1) = mẫu sắc nét hơn, không gian mã ít Gaussian hơn. β lớn (>1) = không gian mã gọn gàng hơn, mẫu mờ hơn. β-VAE (Higgins 2017) đã làm nút điều chỉnh này nổi tiếng và khởi đầu nghiên cứu disentanglement.

**Lấy mẫu.** Khi suy luận: lấy `z ~ N(0, I)`, truyền xuôi qua decoder. Một lượt truyền xuôi — không lấy mẫu lặp như khuếch tán.

```figure
vae-latent-grid
```

## Build It

`code/main.py` triển khai một VAE nhỏ không dùng numpy hay torch. Đầu vào là dữ liệu tổng hợp 8 chiều được lấy từ một hỗn hợp Gaussian 2 thành phần trong 8-D. Encoder và decoder là các MLP một lớp ẩn. Chúng ta triển khai kích hoạt tanh, lượt truyền xuôi, hàm mất mát và một lượt truyền ngược viết tay. Không phải production — là sư phạm.

### Step 1: encoder forward

```python
def encode(x, enc):
    h = tanh(add(matmul(enc["W1"], x), enc["b1"]))
    mu = add(matmul(enc["W_mu"], h), enc["b_mu"])
    log_sigma2 = add(matmul(enc["W_sig"], h), enc["b_sig"])
    return mu, log_sigma2
```

`log σ²` thay vì `σ` để đầu ra của mạng không bị ràng buộc (softplus của σ là một cái bẫy — gradient chết ở σ ≈ 0).

### Step 2: reparameterize and decode

```python
def reparameterize(mu, log_sigma2, rng):
    eps = [rng.gauss(0, 1) for _ in mu]
    sigma = [math.exp(0.5 * lv) for lv in log_sigma2]
    return [m + s * e for m, s, e in zip(mu, sigma, eps)]

def decode(z, dec):
    h = tanh(add(matmul(dec["W1"], z), dec["b1"]))
    return add(matmul(dec["W_out"], h), dec["b_out"])
```

### Step 3: the ELBO

```python
def elbo(x, x_hat, mu, log_sigma2, beta=1.0):
    recon = sum((a - b) ** 2 for a, b in zip(x, x_hat))
    kl = 0.5 * sum(math.exp(lv) + m * m - lv - 1 for m, lv in zip(mu, log_sigma2))
    return recon + beta * kl, recon, kl
```

KL dạng đóng chính xác vì cả hai phân phối đều là Gaussian. Đừng tích phân số. Mọi người vẫn phát hành mã với ước lượng KL monte-carlo vào năm 2026 — nó chậm hơn 3x mà không có lý do.

### Step 4: generate

```python
def sample(dec, z_dim, rng):
    z = [rng.gauss(0, 1) for _ in range(z_dim)]
    return decode(z, dec)
```

Đó là mô hình sinh. Năm dòng.

## Pitfalls

- **Sụp đổ hậu nghiệm.** Hạng tử KL đẩy `q(z|x) → N(0, I)` mạnh đến mức `z` không mang thông tin nào về `x`. Cách khắc phục: β-annealing (bắt đầu β=0, tăng dần đến 1), free bits, hoặc bỏ KL trên các chiều không hoạt động.
- **Mẫu mờ.** Độ hợp lý của decoder Gaussian ngụ ý tái dựng MSE, vốn tối ưu Bayes cho L2 (trung bình) — trung bình của một tập các chữ số có vẻ hợp lý là một chữ số nhòe. Cách khắc phục: decoder rời rạc (VQ-VAE, NVAE), hoặc chỉ dùng VAE làm encoder và xếp khuếch tán lên các latent (đây là điều Stable Diffusion làm).
- **β quá lớn, quá sớm.** Xem sụp đổ hậu nghiệm. Bắt đầu ở β≈0.01 và tăng dần.
- **Số chiều latent quá nhỏ.** 16-D hoạt động cho MNIST, 256-D cho ImageNet 256², 2048-D cho ImageNet 1024². VAE của Stable Diffusion nén 512×512×3 → 64×64×4 (hệ số giảm mẫu 32x về diện tích không gian, 32x về kênh).

## Use It

Bộ công cụ VAE năm 2026:

| Tình huống | Lựa chọn |
|-----------|------|
| Encoder latent ảnh cho khuếch tán | VAE Stable Diffusion (`sd-vae-ft-ema`) hoặc VAE Flux |
| Encoder latent âm thanh | Encodec (Meta), SoundStream, hoặc DAC (Descript) |
| Latent video | Các patch không gian-thời gian của Sora, Latte VAE, WAN VAE |
| Học biểu diễn tách biệt | β-VAE, FactorVAE, TCVAE |
| Latent rời rạc (cho mô hình hóa transformer) | VQ-VAE, RVQ (ResidualVQ) |
| Latent liên tục cho sinh | VAE thông thường, rồi điều kiện hóa một mô hình flow/khuếch tán trong không gian latent đó |

Một mô hình khuếch tán tiềm ẩn là một VAE có một mô hình khuếch tán nằm giữa encoder và decoder. VAE thực hiện nén thô, mô hình khuếch tán làm phần việc nặng. Cùng mô thức cho video (VAE + DiT khuếch tán video) và âm thanh (Encodec + transformer MusicGen).

## Ship It

Lưu `outputs/skill-vae-trainer.md`.

Skill nhận: đặc điểm tập dữ liệu + số chiều latent mục tiêu + cách dùng phía sau (tái dựng, lấy mẫu, hoặc đầu vào khuếch tán tiềm ẩn) và xuất ra: lựa chọn kiến trúc (thông thường/β/VQ/RVQ), lịch β, số chiều latent, độ hợp lý của decoder (Gaussian so với phân loại), và kế hoạch đánh giá (MSE tái dựng, KL mỗi chiều, khoảng cách Fréchet giữa `q(z|x)` và `N(0, I)`).

## Exercises

1. **Dễ.** Thay đổi `β` trong `code/main.py` thành `0.01`, `0.1`, `1.0`, `5.0`. Ghi lại MSE tái dựng và KL cuối cùng. β nào tốt nhất theo Pareto cho dữ liệu tổng hợp của bạn?
2. **Trung bình.** Thay độ hợp lý của decoder Gaussian bằng độ hợp lý Bernoulli (hàm mất mát cross-entropy). So sánh chất lượng mẫu trên một phiên bản nhị phân hóa của cùng dữ liệu tổng hợp.
3. **Khó.** Mở rộng `code/main.py` thành một VQ-VAE mini: thay `z` liên tục bằng tra cứu láng giềng gần nhất trong một codebook có K=32 mục. So sánh MSE tái dựng và báo cáo bao nhiêu mục codebook được dùng (sụp đổ codebook là có thật).

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Autoencoder (Bộ tự mã hóa) | Mạng mã hóa-giải mã | `x → z → x̂`, học MSE. Không có tính sinh. |
| VAE | AE có một bộ lấy mẫu | Encoder xuất ra một phân phối, khoản phạt KL định hình không gian mã. |
| ELBO | Cận dưới bằng chứng | `log p(x) ≥ recon - KL[q(z\|x) \|\| p(z)]`; chặt khi `q = p(z\|x)`. |
| Reparameterization (Tái tham số hóa) | `z = μ + σ·ε` | Viết lại nút ngẫu nhiên thành tất định + nhiễu thuần túy. Cho phép lan truyền ngược qua lấy mẫu. |
| Prior (Tiên nghiệm) | `p(z)` | Phân phối mục tiêu cho latent, thường là `N(0, I)`. |
| Posterior collapse (Sụp đổ hậu nghiệm) | "Hạng tử KL thắng" | Encoder bỏ qua `x`, xuất ra tiên nghiệm; decoder phải tưởng tượng. |
| β-VAE | Trọng số KL điều chỉnh được | `loss = recon + β·KL`. β cao hơn = tách biệt hơn nhưng mờ hơn. |
| VQ-VAE | Latent rời rạc | Thay `z` liên tục bằng vector codebook gần nhất; cho phép mô hình hóa transformer. |

## Production note: the VAE is the hottest path in a diffusion server

Trong một pipeline Stable Diffusion / Flux / SD3, VAE được gọi hai lần mỗi yêu cầu — một lần để mã hóa (nếu làm img2img / inpainting) và một lần để giải mã. Ở 1024², lượt decoder thường là đỉnh bộ nhớ activation đơn lẻ lớn nhất trong toàn bộ pipeline vì nó tăng mẫu các latent `128×128×16` trở lại `1024×1024×3`. Hai hệ quả thực tiễn:

- **Chia lát hoặc chia ô việc giải mã.** `diffusers` cung cấp `pipe.vae.enable_slicing()` và `pipe.vae.enable_tiling()`. Chia ô đánh đổi một lỗi giả đường nối nhỏ để có bộ nhớ `O(tile²)` thay vì `O(H·W)`. Thiết yếu cho 1024²+ trên GPU phổ thông.
- **Decoder bf16, tính toán số fp32 cho lần đổi kích thước cuối.** VAE SD 1.x được phát hành ở fp32 và *âm thầm tạo ra NaN* khi ép sang fp16 ở 1024²+. SDXL cung cấp `madebyollin/sdxl-vae-fp16-fix` — luôn ưu tiên biến thể fp16-fix hoặc dùng bf16.

## Further Reading

- [Kingma & Welling (2013). Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114) — bài báo VAE.
- [Higgins et al. (2017). β-VAE: Learning Basic Visual Concepts with a Constrained Variational Framework](https://openreview.net/forum?id=Sy2fzU9gl) — β-VAE tách biệt.
- [van den Oord et al. (2017). Neural Discrete Representation Learning](https://arxiv.org/abs/1711.00937) — VQ-VAE.
- [Vahdat & Kautz (2021). NVAE: A Deep Hierarchical Variational Autoencoder](https://arxiv.org/abs/2007.03898) — VAE ảnh tiên tiến nhất.
- [Rombach et al. (2022). High-Resolution Image Synthesis with Latent Diffusion Models](https://arxiv.org/abs/2112.10752) — Stable Diffusion; VAE làm encoder.
- [Défossez et al. (2022). High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) — Encodec, tiêu chuẩn VAE âm thanh.
