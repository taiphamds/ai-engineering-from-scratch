---
name: skill-rectified-flow-trainer
description: Write a complete rectified-flow training loop with AdaLN DiT and Euler sampling
version: 1.0.0
phase: 4
lesson: 23
tags: [diffusion, rectified-flow, DiT, training]
---

# Rectified Flow Trainer

Tạo một vòng lặp huấn luyện gọn, tối giản có thể huấn luyện thành công một DiT nhỏ bằng rectified flow trên bất kỳ tập dữ liệu tensor hình ảnh nào.

## When to use

- Tái tạo mục tiêu huấn luyện SD3 / FLUX ở quy mô nhỏ.
- Đo hiệu năng rectified flow so với DDPM trên cùng dữ liệu.
- Xây mô hình rectified-flow tùy chỉnh cho lĩnh vực không tiêu chuẩn (y tế, vệ tinh).

## Inputs

- `model`: một `nn.Module` nhận `(x, t)` và trả về vận tốc dự đoán.
- `dataset`: đối tượng có thể lặp chứa hình ảnh sạch trong lĩnh vực mô hình.
- `optimizer`: AdamW với `lr=1e-4`, `weight_decay=0.01`, `betas=(0.9, 0.99)`.
- `scheduler`: cosine với warmup, mặc định 1000 bước warmup.

## Training step

```python
def rectified_flow_train_step(model, x0, optimizer, device):
    model.train()
    x0 = x0.to(device)
    n = x0.size(0)
    t = torch.rand(n, device=device)                     # uniform in [0, 1]
    epsilon = torch.randn_like(x0)
    x_t = (1 - t[:, None, None, None]) * x0 + t[:, None, None, None] * epsilon
    target_v = epsilon - x0                              # velocity target
    pred_v = model(x_t, t)
    loss = F.mse_loss(pred_v, target_v)
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
    return loss.item()
```

## Sampling (Euler)

```python
@torch.no_grad()
def sample(model, shape, steps=20, device="cpu"):
    model.eval()
    x = torch.randn(shape, device=device)
    dt = 1.0 / steps
    t = torch.ones(shape[0], device=device)
    for _ in range(steps):
        v = model(x, t)
        x = x - dt * v
        t = t - dt
    return x
```

## Tips

- Sử dụng `torch.rand` cho `t` đều; lấy mẫu `t` có trọng số kiểu Sd3 hoặc logit-normal giúp một chút nhưng không bắt buộc để bắt đầu.
- EMA các trọng số mô hình là thực hành tiêu chuẩn; duy trì `ema_model` với decay 0.9999.
- Classifier-free guidance cho mô hình có điều kiện: với xác suất 10% thay điều kiện bằng embedding rỗng/null trong huấn luyện; lúc suy luận trộn `v_uncond + w * (v_cond - v_uncond)` với `w` khoảng 3-5.
- Với huấn luyện kiểu LDM (FLUX, SD3), toàn bộ vòng lặp chạy trong không gian tiềm ẩn VAE; `x0` sạch trên thực ra là `VAE.encode(image)`.
- Hội tụ điển hình trên tập dữ liệu đồ chơi 32x32: 2000-5000 bước. Trên huấn luyện SD3 tiềm ẩn thật: hàng trăm nghìn.

## Report

```
[rectified flow training]
  steps:        <int>
  final loss:   <float>
  ema decay:    <float>
  vae?:         yes | no
  cfg dropout:  <fraction>

[sampling]
  default steps: 20
  schnell / turbo target: 4
  full quality reference: 50+ (for comparison only)
```

## Rules

- Không bao giờ huấn luyện rectified flow với mục tiêu vận tốc không gian ảnh trên dữ liệu RGB `uint8`; chuẩn hóa về trung bình không, phương sai đơn vị trước.
- Luôn ghi mất mát huấn luyện mỗi nhóm bước thời gian; nếu các bước đầu (gần 0) có mất mát cao hơn bước sau (gần 1), tham số hóa vận tốc có lẽ nối sai.
- Không trộn mục tiêu vận tốc rectified-flow với mục tiêu nhiễu DDPM trong cùng vòng lặp huấn luyện; chọn một.
- Sử dụng huấn luyện bfloat16 trên GPU Ampere+; float16 đôi khi tạo gradient NaN trong rectified flow do độ lớn vận tốc.
