---
name: quantization-picker
description: Pick a 2026 quantization format given hardware, engine, workload, and quality tolerance, and produce a calibration + validation plan.
version: 1.0.0
phase: 17
lesson: 09
tags: [quantization, awq, gptq, gguf, fp8, nvfp4, calibration]
---

Với phần cứng (CPU / H100 / H200 / B200 / GB200, kèm số lượng), engine (llama.cpp / vLLM / TRT-LLM / SGLang), mô hình (kích thước + loại tác vụ — trò chuyện thường lệ / suy luận / mã / nhiều LoRA), và dung sai chất lượng (có thể chịu giảm N điểm trên HumanEval / MATH / MMLU), chọn một định dạng lượng tử hóa và tạo một kế hoạch xác thực.

Tạo ra:

1. Khuyến nghị định dạng. Một trong: GGUF Q4_K_M, GGUF Q5_K_M, GPTQ-Int4 + Marlin, AWQ-Int4 + Marlin, FP8, NVFP4 + KV FP8, hoặc một tổ hợp xếp chồng. Giải thích bằng cây quyết định: CPU → GGUF; suy luận → FP8; nhiều LoRA trên vLLM → GPTQ; trò chuyện GPU thường lệ → AWQ; Blackwell đã xác thực → NVFP4.
2. Ngân sách bộ nhớ. Báo cáo trọng số + bộ nhớ đệm KV (ở mức đồng thời × ngữ cảnh được báo cáo) + các kích hoạt. Xác nhận vừa trên GPU đích hoặc chỉ ra yêu cầu nhiều GPU.
3. Kế hoạch hiệu chuẩn. Nguồn tập dữ liệu (khớp lĩnh vực cho AWQ/GPTQ; C4/WikiText tổng quát như phương án cuối). Số mẫu (500-2000 cho lĩnh vực). Tập xác thực (10% giữ riêng khỏi bể hiệu chuẩn).
4. Kế hoạch xác thực. Tập đánh giá khớp tác vụ: HumanEval cho mã, MATH/MMLU cho suy luận, MT-Bench cho trò chuyện. Đường cơ sở BF16 so với lượng tử hóa. Đưa ra sử dụng nếu mức giảm ≤ dung sai chất lượng.
5. Quyết định bộ nhớ đệm KV. Tách khỏi lượng tử hóa trọng số. Đề xuất KV FP8 cho suy luận; KV BF16 nếu độ chính xác attention sát biên; KV INT8 chỉ sau xác thực.
6. Đường hoàn tác. Giữ các trọng số BF16/FP8 trên đĩa; cờ để chuyển lại nếu chất lượng sản xuất suy giảm.

Các trường hợp loại bỏ dứt khoát:
- Khuyến nghị các trọng số NVFP4 trên các khối lượng công việc nhiều suy luận không có xác thực tập đánh giá.
- Hiệu chuẩn trên dữ liệu web tổng quát cho các mô hình lĩnh vực. Luôn dùng trong lĩnh vực.
- Quên bộ nhớ đệm KV trong ngân sách HBM. Luôn liệt kê từng khoản.
- Tuyên bố các con số thông lượng không nêu các kernel (Marlin-AWQ so với AWQ thuần là 10x).

Các quy tắc từ chối:
- Nếu khối lượng công việc vốn sát biên chất lượng (sinh sáng tạo mở, suy luận trường hợp biên), từ chối INT4 quyết liệt. Giữ FP8 hoặc BF16.
- Nếu engine là llama.cpp, từ chối bất kỳ định dạng nào ngoài GGUF. Khớp định dạng với engine là yêu cầu tối thiểu.
- Nếu người dùng không thể chạy một đánh giá 1,000 mẫu, từ chối. Không lượng tử hóa mù trong sản xuất.

Đầu ra: một lựa chọn lượng tử hóa một trang liệt kê định dạng được chọn, ngân sách HBM, kế hoạch hiệu chuẩn, kế hoạch xác thực, quyết định bộ nhớ đệm KV, và đường hoàn tác. Kết thúc bằng một đoạn “đo gì tiếp theo” nêu một trong chênh lệch tập đánh giá, áp lực bộ nhớ đệm KV dưới mức đồng thời đỉnh, hoặc thông lượng ở kích thước lô thực tùy rủi ro then chốt.
