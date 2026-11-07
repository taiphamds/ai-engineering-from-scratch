---
id: show-o-parallel-decoding
title: Three ways to generate an image from one transformer
card: multimodal
kind: tradeoff
level: 3
roles: [applied-ai-engineer, inference-engineer]
rounds: [system-design, ml-depth]
tags: [masked-diffusion, parallel-decoding, inpainting, unified-models]
minutes: 12
lessons: [phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified, phases/12-multimodal-ai/12-emu3-next-token-for-generation, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion]
manuals: []
practice: []
cheatsheet: [unified-multimodal, image-generation-compared]
related: [multimodal/emu3-generation-cost, multimodal/vq-tokenizer-ceiling]
updated: 2026-11-03
---

Nhóm của bạn cần một mô hình mở cho trả lời câu hỏi về ảnh, sinh văn bản thành ảnh và inpainting, với một độ trễ sinh dùng được. Một ứng viên sinh ảnh từng mã một; ứng viên khác khử nhiễu các patch liên tục; ứng viên thứ ba giữ mã rời rạc và lấp chúng song song qua vài lượt. So sánh ba loại về số lượt, độ phức tạp huấn luyện và những gì có miễn phí.

## Short answer

Sinh next-token trên mã cần một lượt mỗi mã, 1024 đến 4096 lượt mỗi ảnh, với một loss đơn giản. Diffusion liên tục trong một transformer dùng chung cần khoảng 20 lượt, nhưng nó huấn luyện hai loss trên các thang khác nhau. Decoding rời rạc có mask giữ mã và một cross-entropy loss, dự đoán tất cả vị trí bị mask cùng lúc và chốt các vị trí tự tin nhất mỗi lượt, nên một ảnh mất khoảng 16 lượt; inpainting miễn phí, vì mục tiêu huấn luyện là lấp các mã bị mask từ phần còn lại. Với một sản phẩm muốn cả ba tác vụ trong một mô hình mở ở độ trễ dùng được, thiết kế rời rạc có mask phù hợp, và thiết kế liên tục là lựa chọn khi độ trung thực là tối quan trọng.

## Full answer

### How masked discrete decoding works

Huấn luyện lấy mẫu một tỷ lệ masking đều, mask tỷ phần đó của các mã ảnh, và huấn luyện transformer khôi phục chúng. Điều đó tổng quát hóa dự đoán next-token: với văn bản chỉ vị trí cuối bị mask, với ảnh một tập con ngẫu nhiên bị mask. Khi suy luận, bắt đầu từ một lưới bị mask hoàn toàn, dự đoán mọi vị trí bị mask song song, giữ các dự đoán tự tin nhất, mask lại phần còn lại, và lặp theo một lịch trình. Một lịch trình cosine, tỷ lệ mask là cosine của pi nhân bước chia hai lần tổng bước, tập trung công việc ở các tỷ lệ tầm giữa nơi các dự đoán mang nhiều thông tin nhất.

### The attention mask

Các token văn bản có tính nhân quả. Các mã ảnh attend đến mọi mã khác của cùng ảnh, nên một vị trí bị mask có thể thấy tất cả láng giềng. Văn bản attend đến các ảnh trước, và các mã ảnh attend đến văn bản trước.

### The comparison

| Thiết kế | Lượt mỗi ảnh | Loss | Phần thêm miễn phí |
|---|---|---|---|
| Next-token trên mã | một mỗi mã, 1024 đến 4096 | một cross-entropy | video với một tokenizer 3D; một stack cho mọi thứ |
| Diffusion liên tục trong transformer | khoảng 20 | cross-entropy cộng một diffusion loss trên patch | độ trung thực cao nhất, không có bộ lượng tử hóa |
| Decoding rời rạc có mask | khoảng 16 | một cross-entropy trên các vị trí bị mask | inpainting; một checkpoint cho trả lời, viết và sinh |

Mỗi lượt, thiết kế có mask rẻ hơn diffusion liên tục, vì nó xuất các logit rời rạc thay vì một hồi quy liên tục ở mọi patch.

### What the masked design pays

Nó giữ trần tokenizer của mọi thiết kế rời rạc: ảnh không thể tốt hơn tái dựng của bộ lượng tử hóa. Bỏ mask mọi thứ trong một lượt thất bại, vì các mã được dự đoán độc lập và kết quả không nhất quán; lịch trình tồn tại để các mã đã chốt điều kiện hóa phần còn lại.

### Inpainting for free

Mask các mã của một vùng, đưa vào phần còn lại cộng một prompt văn bản, và dự đoán các mã bị mask. Không có mục tiêu mới và không có head mới: tác vụ huấn luyện chính xác là điều này.

## Follow-ups

- **Level 3:** Tại sao mô hình không thể bỏ mask mọi thứ trong một lượt? Expected: mỗi vị trí bị mask được dự đoán từ một phân phối biên bỏ qua các vị trí khác, nên các mã lấy mẫu không thống nhất; chốt các mã tự tin trước cho phần còn lại điều kiện.
- **Level 3:** Tại sao một lịch trình cosine thắng một lịch trình tuyến tính? Expected: nó dành nhiều bước hơn ở các tỷ lệ tầm giữa nơi mỗi dự đoán mang nhiều thông tin nhất, trong khi một lịch trình tuyến tính đạt bình nguyên sớm hơn.
- **Level 4:** Chi phí mỗi bước khác nhau ở đâu giữa rời rạc có mask và diffusion liên tục? Expected: cả hai là các lượt transformer đầy đủ, nhưng head rời rạc xuất logit trên codebook trong khi head liên tục hồi quy một vận tốc cho mọi patch; lượt rời rạc rẻ hơn mỗi bước.
- **Level 4:** Điều gì khiến bạn bỏ sự đơn giản một mô hình để lấy một mô hình chuyên biệt? Expected: một yêu cầu độ trung thực trên trần tokenizer, hoặc một ngân sách độ trễ mà ngay cả mười sáu lượt đầy đủ không thể đáp ứng, nơi một bộ sinh liên tục chuyên dụng thắng.

## Wrong answers

- "Decoding có mask là diffusion, nên cần một lịch trình nhiễu." Nó rời rạc: các vị trí bị mask, không phải thêm nhiễu, và lịch trình đặt bao nhiêu mã để chốt mỗi lượt.
- "Sinh next-token nhanh nhất vì mỗi lượt nhỏ." Mỗi lượt là một lượt transformer đầy đủ trên chuỗi, và có hàng nghìn lượt mỗi ảnh.
- "Inpainting cần một mô hình riêng." Mục tiêu có mask là inpainting; mask một vùng khi suy luận là tác vụ mô hình đã huấn luyện.

## Taught in

[Bài học Show-o](../../../phases/12-multimodal-ai/14-show-o-discrete-diffusion-unified/) trình bày decoding có mask, lịch trình và danh sách tác vụ, [bài học Emu3](../../../phases/12-multimodal-ai/12-emu3-next-token-for-generation/) đưa ra chi phí mỗi mã, và [bài học Transfusion](../../../phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/) đưa ra lựa chọn liên tục.
