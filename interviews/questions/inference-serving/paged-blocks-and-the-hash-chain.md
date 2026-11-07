---
id: paged-blocks-and-the-hash-chain
title: Why the KV cache is a pool of 16-token blocks
card: inference-serving
kind: concept
level: 2
roles: [inference-engineer]
rounds: [ml-depth, system-design]
tags: [kv-cache, paged-attention, block-table, prefix-cache, preemption]
minutes: 8
lessons: [phases/17-infrastructure-and-production/04-vllm-serving-internals]
manuals: [vllm-101#s-how-the-block-pool-manages-kv-memory, vllm-101#s-why-one-token-budget-replaces-a-prefill-phase]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Giải thích cách vLLM giữ KV cache trong bộ nhớ GPU. Tại sao nó không cấp cho mỗi yêu cầu một buffer riêng, nó nhận ra một prompt đã thấy trước đó như thế nào, và điều gì xảy ra khi hết bộ nhớ?

## Short answer

KV cache là một pool các block 16 token, và một yêu cầu lấy từng block một khi nó tăng lên, được ánh xạ bằng một bảng block nhỏ. Một buffer mỗi yêu cầu lãng phí bộ nhớ hai lần: cho độ dài mà yêu cầu không bao giờ đạt tới, và cho các khoảng trống giữa những yêu cầu có kích thước khác nhau. Mỗi block đầy nhận một hash được nối chuỗi với hash của block trước nó, nên một hash gọi tên cả một prefix, và một yêu cầu mới đi theo chuỗi của nó rồi dừng ở lần cache miss đầu tiên. Khi không có block trống, bộ lập lịch tạm dừng yêu cầu mới nhất và tính lại nó sau.

## Full answer

### Blocks, not buffers

Khi khởi động, vLLM chia cache thành các block 16 token và giữ tất cả trong một pool. Các block của một yêu cầu không cần nằm cạnh nhau. Một bảng block ánh xạ các vị trí token của yêu cầu sang số block. Bài báo gốc gọi cách này là PagedAttention, theo cách một hệ điều hành phân trang bộ nhớ.

Bài học đưa ra lượng lãng phí mà cách này loại bỏ. Một bộ cấp phát cổ điển dành toàn bộ độ dài cho mỗi yêu cầu mất 60 đến 80 phần trăm bộ nhớ vì phân mảnh. Với các block, lượng lãng phí giữ dưới 4 phần trăm. Với một mô hình 70B ở 8192 token, một chuỗi được dành sẵn chiếm khoảng 1.25 GB trong BF16, và một yêu cầu dùng 1500 token lãng phí khoảng 82 phần trăm của nó.

### The hash chain

Khi một block đầy, vLLM hash các token của nó cùng với hash của block trước nó. Chuỗi có nghĩa là một hash gọi tên cả một prefix, không chỉ 16 token. Hash cũng bao gồm những đầu vào khác thay đổi các key và value: adapter LoRA, các ảnh trong prompt, và một salt tùy chọn cho mỗi yêu cầu. Một yêu cầu mới tính cùng chuỗi trên prompt của nó và tra từng hash trong một map. Mọi block trước lần cache miss đầu tiên đều là cache hit và không cần tính toán. Chỉ các block đầy được cache, nên phần đuôi prompt dưới 16 token luôn được tính.

Từ phiên bản 0.11, hash mặc định là SHA-256. Có một hash nhanh hơn, và tài liệu cảnh báo rằng một va chạm có thể trả về các block sai hoặc rò rỉ dữ liệu giữa các tenant.

### Eviction

Một block không có yêu cầu nào sử dụng được đưa vào một danh sách trống và giữ hash của nó. Một yêu cầu sau đó có cùng prefix vẫn có thể dùng nó. Khi vLLM cần một block mới, nó lấy đầu danh sách trống, block không được dùng lâu nhất. Chỉ khi đó nội dung cũ mới biến mất. Vì vậy cache chính là pool: không có bộ nhớ cache riêng, và một máy chủ bận giữ ít prefix cũ hơn một máy chủ nhàn rỗi.

### When memory runs out

Một yêu cầu đang chạy cần một block mới mỗi 16 token. Nếu không có block trống, bộ lập lịch tạm dừng một yêu cầu. Theo chính sách đến trước mặc định, nó chọn yêu cầu đang chạy mới nhất, giải phóng tất cả block của yêu cầu đó, và đưa nó trở lại đầu hàng đợi chờ. Khi yêu cầu chạy lại, vLLM tính lại các token của nó từ đầu. Các phiên bản cũ hơn cũng có thể sao chép block đến bộ nhớ CPU và ngược lại; engine hiện tại chỉ tính lại, vì tài liệu đánh giá cách đó rẻ hơn. Chi phí thể hiện ở thời gian dài hơn cho yêu cầu bị tạm dừng và trong bộ đếm `vllm:num_preemptions`.

### Hybrid models

Một mô hình có các lớp sliding-window hoặc state-space không giữ một mục cho mỗi token trong mọi lớp. Mỗi loại lớp nhận nhóm riêng với kích thước trang riêng và quy tắc riêng cho một cache hit. Các nhóm chia sẻ một pool.

## Follow-ups

- **Level 2:** Mọi yêu cầu bắt đầu với cùng 25 token. Bao nhiêu token trong số đó đến từ cache? Expected: 16, một block đầy; 9 token cuối được tính trên mọi yêu cầu vì chỉ các block đầy được cache.
- **Level 3:** Hai tenant gửi cùng system prompt. Một bên có thể biết gì về bên kia, và trường nào ngăn điều đó? Expected: họ chia sẻ block, nên thời gian của một tenant có thể tiết lộ bên kia đã gửi gì; một cache_salt cho mỗi tenant đi vào hash, nên hai bên không bao giờ chia sẻ một block.
- **Level 4:** Theo chính sách mặc định, vLLM tạm dừng yêu cầu nào khi không có block trống, và nó tốn gì? Expected: yêu cầu đang chạy mới nhất; tất cả block của nó được giải phóng, nó đi đến đầu hàng đợi chờ, và các token của nó được tính lại từ đầu, điều mà bộ đếm tạm dừng ghi nhận.

## Wrong answers

- "vLLM swap các yêu cầu bị tạm dừng sang bộ nhớ CPU." Các phiên bản cũ hơn có thể làm vậy; engine hiện tại chỉ tính lại, vì tài liệu đánh giá việc tính lại rẻ hơn, và chi phí thể hiện trong thời gian của yêu cầu đó và trong bộ đếm tạm dừng.
- "Prefix cache có ngân sách bộ nhớ riêng." Cache chính là pool; một block được giải phóng giữ hash của nó trên danh sách trống đến khi cần một block mới, nên một máy chủ bận giữ ít prefix cũ hơn một máy chủ nhàn rỗi.
- "Một hash block chỉ bao gồm 16 token của chính nó." Nó được nối chuỗi với hash của block trước nó, nên một hash gọi tên cả một prefix, và nó cũng bao gồm adapter, các ảnh và salt.

## Taught in

[Cách pool block quản lý bộ nhớ KV](../../../manuals/vllm-101/sections/8-3-how-the-block-pool-manages-kv-memory.md) giải thích pool, [phần ngân sách token](../../../manuals/vllm-101/sections/8-2-why-one-token-budget-replaces-a-prefill-phase.md) trình bày việc tạm dừng, và [bài học về nội bộ engine phục vụ](../../../phases/17-infrastructure-and-production/04-vllm-serving-internals/docs/en.md) đưa ra các con số phân mảnh.
