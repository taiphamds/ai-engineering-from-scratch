---
id: early-or-late-fusion
title: Adapter tokens or one shared vocabulary for images
card: multimodal
kind: tradeoff
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, ml-breadth]
tags: [early-fusion, late-fusion, vq-vae, image-generation]
minutes: 12
lessons: [phases/12-multimodal-ai/11-chameleon-early-fusion-tokens, phases/19-capstone-projects/61-cross-attention-fusion, phases/12-multimodal-ai/12-emu3-next-token-for-generation]
manuals: []
practice: []
cheatsheet: [unified-multimodal, vlm-architectures]
related: [multimodal/vlm-three-parts]
updated: 2026-11-03
---

Một sản phẩm cần một mô hình đọc ảnh chụp màn hình và trả lời câu hỏi hôm nay, và có thể cần vẽ sơ đồ sau này. Hai thiết kế đang xét: một mô hình adapter, nơi một encoder thị giác cấp các token được chiếu vào một decoder chỉ văn bản, và một mô hình biến ảnh thành mã rời rạc trong cùng từ vựng với văn bản và huấn luyện một next-token loss trên các chuỗi xen kẽ. So sánh chúng và chọn cho sản phẩm này.

## Short answer

Thiết kế adapter là late fusion: ảnh đi vào như các token liên tục được chiếu hoặc qua cross-attention, decoder tái sử dụng toàn bộ pretraining văn bản của nó, và đầu ra chỉ là văn bản. Thiết kế từ vựng dùng chung là early fusion: một bộ lượng tử hóa ánh xạ một ảnh thành mã rời rạc, transformer huấn luyện một loss trên văn bản và mã ảnh, và nó có thể xuất mã ảnh, nên nó sinh hình. Với một sản phẩm phải đọc ảnh chụp màn hình bây giờ, chọn adapter: nó tái sử dụng nhiều tính toán pretrained hơn, không có trần bộ lượng tử hóa cho hiểu, và rẻ hơn để phục vụ; chỉ thêm mô hình early-fusion khi vẽ thành một yêu cầu thật, vì chất lượng ảnh của nó bị chặn bởi bộ lượng tử hóa và mỗi ảnh được sinh tốn một lượt decoder trên một nghìn mã hoặc hơn.

## Full answer

### Two paths into the model

| | Late fusion, adapter | Early fusion, từ vựng dùng chung |
|---|---|---|
| Đầu vào ảnh | các đặc trưng encoder được chiếu vào không gian embedding, hoặc đọc qua cross-attention | các mã rời rạc từ một bộ lượng tử hóa được học, được tra như token văn bản |
| Loss | loss mô hình hóa ngôn ngữ trên văn bản | một next-token loss duy nhất trên văn bản và mã ảnh cùng nhau |
| Đầu ra | chỉ văn bản | văn bản và ảnh, xen kẽ như mô hình chọn |
| Tái sử dụng LLM pretrained | đầy đủ | mô hình huấn luyện trên luồng hỗn hợp từ đầu |
| Trần cho hiểu | encoder | tái dựng của bộ lượng tử hóa |
| Chi phí phục vụ mỗi câu trả lời | một bước decoder mỗi token văn bản được sinh | một bước decoder mỗi token văn bản được sinh, cộng 1024 bước decoding tuần tự mỗi ảnh được sinh, một mỗi mã, rồi một lượt decoder cho các pixel |

### What early fusion buys

Một chuỗi, một loss, và đầu ra trộn phương thức. Bộ lượng tử hóa của mô hình tham chiếu ánh xạ một ảnh 512 nhân 512 thành 1024 mã từ một codebook 8192, bên trong một từ vựng duy nhất 65,536 mục cũng chứa các token văn bản và dấu phân cách. Khi mô hình xuất dấu phân cách bắt đầu ảnh, 1024 mã tiếp theo đến decoder cho các pixel.

### What it costs

- Một trần chất lượng. Bộ lượng tử hóa mất mát; ở codebook và số mã đó, tái dựng đạt đỉnh khoảng 26 đến 28 dB, dưới mức 32 trở lên của continuous latent diffusion. Một bộ lượng tử hóa tốt hơn nâng trần, nhưng trần là bộ lượng tử hóa.
- Tính ổn định huấn luyện. Huấn luyện early-fusion ở quy mô lớn phân kỳ khi không có chuẩn hóa các query và key attention, dropout sau mọi residual, và một chuẩn hóa bổ sung trên block cuối.
- Tính toán. Mỗi ảnh được sinh là một lượt decoder trên các mã của nó.

### What late fusion buys

Nó gắn vào bất kỳ decoder pretrained nào, giữ luồng văn bản sạch để khả năng văn bản sống sót, và tính ảnh một lần; với cross-attention, các key và value ảnh được cache qua các bước decode. Nó không thể xuất ảnh.

### The pick

Đọc ảnh chụp màn hình là hiểu, và adapter là công cụ đơn giản và mạnh hơn cho nó hôm nay. Khi vẽ xuất hiện, đo liệu một mô hình sinh riêng sau một lời gọi công cụ có đáp ứng nhu cầu trước khi chuyển toàn bộ stack sang early fusion.

## Follow-ups

- **Level 2:** Tại sao mô hình adapter không thể sinh một ảnh? Expected: output head của nó chỉ bao phủ từ vựng văn bản; ảnh đi vào như embedding và không bao giờ tồn tại như token nó có thể dự đoán.
- **Level 2:** Từ vựng dùng chung được tạo từ gì? Expected: token văn bản, mã ảnh và dấu phân cách phương thức trong một không gian id, nên một bảng embedding và một phép chiếu đầu ra bao phủ tất cả chúng.
- **Level 3:** Trần chất lượng của mô hình early-fusion đến từ đâu, và điều gì di chuyển nó? Expected: tái dựng của bộ lượng tử hóa; một codebook lớn hơn và nhiều mã hơn mỗi ảnh nâng nó, như thế hệ tokenizer tiếp theo cho thấy.
- **Level 3:** Một mô hình lai giữ ảnh liên tục và huấn luyện một diffusion loss trên các patch cạnh text loss. Nó đánh đổi gì? Expected: không có bộ lượng tử hóa và độ trung thực ảnh cao hơn, đổi lấy hai loss trên các thang khác nhau để cân bằng và một vòng lặp lấy mẫu diffusion lúc sinh.

## Wrong answers

- "Early fusion là tương lai, nên bắt đầu ở đó." Chỉ cho hiểu, nó tái sử dụng ít tính toán pretrained hơn và chặn chất lượng ở bộ lượng tử hóa; adapter là lựa chọn đơn giản, mạnh hơn đến khi cần sinh.
- "Adapter có thể vẽ nếu bạn thêm một decoder head." Các ảnh của nó không bao giờ tồn tại như token có thể dự đoán; vẽ cần hoặc mã ảnh trong từ vựng hoặc một mô hình sinh riêng.
- "Bộ lượng tử hóa là một chi tiết; transformer làm công việc." Trong họ early-fusion, bộ lượng tử hóa đặt trần trên mọi ảnh mô hình tạo.

## Taught in

[Bài học Chameleon](../../../phases/12-multimodal-ai/11-chameleon-early-fusion-tokens/) trình bày luận điểm early-fusion và các chi phí của nó, [capstone hợp nhất cross-attention](../../../phases/19-capstone-projects/61-cross-attention-fusion/) xây dựng đường late-fusion, và [bài học Emu3](../../../phases/12-multimodal-ai/12-emu3-next-token-for-generation/) cho thấy một bộ lượng tử hóa tốt hơn thay đổi gì.
