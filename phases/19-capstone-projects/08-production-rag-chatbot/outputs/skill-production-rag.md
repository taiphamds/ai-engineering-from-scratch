---
name: production-rag
description: Deploy a regulated-domain RAG chatbot with role + jurisdiction filtering, prompt caching, guardrails, and live drift monitoring.
version: 1.0.0
phase: 19
lesson: 08
tags: [capstone, rag, chatbot, regulated, llama-guard, nemo-guardrails, ragas, langfuse]
---

Với corpus miền chịu quy định (hợp đồng pháp lý, quy trình thử nghiệm lâm sàng, hợp đồng bảo hiểm hoặc tương tự), triển khai chatbot trả lời có trích dẫn xác minh được, tôn trọng chính sách truy cập vai trò và khu vực tài phán, được giám sát độ trôi.

Kế hoạch xây dựng:

1. Phân tích corpus bằng docling hoặc Unstructured; định tuyến tài liệu giàu thị giác qua ColPali. Xuất đoạn có nhãn vai trò và khu vực tài phán.
2. Lập chỉ mục dense (Voyage-3 hoặc Nomic-embed-v2) vào pgvector + pgvectorscale; BM25 sparse qua Tantivy.
3. Kết nối agent hội thoại LangGraph: retrieve (lọc vai trò + khu vực tài phán, dense+BM25 lai, reciprocal rank fusion), rerank (bge-reranker-v2-gemma-2b hoặc Voyage rerank-2), synth (Claude Sonnet 4.7 với lưu bộ nhớ đệm prompt).
4. Ghép prompt có tiền tố ổn định: mở đầu hệ thống -> block chính sách -> ngữ cảnh xếp lại -> truy vấn người dùng. Mục tiêu tỷ lệ trúng bộ nhớ đệm prompt 60-80%.
5. Chốt bảo vệ: Llama Guard 4 trên đầu vào và ra, rail NeMo Guardrails v0.12 cho câu ngoài miền và chính sách cấm, làm sạch PII Presidio ở đầu ra, hậu lọc bắt buộc trích dẫn.
6. Xây tập chuẩn 200 câu hỏi chuyên gia gắn nhãn với (câu trả lời, trích dẫn). Chấm khớp trích dẫn chính xác, tính đúng câu trả lời, tính trung thực RAGAS.
7. Xây red team 50 prompt (PAIR, TAP, trích PII, ngoài miền, thăm dò xuyên khu vực tài phán).
8. Bảng độ trôi Arize Phoenix theo dõi nDCG truy xuất và tính trung thực trích dẫn hằng tuần; cảnh báo giảm 5%.
9. Báo cáo chi phí Langfuse: tỷ lệ trúng bộ nhớ đệm prompt, token mỗi truy vấn, $/truy vấn theo giai đoạn.

Tiêu chí đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Tính trung thực RAGAS + liên quan câu trả lời | Điểm trực tuyến trên tập chuẩn 200 câu hỏi |
| 20 | Tính đúng trích dẫn | Tỷ phần câu trả lời có neo nguồn xác minh được |
| 20 | Bao phủ chốt bảo vệ | Tỷ lệ vượt Llama Guard 4 + kết quả bộ jailbreak |
| 20 | Kỹ thuật chi phí / độ trễ | Tỷ lệ trúng bộ nhớ đệm prompt, độ trễ p95, $/truy vấn |
| 15 | Bảng điều khiển giám sát độ trôi | Bảng Phoenix trực tiếp có xu hướng chất lượng truy xuất hằng tuần |

Các trường hợp loại bỏ dứt khoát:

- Mọi chatbot rò dữ liệu xuyên khu vực tài phán. Lọc vai trò+khu vực phải thực thi trước truy xuất, không phải sau.
- Prompt tổng hợp phá tiền tố bộ nhớ đệm (đổi thứ tự chính sách giữa hệ thống và ngữ cảnh). Sẽ phá tính kinh tế bộ nhớ đệm.
- Cấu hình chốt bảo vệ không có lần chạy red-team ghi log.
- Câu trả lời không trích dẫn; trích dẫn không neo xác minh được.

Quy tắc từ chối:

- Từ chối triển khai miền chịu quy định không có thẻ khu vực tài phán trên mọi đoạn.
- Từ chối huấn luyện truy xuất trên câu tập chuẩn chuyên gia gắn nhãn. Nhiễm phá uy tín đánh giá.
- Từ chối khẳng định "tuân thủ" khi không có ma trận áp dụng SOC2/HIPAA/GDPR tường minh trong README.

Đầu ra: repo chứa pipeline thu nạp, agent hội thoại LangGraph, tập chuẩn 200 câu hỏi, red team 50 prompt, bảng độ trôi Phoenix, bảng chi phí Langfuse và bài viết nêu ba mẫu hỏng trích dẫn hàng đầu bạn quan sát cùng cách sửa truy xuất hoặc prompt cho mỗi mẫu.
