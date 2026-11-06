# BERT — Masked Language Modeling

> GPT dự đoán từ tiếp theo. BERT dự đoán một từ bị thiếu. Một câu khác biệt — và nửa thập kỷ của mọi thứ có hình dạng embedding.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 5 · 02 (Text Representation)
**Time:** ~45 minutes

## The Problem

Năm 2018 mọi tác vụ NLP — cảm xúc, NER, QA, kéo theo — huấn luyện mô hình riêng từ đầu trên dữ liệu có nhãn riêng. Không có checkpoint "hiểu tiếng Anh" được tiền huấn luyện nào bạn có thể fine-tune. ELMo (2018) cho thấy bạn có thể tiền huấn luyện các embedding theo ngữ cảnh bằng một LSTM hai chiều; nó hữu ích nhưng không khái quát.

BERT (Devlin và cộng sự 2018) hỏi: nếu chúng ta lấy một encoder transformer, huấn luyện nó trên mọi câu trên internet và ép nó dự đoán các từ thiếu từ ngữ cảnh hai phía thì sao? Rồi bạn fine-tune một head trên tác vụ phía sau. Hiệu quả tham số là một sự khai sáng.

Kết quả: trong vòng 18 tháng BERT và các biến thể (RoBERTa, ALBERT, ELECTRA) thống trị mọi bảng xếp hạng NLP tồn tại. Đến năm 2020 mọi công cụ tìm kiếm, pipeline kiểm duyệt nội dung và hệ thống tìm kiếm ngữ nghĩa trên trái đất đều có một BERT bên trong.

Năm 2026 các mô hình chỉ encoder vẫn là công cụ đúng cho phân loại, truy xuất và trích xuất có cấu trúc — chúng chạy nhanh hơn decoder 5–10× mỗi token và các embedding của chúng là backbone của mọi ngăn xếp truy xuất hiện đại. ModernBERT (tháng 12 năm 2024) đẩy kiến trúc lên ngữ cảnh 8K với Flash Attention + RoPE + GeGLU.

## The Concept

![Masked language modeling: pick tokens, mask them, predict originals](../assets/bert-mlm.svg)

### The training signal

Lấy một câu: `the quick brown fox jumps over the lazy dog`.

Che ngẫu nhiên 15% các token:

```
input:  the [MASK] brown fox jumps [MASK] the lazy dog
target: the  quick brown fox jumps  over  the lazy dog
```

Huấn luyện mô hình dự đoán các token gốc ở các vị trí được che. Vì encoder hai chiều, dự đoán `[MASK]` ở vị trí 1 có thể dùng `brown fox jumps` ở các vị trí 2+. Đó là điều GPT không thể làm.

### The BERT mask rules

Trong 15% token được chọn để dự đoán:

- 80% được thay bằng `[MASK]`.
- 10% được thay bằng một token ngẫu nhiên.
- 10% được giữ nguyên.

Vì sao không luôn `[MASK]`? Vì `[MASK]` không bao giờ xuất hiện khi suy luận. Huấn luyện mô hình kỳ vọng `[MASK]` tại 100% các vị trí được che sẽ tạo một dịch chuyển phân phối giữa tiền huấn luyện và fine-tuning. 10% ngẫu nhiên + 10% giữ nguyên giữ mô hình trung thực.

### Next Sentence Prediction (NSP) — and why it was dropped

BERT gốc cũng huấn luyện trên NSP: cho hai câu A và B, dự đoán B có theo sau A không. RoBERTa (2019) loại bỏ nó trong thử nghiệm và cho thấy NSP gây hại, không giúp. Các encoder hiện đại bỏ qua nó.

### What changed in 2026: ModernBERT

Bài báo ModernBERT năm 2024 xây lại khối bằng các thành phần cơ bản năm 2026:

| Thành phần | BERT gốc (2018) | ModernBERT (2024) |
|-----------|----------------------|-------------------|
| Vị trí | Tuyệt đối được học | RoPE |
| Kích hoạt | GELU | GeGLU |
| Chuẩn hóa | LayerNorm | Pre-norm RMSNorm |
| Attention | Đặc đầy đủ | Luân phiên cục bộ (128) + toàn cục |
| Độ dài ngữ cảnh | 512 | 8192 |
| Tokenizer | WordPiece | BPE |

Và khác với ngăn xếp năm 2018, nó nguyên bản Flash Attention. Suy luận nhanh hơn 2–3× ở độ dài chuỗi 8K so với DeBERTa-v3 với điểm GLUE tốt hơn.

### Use cases that still pick an encoder in 2026

| Tác vụ | Vì sao encoder thắng decoder |
|------|---------------------------|
| Các embedding truy xuất / tìm kiếm ngữ nghĩa | Ngữ cảnh hai chiều = chất lượng embedding mỗi token tốt hơn |
| Phân loại (cảm xúc, ý định, độc hại) | Một lượt truyền xuôi; không chi phí phụ sinh |
| NER / gán nhãn token | Đầu ra theo vị trí, hai chiều nguyên bản |
| Kéo theo zero-shot (NLI) | Head phân loại trên encoder |
| Bộ xếp hạng lại cho RAG | Chấm điểm cross-encoder, nhanh hơn các bộ xếp hạng lại LLM 10 lần |

```figure
transformer-residual
```

## Build It

### Step 1: masking logic

Xem `code/main.py`. Hàm `create_mlm_batch` nhận một danh sách ID token, kích thước từ vựng và xác suất che. Trả ID đầu vào (đã áp mặt nạ) và nhãn (chỉ tại các vị trí được che, -100 ở nơi khác — quy ước chỉ số bỏ qua của PyTorch).

```python
def create_mlm_batch(tokens, vocab_size, mask_prob=0.15, rng=None):
    input_ids = list(tokens)
    labels = [-100] * len(tokens)
    for i, t in enumerate(tokens):
        if rng.random() < mask_prob:
            labels[i] = t
            r = rng.random()
            if r < 0.8:
                input_ids[i] = MASK_ID
            elif r < 0.9:
                input_ids[i] = rng.randrange(vocab_size)
            # else: keep original
    return input_ids, labels
```

### Step 2: run MLM prediction on a tiny corpus

Huấn luyện một encoder 2 tầng + head MLM trên một từ vựng 20 từ, 200 câu. Không gradient — chúng ta làm các kiểm tra hợp lý lượt truyền xuôi. Huấn luyện đầy đủ cần PyTorch.

### Step 3: compare mask types

Cho thấy cách quy tắc ba ngả giữ mô hình dùng được không có `[MASK]`. Dự đoán trên một câu không che và một câu được che. Cả hai nên tạo các phân phối token hợp lý vì mô hình thấy cả hai mẫu trong huấn luyện.

### Step 4: fine-tune head

Thay head MLM bằng một head phân loại trên một tập dữ liệu cảm xúc đồ chơi. Chỉ head huấn luyện; encoder đóng băng. Đây là mẫu mọi ứng dụng BERT tuân theo.

## Use It

```python
from transformers import AutoModel, AutoTokenizer

tok = AutoTokenizer.from_pretrained("answerdotai/ModernBERT-base")
model = AutoModel.from_pretrained("answerdotai/ModernBERT-base")

text = "Attention is all you need."
inputs = tok(text, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, N, 768)
```

**Các mô hình embedding là BERT được fine-tune.** Các mô hình `sentence-transformers` như `all-MiniLM-L6-v2` là các BERT được huấn luyện bằng contrastive loss. Encoder giống nhau. Loss thay đổi.

**Các bộ xếp hạng lại cross-encoder cũng là BERT được fine-tune.** Phân loại cặp trên `[CLS] query [SEP] doc [SEP]`. Attention hai chiều giữa truy vấn và tài liệu chính xác là thứ cho cross-encoder lợi thế chất lượng so với bi-encoder.

**Khi nào không chọn BERT năm 2026.** Bất kỳ thứ gì có tính sinh. Encoder không có cách hợp lý để tự hồi quy tạo token. Ngoài ra: bất kỳ thứ gì dưới 1B tham số mà một decoder nhỏ có thể khớp chất lượng với linh hoạt hơn (Phi-3-Mini, Qwen2-1.5B).

## Ship It

Xem `outputs/skill-bert-finetuner.md`. Skill xác định phạm vi một fine-tune BERT (lựa chọn backbone, đặc tả head, dữ liệu, đánh giá, dừng) cho một tác vụ phân loại hoặc trích xuất mới.

## Exercises

1. **Dễ.** Chạy `code/main.py` và in phân phối mặt nạ trên 10,000 token. Xác nhận ~15% được chọn, và trong số đó ~80% thành `[MASK]`.
2. **Trung bình.** Triển khai che toàn từ: nếu một từ được tokenize thành các từ con, che tất cả các từ con cùng nhau hoặc không che từ con nào. Đo liệu điều này có cải thiện accuracy MLM trên một ngữ liệu 500 câu.
3. **Khó.** Huấn luyện một BERT tí hon (2 tầng, d=64) trên 10,000 câu từ một tập dữ liệu công khai. Fine-tune token `[CLS]` cho cảm xúc SST-2. So sánh với một baseline chỉ decoder ở số tham số tương ứng — bên nào thắng?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| MLM | "Mô hình hóa ngôn ngữ che mặt nạ" | Tín hiệu huấn luyện: ngẫu nhiên thay 15% token bằng `[MASK]`, dự đoán các bản gốc. |
| Bidirectional (Hai chiều) | "Nhìn cả hai phía" | Attention encoder không có mặt nạ nhân quả — mọi vị trí thấy mọi vị trí khác. |
| `[CLS]` | "Token pooler" | Một token đặc biệt được thêm vào đầu mọi chuỗi; embedding cuối của nó được dùng làm biểu diễn cấp câu. |
| `[SEP]` | "Dấu phân cách phân đoạn" | Phân cách các chuỗi được ghép cặp (ví dụ truy vấn/tài liệu, câu A/B). |
| NSP | "Dự đoán câu tiếp theo" | Tác vụ tiền huấn luyện thứ hai của BERT; được cho thấy vô dụng trong RoBERTa, bị bỏ sau 2019. |
| Fine-tuning (Tinh chỉnh) | "Thích nghi với một tác vụ" | Giữ encoder phần lớn đóng băng; huấn luyện một head nhỏ phía trên cho tác vụ phía sau. |
| Cross-encoder | "Một bộ xếp hạng lại" | Một BERT nhận cả truy vấn và tài liệu làm đầu vào, xuất một điểm liên quan. |
| ModernBERT | "Làm mới năm 2024" | Encoder được xây lại với RoPE, RMSNorm, GeGLU, attention cục bộ/toàn cục luân phiên, ngữ cảnh 8K. |

## Further Reading

- [Devlin et al. (2018). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805) — bài báo gốc.
- [Liu et al. (2019). RoBERTa: A Robustly Optimized BERT Pretraining Approach](https://arxiv.org/abs/1907.11692) — cách huấn luyện BERT đúng; giết NSP.
- [Clark et al. (2020). ELECTRA: Pre-training Text Encoders as Discriminators Rather Than Generators](https://arxiv.org/abs/2003.10555) — phát hiện token bị thay thế thắng MLM ở tính toán tương ứng.
- [Warner et al. (2024). Smarter, Better, Faster, Longer: A Modern Bidirectional Encoder](https://arxiv.org/abs/2412.13663) — bài báo ModernBERT.
- [HuggingFace `modeling_bert.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/bert/modeling_bert.py) — tham chiếu encoder kinh điển.
