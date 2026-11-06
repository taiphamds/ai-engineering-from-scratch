---
id: softmax-shift-max
title: Why softmax subtracts the row maximum first
card: coding
kind: code-reading
level: 1
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [coding, screen]
tags: [softmax, numerical-stability, numpy]
minutes: 6
lessons: [phases/07-transformers-deep-dive/02-self-attention-from-scratch]
manuals: []
practice: [softmax-cross-entropy]
cheatsheet: [transformers-attention]
related: [coding/loss-shift-flatten, coding/scale-by-sqrt-dk]
updated: 2026-11-03
---

Một ứng viên viết softmax này cho một batch logits và các kiểm thử đạt trên các đầu vào nhỏ nhưng trả về NaN trên một hàng attention thực:

```python
def softmax(x):
    e = np.exp(x)
    return e / e.sum(axis=-1, keepdims=True)
```

Điều gì sai, bạn sửa nó như thế nào, và tại sao cách sửa không thay đổi kết quả?

## Short answer

Một logit lớn làm hàm mũ tràn thành vô cực, và vô cực chia cho vô cực là NaN. Trừ giá trị lớn nhất của mỗi hàng trước hàm mũ. Softmax của một hàng không thay đổi khi cùng một hằng số được trừ khỏi mọi phần tử, vì hằng số triệt tiêu giữa tử số và mẫu số.

## Full answer

### The failure

Các điểm số attention và logits của mô hình ngôn ngữ có thể đạt các giá trị hàng chục hoặc hàng trăm. Hàm mũ của một giá trị như vậy không vừa trong một float, vì vậy hàng trở thành vô cực và phép chia cho NaN. Các đầu vào kiểm thử nhỏ không bao giờ cho thấy nó.

### The fix

```python
def softmax(x):
    shifted = x - np.max(x, axis=-1, keepdims=True)
    e = np.exp(shifted)
    return e / e.sum(axis=-1, keepdims=True)
```

Sau phép dịch phần tử lớn nhất của mỗi hàng bằng không, vì vậy hàm mũ lớn nhất bằng một và không có gì tràn. Các phần tử thấp hơn nhiều so với giá trị lớn nhất bị hụt số về không, là giới hạn đúng.

### Why the result is the same

Softmax của một hàng chia mỗi hàm mũ cho tổng của mọi hàm mũ trong hàng đó. Trừ một hằng số nhân mọi hàm mũ với cùng một hệ số, và hệ số đó triệt tiêu trong tỷ số. Phép dịch phải theo từng hàng, trên trục cuối cùng. Một giá trị lớn nhất duy nhất lấy trên toàn bộ batch không thay đổi gì về tính đúng đắn nhưng để một hàng nóng đẩy mọi hàng khác vào hụt số.

### Two more details that bite

- Giữ chiều bằng `keepdims=True` để phép trừ broadcast dọc theo hàng chứ không phải dọc theo batch.
- Không trừ tại chỗ khi bên gọi vẫn cần logits.

## Follow-ups

- **Level 1:** Cùng phép dịch này xuất hiện ở đâu bên trong attention? Expected: trong softmax trên các điểm số đã điều chỉnh tỷ lệ, là lý do bài học attention viết phiên bản đã dịch trước.
- **Level 2:** Tại sao một giá trị lớn nhất toàn cục trên toàn bộ batch là một lỗi? Expected: một hàng có một logit rất lớn dịch mọi hàng khác xuống thấp hơn không rất nhiều, vì vậy các hàng đó hụt số về toàn số không và chia cho không.
- **Level 2:** Nhiệm vụ thực hành cũng yêu cầu gradient của cross-entropy trung bình. Nó là gì? Expected: softmax trừ mục tiêu one-hot, chia cho kích thước batch.

## Wrong answers

- "Cắt các logits về một phạm vi an toàn." Việc cắt thay đổi phân phối; phép dịch thì không.
- "Dùng float64 và vấn đề biến mất." Nó dịch chuyển ngưỡng, và các điểm số attention vẫn tràn trong các hàng dài.
- "Trừ trung bình thay vì giá trị lớn nhất." Trung bình không chặn phần tử lớn nhất, vì vậy một hàng vẫn có thể tràn.

## Taught in

[Bài học self-attention](../../../phases/07-transformers-deep-dive/02-self-attention-from-scratch/) xây dựng softmax đã dịch làm bước đầu tiên, và [bài thực hành softmax và cross-entropy](../../../practice/softmax-cross-entropy/) kiểm tra nó với các logits lớn.
