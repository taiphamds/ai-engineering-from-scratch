---
id: perceiver-fixed-tokens
title: Any number of images, a fixed number of tokens each
card: multimodal
kind: concept
level: 2
roles: [applied-ai-engineer]
rounds: [ml-depth]
tags: [perceiver-resampler, gated-cross-attention, interleaved, few-shot]
minutes: 12
lessons: [phases/12-multimodal-ai/04-flamingo-gated-cross-attention, phases/12-multimodal-ai/03-blip2-qformer-bridge]
manuals: []
practice: []
cheatsheet: [vlm-architectures]
related: [multimodal/image-tokens-per-image]
updated: 2026-11-03
---

Một mô hình phải nhận một prompt với bất kỳ số ảnh nào, một số nhỏ và một số lớn, xen kẽ với văn bản, rồi tạo caption cho ảnh cuối từ vài ví dụ trong ngữ cảnh. Giải thích module khiến số lượng và kích thước ảnh quản lý được, và cách một token văn bản biết nhìn ảnh nào.

## Short answer

Một resampler với một tập cố định các vector latent được học biến các token patch của mỗi ảnh thành một số token thị giác cố định. Trong thiết kế tham chiếu, 64 latent attend trên bất cứ bao nhiêu patch encoder tạo ra, 196 cho một ảnh nhỏ hoặc 900 cho một ảnh lớn, qua sáu block cross-attention và self-attention, và mọi ảnh đi ra thành 64 token cùng một chiều rộng. Các token văn bản sau đó đọc những token đó qua các lớp gated cross-attention được chèn giữa các block mô hình ngôn ngữ đóng băng, và một mask chỉ cho mỗi token văn bản attend đến các latent của ảnh gần nhất trước nó trong chuỗi.

## Full answer

### The resampler

Mỗi block làm hai việc. K latent cross-attend đến N token patch, với query từ latent và key cùng value từ patch; rồi các latent chạy self-attention và một lớp feed-forward giữa chúng. Sau sáu block, đầu ra là K token chiều rộng 1024, bất kể N là gì. Với video, resampler chạy trên mỗi khung hình, với một mã hóa vị trí thời gian, nên số khung hình nhân 64 là số token của clip.

### Why fixed matters

Các prompt xen kẽ có không, một hoặc nhiều ảnh. Với một số lượng cố định mỗi ảnh, những gì bất kỳ token văn bản nào thấy trong cross-attention có cùng shape bất kể prompt. Tổng tăng theo số ảnh, nhưng mỗi token văn bản đọc các latent của một ảnh.

### The gated bridge

Giữa mỗi block thứ tư của mô hình ngôn ngữ đóng băng là một lớp cross-attention mới với một gate residual: đầu ra bằng đầu ra block cộng hyperbolic tangent của một vô hướng được học nhân cross-attention. Vô hướng bắt đầu ở không, nên khi khởi tạo các lớp mới không làm gì, và mô hình chính xác là mô hình văn bản pretrained.

### The mask

Trong một chuỗi như ảnh A, caption A, ảnh B, caption B, ảnh C, câu hỏi, một token văn bản chỉ attend đến các token resampler của ảnh gần nhất trước nó; các ảnh khác bị mask. Attend đến tất cả ảnh đi trước là một lựa chọn hợp lệ; thiết kế tham chiếu chọn ảnh gần nhất.

### In-context few-shot

Ba cặp ảnh và caption theo sau bởi một ảnh mới tạo một prompt mà mô hình ngôn ngữ đóng băng đã biết cách hoàn tất. Các lớp có gate cấp nội dung ảnh cho nó, và khả năng học trong ngữ cảnh của nó chuyển sang mà không có một bước gradient. Đó là mục đích của việc giữ mô hình ngôn ngữ đóng băng và gate ở không.

### Against the single-input bridge

Cầu nối dựa trên query từ bài học trước cũng dùng các query được học, nhưng một lần, ở lớp đầu vào, với 32 query. Resampler cộng gated cross-attention đọc các latent mỗi vài lớp, tốn nhiều tham số và tính toán hơn và mang lại xen kẽ và hành vi few-shot.

## Follow-ups

- **Level 2:** Tại sao phía latent cung cấp các vector query và phía patch cung cấp phần còn lại, không phải ngược lại? Expected: đầu ra có một hàng mỗi query, nên query từ latent cho một số hàng cố định; chiều ngược sẽ lại cho một hàng mỗi patch.
- **Level 2:** Mã hóa thời gian làm gì cho video? Expected: mỗi khung hình cho cùng 64 latent, nên không có tín hiệu thời gian, mô hình không thể phân biệt khung hình đầu với cuối; mã hóa đánh dấu chỉ số khung hình.
- **Level 3:** Tại sao mask đến ảnh gần nhất thay vì tất cả ảnh đi trước? Expected: nó giữ shape mà mỗi token văn bản thấy cố định và khớp thứ tự đọc xen kẽ, nơi một caption mô tả ảnh trước nó; thấy tất cả ảnh là lựa chọn với sự đánh đổi khác.
- **Level 3:** Một lần fine-tune của một mô hình như thế này mất chất lượng chỉ văn bản. Bạn xem ở đâu? Expected: gate; nếu nó mở quá rộng quá nhanh, nhiễu thị giác ghi đè luồng residual văn bản, nên so sánh các giá trị gate theo lớp với bản nền.

## Wrong answers

- "Pad mọi ảnh đến cùng số patch." Padding lãng phí tính toán trên các ảnh lớn và mất chi tiết trên các ảnh nhỏ; resampler cho một số lượng cố định mà không có cả hai.
- "Để các token văn bản attend trực tiếp đến tất cả patch ảnh." Số lượng khi đó thay đổi mỗi ảnh và mỗi prompt, và một prompt nhiều ảnh làm ngập attention; các latent giữ nó cố định.
- "Khởi tạo gate mở để mô hình học nhanh hơn." Một gate mở ở bước không phá hành vi văn bản của mô hình ngôn ngữ đóng băng; bắt đầu ở không là điều bảo tồn nó.

## Taught in

[Bài học Flamingo](../../../phases/12-multimodal-ai/04-flamingo-gated-cross-attention/) trình bày resampler, các lớp có gate và mask xen kẽ, và [bài học BLIP-2](../../../phases/12-multimodal-ai/03-blip2-qformer-bridge/) đưa ra cầu nối query được so sánh với nó.
