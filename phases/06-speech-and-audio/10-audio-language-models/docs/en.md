# Audio-Language Models — Qwen2.5-Omni, Audio Flamingo, GPT-4o Audio

> Các mô hình ngôn ngữ âm thanh năm 2026 suy luận trên tiếng nói + âm thanh môi trường + âm nhạc. Qwen2.5-Omni-7B ngang GPT-4o Audio trên MMAU-Pro. Audio Flamingo Next thắng Gemini 2.5 Pro trên LongAudioBench. Khoảng cách giữa mở và đóng về cơ bản đã khép lại — ngoại trừ các tác vụ nhiều âm thanh, nơi mọi bên đều gần mức ngẫu nhiên.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 12 · 03 (Vision-Language Models), Phase 7 · 10 (Audio Transformers)
**Time:** ~45 minutes

## The Problem

Bạn có 5 giây âm thanh: chó sủa, ai đó hét "dừng lại!", rồi im lặng. Các câu hỏi hữu ích trải trên nhiều trục:

- **Chép lời.** "Đã nói gì?" — lãnh địa ASR.
- **Suy luận ngữ nghĩa.** "Người đó có gặp nguy hiểm không?" — đòi hỏi hiểu kết hợp tiếng sủa + tiếng hét + sự im lặng.
- **Suy luận âm nhạc.** "Những nhạc cụ nào chơi giai điệu?"
- **Truy xuất âm thanh dài.** "Trong bài giảng 90 phút này giảng viên giải thích gradient descent ở đâu?"

Một mô hình duy nhất trả lời tất cả những câu này bằng một prompt là một **mô hình ngôn ngữ âm thanh** (LALM / ALM). Khác với ASR thuần: LALM tạo các câu trả lời ngôn ngữ tự nhiên tự do, không chỉ các bản chép lời.

## The Concept

![Audio-language model: audio encoder + projector + LLM decoder](../assets/alm-architecture.svg)

### The three-component template

Mọi LALM năm 2026 có cùng khung:

1. **Encoder âm thanh.** Encoder Whisper · BEATs · CLAP · WavLM · hoặc một encoder tùy chỉnh theo mô hình.
2. **Bộ chiếu.** Tuyến tính hoặc MLP nối các đặc trưng encoder âm thanh vào không gian embedding token của LLM.
3. **LLM.** Decoder dựa trên Llama / Qwen / Gemma. Nhận văn bản + token âm thanh xen kẽ; sinh văn bản.

Huấn luyện:

- **Giai đoạn 1.** Đóng băng encoder + LLM; chỉ huấn luyện bộ chiếu trên dữ liệu ASR / chú thích.
- **Giai đoạn 2.** Fine-tune đầy đủ / LoRA trên các tác vụ âm thanh tuân theo chỉ dẫn (QA, suy luận, hiểu âm nhạc).
- **Giai đoạn 3 (tùy chọn).** Giọng vào / giọng ra thêm một decoder tiếng nói. Qwen2.5-Omni và AF3-Chat làm điều này.

### The 2026 model map

| Mô hình | Backbone | Encoder âm thanh | Phương thức đầu ra | Truy cập |
|-------|----------|---------------|-----------------|--------|
| Qwen2.5-Omni-7B | Qwen2.5-7B | Tùy chỉnh + Whisper | văn bản + tiếng nói | Apache-2.0 |
| Qwen3-Omni | Qwen3 | Tùy chỉnh | văn bản + tiếng nói | Apache-2.0 |
| Audio Flamingo 3 | Qwen2 | AF-CLAP | văn bản | NVIDIA phi thương mại |
| Audio Flamingo Next | Qwen2 | AF-CLAP v2 | văn bản | NVIDIA phi thương mại |
| SALMONN | Vicuna | Whisper + BEATs | văn bản | Apache-2.0 |
| LTU / LTU-AS | Llama | CAV-MAE | văn bản | Apache-2.0 |
| GAMA | Llama | AST + Q-Former | văn bản | Apache-2.0 |
| Gemini 2.5 Flash/Pro (đóng) | Gemini | độc quyền | văn bản + tiếng nói | API |
| GPT-4o Audio (đóng) | GPT-4o | độc quyền | văn bản + tiếng nói | API |

### Benchmark reality check (2026)

**MMAU-Pro.** 1800 cặp QA bao phủ tiếng nói / âm thanh / âm nhạc / hỗn hợp. Bao gồm tập con nhiều âm thanh.

| Mô hình | Tổng thể | Tiếng nói | Âm thanh | Âm nhạc | Nhiều âm thanh |
|-------|---------|--------|-------|-------|-------------|
| Gemini 2.5 Pro | ~60% | 73.4% | 51.9% | 64.9% | ~22% |
| Gemini 2.5 Flash | ~57% | 73.4% | 50.5% | 64.9% | 21.2% |
| GPT-4o Audio | 52.5% | — | — | — | 26.5% |
| Qwen2.5-Omni-7B | 52.2% | 57.4% | 47.6% | 61.5% | ~20% |
| Audio Flamingo 3 | ~54% | — | — | — | — |
| Audio Flamingo Next | SOTA trên LongAudioBench | — | — | — | — |

**Cột nhiều âm thanh là bằng chứng bất lợi cho mọi bên.** Mức ngẫu nhiên trên trắc nghiệm 4 lựa chọn = 25%; hầu hết các mô hình chấm quanh mức đó. LALM vẫn chật vật so sánh hai đoạn.

### Where LALMs are useful in 2026

- **Kiểm toán tuân thủ các bản ghi trung tâm cuộc gọi.** "Nhân viên có nhắc đến thông báo bắt buộc không?"
- **Hỗ trợ tiếp cận.** Mô tả các sự kiện âm thanh cho người dùng điếc (không chỉ chép lời).
- **Kiểm duyệt nội dung.** Phát hiện ngôn ngữ bạo lực + giọng đe dọa + ngữ cảnh nền.
- **Chia chương podcast / cuộc họp.** Tóm tắt ngữ nghĩa, không chỉ các lượt người nói.
- **Phân tích danh mục âm nhạc.** "Tìm mọi track có chuyển giọng ở phần B."

### Where they are NOT (yet) useful

- Lý thuyết âm nhạc chi tiết (dưới cấp hợp âm).
- Suy luận gắn người nói trên các cuộc hội thoại dài (suy giảm sau 10 phút).
- So sánh nhiều âm thanh (22-26% chỉ nhỉnh hơn ngẫu nhiên).
- Suy luận luồng thời gian thực (hầu hết là suy luận batch ngoại tuyến).

```figure
v4-alm-tokens
```

## Build It

### Step 1: query Qwen2.5-Omni

```python
from transformers import AutoModelForCausalLM, AutoProcessor

processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-Omni-7B")
model = AutoModelForCausalLM.from_pretrained("Qwen/Qwen2.5-Omni-7B", torch_dtype="auto")

audio, sr = load_wav("clip.wav", sr=16000)
messages = [{
    "role": "user",
    "content": [
        {"type": "audio", "audio": audio},
        {"type": "text", "text": "What sounds do you hear, and what's happening?"},
    ],
}]
inputs = processor.apply_chat_template(messages, tokenize=True, return_tensors="pt")
output = model.generate(**inputs, max_new_tokens=200)
print(processor.decode(output[0], skip_special_tokens=True))
```

### Step 2: the projector pattern

```python
import torch.nn as nn

class AudioProjector(nn.Module):
    def __init__(self, audio_dim=1280, llm_dim=4096):
        super().__init__()
        self.down = nn.Linear(audio_dim, llm_dim)
        self.act = nn.GELU()
        self.up = nn.Linear(llm_dim, llm_dim)

    def forward(self, audio_features):
        return self.up(self.act(self.down(audio_features)))
```

Chỉ vậy thôi. Bộ chiếu thường là 1-3 tầng tuyến tính. Huấn luyện nó trên các cặp ASR (âm thanh → bản chép lời) là tác vụ tiền đề Giai đoạn 1.

### Step 3: benchmarking MMAU / LongAudioBench

```python
from datasets import load_dataset
mmau = load_dataset("gamma-lab-umd/MMAU-Pro", split="test")
mcq = mmau.filter(lambda item: len(item["choices"] or []) > 1)

correct = 0
for item in mcq:
    answer = call_model(item["audio_path"], item["question"], item["choices"])
    if answer == item["answer"]:
        correct += 1
print(f"Accuracy: {correct / len(mcq):.3f}")
```

`audio_path` trỏ vào `data.zip` của kho tập dữ liệu (khoảng 47 GB), nên tải và giải nén nó trước khi chấm điểm. Vòng lặp khớp chính xác này là một kiểm tra hợp lý, không phải bộ chấm benchmark, nên con số của nó không so sánh được với các kết quả MMAU-Pro đã công bố. Bộ đánh giá chính thức khớp các câu trả lời trắc nghiệm bằng độ tương đồng embedding (NV-Embed-v2), chấm các câu trả lời mở bằng một LLM giám khảo và kiểm tra các câu trả lời tuân theo chỉ dẫn bằng các quy tắc regex: ghi các dự đoán vào một cột `model_output` và chạy `evaluate_mmau_pro_comprehensive.py` từ [kho MMAU-Pro](https://github.com/sonalkum/MMAUPro). Báo cáo từng `category` (tiếng nói, âm thanh, âm nhạc, nhiều âm thanh và phần còn lại) riêng. Các con số tổng hợp che giấu nơi mô hình thất bại.

## Use It

| Tác vụ | Lựa chọn năm 2026 |
|------|-----------|
| QA âm thanh tự do (mở) | Qwen2.5-Omni-7B |
| Mở tốt nhất trên âm thanh dài | Audio Flamingo Next |
| Đóng tốt nhất | Gemini 2.5 Pro |
| Tác tử giọng vào / giọng ra | Qwen2.5-Omni hoặc GPT-4o Audio |
| Suy luận âm nhạc | Audio Flamingo 3 hoặc 2 (AF-CLAP chuyên âm nhạc) |
| Kiểm toán trung tâm cuộc gọi | Gemini 2.5 Pro qua API, với RAG trên các tài liệu chính sách của bạn |

## Pitfalls

- **Tin quá mức vào nhiều âm thanh.** Nếu tác vụ của bạn cần "đoạn nào có X", hiệu năng ở mức ngẫu nhiên là có thật.
- **Suy giảm âm thanh dài.** Sau 10 phút, việc gán người nói của hầu hết các mô hình hỏng. Phân đoạn người nói trước (Bài 6), rồi tóm tắt.
- **Ảo giác trên sự im lặng.** Cùng vấn đề kiểu Whisper được các LALM dùng encoder Whisper kế thừa. Chặn VAD.
- **Chọn lọc benchmark có lợi.** Các bài blog nhà cung cấp nhấn mạnh các nhóm tốt nhất. Tự chạy tập con nhiều âm thanh MMAU-Pro.

## Ship It

Lưu thành `outputs/skill-alm-picker.md`. Chọn LALM + tập con benchmark + phương thức đầu ra (văn bản so với tiếng nói) cho một tác vụ hiểu âm thanh nhất định.

## Exercises

1. **Dễ.** Chạy `code/main.py` để thấy một mẫu bộ chiếu đồ chơi + định tuyến LALM giả của (embedding âm thanh, token văn bản) → token đầu ra.
2. **Trung bình.** Chấm Qwen2.5-Omni-7B trên 100 mục tiếng nói MMAU-Pro. So sánh với con số bài báo báo cáo.
3. **Khó.** Xây dựng một baseline chú thích âm thanh tối thiểu: encoder BEATs + bộ chiếu 2 tầng + Llama-3.2-1B đóng băng. Chỉ fine-tune bộ chiếu trên AudioCaps. So sánh với SALMONN trên Clotho-AQA.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| LALM | ChatGPT âm thanh | Encoder âm thanh + bộ chiếu + decoder LLM. |
| Projector (Bộ chiếu) | Adapter | MLP nhỏ ánh xạ các đặc trưng âm thanh vào không gian embedding LLM. |
| MMAU | Benchmark | 10k cặp QA âm thanh trên tiếng nói, âm thanh, âm nhạc. |
| MMAU-Pro | MMAU khó hơn | 1800 câu hỏi nhiều âm thanh / nặng suy luận. |
| LongAudioBench | Đánh giá dạng dài | Các đoạn nhiều phút với các truy vấn ngữ nghĩa. |
| Voice-in / voice-out (Giọng vào / giọng ra) | Nguyên bản tiếng nói | Mô hình nhận tiếng nói và phát tiếng nói không đi vòng qua văn bản. |

## Further Reading

- [Chu et al. (2024). Qwen2-Audio](https://arxiv.org/abs/2407.10759) — kiến trúc tham chiếu.
- [Alibaba (2025). Qwen2.5-Omni](https://huggingface.co/Qwen/Qwen2.5-Omni-7B) — tiếng nói vào-tiếng nói ra.
- [NVIDIA (2025). Audio Flamingo 3](https://arxiv.org/abs/2507.08128) — dẫn đầu âm thanh dài mở.
- [NVIDIA (2026). Audio Flamingo Next](https://arxiv.org/abs/2604.10905) — SOTA LongAudioBench.
- [Tang et al. (2023). SALMONN](https://arxiv.org/abs/2310.13289) — tiên phong encoder kép.
- [MMAU-Pro leaderboard](https://sonalkum.github.io/mmau-pro/) — các thứ hạng trực tiếp năm 2026.
