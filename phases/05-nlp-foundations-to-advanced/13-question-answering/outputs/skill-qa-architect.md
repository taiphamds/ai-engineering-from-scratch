---
name: qa-architect
description: Choose QA architecture, retrieval strategy, and evaluation plan.
version: 1.0.0
phase: 5
lesson: 13
tags: [nlp, qa, rag]
---

Với các yêu cầu (kích thước ngữ liệu, loại câu hỏi, ràng buộc tính đúng sự thật, ngân sách độ trễ), xuất ra:

1. Kiến trúc. Trích xuất, RAG với bộ đọc trích xuất, RAG với bộ đọc sinh hoặc LLM đóng sách. Lý do trong một câu.
2. Bộ truy xuất. Không có, BM25, đặc (nêu tên encoder như `all-MiniLM-L6-v2`) hoặc lai.
3. Bộ đọc. Mô hình được tinh chỉnh trên SQuAD (`deepset/roberta-base-squad2`), LLM theo tên hoặc DistilBERT được fine-tune theo lĩnh vực.
4. Đánh giá. EM + F1 cho các benchmark trích xuất; độ chính xác câu trả lời + độ chính xác trích dẫn + hiệu chuẩn từ chối cho production. Nêu bạn đang đo gì và bằng cách nào.

Từ chối các câu trả lời LLM đóng sách cho các câu hỏi về quy định hoặc nhạy cảm về tuân thủ. Từ chối bất kỳ hệ thống QA nào không có baseline recall truy xuất (bạn không thể đánh giá bộ đọc khi không biết bộ truy xuất đã đưa đúng đoạn văn lên). Đánh dấu các câu hỏi đòi hỏi suy luận nhiều bước là cần các bộ truy xuất nhiều bước chuyên biệt như các hệ thống được huấn luyện trên HotpotQA.
