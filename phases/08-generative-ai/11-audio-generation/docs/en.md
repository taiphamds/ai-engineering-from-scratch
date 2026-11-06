# Audio Generation

> Âm thanh là một tín hiệu 1-D ở 16-48 kHz. Một clip dài năm giây có 80-240k mẫu. Không transformer nào chú ý trực tiếp đến chuỗi đó. Giải pháp cho mọi mô hình âm thanh production năm 2026 đều giống nhau: một codec nơ-ron (Encodec, SoundStream, DAC) nén âm thanh thành các token rời rạc ở 50-75 Hz, và một transformer hoặc mô hình khuếch tán sinh token.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Audio Features), Phase 6 · 04 (ASR), Phase 8 · 06 (DDPM)
**Time:** ~45 minutes

## The Problem

Ba tác vụ sinh âm thanh:

1. **Văn bản thành tiếng nói.** Với văn bản, tạo ra tiếng nói. Tiếng nói sạch có băng hẹp và có cấu trúc ngữ âm mạnh — được giải quyết tốt bằng transformer trên token. VALL-E (Microsoft), NaturalSpeech 3, ElevenLabs, OpenAI TTS.
2. **Sinh nhạc.** Với một prompt (văn bản, giai điệu, tiến trình hợp âm, thể loại), tạo ra nhạc. Phân phối rộng hơn nhiều. MusicGen (Meta), Stable Audio 2.5, Suno v4, Udio, Riffusion.
3. **Hiệu ứng âm thanh / thiết kế âm thanh.** Với một prompt, tạo ra âm thanh môi trường hoặc Foley. AudioGen, AudioLDM 2, Stable Audio Open.

Cả ba đều chạy trên cùng nền tảng: codec âm thanh nơ-ron + bộ sinh token-AR hoặc khuếch tán.

## The Concept

![Audio generation: codec tokens + transformer or diffusion](../assets/audio-generation.svg)

### Neural audio codecs

Encodec (Meta, 2022), SoundStream (Google, 2021), Descript Audio Codec (DAC, 2023). Một encoder tích chập nén dạng sóng thành một vector theo bước thời gian; lượng tử hóa vector phần dư (RVQ) chuyển mỗi vector thành một chuỗi tầng K chỉ số codebook. Decoder đảo ngược nó. Âm thanh 24 kHz ở 2 kbps dùng 8 codebook RVQ ở 75 Hz = 600 token/giây.

```
waveform (16000 samples/sec)
    └─ encoder conv ─┐
                     ├─ RVQ layer 1 → indices at 75 Hz
                     ├─ RVQ layer 2 → indices at 75 Hz
                     ├─ ...
                     └─ RVQ layer 8
```

### Two generative paradigms on top

**Tự hồi quy token.** Trải phẳng các token RVQ thành một chuỗi, chạy một transformer chỉ decoder. MusicGen dùng "song song có độ trễ" để phát ra K luồng codebook song song với các độ lệch theo luồng. VALL-E sinh token tiếng nói từ một prompt văn bản + mẫu giọng nói dài 3 giây.

**Khuếch tán tiềm ẩn.** Đóng gói các token codec thành latent liên tục hoặc mô hình hóa chúng bằng khuếch tán phân loại. Stable Audio 2.5 dùng flow matching trên các latent âm thanh liên tục. AudioLDM 2 dùng khuếch tán văn bản-thành-mel-thành-âm thanh.

Xu hướng 2024-2026: flow matching đang thắng cho âm nhạc (suy luận nhanh hơn, mẫu sạch hơn) trong khi token-AR vẫn chi phối tiếng nói vì nó có tính nhân quả tự nhiên và truyền luồng tốt.

## Production landscape

| Hệ thống | Tác vụ | Backbone | Độ trễ |
|--------|------|----------|---------|
| ElevenLabs V3 | TTS | Token-AR + vocoder nơ-ron | ~300ms token đầu tiên |
| OpenAI GPT-4o audio | Tiếng nói song công toàn phần | AR đa phương thức đầu cuối | ~200ms |
| NaturalSpeech 3 | TTS | Flow matching tiềm ẩn | Không truyền luồng |
| Stable Audio 2.5 | Nhạc / SFX | DiT + flow matching trên latent âm thanh | ~10s cho clip dài 1 phút |
| Suno v4 | Bài hát hoàn chỉnh | Không công bố; nghi là token-AR | ~30s mỗi bài hát |
| Udio v1.5 | Bài hát hoàn chỉnh | Không công bố | ~30s mỗi bài hát |
| MusicGen 3.3B | Nhạc | Token-AR trên Encodec 32kHz | Thời gian thực |
| AudioCraft 2 | Nhạc + SFX | Flow matching | ~5s cho clip 5s |
| Riffusion v2 | Nhạc | Khuếch tán spectrogram | ~10s |

```figure
score-matching
```

## Build It

`code/main.py` mô phỏng ý tưởng cốt lõi: huấn luyện một transformer dự đoán token tiếp theo nhỏ trên các chuỗi "token âm thanh" tổng hợp được sinh từ hai "phong cách" khác biệt (xen kẽ token thấp và cao cho phong cách A, tăng đơn điệu cho phong cách B). Điều kiện hóa theo phong cách và lấy mẫu.

### Step 1: synthetic audio tokens

```python
def make_tokens(style, length, vocab_size, rng):
    if style == 0:  # "speech-like": alternating
        return [i % vocab_size for i in range(length)]
    # "music-like": ramp
    return [(i * 3) % vocab_size for i in range(length)]
```

### Step 2: train a tiny token predictor

Một bộ dự đoán kiểu bigram có điều kiện theo phong cách. Điểm chính là mô thức: token codec → huấn luyện cross-entropy → lấy mẫu tự hồi quy.

### Step 3: sample conditionally

Với token phong cách và một token bắt đầu, lấy mẫu token tiếp theo từ phân phối dự đoán. Tiếp tục trong 20-40 token.

## Pitfalls

- **Chất lượng codec giới hạn chất lượng đầu ra.** Nếu codec không thể biểu diễn trung thực một âm thanh, không mức chất lượng bộ sinh nào giúp được. DAC là lựa chọn mở tốt nhất hiện tại.
- **Tích lũy sai số RVQ.** Mỗi lớp RVQ mô hình hóa phần dư của lớp trước. Sai số ở lớp 1 lan truyền. Lấy mẫu với temperature 0 ở các lớp cao hơn giúp ích.
- **Cấu trúc âm nhạc.** 30 giây token là 20k+ token ở 75 Hz. Khó cho transformer. MusicGen dùng cửa sổ trượt + tiếp nối prompt; Stable Audio dùng các clip ngắn hơn + crossfading.
- **Lỗi giả ở ranh giới.** Crossfading giữa các clip được sinh cần overlap-add cẩn thận.
- **Nhu cầu dữ liệu sạch.** Các bộ sinh nhạc cần hàng chục nghìn giờ nhạc có giấy phép. Vụ kiện RIAA với Suno / Udio (2024) đã đưa điều này ra ánh sáng.
- **Đạo đức nhân bản giọng nói.** Một mẫu dài 3 giây cộng một prompt văn bản đủ để VALL-E / XTTS / ElevenLabs nhân bản một giọng nói. Mọi mô hình production đều cần phát hiện lạm dụng + các danh sách từ chối tham gia.

## Use It

| Tác vụ | Bộ công cụ năm 2026 |
|------|------------|
| TTS thương mại | ElevenLabs, OpenAI TTS, hoặc Azure Neural |
| Nhân bản giọng nói (đã xác minh đồng thuận) | XTTS v2 (mở) hoặc ElevenLabs Pro |
| Nhạc nền, nhanh | Stable Audio 2.5 API, Suno, hoặc Udio |
| Nhạc có lời | Suno v4 hoặc Udio v1.5 |
| Hiệu ứng âm thanh / Foley | AudioCraft 2, ElevenLabs SFX, hoặc Stable Audio Open |
| Agent giọng nói thời gian thực | GPT-4o realtime hoặc Gemini Live |
| Nghiên cứu âm nhạc với trọng số mở | MusicGen 3.3B, Stable Audio Open 1.0, AudioLDM 2 |
| Lồng tiếng / dịch | HeyGen, ElevenLabs Dubbing |

## Ship It

Lưu `outputs/skill-audio-brief.md`. Skill nhận một bản yêu cầu âm thanh (tác vụ, thời lượng, phong cách, giọng nói, giấy phép) và xuất ra: mô hình + nơi lưu trữ, định dạng prompt (thẻ thể loại, mô tả phong cách, dấu cấu trúc), chuỗi codec + bộ sinh + vocoder, quy trình seed, và kế hoạch đánh giá (MOS / điểm CLAP / CER cho TTS / A/B người dùng).

## Exercises

1. **Dễ.** Chạy `code/main.py` và đặt phong cách tường minh. Xác minh các chuỗi được sinh khớp mô thức của phong cách.
2. **Trung bình.** Thêm giải mã song song có độ trễ: mô phỏng 2 luồng token phải duy trì độ lệch 1 bước. Huấn luyện một bộ dự đoán chung.
3. **Khó.** Dùng HuggingFace transformers để chạy MusicGen-small cục bộ. Sinh một clip dài 10 giây với ba prompt khác nhau; A/B về bám sát phong cách.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Codec (Bộ mã hóa-giải mã) | "Nén nơ-ron" | Encoder / decoder cho âm thanh; đầu ra điển hình là token ở 50-75 Hz. |
| RVQ | "VQ phần dư" | Chuỗi tầng K bộ lượng tử hóa; mỗi bộ mô hình hóa phần dư của bộ trước. |
| Token | "Một ký hiệu codec" | Chỉ số rời rạc vào một codebook; 1024 hoặc 2048 là điển hình. |
| Delayed parallel (Song song có độ trễ) | "Các codebook lệch nhau" | Phát ra K luồng token với các độ lệch so le để giảm độ dài chuỗi. |
| Flow matching | "Chiến thắng năm 2024 cho âm thanh" | Lựa chọn thay khuếch tán có đường đi thẳng hơn; lấy mẫu nhanh hơn. |
| Voice prompt (Prompt giọng nói) | "Mẫu dài 3 giây" | Embedding người nói hoặc tiền tố token điều khiển giọng nói được nhân bản. |
| Mel spectrogram (Phổ đồ mel) | "Hình ảnh trực quan" | Spectrogram cảm nhận theo log biên độ; được dùng bởi nhiều hệ thống TTS. |
| Vocoder | "Mel thành dạng sóng" | Thành phần nơ-ron chuyển các spectrogram mel trở lại âm thanh. |

## Production note: audio is a streaming problem

Âm thanh là phương thức đầu ra mà người dùng mong đợi đến *khi nó đang được sinh*, không phải tất cả cùng lúc. Theo ngôn ngữ production, điều này nghĩa là TPOT quan trọng (Thời gian mỗi token đầu ra) vì tốc độ nghe của người dùng là thông lượng mục tiêu — không phải tốc độ đọc của họ. Với âm thanh 16kHz được token hóa ở ~75 token/giây (Encodec), máy chủ phải sinh ≥75 token/giây mỗi người dùng để giữ phát lại mượt mà.

Hai hệ quả kiến trúc:

- **Các mô hình âm thanh flow-matching không thể truyền luồng một cách đơn giản.** Stable Audio 2.5 và AudioCraft 2 kết xuất một độ dài clip cố định trong một lượt. Để truyền luồng, bạn chia clip thành khối và chồng lấn các ranh giới — nghĩ đến khuếch tán cửa sổ trượt — thêm 100-300ms chi phí độ trễ so với một mô hình AR codec.

Nếu sản phẩm là "trò chuyện giọng nói trực tiếp" hoặc "tiếp nối âm nhạc thời gian thực", chọn đường codec AR. Nếu là "kết xuất một clip dài 30 giây khi gửi", flow-matching thắng về chất lượng và tổng độ trễ.

## Further Reading

- [Défossez et al. (2022). Encodec: High Fidelity Neural Audio Compression](https://arxiv.org/abs/2210.13438) — tiêu chuẩn codec.
- [Zeghidour et al. (2021). SoundStream](https://arxiv.org/abs/2107.03312) — codec âm thanh nơ-ron đầu tiên được sử dụng rộng rãi.
- [Kumar et al. (2023). High-Fidelity Audio Compression with Improved RVQGAN (DAC)](https://arxiv.org/abs/2306.06546) — DAC.
- [Wang et al. (2023). Neural Codec Language Models are Zero-Shot Text to Speech Synthesizers (VALL-E)](https://arxiv.org/abs/2301.02111) — VALL-E.
- [Copet et al. (2023). Simple and Controllable Music Generation (MusicGen)](https://arxiv.org/abs/2306.05284) — MusicGen.
- [Liu et al. (2023). AudioLDM 2: Learning Holistic Audio Generation with Self-supervised Pretraining](https://arxiv.org/abs/2308.05734) — AudioLDM 2.
- [Stability AI (2025). Stable Audio 2.5](https://stability.ai/news-updates/stability-ai-introduces-stable-audio-25-the-first-audio-model-built-for-enterprise-sound-production-at-scale) — văn bản thành nhạc năm 2025 với flow matching.
