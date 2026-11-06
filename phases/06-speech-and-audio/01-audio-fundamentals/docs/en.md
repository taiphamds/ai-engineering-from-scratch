# Audio Fundamentals — Waveforms, Sampling, Fourier Transform

> Dạng sóng là tín hiệu thô. Phổ đồ là biểu diễn. Các đặc trưng Mel là dạng thân thiện với ML. Mọi pipeline ASR và TTS hiện đại đều đi qua chiếc thang này, và bậc đầu tiên là hiểu lấy mẫu và Fourier.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 1 · 06 (Vectors & Matrices), Phase 1 · 14 (Probability Distributions)
**Time:** ~45 minutes

## The Problem

Một micro tạo một tín hiệu áp suất-theo-thời gian. Mạng nơ-ron của bạn tiêu thụ các tensor. Giữa chúng là một chồng quy ước mà khi bị vi phạm sẽ tạo các lỗi âm thầm: mô hình huấn luyện ổn nhưng WER tăng gấp đôi, hoặc TTS phát ra tiếng xì, hoặc một hệ thống nhân bản giọng nói ghi nhớ micro thay vì người nói.

Mọi lỗi trong các hệ thống tiếng nói bắt nguồn từ một trong ba câu hỏi:

1. Dữ liệu được ghi ở tần số lấy mẫu nào, và mô hình kỳ vọng gì?
2. Tín hiệu có bị chồng phổ không?
3. Bạn đang thao tác trên các mẫu thô hay trên một biểu diễn tần số?

Làm đúng những điều này và phần còn lại của Phase 6 có thể xử lý được. Làm sai và ngay cả Whisper-Large-v4 cũng tạo rác.

## The Concept

![Waveform, sampling, DFT, and frequency bins visualized](../assets/audio-fundamentals.svg)

**Dạng sóng.** Một mảng một chiều các số float trong `[-1.0, 1.0]`. Được đánh chỉ số theo số mẫu. Để chuyển sang giây, chia cho tần số lấy mẫu: `t = n / sr`. Một đoạn 10 giây ở 16 kHz là một mảng 160,000 số float.

**Tần số lấy mẫu (sr).** Bao nhiêu mẫu mỗi giây. Các tần số phổ biến năm 2026:

| Tần số | Công dụng |
|------|-----|
| 8 kHz | Điện thoại, VOIP cũ. Nyquist tại 4 kHz làm mất phụ âm. Tránh dùng cho ASR. |
| 16 kHz | Tiêu chuẩn ASR. Whisper, Parakeet, SeamlessM4T v2 đều tiêu thụ 16 kHz. |
| 22.05 kHz | Huấn luyện vocoder TTS cho các mô hình cũ hơn. |
| 24 kHz | TTS hiện đại (Kokoro, F5-TTS, xTTS v2). |
| 44.1 kHz | Âm thanh CD, âm nhạc. |
| 48 kHz | Phim, âm thanh chuyên nghiệp, TTS độ trung thực cao (VALL-E 2, NaturalSpeech 3). |

**Nyquist-Shannon.** Một tần số lấy mẫu `sr` có thể biểu diễn không nhập nhằng các tần số đến `sr/2`. Ranh giới `sr/2` là *tần số Nyquist*. Năng lượng trên Nyquist bị *chồng phổ* — gập xuống các tần số thấp hơn — và làm hỏng tín hiệu. Luôn lọc thông thấp trước khi giảm tần số lấy mẫu.

**Độ sâu bit.** PCM 16 bit (int16 có dấu, phạm vi ±32,767) là định dạng trao đổi phổ dụng. 24 bit cho âm nhạc, float 32 bit cho DSP nội bộ. Các thư viện như `soundfile` đọc int16 nhưng cung cấp các mảng float32 trong `[-1, 1]`.

**Biến đổi Fourier.** Bất kỳ tín hiệu hữu hạn nào đều là một tổng các hình sin ở các tần số khác nhau. Biến đổi Fourier Rời rạc (DFT) tính, cho `N` mẫu, `N` hệ số phức — một cho mỗi bin tần số. `bin k` ánh xạ đến tần số `k · sr / N` Hz. Độ lớn là biên độ ở tần số đó, góc là pha.

**FFT.** Biến đổi Fourier Nhanh: một thuật toán `O(N log N)` cho DFT khi `N` là lũy thừa của 2. Mọi thư viện âm thanh dùng FFT bên dưới. Một FFT 1024 mẫu ở 16 kHz cho 512 bin tần số dùng được trải từ 0–8 kHz ở độ phân giải 15.6 Hz.

**Chia khung + cửa sổ.** Chúng ta không FFT toàn bộ một đoạn. Chúng ta cắt nó thành các *khung* chồng lấn (thường 25 ms với bước nhảy 10 ms), nhân mỗi khung với một hàm cửa sổ (Hann, Hamming) để loại các gián đoạn ở biên, rồi FFT mỗi khung. Đây là Biến đổi Fourier Thời gian Ngắn (STFT). Bài 02 tiếp nối từ đây.

```figure
mel-scale
```

## Build It

### Step 1: read a clip and plot the waveform

`code/main.py` chỉ dùng mô-đun `wave` của stdlib để bản minh họa không có phụ thuộc. Cho production bạn sẽ dùng `soundfile` hoặc `torchaudio.load` (cả hai trả các tuple `(waveform, sr)`):

```python
import soundfile as sf
waveform, sr = sf.read("clip.wav", dtype="float32")  # shape (T,), sr=int
```

### Step 2: synthesize a sine wave from first principles

```python
import math

def sine(freq_hz, sr, seconds, amp=0.5):
    n = int(sr * seconds)
    return [amp * math.sin(2 * math.pi * freq_hz * i / sr) for i in range(n)]
```

Một sóng sin 440 Hz (nốt La hòa nhạc) ở 16 kHz trong 1 giây là 16,000 số float. Ghi bằng `wave.open(..., "wb")` dùng mã hóa PCM 16 bit.

### Step 3: compute the DFT by hand

```python
def dft(x):
    N = len(x)
    out = []
    for k in range(N):
        re = sum(x[n] * math.cos(-2 * math.pi * k * n / N) for n in range(N))
        im = sum(x[n] * math.sin(-2 * math.pi * k * n / N) for n in range(N))
        out.append((re, im))
    return out
```

`O(N²)` — ổn với `N=256` để xác nhận tính đúng đắn, vô dụng với âm thanh thực. Mã thực gọi `numpy.fft.rfft` hoặc `torch.fft.rfft`.

### Step 4: find the dominant frequency

Chỉ số đỉnh độ lớn `k_star` ánh xạ đến tần số `k_star * sr / N`. Chạy điều này trên sóng sin 440 Hz phải trả một đỉnh tại bin `440 * N / sr`.

### Step 5: demonstrate aliasing

Lấy mẫu một sóng sin 7 kHz ở 10 kHz (Nyquist = 5 kHz). Âm 7 kHz nằm trên Nyquist và gập về `10 − 7 = 3 kHz`. Đỉnh FFT xuất hiện tại 3 kHz. Đây là bản minh họa chồng phổ kinh điển và là lý do mọi DAC/ADC đều có một bộ lọc thông thấp vách đứng.

## Use It

Ngăn xếp bạn sẽ thực sự phát hành năm 2026:

| Tác vụ | Thư viện | Vì sao |
|------|---------|-----|
| Đọc/ghi WAV/FLAC/OGG | `soundfile` (lớp bọc libsndfile) | Nhanh nhất, ổn định, trả float32. |
| Lấy mẫu lại | `torchaudio.transforms.Resample` hoặc `librosa.resample` | Tích hợp chống chồng phổ đúng. |
| STFT / Mel | `torchaudio` hoặc `librosa` | Thân thiện GPU; hệ sinh thái PyTorch. |
| Truyền luồng thời gian thực | `sounddevice` hoặc `pyaudio` | Các binding PortAudio đa nền tảng. |
| Kiểm tra một file | `ffprobe` hoặc `soxi` | CLI, nhanh, báo cáo sr/số kênh/codec. |

Quy tắc quyết định: **khớp tần số lấy mẫu trước khi khớp bất kỳ thứ gì khác**. Whisper kỳ vọng float32 mono 16 kHz. Truyền cho nó stereo 44.1 kHz và bạn sẽ nhận rác trông như lỗi mô hình.

## Ship It

Lưu thành `outputs/skill-audio-loader.md`. Skill giúp bạn kiểm tra đầu vào âm thanh có khớp các kỳ vọng của mô hình phía sau không và lấy mẫu lại đúng khi không khớp.

## Exercises

1. **Dễ.** Tổng hợp một hỗn hợp 1 giây của 220 Hz + 440 Hz + 880 Hz ở 16 kHz. Chạy DFT. Xác nhận ba đỉnh tại các bin dự kiến.
2. **Trung bình.** Ghi một WAV giọng nói của bạn dài 3 giây ở 48 kHz. Giảm tần số lấy mẫu xuống 16 kHz bằng `torchaudio.transforms.Resample` (có chống chồng phổ), rồi xuống 16 kHz bằng giảm mẫu ngây thơ (mỗi mẫu thứ ba). FFT cả hai. Chồng phổ xuất hiện ở đâu?
3. **Khó.** Xây dựng STFT từ đầu chỉ dùng `math` và DFT từ Bước 3. Kích thước khung 400, bước nhảy 160, cửa sổ Hann. Vẽ các độ lớn bằng `matplotlib.pyplot.imshow`. Đây là phổ đồ của Bài 02.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Sample rate (Tần số lấy mẫu) | Bao nhiêu mẫu mỗi giây | Tần số tính bằng Hz mà ADC đo tín hiệu. |
| Nyquist | Tần số tối đa bạn có thể biểu diễn | `sr/2`; năng lượng phía trên nó bị chồng phổ trở xuống. |
| Bit depth (Độ sâu bit) | Độ phân giải mỗi mẫu | `int16` = 65,536 mức; `float32` = độ chính xác 24 bit trong `[-1, 1]`. |
| DFT | Biến đổi Fourier cho các chuỗi | `N` mẫu → `N` hệ số tần số phức. |
| FFT | DFT nhanh | Thuật toán `O(N log N)` yêu cầu `N` = lũy thừa của 2. |
| Bin | Cột tần số | `k · sr / N` Hz; độ phân giải = `sr / N`. |
| STFT | Phổ đồ bên dưới | FFT được chia khung + áp cửa sổ theo thời gian. |
| Aliasing (Chồng phổ) | Các bóng tần số kỳ lạ | Năng lượng trên Nyquist phản chiếu xuống các bin thấp hơn. |

## Further Reading

- [Shannon (1949). Communication in the Presence of Noise](https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf) — bài báo đằng sau định lý lấy mẫu.
- [Smith — The Scientist and Engineer's Guide to Digital Signal Processing](https://www.dspguide.com/ch8.htm) — giáo trình DSP miễn phí, kinh điển.
- [librosa docs — audio primer](https://librosa.org/doc/latest/auto_tutorials/index.html) — hướng dẫn thực hành có mã.
- [Heinrich Kuttruff — Room Acoustics (6th ed.)](https://www.taylorfrancis.com/books/mono/10.1201/9781315372150/room-acoustics-heinrich-kuttruff) — tham chiếu cho lý do âm thanh thực tế không phải một hình sin sạch.
- [Steve Eddins — FFT Interpretation notebook](https://blogs.mathworks.com/steve/2020/03/30/fft-spectrum-and-spectral-densities/) — làm rõ trực giác bin tần số trong 10 phút.
