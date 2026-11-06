# Self-Hosted Serving Selection — Matching Engine to Hardware and Scale

> Lựa chọn engine là một hàm của phần cứng, quy mô và hệ sinh thái — không phải đọc bảng xếp hạng. Bốn engine chi phối suy luận tự lưu trữ năm 2026: llama.cpp, Ollama, vLLM, SGLang, với TGI theo sau trong chế độ bảo trì. **llama.cpp** nhanh nhất trên CPU — hỗ trợ mô hình rộng nhất, toàn quyền kiểm soát lượng tử hóa và phân luồng. **Ollama** là công cụ cài đặt một lệnh cho laptop phát triển, chậm hơn llama.cpp ~15-30% (Go + CGo + tuần tự hóa HTTP), chênh lệch thông lượng 3x dưới tải giống sản xuất. **TGI chuyển sang chế độ bảo trì ngày 11 tháng 12 năm 2025** — chỉ sửa lỗi, thông lượng thô chậm hơn vLLM ~10% nhưng trước đây dẫn đầu về khả năng quan sát và tích hợp hệ sinh thái HF. Trạng thái bảo trì đó khiến nó là lựa chọn dài hạn rủi ro — SGLang hoặc vLLM là mặc định an toàn hơn cho dự án mới. **vLLM** là mặc định sản xuất đa dụng — v0.15.1 (tháng 2 năm 2026) thêm PyTorch 2.10, RTX Blackwell SM120, tối ưu H200. **SGLang** là chuyên gia cho đa lượt có agent / nặng tiền tố — 400,000+ GPU trong sản xuất (xAI, LinkedIn, Cursor, Oracle, GCP, Azure, AWS). Ràng buộc phần cứng: ưu tiên CPU → llama.cpp. AMD / không phải NVIDIA → vLLM là hướng được hỗ trợ mạnh nhất (TRT-LLM bị khóa chặt vào NVIDIA). Mẫu pipeline năm 2026: phát triển = Ollama, staging = llama.cpp, sản xuất = vLLM hoặc SGLang. Các engine nhận định dạng trọng số khác nhau — GGUF cho họ llama.cpp, HF safetensors cho engine GPU — vì vậy chuyển đổi định dạng có thể nằm giữa các giai đoạn.

**Type:** Learn
**Languages:** Python (stdlib, engine-decision tree walker)
**Prerequisites:** All Phase 17 lessons covering engines (04, 06, 07, 09, 18)
**Time:** ~45 minutes

## Learning Objectives

- Chọn engine với phần cứng (CPU / AMD / NVIDIA Hopper / Blackwell), quy mô (1 người dùng / 100 / 10,000) và khối lượng công việc (trò chuyện tổng quát / agent / ngữ cảnh dài).
- Nêu trạng thái chế độ bảo trì TGI năm 2026 (ngày 11 tháng 12 năm 2025) và tại sao nó khiến dự án mới thiên về vLLM hoặc SGLang.
- Mô tả pipeline phát triển/staging/sản xuất, bao gồm nơi chuyển đổi định dạng GGUF sang safetensors nằm giữa các giai đoạn.
- Giải thích tại sao "ưu tiên CPU" chỉ đến llama.cpp và "AMD" loại TRT-LLM.

## The Problem

Nhóm của bạn bắt đầu một dự án LLM tự lưu trữ mới. Một kỹ sư nói Ollama, người khác nói vLLM, người thứ ba nói "TGI không phải dùng được ngay sao?" Cả ba đều đúng cho các bối cảnh khác nhau. Không ai đúng cho tất cả.

Năm 2026, cây lựa chọn quan trọng: phần cứng trước, quy mô thứ hai, khối lượng công việc thứ ba. Và một sự kiện cụ thể năm 2025 — TGI chuyển sang chế độ bảo trì ngày 11 tháng 12 — thay đổi mặc định cho dự án mới.

## The Concept

### The five engines

| Engine | Tốt nhất cho | Ghi chú |
|--------|----------|-------|
| **llama.cpp** | CPU / biên / phụ thuộc tối thiểu / hỗ trợ mô hình rộng nhất | Nhanh nhất trên CPU, toàn quyền kiểm soát |
| **Ollama** | Laptop phát triển, một người dùng, cài đặt một lệnh | Chậm hơn llama.cpp 15-30%; chênh lệch thông lượng sản xuất 3x |
| **TGI** | Hệ sinh thái HF, ngành chịu quản lý theo quy định | **Chế độ bảo trì ngày 11 tháng 12 năm 2025** |
| **vLLM** | Sản xuất đa dụng, 100+ người dùng | Mặc định sản xuất rộng rãi; v0.15.1 tháng 2 năm 2026 |
| **SGLang** | Đa lượt có agent, khối lượng công việc nặng tiền tố | 400,000+ GPU trong sản xuất |

### Hardware-first decision

**Ưu tiên CPU** → llama.cpp. Ollama cũng hoạt động nhưng chậm hơn. Không engine nào khác cạnh tranh được trên CPU.

**GPU AMD** → vLLM là hướng được hỗ trợ mạnh nhất (hỗ trợ AMD ROCm). SGLang cũng hoạt động. TRT-LLM bị khóa chặt vào NVIDIA, nên bị loại.

**NVIDIA Hopper (H100 / H200)** → vLLM hoặc SGLang hoặc TRT-LLM. Cả ba đều hàng đầu.

**NVIDIA Blackwell (B200 / GB200)** → TRT-LLM dẫn đầu thông lượng (Giai đoạn 17 · 07). vLLM và SGLang theo sát.

**Apple Silicon (dòng M)** → llama.cpp (Metal). Ollama bọc công cụ này.

### Scale-second decision

**1 người dùng / phát triển cục bộ** → Ollama. Một lệnh, token đầu tiên trong vài giây.

**10-100 người dùng / nhóm nhỏ** → vLLM một GPU.

**100-10k người dùng / sản xuất** → production-stack vLLM (Giai đoạn 17 · 18) hoặc SGLang.

**10k+ người dùng / doanh nghiệp** → production-stack vLLM + tách rời (Giai đoạn 17 · 17) + LMCache (Giai đoạn 17 · 18).

### Workload-third decision

**Trò chuyện tổng quát / Hỏi đáp** → vLLM thắng ở mặc định rộng rãi.

**Đa lượt có agent (công cụ, lập kế hoạch, bộ nhớ)** → RadixAttention của SGLang (Giai đoạn 17 · 06) chiếm ưu thế.

**RAG với tái sử dụng tiền tố nhiều** → SGLang.

**Sinh mã** → vLLM ổn; SGLang tốt hơn một chút về bộ nhớ đệm.

**Ngữ cảnh dài (128K+)** → vLLM + prefill chia đoạn; SGLang + KV theo tầng.

### The TGI maintenance trap

Hugging Face TGI chuyển sang chế độ bảo trì ngày 11 tháng 12 năm 2025 — từ nay chỉ sửa lỗi. Trước đây: khả năng quan sát hàng đầu, tích hợp hệ sinh thái HF tốt nhất trong nhóm (thẻ mô hình, công cụ an toàn), hơi sau vLLM về thông lượng thô.

Cho dự án mới năm 2026: mặc định tránh TGI. Triển khai TGI hiện có có thể tiếp tục nhưng cuối cùng nên chuyển đổi. SGLang và vLLM là các mặc định an toàn hơn.

### The pipeline pattern

Phát triển (Ollama) → staging (llama.cpp) → sản xuất (vLLM). Các engine nhận định dạng trọng số khác nhau — GGUF cho họ llama.cpp, HF safetensors cho engine GPU — vì vậy chuyển đổi định dạng có thể nằm giữa các giai đoạn. Kỹ sư lặp nhanh trên laptop; staging phản ánh lượng tử hóa sản xuất; sản xuất là đích phục vụ.

### Ollama caveat

Ollama tuyệt vời cho phát triển. Nó không tuyệt vời cho sản xuất dùng chung: tuần tự hóa HTTP Go thêm chi phí phụ, quản lý độ đồng thời đơn giản hơn vLLM, hỗ trợ OpenTelemetry tụt sau. Dùng Ollama nơi nó tỏa sáng — một người dùng, một lệnh — và chuyển sang vLLM cho dùng chung.

### Self-hosted vs managed is a separate decision

Giai đoạn 17 · 01 (hyperscaler được quản lý), · 02 (nền tảng suy luận) đề cập loại được quản lý. Bài học này giả định bạn đã quyết định tự lưu trữ. Lý do tự lưu trữ: lưu trú dữ liệu, tinh chỉnh tùy chỉnh, tổng chi phí sở hữu ở quy mô lớn, mô hình miền không có trên dịch vụ được lưu trữ.

### Numbers you should remember

- Chế độ bảo trì TGI: ngày 11 tháng 12 năm 2025.
- vLLM v0.15.1: tháng 2 năm 2026; PyTorch 2.10; hỗ trợ Blackwell SM120.
- Quy mô triển khai sản xuất SGLang: 400,000+ GPU.
- Chênh lệch thông lượng Ollama so với llama.cpp: chậm hơn 15-30%; 3x dưới tải sản xuất.

```figure
data-parallel
```

## Use It

`code/main.py` là bộ duyệt cây quyết định: với phần cứng + quy mô + khối lượng công việc, chọn một engine và giải thích tại sao.

## Ship It

Bài học này tạo ra `outputs/skill-engine-picker.md`. Với các ràng buộc, chọn một engine và viết kế hoạch chuyển đổi.

## Exercises

1. Chạy `code/main.py` với phần cứng / quy mô / khối lượng công việc của bạn. Đầu ra có khớp trực giác của bạn không?
2. Hạ tầng của bạn là 12 H100 và 8 MI300X AMD. Engine nào? Tại sao TRT-LLM không phải lựa chọn?
3. Một nhóm muốn dùng TGI năm 2026 vì "đó là thứ chúng tôi biết." Lập luận cho việc chuyển đổi.
4. Ollama phát triển sang vLLM sản xuất: điều gì thay đổi trong lượng tử hóa, cấu hình và khả năng quan sát?
5. Sản phẩm RAG có độ dài tiền tố P99 8K và tái sử dụng cao giữa các tenant. Chọn một engine và kết hợp nó với Giai đoạn 17 · 11 + 18.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| llama.cpp | "công cụ CPU" | Hỗ trợ mô hình rộng nhất, nhanh nhất trên CPU |
| Ollama | "công cụ laptop" | Cài đặt một lệnh, thông lượng cấp phát triển |
| TGI | "phục vụ của HF" | Chế độ bảo trì từ tháng 12 năm 2025 |
| vLLM | "mặc định" | Đường cơ sở sản xuất rộng rãi năm 2026 |
| SGLang | "công cụ có agent" | Nặng tiền tố, RadixAttention |
| TRT-LLM | "khóa chặt vào NVIDIA" | Dẫn đầu thông lượng Blackwell, chỉ NVIDIA |
| GGUF | "định dạng llama.cpp" | Các biến thể K-quant được gộp |
| Production-stack | "K8s vLLM" | Triển khai tham chiếu Giai đoạn 17 · 18 |
| Pipeline pattern (Mẫu pipeline) | "phát triển→staging→sản xuất" | Ollama → llama.cpp → vLLM; định dạng trọng số khác nhau theo engine |

## Further Reading

- [AI Made Tools — vLLM vs Ollama vs llama.cpp vs TGI 2026](https://www.aimadetools.com/blog/vllm-vs-ollama-vs-llamacpp-vs-tgi/)
- [Morph — llama.cpp vs Ollama 2026](https://www.morphllm.com/comparisons/llama-cpp-vs-ollama)
- [n1n.ai — Comprehensive LLM Inference Engine Comparison](https://explore.n1n.ai/blog/llm-inference-engine-comparison-vllm-tgi-tensorrt-sglang-2026-03-13)
- [PremAI — 10 Best vLLM Alternatives 2026](https://blog.premai.io/10-best-vllm-alternatives-for-llm-inference-in-production-2026/)
- [TGI maintenance announcement](https://github.com/huggingface/text-generation-inference) — ghi chú phát hành.
- [vLLM v0.15.1 release notes](https://github.com/vllm-project/vllm/releases)
