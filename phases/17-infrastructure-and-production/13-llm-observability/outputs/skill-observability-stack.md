---
name: observability-stack
description: Pick an LLM observability stack (development platform + gateway + optional scale layer) given stack, scale, budget, and license posture, and define the OpenTelemetry GenAI attribute set.
version: 1.0.0
phase: 17
lesson: 13
tags: [observability, langfuse, langsmith, phoenix, arize, helicone, opik, opentelemetry, genai-conventions]
---

Với ngăn xếp (LangChain / DSPy / SDK thuần), quy mô (dấu vết/ngày), ngân sách, định hướng giấy phép (chỉ MIT so với chấp nhận thương mại) và yêu cầu tự lưu trữ, tạo một kế hoạch khả năng quan sát.

Tạo:

1. Chọn nền tảng phát triển. Langfuse (OSS), LangSmith (thương mại ưu tiên LangChain), Opik (OSS Comet), hoặc không có. Giải thích bằng ngăn xếp và giấy phép.
2. Chọn gateway/đo từ xa. Helicone (proxy + gateway), SigNoz (APM đầy đủ), OpenLLMetry (OTel thuần). Nếu đã dùng một gateway AI (Giai đoạn 17 · 19), nêu tích hợp.
3. Lớp quy mô/hồ. Tùy chọn; Arize AX hoặc Iceberg thuần cho phân tích dài hạn, Phoenix cho độ trôi RAG.
4. Quy ước OTel GenAI. Chỉ định tập thuộc tính tối thiểu: `gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.usage.output_tokens`, `gen_ai.request.temperature`, `gen_ai.response.finish_reasons`, cộng thuộc tính riêng của tổ chức (tenant_id, user_id, task).
5. Chính sách lấy mẫu. 100% lỗi, 100% chi phí cao (>$0.10/lệnh gọi), tỷ lệ lấy mẫu thành công N%. Cửa sổ lưu giữ dữ liệu thô (14 ngày / 30 ngày / 90 ngày). Số liệu tổng hợp được giữ lâu hơn.
6. Cảnh báo. Năm chỉ số phải có cảnh báo: tỷ lệ lỗi, P99 TTFT, chi phí/yêu cầu, tỷ lệ trúng bộ nhớ đệm prompt, tỷ lệ từ chối.

Các trường hợp loại bỏ dứt khoát:
- Đo đạc bên trong SDK riêng của framework mà không có dự phòng OTel. Từ chối — khóa chặt framework.
- Giữ 100% dấu vết ở mức giá tầm Datadog >$500/tháng cho khối lượng công việc không chịu quản lý theo quy định. Từ chối — khuyến nghị lấy mẫu.
- Bỏ qua quy ước OpenTelemetry GenAI. Từ chối — khả năng tương tác năm 2026 yêu cầu chúng.

Quy tắc từ chối:
- Nếu dấu vết/ngày > 5M và nhóm khăng khăng lưu giữ toàn bộ trên Datadog, từ chối nếu không có dự báo chi phí.
- Nếu nhóm chỉ chấp nhận MIT và chọn LangSmith, từ chối — Langfuse là tương đương MIT.
- Nếu nhóm không có gateway AI và chọn Helicone làm gateway VÀ khả năng quan sát, chấp nhận — proxy kiêm gateway tới ~500 RPS (Giai đoạn 17 · 19 đề cập quy mô gateway).

Đầu ra: một kế hoạch một trang nêu nền tảng phát triển, gateway, lớp quy mô (nếu có), tập thuộc tính OTel, quy tắc lấy mẫu, năm cảnh báo. Kết thúc bằng chỉ số duy nhất báo hiệu độ trôi ngăn xếp: tỷ lệ phần trăm lệnh gọi LLM có đầy đủ thuộc tính OTel GenAI trong 7 ngày qua.
