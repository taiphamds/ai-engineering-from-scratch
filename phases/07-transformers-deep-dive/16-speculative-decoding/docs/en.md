# Speculative Decoding — Draft, Verify, Repeat

> Giải mã tự hồi quy là nối tiếp. Mỗi token chờ token trước. Giải mã suy đoán phá chuỗi: một mô hình rẻ nháp N token, mô hình đắt xác minh cả N trong một lượt truyền xuôi. Khi nháp đúng bạn trả một lượt truyền xuôi lớn cho N lần sinh.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 07 (GPT Causal LM), Phase 7 · 12 (KV Cache & Flash Attention)
**Time:** ~60 minutes

## The Problem

Một LLM 70B lấy mẫu một token mất ~30 ms trên H100. Một mô hình nháp 3B mất ~3 ms. Nếu chúng ta để 3B nháp trước 5 token, rồi chạy 70B *một lần* để xác minh cả 5, tổng là `5×3 + 30 = 45 ms` cho tối đa 5 token được chấp nhận — so với `5×30 = 150 ms` cho sinh thẳng. Đó là toàn bộ lời chào giải mã suy đoán: đổi một lượng nhỏ bộ nhớ GPU bổ sung (mô hình nháp) lấy độ trễ giải mã thấp hơn 2–4×.

Thủ thuật phải giữ phân phối. Lấy mẫu suy đoán, được Leviathan và cộng sự (2023) và Chen và cộng sự giới thiệu đồng thời, bảo đảm chuỗi đầu ra **có phân phối giống hệt** điều mô hình lớn sẽ tự tạo ra. Không đánh đổi chất lượng. Chỉ nhanh hơn.

Bốn họ cặp nháp-xác minh thống trị suy luận năm 2026:

1. **Suy đoán nguyên bản (Leviathan 2023).** Mô hình nháp riêng (ví dụ Llama 3 1B) + bộ xác minh (ví dụ Llama 3 70B).
2. **Medusa (Cai 2024).** Nhiều head giải mã trên bộ xác minh dự đoán các vị trí `t+1..t+k` song song. Không mô hình nháp riêng.
3. **Họ EAGLE (Li 2024, 2025).** Nháp nhẹ tái sử dụng các trạng thái ẩn của bộ xác minh; tỷ lệ chấp nhận gần hơn so với nguyên bản; điển hình 3–4×.
4. **Lookahead decoding (Fu 2024).** Lặp Jacobi; hoàn toàn không cần mô hình nháp. Tự suy đoán. Ngách nhưng không phụ thuộc.

Mọi ngăn xếp suy luận production năm 2026 cung cấp giải mã suy đoán mặc định. vLLM, TensorRT-LLM, SGLang và llama.cpp đều hỗ trợ ít nhất nguyên bản + EAGLE-2.

## The Concept

### The core algorithm

Cho một bộ xác minh `M_q` và một nháp rẻ hơn `M_p`:

1. Để `x_1..x_k` là tiền tố đã được giải mã.
2. **Nháp**: dùng `M_p` để đề xuất tự hồi quy `d_{k+1}, d_{k+2}, ..., d_{k+N}` với các xác suất nháp `p_1..p_N`.
3. **Xác minh song song**: chạy `M_q` một lần trên `x_1..x_k, d_{k+1}, ..., d_{k+N}`, nhận các xác suất bộ xác minh `q_1..q_{N+1}` cho các vị trí `k+1..k+N+1`.
4. **Chấp nhận/từ chối mỗi token nháp từ trái sang phải**: với mỗi `i`, chấp nhận với xác suất `min(1, q_i(d_i) / p_i(d_i))`.
5. Tại lần từ chối đầu ở vị trí `j`: lấy mẫu `t_j` từ phân phối "phần dư" `(q_j - p_j)_+` được chuẩn hóa. Tất cả các nháp sau `j` bị loại.
6. Khi chấp nhận cả `N`: lấy mẫu thêm một token `t_{N+1}` từ `q_{N+1}` (token thưởng miễn phí).

Thủ thuật phân phối phần dư là nhận thức toán học giữ đầu ra có phân phối chính xác như thể `M_q` đã lấy mẫu từ đầu.

### What determines speedup

Đặt `α` = tỷ lệ chấp nhận kỳ vọng mỗi token nháp. Đặt `c` = tỷ lệ chi phí nháp-trên-xác minh. Theo bước:

- Sinh ngây thơ thực hiện 1 lời gọi mô hình lớn mỗi token.
- Suy đoán thực hiện 1 lời gọi mô hình lớn mỗi `(1 - α^{N+1}) / (1 - α) ≈ 1/(1-α)` token khi `α` cao.

Quy tắc kinh nghiệm điển hình tại `α = 0.75` và `N = 5`: ít lời gọi mô hình lớn hơn 3×. Chi phí nháp là 5× rẻ. Tổng thời gian thực giảm ~2.5×.

**α phụ thuộc vào:**

- Nháp xấp xỉ bộ xác minh tốt đến đâu. Cùng họ / cùng dữ liệu huấn luyện tăng α đáng kể.
- Chiến lược giải mã. Nháp tham lam với bộ xác minh tham lam: α cao. Lấy mẫu temperature: khó khớp hơn; chấp nhận giảm.
- Loại tác vụ. Mã và đầu ra có cấu trúc chấp nhận nhiều hơn (dự đoán được); viết sáng tạo tự do chấp nhận ít hơn.

### Medusa — drafts without a draft model

Medusa thay mô hình nháp bằng các head đầu ra bổ sung trên bộ xác minh. Tại vị trí `t`:

```
shared trunk → hidden h_t
    ├── head_0: predict token at t+1  (standard LM head)
    ├── head_1: predict token at t+2
    ├── head_2: predict token at t+3
    ├── head_3: predict token at t+4
```

Mỗi head xuất logits riêng. Khi suy luận bạn lấy mẫu từ mỗi head để có một chuỗi ứng viên, rồi xác minh bằng một lượt truyền xuôi dùng một hệ tree-attention xem xét mọi tiếp nối ứng viên cùng lúc.

Ưu điểm: không mô hình thứ hai. Nhược điểm: thêm các tham số có thể học; cần một giai đoạn fine-tuning có giám sát (~1B token); tỷ lệ chấp nhận thấp hơn một chút so với suy đoán nguyên bản có một nháp tốt.

### EAGLE — better draft by reusing hidden states

EAGLE-1/2/3 (Li và cộng sự, 2024–2025) biến mô hình nháp thành một transformer tí hon (thường 1 tầng) nhận các trạng thái ẩn tầng cuối của bộ xác minh. Vì nháp thấy biểu diễn đặc trưng của bộ xác minh, các dự đoán của nó tương quan mạnh với phân phối đầu ra của bộ xác minh. Các tỷ lệ chấp nhận tăng từ ~0.6 (nguyên bản) lên 0.85+.

EAGLE-3 (2025) thêm tìm kiếm cây trên các tiếp nối ứng viên. vLLM và SGLang cung cấp EAGLE-2/3 làm đường suy đoán mặc định cho Llama 3/4 và Qwen 3.

### The KV cache dance

Xác minh đưa `N` token nháp vào bộ xác minh trong một lượt truyền xuôi. Điều này mở rộng KV cache của bộ xác minh thêm `N` mục. Nếu một số nháp bị từ chối, bạn phải hoàn tác cache về độ dài tiền tố được chấp nhận.

Các triển khai production (`--speculative-config` của vLLM, LookaheadDecoder của TensorRT-LLM) xử lý việc này bằng các bộ đệm KV tạm. Ghi trước, chốt khi chấp nhận. Nó không khó về khái niệm, nhưng lắt nhắt.

```figure
draft-verify-tokens
```

## Build It

Xem `code/main.py`. Chúng ta triển khai thuật toán lấy mẫu suy đoán cốt lõi (bước từ chối + phân phối phần dư) với:

- Một "mô hình lớn" là một softmax tất định trên một phân phối được mã hóa bằng tay (để chúng ta có thể xác minh toán chấp nhận bằng giải tích).
- Một "mô hình nháp" là một nhiễu loạn của mô hình lớn.
- Một vòng lặp chấp nhận / từ chối tạo cùng phân phối biên như lấy mẫu trực tiếp.

### Step 1: the rejection step

```python
def accept_or_reject(q_prob, p_prob, draft_token, u):
    ratio = q_prob / p_prob if p_prob > 0 else float("inf")
    return u < min(1.0, ratio)
```

`u` là một số ngẫu nhiên đều. `q_prob` là xác suất của bộ xác minh cho token được nháp. `p_prob` là xác suất của mô hình nháp. Định lý Leviathan là quyết định Bernoulli này, theo sau bởi lấy mẫu từ phần dư khi từ chối, giữ chính xác phân phối của bộ xác minh.

### Step 2: residual distribution

```python
def residual_dist(q, p):
    raw = [max(0.0, qi - pi) for qi, pi in zip(q, p)]
    s = sum(raw)
    return [r / s for r in raw]
```

Trừ `p` khỏi `q` theo phần tử, chặn các giá trị âm về không, chuẩn hóa lại. Lấy mẫu từ đây ở bất kỳ lần từ chối nào.

### Step 3: one speculative step

```python
def spec_step(prefix, q_model, p_model, N, rng):
    drafts = []
    p_probs = []
    ctx = list(prefix)
    for _ in range(N):
        p_dist = p_model(ctx)
        d = sample(p_dist, rng)
        drafts.append(d)
        p_probs.append(p_dist[d])
        ctx.append(d)

    q_dists = [q_model(prefix + drafts[:i]) for i in range(N + 1)]

    for i, d in enumerate(drafts):
        u = rng.random()
        q_prob = q_dists[i][d]
        p_prob = p_probs[i]
        if u < min(1.0, q_prob / p_prob if p_prob > 0 else float("inf")):
            prefix = prefix + [d]
        else:
            res = residual_dist(q_dists[i], p_model(prefix))
            prefix = prefix + [sample(res, rng)]
            return prefix
    prefix = prefix + [sample(q_dists[N], rng)]
    return prefix
```

Năm được chấp nhận → một thưởng → sáu token được tạo trong một lượt bộ xác minh.

### Step 4: measure acceptance rate

Chạy 10,000 bước suy đoán tại các mức chất lượng nháp khác nhau. Vẽ tỷ lệ chấp nhận theo độ phân kỳ KL giữa các phân phối nháp và bộ xác minh. Bạn sẽ thấy một quan hệ đơn điệu rõ.

### Step 5: verify distribution equivalence

Thực nghiệm: histogram các token do vòng lặp suy đoán tạo nên khớp histogram được tạo bằng lấy mẫu trực tiếp từ bộ xác minh. Đây là định lý Leviathan trong thực tế. Một kiểm định chi-square xác nhận trong sai số lấy mẫu.

## Use It

Production:

```bash
# vLLM with EAGLE
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-config '{"method": "eagle", "model": "/models/llama-3.1-eagle-70b", "draft_tensor_parallel_size": 1, "num_speculative_tokens": 5}'

# vLLM with vanilla draft model
vllm serve meta-llama/Llama-3.1-70B-Instruct \
    --speculative-config '{"method": "draft_model", "model": "meta-llama/Llama-3.2-1B-Instruct", "num_speculative_tokens": 5}'
```

TensorRT-LLM có đường Medusa nhanh nhất tính đến giữa năm 2026. `faster-whisper` bọc giải mã suy đoán cho Whisper-large với một nháp nhỏ.

**Chọn một nháp:**

| Chiến lược | Khi nào chọn | Tăng tốc |
|----------|--------------|---------|
| Nháp nguyên bản (họ Llama 1B/3B) | Nguyên mẫu nhanh, không huấn luyện | 1.8–2.3× |
| Các head Medusa | Bạn có thể fine-tune bộ xác minh | 2–3× |
| EAGLE-2 / 3 | Production, tốc độ tối đa | 3–4× |
| Lookahead | Không nháp, không huấn luyện, không tham số bổ sung | 1.3–1.6× |

**Khi nào KHÔNG giải mã suy đoán:**

- Sinh một chuỗi duy nhất 1–5 token. Chi phí phụ chi phối.
- Lấy mẫu cực kỳ sáng tạo / temperature cao (α giảm).
- Các triển khai hạn chế bộ nhớ (mô hình nháp thêm VRAM).

## Ship It

Xem `outputs/skill-spec-decode-picker.md`. Skill chọn một chiến lược giải mã suy đoán (nguyên bản / Medusa / EAGLE / lookahead) và các tham số tinh chỉnh (N, temperature nháp) cho một khối lượng công việc suy luận mới.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Xác nhận phân phối token suy đoán khớp phân phối lấy mẫu trực tiếp của bộ xác minh trên 50,000 token trong chi-square p > 0.05.
2. **Trung bình.** Vẽ mức tăng tốc (token mỗi lượt truyền xuôi mô hình lớn) theo `N` với `α = 0.5, 0.7, 0.85`. Xác định `N` tối ưu cho mỗi α. (Gợi ý: số token kỳ vọng mỗi lời gọi xác minh = `(1 - α^{N+1}) / (1 - α)`.)
3. **Khó.** Triển khai một Medusa tí hon: lấy GPT capstone từ Bài 14, thêm 3 head LM bổ sung dự đoán các vị trí t+2, t+3, t+4. Huấn luyện trên tinyshakespeare với một multi-head loss kết hợp. So sánh các tỷ lệ chấp nhận với một nháp nguyên bản được tạo bằng cắt ngắn cùng mô hình.
4. **Khó.** Triển khai hoàn tác: bắt đầu với KV cache tiền tố 10 token, đưa 5 token nháp, mô phỏng một lần từ chối tại vị trí 3. Xác minh các lần đọc cache khớp đúng "tiền tố + 2 nháp đầu được chấp nhận" ở lần lặp tiếp theo.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Draft model (Mô hình nháp) | "Mô hình rẻ" | Một mô hình nhỏ hơn đề xuất các token ứng viên; thường rẻ hơn bộ xác minh 10–50×. |
| Verifier (Bộ xác minh) | "Mô hình lớn" | Mô hình đích mà chúng ta giữ phân phối; chạy một lần mỗi bước suy đoán. |
| Acceptance rate (α) (Tỷ lệ chấp nhận) | "Nháp đúng thường xuyên bao nhiêu" | Xác suất theo token mà bộ xác minh chấp nhận nháp. Thường 0.7–0.9. |
| Residual distribution (Phân phối phần dư) | "Dự phòng khi từ chối" | `(q - p)_+` được chuẩn hóa; lấy mẫu từ đây khi từ chối giữ phân phối bộ xác minh. |
| Bonus token (Token thưởng) | "Token miễn phí" | Khi cả N nháp được chấp nhận, lấy mẫu thêm một từ phân phối bước tiếp của bộ xác minh. |
| Medusa | "Suy đoán không nháp" | Nhiều head LM trên bộ xác minh dự đoán các vị trí t+1..t+k song song. |
| EAGLE | "Nháp trạng thái ẩn" | Nháp transformer tí hon được điều kiện hóa theo các trạng thái ẩn tầng cuối của bộ xác minh. |
| Lookahead decoding | "Lặp Jacobi" | Tự suy đoán bằng một phép lặp điểm bất động; không mô hình nháp. |
| Tree attention (Attention cây) | "Xác minh nhiều ứng viên cùng lúc" | Xác minh phân nhánh xem xét vài tiếp nối nháp đồng thời. |
| KV rollback (Hoàn tác KV) | "Hoàn tác các nháp bị từ chối" | Bộ đệm KV tạm; chốt khi chấp nhận, loại khi từ chối. |

## Further Reading

- [Leviathan, Kalman, Matias (2023). Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192) — thuật toán cốt lõi và định lý tương đương.
- [Chen et al. (2023). Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318) — giới thiệu đồng thời; chứng minh từ chối Bernoulli rõ ràng.
- [Cai et al. (2024). Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads](https://arxiv.org/abs/2401.10774) — bài báo Medusa; xác minh tree-attention.
- [Li et al. (2024). EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty](https://arxiv.org/abs/2401.15077) — EAGLE-1; nháp được điều kiện hóa theo trạng thái ẩn.
- [Li et al. (2024). EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees](https://arxiv.org/abs/2406.16858) — EAGLE-2; độ sâu cây động.
- [Li et al. (2025). EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test](https://arxiv.org/abs/2503.01840) — EAGLE-3.
- [Fu et al. (2024). Break the Sequential Dependency of LLM Inference Using Lookahead Decoding](https://arxiv.org/abs/2402.02057) — lookahead, cách tiếp cận không nháp.
- [vLLM docs — Speculative Decoding](https://docs.vllm.ai/en/latest/features/spec_decode.html) — tham chiếu production kinh điển với cả bốn chiến lược được nối.
- [SafeAILab / EAGLE reference implementation](https://github.com/SafeAILab/EAGLE) — mã tham chiếu cho EAGLE-1/2/3.
