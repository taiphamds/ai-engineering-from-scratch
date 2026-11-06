# Build a Voice Assistant Pipeline — The Phase 6 Capstone

> Mọi thứ từ bài 01-11, được ghép lại. Xây dựng một trợ lý giọng nói lắng nghe, suy luận và nói đáp lại. Năm 2026 đó là một bài toán kỹ thuật đã giải quyết, không phải bài toán nghiên cứu — nhưng các chi tiết tích hợp quyết định nó có được phát hành không.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 05, 06, 07, 11; Phase 11 · 09 (Function Calling); Phase 14 · 01 (Agent Loop)
**Time:** ~120 minutes

## The Problem

Xây dựng một trợ lý đầu cuối:

1. Thu đầu vào micro (mono 16 kHz).
2. Phát hiện bắt đầu/kết thúc tiếng nói người dùng.
3. Chép lời theo luồng.
4. Truyền bản chép lời cho một LLM có thể gọi công cụ (hẹn giờ, thời tiết, lịch).
5. Truyền luồng văn bản LLM đến một TTS.
6. Phát âm thanh lại cho người dùng.
7. Dừng nếu người dùng ngắt giữa phản hồi.

Mục tiêu độ trễ: byte âm thanh TTS đầu tiên trong 800 ms sau khi người dùng kết thúc phát ngôn trên CPU máy tính xách tay. Mục tiêu chất lượng: không bỏ sót từ, không phụ đề bị ảo giác trên sự im lặng, không rò rỉ nhân bản giọng nói, không prompt injection thành công.

## The Concept

![Voice assistant pipeline: mic → VAD → STT → LLM+tools → TTS → speaker](../assets/voice-assistant.svg)

### The seven components

1. **Thu âm thanh.** Micro → mono 16 kHz → các khối 20 ms. Thường là `sounddevice` trong Python hoặc AudioUnit/ALSA/WASAPI nguyên bản trong production.
2. **VAD (Bài 11).** Silero VAD @ ngưỡng 0.5, tiếng nói tối thiểu 250 ms, thời gian duy trì sau im lặng 500 ms. Báo "bắt đầu" và "kết thúc."
3. **STT luồng (Bài 4-5).** Whisper-streaming, Parakeet-TDT hoặc Deepgram Nova-3 (API). Các bản chép lời từng phần + cuối cùng.
4. **LLM có gọi công cụ.** GPT-4o / Claude 3.5 / Gemini 2.5 Flash. JSON schema cho các công cụ. Truyền luồng token.
5. **TTS luồng (Bài 7).** Kokoro-82M (mở nhanh nhất) hoặc Cartesia Sonic (thương mại). Bắt đầu TTS sau 20 token LLM.
6. **Phát lại.** Xuất loa; mã hóa opus cho các mạng băng thông thấp.
7. **Bộ xử lý ngắt.** Nếu VAD kích hoạt trong lúc phát TTS, dừng phát, hủy LLM, khởi động lại STT.

### The three failure modes you will hit

1. **Cắt từ đầu.** VAD bắt đầu muộn một nhịp. "này" của người dùng bị thiếu. Bắt đầu ngưỡng tại 0.3, không phải 0.5.
2. **Nhầm lẫn ngắt giữa phản hồi.** LLM tiếp tục sinh sau khi người dùng ngắt; trợ lý nói lấn người dùng. Nối VAD → hủy LLM.
3. **Ảo giác im lặng.** Whisper xuất "Cảm ơn đã xem" trên các khung khởi động im lặng. Luôn chặn VAD.

### 2026 production reference stacks

| Ngăn xếp | Độ trễ | Giấy phép | Ghi chú |
|-------|---------|---------|-------|
| LiveKit + Deepgram + GPT-4o + Cartesia | 350-500 ms | API thương mại | Mặc định ngành năm 2026 |
| Pipecat + Whisper-streaming + GPT-4o + Kokoro | 500-800 ms | phần lớn mở | Thân thiện tự làm |
| Moshi (song công toàn phần) | 200-300 ms | CC-BY 4.0 | Một mô hình; kiến trúc khác, bài 15 |
| Vapi / Retell (được quản lý) | 300-500 ms | thương mại | Ra mắt nhanh nhất; tùy chỉnh hạn chế |
| Whisper.cpp + llama.cpp + Kokoro-ONNX | ngoại tuyến | mở | Riêng tư / biên |

```figure
v4-voice-latency
```

## Build It

### Step 1: mic capture with chunking (pseudocode)

```python
import sounddevice as sd

def mic_stream(chunk_ms=20, sr=16000):
    q = queue.Queue()
    def cb(indata, frames, time, status):
        q.put(indata.copy().flatten())
    with sd.InputStream(channels=1, samplerate=sr, blocksize=int(sr * chunk_ms/1000), callback=cb):
        while True:
            yield q.get()
```

### Step 2: VAD-gated turn capture

```python
def capture_turn(stream, vad, pre_roll_ms=300, silence_ms=500):
    buf, pre, triggered = [], collections.deque(maxlen=pre_roll_ms // 20), False
    silent = 0
    for chunk in stream:
        pre.append(chunk)
        if vad(chunk):
            if not triggered:
                buf = list(pre)
                triggered = True
            buf.append(chunk)
            silent = 0
        elif triggered:
            silent += 20
            buf.append(chunk)
            if silent >= silence_ms:
                return b"".join(buf)
```

### Step 3: streaming STT → LLM → TTS

```python
async def turn(audio_bytes):
    transcript = await stt.transcribe(audio_bytes)
    async for token in llm.stream(transcript):
        async for audio in tts.stream(token):
            await speaker.play(audio)
```

### Step 4: tool calling inside the LLM loop

```python
tools = [
    {"name": "get_weather", "parameters": {"location": "string"}},
    {"name": "set_timer", "parameters": {"seconds": "int"}},
]

async for chunk in llm.stream(user_text, tools=tools):
    if chunk.type == "tool_call":
        result = dispatch(chunk.name, chunk.args)
        continue_streaming(result)
    if chunk.type == "text":
        await tts.stream(chunk.text)
```

### Step 5: interruption handling

```python
tts_task = asyncio.create_task(tts_loop())
while True:
    chunk = await mic.get()
    if vad(chunk):
        tts_task.cancel()
        await speaker.stop()
        await new_turn()
        break
```

## Use It

Xem `code/main.py` để có một mô phỏng chạy được nối cả bảy thành phần với các mô hình stub, để bạn thấy hình dạng pipeline ngay cả khi không có phần cứng. Với một triển khai thực, thay các stub bằng:

- `silero-vad` (`pip install silero-vad`)
- `deepgram-sdk` hoặc `openai-whisper`
- `openai` (`gpt-4o`) hoặc `anthropic`
- `kokoro` hoặc `cartesia`
- `sounddevice` cho I/O

## Pitfalls

- **Ghi nhật ký PII mãi mãi.** Âm thanh toàn lượt là PII trong hầu hết khu vực pháp lý. Giữ 30 ngày, mã hóa khi lưu trữ.
- **Không chen lời.** Người dùng sẽ ngắt. Trợ lý của bạn phải ngừng nói.
- **TTS chặn.** TTS đồng bộ chặn vòng lặp sự kiện. Dùng bất đồng bộ hoặc một luồng riêng.
- **Không xử lý lỗi gọi công cụ.** Công cụ thất bại. LLM phải nhận lại lỗi + thử lại một lần, rồi suy giảm êm.
- **Các bộ lọc ảo giác quá mức.** Lọc quá mức và trợ lý lặp "Tôi không thể giúp việc đó." Lọc thiếu và nó nói bất kỳ thứ gì. Hiệu chuẩn trên một tập được giữ lại.
- **Không tùy chọn từ đánh thức.** Luôn lắng nghe là một gánh nặng riêng tư. Thêm một cổng từ đánh thức (Porcupine hoặc openWakeWord).

## Ship It

Lưu thành `outputs/skill-voice-assistant-architect.md`. Với ngân sách + quy mô + ngôn ngữ + các ràng buộc tuân thủ, tạo một đặc tả ngăn xếp đầy đủ.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Nó mô phỏng một lượt đầy đủ đầu cuối với các mô-đun stub và in độ trễ theo giai đoạn.
2. **Trung bình.** Thay stub STT bằng một mô hình Whisper thực trên một `.wav` ghi sẵn. Đo WER và độ trễ đầu cuối.
3. **Khó.** Thêm gọi công cụ: triển khai `get_weather` (bất kỳ API nào) và `set_timer`. Định tuyến LLM qua các công cụ và xác minh khi người dùng nói "đặt hẹn giờ 5 phút" thì đúng hàm kích hoạt và lời đáp được nói xác nhận điều đó.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Turn (Lượt) | Một vòng người dùng + trợ lý | Một tiếng nói người dùng giới hạn bằng VAD + một phản hồi LLM-TTS. |
| Barge-in (Chen lời) | Ngắt lời | Người dùng nói trong lúc trợ lý nói; trợ lý dừng. |
| Wake word (Từ đánh thức) | "Này trợ lý" | Bộ phát hiện từ khóa ngắn; Porcupine, Snowboy, openWakeWord. |
| End-pointing (Xác định điểm kết thúc) | Kết thúc lượt | VAD + quyết định im lặng tối thiểu rằng người dùng đã xong. |
| Pre-roll (Đệm trước) | Bộ đệm trước tiếng nói | Giữ 200-400 ms âm thanh trước khi VAD kích hoạt để tránh cắt từ đầu. |
| Tool call (Lời gọi công cụ) | Gọi hàm | LLM phát JSON; runtime điều phối; kết quả đưa trở lại trong vòng lặp. |

## Further Reading

- [LiveKit — voice agent quickstart](https://docs.livekit.io/agents/) — tham chiếu cấp production.
- [Pipecat — voice agent examples](https://github.com/pipecat-ai/pipecat) — framework thân thiện tự làm.
- [OpenAI Realtime API](https://platform.openai.com/docs/guides/realtime) — con đường giọng nói nguyên bản được quản lý.
- [Kyutai Moshi](https://github.com/kyutai-labs/moshi) — tham chiếu song công toàn phần (Bài 15).
- [Porcupine wake-word](https://picovoice.ai/products/porcupine/) — chặn bằng từ đánh thức.
- [Anthropic — tool use guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — gọi hàm LLM.
