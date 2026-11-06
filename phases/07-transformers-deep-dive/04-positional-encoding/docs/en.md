# Positional Encoding — Sinusoidal, RoPE, ALiBi

> Attention bất biến hoán vị. "Con mèo ngồi trên tấm thảm" và "thảm tấm trên ngồi mèo con" tạo cùng đầu ra khi không có tín hiệu vị trí. Ba thuật toán sửa điều đó — mỗi thuật toán có một đặt cược khác nhau về "vị trí" nghĩa là gì.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head Attention)
**Time:** ~45 minutes

## The Problem

Scaled dot-product attention mù thứ tự. Ma trận attention `softmax(Q K^T / √d) V` được tính từ các độ tương đồng từng cặp. Xáo các hàng của `X`, nhận các hàng đầu ra bị xáo theo cùng cách. Không có gì bên trong attention quan tâm vị trí.

Đó không phải lỗi trong một mô hình bag-of-words. Với ngôn ngữ, mã, âm thanh, video — bất kỳ thứ gì mà thứ tự mang ý nghĩa — nó là chí mạng.

Cách sửa là đưa vị trí vào các embedding bằng cách nào đó. Ba thời kỳ câu trả lời:

1. **Hình sin tuyệt đối** (Vaswani 2017). Thêm `sin/cos` của vị trí vào embedding. Đơn giản, không tham số có thể học, ngoại suy kém vượt các độ dài được huấn luyện.
2. **RoPE — Rotary Position Embeddings** (Su 2021). Xoay các vector Q và K theo một góc tỷ lệ với vị trí. Mã hóa vị trí *tương đối* trực tiếp trong tích vô hướng. Chủ đạo năm 2026.
3. **ALiBi — Attention with Linear Biases** (Press 2022). Bỏ hoàn toàn embedding; thêm một phạt tuyến tính theo head vào các điểm attention dựa trên khoảng cách. Ngoại suy độ dài xuất sắc.

Tính đến năm 2026, về cơ bản mọi mô hình mở tiên phong dùng RoPE: Llama 2/3/4, Qwen 2/3, Mistral, Mixtral, DeepSeek-V3, Kimi. Một số ít mô hình ngữ cảnh dài dùng ALiBi hoặc các biến thể hiện đại của nó. Hình sin tuyệt đối thuộc lịch sử.

## The Concept

![Sinusoidal absolute vs RoPE rotations vs ALiBi distance bias](../assets/positional-encoding.svg)

### Absolute sinusoidal

Tính trước một ma trận cố định `PE` có hình dạng `(max_len, d_model)`:

```
PE[pos, 2i]   = sin(pos / 10000^(2i / d_model))
PE[pos, 2i+1] = cos(pos / 10000^(2i / d_model))
```

Rồi `X' = X + PE[:N]` trước attention. Mỗi chiều là một hình sin ở một tần số khác nhau. Mô hình học đọc vị trí từ mẫu pha. Thất bại vượt `max_len`: không có gì cho mô hình biết điều gì xảy ra ở vị trí 2048 khi nó chỉ thấy các vị trí 0–2047.

### RoPE

Xoay các vector Q và K (không phải embedding). Với một cặp chiều `(2i, 2i+1)`:

```
[q'_2i    ]   [ cos(pos·θ_i)  -sin(pos·θ_i) ] [q_2i   ]
[q'_2i+1  ] = [ sin(pos·θ_i)   cos(pos·θ_i) ] [q_2i+1 ]

θ_i = base^(-2i / d_head),  base = 10000 by default
```

Áp dụng cùng phép xoay cho key với vị trí `pos_k`. Tích vô hướng `q'_m · k'_n` trở thành một hàm chỉ của `(m - n)`. Nghĩa là: **điểm attention chỉ phụ thuộc khoảng cách tương đối**, dù phép xoay được xác định từ các vị trí tuyệt đối. Thủ thuật đẹp.

Mở rộng RoPE: `base` có thể được co giãn (NTK-aware, YaRN, LongRoPE) để ngoại suy đến các ngữ cảnh dài hơn không cần huấn luyện lại. Llama 3 mở rộng từ ngữ cảnh 8K lên 128K theo cách này.

### ALiBi

Bỏ thủ thuật embedding. Tạo bias trực tiếp cho các điểm attention:

```
attn_score[i, j] = (q_i · k_j) / √d  -  m_h · |i - j|
```

Trong đó `m_h` là một độ dốc riêng theo head (ví dụ `1 / 2^(8·h/H)`). Các token gần hơn được tăng; các token xa bị phạt. Không có chi phí khi huấn luyện. Bài báo cho thấy ngoại suy độ dài thắng hình sin và ngang RoPE trên độ dài được huấn luyện gốc.

### What to pick in 2026

| Biến thể | Ngoại suy | Chi phí huấn luyện | Được dùng bởi |
|---------|---------------|---------------|---------|
| Hình sin tuyệt đối | kém | miễn phí | transformer gốc, BERT ban đầu |
| Tuyệt đối được học | không | rất nhỏ | GPT-2, GPT-3 |
| RoPE | tốt với co giãn | miễn phí | Llama 2/3/4, Qwen 2/3, Mistral, DeepSeek-V3, Kimi |
| RoPE + YaRN | xuất sắc | giai đoạn fine-tune | Qwen2-1M, Llama 3.1 128K |
| ALiBi | xuất sắc | miễn phí | BLOOM, MPT, Baichuan |

RoPE thắng vì nó lắp vào attention mà không thay đổi kiến trúc, mã hóa vị trí tương đối và siêu tham số `base` cho một nút điều chỉnh gọn để fine-tuning ngữ cảnh dài.

```figure
rope-explorer
```

## Build It

### Step 1: sinusoidal encoding

Xem `code/main.py`. Một phép tính 4 dòng:

```python
def sinusoidal(N, d):
    pe = [[0.0] * d for _ in range(N)]
    for pos in range(N):
        for i in range(d // 2):
            theta = pos / (10000 ** (2 * i / d))
            pe[pos][2 * i]     = math.sin(theta)
            pe[pos][2 * i + 1] = math.cos(theta)
    return pe
```

Thêm thứ này vào ma trận embedding trước tầng attention đầu tiên.

### Step 2: RoPE applied to Q, K

RoPE thao tác tại chỗ trên Q và K. Với mỗi cặp chiều:

```python
def apply_rope(x, pos, base=10000):
    d = len(x)
    out = list(x)
    for i in range(d // 2):
        theta = pos / (base ** (2 * i / d))
        c, s = math.cos(theta), math.sin(theta)
        a, b = x[2 * i], x[2 * i + 1]
        out[2 * i]     = a * c - b * s
        out[2 * i + 1] = a * s + b * c
    return out
```

Quan trọng: áp dụng cùng hàm cho Q ở vị trí `m` và K ở vị trí `n`. Tích vô hướng của chúng nhận một hệ số `cos((m-n)·θ_i)` trên mỗi cặp tọa độ. Attention học vị trí tương đối miễn phí.

### Step 3: ALiBi slopes and bias

```python
def alibi_bias(n_heads, seq_len):
    # slope_h = 2 ** (-8 * h / n_heads) for h = 1..n_heads
    slopes = [2 ** (-8 * (h + 1) / n_heads) for h in range(n_heads)]
    bias = []
    for m in slopes:
        row = [[-m * abs(i - j) for j in range(seq_len)] for i in range(seq_len)]
        bias.append(row)
    return bias  # add to attention scores before softmax
```

Thêm `bias[h]` vào ma trận điểm attention `(seq_len, seq_len)` của head `h`, rồi softmax.

### Step 4: verify relative-distance property of RoPE

Chọn hai vector ngẫu nhiên `a, b`. Xoay theo `(pos_a, pos_b)`. Rồi theo `(pos_a + k, pos_b + k)`. Cả hai tích vô hướng phải khớp trong sai số dấu phẩy động. Thuộc tính đó là toàn bộ điểm chính của RoPE — nó bất biến với độ lệch tuyệt đối, chỉ khoảng cách tương đối quan trọng.

## Use It

PyTorch 2.5+ cung cấp các tiện ích RoPE trong `torch.nn.functional`. Hầu hết mã production dùng `flash_attn` hoặc `xformers` nơi RoPE được áp dụng bên trong kernel attention.

```python
from transformers import AutoModel
model = AutoModel.from_pretrained("meta-llama/Llama-3.2-3B")
# model.config.rope_scaling → {"type": "yarn", "factor": 32.0, "original_max_position_embeddings": 8192}
```

**Các thủ thuật ngữ cảnh dài năm 2026:**

- **Nội suy nhận biết NTK.** Co giãn `base` thành `base * (scale_factor)^(d/(d-2))` khi mở rộng từ 4K lên 16K+.
- **YaRN.** Nội suy thông minh hơn giữ entropy attention trên các ngữ cảnh dài. Llama 3.1 128K dùng nó.
- **LongRoPE.** Phương pháp năm 2024 của Microsoft dùng tìm kiếm tiến hóa để chọn các hệ số co giãn theo chiều. Phi-3-Long dùng nó.
- **Nội suy vị trí + fine-tuning.** Chỉ cần thu nhỏ các vị trí theo hệ số mở rộng và fine-tune trong 1–5B token. Hiệu quả đến ngạc nhiên.

## Ship It

Xem `outputs/skill-positional-encoding-picker.md`. Skill chọn một chiến lược mã hóa cho một mô hình mới với độ dài ngữ cảnh đích, nhu cầu ngoại suy và ngân sách huấn luyện.

## Exercises

1. **Dễ.** Vẽ ma trận hình sin `PE` thành một bản đồ nhiệt với `max_len=512, d=128`. Xác nhận mẫu "các sọc rộng hơn khi chỉ số chiều tăng".
2. **Trung bình.** Triển khai co giãn RoPE nhận biết NTK. Huấn luyện một LM tí hon trên các chuỗi độ dài 256, rồi kiểm thử trên độ dài 1024 có và không co giãn. Đo perplexity.
3. **Khó.** Triển khai ALiBi và RoPE trong cùng mô-đun attention. Huấn luyện một transformer 4 tầng trên một tác vụ sao chép với các chuỗi độ dài 512. Ngoại suy đến 2048 khi kiểm thử. So sánh suy giảm.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Positional encoding (Mã hóa vị trí) | "Cho attention biết thứ tự" | Bất kỳ tín hiệu nào được thêm vào embedding hoặc attention mã hóa vị trí. |
| Sinusoidal (Hình sin) | "Loại gốc" | `sin/cos` ở các tần số hình học được thêm vào embedding; không ngoại suy. |
| RoPE | "Embedding xoay" | Xoay Q, K theo góc phụ thuộc vị trí; tích vô hướng mã hóa khoảng cách tương đối. |
| ALiBi | "Thủ thuật bias tuyến tính" | Thêm `-m·\|i-j\|` vào các điểm attention; không cần embedding, ngoại suy tuyệt vời. |
| base | "Nút điều chỉnh của RoPE" | Hệ số co giãn tần số trong RoPE; tăng để mở rộng ngữ cảnh khi suy luận. |
| NTK-aware | "Một thủ thuật co giãn RoPE" | Co giãn `base` để các chiều tần số cao không bị ép khi ngữ cảnh mở rộng. |
| YaRN | "Loại cầu kỳ" | Nội suy+ngoại suy theo chiều giữ entropy attention. |
| Extrapolation (Ngoại suy) | "Hoạt động vượt độ dài huấn luyện" | Hệ vị trí có thể phục vụ đầu ra đúng vượt `max_len` đã thấy khi huấn luyện không? |

## Further Reading

- [Vaswani et al. (2017). Attention Is All You Need §3.5](https://arxiv.org/abs/1706.03762) — hình sin gốc.
- [Su et al. (2021). RoFormer: Enhanced Transformer with Rotary Position Embedding](https://arxiv.org/abs/2104.09864) — bài báo RoPE.
- [Press, Smith, Lewis (2021). Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation](https://arxiv.org/abs/2108.12409) — ALiBi.
- [Peng et al. (2023). YaRN: Efficient Context Window Extension of Large Language Models](https://arxiv.org/abs/2309.00071) — co giãn RoPE tiên tiến nhất.
- [Chen et al. (2023). Extending Context Window of Large Language Models via Positional Interpolation](https://arxiv.org/abs/2306.15595) — bài báo ngữ cảnh dài Llama 2 của Meta.
- [Ding et al. (2024). LongRoPE: Extending LLM Context Window Beyond 2 Million Tokens](https://arxiv.org/abs/2402.13753) — phương pháp Microsoft được Phi-3-Long dùng và được trích dẫn trong phần Use It.
- [HuggingFace Transformers — `modeling_rope_utils.py`](https://github.com/huggingface/transformers/blob/main/src/transformers/modeling_rope_utils.py) — các triển khai cấp production của mọi hệ co giãn RoPE (mặc định, tuyến tính, động, YaRN, LongRoPE, Llama-3).
