---
name: obs-platform-wiring
description: Pick an observability platform (Langfuse, Phoenix, Opik, Datadog) and wire traces + evals + prompt versions into an existing agent.
version: 1.0.0
phase: 14
lesson: 24
tags: [observability, langfuse, phoenix, opik, datadog, tracing]
---

Với một runtime agent và các yêu cầu sản phẩm, chọn một nền tảng khả năng quan sát và tạo khung kết nối.

Quyết định:

1. Cần quản lý prompt + phát lại phiên ở một nơi -> **Langfuse**.
2. Cần tính liên quan RAG sâu + phát hiện trôi dạt/bất thường -> **Phoenix**.
3. Cần tối ưu hóa prompt tự động + các chốt bảo vệ PII -> **Opik**.
4. Đã chạy Datadog -> **Datadog LLM Observability** (ánh xạ GenAI trực tiếp từ v1.37+).
5. Cần giấy phép không ELv2 -> **Langfuse** (MIT) hoặc **Opik** (Apache 2.0); tránh Phoenix cho phân phối OSS thuần.

Tạo:

1. Đo lường OTel GenAI (Bài 23) — đây là nền chung.
2. SDK dành riêng cho nền tảng hoặc cấu hình bộ xuất OTel.
3. Bảng tiêu chí giám khảo LLM cho miền của bạn (tính đúng đắn thực tế, phạm vi, giọng điệu, chất lượng từ chối).
4. Đánh phiên bản prompt được nối với trace (Langfuse) hoặc cấu hình phân cụm trace (Phoenix) hoặc các định nghĩa thí nghiệm (Opik).
5. Các chốt bảo vệ trên nội dung được ghi log: che PII, làm sạch bí mật.
6. Các dashboard: tình trạng phiên, hệ phân loại lỗi, phân phối độ trễ, chi phí cho mỗi phiên.

Các trường hợp từ chối cứng:

- Phát hành mà không có đánh giá. Chỉ truy vết là ghi log đắt tiền.
- Sử dụng một giám khảo LLM tự viết mà không có xác minh bên ngoài. Mẫu CRITIC (Bài 05): các giám khảo cần các công cụ bên ngoài để có cơ sở thực tế.
- Lưu PII trong body span. Luôn kho bên ngoài + các ID tham chiếu.

Các quy tắc từ chối:

- Nếu người dùng yêu cầu "một nền tảng cho mọi thứ," từ chối và đưa ra quyết định ở trên. Không nền tảng đơn lẻ nào thống trị cả ba trục.
- Nếu sản phẩm không có tiêu chí nghiệm thu cho mỗi tác vụ agent, từ chối phát hành các đánh giá. Một giám khảo LLM cần một bảng tiêu chí; một bảng tiêu chí cần các quyết định sản phẩm.
- Nếu người dùng muốn "không lấy mẫu, ghi mọi thứ," từ chối. Khối lượng trace tăng tuyến tính với lưu lượng; lấy mẫu (dựa trên đầu hoặc dựa trên đuôi) là bắt buộc ở quy mô lớn.

Đầu ra: `instrumentation.py`, `judge.py`, `dashboards.md`, `README.md` giải thích lựa chọn nền tảng, bảng tiêu chí, chiến lược lấy mẫu và ứng phó sự cố. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 30 (phát triển dựa trên đánh giá) hoặc Bài 26 (hệ phân loại chế độ lỗi).
