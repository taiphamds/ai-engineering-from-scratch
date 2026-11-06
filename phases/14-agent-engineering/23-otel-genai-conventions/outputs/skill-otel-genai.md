---
name: otel-genai
description: Instrument an agent with OpenTelemetry GenAI semantic conventions — invoke_agent, chat, tool_call spans with correct attributes and opt-in content capture.
version: 1.0.0
phase: 14
lesson: 23
tags: [opentelemetry, genai, observability, tracing, semantic-conventions]
---

Với một runtime agent, nối các quy ước ngữ nghĩa OTel GenAI.

Tạo:

1. Span `invoke_agent` cho mỗi lần chạy agent. Loại CLIENT cho các dịch vụ agent từ xa, INTERNAL cho trong tiến trình. Tên: `invoke_agent {gen_ai.agent.name}`.
2. Span `chat` cho mỗi lời gọi LLM với `gen_ai.operation.name=chat`, `gen_ai.provider.name`, `gen_ai.request.model`, `gen_ai.response.model`.
3. Span `tool_call` cho mỗi lần gọi công cụ với `gen_ai.tool.name` và, khi áp dụng, `gen_ai.data_source.id` (kho ngữ liệu RAG / kho bộ nhớ).
4. Ghi nội dung chọn tham gia: mặc định TẮT; khi BẬT, lưu đầu vào/đầu ra bên ngoài và ghi `*.reference_id` trên các span.
5. Lan truyền ngữ cảnh: sử dụng các header ngữ cảnh trace W3C để các lần chạy nhiều tiến trình (tiến trình con CLI Claude Agent SDK) ghép thành một trace.

Các trường hợp từ chối cứng:

- Ghi toàn bộ prompt/đầu ra nội tuyến theo mặc định. Rủi ro rò rỉ PII và bí mật; cũng vi phạm đặc tả.
- Thiếu `gen_ai.provider.name`. Các dashboard nhiều nhà cung cấp bị hỏng.
- Các span công cụ mồ côi. Luôn đặt quan hệ cha-con qua ngữ cảnh đang hoạt động.

Các quy tắc từ chối:

- Nếu runtime không thể lan truyền ngữ cảnh xuyên các ranh giới tiến trình, từ chối. Ghép trace nhiều tiến trình là bắt buộc cho người dùng Claude Agent SDK + CLI.
- Nếu sản phẩm có các ràng buộc pháp quy (HIPAA, GDPR), từ chối ghi nội dung nội tuyến. Chỉ kho bên ngoài với kiểm soát truy cập.
- Nếu backend không đặt `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental`, cảnh báo: các tên thuộc tính có thể thay đổi khi nâng cấp collector.

Đầu ra: `tracer.py`, `attributes.py`, `content_store.py`, `README.md` giải thích cấu trúc span, chọn tham gia tính ổn định và chính sách ghi nội dung. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 24 (các backend: Langfuse, Phoenix, Opik) hoặc Bài 17 cho lan truyền ngữ cảnh trace Claude Agent SDK.
