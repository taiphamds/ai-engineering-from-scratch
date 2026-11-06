---
name: codebase-rag
description: Build a cross-repo semantic search system with AST-aware chunking, hybrid retrieval, incremental re-index, and cited answers.
version: 1.0.0
phase: 19
lesson: 02
tags: [capstone, rag, code-search, tree-sitter, qdrant, bm25, hybrid-retrieval]
---

Với 10+ repo tổng ít nhất 2M dòng mã, xây pipeline thu nạp, chỉ mục lai và agent truy vấn bắt buộc trích dẫn trả lời xuyên repo bằng neo file:line xác minh được.

Kế hoạch xây dựng:

1. Phân tích mọi file bằng tree-sitter. Chia đoạn ở ranh giới nút hàm và lớp. Lưu `{repo, path, start_line, end_line, symbol, body}`.
2. Tóm tắt mọi đoạn bằng Claude Haiku 4.5 hoặc Gemini 2.5 Flash với system prompt lưu bộ nhớ đệm. Lưu tóm tắt một câu cạnh đoạn.
3. Lập chỉ mục vào ba cấu trúc: Qdrant (dense, Voyage-code-3 hoặc nomic-embed-code), Tantivy (BM25 với trọng số trường) và kuzu (cạnh đồ thị ký hiệu cho import, gọi, kế thừa).
4. Xây agent truy vấn LangGraph ba nút: retrieve (dense song song BM25), rerank (Cohere rerank-3 hoặc bge-reranker-v2-gemma-2b), synth (Claude Sonnet 4.7 với lưu bộ nhớ đệm prompt và yêu cầu trích dẫn file:line).
5. Hậu lọc: từ chối mọi khẳng định không có neo `(repo/path:start-end)` xác minh được; hỏi lại hoặc loại.
6. Kết nối webhook git push tính diff cấp ký hiệu và chỉ tạo embedding lại đoạn đổi. Mục tiêu: commit 50 file tìm kiếm được dưới 60s trên tập repo 2M LOC.
7. Đánh giá với tập giữ riêng 100 câu hỏi. Báo cáo MRR@10, nDCG@10, tính trung thực trích dẫn và phân vị độ trễ.
8. Chạy tác vụ độ trôi hằng tuần thực hiện lại đánh giá và cảnh báo MRR@10 giảm > 5%.

Tiêu chí đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Chất lượng truy xuất | MRR@10 và nDCG@10 trên tập giữ riêng 100 câu hỏi |
| 20 | Tính trung thực trích dẫn | Tỷ phần khẳng định câu trả lời có neo file:line xác minh được |
| 20 | Độ trễ và quy mô | Độ trễ truy vấn p95 ở 10k QPS trên kích thước corpus đã lập chỉ mục |
| 20 | Tính đúng lập chỉ mục tăng dần | Thời gian từ git push đến tìm kiếm được trên commit 50 file |
| 15 | UX và định dạng câu trả lời | Khả năng bấm trích dẫn, xem trước đoạn mã, khả năng hỏi tiếp |

Các trường hợp loại bỏ dứt khoát:

- Chia đoạn token kích thước cố định thay chia nhận biết AST. Sẽ đầu độc corpus nặng mã được sinh.
- Truy xuất chỉ cosine không có BM25 hoặc xếp hạng lại. Đã biết thất bại ở truy vấn tên ký hiệu chính xác.
- Câu trả lời không trích dẫn file:line bắt buộc.
- Tạo embedding lại toàn corpus mỗi git push; phải tăng dần.

Quy tắc từ chối:

- Từ chối lập chỉ mục repo khi chưa đọc giấy phép. Một số cấm embedding trong kho vector bên thứ ba.
- Từ chối trả lời truy vấn khẳng định trích file chỉ mục chưa thấy; luôn xác minh neo trước trả.
- Từ chối phục vụ câu trả lời có p95 trên 4s; thay bằng kết quả một phần với handle hỏi tiếp.

Đầu ra: repo chứa pipeline thu nạp, agent truy vấn LangGraph, tập đánh giá gắn nhãn 100 câu hỏi, liên kết bảng điều khiển Langfuse và bài viết nêu ba chế độ lỗi truy xuất bạn sửa (đầu độc mã được sinh, thu hồi ký hiệu đuôi dài, phân giải ký hiệu xuyên repo) và thay đổi chính xác sửa từng lỗi.
