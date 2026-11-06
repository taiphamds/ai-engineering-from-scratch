# Mixture of Experts (MoE)

> Một transformer đặc 70B kích hoạt mọi tham số cho mọi token. Một MoE 671B chỉ kích hoạt 37B mỗi token và thắng nó trên mọi benchmark. Tính thưa là ý tưởng mở rộng quy mô quan trọng nhất của thập kỷ.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 7 · 07 (GPT)
**Time:** ~45 minutes

## The Problem

FLOP của một transformer đặc khi suy luận bằng số tham số của nó (nhân 2 cho lượt truyền xuôi). Mở rộng một mô hình đặc và mỗi token trả toàn bộ hóa đơn. Đến năm 2024 tuyến đầu đang chạm một bức tường tính toán: để thông minh hơn đáng kể, bạn cần nhiều FLOP hơn theo cấp số nhân mỗi token.

Mixture of Experts phá liên kết này. Thay mỗi FFN bằng $E$ chuyên gia độc lập + một bộ định tuyến chọn $k$ chuyên gia mỗi token. Tổng tham số = $E \times \text{FFN size}$. Tham số hoạt động mỗi token = $k \times \text{FFN size}$. Cấu hình điển hình năm 2026: $E=256$, $k=8$. Lưu trữ tăng theo $E$, tính toán tăng theo $k$.

Tuyến đầu năm 2026 gần như hoàn toàn là MoE: DeepSeek-V3 (671B tổng / 37B hoạt động), Mixtral 8×22B, Qwen2.5-MoE, Llama 4, Kimi K2, gpt-oss. Trên bảng xếp hạng độc lập của Artificial Analysis, top 10 mô hình mã nguồn mở đều là MoE.

## The Concept

![MoE layer: router selects k of E experts per token](../assets/moe.svg)

### The FFN swap

Khối transformer đặc:

```
h = x + attn(norm(x))
h = h + FFN(norm(h))
```

Khối MoE:

```
h = x + attn(norm(x))
scores = router(norm(h))              # (N_tokens, E)
top_k = argmax_k(scores)              # pick k of E per token
h = h + sum_{e in top_k}(
        gate(scores[e]) * Expert_e(norm(h))
    )
```

Mỗi chuyên gia là một FFN độc lập (thường là SwiGLU). Bộ định tuyến là một tầng tuyến tính duy nhất. Mỗi token chọn `k` chuyên gia riêng và nhận một hỗn hợp có cổng của các đầu ra của chúng.

### The load-balancing problem

Nếu bộ định tuyến đưa 90% token qua chuyên gia 3, các chuyên gia khác bị đói. Ba cách sửa đã được thử:

1. **Loss phụ cân bằng tải** (Switch Transformer, Mixtral). Thêm một phạt tỷ lệ với phương sai sử dụng chuyên gia. Hoạt động, nhưng thêm một siêu tham số và một tín hiệu gradient thứ hai.
2. **Dung lượng chuyên gia + bỏ token** (Switch ban đầu). Mỗi chuyên gia xử lý tối đa $C \times N/E$ token; các token tràn bỏ qua tầng. Gây hại chất lượng.
3. **Cân bằng không loss phụ** (DeepSeek-V3). Thêm một bias được học theo chuyên gia dịch lựa chọn top-k của bộ định tuyến. Bias được cập nhật ngoài loss huấn luyện. Không phạt lên mục tiêu chính. Bước mở khóa lớn năm 2024.

Cách tiếp cận của DeepSeek-V3: sau mỗi bước huấn luyện, với mỗi chuyên gia, kiểm tra mức sử dụng trên hay dưới mục tiêu. Điều chỉnh nhẹ bias bằng `±γ`. Lựa chọn dùng `scores + bias`. Các xác suất chuyên gia dùng cho gating là `scores` thô không đổi. Tách định tuyến khỏi biểu đạt.

### Shared experts

DeepSeek-V2/V3 cũng chia các chuyên gia thành *dùng chung* và *được định tuyến*. Mọi token đi qua tất cả các chuyên gia dùng chung. Các chuyên gia được định tuyến được chọn qua top-k. Các chuyên gia dùng chung nắm bắt kiến thức chung; các chuyên gia được định tuyến chuyên biệt hóa. V3 chạy 1 chuyên gia dùng chung cộng top-8 trong 256 chuyên gia được định tuyến.

### Fine-grained experts

MoE cổ điển (GShard, Switch): mỗi chuyên gia rộng bằng một FFN đầy đủ. `E` nhỏ (8–64), `k` nhỏ (1–2).

MoE hạt mịn hiện đại (DeepSeek-V3, Qwen-MoE): mỗi chuyên gia hẹp hơn (1/8 kích thước FFN). $E$ lớn (256+), $k$ lớn hơn (8+). Cùng tổng số tham số, nhưng các tổ hợp tăng nhanh hơn nhiều. $\binom{256}{8} \approx 400$ nghìn tỷ "chuyên gia" có thể có cho mỗi token. Chất lượng tăng, độ trễ giữ nguyên.

### The cost profile

Theo token, theo tầng:

| Cấu hình | Tham số hoạt động / token | Tổng tham số |
|--------|-----------------------|--------------|
| Mixtral 8×22B | ~39B | 141B |
| Llama 3 70B (đặc) | 70B | 70B |
| DeepSeek-V3 | 37B | 671B |
| Kimi K2 (MoE) | ~32B | 1T |

DeepSeek-V3 thắng Llama 3 70B (đặc) trên gần như mọi benchmark trong khi thực hiện **ít FLOP hoạt động hơn mỗi token**. Nhiều tham số hơn = nhiều kiến thức hơn. Nhiều FLOP hoạt động hơn = nhiều tính toán hơn mỗi token. MoE tách chúng.

### The catch: memory

Mọi chuyên gia nằm trên GPU bất kể chuyên gia nào kích hoạt. Một mô hình 671B cần ~1.3 TB VRAM cho các trọng số fp16. Triển khai MoE tiên phong đòi hỏi tính song song chuyên gia — phân mảnh các chuyên gia trên GPU, định tuyến token qua mạng. Độ trễ bị chi phối bởi giao tiếp all-to-all, không phải phép nhân ma trận.

```figure
expert-routing
```

## Build It

Xem `code/main.py`. Một tầng MoE gọn chỉ dùng stdlib với:

- `n_experts=8` chuyên gia kiểu SwiGLU (mỗi chuyên gia một tầng tuyến tính, để minh họa)
- định tuyến top-k=2
- các trọng số gating được chuẩn hóa softmax
- cân bằng không loss phụ qua bias theo chuyên gia

### Step 1: the router

```python
def route(hidden, W_router, top_k, bias):
    scores = [sum(h * w for h, w in zip(hidden, W_router[e])) for e in range(len(W_router))]
    biased = [s + b for s, b in zip(scores, bias)]
    top_idx = sorted(range(len(biased)), key=lambda i: -biased[i])[:top_k]
    # softmax over ORIGINAL scores of the chosen experts
    chosen = [scores[i] for i in top_idx]
    m = max(chosen)
    exps = [math.exp(c - m) for c in chosen]
    s = sum(exps)
    gates = [e / s for e in exps]
    return top_idx, gates
```

Bias ảnh hưởng lựa chọn, không phải trọng số cổng. Đó là thủ thuật DeepSeek-V3 — bias sửa mất cân bằng tải mà không điều khiển các dự đoán của mô hình.

### Step 2: run 100 tokens through the router

Theo dõi những chuyên gia nào kích hoạt thường xuyên bao nhiêu. Không có bias, mức sử dụng lệch. Với một vòng lặp cập nhật bias (`-γ` cho các chuyên gia bị dùng quá mức, `+γ` cho các chuyên gia dùng thiếu), mức sử dụng hội tụ về một phân phối đều sau vài lần lặp.

### Step 3: param count comparison

In "tương đương đặc" của một cấu hình MoE. Dạng DeepSeek-V3: 256 được định tuyến + 1 dùng chung, 8 hoạt động, d_model=7168. Tổng số tham số choáng ngợp. Số hoạt động là một phần bảy của một Llama 3 70B đặc.

## Use It

Tải bằng HuggingFace:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
model = AutoModelForCausalLM.from_pretrained("mistralai/Mixtral-8x22B-v0.1")
```

Suy luận production năm 2026: vLLM hỗ trợ định tuyến MoE nguyên bản. SGLang có đường song song chuyên gia nhanh nhất. Cả hai tự động xử lý lựa chọn top-k và tính song song chuyên gia.

**Khi nào chọn MoE:**
- Bạn muốn chất lượng tiên phong với chi phí suy luận mỗi token thấp hơn.
- Bạn có VRAM / hạ tầng song song chuyên gia.
- Khối lượng công việc của bạn nặng token (trò chuyện, mã) không nặng ngữ cảnh (tài liệu dài).

**Khi nào KHÔNG chọn MoE:**
- Triển khai biên — bạn trả toàn bộ lưu trữ cho bất kỳ FLOP hoạt động nào.
- Phục vụ một người dùng đòi hỏi độ trễ nghiêm ngặt — định tuyến chuyên gia thêm chi phí phụ.
- Các mô hình nhỏ (<7B) — lợi thế chất lượng của MoE chỉ xuất hiện trên một ngưỡng tính toán (~6B tham số hoạt động).

## Ship It

Xem `outputs/skill-moe-configurator.md`. Skill chọn E, k và bố cục chuyên gia dùng chung cho một MoE mới với ngân sách tham số, token huấn luyện và đích triển khai.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Quan sát cách cập nhật bias không loss phụ làm đều mức sử dụng chuyên gia qua 50 lần lặp.
2. **Trung bình.** Thay bộ định tuyến được học bằng một bộ định tuyến dựa trên hash (tất định, không học). So sánh chất lượng và cân bằng. Vì sao bộ định tuyến được học tốt hơn?
3. **Khó.** Triển khai "định tuyến khớp rollout" kiểu GRPO (thủ thuật DeepSeek-V3.2): ghi nhật ký những chuyên gia nào kích hoạt khi suy luận, ép cùng định tuyến khi tính gradient. Đo tác động trên một thiết lập policy-gradient đồ chơi.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Expert (Chuyên gia) | "Một FFN trong nhiều FFN" | Một mạng truyền xuôi độc lập; các tham số dành riêng cho một lát thưa của phép tính FFN. |
| Router (Bộ định tuyến) | "Cổng" | Một tầng tuyến tính tí hon chấm mỗi token với mỗi chuyên gia; lựa chọn top-k. |
| Top-k routing (Định tuyến top-k) | "k chuyên gia hoạt động mỗi token" | Phép tính FFN của mỗi token đi qua đúng k chuyên gia, được gán trọng số bởi cổng. |
| Auxiliary loss (Loss phụ) | "Phạt cân bằng tải" | Số hạng loss bổ sung phạt mức sử dụng chuyên gia lệch. |
| Auxiliary-loss-free (Không loss phụ) | "Thủ thuật của DeepSeek-V3" | Cân bằng qua bias theo chuyên gia chỉ trên lựa chọn của bộ định tuyến; không gradient bổ sung. |
| Shared expert (Chuyên gia dùng chung) | "Luôn bật" | Chuyên gia bổ sung mà mọi token đi qua; nắm bắt kiến thức chung. |
| Expert parallelism (Tính song song chuyên gia) | "Phân mảnh theo chuyên gia" | Phân phối các chuyên gia khác nhau đến các GPU khác nhau; định tuyến token qua mạng. |
| Sparsity (Tính thưa) | "Tham số hoạt động < tổng tham số" | Tỷ lệ $k \times \text{expert size} / (E \times \text{expert size})$; 37/671 ≈ 5.5% cho DeepSeek-V3. |

## Further Reading

- [Shazeer et al. (2017). Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer](https://arxiv.org/abs/1701.06538) — ý tưởng.
- [Fedus, Zoph, Shazeer (2022). Switch Transformer: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity](https://arxiv.org/abs/2101.03961) — Switch, MoE cổ điển.
- [Jiang et al. (2024). Mixtral of Experts](https://arxiv.org/abs/2401.04088) — Mixtral 8×7B.
- [DeepSeek-AI (2024). DeepSeek-V3 Technical Report](https://arxiv.org/abs/2412.19437) — MLA + MoE không loss phụ + MTP.
- [Wang et al. (2024). Auxiliary-Loss-Free Load Balancing Strategy for Mixture-of-Experts](https://arxiv.org/abs/2408.15664) — bài báo cân bằng dựa trên bias.
- [Dai et al. (2024). DeepSeekMoE: Towards Ultimate Expert Specialization in Mixture-of-Experts Language Models](https://arxiv.org/abs/2401.06066) — sự tách chi tiết + chuyên gia dùng chung mà bộ định tuyến bài học này sử dụng.
- [Kim et al. (2022). DeepSpeed-MoE: Advancing Mixture-of-Experts Inference and Training](https://arxiv.org/abs/2201.05596) — bài báo chuyên gia dùng chung gốc.
