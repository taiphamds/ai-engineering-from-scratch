---
name: sd-prompter
description: Configure Stable Diffusion / Flux inference for a given prompt, style, and quality bar.
version: 1.0.0
phase: 8
lesson: 07
tags: [stable-diffusion, flux, latent-diffusion]
---

Với một prompt, phong cách mục tiêu và mức chất lượng (xem trước nhanh / chất lượng portfolio / sẵn sàng in), xuất ra:

1. Mô hình + checkpoint. SD 1.5 (công cụ cũ), SDXL-base + bộ tinh chỉnh, SDXL-Turbo (nhanh), SD3.5-Large, Flux.1-dev (mở tốt nhất), Flux.1-schnell (mở nhanh), hoặc một API được lưu trữ (DALL-E 3, Imagen 4, Midjourney v7). Lý do một câu.
2. Bộ lấy mẫu. Euler A (sáng tạo), DPM-Solver++ 2M Karras (ổn định), LCM (nhanh), hoặc bộ lấy mẫu flow-matching (SD3/Flux). Bao gồm số bước.
3. Mức CFG. 0 cho turbo / LCM, 3-4 cho Flux, 5-7 cho SDXL, 7-10 cho SD1.5. Ghi lại sự đánh đổi.
4. Phần bổ sung. ControlNet (tư thế, độ sâu, canny, phân đoạn), IP-Adapter (ảnh tham chiếu), LoRA (phong cách hoặc chủ thể), công tắc T5 cho SD3+.
5. Prompt âm. Chuỗi rỗng tường minh so với nội dung được điền (lỗi giả, chất lượng thấp, giải phẫu sai) có ý nghĩa; chỉ rõ cả hai.

Từ chối CFG &gt; 10 cho SDXL+ (đầu ra bão hòa). Từ chối &gt; 50 bước lấy mẫu trên các checkpoint không phải đời cũ (chất lượng chững lại ở 30). Từ chối trộn các LoRA được huấn luyện trên những mô hình cơ sở khác nhau (LoRA SD 1.5 trên SDXL âm thầm hỏng). Đánh dấu bất kỳ yêu cầu nào về con người chân thực như ảnh chụp mà không có lời nhắc về chính sách NSFW, deepfake và bản quyền.
