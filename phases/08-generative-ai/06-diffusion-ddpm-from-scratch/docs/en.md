# Diffusion Models — DDPM from Scratch

> Ho, Jain, Abbeel (2020) cho lĩnh vực này một công thức mà nó không thể bỏ. Phá hủy dữ liệu bằng nhiễu qua một nghìn bước nhỏ. Huấn luyện một mạng nơ-ron để dự đoán nhiễu. Đảo ngược quá trình khi suy luận. Ngày nay mọi mô hình ảnh, video, 3D và âm nhạc phổ biến đều chạy trên vòng lặp này, có thể có flow matching hoặc các thủ thuật consistency ở trên.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 3 · 02 (Backprop), Phase 8 · 02 (VAE)
**Time:** ~75 minutes

## The Problem

Bạn muốn một bộ lấy mẫu cho `p_data(x)`. GAN chơi một trò chơi minimax thường phân kỳ. VAE tạo ra các mẫu mờ từ một decoder Gaussian. Điều bạn thực sự muốn là một mục tiêu huấn luyện (a) là một hàm mất mát ổn định duy nhất (không điểm yên ngựa, không minimax), (b) là một cận dưới của `log p(x)` (để bạn có các độ hợp lý), và (c) các mẫu đạt chất lượng SOTA.

Sohl-Dickstein và cộng sự (2015) có một câu trả lời lý thuyết: định nghĩa một chuỗi Markov `q(x_t | x_{t-1})` dần thêm nhiễu Gaussian, và huấn luyện một chuỗi ngược `p_θ(x_{t-1} | x_t)` để khử nhiễu. Ho, Jain, Abbeel (2020) cho thấy hàm mất mát có thể đơn giản hóa thành một dòng — dự đoán nhiễu — và làm rõ phần toán học. Năm 2020 đây là một điều lạ. Năm 2021 nó tạo ra các mẫu tiên tiến nhất. Năm 2022 nó trở thành Stable Diffusion. Năm 2026 nó là nền tảng.

## The Concept

![DDPM: forward noise, reverse denoise](../assets/ddpm.svg)

**Quá trình xuôi `q`.** Thêm nhiễu Gaussian trong `T` bước nhỏ. Dạng đóng — lý do toán học tính toán được — là bước tích lũy cũng là Gaussian:

```
q(x_t | x_0) = N( sqrt(α̅_t) · x_0,  (1 - α̅_t) · I )
```

trong đó `α̅_t = ∏_{s=1..t} (1 - β_s)` cho một lịch `β_t`. Chọn `β_t` từ 1e-4 đến 0.02 tuyến tính qua T=1000 bước và `x_T` xấp xỉ `N(0, I)`.

**Quá trình ngược `p_θ`.** Học một mạng nơ-ron `ε_θ(x_t, t)` dự đoán nhiễu đã được thêm. Với `x_t`, khử nhiễu bằng:

```
x_{t-1} = (1 / sqrt(α_t)) · ( x_t - (β_t / sqrt(1 - α̅_t)) · ε_θ(x_t, t) )  +  σ_t · z
```

trong đó `σ_t` là `sqrt(β_t)` hoặc một phương sai được học. Biểu thức trông xấu nhưng chỉ là đại số — giải tìm `x_{t-1}` với hậu nghiệm `q(x_{t-1} | x_t, x_0)` và thay `x_0` bằng ước lượng dự đoán từ nhiễu của nó.

**Hàm mất mát huấn luyện.**

```
L_simple = E_{x_0, t, ε} [ || ε - ε_θ( sqrt(α̅_t) · x_0 + sqrt(1 - α̅_t) · ε,  t ) ||² ]
```

Lấy mẫu `x_0` từ dữ liệu, chọn một `t` ngẫu nhiên, lấy mẫu `ε ~ N(0, I)`, tính `x_t` có nhiễu trong một lần qua dạng đóng, và hồi quy theo nhiễu. Một hàm mất mát, không minimax, không KL, không thủ thuật tái tham số hóa.

**Lấy mẫu.** Bắt đầu `x_T ~ N(0, I)`. Lặp bước ngược từ `t = T` đến `1`. Xong.

## Why it works

Ba trực giác:

1. **Khử nhiễu dễ; sinh khó.** Ở `t=T`, dữ liệu là nhiễu thuần túy — mạng phải giải một bài toán đơn giản. Ở `t=0`, mạng chỉ phải làm sạch vài pixel. Ở `t` trung gian, bài toán khó nhưng mạng có nhiều gradient truyền qua cùng các trọng số từ mọi mức nhiễu.

2. **Score matching ngụy trang.** Vincent (2011) chứng minh dự đoán nhiễu tương đương với ước lượng `∇_x log q(x_t | x_0)`, tức *score*. SDE ngược dùng score này để đi lên theo gradient mật độ — một bước đi ngẫu nhiên có hướng dẫn về các vùng xác suất cao.

3. **ELBO rút về MSE đơn giản.** Cận dưới biến phân đầy đủ có một hạng tử KL cho mỗi bước thời gian. Với cách tham số hóa của DDPM, các hạng tử KL đó đơn giản hóa thành MSE trên dự đoán nhiễu với các hệ số cụ thể; Ho bỏ các hệ số (gọi nó là hàm mất mát "đơn giản") và chất lượng *cải thiện*.

```figure
diffusion-denoise
```

## Build It

`code/main.py` triển khai một DDPM 1-D. Dữ liệu là một hỗn hợp hai mode. "Mạng" là một MLP nhỏ nhận `(x_t, t)` và xuất ra nhiễu dự đoán. Huấn luyện là hàm mất mát một dòng. Lấy mẫu lặp chuỗi ngược.

### Step 1: the forward schedule (closed form)

```python
betas = [1e-4 + (0.02 - 1e-4) * t / (T - 1) for t in range(T)]
alphas = [1 - b for b in betas]
alpha_bars = []
cum = 1.0
for a in alphas:
    cum *= a
    alpha_bars.append(cum)
```

### Step 2: sample `x_t` in one shot

```python
def forward_sample(x0, t, alpha_bars, rng):
    a_bar = alpha_bars[t]
    eps = rng.gauss(0, 1)
    x_t = math.sqrt(a_bar) * x0 + math.sqrt(1 - a_bar) * eps
    return x_t, eps
```

### Step 3: one training step

```python
def train_step(x0, model, alpha_bars, rng):
    t = rng.randrange(T)
    x_t, eps = forward_sample(x0, t, alpha_bars, rng)
    eps_hat = model_forward(model, x_t, t)
    loss = (eps - eps_hat) ** 2
    return loss, gradient_step(model, ...)
```

### Step 4: reverse sampling

```python
def sample(model, alpha_bars, T, rng):
    x = rng.gauss(0, 1)
    for t in range(T - 1, -1, -1):
        eps_hat = model_forward(model, x, t)
        beta_t = 1 - alphas[t]
        x = (x - beta_t / math.sqrt(1 - alpha_bars[t]) * eps_hat) / math.sqrt(alphas[t])
        if t > 0:
            x += math.sqrt(beta_t) * rng.gauss(0, 1)
    return x
```

Với một bài toán 1-D có 40 bước thời gian và một MLP 24 đơn vị, cách này học hỗn hợp hai mode trong ~200 epoch.

## Time conditioning

Mạng cần biết nó đang khử nhiễu bước thời gian nào. Hai lựa chọn tiêu chuẩn:

- **Embedding hình sin.** Như mã hóa vị trí Transformer. `embed(t) = [sin(t/ω_0), cos(t/ω_0), sin(t/ω_1), ...]`. Truyền qua một MLP, broadcast vào mạng.
- **Điều kiện hóa Film / group-norm.** Chiếu embedding thành scale/bias theo kênh (FiLM) ở mỗi khối.

Mã đồ chơi của chúng ta dùng hình sin → nối. U-Net production dùng FiLM.

## Pitfalls

- **Lịch rất quan trọng.** `β` tuyến tính là mặc định DDPM nhưng lịch cosine (Nichol & Dhariwal, 2021) cho FID tốt hơn với cùng tính toán. Đổi lịch nếu chất lượng chững lại.
- **Embedding bước thời gian mong manh.** Truyền `t` thô dạng float hoạt động với 1-D đồ chơi nhưng thất bại với ảnh; luôn dùng một embedding đúng cách.
- **V-prediction so với ε-prediction.** Với các chế độ hẹp (t rất nhỏ hoặc rất lớn), `ε` có tỷ lệ tín hiệu trên nhiễu kém. V-prediction (`v = α·ε - σ·x`) ổn định hơn; SDXL, SD3 và Flux dùng nó.
- **Classifier-free guidance.** Khi suy luận, tính cả `ε` có điều kiện và vô điều kiện, rồi `ε_cfg = (1 + w) · ε_cond - w · ε_uncond` với `w ≈ 3-7`. Được trình bày trong Bài 08.
- **1000 bước là nhiều.** Production dùng DDIM (20-50 bước), DPM-Solver (10-20 bước), hoặc chưng cất (1-4 bước). Xem Bài 12.

## Use It

| Vai trò | Bộ công cụ điển hình năm 2026 |
|------|-----------------------|
| Khuếch tán trong không gian pixel ảnh (nhỏ, đồ chơi) | DDPM + U-Net |
| Khuếch tán tiềm ẩn ảnh | Encoder VAE + U-Net hoặc DiT (Bài 07) |
| Khuếch tán tiềm ẩn video | DiT không gian-thời gian (Sora, Veo, WAN) |
| Khuếch tán tiềm ẩn âm thanh | Encodec + diffusion transformer |
| Khoa học (phân tử, protein, vật lý) | Khuếch tán đẳng biến (EDM, RFdiffusion, AlphaFold3) |

Khuếch tán là backbone sinh phổ quát. Flow matching (Bài 13) là đối thủ giai đoạn 2024-2026 thường thắng về tốc độ suy luận ở cùng chất lượng.

## Ship It

Lưu `outputs/skill-diffusion-trainer.md`. Skill nhận một tập dữ liệu + ngân sách tính toán và xuất ra: lịch (tuyến tính/cosine/sigmoid), mục tiêu dự đoán (ε/v/x), số bước, mức guidance, họ bộ lấy mẫu, và một quy trình đánh giá.

## Exercises

1. **Dễ.** Thay T từ 40 thành 10 trong `code/main.py`. Chất lượng mẫu (histogram trực quan của đầu ra) suy giảm thế nào? Ở T nào cấu trúc hai mode sụp đổ?
2. **Trung bình.** Chuyển từ ε-prediction sang v-prediction. Suy ra lại bước ngược. So sánh chất lượng mẫu cuối cùng.
3. **Khó.** Thêm classifier-free guidance. Điều kiện hóa theo một nhãn lớp `c ∈ {0, 1}`, bỏ nó 10% thời gian khi huấn luyện, và lúc lấy mẫu dùng `ε = (1+w)·ε_cond - w·ε_uncond`. Đo tỷ lệ trúng mode có điều kiện ở `w = 0, 1, 3, 7`.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Forward process (Quá trình xuôi) | "Thêm nhiễu" | Chuỗi Markov cố định `q(x_t \| x_{t-1})` phá hủy dữ liệu. |
| Reverse process (Quá trình ngược) | "Khử nhiễu" | Chuỗi được học `p_θ(x_{t-1} \| x_t)` tái dựng dữ liệu. |
| β schedule (Lịch β) | "Thang nhiễu" | Phương sai mỗi bước; tuyến tính, cosine, hoặc sigmoid. |
| α̅ | "Alpha bar" | Tích tích lũy `∏(1 - β)`; cho `x_t` dạng đóng từ `x_0`. |
| Simple loss (Hàm mất mát đơn giản) | "MSE trên nhiễu" | `\|\|ε - ε_θ(x_t, t)\|\|²`; mọi suy dẫn biến phân đều rút về đây. |
| ε-prediction (Dự đoán ε) | "Dự đoán nhiễu" | Đầu ra là nhiễu được thêm; DDPM tiêu chuẩn. |
| V-prediction (Dự đoán V) | "Dự đoán vận tốc" | Đầu ra là `α·ε - σ·x`; điều kiện hóa tốt hơn xuyên suốt t. |
| DDPM | "Bài báo" | Ho và cộng sự 2020; β tuyến tính, 1000 bước, U-Net. |
| DDIM | "Bộ lấy mẫu tất định" | Bộ lấy mẫu phi Markov, 20-50 bước, cùng mục tiêu huấn luyện. |
| Classifier-free guidance | "CFG" | Trộn các dự đoán nhiễu có điều kiện và vô điều kiện để khuếch đại điều kiện hóa. |

## Production note: diffusion inference is a step-count problem

Bài báo DDPM chạy T=1000 bước ngược. Không ai triển khai điều đó trong production. Mọi bộ công cụ suy luận thực đều chọn một trong ba chiến lược — và mỗi chiến lược đều tương ứng rõ ràng với cách production đặt vấn đề "độ trễ đến từ đâu":

1. **Bộ lấy mẫu nhanh hơn, cùng mô hình.** DDIM (20-50 bước), DPM-Solver++ (10-20), UniPC (8-16). Thay thế trực tiếp vòng lặp ngược; các trọng số `ε_θ` đã huấn luyện không bị chạm đến. Giảm độ trễ 20-50×.
2. **Chưng cất.** Huấn luyện một mô hình học trò khớp mô hình thầy trong ít bước hơn: Progressive Distillation (2 → 1), Consistency Models (tùy ý → 1-4), LCM, SDXL-Turbo, SD3-Turbo. Giảm độ trễ thêm 5-10×, cần huấn luyện lại.
3. **Cache và biên dịch.** `torch.compile(unet, mode="reduce-overhead")`, các backend khuếch tán của TensorRT-LLM, attention `xformers`/SDPA, trọng số bf16. Giảm độ trễ mỗi bước ~2×. Kết hợp với (1) và (2).

Với một máy chủ khuếch tán production, cuộc trao đổi về ngân sách giống như tài liệu production mô tả cho LLM: độ trễ là `num_steps × step_cost + VAE_decode`, thông lượng là `batch_size × (num_steps × step_cost)^-1`. TTFT nhỏ (một bước); tương đương TPOT là toàn bộ thời gian phản hồi vì sinh ảnh là "tất cả cùng lúc" từ góc nhìn người dùng.

## Further Reading

- [Sohl-Dickstein et al. (2015). Deep Unsupervised Learning using Nonequilibrium Thermodynamics](https://arxiv.org/abs/1503.03585) — bài báo khuếch tán, đi trước thời đại.
- [Ho, Jain, Abbeel (2020). Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239) — DDPM.
- [Song, Meng, Ermon (2021). Denoising Diffusion Implicit Models](https://arxiv.org/abs/2010.02502) — DDIM, ít bước hơn.
- [Nichol & Dhariwal (2021). Improved DDPM](https://arxiv.org/abs/2102.09672) — lịch cosine, phương sai được học.
- [Dhariwal & Nichol (2021). Diffusion Models Beat GANs on Image Synthesis](https://arxiv.org/abs/2105.05233) — guidance bằng bộ phân loại.
- [Ho & Salimans (2022). Classifier-Free Diffusion Guidance](https://arxiv.org/abs/2207.12598) — CFG.
- [Karras et al. (2022). Elucidating the Design Space of Diffusion-Based Generative Models (EDM)](https://arxiv.org/abs/2206.00364) — ký hiệu thống nhất, công thức rõ ràng nhất.
