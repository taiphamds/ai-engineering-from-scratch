---
id: dropout-off-at-eval
title: Dropout that still acts during evaluation
card: coding
kind: code-reading
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [coding, debugging]
tags: [dropout, evaluation, training-loop]
minutes: 8
lessons: [phases/19-capstone-projects/36-training-loop-eval, phases/19-capstone-projects/35-gpt-model-assembly]
manuals: []
practice: [inverted-dropout]
cheatsheet: [deep-learning-training]
related: [coding/loss-shift-flatten]
updated: 2026-11-03
---

Hai lần đánh giá trên cùng checkpoint và cùng các batch validation cố định báo cáo các loss khác nhau. Lớp dropout là:

```python
def dropout_forward(x, p, rng, training):
    mask = rng.random(x.shape) >= p
    if training:
        return x * mask / (1 - p), mask
    return x * (1 - p), mask
```

Tìm mọi vấn đề trong đường suy luận và giải thích hàm đánh giá mong đợi điều gì.

## Short answer

Inverted dropout điều chỉnh tỷ lệ các đơn vị được giữ lại trong quá trình huấn luyện để suy luận là phép đồng nhất, nhưng đường suy luận này nhân đầu vào với một trừ p, vốn thuộc dạng không đảo ngược và làm co mọi activation. Nó cũng lấy số từ bộ sinh trong chế độ suy luận, làm thay đổi mọi số ngẫu nhiên về sau trong lần chạy, chẳng hạn mask huấn luyện tiếp theo và mẫu thăm dò tiếp theo. Suy luận phải trả về đầu vào không thay đổi và không được đụng đến bộ sinh.

## Full answer

### The two bugs

1. Điều chỉnh tỷ lệ lúc suy luận. Với inverted dropout phép chia cho một trừ p xảy ra trong huấn luyện, vì vậy activation kỳ vọng đã khớp với giá trị không có dropout. Điều chỉnh tỷ lệ một lần nữa lúc suy luận làm tín hiệu giảm một nửa với tỷ lệ một phần hai và gây hại cho mọi lớp theo sau.
2. Lấy số lúc suy luận. Mask được lấy mẫu trước nhánh. Đánh giá tiêu thụ các số ngẫu nhiên, vì vậy mẫu sinh sau lần thăm dò, và bất kỳ bước huấn luyện nào về sau, thấy một luồng khác với một lần chạy không có thăm dò.

### The fix

```python
def dropout_forward(x, p, rng, training):
    if not training:
        return x.copy(), np.ones(x.shape, dtype=bool)
    mask = rng.random(x.shape) >= p
    return x * mask / (1 - p), mask
```

Lúc suy luận lớp trả về một bản sao của đầu vào và một mask có giá trị true ở mọi nơi, và nó không lấy số. Giữ một phần tử khi số ngẫu nhiên bằng hoặc lớn hơn p, để quy tắc phần bù đúng, và chia các phần tử được giữ lại cho một trừ p. Lượt truyền ngược nhân gradient đi vào với cùng mask và chia cho cùng hệ số.

### What evaluation expects

Hàm đánh giá của vòng lặp huấn luyện chạy một số lượng cố định các batch validation không có gradient và không có dropout, và con số phải tái lập được giữa các lần chạy với cùng seed và phần chia. Bất kỳ tính ngẫu nhiên nào bên trong mô hình trong lượt đó đều phá vỡ phép so sánh giữa hai lần chạy, vì sự khác biệt đo luồng ngẫu nhiên thay vì mô hình. Mô hình của bài học lắp ráp có embedding dropout là 0.1, vì vậy lớp này nằm trên đường đi của mọi lần đánh giá.

## Follow-ups

- **Level 2:** Tại sao lại chia cho một trừ p trong huấn luyện? Expected: để giá trị kỳ vọng của mỗi activation là như nhau khi có và không có mask, khiến suy luận trở thành phép đồng nhất.
- **Level 2:** Tại sao lượt truyền ngược phải dùng cùng mask? Expected: gradient chỉ được chảy qua các đơn vị đã được giữ lại, với cùng tỷ lệ, nếu không gradient không khớp với phép tính truyền tiến.
- **Level 3:** Đánh giá có thể tái lập nhưng vẫn khác với một lần chạy bỏ qua thăm dò. Còn gì khác lấy số? Expected: việc sinh có lấy mẫu ở bước thăm dò tiêu thụ các lần lấy số từ bộ sinh dùng chung; cấp cho thăm dò bộ sinh riêng của nó.

## Wrong answers

- "Giảm tỷ lệ lúc suy luận như bài báo dropout ban đầu đã làm." Dạng đó bỏ qua việc điều chỉnh tỷ lệ trong huấn luyện; trộn hai dạng làm co các activation.
- "Đặt lại seed cho bộ sinh trước mỗi lần đánh giá." Nó che giấu các lần lấy số thừa nhưng vẫn thay đổi luồng huấn luyện sau đó; đường suy luận hoàn toàn không nên lấy số.
- "Giữ một phần tử khi số ngẫu nhiên dưới p." Điều đó giữ một tỷ lệ p và bỏ phần còn lại, là phần bù của mask dự định.

## Taught in

[Bài học vòng lặp huấn luyện](../../../phases/19-capstone-projects/36-training-loop-eval/) yêu cầu đánh giá bỏ qua gradient và dropout, [bài học lắp ráp GPT](../../../phases/19-capstone-projects/35-gpt-model-assembly/) đặt embedding dropout, và [bài thực hành inverted dropout](../../../practice/inverted-dropout/) kiểm tra phép đồng nhất lúc suy luận.
