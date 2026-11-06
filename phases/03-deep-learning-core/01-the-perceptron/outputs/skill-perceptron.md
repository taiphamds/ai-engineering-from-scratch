---
name: skill-perceptron
description: Understand the perceptron pattern and when to use single-layer vs multi-layer architectures
version: 1.0.0
phase: 3
lesson: 1
tags: [perceptron, neural-networks, classification, deep-learning]
---

# The Perceptron Pattern

Một perceptron tính tổng có trọng số của các đầu vào cộng một bias, rồi áp dụng một hàm bước để tạo ra đầu ra nhị phân. Nó là đơn vị cơ bản của mạng nơ-ron.

```
output = step(w1*x1 + w2*x2 + ... + wn*xn + bias)
```

## When a single perceptron is enough

- Bài toán phân tách tuyến tính được: một đường thẳng (hoặc siêu phẳng) có thể chia hai lớp
- Các cổng logic: AND, OR, NOT, NAND
- Các quyết định ngưỡng đơn giản: "điểm số có cao hơn X không?"
- Các bộ phân loại nhị phân trên dữ liệu phân cụm thành hai vùng không chồng lấn

## When you need multiple layers

- Bài toán không phân tách tuyến tính được: không một đường thẳng duy nhất nào có thể phân tách các lớp
- Các bài toán XOR và chẵn lẻ
- Bất kỳ tác vụ nào đòi hỏi suy luận "cái này nhưng không phải cái kia" (các tổ hợp điều kiện)
- Phân loại thực tế: hình ảnh, văn bản, âm thanh - gần như luôn phi tuyến

## Decision checklist

1. Vẽ hoặc xem xét dữ liệu của bạn. Bạn có thể vẽ một ranh giới thẳng duy nhất giữa các lớp không?
   - Có: một perceptron đơn lẻ hoạt động được
   - Không: bạn cần ít nhất hai lớp
2. Bài toán có thể được phân rã thành AND/OR của các quyết định tuyến tính đơn giản hơn không?
   - Phép phân rã này cho bạn biết cấu trúc mạng tối thiểu
   - XOR = (A OR B) AND (NOT (A AND B)) = 3 perceptron trong 2 lớp
3. Với các bài toán có hơn hai lớp phân loại, bạn cần một nút đầu ra cho mỗi lớp phân loại

## The training rule

```
error = expected - predicted
weight_new = weight_old + learning_rate * error * input
bias_new = bias_old + learning_rate * error
```

Nếu dự đoán đúng, không có gì thay đổi. Nếu sai, các trọng số dịch chuyển để giảm sai số. Điều này chỉ hoạt động cho các perceptron một lớp. Các mạng nhiều lớp cần lan truyền ngược.

## Common mistakes

- Cố học các mẫu phi tuyến bằng một perceptron đơn lẻ (nó sẽ không bao giờ hội tụ)
- Đặt tốc độ học quá cao (các trọng số dao động) hoặc quá thấp (huấn luyện kéo dài mãi)
- Quên số hạng bias (không có nó, ranh giới quyết định phải đi qua gốc tọa độ)
- Nhầm lẫn hội tụ perceptron (được bảo đảm với dữ liệu phân tách tuyến tính được) với hội tụ mạng nơ-ron nói chung (không được bảo đảm)
