---
id: lora-parameter-count
title: Count the parameters of one LoRA adapter
card: post-training
kind: estimate
level: 1
roles: [applied-ai-engineer, inference-engineer]
rounds: [screen, ml-depth]
tags: [lora, rank, parameter-count, adapters]
minutes: 6
lessons: [phases/11-llm-engineering/08-fine-tuning-lora]
manuals: []
practice: [lora-forward]
cheatsheet: [lora-fine-tuning]
related: [post-training/qlora-on-one-gpu]
updated: 2026-11-03
---

Một phép chiếu attention trong mô hình của bạn là một ma trận vuông có 4,096 hàng và 4,096 cột. Bạn thêm một adapter LoRA rank 16 vào nó. Adapter huấn luyện bao nhiêu giá trị, và đó là tỷ phần nào của ma trận đóng băng? Sau đó nói điều gì thay đổi khi bạn tăng gấp đôi rank.

## Short answer

Adapter là hai ma trận mỏng: A có 16 hàng và 4,096 cột, và B có 4,096 hàng và 16 cột. Mỗi ma trận giữ 65,536 giá trị, nên adapter huấn luyện 131,072 tham số. Ma trận đóng băng giữ 16,777,216, nên adapter bằng 0.78 phần trăm của nó. Rank gấp đôi tăng gấp đôi adapter, vì kích thước của nó tuyến tính theo rank.

## Full answer

### The count

```text
y = W x + (alpha / r) B A x
A: r x d_in  = 16 x 4096 = 65,536
B: d_out x r = 4096 x 16 = 65,536
adapter      = 131,072
W            = 4096 x 4096 = 16,777,216
share        = 0.78 percent
```

### Why so few parameters work

Cập nhật mà fine-tuning tạo cho một ma trận trọng số có rank nội tại thấp. Rank 16 hoặc 32 nắm phần lớn nó. Bài học báo cáo LoRA ở rank 16 nằm trong khoảng một điểm của fine-tuning đầy đủ trên các benchmark nó liệt kê.

### The rank table

| Rank | Tham số cho một ma trận 4096 nhân 4096 |
|---|---|
| 4 | 32,768 |
| 8 | 65,536 |
| 16 | 131,072 |
| 32 | 262,144 |
| 64 | 524,288 |

### Alpha

Thang `alpha / r` đặt đầu ra adapter được tính bao nhiêu. Với alpha bằng rank, thang là một; một quy ước thông dụng đặt alpha bằng hai lần rank. Alpha thay đổi kích thước bước hiệu dụng, không phải số tham số.

### Which matrices

Số đếm trên là một ma trận. Các adapter trên phép chiếu query và value của mọi lớp là điểm bắt đầu thông thường. Thêm các phép chiếu key và output và các lớp MLP tăng chất lượng một chút và, trên bảng 7B của bài học, tăng số lượng từ 9.4M lên 37.7M.

## Follow-ups

- **Level 1:** Tại sao B bắt đầu ở không? Expected: tích B A khi đó bằng không, nên mô hình bắt đầu từ hành vi gốc và học thay đổi từng bước.
- **Level 2:** Số đếm thay đổi như thế nào cho một ma trận không vuông? Expected: A là r nhân chiều rộng đầu vào và B là chiều cao đầu ra nhân r, nên số đếm là r nhân tổng hai cạnh; vẫn tuyến tính theo rank.
- **Level 2:** Ở rank nào lợi thế bộ nhớ bắt đầu mờ? Expected: bài học đặt điểm lợi ích giảm dần qua 64, nơi chất lượng ngừng cải thiện và các adapter ngừng nhỏ.
- **Level 3:** Sau huấn luyện, bạn loại bỏ chi phí của tích ma trận thứ hai khi suy luận như thế nào? Expected: merge, tính W cộng alpha chia r nhân B A một lần, và lưu một ma trận đầy đủ có kích thước gốc.

## Wrong answers

- "Adapter huấn luyện r bình phương tham số." Nó huấn luyện r nhân tổng hai cạnh ma trận; r bình phương sẽ là một block rất nhỏ, không phải hai ma trận mỏng.
- "Tăng gấp đôi rank tăng gấp đôi chất lượng." Mức tăng phẳng nhanh; bài học thấy rank 16 nằm trong khoảng một điểm của fine-tuning đầy đủ và ít tăng qua 64.
- "Alpha thêm tham số." Alpha là một vô hướng cố định trên đầu ra adapter; nó thay kích thước bước hiệu dụng, không phải số lượng.

## Taught in

[Bài học LoRA](../../../phases/11-llm-engineering/08-fine-tuning-lora/) đếm các tham số adapter và xây lớp trong PyTorch.
