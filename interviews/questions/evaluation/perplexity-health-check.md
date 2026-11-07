---
id: perplexity-health-check
title: What a perplexity of 10 tells you
card: evaluation
kind: concept
level: 1
roles: [ai-evaluation-reliability-engineer, ai-data-engineer, applied-ai-engineer]
rounds: [screen, ml-breadth]
tags: [perplexity, language-modeling, sanity-check]
minutes: 5
lessons: [phases/10-llms-from-scratch/10-evaluation, phases/19-capstone-projects/73-perplexity-calibration]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/perplexity-padding-and-shift]
updated: 2026-11-03
---

Một đồng nghiệp báo cáo checkpoint mới đạt perplexity 10 trên văn bản giữ lại, tốt hơn tuần trước, và muốn phát hành nó là mô hình mạnh hơn. Con số có nghĩa gì, và nó không cho bạn biết gì?

## Short answer

Perplexity là hàm mũ của negative log likelihood trung bình mỗi token. Một giá trị 10 nghĩa là tại mỗi vị trí mô hình không chắc chắn như một lựa chọn đồng đều giữa 10 phương án. Thấp hơn chỉ tốt hơn khi tập kiểm thử và tokenizer giữ cố định. Nó không nói gì về làm theo chỉ dẫn, suy luận hoặc độ chính xác thực tế, vì vậy coi nó là một phép kiểm tra hợp lý và chạy các đánh giá nhiệm vụ trước khi phát hành.

## Full answer

### The definition

```text
PPL = exp( -(1/N) * sum_i log P(token_i | context) )
```

Một perplexity bằng một nghĩa là mô hình gán xác suất một cho mọi token thật. Một perplexity bằng kích thước từ vựng nghĩa là mô hình đồng đều và chưa học gì. Một mô hình cơ sở mạnh trên một corpus chuẩn nằm quanh tám đến mười hai; một mô hình xấu trên cùng văn bản nằm ở năm mươi trở lên.

### What it misses

Một mô hình có thể đạt perplexity thấp bằng cách dự đoán các mẫu phổ biến tốt trong khi kém ở các mẫu hiếm nhưng quan trọng. Con số cũng bỏ qua mọi thứ mà một mô hình chat dành cho: làm theo chỉ dẫn, suy luận và đúng. Dùng nó để bắt một checkpoint hỏng hoặc tokenizer không khớp, không để chọn một người thắng.

### Two checks before you trust it

1. **Cùng văn bản, cùng tokenizer.** Con số phụ thuộc vào cả hai. Hai mô hình được đo trên các tập giữ lại khác nhau không thể so sánh.
2. **Đếm trung thực.** Cộng loss trên các vị trí token thật và chia một lần lúc cuối. Các vị trí pad không được nằm trong mẫu số, và logits tại một vị trí dự đoán token tiếp theo. Một giá trị dưới một là không thể. Nó nghĩa là negative log likelihood được cộng ra âm, và nguyên nhân thường là một adapter trả về log p thay vì âm log p.

## Follow-ups

- **Level 1:** Giá trị perplexity nào nghĩa là mô hình không bao giờ ngạc nhiên? Expected: một, vì khi đó mọi token thật có xác suất một.
- **Level 2:** Hai mô hình được đo trên các tập kiểm thử khác nhau. Bạn có thể so sánh perplexity của chúng không? Expected: không; con số phụ thuộc vào văn bản và tokenizer, vì vậy đo cả hai trên cùng tập.
- **Level 2:** Adapter báo cáo perplexity 0.8. Điều gì xảy ra? Expected: loss được cộng là âm, rất có thể vì adapter trả về log p thay vì âm log p; perplexity dưới một là không thể, vì vậy hợp đồng đã bị vi phạm.
- **Level 3:** Tại sao đánh giá cộng loss trên các vị trí không pad và chia lúc cuối thay vì lấy trung bình perplexity theo batch? Expected: lấy trung bình theo batch cho mỗi token của một batch ngắn nhiều trọng số hơn mỗi token của một batch dài, và các vị trí pad làm co loss; tổng trên các token thật khớp định nghĩa.

## Wrong answers

- "Perplexity thấp hơn nghĩa là một trợ lý tốt hơn." Nó đo khớp với phân phối văn bản, không phải làm theo chỉ dẫn hoặc tính đúng đắn.
- "Perplexity từ hai bài báo so sánh được." Chúng phụ thuộc vào tập kiểm thử và tokenizer, vì vậy chỉ so sánh cùng tập mới đúng.
- "Nhắm perplexity gần một." Văn bản giữ lại không phải đầu ra riêng của mô hình; một giá trị gần một sẽ gợi ý văn bản kiểm thử đã có trong dữ liệu huấn luyện.

## Taught in

[Bài học đánh giá](../../../phases/10-llms-from-scratch/10-evaluation/) trình bày perplexity như một phép kiểm tra sức khỏe nhanh, và [capstone perplexity và hiệu chuẩn](../../../phases/19-capstone-projects/73-perplexity-calibration/) đưa ra phép tính cấp corpus và hợp đồng của nó.
