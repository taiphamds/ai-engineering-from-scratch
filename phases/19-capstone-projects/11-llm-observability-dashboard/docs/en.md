# Capstone 11 — LLM Observability & Eval Dashboard

> Langfuse đã chuyển sang lõi mở. Arize Phoenix đã công bố các ánh xạ semconv GenAI năm 2026. Helicone và Braintrust đều tăng cường tập trung vào việc phân bổ chi phí theo người dùng. OpenLLMetry của Traceloop đã trở thành bộ đo lường SDK trên thực tế. Hình thức sản xuất là ClickHouse cho trace, Postgres cho siêu dữ liệu, Next.js cho UI, và một đội nhỏ các tác vụ đánh giá (DeepEval, RAGAS, LLM-judge) chạy trên các trace được lấy mẫu. Xây dựng một hệ thống tự lưu trữ, tiếp nhận từ ít nhất bốn họ SDK, và chứng minh việc phát hiện một lỗi thoái lui được chèn vào trong dưới năm phút.

**Type:** Capstone
**Languages:** TypeScript (UI), Python / TypeScript (ingest + evals), SQL (ClickHouse)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P11 · P13 · P17 · P18
**Time:** 25 hours

## Problem

Mọi nhóm AI vận hành lưu lượng sản xuất năm 2026 đều giữ một lớp quan sát bên cạnh mô hình. Phân bổ chi phí. Phát hiện ảo giác. Giám sát độ trôi. Tín hiệu jailbreak. Bảng điều khiển SLO. Cảnh báo rò rỉ PII. Các tham chiếu mã nguồn mở — Langfuse, Phoenix, OpenLLMetry — đã hội tụ vào các quy ước ngữ nghĩa GenAI của OpenTelemetry làm lược đồ tiếp nhận. Giờ bạn có thể gắn bộ đo lường cho OpenAI, Anthropic, Google, LangChain, LlamaIndex, và vLLM bằng một SDK và gửi các span tương thích.

Bạn sẽ xây dựng một bảng điều khiển tự lưu trữ tiếp nhận từ ít nhất bốn họ SDK, chạy một tập nhỏ các tác vụ đánh giá trên các trace được lấy mẫu, phát hiện độ trôi, và cảnh báo. Chuẩn đo lường: với một lỗi thoái lui được cố ý chèn vào (một prompt bắt đầu tạo ra PII), bảng điều khiển phát hiện nó và phát cảnh báo trong dưới năm phút.

## Concept

Tiếp nhận là OTLP HTTP. SDK tạo ra các span GenAI-semconv: `gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`, `gen_ai.response.id`, `llm.prompts`, `llm.completions`. Các span đi vào ClickHouse để phân tích theo cột; siêu dữ liệu (người dùng, phiên, ứng dụng) đi vào Postgres.

Các đánh giá chạy dưới dạng tác vụ theo lô trên các trace được lấy mẫu. DeepEval chấm điểm tính trung thực, tính độc hại, và mức liên quan của câu trả lời. RAGAS chấm điểm các chỉ số truy xuất khi trace mang ngữ cảnh truy xuất. Các LLM-judge tùy chỉnh chạy các bước kiểm tra đặc thù miền (rò rỉ PII, phản hồi ngoài chính sách). Các lần chạy đánh giá ghi lại vào cùng ClickHouse dưới dạng span đánh giá liên kết với trace cha.

Phát hiện độ trôi theo dõi các phân phối trong không gian embedding theo thời gian (PSI hoặc độ phân kỳ KL trên các embedding prompt) cùng các xu hướng điểm đánh giá. Các cảnh báo đi vào Prometheus Alertmanager rồi Slack / PagerDuty. UI là Next.js 15 với Recharts.

## Architecture

```
production apps:
  OpenAI SDK  +  Anthropic SDK  +  Google GenAI SDK
  LangChain + LlamaIndex + vLLM
       |
       v
  OpenTelemetry SDK with GenAI semconv
       |
       v  OTLP HTTP
  collector (ingest, sample, fan-out)
       |
       +-------------+-----------+
       v             v           v
   ClickHouse    Postgres    S3 archive
   (spans)       (metadata)  (raw events)
       |
       +---> eval jobs (DeepEval, RAGAS, LLM-judge)
       |     sampled or all-trace
       |     write eval spans back
       |
       +---> drift detector (PSI / KL on prompt embeddings)
       |
       +---> Prometheus metrics -> Alertmanager -> Slack / PagerDuty
       |
       v
   Next.js 15 dashboard (Recharts)
```

## Stack

- Tiếp nhận: các SDK OpenTelemetry + quy ước ngữ nghĩa GenAI; truyền tải OTLP HTTP
- Bộ thu thập: OpenTelemetry Collector với bộ xử lý lấy mẫu đuôi (để kiểm soát chi phí)
- Lưu trữ: ClickHouse cho span, Postgres cho siêu dữ liệu, S3 cho kho lưu trữ sự kiện thô
- Đánh giá: DeepEval, RAGAS 0.2, gói bộ đánh giá Arize Phoenix, LLM-judge tùy chỉnh
- Độ trôi: PSI / KL trên các embedding prompt được gộp (sentence-transformers) hàng tuần
- Cảnh báo: Prometheus Alertmanager -> Slack / PagerDuty
- UI: Next.js 15 App Router + Recharts + server action
- Các SDK được hỗ trợ sẵn: OpenAI, Anthropic, Google GenAI, LangChain, LlamaIndex, vLLM

```figure
ce-otel-drift
```

## Build It

1. **Cấu hình bộ thu thập.** OpenTelemetry Collector với bộ nhận OTLP HTTP, một bộ lấy mẫu đuôi giữ 100% trace bị lỗi và 10% thành công, và các bộ xuất tới ClickHouse và S3.

2. **Lược đồ ClickHouse.** Bảng `spans` với các cột phản ánh semconv GenAI: `gen_ai_system`, `gen_ai_request_model`, `input_tokens`, `output_tokens`, `latency_ms`, `prompt_hash`, `trace_id`, `parent_span_id`, cùng một túi JSON cho các payload dài. Thêm các chỉ mục phụ theo user_id và app_id.

3. **Kiểm thử độ bao phủ SDK.** Viết một ứng dụng khách nhỏ sử dụng mỗi SDK (OpenAI, Anthropic, Google, LangChain, LlamaIndex, vLLM) với bộ đo lường tự động OpenLLMetry. Xác minh mỗi SDK tạo ra các span GenAI chuẩn đi vào ClickHouse.

4. **Tác vụ đánh giá.** Một tác vụ được lên lịch đọc các trace được lấy mẫu trong 15 phút gần nhất và chạy tính trung thực, tính độc hại, và mức liên quan của câu trả lời của DeepEval. Đầu ra là các span đánh giá liên kết với trace cha.

5. **LLM-judge tùy chỉnh.** Một bộ chấm rò rỉ PII: với một phản hồi được cung cấp, gọi một LLM bảo vệ để chấm điểm khả năng rò rỉ PII. Các phản hồi điểm cao đi vào một hàng đợi phân loại xử lý.

6. **Phát hiện độ trôi.** Tác vụ hàng tuần tính PSI giữa các embedding prompt được gộp của tuần này và đường cơ sở 4 tuần liền trước. Nếu PSI vượt ngưỡng, cảnh báo.

7. **Bảng điều khiển.** Next.js 15 với các trang: tổng quan (span/giây, chi phí/người dùng, độ trễ p95), trace (tìm kiếm + waterfall), đánh giá (xu hướng tính trung thực, tính độc hại), độ trôi (PSI theo thời gian), cảnh báo.

8. **Chuỗi cảnh báo.** Bộ xuất Prometheus đọc các tổng hợp điểm đánh giá và các phân vị độ trễ; Alertmanager chuyển đến Slack cho các cảnh báo và PagerDuty cho các vi phạm nghiêm trọng.

9. **Phép thăm dò thoái lui.** Chèn một lỗi: chatbot được đánh giá bắt đầu rò rỉ SSN giả trong 1% số lần. Đo MTTR: từ khi triển khai lỗi đến cảnh báo Slack.

## Use It

```
$ curl -X POST https://my-otel-collector/v1/traces -d @trace.json
[collector]  accepted 1 trace, 3 spans
[clickhouse] inserted 3 spans (app=chat, user=u_42)
[eval]       DeepEval faithfulness 0.82, toxicity 0.03
[drift]      weekly PSI 0.08 (below 0.2 threshold)
[ui]         live at https://obs.example.com
```

## Ship It

`outputs/skill-llm-observability.md` là sản phẩm bàn giao. Với một ứng dụng LLM được cung cấp, bảng điều khiển tiếp nhận các trace của nó, chạy đánh giá, cảnh báo về độ trôi, và hiển thị phân tích chi phí/người dùng trong Next.js.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Độ bao phủ lược đồ trace | Số họ SDK tạo ra span GenAI chuẩn (mục tiêu: 6+) |
| 20 | Tính đúng đắn của đánh giá | Điểm DeepEval / RAGAS so với tập gắn nhãn thủ công |
| 20 | UX bảng điều khiển | MTTR trên lỗi thoái lui được chèn vào (mục tiêu dưới 5 phút) |
| 20 | Chi phí / quy mô | Tiếp nhận duy trì ở mức 1k span/giây mà không tồn đọng |
| 15 | Cảnh báo + phát hiện độ trôi | Chuỗi Prometheus/Alertmanager được thực thi từ đầu đến cuối |
| **100** | | |

## Exercises

1. Thêm bộ đo lường tùy chỉnh cho framework Haystack. Xác minh các span chuẩn đi vào ClickHouse với các thuộc tính `gen_ai.*` trung thực.

2. Thay DeepEval bằng các bộ đánh giá Phoenix trên cùng các trace. Đo độ trôi điểm giữa hai bộ máy đánh giá.

3. Làm sắc nét bộ phát hiện độ trôi: tính PSI theo app-id thay vì toàn cục. Hiển thị các diễn biến độ trôi theo ứng dụng.

4. Thêm một trang "tác động người dùng": chi phí trên mỗi người dùng và tỷ lệ lỗi trên mỗi người dùng với các biểu đồ sparkline.

5. Xây dựng một chính sách lấy mẫu đuôi giữ 100% trace có tính độc hại > 0.5 cùng một mẫu phân tầng 10% của phần còn lại. Đo độ thiên lệch lấy mẫu được tạo ra.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| GenAI semconv | "Thuộc tính LLM OTel" | Đặc tả OpenTelemetry năm 2025 cho các thuộc tính span LLM (hệ thống, mô hình, token) |
| Tail sampling (Lấy mẫu đuôi) | "Lấy mẫu sau trace" | Bộ thu thập quyết định giữ hay bỏ một trace sau khi nó hoàn tất (có thể xem lỗi) |
| PSI | "Chỉ số ổn định quần thể" | Chỉ số độ trôi so sánh hai phân phối; > 0.2 thường báo hiệu độ trôi đáng kể |
| LLM-judge | "Đánh giá bằng mô hình" | Một LLM chấm điểm đầu ra của một LLM khác theo một thang đánh giá (tính trung thực, tính độc hại, PII) |
| Tail-sampling policy (Chính sách lấy mẫu đuôi) | "Quy tắc giữ lại" | Quy tắc quyết định trace nào được lưu bền vững hay bỏ đi; bị lỗi + tỷ lệ lấy mẫu |
| Eval span (Span đánh giá) | "Trace đánh giá được liên kết" | Span con mang một điểm đánh giá liên kết với span gọi LLM ban đầu |
| Cost per user (Chi phí trên mỗi người dùng) | "Kinh tế học đơn vị" | Chi phí đô la được phân bổ cho một user_id trong một khoảng thời gian; chỉ số sản phẩm then chốt |

## Further Reading

- [Langfuse](https://github.com/langfuse/langfuse) — nền tảng quan sát lõi mở tham chiếu
- [Arize Phoenix](https://github.com/Arize-ai/phoenix) — tham chiếu thay thế với hỗ trợ độ trôi mạnh
- [OpenLLMetry (Traceloop)](https://github.com/traceloop/openllmetry) — họ SDK đo lường tự động
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — lược đồ tiếp nhận
- [Helicone](https://www.helicone.ai) — hệ thống quan sát được lưu trữ thay thế
- [Braintrust](https://www.braintrust.dev) — nền tảng ưu tiên đánh giá thay thế
- [ClickHouse documentation](https://clickhouse.com/docs) — kho span theo cột
- [DeepEval](https://github.com/confident-ai/deepeval) — thư viện bộ đánh giá
