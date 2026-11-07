---
id: attention-data-parallel-for-latent-attention
title: Eight copies of the same KV cache
card: gpu-memory-quantization
kind: concept
level: 4
roles: [inference-engineer]
rounds: [ml-depth, system-design]
tags: [attention-data-parallel, mla, tensor-parallel, kv-cache, moe]
minutes: 10
lessons: []
manuals: [sglang-101#s-tp-size-dp-size-and-attn-dp-size, sglang-101#s-kv-bytes-per-token-and-the-kv-pool]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một đồng đội phục vụ một mô hình dùng latent attention (MLA) trên tám GPU với `--tp-size 8` và hỏi tại sao server giữ ít token KV như vậy trên 640 GB bộ nhớ. Giải thích một cách chia tensor-parallel xử lý cache đó như thế nào, chế độ attention-group thay đổi gì, và nó thay đổi gì mà không có cờ riêng.

## Short answer

Latent attention lưu một latent nén mỗi token và lớp, khoảng 68.6 KiB cho mô hình 61 lớp, và tensor parallelism không thể chia một head qua các GPU, vì vậy mỗi rank trong 8 rank lưu cache đầy đủ cho mọi token: tám bản sao và không thêm token. Attention data parallelism chạy các lớp attention data parallel bên trong nhóm tensor, mỗi nhóm có scheduler, request và KV cache riêng, trong khi các lớp expert vẫn chia trên tất cả GPU, vì vậy dung lượng KV tăng theo số nhóm; `--attn-dp-size 8` với `--tp-size 8` là bố trí cho các mô hình này. Nó cũng chia kích thước chunked prefill cho số nhóm và nhân tính thận trọng lịch với 0.3, vì vậy một chunk được điều chỉnh trên một GPU trở nên nhỏ hơn và tiếp nhận táo bạo hơn.

## Full answer

### One world, many ways to split it

Model world là tập GPU giữ một bản sao mô hình, và SGLang xây nó từ chỉ hai số: world size phải bằng `--tp-size` nhân `--pp-size`. Attention data parallelism, expert parallelism và context parallelism không thêm GPU. Chúng nhóm lại các GPU của nhóm tensor khác nhau cho các lớp khác nhau. Mọi cờ này mặc định là 1.

### Two meanings of data parallel

Data parallelism với `--dp-size` nghĩa là nhiều bản sao đầy đủ mô hình, mỗi bản có request và KV cache riêng, sau một controller gửi mỗi request đến một bản, mặc định round robin. Attention data parallelism với `--attn-dp-size` nghĩa là trong một nhóm tensor các lớp attention chạy data parallel trong khi các lớp feed-forward hoặc expert vẫn chia trên tất cả GPU; `--attn-dp-size 4` với `--tp-size 8` cho bốn nhóm attention mỗi nhóm hai GPU.

Trước v0.5.22 một cờ mang cả hai nghĩa: `--dp-size` đếm bản sao trừ khi `--enable-dp-attention` được đặt, khi đó nó đếm nhóm attention. Thay đổi được gộp ngày 2026-09-30 đưa ra lý do trong một câu: cờ có hai nghĩa khác nhau và mọi người đọc phải nhìn cả hai cờ để biết nghĩa nào. Tại phiên bản được ghim `--dp-size 8 --enable-dp-attention` được viết lại thành `--attn-dp-size 8 --dp-size 1` với cảnh báo ngừng dùng, `--dp-size 2 --attn-dp-size 4` phát sinh lỗi vì bản sao kết hợp với nhóm attention không được hỗ trợ, và một comment mã nói bỏ cờ cũ sau 2026-12-31. Nhiều công thức trên web vẫn dùng cách viết cũ.

### Why attention gets its own mode

Latent attention lưu một latent nén mỗi token và lớp, thực chất một KV head. Tensor parallelism không thể chia một head qua các GPU, vì vậy với `--tp-size 8` mọi GPU lưu cache latent đầy đủ cho mọi token, và tám GPU giữ tám bản sao. Với attention data parallelism mỗi nhóm chỉ giữ các request riêng, vì vậy dung lượng KV tăng theo nhóm. Nhóm thêm chế độ báo cáo decode throughput cao hơn đến 1.9 lần cho các mô hình này, là tuyên bố của họ. Với một mô hình dense dùng grouped-query attention lý do đó không đúng: nó có nhiều KV head, và tensor parallelism chia cache không sao chép khi kích thước tensor tối đa bằng số KV head. Trên số đó, mỗi KV head được sao chép đến hơn một rank.

### Two side effects

Bật attention data parallelism thay đổi hai thiết lập khác. Kích thước chunked prefill bị chia cho số nhóm, vì vậy một chunk 8192 được điều chỉnh trên một GPU thành 1024 với tám nhóm, và log in giá trị cũ và mới; các prompt dài rồi mất nhiều bước scheduler hơn. Tính thận trọng lịch được nhân với 0.3, vì vậy scheduler tiếp nhận các request mới với dự trữ nhỏ hơn cho các token tương lai.

### Field data points

Một nhóm sinh viên điều chỉnh một mô hình latent-attention cho cuộc thi đạt khoảng 5.9k token mỗi giây offline với tensor parallelism 16 chiều thông thường, và 17,417 token mỗi giây với bố trí tensor 4, data 4, pipeline 2 và attention data parallelism trên một node; đọc nó như một điểm dữ liệu, vì bài viết của họ giải thích tỷ lệ bộ nhớ sai. Một triển khai production của cùng họ mô hình chạy decode trên hai node với 16 nhóm attention và expert parallelism 16 chiều. Theo dõi `sglang:dp_attention_token_imbalance_ratio`, token của nhóm bận nhất chia trung bình, nơi 1.0 nghĩa là cân bằng.

### The position

Dùng tensor parallelism để mô hình vừa và không thêm gì. Thêm năng lực bằng các bản sao, trong một server hoặc sau một gateway, với các pool bằng nhau. Đặt số nhóm attention bằng kích thước tensor cho các mô hình expert latent-attention, và để ở 1 cho các mô hình dense grouped-query.

## Follow-ups

- **Level 3:** Tại sao cùng server với một mô hình dense grouped-query không cần các nhóm attention? Expected: mô hình đó có nhiều KV head, vì vậy tensor parallelism chia cache qua các rank không sao chép, miễn là có ít nhất số KV head bằng số rank; vấn đề sao chép chỉ tồn tại khi attention giữ một latent không thể chia.
- **Level 4:** Một công thức từ năm trước truyền cờ bản sao cũ cùng cờ attention. Điều gì xảy ra tại phiên bản được ghim, và thay vào đó bạn viết gì? Expected: server viết lại thành --attn-dp-size với --dp-size 1 và in cảnh báo ngừng dùng, với cờ cũ dự kiến bỏ sau cuối 2026; viết --attn-dp-size, và biết rằng bản sao kết hợp với nhóm attention phát sinh lỗi.
- **Level 4:** Một nhóm điều chỉnh token đầu tiên với chunk 8192 rồi bật tám nhóm attention. Tại sao các prompt dài chậm hơn? Expected: kích thước chunk bị chia cho số nhóm, vì vậy mỗi nhóm giờ prefill theo chunk 1024 và một prompt dài mất nhiều bước scheduler hơn; log in các giá trị cũ và mới, và tỷ lệ tiếp nhận cũng bị nhân với 0.3.

## Wrong answers

- "Tám GPU cho dung lượng KV gấp tám." Dưới tensor parallelism với latent attention mọi rank lưu cache đầy đủ, vì vậy tám GPU giữ tám bản sao và dung lượng của một GPU; attention data parallelism là thứ tăng nó theo các nhóm.
- "--dp-size 8 nghĩa là tám nhóm attention." Tại phiên bản được ghim --dp-size đếm bản sao mô hình; nhóm attention là --attn-dp-size, và cách viết cũ với cờ thêm được viết lại với cảnh báo cho đến khi bị bỏ.
- "Attention data parallelism chỉ thay đổi các lớp attention." Nó cũng chia kích thước chunked prefill cho số nhóm và nhân tính thận trọng lịch với 0.3, vì vậy cả token đầu tiên và tiếp nhận thay đổi.
- "Dùng nó trên mọi mô hình để có thêm năng lực." Với một mô hình dense grouped-query tensor parallelism đã chia cache không sao chép; quan điểm của tài liệu là nhóm attention bằng kích thước tensor chỉ cho các mô hình expert latent-attention.

## Taught in

[Phần parallelism SGLang](../../../manuals/sglang-101/sections/6-1-tp-size-dp-size-and-attn-dp-size.md) giải thích cả hai loại data parallelism, và [KV pool và byte mỗi token](../../../manuals/sglang-101/sections/3-1-kv-bytes-per-token-and-the-kv-pool.md) tính kích thước latent.
