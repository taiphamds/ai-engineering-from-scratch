---
name: document-ai-stack-picker
description: Pick between OCR pipeline, OCR-free specialist, and VLM-native for a document-AI project based on domain, scale, and regulatory needs.
version: 1.0.0
phase: 12
lesson: 22
tags: [document-ai, ocr, donut, nougat, paligemma, vlm-native]
---

Với dự án AI tài liệu (miền: hóa đơn / bài báo khoa học / biểu mẫu / hỗn hợp; quy mô: trang mỗi ngày; ngưỡng chất lượng; nhu cầu quy định), chọn ngăn xếp và tạo cấu hình tham khảo.

Tạo ra:

1. Lựa chọn ngăn xếp. Kỷ nguyên 1 (pipeline OCR + LayoutLMv3), Kỷ nguyên 2 (Donut / Nougat không OCR), Kỷ nguyên 3 (VLM nguyên bản), hoặc lai.
2. Ước tính chi phí mỗi trang. Số token và độ trễ ở ngăn xếp đã chọn.
3. Kỳ vọng độ chính xác. DocVQA + ChartQA + benchmark riêng cho miền.
4. Chiến lược chữ viết tay. VLM nguyên bản khi không nhạy chi phí; TrOCR chuyên dụng + định tuyến cho quy mô lớn.
5. Đầu ra toán / LaTeX. Nougat cho bài báo khoa học; VLM cho phần khác.
6. Dự phòng quy định. Lai với nhật ký kiểm toán kiểm tra chéo.

Các trường hợp bác bỏ tuyệt đối:
- Đề xuất VLM nguyên bản cho >1M trang/ngày mà không phân tích chi phí. Chi phí token ở 2576px mỗi trang là đáng kể.
- Khuyến nghị giải pháp một mô hình cho quy trình chịu quản lý mà không có đường kiểm toán.
- Khẳng định Nougat xử lý hóa đơn quét. Không phải vậy — nó chuyên bài báo khoa học.

Quy tắc từ chối:
- Nếu quy mô >10M trang/ngày, từ chối Kỷ nguyên 3 và khuyến nghị Kỷ nguyên 1 với Kỷ nguyên 3 làm bộ xác thực lấy mẫu.
- Nếu miền có nhiều chữ viết tay, từ chối pipeline OCR và khuyến nghị VLM nguyên bản + mô hình chuyên chữ viết tay (TrOCR).
- Nếu cần độ trung thực LaTeX cho phương trình, yêu cầu Nougat trong vòng lặp.

Đầu ra: kế hoạch một trang với ngăn xếp, chi phí, độ chính xác, chữ viết tay, toán, quy định. Kết thúc bằng arXiv 2308.13418 (Nougat), 2204.08387 (LayoutLMv3), 2111.15664 (Donut).
