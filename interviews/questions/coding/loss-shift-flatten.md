---
id: loss-shift-flatten
title: A training loss that reaches zero and learns nothing
card: coding
kind: code-reading
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [coding, debugging]
tags: [cross-entropy, loss-alignment, training-loop]
minutes: 8
lessons: [phases/19-capstone-projects/36-training-loop-eval]
manuals: []
practice: [softmax-cross-entropy]
cheatsheet: [gpt-from-scratch-training]
related: [coding/softmax-shift-max, coding/bigram-beats-unigram]
updated: 2026-11-03
---

Một đồng nghiệp báo cáo rằng mô hình ngôn ngữ của họ đạt loss gần không rất sớm trong quá trình huấn luyện, và các mẫu được sinh là rác. Mã batch là:

```python
def calc_loss_batch(model, tokens):
    logits = model(tokens)
    return cross_entropy(logits.reshape(-1, logits.shape[-1]), tokens.reshape(-1))
```

Điều gì đã sai, và phiên bản đúng trông như thế nào?

## Short answer

Các mục tiêu chính là các đầu vào, vì vậy mô hình học dự đoán token mà nó vừa được đưa vào, điều này tầm thường và hội tụ về loss bằng không trong khi không học được gì. Mục tiêu tại vị trí `t` phải là đầu vào tại vị trí `t + 1`. Cắt lát các đầu vào để bỏ token cuối và các mục tiêu để bỏ token đầu, rồi làm phẳng cả hai thành batch nhân thời gian theo từ vựng và batch nhân thời gian.

## Full answer

### The alignment

Với các token đầu vào `t0, t1, t2, t3` các mục tiêu là `t1, t2, t3, t4`. Mỗi vị trí dự đoán token tiếp theo, là lý do một ví dụ huấn luyện bao phủ độ dài ngữ cảnh cộng một id thô. Bộ tạo batch tạo ra hai tensor đã dịch sẵn, hoặc hàm loss dịch chúng:

```python
def calc_loss_batch(model, inputs, targets):
    logits = model(inputs)
    V = logits.shape[-1]
    return cross_entropy(logits.reshape(-1, V), targets.reshape(-1))
```

với `inputs = window[:-1]` và `targets = window[1:]`.

### Why the flatten

Cross-entropy nhận một ma trận hàng theo lớp và một vector các id lớp. Làm phẳng batch và thời gian thành một trục biến logits ba chiều thành ma trận đó và các mục tiêu hai chiều thành vector đó, và trung bình trên các hàng là trung bình trên mọi vị trí được dự đoán. Việc làm phẳng không phải lỗi; việc thiếu phép dịch mới là lỗi.

### Why the symptom is a near-zero loss

Dự đoán token hiện tại từ token hiện tại chỉ cần một phép đồng nhất qua embedding và head đầu ra, điều mà một head buộc chung cung cấp miễn phí. Loss sụp xuống, loss đánh giá cũng sụp xuống, và chỉ mẫu định tính cho thấy không có gì được học. Đó là lý do vòng lặp huấn luyện in một đoạn tiếp nối được sinh ở mỗi bước thăm dò chứ không chỉ hai loss.

### The numeric side

Nhiệm vụ thực hành cũng kiểm tra rằng cross-entropy được tính từ một softmax đã dịch, để các logits lớn không tràn, và rằng loss là trung bình trên các ví dụ thay vì tổng.

## Follow-ups

- **Level 2:** Tín hiệu nào trong vòng lặp huấn luyện phát hiện lỗi này đầu tiên? Expected: mẫu được sinh ở bước thăm dò; cả hai loss trông đều xuất sắc.
- **Level 2:** Loss validation cũng gần không. Tại sao dữ liệu giữ lại không phát hiện nó? Expected: sự rò rỉ mục tiêu nằm trong định nghĩa loss, giống nhau trên cả hai phần chia.
- **Level 3:** Dataset cửa sổ trượt tránh điều này từ nguồn như thế nào? Expected: nó trả về một cửa sổ có độ dài ngữ cảnh cộng một và chia nó thành đầu vào và mục tiêu ngay trong dataset, để vòng lặp không bao giờ thấy các cặp chưa dịch.
- **Level 3:** Dữ liệu supervised fine-tuning của bạn mask các token chỉ dẫn. Mask đặt ở đâu so với phép dịch? Expected: sau phép dịch, để các vị trí bị bỏ qua khớp với các mục tiêu đã dịch.

## Wrong answers

- "Learning rate quá cao." Một learning rate cao phân kỳ hoặc dao động; sự sụp xuống loss bằng không chỉ ra một sự rò rỉ trong hàm mục tiêu.
- "Làm phẳng trộn các trục batch và thời gian." Phép làm phẳng là cần thiết; các hàng là các dự đoán độc lập và thứ tự của chúng không ảnh hưởng đến trung bình.
- "Mô hình overfit tập huấn luyện." Overfitting cho thấy một khoảng cách giữa loss huấn luyện và validation; ở đây cả hai đều sụp xuống.

## Taught in

[Bài học vòng lặp huấn luyện](../../../phases/19-capstone-projects/36-training-loop-eval/) giải thích việc căn chỉnh loss và thăm dò định tính, và [bài thực hành softmax và cross-entropy](../../../practice/softmax-cross-entropy/) kiểm tra loss theo batch.
