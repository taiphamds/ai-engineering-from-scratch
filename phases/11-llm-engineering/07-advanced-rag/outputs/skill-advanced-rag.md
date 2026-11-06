---
name: skill-advanced-rag
description: Build production-grade RAG with hybrid search, reranking, and evaluation
version: 1.0.0
phase: 11
lesson: 7
tags: [rag, hybrid-search, bm25, reranking, hyde, evaluation]
---

# Advanced RAG Pattern

RAG cơ bản: nhúng truy vấn -> tìm vector -> top-k -> sinh.
RAG nâng cao: nhúng truy vấn + BM25 -> hợp nhất thứ hạng -> xếp hạng lại -> top-k -> sinh.

```
query -> [vector search (top-50)] -+-> RRF fusion -> reranker (top-5) -> prompt -> LLM
                                   |
query -> [BM25 search (top-50)]  --+
```

## When to upgrade from basic RAG

- Chất lượng truy xuất giảm dưới Recall@5 70%
- Người dùng báo câu trả lời sai hoặc không liên quan
- Ngữ liệu tăng quá 100K chunk
- Truy vấn dùng từ vựng khác tài liệu
- Câu hỏi nhiều bước nối thất bại nhất quán

## Implementation checklist

1. Thêm chỉ mục BM25 bên cạnh chỉ mục vector
2. Chạy cả hai tìm kiếm song song (top-50 mỗi loại)
3. Gộp bằng Reciprocal Rank Fusion (k=60)
4. Xếp hạng lại ứng viên hàng đầu bằng cross-encoder
5. Lấy top-5 cho prompt cuối
6. Thêm đánh giá độ trung thực trên tập kiểm thử

## Technique selection guide

- **Tìm kiếm lai**: luôn dùng trong sản xuất. Không tốn thêm chi phí lúc truy vấn.
- **Xếp hạng lại**: dùng khi Recall@50 tốt nhưng Recall@5 kém. Thêm độ trễ 50-200ms.
- **HyDE**: dùng khi truy vấn mơ hồ hoặc dùng từ vựng khác tài liệu. Thêm một lệnh gọi LLM.
- **Chunk cha-con**: dùng khi chunk nhỏ thiếu ngữ cảnh nhưng chunk lớn làm loãng liên quan.
- **Lọc metadata**: dùng khi ngữ liệu có loại rõ ràng (ngày, loại nguồn, phòng ban).
- **Phân rã truy vấn**: dùng cho câu hỏi nhiều bước nối cần thông tin từ nhiều tài liệu.

## Common mistakes

- Chạy BM25 và tìm vector với các tập chunk khác nhau (chúng phải tìm cùng ngữ liệu)
- Dùng tập ứng viên quá nhỏ để xếp hạng lại (top-10 quá ít; dùng top-50)
- Thêm HyDE cho mọi truy vấn (chỉ giúp khi không khớp từ vựng là nút thắt)
- Không đánh giá thay đổi (đo Recall@k trước và sau mỗi kỹ thuật)
- Thiết kế pipeline quá mức trước khi đo nơi nó thất bại

## Evaluation workflow

1. Tạo 50+ câu hỏi kiểm thử với chunk câu trả lời đã biết
2. Đo Recall@5 và Recall@10 cho mỗi phương pháp truy xuất
3. Với truy vấn mà truy xuất thành công, đo độ trung thực của câu trả lời được sinh
4. Theo dõi thước đo hằng tuần khi ngữ liệu tăng
5. Điều tra từng thất bại trước khi thêm kỹ thuật
