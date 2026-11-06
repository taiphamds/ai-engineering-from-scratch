# LLM Observability Stack Selection

> Thị trường khả năng quan sát năm 2026 chia thành hai nhóm. Các nền tảng phát triển (LangSmith, Langfuse, Comet Opik) gộp giám sát với đánh giá, quản lý prompt, phát lại phiên. Các công cụ gateway/đo đạc (Helicone, SigNoz, OpenLLMetry, Phoenix) tập trung vào dữ liệu đo từ xa. Langfuse có lõi được cấp phép MIT với sự cân bằng OSS mạnh (50K sự kiện/tháng trên đám mây miễn phí). Phoenix nguyên bản OpenTelemetry theo Elastic License 2.0 — xuất sắc cho trực quan hóa độ trôi/RAG, không phải backend sản xuất bền vững. Arize AX dùng tích hợp Iceberg/Parquet không sao chép, khẳng định rẻ hơn 100x so với khả năng quan sát nguyên khối. LangSmith dẫn đầu cho LangChain/LangGraph, $39/người dùng/tháng, chỉ tự lưu trữ ở Enterprise. Helicone dựa trên proxy với thiết lập 15-30 phút, 100K yêu cầu/tháng miễn phí, nhưng ít chiều sâu hơn về dấu vết agent. Mẫu sản xuất phổ biến: Gateway (Helicone/Portkey) + nền tảng đánh giá (Phoenix/TruLens) được kết nối bằng OpenTelemetry.

**Type:** Learn
**Languages:** Python (stdlib, toy trace-sampling simulator)
**Prerequisites:** Phase 17 · 08 (Inference Metrics), Phase 14 (Agent Engineering)
**Time:** ~60 minutes

## Learning Objectives

- Phân biệt nền tảng phát triển (gộp: đánh giá + prompt + phiên) với công cụ gateway/đo từ xa (chỉ dấu vết + chỉ số).
- Ánh xạ sáu công cụ chính (Langfuse, LangSmith, Phoenix, Arize AX, Helicone, Opik) đến giấy phép, giá và trường hợp sử dụng phù hợp nhất của chúng.
- Giải thích mẫu kết nối OpenTelemetry cho phép bạn kết hợp một công cụ gateway với một nền tảng đánh giá riêng.
- Nêu yếu tố khác biệt chi phí năm 2026 (cách tiếp cận không sao chép của Arize AX so với thu nạp nguyên khối) và nêu hệ số xấp xỉ 100x.

## The Problem

Bạn đã triển khai một tính năng LLM. Nó hoạt động. Bạn không nhìn thấy lỗi prompt, vòng lặp công cụ, suy giảm độ trễ, đột biến chi phí hay tỷ lệ trúng bộ nhớ đệm prompt. Bạn Google "khả năng quan sát LLM" và nhận được tám công cụ đều khẳng định giải quyết cùng một vấn đề ở ba mức giá khác nhau.

Chúng không giải quyết cùng một vấn đề. LangSmith trả lời "tại sao lần chạy LangGraph này thất bại?" Phoenix trả lời "pipeline RAG của tôi có đang trôi không?" Helicone trả lời "ứng dụng nào đang đốt token?" Langfuse trả lời "tôi có thể tự lưu trữ toàn bộ không?" Công cụ khác nhau, đối tượng khác nhau.

Việc lựa chọn liên quan bốn trục: ngăn xếp (LangChain? SDK thuần? nhiều nhà cung cấp?), mức chấp nhận giấy phép (chỉ MIT? Elastic được? thương mại ổn?), ngân sách (gói miễn phí? $100/tháng? $1000/tháng?), và tự lưu trữ (bắt buộc? có thì tốt? không bao giờ?).

## The Concept

### Two categories

**Nền tảng phát triển** gộp khả năng quan sát với đánh giá, quản lý prompt, quản lý phiên bản tập dữ liệu, phát lại phiên. Bạn chạy thí nghiệm, xem prompt nào hoạt động, kiểm tra hồi quy trên tập dữ liệu cho một prompt mới so với những prompt thắng trước đó. LangSmith, Langfuse, Comet Opik.

**Công cụ gateway/đo từ xa** đo đạc các lệnh gọi suy luận — prompt, phản hồi, token, độ trễ, mô hình, chi phí. Helicone, SigNoz, OpenLLMetry, Phoenix. Tối giản. Có thể kết hợp với một công cụ đánh giá riêng qua OpenTelemetry.

### Langfuse — OSS balance

- Lõi được cấp phép Apache / MIT; tự lưu trữ qua Docker.
- Gói đám mây miễn phí: 50K sự kiện/tháng. Trả phí: $29/tháng cho nhóm.
- Đánh giá, quản lý prompt, dấu vết, tập dữ liệu. Bao phủ hợp lý cả bốn tính năng nền tảng phát triển.
- Trường hợp phù hợp nhất: bạn muốn tính năng tầm LangSmith nhưng phải tự lưu trữ hoặc duy trì giấy phép OSS.

### Phoenix (Arize) — telemetry-first, OpenTelemetry-native

- Elastic License 2.0; tự lưu trữ rất đơn giản.
- Xuất sắc ở trực quan hóa RAG và độ trôi. Biểu đồ phân tán không gian embedding được cung cấp như tính năng hạng nhất.
- Không được thiết kế làm backend sản xuất bền vững — chủ yếu là khả năng quan sát trong thời gian phát triển.
- Trường hợp phù hợp nhất: phát triển pipeline RAG, gỡ lỗi độ trôi, kết hợp với một gateway riêng cho sản xuất.

### Arize AX — the scale play

- Thương mại. Tích hợp hồ dữ liệu không sao chép qua Iceberg/Parquet.
- Khẳng định rẻ hơn ~100x so với khả năng quan sát nguyên khối (tầm Datadog) ở quy mô lớn. Phép tính: bạn lưu dấu vết trong Parquet riêng trên S3; Arize đọc trực tiếp.
- Trường hợp phù hợp nhất: >10M dấu vết/ngày, hồ dữ liệu sẵn có, muốn bảng điều khiển riêng cho LLM mà không chịu giá Datadog.

### LangSmith — LangChain/LangGraph first

- Thương mại, $39/người dùng/tháng. Chỉ tự lưu trữ ở Enterprise.
- Tốt nhất trong nhóm cho ngăn xếp LangChain và LangGraph. Nếu bạn không dùng một trong hai, nó kém hấp dẫn hơn.
- Trường hợp phù hợp nhất: nhóm cam kết với LangChain, sẵn sàng trả tiền.

### Helicone — proxy-based minimum viable

- Thiết lập 15-30 phút bằng cách đổi `OPENAI_API_BASE` của bạn sang proxy Helicone.
- Được cấp phép MIT; 100K yêu cầu/tháng miễn phí, trả phí $20/tháng+.
- Bao gồm chuyển đổi dự phòng, lưu bộ nhớ đệm, giới hạn tốc độ — cũng hoạt động như một gateway.
- Ít chiều sâu hơn về dấu vết agent / nhiều bước.
- Trường hợp phù hợp nhất: bắt đầu nhanh, ứng dụng một ngăn xếp, cần gateway + khả năng quan sát trong một.

### Opik (Comet) — OSS dev platform

- Apache 2.0, hoàn toàn OSS.
- Tập tính năng tương tự Langfuse với di sản Comet.
- Trường hợp phù hợp nhất: nhóm ML đã dùng Comet, muốn khả năng quan sát LLM trong cùng một khung nhìn.

### SigNoz — OpenTelemetry-first full APM

- Apache 2.0. Xử lý APM tổng quát cộng LLM qua OpenTelemetry.
- Trường hợp phù hợp nhất: khả năng quan sát hợp nhất trên các dịch vụ và lệnh gọi LLM.

### The glue: OpenTelemetry + GenAI semantic conventions

OpenTelemetry công bố quy ước ngữ nghĩa GenAI vào cuối năm 2025 (`gen_ai.system`, `gen_ai.request.model`, `gen_ai.usage.input_tokens`). Các công cụ tiêu thụ OTel có thể tương tác với nhau. Mẫu sản xuất đang hình thành:

1. Phát OTel với các quy ước GenAI từ mọi lệnh gọi LLM.
2. Định tuyến đến gateway (Helicone / Portkey) cho công việc hằng ngày.
3. Gửi đồng thời đến nền tảng đánh giá (Phoenix / Langfuse) để kiểm tra hồi quy.
4. Lưu trữ trong hồ dữ liệu (Iceberg) để phân tích dài hạn qua Arize AX hoặc DuckDB.

### The trap: instrumenting at the wrong layer

Đo đạc bên trong framework agent của bạn (ví dụ: thêm dấu vết LangSmith) gắn bạn với framework đó. Đo đạc ở lớp HTTP/SDK OpenAI (qua OpenLLMetry hoặc gateway của bạn) có tính di động.

### Sampling — you can't keep everything

Ở >1M yêu cầu/ngày, lưu giữ toàn bộ dấu vết tốn hơn các lệnh gọi LLM. Lấy mẫu theo quy tắc: 100% lỗi, 100% chi phí cao, 5% thành công. Luôn giữ số liệu tổng hợp; giữ dữ liệu thô cho phần đuôi dài.

### Numbers you should remember

- Đám mây miễn phí Langfuse: 50K sự kiện/tháng.
- LangSmith: $39/người dùng/tháng.
- Helicone miễn phí: 100K yêu cầu/tháng.
- Khẳng định của Arize AX: rẻ hơn ~100x so với nguyên khối ở quy mô lớn.
- Quy ước OpenTelemetry GenAI: phát hành năm 2025, được áp dụng rộng rãi năm 2026.

```figure
i4-otel-glue
```

## Use It

`code/main.py` mô phỏng một ngày có 1M dấu vết trên các chiến lược lưu giữ (thu nạp 100%, lấy mẫu, lấy mẫu + lỗi). Báo cáo chi phí lưu trữ và những gì bị mất dưới từng chiến lược.

## Ship It

Bài học này tạo ra `outputs/skill-observability-stack.md`. Với ngăn xếp, quy mô, ngân sách, định hướng giấy phép, chọn công cụ.

## Exercises

1. Nhóm của bạn dùng LangChain muốn khả năng quan sát OSS tự lưu trữ. Chọn Langfuse hoặc Opik và giải thích.
2. Ở 5M dấu vết/ngày với báo giá Datadog $150K/tháng, tính điểm hòa vốn cho Arize AX.
3. Thiết kế một tập thuộc tính OpenTelemetry GenAI mà hướng dẫn của tổ chức bạn nên bắt buộc trên mọi lệnh gọi LLM.
4. Lập luận liệu riêng Phoenix có đủ cho sản xuất không. Khi nào nó không đủ?
5. Helicone có chi phí độ trễ proxy 20ms. Với P99 TTFT 300 ms, điều đó có chấp nhận được không? Nếu SLA là 100 ms thì sao?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| OpenLLMetry | "OTel cho LLM" | Đo đạc OpenTelemetry mã nguồn mở cho LLM |
| GenAI conventions (Quy ước GenAI) | "thuộc tính OTel" | Tên thuộc tính OTel tiêu chuẩn cho lệnh gọi LLM |
| LangSmith | "khả năng quan sát LangChain" | Nền tảng thương mại được gộp với hệ sinh thái LangChain |
| Langfuse | "LangSmith OSS" | OSS MIT với tập tính năng tương tự |
| Phoenix | "công cụ phát triển Arize" | Nền tảng phát triển/đánh giá nguyên bản OpenTelemetry |
| Arize AX | "khả năng quan sát quy mô lớn" | Khả năng quan sát Iceberg/Parquet không sao chép thương mại |
| Helicone | "khả năng quan sát proxy" | Proxy HTTP thu thập dữ liệu đo từ xa LLM + tính năng gateway |
| Opik | "LLM Comet" | Nền tảng phát triển OSS Apache 2.0 từ Comet |
| Session replay (Phát lại phiên) | "chạy lại dấu vết" | Phát lại toàn bộ một phiên agent với các lệnh gọi công cụ |
| Eval (Đánh giá) | "kiểm thử ngoại tuyến" | Chạy mô hình/prompt ứng viên trên tập dữ liệu có nhãn |

## Further Reading

- [SigNoz — Top LLM Observability Tools 2026](https://signoz.io/comparisons/llm-observability-tools/)
- [Langfuse — Arize AX Alternative analysis](https://langfuse.com/faq/all/best-phoenix-arize-alternatives)
- [PremAI — Setting Up Langfuse, LangSmith, Helicone, Phoenix](https://blog.premai.io/llm-observability-setting-up-langfuse-langsmith-helicone-phoenix/)
- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [Arize Phoenix docs](https://docs.arize.com/phoenix)
- [Helicone docs](https://docs.helicone.ai/)
