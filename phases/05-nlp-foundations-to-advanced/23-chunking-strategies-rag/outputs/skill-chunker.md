---
name: chunker
description: Pick a chunking strategy, size, and overlap for a given corpus and query distribution.
version: 1.0.0
phase: 5
lesson: 23
tags: [nlp, rag, chunking]
---

Với một ngữ liệu (các loại tài liệu, độ dài trung bình, lĩnh vực) và phân phối truy vấn (sự kiện ngắn / phân tích / nhiều bước), xuất ra:

1. Chiến lược. Đệ quy / câu / ngữ nghĩa / tài liệu cha / muộn / theo ngữ cảnh. Lý do.
2. Kích thước khối. Số token. Lý do gắn với loại truy vấn.
3. Chồng lấn. Mặc định 0; giải thích nếu >0.
4. Buộc tối thiểu/tối đa. Các biện pháp bảo vệ `min_tokens`, `max_tokens`.
5. Kế hoạch đánh giá. Recall@5 trên tập đánh giá phân tầng 50 truy vấn (sự kiện ngắn, phân tích, nhiều bước).

Từ chối bất kỳ chiến lược chia khối nào không buộc kích thước khối tối thiểu/tối đa. Từ chối chồng lấn trên 20% mà không có một thử nghiệm loại bỏ thành phần cho thấy nó hữu ích. Đánh dấu các khuyến nghị chia khối ngữ nghĩa không có mức sàn token tối thiểu.
