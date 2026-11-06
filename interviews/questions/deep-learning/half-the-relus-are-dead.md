---
id: half-the-relus-are-dead
title: Two layers where most ReLU outputs are exactly zero
card: deep-learning
kind: debug
level: 3
roles: [applied-ai-engineer, inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [dead-relu, activation-functions, learning-rate, debugging]
minutes: 12
lessons: [phases/03-deep-learning-core/04-activation-functions, phases/03-deep-learning-core/13-debugging-neural-networks]
manuals: []
practice: []
cheatsheet: [nn-debugging]
related: [deep-learning/sigmoid-gradient-after-ten-layers, deep-learning/zero-init-symmetry]
updated: 2026-11-03
---

Sau vài trăm bước ở một learning rate cao, loss của một mạng ReLU ngừng giảm. Bạn ghi log các activation sau mỗi ReLU, và trong hai lớp hơn một nửa chúng chính xác bằng không trên mọi batch. Giải thích điều gì đã xảy ra với các đơn vị đó, tại sao chúng không thể tự trở lại, và bạn thay đổi gì.

## Short answer

Trước tiên xác nhận rằng các đơn vị đã chết chứ không chỉ thưa: trên một mẫu lớn, một đơn vị chết bằng không trên mọi đầu vào. Một đơn vị ReLU có pre-activation âm cho mọi đầu vào xuất ra không và có đạo hàm bằng không, vì vậy nó không nhận gradient và các trọng số của nó không bao giờ di chuyển nữa. Một cập nhật lớn, do learning rate cao thúc đẩy, đã đẩy các trọng số và bias của những đơn vị đó đủ xa về phía âm để không đầu vào nào đưa chúng trở lại. Hạ learning rate, khởi tạo lại các đơn vị chết hoặc các lớp chết, và chuyển sang một activation có gradient ở phía âm, chẳng hạn một biến thể leaky hoặc GELU.

## Full answer

### What a dead unit is

ReLU là max(0, x). Đạo hàm của nó là 1 cho các đầu vào dương và 0 trong các trường hợp khác. Một đơn vị có đầu vào âm trên mọi mẫu xuất ra 0, truyền 0 gradient đến các trọng số của nó, và không có gì khác trong loss tác động đến các trọng số đó. Nó chết trong phần còn lại của huấn luyện. Bài học activation báo cáo rằng 10 đến 40 phần trăm các đơn vị có thể chết trong một mạng ReLU trong thực tế. Ngưỡng của bài học gỡ lỗi là hơn một nửa số không sau một lớp ReLU: tại điểm đó đổi activation hoặc giảm learning rate.

### How the high learning rate did it

Một bước quá cỡ đẩy bias hoặc trọng số của một đơn vị xa về phía âm. Sau bước đó mọi đầu vào rơi xuống dưới không. Demo của bài học gỡ lỗi xây dựng trạng thái trực tiếp bằng cách điền trọng số bằng -1.0 và bias bằng -5.0 và cho thấy một loss phẳng với phần lớn activation ở không. Một learning rate cao vô tình đạt cùng trạng thái.

### Telling dead from sparse

Một số giá trị không là bình thường; ReLU được thiết kế để thưa. Đếm, trên một mẫu lớn, tỷ lệ đầu vào mà trên đó mỗi đơn vị dương. Chết nghĩa là không trên tất cả chúng. Bộ phát hiện của bài học activation báo cáo các đơn vị chết, gần như không còn sống và khỏe từ số đếm đó.

### What to change

1. Hạ learning rate, và thêm gradient clipping để một batch xấu không thể tạo ra bước đó lần nữa.
2. Khởi tạo lại các trọng số đi vào của các đơn vị chết bằng một lần lấy mẫu Kaiming và tiếp tục; phần còn lại của mạng giữ tiến độ của nó. Đây là bài tập hồi sinh neuron chết của bài học gỡ lỗi.
3. Đổi activation. Một leaky ReLU giữ một độ dốc nhỏ ở phía âm, vì vậy một đơn vị có thể hồi phục. GELU trơn và tránh hoàn toàn sự cố; bài học activation ưu tiên nó hơn biến thể leaky trừ khi có một lý do cụ thể.
4. Kiểm tra khởi tạo. Một lần lấy mẫu Kaiming giữ các pre-activation quanh tâm khi bắt đầu, vì vậy ít đơn vị hơn bắt đầu cuộc đời ở phía âm.

## Follow-ups

- **Level 3:** Tại sao đơn vị giữ chết thay vì trôi trở lại? Expected: đầu ra bằng không cho gradient bằng không đến các trọng số của nó, và không có gì khác trong loss tác động đến chúng.
- **Level 3:** Bạn phân biệt một đơn vị chết với một đơn vị hoạt động thưa như thế nào? Expected: đếm tỷ lệ đầu vào mà trên đó nó dương trên một mẫu lớn; chết là không trên tất cả, thưa là dương trên một tỷ lệ nhỏ.
- **Level 4:** Điều gì liên kết learning rate cao với cái chết? Expected: một bước lớn đẩy bias hoặc trọng số xa về phía âm để mọi đầu vào rơi xuống dưới không; clipping và một rate nhỏ hơn giới hạn bước.
- **Level 4:** Bạn có thể hồi sinh các đơn vị chết mà không huấn luyện lại từ đầu không? Expected: khởi tạo lại các trọng số đi vào của chúng bằng một lần lấy mẫu Kaiming và tiếp tục; phần còn lại của mạng giữ tiến độ của nó.

## Wrong answers

- "Một nửa số không là độ thưa bình thường cho ReLU." Một số giá trị không là bình thường; một đơn vị bằng không trên mọi đầu vào đã chết và không đóng góp gì, và bài học đánh dấu một lớp trên một nửa số không.
- "Tăng learning rate để các đơn vị nhảy trở lại." Gradient bằng không bất kể rate; không bước nào đến được chúng.
- "Chuyển sang sigmoid để tránh các giá trị không." Sigmoid đánh đổi các đơn vị chết lấy gradient tiêu biến qua chiều sâu; một biến thể leaky hoặc GELU giữ các lợi ích của ReLU.

## Taught in

[Bài học các hàm activation](../../../phases/03-deep-learning-core/04-activation-functions/) giải thích các đơn vị chết và xây dựng bộ phát hiện, và [bài học gỡ lỗi](../../../phases/03-deep-learning-core/13-debugging-neural-networks/) tái hiện sự cố và đặt ngưỡng.
