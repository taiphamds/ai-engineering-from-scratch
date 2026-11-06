# KV Cache, Flash Attention & Inference Optimization

> Huấn luyện song song và bị giới hạn bởi FLOP. Suy luận nối tiếp và bị giới hạn bởi bộ nhớ. Nút thắt khác, các thủ thuật khác.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 02 (Self-Attention), Phase 7 · 05 (Full Transformer), Phase 7 · 07 (GPT)
**Time:** ~75 minutes

## The Problem

Một decoder tự hồi quy ngây thơ làm công việc `O(N²)` để sinh `N` token: ở mỗi bước nó tính lại attention trên toàn tiền tố. Với một phản hồi 4K token đó là 16M phép toán attention, hầu hết dư thừa. Mọi trạng thái ẩn của một token tiền tố đều tất định một khi được tính — bạn chỉ cần chạy query của token mới với các key và value đã lưu đệm của mọi thứ trước đó.

Trên hết, bản thân attention di chuyển rất nhiều dữ liệu. Attention tiêu chuẩn hiện thực hóa một ma trận điểm N×N, đầu ra softmax N×d, đầu ra cuối N×d — quá nhiều đọc và ghi vào HBM. Với N≥2K, attention bị giới hạn bởi bộ nhớ trước khi bị giới hạn bởi FLOP. Các kernel attention cổ điển dùng không hết GPU hiện đại 4–10×.

Hai tối ưu hóa, cả hai từ Dao và cộng sự, đẩy suy luận tiên phong từ "chậm" sang "nhanh":

1. **KV cache.** Lưu các vector K và V của mọi token tiền tố. Attention của mỗi token mới là một query với các key đã lưu đệm. Suy luận giảm từ `O(N²)` xuống `O(N)` mỗi bước sinh.
2. **Flash Attention.** Chia ô phép tính attention để toàn ma trận N×N không bao giờ chạm HBM. Toàn bộ softmax + nhân ma trận xảy ra trong SRAM. Tăng tốc thời gian thực 2–4× trên A100; 5–10× trên H100 với FP8.

Đến năm 2026 cả hai phổ dụng. Mọi ngăn xếp suy luận production (vLLM, TensorRT-LLM, SGLang, llama.cpp) giả định chúng. Mọi mô hình tiên phong được phát hành với Flash Attention bật.

## The Concept

![KV cache growth and Flash Attention tiling](../assets/kv-cache-flash-attn.svg)

### KV cache math

Theo tầng decoder, theo token, theo head:

```
bytes_per_token_per_layer = 2 * d_head * dtype_size
                          ^
                          K and V
```

Với một mô hình 7B có 32 tầng, 32 head, d_head=128, fp16:

```
per token per layer = 2 * 128 * 2 = 512 bytes
per token (32 layers) = 16 KB
per 32K context = 512 MB
```

Với Llama 3 70B (80 tầng, d_head=128, GQA với 8 head KV):

```
per token per layer = 2 * 8 * 128 * 2 = 4096 bytes (4 KB)
per 32K context = 10.4 GB
```

10 GB đó là lý do Llama 3 70B ở ngữ cảnh 128K cần phần lớn một A100 40 GB chỉ cho KV cache ở kích thước batch 1.

**GQA là lợi ích KV-cache.** MHA với 64 head sẽ là 32 GB. MLA còn nén xa hơn.

Kéo các chiều và quan sát kích thước cache thay đổi. Đẩy độ dài chuỗi hoặc batch lên và thấy nó vượt một GPU nhanh đến đâu:

```figure
kv-cache-sizer
```

### Flash Attention — the tiling trick

Attention tiêu chuẩn:

```
S = Q @ K^T          (HBM read, N×N, HBM write)
P = softmax(S)       (HBM read, HBM write)
O = P @ V            (HBM read, HBM write)
```

Ba vòng đi-về HBM. Trên H100, băng thông HBM là 3 TB/s; SRAM là 30 TB/s. Mỗi chuyến HBM là một lần chậm đi hệ số 10 so với giữ mọi thứ trên chip.

Flash Attention:

```
for each block of Q (tile size ~128 × 128):
    load Q_tile into SRAM
    for each block of K, V:
        load K_tile, V_tile into SRAM
        compute S_tile = Q_tile @ K_tile^T     (SRAM)
        running softmax aggregation             (SRAM)
        accumulate into O_tile                  (SRAM)
    write O_tile to HBM
```

Một chuyến HBM mỗi ô. Tổng lượng bộ nhớ giảm từ `O(N²)` xuống `O(N)`. Lượt truyền ngược tính lại một số giá trị từ lượt truyền xuôi thay vì lưu chúng — thêm một lợi ích bộ nhớ.

**Thủ thuật số.** Softmax cuốn chiếu duy trì `(max, sum)` qua các ô để chuẩn hóa cuối chính xác. Không phải xấp xỉ — Flash Attention tính đầu ra giống từng bit với attention tiêu chuẩn (ngoại trừ tính không kết hợp của fp16).

**Tiến hóa phiên bản:**

| Phiên bản | Năm | Thay đổi then chốt | Tăng tốc trên phần cứng tham chiếu |
|---------|------|-----------|-------------------------------|
| Flash 1 | 2022 | Kernel SRAM chia ô | 2× trên A100 |
| Flash 2 | 2023 | Tính song song tốt hơn, thứ tự ưu tiên nhân quả | 3× trên A100 |
| Flash 3 | 2024 | Bất đồng bộ Hopper, FP8 | 1.5–2× trên H100 (~740 TFLOPs FP16) |
| Flash 4 | 2026 | Pipeline Blackwell 5 giai đoạn, exp2 phần mềm | Ưu tiên suy luận (ban đầu chỉ truyền xuôi) |

Flash 4 chỉ có lượt truyền xuôi khi ra mắt. Huấn luyện vẫn dùng Flash 3. Hỗ trợ GQA và varlen cho Flash 4 đang chờ (giữa năm 2026).

### Speculative decoding — the other latency win

Mô hình rẻ đề xuất N token. Mô hình lớn xác minh cả N song song. Nếu xác minh chấp nhận k token, bạn trả 1 lượt truyền xuôi mô hình lớn cho k lần sinh. Điển hình k=3–5 trên mã và văn xuôi.

Các mặc định năm 2026:
- **EAGLE 2 / Medusa.** Các head nháp tích hợp dùng chung các trạng thái ẩn của bộ xác minh. Tăng tốc 2–3× không mất chất lượng.
- **Giải mã suy đoán với mô hình nháp.** Tăng tốc 2–4× trên phần cứng tiêu dùng.
- **Lookahead decoding.** Lặp Jacobi; không cần mô hình nháp. Ngách nhưng miễn phí.

### Continuous batching

Suy luận theo batch cổ điển: chờ chuỗi chậm nhất hoàn tất, rồi bắt đầu một batch mới. Lãng phí GPU khi các phản hồi ngắn kết thúc sớm.

Batching liên tục (được phát hành đầu tiên trong Orca, giờ trong vLLM, TensorRT-LLM, SGLang): thay các yêu cầu mới vào batch ngay khi các yêu cầu cũ kết thúc. Tăng thông lượng 5–10× cho các khối lượng công việc trò chuyện điển hình.

### PagedAttention — KV cache as virtual memory

Tính năng chủ lực của vLLM. KV cache được cấp phát thành các khối 16 token; một bảng trang ánh xạ các vị trí logic sang các khối vật lý. Cho phép bạn dùng chung KV giữa các mẫu song song (beam search, lấy mẫu song song), hoán đổi nóng các tiền tố để lưu đệm prompt và chống phân mảnh bộ nhớ. Cải thiện thông lượng 4× so với cấp phát liên tục ngây thơ.

```figure
flash-attention-memory
```

## Build It

Xem `code/main.py`. Chúng ta triển khai:

1. Một decoder tăng dần `O(N²)` ngây thơ.
2. Một decoder `O(N)` có KV cache.
3. Một softmax chia ô mô phỏng thuật toán cực đại cuốn chiếu của Flash Attention.

### Step 1: KV cache

```python
class KVCache:
    def __init__(self, n_layers, n_heads, d_head):
        self.K = [[[] for _ in range(n_heads)] for _ in range(n_layers)]
        self.V = [[[] for _ in range(n_heads)] for _ in range(n_layers)]

    def append(self, layer, head, k, v):
        self.K[layer][head].append(k)
        self.V[layer][head].append(v)

    def read(self, layer, head):
        return self.K[layer][head], self.V[layer][head]
```

Đơn giản: liên tục mở rộng các vector K, V theo token trong các danh sách theo tầng, theo head.

### Step 2: tiled softmax

```python
def tiled_softmax_dot(q, K, V, tile=4):
    """Flash-attention-style softmax(qK^T)V with running max/sum."""
    m = float("-inf")
    s = 0.0
    out = [0.0] * len(V[0])
    for start in range(0, len(K), tile):
        k_block = K[start:start + tile]
        v_block = V[start:start + tile]
        scores = [sum(qi * ki for qi, ki in zip(q, k)) for k in k_block]
        new_m = max(m, *scores)
        exp_old = math.exp(m - new_m) if m != float("-inf") else 0.0
        exp_new = [math.exp(sc - new_m) for sc in scores]
        s = s * exp_old + sum(exp_new)
        for j in range(len(out)):
            out[j] = out[j] * exp_old + sum(e * v[j] for e, v in zip(exp_new, v_block))
        m = new_m
    return [o / s for o in out]
```

Đầu ra giống từng bit với `softmax(qK) V` trong một lần, nhưng tại bất kỳ thời điểm nào tập làm việc là một khối `tile × d_head`, không phải toàn bộ `N × d_head`.

### Step 3: compare naive vs cached decoding on 100-token generation

Đếm các phép toán attention. Ngây thơ: `O(N²)` = 5050. Có cache: `O(N)` = 100. Mã in cả hai.

## Use It

```python
# HuggingFace transformers auto-enables KV cache on decoder-only generate().
from transformers import AutoModelForCausalLM
model = AutoModelForCausalLM.from_pretrained(
    "meta-llama/Llama-3.2-3B",
    attn_implementation="flash_attention_2",  # use FA3 if Hopper
    torch_dtype="bfloat16",
)
# generate() uses KV cache automatically
```

vLLM production:

```bash
pip install vllm
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --tensor-parallel-size 4 \
    --max-model-len 32768 \
    --enable-prefix-caching \
    --kv-cache-dtype fp8
```

Lưu đệm tiền tố giữa các yêu cầu là một lợi ích lớn năm 2026 — cùng system prompt, các ví dụ few-shot hoặc tài liệu ngữ cảnh dài tái sử dụng KV qua các lời gọi. Với các khối lượng công việc tác tử có prompt công cụ lặp lại, lưu đệm tiền tố thường tăng thông lượng 5×.

## Ship It

Xem `outputs/skill-inference-optimizer.md`. Skill chọn triển khai attention, chiến lược KV cache, lượng tử hóa và giải mã suy đoán cho một triển khai suy luận mới.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Xác nhận các decoder ngây thơ và có cache tạo cùng đầu ra; ghi nhận khác biệt số phép toán.
2. **Trung bình.** Triển khai lưu đệm tiền tố: cho một prompt P và vài lượt hoàn thành, chạy một lượt truyền xuôi trên P để điền KV cache, rồi phân nhánh theo lượt hoàn thành. Đo mức tăng tốc so với mã hóa lại P cho mỗi lượt.
3. **Khó.** Triển khai một PagedAttention đồ chơi: KV cache trong các khối cố định 16 token với một danh sách trống. Khi một chuỗi kết thúc, trả các khối của nó về kho. Mô phỏng 1,000 lượt hoàn thành trò chuyện có các độ dài thay đổi. So sánh phân mảnh bộ nhớ với cấp phát liên tục.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| KV cache (Bộ nhớ đệm KV) | "Thủ thuật khiến giải mã nhanh" | K và V được lưu từ mọi token tiền tố; các query mới chú ý đến chúng thay vì tính lại. |
| HBM | "Bộ nhớ chính GPU" | High Bandwidth Memory; 80 GB trên H100, 192 GB trên B200. Băng thông ~3 TB/s. |
| SRAM | "Bộ nhớ trên chip" | Bộ nhớ nhanh theo SM, ~256 KB mỗi SM trên H100. Băng thông ~30 TB/s. |
| Flash Attention | "Kernel attention chia ô" | Tính attention mà không hiện thực hóa N×N trong HBM. |
| Continuous batching (Batching liên tục) | "Batching không chờ" | Thay các chuỗi kết thúc ra, các chuỗi mới vào, không làm cạn batch. |
| PagedAttention | "Tính năng chủ lực của vLLM" | KV cache được cấp phát trong các khối cố định với một bảng trang; loại phân mảnh. |
| Prefix caching (Lưu đệm tiền tố) | "Tái sử dụng prompt dài" | Lưu đệm KV cho một tiền tố dùng chung giữa các yêu cầu; giảm chi phí lớn cho tác tử. |
| Speculative decoding (Giải mã suy đoán) | "Nháp + xác minh" | Mô hình nháp rẻ đề xuất token; mô hình lớn xác minh k trong một lượt. |

## Further Reading

- [Dao et al. (2022). FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness](https://arxiv.org/abs/2205.14135) — Flash 1.
- [Dao (2023). FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning](https://arxiv.org/abs/2307.08691) — Flash 2.
- [Shah et al. (2024). FlashAttention-3: Fast and Accurate Attention with Asynchrony and Low-precision](https://arxiv.org/abs/2407.08608) — Flash 3.
- [FlashAttention-4 release notes (Dao-AILab, 2026)](https://github.com/Dao-AILab/flash-attention) — pipeline Blackwell 5 giai đoạn và thủ thuật exp2 phần mềm; đọc README của kho để biết các lưu ý ra mắt chỉ truyền xuôi mà bài học này nhắc.
- [Kwon et al. (2023). Efficient Memory Management for Large Language Model Serving with PagedAttention](https://arxiv.org/abs/2309.06180) — bài báo vLLM.
- [Leviathan et al. (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — giải mã suy đoán.
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) — bài báo EAGLE-1/2 cho cách tiếp cận nháp tích hợp mà bài học trích dẫn.
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) — cách tiếp cận Medusa được tham chiếu cùng EAGLE.
- [vLLM docs — PagedAttention](https://docs.vllm.ai/en/latest/design/kernel/paged_attention.html) — đi sâu kinh điển về thiết kế khối 16 token và bảng trang.
