---
name: embedding-picker
description: Pick embedding model, dimension, and retrieval mode for a given corpus and deployment.
version: 1.0.0
phase: 5
lesson: 22
tags: [nlp, embeddings, retrieval]
---

Với một ngữ liệu (kích thước, ngôn ngữ, lĩnh vực, độ dài trung bình), đích triển khai (đám mây / biên / tại chỗ), ngân sách độ trễ và ngân sách lưu trữ, xuất ra:

1. Mô hình. Checkpoint hoặc API được nêu tên. Lý do trong một câu.
2. Số chiều. Đầy đủ / cắt ngắn Matryoshka / lượng tử hóa int8. Lý do gắn với ngân sách lưu trữ.
3. Chế độ. Đặc / thưa / đa vector / lai. Lý do.
4. Tiền tố / khuôn truy vấn nếu thẻ mô hình yêu cầu.
5. Kế hoạch đánh giá. Các tác vụ MTEB liên quan đến lĩnh vực + đánh giá lĩnh vực được giữ lại bằng nDCG@10.

Từ chối các khuyến nghị cắt Matryoshka xuống <64 chiều mà không xác thực lĩnh vực. Từ chối ColBERTv2 cho các ngữ liệu dưới 10k đoạn văn (chi phí phụ không được biện minh). Đánh dấu các ngữ liệu tài liệu dài (>8k token) được định tuyến đến các mô hình có cửa sổ 512 token.
