---
id: perplexity-from-cross-entropy
title: Read a perplexity from a mean cross-entropy
card: math-classical-ml
kind: estimate
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [screen, ml-breadth]
tags: [information-theory, perplexity, cross-entropy, language-model]
minutes: 6
lessons: [phases/01-math-foundations/09-information-theory]
manuals: []
practice: []
cheatsheet: [information-numerics]
related: [math-classical-ml/cross-entropy-is-kl-plus-entropy, math-classical-ml/log-probs-instead-of-products]
updated: 2026-11-03
---

Một mô hình ngôn ngữ có một từ vựng V token. Trên một văn bản giữ lại, cross-entropy trung bình mỗi token của nó, đo bằng nat, bằng log tự nhiên của V. Ước lượng perplexity và nói con số cho bạn biết gì về mô hình.

## Short answer

Perplexity là hàm mũ của cross-entropy trung bình, nên ở đây nó bằng V. Trung bình mô hình bất định như một lựa chọn đều trên toàn bộ từ vựng. Một mô hình đã huấn luyện nên nằm thấp hơn V nhiều. Chỉ trung bình không chứng minh mô hình không học được gì, vì các dự đoán theo token khác có thể cho cùng trung bình, nên kiểm tra các dự đoán theo token và dữ liệu.

## Full answer

### The definition

```text
perplexity = e ^ H(P, Q)    when the loss is in nats
perplexity = 2 ^ H(P, Q)    when the loss is in bits
```

Hai công thức cho cùng con số, vì 1 nat bằng 1.4427 bit và cơ số của hàm mũ thay đổi theo cơ số của log. Perplexity được đọc là số lượng hiệu dụng các lựa chọn có khả năng bằng nhau mà mô hình phân vân giữa chúng ở mỗi bước. Một perplexity 50 có nghĩa mô hình, trung bình, bối rối như thể nó phải chọn đều từ 50 token.

### The estimate

Loss là ln V. Hàm mũ của ln V là V. Các logit đều trên V token cho chính xác loss này và chính xác perplexity này. Các dự đoán theo token khác có thể cho cùng trung bình, nên chỉ con số này không chứng minh mô hình không học được gì. Xem các dự đoán theo token và phân phối dữ liệu trước khi quyết định. Bài học đưa ra một thang đo: GPT-2 đạt khoảng 30 trên các benchmark thông dụng, và các mô hình hiện đại ở mức một chữ số trên các miền được đại diện tốt.

### What to check before you blame the model

- Văn bản và tokenizer phải khớp thiết lập huấn luyện. Một tokenizer khác thay đổi số token và từ vựng, và con số theo token không so sánh được.
- Một perplexity gần V trên văn bản trong miền chỉ đến một bug: một luồng nhãn bị xáo trộn, một ánh xạ từ vựng sai, hoặc các trọng số chưa bao giờ được nạp.

## Follow-ups

- **Level 2:** Loss được báo cáo bằng bit thay vì nat. Điều gì thay đổi? Expected: lấy 2 mũ loss thay vì e; perplexity là cùng con số.
- **Level 2:** Một perplexity 50 có nghĩa gì bằng lời? Expected: trung bình mô hình bất định như một lựa chọn đều giữa 50 token.
- **Level 3:** Hai mô hình dùng các tokenizer khác nhau. Bạn có thể so sánh perplexity của chúng không? Expected: không trực tiếp; số token và từ vựng khác nhau, nên các con số theo token đo những thứ khác nhau.
- **Level 3:** Một perplexity bằng V xuất hiện trên văn bản trong miền sau huấn luyện. Bạn nghi ngờ gì trước? Expected: một bug pipeline, chẳng hạn các nhãn không thẳng hàng với đầu vào hoặc trọng số chưa được nạp, vì mô hình không làm tốt hơn ngẫu nhiên.

## Wrong answers

- "Perplexity bằng V có nghĩa mô hình hoàn hảo." Một mô hình hoàn hảo có perplexity 1. V là thứ một dự đoán đều nhận được.
- "Chia loss cho V để có perplexity." Perplexity là hàm mũ của loss, không phải một tỷ số.
- "Một perplexity thấp hơn trên bất kỳ văn bản nào có nghĩa một mô hình tốt hơn." Chỉ trên cùng văn bản với cùng tokenizer. Một văn bản hoặc từ vựng khác thay đổi con số mà không có thay đổi nào trong mô hình.

## Taught in

[Bài học lý thuyết thông tin](../../../phases/01-math-foundations/09-information-theory/) định nghĩa perplexity là hàm mũ của cross-entropy và đưa ra trường hợp đều làm một kiểm tra.
