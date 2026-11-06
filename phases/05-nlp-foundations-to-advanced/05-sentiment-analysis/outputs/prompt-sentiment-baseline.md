---
name: sentiment-baseline
description: Design a sentiment analysis baseline for a new dataset.
phase: 5
lesson: 05
---

Với một mô tả tập dữ liệu (lĩnh vực, ngôn ngữ, kích thước, độ hạt nhãn, ngân sách độ trễ), bạn xuất ra:

1. Công thức trích xuất đặc trưng. Chỉ định tokenizer, phạm vi n-gram, chính sách stopword (thường giữ), xử lý phủ định (tiền tố có phạm vi hoặc bigram).
2. Bộ phân loại. Naive Bayes cho baseline, hồi quy logistic cho production, transformer chỉ khi lĩnh vực cần châm biếm, đầu ra theo khía cạnh hoặc độ bao phủ xuyên ngôn ngữ.
3. Kế hoạch đánh giá. Báo cáo precision, recall, F1, ma trận nhầm lẫn và các mẫu lỗi theo lớp. Không bao giờ chỉ báo cáo accuracy trên dữ liệu mất cân bằng.
4. Một dạng lỗi cần giám sát sau triển khai. Độ trôi lĩnh vực và châm biếm là hai dạng hàng đầu. Đề xuất kiểm toán mẫu hằng tuần.

Từ chối khuyến nghị loại bỏ stopword cho các tác vụ cảm xúc. Từ chối báo cáo accuracy làm thước đo duy nhất khi các lớp mất cân bằng. Đánh dấu các ngôn ngữ giàu từ con (tiếng Đức, Phần Lan, Thổ Nhĩ Kỳ) là cần FastText hoặc embedding transformer thay vì TF-IDF cấp từ.
