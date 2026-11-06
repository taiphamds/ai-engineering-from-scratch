---
id: stacked-linear-layers-collapse
title: Ten layers with no activation are one layer
card: deep-learning
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [screen, ml-breadth]
tags: [activation-functions, nonlinearity, linear-layers, depth]
minutes: 5
lessons: [phases/03-deep-learning-core/04-activation-functions]
manuals: []
practice: []
cheatsheet: [neural-net-basics]
related: [deep-learning/xor-needs-a-hidden-layer, deep-learning/sigmoid-gradient-after-ten-layers]
updated: 2026-11-03
---

Một kỹ sư mới loại bỏ mọi hàm activation khỏi một mạng 10 lớp để làm nó nhanh hơn và báo cáo rằng huấn luyện vẫn chạy và loss vẫn giảm. Họ đã xây dựng gì, và tại sao nó sẽ thất bại trên XOR hoặc trên một dataset xoắn ốc?

## Short answer

Hai lớp tuyến tính hợp thành một: W2 (W1 x + b1) + b2 bằng (W2 W1) x + (W2 b1 + b2), là một ma trận duy nhất và một bias duy nhất. Mười lớp tuyến tính là một lớp tuyến tính với các tham số thêm và cùng ranh giới quyết định, một siêu phẳng. XOR và một đường xoắn ốc cần một ranh giới cong, vì vậy mạng không thể khớp chúng ở bất kỳ chiều rộng hoặc độ sâu nào.

## Full answer

### The substitution

```text
h = W1 x + b1
y = W2 h + b2 = W2 W1 x + W2 b1 + b2 = A x + c
```

Các tích ma trận hợp thành, vì vậy một chồng các ánh xạ tuyến tính là một ánh xạ tuyến tính. Lặp phép thế và mười lớp gộp vào một ma trận A và một vector c. Độ sâu không có tính phi tuyến là một ảo giác: mô hình có năng lực của một lớp tuyến tính duy nhất, nó chỉ tốn hơn để chạy.

### What an activation changes

Chèn một hàm phi tuyến g giữa các lớp, để h = g(W1 x + b1). Phép thế thất bại, vì W2 g(W1 x + b1) + b2 không rút gọn thành A x + c. Mỗi lớp thêm có một activation thêm năng lực biểu diễn. Đó là điều cho phép một mạng uốn ranh giới quanh một đường xoắn ốc hoặc tách các điểm XOR.

### What to add back

Các mặc định của bài học: ReLU cho một MLP thông thường hoặc một CNN, GELU cho một transformer, tanh bên trong các ô hồi tiếp. Lớp đầu ra là nơi duy nhất một activation bị thiếu là đúng: một head hồi quy xuất bất kỳ số thực nào, một head nhị phân dùng một sigmoid, và một head đa lớp dùng một softmax.

### Why the loss still fell

Một chồng các lớp tuyến tính chỉ tìm khớp tuyến tính tốt nhất với dữ liệu. Trên XOR hoặc một đường xoắn ốc khớp đó gần mức ngẫu nhiên, nhưng nó tốt hơn các trọng số ngẫu nhiên, vì vậy loss di chuyển. Một loss giảm không phải bằng chứng rằng mô hình có thể biểu diễn mục tiêu.

## Follow-ups

- **Level 1:** Lớp nào được phép không có activation? Expected: lớp đầu ra của một mô hình hồi quy, phải tạo ra bất kỳ số thực nào.
- **Level 2:** Mạng tuyến tính sâu huấn luyện nhanh hơn một lớp không? Expected: không; nó tính cùng hàm với nhiều tham số hơn và nhiều phép nhân ma trận hơn.
- **Level 2:** Bạn sẽ thêm lại activation nào cho một MLP thông thường và cho một transformer? Expected: ReLU cho MLP và GELU cho transformer.
- **Level 3:** Tại sao việc gộp không phải bằng chứng rằng độ sâu vô ích? Expected: với một tính phi tuyến giữa các lớp phép thế thất bại và mỗi lớp thêm năng lực; các mạng sâu khớp cùng các hàm với ít tham số hơn các mạng nông rộng.

## Wrong answers

- "Mười lớp sâu hơn, vì vậy chúng biểu diễn nhiều hơn." Không có một tính phi tuyến tích của các ma trận là một ma trận; độ sâu không thêm gì.
- "Các bias làm nó phi tuyến." Một bias dịch siêu phẳng; nó không uốn nó.
- "Loss giảm, vì vậy nó đang học tốt." Nó học khớp tuyến tính tốt nhất, mà với XOR hoặc một đường xoắn ốc gần mức ngẫu nhiên.

## Taught in

[Bài học các hàm activation](../../../phases/03-deep-learning-core/04-activation-functions/) chứng minh việc gộp và đưa ra activation mặc định cho mỗi kiến trúc.
