---
name: llm-observability
description: Build a self-hosted LLM observability dashboard that ingests OpenTelemetry GenAI spans, runs evals, and catches injected regressions in under five minutes.
version: 1.0.0
phase: 19
lesson: 11
tags: [capstone, observability, otel, langfuse, phoenix, evals, drift, clickhouse]
---

Với lưu lượng LLM sản xuất trên ít nhất sáu họ SDK (OpenAI, Anthropic, Google GenAI, LangChain, LlamaIndex, vLLM), triển khai một lớp quan sát tự lưu trữ tiếp nhận các span OTLP GenAI-semconv, chạy đánh giá, phát hiện độ trôi, và cảnh báo.

Kế hoạch xây dựng:

1. OpenTelemetry Collector với bộ nhận OTLP HTTP, bộ xử lý lấy mẫu đuôi (giữ 100% lỗi, 10% thành công, 100% tính độc hại cao/PII), các bộ xuất tới ClickHouse + S3.
2. Lược đồ span ClickHouse phản ánh semconv GenAI: gen_ai.system, gen_ai.request.model, usage.input/output_tokens, latency_ms, user_id, app_id, cùng một túi JSON cho prompt/phần hoàn thành.
3. Kho siêu dữ liệu Postgres cho ứng dụng, người dùng, phiên, hàng đợi chú giải.
4. Bộ đo lường tự động OpenLLMetry trên một ứng dụng khách cho mỗi họ SDK; xác minh các span chuẩn đi vào.
5. DeepEval + RAGAS + gói bộ đánh giá Phoenix được lên lịch trên các trace được lấy mẫu; LLM-judge tùy chỉnh cho PII và ngoài chính sách.
6. Bộ phát hiện độ trôi PSI / KL hàng tuần trên các embedding prompt được gộp; ngưỡng cảnh báo 0.2.
7. Bộ xuất Prometheus cho các tổng hợp điểm đánh giá và phân vị độ trễ; Alertmanager tới Slack (cảnh báo) + PagerDuty (nghiêm trọng).
8. Bảng điều khiển Next.js 15 App Router: tổng quan, tìm kiếm trace + waterfall, xu hướng đánh giá, biểu đồ độ trôi, cảnh báo.
9. Thăm dò hồi quy: chèn một mẫu phản hồi rò rỉ SSN giả 1% số lần; đo MTTD (thời gian từ triển khai đến cảnh báo phát ra).

Thang đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Độ bao phủ lược đồ trace | Số họ SDK tạo ra span GenAI chuẩn (mục tiêu 6+) |
| 20 | Tính đúng đắn của đánh giá | Điểm DeepEval / RAGAS so với tập gắn nhãn thủ công |
| 20 | UX dashboard | MTTD với hồi quy được chèn (mục tiêu dưới 5 phút) |
| 20 | Chi phí / quy mô | Tiếp nhận duy trì 1k span/giây mà không tồn đọng |
| 15 | Cảnh báo + phát hiện độ trôi | Chuỗi Prometheus/Alertmanager được thực thi từ đầu đến cuối |

Các trường hợp loại thẳng:

- Các lược đồ span tự tạo tên thuộc tính không có trong semconv GenAI của OpenTelemetry.
- Các chính sách lấy mẫu đuôi bỏ các lỗi (một phản mẫu nổi tiếng).
- Các đánh giá chạy ở tốc độ tiếp nhận mà không lấy mẫu (chi phí không thể chấp nhận).
- Các bảng điều khiển hiển thị "độ trễ" mà không tách p50/p95/p99.

Quy tắc từ chối:

- Từ chối lưu bền vững prompt hoặc phần hoàn thành mà không có chính sách che PII.
- Từ chối tuyên bố "hỗ trợ nhiều SDK" mà không có kiểm thử hồi quy span chuẩn theo SDK.
- Từ chối phát hành phát hiện độ trôi mà không có một cửa sổ đường cơ sở; độ trôi zero-shot là vô ích.

Đầu ra: một kho mã chứa cấu hình collector, schema ClickHouse, dashboard Next.js 15, các tác vụ đánh giá, bộ phát hiện drift, chuỗi cảnh báo, bộ dữ liệu demo 10k trace với các hồi quy được chú thích và một bài viết ghi lại MTTD cho hồi quy PII được chèn cộng ba cải tiến UX dashboard hàng đầu làm giảm MTTD qua các lần lặp.
