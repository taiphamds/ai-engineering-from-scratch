---
name: edge-target-picker
description: Pick an edge inference target (Apple ANE, Qualcomm Hexagon, WebGPU/WebLLM, NVIDIA Jetson) and matching quantization format given device, model, and latency budget.
version: 1.0.0
phase: 17
lesson: 12
tags: [edge, ane, hexagon, webgpu, webllm, jetson, core-ml, qnn, nvfp4]
---

Với nền tảng triển khai (iOS, Android, trình duyệt, robot/ô tô/máy chủ biên), mô hình và ngân sách độ trễ/bộ nhớ, tạo một khuyến nghị đích biên.

Tạo:

1. Đích. Nêu NPU/GPU cụ thể (ANE, Hexagon, WebGPU, Jetson Orin Nano / AGX / Thor). Giải thích bằng nền tảng và độ bao phủ runtime năm 2026.
2. Trần băng thông. Tính trần decode lý thuyết: bandwidth_GB_s / model_size_GB. So sánh với yêu cầu tok/s của người dùng. Nếu trần thấp hơn yêu cầu, từ chối hoặc đề xuất mô hình nhỏ hơn / lượng tử hóa chặt hơn.
3. Định dạng lượng tử hóa. Chọn Q4 GGUF (trình duyệt/CPU biên), Core ML INT4 + FP16 (ANE), QNN INT8/INT4 (Hexagon), hoặc NVFP4 + FP8 KV (Jetson Thor / Edge-LLM).
4. Pipeline chuyển đổi. Nêu chính xác bộ chuyển đổi (bộ chuyển đổi Core ML, Qualcomm AI Hub, MLC-LLM cho WebLLM, trình biên dịch TensorRT-LLM Edge).
5. Ngân sách ngữ cảnh. Nêu ngữ cảnh tối đa chứa vừa cùng trọng số trong RAM thiết bị. Với trường hợp sử dụng ngữ cảnh dài, chỉ định lượng tử hóa KV (Q4 KV) hoặc từ chối.
6. Dự phòng. Khi thiết bị không đủ khả năng hoặc WebGPU không khả dụng (Firefox Android, trình duyệt cũ), chỉ định phương án API dự phòng phía máy chủ với cùng giao diện tương thích OpenAI.

Các trường hợp loại bỏ dứt khoát:
- Hứa hẹn tok/s cao hơn trần băng thông. Từ chối — vật lý.
- Nhắm trực tiếp ANE qua một runtime không phải Core ML năm 2026. Chỉ Core ML cung cấp truy cập ANE nguyên bản.
- Giả định WebGPU có trên mọi trình duyệt. Độ bao phủ năm 2026 là ~70-75% di động; luôn chỉ định phương án dự phòng.

Quy tắc từ chối:
- Nếu mô hình >6 GB và đích là điện thoại (RAM 4-8 GB), từ chối — đề xuất mô hình nhỏ hơn hoặc lượng tử hóa mạnh trước.
- Nếu yêu cầu là ngữ cảnh 128K trên một mô hình 7B trên iPhone, từ chối — RAM thiết bị không thể chứa vừa nếu không có Q4 KV cộng attention cửa sổ trượt.
- Nếu triển khai yêu cầu truyền theo luồng ngữ cảnh dài trên Android qua WebGPU và người dùng yêu cầu hỗ trợ Firefox, từ chối và yêu cầu Chrome hoặc dự phòng máy chủ.

Đầu ra: một kế hoạch một trang nêu đích, trần, lượng tử hóa, bộ chuyển đổi, ngân sách ngữ cảnh, dự phòng. Kết thúc bằng một chỉ số duy nhất: tok/s quan sát được trên thiết bị trong trường hợp xấu nhất thuộc tập thiết bị mục tiêu.
