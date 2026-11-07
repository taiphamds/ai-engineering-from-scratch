---
id: permutation-blind-attention
title: Shuffle the words and attention does not notice
card: transformers
kind: concept
level: 1
roles: [applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [screen, ml-depth]
tags: [positional-encoding, permutation, sinusoidal, rope, alibi]
minutes: 6
lessons: [phases/07-transformers-deep-dive/04-positional-encoding, phases/19-capstone-projects/32-token-positional-embeddings]
manuals: []
practice: [sinusoidal-positional-encoding]
cheatsheet: [positional-encoding]
related: []
updated: 2026-11-03
---

Lấy một câu và xáo trộn các từ của nó. Đưa cả hai phiên bản qua lớp self-attention không có tín hiệu vị trí. Hai đầu ra liên hệ như thế nào, và ba họ cách sửa bạn sẽ nêu là gì?

## Short answer

Các hàng đầu ra trở lại được xáo trộn theo cùng cách và không có gì khác thay đổi, vì attention chỉ tính độ tương đồng từng cặp giữa các token. Thứ tự mang ý nghĩa trong ngôn ngữ và mã, nên mô hình cần tín hiệu thứ hai. Ba cách sửa là vector vị trí được cộng vào embedding, một bảng được học hoặc sinusoid cố định, phép quay query và key theo góc tăng theo vị trí, và hình phạt khoảng cách được cộng vào điểm số.

## Full answer

### Why the layer is blind

Ma trận điểm số là `softmax(Q K^T / sqrt(d)) V`, được xây dựng từ tích vô hướng giữa các cặp token. Hoán vị các hàng của X và mọi tích vô hướng giữ nguyên giá trị; chỉ vị trí của nó trong ma trận dịch chuyển. Lớp có tính tương biến theo hoán vị theo thiết kế.

### Fix one: add a position vector to the input

Bảng được học có một hàng trên mỗi vị trí, nên nó thêm `max_context_length` nhân D tham số và không có hàng cho vị trí vượt độ dài đã huấn luyện. Sinusoid cố định dùng công thức

```text
angle = p / (10000 ** (2 * k / D))
emb[p, 2k]     = sin(angle)
emb[p, 2k + 1] = cos(angle)
```

mà không có tham số. Bước sóng thay đổi theo cấp số nhân qua các chiều. Các chiều thấp có góc lớn nhất trên mỗi vị trí và bước sóng ngắn nhất, nên chúng mã hóa vị trí chi tiết; các chiều cao có bước sóng dài nhất và mã hóa vị trí thô. Vector tại vị trí p cộng k là hàm tuyến tính của vector tại p, cho attention một cách dễ dàng để học độ lệch tương đối. Vector vị trí được cộng với vector token, không nối, nên D giữ nguyên và mô hình quyết định theo từng đặc trưng vị trí quan trọng đến đâu.

### Fix two: rotate the queries and keys

Rotary position embedding quay mỗi cặp tọa độ trong Q và K theo `pos * theta_i`, với `theta_i = base ** (-2i / d_head)` và cơ số mặc định 10000. Tích vô hướng của query đã quay và key đã quay khi đó chỉ phụ thuộc vào khoảng cách của chúng. Đây là lựa chọn chiếm ưu thế năm 2026.

### Fix three: bias the scores

Linear-bias attention cộng `-m_h * |i - j|` vào điểm số của query i và key j, với độ dốc trên mỗi head. Không bảng, không phép quay, và ngoại suy mạnh sang đầu vào dài hơn.

### Where each one lives

Họ đầu tiên thay đổi đầu vào của lớp đầu tiên. Hai họ còn lại tác động bên trong attention, lên các phép chiếu hoặc điểm số, nên chúng tuân theo cùng quy ước hình dạng như giai đoạn embedding mà không chạm đến embedding.

## Follow-ups

- **Level 1:** Tại sao cộng hai vector thay vì nối chúng? Expected: phép cộng giữ D không đổi xuyên suốt mạng và cho mô hình cân nhắc token cùng vị trí theo từng đặc trưng.
- **Level 2:** Bảng vị trí được học tốn gì mà sinusoid không tốn? Expected: `max_context_length` nhân D tham số, và không thể lập chỉ mục nó vượt độ dài đã huấn luyện.
- **Level 2:** Tại sao các chiều cao của sinusoid mã hóa vị trí thô? Expected: bước sóng của chúng dài nhất, nên chúng thay đổi chậm qua các vị trí.
- **Level 3:** Phép quay áp dụng ở đâu trong khối? Expected: lên Q và K bên trong attention, sau phép chiếu và trước matmul điểm số, không bao giờ lên V.

## Wrong answers

- "Softmax làm attention nhận biết thứ tự." Softmax chuẩn hóa một hàng độ tương đồng; nó không biết cột nào đứng đầu.
- "Thêm vị trí dưới dạng một số bổ sung trên embedding." Một đại lượng vô hướng không thể cho các tích vô hướng tín hiệu dùng được; các cơ chế trải vị trí qua nhiều chiều hoặc vào điểm số.
- "Vị trí chỉ quan trọng với chuỗi dài." Một câu hai từ đã thay đổi ý nghĩa khi các từ đổi chỗ.

## Taught in

[Bài học về mã hóa vị trí](../../../phases/07-transformers-deep-dive/04-positional-encoding/) so sánh ba họ và [capstone embedding](../../../phases/19-capstone-projects/32-token-positional-embeddings/) xây dựng các bảng được học và hình sin.
