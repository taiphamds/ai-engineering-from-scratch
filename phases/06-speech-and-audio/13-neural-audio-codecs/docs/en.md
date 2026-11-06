# Neural Audio Codecs — EnCodec, SNAC, Mimi, DAC and the Semantic-Acoustic Split

> Sinh âm thanh năm 2026 gần như toàn là token. EnCodec, SNAC, Mimi và DAC biến các dạng sóng liên tục thành các chuỗi rời rạc mà một transformer có thể dự đoán. Sự tách token ngữ nghĩa-so-với-âm học — codebook đầu làm ngữ nghĩa, phần còn lại làm âm học — là chuyển dịch kiến trúc quan trọng nhất từ Transformer cho âm thanh.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms), Phase 10 · 11 (Quantization), Phase 5 · 19 (Subword Tokenization)
**Time:** ~60 minutes

## The Problem

Các mô hình ngôn ngữ hoạt động trên các token rời rạc. Âm thanh liên tục. Nếu bạn muốn một mô hình kiểu LLM cho tiếng nói / âm nhạc — MusicGen, Moshi, Sesame CSM, VibeVoice, Orpheus — trước tiên bạn cần một **codec âm thanh nơ-ron**: một encoder được học rời rạc hóa âm thanh thành một từ vựng token nhỏ, và một decoder tương ứng tái tạo dạng sóng.

Hai họ đã xuất hiện:

1. **Codec ưu tiên tái tạo** — EnCodec, DAC. Tối ưu chất lượng âm thanh tri giác. Các token là "âm học" — chúng nắm bắt mọi thứ bao gồm danh tính người nói, âm sắc, nhiễu nền.
2. **Codec ưu tiên ngữ nghĩa** — Mimi (Kyutai), SpeechTokenizer. Ép codebook đầu mã hóa nội dung ngôn ngữ / ngữ âm (thường bằng chưng cất từ WavLM). Các codebook tiếp theo là chi tiết âm học.

Nhận thức 2024-2026: **một codec tái tạo thuần cho bạn tiếng nói mờ khi bạn thử sinh từ văn bản.** LLM trên các token codec phải học cả cấu trúc ngôn ngữ VÀ cấu trúc âm học trong cùng codebook, điều không mở rộng được. Tách chúng — codebook ngữ nghĩa 0, các codebook âm học 1-N — là thứ khiến Moshi và Sesame CSM hoạt động.

## The Concept

![Four codec landscape: EnCodec, DAC, SNAC (multi-scale), Mimi (semantic+acoustic)](../assets/codec-comparison.svg)

### The core trick: Residual Vector Quantization (RVQ)

Thay vì một codebook lớn (sẽ cần hàng triệu mã cho chất lượng tốt), mọi codec âm thanh hiện đại dùng **RVQ**: một chuỗi nối tầng các codebook nhỏ. Codebook đầu lượng tử hóa đầu ra encoder; codebook thứ hai lượng tử hóa phần dư; v.v. Mỗi codebook có 1024 mã. 8 codebook = từ vựng hiệu dụng 1024^8 = 10^24.

Khi suy luận, decoder cộng mọi mã được chọn theo khung để tái tạo.

### The four codecs that matter in 2026

**EnCodec (Meta, 2022).** Baseline. Encoder-decoder trên dạng sóng, nút thắt RVQ. 24 kHz, có thể có 32 codebook, mặc định 4 codebook @ 1.5 kbps. Dùng kiến trúc `1D conv + transformer + 1D conv`. Được MusicGen dùng.

**DAC (Descript, 2023).** RVQ với các codebook chuẩn hóa L2, các hàm kích hoạt tuần hoàn, các loss được cải thiện. Độ trung thực tái tạo cao nhất của bất kỳ codec mở nào — đôi khi không thể phân biệt với tiếng nói gốc với 12 codebook. Toàn dải 44.1 kHz.

**SNAC (Hubert Siuzdak, 2024).** RVQ đa tỷ lệ — các codebook thô hoạt động ở tốc độ khung thấp hơn các codebook tinh. Mô hình hóa âm thanh có phân cấp một cách hiệu quả: một "phác thảo" thô tại ~12 Hz cộng chi tiết tại 50 Hz. Được Orpheus-3B dùng vì cấu trúc phân cấp ánh xạ tốt sang sinh dựa trên LM.

**Mimi (Kyutai, 2024).** Yếu tố thay đổi cuộc chơi năm 2026. Tốc độ khung 12.5 Hz (cực thấp), 8 codebook @ 4.4 kbps. Codebook 0 được **chưng cất từ WavLM** — được huấn luyện để dự đoán các đặc trưng nội dung tiếng nói của WavLM. Các codebook 1-7 là các phần dư âm học. Sự tách này vận hành Moshi (Bài 15) và Sesame CSM.

### Frame rates matter for language modeling

Tốc độ khung thấp hơn = chuỗi ngắn hơn = LM nhanh hơn.

| Codec | Tốc độ khung | 1 s = N khung | Tốt cho |
|-------|-----------|----------------|---------|
| EnCodec-24k | 75 Hz | 75 | âm nhạc, âm thanh tổng quát |
| DAC-44.1k | 86 Hz | 86 | âm nhạc độ trung thực cao |
| SNAC-24k (thô) | ~12 Hz | 12 | AR-LM hiệu quả |
| Mimi | 12.5 Hz | 12.5 | tiếng nói luồng |

Ở 12.5 Hz, một phát ngôn 10 giây chỉ là 125 khung codec — một transformer có thể dễ dàng dự đoán chúng.

### Semantic vs acoustic tokens

```
frame_t → [semantic_token_t, acoustic_token_0_t, acoustic_token_1_t, ..., acoustic_token_6_t]
```

- **Token ngữ nghĩa (codebook 0 trong Mimi).** Mã hóa điều đã nói — âm vị, từ, nội dung. Được chưng cất từ WavLM qua một loss dự đoán phụ.
- **Các token âm học (codebook 1-7).** Mã hóa âm sắc, danh tính người nói, ngữ điệu, nhiễu nền, chi tiết tinh.

Một LM AR dự đoán token ngữ nghĩa trước (được điều kiện hóa theo văn bản), rồi dự đoán các token âm học (được điều kiện hóa theo ngữ nghĩa + tham chiếu người nói). Phân tích nhân tử này là lý do TTS hiện đại có thể nhân bản giọng zero-shot: mô hình ngữ nghĩa xử lý nội dung; mô hình âm học xử lý âm sắc.

### 2026 reconstruction quality (bits per sec, lower bitrate is better)

| Codec | Bitrate | PESQ | ViSQOL |
|-------|---------|------|--------|
| Opus-20kbps | 20 kbps | 4.0 | 4.3 |
| EnCodec-6kbps | 6 kbps | 3.2 | 3.8 |
| DAC-6kbps | 6 kbps | 3.5 | 4.0 |
| SNAC-3kbps | 3 kbps | 3.3 | 3.8 |
| Mimi-4.4kbps | 4.4 kbps | 3.1 | 3.7 |

Các codec truyền thống như Opus vẫn thắng theo mỗi bit về chất lượng tri giác. Các codec nơ-ron thắng về **token rời rạc** (thứ Opus không tạo) và **chất lượng mô hình sinh** (điều LM có thể làm với các token đó).

```figure
rvq-codec-cascade
```

## Build It

### Step 1: encode with EnCodec

```python
from encodec import EncodecModel
import torch

model = EncodecModel.encodec_model_24khz()
model.set_target_bandwidth(6.0)  # kbps

wav = torch.randn(1, 1, 24000)
with torch.no_grad():
    encoded = model.encode(wav)
codes, scale = encoded[0]
# codes: (1, n_codebooks, n_frames), dtype=int64
```

`n_codebooks=8` tại 6 kbps. Mỗi mã là 0-1023 (10 bit).

### Step 2: decode and measure reconstruction

```python
with torch.no_grad():
    wav_recon = model.decode([(codes, scale)])

from torchaudio.functional import compute_deltas
import torch.nn.functional as F

mse = F.mse_loss(wav_recon[:, :, :wav.shape[-1]], wav).item()
```

### Step 3: the semantic-acoustic split (Mimi-style)

```python
from moshi.models import loaders
mimi = loaders.get_mimi()

with torch.no_grad():
    codes = mimi.encode(wav)  # shape (1, 8, frames@12.5Hz)

semantic = codes[:, 0]
acoustic = codes[:, 1:]
```

Codebook ngữ nghĩa 0 được căn chỉnh với WavLM. Bạn có thể huấn luyện một transformer văn bản-thành-ngữ nghĩa — từ vựng nhỏ hơn nhiều so với đi trực tiếp đến âm thanh. Rồi một decoder âm học-thành-dạng sóng riêng được điều kiện hóa theo một tham chiếu người nói.

### Step 4: why AR LM over codec tokens works

Với một đoạn tiếng nói 10 s ở 12.5 Hz × 8 codebook của Mimi:

```
N_tokens = 10 * 12.5 * 8 = 1000 tokens
```

1000 token là một ngữ cảnh nhỏ đối với một transformer. Một transformer 256M tham số có thể sinh 10 giây tiếng nói trong vài mili giây trên một GPU hiện đại.

## Use It

Ánh xạ bài toán → codec:

| Tác vụ | Codec |
|------|-------|
| Sinh nhạc tổng quát | EnCodec-24k |
| Tái tạo độ trung thực cao nhất | DAC-44.1k |
| LM AR trên tiếng nói (TTS) | SNAC hoặc Mimi |
| Tiếng nói song công toàn phần theo luồng | Mimi (12.5 Hz) |
| Thư viện hiệu ứng âm thanh có văn bản | EnCodec + điều kiện T5 |
| Chỉnh sửa âm thanh chi tiết | DAC + inpainting |

Quy tắc kinh nghiệm: **nếu bạn đang xây dựng một mô hình sinh, bắt đầu với Mimi hoặc SNAC. Nếu bạn đang xây dựng một pipeline nén, dùng Opus.**

## Pitfalls

- **Quá nhiều codebook.** Thêm codebook tăng độ trung thực tuyến tính nhưng cũng tăng độ dài chuỗi LM tuyến tính. Dừng tại 8-12.
- **Không khớp tốc độ khung.** Huấn luyện LM trên Mimi 12.5 Hz rồi fine-tuning trên EnCodec 50 Hz thất bại âm thầm.
- **Giả định mọi codebook bằng nhau.** Trong Mimi, codebook 0 mang nội dung; mất nó phá tính dễ hiểu. Mất codebook 7 hầu như không nhận thấy.
- **Dùng chất lượng tái tạo làm thước đo duy nhất.** Một codec có thể có tái tạo tuyệt vời nhưng vô dụng cho sinh dựa trên LM nếu cấu trúc ngữ nghĩa tệ.

## Ship It

Lưu thành `outputs/skill-codec-picker.md`. Chọn một codec cho một tác vụ sinh hoặc nén nhất định.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Nó triển khai một bộ lượng tử hóa vô hướng + phần dư đồ chơi và đo lỗi tái tạo khi bạn thêm codebook.
2. **Trung bình.** Cài `encodec` và so sánh 1, 4, 8, 32 codebook trên một đoạn tiếng nói được giữ lại. Vẽ PESQ hoặc MSE theo bitrate.
3. **Khó.** Tải Mimi. Mã hóa một đoạn. Thay codebook 0 bằng các số nguyên ngẫu nhiên; giải mã. Rồi thay codebook 7 tương tự. So sánh hai sự làm hỏng — làm hỏng codebook 0 phải phá tính dễ hiểu; làm hỏng codebook 7 hầu như không nên thay đổi gì.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| RVQ | Lượng tử hóa phần dư | Chuỗi nối tầng các codebook nhỏ; mỗi codebook lượng tử hóa phần dư trước. |
| Frame rate (Tốc độ khung) | Tốc độ codec | Bao nhiêu khung token mỗi giây. Thấp hơn = LM nhanh hơn. |
| Semantic codebook (Codebook ngữ nghĩa) | Codebook 0 (Mimi) | Codebook được chưng cất từ các đặc trưng SSL; mã hóa nội dung. |
| Acoustic codebooks (Các codebook âm học) | Mọi thứ khác | Âm sắc, ngữ điệu, nhiễu, chi tiết tinh. |
| PESQ / ViSQOL | Chất lượng tri giác | Các thước đo khách quan tương quan với MOS. |
| EnCodec | Codec Meta | Baseline RVQ; được MusicGen dùng. |
| Mimi | Codec Kyutai | Tốc độ khung 12.5 Hz; tách ngữ nghĩa-âm học; vận hành Moshi. |

## Further Reading

- [Défossez et al. (2023). EnCodec](https://arxiv.org/abs/2210.13438) — baseline RVQ.
- [Kumar et al. (2023). Descript Audio Codec (DAC)](https://arxiv.org/abs/2306.06546) — mở có độ trung thực cao nhất.
- [Siuzdak (2024). SNAC](https://arxiv.org/abs/2410.14411) — RVQ đa tỷ lệ.
- [Kyutai (2024). Mimi codec](https://kyutai.org/codec-explainer) — tách ngữ nghĩa-âm học, chưng cất WavLM.
- [Borsos et al. (2023). AudioLM](https://arxiv.org/abs/2209.03143) — mô thức ngữ nghĩa/âm học hai giai đoạn.
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) — codec RVQ có thể truyền luồng gốc.
