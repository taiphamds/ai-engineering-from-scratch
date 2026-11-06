# Audio Transformers — Whisper Architecture

> Âm thanh là một hình ảnh của tần số theo thời gian. Whisper là một ViT ăn phổ đồ mel và nói đáp lại.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 08 (Encoder-Decoder), Phase 7 · 09 (ViT)
**Time:** ~45 minutes

## The Problem

Trước Whisper (OpenAI, Radford và cộng sự 2022), nhận dạng tiếng nói tự động (ASR) tiên tiến nhất nghĩa là wav2vec 2.0 và HuBERT — các bộ trích xuất đặc trưng tự giám sát cộng một head được fine-tune. Chất lượng cao, các pipeline dữ liệu tốn kém, mong manh theo lĩnh vực. Nhận dạng tiếng nói đa ngôn ngữ cần các mô hình riêng cho mỗi họ ngôn ngữ.

Whisper đặt ba cược:

1. **Huấn luyện trên mọi thứ.** 680,000 giờ âm thanh nhãn yếu được thu thập từ internet trên 97 ngôn ngữ. Không ngữ liệu học thuật sạch. Không nhãn âm vị.
2. **Một mô hình đa tác vụ.** Một decoder được huấn luyện kết hợp trên chép lời, dịch, phát hiện hoạt động giọng nói, nhận dạng ngôn ngữ và gắn dấu thời gian qua các token tác vụ.
3. **Transformer encoder-decoder tiêu chuẩn.** Encoder tiêu thụ phổ đồ log-mel. Decoder tạo token văn bản tự hồi quy. Không vocoder, không CTC, không HMM.

Kết quả: Whisper large-v3 vững trước các giọng, nhiễu và các ngôn ngữ không có dữ liệu có nhãn sạch nào. Nó là frontend tiếng nói mặc định cho mọi trợ lý giọng nói mã nguồn mở và hầu hết các trợ lý thương mại năm 2026.

## The Concept

![Whisper pipeline: audio → mel → encoder → decoder → text](../assets/whisper.svg)

### Step 1 — resample + window

Âm thanh ở 16 kHz. Cắt/đệm đến 30 giây. Tính phổ đồ log-mel: 80 bin mel, stride 10 ms → ~3,000 khung × 80 đặc trưng. Đây là "ảnh đầu vào" Whisper thấy.

### Step 2 — convolutional stem

Hai tầng Conv1D với kernel 3 và stride 2 giảm 3,000 khung xuống 1,500. Giảm nửa độ dài chuỗi mà không thêm nhiều tham số.

### Step 3 — encoder

Một encoder transformer 24 tầng (cho large) trên 1,500 bước thời gian. Mã hóa vị trí hình sin, self-attention, FFN GELU. Tạo các trạng thái ẩn 1,500 × 1,280.

### Step 4 — decoder

Một decoder transformer 24 tầng. Nó tự hồi quy tạo các token từ một từ vựng BPE là tập bao của từ vựng GPT-2 với một vài token đặc biệt riêng âm thanh.

### Step 5 — task tokens

Prompt decoder bắt đầu bằng các token điều khiển cho mô hình biết làm gì:

```
<|startoftranscript|>  <|en|>  <|transcribe|>  <|0.00|>
```

hoặc

```
<|startoftranscript|>  <|fr|>  <|translate|>   <|0.00|>
```

Mô hình được huấn luyện trên quy ước này. Bạn điều khiển tác vụ bằng tiền tố. Tương đương tinh chỉnh theo chỉ dẫn năm 2026, nhưng áp dụng cho tiếng nói.

### Step 6 — output

Beam search (độ rộng 5) với một ngưỡng log xác suất. Các dấu thời gian được dự đoán mỗi 0.02 giây âm thanh khi không có token `<|notimestamps|>`.

### Whisper sizes

| Mô hình | Tham số | Tầng | d_model | Head | VRAM (fp16) |
|-------|--------|--------|---------|-------|-------------|
| Tiny | 39M | 4 | 384 | 6 | ~1 GB |
| Base | 74M | 6 | 512 | 8 | ~1 GB |
| Small | 244M | 12 | 768 | 12 | ~2 GB |
| Medium | 769M | 24 | 1024 | 16 | ~5 GB |
| Large | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3 | 1550M | 32 | 1280 | 20 | ~10 GB |
| Large-v3-turbo | 809M | 32 | 1280 | 20 | ~6 GB (decoder 4 tầng) |

Large-v3-turbo (2024) cắt decoder từ 32 tầng xuống 4. Giải mã nhanh hơn 8× với suy giảm <1 điểm WER. Việc mở khóa tốc độ giải mã đó là lý do Whisper-turbo là mặc định cho các tác tử giọng nói thời gian thực năm 2026.

### What Whisper does not do

- Không phân đoạn người nói (ai đang nói). Ghép với pyannote cho việc đó.
- Không truyền luồng thời gian thực nguyên bản — cửa sổ 30 giây cố định. Các lớp bọc hiện đại (`faster-whisper`, `WhisperX`) gắn thêm truyền luồng qua VAD + chồng lấn.
- Không ngữ cảnh dạng dài vượt 30 s nếu không chia khối bên ngoài. Hoạt động tốt trong thực tế vì tiếng nói con người hiếm khi cần ngữ cảnh xa để chép lời.

### 2026 landscape

| Tác vụ | Mô hình | Ghi chú |
|------|-------|-------|
| ASR tiếng Anh | Whisper-turbo, Moonshine | Moonshine nhanh hơn 4× trên biên |
| ASR đa ngôn ngữ | Whisper-large-v3 | 97 ngôn ngữ |
| ASR luồng | faster-whisper + VAD | Có thể đạt các mục tiêu độ trễ 150 ms |
| TTS | Piper, XTTS-v2, Kokoro | Mẫu encoder-decoder, nhưng có hình dạng Whisper |
| Âm thanh + ngôn ngữ | AudioLM, SeamlessM4T | Token văn bản + token âm thanh trong một transformer |

```figure
n5-mel-decode
```

## Build It

Xem `code/main.py`. Chúng ta không huấn luyện Whisper — chúng ta xây dựng pipeline phổ đồ log-mel + bộ định dạng prompt token tác vụ. Đó là những phần bạn thực sự chạm trong production.

### Step 1: synthesize audio

Sinh một sóng sin 1 giây tại 440 Hz được lấy mẫu ở 16 kHz. 16,000 mẫu.

### Step 2: log-mel spectrogram (simplified)

Phổ đồ mel đầy đủ cần FFT. Chúng ta làm một phiên bản chia khung + năng lượng theo khung được đơn giản hóa cho thấy pipeline không cần `librosa`:

```python
def frame_signal(x, frame_size=400, hop=160):
    frames = []
    for start in range(0, len(x) - frame_size + 1, hop):
        frames.append(x[start:start + frame_size])
    return frames
```

Khung = 25 ms, bước nhảy = 10 ms. Khớp cách áp cửa sổ của Whisper. Năng lượng theo khung thay cho các bin mel vì mục đích sư phạm.

### Step 3: pad to 30 s

Whisper luôn xử lý các khối 30 giây. Đệm (hoặc cắt) phổ đồ đến 3,000 khung.

### Step 4: build the prompt tokens

```python
def whisper_prompt(lang="en", task="transcribe", timestamps=True):
    tokens = ["<|startoftranscript|>", f"<|{lang}|>", f"<|{task}|>"]
    if not timestamps:
        tokens.append("<|notimestamps|>")
    return tokens
```

Đó là toàn bộ bề mặt điều khiển tác vụ. Một tiền tố 4 token.

## Use It

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("meeting.wav", language="en", task="transcribe")
print(result["text"])
print(result["segments"][0]["start"], result["segments"][0]["end"])
```

Nhanh hơn, tương thích OpenAI:

```python
from faster_whisper import WhisperModel
model = WhisperModel("large-v3-turbo", compute_type="int8_float16")
segments, info = model.transcribe("meeting.wav", vad_filter=True)
for s in segments:
    print(f"{s.start:.2f} - {s.end:.2f}: {s.text}")
```

**Khi nào chọn Whisper năm 2026:**

- ASR đa ngôn ngữ với một mô hình.
- Chép lời vững chắc cho âm thanh nhiễu, đa dạng.
- ASR nghiên cứu / nguyên mẫu — điểm khởi đầu nhanh nhất.

**Khi nào chọn thứ khác:**

- Truyền luồng độ trễ cực thấp trên biên — Moonshine thắng Whisper ở chất lượng tương ứng.
- AI hội thoại thời gian thực cần <200 ms — ASR luồng chuyên dụng.
- Phân đoạn người nói — Whisper không làm việc này; gắn thêm pyannote.

## Ship It

Xem `outputs/skill-asr-configurator.md`. Skill chọn một mô hình ASR, các tham số giải mã và pipeline tiền xử lý cho một ứng dụng tiếng nói mới.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Xác nhận số khung cho một tín hiệu 1 giây ở 16 kHz với bước nhảy 10 ms là ~100 khung. Với 30 giây: ~3,000 khung.
2. **Trung bình.** Xây dựng phổ đồ log-mel đầy đủ bằng `numpy.fft`. Xác minh 80 bin mel khớp `librosa.feature.melspectrogram(n_mels=80)` trong sai số số học.
3. **Khó.** Triển khai suy luận luồng: chia khối âm thanh thành các cửa sổ 10 s có chồng lấn 2 s, chạy Whisper trên mỗi khối, gộp các bản chép lời. Đo tỷ lệ lỗi từ so với một lượt trên một mẫu podcast 5 phút.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Mel spectrogram (Phổ đồ Mel) | "Ảnh âm thanh" | Biểu diễn 2D: các bin tần số trên một trục, các khung thời gian trên trục còn lại; năng lượng thang log mỗi ô. |
| Log-mel | "Điều Whisper thấy" | Phổ đồ mel được truyền qua log; xấp xỉ tri giác độ to của con người. |
| Frame (Khung) | "Một lát thời gian" | Một cửa sổ mẫu 25 ms; chồng lấn ở stride 10 ms. |
| Task token (Token tác vụ) | "Tiền tố prompt cho tiếng nói" | Các token đặc biệt như `<\|transcribe\|>` / `<\|translate\|>` trong prompt decoder. |
| Voice activity detection (VAD) (Phát hiện hoạt động giọng nói) | "Tìm tiếng nói" | Cổng loại im lặng trước ASR; giảm chi phí rất lớn. |
| CTC | "Connectionist Temporal Classification" | Loss ASR cổ điển cho huấn luyện không căn chỉnh; Whisper KHÔNG dùng nó. |
| Whisper-turbo | "Decoder nhỏ, encoder đầy đủ" | Encoder large-v3 + decoder 4 tầng; giải mã nhanh hơn 8×. |
| Faster-whisper | "Lớp bọc production" | Tái triển khai CTranslate2; lượng tử hóa int8; nhanh hơn tham chiếu của OpenAI 4×. |

## Further Reading

- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) — bài báo Whisper.
- [OpenAI Whisper repo](https://github.com/openai/whisper) — mã tham chiếu + trọng số mô hình. Đọc `whisper/model.py` để thấy phần đầu Conv1D + encoder + decoder từ trên xuống trong ~400 dòng.
- [OpenAI Whisper — `whisper/decoding.py`](https://github.com/openai/whisper/blob/main/whisper/decoding.py) — logic beam search + token tác vụ được mô tả ở Bước 5–6 ở đây; 500 dòng, hoàn toàn dễ đọc.
- [Baevski et al. (2020). wav2vec 2.0: A Framework for Self-Supervised Learning of Speech Representations](https://arxiv.org/abs/2006.11477) — tiền thân; vẫn là các đặc trưng SOTA trong một số thiết lập.
- [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) — lớp bọc production, nhanh hơn tham chiếu 4×.
- [Jia et al. (2024). Moonshine: Speech Recognition for Live Transcription and Voice Commands](https://arxiv.org/abs/2410.15608) — ASR thân thiện biên năm 2024, hình dạng Whisper nhưng nhỏ hơn.
- [HuggingFace blog — "Fine-Tune Whisper For Multilingual ASR with 🤗 Transformers"](https://huggingface.co/blog/fine-tune-whisper) — công thức fine-tuning kinh điển bao gồm bộ tiền xử lý phổ đồ mel và xử lý token-dấu thời gian.
- [HuggingFace `modeling_whisper.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/whisper/modeling_whisper.py) — triển khai đầy đủ (encoder, decoder, cross-attention, sinh) phản chiếu sơ đồ kiến trúc của bài học.
