---
id: attention-for-128k-context
title: Design the attention stack for 128K context on one card
card: transformers
kind: design
level: 4
roles: [inference-engineer, applied-ai-engineer]
rounds: [system-design, ml-depth]
tags: [long-context, grouped-query-attention, rope, flash-attention, kv-cache, design]
minutes: 15
lessons: [phases/07-transformers-deep-dive/03-multi-head-attention, phases/07-transformers-deep-dive/04-positional-encoding, phases/07-transformers-deep-dive/12-kv-cache-flash-attention]
manuals: []
practice: [grouped-query-attention, rope]
cheatsheet: [attention-variants, positional-encoding, inference-optimization]
related: [transformers/gqa-mla-cache-tradeoff, transformers/extend-context-past-training, transformers/flash-attention-is-exact]
updated: 2026-11-03
---

Thiết kế ngăn xếp attention của một decoder mới lớp 70B phải phục vụ các ngữ cảnh 128K token trên một bộ tăng tốc 80 GB duy nhất ở kích thước batch một. Bao phủ bố trí head, cơ chế vị trí, kernel, và phép tính bộ nhớ gắn chúng với nhau.

## Short answer

Bắt đầu từ bộ nhớ, vì nó quyết định phần còn lại. Với 8 head key-value, 80 lớp và kích thước head 128 trong một kiểu 16 bit, các key và value được lưu tốn 4096 byte mỗi token mỗi lớp, khoảng 10 GiB ở 32K và 40 GiB ở 128K trước khi một trọng số được nạp. Nên bố trí head là grouped-query hoặc latent attention, kiểu được lưu giảm xuống FP8 để giảm nửa các byte đó, cơ chế vị trí là phép quay với scaling cơ số để mô hình đạt 128K không có bảng vị trí, và kernel là kiểu chia tile để các điểm N nhân N không bao giờ chạm bộ nhớ chính. Rồi đếm lại: ở 16 bit, riêng các trọng số của một mô hình lớp 70B lớn hơn card 80 GB, nên các trọng số cũng cần một kiểu 4 bit trước khi cache và các activation có thể vừa bên cạnh.

## Full answer

### Head layout

Multi-head attention thuần với 64 head key-value ở quy mô này sẽ giữ nhiều hơn khoảng 8 lần, khoảng 80 GiB ở 32K, tức toàn bộ card. Grouped-query với 8 head key-value là mặc định production và giữ chất lượng gần đầy đủ. Nếu bộ nhớ vẫn không khép được, latent attention nén các key và value thành một vector hạng thấp và trả FLOP ở mỗi bước để giải nén. Các query head giữ ở 64 với kích thước head 128 trong cả hai trường hợp.

### The memory table

```text
per token per layer = 2 * n_kv_heads * d_head * bytes
                    = 2 * 8 * 128 * 2 = 4096 bytes (4 KiB)
32K context         = about 10 GiB
128K context        = about 40 GiB
```

Giảm nửa số byte mỗi giá trị bằng một cache FP8 và con số 128K giảm nửa. Rồi thêm các trọng số. Ở 16 bit, một mô hình lớp 70B cần hai byte mỗi tham số, nhiều hơn toàn bộ card 80 GB trước khi bất kỳ cache nào được lưu. Ở 8 bit, các trọng số vẫn lấp phần lớn card. Chỉ một kiểu trọng số 4 bit để chỗ cho cache FP8 ở 128K và cho các activation. Kích thước batch một là yêu cầu được nêu; mỗi yêu cầu đồng thời thêm thêm một cache.

### Positional scheme

Phép quay các query và key, với một cơ số được scale cho độ dài mục tiêu thông qua NTK-aware scaling hoặc YaRN. Nó không thêm tham số, mã hóa khoảng cách tương đối, và họ tham chiếu của bài học đạt 128K từ 8K theo cách này. Một bảng được học sẽ cần 128K dòng và dừng ở đó. Attention thiên lệch tuyến tính là một lựa chọn hợp lệ lúc huấn luyện với ngoại suy mạnh, nhưng phép quay cho một núm chỉnh gọn hơn và khớp hệ sinh thái.

### Kernel

Attention bị giới hạn bởi bộ nhớ từ khoảng 2K token, nên một kernel chia tile không phải tùy chọn ở 128K. Dùng triển khai chia tile hiện tại cho phần cứng, với FP8 ở nơi thế hệ hỗ trợ, và giữ kernel huấn luyện trên phiên bản có một lượt truyền ngược.

### What to measure before committing

1. Perplexity ở độ dài mục tiêu và ở độ dài ngắn ban đầu sau fine-tune ngữ cảnh dài.
2. Bộ nhớ đỉnh ở 128K với các trọng số được lượng tử hóa, cache và các activation trên card, và mất mát chất lượng từ các trọng số 4 bit.
3. Thời gian mỗi token ở 128K so với 8K, để xác nhận kernel và cache hành xử tuyến tính.

## Follow-ups

- **Level 3:** Tại sao không chọn attention thiên lệch tuyến tính vì khả năng ngoại suy? Expected: đó là một lựa chọn hợp lý cho một mô hình mới, nhưng phép quay có công cụ ngữ cảnh dài và một cơ số để scale, và không cách nào có thể đổi sau huấn luyện.
- **Level 4:** Sản phẩm sau đó yêu cầu kích thước batch 8 ở 128K. Điều gì thay đổi? Expected: cache nhân 8, nên latent attention, một kiểu lưu nhỏ hơn, một độ dài tối đa ngắn hơn hoặc nhiều card hơn; các trọng số không thay đổi.
- **Level 4:** Grouped-query từ đầu hay chuyển một checkpoint multi-head? Expected: từ đầu cho một mô hình mới; chuyển đổi với một fine-tune dành cho các checkpoint hiện có và cần một kiểm tra chất lượng.
- **Level 4:** Flash Attention ngừng giúp ở đâu? Expected: nó loại lưu lượng N nhân N; nó không thu nhỏ cache, vẫn tăng tuyến tính theo ngữ cảnh, nên phép tính cache chi phối ở 128K.

## Wrong answers

- "Dùng multi-head attention đầy đủ cho chất lượng; bộ nhớ rẻ mà." Ở 128K, riêng cache đầy đủ vượt card.
- "Sinusoid xử lý mọi độ dài, nên cơ chế vị trí đã giải quyết." Công thức mở rộng nhưng mô hình chưa bao giờ thấy các pha đó; phép quay với scaling cơ số là thứ đạt 128K trong thực tế.
- "Bỏ kernel chia tile trên một mô hình chất lượng vì nó thay đổi đầu ra." Nó chính xác trong sai khác do đổi thứ tự 16 bit và là thứ khiến ngữ cảnh dài đủ khả năng chi trả.

## Taught in

[Bài học multi-head attention](../../../phases/07-transformers-deep-dive/03-multi-head-attention/) cung cấp các biến thể head, [bài học mã hóa vị trí](../../../phases/07-transformers-deep-dive/04-positional-encoding/) cung cấp các thủ thuật scaling, và [bài học KV cache và Flash Attention](../../../phases/07-transformers-deep-dive/12-kv-cache-flash-attention/) làm phép tính bộ nhớ.
