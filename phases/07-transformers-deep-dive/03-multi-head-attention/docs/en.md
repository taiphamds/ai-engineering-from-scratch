# Multi-Head Attention

> Một head attention học một quan hệ mỗi lần. Tám head học tám quan hệ. Các head là miễn phí. Lấy nhiều hơn.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention from Scratch)
**Time:** ~75 minutes

## The Problem

Một head self-attention duy nhất tính một ma trận attention. Ma trận đó nắm bắt một loại quan hệ — thường là loại giảm thiểu loss trên bất kỳ tín hiệu huấn luyện nào. Nếu dữ liệu của bạn có hòa hợp chủ ngữ-động từ, đồng tham chiếu, diễn ngôn xa và chia cụm cú pháp đan vào nhau, một head duy nhất trộn chúng thành một phân phối soft-max duy nhất và mất nửa tín hiệu.

Cách sửa từ bài báo Vaswani năm 2017: chạy vài hàm attention song song, mỗi hàm có các phép chiếu Q, K, V riêng, rồi nối các đầu ra. Mỗi head hoạt động trong một không gian con nhỏ hơn có số chiều $d_{\text{model}} / n_{\text{heads}}$. Tổng tham số giữ nguyên. Sức biểu đạt tăng.

Multi-head attention là mặc định mọi transformer năm 2026 được phát hành cùng. Tranh luận duy nhất là về *bao nhiêu* head và liệu key và value có dùng chung các phép chiếu không (Grouped-Query Attention, Multi-Query Attention, Multi-head Latent Attention).

## The Concept

![Multi-head attention splits, attends, concatenates](../assets/multi-head-attention.svg)

**Chia.** Lấy `X` có hình dạng `(N, d_model)`. Chiếu thành Q, K, V mỗi ma trận có hình dạng `(N, d_model)`. Đổi hình dạng thành `(N, n_heads, d_head)` trong đó $d_{\text{head}} = d_{\text{model}} / n_{\text{heads}}$. Chuyển vị thành `(n_heads, N, d_head)`.

**Attention song song.** Chạy scaled dot-product attention bên trong mỗi head. Mỗi head tạo `(N, d_head)`. Các head hoạt động trên các không gian con khác nhau của embedding và không bao giờ trao đổi trong chính phép tính attention.

**Nối và chiếu.** Xếp các head trở lại `(N, d_model)` và nhân với một ma trận đầu ra được học `W_o` có hình dạng `(d_model, d_model)`. `W_o` là nơi các head được trộn.

**Vì sao nó hoạt động.** Mỗi head có thể chuyên biệt mà không cạnh tranh với các head khác về ngân sách biểu diễn. Các nghiên cứu thăm dò từ 2019–2024 cho thấy các vai trò head riêng biệt: head vị trí, head chú ý token trước, head sao chép, head thực thể có tên, head quy nạp (nền tảng của học trong ngữ cảnh).

**Dòng biến thể năm 2026:**

| Biến thể | Head Q | Head K/V | Được dùng bởi |
|---------|---------|-----------|---------|
| Multi-head (MHA) | N | N | GPT-2, BERT, T5 |
| Multi-query (MQA) | N | 1 | PaLM, Falcon |
| Grouped-query (GQA) | N | G (ví dụ N/8) | Llama 2 70B, Llama 3+, Qwen 2+, Mistral |
| Multi-head latent (MLA) | N | nén xuống hạng thấp | DeepSeek-V2, V3 |

GQA là mặc định hiện đại vì nó giảm bộ nhớ KV-cache theo hệ số $N/G$ trong khi giữ chất lượng gần đầy đủ. MLA đi xa hơn bằng cách nén K/V vào một không gian tiềm ẩn, rồi chiếu trở lại khi tính toán — tốn FLOP, tiết kiệm nhiều bộ nhớ hơn.

```figure
multihead-split
```

## Build It

### Step 1: split heads from the single-head attention we already have

Lấy `SelfAttention` từ Bài 02 và bọc bằng một cặp chia/nối. Xem `code/main.py` để có một triển khai numpy; logic là:

```python
def split_heads(X, n_heads):
    n, d = X.shape
    d_head = d // n_heads
    return X.reshape(n, n_heads, d_head).transpose(1, 0, 2)  # (heads, n, d_head)

def combine_heads(H):
    h, n, d_head = H.shape
    return H.transpose(1, 0, 2).reshape(n, h * d_head)
```

Một phép đổi hình dạng và một phép chuyển vị. Không vòng lặp. Đây chính xác là điều PyTorch làm bên dưới `nn.MultiheadAttention`.

### Step 2: run scaled-dot-product attention per head

Mỗi head nhận lát cắt Q, K, V riêng. Attention trở thành một phép nhân ma trận theo batch:

```python
def mha_forward(X, W_q, W_k, W_v, W_o, n_heads):
    Q = X @ W_q
    K = X @ W_k
    V = X @ W_v
    Qh = split_heads(Q, n_heads)         # (heads, n, d_head)
    Kh = split_heads(K, n_heads)
    Vh = split_heads(V, n_heads)
    scores = Qh @ Kh.transpose(0, 2, 1) / np.sqrt(Qh.shape[-1])
    weights = softmax(scores, axis=-1)
    out = weights @ Vh                    # (heads, n, d_head)
    concat = combine_heads(out)
    return concat @ W_o, weights
```

Trên phần cứng thực `Qh @ Kh.transpose(...)` là một `bmm`. GPU thấy một phép nhân ma trận theo batch duy nhất có hình dạng `(heads, N, d_head) × (heads, d_head, N) -> (heads, N, N)`. Thêm head là miễn phí.

### Step 3: Grouped-Query Attention variant

Chỉ các phép chiếu key và value thay đổi. Q có `n_heads` nhóm; K và V có `n_kv_heads < n_heads` nhóm và được lặp lại để khớp:

```python
def gqa_project(X, W, n_kv_heads, n_heads):
    kv = split_heads(X @ W, n_kv_heads)       # (kv_heads, n, d_head)
    repeat = n_heads // n_kv_heads
    return np.repeat(kv, repeat, axis=0)      # (n_heads, n, d_head)
```

Khi suy luận điều này tiết kiệm bộ nhớ vì chỉ `n_kv_heads` bản sao nằm trong KV cache, không phải `n_heads`. Llama 3 70B dùng 64 head query với 8 head KV — thu nhỏ cache 8×.

### Step 4: probe what each head learned

Chạy MHA trên một câu ngắn với 4 head. Với mỗi head, in ma trận attention `(N, N)`. Bạn sẽ thấy các head khác nhau chọn ra cấu trúc khác nhau ngay cả với khởi tạo ngẫu nhiên — đó một phần là tín hiệu, một phần là đối xứng xoay trong các không gian con.

## Use It

Trong PyTorch, phiên bản một dòng:

```python
import torch.nn as nn

mha = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
```

GQA từ PyTorch 2.5+:

```python
from torch.nn.functional import scaled_dot_product_attention

# scaled_dot_product_attention auto-dispatches Flash Attention on CUDA.
# For GQA, pass Q of shape (B, n_heads, N, d_head) and K,V of shape
# (B, n_kv_heads, N, d_head). PyTorch handles the repeat.
out = scaled_dot_product_attention(q, k, v, is_causal=True, enable_gqa=True)
```

**Bao nhiêu head?** Các quy tắc kinh nghiệm từ các mô hình production năm 2026:

| Kích thước mô hình | d_model | n_heads | d_head |
|------------|---------|---------|--------|
| Nhỏ (~125M) | 768 | 12 | 64 |
| Cơ sở (~350M) | 1024 | 16 | 64 |
| Lớn (~1B) | 2048 | 16 | 128 |
| Tiên phong (~70B) | 8192 | 64 | 128 |

`d_head` gần như luôn là 64 hoặc 128. Nó là đơn vị đo một head có thể "thấy" bao nhiêu. Xuống dưới 32 và các head bắt đầu chống lại hệ số chia tỷ lệ $\sqrt{d_{\text{head}}}$; lên trên 256 và bạn mất lợi ích "nhiều chuyên gia nhỏ".

## Ship It

Xem `outputs/skill-mha-configurator.md`. Skill khuyến nghị số head, số head kv và chiến lược chiếu cho một transformer mới với ngân sách tham số, độ dài chuỗi và đích triển khai.

## Exercises

1. **Dễ.** Lấy MHA từ `code/main.py` và đổi `n_heads` từ 1 đến 16 với `d_model=64` cố định. Vẽ loss của một mô hình một tầng tí hon trên một tác vụ sao chép tổng hợp. Nhiều head hơn có giúp, chững lại hay gây hại?
2. **Trung bình.** Triển khai MQA (một head KV dùng chung trên mọi head query). Đo số tham số giảm bao nhiêu so với MHA đầy đủ. Tính kích thước KV-cache thu nhỏ bao nhiêu khi suy luận với N=2048.
3. **Khó.** Triển khai một phiên bản nhỏ của Multi-head Latent Attention: nén K,V thành một biến tiềm ẩn hạng `r`, lưu biến tiềm ẩn trong KV cache, giải nén khi attention. Ở `r` nào bộ nhớ cache xuống dưới 1/8 MHA đầy đủ trong khi chất lượng giữ trong 1 bit ppl xác thực?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Head | "Một mạch attention duy nhất" | Một phép chiếu Q/K/V có số chiều $d_{\text{head}} = d_{\text{model}} / n_{\text{heads}}$ với ma trận attention riêng. |
| d_head | "Số chiều head" | Độ rộng ẩn theo head; gần như luôn 64 hoặc 128 trong production. |
| Split / combine (Chia / kết hợp) | "Các thủ thuật đổi hình dạng" | Đổi hình dạng+chuyển vị `(N, d_model) ↔ (n_heads, N, d_head)` quanh attention. |
| W_o | "Phép chiếu đầu ra" | Ma trận `(d_model, d_model)` áp dụng sau khi nối các head; nơi các head trộn. |
| MQA | "Một head KV" | Multi-Query Attention: một phép chiếu K/V dùng chung duy nhất. KV cache nhỏ nhất, mất một phần chất lượng. |
| GQA | "Mặc định từ Llama 2" | Grouped-Query Attention với `n_kv_heads < n_heads`; lặp lại để khớp Q. |
| MLA | "Thủ thuật của DeepSeek" | Multi-head Latent Attention: K,V được nén thành biến tiềm ẩn hạng thấp, giải nén khi attention. |
| Induction head (Head quy nạp) | "Mạch phía sau học trong ngữ cảnh" | Một cặp head phát hiện các lần xuất hiện trước và sao chép thứ theo sau chúng. |

## Further Reading

- [Vaswani et al. (2017). Attention Is All You Need §3.2.2](https://arxiv.org/abs/1706.03762) — đặc tả multi-head gốc.
- [Shazeer (2019). Fast Transformer Decoding: One Write-Head is All You Need](https://arxiv.org/abs/1911.02150) — bài báo MQA.
- [Ainslie et al. (2023). GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints](https://arxiv.org/abs/2305.13245) — cách chuyển MHA thành GQA sau huấn luyện.
- [DeepSeek-AI (2024). DeepSeek-V2 Technical Report](https://arxiv.org/abs/2405.04434) — MLA và vì sao nó thắng MHA/GQA về bộ nhớ cache.
- [Olsson et al. (2022). In-context Learning and Induction Heads](https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html) — cái nhìn cơ chế về điều các head thực sự làm.
