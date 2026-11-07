---
id: emu3-generation-cost
title: What one generated image costs in codes and seconds
card: multimodal
kind: estimate
level: 2
roles: [applied-ai-engineer, inference-engineer]
rounds: [screen, system-design]
tags: [emu3, tokens, latency, image-generation, video]
minutes: 10
lessons: [phases/12-multimodal-ai/12-emu3-next-token-for-generation, phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified, phases/12-multimodal-ai/11-chameleon-early-fusion-tokens]
manuals: []
practice: []
cheatsheet: [unified-multimodal, image-generation-compared]
related: [multimodal/early-or-late-fusion]
updated: 2026-11-03
---

Một mô hình next-token thống nhất sinh một ảnh 512 nhân 512 như một chuỗi mã rời rạc. Ước lượng một ảnh mất bao lâu ở tốc độ decode điển hình, so sánh với một mô hình diffusion, và nói một clip video bốn giây ở độ phân giải thấp tốn bao nhiêu mã. Sau đó nêu các đòn bẩy thay đổi đáp án.

## Short answer

Tokenizer của mô hình tham chiếu giảm 8 nhân 8 pixel thành một mã, nên một ảnh 512 nhân 512 là 4096 mã; ở khoảng 30 mã mỗi giây, đó là khoảng 2 phút mỗi ảnh, so với 2 đến 5 giây cho một mô hình diffusion cùng bậc chất lượng. Một clip 4 giây ở 8 khung hình mỗi giây là 32 khung hình; với cùng mức giảm không gian 8 lần và mức giảm thời gian 4 khung hình, một clip 256 nhân 256 là 32 nhân 32 nhân 8, tức là 8,192 mã. Các đòn bẩy là số mã mỗi ảnh, tốc độ decode qua speculative decoding hoặc KV cache, và một sơ đồ decoding khác như masked parallel decoding, cần khoảng 16 lượt thay vì một lượt mỗi mã.

## Full answer

### The image

```text
512 / 8 = 64 codes per side
64 x 64 = 4096 codes per image
4096 codes at about 30 per second = about 2 minutes
```

Một mô hình diffusion lấy mẫu một latent liên tục trong vài chục bước và hoàn tất trong 2 đến 5 giây. Sinh ảnh tự hồi quy nặng tính toán theo cấu tạo: một lượt mỗi mã.

### The video

Tokenizer video là ba chiều: một mã bao phủ 4 khung hình nhân 8 nhân 8 pixel.

```text
frames: 4 s x 8 per second = 32
codes: (256 / 8) x (256 / 8) x (32 / 4) = 32 x 32 x 8 = 8,192
```

### Why the model pays this price

Cùng trọng số làm sinh ảnh, hiểu ảnh và video với một next-token loss, không có lịch trình diffusion và không có encoder văn bản riêng. Chất lượng tokenizer là trần: tham chiếu báo cáo một tái dựng 30.5 dB so với khoảng 32 cho một không gian latent liên tục, với số mã gấp bốn lần và codebook gấp bốn lần mô hình early-fusion trước.

### The inference knobs

- Classifier-free guidance: sinh có và không có caption và trộn các logit với một trọng số, thường là 3.0 đến 7.0; nó tăng gấp đôi các lượt forward mỗi mã.
- Temperature: 0.8 cho sinh ảnh và 1.0 cho hiểu trong công thức tham chiếu.
- Speculative decoding thu hẹp khoảng cách với diffusion, và KV cache cũng vậy, nhưng không cái nào xóa nó.

### A different decoding scheme

Masked parallel decoding giữ mã rời rạc nhưng dự đoán tất cả vị trí bị mask cùng lúc và chốt những vị trí tự tin nhất, trong khoảng 16 lượt cho một ảnh, so với khoảng 20 cho diffusion liên tục và một lượt mỗi mã cho sinh next-token thông thường.

## Follow-ups

- **Level 2:** Tại sao guidance tăng gấp đôi chi phí? Expected: mỗi bước cần một lượt forward có điều kiện và một lượt không điều kiện để trộn.
- **Level 2:** Điều gì xảy ra với thời gian mỗi ảnh ở 1024 nhân 1024? Expected: số mã gấp bốn lần ở cùng mức giảm, nên thời gian decode khoảng gấp bốn lần; bài tập của bài học yêu cầu số đếm đó.
- **Level 3:** Trần chất lượng của mô hình này nằm ở đâu, và điều gì nâng nó từ mô hình từ vựng dùng chung đầu tiên? Expected: trong tái dựng của tokenizer; số mã mỗi ảnh gấp bốn lần và một codebook lớn gấp bốn lần nâng nó lên 30.5 dB.
- **Level 3:** Khi nào bạn vẫn chọn nó thay vì một mô hình diffusion? Expected: khi một mô hình phải hiểu và sinh xuyên ảnh, video và văn bản với một loss, và ngân sách độ trễ cho phép nhiều phút mỗi ảnh hoặc một pipeline batch.

## Wrong answers

- "Một ảnh là vài trăm token, như một đầu vào VLM." Đó là các token encoder được chiếu cho hiểu; sinh cần các mã rời rạc ở mật độ của tokenizer, 4096 cho kích thước ảnh này.
- "Diffusion chậm hơn vì nó lặp." Diffusion mất vài chục lượt trên tất cả pixel cùng lúc; sinh next-token mất một lượt mỗi mã, hàng nghìn mỗi ảnh.
- "Một codebook lớn hơn khiến sinh nhanh hơn." Nó tăng chất lượng tái dựng; số lượt được đặt bởi số mã, không phải kích thước codebook.

## Taught in

[Bài học Emu3](../../../phases/12-multimodal-ai/12-emu3-next-token-for-generation/) đếm các mã ảnh và video và đưa ra chi phí decode, và [bài học Show-o](../../../phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/) so sánh số lượt của ba sơ đồ decoding.
