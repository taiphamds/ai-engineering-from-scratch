# Audio-Language Models: the Whisper to Audio Flamingo 3 Arc

> Whisper (Radford và cộng sự, tháng 12 năm 2022) đã giải quyết nhận dạng lời nói — 680k giờ lời nói đa ngôn ngữ được giám sát yếu, một transformer mã hóa-giải mã đơn giản, một benchmark khiến mọi bản phát hành ASR sau đó đều trích dẫn nó. Nhưng nhận dạng không phải suy luận. Hỏi "có những nhạc cụ nào trong bản ghi này" hoặc "người nói đang biểu đạt cảm xúc gì" hoặc "điều gì xảy ra ở phút 3" đòi hỏi hiểu âm thanh, không phải chép lời. Qwen-Audio, SALMONN, LTU và Audio Flamingo 3 của NVIDIA (AF3, tháng 7 năm 2025) từng bước xây dựng ngăn xếp đó: giữ bộ mã hóa hạng Whisper, gắn thêm Q-former, huấn luyện trên dữ liệu chỉ dẫn âm thanh-văn bản, thêm suy luận chuỗi suy nghĩ. Bài học này đi qua tiến trình đó.

**Type:** Build
**Languages:** Python (stdlib, log-Mel spectrogram + audio Q-former skeleton)
**Prerequisites:** Phase 6 (Speech and Audio), Phase 12 · 03 (Q-Former)
**Time:** ~180 minutes

## Learning Objectives

- Tính phổ log-Mel từ dạng sóng: chia cửa sổ, FFT, dãy bộ lọc, biến đổi log.
- So sánh lựa chọn bộ mã hóa: bộ mã hóa Whisper, BEATs, AF-Whisper lai. Khi nào mỗi loại thắng.
- Xây dựng Q-former âm thanh: N truy vấn có thể học thực hiện cross-attention với patch phổ.
- Giải thích huấn luyện audio-LLM nối tầng (Whisper-rồi-LLM) so với đầu cuối: tại sao đầu cuối mở rộng tốt hơn cho suy luận.

## The Problem

Nhận dạng lời nói đã được Whisper giải quyết. OCR-của-âm-thanh là hàng hóa phổ thông. Nhưng "hàng hóa phổ thông" dừng ở chép lời. Nếu mô hình không thể suy luận trên những gì đã nghe — thời điểm, người nói, cảm xúc, cấu trúc âm nhạc, âm thanh môi trường — chỉ chép lời không thể thúc đẩy các tính năng sản phẩm.

Ba hướng rõ ràng:

1. Nối tầng: Whisper chép lời, LLM suy luận trên bản chép lời. Hoạt động cho tình huống thuần lời nói. Thất bại với âm nhạc, âm thanh môi trường, nhiều người nói chồng lấn, cảm xúc.

2. Audio-LLM đầu cuối: bộ mã hóa âm thanh đưa token âm thanh trực tiếp vào LLM, bỏ qua chép lời. Giữ thông tin âm học (cảm xúc, người nói, môi trường). Cần dữ liệu huấn luyện mới.

3. Lai: bộ mã hóa âm thanh + bộ giải mã văn bản có thể vừa chép lời vừa suy luận. Qwen-Audio và Audio Flamingo chọn hướng này.

## The Concept

### Log-Mel spectrogram: the input feature

Mọi bộ mã hóa âm thanh đều bắt đầu từ cùng đặc trưng: phổ log-Mel.

1. Lấy mẫu lại thành 16 kHz.
2. Biến đổi Fourier thời gian ngắn với cửa sổ 25ms, bước nhảy 10ms.
3. Lấy độ lớn của kết quả FFT.
4. Áp dụng dãy bộ lọc Mel (thường 80 bộ lọc cách đều theo log từ 0-8000 Hz) để biến đổi sang tần số cảm nhận.
5. Nén log (log(1 + x)) cho dải động.

Kết quả: mảng 2D hình dạng (T, 80), trong đó T là số khung thời gian. Với clip 30 giây ở tốc độ khung 100 Hz: (3000, 80).

### Whisper's encoder

Bộ mã hóa của Whisper là transformer kiểu ViT 12 lớp xử lý phổ log-Mel như chuỗi khung thời gian. Đầu ra: một vector trạng thái ẩn mỗi khung thời gian.

Với ASR, bộ giải mã của Whisper là transformer cross-attention tạo token văn bản được điều kiện hóa trên đầu ra bộ mã hóa. Mã hóa-giải mã tiêu chuẩn.

Với ALM (audio-LLM), bạn muốn đầu ra bộ mã hóa làm đầu vào cho một LLM khác. Mẫu: bộ mã hóa Whisper đóng băng, Q-former có thể huấn luyện, LLM đóng băng hoặc được điều chỉnh.

### BEATs and audio-specific encoders

Whisper được huấn luyện trên dữ liệu chủ yếu là lời nói. Nó yếu hơn với âm nhạc và âm thanh môi trường.

BEATs (Chen và cộng sự, 2022) là transformer tự giám sát được huấn luyện trên AudioSet. Nắm bắt âm nhạc và âm thanh môi trường tốt hơn Whisper ở cùng số tham số.

AF-Whisper (bản lai của Audio Flamingo 3): ghép đặc trưng Whisper + BEATs làm đầu vào âm thanh. Whisper mang tín hiệu ngôn ngữ, BEATs mang tín hiệu âm học.

### Audio Q-former

Cùng mẫu với Q-former thị giác của BLIP-2. Một số lượng cố định truy vấn có thể học (thường 32 hoặc 64) thực hiện cross-attention trên các khung đầu ra của bộ mã hóa âm thanh. Các truy vấn trở thành token âm thanh được LLM tiếp nhận.

Giai đoạn căn chỉnh huấn luyện: chỉ Q-former, hàm mất mát tương phản + tạo chú thích trên cặp âm thanh-văn bản (AudioCaps, Clotho). Giai đoạn chỉ dẫn: đầu cuối, mở đóng băng LLM, huấn luyện trên dữ liệu chỉ dẫn.

### The arc — SALMONN, Qwen-Audio, AF3

SALMONN (Tang và cộng sự, 2023): Whisper + BEATs + Q-former + LLaMA. Audio-LLM mở đầu tiên với khả năng suy luận đáng kể. Benchmark trên MMAU cho điểm tổng hợp ~0.55.

Qwen-Audio (Chu và cộng sự, 2023): kiến trúc tương tự, huấn luyện trên tập dữ liệu phong phú hơn, điều chỉnh cho đối thoại nhiều lượt. MMAU ~0.60.

LTU — Nghe, Nghĩ, Hiểu (Gong và cộng sự, 2023): dữ liệu suy luận tường minh, tập trung chuỗi suy nghĩ trên các clip âm thanh. Nhỏ hơn nhưng tập trung hơn.

Audio Flamingo 3 (Goel và cộng sự, tháng 7 năm 2025): SOTA mở hiện tại. Backbone LLM 8B (Qwen2 7B), bộ mã hóa Whisper-large ghép BEATs, Q-former 64 truy vấn, huấn luyện trên 1M+ cặp chỉ dẫn âm thanh-văn bản. MMAU 0.72, ngang mức tiên tiến độc quyền trên một số tác vụ con.

AF3 cũng giới thiệu chuỗi suy nghĩ theo yêu cầu cho âm thanh: mô hình có thể tùy chọn phát token suy nghĩ ("để tôi xác định nhạc cụ trước: ...") trước câu trả lời cuối cùng. Độ chính xác trên tác vụ suy luận phức tạp tăng 3-5 điểm khi bật suy nghĩ.

### Cascaded vs end-to-end

Pipeline nối tầng:

1. Whisper chép lời âm thanh → văn bản.
2. LLM suy luận trên văn bản.

Hoạt động hoàn hảo cho "tóm tắt podcast này." Thất bại với:
- "Tâm trạng của bài hát này là gì?" — tâm trạng nằm ở âm thanh, không phải từ ngữ.
- "Ai đang nói, Alice hay Bob?" — đòi hỏi nhận diện người nói.
- "Ở giây nào vụ nổ xảy ra?" — định vị thời gian bị mất trong văn bản.
- "Đây là âm thanh thật hay được tạo ra?" — phát hiện deepfake cần đặc trưng âm học.

Đầu cuối giữ tín hiệu âm học. Qwen-Audio và AF3 xử lý âm nhạc, môi trường và cảm xúc một cách nguyên bản.

### 2026 production recipe

Với một sản phẩm hiểu âm thanh mới:

- Nối tầng nếu: chép lời là mục tiêu, không âm nhạc, không suy luận cảm xúc.
- Họ AF3 / Qwen-Audio nếu: âm nhạc, cảm xúc, nhiều người nói hoặc suy luận âm thanh phức tạp.

Nối tầng rẻ hơn và đơn giản hơn. Đầu cuối có khả năng cao hơn.

### MMAU — the audio reasoning benchmark

MMAU (Hiểu âm thanh đa phương thức quy mô lớn) là benchmark suy luận âm thanh năm 2024-2025:

- 10,000 cặp hỏi đáp âm thanh-văn bản trên lời nói, âm nhạc, âm thanh môi trường.
- Bao phủ phân loại, suy luận thời gian, suy luận nhân quả, hỏi đáp mở.
- Kiểm tra những gì pipeline nối tầng bỏ lỡ có hệ thống.

SOTA mở (AF3) ở 0.72; mức tiên tiến độc quyền ~0.78 (Gemini 2.5 Pro, Claude Opus 4.7). Khoảng cách nhỏ hơn chênh lệch mở-so-với-đóng của VideoMME, cho thấy audio-LLM đang trưởng thành.

```figure
audio-text-ctc
```

## Use It

`code/main.py`:

- Triển khai tính phổ log-Mel trong stdlib: chia cửa sổ, DFT sơ khai, dãy bộ lọc Mel.
- Khung Q-former âm thanh: với các khung đầu ra bộ mã hóa, tính Q, K, V, attention và phát N token.
- So sánh nối tầng với đầu cuối trên tác vụ đơn giản.

## Ship It

Bài học này tạo ra `outputs/skill-audio-llm-pipeline-picker.md`. Với tác vụ âm thanh (chép lời, gắn nhãn âm nhạc, suy luận cảm xúc, phân tách nhiều người nói, phân loại môi trường), nó chọn nối tầng, AF3 đầu cuối hoặc lai.

## Exercises

1. Tính kích thước phổ log-Mel cho clip 30 giây ở 16kHz, cửa sổ 25ms, bước nhảy 10ms, 80 bin Mel. Điều này thay đổi thế nào ở 48kHz?

2. Tại sao Whisper hoạt động kém trên âm nhạc? BEATs nắm bắt đặc trưng âm thanh nào mà Whisper không nắm bắt?

3. Q-former âm thanh với 64 truy vấn so với 32: ở độ phức tạp tác vụ nào 64 mang lại lợi ích? 32 tiết kiệm tính toán cho điều gì?

4. Đọc Mục 4 của AF3 về suy nghĩ theo yêu cầu. Đề xuất ba tác vụ âm thanh mà chuỗi suy nghĩ giúp nhiều nhất.

5. Triển khai pipeline phân tách người nói tối thiểu bằng đầu ra AF3. Bạn báo hiệu thay đổi người nói thế nào?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Log-Mel spectrogram (Phổ log-Mel) | "Đặc trưng Mel" | Mảng 2D (thời gian, tần số) của giá trị log độ lớn sau dãy bộ lọc Mel |
| Audio Q-former (Q-former âm thanh) | "Perceiver âm thanh" | Nút thắt cross-attention từ đầu ra bộ mã hóa âm thanh đến các truy vấn độ dài cố định đưa vào LLM |
| Cascaded (Nối tầng) | "ASR-rồi-LLM" | Pipeline trong đó Whisper chép lời và LLM văn bản suy luận; mất thông tin âm học |
| End-to-end (Đầu cuối) | "Audio-LLM" | Đặc trưng âm thanh đi trực tiếp vào LLM qua Q-former; giữ tín hiệu âm học |
| BEATs | "Bộ mã hóa âm thanh AudioSet" | Transformer SSL huấn luyện trên AudioSet; mạnh về âm nhạc + âm thanh môi trường |
| MMAU | "Benchmark suy luận âm thanh" | 10k cặp hỏi đáp trên lời nói, âm nhạc, môi trường; tiêu chuẩn đánh giá 2024 |
| On-demand thinking (Suy nghĩ theo yêu cầu) | "CoT âm thanh" | Mô hình có thể tùy chọn phát token suy luận trước câu trả lời cuối cùng, tăng độ chính xác 3-5 điểm |

## Further Reading

- [Radford et al. — Whisper (arXiv:2212.04356)](https://arxiv.org/abs/2212.04356)
- [Chu et al. — Qwen-Audio (arXiv:2311.07919)](https://arxiv.org/abs/2311.07919)
- [Goel et al. — Audio Flamingo 3 (arXiv:2507.08128)](https://arxiv.org/abs/2507.08128)
- [Tang et al. — SALMONN (arXiv:2310.13289)](https://arxiv.org/abs/2310.13289)
- [Gong et al. — LTU (arXiv:2305.10790)](https://arxiv.org/abs/2305.10790)
