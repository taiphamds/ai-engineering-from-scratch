---
id: pick-encoder-or-decoder
title: Encoder, decoder or both for three products
card: transformers
kind: tradeoff
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [system-design, ml-breadth]
tags: [encoder-only, decoder-only, encoder-decoder, cross-attention, pretraining-loss]
minutes: 8
lessons: [phases/07-transformers-deep-dive/05-full-transformer, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling]
manuals: []
practice: []
cheatsheet: [bert-gpt-t5]
related: [transformers/causal-mask-minus-infinity]
updated: 2026-11-03
---

Ba sản phẩm được đặt lên bàn bạn: mô hình xếp hạng tìm kiếm trên tài liệu, trợ lý lập trình viết mã, và hệ thống chuyển giọng nói thành văn bản. Bạn chọn hình dạng transformer nào cho từng sản phẩm, và pretraining loss liên quan gì đến lựa chọn đó?

## Short answer

Chỉ encoder cho xếp hạng và embedding, chỉ decoder cho sinh, và encoder-decoder khi đầu vào là chuỗi nguồn rõ ràng như âm thanh cần chép lại. Encoder đọc cả hai phía của mọi vị trí và huấn luyện trên dự đoán có mask, cho biểu diễn mạnh và không có cách sinh. Decoder huấn luyện trên dự đoán token tiếp theo sau causal mask, nên có thể sinh, và nó mở rộng quy mô thuận lợi nhất, đó là lý do nó thắng trong ngôn ngữ. Loss quyết định liệu mô hình có thể tạo văn bản hay không.

## Full answer

### The three skeletons

| Nhu cầu | Hình dạng | Tại sao |
|---|---|---|
| Phân loại, embedding, trả lời câu hỏi trên văn bản | Chỉ encoder | Attention hai chiều thấy toàn bộ đầu vào cùng lúc |
| Sinh văn bản, chat, mã, suy luận | Chỉ decoder | Causal mask cộng next-token loss; một lượt attention và FFN mỗi lớp |
| Đầu vào có cấu trúc sang đầu ra có cấu trúc, dịch thuật, nhận dạng giọng nói | Encoder-decoder | Encoder nắm nguồn; decoder sinh và đọc nó qua cross-attention |

### The one line that separates them

Decoder dự đoán xác suất của mỗi token khi biết các token trước nó. Encoder dự đoán token bị che khi biết các token không bị che. Cùng khối, cùng attention, khác mask và khác mục tiêu. Chỉ loss đầu tiên tạo ra mô hình có thể tiếp tục một chuỗi.

### Cross-attention

Khối decoder trong mô hình encoder-decoder có ba lớp con: masked self-attention, cross-attention và FFN. Trong cross-attention, query đến từ decoder còn key và value đến từ đầu ra encoder. Đó là nơi duy nhất thông tin đi từ nguồn đến đầu ra. Decoder thuần bỏ nó.

### Why decoder-only won language

Nó xử lý hiểu và sinh bằng một kiến trúc, nó mở rộng quy mô thuận lợi, và in-context learning cho phép một mô hình làm theo ví dụ mà không cần head mới cho mỗi tác vụ. Encoder-decoder vẫn phù hợp nhất khi đầu vào có bản sắc nguồn rõ rệt: dạng sóng, một câu trong ngôn ngữ khác, một bảng cần tóm tắt.

### The three answers

1. Xếp hạng: encoder, hoặc mô hình embedding xây dựng trên encoder, vì bạn cần biểu diễn toàn bộ tài liệu và không cần sinh.
2. Trợ lý lập trình: decoder, vì sản phẩm là sinh và causal loss là thứ làm việc sinh trở nên khả thi.
3. Chuyển giọng nói thành văn bản: encoder-decoder, vì âm thanh là chuỗi nguồn thuộc loại riêng và văn bản là chuỗi khác.

## Follow-ups

- **Level 2:** Lớp con nào chỉ tồn tại trong hình dạng encoder-decoder? Expected: cross-attention, với query từ decoder và key cùng value từ encoder.
- **Level 3:** Tại sao mô hình chỉ có decoder cũng có thể làm tác vụ hiểu? Expected: cùng mô hình token tiếp theo trả lời câu hỏi bằng cách tiếp tục prompt, và in-context learning cho phép nó làm theo ví dụ mà không có head tác vụ.
- **Level 3:** Khi nào bạn vẫn chọn encoder-decoder cho tác vụ văn bản? Expected: khi đầu vào là chuỗi nguồn rõ ràng mà đầu ra biến đổi, như dịch hoặc tóm tắt một tài liệu cố định.
- **Level 4:** Nhóm xếp hạng muốn tái sử dụng decoder họ đã phục vụ. Bằng cách nào? Expected: prompt nó và đọc logits của token nhãn, hoặc gắn head và fine-tune; cân nhắc chi phí so với encoder chấm điểm tài liệu trong một lượt.

## Wrong answers

- "Mô hình chỉ có decoder không thể phân loại." Nó có thể, bằng prompting hoặc thêm head; vấn đề là encoder thường rẻ hơn cho công việc đó.
- "Encoder sinh văn bản từng token một." Nó không có causal loss và dự đoán các vị trí bị che; nó không được huấn luyện để tiếp tục một chuỗi.
- "Mọi khối transformer đều có cross-attention." Chỉ các khối decoder của mô hình encoder-decoder có nó.

## Taught in

[Bài học về transformer đầy đủ](../../../phases/07-transformers-deep-dive/05-full-transformer/) đưa ra ba hình dạng và bảng lựa chọn, còn [bài học về mô hình hóa ngôn ngữ nhân quả](../../../phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/) đối chiếu hai loss.
