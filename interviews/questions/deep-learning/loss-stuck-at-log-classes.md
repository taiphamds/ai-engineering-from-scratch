---
id: loss-stuck-at-log-classes
title: A loss that sits at 2.3 on a ten class problem
card: deep-learning
kind: debug
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [debugging, ml-depth]
tags: [debugging, cross-entropy, data-pipeline, overfit-one-batch]
minutes: 12
lessons: [phases/03-deep-learning-core/13-debugging-neural-networks, phases/03-deep-learning-core/05-loss-functions]
manuals: []
practice: []
cheatsheet: [nn-debugging]
related: [deep-learning/overfit-one-batch-first, deep-learning/mse-predicts-half-for-everything]
updated: 2026-11-03
---

Một bộ phân loại mười lớp huấn luyện trong nhiều epoch, và loss cross-entropy nằm ở khoảng 2.3 suốt thời gian đó, trên dữ liệu huấn luyện và trên dữ liệu validation. Không có gì sập. Con số đó cho bạn biết điều gì, và bạn gỡ lỗi theo thứ tự nào?

## Short answer

Âm log tự nhiên của một phần mười là khoảng 2.3, loss của một mô hình cho mọi lớp cùng xác suất, và bảng của bài học đọc một loss kẹt ở đó là một dự đoán đồng đều không có tín hiệu dùng được. Chỉ trung bình không nói tại sao. Chạy kiểm thử overfit một batch trước: một thất bại chỉ đến loss, lượt truyền ngược, kết nối bộ tối ưu hóa hoặc nhãn lệch, và một lần đạt đưa bạn đến đường dữ liệu để kiểm tra rằng các nhãn khớp với các đầu vào. Chỉ sau đó xem learning rate, các gradient và kiến trúc.

## Full answer

### Reading the number

Categorical cross-entropy trên một mục tiêu one-hot là âm log xác suất của lớp đúng. Một phỏng đoán ngẫu nhiên giữa 10 lớp cho mỗi lớp xác suất 0.1 và một loss âm log 0.1, khoảng 2.3. Bảng tổng của bài học gỡ lỗi có hàng này: một loss kẹt ở âm log của 1 chia số lớp nghĩa là mô hình dự đoán một phân phối đồng đều, và điều đầu tiên cần kiểm tra là pipeline dữ liệu và liệu nhãn có khớp đầu vào không. Một mô hình không có tín hiệu dùng được ổn định ở các logit bằng nhau, vì đó là thứ tối thiểu hóa loss kỳ vọng trên một tập nhãn cân bằng.

### The order

1. **Overfit một batch.** Lấy 8 đến 32 mẫu và huấn luyện trên chúng trong vài trăm bước. Loss phải về gần không và độ chính xác huấn luyện lên 100 phần trăm. Nếu không, mô hình hoặc vòng lặp bị hỏng: một loss sai, một lượt truyền ngược hỏng, một bộ tối ưu hóa không kết nối với các tham số, hoặc đầu vào và nhãn lệch nhịp. Ngưỡng của bài học cho một lần đạt là loss cuối dưới 0.1.
2. **Nhìn vào dữ liệu.** In 5 mẫu ngẫu nhiên với các nhãn của chúng. Kiểm tra rằng việc xáo trộn giữ mỗi đầu vào ghép với nhãn của nó, rằng các đầu vào được chuẩn hóa về trung bình 0 và độ lệch chuẩn 1, và rằng các nhãn có kiểu số nguyên mà loss mong đợi.
3. **Learning rate.** Thử ba giá trị cách nhau 10 lần, chẳng hạn 1e-2, 1e-3 và 1e-4. Một rate quá thấp trông phẳng, nhưng nó sẽ không nằm chính xác trên giá trị đồng đều trong nhiều epoch.
4. **Gradient.** Toàn số không chỉ đến các ReLU chết hoặc một graph bị tách.
5. **Kiến trúc.** Chỉ sau những điều trên: một mô hình quá nhỏ underfit, nhưng nó vẫn thắng một phỏng đoán đồng đều trên chính dữ liệu huấn luyện của nó.

### How this differs from a slow start

Một loss bắt đầu gần 2.3 và giảm chậm là một câu hỏi learning rate hoặc năng lực. Một loss giữ ở 2.3 trong nhiều epoch trên tập huấn luyện nghĩa là hoàn toàn không có tín hiệu đến mô hình.

## Follow-ups

- **Level 3:** Tại sao đồng đều thay vì một đáp án sai khác? Expected: không có tín hiệu dùng được, các logit bằng nhau tối thiểu hóa cross-entropy kỳ vọng trên một tập nhãn cân bằng, và điều đó tốn log của số lớp.
- **Level 3:** Kiểm thử overfit một batch cho bạn biết gì ở đây? Expected: liệu mô hình và vòng lặp có thể học hay không; một cấu hình khỏe đưa một batch nhỏ về loss gần không trong vài trăm bước, và một thất bại nghĩa là một loss hỏng, lượt truyền ngược hỏng, kết nối bộ tối ưu hóa hỏng hoặc nhãn lệch.
- **Level 4:** Kiểm thử một batch đạt và huấn luyện đầy đủ vẫn nằm ở 2.3. Tiếp theo ở đâu? Expected: đường dữ liệu đầy đủ, chẳng hạn một lần xáo trộn phá ghép cặp đầu vào và nhãn, hoặc các đầu vào chưa chuẩn hóa, vì mô hình có thể học khi được đưa một batch nhất quán.
- **Level 4:** Điều gì phân biệt triệu chứng này với một loss bắt đầu ở 2.3 và giảm chậm? Expected: giảm chậm là một câu hỏi learning rate hoặc năng lực; một 2.3 phẳng trong nhiều epoch nghĩa là không có tín hiệu đến mô hình.

## Wrong answers

- "Huấn luyện lâu hơn, đó là một khởi đầu chậm." Một giá trị phẳng tại loss đồng đều trong nhiều epoch nghĩa là không có tín hiệu, không phải một tín hiệu chậm.
- "Làm mô hình lớn hơn." Năng lực không phải vấn đề khi mô hình không thể thắng một phỏng đoán đồng đều trên chính dữ liệu huấn luyện của nó.
- "Hạ learning rate." Rate thay đổi tốc độ loss di chuyển, và ở đây nó hoàn toàn không di chuyển; kiểm tra dữ liệu trước.

## Taught in

[Bài học gỡ lỗi](../../../phases/03-deep-learning-core/13-debugging-neural-networks/) đưa ra bảng tổng và kiểm thử overfit một batch, và [bài học các hàm loss](../../../phases/03-deep-learning-core/05-loss-functions/) tính loss đồng đều.
