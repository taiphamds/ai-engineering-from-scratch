---
id: pick-a-4-bit-format
title: Pick a 4-bit format for a 14B model on 24 GB
card: gpu-memory-quantization
kind: tradeoff
level: 2
roles: [inference-engineer, applied-ai-engineer]
rounds: [screen, design-review]
tags: [quantization, awq, gptq, bitsandbytes, gguf]
minutes: 10
lessons: [phases/17-infrastructure-and-production/09-production-quantization, phases/10-llms-from-scratch/11-quantization]
manuals: [vllm-101#s-fit-a-bigger-model-with-fp8-weights]
practice: []
cheatsheet: []
related: []
updated: 2026-11-03
---

Một mô hình 14B phải chạy trên một card 24 GB và không vừa ở FP8 với một pool dùng được. Bạn có thể chọn AWQ, GPTQ, một checkpoint ở định dạng compressed-tensors, bitsandbytes lúc nạp, hoặc một file GGUF. Bạn chọn như thế nào, và tài liệu đã đo gì cho mỗi loại?

## Short answer

Chọn một checkpoint 4-bit được công bố thay vì lượng tử hóa lúc nạp, và chọn định dạng từ engine và workload. Với một GPU server AWQ cùng các kernel Marlin là mặc định, GPTQ khi bạn cũng phục vụ các LoRA adapter trên base, và GGUF chỉ cho phục vụ CPU hoặc edge, vì các kernel không được xây cho GPU. Tài liệu khởi động một AWQ Qwen3-14B trên một L4 với 9.44 GiB trọng số và một pool 36,272 token, nạp Qwen3-1.7B bằng bitsandbytes trong 1.33 GiB so với 3.22 GiB ở BF16, là 41 phần trăm, và nạp một file GGUF 0.55 GiB qua một plugin mà tài liệu gọi là thử nghiệm.

## Full answer

### The formats vLLM reads

| Định dạng | Nó lưu gì | Ghi chú tại 0.31.0 |
|---|---|---|
| AWQ và GPTQ | trọng số 4-bit, tính toán 16-bit | chạy từ GPU Turing trở đi, với các kernel Marlin nhanh trên Ampere, Ada và Hopper |
| compressed-tensors W4A16 hoặc W8A8 | trọng số 4-bit hoặc 8-bit, làm bằng thư viện LLM Compressor | project vLLM đề xuất thư viện này để tạo checkpoint riêng |
| bitsandbytes | trọng số 4-bit, làm khi server nạp mô hình | cần gói riêng `vllm-bnb-plugin`, rồi `--quantization bitsandbytes` cho một mô hình chưa lượng tử hóa |
| GGUF | định dạng file llama.cpp | cần gói riêng `vllm-gguf-plugin`, và tài liệu gọi nó là thử nghiệm |

Với một checkpoint được công bố bạn không đặt cờ; vLLM đọc phương pháp từ cấu hình checkpoint.

### What the manual started

- **AWQ.** `vllm serve Qwen/Qwen3-14B-AWQ --max-model-len 8192` trên một L4 không có cờ lượng tử hóa. Log cho thấy `quantization=auto_awq` và kernel Marlin. Trọng số chiếm 9.44 GiB và pool giữ 36,272 token. Tốc độ và độ chính xác chưa được đo.
- **bitsandbytes.** Không có plugin, server dừng với `Unknown quantization method: bitsandbytes`. Có nó, Qwen3-1.7B nạp trong 1.33 GiB so với 3.22 GiB ở BF16, là 41 phần trăm, và pool tăng từ 92,960 lên 108,512 token. Mức 41 phần trăm gồm embedding và lớp đầu ra, vẫn ở 16-bit, vì vậy tỷ lệ khác trên một mô hình lớn hơn.
- **GGUF.** Có plugin, một file 4-bit của Qwen3-0.6B nạp 0.55 GiB trọng số và một request chat trả về HTTP 200.

GPU thứ hai của node bị throttle trong các lần khởi động này, vì vậy tài liệu không đưa tốc độ, và không đo độ chính xác cho bất kỳ định dạng nhỏ nào.

### The lesson's picking guide

- Phục vụ CPU hoặc edge: GGUF, với biến thể 4-bit trung bình làm mặc định production. GGUF là một định dạng file gói nhiều biến thể lượng tử hóa, giữ các lớp đầu và cuối ở độ chính xác cao hơn, và chạy tốt nhất trong llama.cpp, engine CPU nhanh nhất. Trong vLLM nó chậm, khoảng 93 token mỗi giây trên một mô hình 7B theo số của bài học, vì định dạng không được xây cho kernel GPU.
- Phục vụ GPU với chat thường lệ và không adapter: AWQ. Nó bảo vệ các trọng số nổi bật nhất khi lượng tử hóa; với các kernel Marlin nó cho khoảng 741 token mỗi giây trên một mô hình 7B, độ chính xác mã tốt nhất giữa các định dạng 4-bit, và tăng tốc 10.9 lần so với một kernel ngây thơ.
- Phục vụ GPU với nhiều LoRA adapter trên một base: GPTQ với Marlin, khoảng 712 token mỗi giây trên một mô hình 7B và nhanh hơn 2.6 lần so với không Marlin, vì nó hỗ trợ LoRA trong vLLM và các định dạng microscaling 4-bit không hỗ trợ lúc đầu 2026.
- Công việc nặng suy luận: FP8, và chấp nhận chi phí bộ nhớ; bài học đặt tổn thất AWQ trên toán ở vài điểm.

### Two traps

Tập hiệu chuẩn phải khớp miền: AWQ và GPTQ chọn trọng số cần bảo vệ từ một lượt hiệu chuẩn, và văn bản web chung khiến chúng bảo vệ sai các trọng số cho lưu lượng mã nguồn, y tế hoặc pháp lý. Hiệu chuẩn trên hàng trăm mẫu trong miền và kiểm thử trên tập đánh giá. Và KV cache riêng với trọng số: một mô hình 70B ở 4-bit là khoảng 35 GB trọng số, và tại 128 request đồng thời với ngữ cảnh 2k cache của nó gần 20 GB thêm.

### The accuracy caveat

Một mô hình 4-bit có thể mất độ chính xác nhiều hơn một mô hình FP8, và tổn thất phụ thuộc mô hình và phương pháp. Tài liệu chạy kiểm tra GSM8K trên FP8 chứ không trên các định dạng 4-bit. Kiểm thử các định dạng ứng viên trên prompt riêng, và khi mơ hồ chạy một đánh giá 1,000 mẫu trên mỗi loại.

## Follow-ups

- **Level 2:** Tại sao chọn một checkpoint được công bố thay vì bitsandbytes lúc nạp? Expected: lượng tử hóa lúc nạp thêm thời gian nạp và cho một checkpoint chưa ai đánh giá; một checkpoint được công bố có phương pháp đã biết và thường có độ chính xác được công bố, và vLLM đọc phương pháp từ cấu hình không cần cờ.
- **Level 3:** Lần nạp bitsandbytes tiết kiệm 41 phần trăm trên một mô hình 1.7B. Một mô hình 14B sẽ tiết kiệm cùng tỷ lệ không? Expected: không giống; mức 41 phần trăm gồm embedding và lớp đầu ra, vẫn ở 16-bit, và chúng là phần nhỏ hơn của mô hình lớn hơn, vì vậy tiết kiệm thay đổi.
- **Level 3:** Bạn cần LoRA adapter trên base 4-bit. Định dạng nào? Expected: GPTQ với các kernel Marlin, vì nó hỗ trợ LoRA adapter trong vLLM; các định dạng microscaling 4-bit không hỗ trợ LoRA lúc đầu 2026.
- **Level 4:** Một mô hình miền được lượng tử hóa bằng AWQ trên văn bản web chung mất vài điểm trên đánh giá riêng. Tại sao, và bạn làm gì? Expected: AWQ chọn trọng số cần bảo vệ từ một tập hiệu chuẩn, và văn bản chung khiến nó bảo vệ sai các trọng số cho miền; hiệu chuẩn trên hàng trăm mẫu trong miền và kiểm thử trên tập đánh giá trước khi phát hành.

## Wrong answers

- "GGUF là định dạng phổ biến nhất, vì vậy dùng nó trên GPU server." Nó là mặc định CPU và edge; trong vLLM cần một plugin thử nghiệm, và các kernel không được xây cho GPU, khoảng 93 token mỗi giây trên mô hình 7B theo số của bài học.
- "Lượng tử hóa lúc nạp bằng bitsandbytes, đó là một cờ." Không plugin server dừng với lỗi phương pháp không biết, và kết quả là một checkpoint chưa ai đánh giá; dùng một checkpoint AWQ hoặc GPTQ được công bố và kiểm thử.
- "4-bit mất ít như FP8." Một mô hình 4-bit có thể mất nhiều hơn, và tổn thất phụ thuộc mô hình và phương pháp; AWQ mất vài điểm trên toán trong bài học, vì vậy chạy kiểm tra riêng.
- "Tiết kiệm bộ nhớ là 41 phần trăm cho bất kỳ mô hình." Mức 41 phần trăm đo được là một mô hình nhỏ có embedding và lớp đầu ra ở 16-bit; tỷ lệ khác trên mô hình lớn hơn, và KV cache riêng với trọng số.

## Taught in

[Làm mô hình lớn hơn vừa bằng trọng số FP8](../../../manuals/vllm-101/sections/2-5-fit-a-bigger-model-with-fp8-weights.md) liệt kê các định dạng và ba lần khởi động, và [bài học lượng tử hóa production](../../../phases/17-infrastructure-and-production/09-production-quantization/docs/en.md) cùng [bài học lượng tử hóa](../../../phases/10-llms-from-scratch/11-quantization/docs/en.md) đưa ra hướng dẫn chọn.
