---
id: flush-before-you-compare
title: The knee that the prefix cache hid
card: inference-serving
kind: debug
level: 2
roles: [inference-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, screen]
tags: [benchmark, prefix-cache, flush, knee, ttft]
minutes: 8
lessons: []
manuals: [vllm-101#s-benchmark-your-server-in-15-minutes, sglang-101#s-sglang-benchmark-serving]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Phép quét mức đồng thời đầu trên một L4 cho token đầu tiên trung vị 0.3 s đến 16 người dùng và 1.8 s ở 32, vì vậy bạn đặt giới hạn production ở 20 người dùng mỗi replica. Phép quét thứ hai có đặt lại trước mỗi lần chạy đặt token đầu tiên ở 1.6 s ngay tại 16 người dùng. Bạn tin phép quét nào, và tại sao hai phép bất đồng?

## Short answer

Tin phép quét có đặt lại. Phép đầu giữ một server cho mọi số người dùng và gửi cùng các prompt đầu tại mọi số đếm với seed cố định, vì vậy dưới 32 người dùng nhiều request tìm thấy prompt trong prefix cache và bỏ prefill. Với đặt lại token đầu tiên trung vị tăng ở mọi bước, khoảng 0.65 s ở 4 người dùng, 1.0 s ở 8 và 1.6 s ở 16, và ITL P99 nhảy từ khoảng 70 ms ở 8 người dùng lên 522 ms ở 16, vì vậy điểm gối trên card này nằm giữa 8 và 16 người dùng, không giữa 16 và 32.

## Full answer

### How the cache inflated the first sweep

Dataset ngẫu nhiên có seed cố định gửi cùng các prompt trong mọi lần chạy. Phép quét đầu chạy mọi số người dùng trên một server, vì vậy mỗi lần thấy các prompt của những lần trước trong cache. Đây là bảng tạo ra, Qwen/Qwen3-8B trên vLLM 0.31.0, ba seed mỗi điểm:

| Người dùng | Token đầu ra/s | TTFT trung vị | TPOT trung vị | P99 ITL |
|---|---|---|---|---|
| 1 | 13.5 | 191 ms | 60.4 ms | 105 ms |
| 8 | 112.8 | 253 ms | 65.8 ms | 67 ms |
| 16 | 201.3 | 288 ms | 69.5 ms | 85 ms |
| 32 | 275.1 | 1,800 ms | 101.8 ms | 613 ms |
| 64 | 242.3 | 11,181 ms | 129.2 ms | 1,233 ms |

Bước nhảy giữa 16 và 32 người dùng trông như điểm gối. Nó là đỉnh throughput. Một prompt đã cache bỏ prefill, vì vậy token đầu tiên đến nhanh, và phần lớn request dưới 32 người dùng có lợi thế đó.

### The flushed comparison

Cùng phép quét ở 900 MHz, cache đặt lại trước mọi lần chạy, so với một lần chưa flush của cùng phiên:

| Người dùng | vLLM, đã flush so với chưa flush | SGLang, đã flush so với chưa flush |
|---|---|---|
| 4 | 650 / 145 ms | 532 đến 645 / 141 ms |
| 8 | 951 đến 978 / 264 đến 274 ms | 1,174 đến 1,273 / 173 đến 178 ms |
| 16 | 1,550 đến 1,587 / 294 đến 295 ms | 1,804 đến 1,944 / 218 ms |
| 32 | 1,982 đến 2,084 / 2,012 đến 3,091 ms | 3,216 đến 3,228 / 2,710 đến 2,917 ms |

Từ 32 người dùng hàng đợi chi phối và đặt lại thay đổi ít. Dưới đó, cache tạo phần lớn các token đầu tiên nhanh.

### The size of the effect on one load

Cùng 64 prompt ở 16 người dùng, bốn lần liên tiếp, TTFT trung vị bằng ms: vLLM đọc 925 mới, 148 trên một lần lặp không flush, 1,163 trên một lần lặp sau flush, và 184 trên một lần lặp khác không flush. SGLang đọc 394, 82.5, 289 và 77. Lần lặp không flush đọc token đầu tiên thấp hơn khoảng 6 lần trên vLLM và 4.8 lần trên SGLang. Thời gian mỗi token thay đổi dưới 15 phần trăm, vì một hit bỏ công việc prefill và để công việc decode như cũ.

Trên GB10 hiệu ứng đảo một phép quét. Một lần chạy bộ công cụ đơn đọc 677.61 ms là thời gian đến token đầu tiên trung vị với giới hạn 8 và 390.38 ms với giới hạn 32: thêm tải, token đầu tiên nhanh hơn. Các dòng prefill cho thấy tại sao. Tại giới hạn 8, 16 trong 64 prompt ở trong cache trước khi lần chạy bắt đầu; tại 32, 64 trong 128; tại 64, 128 trong 256. Ba seed với server mới đưa token đầu tiên lại đúng thứ tự, 209.98 ms ở 8 và 416.37 ở 32.

### The protocol

1. Bắt đầu mỗi lần chạy với cache rỗng. Khởi động lại server, hoặc gọi route đặt lại: `POST /reset_prefix_cache` trên vLLM, chỉ tồn tại với `VLLM_SERVER_DEV_MODE=1` và không bao giờ được để lộ, hoặc `--flush-cache` trên client SGLang, gọi `/flush_cache` sau warm-up. SGLang chỉ flush khi không request nào chạy hoặc chờ; nếu không route trả HTTP 400 và log nói vậy.
2. Dùng seed mới cho mỗi lần chạy, để dataset ngẫu nhiên gửi prompt mới.
3. Ghi các token đã cache. Đọc các counter prefix cache trước và sau lần chạy, hoặc bật số đếm theo phản hồi, `--enable-prompt-tokens-details` trên vLLM và `--enable-cache-report` trên SGLang.
4. Viết thiết lập cache và token đã cache cạnh kết quả.

Công cụ quét vLLM đặt lại cache server giữa các lần chạy cho bạn.

## Follow-ups

- **Level 2:** Tại sao thời gian mỗi token gần như không dịch chuyển giữa các lần đã flush và chưa flush? Expected: một cache hit bỏ công việc prefill và để decode như cũ, vì vậy TTFT giảm và TPOT dịch chuyển dưới 15 phần trăm.
- **Level 3:** Trên GB10 một lần chạy đọc token đầu tiên nhanh hơn ở giới hạn 32 so với 8. Điều đó có thể như thế nào? Expected: các lần chạy dùng chung một server và seed, vì vậy lần ở 32 tìm thấy 64 trong 128 prompt trong cache từ các lần trước và một nửa request bỏ prefill; ba seed trên server mới đưa token đầu tiên lại đúng thứ tự.
- **Level 3:** Route flush trên SGLang trả HTTP 400. Điều gì xảy ra? Expected: server chỉ flush khi không request nào chạy hoặc chờ; một request vẫn đang chờ, vì vậy flush không chạy và log nói vậy, và lần chạy phải chờ hoặc khởi động lại server.
- **Level 4:** Bạn sẽ chủ ý đưa hiệu ứng cache ấm thành một phần benchmark như thế nào? Expected: đo nó như một trục riêng; ghi token đã cache mỗi lần chạy từ counter hoặc trường theo phản hồi, và báo cáo một hàng cache ấm cạnh hàng lạnh, mỗi hàng với hit rate, thay vì để một cơ cấu chưa biết của hai loại đặt điểm gối.

## Wrong answers

- "Bước nhảy từ 0.3 đến 1.8 s giữa 16 và 32 người dùng là điểm gối." Phép quét đó chạy không đặt lại, vì vậy phần lớn request dưới 32 người dùng bỏ prefill; với đặt lại ITL P99 nhảy từ khoảng 70 lên 522 ms giữa 8 và 16 người dùng, và đó là điểm gối.
- "Tắt prefix cache cho benchmark." Production chạy với nó bật; thay vào đó đặt lại giữa các lần chạy, dùng seed mới mỗi lần và ghi token đã cache.
- "Thời gian mỗi token cũng bị thổi phồng, vì vậy bỏ toàn bộ phép quét." Một hit chỉ bỏ công việc prefill; thời gian mỗi token thay đổi dưới 15 phần trăm giữa các lần đã flush và chưa flush, vì vậy cột TPOT đứng vững và cột TTFT không.
- "Dataset ngẫu nhiên cho prompt mới mỗi lần chạy." Với cùng seed client gửi cùng prompt; dataset chỉ ngẫu nhiên giữa các seed, vì vậy dùng seed mới mỗi lần.

## Taught in

[Benchmark server trong 15 phút](../../../manuals/vllm-101/sections/5-1-benchmark-your-server-in-15-minutes.md) và [phần benchmark SGLang](../../../manuals/sglang-101/sections/5-1-sglang-benchmark-serving.md) cho thấy các lần đã flush và chưa flush và quy trình đặt lại.
