---
name: engine-picker
description: Pick a self-hosted LLM engine (llama.cpp, Ollama, TGI, vLLM, SGLang) given hardware, scale, and workload. Name 2026 TGI maintenance mode as a migration trigger.
version: 1.0.0
phase: 17
lesson: 28
tags: [self-hosted, vllm, sglang, llama-cpp, ollama, tgi, trt-llm, engine-selection]
---

Với phần cứng (CPU / Apple Silicon / AMD / NVIDIA Hopper / NVIDIA Blackwell), quy mô (một người dùng / nhóm nhỏ / sản xuất / doanh nghiệp) và khối lượng công việc (trò chuyện tổng quát / có agent / RAG / ngữ cảnh dài / mã), tạo một khuyến nghị engine.

Tạo:

1. Engine. Nêu engine cụ thể. Trích dẫn cây phần cứng trước, quy mô thứ hai, khối lượng công việc thứ ba.
2. Tại sao không chọn các phương án khác. Với mỗi engine thay thế, nêu tại sao nó không được chọn (chế độ bảo trì TGI, AMD loại TRT-LLM, Ollama chỉ cho phát triển).
3. Pipeline. Nếu sản xuất, nêu mẫu pipeline (phát triển Ollama → staging llama.cpp → sản xuất vLLM/SGLang) và xác nhận định dạng trọng số (GGUF hoặc HF) đi xuyên suốt.
4. Kết hợp sản xuất. Ở quy mô sản xuất, trỏ đến Giai đoạn 17 · 18 (production-stack), · 17 (tách rời), · 11 (bộ định tuyến nhận biết bộ nhớ đệm) cho việc kết hợp.
5. Chuyển đổi TGI. Nếu hiện đang dùng TGI, chỉ định kế hoạch và dòng thời gian chuyển đổi — không gấp nhưng nên bắt đầu trong vòng 6 tháng.
6. Điểm cần chú ý phần cứng. Chỉ rõ hai ràng buộc cứng: chỉ CPU → llama.cpp; AMD → không TRT-LLM.

Các trường hợp loại bỏ dứt khoát:
- Mặc định dự án mới dùng TGI năm 2026. Từ chối — chế độ bảo trì.
- Ollama cho sản xuất dùng chung ở >1 người dùng đồng thời. Từ chối — chênh lệch thông lượng.
- Đề xuất TRT-LLM mà không xác nhận chỉ NVIDIA. Từ chối — AMD / không phải NVIDIA là cản trở cứng.

Quy tắc từ chối:
- Nếu phần cứng hỗn hợp (một số AMD, một số NVIDIA), yêu cầu quyết định engine theo từng cụm; không ép một engine duy nhất.
- Nếu khối lượng công việc là "chưa biết/tổng quát" ở quy mô sản xuất, mặc định vLLM và lập kế hoạch đánh giá lại sau 3 tháng dữ liệu lưu lượng.
- Nếu nhóm muốn "nhanh nhất mỗi GPU khi không có Blackwell" và khăng khăng chỉ Hopper, xác nhận — TRT-LLM hoặc vLLM đều chấp nhận được.

Đầu ra: một khuyến nghị một trang với engine, phương án thay thế bị loại, pipeline, kết hợp sản xuất, định hướng chuyển đổi TGI. Kết thúc bằng rà soát hằng quý duy nhất: đánh giá lại lựa chọn engine khi dạng khối lượng công việc thay đổi đáng kể.
