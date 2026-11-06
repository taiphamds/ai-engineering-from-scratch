# Audio Classification — From k-NN on MFCCs to AST and BEATs

> Mọi thứ từ "chó sủa so với còi báo động" đến "đây là ngôn ngữ nào" đều là phân loại âm thanh. Các đặc trưng là mel. Kiến trúc thay đổi mỗi thập kỷ. Đánh giá vẫn là AUC, F1 và recall theo lớp.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 02 (Spectrograms & Mel), Phase 3 · 06 (CNNs), Phase 5 · 08 (CNNs & RNNs for Text)
**Time:** ~75 minutes

## The Problem

Bạn nhận một đoạn 10 giây. Bạn muốn biết: "nó là gì?" Âm thanh đô thị (còi báo động, khoan, chó), lệnh tiếng nói (có/không/dừng), nhận dạng ngôn ngữ (en/es/ar), cảm xúc người nói (giận dữ/trung lập) hoặc âm thanh môi trường (trong nhà/ngoài trời, tiếng nói xôn xao). Tất cả đều là *phân loại âm thanh*, và năm 2026 kiến trúc baseline đã trưởng thành: log-mel → CNN hoặc Transformer → softmax.

Khó khăn cốt lõi không phải mạng. Nó là dữ liệu. Các tập dữ liệu âm thanh có mất cân bằng lớp khắc nghiệt, dịch chuyển lĩnh vực mạnh (sạch so với nhiễu) và nhiễu nhãn (ai quyết định "tiếng nói xôn xao đô thị" so với "tiếng ồn nhà hàng"?). 80% bài toán là tuyển chọn, tăng cường và đánh giá, không phải đổi CNN sang Transformer.

## The Concept

![Audio classification ladder: k-NN on MFCCs to AST to BEATs](../assets/audio-classification.svg)

**k-NN trên MFCC (baseline những năm 1990).** Làm phẳng MFCC theo đoạn, tính cosine similarity với một kho có nhãn, trả phiếu đa số của top K. Mạnh đến ngạc nhiên trên các tập dữ liệu sạch, nhỏ (Speech Commands, ESC-50). Chạy không GPU.

**CNN 2D trên log-mel (2015-2019).** Coi log-mel `(T, n_mels)` là một ảnh. Áp dụng ResNet-18 hoặc kiểu VGG. Pooling trung bình toàn cục trục thời gian. Softmax trên các lớp. Vẫn là baseline trong hầu hết các cuộc thi kaggle năm 2026.

**Audio Spectrogram Transformer, AST (2021-2024).** Chia log-mel thành patch (ví dụ các patch 16×16), thêm embedding vị trí, đưa vào một ViT. Tiên tiến nhất trên AudioSet (mAP 0.485) cho học có giám sát.

**BEATs và WavLM-base (2024-2026).** Tiền huấn luyện tự giám sát trên hàng triệu giờ. Fine-tune trên tác vụ của bạn với 1-10% dữ liệu có giám sát bạn sẽ cần. Năm 2026 đây là điểm khởi đầu mặc định cho âm thanh phi tiếng nói. BEATs-iter3 thắng AST 1-2 mAP trên AudioSet trong khi dùng 1/4 tính toán.

**Whisper-encoder làm backbone đóng băng (2024).** Lấy encoder của Whisper, bỏ decoder, gắn một bộ phân loại tuyến tính. Gần SOTA trên nhận dạng ngôn ngữ và phân loại sự kiện đơn giản mà không tăng cường âm thanh. Baseline "bữa trưa miễn phí".

### Class imbalance is the real challenge

ESC-50: 50 lớp, mỗi lớp 40 đoạn — cân bằng, dễ. UrbanSound8K: 10 lớp, mất cân bằng 10:1. AudioSet: 632 lớp với đuôi dài 100,000:1. Các kỹ thuật hoạt động:

- Lấy mẫu cân bằng khi huấn luyện (không phải khi đánh giá).
- Mixup: nội suy tuyến tính hai đoạn (và các nhãn của chúng) làm tăng cường.
- SpecAugment: che các dải thời gian và tần số ngẫu nhiên. Đơn giản; thiết yếu.

### Evaluation

- Đa lớp loại trừ (Speech Commands): accuracy top-1, accuracy top-5.
- Đa lớp đa nhãn (AudioSet, kiểu UrbanSound): mean average precision (mAP).
- Mất cân bằng nặng: recall theo lớp + macro F1.

Các con số năm 2026 bạn nên biết:

| Benchmark | Baseline | SOTA 2026 | Nguồn |
|-----------|----------|-----------|--------|
| ESC-50 | 82% (AST) | 97.0% (BEATs-iter3) | Bài báo BEATs (2024) |
| AudioSet mAP | 0.485 (AST) | 0.548 (BEATs-iter3) | Bảng xếp hạng HEAR 2026 |
| Speech Commands v2 | 98% (CNN) | 99.0% (Audio-MAE) | Các kết quả HEAR v2 |

```figure
mfcc-pipeline
```

## Build It

### Step 1: featurize

```python
def featurize_mfcc(signal, sr, n_mfcc=13, n_mels=40, frame_len=400, hop=160):
    mag = stft_magnitude(signal, frame_len, hop)
    fb = mel_filterbank(n_mels, frame_len, sr)
    mels = apply_filterbank(mag, fb)
    log = log_transform(mels)
    return [dct_ii(frame, n_mfcc) for frame in log]
```

### Step 2: fixed-length summary

```python
def summarize(mfcc_frames):
    n = len(mfcc_frames[0])
    mean = [sum(f[i] for f in mfcc_frames) / len(mfcc_frames) for i in range(n)]
    var = [
        sum((f[i] - mean[i]) ** 2 for f in mfcc_frames) / len(mfcc_frames) for i in range(n)
    ]
    return mean + var
```

Đơn giản nhưng mạnh: trung bình + phương sai theo thời gian cho một embedding cố định 26 chiều cho một MFCC 13 hệ số. Chạy ngay lập tức. Đánh bại các baseline NN tiên tiến nhất trên ESC-50 gần đây tận năm 2017.

### Step 3: k-NN

```python
def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1e-12
    nb = math.sqrt(sum(x * x for x in b)) or 1e-12
    return dot / (na * nb)

def knn_classify(q, bank, labels, k=5):
    sims = sorted(range(len(bank)), key=lambda i: -cosine(q, bank[i]))[:k]
    votes = Counter(labels[i] for i in sims)
    return votes.most_common(1)[0][0]
```

### Step 4: upgrade to CNN on log-mels

Trong PyTorch:

```python
import torch.nn as nn

class AudioCNN(nn.Module):
    def __init__(self, n_mels=80, n_classes=50):
        super().__init__()
        self.body = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(), nn.MaxPool2d(2),
            nn.Conv2d(64, 128, 3, padding=1), nn.ReLU(),
            nn.AdaptiveAvgPool2d(1),
        )
        self.head = nn.Linear(128, n_classes)

    def forward(self, x):  # x: (B, 1, T, n_mels)
        return self.head(self.body(x).flatten(1))
```

3M tham số. Huấn luyện trong ~10 phút trên ESC-50 với một RTX 4090 duy nhất. Accuracy 80%+.

### Step 5: fine-tune a pretrained audio transformer (AST shown)

```python
from transformers import ASTFeatureExtractor, ASTForAudioClassification

ext = ASTFeatureExtractor.from_pretrained("MIT/ast-finetuned-audioset-10-10-0.4593")
model = ASTForAudioClassification.from_pretrained(
    "MIT/ast-finetuned-audioset-10-10-0.4593",
    num_labels=50,
    ignore_mismatched_sizes=True,
)

inputs = ext(audio, sampling_rate=16000, return_tensors="pt")
logits = model(**inputs).logits
```

Ví dụ fine-tune AST từ Hub. BEATs, mặc định năm 2026, không nằm trên Hugging Face Hub: tải một checkpoint từ [bản phát hành BEATs trong microsoft/unilm](https://github.com/microsoft/unilm/tree/master/beats) và tải bằng các lớp `BEATs` và `BEATsConfig` của kho đó; vòng lặp fine-tuning giữ cùng hình dạng.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Bắt đầu với |
|-----------|-----------|
| Tập dữ liệu tí hon (<1000 đoạn) | k-NN trên các trung bình MFCC (baseline của bạn) + tăng cường âm thanh |
| Tập dữ liệu vừa (1K–100K) | Fine-tune BEATs hoặc AST |
| Tập dữ liệu lớn (>100K) | Huấn luyện từ đầu hoặc fine-tune Whisper-encoder |
| Thời gian thực, biên | CNN 40-MFCC, lượng tử hóa thành int8 (kiểu KWS) |
| Đa nhãn (AudioSet) | BEATs-iter3 với BCE loss + mixup + SpecAugment |
| Nhận dạng ngôn ngữ | MMS-LID, baseline SpeechBrain VoxLingua107 |

Quy tắc quyết định: **bắt đầu với một backbone đóng băng, không phải mô hình mới**. Fine-tuning một head BEATs cho bạn 95% của SOTA trong hàng giờ, không phải hàng tuần.

## Ship It

Lưu thành `outputs/skill-classifier-designer.md`. Chọn kiến trúc, các phép tăng cường, chiến lược cân bằng lớp và thước đo đánh giá cho một tác vụ phân loại âm thanh nhất định.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Nó huấn luyện baseline k-NN MFCC trên một tập dữ liệu tổng hợp 4 lớp (các âm thuần ở các cao độ khác nhau). Báo cáo ma trận nhầm lẫn.
2. **Trung bình.** Thay `summarize` bằng [mean, var, skew, kurtosis]. Pooling 4 mômen có thắng trung bình+phương sai trên cùng tập dữ liệu tổng hợp không?
3. **Khó.** Dùng `torchaudio`, huấn luyện một CNN 2D trên fold 1 của ESC-50. Báo cáo accuracy kiểm định chéo 5 fold. Thêm SpecAugment (mặt nạ thời gian = 20, mặt nạ tần số = 10) và báo cáo chênh lệch.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| AudioSet | ImageNet của âm thanh | Tập dữ liệu YouTube 2M đoạn, 632 lớp có nhãn yếu của Google. |
| ESC-50 | Benchmark phân loại nhỏ | 50 lớp × 40 đoạn âm thanh môi trường. |
| AST | Audio Spectrogram Transformer | ViT trên các patch log-mel; SOTA 2021. |
| BEATs | Âm thanh tự giám sát | Mô hình Microsoft, iter3 dẫn đầu AudioSet tính đến năm 2026. |
| Mixup | Tăng cường cặp | `x = λ·x1 + (1-λ)·x2; y = λ·y1 + (1-λ)·y2`. |
| SpecAugment | Tăng cường dựa trên mặt nạ | Đặt không các dải thời gian và tần số ngẫu nhiên của phổ đồ. |
| mAP | Thước đo đa nhãn chính | Mean average precision trên các lớp và các ngưỡng. |

## Further Reading

- [Gong, Chung, Glass (2021). AST: Audio Spectrogram Transformer](https://arxiv.org/abs/2104.01778) — kiến trúc chuẩn từ 2021–2024.
- [Chen et al. (2022, rev. 2024). BEATs: Audio Pre-Training with Acoustic Tokenizers](https://arxiv.org/abs/2212.09058) — mặc định từ 2024+.
- [Park et al. (2019). SpecAugment](https://arxiv.org/abs/1904.08779) — phép tăng cường âm thanh chủ đạo.
- [Piczak (2015). ESC-50 dataset](https://github.com/karolpiczak/ESC-50) — benchmark 50 lớp vẫn tồn tại.
- [Gemmeke et al. (2017). AudioSet](https://research.google.com/audioset/) — hệ phân loại YouTube 632 lớp; vẫn là tiêu chuẩn vàng.
