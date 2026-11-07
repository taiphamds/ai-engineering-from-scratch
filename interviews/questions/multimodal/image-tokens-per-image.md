---
id: image-tokens-per-image
title: How much context one image costs
card: multimodal
kind: estimate
level: 1
roles: [applied-ai-engineer, inference-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [visual-tokens, context-budget, anyres, q-former]
minutes: 8
lessons: [phases/12-multimodal-ai/05-llava-visual-instruction-tuning, phases/12-multimodal-ai/03-blip2-qformer-bridge, phases/12-multimodal-ai/07-open-weight-vlm-recipes]
manuals: []
practice: []
cheatsheet: [vlm-architectures, vlm-model-families]
related: [multimodal/vlm-three-parts]
updated: 2026-11-03
---

Một quản lý sản phẩm hỏi một ảnh dùng bao nhiêu cửa sổ ngữ cảnh trong một mô hình kiểu LLaVA với encoder 336 pixel. Đưa ra con số, nói nó đến từ đâu, và nói nó thay đổi như thế nào với chia ô độ phân giải cao hoặc với một cầu nối dựa trên query.

## Short answer

Một ảnh tốn 576 token: encoder cắt ảnh 336 pixel thành các patch 14 pixel, một lưới 24 nhân 24, và projector truyền mọi token patch qua. Trong ngữ cảnh 2048 token, điều đó để lại 1472 token cho văn bản; ở 32k hoặc 128k nó là một tỷ phần nhỏ. Chia ô nhân nó lên: một lưới 2 nhân 2 các crop 336 pixel cộng một thumbnail toàn cục cho khoảng 2880 token mỗi ảnh, và một lưới 1 nhân 3 cộng thumbnail cho ít hơn, vì nó có ít hơn một crop. Một cầu nối dựa trên query nén bất kỳ ảnh nào thành cố định 32 token, và một resampler thành 64.

## Full answer

### Where the count comes from

```text
336 / 14 = 24 patches per side
24 x 24 = 576 patch tokens
each token: 1024 wide from the encoder, 4096 wide after the projector
```

Encoder 224 pixel trước đó cho 256 token. Việc chuyển sang 336 pixel tăng số lượng lên 576, và các chuỗi huấn luyện giữ ở 2048 token.

### What it costs in context

| Ngữ cảnh | Một ảnh |
|---|---|
| 2048 | 576 token, để lại 1472 cho văn bản |
| 32k | một tỷ phần nhỏ |
| 128k | một sai số làm tròn |

### Tiling for high resolution

Các tài liệu và biểu đồ cần nhiều pixel hơn. Sơ đồ chia ô chia ảnh thành một lưới 2 nhân 2 hoặc 1 nhân 3 các crop 336 pixel, thêm một góc nhìn toàn cục độ phân giải thấp, và nối các token của mọi crop: khoảng 2880 token thị giác mỗi ảnh cho lưới 2 nhân 2, và ít hơn cho lưới 1 nhân 3, có ít hơn một crop. Các điểm đọc và biểu đồ tăng vọt với nó.

### The compressing bridges

Một cầu nối dựa trên query dùng một tập cố định 32 vector query được học cross-attend đến các token patch, nên bất kỳ ảnh nào cũng thành 32 token. Một resampler có 64 latent làm tương tự ở 64. Cái giá là một nút thắt: mô hình ngôn ngữ không bao giờ thấy các patch thô.

### How many tokens you need

Các ablation trong bài học công thức đặt điểm tối ưu cho phần lớn tác vụ ở 576 đến 1024 token thị giác mỗi ảnh, 64 là quá ít để đọc văn bản, và 2048 hoặc hơn chỉ hữu ích cho tài liệu và biểu đồ. Số token giải thích nhiều variance trong điểm benchmark hơn kiến trúc connector.

## Follow-ups

- **Level 1:** Tại sao độ phân giải đầu vào cao hơn tăng số token? Expected: kích thước patch cố định, nên nhiều pixel hơn mỗi cạnh có nghĩa nhiều patch hơn mỗi cạnh, và số lượng tăng theo bình phương cạnh.
- **Level 2:** Các tác vụ nào biện minh cho chi phí chia ô? Expected: văn bản trong ảnh, biểu đồ và tài liệu; các câu hỏi cảnh tổng quát được lợi ít từ nó.
- **Level 2:** Khi nào cầu nối 32 token thắng? Expected: khi ngân sách token ràng buộc, như với video dài hoặc nhiều ảnh mỗi prompt; với một ảnh trong một ngữ cảnh dài, sự nén mang lại ít.
- **Level 3:** Bạn định cỡ ngân sách cho video như thế nào? Expected: token mỗi khung hình nhân số khung hình, nên một cầu nối nén hoặc lấy mẫu khung hình mạnh là cách duy nhất để chứa nhiều phút video; đếm token trước khi chọn cầu nối.

## Wrong answers

- "Một ảnh tốn một token, placeholder." Placeholder được thay bằng một embedding mỗi token patch trước lượt forward; lưới encoder đặt số lượng.
- "Độ phân giải cao hơn không tốn gì vì encoder cố định." Nhiều patch hơn có nghĩa nhiều token thị giác hơn trong chuỗi của mô hình ngôn ngữ, và tính toán của mô hình ngôn ngữ tăng theo chúng.
- "Connector quyết định chất lượng, nên chọn cầu nối trước." Ở một số token cố định, connector hầu như không quan trọng; số token và encoder quan trọng hơn.

## Taught in

[Bài học LLaVA](../../../phases/12-multimodal-ai/05-llava-visual-instruction-tuning/) đếm các token mỗi ảnh và mỗi ảnh chia ô, [bài học BLIP-2](../../../phases/12-multimodal-ai/03-blip2-qformer-bridge/) giải thích cầu nối số lượng cố định, và [bài học công thức](../../../phases/12-multimodal-ai/07-open-weight-vlm-recipes/) đưa ra các ablation ngân sách token.
