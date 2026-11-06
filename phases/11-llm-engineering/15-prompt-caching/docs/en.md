# Prompt Caching and Context Caching

> System prompt của bạn có 4,000 token. Ngữ cảnh RAG có 20,000 token. Bạn gửi cả hai với mọi yêu cầu. Bạn cũng trả tiền cho cả hai — mỗi lần. Prompt caching cho phép nhà cung cấp giữ tiền tố đó ấm ở phía họ và tính bạn 10% mức bình thường khi tái sử dụng. Dùng đúng, nó giảm chi phí suy luận 50–90% và độ trễ token đầu 40–85%.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 01 (Prompt Engineering), Phase 11 · 05 (Context Engineering), Phase 11 · 11 (Caching and Cost)
**Time:** ~60 minutes

## The Problem

Một tác tử lập trình gửi cùng system prompt 15,000 token cho Claude trên mỗi lượt hội thoại. Hai mươi lượt ở $3/M token đầu vào là $0.90 chỉ chi phí đầu vào — trước mọi thông điệp thực của người dùng. Nhân với 10,000 hội thoại hằng ngày và hóa đơn chạm $9,000/ngày cho văn bản không bao giờ đổi.

Bạn không thể thu nhỏ prompt mà không hại chất lượng. Bạn không thể tránh gửi nó — mô hình cần ở mỗi lượt. Nước đi duy nhất là ngừng trả đủ giá cho tiền tố nhà cung cấp đã thấy.

Nước đi đó là prompt caching. Anthropic phát hành vào tháng 8 năm 2024 (với biến thể TTL mở rộng 1 giờ năm 2025), OpenAI tự động hóa vào cuối năm đó, Google phát hành context caching rõ ràng cùng Gemini 1.5, và cả ba giờ cung cấp như tính năng hạng nhất trên mô hình tiên tiến nhất.

## The Concept

![Prompt caching: write once, read cheap](../assets/prompt-caching.svg)

**Cơ chế.** Khi tiền tố yêu cầu khớp tiền tố từ yêu cầu gần đây, nhà cung cấp phục vụ KV-cache từ lượt trước thay vì mã hóa lại token. Bạn trả phụ phí ghi nhỏ lần đầu và được giảm giá đọc lớn mọi lần sau.

**Ba kiểu nhà cung cấp năm 2026.**

| Nhà cung cấp | Kiểu API | Giảm khi hit | Phụ phí ghi | TTL mặc định | Tối thiểu cache được |
|---------|-----------|--------------|---------------|-------------|---------------|
| Anthropic | Dấu `cache_control` rõ ràng trên khối nội dung | Giảm 90% đầu vào | Phụ thu 25% | 5 phút (mở rộng được đến 1 giờ) | 1,024 token (Sonnet/Opus), 2,048 (Haiku) |
| OpenAI | Tự phát hiện tiền tố | Giảm 50% đầu vào | không | Đến 1 giờ (cố gắng tối đa) | 1,024 token |
| Google (Gemini) | API `CachedContent` rõ ràng | Tính tiền lưu trữ; đọc ở ~25% bình thường | Phí lưu trữ mỗi token·giờ | Người dùng đặt (mặc định 1 giờ) | 4,096 token (Flash), 32,768 (Pro) |

**Bất biến.** Cả ba chỉ cache tiền tố. Nếu bất kỳ token nào khác giữa các yêu cầu, mọi thứ sau token khác đầu tiên là miss. Đặt phần *ổn định* ở trên, phần *biến đổi* ở dưới.

### The cache-friendly layout

```
[system prompt]          <-- cache this
[tool definitions]       <-- cache this
[few-shot examples]      <-- cache this
[retrieved documents]    <-- cache if reused, else don't
[conversation history]   <-- cache up to last turn
[current user message]   <-- never cache (different every time)
```

Vi phạm thứ tự — đặt thông điệp người dùng trên system prompt, xen truy xuất động giữa ví dụ few-shot — và cache không bao giờ hit.

### The break-even calculation

Phụ phí ghi 25% của Anthropic nghĩa là khối cache phải được đọc ít nhất hai lần để tiết kiệm ròng. 1 ghi + 1 đọc trung bình chi phí 0.675x mỗi yêu cầu (tiết kiệm 32%); 1 ghi + 10 đọc trung bình 0.205x (tiết kiệm 80%). Quy tắc kinh nghiệm: cache mọi thứ bạn kỳ vọng tái sử dụng ít nhất 3 lần trong TTL.

```figure
prompt-cache-hit
```

## Build It

### Step 1: Anthropic prompt caching with explicit markers

```python
import anthropic

client = anthropic.Anthropic()

SYSTEM = [
    {
        "type": "text",
        "text": "You are a senior Python reviewer. Follow the rubric exactly.\n\n" + RUBRIC_15K_TOKENS,
        "cache_control": {"type": "ephemeral"},
    }
]

def review(code: str):
    return client.messages.create(
        model="claude-opus-4-7",
        max_tokens=1024,
        system=SYSTEM,
        messages=[{"role": "user", "content": code}],
    )
```

Dấu `cache_control` bảo Anthropic lưu khối trong 5 phút. Tái sử dụng trong cửa sổ đó hit; tái sử dụng sau thì hết hạn và ghi lại.

**Các trường usage phản hồi:**

```python
response = review(code_a)
response.usage
# InputTokensUsage(
#     input_tokens=120,
#     cache_creation_input_tokens=15023,   # paid at 1.25x
#     cache_read_input_tokens=0,
#     output_tokens=340,
# )

response_b = review(code_b)
response_b.usage
# cache_creation_input_tokens=0
# cache_read_input_tokens=15023           # paid at 0.1x
```

Kiểm tra cả hai trường trong CI — nếu `cache_read_input_tokens` giữ bằng không qua các yêu cầu, khóa cache của bạn đang trôi.

### Step 2: one-hour extended TTL

Với công việc batch dài, mặc định 5 phút hết hạn giữa các công việc. Đặt `ttl`:

```python
{"type": "text", "text": RUBRIC, "cache_control": {"type": "ephemeral", "ttl": "1h"}}
```

TTL 1 giờ tốn 2x phụ phí ghi (50% trên baseline thay vì 25%) nhưng hoàn vốn nhanh trên mọi batch tái sử dụng tiền tố hơn 5 lần.

### Step 3: OpenAI automatic caching

OpenAI không cho gì để cấu hình. Mọi tiền tố trên 1,024 token khớp yêu cầu gần đây tự động được giảm 50%.

```python
from openai import OpenAI
client = OpenAI()

resp = client.chat.completions.create(
    model="gpt-5",
    messages=[
        {"role": "system", "content": SYSTEM_PROMPT},   # long and stable
        {"role": "user", "content": user_msg},
    ],
)
resp.usage.prompt_tokens_details.cached_tokens  # the discounted portion
```

Cùng quy tắc bố trí thân thiện cache áp dụng. Hai thứ phá cache OpenAI nhưng không phá Anthropic: đổi trường `user` (dùng làm thành phần khóa cache) và sắp lại công cụ.

### Step 4: Gemini explicit context caching

Gemini xem cache là đối tượng hạng nhất bạn tạo và đặt tên:

```python
from google import genai
from google.genai import types

client = genai.Client()

cache = client.caches.create(
    model="gemini-3.8-flash",
    config=types.CreateCachedContentConfig(
        display_name="rubric-v3",
        system_instruction=RUBRIC,
        contents=[FEW_SHOT_EXAMPLES],
        ttl="3600s",
    ),
)

resp = client.models.generate_content(
    model="gemini-3.8-flash",
    contents=["Review this code:\n" + code],
    config=types.GenerateContentConfig(cached_content=cache.name),
)
```

Gemini tính lưu trữ mỗi token·giờ suốt thời gian cache sống, và đọc ở ~25% mức đầu vào bình thường. Đây là hình dạng phù hợp khi tái sử dụng cùng prompt khổng lồ qua nhiều phiên trong nhiều ngày.

### Step 5: measuring hit rate in production

Xem `code/main.py` để có bộ tính ba nhà cung cấp mô phỏng theo dõi số ghi/đọc/miss và tính chi phí pha trộn mỗi 1K yêu cầu. Chặn triển khai theo tỷ lệ hit mục tiêu — hầu hết thiết lập Anthropic sản xuất phải có tỷ phần đọc >80% sau khởi động.

## Pitfalls that still ship in 2026

- **Dấu thời gian động ở trên cùng.** `"Current time: 2026-04-22 15:30:02"` ở đầu system prompt. Mọi yêu cầu đều miss. Chuyển dấu thời gian xuống dưới điểm ngắt cache.
- **Sắp lại công cụ.** Tuần tự hóa công cụ theo thứ tự ổn định — xáo dict giữa các lần triển khai phá mọi hit.
- **Văn bản tự do gần trùng.** "Bạn hữu ích." so với "Bạn là một trợ lý hữu ích." — khác một byte = miss toàn bộ.
- **Khối quá nhỏ.** Anthropic cưỡng chế sàn 1,024 token (2,048 cho Haiku). Khối nhỏ hơn âm thầm không cache.
- **Dashboard chi phí mù.** Tách "token đầu vào" thành có cache và không cache. Nếu không, lưu lượng giảm trông như thành công cache.

## Use It

Ngăn xếp cache năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Tác tử có system prompt ổn định 10k+, nhiều lượt | `cache_control` của Anthropic với TTL 5 phút |
| Công việc batch tái sử dụng tiền tố trong 30+ phút | Anthropic với `ttl: "1h"` |
| Endpoint serverless trên GPT-5, không hạ tầng tùy chỉnh | OpenAI tự động (chỉ cần tiền tố ổn định và dài) |
| Tái sử dụng ngữ liệu mã/tài liệu khổng lồ nhiều ngày | `CachedContent` rõ ràng của Gemini |
| Dự phòng xuyên nhà cung cấp | Giữ bố trí tiền tố cache được giống hệt giữa nhà cung cấp để bất kỳ hit nào cũng hoạt động |

Kết hợp cache ngữ nghĩa (Giai đoạn 11 · 11) cho lớp thông điệp người dùng: prompt caching xử lý tái sử dụng *giống hệt token*, cache ngữ nghĩa xử lý tái sử dụng *giống hệt ý nghĩa*.

## Ship It

Lưu `outputs/skill-prompt-caching-planner.md`:

```markdown
---
name: prompt-caching-planner
description: Design a cache-friendly prompt layout and pick the right provider caching mode.
version: 1.0.0
phase: 11
lesson: 15
tags: [llm-engineering, caching, cost]
---

Given a prompt (system + tools + few-shot + retrieval + history + user) and a usage profile (requests per hour, TTL needed, provider), output:

1. Layout. Reordered sections with a single cache breakpoint marked; explain which sections are stable, which are volatile.
2. Provider mode. Anthropic cache_control, OpenAI automatic, or Gemini CachedContent. Justify from TTL and reuse pattern.
3. Break-even. Expected reads per write within TTL; net cost vs no-cache with math.
4. Verification plan. CI assertion that cache_read_input_tokens > 0 on the second identical request; dashboard split by cached vs uncached tokens.
5. Failure modes. List the three most likely reasons the cache will miss in this setup (dynamic timestamp, tool reorder, near-duplicate text) and how you will prevent each.

Refuse to ship a cache plan that places a dynamic field above the breakpoint. Refuse to enable 1h TTL without a reuse count that makes the 2x write premium pay back.
```

## Exercises

1. **Dễ.** Lấy hội thoại 10 lượt với system prompt 5,000 token gọi Claude. Chạy không `cache_control` rồi có. Báo hóa đơn token đầu vào cho mỗi loại.
2. **Trung bình.** Viết bộ kiểm thử nhận khuôn mẫu prompt và log yêu cầu, tính tỷ lệ hit kỳ vọng và tiết kiệm đô la mỗi nhà cung cấp (Anthropic 5m, Anthropic 1h, OpenAI tự động, Gemini rõ ràng).
3. **Khó.** Xây bộ tối ưu bố trí: với prompt và danh sách trường đánh dấu `stable=True/False`, viết lại prompt để đặt một điểm ngắt cache ở vị trí thân thiện cache tối đa mà không mất thông tin. Xác minh trên endpoint Anthropic thực.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Prompt caching (Cache prompt) | "Khiến prompt dài rẻ" | Tái sử dụng KV-cache phía nhà cung cấp cho tiền tố khớp; giảm 50-90% trên token đầu vào lặp. |
| `cache_control` | "Dấu Anthropic" | Thuộc tính khối nội dung tuyên bố "mọi thứ đến đây cache được"; `{"type": "ephemeral"}`. |
| Cache write (Ghi cache) | "Trả phụ phí" | Yêu cầu đầu lấp cache; tính ~1.25x mức đầu vào trên Anthropic, miễn phí trên OpenAI. |
| Cache read (Đọc cache) | "Giảm giá" | Yêu cầu sau khớp tiền tố; tính 10% (Anthropic), 50% (OpenAI), ~25% (Gemini). |
| TTL | "Nó sống bao lâu" | Số giây cache giữ ấm; Anthropic mặc định 5m (mở rộng được 1h), OpenAI cố gắng tối đa đến 1h, Gemini người dùng đặt. |
| Extended TTL (TTL mở rộng) | "Cache Anthropic 1 giờ" | `{"type": "ephemeral", "ttl": "1h"}`; phụ phí ghi 2x nhưng đáng cho tái sử dụng batch. |
| Prefix match (Khớp tiền tố) | "Tại sao cache của tôi miss" | Cache chỉ hit khi mọi token từ đầu đến điểm ngắt giống hệt từng byte. |
| Context caching (Gemini) (Cache ngữ cảnh) | "Cái rõ ràng" | Đối tượng cache có tên, tính phí lưu trữ của Google; tốt nhất để tái sử dụng ngữ liệu lớn nhiều ngày. |

## Further Reading

- [Anthropic — Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) — `cache_control`, TTL 1h, bảng hòa vốn.
- [OpenAI — Prompt caching](https://platform.openai.com/docs/guides/prompt-caching) — khớp tiền tố tự động.
- [Google — Context caching](https://ai.google.dev/gemini-api/docs/caching) — API `CachedContent` và giá lưu trữ.
- [Anthropic engineering — Prompt caching for long-context workloads](https://www.anthropic.com/news/prompt-caching) — bài ra mắt gốc với số liệu độ trễ.
- Giai đoạn 11 · 05 (Context Engineering) — nơi chia prompt để cache có thể đặt vào.
- Giai đoạn 11 · 11 (Caching and Cost) — kết hợp prompt caching với cache ngữ nghĩa trên thông điệp người dùng.
- [Pope et al., "Efficiently Scaling Transformer Inference" (2022)](https://arxiv.org/abs/2211.05102) — mô hình bộ nhớ KV-cache mà prompt caching mở cho người dùng; giải thích tại sao tiền tố cache rẻ hơn ~10× để đọc lại so với tính lại.
- [Agrawal et al., "SARATHI: Efficient LLM Inference by Piggybacking Decodes with Chunked Prefills" (2023)](https://arxiv.org/abs/2308.16369) — prefill là giai đoạn prompt caching đi tắt; bài báo giải thích tại sao TTFT giảm mạnh khi cache hit còn TPOT không bị ảnh hưởng.
- [Leviathan et al., "Fast Inference from Transformers via Speculative Decoding" (2023)](https://arxiv.org/abs/2211.17192) — prompt caching đứng cạnh speculative decoding, Flash Attention và MQA/GQA như các đòn bẩy bẻ cong đường chi phí suy luận; đọc để biết ba thứ còn lại.
