# OpenTelemetry GenAI — Tracing Tool Calls End-to-End

> Agent gọi năm công cụ, ba máy chủ MCP và hai agent phụ. Bạn cần một trace qua tất cả. Quy ước ngữ nghĩa OpenTelemetry GenAI (thuộc tính ổn định trong v1.37 trở lên) là tiêu chuẩn năm 2026, được Datadog, Langfuse, Arize Phoenix, OpenLLMetry và AgentOps hỗ trợ nguyên bản. Bài này nêu thuộc tính bắt buộc, đi qua phân cấp span (agent → LLM → công cụ) và cung cấp bộ phát span stdlib bạn có thể cắm vào mọi exporter OTel.

**Type:** Build
**Languages:** Python (stdlib, OTel span emitter)
**Prerequisites:** Phase 13 · 07 (MCP server), Phase 13 · 08 (MCP client)
**Time:** ~75 minutes

## Learning Objectives

- Nêu thuộc tính OTel GenAI bắt buộc cho span LLM và span thực thi công cụ.
- Xây phân cấp trace bao phủ vòng lặp agent, lời gọi LLM, lời gọi công cụ và phân phối client MCP.
- Quyết định nội dung nào thu (chọn bật) so với che (mặc định).
- Phát span đến bộ thu cục bộ (Jaeger, Langfuse) không viết lại mã công cụ.

## The Problem

Một lần gỡ lỗi tháng 2 năm 2026: người dùng báo "agent đôi khi mất 30 giây phản hồi; lúc khác 3 giây." Không trace. Nhật ký cho thấy lời gọi LLM, nhưng không phân phối công cụ, không lượt khứ hồi máy chủ MCP, không agent phụ. Bạn đoán. Cuối cùng tìm ra: một máy chủ MCP đôi khi treo khi khởi động nguội.

Không có tracing đầu cuối, bạn không tìm được điều này. OTel GenAI sửa nó.

Quy ước ổn định trong 2025-2026 dưới nhóm semantic-conventions OpenTelemetry. Chúng định nghĩa tên thuộc tính ổn định để Datadog, Langfuse, Phoenix, OpenLLMetry và AgentOps đều phân tích cùng span. Gắn đo một lần; gửi đến mọi backend.

## The Concept

### Span hierarchy

```
agent.invoke_agent  (top, INTERNAL span)
 ├── llm.chat       (CLIENT span)
 ├── tool.execute   (INTERNAL)
 │    └── mcp.call  (CLIENT span)
 ├── llm.chat       (CLIENT span)
 └── subagent.invoke (INTERNAL)
```

Toàn bộ lồng dưới một id trace. Id span liên kết quan hệ cha-con.

### Required attributes

Theo semconv 2025-2026:

- `gen_ai.operation.name` — `"chat"`, `"text_completion"`, `"embeddings"`, `"execute_tool"`, `"invoke_agent"`.
- `gen_ai.provider.name` — `"openai"`, `"anthropic"`, `"google"`, `"azure_openai"`.
- `gen_ai.request.model` — chuỗi mô hình yêu cầu (ví dụ `"gpt-4o-2024-08-06"`).
- `gen_ai.response.model` — mô hình thực sự phục vụ.
- `gen_ai.usage.input_tokens` / `gen_ai.usage.output_tokens`.
- `gen_ai.response.id` — id phản hồi nhà cung cấp để liên hệ.

Với span công cụ:

- `gen_ai.tool.name` — định danh công cụ.
- `gen_ai.tool.call.id` — id lời gọi cụ thể.
- `gen_ai.tool.description` — mô tả công cụ (tùy chọn).

Với span agent:

- `gen_ai.agent.name` / `gen_ai.agent.id` / `gen_ai.agent.description`.

### Span kinds

- `SpanKind.CLIENT` cho lời gọi qua ranh giới tiến trình (nhà cung cấp LLM, máy chủ MCP).
- `SpanKind.INTERNAL` cho bước vòng lặp riêng agent và thực thi công cụ.

### Opt-in content capture

Mặc định, span mang chỉ số và thời gian — không prompt hoặc phần hoàn thành. Payload lớn và PII tắt mặc định. Đặt `OTEL_SEMCONV_STABILITY_OPT_IN=gen_ai_latest_experimental` và biến môi trường thu nội dung cụ thể để gồm nội dung. Xem xét kỹ trước bật trong sản xuất.

### Events on spans

Sự kiện cấp token có thể thêm làm sự kiện span:

- `gen_ai.content.prompt` — thông điệp đầu vào.
- `gen_ai.content.completion` — thông điệp đầu ra.
- `gen_ai.content.tool_call` — lời gọi công cụ như đã ghi.

Sự kiện theo thứ tự thời gian trong span để phát lại chi tiết.

### Exporters

Span OTel xuất đến:

- **Jaeger / Tempo.** OSS, tại chỗ.
- **Langfuse.** Riêng quan sát LLM; trực quan hóa sử dụng token.
- **Arize Phoenix.** Đánh giá + tracing kết hợp.
- **Datadog.** Thương mại; phân tích nguyên bản thuộc tính `gen_ai.*`.
- **Honeycomb.** Hướng cột; thuận truy vấn.

Tất cả dùng OTLP, định dạng đường truyền. Mã của bạn không quan tâm.

### Propagation across MCP

Khi client MCP gọi máy chủ, chèn header traceparent W3C vào yêu cầu. Streamable HTTP hỗ trợ header chuẩn. Stdio không mang header HTTP nguyên bản; lộ trình năm 2026 của đặc tả thảo luận thêm trường `_meta.traceparent` trên lời gọi JSON-RPC.

Đến khi phát hành: tự đưa traceparent vào `_meta` của mọi yêu cầu. Máy chủ ghi id trace.

### Metrics

Bên cạnh span, semconv GenAI định nghĩa chỉ số:

- `gen_ai.client.token.usage` — histogram.
- `gen_ai.client.operation.duration` — histogram.
- `gen_ai.tool.execution.duration` — histogram.

Dùng cho dashboard không cần chi tiết mỗi lời gọi.

### AgentOps layer

AgentOps (thành lập 2024) chuyên quan sát GenAI. Nó bọc framework phổ biến (LangGraph, Pydantic AI, CrewAI) để tự động phát span OTel. Hữu ích nếu ngăn xếp dùng framework hỗ trợ; nếu không dùng gắn đo thủ công.

```figure
t3-span-waterfall
```

## Use It

`code/main.py` phát span hình dạng OTel đến stdout (định dạng giống OTLP-JSON) cho agent gọi LLM, phân phối hai công cụ và thực hiện một lượt khứ hồi MCP. Không exporter thật — bài tập trung hình dạng span và tập thuộc tính. Dán đầu ra vào trình xem tương thích OTLP hoặc chỉ đọc.

Những gì cần xem:

- Id trace dùng chung mọi span.
- Liên kết cha-con mã hóa qua `parentSpanId`.
- Thuộc tính `gen_ai.*` bắt buộc được điền.
- Thu nội dung tắt mặc định; một kịch bản bật qua biến môi trường.

## Ship It

Bài này tạo `outputs/skill-otel-genai-instrumentation.md`. Với cơ sở mã agent, skill tạo kế hoạch gắn đo: nơi thêm span, thuộc tính nào điền và exporter nào nhắm.

## Exercises

1. Chạy `code/main.py`. Đếm span và xác định cái nào CLIENT so với INTERNAL.

2. Bật thu nội dung (biến môi trường) và xác nhận sự kiện `gen_ai.content.prompt` và `gen_ai.content.completion` xuất hiện. Ghi hệ quả cho PII.

3. Thêm chỉ số thực thi công cụ `gen_ai.tool.execution.duration` và phát như mẫu histogram mỗi lời gọi.

4. Lan truyền traceparent từ span agent cha vào trường `_meta.traceparent` yêu cầu MCP. Xác minh máy chủ MCP sẽ thấy cùng id trace.

5. Đọc đặc tả semconv OTel GenAI. Xác định một thuộc tính liệt kê trong semconv mà mã bài KHÔNG phát. Thêm nó.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| OTel | "OpenTelemetry" | Tiêu chuẩn mở cho trace, chỉ số, nhật ký |
| GenAI semconv (Quy ước ngữ nghĩa GenAI) | "Quy ước ngữ nghĩa GenAI" | Tên thuộc tính ổn định cho span LLM / công cụ / agent |
| `gen_ai.*` | "Không gian tên thuộc tính" | Mọi thuộc tính GenAI dùng chung tiền tố này |
| Span | "Thao tác có thời gian" | Đơn vị công việc với bắt đầu, kết thúc và thuộc tính |
| Trace (Dấu vết) | "Quan hệ tổ tiên chéo span" | Cây span dùng chung id trace |
| SpanKind | "CLIENT / SERVER / INTERNAL" | Gợi ý về hướng span |
| OTLP | "Giao thức dòng OpenTelemetry" | Định dạng đường truyền cho exporter |
| Opt-in content (Nội dung chọn bật) | "Thu prompt / phần hoàn thành" | Tắt mặc định; biến môi trường để bật |
| traceparent | "Header W3C" | Lan truyền ngữ cảnh trace qua dịch vụ |
| Exporter (Bộ xuất) | "Bộ gửi riêng backend" | Thành phần gửi span đến Jaeger / Datadog / v.v. |

## Further Reading

- [OpenTelemetry — GenAI semconv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — quy ước kinh điển cho span, chỉ số và sự kiện GenAI
- [OpenTelemetry — GenAI spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/) — danh sách thuộc tính span LLM và thực thi công cụ
- [OpenTelemetry — GenAI agent spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-agent-spans/) — span `invoke_agent` cấp agent
- [open-telemetry/semantic-conventions — GenAI spans](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/gen-ai/gen-ai-spans.md) — nguồn chuẩn được host trên GitHub
- [Datadog — LLM OTel semantic convention](https://www.datadoghq.com/blog/llm-otel-semantic-convention/) — hướng dẫn tích hợp sản xuất
