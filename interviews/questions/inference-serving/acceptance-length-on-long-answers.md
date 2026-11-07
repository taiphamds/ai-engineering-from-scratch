---
id: acceptance-length-on-long-answers
title: Acceptance by draft position, tokens per pass
card: inference-serving
kind: estimate
level: 3
roles: [inference-engineer]
rounds: [ml-depth, debugging]
tags: [speculative-decoding, eagle3, acceptance-length, long-outputs]
minutes: 8
lessons: []
manuals: [vllm-101#s-speed-up-decode-with-eagle3, sglang-101#s-speculative-decoding]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một server vLLM chạy Qwen/Qwen3-8B với một draft EAGLE3 độ sâu 3. Trong một lần chạy các câu trả lời gần 2,000 token ở 8 người dùng, các counter cho thấy draft ở vị trí một được chấp nhận với xác suất 0.77, vị trí hai với 0.54, và vị trí ba với 0.38. Ước tính số token trung bình mà một lượt verify chốt, và nói bạn sẽ kiểm tra gì trước khi dựa vào lợi ích đó cho các câu trả lời dài.

## Short answer

Mỗi lượt verify chốt các draft được chấp nhận cộng một token thưởng từ target, vì vậy độ dài chấp nhận trung bình là một cộng tổng các tỷ lệ chấp nhận theo vị trí. Với 0.77, 0.54 và 0.38 đó là khoảng 2.69 token mỗi lượt, là giá trị vLLM báo cáo trên GSM8K trong lần chạy đó. Trước khi tin nó trên các câu trả lời dài tôi sẽ đọc riêng độ chấp nhận của các câu trả lời dài nhất, với độ dài đầu ra thật và không ignore-eos, vì một nghiên cứu khác thấy độ chấp nhận giảm từ khoảng 3.7 xuống khoảng 1.5 trên các câu trả lời chạy về phía 20,000 token.

## Full answer

### The arithmetic

Các tỷ lệ theo vị trí đã gồm thứ tự chuỗi: vị trí hai chỉ có thể được chấp nhận khi vị trí một đã được chấp nhận, và 0.54 là tỷ lệ của tất cả các lượt mà vị trí hai được chấp nhận. Số draft được chấp nhận kỳ vọng là tổng các tỷ lệ, và target luôn thêm một token riêng, vì vậy:

```text
mean acceptance length = 1 + 0.77 + 0.54 + 0.38 = 2.69
```

Trên ShareGPT cùng lần chạy cho 0.67, 0.42 và 0.26, là 2.35. Cả hai khớp độ dài chấp nhận trung bình vLLM báo cáo từ các counter.

### What the manual measured on long answers

Qwen/Qwen3-8B ở BF16 tại 8 người dùng, câu trả lời đến 2,048 token, không ignore-eos, câu trả lời trung vị 1,800 đến 2,000 token:

| Engine | Dataset | Độ dài chấp nhận trung bình | Được chấp nhận mỗi vị trí draft 1 / 2 / 3 |
|---|---|---|---|
| SGLang EAGLE3 | GSM8K | 2.68 | |
| SGLang EAGLE3 | ShareGPT | 2.32 | |
| vLLM EAGLE3 | GSM8K | 2.69 | 0.77 / 0.54 / 0.38 |
| vLLM EAGLE3 | ShareGPT | 2.35 | 0.67 / 0.42 / 0.26 |

Trên các câu trả lời ngắn 128 token trong cùng phiên, SGLang cho 2.69 đến 2.78 trên GSM8K và 2.33 đến 2.43 trên ShareGPT. Các câu trả lời dài giữ trong 0.01 so với những phạm vi đó.

### By position inside the answer

Một kiểm thử thứ hai chạy 8 prompt bật thinking, greedy, ở một người dùng, đến 4,096 token, và đọc độ chấp nhận trong các đoạn:

| Đoạn đầu ra | SGLang | vLLM |
|---|---|---|
| 0 đến 256 | 2.05 đến 2.64 (8) | 2.14 đến 2.51 (8) |
| 256 đến 512 | 1.95 đến 2.64 (8) | 2.09 đến 2.55 (8) |
| 512 đến 1,024 | 2.11 đến 2.77 (8) | 2.12 đến 2.79 (8) |
| 1,024 đến 2,048 | 2.09 đến 2.47 (5) | 1.72 đến 2.66 (5) |
| 2,048 đến 4,096 | 2.33 và 2.48 (2) | 2.35 và 2.60 (2) |

Đến 4,096 token độ chấp nhận không giảm đều. Chỉ 2 trong 8 prompt chạy quá 2,048 token, vì vậy đoạn cuối dựa trên hai câu trả lời, và giới hạn 4,096 đến từ bộ nhớ trên GPU đó. Vì vậy kiểm thử không tới phạm vi nghiên cứu đã thấy giảm.

### When acceptance does fall

Một sự cố cho thấy nguyên nhân khác. Một cấu hình draft với 2,048 vị trí và không rope scaling chấp nhận 3.2 token tại 1k token đầu vào, 1.6 tại 3k và 1.2 tại 10k. Tại 10k server tạo 63.9 token mỗi giây so với 102.7 không speculation. Draft không thể đọc quá giới hạn vị trí. Thêm rope scaling và 131,072 vị trí vào cấu hình draft sửa nó. Biến override bỏ qua phép kiểm tra ngữ cảnh loại bỏ phép kiểm tra và không dạy draft đọc các prompt dài.

### What to read

- vLLM: `spec_decode_num_draft_tokens` và `spec_decode_num_accepted_tokens` từ `/metrics`, và dòng `SpecDecoding metrics` trong log.
- SGLang: `accept len` và `accept rate` trên mỗi dòng log decode, `sglang:spec_accept_length` từ `/metrics`, và `spec_accept_length` trong `meta_info` của mỗi phản hồi `/generate`, cho giá trị theo câu trả lời.
- So sánh P99 ITL và P99 TTFT có và không draft, và so sánh `max_position_embeddings` của draft với các prompt dài nhất.

## Follow-ups

- **Level 3:** Tại sao token thưởng luôn có? Expected: target tính một phân phối một vị trí sau draft được chấp nhận cuối, vì vậy ngay cả khi mọi draft bị từ chối lượt vẫn viết một token riêng, như decode thông thường.
- **Level 3:** Các tỷ lệ ShareGPT là 0.67, 0.42 và 0.26. Bạn nhận độ dài nào, và tại sao dưới GSM8K? Expected: 2.35; chat mở khó cho draft dự đoán hơn các bước toán và mã, vì vậy ít draft khớp target hơn.
- **Level 4:** Độ chấp nhận là 3.2 tại 1k token đầu vào và 1.2 tại 10k trên một draft có 2,048 vị trí. Nguyên nhân và cách sửa? Expected: draft không thể đọc quá giới hạn vị trí, vì vậy các phỏng đoán suy giảm theo độ dài prompt; rope scaling và số vị trí dài hơn trong cấu hình draft sửa nó, và biến override chỉ loại bỏ phép kiểm tra.

## Wrong answers

- "Độ dài chấp nhận trung bình là trung bình ba tỷ lệ." Nó là số draft được chấp nhận kỳ vọng, tổng các tỷ lệ, cộng token thưởng; 0.77 cộng 0.54 cộng 0.38 cộng một là 2.69, không phải một giá trị dưới một.
- "Độ dài chấp nhận 2.69 nghĩa là tốc độ gấp 2.69." Mỗi lượt cũng trả các bước draft và phép kiểm tra; trên L4 mô hình dense cho mỗi token nhanh hơn 1.6 đến 2.3 lần và không thêm đầu ra từ 32 người dùng, vì draft chiếm chỗ pool.
- "Một câu trả lời dài giữ độ chấp nhận của một câu ngắn." Trong kiểm thử riêng của tài liệu đến 4,096 token nó có, nhưng nghiên cứu khác thấy giảm từ khoảng 3.7 xuống khoảng 1.5 về phía 20,000 token, và một draft có quá ít vị trí giảm từ 3.2 xuống 1.2 theo độ dài prompt; đọc các câu trả lời dài riêng của bạn.

## Taught in

[Tăng tốc decode với EAGLE3](../../../manuals/vllm-101/sections/4-1-speed-up-decode-with-eagle3.md) và [phần speculative decoding SGLang](../../../manuals/sglang-101/sections/4-4-speculative-decoding.md) giữ các bảng chấp nhận theo vị trí và theo độ dài câu trả lời.
