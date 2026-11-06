# Real-Time Audio Processing

> Các pipeline batch xử lý một file. Các pipeline thời gian thực xử lý 20 mili giây tiếp theo trước khi 20 mili giây kế tiếp đến. Mọi AI hội thoại, phòng thu phát sóng và bot điện thoại sống còn nhờ ngân sách độ trễ này.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 6 · 04 (ASR), Phase 6 · 07 (TTS)
**Time:** ~75 minutes

## The Problem

Bạn muốn một trợ lý giọng nói có cảm giác sống động. Độ trễ chuyển lượt hội thoại con người là ~230 ms (từ im lặng đến phản hồi). Bất kỳ mức nào trên 500 ms có cảm giác máy móc; trên 1500 ms có cảm giác hỏng. Ngân sách cho một vòng lặp đầy đủ **nghe → hiểu → phản hồi → nói** năm 2026 là:

| Giai đoạn | Ngân sách |
|-------|--------|
| Micro → bộ đệm | 20 ms |
| VAD | 10 ms |
| ASR (truyền luồng) | 150 ms |
| LLM (token đầu) | 100 ms |
| TTS (khối đầu) | 100 ms |
| Kết xuất → loa | 20 ms |
| **Tổng** | **~400 ms** |

Moshi (Kyutai, 2024) đạt 200 ms song công toàn phần. GPT-4o-realtime (2024) đạt ~320 ms. Các pipeline nối tầng năm 2022 được phát hành ở 2500 ms. Cải thiện 10× đến từ ba kỹ thuật: (1) truyền luồng ở mọi nơi, (2) pipeline bất đồng bộ với các kết quả từng phần, (3) sinh có thể ngắt.

## The Concept

![Streaming audio pipeline with ring buffer, VAD gate, interruption](../assets/real-time.svg)

**Khung / khối / cửa sổ.** Âm thanh thời gian thực chảy dưới dạng các khối kích thước cố định. Lựa chọn phổ biến: 20 ms (320 mẫu ở 16 kHz). Mọi thứ phía sau phải theo kịp nhịp này.

**Bộ đệm vòng.** Bộ đệm tròn kích thước cố định. Luồng sản xuất ghi các khung mới, luồng tiêu thụ đọc. Ngăn cấp phát trong đường xử lý nóng. Kích thước ≈ độ trễ tối đa × tần số lấy mẫu; một vòng 2 giây 16 kHz = 32,000 mẫu.

**VAD (Phát hiện Hoạt động Giọng nói).** Chặn công việc phía sau khi không ai nói. Silero VAD 4.0 (2024) chạy <1 ms mỗi khung 30 ms trên CPU. `webrtcvad` là phương án cũ hơn.

**ASR luồng.** Các mô hình phát các bản chép lời từng phần khi âm thanh đến. Parakeet-CTC-0.6B ở chế độ luồng (NeMo, 2024) đạt WER 2–5% ở độ trễ 320 ms. Whisper-Streaming (Macháček và cộng sự, 2023) chia khối Whisper để gần truyền luồng ở độ trễ ~2 s.

**Ngắt lời.** Khi người dùng nói trong lúc trợ lý đang nói, bạn phải (a) phát hiện việc chen lời, (b) dừng TTS, (c) loại bỏ đầu ra LLM còn lại. Tất cả trong 100 ms, nếu không người dùng cảm nhận trợ lý điếc.

**Truyền tải WebRTC Opus.** Các khung 20 ms, 48 kHz, bitrate thích nghi 8–128 kbps. Tiêu chuẩn cho trình duyệt và di động. LiveKit, Daily.co, Pion là các ngăn xếp năm 2026 để xây dựng ứng dụng giọng nói.

**Bộ đệm jitter.** Các gói mạng đến sai thứ tự / muộn. Bộ đệm jitter sắp xếp lại và làm mượt; quá nhỏ → các khoảng trống nghe được, quá lớn → độ trễ. Điển hình 60–80 ms.

### Common gotchas

- **Tranh chấp luồng.** GIL của Python + các mô hình nặng có thể làm luồng âm thanh bị đói. Dùng một thư viện âm thanh callback C (sounddevice, PortAudio) và giữ Python khỏi đường xử lý nóng.
- **Độ trễ chuyển đổi tần số lấy mẫu.** Lấy mẫu lại bên trong pipeline thêm 5–20 ms. Hoặc lấy mẫu lại từ đầu hoặc dùng một bộ lấy mẫu lại không độ trễ (PolyPhase, `soxr_hq`).
- **Mồi TTS.** Ngay cả TTS nhanh như Kokoro có khởi động 100–200 ms ở yêu cầu đầu. Lưu đệm mô hình + làm nóng bằng một lượt chạy giả trước lượt thực đầu tiên.
- **Khử tiếng vọng.** Không có AEC, đầu ra TTS đi lại vào micro và kích hoạt ASR trên giọng của chính bot. WebRTC AEC3 là mặc định mã nguồn mở.

```figure
nyquist-aliasing
```

## Build It

### Step 1: ring buffer

```python
import collections

class RingBuffer:
    def __init__(self, capacity):
        self.buf = collections.deque(maxlen=capacity)
    def write(self, frame):
        self.buf.extend(frame)
    def read(self, n):
        return [self.buf.popleft() for _ in range(min(n, len(self.buf)))]
    def level(self):
        return len(self.buf)
```

Dung lượng quyết định độ trễ đệm tối đa. 32,000 mẫu ở 16 kHz = 2 s.

### Step 2: VAD gate

```python
def simple_energy_vad(frame, threshold=0.01):
    return sum(x * x for x in frame) / len(frame) > threshold ** 2
```

Thay bằng Silero VAD trong production:

```python
import torch
vad, _ = torch.hub.load("snakers4/silero-vad", "silero_vad")
is_speech = vad(torch.tensor(frame), 16000).item() > 0.5
```

### Step 3: streaming ASR

```python
# Parakeet-CTC-0.6B streaming via NeMo
from nemo.collections.asr.models import EncDecCTCModelBPE
asr = EncDecCTCModelBPE.from_pretrained("nvidia/parakeet-ctc-0.6b")
# chunk_ms=320 ms, look_ahead_ms=80 ms
for chunk in audio_stream():
    partial_text = asr.transcribe_streaming(chunk)
    print(partial_text, end="\r")
```

### Step 4: interruption handler

```python
class Dialog:
    def __init__(self):
        self.tts_task = None

    def on_user_speech(self, frame):
        if self.tts_task and not self.tts_task.done():
            self.tts_task.cancel()   # barge-in
        # then feed to streaming ASR

    def on_final_user_utterance(self, text):
        self.tts_task = asyncio.create_task(self.reply(text))

    async def reply(self, text):
        async for tts_chunk in llm_then_tts(text):
            speaker.write(tts_chunk)
```

Dựa vào I/O bất đồng bộ và truyền luồng TTS có thể hủy. WebRTC peerconnection.stop() trên track âm thanh là cách kinh điển.

## Use It

Ngăn xếp năm 2026:

| Tầng | Chọn |
|-------|------|
| Truyền tải | LiveKit (WebRTC) hoặc Pion (Go) |
| VAD | Silero VAD 4.0 |
| ASR luồng | Parakeet-CTC-0.6B hoặc Whisper-Streaming |
| Token đầu LLM | Groq, Cerebras, vLLM-streaming |
| TTS luồng | Kokoro hoặc ElevenLabs Turbo v2.5 |
| Khử tiếng vọng | WebRTC AEC3 |
| Nguyên bản đầu cuối | OpenAI Realtime API hoặc Moshi |

## Pitfalls

- **Đệm 500 ms để an toàn.** Bộ đệm *là* mức sàn độ trễ của bạn. Thu nhỏ nó.
- **Không ghim các luồng.** Callback âm thanh trên một luồng ưu tiên thấp hơn UI = trục trặc khi có tải.
- **Các khối TTS quá nhỏ.** Các khối dưới 200 ms làm các tạo tác vocoder nghe được. Các khối 320 ms là điểm cân bằng tốt.
- **Không bộ đệm jitter.** Các mạng thực có jitter; không làm mượt bạn nhận các tiếng bụp.
- **Xử lý lỗi một lần.** Các pipeline âm thanh phải chống sập. Một ngoại lệ giết phiên.

## Ship It

Lưu thành `outputs/skill-realtime-designer.md`. Thiết kế một pipeline âm thanh thời gian thực với các ngân sách độ trễ cụ thể theo giai đoạn.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Mô phỏng một bộ đệm vòng + VAD năng lượng; in các độ trễ giai đoạn cho một luồng giả 10 giây.
2. **Trung bình.** Dùng `sounddevice`, xây dựng một vòng lặp truyền qua xử lý micro của bạn theo các khung 20 ms và in trạng thái VAD tại mỗi khung.
3. **Khó.** Xây dựng một kiểm thử tiếng vọng song công toàn phần bằng `aiortc`: trình duyệt → WebRTC → Python → WebRTC → trình duyệt. Đo độ trễ đầu cuối bằng một xung 1 kHz.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Ring buffer (Bộ đệm vòng) | Hàng đợi tròn | FIFO kích thước cố định, không khóa (hoặc khóa SPSC) cho các khung âm thanh. |
| VAD | Cổng im lặng | Mô hình hoặc heuristic đánh dấu tiếng nói so với phi tiếng nói. |
| Streaming ASR (ASR luồng) | STT thời gian thực | Phát văn bản từng phần khi âm thanh đến; nhìn trước bị chặn. |
| Jitter buffer (Bộ đệm jitter) | Bộ làm mượt mạng | Hàng đợi sắp xếp lại các gói sai thứ tự; điển hình 60–80 ms. |
| AEC | Khử tiếng vọng | Trừ đường phản hồi từ loa đến micro. |
| Barge-in (Chen lời) | Người dùng ngắt | Hệ thống phát hiện tiếng nói người dùng giữa TTS; phải hủy phát lại. |
| Full duplex (Song công toàn phần) | Đồng thời cả hai hướng | Người dùng và bot có thể nói cùng lúc; Moshi là song công toàn phần. |

## Further Reading

- [Macháček et al. (2023). Whisper-Streaming](https://arxiv.org/abs/2307.14743) — Whisper gần truyền luồng chia khối.
- [Kyutai (2024). Moshi](https://kyutai.org/Moshi.pdf) — độ trễ song công toàn phần 200 ms.
- [LiveKit Agents framework (2024)](https://docs.livekit.io/agents/) — điều phối tác tử âm thanh production.
- [Silero VAD repo](https://github.com/snakers4/silero-vad) — VAD dưới 1 ms, Apache 2.0.
- [WebRTC AEC3 paper](https://webrtc.googlesource.com/src/+/main/modules/audio_processing/aec3/) — khử tiếng vọng dưới mã nguồn mở.
