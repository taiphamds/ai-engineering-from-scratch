---
id: kaiming-factor-of-two
title: Where the 2 in Kaiming initialization comes from
card: deep-learning
kind: concept
level: 2
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [ml-depth, screen]
tags: [weight-initialization, kaiming, xavier, variance]
minutes: 8
lessons: [phases/03-deep-learning-core/08-weight-initialization]
manuals: []
practice: []
cheatsheet: [deep-learning-training]
related: [deep-learning/zero-init-symmetry, deep-learning/residual-scaling-deep-transformer]
updated: 2026-11-03
---

Khởi tạo Xavier đặt phương sai trọng số bằng 2 chia tổng fan in và fan out. Khởi tạo Kaiming đặt nó bằng 2 chia fan in. Cả hai được gọi là bảo toàn phương sai. Giải thích mỗi cách bảo toàn điều gì, số 2 trong Kaiming đến từ đâu, và điều gì xảy ra với một mạng ReLU 50 lớp bắt đầu từ một phân phối chuẩn tắc thông thường.

## Short answer

Phương sai pre-activation của một lớp là fan in nhân phương sai trọng số nhân phương sai đầu vào, vì vậy một phương sai trọng số 1 chia fan in giữ kích thước tín hiệu không đổi qua một lớp tuyến tính. Xavier cân bằng điều kiện đó giữa lượt truyền tiến và lượt truyền ngược, cho 2 chia tổng của hai số fan, và nó phù hợp với sigmoid và tanh, gần tuyến tính quanh không. ReLU đặt một nửa đầu vào của nó về không và giảm một nửa phương sai tại mỗi lớp, vì vậy Kaiming tăng gấp đôi phương sai của mỗi trọng số lên 2 chia fan in để bù. Một phân phối chuẩn tắc với fan in 512 nhân phương sai với 512 tại mọi lớp, và tín hiệu bùng nổ trong vài lớp.

## Full answer

### Variance through one layer

Với z bằng tổng của w_i x_i trên fan in số hạng với trọng số và đầu vào độc lập:

```text
Var(z) = fan_in * Var(w) * Var(x)
```

Hai sự cố của bài học suy ra ngay. Với Var(w) bằng 1 và fan in 512, mỗi lớp nhân phương sai với 512, và sau 10 lớp hệ số là 512 lũy thừa mười, khoảng 1.2 nhân 10 lũy thừa 27. Với Var(w) bằng 0.001 hệ số mỗi lớp là 0.512, và sau 10 lớp tín hiệu ở 0.00013 kích thước của nó. Mục tiêu là Var(z) bằng Var(x).

### Xavier

Glorot và Bengio yêu cầu phương sai không đổi theo cả hai hướng: truyền tiến qua fan in, truyền ngược qua fan out. Thỏa hiệp là Var(w) bằng 2 chia (fan in cộng fan out), được lấy mẫu dưới dạng một phân phối chuẩn với phương sai đó hoặc một phân phối đều có giới hạn là căn bậc hai của 6 chia cùng tổng đó. Nó đúng cho sigmoid và tanh vì, tại một khởi tạo có tỷ lệ phù hợp, các đầu vào của chúng nằm trong vùng gần tuyến tính quanh không.

### Kaiming

ReLU đặt mọi pre-activation âm về không. Trung bình một nửa số đơn vị tắt, vì vậy phương sai đến lớp tiếp theo bằng một nửa những gì phân tích tuyến tính dự đoán. He và các đồng nghiệp tăng gấp đôi phương sai trọng số để triệt tiêu điều đó: Var(w) bằng 2 chia fan in. Không có số 2 tín hiệu co lại khoảng 0.5 mỗi lớp, và qua 50 lớp đó là 0.5 lũy thừa 50, khoảng 8.8 nhân 10 lũy thừa âm 16. GELU và Swish dùng cùng quy tắc. Lớp tuyến tính của một framework mặc định lấy mẫu Kaiming đều, là lý do các mạng nông huấn luyện mà không cần nghĩ đến nó.

### The check

Đẩy các đầu vào ngẫu nhiên qua mạng chưa huấn luyện và ghi log độ lớn activation trung bình tại mỗi lớp. Thử nghiệm của bài học in nó ở các lớp 1, 5, 10, 25 và 50: một phân phối chuẩn tắc bùng nổ, một phân phối chuẩn với độ lệch chuẩn 0.01 tiêu biến, và cả Xavier với sigmoid và Kaiming với ReLU giữ gần 1.0 qua lớp 50.

## Follow-ups

- **Level 2:** Tại sao khởi tạo bằng không thất bại dù phương sai của nó giữ không đổi? Expected: mọi neuron tính cùng hàm và nhận cùng gradient, vì vậy lớp có một neuron hiệu dụng; các trọng số ngẫu nhiên phá đối xứng.
- **Level 3:** Khởi tạo nào đi với GELU? Expected: Kaiming, như với ReLU.
- **Level 3:** Bạn xác minh một khởi tạo mà không huấn luyện như thế nào? Expected: đẩy dữ liệu ngẫu nhiên qua mạng và ghi log độ lớn activation trung bình mỗi lớp; nó nên giữ trong một dải chẳng hạn 0.5 đến 2.0 ở mọi độ sâu.
- **Level 4:** Tại sao các mạng residual cần một hệ số tỷ lệ thêm ngoài Kaiming? Expected: mỗi phép cộng residual thêm phương sai, vì vậy luồng tăng theo số lớp; sơ đồ GPT-2 điều chỉnh tỷ lệ trọng số residual bằng 1 chia căn bậc hai của 2N.

## Wrong answers

- "Ngẫu nhiên là ngẫu nhiên, tỷ lệ không quan trọng nếu nó nhỏ." Quá nhỏ thì tiêu biến và quá lớn thì bùng nổ; bài học cho thấy cả hai, và dư địa mỏng ở 50 lớp.
- "Xavier cũng hoạt động cho ReLU, khác biệt nhỏ." Xavier ước lượng thấp phương sai ReLU cần theo hệ số 2, và qua 50 lớp tín hiệu giảm xuống khoảng 8.8 nhân 10 lũy thừa âm 16.
- "Số 2 của Kaiming đại diện cho lượt truyền tiến và truyền ngược." Số 2 đó bù cho việc ReLU đặt một nửa activation về không; số 2 của Xavier mới là số cân bằng hai lượt.

## Taught in

[Bài học khởi tạo trọng số](../../../phases/03-deep-learning-core/08-weight-initialization/) suy ra cả hai công thức và chạy thử nghiệm 50 lớp.
