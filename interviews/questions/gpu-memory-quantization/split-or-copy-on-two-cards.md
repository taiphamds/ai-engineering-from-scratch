---
id: split-or-copy-on-two-cards
title: Split the model or copy it across two cards
card: gpu-memory-quantization
kind: design
level: 3
roles: [inference-engineer]
rounds: [system-design, design-review]
tags: [tensor-parallel, pipeline-parallel, data-parallel, pcie, kv-pool]
minutes: 10
lessons: []
manuals: [vllm-101#s-choose-tensor-pipeline-or-data-parallelism, sglang-101#s-tp-size-dp-size-and-attn-dp-size]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Bạn có hai card L4 trong một host, chỉ nối bằng PCIe, và một mô hình 8B vừa trên một card với một KV pool quá nhỏ cho người dùng. Bạn chia mô hình qua cả hai card hay chạy hai bản sao? Nghĩ về bộ nhớ trước, rồi về truyền thông.

## Short answer

Tensor parallelism chia trọng số và KV cache qua hai card, để mỗi card giữ một nửa trọng số và có thêm nhiều lần chỗ cho cache, và đó là bố trí tăng pool mỗi request; data parallelism giữ một bản sao trọng số đầy đủ trên mỗi card và chỉ tăng gấp đôi người dùng nếu pool của mỗi bản sao đã chứa được họ. Qua PCIe, tensor parallelism trả một phép collective sau mọi lớp và có thể tốn hơn phần chia tiết kiệm, vì vậy tài liệu đề xuất pipeline parallelism trên máy như vậy, chỉ gửi dữ liệu tại các ranh giới stage. Không tài liệu nào đo bố trí nào trên hai L4 của nó, vì vậy tôi sẽ đo tensor so với pipeline so với hai bản sao trên workload thật, và cho mọi phần chia các GPU trọn vẹn, vì một nhóm tensor định kích thước mọi rank từ card nhỏ nhất.

## Full answer

### What each layout does to memory

| Bố trí | Trọng số mỗi GPU | KV cache mỗi GPU | Thứ tăng |
|---|---|---|---|
| Tensor | một phần của mọi lớp | một phần cache của mọi lớp | pool mỗi request, nhiều lần khi trọng số lấp phần lớn một GPU |
| Pipeline | các lớp của stage của nó | cache của các lớp đó | pool mỗi request, và nó chấp nhận số GPU không đều |
| Data | một bản sao đầy đủ | pool đầy đủ riêng | số người dùng, chỉ nếu pool một bản sao đã chứa được họ |

Một ngoại lệ: một mô hình có multi-head latent attention lưu latent đầy đủ trên mọi rank tensor-parallel, vì vậy phần chia tensor không tăng cache. Với một mô hình grouped-query như Qwen3-8B thì có.

### The decision tree

| Câu hỏi | Nếu có | Nếu không |
|---|---|---|
| Mô hình có vừa trên một GPU, với chỗ cho KV cache bạn cần không? | Data parallelism, một bản sao mỗi GPU. | Chia mô hình. |
| Mô hình đã chia có vừa trong một máy không? | Giữ phần chia trong máy. | Pipeline parallelism xuyên các máy. |
| Các GPU có NVLink, và số GPU có chia mô hình đều không? | Tensor parallelism. | Pipeline parallelism trong máy. |

Trường hợp của bạn trả lời câu đầu là không, vì chỗ cho cache là vấn đề. Câu thứ ba cũng trả lời không, vì PCIe không phải một kết nối nhanh. Cây đi tới pipeline parallelism trong máy, và tài liệu yêu cầu đo nó so với tensor parallelism trước khi chọn, vì nó chưa chạy cách nào trên cặp của mình.

### What the link costs

Tensor parallelism gửi dữ liệu sau mọi lớp, vì vậy cần một kết nối nhanh. Trên các GPU chỉ nối bằng PCIe, như hai L4 trong một host, lưu lượng đó có thể tốn hơn phần chia tiết kiệm. Pipeline parallelism gửi dữ liệu một lần mỗi ranh giới stage. Data parallelism không gửi gì giữa các bản sao.

### The balance check

Trước khi SGLang nạp trọng số cho một nhóm tensor, mỗi rank đo bộ nhớ trống và nhóm giữ giá trị nhỏ nhất. Nếu giá trị đó dưới 90 phần trăm bộ nhớ trống cục bộ, server dừng, và không cờ nào tắt phép kiểm tra. Trên cặp của tài liệu card thứ hai chạy hai pod của nhóm khác và còn trống 18.28 GB so với 19.53 GB phép kiểm tra yêu cầu, vì vậy phần chia tensor từ chối khởi động. Mỗi rank giữ cùng phần trọng số và cùng pool, vì vậy card nhỏ nhất đặt kích thước cho tất cả. Cặp data-parallel không có phép kiểm tra như vậy, khởi động với các pool 24,094 và 2,925 token, và phục vụ ít hơn một card ở mọi tải. Cho mọi phần chia các GPU trọn vẹn.

### The processes

Với data parallelism vLLM khởi động một engine core mỗi bản sao và một coordinator; với tensor parallelism một worker mỗi GPU dưới một engine core. Trong SGLang world size là kích thước tensor nhân kích thước pipeline, và các bản sao data-parallel có một controller gửi request mặc định round robin.

## Follow-ups

- **Level 3:** Mô hình vừa trên một card. Tại sao cây quyết định vẫn có thể nói chia? Expected: câu đầu hỏi liệu nó vừa với chỗ cho KV cache cần thiết không; với một pool không giữ được người dùng câu trả lời là không, vì vậy cây chuyển sang chia, và tensor hoặc pipeline parallelism là thứ tăng pool mỗi request.
- **Level 3:** Tại sao phần chia tensor cần các GPU trọn vẹn trên một máy dùng chung? Expected: mọi rank giữ cùng phần trọng số và cùng pool, vì vậy card nhỏ nhất đặt kích thước cho tất cả; SGLang đo bộ nhớ trống trên mỗi rank và dừng khi một rank có dưới 90 phần trăm bộ nhớ trống cục bộ, 18.28 so với 19.53 GB trong trường hợp tài liệu.
- **Level 4:** Qua PCIe, bạn quyết định giữa tensor và pipeline parallelism như thế nào khi không có phép đo từ tài liệu? Expected: chạy cả hai trên workload thật và đọc throughput với P99 ITL và token đầu tiên ở các xung nhịp khớp; tensor trả một collective sau mọi lớp trên kết nối chậm và pipeline trả một lần mỗi ranh giới stage, vì vậy bố trí pipeline có thể thắng trên một cặp PCIe, và tài liệu đề xuất nó ở đó.

## Wrong answers

- "Hai bản sao tăng gấp đôi mọi thứ." Mỗi bản sao giữ trọng số đầy đủ, vì vậy pool mỗi bản sao là cùng pool nhỏ; hai bản sao chỉ gấp đôi người dùng nếu pool đó đã chứa được họ, và một cặp có pool không bằng nhau phục vụ ít hơn một card.
- "Tensor parallelism là cách gộp bộ nhớ qua các card." Nó gộp trọng số và cache, nhưng gửi dữ liệu sau mọi lớp; qua PCIe lưu lượng đó có thể tốn hơn phần chia tiết kiệm, vì vậy tài liệu đề xuất pipeline parallelism trên máy như vậy.
- "Phần chia khởi động miễn là mô hình vừa qua hai card." Nhóm tensor từ chối khi một rank có dưới 90 phần trăm bộ nhớ trống cục bộ, vì card nhỏ nhất đặt pool cho mọi rank; cho phần chia các GPU trọn vẹn.
- "Pipeline parallelism lãng phí một card vì các stage chờ nhau." Nó chỉ gửi dữ liệu tại các ranh giới stage và chấp nhận số GPU không đều, là lý do tài liệu đề xuất nó cho các GPU không có kết nối nhanh; đo trước khi loại trừ.

## Taught in

[Chọn tensor, pipeline hoặc data parallelism](../../../manuals/vllm-101/sections/6-1-choose-tensor-pipeline-or-data-parallelism.md) và [phần parallelism SGLang](../../../manuals/sglang-101/sections/6-1-tp-size-dp-size-and-attn-dp-size.md) đưa ra các bố trí, quy tắc kết nối và phép kiểm tra cân bằng.
