# Hardware-Specialized Inference Compilation — FP8 and NVFP4 on Blackwell

> Biên dịch suy luận chuyên biệt theo phần cứng đánh đổi tính di động lấy throughput, và TensorRT-LLM — chỉ NVIDIA, được tinh chỉnh cho Blackwell — là ví dụ rõ ràng nhất về sự đánh đổi mang lại kết quả. Trên GB200 NVL72 với điều phối Dynamo, SemiAnalysis InferenceX đo được $0.012 trên mỗi triệu token với một mô hình 120B trong Q1-Q2 2026, so với $0.09/M trên H100 + vLLM — khoảng cách kinh tế 7x. Ngăn xếp kết hợp hai định dạng dấu phẩy động với hai kỹ thuật phục vụ: FP8 vẫn thiết yếu cho KV cache và attention kernel vì nó có dải động mà chúng cần; NVFP4 (microscaling 4-bit) xử lý trọng số và activation; multi-token prediction (MTP) và prefill/decode tách rời bổ sung thêm 2-3x ở trên. Hỗ trợ mô hình ngày 0 tải trực tiếp trọng số FP4 mà không cần chuyển đổi sau huấn luyện. Điểm vướng với các nhóm kỹ thuật năm 2026: TRT-LLM là mã nguồn mở nhưng đặc thù NVIDIA — chuyên biệt CUDA và Blackwell — nên áp dụng nó đánh đổi tính di động lấy throughput. Tính toán trên tổ hợp mô hình và phần cứng của bạn trước khi cam kết.

**Type:** Learn
**Languages:** Python (stdlib, toy FP8/NVFP4 memory and cost calculator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 10 · 13 (Quantization)
**Time:** ~75 minutes

## Learning Objectives

- Giải thích vì sao FP8 vẫn trọng yếu cho bộ nhớ đệm KV và attention ngay cả khi các trọng số ở NVFP4.
- Tính dung lượng HBM chiếm dụng của một mô hình tiên tiến nhất dưới BF16, FP8, và NVFP4 và suy luận về nơi các tiết kiệm đến từ.
- Nêu các tính năng riêng Blackwell mà TRT-LLM khai thác (FP4 ngày 0, MTP, phục vụ tách rời, các nguyên thủy mọi bên với mọi bên).
- Quyết định khi nào khóa vào NVIDIA của TRT-LLM xứng đáng với khoảng cách chi phí 7x so với vLLM trên Hopper.

## The Problem

Tuyến đầu kinh tế suy luận năm 2026 là “bao nhiêu token mỗi đô la”. Câu trả lời phụ thuộc bốn lựa chọn xếp chồng: thế hệ phần cứng (Hopper H100/H200 so với Blackwell B200/GB200), độ chính xác (BF16 → FP8 → NVFP4), engine phục vụ (vLLM so với SGLang so với TRT-LLM), và điều phối (thuần so với tách rời so với Dynamo).

Trên Hopper với vLLM, một MoE 120B chạy ở ~$0.09 mỗi triệu token. Trên Blackwell với TRT-LLM + Dynamo, cùng mô hình chạy ở ~$0.012 — rẻ hơn 7x. Một phần khoảng cách là phần cứng (Blackwell có thông lượng LLM theo từng GPU bằng 11-15x so với Hopper). Một phần là ngăn xếp: các trọng số FP4, nháp MTP, prefill/decode tách rời, và NVLink 5 mọi bên với mọi bên cho giao tiếp chuyên gia MoE.

Bạn không thể tái tạo điều này ngoài ngăn xếp NVIDIA. Đó là đánh đổi — tính di động lấy kinh tế. Hiểu các lựa chọn ngăn xếp nào cho phần nào của khoảng cách là mục đích bài này.

## The Concept

### Why FP8 is still the floor for KV cache

Một sai lầm phổ biến năm 2026: giả định NVFP4 áp dụng mọi nơi. Không phải vậy. Bộ nhớ đệm KV cần FP8 (dấu phẩy động 8 bit) vì nó lưu các khóa và giá trị attention trải một dải động rộng. Lượng tử hóa KV xuống FP4 gây mất độ chính xác thảm họa — đuôi phân phối rơi mất và các điểm attention sụp đổ. Các bit số mũ của FP8 cho bộ nhớ đệm KV dải nó cần.

NVFP4 (2025-2026) áp dụng cho trọng số và các kích hoạt. Microscaling: mỗi block trọng số có hệ số thang đo riêng để các block nhỏ có thể trải các dải động khác nhau không có mất mát thang đo theo từng tensor. Với các kích hoạt, FP4 giữ được vì các kích hoạt có dải nhỏ trong một lớp.

Cấu hình Blackwell điển hình:

- Trọng số: NVFP4 (microscaling 4 bit).
- Các kích hoạt: NVFP4.
- Bộ nhớ đệm KV: FP8.
- Bộ tích lũy attention: FP32 (độ ổn định softmax).

### The Blackwell-specific primitives TRT-LLM uses

- **Các trọng số FP4 ngày 0**: các nhà cung cấp mô hình phát hành trực tiếp các trọng số FP4; TRT-LLM tải không cần chuyển đổi sau huấn luyện. Không có bước AWQ / GPTQ cho FP4.
- **Dự đoán nhiều token (MTP)**: cùng ý tưởng như EAGLE (Giai đoạn 17 · 05) nhưng tích hợp vào bản dựng TRT-LLM.
- **Phục vụ tách rời**: prefill và decode trên các bể GPU riêng, bộ nhớ đệm KV được chuyển qua NVLink hoặc InfiniBand. Cùng ý tưởng như Dynamo (Giai đoạn 17 · 20).
- **Các nguyên thủy giao tiếp mọi bên với mọi bên**: NVLink 5 cắt độ trễ giao tiếp chuyên gia MoE 3x so với Hopper. Các kernel MoE của TRT-LLM được điều chỉnh cho điều này.
- **Microscaling NVFP4 + MXFP8**: xử lý hệ số thang đo được tăng tốc phần cứng trên các Tensor Core Blackwell.

### The numbers you should memorize

- HGX B200 ở $0.02/M token trên GPT-OSS-120B qua TRT-LLM.
- GB200 NVL72 ở $0.012/M token qua Dynamo (điều phối TRT-LLM).
- H100 + vLLM ≈ $0.09/M token trên khối lượng công việc tương đương.
- Mức tăng thông lượng 2.8x trong ba tháng cập nhật TRT-LLM (2026).
- Thông lượng LLM theo từng GPU 11-15x, Blackwell so với Hopper.
- MLPerf Inference v6.0 (tháng 4 năm 2026): Blackwell thống trị mọi tác vụ được nộp.

### What FP4 actually costs in quality

NVFP4 quyết liệt. Trên các khối lượng công việc nhiều suy luận (chuỗi suy nghĩ, toán, sinh mã với ngữ cảnh dài), các trọng số FP4 suy giảm thấy rõ. Hiệu chuẩn theo từng block giảm thiểu nhưng không loại bỏ. Các nhóm đưa các mô hình suy luận ra sử dụng thường dùng các trọng số FP8 + các kích hoạt FP4 như thỏa hiệp, hoặc giữ H200 với FP8 xuyên suốt.

Quy tắc: luôn xác thực chất lượng tác vụ trên tập đánh giá của bạn trước khi cam kết các trọng số NVFP4.

### Why this is an NVIDIA-lock decision

TRT-LLM là C++ + CUDA + các kernel đóng nguồn. Các mô hình cần được biên dịch cho một SKU GPU cụ thể. Không AMD, không Intel, không ARM. Nếu chiến lược hạ tầng đa nhà cung cấp, TRT-LLM không khả thi cho tầng do TRT-LLM phục vụ — bạn vẫn có thể phục vụ từ vLLM trên phần cứng hỗn hợp. Nếu chỉ NVIDIA, khoảng cách 7x trả cho khóa chặt.

### 2026 practical recipe

Với hóa đơn suy luận hằng năm $100M+, chạy trên Hopper + vLLM bỏ lỡ 7-10x. Di chuyển các khối lượng công việc chi phối chi phí sang Blackwell + TRT-LLM + Dynamo. Giữ tầng thử nghiệm trên H100 + vLLM cho tốc độ lặp mô hình. Xác thực chất lượng trên mỗi mô hình chuyển đổi NVFP4 trước sản xuất.

### The disaggregation bonus

Phục vụ tách rời của TRT-LLM (các bể prefill và decode riêng) được trình bày sâu trong Giai đoạn 17 · 20. Trên Blackwell, hệ số nhân xếp chồng: các trọng số FP4 × tăng tốc MTP × bố trí tách rời × định tuyến nhận biết bộ nhớ đệm. Con số 7x giả định ngăn xếp đầy đủ này.

```figure
pipeline-parallel
```

## Use It

`code/main.py` tính dung lượng HBM chiếm dụng, thông lượng decode (chế độ bị giới hạn bởi bộ nhớ), và $/M-token cho một mô hình trên ba ngăn xếp: H100 + BF16 + vLLM, H100 + FP8 + vLLM, B200 + NVFP4/FP8 + TRT-LLM. Chạy nó để thấy hiệu ứng cộng dồn và phần khoảng cách mỗi thay đổi đóng góp.

## Ship It

Bài này tạo ra `outputs/skill-trtllm-blackwell-advisor.md`. Với một khối lượng công việc, kích thước mô hình, và khối lượng token hằng năm, nó quyết định liệu ngăn xếp Blackwell + TRT-LLM có xứng đáng với khóa vào NVIDIA.

## Exercises

1. Chạy `code/main.py`. Trên một MoE 120B với 30% tham số hoạt động, tính thông lượng decode bị giới hạn băng thông bộ nhớ trên H100 BF16, H100 FP8, và B200 NVFP4/FP8. Bước nhảy lớn nhất đến từ đâu?
2. Một khách hàng chi $2M/năm trên H100 + vLLM. Số GPU Blackwell hòa vốn họ cần mua để phân bổ chi phí di chuyển sang TRT-LLM trong 12 tháng là bao nhiêu, với khoảng cách kinh tế 7x?
3. Bạn thấy độ chính xác giảm 3 điểm trên MATH sau chuyển đổi trọng số NVFP4. Nêu hai đường phục hồi: một ưu tiên chất lượng (giữ các trọng số FP8), một ưu tiên chi phí (hiệu chuẩn bằng dữ liệu trong lĩnh vực).
4. Đọc các kết quả suy luận MLPerf v6.0. Tác vụ nào có khoảng cách Blackwell so với Hopper nhỏ nhất, và vì sao?
5. Tính HBM cần cho một mô hình 405B ở các trọng số NVFP4 + bộ nhớ đệm KV FP8 ở ngữ cảnh 128k. Nó có vừa trên một node GB200 NVL72 đơn lẻ không?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| FP8 | “dấu phẩy động tám bit” | Dấu phẩy động 8 bit; dùng cho bộ nhớ đệm KV và attention do dải động |
| NVFP4 | “micro bốn bit” | Định dạng FP microscaling 4 bit của NVIDIA; trọng số và các kích hoạt trên Blackwell |
| MXFP8 | “MX tám” | Biến thể FP8 microscaling; được tăng tốc phần cứng trên các Tensor Core Blackwell |
| Day-0 FP4 (FP4 ngày 0) | “phát hành các trọng số FP4” | Các nhà cung cấp mô hình phát hành trọng số đã ở FP4; không bước chuyển đổi sau huấn luyện |
| MTP | “dự đoán nhiều token” | Nháp giải mã suy đoán tích hợp của TRT-LLM (Giai đoạn 17 · 05) |
| Disaggregated serving (Phục vụ tách rời) | “tách prefill/decode” | Prefill và decode trên các bể GPU riêng; KV được chuyển qua NVLink/IB |
| All-to-all (Mọi bên với mọi bên) | “giao tiếp chuyên gia MoE” | Mẫu giao tiếp định tuyến các token tới các GPU chuyên gia; NVLink 5 cắt 3x |
| InferenceX | “benchmark suy luận SemiAnalysis” | Benchmark chi phí mỗi token được ngành chấp nhận năm 2026 |

## Further Reading

- [NVIDIA — Blackwell Ultra MLPerf Inference v6.0](https://developer.nvidia.com/blog/nvidia-blackwell-ultra-sets-new-inference-records-in-mlperf-debut/) — các kết quả MLPerf tháng 4 năm 2026.
- [NVIDIA — MoE Inference on Blackwell](https://developer.nvidia.com/blog/delivering-massive-performance-leaps-for-mixture-of-experts-inference-on-nvidia-blackwell/) — NVLink 5 mọi bên với mọi bên và các kernel MoE.
- [TensorRT-LLM Overview](https://nvidia.github.io/TensorRT-LLM/overview.html) — tài liệu engine chính thức.
- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/) — điều phối tách rời trên TRT-LLM.
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) — bộ benchmark công bố các con số Blackwell.
