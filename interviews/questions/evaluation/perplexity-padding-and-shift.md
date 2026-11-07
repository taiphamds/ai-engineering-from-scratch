---
id: perplexity-padding-and-shift
title: Perplexity improves when the batch grows
card: evaluation
kind: code-reading
level: 3
roles: [ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [coding, debugging]
tags: [perplexity, padding, off-by-one, language-modeling]
minutes: 10
lessons: [phases/19-capstone-projects/41-eval-pipeline, phases/19-capstone-projects/73-perplexity-calibration]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/perplexity-health-check]
updated: 2026-11-03
---

Đánh giá perplexity của một đồng nghiệp tính cross entropy tại mọi vị trí của mọi batch được pad, lấy trung bình nó trên batch, lấy hàm mũ, rồi lấy trung bình các giá trị theo batch. Perplexity được báo cáo trông rất tốt và tốt hơn bất cứ khi nào kích thước batch tăng. Đọc mô tả, nêu các lỗi và đưa ra phép tính đúng.

## Short answer

Có ba lỗi: các vị trí pad nằm trong mẫu số, vì vậy loss bị pha loãng và con số cải thiện với nhiều padding hơn, là thứ một batch lớn hơn mang lại. Lấy trung bình theo batch cho mỗi token của một batch ngắn nhiều trọng số hơn mỗi token của một batch dài. Và các mục tiêu phải dịch một vị trí, vì logits tại một vị trí dự đoán token tiếp theo. Cộng loss trên các vị trí mục tiêu thật xuyên corpus, đếm các vị trí đó, chia một lần, và lấy hàm mũ.

## Full answer

### The correct accounting

```python
pred = logits[:, :-1, :]
target = ids[:, 1:]
target_mask = attn[:, 1:]
loss_per_pos = cross_entropy(pred, target, reduction="none") * target_mask
total_nll += loss_per_pos.sum()
total_tokens += target_mask.sum()
ppl = exp(total_nll / total_tokens)
```

Phép dịch căn một dự đoán với token theo sau nó. Mask loại các mục tiêu pad khỏi tử số và mẫu số. Phép chia xảy ra một lần, lúc cuối, trên toàn bộ corpus. Capstone hiệu chuẩn bọc cùng quy tắc trong một hàm nhận negative log likelihood theo chuỗi và số token rồi chia hai tổng.

### Why each bug matters

- **Padding trong mẫu số.** Một mục tiêu pad đóng góp loss bằng không sau mask nhưng vẫn tính là một vị trí. Trung bình giảm khi padding tăng, vì vậy một batch lớn hơn có nhiều padding hơn báo cáo một mô hình tốt hơn.
- **Trung bình các giá trị theo batch.** Một batch chuỗi ngắn và một batch chuỗi dài nhận trọng số bằng nhau, vì vậy các chuỗi ngắn tính nhiều hơn mỗi token so với các chuỗi dài. Dạng cộng rồi chia cho mọi token thật cùng trọng số.
- **Không dịch.** Loss vẫn giảm trong huấn luyện nếu các mục tiêu lệch, vì vậy lỗi âm thầm ở đó. Trong metric nó nghĩa là con số không phải likelihood token tiếp theo.

### Contract checks

Một perplexity dưới một là không thể; tổng loss âm, thường nhất nghĩa là adapter trả về log p thay vì âm log p. Không token thật thì không được chia; capstone trả về không phải số cho trường hợp đó và để runner quyết định.

## Follow-ups

- **Level 3:** Tại sao lỗi lệch một âm thầm trong huấn luyện nhưng nghiêm trọng trong metric? Expected: mô hình vẫn học từ các mục tiêu lệch và loss tiếp tục giảm, nhưng metric không còn đo likelihood token tiếp theo.
- **Level 3:** Adapter trả về các trung bình theo chuỗi. Harness có thể kết hợp chúng không? Expected: chỉ với số token; một trung bình các trung bình gán trọng số đều cho các chuỗi thay vì token.
- **Level 4:** Perplexity trên tập giữ lại thấp hơn nhiều so với trên văn bản production. Bạn nghi ngờ gì? Expected: một tokenizer không khớp hoặc một sự rò rỉ văn bản giữ lại vào huấn luyện; kiểm tra cả hai trước khi tuyên bố chất lượng.

## Wrong answers

- "Mask loss là đủ." Mask cũng phải rời mẫu số; đếm các vị trí pad pha loãng trung bình.
- "Lấy trung bình perplexity theo batch đủ gần." Nó cho các chuỗi ngắn nhiều trọng số hơn mỗi token và phụ thuộc vào thành phần batch; dạng cộng rồi chia là định nghĩa.
- "Một con số thấp hơn luôn là một mô hình tốt hơn." Đó là khớp tốt hơn với văn bản này; nó không nói gì về nhiệm vụ.

## Taught in

[Capstone pipeline đánh giá](../../../phases/19-capstone-projects/41-eval-pipeline/) nêu hai bẫy và phép tính đúng, và [capstone perplexity và hiệu chuẩn](../../../phases/19-capstone-projects/73-perplexity-calibration/) đưa ra hàm cấp corpus và hợp đồng của nó.
