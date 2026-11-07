---
id: sft-loss-mask
title: Why the SFT loss skips the instruction tokens
card: post-training
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [screen, ml-depth]
tags: [sft, loss-mask, instruction-tuning, chat-template]
minutes: 6
lessons: [phases/10-llms-from-scratch/06-instruction-tuning-sft, phases/19-capstone-projects/39-instruction-tuning-sft]
manuals: []
practice: []
cheatsheet: [llm-pipeline-capstone]
related: [post-training/sft-data-quality-wins, post-training/sft-learning-rate-gap]
updated: 2026-11-03
---

Bạn fine-tune một mô hình nền để nó theo instruction. Vòng lặp huấn luyện của một đồng đội tính cross-entropy trên mọi token của mỗi chuỗi, gồm các token instruction. Đó có phải vấn đề? Bạn thay đổi gì, và tại sao?

## Short answer

Có. Chỉ tính loss trên các token câu trả lời. Người dùng luôn cung cấp instruction lúc suy luận, nên một gradient trên nó dạy mô hình viết câu hỏi, không phải trả lời chúng. Đặt nhãn của mọi vị trí instruction, mọi vị trí padding và token ranh giới câu trả lời thành ignore index, để chúng không thêm loss và không gradient.

## Full answer

### What the mask does

Mỗi ví dụ SFT là một chuỗi: instruction, một token ranh giới, và câu trả lời. Mô hình vẫn thấy toàn bộ chuỗi trong lượt forward, nên attention có thể đọc instruction. Loss chỉ tính các vị trí sau ranh giới. Trong PyTorch, bạn sao chép `input_ids` vào `labels` và ghi đè instruction, ranh giới và các vị trí padding bằng `-100`, `ignore_index` mặc định của `cross_entropy`. Áp dụng dịch một vị trí trước, rồi mask, để mask rơi vào các mục tiêu đúng.

### Why it is not a polish

Hai điều sai khi không có mask. Đầu tiên, mô hình dùng năng lực cho văn bản người dùng luôn cung cấp. Thứ hai, các vị trí instruction thường nhiều hơn các vị trí câu trả lời, nên answer loss là một phần nhỏ của tổng gradient. Learning rate hiệu dụng trên phần bạn quan tâm thấp hơn rate bạn đặt.

### Divide by the right count

Lấy trung bình masked loss trên số token câu trả lời, không phải trên độ dài chuỗi. Một instruction dài nếu không sẽ pha loãng tín hiệu từ một câu trả lời ngắn.

### Several turns

Với nhiều lượt assistant trong một cuộc hội thoại, mask là một cho mọi lượt assistant và không cho mọi lượt user. In cột token cạnh cột nhãn cho một ví dụ trước khi huấn luyện.

## Follow-ups

- **Level 1:** Các vị trí nào nhận ignore index? Expected: instruction, padding, và chính token ranh giới; mô hình dự đoán những gì theo sau ranh giới, không phải ranh giới.
- **Level 2:** Tại sao mô hình vẫn cần instruction trong lượt forward? Expected: câu trả lời được điều kiện hóa trên nó qua attention; mask loại bỏ loss của nó, không phải ngữ cảnh của nó.
- **Level 2:** Bạn kiểm tra mask trước một lần chạy dài như thế nào? Expected: in các token cạnh nhãn cho một ví dụ và xác nhận chỉ các vị trí câu trả lời mang nhãn thật, sau phép dịch.
- **Level 3:** Một mô hình nền được cho một câu hỏi tiếp tục viết thêm câu hỏi. SFT thay đổi gì, và không thay đổi gì? Expected: nó dạy mẫu hội thoại, nên mô hình trả lời sau dấu phản hồi; nó không thêm sự thật, chúng đến từ pretraining.

## Wrong answers

- "Loss trên instruction là tín hiệu bổ sung, nên giữ nó." Nó huấn luyện mô hình sinh instruction, và nó thu nhỏ tỷ phần gradient đến từ câu trả lời.
- "Chia masked loss cho độ dài chuỗi." Một instruction dài khi đó pha loãng tín hiệu câu trả lời; chia cho số token câu trả lời.
- "Giữ loss trên dấu phản hồi, để mô hình học xuất nó." Dấu là một phần của mẫu prompt; prompt cung cấp nó, và mô hình dự đoán những gì theo sau nó.

## Taught in

[Bài học SFT](../../../phases/10-llms-from-scratch/06-instruction-tuning-sft/) xây mask loss trong numpy, và [bài học capstone SFT](../../../phases/19-capstone-projects/39-instruction-tuning-sft/) xây hàm collate với ignore index.
