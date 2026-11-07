---
id: gate-opened-too-fast
title: A gated VLM fine-tune that forgot how to write
card: multimodal
kind: debug
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [gated-cross-attention, catastrophic-forgetting, fine-tuning, flamingo]
minutes: 12
lessons: [phases/12-multimodal-ai/04-flamingo-gated-cross-attention, phases/19-capstone-projects/61-cross-attention-fusion]
manuals: []
practice: []
cheatsheet: [vlm-architectures, vlm-from-scratch]
related: [multimodal/perceiver-fixed-tokens, multimodal/cross-attention-mask-bug]
updated: 2026-11-03
---

Bạn fine-tune một mô hình được xây như Flamingo, với một block gated cross-attention sau mỗi vài lớp của một mô hình ngôn ngữ đóng băng, trên một tập dữ liệu caption nhỏ. Các caption cải thiện, nhưng chất lượng chỉ văn bản suy giảm: mô hình nói lan man trên các prompt thông thường và mất các sự thật nó biết. Nguyên nhân có khả năng là gì, bạn xác nhận nó như thế nào, và bạn sửa nó như thế nào?

## Short answer

Các gate mở quá rộng quá nhanh. Mỗi lớp có gate thêm hyperbolic tangent của một vô hướng được học nhân đầu ra cross-attention vào luồng residual; ở không, lớp là một no-op và mô hình là mô hình văn bản pretrained. Một learning rate cao trên các gate, hoặc không có regularization, để nhiễu thị giác tràn vào luồng residual ngay cả khi prompt không có ảnh. Xác nhận bằng cách đọc các giá trị gate mỗi lớp đối chiếu bản nền và chạy một đánh giá chỉ văn bản với các gate bị buộc về không; sửa bằng một rate thấp hơn hoặc một lịch trình trên các gate, một hỗn hợp dữ liệu chỉ văn bản, và một kiểm tra rằng các lớp không thêm gì khi không có ảnh.

## Full answer

### The mechanism

```text
x_after = llm_block(x_before)
cross   = cross_attn(x_after, visual_latents)
x_next  = tanh(alpha) * cross + x_after
```

Khi khởi tạo, alpha bằng không, nên mô hình chính xác là mô hình ngôn ngữ đóng băng. Khi alpha tăng, thông tin thị giác được thêm trên biểu diễn văn bản. Residual có nghĩa ngay cả một gate mở hoàn toàn không xóa đường văn bản, nhưng một gate lớn thêm một số hạng lớn ở mỗi block thứ tư. Nếu đầu ra cross-attention là nhiễu, nhiễu đó đến đầu ra.

### Why a fine-tune breaks it

- Các gate là những tham số ít tốn kém nhất để di chuyển, nên một learning rate được chọn cho các trọng số cross-attention đẩy chúng nhanh.
- Một tập dữ liệu chỉ caption không bao giờ cho thấy một prompt chỉ văn bản, nên không gì phạt các gate thêm số hạng thị giác khi không có ảnh để attend.
- Với ít ảnh mỗi prompt, cross-attention có mask có ít thứ để đọc, và một gate mở vẫn thêm đầu ra của nó.

### Confirm

1. Ghi log giá trị gate mỗi lớp. So sánh nó với checkpoint nền và với bước chất lượng văn bản giảm.
2. Chạy đánh giá chỉ văn bản với các gate bị buộc về không. Nếu chất lượng trở lại, các gate là nguyên nhân.
3. Gửi một prompt chỉ văn bản qua mô hình và đo norm của số hạng có gate mỗi lớp. Nó nên gần không khi không có ảnh.

### Fix

- Một learning rate thấp hơn hoặc một lịch trình warm-up cho các vô hướng gate, để chúng mở trong suốt lần chạy thay vì trong các bước đầu.
- Một hỗn hợp chỉ văn bản trong dữ liệu fine-tuning, để loss bao phủ trường hợp sản phẩm thấy.
- Một regularizer trên các gate, hoặc một giới hạn độ lớn của chúng.
- Một kiểm tra mask: các token văn bản không có ảnh đi trước phải không attend gì, và số hạng có gate phải không thêm gì.
- Ít lớp có gate hơn, nếu tác vụ không cần một lớp mỗi block thứ tư.

### Why the design is still right

Gate là thứ cho phép công trình gốc giữ nguyên một mô hình ngôn ngữ 70B đóng băng trong khi nó học đọc ảnh. Lỗi ở đây nằm trong lịch trình, không phải kiến trúc.

## Follow-ups

- **Level 3:** Kết nối residual mang lại gì một khi gate mở? Expected: biểu diễn văn bản không bao giờ bị ghi đè, chỉ được cộng vào; ngay cả một gate mở hoàn toàn để đường văn bản nguyên vẹn, đó là lý do cách sửa là lịch trình và không phải thiết kế lại.
- **Level 3:** Bạn sẽ phát hiện cùng thiệt hại trong một mô hình thay vào đó nối các token ảnh như thế nào? Expected: không có gate để đọc; thiệt hại xuất hiện như một dịch chuyển trong các trọng số mô hình ngôn ngữ, nên so sánh đánh giá chỉ văn bản trước và sau, và đóng băng mô hình ngôn ngữ hoặc giới hạn nó ở adapter.
- **Level 4:** Thiết kế một unit test bắt điều này trước huấn luyện. Expected: xây block với alpha ở không và assert đầu ra bằng chính xác đầu ra block cho một đầu vào chỉ văn bản, rồi đặt một alpha lớn và assert một đầu vào chỉ văn bản với mask trống vẫn bằng đầu ra block.
- **Level 4:** Bạn quyết định giữ bao nhiêu lớp có gate như thế nào? Expected: ablate tần suất chèn theo chất lượng caption và chất lượng chỉ văn bản trên một bộ đánh giá; mỗi block thứ tư là tham chiếu, và ít lớp hơn có nghĩa ít nơi hơn cho nhiễu đi vào.

## Wrong answers

- "Dữ liệu caption quá nhỏ; thêm ảnh." Nhiều dữ liệu caption hơn không có prompt chỉ văn bản đẩy các gate xa hơn theo cùng hướng; cách sửa là lịch trình gate và hỗn hợp dữ liệu.
- "Mở đóng băng mô hình ngôn ngữ để nó có thể thích nghi với đầu vào thị giác." Điều đó đánh đổi một vấn đề lịch trình lấy quên thảm họa của mô hình văn bản, điều mà thiết kế đóng băng tồn tại để ngăn.
- "Thay gated cross-attention bằng thiết kế nối đơn giản hơn." Triệu chứng là một vấn đề lịch trình; gate là cơ chế bảo vệ mô hình văn bản, và thiết kế đơn giản hơn không có bảo vệ như vậy.

## Taught in

[Bài học Flamingo](../../../phases/12-multimodal-ai/04-flamingo-gated-cross-attention/) giải thích tại sao gate bắt đầu ở không và nêu gate quá nhanh là nguyên nhân suy giảm hiệu suất văn bản, và [capstone hợp nhất cross-attention](../../../phases/19-capstone-projects/61-cross-attention-fusion/) xây dựng block và bài tập gate.
