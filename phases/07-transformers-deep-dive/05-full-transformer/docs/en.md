# The Full Transformer — Encoder + Decoder

> Attention là ngôi sao. Mọi thứ khác — residual, chuẩn hóa, feed-forward, cross-attention — là giàn đỡ cho phép bạn xếp nó sâu.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention), Phase 7 · 04 (Positional Encoding)
**Time:** ~75 minutes

## The Problem

Một tầng attention duy nhất là một bộ trích xuất đặc trưng, không phải một mô hình. Một phép nhân ma trận mỗi tầng không đủ năng lực cho ngôn ngữ. Bạn cần độ sâu — và độ sâu hỏng nếu thiếu kết nối đúng.

Bài báo Vaswani năm 2017 đóng gói sáu quyết định thiết kế biến một tầng attention thành một khối có thể xếp chồng. Mọi transformer từ đó — chỉ encoder (BERT), chỉ decoder (GPT), encoder-decoder (T5) — kế thừa cùng khung. Năm 2026 các khối đã được tinh chỉnh (RMSNorm, SwiGLU, pre-norm, RoPE) nhưng khung giống hệt.

Bài học này là khung. Các bài tiếp theo chuyên biệt hóa nó — 06 cho encoder, 07 cho decoder, 08 cho encoder-decoder.

## The Concept

![Encoder and decoder block internals, wired](../assets/full-transformer.svg)

### The six pieces

1. **Embedding + tín hiệu vị trí.** Token → vector. Vị trí được đưa vào qua RoPE (hiện đại) hoặc hình sin (cổ điển).
2. **Self-attention.** Mọi vị trí chú ý đến mọi vị trí khác. Được che trong decoder.
3. **Mạng truyền xuôi (FFN).** MLP hai tầng theo vị trí: `W_2 · activation(W_1 · x)`. Tỷ lệ mở rộng mặc định 4×.
4. **Kết nối residual.** `x + sublayer(x)`. Không có điều này, gradient tiêu biến sau ~6 tầng.
5. **Chuẩn hóa tầng.** `LayerNorm` hoặc `RMSNorm` (hiện đại). Ổn định luồng residual.
6. **Cross-attention (chỉ decoder).** Query đến từ decoder, key và value từ đầu ra encoder.

Quan sát một vector chảy qua một khối: attention trộn giữa các vị trí, residual mang nó về phía trước, FFN biến đổi nó và norm giữ luồng ổn định.

```figure
transformer-block
```

### Encoder block (used by BERT, T5 encoder)

```
x → LN → MHA(self) → + → LN → FFN → + → out
                     ^              ^
                     |              |
                     └── residual ──┘
```

Encoder là hai chiều. Không masking. Mọi vị trí thấy mọi vị trí.

### Decoder block (used by GPT, T5 decoder)

```
x → LN → MHA(masked self) → + → LN → MHA(cross to encoder) → + → LN → FFN → + → out
```

Decoder có ba tầng con mỗi khối. Tầng giữa — cross-attention — là nơi duy nhất thông tin chảy từ encoder sang decoder. Trong một kiến trúc chỉ decoder thuần (GPT), cross-attention bị bỏ và bạn chỉ có self-attention được che + FFN.

### Pre-norm vs post-norm

Bài báo gốc: `x + sublayer(LN(x))` so với `LN(x + sublayer(x))`. Post-norm mất ưu thế khoảng năm 2019 — nó khó huấn luyện sâu hơn nếu không warmup cẩn thận. Pre-norm (`LN` *trước* tầng con) là mặc định năm 2026: Llama, Qwen, GPT-3+, Mistral đều dùng nó.

### The 2026 modernized block

Vaswani 2017 phát hành LayerNorm + ReLU. Các ngăn xếp hiện đại thay cả hai. Các khối production thực sự trông như thế nào:

| Thành phần | 2017 | 2026 |
|-----------|------|------|
| Chuẩn hóa | LayerNorm | RMSNorm |
| Kích hoạt FFN | ReLU | SwiGLU |
| Mở rộng FFN | 4× | 2.6× (SwiGLU dùng ba ma trận, tổng tham số khớp) |
| Vị trí | Hình sin tuyệt đối | RoPE |
| Attention | MHA đầy đủ | GQA (hoặc MLA) |
| Các số hạng bias | Có | Không |

RMSNorm bỏ việc trừ trung bình của LayerNorm (ít hơn một phép trừ), tiết kiệm tính toán và thực nghiệm cho thấy ít nhất cũng ổn định tương đương. SwiGLU (`Swish(W1 x) ⊙ W3 x`) nhất quán vượt FFN ReLU/GELU ~0.5 điểm ppl trong các bài báo Llama, PaLM và Qwen.

### Parameter count

Với một khối có `d_model = d` và mở rộng FFN `r`:

- MHA: `4 · d²` (các phép chiếu Q, K, V, O)
- FFN (SwiGLU): `3 · d · (r · d)` ≈ `3rd²`
- Norm: không đáng kể

Tại `d = 4096, r = 2.6, layers = 32` (xấp xỉ Llama 3 8B), tổng: `32 · (4·4096² + 3·2.6·4096²) ≈ 32 · (67M + 131M) ≈ 32 · 198M ≈ 6.3B` tham số trong các khối, cộng khoảng 1B cho các embedding và head đầu ra (từ vựng 128K × 4096, không chia sẻ trọng số). Kết quả đó gần 8B đã công bố. Mô hình thực sử dụng GQA (các phép chiếu K và V nhỏ hơn) và một FFN rộng hơn (`r = 3.5`), chuyển tham số từ attention sang FFN nhưng giữ tổng gần 8B.

## Build It

### Step 1: the building blocks

Dùng lớp `Matrix` nhỏ từ Bài 03 (được sao chép vào file này để độc lập):

- `layer_norm(x, eps=1e-5)` — trừ trung bình, chia cho độ lệch chuẩn.
- `rms_norm(x, eps=1e-6)` — chia cho RMS. Không trừ trung bình.
- `gelu(x)` và `silu(x) * W3 x` (SwiGLU).
- `ffn_swiglu(x, W1, W2, W3)`.
- `encoder_block(x, params)` và `decoder_block(x, enc_out, params)`.

Xem `code/main.py` để có kết nối đầy đủ.

### Step 2: wire a 2-layer encoder and a 2-layer decoder

Xếp chúng. Truyền đầu ra encoder vào mọi cross-attention decoder. Thêm một LN cuối trước phép chiếu đầu ra.

```python
def encode(tokens, params):
    x = embed(tokens, params.emb) + sinusoidal(len(tokens), params.d)
    for block in params.encoder_blocks:
        x = encoder_block(x, block)
    return x

def decode(target_tokens, encoder_out, params):
    x = embed(target_tokens, params.emb) + sinusoidal(len(target_tokens), params.d)
    for block in params.decoder_blocks:
        x = decoder_block(x, encoder_out, block)
    return x
```

### Step 3: run forward on a toy example

Đưa một nguồn 6 token và một đích 5 token qua. Xác minh hình dạng đầu ra là `(5, vocab)`. Không huấn luyện — bài học này về kiến trúc, không phải loss.

### Step 4: swap in RMSNorm + SwiGLU

Thay LayerNorm và ReLU-FFN bằng RMSNorm và SwiGLU. Xác nhận các hình dạng vẫn khớp. Đây là hiện đại hóa năm 2026 bằng một lần thay hàm.

## Use It

Các triển khai tham chiếu PyTorch/TF: `nn.TransformerEncoderLayer`, `nn.TransformerDecoderLayer`. Nhưng hầu hết mã production năm 2026 tự xây dựng khối vì:

- Flash Attention được gọi bên trong attention, không qua `nn.MultiheadAttention`.
- GQA / MLA không có trong tham chiếu stdlib.
- RoPE, RMSNorm, SwiGLU không phải các mặc định PyTorch.

`transformers` của HF có các khối tham chiếu rõ ràng bạn nên đọc: `modeling_llama.py` là khối chỉ decoder kinh điển năm 2026. Nó dài ~500 dòng và đáng đi qua một lần.

**Encoder so với decoder so với encoder-decoder — khi nào chọn:**

| Nhu cầu | Chọn | Ví dụ |
|------|------|---------|
| Phân loại, embedding, QA trên văn bản | Chỉ encoder | BERT, DeBERTa, ModernBERT |
| Sinh văn bản, trò chuyện, mã, suy luận | Chỉ decoder | GPT, Llama, Claude, Qwen |
| Đầu vào có cấu trúc → đầu ra có cấu trúc (dịch, tóm tắt) | Encoder-decoder | T5, BART, Whisper |

Chỉ decoder thắng ngôn ngữ vì nó mở rộng gọn nhất và xử lý cả hiểu lẫn sinh. Encoder-decoder vẫn tốt nhất khi đầu vào có bản sắc "chuỗi nguồn" rõ ràng (dịch, nhận dạng tiếng nói, các tác vụ có cấu trúc).

## Ship It

Xem `outputs/skill-transformer-block-reviewer.md`. Skill rà soát một triển khai khối transformer mới theo các mặc định năm 2026 và đánh dấu các phần thiếu (pre-norm, RoPE, RMSNorm, GQA, tỷ lệ mở rộng FFN).

## Exercises

1. **Dễ.** Đếm các tham số trong encoder_block của bạn tại `d_model=512, n_heads=8, ffn_expansion=4, swiglu=True`. Xác thực bằng cách triển khai khối và dùng `sum(p.numel() for p in block.parameters())`.
2. **Trung bình.** Chuyển từ post-norm sang pre-norm. Khởi tạo cả hai và đo norm kích hoạt sau 12 tầng xếp chồng trên đầu vào ngẫu nhiên. Các kích hoạt của post-norm phải bùng nổ; của pre-norm phải giữ trong giới hạn.
3. **Khó.** Triển khai một encoder-decoder 4 tầng trên một tác vụ sao chép đồ chơi (sao chép `x` đảo ngược). Huấn luyện 100 bước. Báo cáo loss. Thay bằng RMSNorm + SwiGLU + RoPE — loss có giảm không?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Block (Khối) | "Một tầng transformer" | Chồng norm + attention + norm + FFN, được bọc trong các kết nối residual. |
| Residual (Phần dư) | "Kết nối tắt" | Đầu ra `x + f(x)`; cho phép luồng gradient qua các chồng sâu. |
| Pre-norm | "Chuẩn hóa trước, không phải sau" | Hiện đại: `x + sublayer(LN(x))`. Huấn luyện sâu hơn không cần xoay xở warmup. |
| RMSNorm | "LayerNorm không trung bình" | Chia cho RMS; ít hơn một phép toán, cùng độ ổn định thực nghiệm. |
| SwiGLU | "FFN mọi người chuyển sang" | `Swish(W1 x) ⊙ W3 x → W2`. Thắng ReLU/GELU về ppl LM. |
| Cross-attention | "Cách decoder thấy encoder" | MHA với Q từ decoder, K/V từ các đầu ra encoder. |
| FFN expansion (Mở rộng FFN) | "MLP giữa rộng bao nhiêu" | Tỷ lệ kích thước ẩn trên d_model, thường 4 (LayerNorm) hoặc 2.6 (SwiGLU). |
| Bias-free (Không bias) | "Bỏ các số hạng +b" | Các ngăn xếp hiện đại bỏ bias trong các tầng tuyến tính; cải thiện ppl nhẹ, mô hình nhỏ hơn. |

## Further Reading

- [Vaswani et al. (2017). Attention Is All You Need](https://arxiv.org/abs/1706.03762) — đặc tả khối gốc.
- [Xiong et al. (2020). On Layer Normalization in the Transformer Architecture](https://arxiv.org/abs/2002.04745) — vì sao pre-norm thắng post-norm ở độ sâu lớn.
- [Zhang, Sennrich (2019). Root Mean Square Layer Normalization](https://arxiv.org/abs/1910.07467) — RMSNorm.
- [Shazeer (2020). GLU Variants Improve Transformer](https://arxiv.org/abs/2002.05202) — bài báo SwiGLU.
- [HuggingFace `modeling_llama.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/models/llama/modeling_llama.py) — khối chỉ decoder kinh điển năm 2026.
