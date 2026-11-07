---
id: fp8-grew-the-pool-twice
title: Why FP8 grew the pool 4.77 times and not 2
card: gpu-memory-quantization
kind: estimate
level: 3
roles: [inference-engineer]
rounds: [ml-depth, system-design]
tags: [fp8, kv-pool, gb10, weights, capacity]
minutes: 8
lessons: []
manuals: [sglang-101#s-quantization]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Trên một GB10 một server BF16 của Qwen/Qwen3-30B-A3B-Instruct-2507 nạp 57.75 GB trọng số và định một KV pool 227,243 token. Bạn chuyển sang checkpoint FP8 và thêm `--kv-cache-dtype fp8_e4m3` ở cùng tỷ lệ bộ nhớ. Ước tính pool mới, và giải thích tại sao nó không đơn giản gấp đôi pool cũ.

## Short answer

Hai hiệu ứng nhân nhau. Các trọng số FP8 giảm xuống 29.75 GB và giải phóng 28.00 GB, mà tỷ lệ giao cho pool, vì vậy pool tăng từ 20.80 GB lên 49.58 GB theo đơn vị của log; và mỗi token chiếm một nửa byte, 49,152 thay vì 98,304 cho 48 lớp với 4 KV head kích thước 128. Pool đi từ 227,243 lên 1,083,008 token, nhiều gấp 4.77 lần, và thời gian nạp giảm từ 323.61 s xuống 152.29 s.

## Full answer

### The two startup logs

Server BF16 nạp các trọng số trong 323.61 s với mức sử dụng bộ nhớ 57.75 GB và cấp phát một cache 227,243 token, 20.80 GB theo đơn vị của log. Server FP8 ghi log `Detected fp8 checkpoint`, rồi `Using FP8 KV cache but no scaling factors provided. Defaulting to scaling factors of 1.0`, nạp trong 152.29 s với 29.75 GB, và cấp phát 1,083,008 token, 24.79 GB cho key và 24.79 GB cho value. Cả hai dùng `--mem-fraction-static 0.7`, và không bên nào nhận cờ `--quantization`, vì SGLang đọc phương pháp từ checkpoint.

### The arithmetic

Tỷ lệ cố định phần dành cho trọng số và pool cùng nhau. Trọng số nhỏ hơn để lại nhiều hơn phần đó cho pool: các trọng số giải phóng 28.00 GB và pool tăng 28.78 GB. Cùng lúc mỗi token cần một nửa byte với cache FP8. Hai hệ số nhân nhau, là cách 227,243 token thành 1,083,008. GB10 có 121.7 GiB bộ nhớ, vì vậy pool BF16 chưa bao giờ thiếu trong phép quét vòng kín; trên L4, nơi các trọng số chiếm phần lớn card, cùng cặp tăng pool từ 24,094 lên 142,369 token, 5.91 lần.

### Speed moved too

| Mức đồng thời | BF16 token đầu ra/s | FP8 token đầu ra/s | BF16 TPOT trung vị | FP8 TPOT trung vị |
|---|---|---|---|---|
| 1 | 29.14 | 51.50 | 32.52 ms | 18.41 ms |
| 8 | 74.11 | 137.00 | 102.21 ms | 54.96 ms |
| 32 | 150.66 | 283.19 | 201.91 ms | 104.12 ms |
| 64 | 235.38 | 440.86 | 254.06 ms | 131.78 ms |

FP8 cho throughput gấp 1.73 đến 1.88 lần ở mọi mức đồng thời. Decode trên máy này đọc trọng số từ một bộ nhớ có băng thông vừa phải, vì vậy một nửa byte trọng số cho tốc độ gần gấp đôi. Đó là một kết quả khác một báo cáo thực địa chỉ về cache FP8, chậm hơn vài phần trăm mỗi token và thắng về dung lượng.

### The scales

Dòng log thứ hai là cảnh báo. Không file scale nào được đưa vào, vì vậy mọi scale KV là 1.0. Weight index của checkpoint FP8 này liệt kê các weight scale và không có KV scale, vì vậy weight scale không ngụ ý cache scale. Cả hai server viết cùng 12 token cho một prompt greedy, không phải một phép kiểm tra độ chính xác. Phép kiểm tra GSM8K trên 500 câu hỏi, chạy trên L4 với mô hình 8B, cho các khoảng chồng nhau cho mọi cấu hình FP8, và đó là dạng phép kiểm tra cần chạy trên mô hình riêng của bạn.

## Follow-ups

- **Level 3:** Tại sao pool tăng 4.77 lần chứ không phải 2 lần? Expected: giảm một nửa byte mỗi token tăng gấp đôi token trong cùng bộ nhớ, và các trọng số nhỏ hơn cũng cho pool thêm 28.78 GB bộ nhớ; hai hệ số nhân nhau.
- **Level 3:** Tại sao tỷ số là 5.91 trên L4 và 4.77 trên GB10 cho cùng thay đổi? Expected: trên card 24 GB trọng số chiếm phần lớn bộ nhớ, vì vậy giảm một nửa chúng tăng hơn gấp đôi byte pool; trên GB10 trọng số là một phần nhỏ hơn, vì vậy bộ nhớ được giải phóng ít quan trọng hơn.
- **Level 4:** Cả hai server trả về một câu trả lời 12 token giống hệt cho request đầu tại temperature 0. Đó có phải một phép kiểm tra độ chính xác? Expected: không, một prompt không chứng minh gì; chạy một benchmark chẳng hạn tập 500 câu hỏi GSM8K và so sánh các khoảng, và đọc cảnh báo scale, vì checkpoint này có weight scale và không có KV scale, vì vậy cache chạy với scale 1.0.

## Wrong answers

- "FP8 giảm một nửa byte, vì vậy pool gấp đôi." Các trọng số cũng co từ 57.75 xuống 29.75 GB và bộ nhớ đó đi vào pool, vì vậy pool tăng 4.77 lần trên GB10 và 5.91 lần trên L4.
- "Checkpoint FP8 có scale, vì vậy KV cache đã được hiệu chuẩn." Weight index của nó liệt kê các weight scale và không có KV scale; server ghi log rằng nó dùng scale 1.0 cho cache.
- "Truyền --quantization fp8 để server biết." SGLang tự phát hiện checkpoint, và một cờ không khớp checkpoint phát sinh lỗi lúc khởi động; không truyền cờ cho một checkpoint được công bố.
- "Tăng tốc đến từ pool lớn hơn." Pool BF16 trên GB10 chưa bao giờ thiếu; tốc độ đến từ một nửa byte trọng số mỗi bước decode trên một bộ nhớ có băng thông vừa phải, 1.73 đến 1.88 lần ở mọi mức đồng thời.

## Taught in

[Phần lượng tử hóa SGLang](../../../manuals/sglang-101/sections/4-3-quantization.md) có cả hai log khởi động và phép quét.
