# AI Gateways — LiteLLM, Portkey, Kong AI Gateway, Bifrost

> Một gateway nằm giữa ứng dụng của bạn và các nhà cung cấp mô hình. Các tính năng cốt lõi là định tuyến nhà cung cấp, dự phòng, thử lại, giới hạn tốc độ, tham chiếu bí mật, khả năng quan sát, chốt bảo vệ. Phân chia thị trường năm 2026: **LiteLLM** là OSS MIT với 100+ nhà cung cấp, tương thích OpenAI, nhưng sụp đổ quanh ~2000 RPS (bộ nhớ 8 GB, lỗi dây chuyền trong các phép đo chuẩn được công bố); tốt nhất cho Python, <500 RPS, phát triển/tạo mẫu. **Portkey** được định vị ở mặt phẳng điều khiển (chốt bảo vệ, che PII, phát hiện jailbreak, dấu vết kiểm toán), chuyển sang mã nguồn mở Apache 2.0 tháng 3 năm 2026, chi phí độ trễ phụ 20-40 ms, gói sản xuất $49/tháng. **Kong AI Gateway** xây trên Kong Gateway — phép đo chuẩn của chính Kong trên cùng 12 CPU: nhanh hơn Portkey 228%, nhanh hơn LiteLLM 859%; giá $100/mô hình/tháng (tối đa 5 ở gói Plus); phù hợp doanh nghiệp nếu bạn đã dùng Kong. **Bifrost** (Maxim AI) — tự động thử lại với backoff cấu hình được, dự phòng sang Anthropic khi OpenAI 429. **Cloudflare / Vercel AI Gateways** — được quản lý, không vận hành, thử lại cơ bản. Lưu trú dữ liệu thúc đẩy quyết định tự lưu trữ; Portkey và Kong nằm ở giữa với OSS + tùy chọn được quản lý.

**Type:** Learn
**Languages:** Python (stdlib, toy gateway-routing simulator)
**Prerequisites:** Phase 17 · 01 (Managed LLM Platforms), Phase 17 · 16 (Model Routing)
**Time:** ~60 minutes

## Learning Objectives

- Liệt kê sáu tính năng cốt lõi của gateway (định tuyến, dự phòng, thử lại, giới hạn tốc độ, bí mật, khả năng quan sát, chốt bảo vệ).
- Ánh xạ bốn gateway năm 2026 (LiteLLM, Portkey, Kong AI, Bifrost) đến trần quy mô và trường hợp sử dụng.
- Trích dẫn phép đo chuẩn Kong (228% so với Portkey, 859% so với LiteLLM) và giải thích tại sao nó quan trọng với >500 RPS.
- Chọn tự lưu trữ so với được quản lý với lưu trú dữ liệu và ngân sách vận hành.

## The Problem

Sản phẩm của bạn gọi OpenAI, Anthropic và một Llama tự lưu trữ. Mỗi nhà cung cấp có SDK, mô hình lỗi, giới hạn tốc độ và cơ chế xác thực khác nhau. Bạn muốn chuyển đổi dự phòng (nếu OpenAI trả 429, thử Anthropic), một kho thông tin xác thực duy nhất, khả năng quan sát hợp nhất và giới hạn tốc độ theo tenant.

Phát minh lại điều này ở lớp ứng dụng gắn mọi dịch vụ với mọi nhà cung cấp. Một lớp gateway hợp nhất nó thành một tiến trình với một API (thường tương thích OpenAI) phân nhánh đến các nhà cung cấp.

## The Concept

### Six core features

1. **Định tuyến nhà cung cấp** — OpenAI, Anthropic, Gemini, tự lưu trữ, v.v. sau một API.
2. **Dự phòng** — khi có 429, 5xx hoặc lỗi chất lượng, thử lại nơi khác.
3. **Thử lại** — backoff hàm mũ, số lần thử có giới hạn.
4. **Giới hạn tốc độ** — theo tenant, theo khóa, theo mô hình.
5. **Tham chiếu bí mật** — lấy thông tin xác thực từ vault lúc chạy (không bao giờ trong ứng dụng).
6. **Khả năng quan sát** — OTel + thuộc tính GenAI (Giai đoạn 17 · 13) + quy chi phí.
7. **Chốt bảo vệ** — che PII, phát hiện jailbreak, bộ lọc chủ đề được phép.

### LiteLLM — MIT OSS, Python

- 100+ nhà cung cấp, tương thích OpenAI, cấu hình bộ định tuyến, dự phòng, khả năng quan sát cơ bản.
- Sụp đổ quanh 2000 RPS trong phép đo chuẩn của Kong; dung lượng bộ nhớ 8 GB, lỗi dây chuyền dưới tải kéo dài.
- Phù hợp nhất: ứng dụng Python, <500 RPS, gateway phát triển/staging, định tuyến thử nghiệm.
- Chi phí: $0 cho OSS; có gói đám mây miễn phí.

### Portkey — control plane positioning

- OSS Apache 2.0 tính đến tháng 3 năm 2026. Chốt bảo vệ, che PII, phát hiện jailbreak, dấu vết kiểm toán.
- Chi phí độ trễ phụ 20-40 ms mỗi yêu cầu.
- $49/tháng cho gói sản xuất có lưu giữ + SLA.
- Phù hợp nhất: các ngành chịu quản lý theo quy định cần chốt bảo vệ + khả năng quan sát được gộp.

### Kong AI Gateway — the scale play

- Xây trên Kong Gateway (sản phẩm gateway API trưởng thành, lua+OpenResty).
- Phép đo chuẩn của chính Kong trên cấu hình tương đương 12 CPU: nhanh hơn Portkey 228%, nhanh hơn LiteLLM 859%.
- Giá: $100/mô hình/tháng, tối đa 5 ở gói Plus.
- Phù hợp nhất: đã dùng Kong; >1000 RPS; sẵn sàng mua giấy phép.

### Bifrost (Maxim AI)

- Tự động thử lại với backoff cấu hình được.
- Dự phòng sang Anthropic khi OpenAI 429 là một công thức điển hình.
- Thành viên mới hơn; thương mại.

### Cloudflare AI Gateway / Vercel AI Gateway

- Được quản lý, không vận hành. Thử lại và khả năng quan sát cơ bản.
- Phù hợp nhất: ứng dụng JavaScript phục vụ ở biên trên Cloudflare/Vercel.
- Hạn chế so với Kong/Portkey về chốt bảo vệ và giới hạn tốc độ.

### Self-hosted vs managed

Lưu trú dữ liệu là yếu tố buộc phải quyết định. Y tế và tài chính mặc định tự lưu trữ (LiteLLM hoặc Portkey OSS hoặc Kong). Sản phẩm tiêu dùng mặc định được quản lý (Cloudflare AI Gateway) hoặc tầng giữa (Portkey được quản lý). Lai: tự lưu trữ cho tenant chịu quản lý theo quy định, được quản lý cho các tenant khác.

### Latency budget

- LiteLLM: chi phí phụ điển hình 5-15 ms.
- Portkey: chi phí phụ 20-40 ms.
- Kong: chi phí phụ 3-8 ms.
- Cloudflare/Vercel: chi phí phụ 1-3 ms (lợi thế biên).

Độ trễ gateway cộng trực tiếp vào TTFT. Với SLA TTFT P99 < 100 ms, Kong hoặc Cloudflare. Với P99 < 500 ms, bất kỳ công cụ nào.

### Rate-limit semantics matter

Token-bucket đơn giản hoạt động tới quy mô vừa phải. Đa tenant yêu cầu cửa sổ trượt + mức đột biến cho phép + phân tầng theo tenant. LiteLLM cung cấp token-bucket; Kong cung cấp cửa sổ trượt; Portkey cung cấp phân tầng.

### Gateway + observability + routing compose

Giai đoạn 17 · 13 (khả năng quan sát) + 16 (định tuyến mô hình) + 19 (gateway) là cùng lớp trong sản xuất. Chọn một công cụ bao phủ cả ba hoặc kết nối chúng cẩn thận: hầu hết triển khai năm 2026 kết hợp Helicone (khả năng quan sát) hoặc Portkey (chốt bảo vệ) với Kong (quy mô) cho các vai trò tách biệt.

### Numbers you should remember

- LiteLLM: sụp đổ ở ~2000 RPS, bộ nhớ 8 GB.
- Portkey: chi phí phụ 20-40 ms; Apache 2.0 từ tháng 3 năm 2026.
- Kong: nhanh hơn Portkey 228%, nhanh hơn LiteLLM 859%.
- Giá Kong: $100/mô hình/tháng, tối đa 5 ở gói Plus.
- Cloudflare/Vercel: chi phí phụ 1-3 ms tại biên.

```figure
mx-gateway-fallback
```

## Use It

`code/main.py` mô phỏng định tuyến gateway có dự phòng trên 3 nhà cung cấp khi chèn lỗi 429/5xx. Báo cáo độ trễ, tỷ lệ thử lại và tỷ lệ trúng dự phòng.

## Ship It

Bài học này tạo ra `outputs/skill-gateway-picker.md`. Với quy mô, định hướng vận hành, tuân thủ, ngân sách độ trễ, chọn một gateway.

## Exercises

1. Chạy `code/main.py`. Cấu hình dự phòng từ OpenAI→Anthropic→tự lưu trữ. Tỷ lệ trúng dự kiến ở tỷ lệ lỗi nhà cung cấp 5% là bao nhiêu?
2. SLA của bạn là TTFT P99 < 200 ms trên đường cơ sở 300 ms. Những gateway nào ở trong ngân sách?
3. Một khách hàng y tế yêu cầu tự lưu trữ + che PII + kiểm toán. Chọn Portkey OSS hoặc Kong.
4. So sánh LiteLLM với Kong: ở trần RPS nào một nhóm nên chuyển đổi?
5. Thiết kế chính sách giới hạn tốc độ cho một SaaS đa tenant: gói miễn phí, gói dùng thử, gói trả phí. Token-bucket hay cửa sổ trượt?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Gateway | "bộ môi giới API" | Tiến trình nằm giữa ứng dụng và nhà cung cấp |
| LiteLLM | "công cụ MIT" | OSS Python, 100+ nhà cung cấp, sụp đổ ở 2K RPS |
| Portkey | "gateway chốt bảo vệ" | Mặt phẳng điều khiển + khả năng quan sát, Apache 2.0 |
| Kong AI Gateway | "công cụ quy mô lớn" | Xây trên Kong Gateway, dẫn đầu phép đo chuẩn |
| Bifrost | "gateway của Maxim" | Thử lại + công thức dự phòng Anthropic |
| Cloudflare AI Gateway | "được quản lý ở biên" | Gateway được quản lý triển khai tại biên, không vận hành |
| PII redaction (Che PII) | "làm sạch dữ liệu" | Che bằng regex + NER trước khi gửi đến mô hình |
| Jailbreak detection (Phát hiện jailbreak) | "bảo vệ chống chèn prompt" | Bộ phân loại trên đầu vào người dùng |
| Audit trail (Dấu vết kiểm toán) | "log theo quy định" | Bản ghi bất biến của mọi lệnh gọi LLM |
| Token-bucket | "giới hạn tốc độ đơn giản" | Bộ giới hạn tốc độ dựa trên nạp lại |
| Sliding-window (Cửa sổ trượt) | "giới hạn tốc độ chính xác" | Bộ giới hạn tốc độ theo cửa sổ thời gian; công bằng hơn |

## Further Reading

- [Kong AI Gateway Benchmark](https://konghq.com/blog/engineering/ai-gateway-benchmark-kong-ai-gateway-portkey-litellm)
- [TrueFoundry — AI Gateways 2026 Comparison](https://www.truefoundry.com/blog/a-definitive-guide-to-ai-gateways-in-2026-competitive-landscape-comparison)
- [Techsy — Top LLM Gateway Tools 2026](https://techsy.io/en/blog/best-llm-gateway-tools)
- [LiteLLM GitHub](https://github.com/BerriAI/litellm)
- [Portkey GitHub](https://github.com/Portkey-AI/gateway)
- [Kong AI Gateway docs](https://docs.konghq.com/gateway/latest/ai-gateway/)
