# Production Quantization — AWQ, GPTQ, GGUF K-quants, FP8, MXFP4/NVFP4

> Định dạng lượng tử hóa không phải một lựa chọn phổ quát — nó là một hàm của phần cứng, engine phục vụ, và khối lượng công việc. GGUF Q4_K_M hoặc Q5_K_M làm chủ CPU và biên, được cung cấp qua llama.cpp và Ollama. GPTQ thắng trong vLLM khi bạn cần nhiều LoRA trên cùng mô hình cơ sở. AWQ với các kernel Marlin-AWQ cung cấp ~741 tok/s trên một mô hình loại 7B với Pass@1 tốt nhất ở INT4 — mặc định năm 2026 cho sản xuất trung tâm dữ liệu. FP8 vẫn là trung điểm trên Hopper, Ada, và Blackwell — gần không mất mát và được hỗ trợ rộng. NVFP4 và MXFP4 (microscaling Blackwell) quyết liệt và yêu cầu xác thực theo từng block. Hai bẫy gây hại cho các nhóm: tập dữ liệu hiệu chuẩn phải khớp lĩnh vực triển khai, và bộ nhớ đệm KV tách khỏi lượng tử hóa trọng số — bài học AWQ “mô hình của tôi giờ là 4 GB” quên bộ nhớ đệm KV 10-30 GB ở các kích thước lô sản xuất.

**Type:** Learn
**Languages:** Python (stdlib, toy memory and throughput comparison across formats)
**Prerequisites:** Phase 10 · 13 (Quantization foundations), Phase 17 · 04 (Serving Engine Internals)
**Time:** ~75 minutes

## Learning Objectives

- Nêu sáu định dạng lượng tử hóa sản xuất và các điểm phù hợp của chúng năm 2026.
- Chọn một định dạng theo phần cứng (CPU so với GPU, Hopper so với Blackwell), engine (vLLM, TRT-LLM, llama.cpp), và khối lượng công việc (trò chuyện thường lệ, suy luận, nhiều LoRA).
- Tính bộ nhớ trọng số được tiết kiệm và bộ nhớ đệm KV không bị đụng tới cho một định dạng đã chọn.
- Nêu cạm bẫy tập dữ liệu hiệu chuẩn làm suy giảm các mô hình lượng tử hóa trên lưu lượng lĩnh vực.

## The Problem

Lượng tử hóa giảm bộ nhớ và băng thông HBM, chính xác là những gì decode cần. Một mô hình FP16 70B có 140 GB trọng số. Lượng tử hóa trọng số xuống INT4 (AWQ hoặc GPTQ) và mô hình là 35 GB — vừa trong một H100 với chỗ cho bộ nhớ đệm KV, quan trọng vì ở 128 chuỗi đồng thời với ngữ cảnh 2k, riêng bộ nhớ đệm KV là 20-30 GB.

Nhưng lượng tử hóa không miễn phí. Lượng tử hóa quyết liệt làm suy giảm chất lượng, đặc biệt trên các tác vụ nhiều suy luận. Các định dạng khác nhau hoạt động với các engine khác nhau. Phần cứng khác nhau hỗ trợ gốc các độ chính xác khác nhau. Vườn thú định dạng năm 2026 là có thật và bạn không thể sao chép lựa chọn của người khác — bạn phải chọn dựa trên ngăn xếp của mình.

## The Concept

### The six formats

| Định dạng | Bit | Điểm phù hợp | Engine |
|--------|------|-----------|---------|
| GGUF Q4_K_M / Q5_K_M | 4-5 | CPU, biên, laptop | llama.cpp, Ollama |
| GPTQ | 4-8 | Nhiều LoRA trên vLLM | vLLM, TGI |
| AWQ | 4 | Sản xuất GPU trung tâm dữ liệu | vLLM (Marlin-AWQ), TGI |
| FP8 | 8 | Trung tâm dữ liệu Hopper/Ada/Blackwell | vLLM, TRT-LLM, SGLang |
| MXFP4 | 4 | Blackwell nhiều người dùng | TRT-LLM |
| NVFP4 | 4 | Blackwell nhiều người dùng | TRT-LLM |

### GGUF — the CPU/edge default

GGUF là một định dạng file, tự nó không phải một sơ đồ lượng tử hóa — nó gói các biến thể K-quant (Q2_K, Q3_K_M, Q4_K_M, Q5_K_M, Q6_K, Q8_0) trong một container. Q4_K_M và Q5_K_M là các mặc định sản xuất — chất lượng gần BF16 ở 4-5 bit. Lựa chọn tốt nhất cho phục vụ CPU hoặc biên vì llama.cpp vượt xa là engine suy luận CPU nhanh nhất.

Phạt thông lượng trong vLLM: ~93 tok/s trên 7B — định dạng không được tối ưu cho các kernel GPU. Sử dụng GGUF khi đích triển khai là CPU/biên. Không phải trường hợp khác.

### GPTQ — multi-LoRA in vLLM

GPTQ là một thuật toán lượng tử hóa sau huấn luyện với một lượt hiệu chuẩn. Các kernel Marlin làm nó nhanh trên GPU (tăng tốc 2.6x so với GPTQ không Marlin). ~712 tok/s trên 7B.

Lợi thế độc nhất: GPTQ-Int4 hỗ trợ các adapter LoRA trong vLLM. Nếu bạn phục vụ một mô hình cơ sở cộng 10-50 biến thể tinh chỉnh (mỗi biến thể như một LoRA), GPTQ là đường đi của bạn. NVFP4 chưa hỗ trợ LoRA tính đến đầu năm 2026.

### AWQ — the datacenter GPU default

Lượng tử hóa trọng số nhận biết kích hoạt. Bảo vệ ~1% trọng số nổi bật nhất trong lượng tử hóa. Các kernel Marlin-AWQ: tăng tốc 10.9x so với ngây thơ. ~741 tok/s trên 7B, Pass@1 tốt nhất trong các định dạng INT4.

Chọn AWQ cho phục vụ GPU mới trừ khi bạn cần nhiều LoRA (GPTQ) hoặc FP4 Blackwell quyết liệt (NVFP4).

### FP8 — the reliable middle

Dấu phẩy động 8 bit. Gần không mất mát. Được hỗ trợ rộng. Các Tensor Core Hopper tăng tốc FP8 gốc. Blackwell kế thừa. FP8 là mặc định an toàn năm 2026 khi chất lượng không thể thương lượng (suy luận, y khoa, sinh mã). Tiết kiệm bộ nhớ bằng nửa INT4 nhưng rủi ro chất lượng thấp hơn nhiều.

### MXFP4 / NVFP4 — Blackwell aggressive

FP4 microscaling. Mỗi block trọng số có hệ số thang đo riêng. Quyết liệt nhưng được tăng tốc phần cứng trên các Tensor Core Blackwell. Giảm nửa số byte mỗi token so với FP8 — lợi ích kinh tế trong Giai đoạn 17 · 07.

Các lưu ý:
- Chưa có hỗ trợ LoRA (đầu năm 2026).
- Mức giảm chất lượng nhìn thấy trên các khối lượng công việc nhiều suy luận.
- Xác thực trên tập đánh giá của bạn theo từng mô hình.

### The calibration trap

AWQ và GPTQ yêu cầu một tập dữ liệu hiệu chuẩn — thường là C4 hoặc WikiText. Với các mô hình lĩnh vực (mã, y khoa, pháp lý), hiệu chuẩn trên văn bản web tổng quát để thuật toán đưa ra các quyết định sai về những trọng số nào cần bảo vệ. Pass@1 trên HumanEval có thể giảm vài điểm.

Cách sửa: hiệu chuẩn trên dữ liệu trong lĩnh vực. Hàng trăm mẫu lĩnh vực thường đủ. Kiểm thử trên tập đánh giá trước khi đưa ra sử dụng.

### The KV cache trap

AWQ thu trọng số xuống 4 bit. Bộ nhớ đệm KV tách biệt và giữ ở FP16/FP8. Với một mô hình 70B có AWQ:

- Trọng số: ~35 GB (INT4 từ 140 GB).
- Bộ nhớ đệm KV ở 128 đồng thời × ngữ cảnh 2k: ~20 GB.
- Các kích hoạt: ~5 GB.
- Tổng: ~60 GB — vừa trên H100 80GB.

Ngây thơ “Tôi lượng tử hóa mô hình xuống 4 GB” quên 30-50 GB khác. Dự trù HBM toàn diện.

Riêng biệt, lượng tử hóa bộ nhớ đệm KV (KV FP8 hoặc KV INT8) là một lựa chọn khác với các đánh đổi riêng — nó ảnh hưởng trực tiếp độ chính xác attention và không phải lợi ích miễn phí.

### AWQ INT4 is hazardous for reasoning

Chuỗi suy nghĩ, toán, sinh mã với ngữ cảnh dài — chúng chịu ảnh hưởng thấy rõ từ lượng tử hóa quyết liệt. AWQ INT4 mất ~3-5 điểm trên MATH. Với các khối lượng công việc nhiều suy luận, đưa FP8 hoặc BF16 ra sử dụng; chấp nhận chi phí bộ nhớ.

### 2026 picking guide

- Phục vụ CPU/biên: GGUF Q4_K_M. Xong.
- Phục vụ GPU, trò chuyện thường lệ, không LoRA: AWQ.
- Phục vụ GPU, nhiều LoRA: GPTQ với Marlin.
- Khối lượng công việc suy luận: FP8.
- Trung tâm dữ liệu Blackwell, chất lượng được xác thực: NVFP4 + KV FP8.
- Mơ hồ: chạy một đánh giá 1,000 mẫu trên mỗi định dạng ứng viên.

```figure
gpu-memory-breakdown
```

## Use It

`code/main.py` tính dung lượng bộ nhớ chiếm dụng (trọng số + KV + các kích hoạt) và thông lượng tương đối trên sáu định dạng cho một dải kích thước mô hình. Cho thấy nơi bộ nhớ đệm KV chi phối, nơi nén trọng số có lợi, và nơi FP8 là lựa chọn an toàn.

## Ship It

Bài này tạo ra `outputs/skill-quantization-picker.md`. Với phần cứng, kích thước mô hình, loại khối lượng công việc, và dung sai chất lượng, chọn một định dạng và tạo một kế hoạch hiệu chuẩn/xác thực.

## Exercises

1. Chạy `code/main.py`. Với một mô hình 70B ở 128 đồng thời với ngữ cảnh 2k, tính tổng HBM cho mỗi định dạng. Định dạng nào cho bạn vừa trên một H100 80GB?
2. Bạn có một mô hình lập trình 7B. Chọn một định dạng và giải thích. Nếu bạn sai về dung sai chất lượng, đường phục hồi là gì?
3. Tính kích thước tập dữ liệu hiệu chuẩn cần để hiệu chuẩn AWQ cho một mô hình lĩnh vực y khoa. Vì sao nhiều dữ liệu hơn không phải lúc nào cũng tốt hơn?
4. Đọc bài báo kernel Marlin-AWQ hoặc các ghi chú phát hành. Giải thích trong ba câu vì sao AWQ đạt 741 tok/s trên 7B trong khi GPTQ thô đạt ~712.
5. Khi nào hợp lý để kết hợp các trọng số AWQ với bộ nhớ đệm KV FP8 so với giữ KV ở BF16?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| GGUF | “định dạng llama.cpp” | Định dạng file gói các biến thể K-quant; mặc định CPU/biên |
| Q4_K_M | “Q4 K M” | K-quant 4 bit mức vừa; mặc định GGUF sản xuất |
| GPTQ | “gee pee tee q” | INT4 sau huấn luyện với hiệu chuẩn; hỗ trợ LoRA trong vLLM |
| AWQ | “a w q” | INT4 nhận biết kích hoạt; các kernel Marlin; Pass@1 tốt nhất ở INT4 |
| Marlin kernels (Các kernel Marlin) | “các kernel INT4 nhanh” | Các kernel CUDA tùy chỉnh cho INT4 trên Hopper; tăng tốc 10x |
| FP8 | “dấu phẩy động tám bit” | Mặc định độ chính xác an toàn trên Hopper/Ada/Blackwell |
| MXFP4 / NVFP4 | “microscaling bốn” | FP 4 bit Blackwell với các hệ số thang đo theo từng block |
| Calibration dataset (Tập dữ liệu hiệu chuẩn) | “dữ liệu hiệu chuẩn” | Văn bản đầu vào dùng để chọn các tham số lượng tử hóa; phải khớp lĩnh vực |
| KV cache quantization (Lượng tử hóa bộ nhớ đệm KV) | “KV INT8” | Lựa chọn tách khỏi trọng số; ảnh hưởng độ chính xác attention |

## Further Reading

- [VRLA Tech — LLM Quantization 2026](https://vrlatech.com/llm-quantization-explained-int4-int8-fp8-awq-and-gptq-in-2026/) — các benchmark so sánh.
- [Jarvis Labs — vLLM Quantization Complete Guide](https://jarvislabs.ai/blog/vllm-quantization-complete-guide-benchmarks) — các con số thông lượng theo định dạng.
- [PremAI — GGUF vs AWQ vs GPTQ vs bitsandbytes 2026](https://blog.premai.io/llm-quantization-guide-gguf-vs-awq-vs-gptq-vs-bitsandbytes-compared-2026/) — lựa chọn theo từng định dạng.
- [vLLM docs — Quantization](https://docs.vllm.ai/en/latest/features/quantization/index.html) — các định dạng và cờ được hỗ trợ.
- [AWQ paper (arXiv:2306.00978)](https://arxiv.org/abs/2306.00978) — công thức AWQ gốc.
- [GPTQ paper (arXiv:2210.17323)](https://arxiv.org/abs/2210.17323) — công thức GPTQ gốc.
