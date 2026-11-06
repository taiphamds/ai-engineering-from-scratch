---
name: skill-quantization
description: Choose the right quantization strategy for deploying LLMs based on hardware, quality, and latency constraints
version: 1.0.0
phase: 10
lesson: 11
tags: [quantization, inference, deployment, optimization, fp8, int4, int8, gptq, awq, gguf]
---

# Quantization Decision Framework

Khi triển khai mô hình ngôn ngữ, dùng khung này để chọn định dạng số, phương pháp lượng tử hóa và chiến lược xác thực chất lượng đúng.

## Input Requirements

Cung cấp:
- **Mô hình** (tên, số tham số, độ chính xác gốc)
- **Phần cứng mục tiêu** (mẫu GPU/VRAM, CPU, Apple Silicon, thiết bị biên)
- **Mục tiêu độ trễ** (token/giây, thời gian đến token đầu)
- **Mức chất lượng tối thiểu** (mức tăng perplexity chấp nhận tối đa, độ chênh benchmark)
- **Mô thức phục vụ** (kích thước batch, ngữ cảnh tối đa, người dùng đồng thời)

## Quick Selection

| Tình huống của bạn | Định dạng | Phương pháp | Mất chất lượng kỳ vọng |
|---------------|--------|--------|----------------------|
| GPU H100, thông lượng tối đa | FP8 E4M3 | Ép kiểu H100 nguyên bản | < 0.1% |
| A100/A10, cần thông lượng 2x | INT8 | LLM.int8() hoặc SmoothQuant | < 0.5% |
| Một GPU 24GB, mô hình 70B | INT4 | AWQ hoặc GPTQ | 1-3% |
| MacBook / Apple Silicon | INT4 GGUF | Q4_K_M qua llama.cpp | 1-2% |
| Di động / thiết bị biên | INT4 hoặc INT3 | QAT + riêng thiết bị | 2-5% |
| Nén tối đa, chấp nhận mất một ít | INT2 | QuIP# hoặc AQLM | 5-15% |
| Huấn luyện (độ chính xác hỗn hợp) | BF16 + tích lũy FP32 | Hỗ trợ framework nguyên bản | 0% |

## Precision Selection by Component

Không phải mọi tensor nên được xử lý giống nhau.

| Thành phần | Tối thiểu an toàn | Đề xuất | Tránh |
|-----------|-------------|-------------|-------|
| Trọng số FFN | INT4 | INT4 (AWQ/GPTQ) | INT2 không QAT |
| Trọng số attention | INT4 | INT8 hoặc FP8 | INT2 |
| Lớp embedding | INT8 | FP16 (giữ gốc) | INT4 |
| Head đầu ra | INT8 | FP16 (giữ gốc) | INT4 |
| KV cache | FP8 | FP8 hoặc INT8 | INT4 ở ngữ cảnh dài |
| Logit attention | FP16 | FP16 hoặc BF16 | INT8 |
| Activation (suy luận) | INT8 | FP8 hoặc INT8 | INT4 |

## Method Comparison

### GPTQ
- **Khi nào:** Suy luận GPU, bạn muốn mô hình tương thích Hugging Face
- **Dữ liệu hiệu chuẩn:** 128 ví dụ, mỗi ví dụ 2048 token
- **Thời gian:** 30-60 phút cho 70B trên A100
- **Công cụ:** `gptqmodel`, `exllama`, `exllamav2`
- **Điểm mạnh:** Được kiểm thử tốt, kho mô hình khổng lồ trên Hugging Face
- **Điểm yếu:** Áp dụng chậm hơn AWQ, chất lượng thấp hơn nhẹ so với AWQ trên vài mô hình

### AWQ
- **Khi nào:** Suy luận GPU, bạn muốn chất lượng mỗi bit tốt nhất
- **Dữ liệu hiệu chuẩn:** 128 ví dụ
- **Thời gian:** 15-30 phút cho 70B trên A100
- **Công cụ:** `llmcompressor`, `vLLM` (hỗ trợ nguyên bản)
- **Điểm mạnh:** Chất lượng INT4 tốt nhất, áp dụng nhanh, tích hợp vLLM
- **Điểm yếu:** Kho mô hình nhỏ hơn GPTQ

### GGUF
- **Khi nào:** Suy luận CPU, Apple Silicon, hệ sinh thái llama.cpp
- **Biến thể:** Q2_K, Q3_K_S/M/L, Q4_K_S/M, Q5_K_S/M, Q6_K, Q8_0, F16
- **Mặc định đề xuất:** Q4_K_M (cân bằng chất lượng/kích thước tốt nhất)
- **Công cụ:** `llama.cpp`, `ollama`, `LM Studio`
- **Điểm mạnh:** File tự chứa, độ chính xác hỗn hợp, hệ sinh thái lớn
- **Điểm yếu:** Không tối ưu cho GPU (thiết kế cho CPU/Metal)

### SmoothQuant
- **Khi nào:** INT8 trên GPU, cần lượng tử hóa cả trọng số lẫn activation
- **Ý tưởng chính:** Chuyển khó khăn lượng tử hóa từ activation sang trọng số qua co giãn theo kênh
- **Công cụ:** `smoothquant`, `TensorRT-LLM`
- **Điểm mạnh:** Cho phép W8A8 (cả trọng số và activation ở INT8) để tăng tốc 2x
- **Điểm yếu:** Chỉ INT8, không mở rộng sang INT4

## Quality Validation Protocol

Sau lượng tử hóa, xác thực trước triển khai:

1. **Kiểm thử perplexity.** Tính trên WikiText-2 hoặc corpus miền của bạn. Chênh < 0.5 xuất sắc, 0.5-1.0 tốt, > 2.0 có vấn đề.

2. **Quét benchmark.** Chạy MMLU (tổng quát), GSM8K (toán), HumanEval (mã). Toán và mã nhạy nhất với mất độ chính xác.

3. **So đầu ra.** Sinh 100 phản hồi từ cả mô hình gốc và lượng tử hóa. Dùng LLM-as-judge tính tỷ lệ thắng. Mục tiêu: mô hình lượng tử hóa thắng hoặc hòa trên > 90% prompt.

4. **Đo độ trễ.** Đo token/giây ở batch 1 và batch mục tiêu. Xác minh tăng tốc xứng đáng chi phí chất lượng.

5. **Kiểm thử ngữ cảnh dài.** Nếu phục vụ ngữ cảnh dài (> 4K token), kiểm thử ở độ dài tối đa. Sai số lượng tử hóa KV cache tích lũy theo độ dài chuỗi.

## Memory Budget Calculator

```
Weight memory (GB) = parameters (B) * bits / 8 / 1.073741824
KV cache per token (MB) = 2 * num_layers * d_model * bits / 8 / 1048576
KV cache for context (GB) = kv_per_token * max_context_length / 1024
Activation memory (GB) ~ 1-4 GB (relatively constant, depends on batch size)
Total = weight_memory + kv_cache + activation_memory + overhead (10-20%)
```

Ví dụ cho Llama 3 70B ở INT4, ngữ cảnh 32K:
- Trọng số: 70B * 4 / 8 / 1.07 = 32.6 GB
- KV cache (FP16): 2 * 80 * 8192 * 16 / 8 / 1e9 * 32768 = ~40 GB
- KV cache (FP8): ~20 GB
- Tổng với KV FP8: ~55 GB (vừa một A100 80GB)

## Common Mistakes

| Sai lầm | Vì sao thất bại | Cách khắc phục |
|---------|-------------|-----|
| Lượng tử hóa lớp embedding sang INT4 | Lớp đầu khuếch đại sai số xuyên cả mô hình | Giữ embedding ở FP16 hoặc INT8 |
| Dùng hệ số theo tensor cho INT4 | Một hàng ngoại lệ phá độ chính xác mọi hàng | Dùng hệ số theo kênh hoặc nhóm |
| Không hiệu chuẩn GPTQ/AWQ | Hệ số tỷ lệ sai nếu không có dữ liệu đại diện | Dùng 128 ví dụ từ miền của bạn |
| Cùng độ rộng bit cho mọi lớp | Lớp đầu/cuối nhạy hơn | Độ chính xác hỗn hợp: bit cao hơn cho đầu/cuối |
| Lượng tử hóa KV cache ở ngữ cảnh rất dài | Sai số tích lũy bậc hai theo độ dài chuỗi | Dùng FP8 cho KV cache, không INT4 |
| Bỏ xác thực chất lượng | Vài mô hình lượng tử hóa kém (đặc biệt ở ranh giới) | Luôn chạy perplexity + đánh giá tác vụ |

## Deployment Recipes

### Recipe 1: vLLM with AWQ (GPU server)
```
pip install vllm
vllm serve model-awq --quantization awq --dtype half --max-model-len 8192
```

### Recipe 2: llama.cpp with GGUF (MacBook)
```
./llama-server -m model.Q4_K_M.gguf -c 4096 -ngl 99
```

### Recipe 3: TensorRT-LLM with FP8 (H100)
```
trtllm-build --model_dir model --output_dir engine --dtype float16 --use_fp8
```
