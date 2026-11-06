# Streaming Speech-to-Speech — Moshi, Hibiki, and Full-Duplex Dialogue

> 2024-2026 định nghĩa lại AI giọng nói. Moshi cung cấp một mô hình duy nhất nghe và nói đồng thời ở độ trễ 200 ms. Hibiki thực hiện dịch tiếng nói-thành-tiếng nói từng khối. Cả hai bỏ pipeline ASR → LLM → TTS để dùng một kiến trúc song công toàn phần thống nhất trên các token codec Mimi. Đây là thiết kế tham chiếu mới.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 13 (Neural Audio Codecs), Phase 6 · 11 (Real-Time Audio), Phase 7 · 05 (Full Transformer)
**Time:** ~75 minutes

## The Problem

Mọi tác tử giọng nói được xây dựng từ Bài 11 + 12 có một mức sàn độ trễ cơ bản quanh 300-500 ms: VAD kích hoạt, STT xử lý, LLM suy luận, TTS sinh. Mỗi giai đoạn có độ trễ tối thiểu riêng. Bạn có thể tinh chỉnh và song song hóa, nhưng hình dạng pipeline giới hạn bạn.

Moshi (Kyutai, 2024-2026) hỏi một câu khác: nếu không có pipeline thì sao? Nếu một mô hình nhận âm thanh vào và phát âm thanh ra trực tiếp, liên tục, với văn bản làm "độc thoại nội tâm" trung gian thay vì một giai đoạn bắt buộc thì sao?

Câu trả lời là **tiếng nói-thành-tiếng nói song công toàn phần**. Độ trễ lý thuyết 160 ms (khung Mimi 80 ms + trễ âm học 80 ms). Độ trễ thực tế 200 ms trên một GPU L4 duy nhất. Đó là một nửa mức một tác tử giọng nói pipeline hàng đầu đạt được.

## The Concept

![Moshi architecture: two parallel Mimi streams + inner-monologue text](../assets/moshi-hibiki.svg)

### The Moshi architecture

**Đầu vào.** Hai luồng codec Mimi, cả hai tại 12.5 Hz × 8 codebook:

- Luồng 1: âm thanh người dùng (mã hóa Mimi, đến liên tục)
- Luồng 2: âm thanh riêng của Moshi (do Moshi sinh)

**Transformer.** Một Temporal Transformer 7B tham số xử lý cả hai luồng và một luồng văn bản "độc thoại nội tâm". Ở mỗi bước 80 ms, nó:

1. Tiêu thụ các token Mimi người dùng mới nhất (8 codebook).
2. Tiêu thụ các token Mimi Moshi gần nhất (8 codebook, như được tạo ra).
3. Sinh token văn bản Moshi tiếp theo (độc thoại nội tâm).
4. Sinh các token Mimi Moshi tiếp theo (8 codebook qua một Depth Transformer nhỏ).

Cả ba luồng — âm thanh người dùng, âm thanh Moshi, văn bản Moshi — chạy song song. Moshi có thể nghe người dùng trong khi nói; có thể tự ngắt khi người dùng ngắt; có thể phản hồi phụ ("ừm") mà không phá phát ngôn chính.

**Depth transformer.** Trong một khung, 8 codebook không được dự đoán song song — chúng có các phụ thuộc giữa codebook. Một "depth transformer" nhỏ 2 tầng dự đoán chúng tuần tự trong 80 ms. Đây là phân tích nhân tử tiêu chuẩn cho các LM codec AR (cũng được VALL-E, VibeVoice dùng).

### Why inner-monologue text helps

Không có văn bản tường minh, mô hình phải mô hình hóa ngôn ngữ ngầm trong luồng âm học của nó. Nhận thức của Moshi: ép nó phát các token văn bản cùng âm thanh. Luồng văn bản về cơ bản là bản chép lời những gì Moshi đang nói. Điều này cải thiện độ mạch lạc ngữ nghĩa, khiến việc hoán đổi một head mô hình ngôn ngữ dễ hơn và cho bạn các bản chép lời miễn phí.

### Hibiki: streaming speech-to-speech translation

Cùng kiến trúc, được huấn luyện trên các cặp dịch. Âm thanh nguồn vào, âm thanh ngôn ngữ đích ra, liên tục. Hibiki-Zero (tháng 2 năm 2026) loại bỏ nhu cầu dữ liệu huấn luyện được căn chỉnh cấp từ — dùng dữ liệu cấp câu + học tăng cường GRPO để tối ưu độ trễ.

Ban đầu hỗ trợ bốn cặp ngôn ngữ; có thể thích nghi sang một ngôn ngữ mới với ≈1000 giờ.

### The broader Kyutai stack (2026)

- **Moshi** — hội thoại song công toàn phần (tiếng Pháp trước, tiếng Anh được hỗ trợ tốt)
- **Hibiki / Hibiki-Zero** — dịch tiếng nói đồng thời
- **Kyutai STT** — ASR luồng (nhìn trước 500 ms hoặc 2.5 s)
- **Kyutai Pocket TTS** — TTS 100M tham số chạy trên CPU (tháng 1 năm 2026)
- **Unmute** — pipeline đầy đủ kết hợp những thành phần này trên các máy chủ công cộng

Thông lượng trên một GPU L40S: 64 phiên đồng thời ở 3× thời gian thực.

### Sesame CSM — the cousin

Sesame CSM (2025) dùng một ý tưởng tương tự — một backbone Llama-3 với một head codec Mimi. Nhưng CSM là đơn hướng (nhận ngữ cảnh + văn bản, tạo tiếng nói) thay vì song công toàn phần. Nó là TTS "hiện diện giọng nói" tốt nhất trên thị trường; không hoàn toàn giống khả năng song công toàn phần của Moshi.

### 2026 performance numbers

| Mô hình | Độ trễ | Trường hợp sử dụng | Giấy phép |
|-------|---------|----------|---------|
| Moshi | 200 ms (L4) | hội thoại tiếng Anh / Pháp song công toàn phần | CC-BY 4.0 |
| Hibiki | tốc độ khung 12.5 Hz | dịch luồng tiếng Pháp ↔ Anh | CC-BY 4.0 |
| Hibiki-Zero | như nhau | 5 cặp ngôn ngữ, không dữ liệu căn chỉnh | CC-BY 4.0 |
| Sesame CSM-1B | 200 ms TTFA | TTS được điều kiện hóa theo ngữ cảnh | Apache-2.0 |
| GPT-4o Realtime | ~300 ms | đóng, OpenAI API | thương mại |
| Gemini 2.5 Live | ~350 ms | đóng, Google API | thương mại |

```figure
sp-fullduplex
```

## Build It

### Step 1: the interface

Moshi cung cấp một máy chủ WebSocket nhận các khối 80 ms âm thanh mã hóa Mimi và trả các khối 80 ms âm thanh mã hóa Mimi. Cả hai hướng. Liên tục.

```python
import asyncio
import websockets
from moshi.client_utils import encode_audio_mimi, decode_audio_mimi

async def moshi_chat():
    async with websockets.connect("ws://localhost:8998/api/chat") as ws:
        mic_task = asyncio.create_task(stream_mic_to(ws))
        spk_task = asyncio.create_task(stream_from_to_speaker(ws))
        await asyncio.gather(mic_task, spk_task)
```

### Step 2: the full-duplex loop

```python
async def stream_mic_to(ws):
    async for chunk_80ms in mic_stream_at_12_5_hz():
        mimi_tokens = encode_audio_mimi(chunk_80ms)
        await ws.send(serialize(mimi_tokens))

async def stream_from_to_speaker(ws):
    async for msg in ws:
        mimi_tokens, text_token = deserialize(msg)
        audio = decode_audio_mimi(mimi_tokens)
        await play(audio)
```

Cả hai hướng chạy đồng thời. Python asyncio hoặc Rust futures là truyền tải tiêu chuẩn.

### Step 3: the training objective (conceptual)

Với mỗi khung 80 ms `t`:

- Đầu vào: `user_mimi[0..t]`, `moshi_mimi[0..t-1]`, `moshi_text[0..t-1]`
- Dự đoán: `moshi_text[t]`, rồi `moshi_mimi[t, codebook_0..7]`

Văn bản được dự đoán trước âm thanh (độc thoại nội tâm); âm thanh được dự đoán tuần tự theo codebook trong depth transformer.

### Step 4: where Moshi wins and where it doesn't

Moshi thắng:

- Đầu cuối dưới 250 ms trên phần cứng rẻ.
- Các phản hồi phụ và ngắt lời tự nhiên.
- Không mã kết nối pipeline.

Moshi không thắng:

- Gọi công cụ (không được huấn luyện cho việc đó; bạn cần một đường LLM riêng).
- Suy luận dài (Moshi là một mô hình hội thoại cỡ 8B, không phải Claude/GPT-4).
- Độ chính xác sự kiện trên các chủ đề ngách.
- Hầu hết các trường hợp sử dụng doanh nghiệp production (vẫn dùng pipeline năm 2026).

## Use It

| Tình huống | Chọn |
|-----------|------|
| Bạn đồng hành giọng nói độ trễ thấp nhất | Moshi |
| Cuộc gọi dịch trực tiếp | Hibiki |
| Minh họa giọng nói / nghiên cứu | Moshi, CSM |
| Tác tử doanh nghiệp có công cụ | Pipeline (Bài 12), không phải Moshi |
| TTS giọng tùy chỉnh trong ngữ cảnh | Sesame CSM |
| Tiếng nói-thành-tiếng nói, bất kỳ ngôn ngữ nào | GPT-4o Realtime hoặc Gemini 2.5 Live (thương mại) |

## Pitfalls

- **Gọi công cụ hạn chế.** Moshi là một mô hình hội thoại, không phải framework tác tử. Kết hợp với pipeline cho công cụ.
- **Điều kiện hóa giọng cụ thể.** Moshi dùng một nhân cách được huấn luyện duy nhất; nhân bản là một lượt huấn luyện riêng.
- **Độ bao phủ ngôn ngữ.** Tiếng Pháp + Anh xuất sắc; các ngôn ngữ khác hạn chế. Hibiki-Zero giúp, nhưng bạn vẫn cần dữ liệu huấn luyện.
- **Chi phí tài nguyên.** Một phiên Moshi đầy đủ giữ một slot GPU; không phải mẫu triển khai chia sẻ nhiều khách thuê rẻ.

## Ship It

Lưu thành `outputs/skill-duplex-pipeline.md`. Chọn pipeline so với kiến trúc song công toàn phần cho một khối lượng công việc tác tử giọng nói, với lý do.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Nó mô phỏng kiến trúc hai luồng + độc thoại nội tâm bằng ký hiệu.
2. **Trung bình.** Tải Moshi từ HuggingFace, chạy máy chủ, kiểm thử một cuộc hội thoại. Đo độ trễ thời gian thực từ kết thúc tiếng nói người dùng đến bắt đầu phản hồi Moshi.
3. **Khó.** Lấy tác tử pipeline Bài 12 của bạn và so sánh độ trễ P50 với Moshi trên 20 phát ngôn kiểm thử tương ứng. Viết lại khi nào một pipeline vẫn thắng về kiến trúc.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Full-duplex (Song công toàn phần) | Nghe và nói cùng lúc | Hai luồng âm thanh hoạt động đồng thời trên cùng mô hình. |
| Inner monologue (Độc thoại nội tâm) | Luồng văn bản của mô hình | Moshi phát các token văn bản cùng đầu ra âm thanh. |
| Depth transformer | Bộ dự đoán giữa codebook | Transformer nhỏ dự đoán 8 codebook trong một khung 80 ms. |
| Mimi | Codec của Kyutai | 12.5 Hz × 8 codebook; ngữ nghĩa+âm học; vận hành Moshi. |
| Streaming S2S (S2S luồng) | Âm thanh → âm thanh trực tiếp | Dịch/hội thoại từng khối, không các giai đoạn pipeline. |
| Back-channeling (Phản hồi phụ) | Các phản ứng "Ừm" | Moshi có thể phát các xác nhận nhỏ mà không phá lượt của nó. |

## Further Reading

- [Défossez et al. (2024). Moshi — speech-text foundation model](https://arxiv.org/html/2410.00037v2) — bài báo.
- [Kyutai Labs (2026). Hibiki-Zero](https://arxiv.org/abs/2602.12345) — dịch luồng không dữ liệu căn chỉnh.
- [Sesame (2025). Crossing the uncanny valley of voice](https://www.sesame.com/research/crossing_the_uncanny_valley_of_voice) — đặc tả CSM.
- [Kyutai — Moshi repo](https://github.com/kyutai-labs/moshi) — cài đặt + máy chủ.
- [OpenAI — Realtime API](https://platform.openai.com/docs/guides/realtime) — đối tác ngang hàng thương mại đóng.
- [Kyutai — Delayed Streams Modeling](https://github.com/kyutai-labs/delayed-streams-modeling) — framework STT/TTS bên dưới.
