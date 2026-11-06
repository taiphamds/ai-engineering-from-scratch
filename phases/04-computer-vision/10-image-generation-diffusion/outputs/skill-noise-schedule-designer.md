---
name: skill-noise-schedule-designer
description: Produce a linear, cosine, or sigmoid beta schedule given T and target corruption level, plus SNR plot
version: 1.0.0
phase: 4
lesson: 10
tags: [computer-vision, diffusion, noise-schedule, training]
---

# Noise Schedule Designer

Một lịch beta kiểm soát lượng tín hiệu được giữ ở mỗi bước khuếch tán. Các lịch kém giới hạn hiệu quả huấn luyện và chất lượng mẫu ở mọi quyết định phía sau.

## When to use

- Bắt đầu một lần huấn luyện khuếch tán mới và chọn T và beta.
- Gỡ lỗi một mô hình khuếch tán tạo các mẫu mờ (lịch quá mạnh) hoặc không học cấu trúc (lịch quá nhẹ).
- So sánh các thiết kế giữa các bài báo báo cáo lịch khác nhau.

## Inputs

- `T`: số bước thời gian, thường 100-1000.
- `type`: linear | cosine | sigmoid.
- `target_alpha_bar_final`: tỷ lệ tín hiệu giữ tại t=T, mặc định 0.001 (99.9% bị làm hỏng).
- `image_resolution` tùy chọn — các hình ảnh lớn hơn hưởng lợi từ lịch làm hỏng chậm hơn (cosine hoặc lịch dịch chuyển).

## Schedule formulas

### Linear
```
beta_t = beta_start + (beta_end - beta_start) * (t - 1) / (T - 1)
```
Mặc định: beta_start=1e-4, beta_end=0.02 (bài báo DDPM).

### Cosine (Nichol & Dhariwal, 2021)
```
alpha_bar_t = cos^2((t/T + s) / (1 + s) * pi/2)
beta_t = 1 - alpha_bar_t / alpha_bar_{t-1}
```
s = 0.008. Giữ tín hiệu lâu hơn; tốt hơn ở số bước thấp.

### Sigmoid
```
alpha_bar_t = 1 / (1 + exp(k * (t/T - 0.5)))
```
k = 6 tới 12. Trung gian tốt; được dùng bởi một số biến thể SDXL.

## Steps

1. Tính các beta theo công thức.
2. Tính trước `alphas`, `alphas_cumprod`, `sqrt_alphas_cumprod`, `sqrt_one_minus_alphas_cumprod`.
3. Tính SNR_t = alpha_bar_t / (1 - alpha_bar_t); tạo một tóm tắt SNR theo thời gian.
4. Xác minh `alphas_cumprod[T-1]` nằm trong 10% của `target_alpha_bar_final`; nếu không điều chỉnh beta_end (tuyến tính), s (cosine) hoặc k (sigmoid) rồi thử lại.
5. Báo cáo ba mốc kiểm tra:
   - `t=T*0.25` — làm hỏng ban đầu
   - `t=T*0.5` — giữa chừng
   - `t=T*0.75` — gần cuối

## Report

```
[schedule]
  type:   <name>
  T:      <int>
  beta_start: <float>   beta_end: <float>

[signal retention]
  t=0.25T:  alpha_bar=<X>  SNR=<X>
  t=0.5T:   alpha_bar=<X>  SNR=<X>
  t=0.75T:  alpha_bar=<X>  SNR=<X>
  t=T:      alpha_bar=<X>  SNR=<X>

[warnings]
  - <if alpha_bar collapses before 0.75T>
  - <if beta_end produces NaN in log-SNR>
```

## Rules

- Không bao giờ xuất lịch có bất kỳ `alpha_bar_t <= 0` nào; chặn các giá trị dưới 1e-5 và cảnh báo.
- Cosine là khuyến nghị mặc định cho lấy mẫu số bước thấp (< 30 bước).
- Tuyến tính là mặc định cho `quality_target == research` — các đường cơ sở DDPM được báo cáo với lịch tuyến tính.
- Khi `image_resolution > 256`, khuyến nghị dịch chuyển lịch (Chen, 2023) để giữ nhiều tín hiệu hơn ở độ phân giải cao.
