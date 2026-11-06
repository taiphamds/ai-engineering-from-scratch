---
id: train-mode-and-eval-mode
title: Test accuracy that changes with the same weights
card: deep-learning
kind: concept
level: 1
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, inference-engineer]
rounds: [screen, debugging]
tags: [dropout, batch-norm, eval-mode, inference]
minutes: 5
lessons: [phases/03-deep-learning-core/07-regularization, phases/03-deep-learning-core/10-mini-framework]
manuals: []
practice: [inverted-dropout, batch-norm]
cheatsheet: [deep-learning-training]
related: [deep-learning/inverted-dropout-scale, deep-learning/layernorm-not-batchnorm]
updated: 2026-11-03
---

Một mô hình đã lưu cho một độ chính xác kiểm thử khác mỗi lần bạn đánh giá nó trên cùng tập kiểm thử với cùng các trọng số. Data loader không xáo trộn. Nguyên nhân có khả năng nhất là gì, và hai loại lớp nào liên quan?

## Short answer

Mô hình vẫn ở chế độ huấn luyện lúc kiểm thử. Dropout tiếp tục đặt các đơn vị ngẫu nhiên về không, vì vậy mỗi lượt truyền tiến chạy một mạng con khác, và batch normalization tiếp tục dùng trung bình và phương sai của batch hiện tại thay vì các trung bình trượt của nó. Chuyển sang chế độ đánh giá trước suy luận và tắt theo dõi gradient.

## Full answer

### Two layers that behave differently by mode

| Lớp | Chế độ huấn luyện | Chế độ đánh giá |
|---|---|---|
| Dropout | đặt mỗi đơn vị về không với xác suất p, điều chỉnh tỷ lệ phần còn lại bằng 1 chia (1 - p) | truyền mọi thứ qua không thay đổi |
| Batch normalization | chuẩn hóa bằng trung bình và phương sai batch, cập nhật các trung bình trượt | chuẩn hóa bằng các trung bình trượt |

Cả hai lớp đọc một cờ, cờ training của module. Trong framework nhỏ, các phương thức train và eval của một vùng chứa Sequential đặt cờ trên vùng chứa và trên mọi module bên trong nó. Một framework làm tương tự với model.train() và model.eval().

### Why the accuracy moves

Với dropout hoạt động, mỗi lượt truyền tiến lấy một mask mới, vì vậy cùng đầu vào cho một đầu ra khác và một số dự đoán lật qua ngưỡng. Với các thống kê batch hoạt động, mỗi dự đoán phụ thuộc vào những hàng khác nào nằm trong batch của nó, và một batch một có phương sai bằng không, làm phép chuẩn hóa vô nghĩa. Bài học gọi một lời gọi eval bị quên là một trong những lỗi phổ biến nhất trong deep learning, và triệu chứng này là dấu hiệu của nó.

### The fix and its mirror image

Gọi eval trước suy luận và bọc lượt trong no_grad, cũng tiết kiệm bộ nhớ. Rồi gọi train lại trước epoch tiếp theo. Lỗi phản chiếu cũng phổ biến: một mô hình bị để ở chế độ đánh giá sau validation huấn luyện với dropout tắt và các trung bình trượt của batch norm bị đóng băng, vì vậy nó mất regularization và các thống kê suy luận của nó trở nên lỗi thời.

## Follow-ups

- **Level 1:** Dropout làm gì trong chế độ đánh giá? Expected: không gì; nó truyền mọi giá trị qua không thay đổi, vì việc điều chỉnh tỷ lệ đã được áp dụng trong huấn luyện.
- **Level 2:** Tại sao batch normalization không thể dùng thống kê batch cho một batch một lúc kiểm thử? Expected: phương sai của một mẫu bằng không, vì vậy các thống kê vô nghĩa; các trung bình trượt phải được dùng.
- **Level 2:** Một vùng chứa truyền chế độ đến các thành phần con của nó như thế nào? Expected: các phương thức train và eval của nó đặt cờ trên vùng chứa và trên mọi module bên trong nó.
- **Level 3:** Bạn quên chuyển lại chế độ huấn luyện sau validation. Điều gì xảy ra trong epoch tiếp theo? Expected: dropout giữ tắt và batch norm ngừng cập nhật các thống kê trượt của nó, vì vậy mô hình huấn luyện không có regularization và các thống kê suy luận của nó trở nên lỗi thời.

## Wrong answers

- "Đặt một random seed trước mỗi lần đánh giá." Điều đó che giấu triệu chứng; mô hình vẫn đánh giá với dropout và thống kê batch hoạt động, vì vậy độ chính xác sai, chỉ là sai một cách lặp lại được.
- "Số học GPU không có tính xác định, điều này bình thường." Điều đó cho các khác biệt nhỏ hơn nhiều một dự đoán bị thay đổi, không phải một độ chính xác di chuyển.
- "Loại bỏ dropout khỏi kiến trúc." Dropout là một bộ regularization lúc huấn luyện; cách sửa là chuyển chế độ, không phải xóa lớp.

## Taught in

[Bài học regularization](../../../phases/03-deep-learning-core/07-regularization/) xây dựng cả hai lớp trong cả hai chế độ, và [bài học framework nhỏ](../../../phases/03-deep-learning-core/10-mini-framework/) thêm cờ training vào mọi module.
