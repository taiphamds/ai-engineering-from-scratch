---
id: layernorm-not-batchnorm
title: Why transformers normalize across features, not the batch
card: deep-learning
kind: tradeoff
level: 3
roles: [inference-engineer, applied-ai-engineer, ai-data-engineer]
rounds: [ml-depth, design-review]
tags: [normalization, layer-norm, batch-norm, rmsnorm, transformers]
minutes: 12
lessons: [phases/03-deep-learning-core/07-regularization]
manuals: []
practice: [layer-norm-rms-norm, batch-norm]
cheatsheet: [deep-learning-training]
related: [deep-learning/train-mode-and-eval-mode, deep-learning/inverted-dropout-scale]
updated: 2026-11-03
---

Một nhóm chuyển một công thức huấn luyện thị giác sang một transformer và giữ batch normalization. Huấn luyện không ổn định, và sinh văn bản với từng chuỗi một tạo ra rác. Giải thích tại sao thay vào đó transformer dùng layer normalization, và khi nào bạn sẽ đi thêm một bước đến RMSNorm.

## Short answer

Batch normalization chuẩn hóa mỗi đặc trưng trên batch, vì vậy các thống kê của nó phụ thuộc vào kích thước batch và những chuỗi nào dùng chung batch; với các batch nhỏ chúng nhiễu, với một batch một chúng vô nghĩa, và huấn luyện cùng suy luận chạy các đường mã khác nhau. Layer normalization chuẩn hóa trên các đặc trưng của một mẫu, vì vậy nó không phụ thuộc vào batch và giống hệt trong cả hai chế độ, là điều các chuỗi có độ dài biến đổi và việc sinh một chuỗi cần. RMSNorm bỏ phép trừ trung bình và tham số độ dịch, giữ độ chính xác, và tiết kiệm khoảng 10 phần trăm chi phí chuẩn hóa, là lý do phần lớn mô hình ngôn ngữ lớn gần đây dùng nó.

## Full answer

### Batch normalization and its two dependencies

Đối với mỗi đặc trưng, batch normalization trừ trung bình batch, chia cho độ lệch chuẩn batch với một epsilon, và áp dụng một hệ số tỷ lệ gamma và độ dịch beta được học. Hai điều theo sau. Thứ nhất, kết quả cho một mẫu phụ thuộc vào các mẫu khác trong batch của nó. Bài học đặt mức sàn ở một batch khoảng 32; dưới đó các thống kê nhiễu, và tại một batch một phương sai bằng không. Thứ hai, suy luận không thể thấy một batch, vì vậy nó dùng các trung bình trượt được thu thập trong huấn luyện với một momentum 0.1, là một đường mã thứ hai và một nguồn lỗi thứ hai. Các mô hình chuỗi gặp cả hai vấn đề: độ dài thay đổi, bộ nhớ giới hạn batch, và việc sinh chạy từng chuỗi một.

### Layer normalization

Layer normalization tính trung bình và phương sai trên D đặc trưng của một mẫu và chỉ chuẩn hóa mẫu đó. Không phụ thuộc batch, không có trung bình trượt, cùng phép tính trong huấn luyện và lúc suy luận. Transformer áp dụng nó quanh mỗi attention block và mỗi feed-forward block, sau chúng trong bố trí Post-LN hoặc trước chúng trong bố trí Pre-LN, mà bài học ghi chú là huấn luyện ổn định hơn.

### RMSNorm

RMSNorm chia cho căn trung bình bình phương của các đặc trưng và nhân với gamma. Không có phép trừ trung bình và không có beta. Quan sát đằng sau nó là việc đưa lại về tâm thêm ít vào độ chính xác và tốn tính toán, vì vậy loại bỏ nó cho cùng độ chính xác với phần chi phí chuẩn hóa thêm ít hơn khoảng 10 phần trăm. Ở quy mô hàng tỷ tham số mức tiết kiệm đó là thực, và phần lớn mô hình ngôn ngữ lớn hiện đại dùng nó.

### Why batch normalization helps at all

Lời giải thích được công bố đầu tiên, internal covariate shift, đã được chứng minh là sai. Lợi ích đến từ một bề mặt loss trơn hơn với các gradient dự báo tốt hơn, cho phép bộ tối ưu hóa thực hiện các bước lớn hơn. Layer normalization và RMSNorm mang lại hiệu ứng đó mà không phụ thuộc batch.

## Follow-ups

- **Level 3:** Batch normalization cần gì lúc suy luận mà layer normalization không cần? Expected: các trung bình trượt của trung bình và phương sai được thu thập trong huấn luyện; layer normalization tính các thống kê của nó từ chính mẫu.
- **Level 3:** Một transformer block đặt chuẩn hóa ở đâu? Expected: sau mỗi attention và feed-forward block trong Post-LN, hoặc trước chúng trong Pre-LN, huấn luyện ổn định hơn.
- **Level 4:** RMSNorm loại bỏ gì và nó tốn gì? Expected: phép trừ trung bình và tham số độ dịch; bài học báo cáo cùng độ chính xác với phần chi phí chuẩn hóa thêm ít hơn khoảng 10 phần trăm.
- **Level 4:** Tại sao lời giải thích ban đầu cho batch normalization không còn được ưa chuộng? Expected: các nghiên cứu sau cho thấy lợi ích đến từ một bề mặt loss trơn hơn với các hằng số Lipschitz nhỏ hơn, cho phép bộ tối ưu hóa thực hiện các bước lớn hơn.

## Wrong answers

- "Batch normalization chỉ cần một batch lớn hơn." Việc sinh chạy từng chuỗi một và độ dài chuỗi thay đổi; cách sửa là một norm không nhìn qua batch.
- "Layer normalization là một bộ regularization yếu hơn, vì vậy đó là một thỏa hiệp." Nó chuẩn hóa trên các đặc trưng, là trục đúng cho các chuỗi, và nó loại bỏ sự không khớp giữa huấn luyện và suy luận.
- "RMSNorm là một xấp xỉ mất độ chính xác." Bài học báo cáo cùng độ chính xác; việc đưa lại về tâm thêm ít và tốn tính toán.

## Taught in

[Bài học regularization](../../../phases/03-deep-learning-core/07-regularization/) xây dựng cả ba phép chuẩn hóa và giải thích lựa chọn cho transformer.
