---
id: the-kv-cache-trap
title: The model is 35 GB now, so it fits
card: gpu-memory-quantization
kind: concept
level: 1
roles: [inference-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [kv-cache, gpu-memory, quantization, capacity]
minutes: 5
lessons: [phases/17-infrastructure-and-production/09-production-quantization]
manuals: [vllm-101#s-count-the-memory-before-you-pick-a-gpu, sglang-101#s-kv-bytes-per-token-and-the-kv-pool]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một đồng đội nói: chúng ta lượng tử hóa mô hình 70B thành 4-bit, vì vậy giờ nó là 35 GB và vừa trên một card 80 GB còn dư chỗ. Câu đó thiếu gì?

## Short answer

KV cache. Lượng tử hóa trọng số thu nhỏ trọng số, và cache cho các request đang chạy là một ngân sách riêng giữ ở BF16 hoặc FP8 và tăng theo mọi token đang xử lý; tại 128 request đồng thời với ngữ cảnh 2k bài học đặt nó gần 20 GB cho một mô hình 70B, cộng khoảng 5 GB activation, vì vậy tổng khoảng 60 GB trên card 80 GB. Mức 20 GB đó là con số thô của bài học, vì vậy kiểm tra với cấu hình: Llama-3.1-70B giữ 320 KiB mỗi token ở BF16, và 128 request đầy đủ 2k token rồi cần khoảng gấp bốn con số bài học, không vừa cạnh trọng số trên một card 80 GB. Đếm trọng số, cache tại mức đồng thời và ngữ cảnh đỉnh, và activation cùng nhau, và đọc kích thước pool trong log khởi động sau khi khởi động.

## Full answer

### The budget has three parts

Phép đếm riêng của bài học cho một mô hình 70B với trọng số 4-bit:

| Phần | Kích thước |
|---|---|
| Trọng số, 4-bit từ 140 GB ở FP16 | khoảng 35 GB |
| KV cache tại 128 request đồng thời với ngữ cảnh 2k | khoảng 20 GB |
| Activation | khoảng 5 GB |
| Tổng | khoảng 60 GB |

Câu "giờ nó là 35 GB" quên cache và activation. Lập ngân sách cả card, và đếm cache từ cấu hình mô hình: Llama-3.1-70B giữ 320 KiB mỗi token ở BF16, vì vậy tại ngữ cảnh 2k đầy đủ chỉ cache đã khoảng gấp bốn mức 20 GB trong bảng.

### Where the cache goes

Mọi token trong một request đang chạy giữ key và value trong bộ nhớ GPU cho đến khi request kết thúc. Byte mỗi token đến từ bốn số trong cấu hình mô hình: số lớp nhân KV head nhân kích thước head nhân 2 cho key và value, nhân byte mỗi giá trị. Qwen3-8B giữ 144 KiB mỗi token ở BF16 và Qwen3-30B-A3B giữ 96 KiB, vì KV head quyết định con số và số tham số không quyết định. Engine cho cache phần còn lại sau trọng số và profile khởi động, và số người dùng vừa là pool chia ngữ cảnh một người giữ, prompt cộng đầu ra. Trên GB10 trọng số mô hình 30B chiếm 56.93 GiB, 31.32 GiB còn cho cache, và tại 96 KiB mỗi token đó là khoảng 342,000 token.

### KV quantization is its own decision

Một cache FP8 giảm một nửa byte mỗi token, tăng gấp đôi người dùng ở cùng độ dài. Nó là một lựa chọn riêng với định dạng trọng số, có scale riêng và tác động riêng lên giá trị attention, vì vậy cần phép kiểm tra độ chính xác riêng. Lượng tử hóa trọng số không thu nhỏ cache.

### How to fit more, in order of cost

1. Hạ độ dài mô hình tối đa đến request thật dài nhất. Điều này không tăng pool, nhưng ngăn một request đòi tất cả.
2. Dùng một KV cache FP8.
3. Dùng trọng số FP8 hoặc 4-bit, giải phóng bộ nhớ cho cache.
4. Dùng một GPU có thêm bộ nhớ, hoặc chia mô hình.

### Read the log

Đọc hai dòng sau mỗi khởi động: dòng nạp trọng số và dòng bộ nhớ KV cache khả dụng. Dòng pool rồi cho token và mức đồng thời tối đa tại độ dài đầy đủ, giả định mọi người dùng lấp tối đa; người dùng thật giữ ít hơn, vì vậy nhiều hơn vừa.

## Follow-ups

- **Level 1:** Ba thứ nào chiếm bộ nhớ trên một GPU phục vụ? Expected: trọng số, KV cache cho các token đang xử lý, và activation cùng bộ nhớ làm việc khởi động; engine cho cache phần còn lại sau hai thứ khác.
- **Level 2:** KV cache tăng theo gì? Expected: số request đang chạy và ngữ cảnh mỗi request giữ, prompt cộng đầu ra, vì vậy nó tăng theo mức đồng thời và độ dài, không theo trọng số.
- **Level 3:** Lượng tử hóa trọng số thành 4-bit và cache thành FP8 là các quyết định khác nhau. Tại sao? Expected: trọng số là chi phí cố định và lượng tử hóa chúng thay đổi tính toán ma trận; cache theo token và lượng tử hóa nó thay đổi trực tiếp giá trị attention, vì vậy cần phép kiểm tra độ chính xác và scale riêng.
- **Level 4:** Ở đâu trong log khởi động bạn xác nhận ngân sách giữ đúng? Expected: trong dòng nạp trọng số, dòng bộ nhớ KV cache khả dụng và dòng kích thước pool với mức đồng thời tối đa; chia pool cho prompt cộng đầu ra mỗi người dùng thay vì độ dài tối đa.

## Wrong answers

- "Mô hình là 35 GB, vì vậy phần còn lại trống cho người dùng." KV cache và activation lấy phần trước; tại 128 request đồng thời với ngữ cảnh 2k bài học đặt cache gần 20 GB và tổng gần 60 GB.
- "Lượng tử hóa trọng số cũng thu nhỏ cache." Cache giữ dtype riêng; nó chỉ giảm một nửa nếu bạn lượng tử hóa cache, một lựa chọn riêng có tác động độ chính xác riêng.
- "Cache nhỏ vì mô hình nhỏ." Byte mỗi token phụ thuộc số lớp và KV head; một mô hình expert 30B giữ 96 KiB mỗi token và một mô hình dense 8B 144 KiB.

## Taught in

[Bài học lượng tử hóa production](../../../phases/17-infrastructure-and-production/09-production-quantization/docs/en.md) nêu bẫy, và [Đếm bộ nhớ trước khi chọn GPU](../../../manuals/vllm-101/sections/2-1-count-the-memory-before-you-pick-a-gpu.md) đếm cache.
