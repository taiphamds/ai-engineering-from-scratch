---
id: unified-memory-fraction-on-a-gb10
title: Pick the memory fraction on unified memory
card: gpu-memory-quantization
kind: estimate
level: 3
roles: [inference-engineer]
rounds: [ml-depth, system-design]
tags: [unified-memory, gb10, mem-fraction, kv-pool, startup]
minutes: 10
lessons: []
manuals: [vllm-101#s-size-memory-on-a-dgx-spark, sglang-101#s-mem-fraction-static-and-startup-sizing]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Bạn chạy một mô hình 30B có các lớp mixture-of-experts ở BF16 trên một GB10, một máy nơi CPU và GPU dùng một bộ nhớ 128 GB và hệ điều hành cùng các chương trình khác nằm trong cùng pool. Bạn chọn tỷ lệ bộ nhớ như thế nào, tỷ lệ không bảo đảm gì trên máy này, và tại sao kích thước pool khác giữa hai lần khởi động cùng lệnh?

## Short answer

Cộng trọng số, KV cache bạn muốn và vài GiB cho profile khởi động và graph, chia cho tổng, và để chỗ cho page cache của kernel và các chương trình khác, dùng cùng bộ nhớ. Với tỷ lệ 0.75 lần chạy vLLM của tài liệu lấy 91.3 trên 121.69 GiB: 56.93 GiB trọng số, 31.32 GiB cache, khoảng 342,000 token mỗi token 96 KiB, và khoảng 3 GiB cho phần còn lại, để khoảng 30 GiB cho mọi thứ khác. Tỷ lệ là một kế hoạch chứ không phải giới hạn cứng trên bộ nhớ hợp nhất, và pool dịch chuyển giữa các lần khởi động vì engine định nó từ một snapshot bộ nhớ trống mà file cache của kernel thay đổi.

## Full answer

### What GPU memory means here

GB10 không có bộ nhớ GPU riêng. CPU và GPU dùng một pool bộ nhớ LPDDR5x, được bán là 128 GB; log khởi động báo cáo tổng 121.69 GiB. Trên một GPU tích hợp vLLM đọc bộ nhớ trống từ hệ điều hành, vì driver báo quá ít, và giải phóng bộ nhớ GPU đã cache khi toàn hệ thống đầy hơn 80 phần trăm. Vì vậy tỷ lệ là phần của toàn máy, không phải một card riêng.

### The budget at 0.75

| Phần | Kích thước |
|---|---|
| Phần cho vLLM, 0.75 của 121.69 GiB | 91.3 GiB |
| Trọng số | 56.93 GiB |
| Trống cho KV cache | 31.32 GiB |
| Phần còn lại, cho profile và graph | khoảng 3 GiB |

Ở 96 KiB mỗi token cache giữ khoảng 342,000 token, đủ cho hơn 500 người dùng mỗi người 640 token. Khoảng 30 GiB còn cho hệ thống và mọi chương trình khác. Tài liệu chỉ chạy một tỷ lệ và nói vậy.

### The fraction is not a hard limit

Hai báo cáo cho thấy engine lấy hơn phần của nó trong profile khởi động trên máy này. Một báo cáo chạy tỷ lệ 0.70, dùng khoảng 112 GiB so với phần khoảng 83 GiB, và máy ngừng phản hồi. Báo cáo khác gặp một ước lượng bộ nhớ graph âm với một phương pháp speculative, vì vậy cache tăng quá lớn và khởi động hết bộ nhớ. Lần chạy riêng của tài liệu khớp phần 0.75, không speculation. Để cho cache một kích thước cố định thay vào đó, đặt bằng byte với `--kv-cache-memory-bytes`, và kiểm tra trọng số, cache và vài GiB cho profile để lại chỗ cho hệ điều hành.

Tài liệu SGLang thêm một báo cáo thực địa về 25 đến 40 GB cấp phát ngắn hạn ngoài phần tính bộ nhớ, từ kernel autotuner và capture graph, làm đóng băng một host cho đến khi server chạy trong một container có giới hạn bộ nhớ và tỷ lệ 0.50. Trên một GB10 dùng chung, chạy server trong một container có giới hạn bộ nhớ và ghi log bộ nhớ trống mỗi giây khi khởi động.

### Why the pool moves between starts

SGLang định pool từ một snapshot bộ nhớ trống sau khi trọng số nạp, và đo trọng số bằng mức giảm bộ nhớ khả dụng. Sáu lần khởi động BF16 của một lệnh với cùng trọng số trên GB10 đọc trọng số ở 54.78 đến 57.92 GB và cho pool từ 227,243 đến 258,017 token, cách nhau 14 phần trăm. File cache của kernel thay đổi trong mỗi lần nạp. Trên bộ nhớ hợp nhất một kích thước pool từ một lần khởi động là một ước tính cho lần tiếp theo, vì vậy đọc dòng pool ở mọi lần khởi động.

### Other programs see the pool

Pool là hàng chục GB và engine cấp phát nó trong vài giây, vì vậy mọi chương trình khác thấy bộ nhớ đó đi mất. Một daemon bảo vệ bộ nhớ trên GB10 của tài liệu tạm dừng scheduler ba lần khi khởi động vì nó tăng 36.7 GiB trong 5 giây với 34.2 GiB còn lại. Báo những người dùng khác của máy trước khi khởi động, và không chỉ cảnh báo trên các dòng hết bộ nhớ của driver; cảnh báo khi một server không trở nên khỏe.

### When a bigger pool pays

Tăng tỷ lệ SGLang từ 0.7 lên 0.82 trên GB10 tăng pool BF16 từ 234,600 lên 383,065 token, 63 phần trăm, và thay đổi throughput vòng kín dưới 2 phần trăm ở 64 người dùng, 238.72 so với 235.38 token mỗi giây, vì mức sử dụng token đạt đỉnh 11 phần trăm. Dưới tốc độ đến cố định cao hơn khả năng phục vụ của máy, pool nhỏ đầy 96 phần trăm với 101 request chờ, pool lớn giữ cả 480 request, và máy hoàn tất 5.19 so với 3.88 request mỗi giây, nhiều hơn 34 phần trăm. Định pool từ mức sử dụng token tại tải đỉnh, gồm các đợt bùng phát, không từ bộ nhớ trống.

### Expect a slow first start

Nạp 56.93 GiB mất 330 s trên máy này, vì mỗi tensor được sao chép từ một file ánh xạ bộ nhớ từng tensor một, khoảng 1.7 ms mỗi tensor từ file view so với 0.2 ms từ bộ nhớ host. Giữ trọng số trên ổ cục bộ, và giữ server chạy.

## Follow-ups

- **Level 3:** `free -g` hiển thị gần như không có bộ nhớ khả dụng khi server nhàn rỗi. Bạn làm gì? Expected: hạ tỷ lệ 0.05 và khởi động lại; hệ thống và page cache dùng chung pool, và nếu dòng cache lớn hơn phần cho phép, đặt kích thước cache bằng byte thay vào đó.
- **Level 3:** Cùng lệnh cho pool 227,243 và 258,017 token vào hai ngày. Có gì hỏng không? Expected: không; engine định pool từ một snapshot bộ nhớ trống sau khi trọng số nạp, và file cache của kernel thay đổi trong mỗi lần nạp, vì vậy trọng số đo được dịch chuyển khoảng 3 GB và pool cùng chúng; đọc dòng pool mọi lần khởi động.
- **Level 4:** Đi từ 0.7 lên 0.82 không làm gì ở 64 người dùng và cho thêm một phần ba throughput trong quá tải. Đối chiếu hai điều. Expected: trong vòng kín pool chưa bao giờ đầy, mức sử dụng token đạt đỉnh 11 phần trăm, vì vậy pool lớn hơn không có việc làm; dưới tốc độ đến cố định cao hơn khả năng phục vụ của máy, pool nhỏ đầy 96 phần trăm với 101 request chờ và pool lớn giữ cả 480, vì vậy định pool từ mức sử dụng token tại tải đỉnh với các đợt bùng phát.

## Wrong answers

- "Tỷ lệ giới hạn thứ server có thể lấy." Trên bộ nhớ hợp nhất nó đặt phần engine lên kế hoạch; một báo cáo dùng khoảng 112 GiB ở tỷ lệ 0.70 trong profile khởi động so với phần khoảng 83 GiB, và máy ngừng phản hồi.
- "Đặt tỷ lệ cao hết mức để lấy pool lớn nhất." Hệ thống và page cache dùng cùng bộ nhớ, và bộ nhớ bạn không cần là bộ nhớ chương trình khác không thể dùng; trên GB10 một pool lớn hơn 63 phần trăm thay đổi throughput vòng kín dưới 2 phần trăm.
- "Kích thước pool hôm qua là kích thước pool." Sáu lần khởi động cùng lệnh cho các pool cách nhau 14 phần trăm, vì snapshot bộ nhớ trống thay đổi; đọc dòng mỗi lần.
- "Một lần khởi động đầu chậm nghĩa là có gì sai." Nạp 56.93 GiB từ một mapping có file hậu thuẫn mất 330 s trên máy này, khoảng 1.7 ms mỗi tensor so với 0.2 ms từ bộ nhớ host; giữ trọng số trên bộ lưu trữ cục bộ và giữ server chạy.

## Taught in

[Định kích thước bộ nhớ trên một DGX Spark](../../../manuals/vllm-101/sections/2-3-size-memory-on-a-dgx-spark.md) và [--mem-fraction-static và định kích thước khởi động](../../../manuals/sglang-101/sections/3-2-mem-fraction-static-and-startup-sizing.md) đo tỷ lệ trên cùng máy.
