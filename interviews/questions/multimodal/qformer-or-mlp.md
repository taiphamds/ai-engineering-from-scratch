---
id: qformer-or-mlp
title: Query bridge or MLP for the connector
card: multimodal
kind: tradeoff
level: 2
roles: [applied-ai-engineer, inference-engineer]
rounds: [system-design, ml-depth]
tags: [q-former, mlp-projector, token-budget, connector]
minutes: 12
lessons: [phases/12-multimodal-ai/03-blip2-qformer-bridge, phases/12-multimodal-ai/05-llava-visual-instruction-tuning, phases/12-multimodal-ai/07-open-weight-vlm-recipes]
manuals: []
practice: []
cheatsheet: [vlm-architectures, vlm-model-families]
related: [multimodal/image-tokens-per-image]
updated: 2026-11-03
---

Bạn đang chọn cầu nối giữa một encoder thị giác đóng băng và một mô hình ngôn ngữ giữ đóng băng, cho một sản phẩm mới. Một kiến trúc sư muốn một transformer dựa trên query nén mỗi ảnh thành một tập token cố định. Một người khác muốn một MLP thông thường truyền mọi patch qua. Bạn quyết định như thế nào?

## Short answer

Quyết định theo ngân sách token, không phải chất lượng trừu tượng. Ở một số token thị giác cố định, các nghiên cứu ablation thấy kiến trúc connector hòa nhau, trong khoảng một điểm giữa một MLP trên các patch mean-pooled, một cầu nối query và một resampler; một MLP toàn patch dùng nhiều token hơn, nên nó nằm ở một ngân sách khác. Cầu nối query giới hạn một ảnh ở 32 token bất kể độ phân giải và tốn 188M tham số cộng một pretraining hai giai đoạn riêng; MLP xuất mọi patch, 576 cho một ảnh 336 pixel, với khoảng 22M tham số và một loss mô hình hóa ngôn ngữ. Chọn cầu nối nén khi ngữ cảnh ràng buộc, như với video dài hoặc nhiều ảnh; chọn MLP khi chất lượng mỗi token và tính đơn giản quan trọng và ngữ cảnh đủ dài.

## Full answer

### The two bridges

| | Cầu nối query | MLP |
|---|---|---|
| Token thị giác mỗi ảnh | 32, cố định | 576 ở 336 pixel, khoảng 2880 với chia ô |
| Tham số huấn luyện được, mô hình ngôn ngữ đóng băng | 188M | khoảng 22M |
| Pretraining | một giai đoạn biểu diễn với các loss tương phản, matching và sinh, rồi một giai đoạn sinh | loss mô hình hóa ngôn ngữ xuyên suốt |
| Đổi mô hình ngôn ngữ | huấn luyện lại cầu nối | huấn luyện lại một head nhỏ |
| Nhiều ảnh và video | bất tiện, nhưng rẻ về token | nối tự nhiên, đắt về token |

### What the ablations say

Nhiều nghiên cứu có kiểm soát đạt một kết quả. Ở một số token thị giác cố định, connector giải thích khoảng 5 phần trăm variance trong điểm benchmark, số token mỗi ảnh khoảng 60 phần trăm, và encoder khoảng 20. Một MLP trên các patch pooled nằm trong 1 điểm của một cầu nối 32 query ở cùng ngân sách. Vì vậy câu hỏi là bạn có thể trả cho bao nhiêu token, và bạn dùng encoder nào.

### Why the field split

Cầu nối nén thắng nơi ngân sách token ràng buộc: video dài, nhiều ảnh trong một prompt, ngữ cảnh nhỏ. MLP thắng trường hợp một ảnh khi các ngữ cảnh tăng đến 32k và hơn, vì mọi patch giữ nhìn thấy với mô hình ngôn ngữ và công thức không có các loss giai đoạn một để tinh chỉnh. Các ngân sách token từ ablation: 64 mỗi ảnh là quá ít để đọc văn bản, 576 đến 1024 là điểm tối ưu cho phần lớn tác vụ, và 2048 trở lên chỉ có lợi cho tài liệu và biểu đồ.

### Hidden costs of the query bridge

Các query của nó học một biểu diễn trung gian mà mô hình ngôn ngữ sau đó phải decode, nên thông tin mất trong nút thắt. Thay mô hình ngôn ngữ hoặc encoder, và bạn huấn luyện lại nó. Một biến thể nhận biết instruction đưa instruction vào các query để chúng có thể chuyên biệt theo câu hỏi, khôi phục một phần mất mát.

### A decision rule

1. Đếm token mỗi ảnh ở độ phân giải của bạn và nhân với số ảnh mỗi prompt.
2. Nếu nó vừa ngữ cảnh với chỗ cho văn bản, dùng MLP và dành nỗ lực cho encoder và dữ liệu.
3. Nếu không, dùng một cầu nối nén, và chấp nhận chi phí huấn luyện lại khi các phần thay đổi.

## Follow-ups

- **Level 2:** Tại sao cầu nối query cần một giai đoạn pretraining riêng? Expected: các query của nó bắt đầu ngẫu nhiên và phải học kéo nội dung liên quan văn bản từ patch trước khi mô hình ngôn ngữ có thể dùng chúng; MLP bắt đầu từ các patch đã mang ảnh.
- **Level 2:** Ba loss giai đoạn một làm gì? Expected: alignment tương phản của các query pooled với văn bản, một bộ phân loại matching với hard negative, và sinh văn bản có grounding ảnh buộc các query encode điều văn bản cần.
- **Level 3:** Một nhóm chọn MLP và giờ phục vụ video mười phút. Họ chạm gì trước? Expected: ngữ cảnh; token mỗi khung hình nhân số khung hình vượt bất kỳ cửa sổ nào, nên rốt cuộc họ cần lấy mẫu khung hình mạnh hoặc một cầu nối nén.
- **Level 3:** Nếu connector hầu như không quan trọng, chất lượng đến từ đâu? Expected: encoder, số token, hỗn hợp dữ liệu và lịch trình độ phân giải; phân rã của bài học công thức đặt connector cuối.

## Wrong answers

- "Cầu nối query tiên tiến hơn, nên cho câu trả lời tốt hơn." Ở cùng số token, hai loại nằm trong khoảng một điểm; lợi thế của nó là nén, không phải chất lượng.
- "MLP luôn tốt hơn vì giữ mọi patch." Giữ mọi patch tốn token; với nhiều ảnh hoặc video, ngữ cảnh hết trước khi chất lượng quan trọng.
- "Chọn cầu nối trước và encoder sau." Encoder và số token giải thích phần lớn variance; cầu nối là núm cuối cùng để chỉnh.

## Taught in

[Bài học BLIP-2](../../../phases/12-multimodal-ai/03-blip2-qformer-bridge/) giải thích cầu nối query và huấn luyện hai giai đoạn của nó, [bài học LLaVA](../../../phases/12-multimodal-ai/05-llava-visual-instruction-tuning/) lập bảng hai cầu nối, và [bài học công thức](../../../phases/12-multimodal-ai/07-open-weight-vlm-recipes/) đưa ra các kết quả ablation.
