---
name: skill-latency-profiler
description: Write a complete latency-benchmarking script with warmup, synchronisation, percentiles, and memory tracking
version: 1.0.0
phase: 4
lesson: 15
tags: [edge, deployment, profiling, benchmarking]
---

# Latency Profiler

Tạo một phép đo hiệu năng độ trễ có kỷ luật cho bất kỳ mô hình PyTorch nào. Các báo cáo mà bất kỳ ai phía sau thực sự có thể tin.

## When to use

- So sánh nhiều backbone ứng viên trước khi chọn một để triển khai.
- Trước và sau lượng tử hóa hoặc cắt tỉa.
- Sau một thay đổi runtime (eager so với ONNX so với TensorRT).
- Tạo một báo cáo sẵn sàng triển khai.

## Inputs

- `model`: `nn.Module` PyTorch.
- `input_shape`: tuple như `(1, 3, 224, 224)`.
- `device`: `cpu` | `cuda` | `mps`.
- `warmup`: mặc định 10.
- `iters`: mặc định 100.

## Checks

### 1. Warmup
Chạy mô hình `warmup` lần không đo thời gian. Bao quát biên dịch JIT lượt đầu và các hiệu ứng cache lạnh.

### 2. Synchronisation
Với `cuda`, gọi `torch.cuda.synchronize()` trước và sau mỗi lượt truyền xuôi được đo thời gian.
Với `mps`, gọi `torch.mps.synchronize()`.

### 3. Timer
Sử dụng `time.perf_counter()` để đo thời gian thực. Chuyển sang mili giây.

### 4. Percentiles
Sắp xếp toàn bộ danh sách thời gian. Báo cáo `p50, p90, p95, p99, mean, std`.

### 5. Memory
Với `cuda`, gọi `torch.cuda.max_memory_allocated()` sau lần chạy và trừ mọi mức cơ sở.
Với `cpu`, sử dụng `tracemalloc` hoặc `psutil.Process().memory_info().rss` trước và sau.

### 6. Batch-size sweep
Tùy chọn lặp phép đo cho `batch_size in [1, 4, 16, 32]` để làm lộ các đánh đổi thông lượng với độ trễ.

## Output template

```python
import time
import torch
import psutil, os

def profile(model, input_shape, device="cpu", warmup=10, iters=100):
    proc = psutil.Process(os.getpid())
    baseline_rss = proc.memory_info().rss / 1e6

    model = model.to(device).eval()
    x = torch.randn(input_shape, device=device)

    def sync():
        if device == "cuda":
            torch.cuda.synchronize()
        elif device == "mps":
            torch.mps.synchronize()

    with torch.no_grad():
        for _ in range(warmup):
            model(x)
        sync()
        if device == "cuda":
            torch.cuda.reset_peak_memory_stats()

        times = []
        for _ in range(iters):
            sync()
            t0 = time.perf_counter()
            model(x)
            sync()
            times.append((time.perf_counter() - t0) * 1000)

    times.sort()
    mean = sum(times) / len(times)
    std  = (sum((t - mean) ** 2 for t in times) / len(times)) ** 0.5

    def pct(p):
        idx = max(0, min(len(times) - 1, int(len(times) * p) - 1))
        return times[idx]

    report = {
        "p50_ms":  pct(0.50),
        "p90_ms":  pct(0.90),
        "p95_ms":  pct(0.95),
        "p99_ms":  pct(0.99),
        "mean_ms": mean,
        "std_ms":  std,
        "rss_mb":  proc.memory_info().rss / 1e6 - baseline_rss,
    }
    if device == "cuda":
        report["peak_cuda_mb"] = torch.cuda.max_memory_allocated() / 1e6

    return report
```

## Rules

- Luôn chạy warmup; không bao giờ tin thời gian lượt truyền xuôi đầu.
- Các phân vị, không phải trung bình — một ngoại lệ có thể gấp đôi trung bình nhưng hầu như không dịch p50.
- Sử dụng cùng input_shape như production; độ trễ trên 224x224 không phải độ trễ trên 384x384.
- Với CUDA, không bao giờ bỏ `torch.cuda.synchronize()`; các số vô nghĩa nếu không có.
- Ghi phiên bản torch, phiên bản CUDA và tên thiết bị cạnh các số — nếu không chúng không còn so sánh được.
