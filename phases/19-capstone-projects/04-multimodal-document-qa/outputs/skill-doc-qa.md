---
name: doc-qa
description: Build a vision-first multimodal document QA system on 10k pages with late-interaction retrieval and evidence-region citations.
version: 1.0.0
phase: 19
lesson: 04
tags: [capstone, multimodal, rag, colpali, colqwen, late-interaction, pdf]
---

Với corpus PDF (10-K, bài báo khoa học, tài liệu quét), xây pipeline lập chỉ mục trang như ảnh bằng tương tác muộn kiểu ColPali và trả lời câu hỏi có vùng bằng chứng cấp trang.

Kế hoạch xây dựng:

1. Render mọi trang PDF thành PNG 1536x2048 bằng PyMuPDF ở 180 DPI.
2. Tạo embedding mọi trang bằng ColQwen2.5-v0.2 hoặc ColQwen3-omni. Lưu embedding patch đa vector trong Vespa, Qdrant multi-vector hoặc AstraDB.
3. Áp dụng cắt tỉa patch 50% kiểu DocPruner. Xác minh sụt độ chính xác dưới 0.5% trên ViDoRe v3.
4. Lúc truy vấn: tạo embedding token truy vấn; tính MaxSim với patch mỗi trang; xếp top-k.
5. Tổng hợp bằng Qwen3-VL-30B hoặc Gemini 2.5 Pro với truy vấn cộng ảnh top-5 trang. Yêu cầu neo trích dẫn `(doc_id, page, region)`.
6. Với trang nặng phương trình hoặc bảng, chạy Nougat hoặc dots.ocr làm kênh văn bản tùy chọn, đưa cùng ảnh.
7. Xây trình xem Next.js 15 phủ vùng bằng chứng thành hộp bao trên trang nguồn.
8. Đánh giá trên ViDoRe v3 và M3DocVQA. Tạo ma trận lớp-nội-dung × cách-tiếp-cận so ưu tiên thị giác với OCR-rồi-văn-bản trên văn thuần, bảng, biểu đồ, viết tay, phương trình.

Tiêu chí đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Độ chính xác ViDoRe v3 / M3DocVQA | Đo chuẩn so đường cơ sở OCR-rồi-văn-bản trên trang đối sánh |
| 20 | Căn cứ vùng bằng chứng | Tỷ phần vùng được trích chứa khoảng câu trả lời |
| 20 | Kỹ thuật lưu trữ và độ trễ | Nén DocPruner, p95 chỉ mục, p95 câu trả lời dưới 2s |
| 20 | Suy luận nhiều trang | Độ chính xác trên tập nhiều trang 100 câu hỏi gắn nhãn tay |
| 15 | UX xem nguồn | Độ trung thực lớp phủ, công cụ so sánh, trình khám phá từng trang |

Các trường hợp loại bỏ dứt khoát:

- Pipeline OCR-trước quảng bá "ưu tiên thị giác" bằng ghép văn bản OCR vào embedding đơn vector.
- Mọi hệ thống bỏ hộp bao cấp patch nên không render được lớp phủ bằng chứng.
- Số lưu trữ báo cáo không ghi thiết lập DocPruner.

Quy tắc từ chối:

- Từ chối lập chỉ mục hợp đồng pháp lý quét không có chính sách che riêng. Embedding ColQwen làm lộ nội dung.
- Từ chối phục vụ truy vấn corpus người dùng chưa công bố. Dấu vết kiểm toán bắt buộc cho miền chịu quy định.
- Từ chối so OCR-rồi-văn-bản khi chưa chạy cả hai pipeline trên cùng corpus.

Đầu ra: repo chứa pipeline thu nạp, cấu hình Vespa (hoặc Qdrant multi-vector), tập đánh giá nhiều trang 100 câu hỏi, UI trình xem và bài viết có ma trận lớp-nội-dung x cách-tiếp-cận cùng khuyến nghị cụ thể lớp nội dung nào vẫn ưu tiên OCR-rồi-văn-bản năm 2026.
