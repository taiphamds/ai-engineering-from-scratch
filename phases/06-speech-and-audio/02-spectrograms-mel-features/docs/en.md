# Spectrograms, Mel Scale & Audio Features

> Mạng nơ-ron không tiêu thụ tốt các dạng sóng thô. Chúng tiêu thụ phổ đồ. Chúng tiêu thụ phổ đồ mel còn tốt hơn. Mọi ASR, TTS và bộ phân loại âm thanh năm 2026 sống còn nhờ lựa chọn tiền xử lý duy nhất này.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 01 (Audio Fundamentals)
**Time:** ~45 minutes

## The Problem

Lấy một đoạn 10 giây 16 kHz. Đó là 160,000 số float, tất cả trong `[-1, 1]`, gần như hoàn toàn không tương quan với nhãn "chó sủa" hoặc "từ cat". Dạng sóng thô có thông tin nhưng ở một dạng mô hình không thể dễ dàng trích xuất. Hai âm vị giống hệt được nói cách nhau 100 ms có các mẫu thô hoàn toàn khác nhau.

Một phổ đồ sửa điều này. Nó thu gọn chi tiết thời gian nơi tri giác con người bỏ qua (dao động micro giây) và giữ cấu trúc nơi tri giác chú ý (những tần số nào có năng lượng, trên các cửa sổ thời gian ~10–25 ms).

Phổ đồ mel tiến xa hơn. Con người cảm nhận cao độ theo logarit: 100 Hz so với 200 Hz nghe "cách nhau cùng khoảng" như 1000 Hz so với 2000 Hz. Thang mel uốn trục tần số để khớp. Một phổ đồ theo thang mel là đặc trưng quan trọng nhất trong ML tiếng nói từ 2010 đến 2026.

## The Concept

![Waveform to STFT to mel spectrogram to MFCC ladder](../assets/mel-features.svg)

**STFT (Biến đổi Fourier Thời gian Ngắn).** Cắt dạng sóng thành các khung chồng lấn (điển hình: cửa sổ 25 ms, bước nhảy 10 ms = 400 mẫu / 160 mẫu ở 16 kHz). Nhân mỗi khung với một hàm cửa sổ (Hann là mặc định; Hamming có đánh đổi hơi khác). FFT mỗi khung. Xếp các phổ độ lớn thành một ma trận hình dạng `(n_frames, n_freq_bins)`. Đó là phổ đồ của bạn.

**Log độ lớn.** Các độ lớn thô trải trên 5-6 bậc độ lớn. Lấy `log(|X| + 1e-6)` hoặc `20 * log10(|X|)` để nén dải động. Mọi pipeline production dùng log độ lớn, không phải độ lớn thô.

**Thang mel.** Tần số `f` tính bằng Hz ánh xạ sang mel `m` bởi `m = 2595 * log10(1 + f / 700)`. Ánh xạ gần tuyến tính dưới 1 kHz và gần logarit phía trên. 80 bin mel bao phủ 0–8 kHz là đầu vào ASR tiêu chuẩn.

**Bộ lọc mel.** Một tập các bộ lọc tam giác cách đều trên thang mel. Mỗi bộ lọc là một tổng có trọng số của các bin FFT liền kề. Nhân độ lớn STFT với ma trận bộ lọc cho phổ đồ mel trong một phép nhân ma trận.

**Phổ đồ log-mel.** `log(mel_spec + 1e-10)`. Đầu vào của Whisper. Đầu vào của Parakeet. Đầu vào của SeamlessM4T. Frontend âm thanh phổ dụng năm 2026.

**MFCC.** Lấy phổ đồ log-mel, áp dụng một DCT (loại II), giữ 13 hệ số đầu. Khử tương quan các đặc trưng và nén thêm. Đặc trưng chủ đạo đến khoảng 2015 khi CNN/Transformer trên log-mel thô bắt kịp. Vẫn được dùng trong nhận dạng người nói (x-vector, ECAPA).

**Đánh đổi độ phân giải.** FFT lớn hơn = độ phân giải tần số tốt hơn nhưng độ phân giải thời gian tệ hơn. 25 ms / 10 ms là mặc định ML âm thanh; 50 ms / 12.5 ms cho âm nhạc; 5 ms / 2 ms cho phát hiện quá độ (tiếng trống, âm tắc).

```figure
spectrogram-window
```

## Build It

### Step 1: frame the waveform

```python
def frame(signal, frame_len, hop):
    n = 1 + (len(signal) - frame_len) // hop
    return [signal[i * hop : i * hop + frame_len] for i in range(n)]
```

Một đoạn 10 giây 16 kHz với `frame_len=400, hop=160` cho 998 khung.

### Step 2: Hann window

```python
import math

def hann(N):
    return [0.5 * (1 - math.cos(2 * math.pi * n / (N - 1))) for n in range(N)]
```

Nhân từng phần tử trước FFT. Loại bỏ rò rỉ phổ do cắt tại các điểm cuối khác không.

### Step 3: STFT magnitude

```python
def stft_magnitude(signal, frame_len=400, hop=160):
    win = hann(frame_len)
    frames = frame(signal, frame_len, hop)
    return [magnitudes(dft([w * s for w, s in zip(win, f)])) for f in frames]
```

Production dùng `torch.stft` hoặc `librosa.stft` (dựa trên FFT, được vector hóa). Vòng lặp ở đây mang tính sư phạm; nó chạy trên các đoạn ngắn trong `code/main.py`.

### Step 4: mel filterbank

```python
def hz_to_mel(f):
    return 2595.0 * math.log10(1.0 + f / 700.0)

def mel_to_hz(m):
    return 700.0 * (10 ** (m / 2595.0) - 1)

def mel_filterbank(n_mels, n_fft, sr, fmin=0, fmax=None):
    fmax = fmax or sr / 2
    mels = [hz_to_mel(fmin) + (hz_to_mel(fmax) - hz_to_mel(fmin)) * i / (n_mels + 1)
            for i in range(n_mels + 2)]
    hzs = [mel_to_hz(m) for m in mels]
    bins = [int(h * n_fft / sr) for h in hzs]
    fb = [[0.0] * (n_fft // 2 + 1) for _ in range(n_mels)]
    for m in range(n_mels):
        for k in range(bins[m], bins[m + 1]):
            fb[m][k] = (k - bins[m]) / max(1, bins[m + 1] - bins[m])
        for k in range(bins[m + 1], bins[m + 2]):
            fb[m][k] = (bins[m + 2] - k) / max(1, bins[m + 2] - bins[m + 1])
    return fb
```

80 mel bao phủ 0–8 kHz với `n_fft=400` cho một ma trận `(80, 201)`. Nhân độ lớn STFT `(n_frames, 201)` với chuyển vị để có phổ đồ mel `(n_frames, 80)`.

### Step 5: log-mel

```python
def log_mel(mel_spec, eps=1e-10):
    return [[math.log(max(v, eps)) for v in frame] for frame in mel_spec]
```

Các phương án phổ biến khác: `librosa.power_to_db` (dB được chuẩn hóa theo tham chiếu), `10 * log10(power + eps)`. Whisper dùng một quy trình chặn + chuẩn hóa phức tạp hơn (xem `log_mel_spectrogram` của Whisper).

### Step 6: MFCCs

```python
def dct_ii(x, n_coeffs):
    N = len(x)
    return [
        sum(x[n] * math.cos(math.pi * k * (2 * n + 1) / (2 * N)) for n in range(N))
        for k in range(n_coeffs)
    ]
```

Áp dụng DCT cho mỗi khung log-mel, giữ 13 hệ số đầu. Đó là ma trận MFCC của bạn. Hệ số đầu thường bị bỏ (nó mã hóa năng lượng tổng thể).

## Use It

Ngăn xếp năm 2026:

| Tác vụ | Đặc trưng |
|------|----------|
| ASR (Whisper, Parakeet, SeamlessM4T) | 80 log-mel, bước nhảy 10 ms, cửa sổ 25 ms |
| Mô hình âm học TTS (VITS, F5-TTS, Kokoro) | 80 mel, bước nhảy 5–12 ms để điều khiển thời gian tinh tế |
| Phân loại âm thanh (AST, PANNs, BEATs) | 128 log-mel, bước nhảy 10 ms |
| Embedding người nói (ECAPA-TDNN, WavLM) | 80 log-mel hoặc SSL dạng sóng thô |
| Âm nhạc (MusicGen, Stable Audio 2) | Các token rời rạc EnCodec (không phải mel) |
| Phát hiện từ khóa | 40 MFCC cho các thiết bị tí hon |

Quy tắc kinh nghiệm: **nếu bạn không làm việc với âm nhạc, bắt đầu bằng 80 log-mel.** Mọi sai lệch phải chịu trách nhiệm chứng minh.

## Pitfalls that still ship in 2026

- **Không khớp số mel.** Huấn luyện với 80 mel, suy luận với 128 mel. Thất bại âm thầm. Ghi nhật ký hình dạng đặc trưng ở cả hai đầu.
- **Không khớp tần số lấy mẫu phía trước.** Mel được tính ở 22.05 kHz trông khác 16 kHz. Sửa SR *trước* trích xuất đặc trưng.
- **dB so với log.** Whisper kỳ vọng log-mel, không phải dB-mel. Một số pipeline HF tự phát hiện; mã tùy chỉnh của bạn thì không.
- **Độ trôi chuẩn hóa.** Chuẩn hóa theo phát ngôn khi huấn luyện, chuẩn hóa toàn cục khi suy luận. Lỗi production làm WER tăng gấp đôi.
- **Rò rỉ từ đệm.** Đệm không vào cuối một đoạn tạo một phổ phẳng trong các khung cuối. Đệm đối xứng hoặc lặp lại.

## Ship It

Lưu thành `outputs/skill-feature-extractor.md`. Skill chọn loại đặc trưng, số mel, khung/bước nhảy và chuẩn hóa cho một mô hình đích nhất định.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Nó tổng hợp một chirp (tần số quét 200 → 4000 Hz) và in bin mel argmax cho mỗi khung. Vẽ (tùy chọn) và xác nhận nó khớp phép quét.
2. **Trung bình.** Chạy lại với `n_mels` trong `{40, 80, 128}` và `frame_len` trong `{200, 400, 800}`. Đo băng thông đỉnh nhọn dọc trục thời gian. Tổ hợp nào phân giải chirp tốt nhất?
3. **Khó.** Triển khai `power_to_db` và so sánh accuracy ASR của một bộ phân loại CNN nhỏ trên AudioMNIST bằng (a) log-mel thô, (b) dB-mel với `ref=max`, (c) MFCC-13 + delta + delta-delta. Báo cáo accuracy top-1.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Frame (Khung) | Một lát cắt | Khối dạng sóng 25 ms được đưa vào một FFT. |
| Hop (Bước nhảy) | Stride | Số mẫu giữa các khung liên tiếp; 10 ms là mặc định ASR. |
| Window (Cửa sổ) | Thứ Hann/Hamming | Hệ số nhân theo điểm làm các biên khung giảm dần về không. |
| STFT | Bộ sinh phổ đồ | FFT được chia khung + áp cửa sổ; cho ma trận thời gian × tần số. |
| Mel | Tần số bị uốn | Thang tri giác log; `m = 2595·log10(1 + f/700)`. |
| Filterbank (Bộ lọc) | Ma trận | Các bộ lọc tam giác chiếu STFT lên các bin mel. |
| Log-mel | Đầu vào của Whisper | `log(mel_spec + eps)`; được tiêu chuẩn hóa năm 2026. |
| MFCC | Đặc trưng kiểu cũ | DCT của log-mel; 13 hệ số, được khử tương quan. |

## Further Reading

- [Davis, Mermelstein (1980). Comparison of parametric representations for monosyllabic word recognition](https://ieeexplore.ieee.org/document/1163420) — bài báo MFCC.
- [Stevens, Volkmann, Newman (1937). A Scale for the Measurement of the Psychological Magnitude Pitch](https://pubs.aip.org/asa/jasa/article-abstract/8/3/185/735757/) — thang mel gốc.
- [OpenAI — Whisper source, log_mel_spectrogram](https://github.com/openai/whisper/blob/main/whisper/audio.py) — đọc triển khai tham chiếu.
- [librosa feature extraction docs](https://librosa.org/doc/latest/api/feature.html) — tham chiếu cho `mfcc`, `melspectrogram` và bước nhảy/cửa sổ.
- [NVIDIA NeMo — audio preprocessing](https://docs.nvidia.com/deeplearning/nemo/user-guide/docs/en/main/asr/asr_all.html#featurizers) — pipeline quy mô production cho các mô hình Parakeet + Canary.
