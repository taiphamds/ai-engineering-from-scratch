# Gradient Checkpointing and Activation Recomputation

> Backprop giữ mọi activation trung gian. Ở 70B tham số và ngữ cảnh 128K, đó là 3 TB activation mỗi rank. Checkpointing đánh đổi FLOPs lấy bộ nhớ: tính lại thay vì lưu. Câu hỏi là nên bỏ các đoạn nào, và câu trả lời không phải "tất cả chúng."

**Type:** Build
**Languages:** Python (with numpy, optional torch)
**Prerequisites:** Phase 10 Lesson 04 (Pre-Training Mini-GPT), Phase 10 Lesson 05 (Scaling & Distributed)
**Time:** ~70 minutes

## The Problem

Huấn luyện một transformer lưu, cho mỗi lớp, đầu vào của mọi phép toán được lấy đạo hàm trong backward: đầu vào attention, các phép chiếu Q/K/V, đầu ra softmax, đầu vào FFN, đầu ra norm và luồng residual. Với một lớp có kích thước ẩn `d`, độ dài chuỗi `L`, batch `B`, con số này vào khoảng `12 * B * L * d` số thực dấu phẩy động mỗi lớp.

Với `d=8192, L=8192, B=1`, đó là khoảng 805M giá trị, hoặc 1.6 GB/lớp trong BF16. Một mô hình 64 lớp có khoảng 103 GB activation, và đó là trước khi bạn nhân với kích thước microbatch, trước khi thêm các giá trị trung gian attention-softmax (`L^2` mỗi head), và trước khi tính đến các bản sao bộ phận của tensor parallel.

Hóa đơn hai phía: trọng số BF16 cộng trạng thái bộ tối ưu có thể vừa 80GB, nhưng activation đẩy bạn vượt quá. Gradient checkpointing (còn gọi là tính lại activation) là cách khắc phục tiêu chuẩn. Bỏ phần lớn activation; làm lại forward trong backward để lấy chúng lại. Chi phí: thêm FLOPs. Lợi ích: bộ nhớ giảm theo tỷ lệ giữa các đoạn checkpoint và tổng số lớp.

Làm một cách đơn giản, checkpointing tốn thêm khoảng 33% FLOPs forward-pass mỗi bước. Làm tốt — checkpointing chọn lọc theo "lựa chọn thông minh" của Korthikanti và cộng sự — bạn tiết kiệm bộ nhớ 5x với chi phí FLOP bổ sung dưới 5%. Và với các matmul FP8, offload FSDP và MoE expert-parallel, điều này thực sự quan trọng: bạn không thể chịu được cả bộ nhớ lẫn tính toán lãng phí.

## The Concept

### What Backward Actually Needs

`output = layer(input)`. Backward muốn `grad_input` và `grad_params`. Để tính chúng, nó cần:

- `input` (để tính `grad_params = input.T @ grad_output` cho các lớp tuyến tính)
- một số giá trị trung gian đạo hàm activation (đạo hàm của ReLU/GELU/softmax phụ thuộc vào giá trị activation)

Forward pass tự động lưu chúng trong đồ thị autograd. Mỗi `tensor.retain_grad()` và mọi phép toán cần đầu vào của nó đều giữ một tham chiếu.

### Naive Full Checkpointing

Chia mạng thành `N` đoạn. Trong forward, chỉ lưu *đầu vào* của mỗi đoạn. Khi backward cần các giá trị trung gian, chạy lại forward pass của đoạn để tạo lại chúng, rồi lấy đạo hàm.

Ví dụ: transformer 32 lớp chia thành 32 đoạn, mỗi đoạn 1 lớp.

- Bộ nhớ: 32 đầu vào lớp (nhỏ) so với 32 * (dung lượng activation mỗi lớp) (khổng lồ).
- Tính toán bổ sung: 1 forward bổ sung mỗi đoạn, tức là tổng FLOPs forward nhiều hơn ~33% (vì backward bằng 2x forward, bước đầy đủ trở thành 1 + 1 + 2 = 4 đơn vị thay vì 1 + 2 = 3).

Đây là công thức gốc của Chen và cộng sự năm 2016: một checkpoint mỗi `sqrt(L)` lớp để cân bằng bộ nhớ và tính toán. Với $L=64$, đó là 8 checkpoint.

### Selective Checkpointing (Korthikanti 2022)

Không phải mọi activation đều có chi phí như nhau. Đầu ra attention softmax là `B*L*L*heads` và tăng *bậc hai* theo độ dài chuỗi. Activation ẩn FFN là `B*L*4d` và tăng tuyến tính. Với các chuỗi dài, softmax chiếm ưu thế.

Checkpointing chọn lọc giữ các activation có chi phí lưu thấp (các phép chiếu tuyến tính, residual) và chỉ tính lại các activation tốn kém (attention). Bạn trả FLOPs tối thiểu để tính lại nhưng tiết kiệm bộ nhớ $O(L^2)$.

Megatron-Core triển khai điều này dưới dạng tính lại activation "chọn lọc". Được dùng trong phần lớn lượt huấn luyện tiên tiến nhất từ năm 2024 trở đi.

### Offload

Phương án thay thế tính lại: chuyển activation sang RAM CPU giữa forward và backward. Cần băng thông PCIe; có lợi khi băng thông nhàn rỗi vượt chi phí tạo lại. Các chiến lược kết hợp là phổ biến: checkpoint một số lớp, offload các lớp khác.

FSDP2 cung cấp offload như một tùy chọn hạng nhất. Offload nổi trội khi GPU bị nghẽn ở bộ nhớ nhưng truyền CPU-GPU còn dư khả năng.

### Recompute Cost Model

FLOPs mỗi bước với checkpointing đơn giản mỗi `k` lớp trong tổng `L`:

```
flops_fwd_normal = L * f_layer
flops_bwd_normal = 2 * L * f_layer
flops_total_normal = 3 * L * f_layer

flops_fwd_ckpt = L * f_layer
flops_recompute = L * f_layer  # one extra forward per layer in the segment
flops_bwd_ckpt = 2 * L * f_layer
flops_total_ckpt = 4 * L * f_layer
overhead = 4 / 3 - 1 = 0.33 = 33%
```

Với checkpointing chọn lọc, bạn chỉ tính lại kernel attention, không phải toàn bộ lớp:

```
flops_recompute_selective = L * f_attention ~= L * f_layer * 0.15
overhead_selective = (3 + 0.15) / 3 - 1 = 0.05 = 5%
```

### Memory Savings Model

Dung lượng activation mỗi lớp: `A`. Với `L` lớp, tổng bộ nhớ activation: `L * A`.

Checkpoint đầy đủ (kích thước đoạn 1): chỉ lưu `L * input_volume` (~`L * 1/10 A` với transformer tiêu chuẩn). Tiết kiệm ~`9 * L * A * 1/10`.

Checkpoint mỗi `k` lớp: lưu `L/k * A` cộng lượng tương đương `k-1` lớp bên trong đoạn đang hoạt động.

Ở `k = sqrt(L)`, bộ nhớ và chi phí tính lại đều tăng theo `sqrt(L)` — đánh đổi tối ưu cho các lớp có chi phí đồng đều.

### When Not to Checkpoint

- Các lớp trong cùng của một stage pipeline đã đang thực hiện. Dù sao chúng cũng phải hoàn tất.
- Các lớp đầu và cuối nếu chúng chiếm ưu thế trong tính toán của stage (hiếm trong transformer).
- Các kernel attention đã dùng FlashAttention — Flash đã tính lại softmax nhanh, nên checkpointing bổ sung ở cấp lớp thêm được ít lợi ích.

### Implementation Patterns

1. **Wrapper hàm:** bọc một đoạn trong `torch.utils.checkpoint.checkpoint(fn, input)`. PyTorch chỉ lưu `input`, tính lại mọi thứ khác trong backward.

2. **Dựa trên decorator:** đánh dấu các lớp là có thể checkpoint; trainer quyết định ở thời điểm cấu hình những đoạn nào được bọc.

3. **Tính lại tường minh thủ công:** tự viết backward pass, gọi một `recompute_forward` tùy chỉnh lặp lại forward với đầu vào đã lưu.

Cả ba cho cùng kết quả chức năng. Wrapper là cách dùng tiêu chuẩn.

### Interaction with TP / PP / FP8

- **Tensor parallel:** đầu vào checkpoint phải được gather hoặc scatter lại khi tính lại; xử lý chi phí giao tiếp.
- **Pipeline parallel:** mẫu điển hình là checkpoint forward của mỗi stage pipeline để các microbatch theo thứ tự ngược có thể tái sử dụng bộ nhớ activation.
- **Tính lại FP8:** lịch sử amax được cập nhật trong tính lại phải khớp với forward gốc, nếu không thì tỷ lệ FP8 bị trôi. Phần lớn framework chụp lại tỷ lệ.

```figure
activation-recompute
```

## Build It

### Step 1: A Toy Model With Segments

```python
import numpy as np


def linear_forward(x, w, b):
    return x @ w + b


def relu(x):
    return np.maximum(x, 0)


def layer_forward(x, w1, b1, w2, b2):
    h = relu(linear_forward(x, w1, b1))
    return linear_forward(h, w2, b2)


def model_forward(x, params):
    activations = [x]
    h = x
    for w1, b1, w2, b2 in params:
        h = layer_forward(h, w1, b1, w2, b2)
        activations.append(h)
    return h, activations
```

### Step 2: Naive Backward Needing All Activations

```python
def model_backward(grad_output, activations, params):
    grads = [None] * len(params)
    g = grad_output
    for i in range(len(params) - 1, -1, -1):
        w1, b1, w2, b2 = params[i]
        x_in = activations[i]
        h_pre = linear_forward(x_in, w1, b1)
        h = relu(h_pre)
        gh = g @ w2.T
        gw2 = h.T @ g
        gb2 = g.sum(axis=0)
        g_pre = gh * (h_pre > 0)
        gx = g_pre @ w1.T
        gw1 = x_in.T @ g_pre
        gb1 = g_pre.sum(axis=0)
        grads[i] = (gw1, gb1, gw2, gb2)
        g = gx
    return g, grads
```

### Step 3: Checkpoint-Every-k Memory

```python
def model_forward_checkpointed(x, params, k=4):
    saved_inputs = [x]
    h = x
    for i, (w1, b1, w2, b2) in enumerate(params):
        h = layer_forward(h, w1, b1, w2, b2)
        if (i + 1) % k == 0:
            saved_inputs.append(h)
    return h, saved_inputs


def model_backward_checkpointed(grad_output, saved_inputs, params, k=4):
    grads = [None] * len(params)
    g = grad_output
    segments = [(j * k, min((j + 1) * k, len(params))) for j in range(len(saved_inputs))]
    for seg_idx in range(len(saved_inputs) - 1, -1, -1):
        start, end = segments[seg_idx]
        if start >= end:
            continue
        x_in = saved_inputs[seg_idx]
        _, seg_acts = model_forward(x_in, params[start:end])
        g, seg_grads = model_backward(g, seg_acts, params[start:end])
        for j, gr in enumerate(seg_grads):
            grads[start + j] = gr
    return g, grads
```

### Step 4: Cost Model

```python
def checkpoint_cost(n_layers, segment_size, flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }


def selective_checkpoint_cost(n_layers, attention_fraction=0.15,
                              flops_per_layer=1.0):
    fwd = n_layers * flops_per_layer
    recompute = n_layers * attention_fraction * flops_per_layer
    bwd = 2 * n_layers * flops_per_layer
    return {
        "fwd": fwd,
        "recompute": recompute,
        "bwd": bwd,
        "total": fwd + recompute + bwd,
        "overhead_vs_no_ckpt": (fwd + recompute + bwd) / (fwd + bwd) - 1.0,
    }
```

### Step 5: Memory Estimator

```python
def activation_memory_mb(n_layers, hidden=8192, seq=8192,
                        batch=1, bytes_per_value=2):
    per_layer = 12 * batch * seq * hidden * bytes_per_value
    return n_layers * per_layer / 1e6


def memory_after_checkpoint(n_layers, segment_size, hidden=8192,
                           seq=8192, batch=1, bytes_per_value=2):
    n_seg = max(1, n_layers // segment_size)
    saved = (n_seg + segment_size) * 1 * batch * seq * hidden * bytes_per_value
    return saved / 1e6
```

### Step 6: Optimal Segment Size

```python
def optimal_segment(n_layers):
    return int(round(np.sqrt(n_layers)))
```

### Step 7: Selective Checkpoint Decision

```python
def should_recompute(layer_type, activation_bytes, recompute_flops_ratio):
    if layer_type == "attention" and activation_bytes > 100 * 1e6:
        return True
    if layer_type == "ffn" and activation_bytes > 500 * 1e6:
        return recompute_flops_ratio < 0.1
    return False
```

## Use It

- **torch.utils.checkpoint**: `from torch.utils.checkpoint import checkpoint` — wrapper chuẩn trong PyTorch. Bọc một hàm; chỉ lưu đầu vào, tính lại trong backward.
- **Tính lại activation Megatron-Core**: hỗ trợ các chế độ `selective`, `full` và `block`. Tiêu chuẩn trong huấn luyện tiên tiến nhất từ năm 2024 trở đi.
- **Offload FSDP2**: `module.to_empty(device="cpu")` với `offload_policy` trong FSDP2 phân mảnh activation sang CPU thay vì tính lại.
- **DeepSpeed ZeRO-Offload**: offload CPU cho trạng thái bộ tối ưu và activation, bổ sung cho checkpointing.

## Ship It

Bài học này tạo ra `outputs/prompt-activation-recompute-policy.md` — một prompt nhận cấu hình mô hình của bạn (số lớp, kích thước ẩn, độ dài chuỗi, batch) và bộ nhớ GPU sẵn có rồi xuất chính sách tính lại theo từng lớp (không / chọn lọc / đầy đủ / offload).

## Exercises

1. Xác minh tính đúng đắn. Chạy `model_forward` + `model_backward` (activation đầy đủ) so với `model_forward_checkpointed` + `model_backward_checkpointed` (các đoạn). Gradient tham số phải giống hệt đến độ chính xác máy.

2. Quét kích thước đoạn `k` từ 1 đến `L`. Vẽ chi phí FLOP bổ sung và bộ nhớ. Tìm điểm gối của đường cong.

3. Triển khai checkpointing chọn lọc: lưu đầu vào mô-đun attention nhưng không lưu các giá trị trung gian của nó. Đo chi phí FLOP bổ sung so với checkpointing toàn bộ lớp cho mô hình 32 lớp ở seq=8192.

4. Thêm offload. Lưu đầu vào đoạn vào một "bộ đệm CPU" mô phỏng (một danh sách riêng). Đo "băng thông PCIe" dưới dạng byte/thời gian và tìm điểm hòa vốn giữa offload và tính lại.

5. Benchmark một transformer PyTorch thực với và không có `torch.utils.checkpoint`. Đo bộ nhớ (qua `torch.cuda.max_memory_allocated`) và thời gian bước.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|----------------------|
| Gradient checkpointing (Checkpointing gradient) | "Tiết kiệm bộ nhớ bằng cách làm lại forward" | Chỉ lưu đầu vào đoạn; tính lại các giá trị trung gian trong backward để lấy các tensor hỗ trợ gradient |
| Activation recomputation (Tính lại activation) | "Giống checkpointing" | Tên gọi mang phong cách HPC cho cùng kỹ thuật |
| Segment size (k) (Kích thước đoạn) | "Bao nhiêu lớp mỗi checkpoint" | Số lớp có các giá trị trung gian bị bỏ và được tạo lại cùng nhau |
| Selective checkpointing (Checkpointing chọn lọc) | "Mẹo của Korthikanti" | Chỉ tính lại các activation tốn kém để lưu (attention softmax); giữ các activation có chi phí thấp |
| Full checkpointing (Checkpointing đầy đủ) | "Phiên bản đơn giản" | Tính lại các giá trị trung gian của mọi lớp trong mỗi đoạn |
| Block checkpointing (Checkpointing khối) | "Mức thô" | Checkpoint các khối transformer nguyên vẹn; mức hạt lớn nhất |
| FLOP overhead (Chi phí FLOP bổ sung) | "Thuế tính toán" | FLOPs bổ sung mỗi bước = (FLOPs tính lại) / (FLOPs fwd + bwd); 33% đơn giản, 5% chọn lọc |
| Activation offload (Offload activation) | "Chuyển sang CPU" | Chuyển activation sang RAM CPU qua forward->backward; phương án thay thế tính lại |
| sqrt-L rule (Quy tắc sqrt-L) | "Điểm tối ưu cổ điển" | Với các lớp có chi phí đồng đều, khoảng cách checkpoint tối ưu là $\sqrt{L}$ lớp |
| Attention-softmax volume (Dung lượng attention-softmax) | "Vấn đề O(L^2)" | $L^2 \cdot \text{heads} \cdot \text{batch}$ số thực dấu phẩy động; chiếm ưu thế trong bộ nhớ activation ở ngữ cảnh dài |

## Further Reading

- [Chen et al., 2016 -- "Training Deep Nets with Sublinear Memory Cost"](https://arxiv.org/abs/1604.06174) -- bài báo gốc chính thức hóa gradient checkpointing
- [Korthikanti et al., 2022 -- "Reducing Activation Recomputation in Large Transformer Models"](https://arxiv.org/abs/2205.05198) -- tính lại activation chọn lọc và phân tích chi phí hình thức
- [Pudipeddi et al., 2020 -- "Training Large Neural Networks with Constant Memory using a New Execution Algorithm"](https://arxiv.org/abs/2002.05645) -- cách tiếp cận bộ nhớ hằng số thay thế qua tạo lại chế độ ngược
- [Ren et al., 2021 -- "ZeRO-Offload: Democratizing Billion-Scale Model Training"](https://arxiv.org/abs/2101.06840) -- offload activation ở quy mô lớn
- [PyTorch torch.utils.checkpoint docs](https://pytorch.org/docs/stable/checkpoint.html) -- API tiêu chuẩn
- [Megatron Bridge activation recomputation documentation](https://docs.nvidia.com/nemo/megatron-bridge/latest/training/activation-recomputation.html) -- các chế độ chọn lọc, đầy đủ và khối
