---
id: chameleon-diverged
title: An early-fusion run that diverges at scale
card: multimodal
kind: debug
level: 3
roles: [applied-ai-engineer, inference-engineer]
rounds: [debugging, ml-depth]
tags: [early-fusion, training-stability, qk-norm, divergence]
minutes: 12
lessons: [phases/12-multimodal-ai/11-chameleon-early-fusion-tokens, phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion]
manuals: []
practice: []
cheatsheet: [unified-multimodal]
related: [multimodal/vq-tokenizer-ceiling]
updated: 2026-11-03
---

Bạn pretrain một mô hình early-fusion trên các mã ảnh và văn bản xen kẽ. Các lần chạy nhỏ ổn, nhưng loss của lần chạy lớn tăng vọt và phân kỳ sau một thời gian, và các điểm attention tăng từ lớp này sang lớp khác. Điều gì đang xảy ra, và công thức đã công bố thay đổi gì để khiến một lần chạy như vậy hội tụ?

## Short answer

Huấn luyện early-fusion ở quy mô lớn không ổn định vì các mã ảnh và token văn bản chia sẻ một softmax và một luồng residual, và các gradient cùng norm của chúng khác nhau; các logit attention tăng theo độ sâu đến khi softmax bão hòa và loss bùng nổ. Công thức đã công bố ở 34B tham số phân kỳ tại nhiều checkpoint khi không có ba thay đổi: chuẩn hóa các phép chiếu query và key trước tích vô hướng, dropout sau mọi phép cộng residual thay vì chỉ sau attention và MLP, và pre-normalization trên nhánh residual cộng một chuẩn hóa bổ sung trên kết nối skip của block cuối. Công thức huấn luyện cũng là phần đóng góp nhiều như kiến trúc.

## Full answer

### The signature

Sự tăng norm. Các vector query và key tăng về độ lớn qua các lớp, các logit attention tăng theo chúng, softmax biến thành gần one-hot, và các gradient trở nên tăng vọt. Các lần chạy nhỏ không đạt độ sâu hoặc số bước nơi điều này tích lũy; lần chạy lớn thì có.

### Why early fusion makes it worse

Một từ vựng dùng chung 65,536 mục chứa các token văn bản và 8192 mã ảnh, và một ảnh là 1024 mã liên tiếp. Các chuỗi mã ảnh dài mang gradient ở thang khác văn bản, và chúng có thể chi phối một cập nhật. Hai phương thức cũng chiếm các vùng khác nhau của không gian ẩn, đẩy các norm tách xa nhau.

### The three changes

1. QK-Norm. Áp dụng layer normalization cho các phép chiếu query và key bên trong attention, trước tích vô hướng. Nó chặn độ lớn logit ở mọi độ sâu, và nhiều mô hình lớn sau đó áp dụng nó.
2. Vị trí dropout. Dropout sau mọi phép cộng residual, không chỉ sau attention và sau MLP. Thêm regularization nơi gradient mã ảnh có thể chi phối.
3. Thứ tự chuẩn hóa. Pre-normalization trên nhánh residual, là tiêu chuẩn, cộng một chuẩn hóa bổ sung trên kết nối skip của block cuối, ổn định luồng gradient ở lớp cuối.

### How you would confirm it on your run

- Ghi log norm của các query và key và logit attention lớn nhất mỗi lớp trong huấn luyện; phân kỳ nên theo sau sự tăng trong các lớp sâu.
- Ghi log norm gradient được chia theo phương thức của token; sự chi phối của gradient mã ảnh chỉ đến thay đổi thứ hai.
- Khởi động lại từ một checkpoint trước đợt tăng với QK-Norm bật, và so sánh các đường cong logit.

### The alternative family

Một thiết kế liên tục huấn luyện một diffusion loss trên các patch ảnh cạnh text loss tránh softmax dùng chung trên các mã ảnh, nhưng nó có một vấn đề cân bằng riêng: hai loss nằm trên các thang khác nhau, và các trọng số giữa chúng là một cuộc tìm kiếm riêng.

## Follow-ups

- **Level 3:** Tại sao chuẩn hóa các query và key chặn các logit? Expected: tích vô hướng của hai vector được chuẩn hóa bị chặn bởi thang của chúng, nên các logit không thể tăng vô hạn khi luồng residual tăng.
- **Level 3:** Tại sao không giảm learning rate thay vào đó? Expected: một rate thấp hơn làm chậm sự tăng nhưng không loại bỏ cơ chế; các norm vẫn trôi theo độ sâu, và lần chạy trả bằng các bước cho một vấn đề mà chuẩn hóa loại bỏ.
- **Level 4:** Bài báo báo cáo gì ở 34B khi không có các thay đổi? Expected: phân kỳ lặp lại tại nhiều checkpoint, do tăng các logit attention, một sự bùng nổ norm, mà ba thay đổi loại bỏ.
- **Level 4:** Thiết kế liên tục hai loss đánh đổi vấn đề này lấy vấn đề khác như thế nào? Expected: nó loại bỏ softmax dùng chung trên các mã ảnh nhưng đưa vào hai loss khác độ lớn, nơi một head có thể chi phối nếu không có trọng số loss và lịch trình cẩn thận.

## Wrong answers

- "Early fusion không ổn định về bản chất; dùng các mô hình nhỏ hơn." Công thức đã công bố hội tụ ở 34B với ba thay đổi; sự không ổn định là một vấn đề công thức.
- "Clip gradient mạnh hơn." Clipping chặn cập nhật, không phải sự tăng logit gây bão hòa; các norm tiếp tục trôi dưới một clip.
- "Dùng post-normalization ở mọi nơi; nó ổn định hơn." Công thức giữ pre-normalization trên nhánh residual và thêm chuẩn hóa nơi các norm tăng: query, key, và skip của block cuối.

## Taught in

[Bài học Chameleon](../../../phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/) ghi lại ba thay đổi ổn định và sự phân kỳ ở quy mô lớn, và [bài học Transfusion](../../../phases/12-multimodal-ai/13-transfusion-autoregressive-diffusion/) đưa ra lựa chọn liên tục và vấn đề cân bằng riêng.
