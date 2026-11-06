# Voice Activity Detection & Turn-Taking — Silero, Cobra, and the Flush Trick

> Mọi tác tử giọng nói sống còn nhờ hai quyết định: người dùng hiện có đang nói không, và họ đã xong chưa? VAD trả lời câu đầu. Phát hiện lượt (VAD + thời gian duy trì sau im lặng + mô hình điểm kết thúc ngữ nghĩa) trả lời câu thứ hai. Làm sai một trong hai và trợ lý của bạn hoặc cắt lời người dùng hoặc không bao giờ im.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 11 (Real-Time Audio), Phase 6 · 12 (Voice Assistant)
**Time:** ~45 minutes

## The Problem

Ba quyết định riêng biệt một tác tử giọng nói đưa ra trên mỗi khối 20 ms:

1. **Khung này có phải tiếng nói không?** — VAD. Nhị phân, theo khung.
2. **Người dùng đã bắt đầu một phát ngôn mới chưa?** — phát hiện khởi đầu.
3. **Người dùng đã xong chưa?** — xác định điểm kết thúc (kết thúc lượt).

Câu trả lời ngây thơ (ngưỡng năng lượng) thất bại với bất kỳ nhiễu nào — giao thông, bàn phím, tiếng đám đông xôn xao. Câu trả lời năm 2026: Silero VAD (mở, deep learning) + một mô hình phát hiện lượt (xác định điểm kết thúc ngữ nghĩa) + một thời gian duy trì sau im lặng được hiệu chuẩn VAD.

## The Concept

![VAD cascade: energy → Silero → turn-detector → flush trick](../assets/vad-turn-taking.svg)

### The three-tier VAD cascade

**Tầng 1: cổng năng lượng.** Rẻ nhất. Đặt ngưỡng RMS ở -40 dBFS. Lọc sự im lặng rõ ràng nhưng kích hoạt trên bất kỳ nhiễu nào trên ngưỡng.

**Tầng 2: Silero VAD** (2020-2026, MIT). 1M tham số. Được huấn luyện trên 6000+ ngôn ngữ. Chạy trong ~1 ms mỗi khối 30 ms trên một luồng CPU. TPR 87.7% tại FPR 5%. Mặc định mã nguồn mở.

**Tầng 3: bộ phát hiện lượt ngữ nghĩa.** Mô hình phát hiện lượt của LiveKit (2024-2026) hoặc bộ phân loại nhỏ của riêng bạn. Phân biệt "ngừng giữa câu" với "nói xong." Dùng ngữ cảnh ngôn ngữ (ngữ điệu + các từ gần đây), không chỉ im lặng.

### Key parameters and their defaults

- **Ngưỡng.** Silero xuất một xác suất; phân loại tiếng nói tại &gt; 0.5 (mặc định) hoặc &gt; 0.3 (nhạy). Ngưỡng thấp hơn = ít cắt từ đầu hơn, nhiều dương tính giả hơn.
- **Thời lượng tiếng nói tối thiểu.** Từ chối tiếng nói ngắn hơn 250 ms — thường là ho hoặc tiếng ghế.
- **Thời gian duy trì sau im lặng (xác định điểm kết thúc).** Sau khi VAD trở về 0, chờ 500-800 ms trước khi tuyên bố kết thúc lượt. Quá ngắn → ngắt người dùng. Quá dài → cảm giác chậm chạp.
- **Bộ đệm trước.** Giữ 300-500 ms âm thanh trước khi VAD kích hoạt. Ngăn "này" bị cắt.

### The flush trick (Kyutai 2025)

Các mô hình STT luồng có một độ trễ nhìn trước (500 ms cho Kyutai STT-1B, 2.5 s cho STT-2.6B). Thông thường bạn chờ lâu đến vậy sau khi kết thúc tiếng nói để có bản chép lời. Thủ thuật flush: khi VAD báo kết thúc tiếng nói, **gửi một tín hiệu flush đến STT** ép đầu ra ngay lập tức. STT xử lý ở ~4× thời gian thực, nên bộ đệm 500 ms hoàn tất trong ~125 ms.

Đầu cuối: VAD 125 ms + flush STT = độ trễ hội thoại.

### 2026 VAD comparison

| VAD | TPR @ FPR 5% | Độ trễ | Giấy phép |
|-----|--------------|---------|---------|
| WebRTC VAD (Google, 2013) | 50.0% | 30 ms | BSD |
| Silero VAD (2020-2026) | 87.7% | ~1 ms | MIT |
| Cobra VAD (Picovoice) | 98.9% | ~1 ms | thương mại |
| Phân đoạn pyannote | 95% | ~10 ms | gần MIT |

Silero là mặc định đúng. Cobra là nâng cấp tuân thủ / accuracy. VAD chỉ năng lượng không có chỗ trong production năm 2026.

```figure
sp-vad-cascade
```

## Build It

### Step 1: the energy gate

```python
def energy_vad(chunk, threshold_dbfs=-40.0):
    rms = (sum(x * x for x in chunk) / len(chunk)) ** 0.5
    dbfs = 20.0 * math.log10(max(rms, 1e-10))
    return dbfs > threshold_dbfs
```

### Step 2: Silero VAD in Python

```python
from silero_vad import load_silero_vad, get_speech_timestamps

vad = load_silero_vad()
audio = torch.tensor(waveform_16k, dtype=torch.float32)
segments = get_speech_timestamps(
    audio, vad, sampling_rate=16000,
    threshold=0.5,
    min_speech_duration_ms=250,
    min_silence_duration_ms=500,
    speech_pad_ms=300,
)
for s in segments:
    print(f"{s['start']/16000:.2f}s - {s['end']/16000:.2f}s")
```

### Step 3: turn-end state machine

```python
class TurnDetector:
    def __init__(self, silence_hangover_ms=500, min_speech_ms=250):
        self.state = "idle"
        self.speech_ms = 0
        self.silence_ms = 0
        self.silence_hangover_ms = silence_hangover_ms
        self.min_speech_ms = min_speech_ms

    def update(self, is_speech, chunk_ms=20):
        if is_speech:
            self.speech_ms += chunk_ms
            self.silence_ms = 0
            if self.state == "idle" and self.speech_ms >= self.min_speech_ms:
                self.state = "speaking"
                return "START"
        else:
            self.silence_ms += chunk_ms
            if self.state == "speaking" and self.silence_ms >= self.silence_hangover_ms:
                self.state = "idle"
                self.speech_ms = 0
                return "END"
        return None
```

### Step 4: the flush trick skeleton

```python
def flush_on_end(stt_client, audio_buffer):
    stt_client.send_audio(audio_buffer)
    stt_client.send_flush()
    return stt_client.recv_transcript(timeout_ms=150)
```

STT (Kyutai, Deepgram, AssemblyAI) phải hỗ trợ flush để điều này hoạt động. Whisper streaming không hỗ trợ — nó dựa trên khối và luôn chờ các khối.

## Use It

| Tình huống | Lựa chọn VAD |
|-----------|-----------|
| Mở, nhanh, tổng quát | Silero VAD |
| Trung tâm cuộc gọi thương mại | Cobra VAD |
| Trên thiết bị (điện thoại) | Silero VAD ONNX |
| Nghiên cứu / phân đoạn người nói | Phân đoạn pyannote |
| Dự phòng không phụ thuộc | WebRTC VAD (cũ) |
| Cần chất lượng kết thúc lượt | Silero + LiveKit turn-detector xếp tầng |

Quy tắc kinh nghiệm: không bao giờ phát hành VAD chỉ năng lượng trừ khi bạn thực sự không có lựa chọn khác.

## Pitfalls

- **Ngưỡng cố định.** Hoạt động khi yên tĩnh, thất bại khi ồn. Hoặc hiệu chuẩn trên thiết bị hoặc chuyển sang Silero.
- **Thời gian duy trì sau im lặng quá ngắn.** Tác tử ngắt giữa câu. 500-800 ms là điểm cân bằng tốt cho tiếng nói hội thoại.
- **Thời gian duy trì quá dài.** Cảm giác chậm chạp. Kiểm thử A/B với người dùng đích.
- **Không bộ đệm trước.** Mất 200-300 ms đầu của âm thanh người dùng. Luôn giữ một bộ đệm trước cuốn chiếu.
- **Bỏ qua xác định điểm kết thúc ngữ nghĩa.** "Ừm, để tôi nghĩ..." chứa các khoảng dừng dài. Người dùng ghét bị cắt ngang suy nghĩ. Dùng turn-detector của LiveKit hoặc tương tự.

## Ship It

Lưu thành `outputs/skill-vad-tuner.md`. Chọn mô hình VAD, ngưỡng, thời gian duy trì, đệm trước và chiến lược phát hiện lượt cho một khối lượng công việc.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Nó mô phỏng một chuỗi tiếng nói + im lặng + tiếng nói + các tiếng ho và kiểm thử ba tầng VAD.
2. **Trung bình.** Cài `silero-vad`, xử lý một bản ghi 5 phút, tinh chỉnh ngưỡng để giảm thiểu cả cắt từ đầu và kích hoạt sai. Báo cáo precision/recall.
3. **Khó.** Xây dựng một bộ phát hiện lượt nhỏ: Silero VAD + một MLP 3 tầng trên embedding của 10 từ cuối (dùng sentence-transformers). Huấn luyện trên một tập dữ liệu kết thúc lượt được gán nhãn bằng tay. Thắng chỉ Silero 10% F1.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| VAD | Bộ phát hiện giọng nói | Nhị phân theo khung: đây có phải tiếng nói không? |
| Turn detection (Phát hiện lượt) | Xác định điểm kết thúc | VAD + thời gian duy trì sau im lặng + điểm kết thúc ngữ nghĩa. |
| Silence hangover (Thời gian duy trì sau im lặng) | Chờ sau tiếng nói | Thời gian chờ trước khi tuyên bố kết thúc lượt; 500-800 ms. |
| Pre-roll (Đệm trước) | Bộ đệm trước tiếng nói | Giữ 300-500 ms âm thanh trước khi VAD kích hoạt. |
| Flush trick (Thủ thuật flush) | Mẹo Kyutai | VAD → flush-STT → độ trễ 125 ms thay vì 500 ms. |
| Semantic endpoint (Điểm kết thúc ngữ nghĩa) | "Họ có định dừng không?" | Bộ phân loại ML nhìn vào các từ, không chỉ sự im lặng. |
| TPR @ FPR 5% | Điểm ROC | Benchmark VAD tiêu chuẩn; 87.7% cho Silero, 50% WebRTC. |

## Further Reading

- [Silero VAD](https://github.com/snakers4/silero-vad) — VAD mở tham chiếu.
- [Picovoice Cobra VAD](https://picovoice.ai/products/voice/voice-activity-detection/) — dẫn đầu accuracy thương mại.
- [Kyutai — Unmute + flush trick](https://kyutai.org/stt) — thủ thuật kỹ thuật dưới 200 ms.
- [LiveKit — turn detection](https://docs.livekit.io/agents/logic/turns/) — xác định điểm kết thúc ngữ nghĩa trong production.
- [WebRTC VAD](https://webrtc.googlesource.com/src/) — baseline cũ.
- [pyannote segmentation](https://github.com/pyannote/pyannote-audio) — phân đoạn cấp phân đoạn người nói.
