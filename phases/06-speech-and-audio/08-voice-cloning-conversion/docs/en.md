# Voice Cloning & Voice Conversion

> Nhân bản giọng nói đọc văn bản của bạn bằng giọng người khác. Chuyển đổi giọng nói viết lại giọng bạn thành giọng người khác trong khi giữ điều bạn nói. Cả hai dựa vào cùng một phân rã: tách danh tính người nói khỏi nội dung.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 06 (Speaker Recognition), Phase 6 · 07 (TTS)
**Time:** ~75 minutes

## The Problem

Năm 2026, một đoạn âm thanh 5 giây đủ để tạo một bản nhân giọng chất lượng cao của bất kỳ ai bằng một GPU tiêu dùng. ElevenLabs, F5-TTS, OpenVoice v2, VoiceBox đều cung cấp nhân bản zero-shot hoặc few-shot. Công nghệ là một phúc lành (TTS hỗ trợ tiếp cận, lồng tiếng, giọng hỗ trợ) và một vũ khí (cuộc gọi lừa đảo, deepfake chính trị, trộm sở hữu trí tuệ).

Hai tác vụ liên quan chặt chẽ:

- **Nhân bản giọng nói (phía TTS):** văn bản + giọng tham chiếu 5 giây → âm thanh bằng giọng đó.
- **Chuyển đổi giọng nói (phía tiếng nói):** âm thanh nguồn (người A nói X) + giọng tham chiếu của người B → âm thanh B nói X.

Cả hai phân tích một dạng sóng thành (nội dung, người nói, ngữ điệu) và kết hợp lại nội dung từ một nguồn với người nói từ nguồn khác.

Ràng buộc then chốt bạn hiện phải tuân theo khi phát hành năm 2026: **watermarking và các cổng đồng ý là bắt buộc theo luật tại EU (AI Act, có hiệu lực thi hành tháng 8 năm 2026) và tại California (AB 2905, có hiệu lực năm 2025)**. Pipeline của bạn phải phát một watermark không nghe được và từ chối các bản nhân không có sự đồng ý.

## The Concept

![Voice cloning vs conversion: factorize, swap speaker, recombine](../assets/voice-cloning.svg)

**Nhân bản zero-shot.** Truyền một đoạn 5 giây đến một mô hình đã được huấn luyện trên hàng nghìn người nói. Encoder người nói ánh xạ đoạn đó thành một embedding người nói; decoder TTS được điều kiện hóa theo embedding đó cộng văn bản.

Được dùng bởi: F5-TTS (2024), YourTTS (2022), XTTS v2 (2024), OpenVoice v2 (2024).

**Fine-tuning few-shot.** Ghi 5-30 phút giọng đích. Fine-tune LoRA một mô hình cơ sở trong một giờ. Chất lượng nhảy từ "ổn" sang "không thể phân biệt". Coqui và ElevenLabs đều hỗ trợ mẫu này; cộng đồng dùng nó với F5-TTS.

**Chuyển đổi giọng nói (VC).** Hai họ:

- **Nhận dạng-tổng hợp.** Chạy mô hình giống ASR để trích xuất biểu diễn nội dung (ví dụ, các xác suất hậu nghiệm âm vị mềm, PPG), rồi tổng hợp lại với embedding người nói đích. Vững trước ngôn ngữ và giọng. Được dùng bởi KNN-VC (2023), Diff-HierVC (2023).
- **Tách biệt biểu diễn.** Huấn luyện một autoencoder tách nội dung, người nói và ngữ điệu trong không gian tiềm ẩn tại nút thắt. Hoán đổi embedding người nói khi suy luận. Chất lượng thấp hơn nhưng nhanh hơn. Được dùng bởi AutoVC (2019), các biến thể VITS-VC.

**Nhân bản dựa trên codec nơ-ron (2024+).** VALL-E, VALL-E 2, NaturalSpeech 3, VoiceBox — coi âm thanh là các token rời rạc từ SoundStream / EnCodec, huấn luyện một mô hình tự hồi quy hoặc flow-matching lớn trên các token codec. Chất lượng tương đương ElevenLabs trên các prompt ngắn.

### The ethics bit, not a bolt-on

**Watermarking.** PerTh (Perth) và SilentCipher (2024) nhúng một ID ~16-32 bit không thể nhận biết vào âm thanh. Sống sót qua tái mã hóa, truyền luồng và các chỉnh sửa phổ biến. Mã nguồn mở sẵn sàng production.

**Các cổng đồng ý.** Phải ghép mọi đầu ra được nhân bản với một hồ sơ đồng ý có thể xác minh. "Tôi, Rohit, vào ngày 2026-04-22, cho phép dùng giọng này cho mục đích X." Lưu trong một nhật ký có thể phát hiện can thiệp.

**Phát hiện.** AASIST, RawNet2 và Wav2Vec2-AASIST được cung cấp làm các bộ phát hiện. Thử thách ASVspoof 2025 công bố các EER 0.8–2.3% cho các bộ phát hiện tiên tiến nhất trước các đầu ra ElevenLabs, VALL-E 2 và Bark.

### Numbers (2026)

| Mô hình | Zero-shot? | SECS (tương đồng đích) | WER (dễ hiểu) | Tham số |
|-------|-----------|--------------------|--------------|--------|
| F5-TTS | Có | 0.72 | 2.1% | 335M |
| XTTS v2 | Có | 0.65 | 3.5% | 470M |
| OpenVoice v2 | Có | 0.70 | 2.8% | 220M |
| VALL-E 2 | Có | 0.77 | 2.4% | 370M |
| VoiceBox | Có | 0.78 | 2.1% | 330M |

SECS > 0.70 thường không thể phân biệt với đích đối với hầu hết người nghe.

```figure
sp-voice-factorize
```

## Build It

### Step 1: decompose with recognition-synthesis (code-only demo in main.py)

```python
def clone_pipeline(ref_audio, text, target_embedder, tts_model):
    speaker_emb = target_embedder.encode(ref_audio)
    mel = tts_model(text, speaker=speaker_emb)
    return vocoder(mel)
```

Đơn giản về khái niệm; phần lớn triển khai nằm trong `tts_model` và encoder người nói.

### Step 2: zero-shot clone with F5-TTS

```python
from f5_tts.api import F5TTS
tts = F5TTS()
wav = tts.infer(
    ref_file="rohit_5s.wav",
    ref_text="The quick brown fox jumps over the lazy dog.",
    gen_text="Please add milk and bread to my list.",
)
```

Bản chép lời tham chiếu phải khớp âm thanh chính xác; không khớp phá căn chỉnh.

### Step 3: voice conversion with KNN-VC

```python
import torch
from knnvc import KNNVC  # 2023 model, https://github.com/bshall/knn-vc
vc = KNNVC.load("wavlm-base-plus")
out_wav = vc.convert(source="my_voice.wav", target_pool=["alice_1.wav", "alice_2.wav"])
```

KNN-VC chạy WavLM để trích xuất các embedding theo khung cho nguồn và tập đích, rồi thay mỗi khung nguồn bằng láng giềng gần nhất trong tập. Phi tham số, hoạt động với một phút tiếng nói đích.

### Step 4: embed a watermark

```python
from silentcipher import SilentCipher
sc = SilentCipher(model="2024-06-01")
payload = b"consent_id:abc123;ts:1745353200"
watermarked = sc.embed(wav, sr=24000, message=payload)
detected = sc.detect(watermarked, sr=24000)   # returns payload bytes
```

~32 bit tải trọng, phát hiện được sau tái mã hóa MP3 và nhiễu nhẹ.

### Step 5: consent gate

```python
def cloned_inference(text, ref_audio, consent_record):
    assert verify_signature(consent_record), "Signed consent required"
    assert consent_record["speaker_id"] == hash_speaker(ref_audio)
    wav = tts.infer(ref_file=ref_audio, gen_text=text)
    wav = watermark(wav, payload=consent_record["id"])
    return wav
```

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Bản nhân zero-shot 5 giây, mã nguồn mở | F5-TTS hoặc OpenVoice v2 |
| Nhân bản production thương mại | ElevenLabs Instant Voice Clone v2.5 |
| Chuyển đổi giọng nói (viết lại) | KNN-VC hoặc Diff-HierVC |
| Fine-tune nhiều người nói | StyleTTS 2 + adapter người nói |
| Nhân bản xuyên ngôn ngữ | XTTS v2 hoặc VALL-E X |
| Phát hiện deepfake | Wav2Vec2-AASIST |

## Pitfalls

- **Bản chép lời tham chiếu lệch căn chỉnh.** F5-TTS và các mô hình tương tự yêu cầu văn bản tham chiếu khớp âm thanh tham chiếu chính xác, bao gồm dấu câu.
- **Tham chiếu có vang.** Tiếng vang giết bản nhân. Ghi khô, gần micro.
- **Không khớp cảm xúc.** Tham chiếu huấn luyện "vui vẻ" tạo các bản nhân vui vẻ cho mọi thứ. Khớp cảm xúc tham chiếu với mục đích đích.
- **Rò rỉ ngôn ngữ.** Nhân bản một người nói tiếng Anh rồi yêu cầu mô hình nói tiếng Pháp thường vẫn mang theo giọng; dùng các mô hình xuyên ngôn ngữ (XTTS, VALL-E X).
- **Không watermark.** Không thể phát hành hợp pháp tại EU từ tháng 8 năm 2026.

## Ship It

Lưu thành `outputs/skill-voice-cloner.md`. Thiết kế một pipeline nhân bản hoặc chuyển đổi với cổng đồng ý + watermark + mục tiêu chất lượng.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Minh họa hoán đổi embedding người nói bằng cách tính cosine giữa hai "người nói" trước và sau hoán đổi.
2. **Trung bình.** Dùng OpenVoice v2 để nhân bản giọng của chính bạn. Đo SECS giữa tham chiếu và bản nhân. Đo CER qua Whisper.
3. **Khó.** Áp dụng watermark SilentCipher cho 20 bản nhân, chạy chúng qua mã hóa+giải mã MP3 128 kbps, phát hiện tải trọng. Báo cáo độ chính xác bit.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Zero-shot clone (Bản nhân zero-shot) | 5 giây là đủ | Mô hình tiền huấn luyện + embedding người nói; không huấn luyện. |
| PPG | Phonetic posteriorgram | Các xác suất hậu nghiệm ASR theo khung được dùng làm biểu diễn nội dung không phụ thuộc ngôn ngữ. |
| KNN-VC | Chuyển đổi láng giềng gần nhất | Thay mỗi khung nguồn bằng khung trong tập đích gần nhất. |
| Neural codec TTS (TTS codec nơ-ron) | Kiểu VALL-E | Mô hình AR trên các token EnCodec/SoundStream. |
| Watermark | Chữ ký không nghe được | Các bit được nhúng trong âm thanh, sống sót qua tái mã hóa. |
| SECS | Độ trung thực nhân bản | Cosine giữa các embedding người nói đích và bản nhân. |
| AASIST | Bộ phát hiện deepfake | Mô hình chống giả mạo; phát hiện tiếng nói được tổng hợp. |

## Further Reading

- [Chen et al. (2024). F5-TTS](https://arxiv.org/abs/2410.06885) — nhân bản zero-shot SOTA mã nguồn mở.
- [Baevski et al. / Microsoft (2023). VALL-E](https://arxiv.org/abs/2301.02111) và [VALL-E 2 (2024)](https://arxiv.org/abs/2406.05370) — TTS codec nơ-ron.
- [Qian et al. (2019). AutoVC](https://arxiv.org/abs/1905.05879) — chuyển đổi giọng nói dựa trên tách biệt biểu diễn.
- [Baas, Waubert de Puiseau, Kamper (2023). KNN-VC](https://arxiv.org/abs/2305.18975) — VC dựa trên truy xuất.
- [SilentCipher (2024) — Audio Watermarking](https://github.com/sony/silentcipher) — watermark âm thanh 32 bit sẵn sàng production.
- [ASVspoof 2025 results](https://www.asvspoof.org/) — cuộc chạy đua vũ trang bộ phát hiện với bộ tổng hợp, cập nhật năm 2026.
