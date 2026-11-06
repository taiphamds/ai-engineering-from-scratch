# Edge Inference — Apple Neural Engine, Qualcomm Hexagon, WebGPU/WebLLM, Jetson

> Ràng buộc cốt lõi ở biên là băng thông bộ nhớ, không phải tính toán. DRAM di động ở mức 50-90 GB/s; HBM3 trung tâm dữ liệu đạt 2-3 TB/s — chênh lệch 30-50x. Decode bị giới hạn bởi bộ nhớ nên chênh lệch này mang tính quyết định. Năm 2026, bức tranh phân thành bốn hướng. Neural Engine Apple M4/A18 đạt đỉnh 38 TOPS với bộ nhớ hợp nhất (không sao chép CPU↔NPU). Hexagon Qualcomm Snapdragon X Elite / 8 Gen 4 đạt 45 TOPS. WebGPU + WebLLM chạy Llama 3.1 8B (Q4) ở ~41 tok/s trên M3 Max (khoảng 70-80% so với nguyên bản); 17.6k sao GitHub, API tương thích OpenAI, độ bao phủ di động ~70-75%. NVIDIA Jetson Orin Nano Super (8GB) chứa vừa Llama 3.2 3B / Phi-3; AGX Orin chạy gpt-oss-20b qua vLLM ở ~40 tok/s; Jetson T4000 (JetPack 7.1) đạt 2x AGX Orin. TensorRT Edge-LLM hỗ trợ EAGLE-3, NVFP4, prefill chia đoạn — được Bosch, ThunderSoft, MediaTek trình diễn tại CES 2026.

**Type:** Learn
**Languages:** Python (stdlib, toy bandwidth-bound decode simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 17 · 09 (Production Quantization)
**Time:** ~60 minutes

## Learning Objectives

- Giải thích tại sao suy luận LLM di động bị giới hạn bởi băng thông bộ nhớ và tính toán là thứ yếu.
- Liệt kê bốn đích biên (Apple ANE, Qualcomm Hexagon, WebGPU/WebLLM, NVIDIA Jetson) và ghép mỗi đích với một trường hợp sử dụng.
- Nêu khoảng trống độ bao phủ WebGPU năm 2026 (Firefox Android đang bắt kịp) và việc có mặt trên Safari iOS 26.
- Chọn một định dạng lượng tử hóa cho mỗi đích (Core ML INT4 + FP16 cho ANE, QNN INT8/INT4 cho Hexagon, WebGPU Q4 cho trình duyệt, NVFP4 cho Jetson Thor).

## The Problem

Một khách hàng muốn chatbot trên thiết bị: ưu tiên giọng nói, riêng tư theo mặc định, hoạt động ngoại tuyến. Trên MacBook Pro M3 Max, Llama 3.1 8B Q4 chạy ở ~55 tok/s — ổn. Trên iPhone 16 Pro, cùng mô hình chạy ở 3 tok/s — không ổn. Trên Android tầm trung với Snapdragon 8 Gen 3, 7 tok/s. Trong trình duyệt qua WebGPU trên Chrome Android v121+, 4-8 tok/s tùy thiết bị.

Biến thiên thông lượng không phải vấn đề chuyển nền tảng. Nó là chênh lệch băng thông nhân với định dạng lượng tử hóa nhân với việc NPU có thể được truy cập từ không gian người dùng hay không. Suy luận ở biên năm 2026 là bốn vấn đề khác nhau với bốn giải pháp khác nhau.

## The Concept

### Bandwidth is the real ceiling

Decode đọc toàn bộ tập trọng số cho mỗi token. Một mô hình 7B ở Q4 là 3.5 GB. Đọc 3.5 GB ở 50 GB/s mất 70 ms — trần lý thuyết ~14 tok/s. Ở 90 GB/s (DRAM di động cao cấp), trần chuyển lên ~25 tok/s. Không lượng tính toán nào giúp được dưới con số này.

HBM3 trung tâm dữ liệu ở 3 TB/s xử lý cùng 3.5 GB trong 1.2 ms — trần là 830 tok/s. Cùng mô hình, cùng trọng số. Hệ thống con bộ nhớ khác nhau.

### Apple Neural Engine (M4 / A18)

- Tới 38 TOPS. Bộ nhớ hợp nhất (CPU và ANE chia sẻ cùng bể) — không có chi phí sao chép.
- Truy cập qua Core ML + các mô hình `.mlmodel` đã biên dịch, hoặc qua Metal Performance Shaders (MPS) thông qua PyTorch.
- Backend Metal của Llama.cpp dùng MPS, không trực tiếp dùng ANE; ANE nguyên bản yêu cầu chuyển đổi Core ML.
- Hướng thực tế tốt nhất cho ứng dụng iOS năm 2026: Core ML với trọng số INT4 + các kích hoạt FP16.

### Qualcomm Hexagon (Snapdragon X Elite / 8 Gen 4)

- Tới 45 TOPS. Tích hợp với CPU và GPU trong SoC nhưng miền bộ nhớ riêng.
- SDK QNN (Qualcomm Neural Network) và AI Hub cung cấp chuyển đổi từ PyTorch/ONNX.
- Mẫu chat, Llama 3.2, Phi-3 đều được cung cấp dưới dạng tạo tác hạng nhất trên AI Hub.

### Intel / AMD NPUs (Lunar Lake, Ryzen AI 300)

- 40-50 TOPS. Phần mềm tụt sau Apple/Qualcomm; OpenVINO đang cải thiện nhưng thuộc thị trường ngách.
- Tốt nhất cho ứng dụng copilot Windows ARM; nguyên bản trên máy tính để bàn AMD/Intel cho hướng ưu tiên cục bộ.

### WebGPU + WebLLM

- Chạy mô hình trong trình duyệt qua compute shader WebGPU; không cài đặt.
- Llama 3.1 8B Q4 ở ~41 tok/s trên M3 Max — khoảng 70-80% so với nguyên bản qua cùng backend.
- 17.6k sao GitHub trên WebLLM; API JS tương thích OpenAI; Apache 2.0.
- Độ bao phủ năm 2026: Chrome Android v121+, Safari iOS 26 GA, Firefox Android vẫn đang bắt kịp. Tổng độ bao phủ di động ~70-75%.

### NVIDIA Jetson family

- Orin Nano Super (8GB): chứa vừa Llama 3.2 3B, Phi-3 với tok/s tốt.
- AGX Orin: chạy gpt-oss-20b qua vLLM ở ~40 tok/s.
- Thor / T4000 (JetPack 7.1): hiệu năng 2x AGX Orin, hỗ trợ EAGLE-3 và NVFP4.
- TensorRT Edge-LLM (2026) hỗ trợ speculative decoding EAGLE-3, trọng số NVFP4, prefill chia đoạn — các tối ưu trung tâm dữ liệu được chuyển sang biên.

### Quantization choice per target

| Đích | Định dạng | Ghi chú |
|--------|--------|-------|
| Apple ANE | Trọng số INT4 + các kích hoạt FP16 | Đường chuyển đổi Core ML |
| Qualcomm Hexagon | QNN INT8 / INT4 | Các bộ chuyển đổi AI Hub |
| WebGPU / WebLLM | Q4 MLC (q4f16_1) | Dùng `mlc_llm convert_weight` + `.wasm` đã biên dịch; GGUF không được hỗ trợ |
| Jetson Orin Nano | Q4 GGUF hoặc TRT-LLM INT4 | Bị giới hạn bởi bộ nhớ |
| Jetson AGX / Thor | NVFP4 + FP8 KV | Đường Edge-LLM |

### The long-context trap on edge

Ngữ cảnh 128K của Llama 3.1 là một tính năng trung tâm dữ liệu. Trên điện thoại có RAM 8 GB, mô hình 4 GB + bộ nhớ đệm KV 2 GB cho 32K token + chi phí hệ điều hành = OOM. Các triển khai biên giữ ngữ cảnh ở 4K-8K trừ khi chấp nhận lượng tử hóa KV mạnh (Q4 KV).

### Voice is the killer app

Agent giọng nói nhạy với độ trễ (token đầu tiên < 500 ms). Suy luận cục bộ loại bỏ hoàn toàn độ trễ mạng. Kết hợp với chuyển giọng nói thành văn bản (các biến thể Whisper Turbo chạy ở biên) và suy luận ở biên trở thành vòng lặp giọng nói đạt chất lượng sản xuất.

### Numbers you should remember

- Apple M4 / A18 ANE: 38 TOPS.
- Qualcomm Hexagon SD X Elite: 45 TOPS.
- WebLLM M3 Max: ~41 tok/s trên Llama 3.1 8B Q4.
- AGX Orin: ~40 tok/s trên gpt-oss-20b qua vLLM.
- Chênh lệch băng thông trung tâm dữ liệu-biên: 30-50x.
- Độ bao phủ di động WebGPU: ~70-75% (Firefox Android tụt lại).

```figure
edge-bandwidth-pipe
```

## Use It

`code/main.py` tính các trần thông lượng decode lý thuyết từ phép tính giới hạn băng thông trên các đích biên. So sánh với các phép đo chuẩn quan sát được và chỉ ra nơi băng thông, không phải tính toán, là nút thắt.

## Ship It

Bài học này tạo ra `outputs/skill-edge-target-picker.md`. Với nền tảng (iOS/Android/trình duyệt/Jetson), mô hình và ngân sách độ trễ/bộ nhớ, chọn một định dạng lượng tử hóa và pipeline chuyển đổi.

## Exercises

1. Chạy `code/main.py`. Với một mô hình 7B ở Q4 trên Snapdragon 8 Gen 3 (băng thông ~77 GB/s), tính trần decode. So sánh với 6-8 tok/s quan sát được — runtime có hiệu quả không?
2. WebGPU trên Android yêu cầu Chrome v121+. Thiết kế phương án dự phòng cho trình duyệt cũ — phía máy chủ qua cùng API tương thích OpenAI.
3. Ứng dụng iOS của bạn cần truyền theo luồng với ngữ cảnh 4K. Tổ hợp mô hình/định dạng nào cho phép bạn ở dưới 4 GB bộ nhớ hoạt động trên iPhone 16?
4. Jetson AGX Orin chạy gpt-oss-20b ở 40 tok/s. Jetson Nano chỉ chứa vừa một mô hình 3B. Nếu sản phẩm của bạn nhắm cả hai, bạn hợp nhất ngăn xếp suy luận như thế nào?
5. Lập luận liệu "WebLLM đã sẵn sàng cho sản xuất năm 2026." Trích dẫn độ bao phủ, hiệu năng và khoảng trống Firefox Android.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| ANE | "neural engine Apple" | NPU trên thiết bị trong dòng M và dòng A; bộ nhớ hợp nhất |
| Hexagon | "NPU Qualcomm" | NPU Snapdragon; SDK QNN để truy cập |
| WebGPU | "GPU trình duyệt" | API GPU trình duyệt được W3C chuẩn hóa; Chrome/Safari 2026 |
| WebLLM | "runtime LLM trình duyệt" | Dự án MLC-LLM; Apache 2.0; JS tương thích OpenAI |
| Jetson | "biên NVIDIA" | Họ Orin Nano / AGX / Thor / T4000 |
| TRT Edge-LLM | "TensorRT biên" | Bản chuyển sang biên năm 2026 của TensorRT-LLM; EAGLE-3 + NVFP4 |
| Unified memory (Bộ nhớ hợp nhất) | "bể dùng chung" | CPU và NPU thấy cùng RAM; không có chi phí sao chép |
| Bandwidth-bound (Bị giới hạn bởi băng thông) | "giới hạn bộ nhớ" | Decode bị chi phối bởi byte/giây đọc trọng số |
| Core ML | "chuyển đổi Apple" | Framework Apple cho mô hình nguyên bản ANE |
| QNN | "ngăn xếp Qualcomm" | SDK Qualcomm Neural Network |

## Further Reading

- [On-Device LLMs State of the Union 2026](https://v-chandra.github.io/on-device-llms/) — bức tranh tổng thể và các phép đo chuẩn.
- [NVIDIA Jetson Edge AI](https://developer.nvidia.com/blog/getting-started-with-edge-ai-on-nvidia-jetson-llms-vlms-and-foundation-models-for-robotics/) — Orin / AGX / Thor.
- [NVIDIA TensorRT Edge-LLM](https://developer.nvidia.com/blog/accelerating-llm-and-vlm-inference-for-automotive-and-robotics-with-nvidia-tensorrt-edge-llm/) — thông báo bản chuyển sang biên năm 2026.
- [WebLLM (arXiv:2412.15803)](https://arxiv.org/html/2412.15803v2) — thiết kế và các phép đo chuẩn.
- [Apple Core ML](https://developer.apple.com/documentation/coreml) — chuyển đổi nguyên bản ANE.
- [Qualcomm AI Hub](https://aihub.qualcomm.com/) — các mô hình được chuyển đổi sẵn cho Hexagon.
