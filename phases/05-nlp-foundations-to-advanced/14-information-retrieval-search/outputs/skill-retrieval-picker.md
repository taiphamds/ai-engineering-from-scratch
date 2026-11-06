---
name: retrieval-picker
description: Pick a retrieval stack for a given corpus and query pattern.
version: 1.0.0
phase: 5
lesson: 14
tags: [nlp, retrieval, rag, search]
---

Với các yêu cầu (kích thước ngữ liệu, mẫu truy vấn, ngân sách độ trễ, mức chất lượng, ràng buộc hạ tầng), xuất ra:

1. Ngăn xếp. Chỉ BM25, chỉ đặc, lai (BM25 + đặc + RRF), lai + xếp hạng lại cross-encoder hoặc ba hướng (BM25 + đặc + thưa được học).
2. Encoder đặc. Nêu tên mô hình cụ thể (`all-MiniLM-L6-v2`, `bge-large-en-v1.5`, `e5-large-v2`, `paraphrase-multilingual-MiniLM-L12-v2`). Khớp với ngôn ngữ, lĩnh vực, độ dài ngữ cảnh.
3. Bộ xếp hạng lại. Nêu tên mô hình cross-encoder nếu dùng (`cross-encoder/ms-marco-MiniLM-L-6-v2`, `BAAI/bge-reranker-large`). Đánh dấu độ trễ thêm ~30-100ms trên top-30.
4. Kế hoạch đánh giá. Recall@10 là thước đo bộ truy xuất chính. MRR cho nhiều câu trả lời. Baseline trước, các cải thiện tăng dần được đo so với nó.

Từ chối khuyến nghị chỉ đặc cho các ngữ liệu có thực thể có tên, mã lỗi hoặc SKU sản phẩm trừ khi người dùng có bằng chứng đặc xử lý các kết quả khớp chính xác. Từ chối bỏ qua xếp hạng lại cho truy xuất có hệ quả lớn (pháp lý, y tế) nơi top-5 cuối quyết định câu trả lời cho người dùng.
