---
id: adamw-decoupled-decay
title: Weight decay that went into the gradient
card: coding
kind: code-reading
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, ml-depth]
tags: [adamw, weight-decay, optimizer]
minutes: 10
lessons: [phases/19-capstone-projects/36-training-loop-eval, phases/19-capstone-projects/44-cosine-lr-warmup]
manuals: []
practice: [adam-step]
cheatsheet: [optimizers-schedules]
related: [coding/decay-split-param-groups, coding/lr-peak-sweep]
updated: 2026-11-03
---

Một bước của bộ tối ưu hóa viết tay được gắn nhãn AdamW. Hãy rà soát nó:

```python
def adam_step(params, grad, m, v, t, lr, beta1, beta2, eps, weight_decay):
    grad = grad + weight_decay * params
    m = beta1 * m + (1 - beta1) * grad
    v = beta2 * v + (1 - beta2) * grad * grad
    m_hat = m / (1 - beta1 ** t)
    v_hat = v / (1 - beta2 ** t)
    return params - lr * m_hat / (np.sqrt(v_hat) + eps), m, v
```

Đây có phải AdamW không? Điều gì thay đổi, và tại sao nó quan trọng đối với một mô hình ngôn ngữ?

## Short answer

Không, đây là Adam với một thành phần phạt L2 được gộp vào gradient. AdamW áp dụng decay trực tiếp lên các tham số, được nhân theo learning rate, bên ngoài bước thích nghi. Khi thành phần phạt đi qua gradient nó bị chia cho ước lượng moment bậc hai, vì vậy các tham số có gradient lớn gần như không nhận decay và regularization trở nên không đồng đều trên toàn mô hình.

## Full answer

### The corrected step

```python
def adam_step(params, grad, m, v, t, lr, beta1, beta2, eps, weight_decay):
    m = beta1 * m + (1 - beta1) * grad
    v = beta2 * v + (1 - beta2) * grad * grad
    m_hat = m / (1 - beta1 ** t)
    v_hat = v / (1 - beta2 ** t)
    new = params - lr * (m_hat / (np.sqrt(v_hat) + eps) + weight_decay * params)
    return new, m, v
```

Thành phần decay được cộng vào lượng cập nhật, không phải vào gradient. Nó không bao giờ đi qua các ước lượng moment.

### What the difference changes

Adam chuẩn hóa mỗi tọa độ theo độ lớn gradient được cập nhật liên tục của nó. Một thành phần phạt đi vào như một phần của gradient cũng được chuẩn hóa, vì vậy một trọng số có gradient lớn, nhiễu gần như không bị decay trong khi một trọng số có gradient rất nhỏ bị decay mạnh. Decay tách rời thu nhỏ mọi trọng số theo cùng một tỷ lệ mỗi bước, đúng như mục đích của bộ regularization. Các công thức huấn luyện mô hình ngôn ngữ dùng dạng tách rời, và vòng lặp trong bài học huấn luyện xây dựng các nhóm tham số quanh nó.

### Three more details the practice pins

- Bộ đếm bước bắt đầu từ một. Với `t = 0` hiệu chỉnh độ chệch chia cho không, và với `t + 1` bước đầu tiên hoạt động như bước thứ hai.
- Epsilon nằm bên ngoài căn bậc hai. Bên trong nó, các gradient rất nhỏ tạo ra một bước nhỏ hơn nhiều so với dự định.
- Hàm trả về các mảng trạng thái mới. Cập nhật `m` và `v` tại chỗ thay đổi trạng thái của bên gọi và làm hỏng việc tiếp tục từ checkpoint.

### Where the decay should not go

Ngay cả với dạng đúng, decay chỉ thuộc về các trọng số có dạng ma trận. Các hệ số tỷ lệ chuẩn hóa và bias không nhận decay, là chủ đề của việc chia nhóm tham số.

## Follow-ups

- **Level 2:** Hiệu chỉnh độ chệch sửa điều gì trong những bước đầu? Expected: các ước lượng moment bắt đầu từ không và bị lệch thấp lúc đầu; chia cho `1 - beta**t` điều chỉnh lại tỷ lệ của chúng.
- **Level 2:** Tại sao trả về các mảng mới thay vì cập nhật tại chỗ? Expected: một hàm thuần giữ nguyên trạng thái của bên gọi, vì vậy một bước có thể được thử lại hoặc so sánh và một checkpoint giữ được tính nhất quán.
- **Level 3:** Lịch learning rate tương tác với decay tách rời như thế nào? Expected: decay được nhân với learning rate hiện tại, vì vậy warmup và cosine decay cũng điều chỉnh tỷ lệ regularization trong quá trình huấn luyện.

## Wrong answers

- "L2 và weight decay là cùng một thứ." Chúng trùng nhau đối với gradient descent thông thường, không phải đối với một bộ tối ưu hóa thích nghi chuẩn hóa gradient.
- "Đặt epsilon bên trong căn bậc hai để ổn định." Nó thay đổi kích thước bước đối với các gradient nhỏ; dạng tham chiếu cộng nó sau căn.
- "Bắt đầu bộ đếm bước từ không như một chỉ số." Hiệu chỉnh độ chệch khi đó chia cho không ở bước đầu tiên.

## Taught in

[Bài học vòng lặp huấn luyện](../../../phases/19-capstone-projects/36-training-loop-eval/) cấu hình AdamW với việc chia decay của nó, [bài học lịch cosine](../../../phases/19-capstone-projects/44-cosine-lr-warmup/) ghép nó với warmup và decay, và [bài thực hành Adam](../../../practice/adam-step/) kiểm tra dạng tách rời.
