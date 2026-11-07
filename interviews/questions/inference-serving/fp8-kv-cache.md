---
id: fp8-kv-cache
title: What an FP8 KV cache buys and costs
card: inference-serving
kind: tradeoff
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [ml-depth, design-review]
tags: [fp8, kv-cache, capacity, accuracy, attention-backend]
minutes: 10
lessons: []
manuals: [vllm-101#s-fit-more-users-with-an-fp8-kv-cache, sglang-101#s-quantization]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Server của bạn xếp hàng request vì KV cache đầy. Ai đó đề xuất `--kv-cache-dtype fp8`. Nó mang lại gì, có thể tốn gì, và bạn kiểm tra cả hai trước production như thế nào?

## Short answer

Một KV cache FP8 lưu mỗi key và value trong 1 byte thay vì 2, vì vậy cùng bộ nhớ giữ gấp đôi token: với Qwen/Qwen3-8B một token giảm từ 144 KiB xuống 72 KiB, và một GiB giữ khoảng 14,600 token thay vì khoảng 7,300. Nó có thể tốn độ chính xác, vì FP8 cần một scale mỗi tensor và một checkpoint không có scale chạy với scale 1.0, và nó có thể thay attention backend, điều làm hỏng lần khởi động đầu trên L4 của chúng ta. Kiểm tra bằng một lần chạy độ chính xác trên nhiệm vụ riêng và bằng log khởi động: trên 500 câu hỏi GSM8K lần KV FP8 đạt 90.8 phần trăm so với 91.8 ở BF16, với các khoảng chồng nhau.

## Full answer

### What it buys

Chỉ cache thay đổi; trọng số giữ ở BF16. Dùng công thức KV với 1 byte mỗi giá trị. Gấp đôi token vừa, vì vậy gấp đôi người dùng vừa ở cùng độ dài, hoặc mỗi người có thể có ngữ cảnh dài gấp đôi.

Thay đổi tốc độ nhỏ. Với pool giữ cố định 24,096 token trên L4, một người dùng có TPOT trung vị 101.8 ms so với 104.1 ms ở BF16, nhanh hơn 2.3 phần trăm ở cùng xung 210 MHz, và các phạm vi seed không chồng nhau. Ở 32 người dùng các phạm vi seed chồng nhau và lần FP8 có xung cao hơn, vì vậy tài liệu không tuyên bố lợi ích ở đó. Hai thứ thay đổi cùng nhau trong lần đó, dtype cache và attention backend.

Một báo cáo thực địa cho thấy hiệu ứng dung lượng ở quy mô lớn. Với cache BF16 một dịch vụ tạo 1,558 token mỗi giây ở 32 request đồng thời và hết bộ nhớ ở 64. Với cache FP8 nó đạt 2,192 token mỗi giây ở 64, khoảng 41 phần trăm trên kết quả BF16 tốt nhất, trong khi chậm hơn vài phần trăm mỗi token ở mọi mức đồng thời cả hai chạy được. Nó thắng vì gấp đôi request vừa: ngữ cảnh giữ trong bộ nhớ đi từ khoảng 686,000 lên khoảng 1.37 triệu token.

### What it costs

FP8 cần một scale cho mỗi tensor. Không file scale, mọi scale là 1.0. vLLM ghi `Using KV cache scaling factor 1.0` và SGLang ghi `Using FP8 KV cache but no scaling factors provided`. Nhóm vLLM coi scale 1.0 là trường hợp tệ nhất cho độ chính xác; trong các kiểm thử của họ phần lớn mô hình giữ gần BF16, và một họ mô hình trên backend latent-attention thì không.

Kiểm tra riêng của chúng ta, ngày 2026-10-23, chạy 500 câu hỏi GSM8K đầu, 8-shot và greedy, trên L4. Qwen3-8B không có KV scale, vì vậy các lần KV FP8 dùng scale 1.0:

| Engine | Cấu hình | Đúng | Độ chính xác | Khoảng Wilson 95 phần trăm |
|---|---|---|---|---|
| vLLM | BF16 | 459/500 | 91.8% | 89.1 đến 93.9 |
| vLLM | KV cache FP8 | 454/500 | 90.8% | 87.9 đến 93.0 |
| SGLang | BF16 | 458/500 | 91.6% | 88.8 đến 93.7 |
| SGLang | KV cache FP8 | 458/500 | 91.6% | 88.8 đến 93.7 |

Mọi khoảng chồng khoảng BF16, vì vậy lần chạy này không cho thấy khác biệt. Với 500 câu hỏi nó không thể loại trừ mất vài điểm. Đây là một mô hình và một benchmark. Một mô hình có bố trí attention khác có thể mất nhiều hơn.

### The backend trap on an L4

Lần khởi động FP8 đầu trên L4 thất bại. FlashAttention trong vLLM 0.31.0 chỉ đọc cache FP8 trên GPU trung tâm dữ liệu Hopper và Blackwell, và L4 là GPU Ada, SM 8.9. Vì vậy vLLM chuyển sang FlashInfer, xây kernel ở lần khởi động đầu, và lần dựng đó thất bại trên node của chúng ta. Cách sửa là `--attention-backend TRITON_ATTN`, đọc FP8 và không cần dựng, với `VLLM_USE_FLASHINFER_SAMPLER=0` vì cùng lý do. Đọc dòng attention backend sau mọi thay đổi dtype cache.

### Check that your scales load

1. Tìm weight index checkpoint cho các tên tensor kết thúc bằng `k_scale` hoặc `v_scale`. Với checkpoint có index, không đầu ra nghĩa là không scale. Checkpoint có một file trọng số không có index; với nó, liệt kê tên tensor bằng gói Python `safetensors`.
2. Đọc log khởi động tìm cảnh báo scale. Nếu checkpoint có scale và cảnh báo vẫn in, loader đã bỏ chúng. Tại 0.31.0 một họ mô hình không bao giờ nạp KV scale, và issue đang mở.
3. Chạy prompt riêng có và không FP8 và so sánh câu trả lời trước khi lên production.

Checkpoint FP8 của Qwen3-30B-A3B liệt kê weight scale và không KV scale, vì vậy weight scale không ngụ ý KV scale.

### The order of checks

1. Pool có là giới hạn không? Đọc mức sử dụng cache và hàng đợi. Nếu pool còn chỗ, giữ dtype mô hình.
2. Tìm KV scale trong checkpoint.
3. Khởi động server và đọc dòng backend cùng cảnh báo scale.
4. Chạy phép kiểm tra độ chính xác trên nhiệm vụ riêng.
5. Đo tốc độ ở cùng xung, và mong đợi ít thay đổi mỗi token.

## Follow-ups

- **Level 2:** Pool còn chỗ và request không xếp hàng. Bạn vẫn chuyển không? Expected: không; dtype cache là quyết định dung lượng, và với chỗ trong pool nó không mang lại gì và vẫn mang rủi ro độ chính xác và backend.
- **Level 3:** Cảnh báo scale in dù checkpoint có các tensor k_scale. Nghĩa là gì? Expected: loader bỏ scale; tại 0.31.0 một họ mô hình không bao giờ nạp KV scale và issue đang mở, vì vậy server chạy với scale 1.0 đến khi bạn đổi checkpoint hoặc phiên bản.
- **Level 3:** Tại sao lần khởi động FP8 đầu thất bại trên L4 chứ không trên GPU trung tâm dữ liệu? Expected: attention backend mặc định chỉ đọc cache FP8 trên GPU trung tâm dữ liệu Hopper và Blackwell, vì vậy vLLM chuyển dự phòng sang backend biên dịch kernel ở lần khởi động đầu, và lần dựng đó thất bại; backend Triton đọc FP8 và bỏ việc dựng.
- **Level 4:** Phép kiểm tra GSM8K cho 91.8 so với 90.8 phần trăm, và hai khoảng chồng nhau. Bạn kết luận gì? Expected: lần này không cho thấy khác biệt và không thể loại trừ mất vài điểm; đây là một mô hình và một benchmark, vì vậy chạy cùng phép kiểm tra trên mô hình và nhiệm vụ riêng, và mong đợi mô hình có bố trí attention khác mất nhiều hơn.

## Wrong answers

- "KV FP8 giảm một nửa bộ nhớ, vì vậy gấp đôi throughput." Nó gấp đôi token vừa; trong báo cáo thực địa nó chậm hơn vài phần trăm mỗi token ở mọi tải cả hai cache chạy được, và chỉ thắng vì cache BF16 cạn ở 64 request.
- "Checkpoint là FP8, vì vậy có KV scale." Weight scale và KV scale là các tensor khác; checkpoint FP8 của Qwen3-30B-A3B liệt kê weight scale và không k_scale hay v_scale, vì vậy cache chạy với scale 1.0.
- "Độ chính xác là thuộc tính mô hình, vì vậy kiểm thử một lần." Tổn thất phụ thuộc mô hình, bố trí attention và nhiệm vụ; một họ cần scale được hiệu chuẩn mất độ chính xác với scale 1.0 trong khi phần lớn mô hình giữ gần BF16 trong cùng kiểm thử.
- "Attention backend không quan trọng cho dtype cache." Trên L4 thay dtype chuyển vLLM sang backend khác và khởi động thất bại; đọc dòng backend sau mọi thay đổi dtype cache.

## Taught in

[Cho thêm người dùng vừa với KV cache FP8](../../../manuals/vllm-101/sections/2-4-fit-more-users-with-an-fp8-kv-cache.md) và [phần lượng tử hóa SGLang](../../../manuals/sglang-101/sections/4-3-quantization.md) đo pool, tốc độ và độ chính xác GSM8K trên cả hai engine.
