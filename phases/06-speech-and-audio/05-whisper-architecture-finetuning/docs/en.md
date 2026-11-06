# Whisper — Architecture & Fine-Tuning

> Whisper là một encoder-decoder transformer cửa sổ 30 giây, được huấn luyện trên 680k giờ cặp âm thanh-văn bản đa ngôn ngữ có giám sát yếu. Một kiến trúc, nhiều tác vụ, vững chắc trên 99 ngôn ngữ. ASR tham chiếu năm 2026.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 6 · 04 (ASR), Phase 5 · 10 (Attention), Phase 7 · 05 (Full Transformer)
**Time:** ~75 minutes

## The Problem

Whisper, được OpenAI phát hành tháng 9 năm 2022, là mô hình ASR đầu tiên được phát hành như một hàng hóa phổ thông: dán âm thanh, nhận văn bản, 99 ngôn ngữ, vững trước nhiễu, chạy trên máy tính xách tay. Đến năm 2024 OpenAI đã phát hành các biến thể Large-v3 và Turbo; đến năm 2026, Whisper là baseline mặc định cho mọi thứ từ chép lời podcast đến trợ lý giọng nói đến phụ đề YouTube.

Nhưng Whisper không phải một pipeline bạn có thể mãi coi là hộp đen. Dịch chuyển lĩnh vực giết nó — biệt ngữ kỹ thuật, giọng người nói, danh từ riêng, các đoạn ngắn, sự im lặng. Bạn cần biết:

1. Bên trong nó thực sự là gì.
2. Cách cung cấp đúng âm thanh chia khối, luồng hoặc dạng dài cho nó.
3. Khi nào fine-tune và bằng cách nào.

## The Concept

![Whisper encoder-decoder, tasks, chunked inference, fine-tune](../assets/whisper.svg)

**Kiến trúc.** Encoder-decoder transformer tiêu chuẩn.

- Đầu vào: phổ đồ log-mel 30 giây, 80 mel, bước nhảy 10 ms → 3000 khung. Các đoạn ngắn hơn được đệm không, các đoạn dài hơn được chia khối.
- Encoder: tích chập giảm mẫu (stride 2) + `N` khối transformer. Với Large-v3: 32 tầng, 1280 chiều, 20 head.
- Decoder: `N` khối transformer với self-attn nhân quả + cross-attn đến đầu ra encoder. Cùng kích thước encoder.
- Đầu ra: các token BPE trên một từ vựng 51,865 token.

Large-v3 có 1.55B tham số. Turbo dùng một decoder 4 tầng (từ 32), giảm độ trễ 8× với tổn thất WER <1%.

**Định dạng prompt.** Whisper là một mô hình đa tác vụ được điều khiển bằng các token đặc biệt trong prompt decoder:

```
<|startoftranscript|><|en|><|transcribe|><|notimestamps|> Hello world.<|endoftext|>
```

- `<|en|>` — nhãn ngôn ngữ; ép hành vi dịch-so-với-chép lời.
- `<|transcribe|>` hoặc `<|translate|>` — dịch đầu ra tiếng Anh từ đầu vào bất kỳ ngôn ngữ nào, hoặc nguyên văn.
- `<|notimestamps|>` — bỏ qua dấu thời gian cấp từ (nhanh hơn).

Prompt là thứ cho phép một mô hình làm nhiều tác vụ. Đổi `<|en|>` thành `<|fr|>` và nó chép lời tiếng Pháp.

**Cửa sổ 30 giây.** Mọi thứ được gắn với 30 giây. Các đoạn dài hơn cần chia khối; các đoạn ngắn hơn được đệm. Các cửa sổ không được truyền luồng nguyên bản — đây là lý do WhisperX, Whisper-Streaming và faster-whisper tồn tại.

**Chuẩn hóa log-mel.** `(log_mel - mean) / std` trong đó các thống kê đến từ ngữ liệu huấn luyện riêng của Whisper. Bạn *phải* dùng tiền xử lý của Whisper (`whisper.audio.log_mel_spectrogram`), không phải `librosa.feature.melspectrogram`.

### Variants in 2026

| Biến thể | Tham số | Độ trễ (A100) | WER (LibriSpeech-clean) |
|---------|--------|----------------|------------------------|
| Tiny | 39M | 1× thời gian thực | 5.4% |
| Base | 74M | 1× | 4.1% |
| Small | 244M | 1× | 3.0% |
| Medium | 769M | 1× | 2.7% |
| Large-v3 | 1.55B | 2× | 1.8% |
| Large-v3-turbo | 809M | 8× | 1.58% |
| Whisper-Streaming (2024) | 1.55B | truyền luồng | 2.0% |

### Fine-tuning

Quy trình kinh điển năm 2026:

1. Thu thập 10–100 giờ âm thanh lĩnh vực đích có các bản chép lời được căn chỉnh.
2. Chạy `transformers.Seq2SeqTrainer` với callback `generate_with_loss`.
3. Hiệu quả tham số: LoRA trên `q_proj`, `k_proj`, `v_proj` của các tầng attention giảm bộ nhớ GPU 4× với chi phí <0.3 WER.
4. Đóng băng encoder nếu bạn có <10 giờ. Chỉ tinh chỉnh decoder.
5. Dùng tokenizer và định dạng prompt riêng của Whisper; không bao giờ hoán đổi tokenizer.

Các kết quả cộng đồng: fine-tuning Medium trên 20 giờ đọc chính tả y tế hạ WER từ 12% xuống 4.5% trên từ vựng y tế. Fine-tuning Turbo trên 4 giờ tiếng Iceland hạ WER từ 18% xuống 6%.

```figure
sp-asr-attention
```

## Build It

### Step 1: run Whisper out of the box

```python
import whisper
model = whisper.load_model("large-v3-turbo")
result = model.transcribe(
    "clip.wav",
    language="en",
    task="transcribe",
    temperature=0.0,
    condition_on_previous_text=False,  # prevents runaway repetition
)
print(result["text"])
for seg in result["segments"]:
    print(f"[{seg['start']:.2f}–{seg['end']:.2f}] {seg['text']}")
```

Các mặc định then chốt bạn nên luôn ghi đè: `temperature=0.0` (lấy mẫu mặc định theo chuỗi dự phòng 0.0 → 0.2 → 0.4 …), `condition_on_previous_text=False` (ngăn vấn đề ảo giác dây chuyền) và `no_speech_threshold=0.6` (phát hiện im lặng).

### Step 2: chunked long-form

```python
# whisperx is the 2026 reference for long-form with word-level timestamps
import whisperx
model = whisperx.load_model("large-v3-turbo", device="cuda", compute_type="float16")
segments = model.transcribe("1hour.mp3", batch_size=16, chunk_size=30)
```

WhisperX thêm (1) chặn Silero VAD, (2) căn chỉnh cấp từ qua wav2vec 2.0, (3) phân đoạn người nói qua `pyannote.audio`. Thành phần chủ lực năm 2026 cho chép lời production.

### Step 3: fine-tune with LoRA

```python
from transformers import WhisperForConditionalGeneration, WhisperProcessor
from peft import LoraConfig, get_peft_model

model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3-turbo")
lora = LoraConfig(
    r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"],
    lora_dropout=0.1, bias="none", task_type="SEQ_2_SEQ_LM",
)
model = get_peft_model(model, lora)
# model.print_trainable_parameters()  -> ~3M trainable / 809M total
```

Rồi vòng lặp Trainer tiêu chuẩn. Lưu checkpoint mỗi 1000 bước. Đánh giá bằng WER trên tập được giữ lại.

### Step 4: inspect what each layer learns

```python
# Grab cross-attention weights during decode to see what the decoder attends to.
with torch.inference_mode():
    out = model.generate(
        input_features=features,
        return_dict_in_generate=True,
        output_attentions=True,
    )
# out.cross_attentions: layer × head × step × src_len
```

Trực quan hóa bằng một bản đồ nhiệt — bạn sẽ thấy căn chỉnh chéo khi các bước decoder quét qua các khung encoder. Đường chéo đó là quan niệm của Whisper về dấu thời gian từ.

## Use It

Ngăn xếp năm 2026:

| Tình huống | Chọn |
|-----------|------|
| Tiếng Anh tổng quát, ngoại tuyến | Large-v3-turbo qua `whisperx` |
| Di động / biên | Whisper-Tiny được lượng tử hóa (int8) hoặc Moonshine |
| Dạng dài đa ngôn ngữ | Large-v3 qua `whisperx` + phân đoạn người nói |
| Ngôn ngữ ít tài nguyên | Fine-tune Medium hoặc Turbo với LoRA |
| Truyền luồng (độ trễ 2 s) | Whisper-Streaming hoặc Parakeet-TDT |
| Dấu thời gian cấp từ | WhisperX (căn chỉnh bắt buộc qua wav2vec 2.0) |

`faster-whisper` (backend CTranslate2) là runtime suy luận CPU+GPU nhanh nhất năm 2026 — nhanh hơn bản nguyên gốc 4× với đầu ra giống hệt.

## Pitfalls that still ship in 2026

- **Văn bản bị ảo giác trên sự im lặng.** Whisper được huấn luyện trên chú thích bao gồm "Cảm ơn đã xem!", "Đăng ký!", lời bài hát. Luôn chặn VAD trước khi gọi.
- **Dây chuyền `condition_on_previous_text`.** Một ảo giác làm ô nhiễm các cửa sổ tiếp theo. Đặt `False` trừ khi bạn cần độ trôi chảy xuyên các khối.
- **Đệm đoạn ngắn.** Một đoạn 2 giây được đệm thành 30 giây có thể ảo giác trong phần im lặng cuối. Dùng `pad=False` hoặc chặn VAD.
- **Thống kê mel sai.** Dùng mel của librosa thay cho của Whisper tạo đầu ra gần ngẫu nhiên. Dùng `whisper.audio.log_mel_spectrogram`.

## Ship It

Lưu thành `outputs/skill-whisper-tuner.md`. Thiết kế một pipeline fine-tune hoặc suy luận Whisper cho một lĩnh vực nhất định.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Nó tokenize một prompt kiểu Whisper, tính các ngân sách hình dạng được giải mã và in lịch chia khối cho một đoạn 10 phút.
2. **Trung bình.** Cài `faster-whisper`, chép lời một podcast 10 phút, so sánh WER với bản chép lời của con người. Thử `language="auto"` so với ép `language="en"`.
3. **Khó.** Dùng `datasets` của HF, chọn một ngôn ngữ Whisper chật vật (ví dụ, Urdu), fine-tune Medium với LoRA trong 2 epoch trên 2 giờ và báo cáo chênh lệch WER.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| 30-sec window (Cửa sổ 30 giây) | Giới hạn của Whisper | Giới hạn đầu vào cứng; chia khối âm thanh dài hơn. |
| SOT | Bắt đầu bản chép lời | `<\|startoftranscript\|>` mở đầu prompt decoder. |
| Timestamps token (Token dấu thời gian) | Căn chỉnh thời gian | Mỗi độ lệch 0.02 s là một token đặc biệt trong từ vựng 51k. |
| Turbo | Biến thể nhanh | 4 tầng decoder, nhanh hơn 8×, suy giảm WER <1%. |
| WhisperX | Lớp bọc dạng dài | VAD + Whisper + căn chỉnh wav2vec + phân đoạn người nói. |
| LoRA fine-tune | Tinh chỉnh hiệu quả | Thêm các adapter hạng thấp vào attention; huấn luyện ~0.3% tham số. |
| Hallucination (Ảo giác) | Thất bại âm thầm | Whisper tạo tiếng Anh trôi chảy từ nhiễu/sự im lặng. |

## Further Reading

- [Radford et al. (2022). Whisper paper](https://arxiv.org/abs/2212.04356) — kiến trúc và công thức huấn luyện gốc.
- [OpenAI (2024). Whisper Large-v3-turbo release](https://github.com/openai/whisper/discussions/2363) — decoder 4 tầng, tăng tốc 8×.
- [Bain et al. (2023). WhisperX](https://arxiv.org/abs/2303.00747) — dạng dài, được căn chỉnh từ, được phân đoạn người nói.
- [Systran — faster-whisper repo](https://github.com/SYSTRAN/faster-whisper) — dựa trên CTranslate2, nhanh hơn 4×.
- [HuggingFace — Whisper fine-tune tutorial](https://huggingface.co/blog/fine-tune-whisper) — hướng dẫn LoRA / full-FT kinh điển.
