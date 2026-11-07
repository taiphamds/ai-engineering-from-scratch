---
id: a-cap-only-chooses-who-waits
title: An admission cap decides who waits
card: inference-serving
kind: tradeoff
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [design-review, system-design]
tags: [admission, max-num-seqs, p99-itl, ttft, retraction]
minutes: 10
lessons: []
manuals: [vllm-101#s-tune-chat-for-many-users, sglang-101#s-admission-and-retraction]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Ở 32 người dùng đồng thời dịch vụ chat L4 của bạn stream kém: khoảng giữa token P99 là 613 ms, và mục tiêu là 100 ms trở xuống mỗi token với token đầu tiên trong 1 giây. Một đồng đội đề xuất `--max-num-seqs 16` để mỗi bước giữ ít request hơn. Bạn mong đợi gì, và phép đo nói gì?

## Short answer

Một giới hạn không tạo chỗ cho thêm người dùng; nó chỉ chọn ai chờ. Với giới hạn 16 và 32 người dùng, mỗi stream mượt hơn một chút, ITL trung vị 69.8 so với 80.5 ms và ITL P99 595 so với 613, nhưng một nửa người dùng chờ trong hàng đợi, token đầu tiên trung vị đi từ 1.8 lên 12.3 s, và đầu ra giảm 38 phần trăm xuống 171.8 token mỗi giây. Ở 64 người dùng không giới hạn nào tài liệu thử đưa ITL P99 dưới 1.1 s, vì vậy cách sửa trên card này là ít người dùng mỗi replica hơn, không phải một giới hạn.

## Full answer

### Where the stream broke

Qwen/Qwen3-8B trên L4 trong phiên xung nhịp đầy đủ, 512 token prompt và 128 token đầu ra, ba seed:

| Người dùng | Token đầu ra/s | TTFT trung vị | P99 ITL | Đạt mục tiêu | Xung SM trung vị |
|---|---|---|---|---|---|
| 8 | 112.8 | 0.25 s | 67 ms | 75% | 1,485 MHz |
| 16 | 201.3 | 0.29 s | 85 ms | 64% | 1,455 MHz |
| 32 | 275.1 | 1.80 s | 613 ms | 0% | 1,275 MHz |
| 64 | 242.3 | 11.18 s | 1,233 ms | 0% | 1,005 MHz |

Phép quét này không đặt lại prefix cache, vì vậy các hàng dưới 32 người dùng đọc quá tốt; với đặt lại tỷ lệ đạt mục tiêu ở 16 người dùng giảm xuống 25 phần trăm và ITL P99 ở đó là 522 ms. Mỗi bước trên GPU này có ngân sách 2,048 token, và các chunk prompt mới dùng chung bước với các stream đang chạy, vì vậy stream tạm dừng.

### The cap at 32 users

| Cấu hình | Token đầu ra/s | TTFT trung vị | ITL trung vị | P99 ITL | Xung SM trung vị |
|---|---|---|---|---|---|
| mặc định, 256 | 275.1 | 1.8 s | 80.5 ms | 613 ms | 1,275 MHz |
| `--max-num-seqs 16` | 171.8 | 12.3 s | 69.8 ms | 595 ms | 1,365 MHz |

Lần chạy giới hạn có xung cao hơn, vì vậy xung không giải thích tổn thất. Stream mượt hơn một chút, một nửa người dùng chờ token đầu tiên, và đầu ra giảm 38 phần trăm.

### Caps at 64 users

Với xung khóa ở 900 MHz, hai seed và đặt lại mỗi lần chạy, so với SGLang trên cùng card:

| Cấu hình | TTFT trung vị | P99 ITL | Token đầu ra/s |
|---|---|---|---|
| SGLang mặc định | 19.4 s | 143 đến 153 ms | 225 đến 231 |
| vLLM mặc định | 11.8 s | 1,359 ms | 220 |
| `--max-num-seqs 32` | 17.2 đến 20.6 s | 1,163 đến 1,399 ms | 196 đến 230 |
| `--max-num-active-seqs 48` | 11.8 s | 1,329 đến 1,373 ms | 215 đến 218 |
| `--max-num-active-seqs 16` | 44.8 đến 48.8 s | 1,133 đến 1,139 ms | 129 đến 136 |

Không giới hạn nào đưa ITL P99 của vLLM gần giá trị SGLang. Ở 16 hoặc 32 request đang chạy ITL P99 giữ trên 1.1 s và token đầu tiên chờ 17 đến 65 s. Trên card này một giới hạn không sửa các khoảng dài ở 64 người dùng. Ít người dùng mỗi replica hơn thì có.

### The small pool is the other queue

Một pool 6,560 token so với 24,096 ở 32 người dùng cho thời gian đến token đầu tiên trung vị 31.6 s so với 3.1 s và token đầu tiên P99 48.0 so với 7.1 s. Một request 640 token cần 640 token pool khi kết thúc, vì vậy khoảng 10 request vừa trong pool nhỏ và 22 còn lại chờ một request đang chạy hoàn tất. Lần chạy pool nhỏ cũng giảm xuống 248 MHz, nhưng một xung thấp hơn 3.6 lần không thể giải thích token đầu tiên muộn hơn 10 lần; hàng đợi giải thích.

### How SGLang admits, and why a queue is the honest failure

SGLang chỉ tiếp nhận một request khi dự báo vừa pool. Một request mới phải vừa token prompt chưa cache cộng `max_new_tokens` còn lại, chặn tại 4,096. Mỗi request đang chạy giữ lại `max_new_tokens` còn lại nhân một tỷ lệ bắt đầu ở 0.7 và giảm xuống 0.098 qua 600 bước decode, vì phần lớn request dừng sớm. Khi dự báo quá táo bạo, scheduler rút các request đang chạy về hàng đợi và chúng prefill lại. Trong một pool nhỏ 4,096 token với 16 người dùng mỗi người yêu cầu 512 token, chính xác năm request chạy mỗi lúc: mỗi token mất 24 ms khi request bắt đầu, và người dùng trung vị chờ 27.9 s cho token đầu tiên. Mọi request thành công. Một hàng đợi dài với token nhanh là kiểm soát tiếp nhận đang làm việc; một lần rút lại là cảnh báo, và hơn khoảng một lần mỗi phút là lỗi cấu hình. Đặt `max_new_tokens` thực tế trong client: một client yêu cầu 4,096 token và dùng 200 làm dự trữ của mọi request mới lớn quá khoảng 20 lần.

### What to do

1. Đặt mục tiêu cho token đầu tiên và thời gian mỗi token.
2. Quét người dùng với đặt lại mỗi lần chạy, và tìm số cuối đáp ứng cả hai.
3. Nếu mức sử dụng cache gần đầy và các request chờ, pool quá nhỏ: thêm chỗ bằng cache FP8 hoặc trọng số FP8.
4. Nếu pool còn chỗ và ITL P99 quá cao, GPU đầy: thêm GPU hoặc replica, và thực thi điểm gối trong client hoặc gateway.
5. Đọc ITL P99 khi chọn engine cho chat. Trên GB10 hai engine cho cùng đầu ra ở 32 và 64 người dùng, và ITL P99 của vLLM là 478 so với 220 ms ở 32 người dùng.

## Follow-ups

- **Level 3:** Lần chạy giới hạn có xung cao hơn lần mặc định. Tại sao điều đó quan trọng cho kết luận? Expected: xung cao hơn nên giúp lần giới hạn, vì vậy xung không giải thích đầu ra thấp hơn 38 phần trăm; tổn thất thuộc giới hạn.
- **Level 3:** SGLang quyết định tiếp nhận một request như thế nào, và điều gì xảy ra khi dự báo sai? Expected: request mới phải vừa prompt chưa cache cộng max_new_tokens còn lại, và các request đang chạy giữ lại đầu ra còn lại nhân tỷ lệ bắt đầu ở 0.7 và giảm xuống 0.098 qua 600 bước decode; khi dự báo quá táo bạo scheduler rút các request đang chạy về hàng đợi và chúng prefill lại.
- **Level 4:** Pool còn chỗ, khoảng đuôi vẫn trên mục tiêu, và giới hạn chỉ chuyển thời gian chờ. Còn gì? Expected: GPU đầy; thêm GPU hoặc replica và đặt ít người dùng hơn trên mỗi cái, thực thi điểm gối trong client hoặc gateway, và đọc ITL P99 khi chọn engine, vì tại cùng đầu ra hai engine khác khoảng gấp đôi trên GB10.

## Wrong answers

- "Một giới hạn request đang chạy tạo chỗ cho thêm người dùng." Nó chỉ chọn ai chờ; ở 32 người dùng giới hạn 16 chuyển thời gian chờ vào hàng đợi, với token đầu tiên tại 12.3 s, và tốn 38 phần trăm đầu ra.
- "Hạ độ dài mô hình tối đa để giúp hàng đợi." Pool giữ cùng kích thước, vì vậy không giúp khi mức sử dụng cache gần đầy; thêm chỗ bằng cache FP8 hoặc trọng số FP8.
- "Client nên yêu cầu max_new_tokens lớn để an toàn." Dự báo tiếp nhận dành riêng nó; một client yêu cầu 4,096 token và dùng 200 làm dự trữ mọi request mới lớn quá khoảng 20 lần, vì vậy ít request được tiếp nhận hơn.
- "Một hàng đợi nghĩa là server hỏng." Một hàng đợi dài với token nhanh là kiểm soát tiếp nhận đang làm việc; năm request được tiếp nhận trong lần pool nhỏ nhận 24 ms mỗi token trong khi người dùng trung vị chờ 27.9 s, và một lần rút lại, không phải hàng đợi, là cảnh báo.

## Taught in

[Điều chỉnh chat cho nhiều người dùng](../../../manuals/vllm-101/sections/3-1-tune-chat-for-many-users.md) đo các giới hạn và pool nhỏ, và [Tiếp nhận và rút lại](../../../manuals/sglang-101/sections/2-3-admission-and-retraction.md) giải thích dự báo.
