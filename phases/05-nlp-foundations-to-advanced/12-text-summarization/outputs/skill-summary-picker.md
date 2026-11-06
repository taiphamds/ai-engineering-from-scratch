---
name: summary-picker
description: Pick extractive or abstractive, name the library, add a factuality check.
version: 1.0.0
phase: 5
lesson: 12
tags: [nlp, summarization]
---

Với một tác vụ (loại tài liệu, yêu cầu tuân thủ, độ dài, ngân sách tính toán), xuất ra:

1. Cách tiếp cận. Trích xuất hoặc trừu tượng. Giải thích lý do trong một câu.
2. Mô hình / thư viện khởi đầu. Nêu tên nó. `sumy.TextRankSummarizer`, `facebook/bart-large-cnn`, `google/pegasus-pubmed` hoặc một prompt LLM.
3. Kế hoạch đánh giá. ROUGE-1, ROUGE-2, ROUGE-L (dùng `rouge-score` với stemming). Cộng kiểm tra tính đúng sự thật nếu trừu tượng.
4. Một dạng lỗi cần thăm dò. Hoán đổi thực thể là phổ biến nhất trong tóm tắt tin tức trừu tượng; đánh dấu các mẫu mà thực thể nguồn không xuất hiện trong tóm tắt.

Từ chối tóm tắt trừu tượng cho nội dung y tế, pháp lý, tài chính hoặc chịu quy định mà không có cổng kiểm tra tính đúng sự thật. Đánh dấu đầu vào vượt cửa sổ ngữ cảnh của mô hình là cần tóm tắt map-reduce chia khối, không chỉ cắt cụt.
