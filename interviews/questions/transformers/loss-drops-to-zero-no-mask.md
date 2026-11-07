---
id: loss-drops-to-zero-no-mask
title: The loss collapses and the samples are nonsense
card: transformers
kind: debug
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [debugging, coding]
tags: [causal-mask, shift-by-one, training-loss, decoder, testing]
minutes: 8
lessons: [phases/19-capstone-projects/33-multihead-self-attention, phases/19-capstone-projects/34-transformer-block, phases/07-transformers-deep-dive/07-gpt-causal-language-modeling]
manuals: []
practice: [train-char-bigram]
cheatsheet: [gpt-from-scratch-training, nn-debugging]
related: [transformers/causal-mask-minus-infinity]
updated: 2026-11-03
---

Một mô hình ngôn ngữ chỉ có decoder mới trên từ vựng 64 token đạt training loss gần không chỉ sau vài trăm bước, và văn bản lấy mẫu vô nghĩa. Nêu hai nguyên nhân có khả năng cao nhất và cách kiểm tra phân biệt chúng.

## Short answer

Trên văn bản thực, loss thấp hơn nhiều logarit của kích thước từ vựng sớm như vậy, kèm mẫu vô nghĩa, rất có thể có nghĩa mô hình thấy chính mục tiêu của nó. Hoặc causal mask bị thiếu, nên vị trí i đọc token ở i cộng một qua attention, hoặc các mục tiêu chưa từng được dịch, nên đầu vào và mục tiêu là cùng một chuỗi. Kiểm tra trọng số attention: nếu có bất kỳ khối lượng nào nằm trên đường chéo thì mask đã mất; nếu trọng số có dạng tam giác, in một batch và so sánh các cột đầu vào và mục tiêu.

## Full answer

### What a healthy run looks like

Ở bước đầu tiên, loss nên nằm gần logarit của kích thước từ vựng, khoảng 4.16 cho 64 token. Trên tác vụ lặp của bài học, nó giảm xuống thấp hơn nhiều 1.0 qua ba epoch vì token tiếp theo bằng token trước. Loss đạt không trên văn bản thực không phải đang học; nó đang sao chép.

### Cause one: the mask

Mask thay mọi phần tử phía trên đường chéo của ma trận điểm số bằng âm vô cực trước softmax. Quên nó và mọi vị trí chú ý đến toàn bộ chuỗi, kể cả câu trả lời. Cách nói của bài học: quên mask và bạn huấn luyện một mô hình gian lận. Các cách phổ biến làm mất nó: buffer mask được xây dựng cho ngữ cảnh tối đa và không bao giờ được cắt về độ dài hiện tại, mask được áp dụng sau softmax, hoặc lời gọi attention nhận một cờ mặc định là không nhân quả.

### Cause two: the shift

Với các token `[t1, t2, t3, t4]`, đầu vào là `[t1, t2, t3]` và mục tiêu là `[t2, t3, t4]`. Nếu data loader trả lại cùng một cửa sổ hai lần, mô hình học ánh xạ đồng nhất. Loss sụp xuống ngay cả với mask hoàn hảo.

### The checks

1. **Kiểm thử tính nhân quả.** Làm nhiễu token ở vị trí j và khẳng định đầu ra ở các vị trí trước j không thay đổi. Bộ kiểm thử của bài học cố định thuộc tính này.
2. **Kiểm thử tam giác.** Trả lại trọng số attention cho một head và xác nhận tam giác trên bằng không chính xác sau softmax.
3. **Kiểm tra batch.** In một cặp đầu vào và mục tiêu rồi xác nhận mục tiêu là đầu vào được dịch sang trái một vị trí.
4. **Kiểm tra trên dữ liệu giữ riêng.** Tính loss trên văn bản giữ riêng bằng cùng pipeline. Mô hình ghi nhớ tập dữ liệu nhỏ có loss trên dữ liệu giữ riêng cao và các mẫu sao chép văn bản huấn luyện; rò rỉ cho mẫu vô nghĩa.

### Why sampling exposes it

Trong huấn luyện, câu trả lời rò rỉ qua đầu vào, nên loss thấp. Khi lấy mẫu, mô hình không có gì để sao chép, nên nó phát ra nhiễu. Mô hình đã học tác vụ thực làm tốt ở cả hai.

## Follow-ups

- **Level 2:** Bạn kỳ vọng loss bao nhiêu ở bước không, và tại sao? Expected: khoảng logarit của kích thước từ vựng, khoảng 4.16 cho 64, vì mô hình ngẫu nhiên phân bố xác suất đều.
- **Level 2:** Bạn làm thế nào để lỗi dịch không thể xảy ra trong loader? Expected: cắt một cửa sổ có độ dài T cộng 1 và trả lại `window[:-1]` cùng `window[1:]` từ cùng lát cắt, với một kiểm thử trên một ví dụ.
- **Level 3:** Viết unit test tính nhân quả trong một câu. Expected: thay đổi token ở vị trí j, chạy lại khối, và khẳng định mọi đầu ra trước j không đổi.
- **Level 3:** Mask và phép dịch đều đúng, và loss vẫn thấp đáng ngờ. Còn gì rò rỉ? Expected: cửa sổ validation chồng lên luồng huấn luyện, hoặc padding token được tính làm mục tiêu dễ; kiểm tra cách chia và loss mask.

## Wrong answers

- "Mô hình chỉ đang học nhanh." Loss gần không trên văn bản tự nhiên không thể có nếu không thấy mục tiêu.
- "Thêm dropout để regularize nó." Dropout không ngăn rò rỉ; nó chỉ làm bản sao nhiễu hơn một chút.
- "Giảm learning rate." Tối ưu hóa vẫn ổn; mục tiêu bị hỏng.

## Taught in

[Capstone attention](../../../phases/19-capstone-projects/33-multihead-self-attention/) và [capstone khối](../../../phases/19-capstone-projects/34-transformer-block/) xây dựng và kiểm thử mask, còn [bài học về mô hình hóa ngôn ngữ nhân quả](../../../phases/07-transformers-deep-dive/07-gpt-causal-language-modeling/) định nghĩa loss dịch một vị trí.
