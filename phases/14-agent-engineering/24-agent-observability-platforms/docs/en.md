# Agent Observability: Langfuse, Phoenix, Opik

> Ba nền tảng khả năng quan sát agent mã nguồn mở thống trị năm 2026. Langfuse (MIT) — 6M+ lượt cài/tháng, truy vết + quản lý prompt + đánh giá + phát lại phiên. Arize Phoenix (Elastic 2.0) — các đánh giá sâu dành riêng cho agent, tính liên quan RAG, tự động đo lường OpenInference. Comet Opik (Apache 2.0) — tối ưu hóa prompt tự động, các chốt bảo vệ, phát hiện ảo giác bằng giám khảo LLM.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 23 (OTel GenAI)
**Time:** ~45 minutes

## Learning Objectives

- Nêu tên ba nền tảng khả năng quan sát agent mã nguồn mở hàng đầu và các giấy phép của chúng.
- Phân biệt điều mỗi nền tảng mạnh nhất: Langfuse (quản lý prompt + phiên), Phoenix (RAG + tự động đo lường), Opik (tối ưu hóa + các chốt bảo vệ).
- Giải thích vì sao 89% tổ chức báo cáo đã có khả năng quan sát agent vào năm 2026.
- Triển khai một pipeline từ trace đến dashboard dùng thư viện chuẩn với đánh giá bằng giám khảo LLM.

## The Problem

OTel GenAI (Bài 23) cho bạn schema. Bạn vẫn cần nền tảng nạp các span, chạy các đánh giá, lưu các phiên bản prompt và phơi bày các hồi quy. Ba đối thủ mỗi bên nhấn mạnh các phần khác nhau của vòng đời.

## The Concept

### Langfuse (MIT)

- 6M+ lượt cài SDK/tháng, 19k+ sao GitHub.
- Các tính năng: truy vết, quản lý prompt với đánh phiên bản + playground, các đánh giá (LLM làm giám khảo, phản hồi người dùng, tùy chỉnh), phát lại phiên.
- Tháng 6 năm 2025: các mô-đun trước đây thương mại (LLM làm giám khảo, các hàng đợi chú thích, các thí nghiệm prompt, Playground) được mở mã nguồn theo MIT.
- Mạnh nhất cho: khả năng quan sát từ đầu đến cuối với vòng lặp quản lý prompt chặt chẽ.

### Arize Phoenix (Elastic License 2.0)

- Đánh giá sâu hơn dành riêng cho agent: phân cụm trace, phát hiện bất thường, tính liên quan truy xuất cho RAG.
- Tự động đo lường OpenInference gốc.
- Kết hợp với Arize AX được quản lý cho sản xuất.
- Không đánh phiên bản prompt — được định vị như một công cụ trôi dạt/hồi quy hành vi bên cạnh các nền tảng rộng hơn.
- Mạnh nhất cho: tính liên quan RAG, trôi dạt hành vi, phát hiện bất thường.

### Comet Opik (Apache 2.0)

- Tối ưu hóa prompt tự động qua các thí nghiệm A/B.
- Các chốt bảo vệ (che PII, các ràng buộc chủ đề).
- Phát hiện ảo giác bằng giám khảo LLM.
- Benchmark từ phép đo riêng của Comet: Opik ghi log + đánh giá trong 23.44 giây so với Langfuse 327.15 giây (khoảng cách ~14 lần) — coi các benchmark nhà cung cấp là định hướng.
- Mạnh nhất cho: vòng lặp tối ưu hóa, thử nghiệm tự động, thực thi chốt bảo vệ.

### Industry data

Theo Maxim (phân tích thực địa năm 2026): 89% tổ chức đã có khả năng quan sát agent; các vấn đề chất lượng là rào cản sản xuất hàng đầu (32% người trả lời nêu chúng).

### Picking one

| Nhu cầu | Chọn |
|------|------|
| Tất cả trong một với quản lý prompt | Langfuse |
| Đánh giá RAG sâu + trôi dạt | Phoenix |
| Tối ưu hóa tự động + các chốt bảo vệ | Opik |
| Giấy phép mở, không ELv2 | Langfuse (MIT) hoặc Opik (Apache 2.0) |
| Tích hợp Datadog / New Relic | Bất kỳ — tất cả đều xuất OTel |

### Where this pattern goes wrong

- **Không có chiến lược đánh giá.** Truy vết không đánh giá chỉ là ghi log đắt tiền.
- **Giám khảo LLM tự xây không có cơ sở.** Mẫu CRITIC (Bài 05) áp dụng — các giám khảo cần các công cụ bên ngoài để xác minh sự thật.
- **Các phiên bản prompt không được gắn với trace.** Khi sản xuất hồi quy, bạn không thể tìm bằng chia đôi đến prompt đã gây ra nó.

```figure
wb-trace-ingest
```

## Build It

`code/main.py` triển khai một bộ thu thập trace + bộ đánh giá giám khảo LLM dùng thư viện chuẩn:

- Nạp các span có dạng GenAI.
- Nhóm theo phiên, gắn thẻ các lần chạy thất bại (các lần chốt bảo vệ kích hoạt, các đánh giá độ tin cậy thấp).
- Một giám khảo LLM được viết kịch bản chấm điểm các phản hồi agent theo một bảng tiêu chí.
- Một bản tóm tắt giống dashboard: tỷ lệ lỗi, các lý do lỗi hàng đầu, phân phối điểm đánh giá.

Chạy nó:

```
python3 code/main.py
```

Đầu ra: các điểm đánh giá cho từng phiên và phân loại lỗi khớp những gì Langfuse/Phoenix/Opik sẽ hiển thị.

## Use It

- **Langfuse** tự host hoặc đám mây; nối qua OTel hoặc SDK của họ.
- **Arize Phoenix** tự host; tự động đo lường OpenInference.
- **Comet Opik** tự host hoặc đám mây; vòng lặp tối ưu hóa tự động.
- **Datadog LLM Observability** cho các nhóm vận hành+ML hỗn hợp đã chạy Datadog.

## Ship It

`outputs/skill-obs-platform-wiring.md` chọn một nền tảng và nối các trace + đánh giá + phiên bản prompt vào một agent hiện có.

## Exercises

1. Xuất một tuần trace OTel đến đám mây Langfuse (gói miễn phí). Những phiên nào thất bại? Vì sao?
2. Viết một bảng tiêu chí giám khảo LLM cho miền của bạn (tính đúng đắn thực tế, giọng điệu, tuân thủ phạm vi). Kiểm thử trên 50 trace.
3. So sánh đánh phiên bản prompt Langfuse với phân cụm trace của Phoenix. Cách nào cho bạn biết điều gì hỏng nhanh hơn?
4. Đọc tài liệu chốt bảo vệ của Opik. Nối một chốt bảo vệ che PII vào một trong các lần chạy agent của bạn.
5. Benchmark cả ba trên kho ngữ liệu của bạn. Bỏ qua các con số do nhà cung cấp công bố; đo của riêng bạn.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Tracing (Truy vết) | "Bộ thu thập span" | Nạp các span OTel / SDK; lập chỉ mục theo phiên |
| Prompt management (Quản lý prompt) | "CMS prompt" | Các prompt có phiên bản được gắn với trace |
| LLM-as-judge (LLM làm giám khảo) | "Đánh giá tự động" | LLM riêng chấm điểm đầu ra agent theo một bảng tiêu chí |
| Session replay (Phát lại phiên) | "Phát lại trace" | Đi từng bước qua các lần chạy trước để gỡ lỗi |
| RAG relevancy (Tính liên quan RAG) | "Chất lượng truy xuất" | Ngữ cảnh được truy xuất có khớp truy vấn không |
| Trace clustering (Phân cụm trace) | "Nhóm hành vi" | Phân cụm các lần chạy tương tự để phát hiện trôi dạt |
| Guardrail enforcement (Thực thi chốt bảo vệ) | "Chính sách tại thời điểm ghi log" | Các kiểm tra PII/độc hại/phạm vi trên nội dung được ghi log |

## Further Reading

- [Langfuse docs](https://langfuse.com/) — truy vết, đánh giá, quản lý prompt
- [Arize Phoenix docs](https://docs.arize.com/phoenix) — tự động đo lường, trôi dạt
- [Comet Opik](https://www.comet.com/site/products/opik/) — tối ưu hóa + các chốt bảo vệ
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — schema mà cả ba tiêu thụ
