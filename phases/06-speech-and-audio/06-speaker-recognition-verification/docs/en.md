# Speaker Recognition & Verification

> ASR hỏi "họ đã nói gì?" Nhận dạng người nói hỏi "ai đã nói?" Phần toán trông giống nhau — embedding cộng cosine — nhưng mọi quyết định production xoay quanh một con số EER duy nhất.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 22 (Embedding Models)
**Time:** ~45 minutes

## The Problem

Một người dùng nói một cụm mật khẩu. Bạn muốn biết: đây có phải người họ tự nhận không (*xác minh*, 1:1), hay có phải người đầu tiên trong kho đăng ký của bạn không (*định danh*, 1:N)? Hoặc không phải cả hai — đây có phải một người nói chưa biết không (*tập mở*)?

Trước 2018: GMM-UBM + i-vector. EER hợp lý nhưng mong manh trước dịch chuyển kênh (điện thoại so với máy tính xách tay) và cảm xúc. 2018–2022: x-vector (backbone TDNN được huấn luyện với biên góc). 2022+: ECAPA-TDNN và các embedding WavLM-large. Đến năm 2026 lĩnh vực bị chi phối bởi ba mô hình và một thước đo.

Thước đo là **EER** — Tỷ lệ Lỗi Bằng nhau. Đặt ngưỡng quyết định của bạn sao cho Tỷ lệ Chấp nhận Sai = Tỷ lệ Từ chối Sai. Điểm giao là EER. Được dùng trong mọi bài báo, mọi bảng xếp hạng, mọi cuộc trao đổi mua sắm.

## The Concept

![Enrollment + verification pipeline with embedding + cosine + EER](../assets/speaker-verification.svg)

**Pipeline.** Đăng ký: ghi 5–30 giây người nói đích; tính một embedding số chiều cố định (192 chiều cho ECAPA-TDNN, 256 chiều cho WavLM-large). Xác minh: lấy embedding phát ngôn kiểm thử; tính cosine similarity; so với một ngưỡng.

**ECAPA-TDNN (2020, vẫn chủ đạo năm 2026).** Emphasized Channel Attention, Propagation and Aggregation - Time-Delay Neural Network. Các khối tích chập 1D với squeeze-excitation, pooling multi-head attention, theo sau là một tầng tuyến tính đến 192 chiều. Được huấn luyện trên VoxCeleb 1+2 (2,700 người nói, 1.1M phát ngôn) với Additive Angular Margin loss (AAM-softmax).

**WavLM-SV (2022+).** Fine-tune một backbone SSL WavLM-large được tiền huấn luyện với AAM loss. Chất lượng cao hơn nhưng chậm hơn — 300+ MB so với 15 MB.

**x-vector (baseline).** TDNN + pooling thống kê. Cổ điển; vẫn hữu ích trên CPU / biên.

**AAM-softmax.** Softmax tiêu chuẩn với biên `m` được thêm trong không gian góc: `cos(θ + m)` cho lớp đúng. Buộc phân tách góc giữa các lớp. Điển hình `m=0.2`, hệ số `s=30`.

### Scoring

- **Cosine** giữa các embedding đăng ký và kiểm thử. Quyết định dựa trên ngưỡng.
- **PLDA (LDA xác suất).** Chiếu các embedding vào một không gian tiềm ẩn nơi cùng người nói so với khác người nói có một tỷ số likelihood dạng đóng. Được thêm trên cosine để giảm EER thêm 10–20%. Tiêu chuẩn trước 2020; hiện chỉ dùng trong các thiết lập tập đóng.
- **Chuẩn hóa điểm.** `S-norm` hoặc `AS-norm`: chuẩn hóa mỗi điểm theo một nhóm các trung bình và độ lệch chuẩn của kẻ mạo danh. Thiết yếu cho đánh giá xuyên lĩnh vực.

### Numbers you should know (2026)

| Mô hình | VoxCeleb1-O EER | Tham số | Thông lượng (A100) |
|-------|-----------------|--------|-------------------|
| x-vector (cổ điển) | 3.10% | 5 M | 400× RT |
| ECAPA-TDNN | 0.87% | 15 M | 200× RT |
| WavLM-SV large | 0.42% | 316 M | 20× RT |
| Phân đoạn + embedding Pyannote 3.1 | 0.65% | 6 M | 100× RT |
| ReDimNet (2024) | 0.39% | 24 M | 100× RT |

### Diarization

"Ai nói khi nào" trong một đoạn nhiều người nói. Pipeline: VAD → phân đoạn → embedding mỗi đoạn → phân cụm (kết tụ hoặc phổ) → làm mượt các ranh giới. Ngăn xếp hiện đại: `pyannote.audio` 3.1, gói phân đoạn người nói + embedding + phân cụm sau một lời gọi. DER SOTA năm 2026 trên AMI là ~15% (giảm từ 23% năm 2022).

```figure
sp-eer-crossover
```

## Build It

### Step 1: toy embedding from MFCC statistics

```python
def embed_mfcc_stats(signal, sr):
    frames = featurize_mfcc(signal, sr, n_mfcc=13)
    mean = [sum(f[i] for f in frames) / len(frames) for i in range(13)]
    std = [
        math.sqrt(sum((f[i] - mean[i]) ** 2 for f in frames) / len(frames))
        for i in range(13)
    ]
    return mean + std  # 26-d
```

Cách xa SOTA — chỉ để giảng dạy. `code/main.py` dùng cách này làm bằng chứng khái niệm trên dữ liệu người nói tổng hợp.

### Step 2: cosine similarity + threshold

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a))
    nb = math.sqrt(sum(x * x for x in b))
    return dot / (na * nb) if na and nb else 0.0

def verify(enroll, test, threshold=0.75):
    return cosine(enroll, test) >= threshold
```

### Step 3: EER from similarity pairs

```python
def eer(same_scores, diff_scores):
    thresholds = sorted(set(same_scores + diff_scores))
    best = (1.0, 1.0, 0.0)  # (fa, fr, threshold)
    for t in thresholds:
        fr = sum(1 for s in same_scores if s < t) / len(same_scores)
        fa = sum(1 for s in diff_scores if s >= t) / len(diff_scores)
        if abs(fa - fr) < abs(best[0] - best[1]):
            best = (fa, fr, t)
    return (best[0] + best[1]) / 2, best[2]
```

Trả (eer, threshold_at_eer). Báo cáo cả hai.

### Step 4: production with SpeechBrain

```python
from speechbrain.pretrained import EncoderClassifier

clf = EncoderClassifier.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")

# enroll: average the embeddings of 3-5 clean samples
enroll = torch.stack([clf.encode_batch(load(x)) for x in enrollment_clips]).mean(0)
# verify
score = clf.similarity(enroll, clf.encode_batch(load("test.wav"))).item()
verdict = score > 0.25   # ECAPA typical threshold; tune on your data
```

### Step 5: diarize with pyannote

```python
from pyannote.audio import Pipeline

pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
diarization = pipe("meeting.wav", num_speakers=None)
for turn, _, speaker in diarization.itertracks(yield_label=True):
    print(f"{turn.start:.1f}–{turn.end:.1f}  {speaker}")
```

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Xác minh 1:1 tập đóng, biên | ECAPA-TDNN + ngưỡng cosine |
| Xác minh tập mở, đám mây | WavLM-SV + AS-norm |
| Phân đoạn người nói (cuộc họp, podcast) | `pyannote/speaker-diarization-3.1` |
| Chống giả mạo (phát hiện phát lại / deepfake) | AASIST hoặc RawNet2 |
| Nhúng tí hon (KWS + đăng ký) | Titanet-Small (NeMo) |

## Pitfalls

- **Không khớp kênh.** Mô hình được huấn luyện trên VoxCeleb (video web) ≠ âm thanh cuộc gọi điện thoại. Luôn đánh giá trên kênh đích.
- **Các phát ngôn ngắn.** EER suy giảm mạnh dưới 3 giây âm thanh kiểm thử.
- **Đăng ký có nhiễu.** Một lần đăng ký nhiễu làm nhiễm độc điểm neo. Dùng ≥3 mẫu sạch và lấy trung bình.
- **Ngưỡng cố định qua các điều kiện.** Luôn tinh chỉnh ngưỡng trên một tập phát triển được giữ lại từ lĩnh vực đích.
- **Cosine trên các embedding không chuẩn hóa.** Chuẩn hóa L2 trước; nếu không độ lớn chi phối.

## Ship It

Lưu thành `outputs/skill-speaker-verifier.md`. Chọn mô hình, giao thức đăng ký, kế hoạch tinh chỉnh ngưỡng và các biện pháp bảo vệ gian lận.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Xây dựng các "người nói" tổng hợp (các cấu hình âm khác nhau), đăng ký, tính EER trên một danh sách thử nghiệm 100 cặp.
2. **Trung bình.** Dùng SpeechBrain ECAPA trên 30 phát ngôn VoxCeleb1 (5 người nói × mỗi người 6). Tính EER với cosine so với PLDA.
3. **Khó.** Xây dựng pipeline đầy đủ đăng ký → phân đoạn người nói → xác minh bằng `pyannote.audio`. Đánh giá DER trên tập phát triển AMI.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| EER | Thước đo chính | Ngưỡng nơi Chấp nhận Sai = Từ chối Sai. |
| Verification (Xác minh) | 1:1 | "Đây có phải Alice không?" |
| Identification (Định danh) | 1:N | "Ai đang nói?" |
| Open-set (Tập mở) | Có thể chưa biết | Tập kiểm thử có thể chứa các người nói chưa đăng ký. |
| Enrollment (Đăng ký) | Đăng ký | Tính embedding tham chiếu của một người nói. |
| AAM-softmax | Loss | Softmax với biên góc cộng; buộc phân tách cụm. |
| PLDA | Chấm điểm cổ điển | LDA xác suất; chấm tỷ số likelihood trên các embedding. |
| DER | Thước đo phân đoạn người nói | Tỷ lệ Lỗi Phân đoạn Người nói — bỏ sót + báo động giả + nhầm lẫn. |

## Further Reading

- [Snyder et al. (2018). X-Vectors: Robust DNN Embeddings for Speaker Recognition](https://www.danielpovey.com/files/2018_icassp_xvectors.pdf) — bài báo deep embedding cổ điển.
- [Desplanques et al. (2020). ECAPA-TDNN](https://arxiv.org/abs/2005.07143) — kiến trúc chủ đạo 2020–2026.
- [Chen et al. (2022). WavLM: Large-Scale Self-Supervised Pre-Training for Full Stack Speech Processing](https://arxiv.org/abs/2110.13900) — backbone SSL cho SV và phân đoạn người nói.
- [Bredin et al. (2023). pyannote.audio 3.1](https://github.com/pyannote/pyannote-audio) — ngăn xếp phân đoạn người nói + embedding production.
- [VoxCeleb leaderboard (updated 2026)](https://www.robots.ox.ac.uk/~vgg/data/voxceleb/) — thứ hạng EER hiện tại giữa các mô hình.
