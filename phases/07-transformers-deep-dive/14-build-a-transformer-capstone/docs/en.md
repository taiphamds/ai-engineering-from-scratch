# Build a Transformer from Scratch — The Capstone

> Mười ba bài học. Một mô hình. Không lối tắt.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 01 through 13. Don't skip.
**Time:** ~120 minutes

## The Problem

Bạn đã đọc mọi bài báo. Bạn đã triển khai attention, chia multi-head, các mã hóa vị trí, các khối encoder và decoder, loss BERT và GPT, MoE, KV cache. Giờ khiến chúng hoạt động cùng nhau trên một tác vụ thực.

Capstone: huấn luyện một transformer chỉ decoder nhỏ đầu cuối trên một tác vụ mô hình hóa ngôn ngữ cấp ký tự. Nó đọc Shakespeare. Nó sinh Shakespeare mới. Nó đủ nhỏ để huấn luyện trên một máy tính xách tay trong dưới 10 phút. Nó đủ đúng để thay bằng một tập dữ liệu lớn hơn và huấn luyện lâu hơn cho bạn một LM thực.

Đây là "nanoGPT" của khóa học. Nó không nguyên bản — hướng dẫn nanoGPT năm 2023 của Karpathy là triển khai tham chiếu mọi sinh viên viết ít nhất một lần. Chúng ta lấy hình dạng và làm lại quanh những gì đã đề cập.

## The Concept

![Transformer-from-scratch block diagram](../assets/capstone.svg)

Kiến trúc, có chú giải:

```
input tokens (B, N)
   │
   ▼
token embedding + positional embedding  ◀── Lesson 04 (RoPE option)
   │
   ▼
┌──── block × L ────────────────────┐
│  RMSNorm                          │  ◀── Lesson 05
│  MultiHeadAttention (causal)      │  ◀── Lesson 03 + 07 (causal mask)
│  residual                         │
│  RMSNorm                          │
│  SwiGLU FFN                       │  ◀── Lesson 05
│  residual                         │
└────────────────────────────────── ┘
   │
   ▼
final RMSNorm
   │
   ▼
lm_head (tied to token embedding)
   │
   ▼
logits (B, N, V)
   │
   ▼
shift-by-one cross-entropy            ◀── Lesson 07
```

### What we ship

- `GPTConfig` — một nơi để cấu hình mọi siêu tham số.
- `MultiHeadAttention` — nhân quả, theo batch, với đường kiểu Flash tùy chọn (`scaled_dot_product_attention` của PyTorch).
- `SwiGLUFFN` — FFN hiện đại.
- `Block` — pre-norm, attention được bọc residual + FFN.
- `GPT` — embedding, các khối xếp chồng, head LM, generate().
- Vòng lặp huấn luyện với AdamW, LR cosine, cắt gradient.
- Tokenizer cấp ký tự trên văn bản Shakespeare.

### What we don't ship

- RoPE — được triển khai về khái niệm trong Bài 04. Ở đây chúng ta dùng các embedding vị trí được học cho đơn giản. Các bài tập yêu cầu bạn thay bằng RoPE.
- KV cache khi sinh — mỗi bước sinh tính lại attention trên toàn tiền tố. Chậm hơn nhưng đơn giản hơn. Các bài tập yêu cầu bạn thêm một KV cache.
- Flash Attention — PyTorch 2.0+ tự điều phối nếu các đầu vào khớp; chúng ta dùng `F.scaled_dot_product_attention`.
- MoE — một FFN mỗi khối. Bạn đã thấy MoE trong Bài 11.

### Target metrics

Trên một máy tính xách tay Mac M2, một GPT 4 tầng, 4 head, d_model=128 được huấn luyện trong 2,000 bước trên `tinyshakespeare.txt`:

- Loss huấn luyện hội tụ từ ~4.2 (ngẫu nhiên) xuống ~1.5 trong khoảng 6 phút.
- Đầu ra được lấy mẫu trông có dạng Shakespeare: các từ cổ, xuống dòng, các tên riêng như "ROMEO:" xuất hiện.
- Val loss (10% cuối văn bản được giữ lại) bám sát loss huấn luyện; không overfit ở kích thước/ngân sách này.

```figure
n5-block-stack
```

## Build It

Bài học này dùng PyTorch. Cài `torch` (bản CPU là đủ). Xem `code/main.py`. Script xử lý:

- Tải `tinyshakespeare.txt` nếu thiếu (hoặc đọc một bản cục bộ).
- Tokenizer ký tự cấp byte.
- Chia huấn luyện/xác thực tại 90/10.
- Vòng lặp huấn luyện với autocast bf16 trên phần cứng được hỗ trợ.
- Lấy mẫu sau khi huấn luyện hoàn tất.

### Step 1: data

```python
text = open("tinyshakespeare.txt").read()
chars = sorted(set(text))
stoi = {c: i for i, c in enumerate(chars)}
itos = {i: c for c, i in stoi.items()}
encode = lambda s: [stoi[c] for c in s]
decode = lambda xs: "".join(itos[x] for x in xs)
```

65 ký tự duy nhất. Từ vựng tí hon. Vừa một vocab_size 4 byte. Không BPE, không rắc rối tokenizer.

### Step 2: model

Xem `code/main.py`. Khối là chuẩn giáo trình từ Bài 05 — pre-norm, RMSNorm, SwiGLU, MHA nhân quả. Số tham số cho 4/4/128: ~800K.

### Step 3: training loop

Lấy một batch ngẫu nhiên các cửa sổ token dài 256. Truyền xuôi. Cross-entropy dịch một vị trí. Truyền ngược. Bước AdamW. Ghi nhật ký. Lặp lại.

```python
for step in range(max_steps):
    x, y = get_batch("train")
    logits = model(x)
    loss = F.cross_entropy(logits.view(-1, vocab_size), y.view(-1))
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
    opt.step()
    opt.zero_grad()
```

### Step 4: sample

Với một prompt, lặp truyền xuôi, lấy mẫu từ các logits top-p, nối thêm và tiếp tục. Dừng sau 500 token.

### Step 5: read the output

Sau 2,000 bước:

```
ROMEO:
Away and mild will not thy friend, that thou shalt wit:
The chief that well shame and hath been his friends,
...
```

Không phải Shakespeare. Nhưng có dạng Shakespeare. Một chiến thắng rõ cho ~800K tham số và 6 phút trên máy tính xách tay.

## Use It

Capstone này là một kiến trúc tham chiếu. Ba mở rộng để phát hành nó thành thứ thực:

1. **Hoán đổi tokenizer.** Dùng BPE (ví dụ `tiktoken.get_encoding("cl100k_base")`). Kích thước từ vựng nhảy từ 65 lên ~50,000. Năng lực mô hình cần tăng để bù.
2. **Huấn luyện trên một ngữ liệu lớn hơn.** Dùng `OpenWebText` hoặc `fineweb-edu` (HuggingFace). 10B token trên một A100 duy nhất mất ~24 giờ cho một GPT 125M tham số.
3. **Thêm RoPE + KV cache + Flash Attention.** Các bài tập dưới đây hướng dẫn bạn qua từng phần.

Điều này kết thúc thành một GPT 125M tham số sinh tiếng Anh trôi chảy. Không phải một mô hình tiên phong. Nhưng cùng đường mã — chỉ lớn hơn — là thứ Karpathy, EleutherAI và Allen Institute dùng để huấn luyện các checkpoint nghiên cứu năm 2026.

## Ship It

Xem `outputs/skill-transformer-review.md`. Skill rà soát một triển khai transformer từ đầu về tính đúng đắn trên cả 13 bài trước.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Xác minh loss xác thực bước cuối của mô hình được huấn luyện dưới 2.0. Đổi `max_steps` từ 2,000 lên 5,000 — val loss có tiếp tục cải thiện không?
2. **Trung bình.** Thay các embedding vị trí được học bằng RoPE. Áp dụng phép xoay cho Q và K bên trong `MultiHeadAttention`. Huấn luyện và xác minh val loss ít nhất cũng thấp bằng.
3. **Trung bình.** Triển khai một KV cache trong vòng lặp lấy mẫu. Sinh 500 token có và không cache. Thời gian thực nên cải thiện 5–20× trên máy tính xách tay.
4. **Khó.** Thêm một head thứ hai vào mô hình dự đoán token tiếp-theo-cộng-một (MTP — Multi-Token Prediction từ DeepSeek-V3). Huấn luyện kết hợp. Nó có giúp không?
5. **Khó.** Thay FFN đơn mỗi khối bằng một MoE 4 chuyên gia. Bộ định tuyến + định tuyến top-2. Xem val loss thay đổi thế nào ở số tham số hoạt động tương ứng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| nanoGPT | "Kho hướng dẫn của Karpathy" | Mã huấn luyện transformer chỉ decoder tối thiểu, ~300 LOC; tham chiếu kinh điển. |
| tinyshakespeare | "Ngữ liệu đồ chơi tiêu chuẩn" | ~1.1 MB văn bản; mọi hướng dẫn LM ký tự từ 2015 dùng nó. |
| Tied embeddings (Embedding buộc chung) | "Dùng chung ma trận đầu vào/đầu ra" | Trọng số head LM = chuyển vị ma trận embedding token; tiết kiệm tham số, cải thiện chất lượng. |
| bf16 autocast | "Thủ thuật độ chính xác huấn luyện" | Chạy xuôi/ngược bằng bf16, giữ trạng thái bộ tối ưu bằng fp32; tiêu chuẩn từ 2021. |
| Gradient clipping (Cắt gradient) | "Dừng các đột biến" | Giới hạn norm gradient toàn cục tại 1.0; ngăn huấn luyện bùng nổ. |
| Cosine LR schedule (Lịch LR cosine) | "Mặc định từ 2020+" | LR tăng tuyến tính (warmup) rồi giảm theo dạng cosine đến 10% đỉnh. |
| MFU | "Model FLOP Utilization" | FLOP đạt được / đỉnh lý thuyết; 40% đặc, 30% MoE là mạnh năm 2026. |
| Val loss (Loss xác thực) | "Loss được giữ lại" | Cross-entropy trên dữ liệu mô hình chưa thấy; bộ phát hiện overfit. |

## Further Reading

- [The Annotated Transformer (Harvard NLP)](https://nlp.seas.harvard.edu/annotated-transformer/) — triển khai có chú giải cổ điển.
