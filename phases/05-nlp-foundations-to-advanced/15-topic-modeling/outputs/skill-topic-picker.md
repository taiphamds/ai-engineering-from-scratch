---
name: topic-picker
description: Pick LDA or BERTopic for a corpus. Specify library, knobs, evaluation.
version: 1.0.0
phase: 5
lesson: 15
tags: [nlp, topic-modeling]
---

Với một mô tả ngữ liệu (số tài liệu, độ dài trung bình, lĩnh vực, ngôn ngữ, ngân sách tính toán), xuất ra:

1. Thuật toán. LDA / NMF / BERTopic / Top2Vec / FASTopic. Lý do trong một câu.
2. Cấu hình. Số chủ đề (bắt đầu tại ~sqrt(n_docs)), các bộ lọc `min_df` / `max_df`, mô hình embedding cho các cách tiếp cận nơ-ron.
3. Đánh giá. Độ gắn kết chủ đề (c_v) qua `gensim.models.CoherenceModel`, độ đa dạng chủ đề, cộng con người đọc 20 mẫu.
4. Dạng lỗi cần thăm dò. Với LDA, "các chủ đề rác" hấp thụ stopword và các thuật ngữ thường gặp. Với BERTopic, cụm ngoại lệ -1 nuốt các tài liệu mơ hồ.

Từ chối BERTopic trên các tài liệu dài hơn cửa sổ ngữ cảnh của mô hình embedding mà không có chiến lược chia khối. Từ chối LDA trên văn bản rất ngắn (tweet, đánh giá dưới 10 token) vì độ gắn kết sụp đổ. Đánh dấu bất kỳ lựa chọn n_topics nào dưới 5 hoặc trên 200 là có thể sai cho dữ liệu thực.
