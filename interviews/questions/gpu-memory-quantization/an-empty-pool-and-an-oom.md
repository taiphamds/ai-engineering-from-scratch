---
id: an-empty-pool-and-an-oom
title: The pool was 95 percent empty and the server died
card: gpu-memory-quantization
kind: debug
level: 3
roles: [inference-engineer]
rounds: [debugging, ml-depth]
tags: [mem-fraction, kv-pool, out-of-memory, shared-machine, startup]
minutes: 10
lessons: []
manuals: [sglang-101#s-mem-fraction-static-and-startup-sizing]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một server SGLang trên một workstation dùng chung chạy trong bốn phút, rồi một benchmark với 32 request đang thực hiện làm nó sập vì lỗi hết bộ nhớ. Log scheduler ngay trước lần sập hiển thị `token usage: 0.05`. Giải thích tại sao pool trống 95 phần trăm và server vẫn hết bộ nhớ, và bạn đặt gì.

## Short answer

KV pool được định kích thước một lần lúc khởi động từ một snapshot bộ nhớ trống, và tỷ lệ tự động cho 87.2 phần trăm phần đang trống vào trọng số và pool. Ba mươi hai request giữ 16,095 token, 5 phần trăm một pool 312,581 token, vì vậy pool đã dành riêng 33 GB và dùng dưới 2 GB, và các activation của lượt truyền tiến tiếp theo cần bộ nhớ ngoài pool mà hệ điều hành không còn. Trên một máy chạy bất cứ thứ gì khác, tự truyền `--mem-fraction-static`; với 0.4 cùng benchmark hoàn tất tất cả 128 request ở mức đồng thời 32.

## Full answer

### Two startups, two pool sizes

Tài liệu khởi động server hai lần với cùng lệnh và không có tỷ lệ. Lần đầu thấy 27.81 GB bộ nhớ hệ thống khả dụng, lấy ngân sách KV 24.25 GB và định một pool 227,022 token. Lần thứ hai thấy 38.29 GB khả dụng, lấy 33.39 GB và định 312,581 token. Không gì thay đổi trong SGLang giữa các lần chạy; các chương trình khác dùng ít bộ nhớ hơn ở lần khởi động thứ hai. Cả hai ngân sách là 87.2 phần trăm bộ nhớ trống, vì tỷ lệ tự động được giải thành 0.872.

### The crash

Dòng decode cuối trước lần sập hiển thị 32 request đang chạy với 16,095 token ở mức sử dụng token 0.05. Pool đã dành riêng 33 GB và dùng dưới 2 GB trong đó. Lượt truyền tiến tiếp theo cần bộ nhớ cho các activation ngoài pool, hệ điều hành không còn, một command buffer thất bại, scheduler chết, và server giết toàn bộ cây tiến trình. Một pool rỗng và một lần sập hết bộ nhớ là cùng sự kiện.

### How SGLang decides the split

Tỷ lệ là phần bộ nhớ cho trọng số cộng KV pool. Mọi thứ khác, activation, graph và các chương trình khác, nằm ngoài nó. Trên một GPU giá trị tự động đến từ một phần dự trữ: 512 MB cộng 1.5 MB cho mỗi token của prefill chunk, thêm cho tensor và pipeline parallelism và graph, và ít nhất 10 GiB trên một GPU có hơn 60 GB. Tỷ lệ là bộ nhớ trừ dự trữ, chia bộ nhớ. Khi không đọc được dung lượng thiết bị, nó thành 0.95. Sau khi trọng số nạp, SGLang đo bộ nhớ trống lại, và ngân sách KV là bộ nhớ trống đó trừ phần ngoài tỷ lệ của phần trống trước khi nạp. Trên backend laptop quy tắc đơn giản hơn: giá trị nhỏ hơn giữa tỷ lệ của device working set và tỷ lệ của bộ nhớ hệ thống khả dụng ngay lúc này, và số hạng thứ hai là snapshot đã dịch chuyển.

### Where the default fails

- Một máy dùng chung: snapshot lúc khởi động không giữ đúng suốt đời server.
- Dung lượng chưa biết: tỷ lệ thành 0.95 và để 5 phần trăm cho activation, mà một báo cáo gặp dưới dạng lỗi hết bộ nhớ ngay lần prefill đầu.
- Bộ nhớ mà ước lượng không biết: các bản sao draft model giữ trong bộ nhớ khi pool mục tiêu được định, và một prompt 64K token hết bộ nhớ trong attention dù log báo có chỗ cho 274,934 token.

### The fix, and the other direction

Với `--mem-fraction-static 0.4` ngân sách thành 19.39 GB, 0.4 của snapshot 48.49 GB, và pool giữ 181,574 token, nhiều hơn xa so với nhu cầu 32 request 640 token. Một pool nhỏ hơn không tốn gì trong workload này, vì workload chưa bao giờ lấp đầy nó. Trên một GPU chuyên dụng tin giá trị tự động trước. Chỉ tăng theo bước 0.02 khi log scheduler cho thấy pool đầy và các lần rút lại. Tìm giới hạn trên trong staging với các prompt dài nhất, chạy production thấp hơn một hoặc hai bước, và hạ khi các prompt dài thất bại với lỗi hết bộ nhớ trong attention.

### What to measure

Đọc dòng `max_total_num_tokens` lúc khởi động, là kết quả toàn bộ phép tính. Theo dõi `token usage` trong các dòng decode; gần 1.0 pool đầy. Đọc bộ nhớ trống của máy trong prefill nặng nhất từ hệ điều hành. Trên backend laptop metric bộ nhớ cache đọc là 0.0 vì backend cấp phát pool ngoài phần tính của metric; dòng log pool, khoảng 19,860 MB, là con số cần dùng.

## Follow-ups

- **Level 3:** Tại sao lần khởi động thứ hai có pool lớn hơn lần đầu khi không gì trong SGLang thay đổi? Expected: các chương trình khác dùng ít bộ nhớ hơn ở lần thứ hai, vì vậy snapshot bộ nhớ trống tăng từ 27.81 lên 38.29 GB và pool tăng cùng nó, từ 24.25 lên 33.39 GB ở cùng tỷ lệ tự động.
- **Level 3:** Tỷ lệ bao phủ bộ nhớ nào, và thứ gì nằm ngoài? Expected: trọng số cộng KV pool; activation, graph, vùng tạm autotuning và mọi chương trình khác nằm ngoài, là lý do một pool ở 87 phần trăm bộ nhớ trống không để gì cho lượt truyền tiến tiếp theo.
- **Level 4:** Trên một GPU chuyên dụng, khi nào bạn tăng tỷ lệ và tăng bao nhiêu? Expected: chỉ khi log scheduler cho thấy pool đầy và các lần rút lại, theo bước 0.02; tìm giới hạn trên trong staging với các prompt dài nhất, chạy production thấp hơn một hoặc hai bước, và hạ khi các prompt dài thất bại với lỗi hết bộ nhớ trong attention.

## Wrong answers

- "Mức sử dụng token 0.05 nghĩa là server còn lâu mới đầy." Nó nghĩa là pool gần rỗng; pool đã lấy bộ nhớ và các activation ngoài nó hết chỗ, vì vậy một pool rỗng và một lần sập hết bộ nhớ là cùng sự kiện.
- "Tăng tỷ lệ để pool lớn hơn và lần sập biến mất." Lần sập đến từ bộ nhớ ngoài pool; một tỷ lệ lớn hơn lấy thêm từ activation và các chương trình khác, và 0.4 là thứ sửa nó.
- "Tỷ lệ tự động đã được điều chỉnh, vì vậy để nguyên." Nó giả định máy thuộc engine; trên một máy dùng chung snapshot lúc khởi động không giữ đúng suốt đời server, và khi không đọc được dung lượng nó thành 0.95 và thất bại ở prefill đầu.
- "Dòng pool cho bạn biết bộ nhớ server dùng." Pool là phần lớn nhất chứ không phải toàn bộ; một báo cáo đo 25 đến 40 GB cấp phát ngắn hạn ngoài phần tính từ autotuner và capture graph.

## Taught in

[--mem-fraction-static và định kích thước khởi động](../../../manuals/sglang-101/sections/3-2-mem-fraction-static-and-startup-sizing.md) có log sập, công thức và các lần khởi động GB10.
