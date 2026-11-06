# Speculative Decoding and EAGLE

> Một LLM tiên tiến nhất sinh một token cần một forward pass đầy đủ trên hàng tỷ tham số. Forward pass đó được cấp dư tài nguyên rất nhiều: phần lớn thời gian, một mô hình nhỏ hơn nhiều có thể đoán đúng 3-5 token tiếp theo, và mô hình lớn chỉ cần *xác minh* dự đoán. Khi dự đoán đúng, bạn nhận được 5 token với giá của một token. Speculative decoding (Leviathan và cộng sự 2023) khiến điều này chính xác, và EAGLE-3 (2025) đẩy tỷ lệ chấp nhận lên ~4.5 token mỗi lần xác minh — tăng tốc 4-5x với phân phối đầu ra khớp nhau.

**Type:** Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 10 Lesson 12 (Inference Optimization), Phase 10 Lesson 04 (Pre-training Mini-GPT)
**Time:** ~75 minutes

## The Problem

Thông lượng giải mã cho một mô hình loại 70B trên H100 thường là 40-80 token/giây. Mỗi token cần một forward pass đầy đủ đọc mọi trọng số mô hình từ HBM. Bạn không thể làm mô hình nhỏ hơn mà không thay đổi đầu ra của nó. Bạn không thể tăng batch size vượt quá bộ nhớ. Bạn bị kẹt — trừ khi có thể để mô hình xuất ra nhiều hơn một token mỗi forward pass.

Sinh tự hồi quy có vẻ vốn có tính tuần tự: `x_{t+1} = sample(p(· | x_{1:t}))`. Nhưng có một cơ hội thực hiện đồng thời. Nếu bạn có một bộ dự đoán chi phí thấp nói rằng "4 token tiếp theo có lẽ là [a, b, c, d]", bạn có thể xác minh cả 5 vị trí trong **một forward pass duy nhất của mô hình lớn** và chấp nhận tiền tố khớp dài nhất.

Leviathan, Kalai, Matias (2023, "Fast Inference from Transformers via Speculative Decoding") khiến điều này chính xác thông qua một quy tắc chấp nhận/từ chối khéo léo bảo toàn phân phối lấy mẫu của mô hình đích. Cùng phân phối đầu ra, nhanh hơn 2-4×.

## The Concept

### The Two-Model Setup

- **Mô hình đích** `M_p`: mô hình lớn, chậm, chất lượng cao mà bạn thực sự muốn lấy mẫu từ đó. Phân phối: `p(x)`.
- **Mô hình dự thảo** `M_q`: một mô hình nhỏ, nhanh, chất lượng thấp hơn. Phân phối: `q(x)`. Nhỏ hơn 5-30×.

Mỗi bước:

1. Mô hình dự thảo đề xuất `K` token theo cách tự hồi quy: `x_1, x_2, ..., x_K ~ q`.
2. Mô hình đích chạy MỘT forward pass trên cả `K+1` vị trí song song, tạo `p(x_k)` cho mỗi token được đề xuất.
3. Chấp nhận/từ chối từng token từ trái sang phải qua quy tắc lấy mẫu loại bỏ đã sửa đổi bên dưới. Chấp nhận tiền tố khớp dài nhất.
4. Nếu bất kỳ token nào bị từ chối, lấy mẫu thay thế từ phân phối đã hiệu chỉnh và dừng. Nếu không, lấy mẫu thêm một token thưởng từ `p(· | x_1...x_K)`.

Nếu bản dự thảo khớp hoàn hảo với đích, bạn nhận K+1 token mỗi forward của đích. Nếu bản dự thảo sai ở vị trí 1, bạn chỉ nhận 1 token.

### The Exactness Rule

Speculative decoding **được chứng minh là tương đương về phân phối với lấy mẫu từ p**. Quy tắc loại bỏ:

```
For each drafted token x_t:
    r ~ Uniform(0, 1)
    if r < p(x_t) / q(x_t):
        accept x_t
    else:
        sample replacement from residual: (p - q)+ / ||(p - q)+||_1
        stop
```

trong đó `(p - q)+` biểu thị phần dương của hiệu theo từng điểm. Khi bản dự thảo và đích đồng thuận (`p ≈ q`), tỷ lệ chấp nhận gần 1. Khi chúng bất đồng, phân phối phần dư được xây dựng sao cho mẫu tổng thể vẫn chính xác là `p`.

**Trường hợp greedy.** Với lấy mẫu temperature=0, chỉ kiểm tra `argmax(p) == x_t`. Nếu đúng, chấp nhận; nếu không, xuất `argmax(p)` và dừng.

### Expected Speedup

Nếu tỷ lệ chấp nhận ở cấp token của mô hình dự thảo là `α`, số token kỳ vọng được tạo trên mỗi forward pass của đích là:

```
E[tokens] = (1 - α^{K+1}) / (1 - α)        # K = draft length, α in [0, 1]
```

Với `α = 0.8, K = 4`: `(1 - 0.8^5)/(1 - 0.8) = 3.36` token mỗi forward. Một forward của đích tốn khoảng `cost_q * K + cost_p` (K bước dự thảo cộng một lần xác minh của đích). Nếu `cost_p >> cost_q * K`, tỷ lệ tăng tốc là `3.36× / 1 = 3.36×` về thông lượng.

Tham số thực sự duy nhất là `α`, phụ thuộc hoàn toàn vào sự căn chỉnh dự thảo-đích. Một bản dự thảo tốt là tất cả.

### Training the Draft: Distillation

Một mô hình nhỏ ngẫu nhiên làm bản dự thảo kém. Công thức tiêu chuẩn là chưng cất từ đích:

1. Chọn một kiến trúc nhỏ (~1B cho đích 70B, ~500M cho đích 7B).
2. Chạy mô hình đích trên một ngữ liệu văn bản lớn; lưu các phân phối token tiếp theo của nó.
3. Huấn luyện bản dự thảo với KL divergence so với phân phối của đích (không phải so với các token nhãn thực).

Kết quả: `α` thường là 0.6-0.8 trên lập trình, 0.7-0.85 trên chat ngôn ngữ tự nhiên. Mức tăng tốc 2-3× trong sản xuất.

### EAGLE: Tree Drafting + Feature Reuse

Li, Wei, Zhang, Zhang (2024, "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty") quan sát hai điểm kém hiệu quả trong speculative decoding tiêu chuẩn:

1. Bản dự thảo thực hiện K bước tuần tự, mỗi bước qua toàn bộ ngăn xếp. Nhưng bản dự thảo có thể tái sử dụng các đặc trưng (trạng thái ẩn) của đích từ lần xác minh gần nhất — đích đã tính các biểu diễn phong phú mà bản dự thảo đang suy ra lại từ đầu.
2. Bản dự thảo xuất một chuỗi tuyến tính. Nếu bản dự thảo có thể xuất một *cây* ứng viên (mỗi node nhiều dự đoán), forward pass duy nhất của đích có thể xác minh nhiều đường ứng viên song song qua một tree attention mask, và chọn nhánh được chấp nhận dài nhất.

Các thay đổi của EAGLE-1:
- Đầu vào dự thảo = trạng thái ẩn cuối cùng của đích tại vị trí t, không phải token thô.
- Kiến trúc dự thảo = 1 lớp transformer decoder (không phải một mô hình nhỏ riêng).
- Đầu ra = cây K = 4-8 ứng viên mỗi độ sâu, độ sâu 4-6.

EAGLE-2 (2024) thêm cấu trúc liên kết cây động: cây mở rộng hơn ở nơi bản dự thảo không chắc chắn và giữ hẹp ở nơi nó tự tin. Tăng `α_effective` mà không tăng chi phí xác minh.

EAGLE-3 (Li và cộng sự 2025, "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test") loại bỏ sự phụ thuộc cố định vào đặc trưng lớp trên cùng và huấn luyện bản dự thảo bằng một loss "mô phỏng lúc kiểm thử" mới — bản dự thảo được huấn luyện trên các đầu ra khớp với phân phối lúc kiểm thử của đích thay vì phân phối huấn luyện teacher-forced. Tỷ lệ chấp nhận tăng từ 0.75 (EAGLE-2) lên 0.82 (EAGLE-3), và số token trung bình mỗi lần xác minh từ 3.0 lên 4.5.

### Tree Attention Verification

Khi bản dự thảo xuất một cây, mô hình đích xác minh nó trong một forward pass duy nhất bằng **tree attention mask** — một mặt nạ nhân quả mã hóa cấu trúc liên kết cây thay vì một đường thuần túy. Mỗi token chỉ attend đến các tổ tiên của nó trong cây. Lần xác minh vẫn là một forward, một matmul; mặt nạ cấu trúc liên kết chỉ tốn thêm vài mục KV.

```
        root
       /    \
      a      b
     / \    / \
    c  d   e   f
```

Nếu `a, b` là các ứng viên token đầu tiên cạnh tranh và `c, d, e, f` là các ứng viên token thứ hai, cả sáu vị trí được xác minh trong một forward pass. Đầu ra là tiền tố dài nhất dọc theo bất kỳ đường nào được chấp nhận.

### When It Wins, When It Doesn't

**Có lợi:**
- Chat / hoàn thành với văn bản có thể dự đoán (mã, tiếng Anh thông dụng, đầu ra có cấu trúc). `α` cao.
- Các thiết lập có tính toán GPU chưa được sử dụng trong giải mã (giai đoạn bị giới hạn bởi bộ nhớ). Dự thảo cây dùng FLOPs sẵn có.

**Bất lợi / không có lợi:**
- Đầu ra có tính ngẫu nhiên cao (viết sáng tạo ở temperature cao). `α` giảm về phía `1/|vocab|`.
- Phục vụ theo batch với mức đồng thời rất cao — batching đã lấp đầy FLOPs, còn ít chỗ cho xác minh cây.
- Các mô hình đích rất nhỏ mà bản dự thảo không nhỏ hơn nhiều.

Các đơn vị sản xuất thường báo cáo tăng tốc thời gian thực 2-3× trên chat, 3-5× trên sinh mã và gần bằng không trên viết sáng tạo.

```figure
speculative-decoding
```

## Build It

`code/main.py`:

- Một `speculative_decode(target, draft, prompt, K, temperature)` tham chiếu triển khai quy tắc loại bỏ chính xác và xác minh nó bảo toàn phân phối của đích (KL thực nghiệm < 0.01 so với lấy mẫu đích thông thường).
- Một bộ dự thảo cây kiểu EAGLE xây dựng cây độ sâu K với phân nhánh top-p.
- Một bộ xây dựng tree attention mask tạo mẫu nhân quả đúng cho bộ xác minh.
- Một bộ kiểm tra tỷ lệ chấp nhận chạy cả hai trên một LM nhỏ (chưng cất một GPT-2-small từ đích GPT-2-medium).

```python
def speculative_step(p_target, q_draft, K, temperature=1.0):
    """One round of speculative decoding. Returns list of accepted tokens."""
    # 1. Draft K tokens
    draft_tokens = []
    q_probs = []
    state = draft_state_init()
    for _ in range(K):
        probs = softmax(q_draft(state) / temperature)
        t = np.random.choice(len(probs), p=probs)
        draft_tokens.append(t)
        q_probs.append(probs[t])
        state = draft_step(state, t)

    # 2. Target computes p at every drafted position + 1 extra
    p_probs_all = target_forward_batched(p_target, draft_tokens, temperature)

    # 3. Accept/reject left-to-right
    accepted = []
    for k, tok in enumerate(draft_tokens):
        r = np.random.uniform()
        if r < p_probs_all[k][tok] / q_probs[k]:
            accepted.append(tok)
        else:
            residual = np.maximum(p_probs_all[k] - q_probs[k], 0)
            residual /= residual.sum()
            accepted.append(np.random.choice(len(residual), p=residual))
            return accepted
    # 4. All K accepted → sample bonus token from target
    accepted.append(np.random.choice(len(p_probs_all[-1]), p=p_probs_all[-1]))
    return accepted
```

## Use It

- **vLLM** và **SGLang** cung cấp speculative decoding với hỗ trợ hạng nhất. Trong vLLM, truyền cho `--speculative-config` một đối tượng JSON với `method`, `model` và `num_speculative_tokens`; EAGLE-3 là `"method": "eagle3"`.
- **NVIDIA TensorRT-LLM** hỗ trợ Medusa và cây EAGLE nguyên bản.
- **Các mô hình dự thảo tham chiếu**: `Qwen/Qwen3-0.6B` (dự thảo cho Qwen3-32B), `meta-llama/Llama-3.2-1B-Instruct` (dự thảo cho Llama 3.x 70B).
- **Các head Medusa** (Cai và cộng sự 2024, "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"): thay vì một mô hình dự thảo, thêm K head dự đoán song song vào chính đích. Triển khai đơn giản hơn, tỷ lệ chấp nhận thấp hơn EAGLE một chút.

## Ship It

Bài học này tạo ra `outputs/skill-speculative-tuning.md` — một skill phân tích khối lượng công việc của mô hình đích và chọn: mô hình dự thảo, K (độ dài dự thảo), độ rộng cây, temperature và khi nào quay về giải mã thông thường.

## Exercises

1. Triển khai quy tắc loại bỏ chính xác và xác minh nó bằng thực nghiệm. Chạy 10K mẫu qua `speculative_decode` và qua lấy mẫu đích thông thường; tính khoảng cách TV giữa hai phân phối đầu ra. Phải < 0.01.

2. Tính công thức tăng tốc. Với `α` và `K` cố định, vẽ số token kỳ vọng mỗi forward của đích. Tìm K tối ưu cho α ∈ {0.5, 0.7, 0.9}.

3. Huấn luyện một bản dự thảo nhỏ. Lấy đích GPT-2 124M và chưng cất bản dự thảo GPT-2 30M trên 100M token với KL loss. Đo `α` trên văn bản giữ riêng. Kỳ vọng: 0.6-0.7.

4. Triển khai dự thảo cây kiểu EAGLE. Thay vì một chuỗi, để bản dự thảo xuất các nhánh top-3 ở mỗi độ sâu. Xây dựng tree attention mask. Xác minh đích chấp nhận nhánh đúng dài nhất.

5. Đo các dạng thất bại. Chạy speculative decode ở temperature=1.5 (tính ngẫu nhiên cao). Cho thấy α sụp đổ và thuật toán chậm hơn giải mã thông thường do chi phí dự thảo.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Target model (Mô hình đích) | "Mô hình lớn" | Mô hình chậm, chất lượng cao mà bạn muốn lấy mẫu từ đó (phân phối p) |
| Draft model (Mô hình dự thảo) | "Bộ suy đoán" | Bộ dự đoán nhỏ, nhanh (phân phối q); nhỏ hơn 5-30x |
| K / draft length (K / độ dài dự thảo) | "Nhìn trước" | Số token được suy đoán mỗi lần xác minh |
| α / acceptance rate (α / tỷ lệ chấp nhận) | "Tỷ lệ trúng" | Xác suất trên mỗi token mà đề xuất của bản dự thảo được chấp nhận |
| Exact rejection rule (Quy tắc loại bỏ chính xác) | "Phép kiểm tra chấp nhận" | So sánh r < p/q bảo toàn phân phối của đích |
| Residual distribution (Phân phối phần dư) | "p-q đã hiệu chỉnh" | (p - q)+ / ||(p - q)+||_1, phân phối để lấy mẫu khi từ chối |
| Tree drafting (Dự thảo cây) | "Suy đoán phân nhánh" | Bản dự thảo xuất một cây ứng viên, được xác minh trong một lần với attention mask có cấu trúc cây |
| Tree attention mask (Mặt nạ attention cây) | "Mặt nạ cấu trúc liên kết" | Mặt nạ nhân quả mã hóa cấu trúc liên kết cây để mỗi node chỉ attend đến các tổ tiên của nó |
| Medusa heads (Các head Medusa) | "Các head song song" | K head dự đoán bổ sung trên chính đích; không có mô hình dự thảo riêng |
| EAGLE feature reuse (Tái sử dụng đặc trưng EAGLE) | "Dự thảo trạng thái ẩn" | Đầu vào dự thảo là trạng thái ẩn cuối của đích, không phải token thô, thu nhỏ bản dự thảo |
| Test-time simulation loss (Loss mô phỏng lúc kiểm thử) | "Huấn luyện EAGLE-3" | Huấn luyện bản dự thảo trên các đầu ra khớp với phân phối lúc kiểm thử của đích, không phải teacher forcing |

## Further Reading

- [Leviathan, Kalai, Matias, 2023 — "Fast Inference from Transformers via Speculative Decoding"](https://arxiv.org/abs/2211.17192) — quy tắc loại bỏ chính xác và phân tích tăng tốc lý thuyết
- [Chen, Borgeaud, Irving et al., 2023 — "Accelerating Large Language Model Decoding with Speculative Sampling"](https://arxiv.org/abs/2302.01318) — bài báo speculative sampling cùng thời điểm tại DeepMind
- [Cai, Li, Geng, Wang, Wang, Zhu, Dao, 2024 — "Medusa: Simple LLM Inference Acceleration Framework with Multiple Decoding Heads"](https://arxiv.org/abs/2401.10774) — phương án head song song thay cho mô hình dự thảo
- [Li, Wei, Zhang, Zhang, 2024 — "EAGLE: Speculative Sampling Requires Rethinking Feature Uncertainty"](https://arxiv.org/abs/2401.15077) — tái sử dụng đặc trưng và dự thảo cây
- [Li et al., 2024 — "EAGLE-2: Faster Inference of Language Models with Dynamic Draft Trees"](https://arxiv.org/abs/2406.16858) — cấu trúc liên kết cây động
- [Li et al., 2025 — "EAGLE-3: Scaling up Inference Acceleration of Large Language Models via Training-Time Test"](https://arxiv.org/abs/2503.01840) — khớp thời điểm huấn luyện với thời điểm kiểm thử
- [Fu, Haotian, Peng et al., 2024 — "Break the Sequential Dependency of LLM Inference Using Lookahead Decoding"](https://arxiv.org/abs/2402.02057) — giải mã Jacobi/lookahead, một phương án thay thế không cần bộ suy đoán
