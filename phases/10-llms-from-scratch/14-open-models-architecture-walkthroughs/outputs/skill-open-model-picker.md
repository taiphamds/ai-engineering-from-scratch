---
name: open-model-picker
description: Pick an open LLM family, quantization, and inference stack for a given deployment target.
version: 1.0.0
phase: 10
lesson: 14
tags: [open-models, llama, deepseek, mixtral, qwen, gemma, moe, gqa, mla, quantization]
---

Với đích triển khai (loại GPU, VRAM mỗi GPU, số GPU, ngữ cảnh mục tiêu, độ trễ p50/p99 mục tiêu, yêu cầu đồng thời đỉnh) và đặc điểm tác vụ (chat, mã, suy luận, truy xuất ngữ cảnh dài, dùng công cụ), đề xuất mô hình mở cộng bộ phục vụ với lý giải tường minh về mỗi nút trong sáu nút kiến trúc từ Bài 14.

Tạo:

1. Danh sách mô hình rút gọn. Ba ứng viên, mỗi cái có tổng tham số, tham số hoạt động (nhận biết MoE), cờ kiến trúc (norm / kích hoạt / vị trí / attention / MoE / ngữ cảnh), và một lý do lọt danh sách.
2. Kiểm tra ngân sách bộ nhớ. Với ứng viên đầu: bộ nhớ trọng số ở BF16 và lượng tử hóa đã chọn; KV cache ở ngữ cảnh mục tiêu cho batch mục tiêu; dư địa activation. Dừng đề xuất nếu trọng số + KV cache + activation vượt VRAM sẵn có.
3. Chọn lượng tử hóa. GPTQ-4bit, AWQ-4bit, FP8 hoặc BF16. Biện minh theo độ nhạy chính xác tác vụ (mã / toán / suy luận chịu tác động lượng tử hóa mạnh lớn hơn chat hoặc truy xuất).
4. Bộ suy luận. vLLM, TensorRT-LLM, SGLang hoặc llama.cpp. Biện minh theo: nhu cầu continuous batching, hỗ trợ speculative decoding, tương thích định dạng lượng tử hóa và cấu trúc một node so với nhiều node.
5. Kiểm tra hợp lý thông lượng. Ước lượng token/giây prefill và decode dựa băng thông bộ nhớ GPU (decode) và TFLOPs (prefill). Từ chối đề xuất nếu thông lượng decode dưới mức tối thiểu người dùng đồng thời của đích.
6. Dự phòng. Lựa chọn thứ hai nếu ứng viên đầu vượt ngân sách VRAM hoặc thông lượng. Luôn nêu một.

Từ chối dứt khoát:
- Mô hình dense trên 30B trên một GPU phổ thông 24GB mà không offload hoặc lượng tử hóa mạnh.
- Mô hình MoE trên bộ phục vụ không hỗ trợ song song expert.
- Ngữ cảnh dài (128k+) trên kiến trúc không GQA hoặc MLA (KV cache bùng nổ).
- Bất kỳ đề xuất nào không nêu bản sửa đổi mô hình cụ thể (ví dụ "Llama 3 8B Instruct v3.1", không phải "Llama 3").

Đầu ra: đề xuất một trang liệt kê mô hình, lượng tử hóa, bộ công cụ, với bằng chứng đánh số cho mỗi quyết định. Kết thúc bằng đoạn "đáng xem xét lại nếu..." nêu năng lực hoặc tham số triển khai cụ thể sẽ đổi lựa chọn.
