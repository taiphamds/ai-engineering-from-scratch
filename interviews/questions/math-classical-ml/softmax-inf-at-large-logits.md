---
id: softmax-inf-at-large-logits
title: A cross-entropy that returns inf on real batches
card: math-classical-ml
kind: debug
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [numerical-stability, softmax, log-sum-exp, overflow]
minutes: 8
lessons: [phases/01-math-foundations/13-numerical-stability, phases/01-math-foundations/06-probability-and-distributions]
manuals: []
practice: [softmax-cross-entropy]
cheatsheet: [information-numerics]
related: [math-classical-ml/log-probs-instead-of-products, math-classical-ml/variance-of-large-numbers]
updated: 2026-11-03
---

Một cross-entropy từ đầu vượt qua các unit test trên các logit nhỏ. Trên các batch thực, loss trả về inf. Bạn in batch và một vector logit là [100, 101, 102]. Trình bày nguyên nhân và cách sửa, và nói tại sao cách sửa không phải một xấp xỉ.

## Short answer

Hàm mũ của 100 khoảng 2.69 nhân 10 mũ 43, vượt xa giá trị tối đa float32 khoảng 3.4 nhân 10 mũ 38, nên mỗi số hạng của mẫu số softmax overflow và tỷ số là inf hoặc nan. Trừ logit lớn nhất khỏi mọi logit trước hàm mũ. Các xác suất giống hệt trong số học chính xác, và số hạng lớn nhất giờ là exp(0), bằng 1.

## Full answer

### Where the inf comes from

Softmax chia exp của một logit cho tổng exp của tất cả logit. Hàm exp là nguồn overflow chính trong mã ML: exp(88.7) gần giới hạn float32 và exp(89.0) đã là inf. Với vector trong câu hỏi, mọi số hạng overflow, nên tổng là inf, tỷ số là nan, và log của nó là nan hoặc inf.

### The shift

Gọi c là logit lớn nhất. Nhân tử số và mẫu số với exp(-c):

```text
softmax(x_i) = exp(x_i - c) / sum_j exp(x_j - c)
```

Hệ số exp(c) triệt tiêu, nên kết quả là cùng hàm. Sau phép dịch, số mũ lớn nhất là exp(0) = 1, nên không có gì có thể overflow, và vì một số hạng bằng 1 nên tổng ít nhất là 1, nên log của tổng không thể đạt âm vô cực. Với vector trong câu hỏi, các logit đã dịch là -2, -1 và 0, các hàm mũ là 0.135, 0.368 và 1.000, và các xác suất là 0.090, 0.245 và 0.665.

### Compute log probabilities first

Không tính một xác suất rồi lấy log của nó. Tính log xác suất thẳng từ các logit:

```text
log_softmax(x_i) = (x_i - c) - log(sum_j exp(x_j - c))
loss = -log_softmax(x_true)
```

Đây là thủ thuật log-sum-exp. Một loss framework nhận logit hợp nhất hai bước này vì cùng lý do. Cùng thủ thuật cũng cứu trường hợp mọi logit là các số âm lớn: không có nó, mọi exp underflow về 0 và log cho âm vô cực.

## Follow-ups

- **Level 2:** Tại sao phép dịch giữ các xác suất không đổi? Expected: hệ số exp(c) xuất hiện trong tử số và mẫu số và triệt tiêu.
- **Level 2:** Điều gì sai khi mọi logit rất âm? Expected: mọi hàm mũ underflow về 0 và log của tổng là âm vô cực; cùng phép dịch sửa nó vì số hạng lớn nhất thành exp(0) = 1.
- **Level 3:** Tại sao tính loss từ log-softmax thay vì log của một softmax? Expected: một xác suất đã underflow về 0 có log là âm vô cực; log-softmax trừ log-sum-exp và không bao giờ tạo xác suất.
- **Level 3:** Một hàm loss framework nhận các logit, không phải xác suất. Tại sao? Expected: nó hợp nhất log-softmax và negative log-likelihood trong một bước ổn định, nên bên gọi không thể overflow hoặc underflow trên đường vào.

## Wrong answers

- "Chặn mọi logit ở 80 rồi tiếp tục." Một phép chặn thay đổi các xác suất bất cứ khi nào một logit vượt nó. Phép dịch cho chính xác cùng xác suất mà không có giới hạn trên các logit.
- "Chuyển sang float64." Một số mũ rộng hơn chỉ di chuyển điểm overflow. Các logit tăng trong huấn luyện và sẽ vượt nó.
- "Thêm một epsilon nhỏ bên trong log." Inf đến từ hàm mũ, trước log. Một epsilon không làm gì với một mẫu số vô hạn.

## Taught in

[Bài học tính ổn định số](../../../phases/01-math-foundations/13-numerical-stability/) suy ra thủ thuật log-sum-exp, và [bài học xác suất](../../../phases/01-math-foundations/06-probability-and-distributions/) xây dựng softmax và log-softmax ổn định.
