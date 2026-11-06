---
id: adamw-not-adam-plus-l2
title: Weight decay in the loss or in the optimizer
card: deep-learning
kind: tradeoff
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [ml-depth, design-review]
tags: [optimizers, adamw, weight-decay, regularization]
minutes: 8
lessons: [phases/03-deep-learning-core/06-optimizers, phases/03-deep-learning-core/07-regularization]
manuals: []
practice: [adam-step]
cheatsheet: [optimizers-schedules]
related: [deep-learning/adam-bias-correction-first-steps, deep-learning/train-mode-and-eval-mode]
updated: 2026-11-03
---

Bạn muốn weight decay trên một transformer được huấn luyện bằng Adam. Một kỹ sư thêm một thành phần phạt L2 trên các trọng số vào loss. Người khác dùng một bộ tối ưu hóa AdamW với một đối số weight decay. Họ nói hai cách là cùng một thứ. Có phải vậy không, và bạn chọn cách nào?

## Short answer

Chúng chỉ giống nhau dưới SGD thông thường. Trong Adam, một thành phần phạt bên trong loss trở thành một phần của gradient và bị chia cho độ lớn gradient trượt như mọi thành phần khác, vì vậy các trọng số có phương sai gradient lớn nhận ít decay hơn và các trọng số có phương sai nhỏ nhận nhiều hơn. AdamW trừ lr nhân lambda nhân w sau cập nhật thích nghi, vì vậy mọi trọng số co lại theo cùng một tỷ lệ. Chọn AdamW; bài học đặt nó làm mặc định cho transformer vì lý do này.

## Full answer

### Where they agree

Thành phần L2 lambda chia 2 nhân tổng của w bình phương có gradient lambda w. Dưới SGD lượng cập nhật trừ lr nhân lambda w khỏi mỗi trọng số, chính là weight decay theo định nghĩa. Cả hai tên mô tả một thao tác.

### Where Adam breaks the equivalence

Adam không áp dụng gradient. Nó lấy trung bình nó vào moment bậc nhất, bình phương nó vào moment bậc hai, và chia cho căn của moment bậc hai. Một thành phần phạt đi cùng gradient được điều chỉnh lại tỷ lệ theo từng tham số bởi phép chia đó. Một trọng số có gradient lớn, nhiễu có một moment bậc hai lớn và nhận một phần decay nhỏ. Một trọng số có gradient yên tĩnh nhận một phần lớn. Regularization không đồng đều, và bài học báo cáo rằng nó hội tụ đến các nghiệm tệ hơn dạng tách rời trên gần như mọi nhiệm vụ.

### What AdamW does instead

```text
w = w - lr * m_hat / (sqrt(v_hat) + eps) - lr * lambda * w
```

Thành phần decay nằm bên ngoài hệ số thích nghi. Mọi trọng số mất cùng một tỷ lệ lr nhân lambda ở mỗi bước. Trong lớp viết từ đầu của bài học đây là một dòng thêm sau cập nhật Adam: trừ lr nhân weight decay nhân tham số.

### Values the lessons give

- 0.01 cho AdamW trên transformer; mặc định fine-tuning cũng là 0.01.
- 1e-4 cho SGD trên CNN, nơi hai dạng trùng nhau.
- Lên đến 0.1 cho một mô hình overfit nặng.

### A test that shows the difference

Bài tập của bài học: khởi tạo các trọng số với độ lớn cao, huấn luyện Adam với L2 và AdamW với cùng decay, và vẽ chuẩn trọng số trong quá trình huấn luyện. AdamW thu nhỏ nó nhanh hơn và đồng đều hơn.

## Follow-ups

- **Level 2:** Tại sao decay đồng đều trong AdamW? Expected: nó được áp dụng trực tiếp lên các trọng số, bên ngoài phép chia thích nghi, vì vậy tỷ lệ bị loại mỗi bước là lr nhân lambda cho mọi trọng số.
- **Level 3:** Chính xác thành phần phạt sai ở đâu bên trong Adam? Expected: nó đi vào gradient, vì vậy được lấy trung bình vào moment bậc nhất và bình phương vào moment bậc hai, và phép chia cho căn của moment bậc hai điều chỉnh lại tỷ lệ nó theo từng tham số.
- **Level 3:** Bài học đưa ra các giá trị decay nào? Expected: 0.01 cho AdamW trên transformer, 1e-4 cho SGD trên CNN, lên đến 0.1 cho một mô hình overfit nặng.
- **Level 4:** Thử nghiệm nào cho thấy sự khác biệt trong vài dòng? Expected: bắt đầu từ các trọng số có độ lớn cao, huấn luyện cả hai với cùng decay, và vẽ chuẩn trọng số; AdamW thu nhỏ nó nhanh hơn và đồng đều hơn.

## Wrong answers

- "Weight decay và L2 giống nhau theo định nghĩa." Chúng trùng nhau dưới SGD; dưới một bộ tối ưu hóa thích nghi thành phần phạt được điều chỉnh lại tỷ lệ theo từng tham số.
- "Dùng Adam với L2 và một lambda lớn hơn để bù." Một lambda lớn hơn không sửa sự không đồng đều; một số trọng số vẫn nhận gần như không có decay.
- "Adam thích nghi, vì vậy nó không cần weight decay." Thích nghi đặt các kích thước bước; nó không thu nhỏ các trọng số. Các transformer overfit vẫn cần decay.

## Taught in

[Bài học các bộ tối ưu hóa](../../../phases/03-deep-learning-core/06-optimizers/) xây dựng Adam và AdamW và giải thích việc tách rời, và [bài học regularization](../../../phases/03-deep-learning-core/07-regularization/) đưa ra các giá trị decay.
