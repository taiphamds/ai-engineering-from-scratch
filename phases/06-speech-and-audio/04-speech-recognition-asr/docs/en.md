# Speech Recognition (ASR) — CTC, RNN-T, Attention

> Nhận dạng tiếng nói là phân loại âm thanh ở mỗi bước thời gian, được ghép lại bằng một mô hình chuỗi biết tiếng Anh và sự im lặng. CTC, RNN-T và attention là ba cách làm điều đó. Chọn một và hiểu vì sao.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 5 · 08 (CNNs & RNNs for Text), Phase 5 · 10 (Attention)
**Time:** ~45 minutes

## The Problem

Bạn có một đoạn 10 giây 16 kHz. Bạn muốn một chuỗi: "bật đèn bếp". Thách thức có tính cấu trúc: các khung âm thanh không căn chỉnh một-một với các ký tự. Từ "okay" có thể mất 200 ms hoặc 1200 ms. Sự im lặng ngắt phát ngôn. Một số âm vị dài hơn các âm vị khác. Số token đầu ra không được biết trước.

Ba cách phát biểu giải quyết điều này:

1. **CTC (Connectionist Temporal Classification).** Phát các xác suất token theo khung bao gồm một *blank* đặc biệt. Thu gọn các lần lặp và blank khi giải mã. Không tự hồi quy, nhanh. Được dùng bởi wav2vec 2.0, MMS.
2. **RNN-T (Recurrent Neural Network Transducer).** Mạng kết hợp dự đoán token tiếp theo khi biết khung encoder và các token trước. Có thể truyền luồng. Được dùng bởi ASR trên thiết bị của Google, NVIDIA Parakeet.
3. **Encoder-decoder attention.** Encoder nén âm thanh thành các trạng thái ẩn, decoder cross-attention để sinh token tự hồi quy. Được dùng bởi Whisper, SeamlessM4T.

Năm 2026, WER SOTA trên LibriSpeech test-clean là 1.4% (Parakeet-TDT-1.1B, NVIDIA) và 1.58% (Whisper-Large-v3-turbo). Các khác biệt rất nhỏ; các khác biệt triển khai rất lớn.

## The Concept

![Three ASR formulations: CTC, RNN-T, attention-encoder-decoder](../assets/asr-formulations.svg)

**Trực giác CTC.** Để encoder xuất `T` phân phối cấp khung trên `V+1` token (V ký tự + blank). Với một chuỗi đích `y` có độ dài `U < T`, bất kỳ căn chỉnh khung nào thu gọn về `y` đều được tính. CTC loss cộng trên tất cả các căn chỉnh như vậy. Suy luận: argmax theo khung, thu gọn các lần lặp, loại các blank.

Ưu điểm: không tự hồi quy, có thể truyền luồng, không nhìn trước. Nhược điểm: *giả định độc lập có điều kiện* — mỗi dự đoán khung độc lập với các dự đoán khác, nên không có mô hình ngôn ngữ nội tại. Sửa bằng một LM bên ngoài qua beam search hoặc shallow fusion.

**Trực giác RNN-T.** Thêm một mạng *dự đoán* embedding lịch sử token và một *bộ kết hợp* kết hợp trạng thái bộ dự đoán với khung encoder thành một phân phối đồng thời trên `V+1` (`+1` là null / không phát). Mô hình hóa tường minh phụ thuộc có điều kiện mà CTC bỏ qua. Có thể truyền luồng vì mỗi bước chỉ được điều kiện hóa theo các khung quá khứ và các token quá khứ.

Ưu điểm: có thể truyền luồng + LM nội tại. Nhược điểm: huấn luyện phức tạp hơn và ngốn bộ nhớ (lưới loss 3D); các kernel RNN-T loss tự chúng là cả một loại thư viện.

**Encoder-decoder attention.** Encoder (6-32 tầng transformer) trên các khung log-mel. Decoder (6-32 tầng transformer) cross-attention vào các đầu ra encoder để sinh token tự hồi quy. Không ràng buộc căn chỉnh — attention có thể nhìn bất kỳ đâu trong âm thanh. Không thể truyền luồng trừ khi bạn hạn chế attention (Whisper-Streaming chia khối, 2024).

Ưu điểm: chất lượng cao nhất trên ASR ngoại tuyến, dễ huấn luyện bằng công cụ seq2seq tiêu chuẩn. Nhược điểm: độ trễ tự hồi quy tỷ lệ với độ dài đầu ra; không thể truyền luồng nếu không làm kỹ thuật.

### WER: the one number

**Tỷ lệ Lỗi Từ** = `(S + D + I) / N`, trong đó S=thay thế, D=xóa, I=chèn, N=số từ tham chiếu. Khớp khoảng cách chỉnh sửa Levenshtein ở cấp từ. Thấp hơn là tốt hơn. WER trên 20% thường không dùng được; dưới 5% là ngang con người cho tiếng nói đọc. Các con số năm 2026 trên các benchmark tiêu chuẩn:

| Mô hình | LibriSpeech test-clean | LibriSpeech test-other | Kích thước |
|-------|------------------------|------------------------|------|
| Parakeet-TDT-1.1B | 1.40% | 2.78% | 1.1B tham số |
| Whisper-Large-v3-turbo | 1.58% | 3.03% | 809M |
| Canary-1B Flash | 1.48% | 2.87% | 1B |
| Seamless M4T v2 | 1.7% | 3.5% | 2.3B |

Tất cả đều dựa trên encoder-decoder hoặc RNN-T. Các hệ thống CTC thuần (wav2vec 2.0) nằm quanh 1.8–2.1% trên test-clean.

```figure
ctc-collapse
```

## Build It

### Step 1: greedy CTC decode

```python
def ctc_greedy(frame_logits, blank=0, vocab=None):
    # frame_logits: list of per-frame probability vectors
    preds = [max(range(len(p)), key=lambda i: p[i]) for p in frame_logits]
    out = []
    prev = -1
    for p in preds:
        if p != prev and p != blank:
            out.append(p)
        prev = p
    return "".join(vocab[i] for i in out) if vocab else out
```

Hai quy tắc: thu gọn các lần lặp liên tiếp, bỏ các blank. Ví dụ: `a a _ _ a b b _ c` → `a a b c`.

### Step 2: beam-search CTC

```python
def ctc_beam(frame_logits, beam=8, blank=0):
    import math
    beams = [([], 0.0)]  # (tokens, log_prob)
    for p in frame_logits:
        log_p = [math.log(max(pi, 1e-10)) for pi in p]
        candidates = []
        for seq, lp in beams:
            for t, lpt in enumerate(log_p):
                new = seq[:] if t == blank else (seq + [t] if not seq or seq[-1] != t else seq)
                candidates.append((new, lp + lpt))
        candidates.sort(key=lambda x: -x[1])
        beams = candidates[:beam]
    return beams[0][0]
```

Production dùng beam search cây tiền tố với kết hợp LM; đây là khung khái niệm.

### Step 3: WER

```python
def wer(ref, hyp):
    r, h = ref.split(), hyp.split()
    dp = [[0] * (len(h) + 1) for _ in range(len(r) + 1)]
    for i in range(len(r) + 1):
        dp[i][0] = i
    for j in range(len(h) + 1):
        dp[0][j] = j
    for i in range(1, len(r) + 1):
        for j in range(1, len(h) + 1):
            cost = 0 if r[i - 1] == h[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            )
    return dp[len(r)][len(h)] / max(1, len(r))
```

### Step 4: inference against Whisper

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe("clip.wav")
print(result["text"])
```

Một dòng cho ASR tổng quát mạnh nhất năm 2026. Chạy trên GPU 24 GB ở tốc độ ~20× thời gian thực.

### Step 5: streaming with Parakeet or wav2vec 2.0

```python
from transformers import pipeline
asr = pipeline("automatic-speech-recognition", model="nvidia/parakeet-tdt-1.1b")
for chunk in streaming_audio():
    print(asr(chunk, return_timestamps=True))
```

ASR luồng cần attention encoder chia khối và trạng thái chuyển tiếp; dùng một thư viện hỗ trợ nó (NeMo cho Parakeet, pipeline `transformers` với `chunk_length_s`).

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Tiếng Anh, ngoại tuyến, chất lượng tối đa | Whisper-large-v3-turbo |
| Đa ngôn ngữ, vững chắc | SeamlessM4T v2 |
| Truyền luồng, độ trễ thấp | Parakeet-TDT-1.1B hoặc Riva |
| Biên, di động, độ trễ <500 ms | Whisper-Tiny được lượng tử hóa hoặc Moonshine (2024) |
| Dạng dài | Whisper với chia khối dựa trên VAD (WhisperX) |
| Riêng lĩnh vực (y tế, pháp lý) | Fine-tune wav2vec 2.0 + kết hợp LM lĩnh vực |

## Pitfalls that still ship in 2026

- **Không VAD.** Chạy Whisper trên sự im lặng tạo ảo giác ("Cảm ơn đã xem!"). Luôn chặn bằng VAD.
- **WER ký tự so với từ so với từ con.** Báo cáo WER cấp từ *sau* chuẩn hóa (chữ thường, bỏ dấu câu).
- **Độ trôi nhận dạng ngôn ngữ.** LID tự động của Whisper định tuyến sai các đoạn nhiễu sang tiếng Nhật hoặc Welsh; ép `language="en"` khi bạn biết.
- **Các đoạn dài không chia khối.** Whisper có cửa sổ 30 giây. Dùng `chunk_length_s=30, stride=5` cho bất kỳ thứ gì dài hơn.

## Ship It

Lưu thành `outputs/skill-asr-picker.md`. Chọn mô hình, chiến lược giải mã, chia khối và kết hợp LM cho một đích triển khai nhất định.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Nó giải mã tham lam một đầu ra CTC được tạo thủ công và tính WER so với một tham chiếu.
2. **Trung bình.** Triển khai đúng beam search cây tiền tố ở Bước 2 (tính đến quy tắc gộp blank). So sánh với tham lam trên một tập dữ liệu tổng hợp 10 ví dụ.
3. **Khó.** Dùng `whisper-large-v3-turbo` trên [LibriSpeech test-clean](https://www.openslr.org/12). Tính WER trên 100 phát ngôn đầu. So sánh với các con số đã công bố.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| CTC | Loss token blank | Lấy biên trên mọi căn chỉnh khung-token; không AR. |
| RNN-T | Loss truyền luồng | CTC + bộ dự đoán token tiếp theo; xử lý thứ tự từ. |
| Attention enc-dec | Kiểu Whisper | Encoder + decoder cross-attention; chất lượng ngoại tuyến tốt nhất. |
| WER | Con số bạn báo cáo | `(S+D+I)/N` ở cấp từ. |
| Blank | Sự trống rỗng | Token đặc biệt trong CTC báo "không phát ở khung này". |
| LM fusion (Kết hợp LM) | Mô hình ngôn ngữ bên ngoài | Thêm các log xác suất LM có trọng số trong beam search. |
| VAD | Cổng im lặng | Bộ phát hiện hoạt động giọng nói; cắt phần không phải tiếng nói. |

## Further Reading

- [Graves et al. (2006). Connectionist Temporal Classification](https://www.cs.toronto.edu/~graves/icml_2006.pdf) — bài báo CTC.
- [Graves (2012). Sequence Transduction with RNNs](https://arxiv.org/abs/1211.3711) — bài báo RNN-T.
- [Radford et al. / OpenAI (2022). Whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) — bài báo kinh điển năm 2022; phần mở rộng v3-turbo năm 2024.
- [NVIDIA NeMo — Parakeet-TDT card](https://huggingface.co/nvidia/parakeet-tdt-1.1b) — dẫn đầu Open ASR Leaderboard năm 2026.
- [Hugging Face — Open ASR Leaderboard](https://huggingface.co/spaces/hf-audio/open_asr_leaderboard) — benchmark trực tiếp trên 25+ mô hình.
