---
name: skill-lora-training-setup
description: Write a full LoRA training config for a custom dataset, including captions, rank, batch size, and learning rate
version: 1.0.0
phase: 4
lesson: 11
tags: [computer-vision, stable-diffusion, lora, fine-tuning]
---

# LoRA Training Setup

Biến một mô tả ý định tinh chỉnh thành cấu hình huấn luyện cụ thể sẵn sàng truyền cho `diffusers` hoặc `kohya_ss`.

## When to use

- Huấn luyện một LoRA cho một chủ thể (người, vật, nhân vật), một phong cách (họa sĩ, thương hiệu) hoặc một khái niệm (tư thế, ánh sáng).
- Mở rộng một LoRA hiện có với thêm dữ liệu.
- Gỡ lỗi một lần chạy LoRA có đầu ra khớp thiếu hoặc quá khớp các hình ảnh huấn luyện.

## Inputs

- `purpose`: subject | style | concept
- `num_images`: có bao nhiêu hình ảnh huấn luyện
- `base_model`: SD 1.5 | SDXL | SD3 | FLUX
- `gpu_vram_gb`: 8 | 12 | 16 | 24 | 48+
- `caption_source`: manual | BLIP2-generated | dataset-native

## Rank picker

| Mục đích | Hạng | Alpha |
|---------|------|-------|
| Chủ thể | 8-16 | rank |
| Phong cách | 16-32 | rank * 2 |
| Khái niệm | 32-64 | rank |

Hạng cao hơn = năng lực lớn hơn, nguy cơ quá khớp cao hơn trên các tập dữ liệu nhỏ. Alpha co giãn độ mạnh hiệu ứng LoRA; `alpha == rank` là mặc định an toàn. Phong cách là ngoại lệ được ghi nhận: `alpha == rank * 2` đẩy phong cách mạnh hơn với chi phí tăng nguy cơ gắn phong cách quá cứng — chỉ sử dụng khi độ trung thực chủ thể không phải mục tiêu.

## Training step target

- `subject` với 5-20 hình ảnh: 500-1500 bước.
- `style` với 30-100 hình ảnh: 1500-4000 bước.
- `concept` với 100+ hình ảnh: 4000-10000 bước.

Vượt quá thì tự chịu rủi ro — một LoRA đã ghi nhớ các hình ảnh huấn luyện không thể khái quát hóa.

## Learning rate

- LoRA encoder văn bản: `1e-4` cho SD 1.5, `5e-5` cho SDXL.
- LoRA U-Net: `1e-4` cho SD 1.5, `1e-4` cho SDXL.
- FLUX / SD3: `5e-5` cho transformer, các encoder văn bản thường đóng băng.
- Giảm một nửa LR khi `num_images < 15` (chủ thể) hoặc khi huấn luyện hơn 3000 bước; các tập dữ liệu rất nhỏ và các lần chạy dài đều hưởng lợi từ cập nhật nhẹ hơn.

## Scheduler

- `cosine_with_warmup` (mặc định): warmup trong 5-10% số bước đầu, rồi suy giảm cosine. Sử dụng khi `steps >= 1000`; đuôi suy giảm cho các mẫu cuối sắc hơn.
- `constant`: chỉ dùng cho các lần chạy rất ngắn (`steps < 500`) hoặc khi tiếp tục một LoRA trước đó mà bạn muốn giữ các đặc trưng đã học hiện tại mà không ủ lại.

## Caption format

- Chủ thể: thêm đầu một token kích hoạt duy nhất ("myperson") vào mọi chú thích. Giữ token kích hoạt hiếm để nó không ghi đè các khái niệm hiện có. Tránh các từ thật và tên phổ biến.
- Phong cách: thêm một thẻ phong cách duy nhất ở cuối mọi chú thích ("...in mystyle style"). Coi chính thẻ đó như một token kích hoạt hiếm — `mystyle`, không phải `impressionism`, vốn đã ánh xạ tới một khái niệm thật.
- Khái niệm: mô tả khái niệm trong mọi chú thích; không token kích hoạt. Bản thân khái niệm (ví dụ "góc chụp thấp") là điểm neo.

## Output config

```yaml
model:
  base: <base_model HF id>
  precision: fp16 | bf16

lora:
  rank: <int>
  alpha: <int>
  targets: unet.cross_attention  # and/or unet.to_q, to_k, to_v, to_out

training:
  steps:          <int>
  batch_size:     <int, tuned to gpu_vram_gb>
  grad_accum:     <int, usually 1 on >=16 GB, 4 on <=12 GB>
  learning_rate:  <float>
  optimizer:      AdamW8bit | AdamW
  scheduler:      cosine_with_warmup | constant
  warmup_steps:   <int>
  save_every:     <int>

data:
  images_dir:     <path>
  caption_source: <manual | BLIP2 | native>
  trigger_token:   <string if purpose==subject>
  resolution:      <512 for SD 1.5, 1024 for SDXL>
  aspect_ratio_bucketing: true
  augmentation:
    flip:          true
    color_jitter:  false

validation:
  prompts:
    - "<trigger> ...test prompt..."
    - "<trigger> in a different scene"
  every_steps: 250
```

## Report

```
[lora setup]
  purpose:   <subject|style|concept>
  base:      <model>
  rank:      <int>
  steps:     <int>
  batch:     <int>   grad_accum: <int>
  lr:        <float>
  vram est.: <float> GB
```

## Rules

- Không bao giờ khuyến nghị `rank > 64`; trên mức đó LoRA trở thành một lần tinh chỉnh nhỏ và mất bản chất "adapter".
- Với `num_images < 5`, cảnh báo mạnh — các LoRA danh tính trên 1-3 hình ảnh luôn quá khớp.
- Với `gpu_vram_gb < 12`, yêu cầu AdamW8bit và gradient checkpointing.
- Nếu `base_model == FLUX` và `gpu_vram_gb < 24`, chuyển tới biến thể `schnell` và ghi chú huấn luyện chậm hơn.
- Không bao giờ bỏ qua các prompt validation; một LoRA không có lưới mẫu không thể đánh giá.
