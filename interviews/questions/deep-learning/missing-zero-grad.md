---
id: missing-zero-grad
title: A training loop whose loss swings after a few steps
card: deep-learning
kind: code-reading
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [coding, debugging]
tags: [training-loop, zero-grad, gradient-accumulation, debugging]
minutes: 10
lessons: [phases/03-deep-learning-core/13-debugging-neural-networks, phases/03-deep-learning-core/10-mini-framework]
manuals: []
practice: []
cheatsheet: [nn-debugging]
related: [deep-learning/overfit-one-batch-first, deep-learning/weight-matrix-rows-and-columns]
updated: 2026-11-03
---

Vòng lặp này huấn luyện một mạng nhỏ bằng SGD thông thường ở một learning rate nhỏ trên một batch cố định.

```python
for step in range(50):
    out = model(x)
    loss = criterion(out, y)
    loss.backward()
    optimizer.step()
```

Loss giảm trong vài bước rồi dao động lên xuống. Đọc vòng lặp, nêu lỗi, giải thích cơ chế, và nói cách sửa đặt ở đâu.

## Short answer

Vòng lặp không bao giờ đặt các gradient về không, vì vậy mỗi lời gọi backward cộng gradient mới lên trên tất cả các gradient trước. Bước áp dụng một tổng tăng dần, hoạt động như một learning rate tăng ở mỗi bước, và loss dao động. Thêm lời gọi zero_grad của bộ tối ưu hóa trước backward, là nơi vòng lặp đúng của bài học đặt nó.

## Full answer

### Why the gradient grows

Bộ lưu gradient được thiết kế là một bộ tích lũy. Một tham số được dùng ở nhiều nơi cộng các đóng góp của nó, và một lời gọi backward cộng vào gradient được lưu thay vì thay thế nó. Trong framework nhỏ backward của lớp Linear làm đúng điều đó, bằng một phép cộng bằng vào các gradient trọng số, và zero_grad của bộ tối ưu hóa đặt mọi vùng chứa gradient trở về 0.0. Một framework làm tương tự. Không có việc đặt lại, bước một áp dụng g1, bước hai áp dụng g1 cộng g2, bước ba áp dụng tổng của ba, và cứ như vậy. Hướng giữ gần đúng trong một lúc và độ lớn tăng cho đến khi các cập nhật vượt quá.

### The lesson's order

```text
zero_grad, forward, loss, backward, (clip), step, (schedule)
```

Bài học gỡ lỗi liệt kê một zero_grad bị quên đầu tiên trong số các lỗi lãng phí nhiều giờ nhất, với triệu chứng này: các gradient tích lũy qua các batch và loss dao động. Demo của nó tái hiện chính xác vòng lặp ở trên và báo cáo nó. Bài học các bộ tối ưu hóa thêm quy tắc thứ tự cho hai lời gọi cuối: scheduler bước sau bộ tối ưu hóa, và hoán đổi chúng là một lỗi tinh vi.

### How to see it in logs

Trên một batch cố định chuẩn gradient nên giảm hoặc giữ nguyên khi loss giảm. Với lỗi này nó tăng bước này qua bước khác trong khi loss ban đầu cải thiện rồi dao động với biên độ tăng. Kiểm thử overfit một batch, mà vòng lặp này giống, sẽ không đạt được một loss gần không.

### When accumulation is on purpose

Tích lũy gradient qua nhiều batch nhỏ mô phỏng một batch lớn: chạy backward trên mỗi micro batch mà không đặt về không, rồi thực hiện một bước và một zero_grad cho nhóm, với loss được điều chỉnh tỷ lệ theo kích thước nhóm. Đó là một bài tập trong bài học framework. Khác biệt với lỗi là bước duy nhất mỗi nhóm và phép chia.

## Follow-ups

- **Level 3:** Tại sao các framework tích lũy gradient thay vì ghi đè chúng? Expected: một tham số được dùng ở nhiều nơi cộng các đóng góp của nó, và tích lũy qua các micro batch mô phỏng một batch lớn hơn; việc đặt lại được để cho bên gọi.
- **Level 3:** Clipping và lịch đặt ở đâu trong thứ tự? Expected: zero_grad, forward, loss, backward, clip, step, schedule; scheduler bước sau bộ tối ưu hóa.
- **Level 4:** Bạn sẽ phát hiện lỗi này từ các log mà không đọc mã như thế nào? Expected: chuẩn gradient tăng bước này qua bước khác trên một batch cố định nơi nó nên co lại hoặc giữ nguyên, và loss dao động với biên độ tăng.
- **Level 4:** Khi nào bỏ qua zero_grad trên một số bước là đúng? Expected: tích lũy có chủ đích qua nhiều micro batch, với một bước và một zero_grad sau nhóm và loss được điều chỉnh tỷ lệ theo kích thước nhóm.

## Wrong answers

- "Learning rate quá cao." Rate nhỏ; gradient tích lũy mới là thứ tăng.
- "Chỉ đặt lại các gradient sau mỗi vài bước để làm trơn chúng." Đó là tích lũy không có phép chia; kích thước bước tăng theo kích thước nhóm và loss dao động.
- "Detach loss mỗi bước để ngăn tích tụ." Detach dừng graph, không phải các gradient được lưu; các buffer gradient vẫn giữ tổng.

## Taught in

[Bài học gỡ lỗi](../../../phases/03-deep-learning-core/13-debugging-neural-networks/) tái hiện lỗi này và liệt kê nó đầu tiên trong số các sai lầm vòng lặp huấn luyện phổ biến, và [bài học framework nhỏ](../../../phases/03-deep-learning-core/10-mini-framework/) cho thấy tại sao gradient tích lũy và zero_grad đặt lại điều gì.
