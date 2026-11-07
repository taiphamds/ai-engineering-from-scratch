---
id: speculation-on-real-prompts
title: Speculation won the benchmark and lost in production
card: inference-serving
kind: debug
level: 3
roles: [inference-engineer]
rounds: [debugging, ml-depth]
tags: [speculative-decoding, eagle3, kv-pool, max-running-requests, datasets]
minutes: 10
lessons: []
manuals: [sglang-101#s-speculative-decoding]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một đồng đội benchmark EAGLE-3 trên Qwen/Qwen3-8B trên một L4 với tập dữ liệu random và thấy thời gian mỗi token giảm một nửa ở 8 người dùng. Trong production, với 32 người dùng chat đồng thời, thông lượng đầu ra không tăng và token đầu tiên đến muộn hơn. Độ dài chấp nhận trong log có vẻ ổn. Điều gì đã xảy ra?

## Short answer

Hai điều, và độ dài chấp nhận che giấu cả hai. Trên một card 24 GB, trọng số nháp chiếm không gian pool: pool KV giảm từ 24,094 xuống 9,951 token, khoảng 15 trong số các yêu cầu 640 token, nên ở 32 người dùng phần lớn yêu cầu chờ một chỗ và token đầu tiên trung vị tăng từ 2,970 lên 8,040 ms. Tập dữ liệu cũng quan trọng: ở 32 người dùng, EAGLE-3 cho đầu ra gấp 1.6 lần trên GSM8K và prompt mã và không thêm đầu ra trên tập random hoặc ShareGPT, vì bản nháp chỉ có lợi khi GPU có thời gian nhàn rỗi để dành cho dự đoán.

## Full answer

### The L4 sweep

Máy chủ mặc định so với máy chủ EAGLE-3 với bản nháp `Tengyunw/qwen3_8b_eagle3`, ba seed mỗi điểm, 512 token vào và 128 ra:

| Mức đồng thời | TPOT trung vị mặc định | TPOT trung vị EAGLE-3 | Token đầu ra/s mặc định | Token đầu ra/s EAGLE-3 |
|---|---|---|---|---|
| 1 | 60.16 ms | 25.61 ms | 13.42 | 31.81 |
| 8 | 66.01 ms | 35.58 ms | 112.62 | 181.55 |
| 32 | 96.18 ms | 43.82 ms | 270.11 | 269.42 |
| 64 | 107.42 ms | 51.50 ms | 250.85 | 245.34 |

Độ dài chấp nhận là 2.73 đến 2.74 token mỗi bước ở mọi mức đồng thời. Mỗi token đi ra nhanh hơn 1.6 đến 2.3 lần ở mọi tải. Từ mức đồng thời 32, máy chủ không cung cấp nhiều token mỗi giây hơn mặc định.

### The pool explains the first half

Log khởi động của máy chủ EAGLE-3 cho thấy cái giá của một bản nháp trên một card nhỏ. Chỉ mô hình đích có một pool 24,094 token. Khi nạp bản nháp, pool chứa 9,951 token, khoảng 15 yêu cầu 640 token, và bản nháp chiếm gần 60 phần trăm pool. Với 15 yêu cầu trong pool, phần còn lại chờ một chỗ. Ở mức đồng thời 32, token đầu tiên trung vị là 8,040 ms với EAGLE-3 và 2,970 ms khi không có nó.

Cùng dòng log hiển thị `max_running_requests=48`. Các handler speculative đặt giới hạn đó khi bạn không đặt nó, với một cảnh báo cuộn đi trước yêu cầu đầu tiên. Trên GB10, nơi pool còn chỗ, giới hạn đó thay vào đó là giới hạn: ở 64 người dùng, thông lượng vẫn cao hơn với speculation, 276.32 so với 235.38 token mỗi giây, nhưng token đầu tiên trung vị là 7,772 ms so với 557 ms, vì 16 yêu cầu chờ sau 48 yêu cầu.

### The dataset explains the second half

Tập dữ liệu random ở phiên bản này lấy lượt đầu của các cuộc hội thoại ShareGPT và cắt hoặc lặp nó thành 512 token, với token kết thúc bị bỏ qua. Tài liệu sau đó chạy cùng lượt quét L4 trên bốn tập dữ liệu với xung nhịp khóa ở 900 MHz và xóa cache trước mỗi lần chạy:

| Tập dữ liệu | TPOT trung vị ở 8 người dùng, mặc định / EAGLE-3 / NGRAM | Token đầu ra/s ở 32 người dùng, mặc định / EAGLE-3 / NGRAM |
|---|---|---|
| random | 67.6 đến 68.2 / 33.8 đến 39.4 / 68.2 đến 71.4 ms | 250 đến 254 / 239 đến 242 / 236 đến 250 |
| ShareGPT | 66.4 đến 68.6 / 39.5 đến 43.1 / 69.5 đến 72.4 ms | 281 đến 288 / 277 đến 283 / 245 đến 256 |
| GSM8K | 65.5 / 33.3 đến 34.3 / 54.6 đến 55.0 ms | 397 / 648 đến 660 / 433 đến 435 |
| mã | 65.9 đến 66.4 / 36.8 / 58.2 đến 58.8 ms | 365 đến 366 / 566 đến 581 / 377 đến 386 |

EAGLE-3 giảm thời gian mỗi token khoảng một nửa ở 8 người dùng trên mọi tập dữ liệu, với độ dài chấp nhận từ 2.35 đến 2.78. Ở 32 người dùng nó cho đầu ra gấp 1.6 lần trên GSM8K và mã. Trên tập random và ShareGPT nó không cho thêm đầu ra, và token đầu tiên của nó đến muộn hơn 2 đến 3 lần, vì bản nháp chiếm không gian pool mà hàng đợi cần. NGRAM chỉ giúp trên GSM8K và mã, khoảng 1.1 đến 1.2 lần ở 8 người dùng, và trên hai tập còn lại nó chậm hơn, với P99 ITL từ 244 đến 779 ms.

### The card and the model decide

Cùng tính năng trên GB10 với Qwen3-30B-A3B mixture-of-experts giữ mức tăng ở mọi tải, thời gian mỗi token ngắn hơn 1.56 đến 1.89 lần, và vẫn cho thông lượng gấp 1.17 lần ở 64 người dùng. Cách lý giải của tài liệu: một mô hình dense đọc tất cả trọng số mỗi bước, nên một batch lớn hơn đã dùng phần tính toán dư, trong khi mô hình expert chỉ đọc các expert mà token của bước đó chọn và lượt xác minh chấm điểm bốn vị trí với trọng số nó đã đọc. Đó là một mô hình và một GPU.

Các nhóm khác tìm thấy cùng giới hạn. Một nghiên cứu benchmark tìm thấy rằng các prompt tổng hợp phóng đại thông lượng speculative trung bình 23 phần trăm, rằng độ dài nháp tốt nhất giảm xuống 1 khi batch tăng, và rằng các ID token ngẫu nhiên để 20 đến 30 phần trăm expert nhàn rỗi trong một số lớp. Một nghiên cứu năm 2025 về benchmark phục vụ thấy TPOT trung vị thấp hơn 1.3 lần và TPOT P99 cao hơn 1.16 lần với speculation, và token đầu tiên muộn hơn vì bản nháp chạy prefill riêng.

### What to do

1. Đọc dòng `KV Cache is allocated` của máy chủ speculative và so sánh nó với máy chủ thông thường.
2. Tự đặt `--max-running-requests`, từ mức đồng thời mà lượt quét của bạn cho thấy speculation vẫn thắng.
3. Benchmark với các prompt riêng và độ dài đầu ra thực của bạn, với `--disable-ignore-eos`, và đọc `accept len` trên chúng.
4. So sánh P99 ITL và P99 TTFT, không chỉ trung vị.
5. Bật speculation cho lưu lượng tương tác với ít người dùng mỗi replica; để nó tắt cho các công việc batch và cho mức đồng thời cao trên một card nơi pool là giới hạn.

## Follow-ups

- **Level 3:** Log hiển thị 2.73 token được chấp nhận mỗi bước bất kể tải. Tại sao điều đó không dự đoán được thông lượng? Expected: sự chấp nhận đo bản nháp đoán tốt thế nào, không phải GPU có thời gian nhàn rỗi cho các dự đoán hay pool có chỗ không; bản nháp chiếm không gian pool, hàng đợi tăng, nên mỗi token nhanh hơn còn máy chủ thì không.
- **Level 3:** Đồng đội lẽ ra nên đọc những dòng khởi động nào? Expected: dòng KV cache được cấp phát, 9,951 token so với 24,094 khi không có bản nháp, và giới hạn yêu cầu đang chạy là 48 mà speculation đặt khi bạn không đặt.
- **Level 4:** Trên GB10 với Qwen3-30B-A3B, mức tăng giữ ở 64 người dùng. Tại sao một mô hình expert có thể hoạt động khác? Expected: một mô hình dense đọc tất cả trọng số mỗi bước và một batch lớn hơn đã dùng phần tính toán dư; mô hình expert chỉ đọc các expert mà token của bước đó chọn, và lượt xác minh chấm điểm bốn vị trí với trọng số nó đã đọc, nên mức tăng giữ ở 1.56 lần hoặc hơn; tài liệu gọi đây là một cách lý giải từ một mô hình và một GPU.

## Wrong answers

- "Độ dài chấp nhận ổn, nên speculation đang hoạt động." Nó đo các dự đoán của bản nháp, không phải máy chủ; trên L4 mỗi token đến nhanh hơn 1.6 đến 2.3 lần ở mọi tải và máy chủ không cung cấp thêm token mỗi giây từ 32 người dùng.
- "Prompt random là văn bản thực, nên benchmark thực tế." Tập random cắt hoặc lặp lượt đầu của các cuộc hội thoại ShareGPT thành 512 token với token kết thúc bị bỏ qua; trên GSM8K và prompt mã, speculation cho đầu ra gấp 1.6 lần ở 32 người dùng, và trên ShareGPT nó không cho thêm gì.
- "Tăng --max-running-requests để cho thêm người dùng vào." Trên L4, pool chứa khoảng 15 yêu cầu, nên một giới hạn cao hơn không thay đổi gì; pool là giới hạn, và bản nháp chiếm gần 60 phần trăm của nó.
- "Dùng NGRAM thay vào đó, nó không cần trọng số nháp." Nó chỉ giúp trên GSM8K và mã, khoảng 1.1 đến 1.2 lần ở 8 người dùng, và trên hai tập còn lại nó chậm hơn với P99 ITL từ 244 đến 779 ms.

## Taught in

[Phần speculative decoding của SGLang](../../../manuals/sglang-101/sections/4-4-speculative-decoding.md) có các lượt quét L4 và GB10 và kiểm thử bốn tập dữ liệu.
