# Text-to-Speech (TTS) — From Tacotron to F5 and Kokoro

> ASR đảo tiếng nói thành văn bản; TTS đảo văn bản thành tiếng nói. Ngăn xếp năm 2026 có ba phần: văn bản → token, token → mel, mel → dạng sóng. Mỗi phần có một mô hình mặc định vừa trong máy tính xách tay.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 09 (Seq2Seq), Phase 7 · 05 (Full Transformer)
**Time:** ~75 minutes

## The Problem

Bạn có một chuỗi: "Vui lòng nhắc tôi tưới cây lúc 6 giờ tối." Bạn cần một đoạn âm thanh 3 giây nghe tự nhiên, có ngữ điệu đúng (ngắt, trọng âm), phát âm "plants" với đúng nguyên âm và chạy trong dưới 300 ms trên CPU cho một trợ lý giọng nói trực tiếp. Bạn cũng cần hoán đổi giọng, xử lý đầu vào chuyển mã ngôn ngữ ("nhắc tôi lúc 6 giờ tối, daijoubu?") và không làm mình xấu hổ với tên riêng.

Các pipeline TTS hiện đại trông như thế này:

1. **Frontend văn bản.** Chuẩn hóa văn bản (ngày, số, email), chuyển thành âm vị hoặc token từ con, dự đoán các đặc trưng ngữ điệu.
2. **Mô hình âm học.** Văn bản → phổ đồ mel. Tacotron 2 (2017), FastSpeech 2 (2020), VITS (2021), F5-TTS (2024), Kokoro (2024).
3. **Vocoder.** Mel → dạng sóng. WaveNet (2016), WaveRNN, HiFi-GAN (2020), BigVGAN (2022), các vocoder codec nơ-ron từ 2024+.

Năm 2026 sự phân tách âm học + vocoder mờ đi với các mô hình diffusion và flow-matching đầu cuối. Nhưng mô hình tư duy ba phần vẫn đúng để gỡ lỗi.

## The Concept

![Tacotron, FastSpeech, VITS, F5/Kokoro side-by-side](../assets/tts.svg)

**Tacotron 2 (2017).** Seq2seq: embedding ký tự → encoder BiLSTM → attention nhạy vị trí → decoder LSTM tự hồi quy phát các khung mel. Chậm (AR), chập chờn trên văn bản dài. Vẫn được trích dẫn làm baseline.

**FastSpeech 2 (2020).** Không tự hồi quy. Bộ dự đoán thời lượng xuất số khung mel mỗi âm vị nhận. 1 lượt, nhanh hơn Tacotron 10×. Mất một phần tự nhiên (căn chỉnh đơn điệu) nhưng được phát hành khắp nơi.

**VITS (2021).** Huấn luyện kết hợp encoder + thời lượng dựa trên flow + vocoder HiFi-GAN đầu cuối bằng suy luận biến phân. Chất lượng cao, một mô hình duy nhất. TTS mã nguồn mở chủ đạo 2022–2024. Các biến thể: YourTTS (zero-shot nhiều người nói), XTTS v2 (2024, Coqui).

**F5-TTS (2024).** Diffusion transformer trên flow matching. Ngữ điệu tự nhiên, nhân bản giọng nói zero-shot với 5 giây âm thanh tham chiếu. Đứng đầu các bảng xếp hạng TTS mã nguồn mở năm 2026. 335M tham số.

**Kokoro (2024).** Nhỏ (82M), chạy được trên CPU, TTS tiếng Anh hàng đầu cho sử dụng thời gian thực. Từ vựng đóng chỉ tiếng Anh, apache-2.0.

**OpenAI TTS-1-HD, ElevenLabs v2.5, Google Chirp-3.** Tiên tiến nhất thương mại. Các nhãn cảm xúc ("[whispered]", "[laughing]") và giọng nhân vật của ElevenLabs v2.5 thống trị sản xuất sách nói năm 2026.

### Vocoder evolution

| Thời kỳ | Vocoder | Độ trễ | Chất lượng |
|-----|---------|---------|---------|
| 2016 | WaveNet | chỉ ngoại tuyến | SOTA khi phát hành |
| 2018 | WaveRNN | ~thời gian thực | tốt |
| 2020 | HiFi-GAN | 100× thời gian thực | gần con người |
| 2022 | BigVGAN | 50× thời gian thực | khái quát giữa người nói/ngôn ngữ |
| 2024 | SNAC, DAC (codec nơ-ron) | tích hợp với các mô hình AR | token rời rạc, hiệu quả bit |

Đến năm 2026 hầu hết các mô hình "TTS" là đầu cuối từ văn bản đến dạng sóng; phổ đồ mel là một biểu diễn nội bộ.

### Evaluation

- **MOS (Điểm Ý kiến Trung bình).** Thang 1–5, thu thập từ cộng đồng. Vẫn là tiêu chuẩn vàng; chậm đến đau đớn.
- **CMOS (MOS So sánh).** Ưu tiên A-so-với-B. Các khoảng tin cậy hẹp hơn cho mỗi chú giải.
- **UTMOS, DNSMOS.** Các bộ dự đoán MOS nơ-ron không tham chiếu. Được dùng cho các bảng xếp hạng.
- **CER (Tỷ lệ Lỗi Ký tự) qua ASR.** Chạy đầu ra TTS qua Whisper, tính CER so với văn bản đầu vào. Đại diện cho tính dễ hiểu.
- **SECS (Speaker Embedding Cosine Similarity).** Chất lượng nhân bản giọng nói.

Các con số năm 2026 trên LibriTTS test-clean:

| Mô hình | UTMOS | CER (qua Whisper) | Kích thước |
|-------|-------|-------------------|------|
| Ground truth | 4.08 | 1.2% | — |
| F5-TTS | 3.95 | 2.1% | 335M |
| XTTS v2 | 3.81 | 3.5% | 470M |
| VITS | 3.62 | 3.1% | 25M |
| Kokoro v0.19 | 3.87 | 1.8% | 82M |
| Parler-TTS Large | 3.76 | 2.8% | 2.3B |

```figure
sp-tts-stack
```

## Build It

### Step 1: phonemize input

```python
from phonemizer import phonemize
ph = phonemize("Hello world", language="en-us", backend="espeak")
# 'həloʊ wɜːld'
```

Âm vị là cây cầu phổ dụng. Tránh đưa văn bản thô vào bất kỳ thứ gì dưới chất lượng cấp VITS.

### Step 2: run Kokoro (2026 CPU default)

```python
from kokoro import KPipeline
tts = KPipeline(lang_code="a")  # "a" = American English
audio, sr = tts("Please remind me to water the plants at 6 pm.", voice="af_bella")
# audio: float32 tensor, sr=24000
```

Chạy ngoại tuyến, một file duy nhất, 82M tham số.

### Step 3: run F5-TTS with voice cloning

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="my_voice_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please remind me to water the plants.",
)
```

Truyền một đoạn tham chiếu 5 giây + bản chép lời của nó; F5 nhân bản ngữ điệu và âm sắc.

### Step 4: HiFi-GAN vocoder from scratch

Quá lớn để vừa trong một script hướng dẫn, nhưng hình dạng là:

```python
class HiFiGAN(nn.Module):
    def __init__(self, mel_channels=80, upsample_rates=[8, 8, 2, 2]):
        super().__init__()
        # 4 upsample blocks, total 256x to go from mel-rate to audio-rate
        ...
    def forward(self, mel):
        return self.blocks(mel)  # -> waveform
```

Huấn luyện: đối kháng (bộ phân biệt trên các cửa sổ ngắn) + loss tái tạo phổ đồ mel + loss khớp đặc trưng. Đã phổ thông hóa — dùng các checkpoint được tiền huấn luyện từ kho `hifi-gan` hoặc nvidia-NeMo.

### Step 5: the full pipeline (pseudocode)

```python
text = "Please remind me at 6 pm."
phones = phonemize(text)
mel = acoustic_model(phones, speaker=alice)      # [T, 80]
wav = vocoder(mel)                                # [T * 256]
soundfile.write("out.wav", wav, 24000)
```

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Trợ lý giọng nói tiếng Anh thời gian thực | Kokoro (CPU) hoặc XTTS v2 (GPU) |
| Nhân bản giọng nói từ tham chiếu 5 s | F5-TTS |
| Các giọng nhân vật thương mại | ElevenLabs v2.5 |
| Đọc sách nói | ElevenLabs v2.5 hoặc XTTS v2 + fine-tune |
| Ngôn ngữ ít tài nguyên | Huấn luyện VITS trên 5–20 h dữ liệu ngôn ngữ đích |
| Biểu cảm / nhãn cảm xúc | ElevenLabs v2.5 hoặc fine-tune StyleTTS 2 |

Dẫn đầu mã nguồn mở tính đến năm 2026: **F5-TTS cho chất lượng, Kokoro cho hiệu quả**. Đừng tìm đến Tacotron trừ khi bạn là nhà sử học.

## Pitfalls

- **Không bộ chuẩn hóa văn bản.** "Dr. Smith" đọc là "Doctor" hay "Drive"? "2026" là "hai mươi hai mươi sáu" hay "hai không hai sáu"? Chuẩn hóa TRƯỚC bộ chuyển âm vị.
- **Các danh từ riêng OOV.** "Ghumare" → "ghyu-mair"? Phát hành một mô hình chữ viết-sang-âm vị dự phòng cho các token chưa biết.
- **Clipping.** Đầu ra vocoder hiếm khi bị clipping, nhưng sự không khớp tỷ lệ mel khi suy luận có thể vượt ±1.0. Luôn `np.clip(wav, -1, 1)`.
- **Không khớp tần số lấy mẫu.** Kokoro xuất 24 kHz; pipeline phía sau của bạn kỳ vọng 16 kHz → lấy mẫu lại hoặc bị chồng phổ.

## Ship It

Lưu thành `outputs/skill-tts-designer.md`. Thiết kế một pipeline TTS cho một đích giọng nói, độ trễ và ngôn ngữ nhất định.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Xây dựng một từ điển âm vị từ một từ vựng đồ chơi, ước lượng thời lượng mỗi âm vị và in một lịch "mel" giả.
2. **Trung bình.** Cài Kokoro, tổng hợp cùng câu bằng giọng `af_bella` và `am_adam`. So sánh các thời lượng âm thanh và chất lượng chủ quan.
3. **Khó.** Ghi một đoạn tham chiếu 5 giây của chính bạn. Dùng F5-TTS để nhân bản nó. Báo cáo SECS giữa tham chiếu và đầu ra được nhân bản.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Phoneme (Âm vị) | Đơn vị âm thanh | Lớp âm thanh trừu tượng; 39 trong tiếng Anh (ARPABet). |
| Duration predictor (Bộ dự đoán thời lượng) | Mỗi âm vị kéo dài bao lâu | Đầu ra mô hình không AR; số khung nguyên mỗi âm vị. |
| Vocoder | Mel → dạng sóng | Mạng nơ-ron ánh xạ mel-spec sang các mẫu thô. |
| HiFi-GAN | Vocoder tiêu chuẩn | Dựa trên GAN; chủ đạo 2020–2024. |
| MOS | Chất lượng chủ quan | Điểm ý kiến trung bình 1–5 từ những người chấm. |
| SECS | Thước đo nhân bản giọng nói | Cosine similarity giữa embedding người nói đích và đầu ra. |
| F5-TTS | SOTA mã nguồn mở 2024 | Diffusion flow-matching; nhân bản zero-shot. |
| Kokoro | Dẫn đầu tiếng Anh trên CPU | Mô hình 82M tham số, Apache 2.0. |

## Further Reading

- [Shen et al. (2017). Tacotron 2](https://arxiv.org/abs/1712.05884) — baseline seq2seq.
- [Kim, Kong, Son (2021). VITS](https://arxiv.org/abs/2106.06103) — đầu cuối dựa trên flow.
- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) — SOTA mã nguồn mở hiện tại.
- [Kong, Kim, Bae (2020). HiFi-GAN](https://arxiv.org/abs/2010.05646) — vocoder vẫn được phát hành năm 2026.
- [Kokoro-82M on HuggingFace](https://huggingface.co/hexgrad/Kokoro-82M) — TTS tiếng Anh thân thiện CPU năm 2024.
