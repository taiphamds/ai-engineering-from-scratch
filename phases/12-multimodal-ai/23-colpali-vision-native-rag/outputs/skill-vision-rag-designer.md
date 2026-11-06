---
name: vision-rag-designer
description: Design a vision-native document RAG using ColPali / ColQwen2 / VisRAG, with storage estimate and generator-pick.
version: 1.0.0
phase: 12
lesson: 23
tags: [colpali, colqwen2, visrag, late-interaction, vidore]
---

Với dự án RAG tài liệu (kích thước ngữ liệu, độ trễ truy vấn mục tiêu, ngân sách lưu trữ, chi phí mỗi truy vấn), đưa ra cấu hình RAG thị giác nguyên bản.

Tạo ra:

1. Lựa chọn bộ truy xuất. ColPali (nền PaliGemma), ColQwen2 (nền Qwen2-VL, chất lượng tốt hơn), ColSmol (1B cho biên), hoặc VisRAG (bi-encoder, lưu trữ rẻ hơn).
2. Ước tính lưu trữ. N_docs * N_p_per_doc * D * 4 byte thô; chia 8 cho PQ.
3. Ước tính độ trễ.
   - SLA truy xuất: ~10ms embedding truy vấn + truy xuất top-k (MaxSim hoặc ANN), phụ thuộc kích thước chỉ mục.
   - SLA câu trả lời đầy đủ: độ trễ truy xuất + bộ tạo 200-500ms (phụ thuộc mô hình và phần cứng).
4. Lựa chọn bộ tạo. Qwen2.5-VL-72B cho mở, Claude Opus 4.7 cho tiên tiến nhất.
5. Kế hoạch nén. Tỷ lệ PQ / OPQ mục tiêu 8-16x; chỉ mục HNSW cho ANN nhanh.
6. Lộ trình chuyển đổi từ RAG văn bản. Cách A/B, khi nào chuyển hoàn toàn.

Các trường hợp bác bỏ tuyệt đối:
- Dùng ColPali không nén PQ trên ngữ liệu >10k trang. Lưu trữ tăng vọt.
- Khẳng định truy xuất bi-encoder ngang ColBERT MaxSim về độ thu hồi tài liệu. Không phải trên ViDoRe.
- Khuyến nghị RAG văn bản cho khối lượng công việc biểu đồ + bảng. RAG văn bản mất phần lớn tín hiệu.

Quy tắc từ chối:
- Nếu ngữ liệu thuần văn bản (wiki, nhật ký trò chuyện), từ chối RAG thị giác nguyên bản và khuyến nghị RAG văn bản tiêu chuẩn.
- Nếu SLA truy xuất <100ms, ưu tiên VisRAG (bi-encoder) hơn ColPali MaxSim.
- Nếu SLA câu trả lời đầy đủ <100ms, từ chối hoàn toàn RAG tạo sinh và khuyến nghị UX chỉ truy xuất hoặc câu trả lời lưu đệm.
- Nếu ngân sách lưu trữ <1 GB và ngữ liệu >100k trang, từ chối ColPali độ trung thực đầy đủ; đề xuất PQ mạnh hoặc VisRAG.

Đầu ra: thiết kế RAG một trang với lựa chọn bộ truy xuất, ước tính lưu trữ, độ trễ, bộ tạo, nén, chuyển đổi. Kết thúc bằng arXiv 2407.01449 (ColPali), 2410.10594 (VisRAG).
