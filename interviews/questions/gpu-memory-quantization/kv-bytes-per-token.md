---
id: kv-bytes-per-token
title: Count the KV bytes per token from the config
card: gpu-memory-quantization
kind: estimate
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [screen, ml-depth]
tags: [kv-cache, bytes-per-token, grouped-query-attention, mla, capacity]
minutes: 8
lessons: []
manuals: [vllm-101#s-count-the-memory-before-you-pick-a-gpu, sglang-101#s-kv-bytes-per-token-and-the-kv-pool, sglang-101#s-quantization]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Bạn được cho hai cấu hình mô hình. Mô hình A: 36 lớp, 8 KV head, kích thước head 128. Mô hình B: 48 lớp, 4 KV head, kích thước head 128, và gần gấp bốn tham số. Ước tính byte KV cache mỗi token của mỗi mô hình ở BF16, nói mô hình nào vừa nhiều người dùng hơn trong một KV pool cùng kích thước, và giải thích tại sao số tham số làm bạn hiểu lầm nếu có.

## Short answer

Byte KV mỗi token là 2 nhân số lớp nhân KV head nhân kích thước head nhân byte mỗi giá trị, trong đó 2 đếm key và value. Mô hình A, là Qwen/Qwen3-8B, giữ 2 x 36 x 8 x 128 x 2 byte, là 144 KiB mỗi token; mô hình B, là Qwen/Qwen3-30B-A3B, giữ 2 x 48 x 4 x 128 x 2 byte, là 98,304 byte hoặc 96 KiB. Mô hình lớn hơn giữ ít byte mỗi token hơn và vừa nhiều người dùng hơn trong cùng pool, vì KV head và các lớp quyết định chi phí và số tham số không quyết định. Trên một card mô hình lớn hơn cũng cần chỗ cho các trọng số lớn gần gấp bốn, vì vậy pool của nó nhỏ hơn, và nó có thể vừa ít người dùng hơn tổng thể.

## Full answer

### The formula, checked against a log

```text
KV bytes per token = 2 x layers x KV heads x head size x bytes per value
```

Đọc ba số đầu từ cấu hình mô hình dưới dạng `num_hidden_layers`, `num_key_value_heads` và `head_dim`. Ở BF16 một giá trị chiếm 2 byte; với cache FP8 nó chiếm 1 byte. SGLang in kết quả lúc khởi động. Với Qwen3-0.6B log nói `bytes_per_slot=114688`, và dòng pool đưa mọi số hạng: 28 lớp, 8 KV head, một chiều head 128 và bfloat16. Tích là 2 x 28 x 8 x 128 x 2, là 114,688 byte hoặc 112 KiB. Công thức và log đồng ý đến từng byte.

### The same arithmetic on public configs

| Mô hình | Attention | Byte mỗi token ở BF16 | Mỗi GPU |
|---|---|---|---|
| Qwen3-0.6B | GQA, 28 lớp, 8 KV head | 112 KiB | 112 KiB trên một GPU |
| Qwen3-8B | GQA, 36 lớp, 8 KV head | 144 KiB | 144 KiB trên một GPU |
| Qwen3-30B-A3B | GQA, 48 lớp, 4 KV head | 96 KiB | 96 KiB trên một GPU |
| Llama-3.1-8B | GQA, 32 lớp, 8 KV head | 128 KiB | 128 KiB trên một GPU |
| Llama-3.1-70B | GQA, 80 lớp, 8 KV head | 320 KiB | 40 KiB với tensor parallelism 8 chiều |
| DeepSeek-V3 | MLA, 61 lớp, latent 512 cộng 64 | 68.6 KiB | 68.6 KiB trên mọi GPU |

Hai kết quả làm phần lớn mọi người ngạc nhiên. Một mô hình 0.6B tốn gần như bằng mỗi token với một mô hình 8B. Một cuộc hội thoại 100,000 token trên Llama-3.1-8B giữ 12.2 GiB KV, gần với kích thước các trọng số.

### Why parameters mislead

Với grouped-query attention nhiều query head dùng chung một key và value head, vì vậy các mô hình hiện đại có ít KV head hơn nhiều so với attention head, và số KV head là một lựa chọn thiết kế không theo số tham số. Mô hình mixture-of-experts có trọng số gần gấp bốn mô hình dense 8B và giữ hai phần ba số byte mỗi token của nó.

Multi-head latent attention lưu một latent nén mỗi token thay vì các key và value riêng mỗi head. Nó nhỏ mỗi token, nhưng mọi rank tensor-parallel lưu latent đầy đủ, vì vậy thêm GPU bằng tensor parallelism không thêm token.

### Turn bytes into a pool

Engine cho cache phần còn lại sau trọng số và profile khởi động. Trên GB10 với mô hình 30B, 31.32 GiB bộ nhớ KV ở 96 KiB mỗi token giữ khoảng 342,000 token. Trên L4 với Qwen3-8B, một pool 24,096 token ở 144 KiB là 3.31 GiB. Chia pool cho ngữ cảnh một người dùng giữ, prompt cộng đầu ra, để có số người dùng vừa. Một cache FP8 giảm một nửa byte: với mô hình 30B mỗi token chiếm 49,152 byte thay vì 98,304, và cùng với trọng số FP8 pool GB10 tăng từ 227,243 lên 1,083,008 token.

### Where to read it

vLLM in `Available KV cache memory` và `GPU KV cache size` với mức đồng thời tối đa tại độ dài đầy đủ. SGLang in `bytes_per_slot` hoặc dòng `KV Cache is allocated` với số token, và `max_total_num_tokens` là kết quả toàn bộ phép tính. Kiểm tra con số được tính và log đồng ý trước khi lập kế hoạch.

## Follow-ups

- **Level 2:** Qwen3-0.6B có 28 lớp và 8 KV head với kích thước head 128. Một token tốn gì, và log nói gì? Expected: 2 x 28 x 8 x 128 x 2 byte, 114,688 byte hoặc 112 KiB; log khởi động in bytes_per_slot=114688, vì vậy công thức và log đồng ý đến từng byte.
- **Level 3:** Một mô hình dense 70B với 80 lớp và 8 KV head được chia qua 8 GPU bằng tensor parallelism. Mỗi GPU giữ gì mỗi token? Expected: tổng cộng 320 KiB và 40 KiB trên mỗi GPU, vì tensor parallelism chia các KV head qua các rank.
- **Level 4:** Tại sao cùng cách chia không giúp một mô hình latent-attention? Expected: attention đó lưu một latent nén mỗi token, khoảng 68.6 KiB cho mô hình 61 lớp, không thể chia qua các head; mọi rank lưu latent đầy đủ, vì vậy tám GPU giữ tám bản sao và không thêm token.

## Wrong answers

- "Một mô hình lớn hơn luôn cần thêm KV cache mỗi token." Số lớp và các KV head quyết định chi phí; mô hình expert 30B giữ 96 KiB mỗi token so với 144 KiB cho mô hình dense 8B.
- "Một mô hình nhỏ cần một cache nhỏ." Qwen3-0.6B giữ 112 KiB mỗi token, gần bằng một mô hình 8B, vì có 28 lớp và 8 KV head.
- "Tensor parallelism luôn thêm dung lượng KV." Nó chia các KV head của một mô hình grouped-query, nhưng một mô hình latent-attention lưu latent đầy đủ trên mọi rank, vì vậy thêm rank không thêm token.
- "Đếm trọng số và trừ khỏi card để lấy cache." Engine cũng giữ một profile khởi động và bộ nhớ graph; đọc bộ nhớ KV khả dụng và kích thước pool trong log khởi động, rồi chia cho byte mỗi token.

## Taught in

[Đếm bộ nhớ trước khi chọn GPU](../../../manuals/vllm-101/sections/2-1-count-the-memory-before-you-pick-a-gpu.md) và [KV pool và byte mỗi token](../../../manuals/sglang-101/sections/3-1-kv-bytes-per-token-and-the-kv-pool.md) suy ra công thức và kiểm tra nó với các log, và [phần lượng tử hóa SGLang](../../../manuals/sglang-101/sections/4-3-quantization.md) giảm một nửa nó bằng FP8.
