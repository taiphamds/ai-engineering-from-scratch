---
name: skill-dcgan-scaffold
description: Write a complete DCGAN scaffold from z_dim, image_size, and num_channels, including training loop and sample saver
version: 1.0.0
phase: 4
lesson: 9
tags: [computer-vision, gan, dcgan, scaffolding]
---

# DCGAN Scaffold

Với ba tham số, xuất một bộ khung dự án DCGAN có thể chạy với kiến trúc được định cỡ đúng cho độ phân giải hình ảnh đích.

## When to use

- Bắt đầu một thí nghiệm tạo sinh mới trên tập dữ liệu nhỏ.
- Dạy nền tảng DCGAN với một ví dụ tối giản hoạt động.
- Tạo mẫu thử GAN có điều kiện (đưa nhãn vào diễn ra trong cùng bộ khung).

## Inputs

- `image_size`: một trong 32, 64, 128 (phải là lũy thừa của hai).
- `num_channels`: 1 (thang xám) hoặc 3 (RGB).
- `z_dim`: thường 64 hoặc 128.
- `with_spectral_norm`: yes | no; mặc định yes.

## Architecture sizing

Số khối tích chập chuyển vị trong G và khối tích chập có stride trong D phụ thuộc `image_size`:

| image_size | Các khối G | Các khối D |
|------------|----------|----------|
| 32         | 4        | 4        |
| 64         | 5        | 5        |
| 128        | 6        | 6        |

Mỗi khối bổ sung gấp đôi (G) hoặc giảm một nửa (D) chiều không gian. Số đặc trưng bắt đầu ở 32 và tăng theo `feat_base * 2^block_index`.

## Output files

- `model.py` — các lớp Generator + Discriminator
- `train.py` — vòng lặp huấn luyện, mất mát, thiết lập bộ tối ưu hóa
- `sample.py` — bộ lưu lưới mẫu
- `config.json` — các siêu tham số
- `README.md` — hướng dẫn bắt đầu nhanh 10 dòng

## Report

```
[scaffold]
  image_size:       <int>
  num_channels:     <int>
  z_dim:            <int>
  spectral_norm:    yes | no

[arch]
  G blocks:         <N>, channels: [list]
  D blocks:         <N>, channels: [list]
  G params (est):   <N>
  D params (est):   <N>

[training defaults]
  optimizer:   Adam(lr=2e-4, betas=(0.5, 0.999))
  batch_size:  64
  epochs:      50
  sample_every: 1 epoch

[files written]
  - model.py
  - train.py
  - sample.py
  - config.json
  - README.md
```

## Rules

- Luôn sử dụng `nn.Tanh()` trên đầu ra G và co giãn dữ liệu về [-1, 1] trong huấn luyện.
- Luôn sử dụng `LeakyReLU(0.2)` trong D.
- Khi `with_spectral_norm == yes`, bao bọc mọi tích chập trong D bằng `spectral_norm()` và loại bỏ BatchNorm khỏi D. Giữ BatchNorm trong G.
- Không bao giờ xuất bộ khung cho image_size > 128 — DCGAN trở nên không ổn định trên mức đó; hướng người dùng tới StyleGAN hoặc một mô hình khuếch tán.
