---
id: size-the-pool-from-peak
title: A bigger KV pool that bought nothing, until it did
card: cost-capacity
kind: tradeoff
level: 3
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, system-design]
tags: [kv-pool, capacity, mem-fraction, open-loop]
minutes: 12
lessons: []
manuals: [sglang-101#s-mem-fraction-static-and-startup-sizing]
practice: []
cheatsheet: [sglang-serving, inference-load-testing]
related: [inference-serving/goodput-sets-the-cap, inference-serving/kv-pool-users-fit, scenarios/prefix-cache-inflated-benchmark]
updated: 2026-11-03
---

Một đồng đội tăng tỷ lệ bộ nhớ của một máy chủ tự lưu trữ và tăng KV pool thêm 63 phần trăm. Benchmark vòng kín ở 64 người dùng đồng thời không thay đổi. Họ muốn hoàn tác thay đổi, vì bộ nhớ thêm không mua được gì. Bạn nói gì với họ, và phép đo nào phân định điều đó?

## Short answer

Benchmark chưa bao giờ lấp đầy pool, vì vậy bộ nhớ thêm không có việc gì để làm. Ở 64 người dùng các request đang chạy giữ khoảng 11 phần trăm pool, và throughput giữ trong phạm vi 2 phần trăm. Dưới một tải quá mức vòng mở cùng pool đó có ý nghĩa: ở tỷ lệ nhỏ hơn pool đầy 96 phần trăm với các request chờ bên ngoài nó, và pool lớn hơn hoàn tất thêm khoảng một phần ba số request mỗi giây. Định kích thước pool từ mức sử dụng token tại tải đỉnh, gồm cả các đợt bùng phát, và đọc nó từ các dòng decode của scheduler, không từ một phép quét vòng kín.

## Full answer

### What the closed loop showed

Tài liệu chạy cùng phép quét tải ở một tỷ lệ 0.7 và ở 0.82 trên một máy, ba seed mỗi điểm. Pool BF16 tăng từ 234,600 lên 383,065 token. Ở mọi mức đồng thời hai trung vị nằm trong phạm vi 2 phần trăm của nhau. Dòng decode có mức sử dụng token cao nhất trong toàn bộ phép quét pool lớn hơn cho thấy tại sao: 64 request đang chạy giữ 40,751 token, 11 phần trăm pool. Trên pool nhỏ hơn mức sử dụng cao nhất trong phép quét là 18 phần trăm. Một pool không bao giờ đầy không có gì để cho.

### What the open loop showed

Phép quét vòng mở đưa vào 16 request mỗi giây, nhiều hơn máy phục vụ. Ở 0.7 dòng decode đọc được 374 request đang chạy tại mức sử dụng token 0.96, với 101 request đang chờ trong hàng đợi. Ở 0.82 tất cả 480 request của lần chạy vừa cùng lúc tại mức sử dụng 0.75, không có request nào chờ. Lần chạy hoàn tất 5.19 request mỗi giây so với 3.88, nhiều hơn 34 phần trăm, và 664 so với 497 token đầu ra mỗi giây. Hai lần chạy cách nhau một ngày, vì vậy một phần khoảng cách có thể là do máy. Các dòng log chứng minh cơ chế, và kích thước mức tăng thuộc về lần chạy đó.

### Why the closed loop could not see it

Trong một vòng kín mỗi client chờ câu trả lời của nó trước khi gửi request tiếp theo. Máy chủ không bao giờ giữ nhiều công việc hơn nó hoàn tất, vì vậy pool không bao giờ đầy. Những người dùng thật đến theo đồng hồ riêng của họ. Chỉ một tốc độ đến trên tốc độ phục vụ cho thấy pool đáng giá gì.

### The cost of memory nobody uses

Trên một máy dùng chung, bộ nhớ trong pool là bộ nhớ mà một chương trình khác không thể dùng. Máy của tài liệu chạy một bộ bảo vệ bộ nhớ tạm dừng scheduler khi phần cấp phát pool tăng hàng chục gigabyte trong vài giây. Trên một GPU chuyên dụng, tin giá trị tự động trước, và tăng tỷ lệ theo các bước 0.02 chỉ khi log scheduler cho thấy một pool đầy và các lần rút lại.

### The measurement that settles it

Đọc mức sử dụng token trong các dòng decode tại tải đỉnh, độ dài hàng đợi, và số lần rút lại. Đọc `max_total_num_tokens` lúc khởi động. Nếu mức sử dụng không bao giờ tiến gần một và không có gì chờ, pool không phải giới hạn, và bộ nhớ thêm thuộc về thứ khác.

## Follow-ups

- **Level 3:** Tại sao phép quét vòng kín không bao giờ lấp đầy pool? Expected: mỗi client chờ câu trả lời của nó trước khi gửi request tiếp theo, vì vậy máy chủ không bao giờ giữ nhiều công việc hơn nó hoàn tất.
- **Level 3:** Các dòng log nào cho bạn biết pool là giới hạn? Expected: mức sử dụng token gần một trong các dòng decode, một hàng đợi trên không, và các lần rút lại.
- **Level 4:** Trên một máy dùng chung, một pool quá lớn tốn gì? Expected: bộ nhớ mà các chương trình khác không thể dùng. Máy của tài liệu có một bộ bảo vệ tạm dừng scheduler khi phần cấp phát pool tăng hàng chục gigabyte trong vài giây.
- **Level 4:** Hai lần chạy quá tải cách nhau một ngày. Bạn tin bao nhiêu trong mức tăng? Expected: cơ chế, từ các dòng cho thấy một pool đầy với các request đang chờ và pool còn lại còn chỗ. Kích thước mức tăng cần một lần lặp lại cùng ngày.

## Wrong answers

- "Pool không có ý nghĩa, hoàn tác nó." Nó không có ý nghĩa dưới một tải không bao giờ lấp đầy nó. Tải quá mức lấp đầy nó và hoàn tất thêm một phần ba số request mỗi giây.
- "Cho pool càng nhiều bộ nhớ càng tốt." Trên một máy dùng chung bộ nhớ đó bị lấy khỏi các chương trình khác, và qua điểm mà pool đầy nó không mua được gì.
- "Throughput ở 64 người dùng là con số năng lực." Năng lực thể hiện dưới một tốc độ đến trên tốc độ phục vụ, điều mà một vòng kín không thể tạo ra.

## Taught in

[Phần tỷ lệ bộ nhớ của SGLang 101](../../../manuals/sglang-101/sections/3-2-mem-fraction-static-and-startup-sizing.md) đo cùng pool trong một phép quét vòng kín và trong một tải quá mức đến nhanh hơn máy chủ phục vụ.
