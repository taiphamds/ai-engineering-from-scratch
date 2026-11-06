---
id: bigram-beats-unigram
title: Train the smallest language model past its baseline
card: coding
kind: take-home
level: 3
roles: [applied-ai-engineer, ai-data-engineer, ai-evaluation-reliability-engineer]
rounds: [coding, take-home]
tags: [training-loop, baseline, held-out-loss, bigram]
minutes: 30
lessons: [phases/19-capstone-projects/36-training-loop-eval]
manuals: []
practice: [train-char-bigram]
cheatsheet: [gpt-from-scratch-training, text-processing-classic]
related: [coding/loss-shift-flatten, coding/lr-peak-sweep]
updated: 2026-11-03
---

Viết một vòng lặp huấn luyện cho một bảng logits của ký tự tiếp theo: một hàng cho mỗi ký tự ngữ cảnh, một cột cho mỗi ký tự tiếp theo. Huấn luyện nó bằng gradient descent trên một văn bản, trong một ngân sách bước cố định và với một bộ sinh được đặt seed, cho đến khi NLL trên tập giữ lại của nó thấp hơn một mô hình bỏ qua ngữ cảnh. Hãy cho tôi biết phép kiểm tra trên tập giữ lại phải như thế nào để phép so sánh có ý nghĩa.

## Short answer

Xây dựng các cặp sao cho ký tự hiện tại là ngữ cảnh và ký tự theo sau là mục tiêu, tính log-softmax trên mỗi hàng, và thực hiện gradient descent trên trung bình của các log xác suất mục tiêu âm trên các cặp huấn luyện trong ngân sách bước. Phép kiểm tra trên tập giữ lại chấm điểm một phần chia cố định mà huấn luyện chưa từng thấy, với cùng định nghĩa loss cho bigram và baseline unigram, và mô hình chỉ đạt khi giá trị trên tập giữ lại của nó thấp hơn của baseline. Khả năng tái lập đến từ việc lấy bảng ban đầu từ bộ sinh mà bên gọi truyền vào, không phải từ một bộ sinh toàn cục.

## Full answer

### The model and the loop

```python
def train(text, rng, steps, lr):
    pairs = [(ord(a), ord(b)) for a, b in zip(text, text[1:])]
    W = rng.normal(0, 1, (V, V))
    for _ in range(steps):
        logits = W[[a for a, _ in pairs]]
        logp = log_softmax(logits)
        grad = softmax(logits)
        grad[np.arange(len(pairs)), [b for _, b in pairs]] -= 1
        gW = np.zeros_like(W)
        np.add.at(gW, [a for a, _ in pairs], grad / len(pairs))
        W = W - lr * gW
    return W


def next_log_probs(W, context):
    return log_softmax(W[context])
```

Hướng của cặp là toàn bộ mô hình: ngữ cảnh trước, mục tiêu sau. Đảo ngược chúng huấn luyện một mô hình dự đoán ký tự trước đó, và tính mỗi ký tự tiếp theo là ngữ cảnh của chính nó không huấn luyện được gì về cái gì đi sau cái gì.

### The gradient sign

Lượng cập nhật trừ gradient. Cộng nó làm loss tăng, điều này thấy được ở lần đánh giá đầu tiên, và là biến thể lỗi đầu tiên mà bài thực hành kiểm tra.

### The held-out check

Quy tắc của bài học vòng lặp là đánh giá chạy trên một lát cắt giữ lại cố định không có gradient, và con số phải so sánh được giữa các lần chạy. Đối với nhiệm vụ này điều đó có nghĩa là ba việc. Phần chia được cố định trước khi huấn luyện và vòng lặp không bao giờ đụng đến. Baseline unigram, gán cho mỗi ký tự tần suất của nó trong văn bản huấn luyện bất kể ngữ cảnh, được chấm điểm trên cùng các ký tự giữ lại với cùng định nghĩa loss. Bigram chỉ đạt khi giá trị trên tập giữ lại của nó thấp hơn nghiêm ngặt. Một mô hình thắng trên văn bản huấn luyện và không thắng trên văn bản giữ lại đã ghi nhớ văn bản huấn luyện.

### The budget

Ngân sách bước là một phần của hợp đồng. Một vòng lặp chạy nhiều bước hơn ngân sách có thể đạt mục tiêu nhưng không đạt nhiệm vụ, và trong một lần chạy thực tế đó là sự khác biệt giữa một công việc được lên kế hoạch và một lần vượt ngân sách.

## Follow-ups

- **Level 3:** Tại sao trả về log xác suất chứ không phải logits thô từ hàm chấm điểm? Expected: loss cần một phân phối được chuẩn hóa cho mỗi hàng; logits thô không so sánh được giữa các ngữ cảnh.
- **Level 3:** Mô hình thắng baseline trên văn bản huấn luyện và thua trên văn bản giữ lại. Điều gì đã xảy ra? Expected: nó đã ghi nhớ các cặp huấn luyện; một phần chia giữ lại tồn tại để phát hiện chính điều đó.
- **Level 4:** Vòng lặp đồ chơi này ánh xạ vào vòng lặp huấn luyện đầy đủ trong bài học như thế nào? Expected: việc xây dựng cặp là phép dịch đi một, việc tra cứu hàng là lượt truyền tiến, phép kiểm tra trên tập giữ lại là đánh giá cố định, và ngân sách là số bước của lịch.

## Wrong answers

- "Đánh giá trên văn bản huấn luyện để tiết kiệm thời gian." Phép so sánh khi đó đo sự ghi nhớ và việc so sánh với baseline không có ý nghĩa.
- "Lấy bảng ban đầu từ trạng thái ngẫu nhiên toàn cục." Hai lần chạy với một seed khi đó khác nhau, và kiểm thử khả năng tái lập thất bại.
- "Huấn luyện cho đến khi loss ngừng cải thiện." Ngân sách là một phần của hợp đồng và một vòng lặp không có điểm kết thúc xác định che giấu một lần chạy chậm hoặc bị kẹt.

## Taught in

[Bài học vòng lặp huấn luyện](../../../phases/19-capstone-projects/36-training-loop-eval/) đặt ra các quy tắc cho đánh giá trên tập giữ lại và căn chỉnh loss, và [bài thực hành bigram ký tự](../../../practice/train-char-bigram/) huấn luyện mô hình nhỏ nhất trong một ngân sách bước.
