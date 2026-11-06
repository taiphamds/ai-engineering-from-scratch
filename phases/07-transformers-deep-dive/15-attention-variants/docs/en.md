# Attention Variants — Sliding Window, Sparse, Differential

> Full attention là một vòng tròn. Mọi token nhìn thấy mọi token, và bộ nhớ trả giá. Ba biến thể uốn hình dạng của vòng tròn và lấy lại một nửa chi phí.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 03 (Multi-Head), Phase 7 · 12 (KV Cache / Flash Attention)
**Time:** ~60 minutes

## The Problem

Attention đầy đủ tốn bộ nhớ $O(N^2)$ và tính toán $O(N^2)$ theo độ dài chuỗi. Với một Llama 3 70B ngữ cảnh 128K đó là 16 tỷ phần tử attention mỗi tầng, nhân 80 tầng. Flash Attention (Bài 12) che bộ nhớ kích hoạt $O(N^2)$ nhưng không thay đổi chi phí số học — mọi token vẫn chú ý đến mọi token khác.

Ba lớp biến thể thay đổi chính cấu trúc liên kết của ma trận attention:

1. **Attention cửa sổ trượt (SWA).** Mỗi token chú ý đến một cửa sổ lân cận cố định, không phải toàn tiền tố. Bộ nhớ và tính toán giảm xuống $O(N \cdot W)$ trong đó $W$ là cửa sổ. Gemma 2/3, các tầng đầu của Mistral 7B, Phi-3-Long.
2. **Attention thưa / khối.** Chỉ các cặp `(i, j)` được chọn được chấm điểm; phần còn lại bị ép trọng số bằng không. Longformer, BigBird, sparse transformer của OpenAI.
3. **Attention vi sai.** Tính hai bản đồ attention với các phép chiếu Q/K riêng, trừ bản đồ này khỏi bản đồ kia. Loại "attention sink" làm trọng số chảy vào vài token đầu. DIFF Transformer của Microsoft (2024).

Chúng cùng tồn tại. Một mô hình tiên phong năm 2026 thường trộn chúng: hầu hết các tầng là SWA-1024, mỗi tầng thứ năm là attention đầy đủ toàn cục, và một số ít là các head vi sai làm sạch truy xuất. Tỷ lệ SWA-trên-toàn-cục 5:1 của Gemma 3 là mặc định giáo trình hiện tại.

## The Concept

### Sliding Window Attention (SWA)

Mỗi query tại vị trí $i$ chỉ chú ý đến các vị trí trong $[i - W, i]$ (SWA nhân quả) hoặc $[i - W/2, i + W/2]$ (hai chiều). Các token bên ngoài cửa sổ nhận $-\infty$ trong ma trận điểm.

```
full causal:           sliding window (W=4):
positions 0-7          positions 0-7, W=4
    0 1 2 3 4 5 6 7        0 1 2 3 4 5 6 7
0 | x                0 |  x
1 | x x              1 |  x x
2 | x x x            2 |  x x x
3 | x x x x          3 |  x x x x
4 | x x x x x        4 |    x x x x
5 | x x x x x x      5 |      x x x x
6 | x x x x x x x    6 |        x x x x
7 | x x x x x x x x  7 |          x x x x
```

Với $N = 8192$ và $W = 1024$, ma trận điểm có 1024 × 8192 hàng khác không theo kỳ vọng — giảm 8×.

**KV cache thu nhỏ với SWA.** Chỉ cần giữ $W$ token K và V cuối mỗi tầng. Với một cấu hình kiểu Gemma-3 (cửa sổ 1024, ngữ cảnh 128K), KV cache giảm 128×.

**Chi phí chất lượng.** Các transformer chỉ SWA chật vật với truy xuất xa. Cách sửa: xen kẽ các tầng SWA với các tầng attention đầy đủ. Gemma 3 dùng SWA:toàn cục 5:1. Mistral 7B dùng một chồng SWA nhân quả nơi thông tin "chảy về phía trước" qua các cửa sổ chồng lấn — mỗi tầng mở rộng trường tiếp nhận hiệu dụng thêm $W$, và sau `L` tầng mô hình có thể chú ý lùi `L × W` token.

### Sparse / Block Attention

Chọn trước một mẫu thưa `N × N`. Ba hình dạng kinh điển:

- **Cục bộ + có bước nhảy (sparse transformer của OpenAI).** Chú ý đến $W$ token cuối cộng mỗi token thứ `stride` trước đó. Nắm bắt cả cục bộ và xa ở tính toán $O(N \cdot \sqrt{N})$.
- **Longformer / BigBird.** Cửa sổ cục bộ + một tập nhỏ các token toàn cục (ví dụ `[CLS]`) chú ý đến mọi token và được mọi token chú ý + các liên kết thưa ngẫu nhiên. Thực nghiệm đạt ngữ cảnh 2× ở chất lượng tương ứng.
- **Native Sparse Attention (DeepSeek, 2025).** Học những khối `(Q, K)` nào quan trọng; bỏ các khối không ở cấp kernel. Tương thích FlashAttention.

Attention thưa là một câu chuyện kỹ thuật kernel. Phần toán đơn giản (che ma trận điểm); lợi ích đến từ không bao giờ tải các phần tử không vào SRAM. FlashAttention-3 và API FlexAttention năm 2026 biến các mẫu thưa tùy chỉnh thành thành phần chính thức trong PyTorch.

### Differential Attention (DIFF Transformer, 2024)

Attention thường có một vấn đề "attention sink": softmax buộc mọi hàng có tổng bằng 1, nên các token không muốn chú ý đến bất kỳ thứ gì cụ thể đổ trọng số lên token đầu (hoặc vài token đầu). Điều này lấy mất năng lực đáng lẽ dành cho nội dung thực.

Attention vi sai sửa điều này bằng cách tính **hai** bản đồ attention và trừ:

```math
\begin{aligned}
A_1 &= \mathop{\mathrm{softmax}}(Q_1 K_1^T / \sqrt{d}) \\
A_2 &= \mathop{\mathrm{softmax}}(Q_2 K_2^T / \sqrt{d}) \\
\text{DiffAttn} &= (A_1 - \lambda \cdot A_2) V
\end{aligned}
```

trong đó $\lambda$ là một vô hướng được học (thường 0.5–0.8). A1 nắm bắt các trọng số nội dung thực; A2 nắm bắt sink. Phép trừ triệt tiêu sink, phân bổ lại trọng số cho các token liên quan.

Các kết quả báo cáo (Microsoft 2024): perplexity thấp hơn 5–10%, ngữ cảnh hiệu dụng dài hơn 1.5–2× ở cùng độ dài huấn luyện, truy xuất kim-trong-đống-cỏ sắc hơn.

### Variant Comparison

| Biến thể | Tính toán | KV cache | Chất lượng so với đầy đủ | Sử dụng production |
|---------|---------|----------|-----------------|----------------|
| Attention đầy đủ | $O(N^2)$ | $O(N)$ mỗi tầng | baseline | tầng mặc định của mọi mô hình |
| SWA (cửa sổ 1024) | $O(N \cdot W)$ | $O(W)$ mỗi tầng | -0.1 ppl, tốt với các tầng toàn cục | Gemma 2/3, Phi-3-Long |
| Thưa cục bộ + có bước nhảy | $O(N \cdot \sqrt{N})$ | hỗn hợp | tương tự SWA | sparse transformer của OpenAI, Longformer |
| BigBird (cục bộ + toàn cục + ngẫu nhiên) | $O(N)$ xấp xỉ | hỗn hợp | ngang đầy đủ tại ngữ cảnh 2× | BERT ngữ cảnh dài ban đầu |
| Native Sparse (DeepSeek-V3.2) | $O(N \cdot \text{active fraction})$ | $O(N)$ | trong 0.05 ppl | DeepSeek-V3.2, 2025 |
| Vi sai | $O(2 \cdot N^2)$ | $O(2N)$ | -5 đến -10% ppl | DIFF Transformer, các mô hình đầu năm 2026 |

```figure
gqa-kv-sharing
```

## Build It

Xem `code/main.py`. Chúng ta triển khai một bộ so sánh mặt nạ nhân quả hiển thị attention đầy đủ, SWA, cục bộ+có bước nhảy và vi sai cạnh nhau trên một chuỗi đồ chơi.

### Step 1: full causal mask (baseline)

```python
def causal_mask(n):
    return [[0.0 if j <= i else float("-inf") for j in range(n)] for i in range(n)]
```

Baseline từ Bài 07. Tam giác dưới; trọng số bằng không phía trên đường chéo.

### Step 2: sliding window causal mask

```python
def swa_mask(n, window):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
    return M
```

Một tham số — `window`. Với `window >= n`, bạn khôi phục attention nhân quả đầy đủ. Với `window = 1`, mỗi token chỉ chú ý chính nó.

### Step 3: local + strided sparse mask

```python
def strided_mask(n, window, stride):
    M = [[float("-inf")] * n for _ in range(n)]
    for i in range(n):
        lo = max(0, i - window + 1)
        for j in range(lo, i + 1):
            M[i][j] = 0.0
        for j in range(0, i + 1, stride):
            M[i][j] = 0.0
    return M
```

Cửa sổ cục bộ đặc cộng mỗi token thứ `stride` lùi đến đầu chuỗi. Trường tiếp nhận tăng theo các bước log với các tầng bổ sung.

### Step 4: differential attention

```python
def diff_attention(Q1, K1, Q2, K2, V, lam):
    A1 = softmax_causal(Q1 @ K1.T / sqrt_d)
    A2 = softmax_causal(Q2 @ K2.T / sqrt_d)
    return (A1 - lam * A2) @ V
```

Hai lượt attention, trừ với một hệ số trộn được học. Trong mã chúng ta so sánh bản đồ nhiệt attention-sink của đơn so với vi sai và quan sát sink sụp đổ.

### Step 5: KV cache sizes

In kích thước cache mỗi tầng tại $N = 131072$ cho mỗi biến thể. SWA và các biến thể thưa giảm 10–100×. Vi sai tăng gấp đôi. Trả hóa đơn bộ nhớ một cách có ý thức.

## Use It

Các mẫu production năm 2026:

```python
from transformers import AutoModelForCausalLM
# Gemma 3 mixes SWA (window=1024) and global layers at 5:1.
model = AutoModelForCausalLM.from_pretrained("google/gemma-3-27b-it")
# print(model.config.sliding_window, model.config.layer_types)
```

FlexAttention trong PyTorch 2.5+ nhận một hàm mặt nạ:

```python
from torch.nn.attention.flex_attention import flex_attention, create_block_mask

def swa_pattern(b, h, q_idx, kv_idx):
    return (q_idx - kv_idx < 1024) & (q_idx >= kv_idx)

mask = create_block_mask(swa_pattern, B=batch, H=heads, Q_LEN=n, KV_LEN=n)
out = flex_attention(q, k, v, block_mask=mask)
```

Điều này biên dịch thành một kernel Triton tùy chỉnh. Trong 10% tốc độ FlashAttention-3 cho các mẫu phổ biến, và hàm mặt nạ là một callable Python.

**Khi nào chọn từng loại:**

- **Attention đầy đủ thuần** — mọi tầng đến ngữ cảnh ~16K, hoặc khi chất lượng truy xuất tối quan trọng.
- **Hỗn hợp SWA + toàn cục** — ngữ cảnh dài (>32K), huấn luyện và suy luận bị giới hạn bộ nhớ. Mặc định năm 2026 trên 32K.
- **Attention khối thưa** — kernel tùy chỉnh, mẫu tùy chỉnh. Dành cho các khối lượng công việc chuyên biệt (truy xuất, âm thanh).
- **Attention vi sai** — bất kỳ khối lượng công việc nào mà ô nhiễm attention-sink gây hại (RAG ngữ cảnh dài, kim-trong-đống-cỏ).

## Ship It

Xem `outputs/skill-attention-variant-picker.md`. Skill chọn một cấu trúc liên kết attention cho một mô hình mới với độ dài ngữ cảnh đích, các nhu cầu truy xuất và hồ sơ tính toán huấn luyện/suy luận.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Xác minh SWA tại `window=4` đặt không mọi thứ ngoài 4 token cuối mỗi hàng. Xác minh `window=n` tái hiện attention nhân quả đầy đủ giống từng bit.
2. **Trung bình.** Triển khai SWA nhân quả với `window=1024` trên capstone Bài 07. Huấn luyện 1,000 bước trên tinyshakespeare. Val loss suy giảm bao nhiêu so với attention đầy đủ? Bộ nhớ đỉnh giảm bao nhiêu?
3. **Khó.** Triển khai một hỗn hợp tầng 5:1 kiểu Gemma-3 (5 SWA, 1 toàn cục) trong mô hình capstone. So sánh loss, bộ nhớ và chất lượng sinh với các baseline chỉ SWA và chỉ toàn cục ở số tham số tương ứng.
4. **Khó.** Triển khai attention vi sai với một $\lambda$ được học mỗi head. Huấn luyện trên một tác vụ truy xuất tổng hợp (một kim, 2,000 yếu tố gây nhiễu). Đo accuracy truy xuất so với một baseline attention đơn ở số tham số tương ứng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Sliding window attention (SWA) (Attention cửa sổ trượt) | "Attention cục bộ" | Mỗi query chú ý đến $W$ token cuối; KV cache thu nhỏ về $O(W)$. |
| Effective receptive field (Trường tiếp nhận hiệu dụng) | "Mô hình thấy lùi bao xa" | Trong một chồng SWA $L$ tầng với cửa sổ $W$, đến $L \times W$ token. |
| Longformer / BigBird | "Cục bộ + toàn cục + ngẫu nhiên" | Các mẫu thưa với một vài token toàn cục luôn chú ý; cách tiếp cận ngữ cảnh dài ban đầu. |
| Native Sparse Attention | "Thủ thuật kernel của DeepSeek" | Học tính thưa cấp khối; bỏ các khối không ở cấp kernel trong khi giữ chất lượng. |
| Differential attention (Attention vi sai) | "Hai bản đồ, một bản trừ" | DIFF Transformer: trừ một bản đồ attention thứ hai nhân với $\lambda$ được học khỏi bản đầu để triệt tiêu các attention sink. |
| Attention sink | "Trọng số chảy sang token 0" | Chuẩn hóa softmax buộc các hàng có tổng bằng 1; các query không thông tin đổ trọng số lên vị trí 0. |
| FlexAttention | "Mặt nạ dưới dạng Python" | API PyTorch 2.5+ biên dịch các hàm mặt nạ tùy ý thành các kernel dạng FlashAttention. |
| Layer type mix (Hỗn hợp loại tầng) | "SWA-trên-toàn-cục 5:1" | Xen kẽ các tầng attention thưa và đầy đủ trong một chồng để giữ chất lượng với bộ nhớ thấp hơn. |

## Further Reading

- [Beltagy, Peters, Cohan (2020). Longformer: The Long-Document Transformer](https://arxiv.org/abs/2004.05150) — bài báo cửa sổ trượt + token toàn cục kinh điển.
- [Zaheer et al. (2020). Big Bird: Transformers for Longer Sequences](https://arxiv.org/abs/2007.14062) — cục bộ + toàn cục + ngẫu nhiên.
- [Child et al. (2019). Generating Long Sequences with Sparse Transformers](https://arxiv.org/abs/1904.10509) — mẫu cục bộ+có bước nhảy của OpenAI.
- [Gemma Team (2024). Gemma 2: Improving Open Language Models at a Practical Size](https://arxiv.org/abs/2408.00118) — hỗn hợp SWA:toàn cục 1:1.
- [Gemma Team (2025). Gemma 3 technical report](https://arxiv.org/abs/2503.19786) — hỗn hợp 5:1 với window=1024 hiện là mặc định giáo trình.
- [Ye et al. (2024). Differential Transformer](https://arxiv.org/abs/2410.05258) — bài báo DIFF Transformer.
- [Yuan et al. (2025). Native Sparse Attention](https://arxiv.org/abs/2502.11089) — attention tính thưa được học của DeepSeek-V3.2.
- [PyTorch — FlexAttention blog and docs](https://pytorch.org/blog/flexattention/) — tham chiếu API cho mẫu mặt nạ dưới dạng callable trong Use It.
