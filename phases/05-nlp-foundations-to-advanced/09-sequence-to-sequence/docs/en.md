# Sequence-to-Sequence Models

> Hai RNN giả làm một bộ dịch. Nút thắt chúng gặp là lý do attention tồn tại.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 5 · 08 (CNNs + RNNs for Text), Phase 3 · 11 (PyTorch Intro)
**Time:** ~75 minutes

## The Problem

Phân loại ánh xạ một chuỗi có độ dài thay đổi sang một nhãn duy nhất. Dịch ánh xạ một chuỗi có độ dài thay đổi sang một chuỗi khác cũng có độ dài thay đổi. Đầu vào và đầu ra thuộc các từ vựng khác nhau, có thể là các ngôn ngữ khác nhau, không bảo đảm độ dài ngang nhau.

Kiến trúc seq2seq (Sutskever, Vinyals, Le, 2014) giải quyết điều này bằng một công thức cố ý đơn giản. Hai RNN. Một mạng đọc câu nguồn và tạo một vector ngữ cảnh kích thước cố định. Mạng kia đọc vector đó và sinh câu đích từng token một. Cùng mã bạn đã viết cho bài 08, được ghép lại theo cách khác.

Điều này đáng nghiên cứu vì hai lý do. Thứ nhất, nút thắt vector ngữ cảnh là thất bại hữu ích nhất về mặt sư phạm trong NLP. Nó tạo động lực cho mọi thứ attention và transformer làm tốt. Thứ hai, công thức huấn luyện (teacher forcing, scheduled sampling, beam search khi suy luận) vẫn áp dụng cho mọi hệ thống sinh hiện đại bao gồm LLM.

## The Concept

**Encoder.** Một RNN đọc câu nguồn. Trạng thái ẩn cuối của nó là **vector ngữ cảnh** — một bản tóm tắt kích thước cố định của toàn bộ đầu vào. Được cho là không mất gì ngoài nguồn.

**Decoder.** Một RNN khác được khởi tạo từ vector ngữ cảnh. Ở mỗi bước nó nhận token được sinh trước đó làm đầu vào và tạo một phân phối trên từ vựng đích. Lấy mẫu hoặc argmax để chọn token tiếp theo. Đưa nó trở lại. Lặp lại cho đến khi một token `<EOS>` được tạo hoặc đạt độ dài tối đa.

**Huấn luyện:** Cross-entropy loss tại mỗi bước decoder, được cộng trên chuỗi. Lan truyền ngược qua thời gian tiêu chuẩn qua cả hai mạng.

**Teacher forcing.** Khi huấn luyện, đầu vào của decoder ở bước `t` là token *ground-truth* tại vị trí `t-1`, không phải dự đoán trước đó của chính decoder. Điều này ổn định huấn luyện; không có nó, các lỗi sớm nối tiếp nhau và mô hình không bao giờ học được. Khi suy luận, bạn phải dùng các dự đoán của chính mô hình, nên luôn có khoảng cách phân phối huấn luyện/suy luận. Khoảng cách đó gọi là **thiên lệch phơi nhiễm**.

**Nút thắt.** Mọi thứ encoder học về nguồn phải được ép vào một vector ngữ cảnh đó. Các câu dài mất chi tiết. Các từ hiếm bị làm mờ. Sắp xếp lại (chat noir so với black cat) phải được ghi nhớ, không được tính toán.

Attention (bài 10) sửa điều này bằng cách cho decoder nhìn *mọi* trạng thái ẩn encoder, không chỉ trạng thái cuối. Đó là toàn bộ lời giới thiệu.

```figure
lstm-gates
```

## Build It

### Step 1: an encoder

```python
import torch
import torch.nn as nn


class Encoder(nn.Module):
    def __init__(self, src_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(src_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)

    def forward(self, src):
        e = self.embed(src)
        outputs, hidden = self.gru(e)
        return outputs, hidden
```

`outputs` có hình dạng `[batch, seq_len, hidden_dim]` — một trạng thái ẩn cho mỗi vị trí đầu vào. `hidden` có hình dạng `[1, batch, hidden_dim]` — bước cuối. Bài 08 nói "pooling trên các đầu ra để phân loại." Ở đây chúng ta giữ trạng thái ẩn cuối làm vector ngữ cảnh và bỏ qua các đầu ra theo bước.

### Step 2: a decoder

```python
class Decoder(nn.Module):
    def __init__(self, tgt_vocab_size, embed_dim, hidden_dim):
        super().__init__()
        self.embed = nn.Embedding(tgt_vocab_size, embed_dim, padding_idx=0)
        self.gru = nn.GRU(embed_dim, hidden_dim, batch_first=True)
        self.fc = nn.Linear(hidden_dim, tgt_vocab_size)

    def forward(self, token, hidden):
        e = self.embed(token)
        out, hidden = self.gru(e, hidden)
        logits = self.fc(out)
        return logits, hidden
```

Decoder được gọi từng bước một. Đầu vào: một batch các token đơn và trạng thái ẩn hiện tại. Đầu ra: logits từ vựng cho token tiếp theo và trạng thái ẩn được cập nhật.

### Step 3: training loop with teacher forcing

```python
def train_batch(encoder, decoder, src, tgt, bos_id, optimizer, teacher_forcing_ratio=0.9):
    optimizer.zero_grad()
    _, hidden = encoder(src)
    batch_size, tgt_len = tgt.shape
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    loss = 0.0
    loss_fn = nn.CrossEntropyLoss(ignore_index=0)

    for t in range(tgt_len):
        logits, hidden = decoder(input_token, hidden)
        step_loss = loss_fn(logits.squeeze(1), tgt[:, t])
        loss += step_loss
        use_teacher = torch.rand(1).item() < teacher_forcing_ratio
        if use_teacher:
            input_token = tgt[:, t].unsqueeze(1)
        else:
            input_token = logits.argmax(dim=-1)

    loss.backward()
    optimizer.step()
    return loss.item() / tgt_len
```

Hai nút điều chỉnh cần nêu tên. `ignore_index=0` bỏ qua loss trên các token đệm. `teacher_forcing_ratio` là xác suất dùng token thật so với dự đoán của mô hình ở mỗi bước. Bắt đầu tại 1.0 (teacher forcing đầy đủ) và giảm dần xuống ~0.5 trong huấn luyện để thu hẹp khoảng cách thiên lệch phơi nhiễm.

### Step 4: inference loop (greedy)

```python
@torch.no_grad()
def greedy_decode(encoder, decoder, src, bos_id, eos_id, max_len=50):
    _, hidden = encoder(src)
    batch_size = src.shape[0]
    input_token = torch.full((batch_size, 1), bos_id, dtype=torch.long)
    output_ids = []
    for _ in range(max_len):
        logits, hidden = decoder(input_token, hidden)
        next_token = logits.argmax(dim=-1)
        output_ids.append(next_token)
        input_token = next_token
        if (next_token == eos_id).all():
            break
    return torch.cat(output_ids, dim=1)
```

Giải mã tham lam chọn token có xác suất cao nhất ở mỗi bước. Nó có thể đi chệch: một khi bạn đã chọn một token, bạn không thể rút lại nó. **Beam search** giữ lại các chuỗi từng phần top-`k` và chọn chuỗi hoàn chỉnh có điểm cao nhất ở cuối. Độ rộng beam 3-5 là tiêu chuẩn.

### Step 5: the bottleneck, demonstrated

Huấn luyện mô hình trên một tác vụ sao chép đồ chơi: nguồn `[a, b, c, d, e]`, đích `[a, b, c, d, e]`. Tăng độ dài chuỗi. Quan sát accuracy.

```
seq_len=5   copy accuracy: 98%
seq_len=10  copy accuracy: 91%
seq_len=20  copy accuracy: 62%
seq_len=40  copy accuracy: 23%
```

Một trạng thái ẩn GRU duy nhất không thể ghi nhớ không mất mát một đầu vào 40 token. Thông tin có ở mỗi bước encoder, nhưng decoder chỉ thấy trạng thái cuối. Attention sửa trực tiếp điều này.

## Use It

PyTorch có `nn.Transformer` và các mẫu seq2seq dựa trên `nn.LSTM`. Thư viện `transformers` của Hugging Face cung cấp các mô hình encoder-decoder đầy đủ (BART, T5, mBART, NLLB) được huấn luyện trên hàng tỷ token.

```python
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

tok = AutoTokenizer.from_pretrained("facebook/bart-base")
model = AutoModelForSeq2SeqLM.from_pretrained("facebook/bart-base")

src = tok("Translate this to French: Hello, how are you?", return_tensors="pt")
out = model.generate(**src, max_new_tokens=50, num_beams=4)
print(tok.decode(out[0], skip_special_tokens=True))
```

Các encoder-decoder hiện đại bỏ RNN để dùng transformer. Hình dạng cấp cao (encoder, decoder, sinh từng token một) giống hệt bài báo seq2seq năm 2014. Cơ chế bên trong mỗi khối khác nhau.

### When to still reach for RNN-based seq2seq

Gần như không bao giờ, cho các dự án mới. Các ngoại lệ cụ thể:

- Dịch luồng nơi bạn tiêu thụ đầu vào từng token một với bộ nhớ bị chặn.
- Sinh văn bản trên thiết bị nơi chi phí bộ nhớ transformer quá cao.
- Sư phạm. Hiểu nút thắt encoder-decoder là con đường nhanh nhất để hiểu vì sao transformer thắng.

### Exposure bias and its mitigations

- **Scheduled sampling.** Giảm dần tỷ lệ teacher forcing trong huấn luyện để mô hình học phục hồi từ các lỗi của chính nó.
- **Huấn luyện rủi ro tối thiểu.** Huấn luyện trên điểm BLEU cấp câu thay vì cross-entropy cấp token. Gần hơn với điều bạn thực sự muốn.
- **Fine-tuning bằng học tăng cường.** Thưởng cho bộ sinh chuỗi bằng một thước đo. Được dùng trong RLHF LLM hiện đại.

Cả ba vẫn áp dụng cho việc sinh dựa trên transformer.

## Ship It

Lưu thành `outputs/prompt-seq2seq-design.md`:

```markdown
---
name: seq2seq-design
description: Design a sequence-to-sequence pipeline for a given task.
phase: 5
lesson: 09
---

Given a task (translation, summarization, paraphrase, question rewrite), output:

1. Architecture. Pretrained transformer encoder-decoder (BART, T5, mBART, NLLB) is the default. RNN-based seq2seq only for specific constraints.
2. Starting checkpoint. Name it (`facebook/bart-base`, `google/flan-t5-base`, `facebook/nllb-200-distilled-600M`). Match the checkpoint to task and language coverage.
3. Decoding strategy. Greedy for deterministic output, beam search (width 4-5) for quality, sampling with temperature for diversity. One sentence justification.
4. One failure mode to verify before shipping. Exposure bias manifests as generation drift on longer outputs; sample 20 outputs at the 90th-percentile length and eyeball.

Refuse to recommend training a seq2seq from scratch for under a million parallel examples. Flag any pipeline that uses greedy decoding for user-facing content as fragile (greedy repeats and loops).
```

## Exercises

1. **Dễ.** Triển khai tác vụ sao chép đồ chơi. Huấn luyện một GRU seq2seq trên các cặp đầu vào-đầu ra mà đích bằng nguồn. Đo accuracy tại các độ dài 5, 10, 20. Tái hiện nút thắt.
2. **Trung bình.** Thêm giải mã beam search với độ rộng beam 3. Đo BLEU trên một ngữ liệu song song nhỏ so với tham lam. Ghi lại nơi beam search thắng (thường các token cuối) và nơi nó không tạo khác biệt.
3. **Khó.** Fine-tune `facebook/bart-base` trên một tập dữ liệu diễn đạt lại 10k cặp. So sánh đầu ra beam-4 của mô hình fine-tune với mô hình cơ sở trên các đầu vào được giữ lại. Báo cáo BLEU và chọn 10 ví dụ định tính.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Encoder (Bộ mã hóa) | RNN đầu vào | Đọc nguồn. Tạo các trạng thái ẩn theo bước và một vector ngữ cảnh cuối. |
| Decoder (Bộ giải mã) | RNN đầu ra | Được khởi tạo từ vector ngữ cảnh. Sinh các token đích từng token một. |
| Context vector (Vector ngữ cảnh) | Bản tóm tắt | Trạng thái ẩn encoder cuối. Kích thước cố định. Nút thắt mà attention giải quyết. |
| Teacher forcing | Dùng các token thật | Đưa vào token trước đó ground-truth khi huấn luyện. Ổn định việc học. |
| Exposure bias (Thiên lệch phơi nhiễm) | Khoảng cách huấn luyện/kiểm thử | Mô hình được huấn luyện trên các token thật chưa từng luyện phục hồi từ các lỗi của chính nó. |
| Beam search (Tìm kiếm chùm) | Giải mã tốt hơn | Giữ lại các chuỗi từng phần top-k ở mỗi bước thay vì chọn tham lam. |

## Further Reading

- [Sutskever, Vinyals, Le (2014). Sequence to Sequence Learning with Neural Networks](https://arxiv.org/abs/1409.3215) — bài báo seq2seq gốc. Bốn trang.
- [Cho et al. (2014). Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078) — giới thiệu GRU và cách đặt vấn đề encoder-decoder.
- [Bahdanau, Cho, Bengio (2014). Neural Machine Translation by Jointly Learning to Align and Translate](https://arxiv.org/abs/1409.0473) — bài báo attention. Đọc ngay sau bài học này.
- [PyTorch NLP from Scratch tutorial](https://pytorch.org/tutorials/intermediate/seq2seq_translation_tutorial.html) — mã seq2seq + attention có thể xây dựng.
