---
id: a-benchmark-that-counted-empty-answers
title: A split-server benchmark that counted empty answers
card: inference-serving
kind: code-reading
level: 4
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, design-review]
tags: [disaggregation, benchmark, kv-transfer, retokenized-tokens, false-success]
minutes: 10
lessons: []
manuals: [sglang-101#s-prefill-decode-disaggregation]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một nhóm tách Qwen/Qwen3-8B thành một prefill server và một decode server trên hai L4 qua TCP, chạy benchmark vòng mở qua router ở 8 request mỗi giây, và đăng kết quả như một chiến thắng: 751.85 token đầu ra mỗi giây, so với 728.61 cho server FP8 đơn ở cùng rate. Đây là các dòng từ log prefill, log decode và tóm tắt benchmark. Đọc chúng và nói bạn thấy gì.

```text
… Decode batch, #running-req: 2, #token: 1206, token usage: 0.41, pre-allocated usage: 0.00, #prealloc-req: 19, #transfer-req: 0, #retracted-req: 0
… TCP lane queue-full rejection count: 4096
… Session 151.242.195.41:15367 failed.
Prefill transfer failed lines: 2902
Successful requests:                     240
Total generated tokens (retokenized):    0
Mean TTFT (ms):                          0.00
```

## Short answer

Lần chạy không tạo văn bản. Mọi request được tính là thành công qua router, nhưng không token nào trở lại khi client tokenize lại đầu ra, và thời gian token đầu tiên trung bình 0.00 ms không phải một phép đo. Log decode cho thấy tại sao: bản sao decode chỉ chạy được 2 request trong khi 19 request chờ bộ nhớ, prefill tiếp tục tạo KV cho chúng, hàng đợi truyền TCP đến decode đầy và từ chối 4096 lần, phiên thất bại, và 2902 lần truyền sau thất bại theo nó, vì vậy con số 751.85 là tốc độ router trả các câu trả lời rỗng.

## Full answer

### Read the lines in order

1. `#running-req: 2` với `#prealloc-req: 19` tại mức sử dụng token 0.41. Phía decode chạy hai request và thêm 19 chờ bộ nhớ decode. Pool đó nhỏ: server decode nằm trên card dùng chung với 2,925 token, so với 24,094 trên card prefill.
2. `TCP lane queue-full rejection count: 4096`. Prefill tiếp tục tạo KV cache cho các request decode không thể nhận, và hàng đợi truyền đến decode đầy.
3. `Session ... failed.` Ba phút vào phép quét phiên truyền chết, và không quay lại.
4. `Prefill transfer failed lines: 2902`. Mọi request sau thất bại việc truyền.
5. `Successful requests: 240` với `Total generated tokens (retokenized): 0` và `Mean TTFT (ms): 0.00`. Mỗi request thất bại vẫn trả HTTP 200 qua router, không có văn bản.

### Why the summary lied

Client đếm một thành công theo mã trạng thái. Dòng throughput đếm token client yêu cầu, 128 mỗi request với end token bị bỏ qua, không phải token nó nhận. Chỉ hai con số làm lộ lần chạy: token đầu ra tokenize lại, đếm thứ quay về, và thời gian token đầu tiên bằng không, mà không request thật nào có thể có. Tài liệu không công bố con số throughput, và bộ công cụ giờ từ chối một lần chạy mà mọi request có TTFT 0.

### The swapped split

Nhóm rồi đặt decode trên card có pool đầy đủ 24,094 token và prefill trên card dùng chung với 2,925. Từ 1 đến 8 người dùng mọi request quay về có văn bản. Ở 16 người dùng chỉ 2,048 trong 8,192 token được sinh quay về dưới dạng văn bản. Ở 32 người dùng mọi request quay về rỗng, và bộ công cụ dừng phép quét. Chiều ban đầu thất bại sớm hơn: ở 2 người dùng chỉ 512 trong 2,048 token được sinh quay về, và ở 4 người dùng không còn gì. Kết luận của tài liệu là không có kết quả đo được cho phần tách dưới tải trên cặp card này, và không tuyên bố có.

### The rule

Kiểm tra `Total generated tokens (retokenized)` so với `Total generated tokens` trong mọi benchmark tách rời trước khi đọc throughput, và nhìn phân phối TTFT để tìm các giá trị không thể thật. Trong production, theo dõi các counter bootstrap-failed và transfer-failed, độ trễ và tốc độ truyền, và các gauge pre-allocation decode và hàng đợi truyền.

## Follow-ups

- **Level 3:** Bạn phải đọc hai con số nào trong một tóm tắt như vậy trước throughput? Expected: token đầu ra tokenize lại so với token được sinh, và phân phối TTFT; một khoảng cách giữa hai số đếm token hoặc token đầu tiên bằng không nghĩa là request trả về không có văn bản.
- **Level 4:** Tại sao pool decode đầy trong khi prefill tiếp tục hoạt động? Expected: bản sao decode nằm trên card dùng chung với pool 2,925 token, vì vậy nó chạy 2 request và 19 chờ bộ nhớ; prefill có 24,094 token và tiếp tục tạo KV cho chúng, vì vậy hàng đợi truyền đến decode đầy và phiên chết.
- **Level 4:** Phần tách đảo phục vụ văn bản đến 8 người dùng và mất ở 16 và 32. Điều đó nói gì về cặp? Expected: phía nhỏ giới hạn cặp bất kể vai trò; với prefill trên card nhỏ, 2,048 trong 8,192 token được sinh quay về ở 16 người dùng và không có ở 32, vì vậy không có kết quả đo được cho cặp này dưới tải, và báo cáo trung thực nói vậy.

## Wrong answers

- "240 trong 240 request thành công, vì vậy hệ thống khỏe." Router trả HTTP 200 không văn bản cho mọi request thất bại; không token tokenize lại và token đầu tiên 0.00 ms cho thấy không gì được sinh.
- "751.85 thắng 728.61, vì vậy tách rời thắng." Con số đếm token client yêu cầu, không phải token nhận; tài liệu không công bố nó, và bộ công cụ giờ từ chối một lần chạy mà mọi request có TTFT 0.
- "Backend TCP là vấn đề, vì vậy dùng RDMA." Hàng đợi đầy vì decode không thể nhận KV: nó chạy 2 request với 19 chờ bộ nhớ trên pool 2,925 token; một kết nối nhanh hơn không thêm bộ nhớ cho phía decode.
- "Retry đã có thể sửa các lần truyền thất bại." Phiên thất bại ba phút vào lần chạy và không quay lại, vì vậy mọi lần truyền sau thất bại; cách sửa là một pool decode giữ được các request và một phép kiểm tra đầu ra tồn tại.

## Taught in

[Phần tách rời SGLang](../../../manuals/sglang-101/sections/6-3-prefill-decode-disaggregation.md) có listing đầy hàng đợi, phần tách đảo và quy tắc kiểm tra token tokenize lại.
