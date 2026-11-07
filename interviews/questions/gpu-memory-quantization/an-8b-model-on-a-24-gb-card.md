---
id: an-8b-model-on-a-24-gb-card
title: Why an 8B model fails to start on a 24 GB card
card: gpu-memory-quantization
kind: estimate
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [screen, debugging]
tags: [max-model-len, kv-pool, startup, l4, fp8]
minutes: 8
lessons: []
manuals: [vllm-101#s-serve-long-contexts-and-hybrid-models, vllm-101#s-count-the-memory-before-you-pick-a-gpu, sglang-101#s-quantization]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Đồng đội của bạn khởi động Qwen/Qwen3-8B ở BF16 trên một L4 không có cờ, và khởi động thất bại với một lỗi về KV cache và --max-model-len. Cùng lệnh hoạt động trên một card lớn hơn. Giải thích thất bại bằng số, và nói bạn đặt gì.

## Short answer

Cấu hình mô hình cho một ngữ cảnh 40,960 token, và vLLM lấy đó làm độ dài tối đa khi bạn không đặt gì. Ở 144 KiB mỗi token một request ở độ dài đó cần 5.6 GiB KV cache, và trên một card 24 GB các trọng số 16.4 GB có thể để lại ít hơn mức đó, vì vậy phép kiểm tra khởi động thất bại trước khi dòng pool in. Đặt `--max-model-len` bằng prompt cộng câu trả lời dài nhất mà người dùng gửi; pool giữ cùng kích thước, và giới hạn chỉ ngăn một request đòi tất cả.

## Full answer

### The arithmetic

Các trọng số Qwen3-8B ở BF16 chiếm 16.4 GB. SGLang đo việc nạp trên cùng card ở 15.28 GB và còn 6.59 GB, từ đó định một pool 24,094 token, 1.65 GB cho key và 1.65 GB cho value, ở tỷ lệ bộ nhớ 0.85. Một pool kích thước đó giữ khoảng 3.31 GiB. Một request ở độ dài mặc định 40,960 token cần 40,960 nhân 144 KiB, là 5.6 GiB, hơn toàn bộ pool. vLLM kiểm tra rằng ít nhất một request ở độ dài tối đa vừa, vì vậy khởi động dừng.

### Set the length on purpose

Đặt `--max-model-len` bằng prompt cộng câu trả lời dài nhất mà người dùng gửi. Kích thước pool giữ nguyên. Một giới hạn ngắn hơn chỉ ngăn một request đòi toàn bộ pool, và cho phép phép kiểm tra khởi động đạt. Dòng pool rồi in mức đồng thời tối đa tại độ dài đó: trên L4 nó là `GPU KV cache size: 24,096 tokens, Maximum concurrency for 8,192 tokens per request: 2.94x`. Các request thật giữ ít hơn giới hạn, vì vậy nhiều hơn vừa: khoảng 37 người dùng với mỗi người 512 token prompt và 128 token đầu ra.

### Check the length after an upgrade

Một số mô hình mở rộng ngữ cảnh bằng một phương pháp điều chỉnh tỷ lệ. Trong bản phát hành 0.30.0 vLLM thay đổi cách đọc phương pháp đó, và với một số mô hình độ dài vLLM suy ra từ cấu hình trở nên ngắn hơn; ghi chú phát hành đưa ra một mô hình đi từ 131,072 xuống 32,768 token. Sau một nâng cấp, đọc độ dài suy ra trong log khởi động, và tự đặt độ dài nếu nó thay đổi.

### Other ways to make room

Checkpoint FP8 của cùng mô hình nạp 8.81 GB trọng số trên L4 và để lại 13.06 GB. Với cả cache FP8, pool là 142,369 token so với 24,094. Một tỷ lệ bộ nhớ đặt quá thấp có hiệu ứng ngược: ở 0.74 pool BF16 là 6,559 token, và bốn prompt dùng chung 2,048 token không còn vừa cùng nhau.

### Check the setup

Dòng pool chỉ in khi khởi động thành công. Nếu khởi động dừng với lỗi về cache và độ dài tối đa, hạ `--max-model-len` đến khi dòng pool in, đọc mức đồng thời, và so sánh với những người dùng bạn dự định phục vụ ở độ dài đầy đủ.

## Follow-ups

- **Level 2:** Hạ độ dài mô hình tối đa có cho bạn thêm người dùng không? Expected: không; pool giữ cùng kích thước, và giới hạn chỉ ngăn một request lấy tất cả và cho phép phép kiểm tra khởi động đạt; thêm người dùng cần một pool lớn hơn, từ cache FP8, trọng số FP8 hoặc một card lớn hơn.
- **Level 3:** Cùng mô hình đã khởi động tháng trước và thất bại sau một nâng cấp với cùng cờ. Bạn kiểm tra gì? Expected: độ dài ngữ cảnh suy ra trong log khởi động; một bản phát hành thay đổi cách đọc phương pháp điều chỉnh tỷ lệ và rút ngắn độ dài một mô hình từ 131,072 xuống 32,768, và một thay đổi chiều ngược có thể làm phép kiểm tra thất bại, vì vậy tự đặt độ dài.
- **Level 4:** Ước tính pool khi checkpoint FP8 thay BF16 trên cùng card và cache cũng FP8. Expected: trọng số giảm xuống 8.81 GB và để lại 13.06 GB, và mỗi token chiếm một nửa byte, vì vậy pool tăng từ 24,094 lên 142,369 token trong lần chạy của tài liệu.

## Wrong answers

- "Card quá nhỏ cho một mô hình 8B." Các trọng số vừa với khoảng 6.59 GB còn dư; phép kiểm tra thất bại vì một request ở độ dài mặc định 40,960 token cần 5.6 GiB cache, vì vậy đặt độ dài theo thứ người dùng gửi.
- "Tăng tỷ lệ bộ nhớ để nó khởi động." Khoảng cách giữa 5.6 GiB và chỗ còn lại lớn hơn mức một bước tỷ lệ có thể lấp trên card này; độ dài là đòn bẩy, và một tỷ lệ đặt quá cao không để lại gì cho activation.
- "Hạ độ dài tối đa để vừa thêm người dùng." Nó làm khởi động vừa, không phải thêm người dùng; kích thước pool không đổi theo giới hạn.
- "KV pool được định kích thước từ các trọng số." Nó được định từ phần còn lại sau trọng số và profile khởi động, vì vậy đọc dòng bộ nhớ KV khả dụng, không phải số tham số.

## Taught in

[Phục vụ ngữ cảnh dài và mô hình lai](../../../manuals/vllm-101/sections/2-6-serve-long-contexts-and-hybrid-models.md) giải thích phép kiểm tra độ dài, [Đếm bộ nhớ trước khi chọn GPU](../../../manuals/vllm-101/sections/2-1-count-the-memory-before-you-pick-a-gpu.md) định kích thước pool, và [phần lượng tử hóa SGLang](../../../manuals/sglang-101/sections/4-3-quantization.md) cho thấy các dòng khởi động trên cùng card.
