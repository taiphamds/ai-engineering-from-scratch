---
name: re-designer
description: Design a relation extraction pipeline with provenance and canonicalization.
version: 1.0.0
phase: 5
lesson: 26
tags: [nlp, relation-extraction, knowledge-graph]
---

Với một ngữ liệu (lĩnh vực, ngôn ngữ, khối lượng) và mục đích phía sau (KG-RAG, phân tích, tuân thủ), xuất ra:

1. Bộ trích xuất. Dựa trên mẫu / có giám sát / LLM / lai AEVS. Lý do gắn với mục tiêu precision so với recall.
2. Ontology. Danh sách thuộc tính đóng (Wikidata / lĩnh vực) hoặc IE mở với lượt chuẩn hóa.
3. Nguồn gốc. Mỗi bộ ba mang span ký tự nguồn + id tài liệu. Không thể thương lượng cho kiểm toán.
4. Chiến lược gộp. Id thực thể chuẩn + id quan hệ + các định ngữ thời gian; chính sách khử trùng lặp.
5. Đánh giá. Precision / recall trên 200 bộ ba được gán nhãn bằng tay + tỷ lệ ảo giác trên mẫu trích xuất bằng LLM.

Từ chối bất kỳ pipeline RE dựa trên LLM nào không có xác minh span (nguồn gốc nguồn). Từ chối đầu ra IE mở chảy vào một đồ thị production mà không chuẩn hóa. Đánh dấu các pipeline không có định ngữ thời gian trên các quan hệ bị giới hạn thời gian (người sử dụng lao động, vợ/chồng, vị trí).
