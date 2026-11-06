---
id: zero-init-symmetry
title: A wide layer that behaves like one neuron
card: deep-learning
kind: concept
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [screen, debugging]
tags: [weight-initialization, symmetry, zero-init, debugging]
minutes: 6
lessons: [phases/03-deep-learning-core/08-weight-initialization]
manuals: []
practice: []
cheatsheet: [deep-learning-training]
related: [deep-learning/kaiming-factor-of-two, deep-learning/half-the-relus-are-dead]
updated: 2026-11-03
---

Một mạng có một lớp ẩn 512 đơn vị được khởi tạo với mọi trọng số và mọi bias ở không. Huấn luyện chạy trong hàng nghìn epoch và loss gần như không di chuyển. Learning rate và dữ liệu đều kiểm tra ổn. Điều gì sai, và tại sao một nhiễu loạn ngẫu nhiên nhỏ của mỗi trọng số sửa nó?

## Short answer

Mọi neuron trong lớp bắt đầu giống hệt, vì vậy mỗi neuron tính cùng đầu ra, nhận cùng gradient và thực hiện cùng cập nhật. Chúng giữ giống hệt trong toàn bộ lần chạy: lớp giữ các tham số của 512 neuron và hàm của một neuron. Khởi tạo ngẫu nhiên cho mỗi neuron điểm bắt đầu riêng, vì vậy các gradient khác nhau và các neuron học các đặc trưng khác nhau. Tỷ lệ của tính ngẫu nhiên đó sau đó quyết định liệu tín hiệu có sống sót qua độ sâu không.

## Full answer

### The symmetry

Tất cả neuron trong một lớp có cùng cấu trúc: một tổng có trọng số của cùng các đầu vào, một bias, một activation. Bất cứ thứ gì làm chúng khác nhau phải đến từ các trọng số. Nếu các trọng số bằng nhau, các đầu ra bằng nhau. Backpropagation khi đó giao cho mỗi neuron cùng gradient, vì mỗi neuron đóng góp cùng lượng vào loss. Cập nhật như nhau, và các trọng số lại bằng nhau. Không có gì trong gradient descent có thể tách chúng. Demo của bài học xây dựng bốn neuron khởi tạo bằng không, đưa vào một đầu vào, in bốn đầu ra giống hệt, và đếm một tham số hiệu dụng thay vì tám tham số đã cấp phát.

### Why zero is only the extreme case

Bất kỳ khởi tạo hằng nào cũng có cùng khuyết điểm. Đặt mọi trọng số bằng 0.5 tạo ra 512 bản sao của một neuron giống như không. Các giá trị ngẫu nhiên là cách thô bạo để phá thế hòa, và chúng cũng là lý do hai lần chạy với các seed khác nhau học các đặc trưng khác nhau.

### Biases can stay at zero

Các lớp của bài học lấy mẫu trọng số ngẫu nhiên và đặt các bias bằng 0.0. Điều đó ổn: các trọng số đã khác nhau giữa các neuron, vì vậy các bias không cần khác.

### After the symmetry is gone

Chỉ ngẫu nhiên là không đủ. Phương sai của lần lấy mẫu phải khớp activation: Xavier cho sigmoid và tanh, Kaiming cho ReLU và GELU. Tỷ lệ quá nhỏ và tín hiệu tiêu biến qua các lớp; quá lớn và nó bùng nổ. Một phép kiểm tra nhanh là đẩy các đầu vào ngẫu nhiên qua mạng chưa huấn luyện và ghi log độ lớn activation tại mỗi lớp.

## Follow-ups

- **Level 2:** Đặt các bias bằng không có ổn không? Expected: có, khi các trọng số ngẫu nhiên; các lớp của bài học làm vậy.
- **Level 2:** Một hằng số khác không cho mọi trọng số có sửa nó không? Expected: không; các neuron vẫn giống hệt và di chuyển đồng nhịp.
- **Level 3:** Sau cách sửa, loss di chuyển nhưng một phiên bản sâu hơn huấn luyện kém. Bạn kiểm tra gì tiếp theo? Expected: tỷ lệ của lần lấy mẫu ngẫu nhiên so với activation; Xavier cho sigmoid và tanh, Kaiming cho ReLU, được xác minh bằng các độ lớn activation mỗi lớp.
- **Level 3:** Bài học cho thấy tính đối xứng trong vài dòng như thế nào? Expected: bốn neuron khởi tạo bằng không trên một đầu vào cho bốn đầu ra giống hệt, và nó đếm một tham số hiệu dụng thay vì tám.

## Wrong answers

- "Learning rate quá thấp." Mỗi neuron di chuyển, nhưng tất cả di chuyển cùng nhau; không learning rate nào tách các gradient giống hệt.
- "Thêm neuron." Chúng đều là cùng một neuron; chiều rộng không thêm gì nếu không phá đối xứng.
- "Khởi tạo bằng không ổn cho lớp đầu tiên vì các đầu vào khác nhau." Các neuron trong một lớp dùng chung cùng các đầu vào; thứ khác nhau giữa các neuron phải là các trọng số.

## Taught in

[Bài học khởi tạo trọng số](../../../phases/03-deep-learning-core/08-weight-initialization/) mở đầu bằng vấn đề đối xứng và minh họa nó với một lớp rất nhỏ.
