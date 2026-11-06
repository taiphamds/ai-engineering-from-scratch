# Voice Anti-Spoofing & Audio Watermarking — ASVspoof 5, AudioSeal, WaveVerify

> Nhân bản giọng nói được phát hành nhanh hơn các biện pháp phòng vệ. Các hệ thống giọng nói production năm 2026 cần hai thứ: một bộ phát hiện (AASIST, RawNet2) phân loại tiếng nói thực so với giả, và một watermark (AudioSeal) sống sót qua nén và chỉnh sửa. Phát hành cả hai hoặc đừng phát hành nhân bản giọng nói.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 08 (Voice Cloning)
**Time:** ~75 minutes

## The Problem

Ba biện pháp phòng vệ liên quan:

1. **Chống giả mạo / phát hiện deepfake.** Với một đoạn âm thanh, nó là tổng hợp hay thực? Các benchmark ASVspoof (ASVspoof 2019 → 2021 → 5) là tiêu chuẩn vàng.
2. **Watermarking âm thanh.** Nhúng một tín hiệu không thể nhận biết vào âm thanh được sinh mà một bộ phát hiện có thể trích xuất sau này. AudioSeal (Meta) và WavMark là các lựa chọn mở.
3. **Nguồn gốc được xác thực.** Ký mật mã các file âm thanh + metadata. C2PA / Content Authenticity Initiative.

Phát hiện xử lý những kẻ đối kháng không hợp tác. Watermarking xử lý tuân thủ — âm thanh do AI sinh nên được nhận dạng là như vậy. Cả hai là bắt buộc năm 2026.

## The Concept

![Anti-spoofing vs watermarking vs provenance — three defense layers](../assets/spoofing-watermark.svg)

### ASVspoof 5 — the 2024-2025 benchmark

Thay đổi lớn nhất so với các phiên bản trước:

- **Dữ liệu từ cộng đồng** (không sạch như phòng thu) — các điều kiện thực tế.
- **~2000 người nói** (so với ~100 trước đây).
- **32 thuật toán tấn công.** TTS + chuyển đổi giọng nói + nhiễu loạn đối kháng.
- **Hai track.** Countermeasure (CM) phát hiện độc lập; Spoofing-robust ASV (SASV) cho các hệ thống sinh trắc học.

Tiên tiến nhất trên ASVspoof 5: EER ~7.23%. Trên ASVspoof 2019 LA cũ hơn: EER 0.42%. Triển khai thực tế: kỳ vọng EER 5-10% trên các đoạn ngoài thực địa.

### AASIST and RawNet2 — detection model families

**AASIST** (2021, được cập nhật đến 2026). Graph-attention trên các đặc trưng phổ. SOTA hiện tại trên tác vụ countermeasure ASVspoof 5.

**RawNet2.** Frontend tích chập trên dạng sóng thô + backbone TDNN. Baseline đơn giản hơn; vẫn cạnh tranh với fine-tuning.

**NeXt-TDNN + các đặc trưng SSL.** Biến thể năm 2025: kiểu ECAPA + các đặc trưng WavLM + focal loss. Đạt EER 0.42% trên ASVspoof 2019 LA.

### AudioSeal — the 2024 watermark default

**AudioSeal** của Meta (tháng 1 năm 2024, v0.2 tháng 12 năm 2024). Thiết kế then chốt:

- **Định vị cục bộ.** Phát hiện watermark theo khung ở độ phân giải mẫu 16 kHz (1/16000 s).
- **Bộ sinh + bộ phát hiện được huấn luyện kết hợp.** Bộ sinh học nhúng tín hiệu không nghe được; bộ phát hiện học tìm nó qua các phép tăng cường.
- **Vững chắc.** Sống sót qua nén MP3 / AAC, EQ, đổi tốc độ ±10%, trộn nhiễu SNR +10 dB.
- **Nhanh.** Bộ phát hiện chạy ở 485× thời gian thực; nhanh hơn WavMark 1000×.
- **Dung lượng.** Tải trọng 16 bit (có thể mã hóa ID mô hình, dấu thời gian sinh, ID người dùng) nhúng được trong mỗi phát ngôn.

### WavMark

Baseline mở trước AudioSeal. Mạng nơ-ron khả nghịch, 32 bit/giây. Các vấn đề:

- Vét cạn đồng bộ hóa chậm.
- Có thể bị loại bỏ bởi nhiễu Gaussian hoặc nén MP3.
- Không thân thiện thời gian thực.

### WaveVerify (July 2025)

Giải quyết các điểm yếu của AudioSeal — cụ thể là các thao tác thời gian (đảo ngược, tốc độ). Dùng bộ sinh dựa trên FiLM + bộ phát hiện Mixture-of-Experts. Cạnh tranh với AudioSeal trên các tấn công tiêu chuẩn; xử lý các chỉnh sửa thời gian.

### The gap adversaries exploit

Từ AudioMarkBench: "dưới dịch cao độ, mọi watermark cho Độ chính xác Khôi phục Bit dưới 0.6, cho thấy sự loại bỏ gần hoàn toàn." **Dịch cao độ là cuộc tấn công phổ dụng.** Không watermark năm 2026 nào hoàn toàn vững trước sửa đổi cao độ mạnh. Đây là lý do bạn cần phát hiện (AASIST) cùng watermarking.

### C2PA / Content Authenticity Initiative

Không phải một kỹ thuật ML — một định dạng manifest. Các file âm thanh mang metadata được ký mật mã về công cụ tạo, tác giả, ngày. Audobox / Seamless dùng nó. Tốt cho nguồn gốc; không làm gì nếu một kẻ xấu tái mã hóa và bỏ metadata.

```figure
v4-audio-watermark
```

## Build It

### Step 1: a simple spectral-feature detector (toy)

```python
def spectral_rolloff(spec, percentile=0.85):
    cum = 0
    total = sum(spec)
    if total == 0:
        return 0
    threshold = total * percentile
    for k, v in enumerate(spec):
        cum += v
        if cum >= threshold:
            return k
    return len(spec) - 1

def is_suspicious(audio):
    spec = magnitude_spectrum(audio)
    rolloff = spectral_rolloff(spec)
    return rolloff / len(spec) > 0.92
```

Tiếng nói tổng hợp thường có năng lượng tần số cao phẳng bất thường. Các bộ phát hiện production dùng AASIST, không phải cách này. Nhưng trực giác vẫn đúng.

### Step 2: AudioSeal embed + detect

```python
from audioseal import AudioSeal
import torch

generator = AudioSeal.load_generator("audioseal_wm_16bits")
detector = AudioSeal.load_detector("audioseal_detector_16bits")

audio = load_wav("generated.wav", sr=16000)[None, None, :]
payload = torch.tensor([[1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 1, 0]])
watermark = generator.get_watermark(audio, sample_rate=16000, message=payload)
watermarked = audio + watermark

result, decoded_payload = detector.detect_watermark(watermarked, sample_rate=16000)
# result: float in [0, 1] — probability of watermark presence
# decoded_payload: 16 bits; match against embedded payload
```

### Step 3: evaluation — EER

```python
def eer(real_scores, fake_scores):
    thresholds = sorted(set(real_scores + fake_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in fake_scores if s >= t) / len(fake_scores)
        frr = sum(1 for s in real_scores if s < t) / len(real_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

### Step 4: the production integration

```python
def safe_tts(text, voice, clone_reference=None):
    if clone_reference is not None:
        verify_consent(user_id, clone_reference)
    audio = tts_model.synthesize(text, voice)
    audio_with_wm = audioseal_embed(audio, payload=build_payload(user_id, model_id))
    manifest = c2pa_sign(audio_with_wm, user_id, timestamp=now())
    return audio_with_wm, manifest
```

Mỗi lần sinh được phát hành: (1) watermark, (2) manifest được ký, (3) nhật ký kiểm toán tuân thủ chính sách lưu giữ.

## Use It

| Trường hợp sử dụng | Phòng vệ |
|----------|---------|
| Phát hành TTS / nhân bản giọng nói | Nhúng AudioSeal trên mọi đầu ra (không thể thương lượng) |
| Mở khóa giọng nói sinh trắc học | Tổ hợp AASIST + ECAPA; thử thách xác nhận sống |
| Phát hiện gian lận trung tâm cuộc gọi | AASIST trên mẫu 20% các cuộc gọi đến |
| Tính xác thực podcast | Ký C2PA khi tải lên, AudioSeal nếu do AI sinh |
| Nghiên cứu / huấn luyện các bộ phát hiện | Các tập huấn luyện/phát triển/đánh giá ASVspoof 5 |

## Pitfalls

- **Watermark mà không bao giờ chạy bộ phát hiện.** Vô nghĩa. Phát hành bộ phát hiện trong CI của bạn.
- **Phát hiện không hiệu chuẩn.** AASIST được huấn luyện trên ASVspoof LA overfit; accuracy thực tế giảm. Hiệu chuẩn trên lĩnh vực của bạn.
- **Khoảng trống dịch cao độ.** Dịch cao độ mạnh loại bỏ hầu hết watermark. Có một phương án dự phòng phát hiện.
- **Bỏ metadata rồi lưu trữ lại.** C2PA dễ dàng bị vượt qua bằng tái mã hóa. Luôn thêm phòng vệ mật mã + tri giác (watermark) cùng nhau.
- **Xác nhận sống như phát hiện.** Yêu cầu người dùng nói một cụm từ ngẫu nhiên. Ngăn các tấn công phát lại nhưng không ngăn nhân bản thời gian thực.

## Ship It

Lưu thành `outputs/skill-spoof-defender.md`. Chọn mô hình phát hiện, watermark, manifest nguồn gốc và sổ tay vận hành cho một triển khai sinh giọng nói.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Bộ phát hiện đồ chơi + nhúng/phát hiện watermark đồ chơi trên âm thanh tổng hợp.
2. **Trung bình.** Cài `audioseal`, nhúng một tải trọng 16 bit vào một đầu ra TTS, giải mã lại. Làm hỏng âm thanh bằng nhiễu và đo Độ chính xác Khôi phục Bit.
3. **Khó.** Fine-tune một RawNet2 hoặc AASIST trên ASVspoof 2019 LA. Đo EER. Kiểm thử trên một tập được giữ lại các đoạn do F5-TTS sinh — xem phát hiện OOD suy giảm ra sao.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| ASVspoof | Benchmark | Thử thách hai năm một lần; 2024 = ASVspoof 5. |
| CM (countermeasure) | Bộ phát hiện | Bộ phân loại: tiếng nói thực so với tổng hợp / chuyển đổi. |
| SASV | Xác minh người nói + CM | Tích hợp sinh trắc học + phát hiện giả mạo. |
| AudioSeal | Watermark Meta | Định vị cục bộ, tải trọng 16 bit, nhanh hơn WavMark 485×. |
| Bit Recovery Accuracy (Độ chính xác Khôi phục Bit) | Watermark sống sót | Tỷ lệ các bit tải trọng được khôi phục sau tấn công. |
| C2PA | Manifest nguồn gốc | Metadata mật mã về tạo / tác quyền. |
| AASIST | Họ bộ phát hiện | SOTA chống giả mạo dựa trên graph-attention. |

## Further Reading

- [Todisco et al. (2024). ASVspoof 5](https://dl.acm.org/doi/10.1016/j.csl.2025.101825) — benchmark hiện tại.
- [Defossez et al. (2024). AudioSeal](https://arxiv.org/abs/2401.17264) — mặc định watermark.
- [Chen et al. (2025). WaveVerify](https://arxiv.org/abs/2507.21150) — bộ phát hiện MoE cho các tấn công thời gian.
- [Jung et al. (2022). AASIST](https://arxiv.org/abs/2110.01200) — backbone phát hiện SOTA.
- [AudioMarkBench (2024)](https://proceedings.neurips.cc/paper_files/paper/2024/file/5d9b7775296a641a1913ab6b4425d5e8-Paper-Datasets_and_Benchmarks_Track.pdf) — đánh giá độ vững.
- [C2PA specification](https://spec.c2pa.org/specifications/specifications/2.4/index.html) — định dạng manifest nguồn gốc.
