---
id: decay-split-param-groups
title: Which parameters get weight decay
card: coding
kind: code-reading
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, ml-depth]
tags: [adamw, weight-decay, parameter-groups, layernorm]
minutes: 10
lessons: [phases/19-capstone-projects/36-training-loop-eval]
manuals: []
practice: [adam-step]
cheatsheet: [optimizers-schedules, gpt-from-scratch-training]
related: [coding/adamw-decoupled-decay, coding/rmsnorm-vs-layernorm]
updated: 2026-11-03
---

Một lần huấn luyện có vẻ ổn trong vài nghìn bước đầu tiên, rồi loss bắt đầu tăng và các mẫu suy giảm. Bộ tối ưu hóa được xây dựng với một nhóm tham số:

```python
optimizer = AdamW(model.parameters(), lr=lr, weight_decay=weight_decay)
```

Viết hàm xây dựng các nhóm tham số đúng cách và giải thích những tensor nào phải được loại khỏi decay và tại sao.

## Short answer

Decay thuộc về các tensor có dạng ma trận, là các trọng số tuyến tính và các bảng embedding, và không thuộc về các hệ số tỷ lệ chuẩn hóa hoặc bias. Một hệ số tỷ lệ LayerNorm bị decay trôi dần về không qua hàng nghìn bước cho đến khi chuẩn hóa ngừng hoạt động, khớp với sự cố muộn. Chia các tham số theo hình dạng thành một nhóm có decay và một nhóm không decay rồi truyền cả hai vào bộ tối ưu hóa.

## Full answer

### The split

```python
def build_param_groups(model, weight_decay):
    decay, no_decay = [], []
    for name, p in model.named_parameters():
        if not p.requires_grad:
            continue
        (decay if p.dim() >= 2 else no_decay).append(p)
    return [
        {"params": decay, "weight_decay": weight_decay},
        {"params": no_decay, "weight_decay": 0},
    ]
```

Một tensor hai chiều hoặc lớn hơn là một ma trận trọng số hoặc một bảng embedding. Một tensor một chiều là một hệ số tỷ lệ hoặc một độ dịch, bao gồm các tham số LayerNorm và mọi bias. Quy tắc theo số chiều đơn giản và khớp với công thức chuẩn.

### Why decay on a scale is harmful

Weight decay kéo mọi tham số có decay về không ở mỗi bước. Một trọng số tuyến tính có lực gradient theo nhiều hướng và lực kéo đóng vai trò regularization. Một hệ số tỷ lệ LayerNorm có một nhiệm vụ, đặt độ lớn của các activation đã chuẩn hóa, và một lực kéo đều đặn về không làm co luồng residual của mọi block cho đến khi tín hiệu quá nhỏ đối với các lớp theo sau. Hiệu ứng tích lũy chậm, là lý do lần chạy trông ổn lúc đầu.

### Why decay on a bias is waste

Decay một bias vô hại về mặt toán học nhưng tiêu tốn các chu kỳ cập nhật trên một tham số mà regularization không cần kiểm soát. Việc chia loại nó ra cùng với các hệ số tỷ lệ.

### How to test the split

Một kiểm thử đơn vị có thể duyệt các tham số được đặt tên và khẳng định rằng mỗi hệ số tỷ lệ và bias đã vào nhóm không decay và mỗi trọng số tuyến tính và embedding đã vào nhóm có decay. Bài học vòng lặp liệt kê chính kiểm thử này làm bài tập đầu tiên.

## Follow-ups

- **Level 3:** Head mô hình ngôn ngữ được buộc chung với token embedding. Nó thuộc nhóm nào, và bao nhiêu lần? Expected: một lần, trong nhóm có decay, vì nó là cùng tensor với bảng embedding.
- **Level 3:** Một mô hình dùng RMSNorm thay vì LayerNorm. Quy tắc có thay đổi không? Expected: không; trọng số RMSNorm là một chiều và nằm ngoài nhóm có decay.
- **Level 4:** Tại sao vấn đề xuất hiện muộn thay vì ở đầu quá trình huấn luyện? Expected: decay thu nhỏ hệ số tỷ lệ theo một tỷ lệ nhỏ mỗi bước, vì vậy thiệt hại tích lũy qua hàng nghìn bước trước khi các activation trở nên quá nhỏ.

## Wrong answers

- "Weight decay áp dụng cho mọi trọng số theo định nghĩa." Công thức chuẩn loại trừ các tensor chuẩn hóa và bias; áp dụng nó ở mọi nơi làm hỏng chuẩn hóa theo thời gian.
- "Quyết định theo tên tham số, loại trừ bất cứ thứ gì được gọi là bias." Tên khác nhau giữa các cách triển khai; quy tắc số chiều vững chắc.
- "Giảm weight decay cho đến khi lần chạy ổn định." Một giá trị nhỏ hơn làm chậm sự trôi dần nhưng vẫn giữ lực kéo lên các hệ số tỷ lệ.

## Taught in

[Bài học vòng lặp huấn luyện](../../../phases/19-capstone-projects/36-training-loop-eval/) định nghĩa việc chia AdamW thành hai nhóm và kiểm thử cho nó, và [bài thực hành Adam](../../../practice/adam-step/) triển khai decay tách rời mà các nhóm đưa vào.
