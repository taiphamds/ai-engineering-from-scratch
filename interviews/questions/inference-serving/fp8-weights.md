---
id: fp8-weights
title: When an FP8 checkpoint pays
card: inference-serving
kind: tradeoff
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [design-review, ml-depth]
tags: [fp8, quantization, throughput, gsm8k, kv-pool]
minutes: 10
lessons: []
manuals: [vllm-101#s-fit-a-bigger-model-with-fp8-weights, sglang-101#s-quantization]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Server Qwen/Qwen3-8B ở BF16 của bạn vừa trên một L4, nhưng chỉ với KV pool nhỏ. Bên công bố mô hình cũng cung cấp checkpoint FP8. Khi nào checkpoint FP8 có lợi, nó làm gì với tốc độ, và phép kiểm tra GSM8K của chúng ta nói gì về chi phí?

## Short answer

Trọng số FP8 lưu phần lớn tham số trong 1 byte thay vì 2, vì vậy giải phóng bộ nhớ mà engine cho KV pool, và trên GPU có tính toán FP8 chúng cũng tăng tốc công việc ma trận. Trên L4 khóa xung với pool giữ cố định, checkpoint FP8 cho 284.7 so với 208.8 token đầu ra mỗi giây ở 32 người dùng, nhiều hơn 36 phần trăm, và cắt thời gian mỗi token 30 phần trăm. Trên 500 câu hỏi GSM8K nó đạt 90.6 phần trăm so với 91.8 ở BF16, thấp hơn 1.2 điểm với các khoảng chồng nhau, vì vậy lần chạy không cho thấy tổn thất và không thể loại trừ vài điểm.

## Full answer

### Serve it

Phục vụ checkpoint được công bố như mọi mô hình, `Qwen/Qwen3-8B-FP8`, và không đặt cờ. vLLM đọc phương pháp lượng tử hóa từ cấu hình checkpoint. SGLang làm tương tự, và một cờ `--quantization` không khớp checkpoint phát sinh lỗi lúc khởi động, trừ vài cặp tương thích đã biết. Nếu không checkpoint FP8 nào tồn tại, vLLM có thể lượng tử hóa mô hình BF16 khi nạp; tài liệu chưa kiểm thử đường đó.

### Know what your GPU runs

L4 là GPU Ada, SM 8.9, và có tính toán FP8, vì vậy tính toán ma trận chạy ở FP8 và tốc độ có thể tăng cùng bộ nhớ trống. Các GPU trước Ada, như A100, không có tính toán FP8. Ở đó vLLM giữ trọng số ở FP8 và chạy kernel chỉ trọng số: bạn giữ tiết kiệm bộ nhớ và mong đợi ít lợi ích tốc độ hơn. Tài liệu chưa kiểm thử GPU như vậy.

### The L4 result

Phiên khóa ở 900 MHz, mỗi loại hai seed, pool giữ ở 24,096 token trong cả hai lần:

| Người dùng | TPOT trung vị, BF16 / FP8 | Token đầu ra/s, BF16 / FP8 | Xung SM trung vị, BF16 / FP8 |
|---|---|---|---|
| 32 | 119.9 / 83.8 ms | 208.8 / 284.7 | 881 / 900 MHz |
| 1 | không so sánh / 35.3 ms | không so sánh / 25.4 | 210 / 900 MHz |

Ở 32 người dùng các phạm vi seed không chồng nhau cho cả hai con số, và xung BF16 thấp hơn khoảng 2 phần trăm, ít hơn nhiều khoảng cách. Ở một người dùng lần BF16 giảm xuống 210 MHz vì GPU bị throttle, vì vậy hai bên không được so sánh.

### What it frees

Kiểm thử tốc độ giữ pool cố định, vì vậy không đo pool lớn hơn. Lợi ích chỗ đến từ byte. Các lần SGLang trên cùng L4 để pool tăng và đổi trọng số cùng cache: pool đi từ 24,094 token ở BF16 lên 142,369 với trọng số FP8 và cache FP8, nhiều gấp 5.91 lần, và đầu ra ở 64 người dùng đi từ 250.85 lên 735.91 token mỗi giây, vì pool BF16 đầy và pool FP8 không đầy. Ở một người dùng FP8 vẫn nhanh hơn, 39.66 so với 60.16 ms mỗi token, vì decode đọc mọi trọng số cho mọi token và trọng số FP8 có một nửa byte.

Trên GB10 với Qwen3-30B-A3B cặp FP8 làm tương tự: trọng số đi từ 57.75 xuống 29.75 GB, thời gian nạp từ 323.61 xuống 152.29 s, và pool từ 227,243 lên 1,083,008 token, nhiều gấp 4.77 lần, vì trọng số nhỏ hơn giải phóng bộ nhớ và mỗi token chiếm một nửa byte. Throughput cao hơn 1.73 đến 1.88 lần ở mọi mức đồng thời, vì decode trên máy đó đọc trọng số từ bộ nhớ có băng thông vừa phải.

### The accuracy check

500 câu hỏi GSM8K đầu, 8-shot và greedy, trên L4 ngày 2026-10-23:

| Engine | Cấu hình | Đúng | Độ chính xác | Khoảng Wilson 95 phần trăm |
|---|---|---|---|---|
| vLLM | BF16 | 459/500 | 91.8% | 89.1 đến 93.9 |
| vLLM | trọng số FP8 | 453/500 | 90.6% | 87.7 đến 92.9 |
| vLLM | trọng số FP8 + KV FP8 | 453/500 | 90.6% | 87.7 đến 92.9 |
| SGLang | BF16 | 458/500 | 91.6% | 88.8 đến 93.7 |
| SGLang | trọng số FP8 | 456/500 | 91.2% | 88.4 đến 93.4 |
| SGLang | trọng số FP8 + KV FP8 | 460/500 | 92.0% | 89.3 đến 94.1 |

Tất cả khoảng chồng nhau. Lần chạy không cho thấy khác biệt, và với 500 câu hỏi không thể loại trừ mất vài điểm. Đây là một mô hình và một benchmark. Chạy các prompt riêng trên cả hai checkpoint trước production.

### When it does not pay

- Pool còn chỗ và GPU không có tính toán FP8: ít lợi ích cho rủi ro.
- Một nhiệm vụ phụ thuộc các chuỗi suy luận dài: chạy kiểm tra riêng trước.
- Mô hình vẫn không vừa ở FP8: một checkpoint 4-bit lưu phần lớn trọng số trong khoảng nửa byte, và trên card 24 GB đó là cách phổ biến để phục vụ mô hình 14B. Một mô hình 4-bit có thể mất độ chính xác nhiều hơn FP8, và tổn thất phụ thuộc mô hình và phương pháp.

## Follow-ups

- **Level 3:** Pool được giữ cố định trong kiểm thử tốc độ. Điều đó giấu gì, và cho thấy gì? Expected: nó giấu pool lớn hơn mà FP8 giải phóng, vì vậy kiểm thử chỉ cho thấy thay đổi tốc độ; lợi ích chỗ đến từ byte, và lần SGLang để pool tăng đi từ 24,094 lên 142,369 token với cả cache FP8.
- **Level 3:** Tại sao hàng một người dùng không được so sánh? Expected: lần BF16 giảm xuống 210 MHz, dưới khóa 900 MHz, vì GPU bị throttle; một khóa chặn xung và không thể ngăn throttle, vì vậy hai lần ở các xung khác nhau.
- **Level 4:** Trên GB10 cặp FP8 gần gấp đôi tốc độ ở mọi tải, trong khi báo cáo thực địa chỉ cache FP8 chậm hơn một chút mỗi token. Đối chiếu hai điều. Expected: GB10 decode từ bộ nhớ có băng thông vừa phải, vì vậy một nửa byte trọng số cho tốc độ gần gấp đôi; chỉ cache FP8 không đổi byte trọng số và thêm công việc scale, vì vậy nó thắng về dung lượng chứ không tốc độ mỗi token.

## Wrong answers

- "FP8 luôn tăng tốc decode." Chỉ trên GPU có tính toán FP8, như Ada, Hopper và Blackwell; trên A100 vLLM giữ trọng số ở FP8 và chạy kernel chỉ trọng số, vì vậy giữ tiết kiệm bộ nhớ và mong đợi ít lợi ích tốc độ hơn.
- "Truyền --quantization fp8 để an toàn." vLLM đọc phương pháp từ cấu hình checkpoint, và trong SGLang một cờ không khớp checkpoint phát sinh lỗi lúc khởi động, vì vậy không truyền cờ cho checkpoint được công bố.
- "Giảm 1.2 điểm trên GSM8K nghĩa là FP8 mất độ chính xác." Hai khoảng chồng nhau, vì vậy lần này không cho thấy khác biệt; nó cũng không thể loại trừ mất vài điểm, là lý do bạn chạy prompt riêng trên cả hai checkpoint.
- "Nếu FP8 tốt, 4-bit tốt gấp đôi." Một mô hình 4-bit có thể mất độ chính xác nhiều hơn mô hình FP8, và tổn thất phụ thuộc mô hình và phương pháp; dùng khi mô hình không vừa ở FP8, như mô hình 14B trên card 24 GB, và kiểm thử.

## Taught in

[Làm mô hình lớn hơn vừa bằng trọng số FP8](../../../manuals/vllm-101/sections/2-5-fit-a-bigger-model-with-fp8-weights.md) và [phần lượng tử hóa SGLang](../../../manuals/sglang-101/sections/4-3-quantization.md) đưa ra các lần chạy L4 và GB10 và bảng GSM8K.
