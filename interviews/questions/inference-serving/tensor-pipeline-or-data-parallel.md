---
id: tensor-pipeline-or-data-parallel
title: Choose tensor, pipeline or data parallelism
card: inference-serving
kind: design
level: 2
roles: [inference-engineer]
rounds: [system-design, screen]
tags: [tensor-parallel, pipeline-parallel, data-parallel, nvlink, multi-gpu]
minutes: 10
lessons: []
manuals: [vllm-101#s-choose-tensor-pipeline-or-data-parallelism, sglang-101#s-tp-size-dp-size-and-attn-dp-size]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Bạn có một mô hình không vừa trên một GPU, hoặc bạn cần nhiều thông lượng hơn một GPU cung cấp. Trình bày cách bạn chọn giữa tensor, pipeline và data parallelism, và mỗi cách tốn gì về giao tiếp.

## Short answer

Đặt ba câu hỏi. Nếu mô hình vừa trên một GPU với chỗ cho KV cache bạn cần, dùng data parallelism, một bản sao đầy đủ mỗi GPU, và đầu ra tăng theo số bản sao. Nếu nó không vừa, chia nó: tensor parallelism trong một máy khi các GPU có liên kết nhanh và số GPU chia hết số đầu attention, và pipeline parallelism khi chúng không như vậy hoặc khi mô hình cần nhiều hơn một máy. Tensor parallelism giao tiếp sau mỗi lớp, pipeline parallelism một lần mỗi ranh giới giai đoạn, và data parallelism hoàn toàn không giao tiếp giữa các bản sao.

## Full answer

### Three questions

| Câu hỏi | Nếu có | Nếu không |
|---|---|---|
| Mô hình có vừa trên một GPU, với chỗ cho KV cache bạn cần không? | Data parallelism: một bản sao mỗi GPU, `--data-parallel-size N`. | Chia mô hình; câu hỏi tiếp theo quyết định ở đâu. |
| Mô hình đã chia có vừa trong một máy không? | Giữ phần chia trong máy; câu hỏi tiếp theo chọn bố trí. | Thêm pipeline parallelism giữa các máy. |
| Các GPU có NVLink, và số GPU có chia đều mô hình không? | Tensor parallelism, `--tensor-parallel-size N`. | Pipeline parallelism trong máy, `--pipeline-parallel-size N`. |

Giữa các máy: đặt kích thước pipeline bằng số máy và kích thước tensor bằng số GPU trong mỗi máy. Kích thước tensor phải chia hết số đầu attention. Nếu số GPU trong một máy không chia hết nó, dùng kích thước tensor 1 và đưa toàn bộ số GPU vào kích thước pipeline.

### What each layout costs

| Bố trí | Nó chia gì | Giao tiếp | Tốt nhất cho |
|---|---|---|---|
| Tensor | mỗi lớp trên các GPU | sau mỗi lớp, nên cần một liên kết nhanh | một mô hình quá lớn cho một GPU, trong một máy |
| Pipeline | các lớp thành các giai đoạn | một lần mỗi ranh giới giai đoạn | một mô hình quá lớn cho một máy, hoặc các GPU không có liên kết nhanh |
| Data | không gì, mỗi GPU giữ một bản sao | không có giữa các bản sao | thêm đầu ra từ một mô hình vừa |
| Expert | các expert của một mô hình mixture-of-experts | trước và sau các lớp expert | các mô hình expert lớn |

Tensor parallelism cũng chia KV cache, nên mỗi GPU có nhiều chỗ hơn cho nó. Khi trọng số lấp phần lớn một GPU, hai GPU có thể chứa pool gấp vài lần một GPU. Ngoại lệ là một mô hình có multi-head latent attention: nó lưu một latent nén mỗi token không thể chia qua các đầu, nên mọi rank tensor-parallel giữ toàn bộ cache và thêm rank không thêm token. Attention data parallelism trả lời trường hợp đó.

### Check the link

Tensor parallelism gửi dữ liệu sau mỗi lớp. Trên các GPU chỉ nối bằng PCIe, chẳng hạn hai L4 trong một host, lưu lượng đó có thể tốn nhiều hơn lượng phần chia tiết kiệm. Tài liệu vLLM gợi ý pipeline parallelism trên một máy như vậy, vì nó chỉ gửi dữ liệu ở ranh giới giai đoạn, và nó cũng chấp nhận số GPU không chia đều mô hình. Tài liệu không chạy bố trí nào trên hai L4 của nó, nên đo chúng đối chiếu nhau trước khi chọn.

### Start a second machine

Chạy script kiểm thử collective trên cả hai máy trước. Khi mạng và driver hoạt động, mỗi tiến trình in các dòng thành công của nó. Sau đó khởi động máy chủ với một launcher trải các máy, và chỉ khởi động API trên một máy. Lưu lượng giữa các máy không được mã hóa và có thể chạy mã ở phía bên kia, nên giữ nó trên một mạng riêng.

### Count the processes

Với data parallelism, vLLM khởi động một engine core mỗi bản sao và một coordinator giữ chúng đồng bộ. Với tensor parallelism, nó khởi động một worker mỗi GPU dưới một engine core. Trong SGLang, world size là `--tp-size` nhân `--pp-size`, và các bản sao `--dp-size` có một controller gửi mỗi yêu cầu đến một bản sao, mặc định round robin. Controller đó không xem pool hay hàng đợi. Trên hai L4 của tài liệu, nơi một card được chia sẻ và bản sao của nó có pool 2,925 token so với 24,094, cặp đó phục vụ ít hơn một card ở mọi tải.

### Give a tensor group whole GPUs

Trước khi SGLang nạp trọng số cho một nhóm tensor, mỗi rank đo bộ nhớ trống của nó và nhóm giữ giá trị nhỏ nhất. Nếu giá trị đó dưới 90 phần trăm bộ nhớ trống cục bộ, máy chủ dừng. Trên cặp được chia sẻ, card thứ hai có 18.28 GB trống so với 19.53 GB mà kiểm tra yêu cầu, nên `--tp-size 2` từ chối khởi động, và không cờ nào tắt kiểm tra đó. Mọi rank giữ cùng tỷ phần trọng số và cùng pool, nên card nhỏ nhất đặt kích thước cho tất cả.

### Very long prompts

Với prompt hàng trăm nghìn token, vLLM có thể chia một chuỗi trên các GPU bằng context parallelism. Dùng nó khi một yêu cầu dài là vấn đề, không phải khi nhiều yêu cầu ngắn là vấn đề.

## Follow-ups

- **Level 2:** Hai GPU trong một host chỉ nối bằng PCIe, và mô hình vừa trên một GPU. Bạn chạy gì? Expected: data parallelism, hai bản sao đầy đủ, vì không có gì di chuyển giữa các bản sao; tensor parallelism sẽ trả chi phí sau mỗi lớp qua liên kết chậm.
- **Level 3:** Mô hình cần hai máy có 8 GPU. Bạn đặt các kích thước như thế nào, và kiểm tra gì trước? Expected: kích thước pipeline 2 cho các máy và kích thước tensor 8 trong mỗi máy, với 8 chia hết số đầu attention; chạy kiểm thử collective trên cả hai máy trước và giữ lưu lượng trên một mạng riêng, vì nó không được mã hóa.
- **Level 3:** Tensor parallelism trên hai GPU mà một GPU được chia sẻ với công việc khác. SGLang làm gì khi khởi động? Expected: nó đo bộ nhớ trống trên mỗi rank, giữ giá trị nhỏ nhất, và dừng nếu giá trị đó dưới 90 phần trăm bộ nhớ trống cục bộ, vì mọi rank giữ cùng tỷ phần và pool; cấp cho nhóm các GPU nguyên vẹn.
- **Level 4:** Tại sao tensor parallelism không thêm dung lượng KV khi attention giữ một latent mỗi token? Expected: attention đó lưu một latent nén mỗi token không thể chia qua các đầu, nên mọi rank giữ toàn bộ cache; attention data parallelism cấp cho mỗi nhóm các yêu cầu và cache riêng, nên dung lượng tăng theo các nhóm.

## Wrong answers

- "Tensor parallelism là cách mặc định để dùng thêm GPU." Nó là cách khiến một mô hình vừa; khi mô hình vừa, data parallelism thêm đầu ra mà không có lưu lượng giữa các bản sao, và tensor parallelism qua PCIe có thể tốn nhiều hơn lượng nó tiết kiệm.
- "Nhiều bản sao hơn luôn có nghĩa nhiều thông lượng hơn." Chỉ khi mọi bản sao có pool gần bằng nhau; một cặp mà một bản sao có một phần tám pool phục vụ ít hơn một card, vì controller round-robin đưa cho nó một nửa yêu cầu.
- "Pipeline parallelism chỉ dành cho nhiều máy." Trong một máy, nó là lựa chọn khi các GPU thiếu liên kết nhanh hoặc khi số GPU không chia đều mô hình.
- "Số GPU nào cũng dùng được với tensor parallelism." Kích thước phải chia hết số đầu attention của mô hình; nếu không dùng kích thước tensor 1 và đưa toàn bộ số lượng vào kích thước pipeline.

## Taught in

[Chọn tensor, pipeline hoặc data parallelism](../../../manuals/vllm-101/sections/6-1-choose-tensor-pipeline-or-data-parallelism.md) đưa ra cây quyết định, và [phần parallelism của SGLang](../../../manuals/sglang-101/sections/6-1-tp-size-dp-size-and-attn-dp-size.md) thêm kiểm tra cân bằng bộ nhớ và cặp không đồng đều.
