---
id: residual-scaling-deep-transformer
title: Why a deep residual stack needs more than Kaiming
card: deep-learning
kind: concept
level: 3
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [ml-depth, design-review]
tags: [weight-initialization, residual-connections, transformers, variance]
minutes: 12
lessons: [phases/03-deep-learning-core/08-weight-initialization]
manuals: []
practice: []
cheatsheet: [deep-learning-training]
related: [deep-learning/kaiming-factor-of-two, deep-learning/layernorm-not-batchnorm]
updated: 2026-11-03
---

Một transformer với các trọng số được khởi tạo Kaiming huấn luyện không gặp rắc rối ở 20 lớp và phân kỳ ở 126 lớp với cùng công thức. Không có gì khác thay đổi. Giải thích tại sao độ sâu phá nó ngay cả với một khởi tạo bảo toàn phương sai, và cách sửa kiểu GPT-2 làm gì.

## Short answer

Kaiming giữ phương sai không đổi qua mỗi lớp con, nhưng một residual block cộng đầu ra của lớp con trở lại đầu vào của nó, và phương sai của một tổng các số hạng độc lập cộng lại. Với N phép cộng residual phương sai của luồng tăng tỷ lệ với N, vì vậy một chồng sâu hơn mang một tín hiệu residual lớn hơn, và các logit attention cùng các activation feed-forward được xây dựng từ nó tăng cùng nó. Cách sửa GPT-2 điều chỉnh tỷ lệ các trọng số của những lớp ghi vào luồng residual bằng 1 chia căn bậc hai của 2N, để phương sai tích lũy giữ như nhau ở bất kỳ độ sâu nào.

## Full answer

### Two kinds of variance preservation

Kaiming trả lời một câu hỏi: lấy mẫu trọng số như thế nào để một phép nhân ma trận theo sau bởi một ReLU trả về một tín hiệu có cùng phương sai nó nhận. Nó không biết gì về điều xảy ra tiếp theo. Trong một residual block điều tiếp theo là một phép cộng:

```text
x = x + sublayer(x)
```

Nếu đầu ra lớp con có phương sai khoảng bằng x và gần độc lập với nó, tổng có khoảng gấp đôi phương sai. Mỗi block cộng lần nữa. Sau N phép cộng luồng đã tăng tỷ lệ với N. Bài học nêu trực tiếp điều này: mỗi phép cộng tăng phương sai, và với N lớp residual phương sai tăng tỷ lệ với N.

### Why it shows up as depth

Ở 20 lớp mức tăng là một hệ số vừa phải và bộ tối ưu hóa xử lý được. Ở 126 lớp, độ sâu bài học dẫn cho một mô hình 405B tham số, luồng đủ lớn lúc khởi tạo để softmax bên trong attention và các activation trong các feed-forward block chạy xa phạm vi dự định của chúng, và các cập nhật đầu tiên quá cỡ. Không có một hiệu chỉnh, bài học nói, luồng residual sẽ tăng không giới hạn qua chồng lớp.

### The fix

GPT-2 điều chỉnh tỷ lệ các trọng số của các phép chiếu residual, những lớp ghi vào luồng, bằng 1 chia căn bậc hai của 2N, trong đó N là số lớp. Số 2 đếm hai lần ghi mỗi lớp, một từ attention và một từ feed-forward block. Tổng của 2N đóng góp mỗi đóng góp được nhân tỷ lệ bởi hệ số đó có cùng phương sai như một đóng góp, vì vậy luồng giữ trong phạm vi ở bất kỳ độ sâu nào. Bài học ghi chú rằng mô hình 405B dùng một sơ đồ tương tự và một transformer được xây từ đầu phải tự thêm việc điều chỉnh tỷ lệ này.

### How to confirm before you change anything

Đẩy các token ngẫu nhiên qua mô hình chưa huấn luyện và ghi log độ lớn luồng residual tại mỗi lớp. Tăng theo độ sâu xác nhận chẩn đoán. Chạy nó lại với việc điều chỉnh tỷ lệ và đường cong nên phẳng. Bài tập của bài học làm đúng điều này qua 50 lớp.

## Follow-ups

- **Level 3:** Tại sao Kaiming không tính đến điều này? Expected: nó bảo toàn phương sai qua một phép nhân ma trận theo sau bởi ReLU; nó không biết gì về phép cộng theo sau.
- **Level 3:** Tại sao 2N chứ không phải N? Expected: mỗi lớp transformer ghi vào luồng hai lần, một lần từ attention và một lần từ feed-forward block, vì vậy N lớp tạo 2N phép cộng.
- **Level 4:** Bạn sẽ xác nhận chẩn đoán trước khi thay đổi khởi tạo như thế nào? Expected: đẩy đầu vào ngẫu nhiên qua mô hình chưa huấn luyện và ghi log độ lớn luồng residual mỗi lớp; tăng theo độ sâu xác nhận nó, và phiên bản được điều chỉnh tỷ lệ nên phẳng.
- **Level 4:** Một bố trí Pre-LN có loại bỏ nhu cầu điều chỉnh tỷ lệ không? Expected: nó chuẩn hóa thứ đi vào mỗi lớp con và giúp ổn định, nhưng các phép cộng vào luồng nằm ngoài norm, vì vậy bài học vẫn áp dụng việc điều chỉnh tỷ lệ cho các lớp ghi.

## Wrong answers

- "Các mô hình sâu hơn chỉ cần một learning rate nhỏ hơn." Một rate nhỏ hơn làm chậm sự tăng trưởng của trọng số; nó không làm gì với phương sai tích lũy trong lượt truyền tiến lúc khởi tạo.
- "Kaiming bảo toàn phương sai, vì vậy độ sâu không thể là vấn đề." Nó bảo toàn phương sai qua mỗi lớp con, không qua tổng của một lớp con và đầu vào của nó.
- "Chia luồng residual cho N tại đầu ra." Cách sửa phải tác động nơi phương sai tích lũy; điều chỉnh tỷ lệ các lớp ghi giữ mọi lớp trung gian trong phạm vi, không chỉ lớp cuối.

## Taught in

[Bài học khởi tạo trọng số](../../../phases/03-deep-learning-core/08-weight-initialization/) giải thích sự tăng phương sai residual và sơ đồ điều chỉnh tỷ lệ GPT-2.
