# T5, BART — Encoder-Decoder Models

> Encoder hiểu. Decoder sinh. Ghép chúng lại và bạn nhận một mô hình được xây cho các tác vụ đầu vào → đầu ra: dịch, tóm tắt, viết lại, chép lời.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 06 (BERT), Phase 7 · 07 (GPT)
**Time:** ~45 minutes

## The Problem

GPT chỉ decoder và BERT chỉ encoder mỗi loại lược bỏ kiến trúc năm 2017 cho một mục tiêu khác nhau. Nhưng nhiều tác vụ tự nhiên là đầu vào-đầu ra:

- Dịch: tiếng Anh → Pháp.
- Tóm tắt: bài viết 5,000 token → bản tóm tắt 200 token.
- Nhận dạng tiếng nói: token âm thanh → token văn bản.
- Trích xuất có cấu trúc: văn xuôi → JSON.

Với những tác vụ này, encoder-decoder phù hợp gọn nhất. Encoder tạo một biểu diễn đặc của nguồn. Decoder sinh đầu ra, cross-attention vào biểu diễn đó ở mỗi bước. Huấn luyện là dịch một vị trí ở phía đầu ra. Cùng loss như GPT, chỉ được điều kiện hóa theo đầu ra encoder.

Hai bài báo định nghĩa cách làm hiện đại:

1. **T5** (Raffel và cộng sự 2019). "Text-to-Text Transfer Transformer." Mọi tác vụ NLP được đặt lại thành văn bản vào, văn bản ra. Một kiến trúc, một từ vựng, một loss. Được tiền huấn luyện trên dự đoán span được che (làm hỏng các span trong đầu vào, giải mã chúng trong đầu ra).
2. **BART** (Lewis và cộng sự 2019). "Bidirectional and Auto-Regressive Transformer." Autoencoder khử nhiễu: làm hỏng đầu vào theo nhiều cách (xáo trộn, che, xóa, xoay), yêu cầu decoder tái tạo bản gốc.

Năm 2026 định dạng encoder-decoder sống tiếp ở nơi cấu trúc đầu vào quan trọng:

- Whisper (tiếng nói → văn bản).
- Ngăn xếp dịch của Google.
- Một số mô hình hoàn thành / sửa mã có các cấu trúc ngữ cảnh-và-chỉnh sửa riêng biệt.
- Flan-T5 và các biến thể cho các tác vụ suy luận có cấu trúc.

Chỉ decoder giành sự chú ý, nhưng encoder-decoder chưa bao giờ biến mất.

## The Concept

![Encoder-decoder with cross-attention](../assets/encoder-decoder.svg)

### The forward loop

```
source tokens ─▶ encoder ─▶ (N_src, d_model)  ──┐
                                                 │
target tokens ─▶ decoder block                   │
                 ├─▶ masked self-attention       │
                 ├─▶ cross-attention ◀───────────┘
                 └─▶ FFN
                ↓
              next-token logits
```

Quan trọng là encoder chạy một lần mỗi đầu vào. Decoder chạy tự hồi quy nhưng cross-attention vào *cùng* đầu ra encoder ở mỗi bước. Lưu đệm đầu ra encoder là tăng tốc miễn phí cho các đầu vào dài.

### T5 pretraining — span corruption

Chọn các span ngẫu nhiên của đầu vào (độ dài trung bình 3 token, tổng 15%). Thay mỗi span bằng một sentinel duy nhất: `<extra_id_0>`, `<extra_id_1>`, v.v. Decoder chỉ xuất các span bị làm hỏng với tiền tố sentinel của chúng:

```
source: The quick <extra_id_0> fox jumps <extra_id_1> dog
target: <extra_id_0> brown <extra_id_1> over the lazy
```

Tín hiệu rẻ hơn dự đoán toàn chuỗi. Cạnh tranh với MLM (BERT) và prefix-LM (UniLM) trong thử nghiệm loại bỏ thành phần của bài báo T5.

### BART pretraining — multi-noise denoising

BART thử năm hàm gây nhiễu:

1. Che token.
2. Xóa token.
3. Điền văn bản (che một span, decoder chèn đúng độ dài).
4. Hoán vị câu.
5. Xoay tài liệu.

Kết hợp điền văn bản + hoán vị câu tạo các con số tác vụ phía sau tốt nhất. Decoder luôn tái tạo bản gốc. Đầu ra BART là toàn chuỗi, không chỉ các span bị làm hỏng — nên tính toán tiền huấn luyện cao hơn T5.

### Inference

Cùng sinh tự hồi quy như GPT. Lấy mẫu tham lam / beam / top-p áp dụng được. Beam search (độ rộng 4–5) là tiêu chuẩn cho dịch và tóm tắt vì phân phối đầu ra hẹp hơn trò chuyện.

### When to pick each variant in 2026

| Tác vụ | Encoder-decoder? | Vì sao |
|------|------------------|-----|
| Dịch | Có, thường vậy | Chuỗi nguồn rõ; phân phối đầu ra cố định; beam search hoạt động |
| Tiếng nói-thành-văn bản | Có (Whisper) | Phương thức đầu vào khác đầu ra; encoder định hình các đặc trưng âm thanh |
| Trò chuyện / suy luận | Không, chỉ decoder | Không "đầu vào" bền vững — cuộc hội thoại là chuỗi |
| Hoàn thành mã | Thường không | Chỉ decoder với ngữ cảnh dài thắng; các mô hình mã như Qwen 2.5 Coder là chỉ decoder |
| Tóm tắt | Cả hai đều được | BART, PEGASUS thắng các baseline chỉ decoder trước đây; các LLM chỉ decoder hiện đại ngang chúng |
| Trích xuất có cấu trúc | Cả hai | T5 gọn vì "văn bản → văn bản" hấp thụ bất kỳ định dạng đầu ra nào |

Xu hướng từ ~2022: chỉ decoder tiếp quản các tác vụ encoder-decoder từng sở hữu vì (a) các LLM chỉ decoder được tinh chỉnh theo chỉ dẫn khái quát sang bất kỳ thứ gì qua prompting, (b) một kiến trúc mở rộng dễ hơn hai, (c) RLHF giả định một decoder. Encoder-decoder giữ chỗ ở nơi phương thức đầu vào khác (tiếng nói, hình ảnh) hoặc nơi chất lượng beam search quan trọng.

```figure
encoder-decoder
```

## Build It

Xem `code/main.py`. Chúng ta triển khai làm hỏng span kiểu T5 cho một ngữ liệu đồ chơi — phần đơn lẻ hữu ích nhất của bài học này vì nó xuất hiện trong mọi công thức tiền huấn luyện encoder-decoder kể từ đó.

### Step 1: span corruption

```python
def corrupt_spans(tokens, mask_rate=0.15, mean_span=3.0, rng=None):
    """Pick spans summing to ~mask_rate of tokens. Return (corrupted_input, target)."""
    n = len(tokens)
    n_mask = max(1, int(n * mask_rate))
    n_spans = max(1, int(round(n_mask / mean_span)))
    ...
```

Định dạng đích là quy ước T5: `<sent0> span0 <sent1> span1 ...`. Đầu vào bị làm hỏng xen kẽ các token không đổi với các token sentinel ở các vị trí span.

### Step 2: verify round-trip

Với đầu vào bị làm hỏng và đích, tái tạo câu gốc. Nếu phép làm hỏng của bạn đảo ngược được, lượt truyền xuôi được định nghĩa rõ. Đây là một kiểm tra hợp lý — huấn luyện thực không bao giờ làm điều này, nhưng kiểm thử rẻ và bắt các lỗi lệch một trong việc theo dõi span.

### Step 3: BART noising

Năm hàm: `token_mask`, `token_delete`, `text_infill`, `sentence_permute`, `document_rotate`. Kết hợp hai hàm và hiển thị kết quả.

## Use It

Tham chiếu HuggingFace:

```python
from transformers import T5ForConditionalGeneration, T5Tokenizer
tok = T5Tokenizer.from_pretrained("google/flan-t5-base")
model = T5ForConditionalGeneration.from_pretrained("google/flan-t5-base")

inputs = tok("translate English to French: Attention is all you need.", return_tensors="pt")
out = model.generate(**inputs, max_new_tokens=32)
print(tok.decode(out[0], skip_special_tokens=True))
```

Thủ thuật T5: tên tác vụ đi vào văn bản đầu vào. Cùng mô hình xử lý hàng chục tác vụ vì mỗi tác vụ là văn bản vào, văn bản ra. Năm 2026 mẫu này đã được khái quát bởi các mô hình chỉ decoder được tinh chỉnh theo chỉ dẫn, nhưng T5 quy chuẩn nó trước.

## Ship It

Xem `outputs/skill-seq2seq-picker.md`. Skill chọn giữa encoder-decoder và chỉ decoder cho một tác vụ mới với cấu trúc đầu vào-đầu ra, độ trễ và các mục tiêu chất lượng.

## Exercises

1. **Dễ.** Chạy `code/main.py`, áp dụng làm hỏng span cho một câu 30 token, xác minh nối các token nguồn không phải sentinel với các span đích được giải mã tái hiện bản gốc.
2. **Trung bình.** Triển khai nhiễu `text_infill` của BART: thay các span ngẫu nhiên bằng một token `<mask>` duy nhất, và decoder phải suy ra đúng độ dài span cộng nội dung. Hiển thị một ví dụ.
3. **Khó.** Fine-tune `flan-t5-small` trên một ngữ liệu tiếng Anh → pig-Latin nhỏ (200 cặp). Đo BLEU trên một tập 50 cặp được giữ lại. So sánh với fine-tuning `Llama-3.2-1B` trên cùng dữ liệu với cùng tính toán.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Encoder-decoder | "Transformer seq2seq" | Hai chồng: encoder hai chiều cho đầu vào, decoder nhân quả có cross-attention cho đầu ra. |
| Cross-attention | "Nơi nguồn nói với đích" | Q của decoder × K/V của encoder. Nơi duy nhất thông tin encoder đi vào decoder. |
| Span corruption (Làm hỏng span) | "Thủ thuật tiền huấn luyện của T5" | Thay các span ngẫu nhiên bằng các token sentinel; decoder xuất các span. |
| Denoising objective (Mục tiêu khử nhiễu) | "Trò chơi của BART" | Áp dụng một hàm nhiễu cho đầu vào, huấn luyện decoder tái tạo chuỗi sạch. |
| Sentinel token (Token đánh dấu) | "Phần giữ chỗ `<extra_id_N>`" | Các token đặc biệt gắn nhãn các span bị làm hỏng trong nguồn và gắn lại nhãn chúng trong đích. |
| Flan | "T5 được tinh chỉnh theo chỉ dẫn" | T5 được fine-tune trên >1,800 tác vụ; khiến encoder-decoder cạnh tranh trong tuân theo chỉ dẫn. |
| Beam search (Tìm kiếm chùm) | "Chiến lược giải mã" | Giữ các chuỗi từng phần top-k ở mỗi bước; tiêu chuẩn cho dịch/tóm tắt. |
| Teacher forcing | "Đầu vào khi huấn luyện" | Khi huấn luyện, đưa token đầu ra trước thật vào decoder, không phải token được lấy mẫu. |

## Further Reading

- [Raffel et al. (2019). Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer](https://arxiv.org/abs/1910.10683) — T5.
- [Lewis et al. (2019). BART: Denoising Sequence-to-Sequence Pre-training for Natural Language Generation, Translation, and Comprehension](https://arxiv.org/abs/1910.13461) — BART.
- [Chung et al. (2022). Scaling Instruction-Finetuned Language Models](https://arxiv.org/abs/2210.11416) — Flan-T5.
- [Radford et al. (2022). Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356) — Whisper, encoder-decoder kinh điển năm 2026.
- [HuggingFace `modeling_t5.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/t5/modeling_t5.py) — triển khai tham chiếu.
