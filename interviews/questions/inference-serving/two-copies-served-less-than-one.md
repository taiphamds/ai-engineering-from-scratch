---
id: two-copies-served-less-than-one
title: Two data-parallel copies, less output than one card
card: inference-serving
kind: debug
level: 3
roles: [inference-engineer]
rounds: [debugging, system-design]
tags: [data-parallel, kv-pool, round-robin, load-balance, shared-gpu]
minutes: 10
lessons: []
manuals: [sglang-101#s-tp-size-dp-size-and-attn-dp-size]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Bạn thêm một L4 thứ hai vào một máy chủ SGLang với `--dp-size 2` và kỳ vọng thông lượng khoảng gấp đôi. Lượt quét cho thấy ít hơn mức một card đã cho: ở 64 người dùng, cặp đạt đỉnh 64 token mỗi giây rồi giảm xuống 42, và token đầu tiên P99 là 391 giây so với 33.4 trên một card. Cả hai bản sao nạp trọng số mà không có lỗi. Bạn kiểm tra gì, và điều gì đã sai?

## Short answer

Đọc dòng `KV Cache is allocated` của mọi rank DP trước khi tin tổng. Trên cặp đó, card thứ hai chạy hai pod của nhóm khác, nên bản sao của nó có 3.17 GB trống sau trọng số so với 6.59 GB và một pool 2,925 token so với 24,094, bằng một phần tám của bản sao đầu. Controller round-robin không xem pool, nên nó gửi mỗi yêu cầu thứ hai đến bản sao nhỏ, nơi 4 chạy và 59 chờ, trong khi bản sao lớn giữ một đến ba yêu cầu và dùng 2 đến 7 phần trăm pool của nó.

## Full answer

### The two pools

Các dòng khởi động của hai rank kể câu chuyện trước yêu cầu đầu tiên:

- `DP0` nạp trọng số trong 3.61 s và còn 6.59 GB; pool của nó là 24,094 token.
- `DP1` nạp cùng 15.28 GB trọng số trong 3.73 s và còn 3.17 GB, vì hai pod mỗi pod 1,746 MiB giữ phần còn lại; pool của nó là 2,925 token. Bốn yêu cầu 640 token lấp đầy nó.

Các dòng decode ở 64 yêu cầu đang chạy cho thấy kết quả. `DP1` chạy 4 yêu cầu ở token usage từ 0.82 đến 0.87 với 59 trong hàng đợi của nó. `DP0` chạy một đến ba yêu cầu ở mức sử dụng từ 0.02 đến 0.07 với hàng đợi trống.

### Why the client could not help

Benchmark giữ 64 yêu cầu mở cùng lúc. Round robin luân phiên các yêu cầu giữa các bản sao mà không xem pool hay hàng đợi. Ở 64 người dùng, 63 yêu cầu nằm trên bản sao nhỏ, 4 đang chạy và 59 đang chờ. Client không thể gửi thêm công việc cho bản sao lớn đến khi bản sao nhỏ trả lại một chỗ.

### What it cost

Một L4 đạt 270 token mỗi giây. Cặp đạt đỉnh 64 rồi giảm xuống 42 khi xung nhịp của nó giảm: nó chạy ở 765 và 675 MHz ở 32 và 64 người dùng, dưới ngưỡng xung nhịp của tài liệu, trong khi card đơn chạy ở 1,320 và 1,080 MHz, nên một phần mất mát là xung nhịp. Ở 64 người dùng, token đầu tiên P99 trung vị của ba seed là 33.4 giây trên một card và 391 giây trên cặp. Đến 4 người dùng, cặp đã chậm hơn 16 đến 41 phần trăm vì một lý do tài liệu không cô lập được, và ở một người dùng nó mất 79.6 ms mỗi token so với 60.2 ở xung nhịp cao hơn. Với một tốc độ đến cố định, cặp hoàn thành tối đa 0.21 yêu cầu mỗi giây trong mục tiêu độ trễ, so với 0.96 cho một card.

### Route by tokens

`--load-balance-method total_tokens` gửi mỗi yêu cầu đến bản sao giữ ít token nhất. Trên cùng cặp không đồng đều, nó cho 114.7 token mỗi giây ở 64 người dùng, so với 41.7 với round robin và 250.9 trên một L4. Ở 8 người dùng, nó cho 92.1 so với 64.2 và 112.6. Token đầu tiên trung vị ở 64 người dùng giảm từ 4,763 xuống 3,977 ms. Lần chạy đó có xung nhịp trung vị 1,020 MHz so với 675 trong lần chạy round-robin, nên một phần mức tăng là card. Một mức tăng lớn so với round robin, và vẫn là mất mát so với một card.

### Tensor parallelism would have refused

`--tp-size 2` trên cùng cặp dừng hai giây sau khi thư viện collective khởi động. Trước khi nạp trọng số, mỗi rank đo bộ nhớ trống của nó và nhóm giữ giá trị nhỏ nhất. Nếu giá trị đó dưới 90 phần trăm bộ nhớ trống cục bộ, máy chủ dừng. Card được chia sẻ có 18.28 GB trống so với 19.53 GB mà kiểm tra yêu cầu. Mỗi rank của một nhóm tensor giữ cùng tỷ phần trọng số và cùng pool, nên card nhỏ nhất đặt kích thước cho tất cả. `--dp-size 2` không có kiểm tra như vậy, vì mỗi bản sao tự định cỡ pool, nên nó khởi động và thua.

### The rule

Chỉ thêm dung lượng bằng các bản sao khi mọi bản sao có pool gần bằng nhau. Cấp cho một nhóm các GPU nguyên vẹn trên một máy được chia sẻ. Kiểm tra dòng `#tokens` của mỗi rank DP trước khi trông cậy vào tổng. Cách sửa khác, hai máy chủ riêng sau một gateway có trọng số, tài liệu không đo.

## Follow-ups

- **Level 3:** Tại sao bản sao lớn gần như nhàn rỗi trong khi 59 yêu cầu chờ? Expected: benchmark là một vòng kín với 64 yêu cầu mở, round robin đặt một nửa chúng lên bản sao nhỏ, và client không thể gửi công việc mới cho bản sao lớn đến khi bản sao nhỏ trả lại một chỗ.
- **Level 3:** Tại sao một phép chia tensor từ chối cùng cặp trong khi cặp data-parallel khởi động? Expected: tensor parallelism kiểm tra rằng mọi rank có ít nhất 90 phần trăm bộ nhớ trống cục bộ, vì mọi rank giữ cùng tỷ phần và pool, và card được chia sẻ có 18.28 GB so với 19.53 GB yêu cầu; data parallelism tự định cỡ pool của mỗi bản sao và không có kiểm tra như vậy.
- **Level 4:** Định tuyến theo tổng token nâng cặp lên 114.7 ở 64 người dùng. Vấn đề đã được giải quyết chưa? Expected: chưa; một card riêng lẻ cho 250.9, lần chạy định tuyến theo token cũng có xung nhịp cao hơn lần chạy round-robin nên một phần mức tăng là card, và cách sửa là các pool bằng nhau, với các GPU nguyên vẹn cho mỗi bản sao hoặc các máy chủ riêng sau một gateway có trọng số.

## Wrong answers

- "Cả hai bản sao đã nạp, nên card thứ hai ổn." Các trọng số cần 15.28 GB trên mỗi card; pool được định cỡ từ phần còn lại, và card được chia sẻ còn 3.17 GB so với 6.59, bằng một phần tám pool.
- "Controller cân bằng tải, nên một bản sao chậm nhận ít yêu cầu hơn." Round robin mặc định không xem pool hay hàng đợi; nó luân phiên các yêu cầu, nên 63 trên 64 yêu cầu mở cuối cùng nằm trên bản sao nhỏ.
- "Cặp chậm hơn vì xung nhịp, nên chạy lại khi card mát." Cặp thực sự chạy dưới ngưỡng xung nhịp ở 32 và 64 người dùng, nhưng nó đã chậm hơn 16 đến 41 phần trăm đến 4 người dùng, và log cho thấy 59 yêu cầu đang chờ trên một bản sao; pool giải thích hình dạng và xung nhịp giải thích một phần độ lớn.

## Taught in

[Phần parallelism của SGLang](../../../manuals/sglang-101/sections/6-1-tp-size-dp-size-and-attn-dp-size.md) có danh sách hai pool, lượt quét và cách sửa định tuyến.
