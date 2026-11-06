---
id: causal-mask-off-by-one
title: A causal mask that blocks the token itself
card: coding
kind: code-reading
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, debugging]
tags: [attention, causal-mask, decoder]
minutes: 8
lessons: [phases/07-transformers-deep-dive/02-self-attention-from-scratch]
manuals: []
practice: [scaled-dot-product-attention]
cheatsheet: [transformers-attention]
related: [coding/scale-by-sqrt-dk, coding/loss-shift-flatten]
updated: 2026-11-03
---

Attention của một decoder trả về một vector không ở hàng đầu tiên của mọi chuỗi. Mã mask là:

```python
def causal_mask(T):
    return np.triu(np.ones((T, T), dtype=bool), k=0)

weights = softmax(scores)
weights[mask] = 0
out = weights @ V
```

Có hai điều sai. Tìm cả hai và giải thích mỗi điều làm gì với đầu ra.

## Short answer

Mask dùng độ lệch đường chéo bằng không, vì vậy mọi token chặn chính nó và token đầu tiên không có key nào được cho phép, để lại một hàng rỗng. Mask cũng được áp dụng sau softmax, vì vậy các hàng không còn có tổng bằng một. Xây dựng mask với độ lệch bằng một, và đặt các điểm số bị chặn thành một giá trị âm rất lớn trước softmax.

## Full answer

### Bug one: the diagonal

Một causal mask cho phép vị trí `i` thấy các vị trí từ không đến `i`, gồm cả chính nó. `np.triu` với `k=0` giữ đường chéo trong tập bị chặn. Đối với query đầu tiên mọi key đều bị chặn, vì vậy mã này đặt toàn bộ hàng trọng số đầu tiên thành không và hàng đầu ra đầu tiên bằng không. Nếu bạn chỉ chuyển mask lên trước softmax và điền bằng âm vô cực, hàng đó không có gì để chuẩn hóa và phép chia tạo ra NaN. Dùng `k=1` để đường chéo vẫn hiển thị.

### Bug two: masking after the softmax

Đặt các trọng số thành không sau chuẩn hóa khiến tổng của mỗi hàng nhỏ hơn một, thiếu đúng khối lượng mà các key tương lai đã nhận. Đầu ra khi đó co lại và mô hình huấn luyện với một thang đo thay đổi. Mask phải tác động lên các điểm số trước softmax, bằng cách đặt các phần tử bị chặn thành một giá trị âm rất lớn, để các hàm mũ của chúng bằng không và các phần tử còn lại được chuẩn hóa lại.

### The corrected code

```python
def causal_mask(T):
    return np.triu(np.ones((T, T), dtype=bool), k=1)

scores = np.where(mask, -1e9, scores)
weights = softmax(scores)
out = weights @ V
```

### Why both bugs can pass a shape test

Không lỗi nào thay đổi hình dạng. Chỉ một phép kiểm tra các trọng số, hoặc một phép kiểm tra rằng hàng đầu ra đầu tiên không bằng không, mới phát hiện chúng. Nhiệm vụ thực hành kiểm tra các trọng số causal so với một bản tham chiếu và bao gồm hàng đầu tiên.

## Follow-ups

- **Level 2:** Tại sao dùng một số âm rất lớn chứ không phải âm vô cực? Expected: vô cực hoạt động trong hầu hết các framework, nhưng một hàng bị mask hoàn toàn khi đó tạo ra NaN, trong khi một giá trị hữu hạn giữ cho phép tính được xác định.
- **Level 2:** Mask tương tác với chiều batch như thế nào? Expected: mask có kích thước token nhân token và broadcast qua các batch và head; nó được xây dựng một lần cho mỗi độ dài chuỗi.
- **Level 3:** Cùng mô hình được dùng cho prefill rồi sau đó từng token một. Mask có thay đổi không? Expected: lúc decode query đơn lẻ thấy mọi key đã lưu cache, vì vậy không cần mask cho bước đó; quy tắc causal đã được áp dụng khi các key đó được tạo ra.
- **Level 3:** Một padding mask và một causal mask đều phải được áp dụng. Bạn kết hợp chúng như thế nào? Expected: kết hợp các mask boolean bằng phép hoặc logic trước khi các điểm số bị mask, để một key đệm bị chặn đối với mọi query.

## Wrong answers

- "Đặt các trọng số bị chặn thành không và chuẩn hóa lại các hàng." Nó hoạt động về mặt số học nhưng tăng gấp đôi công việc; mask các điểm số trước softmax thực hiện việc chuẩn hóa lại miễn phí.
- "Token đầu tiên không nên attend vào thứ gì." Token đầu tiên phải attend vào chính nó; một hàng rỗng không có phân phối hợp lệ.
- "Dùng một ma trận toàn một tam giác dưới làm mask." Một ma trận toàn một đánh dấu các phần tử được cho phép, vì vậy nó phải được đảo trước khi dùng làm mask các phần tử bị chặn.

## Taught in

[Bài học self-attention](../../../phases/07-transformers-deep-dive/02-self-attention-from-scratch/) yêu cầu mask làm bài tập đầu tiên, và [bài thực hành attention](../../../practice/scaled-dot-product-attention/) kiểm tra hàng đầu tiên của các trọng số đã mask.
