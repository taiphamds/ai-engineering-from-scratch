---
id: read-three-scheduler-lines
title: Read three scheduler log lines
card: inference-serving
kind: code-reading
level: 2
roles: [inference-engineer]
rounds: [debugging, screen]
tags: [scheduler-log, radix-cache, kv-pool, prefill-batch, metrics]
minutes: 8
lessons: []
manuals: [sglang-101#s-the-scheduler-loop-and-schedule-policy, sglang-101#s-radixcache, sglang-101#s-reading-other-peoples-benchmarks]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Đây là ba dòng từ hai engine phục vụ dưới tải. Đọc từng trường và cho tôi biết máy chủ đã làm gì, người dùng cảm nhận gì, và bạn sẽ hành động dựa trên con số nào.

```text
[2026-10-16 14:01:00] Prefill batch, #new-seq: 7, #new-token: 955, #cached-token: 15102, token usage: 0.05, #running-req: 1, #queue-req: 0, #pending-token: 0, cuda graph: False, input throughput (token/s): 1472.94
[2026-10-16 13:59:09] Decode batch, #running-req: 8, #token: 4075, token usage: 0.02, cuda graph: False, gen throughput (token/s): 98.37, #queue-req: 0
INFO 10-17 22:35:43 [loggers.py:320] Engine 000: Avg prompt throughput: 460.3 tokens/s, Avg generation throughput: 323.6 tokens/s, Running: 40 reqs, Waiting: 11 reqs, GPU KV cache usage: 99.5%, Prefix cache hit rate: 8.7%
```

## Short answer

Dòng đầu tiên là một batch prefill trên SGLang tiếp nhận 7 yêu cầu và tính 955 token prompt mới trong khi 15,102 đến từ radix cache, với pool đầy 5 phần trăm và không có gì đang chờ: một workload có prefix dùng chung với cache đang hoạt động. Dòng thứ hai là một bước decode cho 8 yêu cầu đang chạy ở 98.37 token mỗi giây với hàng đợi trống: một máy chủ khỏe mạnh, tải nhẹ. Dòng thứ ba là vLLM ở một pool đầy: 40 đang chạy, 11 đang chờ, cache được dùng 99.5 phần trăm và tỷ lệ cache hit 8.7 phần trăm, nên các yêu cầu mới chờ bộ nhớ, và con số cần hành động là pool.

## Full answer

### The SGLang prefill line, field by field

- `#new-seq` là số yêu cầu mà batch prefill này tiếp nhận: 7.
- `#new-token` là số token prompt nó tính: 955. `#cached-token` là số nó tái sử dụng từ cây radix: 15,102. Bảy yêu cầu chia sẻ một system prompt dài mà một yêu cầu trước đã tính, nên chỉ các câu hỏi của chúng là mới.
- `token usage` là tỷ phần pool KV mà các yêu cầu đang chạy và các prefix đã cache cùng giữ: 0.05, nên pool gần như trống.
- `#running-req` đếm các yêu cầu đang decode: 1. `#queue-req` đếm các yêu cầu đang chờ: 0. `#pending-token` đếm các token của các yêu cầu đã được tiếp nhận nhưng chưa prefill: 0.
- `cuda graph` cho biết bước đó có phát lại một graph đã capture hay không. False được kỳ vọng trên một nền tảng không có graph, là nơi dòng này đến từ đó.
- `input throughput` là tốc độ prefill của batch này: 1,472.94 token mỗi giây.

Cùng benchmark không có radix cache lấp ba batch prefill lên đến 4,096 token cho tám yêu cầu, mỗi yêu cầu với `#cached-token: 0`. Con số 4,096 là kích thước chunked prefill.

### The decode line

SGLang mặc định in một dòng mỗi batch prefill và một dòng decode mỗi 40 bước decode. Dòng này cho thấy 8 yêu cầu decode cùng nhau, 4,075 token được giữ, 2 phần trăm pool được dùng, 98.37 token đầu ra mỗi giây, và không có hàng đợi. Các dòng trước nó trong cùng lần chạy cho thấy batch hình thành thế nào: một yêu cầu được tiếp nhận trong khi 7 chờ, rồi 7 yêu cầu còn lại được tiếp nhận cùng nhau với 3,553 token mới ở 1,914 token mỗi giây, rồi cả 8 decode như một batch. Gom batch prefill là nơi thông lượng đến từ đó, và log cho thấy nó xảy ra.

### The vLLM stats line

`Running` và `Waiting` là các yêu cầu đang chạy và đang xếp hàng: 40 và 11. `GPU KV cache usage` là tỷ phần pool đang được dùng: 99.5 phần trăm. `Prefix cache hit rate` là tỷ phần token prompt đến từ cache: 8.7 phần trăm. Thông lượng prompt và sinh cho biết engine đã làm gì trong khoảng: nó prefill prompt mới ở 460.3 token mỗi giây trong khi 40 yêu cầu decode, nên mỗi prefill mới chia sẻ bước với các luồng đang chạy. Trong lần chạy đó, ở 64 người dùng trên L4, token đầu tiên trung vị là 10,953 ms và khoảng cách P99 giữa token là 1,363 ms. Tỷ lệ cache hit thấp không phải lỗi: benchmark gửi các prompt riêng biệt, nên có ít thứ để chia sẻ.

### What to act on

- Dòng 1: không có gì. Xác nhận rằng các cache hit vẫn tồn tại khi tập làm việc tăng, vì các prefix đã cache nằm trong cùng pool với các yêu cầu đang chạy.
- Dòng 2: không có gì. Máy chủ còn chỗ; một lượt quét sẽ cho bạn biết bao nhiêu.
- Dòng 3: pool. Tăng nó bằng cache FP8 hoặc trọng số FP8, hoặc chạy ít người dùng hơn mỗi replica. Một giới hạn trên số đang chạy chỉ chọn ai phải chờ.

Đọc cả dòng pool khi khởi động. Trên cùng card, nó ghi `GPU KV cache size: 24,096 tokens, Maximum concurrency for 8,192 tokens per request: 2.94x`, và con số 2.94 giả định rằng mọi yêu cầu lấp đầy độ dài tối đa.

### What the lines do not show

Không dòng nào cho thấy xung nhịp GPU, client gửi tải, hoặc cache có được xóa trước lần chạy hay không. Những thứ đó thuộc về kết quả cạnh các dòng.

## Follow-ups

- **Level 2:** Trong dòng đầu tiên, tại sao số đã cache lớn hơn nhiều số mới? Expected: 7 yêu cầu chia sẻ một system prompt dài mà một yêu cầu trước đã tính, nên cây phục vụ nó và chỉ các câu hỏi là mới; lần chạy không cache của cùng benchmark cho thấy các batch 4,096 token mới và không token đã cache.
- **Level 3:** Tỷ lệ cache hit trong dòng thứ ba đọc 8.7 phần trăm. Cache có hỏng không? Expected: không; benchmark ngẫu nhiên gửi các prompt riêng biệt, nên có ít thứ để chia sẻ; tỷ lệ cache hit là một thuộc tính của các prompt, và con số quan trọng trong dòng đó là pool ở 99.5 phần trăm với 11 đang chờ.
- **Level 3:** Trường token usage bao gồm gì, và khi nào nó nên khiến bạn lo? Expected: tỷ phần pool mà các yêu cầu đang chạy và các prefix đã cache cùng giữ; gần 1.0 thì pool đầy, các yêu cầu mới xếp hàng, và các prefix đã cache bị loại.
- **Level 4:** Một giới hạn các yêu cầu đang chạy có giúp máy chủ trong dòng thứ ba không? Expected: không; pool đầy, nên một giới hạn chỉ chọn ai phải chờ và chuyển thời gian chờ sang token đầu tiên; tăng pool bằng cache FP8 hoặc trọng số FP8, hoặc chạy ít người dùng hơn mỗi replica.

## Wrong answers

- "Tỷ lệ cache hit 8.7 phần trăm có nghĩa là prefix cache bị cấu hình sai." Các prompt riêng biệt có ít thứ để chia sẻ; tỷ lệ cache hit phản ánh các prompt, và cùng engine đọc cao hơn nhiều trên một lần chạy có prefix dùng chung.
- "Token usage ở 0.05 có nghĩa là máy chủ gần như nhàn rỗi." Nó có nghĩa là pool gần như trống; GPU vẫn có thể bận, như 1,472.94 token prompt mỗi giây cho thấy; đọc số đang chạy và số xếp hàng để biết tải.
- "cuda graph: False có nghĩa là có gì đó sai." Nó nói bước đó không phát lại một graph đã capture, điều được kỳ vọng trên một nền tảng không có graph và trong một batch prefill; trên CUDA, đọc nó trên các dòng decode.
- "Waiting: 11 là một hàng đợi nhỏ, nên bỏ qua nó." Với pool ở 99.5 phần trăm, mọi yêu cầu đang chờ đều chờ một yêu cầu đang chạy hoàn tất, và ở 64 người dùng trên card đó, token đầu tiên trung vị là 10,953 ms; pool là giới hạn.

## Taught in

[Vòng lặp bộ lập lịch và --schedule-policy](../../../manuals/sglang-101/sections/2-2-the-scheduler-loop-and-schedule-policy.md) và [RadixCache](../../../manuals/sglang-101/sections/3-3-radixcache.md) giải thích các dòng SGLang, và [Đọc benchmark SGLang của người khác](../../../manuals/sglang-101/sections/5-3-reading-other-peoples-benchmarks.md) cho thấy dòng thống kê vLLM ở một pool đầy.
