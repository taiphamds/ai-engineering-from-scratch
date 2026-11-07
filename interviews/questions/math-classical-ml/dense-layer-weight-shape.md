---
id: dense-layer-weight-shape
title: Read a shape error in a dense layer
card: math-classical-ml
kind: concept
level: 1
roles: [ai-data-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [screen, ml-breadth]
tags: [linear-algebra, matrix-multiply, shapes, broadcasting]
minutes: 5
lessons: [phases/01-math-foundations/02-vectors-matrices-operations]
manuals: []
practice: []
cheatsheet: [linear-algebra]
related: [math-classical-ml/elementwise-or-matmul]
updated: 2026-11-03
---

Một đồng nghiệp xây dựng một lớp dense nhận 784 đầu vào và cho 128 đầu ra. Lượt forward đầu tiên dừng với một lỗi shape. Ma trận trọng số cần những chiều nào, và bạn đọc một lỗi như thế này như thế nào?

## Short answer

Ma trận là 128 nhân 784: một hàng cho mỗi đầu ra và một cột cho mỗi đầu vào. Một tích ma trận cần các kích thước bên trong khớp nhau, nên một ma trận 128 nhân 784 nhân một đầu vào 784 nhân 1 cho một đầu ra 128 nhân 1. Một lỗi có nghĩa các kích thước bên trong khác nhau, và cách sửa bắt đầu với shape của mọi toán hạng được viết ra giấy.

## Full answer

### The rule

Một tích của một ma trận m nhân n và một ma trận n nhân p cho một ma trận m nhân p. Các kích thước bên trong, đều là n, phải khớp nhau. Với lớp trong câu hỏi:

```text
(128 x 784) @ (784 x 1) = (128 x 1)
  weights       input       output
```

Các hàng của ma trận trọng số đếm các đầu ra. Các cột đếm các đầu vào. Mỗi đầu ra là tích vô hướng của một hàng trọng số với toàn bộ vector đầu vào.

### The bias

Bias giữ một giá trị cho mỗi đầu ra. Lưu nó thành một cột 128 nhân 1, như bài học làm, để nó cộng vào kết quả 128 nhân 1 theo từng phần tử. Một mảng phẳng 128 giá trị đối với một cột 128 nhân 1 broadcast thành 128 nhân 128 mà không có lỗi. Khi lớp chạy trên một batch, bias có ít chiều hơn đầu ra, và broadcasting lặp nó trên batch. Broadcasting chỉ kéo giãn một chiều có kích thước 1, nên nó không bao giờ sửa một 784 đối với một 128.

### How to read the error

1. Viết shape của mọi toán hạng cạnh phép toán.
2. Tìm phép toán có các kích thước bên trong không khớp. Đó là dòng bị lỗi.
3. Quyết định phía nào sai. Một ma trận trọng số bị chuyển vị, một đầu vào được lưu thành hàng thay vì cột, và một chiều batch bị thiếu mỗi trường hợp cho một cặp số khác trong thông báo.

Bài học thực hiện cùng kiểm tra cho một mạng hai lớp: ma trận đầu tiên là 4 nhân 3 và ma trận thứ hai là 2 nhân 4, nên một đầu vào 3 nhân 1 cho một vector ẩn 4 nhân 1 và một đầu ra 2 nhân 1.

## Follow-ups

- **Level 1:** Bias có shape nào? Expected: một giá trị cho mỗi đầu ra, nên 128 giá trị, được lưu thành một cột 128 nhân 1 để nó cộng vào mỗi cột đầu ra.
- **Level 2:** Một batch đầu vào đến dưới dạng hàng thay vì cột. Điều gì thay đổi? Expected: thứ tự của tích thay đổi, nên ma trận batch nhân trọng số chuyển vị cho một hàng đầu ra cho mỗi đầu vào.
- **Level 2:** Tại sao một phép chuyển vị xuất hiện trong lượt backward? Expected: gradient cho đầu vào cần ma trận trọng số với các hàng và cột hoán đổi, để các shape khớp theo hướng ngược.
- **Level 3:** Broadcasting che giấu một bug shape như thế nào? Expected: một chiều có kích thước 1 được kéo giãn để khớp, nên một shape sai có thể chạy mà không có lỗi và cho các giá trị sai. Một assertion trên shape bắt được nó.

## Wrong answers

- "Ma trận trọng số là 784 nhân 128 vì đầu vào đến trước." Với một đầu vào cột, ma trận cần 128 hàng và 784 cột. Thứ tự của tích quyết định dạng nào đúng, không phải thứ tự bạn gọi tên các kích thước.
- "Shape không quan trọng, framework sửa chúng." Broadcasting chỉ lặp một chiều có kích thước 1. Một kích thước bên trong 784 đối với 128 là một lỗi, hoặc một kết quả sai âm thầm sau một reshape.
- "Chuyển vị các thứ đến khi mã chạy." Một chuyển vị khiến mã chạy có thể nhân các cặp số sai. Viết các shape xuống trước rồi thay cái sai.

## Taught in

[Bài học vector và ma trận](../../../phases/01-math-foundations/02-vectors-matrices-operations/) đưa ra quy tắc shape và xây dựng một lớp dense từ một lớp Matrix.
