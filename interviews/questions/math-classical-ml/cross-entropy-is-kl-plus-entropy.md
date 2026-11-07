---
id: cross-entropy-is-kl-plus-entropy
title: Why minimizing cross-entropy also minimizes KL
card: math-classical-ml
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [ml-depth, screen]
tags: [information-theory, cross-entropy, kl-divergence, entropy]
minutes: 8
lessons: [phases/01-math-foundations/09-information-theory]
manuals: []
practice: [softmax-cross-entropy]
cheatsheet: [information-numerics]
related: [math-classical-ml/perplexity-from-cross-entropy, math-classical-ml/softmax-inf-at-large-logits]
updated: 2026-11-03
---

Bộ phân loại của bạn huấn luyện theo một cross-entropy loss. Một người đánh giá hỏi tại sao thay vào đó bạn không huấn luyện theo KL divergence giữa các nhãn và dự đoán. Giải thích hai đại lượng liên hệ như thế nào và điều gì sẽ thay đổi, nếu có, trong huấn luyện.

## Short answer

Cross-entropy của P và Q bằng entropy của P cộng KL divergence từ P đến Q. Các nhãn cố định P, nên entropy của chúng là một hằng số trong huấn luyện, và hai mục tiêu có cùng gradient. Với các nhãn one-hot, entropy bằng không và hai con số bằng nhau: âm log của xác suất dự đoán cho lớp đúng.

## Full answer

### The three quantities

```text
H(P)     = - sum_x p(x) log p(x)             entropy of the true distribution
H(P, Q)  = - sum_x p(x) log q(x)             cross-entropy, P true, Q predicted
KL(P||Q) =   sum_x p(x) log (p(x) / q(x))    = H(P, Q) - H(P)
```

Entropy là độ ngạc nhiên trung bình của P dưới mã của chính nó. Cross-entropy là độ ngạc nhiên trung bình khi các sự kiện từ P được mã hóa bằng Q. KL là độ ngạc nhiên bổ sung, các bit bị lãng phí do mã hóa bằng Q thay vì P.

### Why the optimizer cannot tell them apart

Mô hình kiểm soát Q. Các nhãn cố định P, nên H(P) là một hằng số cho mỗi mẫu. Gradient của một hằng số bằng không, nên gradient của H(P, Q) và gradient của KL(P||Q) theo mô hình giống nhau. Với một nhãn one-hot, tổng có một số hạng khác không, H(P) bằng 0, và loss là âm log của xác suất dự đoán cho lớp đúng.

### When the two numbers differ

Các giá trị khác nhau khi mục tiêu có entropy dương. Label smoothing biến một mục tiêu cứng thành một mục tiêu mềm, và softmax của teacher trong distillation là mềm ngay từ đầu. Khi đó cross-entropy không thể xuống dưới H(P), trong khi KL đạt 0 khi khớp hoàn hảo. Các gradient vẫn bằng nhau, nên lựa chọn thay đổi con số bạn ghi log, không phải mô hình bạn nhận được.

### Two facts to say out loud

- KL không đối xứng. KL(P||Q) và KL(Q||P) đặt trọng số lên tỷ số log bằng các phân phối khác nhau, nên nó không phải một khoảng cách.
- Gradient của cross-entropy theo các logit là xác suất dự đoán trừ mục tiêu. Dạng gọn đó là lý do nó ghép với softmax.

## Follow-ups

- **Level 2:** Tại sao KL không phải một khoảng cách? Expected: nó không đối xứng; mỗi hướng đặt trọng số lên tỷ số log bằng một phân phối khác.
- **Level 3:** Với label smoothing, loss không bao giờ đạt không. Tại sao? Expected: mục tiêu mềm có entropy dương, và cross-entropy ít nhất bằng entropy của mục tiêu; KL sẽ đạt không khi khớp hoàn hảo.
- **Level 3:** Lấy đạo hàm loss theo từng logit. Bạn nhận dạng nào? Expected: xác suất dự đoán trừ mục tiêu, cho mỗi lớp.
- **Level 4:** Trong distillation, mục tiêu là softmax của một teacher. Bạn ghi log con số nào trong hai con số? Expected: KL, vì entropy của teacher là một độ lệch hằng mỗi mẫu che giấu student gần đến đâu; gradient giống nhau theo cả hai cách.

## Wrong answers

- "Chúng là những mục tiêu khác nhau và cho các mô hình khác nhau." Chúng khác nhau bằng entropy của các nhãn, không phụ thuộc vào mô hình, nên các gradient bằng nhau.
- "Cross-entropy là một khoảng cách giữa hai phân phối." Nó không đối xứng, và không bằng không khi các phân phối khớp; nó bằng entropy của P khi khớp.
- "KL nhỏ hơn, nên nó là loss tốt hơn." KL là cross-entropy trừ một hằng số. Bộ tối ưu thấy cùng độ dốc.

## Taught in

[Bài học lý thuyết thông tin](../../../phases/01-math-foundations/09-information-theory/) suy ra entropy, cross-entropy và KL từ đầu và cho thấy ba cách nhìn về loss phân loại.
