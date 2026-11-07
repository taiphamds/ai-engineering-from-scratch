---
id: temperature-zero-two-answers
title: Temperature zero gave two different answers
card: inference-serving
kind: concept
level: 2
roles: [inference-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [ml-depth, debugging]
tags: [determinism, batch-invariance, prefix-cache, greedy, seed]
minutes: 8
lessons: []
manuals: [vllm-101#s-get-reproducible-outputs, sglang-101#s-deterministic-inference-and-logprobs]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Bạn chạy cùng một bộ đánh giá hai lần ở temperature 0 trên một engine phục vụ và các điểm số khác nhau. Bạn gửi một prompt thất bại riêng lẻ và nhận một câu trả lời, rồi gửi nó trong một batch bận và nhận câu trả lời khác. Không có gì trong yêu cầu thay đổi. Giải thích điều gì đã thay đổi, và một seed có thể và không thể sửa gì.

## Short answer

Batch thay đổi phép tính. Phép cộng dấu phẩy động không có tính kết hợp, và các kernel chia các tổng của chúng theo kích thước batch, nên cùng yêu cầu cộng các số của nó theo một thứ tự khác trong một batch 3 so với một batch 30; một thay đổi ở bit cuối có thể đảo logit đứng đầu, và mọi token phía sau khi đó theo một văn bản khác. Prefix cache làm điều tương tự, vì một yêu cầu tái sử dụng các block đã cache chạy một đường prefill khác, và dtype cũng vậy. Một seed chỉ cố định các lần rút ngẫu nhiên của lấy mẫu, nên nó không đủ: offline, chạy engine trong một tiến trình với cùng thứ tự; online, dùng chế độ batch-invariant và trả chi phí tốc độ của nó.

## Full answer

### Four things that change one request

- **Batch.** Nhân ma trận, softmax và norm chia các tổng của chúng thành tile, và nhiều kernel chọn cách chia từ kích thước batch.
- **Lịch trình.** Trong một máy chủ đa tiến trình, thời điểm các yêu cầu quyết định batch mà mỗi yêu cầu tham gia.
- **Prefix cache.** Một yêu cầu tái sử dụng các block đã cache tính prompt của nó theo một cách khác với một yêu cầu không có cache hit.
- **Dtype.** BF16 và FP16 làm tròn mỗi số khác nhau, nên cùng mô hình viết văn bản khác nhau trong hai loại.

Seed vLLM mặc định là 0 và không thể bỏ đặt, vì speculative decoding cần mọi worker lấy mẫu cùng token. Vì vậy một seed luôn có ở đó, và tự nó không đủ.

### What the manual counted

Các đầu ra tham lam của Qwen3-0.6B, 32 câu hỏi ShareGPT sau một system prompt dùng chung khoảng 170 token, 128 token đầu ra, được so sánh từng token giữa hai lần chạy. Con số trong ngoặc là vị trí trung vị của token đầu tiên khác biệt:

| So sánh | SGLang | vLLM |
|---|---|---|
| lặp lại sau xóa cache so với mới | 0 trên 32 | 0 trên 32 |
| tắt cache so với tắt cache | 0 trên 32 | 0 trên 32 |
| mới so với cache đã làm nóng | 21 trên 32 (45) | 11 trên 32 (57) |
| bật cache so với tắt cache | 25 trên 32 (26) | 21 trên 32 (48) |

Ở một người dùng và cùng trạng thái cache, văn bản lặp lại chính xác. Một cache đã làm nóng thay đổi 21 trên 32 đầu ra trên SGLang và 11 trên 32 trên vLLM. Ở 64 người dùng được gửi cùng lúc, hai lần chạy với cache tắt vẫn khác nhau, ở 27 trên 64 đầu ra trên SGLang và 50 trên 64 trên vLLM: chỉ riêng batch đã thay đổi phần lớn đầu ra. BF16 so với FP16 ở một người dùng thay đổi 48 trên 64 đầu ra trên vLLM và 51 trên 64 trên SGLang cho mô hình 0.6B, và 56 và 57 trên 64 cho Qwen3-1.7B.

Phép thăm dò SGLang trên GB10 minh họa điều đó trong một prompt. Được gửi năm lần riêng lẻ và năm lần trong một batch 16 ở temperature 0, máy chủ mặc định viết hai văn bản, tách nhau sau 238 ký tự. Yêu cầu đầu tiên riêng lẻ đã tính prompt của nó từ không có gì; bốn yêu cầu sau tìm thấy nó trong radix cache. Khi bật chế độ xác định, cả mười yêu cầu viết cùng văn bản.

### What fixes it

| Trường hợp | Cách sửa | Chi phí |
|---|---|---|
| Đánh giá offline với lớp `LLM` | `VLLM_ENABLE_V1_MULTIPROCESSING=0`, cùng seed, cùng prompt theo cùng thứ tự | engine chạy trong tiến trình của bạn, nên lịch trình lặp lại |
| Một máy chủ đang hoạt động | `VLLM_BATCH_INVARIANT=1`, hoặc `--enable-deterministic-inference` trên SGLang | các kernel chậm hơn cho mọi yêu cầu |
| Đánh giá tham lam phải khớp chính xác | lấy mẫu tham lam cộng một trong hai cách trên | như trên |

Mọi cách sửa cũng cần cùng phần cứng, cùng phiên bản engine và cùng các thiết lập. Trên SGLang, cờ thay các toán tử ma trận, softmax, norm và nhân theo batch bằng các kernel batch-invariant, buộc dùng bộ lấy mẫu thông thường, cố định thứ tự all-reduce dưới tensor parallelism, chỉ chấp nhận một số backend attention, tắt radix cache trừ khi backend hỗ trợ nó, và cấp cho mọi yêu cầu không có `sampling_seed` seed 42.

### How to test it

Chạy cùng bộ đánh giá hai lần và so sánh các đầu ra từng token, không chỉ điểm số. Xóa prefix cache hoặc khởi động lại máy chủ trước mỗi phép thăm dò. Nếu các đầu ra khác nhau, lấy một prompt khác biệt và chạy nó riêng lẻ hai lần. Nếu hai câu trả lời khớp khi riêng lẻ, và phép thăm dò theo batch bắt đầu từ cùng trạng thái cache, batch gây ra khác biệt. SGLang cung cấp một kiểm thử gửi một prompt trong các kích thước batch ngẫu nhiên và đếm các đầu ra khác nhau, với các chế độ cho một prompt, prefix dùng chung và prefill đã cache so với chưa cache.

## Follow-ups

- **Level 2:** Những so sánh nào trong bảng của tài liệu cho cùng văn bản mỗi lần? Expected: một lần lặp sau xóa cache so với một lần chạy mới, và một lần lặp với cache tắt so với cache tắt, cả hai có 0 trên 32 thay đổi trên cả hai engine.
- **Level 3:** Tại sao một prefix cache đã làm nóng có thể thay đổi một câu trả lời tham lam khi mô hình và prompt giống nhau? Expected: một yêu cầu tái sử dụng các block đã cache tính prompt của nó theo một đường khác với một prefill đầy đủ, nên các logit khác nhau ở những bit cuối, và một token thay đổi làm phần còn lại thay đổi; nó thay đổi 21 trên 32 đầu ra trên SGLang và 11 trên 32 trên vLLM.
- **Level 4:** Dưới tải, hai lần chạy tắt cache vẫn khác nhau. Điều đó nói gì về cách sửa? Expected: chỉ riêng batch đã thay đổi phần lớn đầu ra, 50 trên 64 trên vLLM, nên đặt lại cache chỉ đủ ở một người dùng; một máy chủ đang hoạt động cần các kernel batch-invariant, và tài liệu không kiểm thử chế độ đó ở tải đó.

## Wrong answers

- "Temperature 0 khiến đầu ra có tính xác định." Tham lam chọn logit đứng đầu, và batch thay đổi các logit ở những bit cuối; máy chủ GB10 cho hai văn bản cho một prompt ở temperature 0 mà không có gì trong yêu cầu thay đổi.
- "Đặt một seed và các đầu ra khớp nhau." Seed chỉ cố định các lần rút ngẫu nhiên; seed vLLM mặc định là 0 và không thể bỏ đặt, và các đầu ra vẫn thay đổi theo batch và cache.
- "Xóa cache trước mỗi lần chạy là xong." Ở một người dùng điều đó là đủ, 0 trên 32 thay đổi; ở 64 người dùng hai lần chạy với cache tắt vẫn khác nhau ở 50 trên 64 đầu ra, vì batch thay đổi các tổng.
- "Chuyển sang FP16 để có kết quả chính xác." BF16 và FP16 làm tròn khác nhau, nên cùng mô hình viết văn bản khác nhau trong hai dtype, 48 trên 64 đầu ra cho mô hình 0.6B; giữ một dtype giữa các lần chạy bạn so sánh.

## Taught in

[Nhận đầu ra có thể tái lập](../../../manuals/vllm-101/sections/3-8-get-reproducible-outputs.md) và [phần suy luận xác định của SGLang](../../../manuals/sglang-101/sections/4-6-deterministic-inference-and-logprobs.md) đếm các đầu ra thay đổi và liệt kê các cách sửa.
