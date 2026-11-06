# LLM Routing Layer — LiteLLM, OpenRouter, Portkey

> Khóa chặt nhà cung cấp đắt. Khối lượng công việc gọi công cụ khác nhau hợp mô hình khác nhau. Gateway định tuyến cho một bề mặt API, thử lại, chuyển đổi dự phòng, theo dõi chi phí và chốt bảo vệ. Ba mẫu chủ đạo năm 2026: LiteLLM (mã nguồn mở tự host), OpenRouter (SaaS được quản lý), Portkey (cấp sản xuất, mở mã nguồn tháng 3 năm 2026). Bài này nêu tiêu chí quyết định và đi qua gateway định tuyến stdlib.

**Type:** Learn
**Languages:** Python (stdlib, routing + failover + cost tracker)
**Prerequisites:** Phase 13 · 02 (function calling), Phase 13 · 17 (gateways)
**Time:** ~45 minutes

## Learning Objectives

- Phân biệt lựa chọn định tuyến tự host, được quản lý và cấp sản xuất.
- Triển khai chuỗi dự phòng thử lại khi nhà cung cấp thất bại theo thứ tự ưu tiên định nghĩa.
- Theo dõi chi phí và sử dụng token mỗi yêu cầu qua nhà cung cấp.
- Quyết định giữa LiteLLM, OpenRouter và Portkey cho ràng buộc sản xuất đã cho.

## The Problem

Kịch bản định tuyến nhà cung cấp quan trọng:

1. **Chi phí.** Claude Sonnet giá 3x Haiku. Với tác vụ phân loại, Haiku đủ; với tổng hợp, Sonnet đáng giá. Định tuyến mỗi yêu cầu.

2. **Chuyển đổi dự phòng.** OpenAI gặp giờ xấu. Mọi yêu cầu thất bại. Bạn muốn tự động dự phòng sang Anthropic không triển khai lại.

3. **Độ trễ.** UI chat trực tiếp cần thời gian đến token đầu nhanh. Bộ tóm tắt theo lô không cần. Định tuyến theo SLA độ trễ.

4. **Tuân thủ.** Người dùng EU phải ở vùng EU. Định tuyến theo vùng.

5. **Thử nghiệm.** A/B hai mô hình trên cùng khối lượng công việc. Định tuyến theo nhóm kiểm thử.

Viết tay tất cả cho mỗi tích hợp lặp lại. Gateway định tuyến cho một API tương thích OpenAI và xử lý phần còn lại.

## The Concept

### OpenAI-compatible proxy shape

Mọi bên dùng hình dạng OpenAI. Gateway định tuyến cung cấp `/v1/chat/completions`, nhận lược đồ OpenAI và proxy nội bộ đến Anthropic / Gemini / Cohere / Ollama / bất cứ gì. Client không quan tâm.

### Model aliases

Thay id snapshot ghim, mã nói `our_smart_model`. Gateway ánh xạ bí danh đến mô hình thật. Khi nhà cung cấp phát hành thế hệ mới, bạn đổi bí danh phía máy chủ; mã không chạm gì.

### Fallback chains

```
primary: openai/gpt-4o
on 5xx: anthropic/claude-3-5-sonnet
on 5xx: google/gemini-1.5-pro
on 5xx: refuse
```

Gateway định nghĩa trong cấu hình. Thử lại tính vào ngân sách để thác dự phòng không làm chi phí tăng vọt.

### Semantic caching

Prompt giống hoặc gần giống trúng bộ đệm thay nhà cung cấp. Tiết kiệm trên vòng lặp agent lặp có thể 30 đến 60 phần trăm. Khóa dựa embedding; prompt gần giống dùng chung ô bộ đệm.

### Guardrails

Cấp gateway:

- **Che PII.** Lượt dựa regex hoặc ML trước gửi prompt.
- **Vi phạm chính sách.** Từ chối prompt có nội dung cấm.
- **Bộ lọc đầu ra.** Làm sạch phần hoàn thành để bỏ rò rỉ.

Portkey và Kong đều cung cấp chốt bảo vệ có quan điểm sẵn. LiteLLM để tùy chọn.

### Per-key rate limits

Một khóa API = một nhóm. Ngân sách mỗi khóa ngăn một nhóm tiêu thụ hạn ngạch dùng chung. Phần lớn gateway hỗ trợ.

### Self-hosted vs managed trade-offs

| Yếu tố | LiteLLM (tự host) | OpenRouter (được quản lý) | Portkey (sản xuất) |
|--------|----------------------|----------------------|----------------------|
| Mã | Mã nguồn mở, Python | SaaS được quản lý | Mã nguồn mở (tháng 3 năm 2026) + được quản lý |
| Thiết lập | Triển khai proxy | Đăng ký | Một trong hai |
| Nhà cung cấp | 100+ | 300+ | 100+ |
| Tính phí | Khóa riêng của bạn | Tín dụng OpenRouter | Khóa riêng của bạn |
| Quan sát | OpenTelemetry | Dashboard | OTel đầy đủ + che PII |
| Tốt nhất cho | Nhóm muốn toàn quyền kiểm soát | Tạo nguyên mẫu nhanh | Sản xuất có tuân thủ |

LiteLLM thắng khi có nhóm SRE và muốn chủ quyền dữ liệu. OpenRouter thắng khi muốn một gói đăng ký và không hạ tầng. Portkey thắng khi cần chốt bảo vệ và tuân thủ có sẵn.

### Cost tracking

Mọi yêu cầu mang `provider`, `model`, `input_tokens`, `output_tokens`. Nhân giá mỗi token mỗi mô hình (lấy từ bảng giá gateway duy trì). Tổng hợp mỗi người dùng / mỗi nhóm / mỗi dự án.

### MCP plus routing

Gateway có thể định tuyến cả lời gọi LLM VÀ yêu cầu sampling MCP. Khi modelPreferences của yêu cầu sampling ưu tiên mô hình cụ thể, gateway chuyển sang đúng backend. Đây là nơi Giai đoạn 13 · 17 (gateway MCP) và gateway định tuyến bài này đôi khi gộp thành một dịch vụ.

### Routing strategies

- **Ưu tiên tĩnh.** Đầu danh sách; dự phòng khi lỗi.
- **Cân bằng tải.** Round-robin hoặc có trọng số.
- **Nhận biết chi phí.** Chọn mô hình rẻ nhất đáp ứng độ trễ / chất lượng.
- **Nhận biết độ trễ.** Chọn mô hình nhanh nhất trong N phút cuối.
- **Nhận biết tác vụ.** Bộ phân loại prompt định tuyến lập trình đến mô hình này, tóm tắt đến mô hình khác.

```figure
tp-router-failover
```

## Use It

`code/main.py` triển khai gateway định tuyến trong ~150 dòng: nhận yêu cầu hình dạng OpenAI, chuyển sang stub mỗi nhà cung cấp, chạy chuỗi dự phòng ưu tiên, theo dõi chi phí mỗi yêu cầu và áp lượt che PII trên đầu vào. Chạy với ba kịch bản: yêu cầu thường, mất dịch vụ nhà cung cấp chính kích hoạt dự phòng, rò PII được che bắt.

Những gì cần xem:

- Dict `ROUTES`: bí danh -> danh sách nhà cung cấp cụ thể theo ưu tiên.
- Vòng dự phòng thử lại trên 5xx.
- Bộ theo dõi chi phí nhân sử dụng token với mức giá mỗi mô hình.
- Bộ che PII làm sạch mẫu dạng SSN trước chuyển tiếp.

## Ship It

Bài này tạo `outputs/skill-routing-config-designer.md`. Với hồ sơ khối lượng công việc (độ trễ, chi phí, tuân thủ), skill chọn LiteLLM / OpenRouter / Portkey và tạo cấu hình định tuyến.

## Exercises

1. Chạy `code/main.py`. Kích hoạt kịch bản mất dịch vụ; xác nhận dự phòng đến nhà cung cấp thứ hai và chi phí phân bổ đúng.

2. Thêm lưu đệm ngữ nghĩa: SHA256 của prompt là khóa tra cứu; trúng bộ đệm trả ngay. Đo tiết kiệm chi phí trên lời gọi lặp.

3. Thêm bộ phân loại prompt định tuyến prompt "lập trình ..." đến bí danh ưu tiên trí tuệ và prompt "tóm tắt ..." đến bí danh ưu tiên tốc độ.

4. Thiết kế ngân sách mỗi nhóm: mỗi nhóm có trần chi tiêu tháng; gateway từ chối yêu cầu khi chạm trần. Chọn độ hạt thực thi (mỗi yêu cầu hoặc theo cửa sổ).

5. Đọc tài liệu LiteLLM, OpenRouter và Portkey cạnh nhau. Nêu một tính năng mỗi bên cung cấp mà hai bên kia không có.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Routing gateway (Gateway định tuyến) | "Proxy LLM" | Tầng một bề mặt API trước nhiều nhà cung cấp |
| OpenAI-compatible (Tương thích OpenAI) | "Dùng lược đồ OpenAI" | Nhận hình dạng `/v1/chat/completions`, chuyển đến mọi backend |
| Model alias (Bí danh mô hình) | "our_smart_model" | Tên trong mã gateway ánh xạ đến mô hình cụ thể |
| Fallback chain (Chuỗi dự phòng) | "Danh sách thử lại" | Danh sách nhà cung cấp có thứ tự được thử khi thất bại |
| Semantic caching (Lưu đệm ngữ nghĩa) | "Bộ đệm embedding prompt" | Khóa là embedding prompt; bản gần trùng chia sẻ trúng bộ đệm |
| Guardrails (Chốt bảo vệ) | "Bộ lọc đầu vào/đầu ra" | Che PII, từ chối vi phạm chính sách |
| Per-key rate limit (Giới hạn tốc độ mỗi khóa) | "Ngân sách nhóm" | Hạn ngạch phạm vi khóa API |
| Cost tracking (Theo dõi chi phí) | "Chi tiêu mỗi yêu cầu" | Tổng hợp sử dụng token x giá mỗi mô hình |
| LiteLLM | "Proxy mở" | Gateway định tuyến OSS tự host được |
| OpenRouter | "SaaS được quản lý" | Gateway host với tính phí dựa tín dụng |
| Portkey | "Lựa chọn sản xuất" | Mã nguồn mở + được quản lý với chốt bảo vệ tích hợp |

## Further Reading

- [LiteLLM — docs](https://docs.litellm.ai/) — gateway định tuyến tự host
- [OpenRouter — quickstart](https://openrouter.ai/docs/quickstart) — SaaS định tuyến được quản lý
- [Portkey — docs](https://portkey.ai/docs) — định tuyến sản xuất có chốt bảo vệ
- [TrueFoundry — LiteLLM vs OpenRouter](https://www.truefoundry.com/blog/litellm-vs-openrouter) — hướng dẫn quyết định
- [Relayplane — LLM gateway comparison 2026](https://relayplane.com/blog/llm-gateway-comparison-2026) — khảo sát nhà cung cấp
