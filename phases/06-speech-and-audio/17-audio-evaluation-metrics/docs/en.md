# Audio Evaluation — WER, MOS, UTMOS, MMAU, FAD, and the Open Leaderboards

> Bạn không thể phát hành thứ bạn không thể đo. Bài học này nêu tên các thước đo năm 2026 cho mọi tác vụ âm thanh: ASR (WER, CER, RTFx), TTS (MOS, UTMOS, SECS, WER trên vòng đi-về ASR), ngôn ngữ âm thanh (MMAU, LongAudioBench), âm nhạc (FAD, CLAP) và người nói (EER). Cộng các bảng xếp hạng nơi bạn so sánh.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04, 06, 07, 09, 10; Phase 2 · 09 (Model Evaluation)
**Time:** ~60 minutes

## The Problem

Mọi tác vụ âm thanh có nhiều thước đo, mỗi thước đo một trục khác nhau. Dùng sai thước đo là cách bạn phát hành một mô hình trông tuyệt trên bảng điều khiển và tệ hại trong production. Danh sách kinh điển năm 2026:

| Tác vụ | Chính | Phụ |
|------|---------|-----------|
| ASR | WER | CER · RTFx · độ trễ token đầu |
| TTS | MOS / UTMOS | SECS · WER trên vòng đi-về ASR · CER · TTFA |
| Nhân bản giọng nói | SECS (cosine ECAPA) | MOS · CER |
| Xác minh người nói | EER | minDCF · FAR / FRR tại điểm vận hành |
| Phân đoạn người nói | DER | JER · nhầm lẫn người nói |
| Phân loại âm thanh | top-1 · mAP | macro F1 · recall theo lớp |
| Sinh nhạc | FAD | CLAP · MOS hội đồng nghe |
| Mô hình ngôn ngữ âm thanh | MMAU-Pro | LongAudioBench · FENSE AudioCaps |
| S2S luồng | độ trễ P50/P95 | WER · MOS |

## The Concept

![Audio evaluation matrix — metrics vs tasks vs 2026 leaderboards](../assets/eval-landscape.svg)

### ASR metrics

**WER (Tỷ lệ Lỗi Từ).** `(S + D + I) / N`. Chuyển chữ thường, bỏ dấu câu, chuẩn hóa số trước khi chấm. Dùng `jiwer` hoặc `whisper_normalizer` của OpenAI. &lt; 5% = tiếng nói đọc ngang con người.

**CER (Tỷ lệ Lỗi Ký tự).** Cùng công thức, cấp ký tự. Dùng cho các ngôn ngữ thanh điệu (Quan Thoại, Quảng Đông) nơi phân đoạn từ mơ hồ.

**RTFx (hệ số thời gian thực nghịch đảo).** Số giây âm thanh được xử lý mỗi giây thời gian thực. Cao hơn là tốt hơn. Parakeet-TDT đạt 3380×. Whisper-large-v3 là ~30×.

**Độ trễ token đầu.** Thời gian thực từ đầu vào âm thanh đến token chép lời đầu tiên. Thiết yếu cho truyền luồng. Deepgram Nova-3: ~150 ms.

### TTS metrics

**MOS (Điểm Ý kiến Trung bình).** Đánh giá con người 1-5. Tiêu chuẩn vàng nhưng chậm. Thu thập 20+ người nghe mỗi mẫu, 100+ mẫu mỗi mô hình.

**UTMOS (2022-2026).** Bộ dự đoán MOS được học. Tương quan ~0.9 với MOS con người trên các benchmark tiêu chuẩn. F5-TTS: UTMOS 3.95; ground truth: 4.08.

**SECS (Speaker Encoder Cosine Similarity).** Cho nhân bản giọng nói. Cosine embedding ECAPA giữa tham chiếu và đầu ra được nhân bản. &gt; 0.75 = bản nhân có thể nhận ra.

**WER trên vòng đi-về ASR.** Chạy Whisper trên đầu ra TTS, tính WER so với văn bản đầu vào. Phát hiện các hồi quy tính dễ hiểu. SOTA 2026: CER &lt; 2%.

**TTFA (thời gian đến âm thanh đầu tiên).** Độ trễ thời gian thực. Kokoro-82M: ~100 ms; F5-TTS: ~1 s.

### Voice-cloning-specific

**SECS + MOS + CER** thành một bộ ba. Nhân bản đạt SECS cao nhưng MOS thấp nghĩa là đúng âm sắc nhưng không tự nhiên; ngược lại nghĩa là giọng tự nhiên nhưng sai người nói.

### Speaker verification

**EER (Tỷ lệ Lỗi Bằng nhau).** Ngưỡng nơi Tỷ lệ Chấp nhận Sai bằng Tỷ lệ Từ chối Sai. ECAPA trên VoxCeleb1-O: 0.87%.

**minDCF (Chi phí Phát hiện tối thiểu).** Chi phí có trọng số tại một điểm vận hành được chọn (thường FAR=0.01). Liên quan production hơn EER.

### Diarization

**DER (Tỷ lệ Lỗi Phân đoạn Người nói).** `(FA + Miss + Confusion) / total_speaker_time`. Tiếng nói bị bỏ sót + tiếng nói báo động giả + nhầm lẫn người nói, mỗi thứ dưới dạng một tỷ lệ. Các cuộc họp AMI: DER ~10-20% là thực tế. pyannote 3.1 + Precision-2 thương mại: DER &lt;10% trên âm thanh ghi tốt.

**JER (Tỷ lệ Lỗi Jaccard).** Phương án thay thế DER, vững trước thiên lệch đoạn ngắn.

### Audio classification

Đa nhãn: **mAP (mean Average Precision)** trên mọi lớp. AudioSet: mAP 0.548 cho BEATs-iter3.

Đa lớp loại trừ: **accuracy top-1, top-5**. Speech Commands v2: top-1 99.0% (Audio-MAE).

Mất cân bằng: **macro F1** + **recall theo lớp**. Báo cáo theo lớp — accuracy tổng hợp che giấu những lớp nào thất bại.

### Music generation

**FAD (Fréchet Audio Distance).** Khoảng cách giữa các phân phối embedding VGGish của âm thanh thực so với được sinh. MusicGen-small trên MusicCaps: 4.5. MusicLM: 4.0. Thấp hơn tốt hơn.

**Điểm CLAP.** Điểm căn chỉnh văn bản-âm thanh bằng các embedding CLAP. &gt; 0.3 = căn chỉnh hợp lý.

**MOS hội đồng nghe.** Vẫn là quyết định cuối cho âm nhạc cấp tiêu dùng. Suno v5 ELO 1293 trên TTS Arena (từ các ưu tiên con người theo cặp).

### Audio-language benchmarks

**MMAU (Massive Multi-Audio Understanding).** 10k cặp QA âm thanh.

**MMAU-Pro.** 1800 mục khó, bốn nhóm: tiếng nói / âm thanh / âm nhạc / nhiều âm thanh. Mức ngẫu nhiên 25% trên 4 ngả. Gemini 2.5 Pro tổng thể ~60%; nhiều âm thanh ~22% trên mọi mô hình.

**LongAudioBench.** Các đoạn nhiều phút với các truy vấn ngữ nghĩa. Audio Flamingo Next thắng Gemini 2.5 Pro.

**AudioCaps / Clotho.** Các benchmark chú thích. Các thước đo SPICE, CIDEr, FENSE.

### Streaming speech-to-speech

**Độ trễ P50 / P95 / P99.** Thời gian thực từ kết thúc tiếng nói người dùng đến phản hồi nghe được đầu tiên. Moshi: 200 ms; GPT-4o Realtime: 300 ms.

**WER / MOS** trên đầu ra.

**Độ phản hồi chen lời.** Thời gian từ người dùng ngắt đến trợ lý tắt tiếng. Mục tiêu &lt; 150 ms.

### The 2026 leaderboards

| Bảng xếp hạng | Track | URL |
|------------|--------|-----|
| Open ASR Leaderboard (HF) | Tiếng Anh + đa ngôn ngữ + dạng dài | `huggingface.co/spaces/hf-audio/open_asr_leaderboard` |
| TTS Arena (HF) | TTS tiếng Anh | `huggingface.co/spaces/TTS-AGI/TTS-Arena` |
| Artificial Analysis Speech | TTS + STT, ELO từ các phiếu theo cặp | `artificialanalysis.ai/speech` |
| MMAU-Pro | Suy luận LALM | `sonalkum.github.io/mmau-pro` |
| SpeakerBench / VoxSRC | Nhận dạng người nói | `voxsrc.github.io` |
| Tập con âm nhạc MMAU | LALM âm nhạc | (trong MMAU) |
| HEAR benchmark | Âm thanh tự giám sát | `hearbenchmark.com` |

```figure
sp-wer-align
```

## Build It

### Step 1: WER with normalization

```python
from jiwer import wer, Compose, ToLowerCase, RemovePunctuation, Strip

transform = Compose([ToLowerCase(), RemovePunctuation(), Strip()])
score = wer(
    truth="Please turn on the lights.",
    hypothesis="please turn on the light",
    truth_transform=transform,
    hypothesis_transform=transform,
)
# ~0.17
```

### Step 2: TTS round-trip WER

```python
def ttr_wer(tts_model, asr_model, texts):
    errors = []
    for txt in texts:
        audio = tts_model.synthesize(txt)
        recog = asr_model.transcribe(audio)
        errors.append(wer(truth=txt, hypothesis=recog))
    return sum(errors) / len(errors)
```

### Step 3: SECS for voice cloning

```python
from speechbrain.inference.speaker import EncoderClassifier
sv = EncoderClassifier.from_hparams("speechbrain/spkrec-ecapa-voxceleb")

emb_ref = sv.encode_batch(load_wav("reference.wav"))
emb_clone = sv.encode_batch(load_wav("cloned.wav"))
secs = torch.nn.functional.cosine_similarity(emb_ref, emb_clone, dim=-1).item()
```

### Step 4: FAD for music generation

```python
from frechet_audio_distance import FrechetAudioDistance
fad = FrechetAudioDistance()
score = fad.get_fad_score("generated_folder/", "reference_folder/")
```

### Step 5: EER for speaker verification (same code as Lesson 6)

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 0.0)
    for t in thresholds:
        far = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        frr = sum(1 for s in same_scores if s < t) / len(same_scores)
        if abs(far - frr) < best[0]:
            best = (abs(far - frr), (far + frr) / 2)
    return best[1]
```

## Use It

Ghép mọi triển khai với một bộ chạy đánh giá cố định chạy ở mỗi lần cập nhật mô hình. Ba quy tắc chủ đạo:

1. **Chuẩn hóa trước khi chấm.** Chữ thường, bỏ dấu câu, mở rộng số. Báo cáo quy tắc chuẩn hóa.
2. **Báo cáo các phân phối, không phải các trung bình.** P50/P95/P99 cho độ trễ. Recall theo lớp cho phân loại. Theo nhóm cho MMAU.
3. **Chạy một benchmark công khai kinh điển.** Ngay cả khi dữ liệu production của bạn khác, báo cáo trên Open ASR / TTS Arena / MMAU cho phép người đánh giá so sánh tương đương.

## Pitfalls

- **Ngoại suy UTMOS.** Được huấn luyện trên tiếng nói sạch kiểu VCTK; chấm âm thanh nhiễu / được nhân bản / có cảm xúc kém.
- **Thiên lệch hội đồng MOS.** 20 người lao động Amazon Mechanical Turk ≠ 20 người dùng đích. Trả tiền cho một hội đồng lĩnh vực nếu hệ quả lớn.
- **FAD phụ thuộc tập tham chiếu.** So sánh với cùng phân phối tham chiếu giữa các mô hình.
- **WER tổng hợp.** WER tổng thể 5% có thể che giấu WER 30% trên tiếng nói có giọng vùng miền. Báo cáo theo lát cắt nhân khẩu học.
- **Bão hòa benchmark công khai.** Hầu hết các mô hình tiên phong gần mức trần trên các benchmark tiêu chuẩn. Xây dựng một tập được giữ lại nội bộ phản ánh lưu lượng của bạn.

## Ship It

Lưu thành `outputs/skill-audio-evaluator.md`. Chọn các thước đo, benchmark và định dạng báo cáo cho bất kỳ bản phát hành mô hình âm thanh nào.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Tính WER / CER / EER / SECS / gần FAD / gần MMAU trên các đầu vào đồ chơi.
2. **Trung bình.** Xây dựng một bộ chạy WER vòng đi-về TTS. Chạy đầu ra Kokoro hoặc F5-TTS của bạn qua Whisper. Tính WER trên 50 prompt. Đánh dấu các prompt có WER &gt; 10%.
3. **Khó.** Chấm lựa chọn LALM Bài 10 của bạn trên các tập con tiếng nói + nhiều âm thanh MMAU-Pro (mỗi tập 50 mục). Báo cáo accuracy theo nhóm và so sánh với con số đã công bố.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| WER | Điểm ASR | `(S+D+I)/N` ở cấp từ sau chuẩn hóa. |
| CER | WER ký tự | Cho các ngôn ngữ thanh điệu hoặc các hệ thống cấp ký tự. |
| MOS | Ý kiến con người | Đánh giá 1-5; 20+ người nghe × 100 mẫu. |
| UTMOS | Bộ dự đoán MOS ML | Mô hình được học; tương quan ~0.9 với MOS con người. |
| SECS | Độ tương đồng bản nhân giọng | Cosine ECAPA giữa tham chiếu và bản nhân. |
| EER | Điểm xác minh người nói | Ngưỡng nơi FAR = FRR. |
| DER | Điểm phân đoạn người nói | (FA + Miss + Confusion) / total. |
| FAD | Chất lượng sinh nhạc | Khoảng cách Fréchet trên các embedding VGGish. |
| RTFx | Thông lượng | Số giây âm thanh mỗi giây thời gian thực. |

## Further Reading

- [jiwer](https://github.com/jitsi/jiwer) — thư viện WER/CER với các tiện ích chuẩn hóa.
- [UTMOS (Saeki et al. 2022)](https://arxiv.org/abs/2204.02152) — bộ dự đoán MOS được học.
- [Fréchet Audio Distance (Kilgour et al. 2019)](https://arxiv.org/abs/1812.08466) — tiêu chuẩn sinh nhạc.
- [Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) — các thứ hạng trực tiếp năm 2026.
- [TTS Arena](https://huggingface.co/spaces/TTS-AGI/TTS-Arena) — bảng xếp hạng TTS bỏ phiếu con người.
- [MMAU-Pro benchmark](https://sonalkum.github.io/mmau-pro/) — bảng xếp hạng suy luận LALM.
- [HEAR benchmark](https://hearbenchmark.com/) — các benchmark SSL âm thanh.
