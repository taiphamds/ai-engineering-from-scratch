# Prompt Caching and Semantic Caching Economics

> **Ảnh chụp mức giá vào 2026-04.** Các khẳng định số liệu bên dưới phản ánh bảng giá nhà cung cấp được ghi nhận lúc xuất bản bài học này; xác minh với tài liệu được liên kết trước khi trích dẫn chúng về sau.

> Lưu bộ nhớ đệm diễn ra ở hai lớp. Lưu bộ nhớ đệm prompt/tiền tố L2 (cấp nhà cung cấp) tái sử dụng KV attention cho tiền tố lặp lại — tài liệu lưu bộ nhớ đệm prompt của Anthropic quảng cáo giảm chi phí tới 90% và giảm độ trễ 85% trên prompt dài; với Claude 3.5 Sonnet, đọc bộ nhớ đệm là $0.30/M so với $3.00/M đầu vào mới với TTL 5 phút và mức phụ phí ghi 2x cho tùy chọn TTL 1 giờ (docs.anthropic.com, 2026-04). Lưu bộ nhớ đệm prompt OpenAI tự động áp dụng cho prompt ≥1024 token và định giá đầu vào được lưu bộ nhớ đệm giảm khoảng 90% so với đầu vào mới (platform.openai.com, 2026-04); giá bộ nhớ đệm chính xác cho từng mô hình phụ thuộc bảng giá hiện hành. Lưu bộ nhớ đệm ngữ nghĩa L1 (cấp ứng dụng) bỏ qua hoàn toàn LLM khi trúng theo độ tương đồng embedding. "Độ chính xác 95%" của nhà cung cấp nói đến tính đúng đắn của việc khớp, không phải tỷ lệ trúng — tỷ lệ trúng trong sản xuất được báo cáo trải từ 10% (trò chuyện mở) đến 70% (FAQ có cấu trúc); không nhà cung cấp nào công bố đường cơ sở chính thức, nên xem đây là dữ liệu đo từ xa cộng đồng thay vì bảo đảm. Những cạm bẫy sản xuất: song song hóa phá hỏng lưu bộ nhớ đệm (N yêu cầu song song được gửi trước lần ghi bộ nhớ đệm đầu tiên có thể làm chi tiêu phình ra nhiều lần), và nội dung động trong tiền tố ngăn hoàn toàn việc trúng bộ nhớ đệm. ProjectDiscovery báo cáo chuyển từ tỷ lệ trúng 7% lên 74% (2025-11) bằng cách chuyển văn bản động ra khỏi tiền tố có thể lưu bộ nhớ đệm.

**Type:** Learn
**Languages:** Python (stdlib, toy two-layer cache simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 17 · 06 (SGLang RadixAttention)
**Time:** ~60 minutes

## Learning Objectives

- Phân biệt lưu bộ nhớ đệm prompt/tiền tố L2 (tái sử dụng KV tại nhà cung cấp) với lưu bộ nhớ đệm ngữ nghĩa L1 (bỏ qua LLM khi prompt tương tự).
- Giải thích việc đánh dấu tường minh `cache_control` của Anthropic và hai tùy chọn TTL (5 phút so với 1 giờ) cùng các hệ số giá của chúng.
- Tính mức tiết kiệm hằng tháng dự kiến với tỷ lệ trúng, tỷ lệ pha trộn prompt/phản hồi và giá token.
- Nêu phản mẫu song song hóa làm hóa đơn phình ra 5-10x và phản mẫu nội dung động làm sụp đổ tỷ lệ trúng.

## The Problem

Bạn thêm lưu bộ nhớ đệm prompt vào dịch vụ RAG của mình. Hóa đơn không đổi. Bạn đo tỷ lệ trúng; nó là 7%. Prompt của bạn trông tĩnh nhưng không phải — system prompt chứa ngày hiện tại được định dạng đến phút, một ID yêu cầu và việc sắp xếp lại ví dụ ngẫu nhiên để đa dạng. Mọi yêu cầu ghi một mục bộ nhớ đệm mới, đọc không mục nào.

Riêng biệt, agent của bạn chạy mười lệnh gọi công cụ song song cho mỗi câu hỏi người dùng. Cả mười đến nhà cung cấp trước khi lần ghi bộ nhớ đệm đầu tiên hoàn tất. Mười lần ghi, không lần đọc. Hóa đơn của bạn bằng 5-10x chi phí lẽ ra phải có "với lưu bộ nhớ đệm".

Lưu bộ nhớ đệm là một giao thức, không phải một cờ. Hai lớp, hai chế độ lỗi khác nhau.

## The Concept

### L2 — provider prompt/prefix caching

Nhà cung cấp lưu KV attention cho một tiền tố có thể lưu bộ nhớ đệm và tái sử dụng nó ở yêu cầu tiếp theo khớp tiền tố. Bạn trả chi phí ghi một lần, đọc gần như miễn phí.

**Anthropic (dòng Claude 3.5 / 3.7 / 4)**: dấu `cache_control` tường minh trong yêu cầu. Bạn gắn thẻ các block nào có thể lưu bộ nhớ đệm. TTL: 5 phút (ghi tốn 1.25x cơ sở) hoặc 1 giờ (ghi tốn 2x cơ sở). Đọc bộ nhớ đệm: $0.30/M trên Claude 3.5 Sonnet so với $3.00/M đầu vào mới — rẻ hơn 10x (docs.anthropic.com, tính đến 2026-04). Giá khác nhau theo mô hình (Opus/Haiku được công bố riêng); luôn đối chiếu trang giá hiện hành.

**OpenAI**: tự động lưu bộ nhớ đệm cho prompt ≥1024 token (platform.openai.com, 2026-04). Không có cờ tường minh. Đầu vào được lưu bộ nhớ đệm rẻ hơn khoảng 10x so với đầu vào mới trên bảng giá gpt-4o/gpt-5 hiện tại. Cả tài liệu lẫn ghi chú phát hành đều không công bố đường cơ sở tỷ lệ trúng chính thức; báo cáo cộng đồng tập trung quanh 30–60% với thiết kế prompt cẩn thận. Theo dõi `usage.cached_tokens` để tự đo.

**Google (Gemini)**: lưu bộ nhớ đệm ngữ cảnh qua API tường minh; ngữ cảnh 1M token nghĩa là lưu bộ nhớ đệm mang lại lợi ích còn lớn hơn.

**Tự lưu trữ (vLLM, SGLang)**: Giai đoạn 17 · 06 đề cập RadixAttention — cùng mẫu trên tài nguyên tính toán của chính bạn.

### L1 — app-level semantic caching

Trước khi gọi LLM, hash prompt, tạo embedding cho nó và tìm yêu cầu tương tự đã được lưu bộ nhớ đệm (độ tương đồng cosine trên ngưỡng, thường là 0.95+). Khi trúng, trả về phản hồi được lưu bộ nhớ đệm. Khi trượt, gọi LLM và lưu kết quả vào bộ nhớ đệm.

Mã nguồn mở: Redis Vector Similarity, GPTCache, Qdrant. Thương mại: Portkey Cache, Helicone Cache.

Các khẳng định độ chính xác của nhà cung cấp nói đến tần suất phản hồi từ bộ nhớ đệm được trả về phù hợp về ngữ nghĩa — không phải tần suất bạn trúng. Tỷ lệ trúng trong sản xuất:

- Trò chuyện mở: 10-15%.
- FAQ có cấu trúc / hỗ trợ: 40-70%.
- Câu hỏi mã: 20-30% (các biến thể nhỏ phá hỏng lượt trúng).
- Agent giọng nói lặp lại prompt: 50-80% (tập cố định chuẩn hóa giọng nói).

### The parallelization anti-pattern

Agent của bạn thực hiện 10 lệnh gọi công cụ song song. Cả 10 có cùng system prompt 4K token. Ghi bộ nhớ đệm Anthropic theo từng yêu cầu; lần ghi bộ nhớ đệm đầu tiên hoàn tất khoảng 300 ms sau khi nhà cung cấp thấy prompt. Yêu cầu 2-10 đến trong cùng cửa sổ mili giây và mỗi yêu cầu đều thấy trượt bộ nhớ đệm. Bạn trả 10 phụ phí ghi, 0 giảm giá đọc.

Giải pháp: gom lô với tuần tự trước — thực hiện riêng yêu cầu 1, rồi gửi 2-10 khi bộ nhớ đệm của 1 đã được điền. Thêm 300 ms vào lệnh gọi công cụ đầu tiên; tiết kiệm hóa đơn 5-10x.

### The dynamic content anti-pattern

System prompt của bạn trông như:

```
You are a helpful assistant. The current time is 14:32:17.
User ID: abc123. Today is Tuesday...
```

Mọi yêu cầu đều độc nhất. Mọi yêu cầu đều ghi. Không lượt trúng.

Giải pháp: chuyển mọi thứ thực sự tĩnh vào tiền tố có thể lưu bộ nhớ đệm; nối nội dung động sau ranh giới bộ nhớ đệm:

```
[cacheable]
You are a helpful assistant. [rules, examples, instructions]
[/cacheable]
[dynamic, not cached]
Current time: 14:32:17. User: abc123.
```

ProjectDiscovery chuyển từ tỷ lệ trúng bộ nhớ đệm 7% lên 74% theo cách này và công bố phân tích cấu tạo.

### Stack batch + cache for overnight workloads

API xử lý theo lô (Giai đoạn 17 · 15) giảm giá 50% với thời gian hoàn thành 24 giờ. Đầu vào được lưu bộ nhớ đệm chồng lên mang lại ~10x thêm trên đó. Khối lượng công việc phân loại qua đêm, gắn nhãn và tạo báo cáo có thể giảm xuống ~10% chi phí đồng bộ không lưu bộ nhớ đệm bằng cách kết hợp.

### Numbers you should remember

Các mức giá được ghi nhận vào 2026-04 từ tài liệu nhà cung cấp được liên kết và thay đổi mỗi vài tháng — kiểm tra lại trước khi dựa vào chúng.

- Đọc bộ nhớ đệm Anthropic: $0.30/M trên Claude 3.5 Sonnet, rẻ hơn khoảng 10x so với đầu vào mới (docs.anthropic.com).
- Phụ phí ghi bộ nhớ đệm Anthropic: 1.25x (TTL 5 phút) hoặc 2x (TTL 1 giờ).
- Tự động lưu bộ nhớ đệm OpenAI: áp dụng cho prompt ≥1024 token; đầu vào được lưu bộ nhớ đệm có giá khoảng 10% đầu vào mới trên bảng giá hiện tại (platform.openai.com).
- Tỷ lệ trúng bộ nhớ đệm ngữ nghĩa (cộng đồng báo cáo): ~10% trò chuyện mở; tới ~70% FAQ có cấu trúc. Không phải đường cơ sở được nhà cung cấp ghi trong tài liệu.
- ProjectDiscovery: tỷ lệ trúng 7% → 74% bằng cách chuyển nội dung động ra khỏi tiền tố (blog dự án, 2025-11).
- Phản mẫu song song hóa: báo cáo điển hình về hóa đơn phình ra 5–10x khi N yêu cầu song song bỏ lỡ lần ghi bộ nhớ đệm đầu tiên.

```figure
semantic-cache-hit
```

## Use It

`code/main.py` mô phỏng lưu bộ nhớ đệm L1 + L2 trên khối lượng công việc hỗn hợp. Báo cáo tỷ lệ trúng, hóa đơn và cho thấy chi phí song song hóa phát sinh.

## Ship It

Bài học này tạo ra `outputs/skill-cache-auditor.md`. Với mẫu prompt và lưu lượng, kiểm tra khả năng lưu bộ nhớ đệm và khuyến nghị tái cấu trúc.

## Exercises

1. Chạy `code/main.py`. Bật/tắt cờ song song hóa. Hóa đơn thay đổi bao nhiêu?
2. System prompt của bạn có ngày. Chuyển nó ra ngoài. Trình bày phép tính tỷ lệ trúng trước/sau.
3. Tính điểm hòa vốn cho TTL 1 giờ (ghi 2x) so với TTL 5 phút (ghi 1.25x) với tốc độ yêu cầu đến của bạn.
4. Bộ nhớ đệm ngữ nghĩa ở ngưỡng 0.95 trúng 20%. Ở 0.85 nó trúng 50% nhưng bạn thấy phản hồi từ bộ nhớ đệm không đúng. Chọn ngưỡng phù hợp và giải thích.
5. Bạn gom lô 10 truy vấn con song song cho mỗi câu hỏi người dùng. Viết lại để thuận lợi cho bộ nhớ đệm mà không thêm độ trễ đầu cuối.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| L2 prompt cache (Bộ nhớ đệm prompt L2) | "bộ nhớ đệm tiền tố" | Nhà cung cấp lưu KV cho tiền tố lặp lại |
| `cache_control` | "dấu bộ nhớ đệm Anthropic" | Thuộc tính tường minh đánh dấu block có thể lưu bộ nhớ đệm |
| Cache write premium (Phụ phí ghi bộ nhớ đệm) | "thuế ghi" | Chi phí thêm cho lần trượt đầu tiên dẫn đến lưu bộ nhớ đệm (1.25x hoặc 2x) |
| L1 semantic cache (Bộ nhớ đệm ngữ nghĩa L1) | "bộ nhớ đệm embedding" | Hash và tạo embedding ở cấp ứng dụng trước khi gọi LLM |
| GPTCache | "thư viện lưu bộ nhớ đệm LLM" | Thư viện bộ nhớ đệm L1 OSS phổ biến |
| Cache hit rate (Tỷ lệ trúng bộ nhớ đệm) | "lượt trúng / tổng" | Tỷ phần yêu cầu được phục vụ từ bộ nhớ đệm |
| Parallelization anti-pattern (Phản mẫu song song hóa) | "bẫy N lần ghi" | N yêu cầu song song trượt bộ nhớ đệm N lần |
| Dynamic content trap (Bẫy nội dung động) | "bẫy thời gian trong prompt" | Các byte động trong tiền tố phá hỏng tỷ lệ trúng |
| RadixAttention | "bộ nhớ đệm trong bản sao" | Cách triển khai bộ nhớ đệm tiền tố của SGLang |

## Further Reading

- [Anthropic Prompt Caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — ngữ nghĩa `cache_control` chính thức và các TTL.
- [OpenAI Prompt Caching](https://platform.openai.com/docs/guides/prompt-caching) — hành vi lưu bộ nhớ đệm tự động và điều kiện đủ.
- [TianPan — Semantic Caching for LLMs Production](https://tianpan.co/blog/2026-04-10-semantic-caching-llm-production)
- [ProjectDiscovery — Cut LLM Costs 59% With Prompt Caching](https://projectdiscovery.io/blog/how-we-cut-llm-cost-with-prompt-caching)
- [DigitalOcean / Anthropic — Prompt Caching](https://www.digitalocean.com/blog/prompt-caching-with-digital-ocean)
