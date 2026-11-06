# Flow Matching & Rectified Flows

> Các mô hình khuếch tán mất 20-50 bước lấy mẫu vì chúng đi theo một đường cong từ nhiễu đến dữ liệu. Flow matching (Lipman và cộng sự, 2023) và rectified flow (Liu và cộng sự, 2022) huấn luyện các đường đi thẳng. Đường đi thẳng hơn nghĩa là ít bước hơn nghĩa là suy luận nhanh hơn. Stable Diffusion 3, Flux.1 và AudioCraft 2 đều chuyển sang flow matching vào năm 2024.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 8 · 06 (DDPM), Phase 1 · Calculus
**Time:** ~45 minutes

## The Problem

Quá trình ngược của DDPM là một bước đi ngẫu nhiên 1000 bước từ `N(0, I)` trở lại phân phối dữ liệu. DDIM thu nó thành 20-50 bước tất định. Bạn muốn ít bước hơn — lý tưởng là một. Trở ngại là ODE giải quá trình ngược bị cứng; đường đi cong.

Nếu bạn có thể huấn luyện mô hình sao cho đường đi từ nhiễu đến dữ liệu là một *đường thẳng*, một bước Euler duy nhất từ `t=1` đến `t=0` sẽ hoạt động. Flow matching xây dựng điều này trực tiếp: định nghĩa một nội suy đường thẳng từ `x_1 ∼ N(0, I)` đến `x_0 ∼ data`, huấn luyện một trường vector `v_θ(x, t)` để khớp đạo hàm theo thời gian của nó, tích phân khi suy luận.

Rectified flow (Liu 2022) đi xa hơn: lặp lại việc làm thẳng các đường đi bằng một quy trình reflow tạo ra một ODE dần gần tuyến tính hơn. Sau hai lần lặp reflow, một bộ lấy mẫu 2 bước đạt chất lượng DDPM 50 bước.

## The Concept

![Flow matching: straight-line interpolation between noise and data](../assets/flow-matching.svg)

### Straight-line flow

Định nghĩa:

```
x_t = t · x_1 + (1 - t) · x_0,   t ∈ [0, 1]
```

trong đó `x_0 ~ data` và `x_1 ~ N(0, I)`. Đạo hàm theo thời gian dọc đường thẳng này là hằng số:

```
dx_t / dt = x_1 - x_0
```

Định nghĩa một trường vector nơ-ron `v_θ(x_t, t)` và huấn luyện nó để khớp đạo hàm này:

```
L = E_{x_0, x_1, t} || v_θ(x_t, t) - (x_1 - x_0) ||²
```

Đây là hàm mất mát **flow matching có điều kiện** (Lipman 2023). Huấn luyện không cần mô phỏng: bạn không bao giờ triển khai các bước ODE. Chỉ lấy mẫu `(x_0, x_1, t)` và hồi quy.

### Sampling

Khi suy luận, tích phân trường vector được học *ngược* theo thời gian:

```
x_{t-Δt} = x_t - Δt · v_θ(x_t, t)
```

Bắt đầu ở `x_1 ~ N(0, I)`, bước Euler xuống `t=0`.

### Rectified flow (Liu 2022)

Flow đường thẳng hoạt động nhưng các đường đi được học *thực ra không thẳng* — chúng cong vì nhiều `x_0` có thể ánh xạ đến cùng một `x_1`. Bước reflow của rectified flow:

1. Huấn luyện mô hình flow v_1 với các ghép cặp ngẫu nhiên.
2. Lấy mẫu N cặp `(x_1, x_0)` bằng cách tích phân v_1 từ `x_1` đến điểm đến `x_0` của nó.
3. Huấn luyện v_2 trên các ví dụ ghép cặp đó. Vì các cặp giờ đã "khớp ODE", đường nội suy thẳng giữa chúng thực sự phẳng hơn.
4. Lặp lại.

Trong thực tế 2 lần lặp reflow đưa bạn đến gần tuyến tính, cho phép suy luận 2-4 bước. SDXL-Turbo, SD3-Turbo, LCM đều là các mô hình được chưng cất từ flow-matching.

### Why this won for images in 2024

Ba lý do:

1. **Huấn luyện không cần mô phỏng** — không triển khai các bước ODE trong huấn luyện, dễ triển khai.
2. **Hình học hàm mất mát tốt hơn** — các đường đi thẳng có tỷ lệ tín hiệu trên nhiễu nhất quán, trong khi hàm mất mát ε của DDPM có SNR kém ở các đầu lịch.
3. **Suy luận nhanh hơn** — 4-8 bước ở chất lượng SDXL-Turbo; 1 bước với consistency distillation.

## Flow matching vs DDPM — the exact connection

Flow matching với một đường đi Gaussian có điều kiện là khuếch tán *với một lịch nhiễu cụ thể*. Chọn lịch `x_t = α(t) x_0 + σ(t) x_1` và flow matching khôi phục khuếch tán được viết lại theo Stratonovich với `v = α'·x_0 - σ'·x_1`. Hai cách tương đương về đại số với các đường đi Gaussian.

Những gì flow matching thêm vào: *sự rõ ràng* của mục tiêu (một vận tốc thuần túy), một hàm mất mát gọn hơn, và sự cho phép thử nghiệm các hàm nội suy phi Gaussian.

```figure
normalizing-flow
```

## Build It

`code/main.py` triển khai flow matching 1-D trên một hỗn hợp Gaussian hai mode. Trường vector `v_θ(x, t)` là một MLP nhỏ được huấn luyện với mục tiêu đường thẳng. Khi suy luận, tích phân 1, 2, 4 và 20 bước Euler và so sánh chất lượng mẫu.

### Step 1: training loss

```python
def train_step(x0, net, rng, lr):
    x1 = rng.gauss(0, 1)
    t = rng.random()
    x_t = t * x1 + (1 - t) * x0
    target = x1 - x0
    pred = net_forward(x_t, t)
    loss = (pred - target) ** 2
    # backprop + update
```

### Step 2: multi-step inference

```python
def sample(net, num_steps):
    x = rng.gauss(0, 1)
    for i in range(num_steps):
        t = 1.0 - i / num_steps
        dt = 1.0 / num_steps
        x -= dt * net_forward(x, t)
    return x
```

### Step 3: compare step counts

Kỳ vọng bộ lấy mẫu 4 bước đã đạt chất lượng 20 bước — một điều lớn đối với độ trễ.

## Pitfalls

- **Tham số hóa thời gian.** Flow matching dùng `t ∈ [0, 1]` với `t=0` ở dữ liệu, `t=1` ở nhiễu. DDPM dùng `t ∈ [0, T]` với `t=0` ở dữ liệu, `t=T` ở nhiễu. Cùng hướng, khác thang đo. Các bài báo liên tục làm sai điều này.
- **Lựa chọn lịch.** Đường thẳng của rectified flow là "lịch" flow-matching, nhưng bạn có thể dùng lấy mẫu t cosine hoặc logit-normal (SD3 làm điều này) để bao phủ thang đo tốt hơn.
- **Chi phí reflow.** Sinh tập dữ liệu ghép cặp cho reflow là một lượt suy luận đầy đủ mỗi mẫu. Chỉ làm reflow khi bạn thực sự cần suy luận 1-2 bước.
- **Classifier-free guidance vẫn áp dụng.** Chỉ đổi ε thành v trong tổ hợp tuyến tính: `v_cfg = (1+w) v_cond - w v_uncond`.

## Use It

| Trường hợp sử dụng | Bộ công cụ năm 2026 |
|----------|-----------|
| Văn bản thành ảnh, chất lượng tốt nhất | Flow matching: SD3, Flux.1-dev |
| Văn bản thành ảnh, 1-4 bước | Flow matching được chưng cất: Flux.1-schnell, SD3-Turbo, SDXL-Turbo |
| Suy luận thời gian thực | Consistency distillation từ một mô hình cơ sở flow-matched (LCM, PCM) |
| Sinh âm thanh | Flow matching: Stable Audio 2.5, AudioCraft 2 |
| Sinh video | Flow matching trộn với khuếch tán (Sora, Veo, Stable Video) |
| Khoa học / vật lý (quỹ đạo hạt, phân tử) | Flow matching + trường vector đẳng biến |

Bất cứ khi nào một bài báo nói "nhanh hơn khuếch tán" trong giai đoạn 2025-2026, gần như luôn là flow matching + chưng cất.

## Ship It

Lưu `outputs/skill-fm-tuner.md`. Skill nhận một đặc tả mô hình kiểu khuếch tán và chuyển nó thành một cấu hình huấn luyện flow-matching: lựa chọn lịch, phân phối lấy mẫu thời gian (đều / logit-normal), optimizer, kế hoạch reflow, số bước mục tiêu, quy trình đánh giá.

## Exercises

1. **Dễ.** Chạy `code/main.py` và so sánh MSE 1 bước so với 20 bước so với phân phối dữ liệu thật.
2. **Trung bình.** Chuyển từ lấy mẫu `t` đều sang logit-normal (tập trung lấy mẫu ở t giữa). Chất lượng mô hình có cải thiện không?
3. **Khó.** Triển khai một lần lặp reflow: sinh các cặp (x_0, x_1) bằng cách tích phân mô hình đầu tiên, huấn luyện một mô hình thứ hai trên các cặp, và so sánh chất lượng mẫu 1 bước.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Flow matching | "Khuếch tán đường thẳng" | Huấn luyện `v_θ(x, t)` để khớp `x_1 - x_0` dọc một hàm nội suy. |
| Rectified flow | "Reflow" | Quy trình lặp làm thẳng các flow đã học. |
| Velocity field (Trường vận tốc) | "v_θ" | Đầu ra của mô hình — hướng di chuyển `x_t`. |
| Straight-line interpolant (Hàm nội suy đường thẳng) | "Đường đi" | `x_t = (1-t)·x_0 + t·x_1`; đạo hàm mục tiêu đơn giản. |
| Euler sampler (Bộ lấy mẫu Euler) | "Bộ giải ODE bậc 1" | Bộ tích phân đơn giản nhất; hoạt động tốt khi các đường đi thẳng. |
| Logit-normal t | "Lấy mẫu SD3" | Tập trung lấy mẫu `t` về các giá trị giữa nơi gradient mạnh nhất. |
| Consistency distillation (Chưng cất nhất quán) | "Bộ lấy mẫu 1 bước" | Huấn luyện một mô hình học trò ánh xạ bất kỳ `x_t` nào trực tiếp đến `x_0`. |
| CFG with velocity (CFG với vận tốc) | "v-CFG" | `v_cfg = (1+w) v_cond - w v_uncond`; cùng thủ thuật, biến mới. |

## Production note: Flux.1-schnell is flow matching at its fastest

Chiến thắng production của flow matching là Flux.1-schnell — một DiT flow-matched được chưng cất xuống 1-4 bước suy luận trong khi giữ chất lượng cấp Flux-dev. Notebook "Run Flux on an 8GB machine" của Niels là công thức triển khai tham chiếu: mã hóa T5 + CLIP, khử nhiễu MMDiT đã lượng tử hóa (trong 4 bước cho schnell so với 50 cho dev), giải mã VAE. Hạch toán chi phí:

| Biến thể | Số bước | Độ trễ ở 1024² trên L4 | Tổng FLOPs (tương đối) |
|---------|-------|------------------------|------------------------|
| Flux.1-dev (thô) | 50 | ~15 s | 1.0× |
| Flux.1-schnell | 4 | ~1.2 s | 0.08× (nhanh hơn 12×) |
| SDXL-base | 30 | ~4 s | 0.25× |
| SDXL-Lightning 2 bước | 2 | ~0.3 s | 0.03× |

Quy tắc production: **mô hình cơ sở flow-matched + chưng cất = mặc định năm 2026 cho văn bản thành ảnh nhanh.** Mọi nhà cung cấp lớn đều cung cấp tổ hợp này: SD3-Turbo (SD3 + flow + chưng cất), Flux-schnell (Flux-dev + làm thẳng rectified-flow), CogView-4-Flash. Các mô hình cơ sở khuếch tán thuần túy chỉ tồn tại cho các checkpoint đời cũ.

## Further Reading

- [Liu, Gong, Liu (2022). Flow Straight and Fast: Learning to Generate and Transfer Data with Rectified Flow](https://arxiv.org/abs/2209.03003) — rectified flow.
- [Lipman et al. (2023). Flow Matching for Generative Modeling](https://arxiv.org/abs/2210.02747) — flow matching.
- [Esser et al. (2024). Scaling Rectified Flow Transformers for High-Resolution Image Synthesis](https://arxiv.org/abs/2403.03206) — SD3, rectified flow ở quy mô lớn.
- [Albergo, Vanden-Eijnden (2023). Stochastic Interpolants](https://arxiv.org/abs/2303.08797) — khung tổng quát bao phủ FM + khuếch tán.
- [Song et al. (2023). Consistency Models](https://arxiv.org/abs/2303.01469) — chưng cất 1 bước của khuếch tán / flow.
- [Sauer et al. (2023). Adversarial Diffusion Distillation (SDXL-Turbo)](https://arxiv.org/abs/2311.17042) — biến thể turbo.
- [Black Forest Labs (2024). Flux.1 models](https://blackforestlabs.ai/announcing-black-forest-labs/) — flow matching trong production.
