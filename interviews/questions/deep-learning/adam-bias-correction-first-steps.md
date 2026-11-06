---
id: adam-bias-correction-first-steps
title: What Adam's bias correction does in the first steps
card: deep-learning
kind: concept
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [ml-depth, screen]
tags: [optimizers, adam, bias-correction, learning-rate]
minutes: 8
lessons: [phases/03-deep-learning-core/06-optimizers]
manuals: []
practice: [adam-step]
cheatsheet: [optimizers-schedules]
related: [deep-learning/adamw-not-adam-plus-l2, deep-learning/warmup-before-the-peak-rate]
updated: 2026-11-03
---

Adam giữ một trung bình trượt của gradient và một trung bình trượt của bình phương của nó, và chia mỗi giá trị cho một trừ beta lũy thừa t trước khi cập nhật. Một đồng đội xóa hai phép chia đó để đơn giản hóa mã. Điều gì thay đổi trong những bước huấn luyện đầu tiên, và khi nào thay đổi ngừng có ý nghĩa?

## Short answer

Cả hai trung bình bắt đầu từ không, vì vậy ở bước một moment bậc nhất chỉ bằng (1 - beta1) lần gradient, một phần mười của nó với beta1 ở 0.9, và moment bậc hai bằng một phần nghìn gradient bình phương với beta2 ở 0.999. Các phép chia điều chỉnh lại tỷ lệ cả hai thành các ước lượng không chệch. Không có chúng căn bậc hai của moment bậc hai bị thu nhỏ nhiều hơn moment bậc nhất, vì vậy tỷ số và bước trở nên quá lớn trong khi các trung bình khởi động. Hệ số của moment bậc nhất gần 1 sau khoảng 50 bước, nhưng hệ số của moment bậc hai, 1 - 0.999 lũy thừa t, vẫn thấp hơn 1 rất nhiều trong hàng nghìn bước, vì vậy không có phép chia bước giữ quá lớn trong suốt khoảng thời gian đó.

## Full answer

### The two averages

```text
m = beta1 * m + (1 - beta1) * g        first moment, the mean gradient
v = beta2 * v + (1 - beta2) * g^2      second moment, the mean squared gradient
m_hat = m / (1 - beta1^t)
v_hat = v / (1 - beta2^t)
w = w - lr * m_hat / (sqrt(v_hat) + eps)
```

Moment bậc nhất là momentum: với beta1 ở 0.9 nó lấy trung bình khoảng mười gradient gần nhất, từ 1 chia cho (1 - 0.9). Moment bậc hai đặt kích thước bước theo từng tham số: một trọng số có gradient lớn bị chia cho một số lớn và di chuyển ít hơn, một trọng số có gradient nhỏ di chuyển nhiều hơn.

### Why the averages start wrong

Ở bước một, m bằng 0.1 lần gradient. Trung bình chưa khởi động xong, và bài học gọi đó là quá nhỏ mười lần. Điều tương tự đúng với v với một hệ số 0.001. Chia m cho (1 - 0.9) ở bước một cho lại gradient. Ở bước 100 hệ số (1 - 0.9 lũy thừa 100) khoảng 1.0, vì vậy hiệu chỉnh không còn. Quy tắc của bài học cho moment bậc nhất: nó quan trọng trong khoảng 10 bước đầu tiên và không liên quan sau 50. Moment bậc hai chậm hơn. Với beta2 ở 0.999 hệ số của nó chỉ tiến gần 1 sau hàng nghìn bước, vì vậy hiệu chỉnh của nó kéo dài lâu hơn nhiều.

### What the deletion does

Hai moment bị thu nhỏ bởi các hệ số khác nhau, và lượng cập nhật lấy tỷ số của chúng sau một căn bậc hai. Moment bậc nhất bị thu nhỏ bởi 0.1. Moment bậc hai bị thu nhỏ bởi 0.001, và căn bậc hai của nó bởi ít hơn 0.1, vì vậy mẫu số quá nhỏ và bước quá lớn. Các cập nhật sớm thực hiện các bước quá cỡ trên các thống kê được xây dựng từ một hoặc hai gradient. Triệu chứng là một loss nhảy trong những bước đầu và một lần chạy đôi khi phân kỳ trước khi ổn định.

### What else guards the first steps

Warmup, một learning rate nhỏ tăng dần trong những bước đầu tiên, bảo vệ cùng giai đoạn vì một lý do khác: hiệu chỉnh sửa tỷ lệ của các trung bình, không phải nhiễu của chúng. Lời khuyên của bài học về điều chỉnh: thay đổi learning rate trước, rồi beta2, gần như không bao giờ beta1 hoặc epsilon.

## Follow-ups

- **Level 2:** Moment bậc nhất ước lượng điều gì và moment bậc hai ước lượng điều gì? Expected: trung bình trượt của gradient, là momentum, và trung bình trượt của gradient bình phương, đặt kích thước bước theo từng tham số.
- **Level 2:** Với beta1 ở 0.9, moment bậc nhất lấy trung bình khoảng bao nhiêu gradient trước? Expected: khoảng mười, từ 1 chia cho (1 - 0.9).
- **Level 3:** Tại sao Adam vẫn muốn một warmup nếu hiệu chỉnh độ chệch tồn tại? Expected: hiệu chỉnh sửa tỷ lệ của các trung bình, không phải nhiễu của chúng; thống kê từ vài bước là một ước lượng kém, vì vậy một learning rate nhỏ lúc đầu hạn chế thiệt hại.
- **Level 3:** Bạn thay đổi siêu tham số Adam nào trước khi huấn luyện không ổn định? Expected: learning rate, rồi beta2; gần như không bao giờ beta1 hoặc epsilon.

## Wrong answers

- "Phép chia là một thành phần an toàn số học như epsilon." Epsilon bảo vệ một mẫu số bằng không; phép chia cho một trừ beta lũy thừa t hiệu chỉnh việc khởi tạo bằng không của các trung bình.
- "Không có nó những bước đầu quá nhỏ, vì vậy huấn luyện chỉ chậm hơn." Căn bậc hai của moment bậc hai bị thu nhỏ nhiều hơn moment bậc nhất, vì vậy tỷ số và bước trở nên quá lớn.
- "Cả hai hiệu chỉnh ngừng quan trọng sau khoảng 50 bước." Điều đó chỉ đúng cho moment bậc nhất. Với beta2 ở 0.999 hệ số của moment bậc hai vẫn thấp hơn 1 rất nhiều trong hàng nghìn bước.

## Taught in

[Bài học các bộ tối ưu hóa](../../../phases/03-deep-learning-core/06-optimizers/) xây dựng Adam từ đầu và tính ví dụ bước một.
