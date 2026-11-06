# OpenTelemetry GenAI Semantic Conventions

> GenAI SIG của OpenTelemetry (ra mắt tháng 4 năm 2024) định nghĩa schema tiêu chuẩn cho telemetry agent. Tên span, thuộc tính và các quy tắc ghi nội dung hội tụ xuyên các nhà cung cấp để các trace agent có cùng ý nghĩa trong Datadog, Grafana, Jaeger và Honeycomb.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 24 (Observability Platforms)
**Time:** ~60 minutes

## Learning Objectives

- Nêu tên các loại span GenAI: mô hình/client, agent, công cụ.
- Phân biệt các span `invoke_agent` CLIENT với INTERNAL và khi nào mỗi loại áp dụng.
- Liệt kê các thuộc tính GenAI cấp cao: tên nhà cung cấp, mô hình yêu cầu, ID nguồn dữ liệu.
- Giải thích hợp đồng ghi nội dung: chọn tham gia, `OTEL_SEMCONV_STABILITY_OPT_IN`, khuyến nghị tham chiếu bên ngoài.

## The Problem

Mỗi nhà cung cấp tự tạo các tên span riêng. Các nhóm vận hành rốt cuộc xây các dashboard cho từng framework. GenAI SIG của OpenTelemetry khắc phục điều này bằng cách định nghĩa một tiêu chuẩn mà toàn bộ hệ sinh thái hướng tới.

## The Concept

### Span categories

1. **Các span mô hình / client.** Bao phủ các lời gọi LLM thô. Được phát ra bởi các SDK nhà cung cấp (Anthropic, OpenAI, Bedrock) và các bộ điều hợp mô hình framework.
2. **Các span agent.** `create_agent` (khi agent được tạo) và `invoke_agent` (khi nó chạy).
3. **Các span công cụ.** Một cho mỗi lần gọi công cụ; được nối với span agent bằng quan hệ cha-con.

### Agent span naming

- Tên span: `invoke_agent {gen_ai.agent.name}` nếu có tên; quay về `invoke_agent`.
- Loại span:
  - **CLIENT** — cho các dịch vụ agent từ xa (OpenAI Assistants API, Bedrock Agents).
  - **INTERNAL** — cho các framework agent trong tiến trình (LangChain, CrewAI, ReAct cục bộ).

### Key attributes

- `gen_ai.provider.name` — `anthropic`, `openai`, `aws.bedrock`, `google.vertex`.
- `gen_ai.request.model` — ID mô hình.
- `gen_ai.response.model` — mô hình được phân giải (có thể khác yêu cầu do định tuyến).
- `gen_ai.agent.name` — định danh agent.
- `gen_ai.operation.name` — `chat`, `completion`, `invoke_agent`, `tool_call`.
- `gen_ai.data_source.id` — cho RAG: kho ngữ liệu hoặc kho nào đã được tham khảo.

Các quy ước dành riêng cho công nghệ tồn tại cho Anthropic, Azure AI Inference, AWS Bedrock, OpenAI.

### Content capture

Quy tắc mặc định: các phần đo lường KHÔNG NÊN ghi đầu vào/đầu ra theo mặc định. Việc ghi là chọn tham gia qua:

- `gen_ai.system_instructions`
- `gen_ai.input.messages`
- `gen_ai.output.messages`

Mẫu sản xuất được khuyến nghị: lưu nội dung bên ngoài (S3, kho log của bạn), ghi các tham chiếu trên span (các ID con trỏ, không phải văn xuôi). Đây là biện pháp phòng vệ đầu độc nội dung của Bài 27 được nối vào khả năng quan sát.

### Stability

Hầu hết các quy ước là thử nghiệm tính đến tháng 3 năm 2026. Chọn tham gia bản xem trước ổn định với:

```
OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental
```

Datadog v1.37+ ánh xạ các thuộc tính GenAI trực tiếp vào schema LLM Observability của nó. Các backend khác (Grafana, Honeycomb, Jaeger) hỗ trợ các thuộc tính thô.

### Where this pattern goes wrong

- **Ghi toàn bộ prompt trong các span.** PII, bí mật, dữ liệu khách hàng trong các trace mà bộ phận vận hành có thể đọc. Lưu bên ngoài.
- **Không có `gen_ai.provider.name`.** Các dashboard nhiều nhà cung cấp bị hỏng khi thiếu quy thuộc.
- **Các span không có liên kết cha.** Các span công cụ mồ côi. Luôn lan truyền ngữ cảnh.
- **Không đặt chọn tham gia tính ổn định.** Các thuộc tính của bạn có thể bị đổi tên khi nâng cấp backend.

```figure
ae-genai-span-tree
```

## Build It

`code/main.py` triển khai một bộ phát span dùng thư viện chuẩn khớp các quy ước GenAI:

- `Span` với schema thuộc tính GenAI.
- `Tracer` với `start_span`, các ngữ cảnh lồng nhau.
- Một lần chạy agent được viết kịch bản phát ra: `create_agent`, `invoke_agent` (INTERNAL), các span cho từng công cụ, các span `chat` cho các lời gọi LLM.
- Một chế độ ghi nội dung lưu các prompt bên ngoài và ghi các ID trên các span.

Chạy nó:

```
python3 code/main.py
```

Đầu ra: một cây span với mọi thuộc tính GenAI bắt buộc, và một "kho bên ngoài" cho thấy các tham chiếu nội dung chọn tham gia.

## Use It

- **Datadog LLM Observability** (v1.37+) ánh xạ các thuộc tính trực tiếp.
- **Langfuse / Phoenix / Opik** (Bài 24) — tự động đo lường hệ sinh thái.
- **Jaeger / Honeycomb / Grafana Tempo** — các trace OTel thô; xây các dashboard từ các thuộc tính GenAI.
- **Tự host** — chạy OTel Collector với một bộ xử lý GenAI.

## Ship It

`outputs/skill-otel-genai.md` nối các span OTel GenAI vào một agent hiện có với các mặc định ghi nội dung và lưu trữ tham chiếu bên ngoài.

## Exercises

1. Thêm đo lường vào vòng lặp ReAct Bài 01 của bạn với `invoke_agent` (INTERNAL) + các span cho từng công cụ. Gửi đến một thể hiện Jaeger.
2. Thêm ghi nội dung trong chế độ "chỉ tham chiếu": các prompt đến SQLite, các thuộc tính span chỉ mang ID hàng.
3. Đọc đặc tả cho `gen_ai.data_source.id`. Nối nó vào tìm kiếm Mem0 Bài 09 của bạn.
4. Đặt `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` và xác minh các thuộc tính của bạn không bị collector đổi tên.
5. Xây một dashboard: "những lỗi công cụ nào tương quan với những mô hình nào" chỉ từ các thuộc tính GenAI.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| GenAI SIG | "Nhóm OpenTelemetry GenAI" | Nhóm công tác OTel định nghĩa schema |
| invoke_agent | "Span agent" | Tên của span biểu diễn một lần chạy agent |
| CLIENT span (Span CLIENT) | "Lời gọi từ xa" | Span cho một lời gọi đến một dịch vụ agent từ xa |
| INTERNAL span (Span INTERNAL) | "Trong tiến trình" | Span cho một lần chạy agent trong tiến trình |
| gen_ai.provider.name | "Nhà cung cấp" | anthropic / openai / aws.bedrock / google.vertex |
| gen_ai.data_source.id | "Nguồn RAG" | Kho ngữ liệu/kho nào mà một lần truy xuất trúng |
| Content capture (Ghi nội dung) | "Ghi log prompt" | Ghi các thông điệp theo chọn tham gia; lưu bên ngoài trong sản xuất |
| Stability opt-in (Chọn tham gia tính ổn định) | "Chế độ xem trước" | Biến môi trường để ghim các quy ước thử nghiệm |

## Further Reading

- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — đặc tả
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — các span GenAI theo mặc định
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — các span OTel tích hợp sẵn
- [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/overview) — lan truyền ngữ cảnh trace W3C
