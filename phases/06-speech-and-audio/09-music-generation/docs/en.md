# Music Generation — MusicGen, Stable Audio, Suno, and the Licensing Earthquake

> Sinh nhạc năm 2026: Suno v5 và Udio v4 thống trị thương mại; MusicGen, Stable Audio Open và ACE-Step dẫn đầu mã nguồn mở. Bài toán kỹ thuật phần lớn đã được giải quyết. Bài toán pháp lý (thỏa thuận Warner Music $500M, thỏa thuận UMG) định hình lại lĩnh vực trong 2025-2026.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 4 · 10 (Diffusion Models)
**Time:** ~75 minutes

## The Problem

Văn bản → một đoạn nhạc dài từ 30 giây đến 4 phút, với lời, giọng hát và cấu trúc. Ba bài toán con:

1. **Sinh nhạc không lời.** Văn bản như "trống lo-fi hip-hop với tiếng phím ấm" → âm thanh. MusicGen, Stable Audio, AudioLDM.
2. **Sinh bài hát (với giọng hát + lời).** "Bài hát đồng quê về những đêm Texas mưa" → bài hát đầy đủ. Suno, Udio, YuE, ACE-Step.
3. **Có điều kiện / điều khiển được.** Kéo dài một đoạn hiện có, sinh lại một đoạn chuyển, đổi thể loại, tách stem hoặc inpaint. Inpainting + tách stem của Udio là tính năng cần sánh kịp năm 2026.

## The Concept

![Music generation: token-LM vs diffusion, the 2026 model map](../assets/music-generation.svg)

### Token LM over neural-codec tokens

**MusicGen** của Meta (2023, MIT) và nhiều phái sinh: điều kiện hóa theo embedding văn bản/giai điệu, dự đoán tự hồi quy các token EnCodec (32 kHz, 4 codebook), giải mã bằng EnCodec. 300M - 3.3B tham số. Baseline mạnh; chật vật sau 30 giây.

**ACE-Step** (mã nguồn mở, 4B XL phát hành tháng 4 năm 2026) mở rộng cách này để sinh toàn bài hát được điều kiện hóa theo lời. Thứ gần Suno nhất của cộng đồng mở.

### Diffusion over mels or latents

**Stable Audio (2023)** và **Stable Audio Open (2024)**: latent diffusion trên âm thanh được nén. Xuất sắc với các vòng lặp, thiết kế âm thanh, kết cấu âm thanh môi trường. Không giỏi các bài hát đầy đủ có cấu trúc.

**AudioLDM / AudioLDM2**: văn bản thành âm thanh qua latent diffusion kiểu T2I, khái quát sang âm nhạc, hiệu ứng âm thanh, tiếng nói.

### Hybrid (production) — Suno, Udio, Lyria

Trọng số đóng. Có lẽ là LM codec AR + vocoder dựa trên diffusion với các head giọng / trống / giai điệu chuyên biệt. Suno v5 (2026) dẫn đầu chất lượng với ELO 1293. Udio v4 thêm inpainting + tách stem (tải riêng bass, trống, giọng hát).

### Evaluation

- **FAD (Fréchet Audio Distance).** Khoảng cách cấp embedding giữa phân phối âm thanh được sinh và thực bằng các đặc trưng VGGish hoặc PANNs. Thấp hơn là tốt hơn. MusicGen small: 4.5 FAD trên MusicCaps; SOTA ~3.0.
- **Tính nhạc (chủ quan).** Sự ưu tiên của con người. Suno v5 ELO 1293 dẫn đầu.
- **Căn chỉnh văn bản-âm thanh.** Điểm CLAP giữa prompt và đầu ra.
- **Các tạo tác tính nhạc.** Các chuyển tiếp lệch nhịp, độ trôi cụm giọng hát, mất cấu trúc sau 30 s.

## 2026 model map

| Mô hình | Tham số | Độ dài | Giọng hát | Giấy phép |
|-------|--------|--------|--------|---------|
| MusicGen-large | 3.3B | 30 s | không | MIT |
| Stable Audio Open | 1.2B | 47 s | không | Stability phi thương mại |
| ACE-Step XL (tháng 4 năm 2026) | 4B | &gt; 2 phút | có | Apache-2.0 |
| YuE | 7B | &gt; 2 phút | có, đa ngôn ngữ | Apache-2.0 |
| Suno v5 (đóng) | ? | 4 phút | có, ELO 1293 | thương mại |
| Udio v4 (đóng) | ? | 4 phút | có + stem | thương mại |
| Google Lyria 3 (đóng) | ? | thời gian thực | có | thương mại |
| MiniMax Music 2.5 | ? | 4 phút | có | API thương mại |

## The legal landscape (2025-2026)

- **Thỏa thuận Warner Music với Suno.** $500M. WMG hiện có quyền giám sát sự mô phỏng bằng AI, quyền âm nhạc và các bản nhạc do người dùng tạo trên Suno. Thỏa thuận UMG tương tự trên Udio.
- **EU AI Act** + **California SB 942**: nhạc do AI sinh phải được công khai.
- **Riffusion / MusicGen** theo MIT không mang gánh nặng tuân thủ nhưng cũng không có giọng hát thương mại.

Các mẫu an toàn để phát hành:

1. Chỉ sinh nhạc không lời (MusicGen, Stable Audio Open, các đầu ra MIT/CC0).
2. Dùng các API thương mại (Suno, Udio, ElevenLabs Music) với giấy phép theo lần sinh.
3. Huấn luyện trên danh mục sở hữu hoặc được cấp phép (hầu hết doanh nghiệp cuối cùng ở đây).
4. Gắn nhãn các lần sinh bằng watermark + metadata.

```figure
sp-codec-tokens
```

## Build It

### Step 1: generate with MusicGen

```python
from audiocraft.models import MusicGen
import torchaudio

model = MusicGen.get_pretrained("facebook/musicgen-small")
model.set_generation_params(duration=10)
wav = model.generate(["upbeat synthwave with driving drums, 128 BPM"])
torchaudio.save("out.wav", wav[0].cpu(), 32000)
```

Ba kích thước: `small` (300M, nhanh), `medium` (1.5B), `large` (3.3B). Small đủ cho "ý tưởng có hiệu quả không."

### Step 2: melody conditioning

```python
melody, sr = torchaudio.load("humming.wav")
wav = model.generate_with_chroma(
    ["jazz piano cover"],
    melody.squeeze(),
    sr,
)
```

MusicGen-melody nhận một chromagram và giữ giai điệu trong khi đổi âm sắc. Hữu ích cho "cho tôi giai điệu này dưới dạng tứ tấu dây."

### Step 3: FAD evaluation

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()

fad.get_fad_score("generated_folder/", "reference_folder/")
```

Tính khoảng cách embedding VGGish. Hữu ích cho các kiểm thử hồi quy cấp thể loại; không thay thế người nghe.

### Step 4: adding to the LLM-music workflow

Kết hợp với các ý tưởng từ Bài 7-8:

```python
prompt = "Write a 30-second jazz loop. Describe the drums, bass, and piano voicing."
description = llm.complete(prompt)
music = musicgen.generate([description], duration=30)
```

## Use It

| Mục tiêu | Ngăn xếp |
|------|-------|
| Thiết kế âm thanh không lời | Stable Audio Open |
| Nhạc trò chơi / thích nghi | Google Lyria RealTime (đóng) |
| Các bài hát đầy đủ với giọng hát (thương mại) | Suno v5 hoặc Udio v4 với giấy phép rõ ràng |
| Các bài hát đầy đủ với giọng hát (mở) | ACE-Step XL hoặc YuE |
| Nhạc hiệu quảng cáo ngắn | MusicGen được điều kiện hóa theo giai điệu từ một tham chiếu ngân nga |
| Nhạc nền video âm nhạc | MusicGen + Stable Video Diffusion |

## Pitfalls that still ship in 2026

- **Các prompt rửa bản quyền.** "Bài hát theo phong cách Taylor Swift" — Suno/Udio thương mại hiện lọc chúng, các mô hình mở thì không. Thêm danh sách lọc của riêng bạn.
- **Lặp lại / trôi sau 30 s.** Các mô hình AR lặp vòng. Crossfade nhiều lần sinh, hoặc dùng ACE-Step để có độ mạch lạc cấu trúc.
- **Độ trôi nhịp độ.** Các mô hình đi chệch BPM. Dùng các nhãn BPM trong prompt và lọc sau bằng `beat_track` của librosa.
- **Tính dễ hiểu giọng hát.** Suno xuất sắc; các mô hình mở thường không rõ từ. Nếu lời quan trọng, dùng một API thương mại hoặc fine-tune.
- **Đầu ra mono.** Các mô hình mở sinh mono hoặc stereo giả. Nâng cấp bằng tái tạo stereo đúng (ezst, stereo diffusion của Cartesia).

## Ship It

Lưu thành `outputs/skill-music-designer.md`. Chọn mô hình, chiến lược giấy phép, kế hoạch độ dài / cấu trúc và metadata công khai cho một triển khai sinh nhạc.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Nó tạo một tiến trình hợp âm + mẫu trống "sinh" dưới dạng ký hiệu ASCII — một hình biếm họa sinh nhạc. Phát lại bằng bất kỳ bộ kết xuất MIDI nào nếu bạn muốn.
2. **Trung bình.** Cài `audiocraft`, sinh các đoạn 10 giây trên 4 prompt thể loại bằng MusicGen-small, đo FAD so với một tập thể loại tham chiếu.
3. **Khó.** Dùng ACE-Step (hoặc MusicGen-melody), sinh ba biến thể cùng giai điệu với các prompt âm sắc khác nhau. Tính độ tương đồng CLAP với prompt để xác minh căn chỉnh.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| FAD | FID âm thanh | Khoảng cách Fréchet giữa các phân phối embedding của thực so với được sinh. |
| Chromagram | Giai điệu dưới dạng cao độ | Vector 12 chiều theo khung; đầu vào để điều kiện hóa giai điệu. |
| Stems | Các track nhạc cụ | Bass / trống / giọng hát / giai điệu được tách dưới dạng WAV. |
| Inpainting | Sinh lại một phần | Che một cửa sổ thời gian; mô hình chỉ sinh lại phần đó. |
| CLAP | CLIP văn bản-âm thanh | Embedding âm thanh-văn bản tương phản; đánh giá căn chỉnh văn bản-âm thanh. |
| EnCodec | Codec âm nhạc | Codec nơ-ron của Meta được MusicGen dùng; 32 kHz, 4 codebook. |

## Further Reading

- [Copet et al. (2023). MusicGen](https://arxiv.org/abs/2306.05284) — benchmark tự hồi quy mở.
- [Evans et al. (2024). Stable Audio Open](https://arxiv.org/abs/2407.14358) — mặc định thiết kế âm thanh.
- [ACE-Step](https://github.com/ace-step/ACE-Step) — bộ sinh toàn bài hát 4B mở, tháng 4 năm 2026.
- [Suno v5 platform docs](https://suno.com) — dẫn đầu chất lượng thương mại.
- [AudioLDM2](https://arxiv.org/abs/2308.05734) — latent diffusion cho âm nhạc + hiệu ứng âm thanh.
- [WMG-Suno settlement coverage](https://www.musicbusinessworldwide.com/warner-music-group-settles-with-suno-strikes-first-of-its-kind-deal-with-ai-song-generator/) — tiền lệ tháng 11 năm 2025.
