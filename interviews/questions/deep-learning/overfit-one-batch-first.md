---
id: overfit-one-batch-first
title: The 30 second check before a multi-day run
card: deep-learning
kind: design
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, inference-engineer]
rounds: [design-review, debugging]
tags: [debugging, overfit-one-batch, training-loop, checklist]
minutes: 10
lessons: [phases/03-deep-learning-core/13-debugging-neural-networks]
manuals: []
practice: []
cheatsheet: [nn-debugging]
related: [deep-learning/loss-stuck-at-log-classes, deep-learning/missing-zero-grad]
updated: 2026-11-03
---

Bạn sắp khởi chạy một lần huấn luyện nhiều ngày trên một kiến trúc mới với một pipeline dữ liệu mới. Thiết kế một phép kiểm tra chạy trong khoảng 30 giây và phải đạt trước khi lần chạy bắt đầu. Liệt kê các nhóm lỗi nó phát hiện và các nhóm nó không phát hiện.

## Short answer

Lấy một batch nhỏ gồm 8 đến 32 mẫu và chỉ huấn luyện trên nó trong vài trăm bước. Loss phải giảm về gần không và độ chính xác huấn luyện phải đạt 100 phần trăm. Một lần đạt cho thấy hàm loss, lượt truyền ngược và kết nối bộ tối ưu hóa hoạt động, và mô hình có thể khớp batch này, nhưng không phải mỗi đầu vào có nhãn đúng của nó, vì một mô hình cũng có thể ghi nhớ một ghép cặp sai nhưng nhất quán. Nó không nói gì về khái quát hóa, rò rỉ hoặc toàn bộ data loader, vì vậy nó là cổng đầu tiên và không phải cuối cùng.

## Full answer

### The test

Bài học gỡ lỗi gọi đây là kỹ thuật quan trọng nhất trong deep learning. Cố định một batch, xây dựng một mô hình và bộ tối ưu hóa mới, và lặp: đặt gradient về không, forward, loss, backward, step. In loss và độ chính xác mỗi 50 bước. Triển khai của bài học chạy 200 bước và coi một loss cuối trên 0.1 là một thất bại.

### What a failure means

Bất kỳ điều nào trong số này, và bài học liệt kê chúng:

- một hàm loss không khớp với lớp đầu ra;
- một lượt truyền ngược hỏng hoặc một graph bị tách;
- một bộ tối ưu hóa được xây dựng trước khi các tham số của mô hình tồn tại, vì vậy nó không cập nhật gì;
- các đầu vào và nhãn lệch nhịp;
- một kiến trúc quá nhỏ để biểu diễn ngay cả batch này.

Mỗi điều này cũng sẽ làm hỏng lần chạy đầy đủ, và ở đó nó sẽ xuất hiện nhiều giờ sau dưới dạng một loss chậm hoặc phẳng với hai mươi nguyên nhân có thể. Ở đây nó xuất hiện trong vài giây với năm.

### What a pass does not prove

Kiểm thử overfit có chủ đích, vì vậy nó không nói gì về khái quát hóa. Một mô hình có thể ghi nhớ bất kỳ nhãn nhất quán nào, vì vậy một ghép cặp sai của đầu vào và nhãn bên trong batch cố định cũng đạt. Nó dùng một batch, vì vậy một lần xáo trộn làm mất ghép cặp đầu vào và nhãn trên toàn bộ tập, một phép chuẩn hóa được tính trên toàn bộ dataset, các hàng trùng lặp giữa các phần chia, hoặc nhiễu nhãn đều có thể qua nó. Danh sách kiểm tra của bài học tiếp tục sau nó: in tóm tắt mô hình và kiểm tra số tham số, chạy một lượt truyền tiến trên dữ liệu ngẫu nhiên và kiểm tra hình dạng đầu ra, huấn luyện trong 5 epoch và xác nhận loss giảm, kiểm tra các thống kê activation cho các lớp chết hoặc bùng nổ, kiểm tra luồng gradient qua các lớp, và in 5 mẫu ngẫu nhiên với các nhãn của chúng.

### Make it a gate

Chạy nó lúc khởi động trên một batch cố định, khẳng định loss cuối dưới ngưỡng, và từ chối bắt đầu lần chạy dài khi nó thất bại. Chạy lại nó bất cứ khi nào kiến trúc hoặc pipeline thay đổi.

## Follow-ups

- **Level 3:** Loss trên một batch đình trệ cao hơn ngưỡng nhiều. Nêu ba nghi phạm. Expected: một loss không khớp với lớp đầu ra, một bộ tối ưu hóa được xây dựng trước khi các tham số mô hình được tạo, hoặc một mô hình quá nhỏ để khớp batch.
- **Level 3:** Tại sao 8 đến 32 mẫu? Expected: đủ nhỏ để một mô hình đúng ghi nhớ nó trong vài trăm bước, để một thất bại rõ ràng và kiểm thử giữ nhanh.
- **Level 4:** Kiểm thử đạt và lần chạy đầy đủ sau đó cho thấy độ chính xác huấn luyện ở mức ngẫu nhiên. Lần đạt loại trừ điều gì, và còn lại gì? Expected: mô hình và vòng lặp có thể học, vì vậy điều còn lại là đường dữ liệu đầy đủ: một lần xáo trộn làm mất ghép cặp đầu vào và nhãn, hoặc chuẩn hóa được tính khác cho toàn bộ tập.
- **Level 4:** Bạn biến điều này thành một cổng trong một script huấn luyện như thế nào? Expected: chạy nó trên một batch cố định lúc khởi động, khẳng định loss cuối dưới ngưỡng, từ chối bắt đầu lần chạy dài khi thất bại, và chạy lại bất cứ khi nào kiến trúc hoặc pipeline thay đổi.

## Wrong answers

- "Một kiểm thử đạt nghĩa là mô hình sẽ khái quát hóa." Nó chứng minh mô hình có thể ghi nhớ một batch; khái quát hóa cần đường cong validation.
- "Bỏ qua nó, lần chạy đầy đủ cho thấy vấn đề đủ sớm." Lần chạy cho thấy một triệu chứng nhiều giờ sau và triệu chứng khớp nhiều nguyên nhân; kiểm thử cô lập vòng lặp trong vài giây.
- "Thay vào đó dùng toàn bộ tập huấn luyện trong vài epoch." Đó là lần chạy đầy đủ; một batch nhỏ là thứ làm một thất bại rõ ràng và nhanh.

## Taught in

[Bài học gỡ lỗi](../../../phases/03-deep-learning-core/13-debugging-neural-networks/) triển khai kiểm thử, liệt kê những gì nó phát hiện, và đặt nó đầu tiên trong danh sách kiểm tra trước huấn luyện.
