---
id: kv-pool-users-fit
title: How many users fit in the KV pool
card: inference-serving
kind: estimate
level: 2
roles: [inference-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [kv-cache, gpu-memory, capacity, max-model-len]
minutes: 10
lessons: [phases/07-transformers-deep-dive/12-kv-cache-flash-attention]
manuals: [vllm-101#s-count-the-memory-before-you-pick-a-gpu]
practice: []
cheatsheet: [serving-engines-compared]
related: [inference-serving/goodput-sets-the-cap]
updated: 2026-11-03
---

Bạn phục vụ `Qwen/Qwen3-8B` trên một GPU với độ dài mô hình tối đa là 8,192 token. Khi khởi động, máy chủ in mức đồng thời tối đa là 2.94, và một quản lý hỏi liệu GPU chỉ có thể phục vụ ba người dùng cùng lúc hay không. Người dùng của bạn gửi khoảng 512 token prompt và nhận lại khoảng 128 token. Bạn trả lời như thế nào?

## Short answer

Con số khởi động giả định rằng mỗi người dùng lấp đầy toàn bộ độ dài mô hình tối đa, và người dùng thực giữ ít hơn nhiều. Tính số byte KV cho một token, chia pool KV cho số đó, rồi chia pool cho ngữ cảnh mà một người dùng thực sự giữ. Trên L4 trong tài liệu vLLM, pool 24,096 token chứa được 37 người dùng với 640 token mỗi người.

## Full answer

### Bytes for one token

Mỗi token trong một yêu cầu đang chạy giữ các key và value của nó trong bộ nhớ GPU cho đến khi yêu cầu kết thúc:

```text
KV bytes per token = layers x KV heads x head size x 2 x bytes per value
```

Hệ số 2 tính key và value. `Qwen/Qwen3-8B` có 36 lớp, 8 đầu KV và kích thước đầu là 128. Trong BF16 một giá trị chiếm 2 byte, nên một token chiếm 144 KiB. Các đầu KV quyết định con số này, không phải số tham số: `Qwen/Qwen3-30B-A3B-Instruct-2507` có nhiều trọng số hơn nhưng chiếm 96 KiB cho mỗi token.

### From bytes to users

Máy chủ dành cho KV cache phần bộ nhớ còn lại sau trọng số và bước profile khi khởi động. Dòng pool trong log cho kết quả bằng token:

```text
GPU KV cache size: 24,096 tokens, Maximum concurrency for 8,192 tokens per request: 2.94x
```

Con số 2.94 chia pool cho toàn bộ 8,192 token. Một người dùng với 512 token prompt và 128 token đầu ra giữ 640 token ở cuối câu trả lời. Cùng pool đó chứa được 37 người dùng như vậy. Trong lượt quét tải, log cho thấy 40 yêu cầu đang chạy với cache đầy 99.5 phần trăm, vì người dùng ở đầu câu trả lời của họ giữ ít token hơn.

### What to change if it is still too small

1. Giảm độ dài mô hình tối đa xuống ngữ cảnh dài nhất mà người dùng gửi. Điều này ngăn một yêu cầu dài chiếm một phần lớn của pool. Nó không thêm người dùng ở đây, vì pool vẫn giữ nguyên.
2. Dùng KV cache FP8. Nó giảm một nửa số byte mỗi token.
3. Dùng trọng số FP8 để giải phóng bộ nhớ cho cache.
4. Dùng một GPU có nhiều bộ nhớ hơn, hoặc chia mô hình trên các GPU.

## Follow-ups

- **Level 2:** Điều gì xảy ra với một yêu cầu cần nhiều block hơn số còn trống? Expected: nó chờ trong hàng đợi. Một yêu cầu đang chạy cần một block khi không còn block trống sẽ bị dừng và được tính lại sau.
- **Level 2:** Tại sao mô hình mixture-of-experts dùng ít bộ nhớ KV mỗi token hơn mô hình dense? Expected: nó có ít đầu KV hơn, và các đầu KV, không phải trọng số, quyết định số byte mỗi token.
- **Level 3:** Bạn kiểm tra phép tính của mình sau khi khởi động như thế nào? Expected: đọc dòng bộ nhớ và dòng pool trong log khởi động, và so sánh chúng với phép tính từ cấu hình mô hình.
- **Level 3:** Chi phí của KV cache FP8 là gì? Expected: khả năng mất chất lượng, nên đo nó trên bộ đánh giá riêng của bạn trước khi triển khai.

## Wrong answers

- "Chia bộ nhớ GPU cho kích thước mô hình." Trọng số chỉ là một phần. Số người dùng chứa được phụ thuộc vào pool KV và ngữ cảnh mỗi người dùng.
- "Mức đồng thời tối đa trong log là giới hạn người dùng." Nó giả định rằng mỗi người dùng lấp đầy độ dài mô hình tối đa, điều mà người dùng thực không làm.
- "Nhiều tham số hơn luôn có nghĩa là nhiều bộ nhớ KV mỗi token hơn." Số byte mỗi token phụ thuộc vào các lớp, các đầu KV và kích thước đầu.

## Taught in

[Phần bộ nhớ của vLLM 101](../../../manuals/vllm-101/sections/2-1-count-the-memory-before-you-pick-a-gpu.md) tính pool từ log khởi động, và [bài học KV cache](../../../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/) xây dựng cache.
