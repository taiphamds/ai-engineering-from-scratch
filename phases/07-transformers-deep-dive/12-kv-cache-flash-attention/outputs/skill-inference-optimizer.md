---
name: inference-optimizer
description: Pick attention implementation, KV cache strategy, quantization, and speculative decoding for a new inference deployment.
version: 1.0.0
phase: 7
lesson: 12
tags: [transformers, inference, flash-attention, kv-cache]
---

Với một triển khai suy luận (tên mô hình + tham số, phần cứng đích, độ đồng thời, độ dài ngữ cảnh tối đa, SLO độ trễ, mục tiêu thông lượng), xuất ra:

1. Ngăn xếp phục vụ. vLLM (mặc định production), SGLang (độ trễ mỗi token thấp nhất), TensorRT-LLM (tối ưu NVIDIA), llama.cpp (biên/CPU), MLX (Apple silicon). Lý do trong một câu.
2. Triển khai attention. Flash Attention 2 (mặc định Ampere/Ada), Flash Attention 3 (Hopper), Flash Attention 4 (Blackwell, chỉ truyền xuôi). Chỉ định dự phòng.
3. KV cache. Dtype (mặc định fp16, fp8 nếu được hỗ trợ), phân trang so với liên tục, bật/tắt lưu đệm tiền tố, KV dùng chung cho lấy mẫu song song.
4. Lượng tử hóa. fp16 / bf16 (mặc định), int8 (chỉ trọng số), AWQ / GPTQ / GGUF cho trọng số. Chỉ lượng tử hóa kích hoạt nếu đã benchmark.
5. Các tăng tốc bổ sung. Giải mã suy đoán (EAGLE 2 / Medusa / mô hình nháp), batching liên tục (luôn bật), prefill chia khối (các khối lượng công việc prompt dài), lưu đệm tiền tố nếu các prompt lặp lại.

Từ chối triển khai Flash Attention 4 cho huấn luyện — nó chỉ truyền xuôi khi ra mắt. Từ chối khuyến nghị KV cache fp8 mà không benchmark tác động chất lượng lên tác vụ đích. Đánh dấu bất kỳ mô hình 70B+ nào không GQA là có KV cache không thể quản lý tại ngữ cảnh 32K+. Yêu cầu bật lưu đệm tiền tố cho bất kỳ triển khai tác tử/gọi công cụ nào có các system prompt lặp lại.
