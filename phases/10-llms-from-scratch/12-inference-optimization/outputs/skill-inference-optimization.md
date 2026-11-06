---
name: skill-inference-optimization
description: Diagnose and optimize LLM inference serving throughput, latency, and cost
version: 1.0.0
phase: 10
lesson: 12
tags: [inference, kv-cache, batching, speculative-decoding, vllm, optimization]
---

# LLM Inference Optimization Pattern

Hai giai đoạn: prefill (giới hạn tính toán, song song) và decode (giới hạn bộ nhớ, tuần tự).
Mọi tối ưu nhắm một hoặc cả hai.

```
Request -> Prefill (process prompt) -> Decode (generate tokens) -> Response
              |                            |
         Compute-bound               Memory-bound
         Optimize: fusion,           Optimize: batching,
         prefix caching              quantization, speculation
```

## Decision framework

### Step 1: Identify your bottleneck

Đo tỷ lệ ops:byte cho khối lượng công việc:

| ops:byte | Giới hạn | Cần tối ưu gì |
|----------|-------|-----------------|
| < 50 | Bộ nhớ | Lượng tử hóa KV cache, tăng kích thước batch |
| 50-200 | Chuyển tiếp | Cả hai quan trọng, bắt đầu với gom batch |
| > 200 | Tính toán | Hợp nhất kernel, song song tensor, FP8 |

### Step 2: Pick your engine

- **Mặc định**: vLLM (hỗ trợ mô hình rộng nhất, PagedAttention, API tương thích OpenAI)
- **Nhiều lượt / đầu ra có cấu trúc**: SGLang (prefix caching RadixAttention, giải mã có ràng buộc)
- **Thông lượng NVIDIA tối đa**: TensorRT-LLM (hợp nhất kernel, FP8 trên H100)

### Step 3: Apply optimizations in order

1. **KV cache** -- luôn bật, không nhược điểm
2. **Continuous batching** -- luôn bật, không nhược điểm (vLLM/SGLang làm theo mặc định)
3. **Prefix caching** -- bật nếu có system prompt chung (hầu hết chatbot có)
4. **Lượng tử hóa** -- KV cache INT8/FP8 giảm bộ nhớ 2-4x với mất chất lượng tối thiểu
5. **Speculative decoding** -- thêm khi độ trễ quan trọng hơn thông lượng
6. **Song song tensor** -- chia trên GPU khi mô hình không vừa trên một GPU

## KV cache memory formula

```
per_token = 2 * num_layers * num_kv_heads * head_dim * bytes_per_param
total = per_token * sequence_length * num_concurrent_users
```

Tham chiếu nhanh cho mô hình phổ biến (BF16):

| Mô hình | Mỗi token | 100 người dùng @ 4K |
|-------|-----------|----------------|
| Llama 3 8B | 32 KB | 12.5 GB |
| Llama 3 70B | 320 KB | 125 GB |
| Llama 3 405B | 504 KB | 197 GB |

## Speculative decoding checklist

- Mô hình nháp nên nhỏ hơn đích 5-10x (ví dụ 8B làm nháp cho 70B)
- Tỷ lệ chấp nhận > 70% để tăng tốc đáng kể
- Tốt nhất trên văn bản dễ đoán (mã, đầu ra có cấu trúc, ngôn ngữ tự nhiên)
- Tệ nhất trên tác vụ sáng tạo/nhiều lấy mẫu (temperature thấp giúp)
- EAGLE > nháp-đích > n-gram cho hầu hết khối lượng công việc

## Common mistakes

- Chạy decode ở batch=1 (giới hạn bộ nhớ, GPU nhàn rỗi 95% về tính toán)
- Cấp khối KV cache liên tục (dùng PagedAttention, đạt lãng phí gần không)
- Bỏ qua prefix caching khi 80% yêu cầu chung system prompt
- Cấp quá nhiều bộ nhớ GPU cho trọng số, không còn gì cho KV cache
- Đo thông lượng mà không đo độ trễ (thông lượng cao ở TTFT 10s vô dụng)
- Dùng speculative decoding với temperature cao (tỷ lệ chấp nhận giảm dưới 50%)

## Monitoring checklist

- Thời gian đến token đầu (TTFT): độ trễ prefill, mục tiêu < 500ms cho sử dụng tương tác
- Độ trễ giữa token (ITL): tốc độ decode, mục tiêu < 50ms cho streaming
- Thông lượng (token/giây): tổng trên mọi người dùng đồng thời
- Mức sử dụng KV cache: phần trăm cache đã cấp đang dùng
- Mức sử dụng batch: phần trăm chỗ batch được lấp mỗi lần lặp
- Độ sâu hàng đợi: yêu cầu đợi chỗ batch
