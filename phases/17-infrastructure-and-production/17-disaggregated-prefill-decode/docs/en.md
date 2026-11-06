# Disaggregated Prefill/Decode — NVIDIA Dynamo and llm-d

> Prefill bị giới hạn bởi tính toán; decode bị giới hạn bởi bộ nhớ. Chạy cả hai trên cùng GPU lãng phí một tài nguyên. Tách rời chia chúng sang các bể riêng và chuyển bộ nhớ đệm KV giữa chúng qua NIXL (RDMA/InfiniBand hoặc dự phòng TCP). NVIDIA Dynamo (công bố tại GTC 2025, 1.0 GA) nằm trên vLLM/SGLang/TRT-LLM — Planner Profiler + SLA Planner của nó tự khớp tốc độ tỷ lệ prefill:decode để đáp ứng SLO. NVIDIA công bố mức tăng thông lượng trong khoảng này — developer.nvidia.com (2025-06) cho thấy cải thiện ~6x cho DeepSeek-R1 MoE trên GB200 NVL72 + Dynamo ở chế độ độ trễ trung bình, và trang sản phẩm Dynamo (developer.nvidia.com, không ghi ngày) quảng cáo thông lượng MoE tới 50x trên GB300 NVL72 + Dynamo so với Hopper. Con số "30x" là tổng hợp cộng đồng từ các báo cáo toàn ngăn xếp Blackwell + Dynamo + DeepSeek-R1; chúng tôi chưa tìm thấy một nguồn sơ cấp duy nhất nêu chính xác 30x, vì vậy xem nó như một khẳng định định hướng. llm-d (Red Hat + AWS) nguyên bản Kubernetes: prefill / decode / bộ định tuyến dưới dạng các Service độc lập với HPA theo vai trò. llm-d 0.5 thêm chuyển tải KV phân cấp, định tuyến LoRA nhận biết bộ nhớ đệm, mạng UCCL, giảm quy mô về không. Tính kinh tế: tổng hợp nội bộ từ nhiều công bố của khách hàng gợi ý tiết kiệm 30–40% trên chi tiêu suy luận cỡ $2M (tức $600-800K/năm) khi chuyển từ phục vụ đồng vị trí sang tách rời với Dynamo ở SLA không đổi; con số cụ thể $2M→$600-800K là tổng hợp nội bộ, không phải một nghiên cứu tình huống được công bố duy nhất — dùng nó làm mốc bậc độ lớn, không phải trích dẫn tham khảo. Prompt ngắn (<512 token, đầu ra ngắn) không đáng với chi phí truyền.

**Type:** Learn
**Languages:** Python (stdlib, toy disaggregated-vs-colocated simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 17 · 08 (Inference Metrics)
**Time:** ~75 minutes

## Learning Objectives

- Giải thích tại sao prefill và decode có phân bổ GPU tối ưu khác nhau và định lượng lãng phí khi đồng vị trí.
- Vẽ sơ đồ kiến trúc tách rời: bể prefill, bể decode, truyền KV qua NIXL, bộ định tuyến.
- Nêu điều kiện khi tách rời KHÔNG mang lại lợi ích (prompt ngắn, đầu ra ngắn).
- Phân biệt NVIDIA Dynamo (ngăn xếp bên trên) với llm-d (nguyên bản Kubernetes) và ghép mỗi bên với một bối cảnh vận hành.

## The Problem

Bạn chạy Llama 3.3 70B trên 8 H100. Dưới khối lượng công việc hỗn hợp (prompt dài + đầu ra ngắn), GPU nhàn rỗi trong decode vì phần lớn tính toán đã dành cho prefill. Dưới khối lượng công việc khác (prompt ngắn + đầu ra dài), điều ngược lại xảy ra. Prefill + decode đồng vị trí nghĩa là bạn cấp phát dư cả hai.

Tác động ngân sách: 20-40% thời gian GPU bị lãng phí cho sai tài nguyên. Bạn đang mua tính toán H100 để chạy decode bị giới hạn bởi bộ nhớ, hoặc mua băng thông HBM H100 để chạy prefill bị giới hạn bởi tính toán. Cả hai đều là lãng phí đắt đỏ.

Tách rời chia prefill và decode sang các bể riêng được định cỡ cho nút thắt của từng bên. Bộ nhớ đệm KV truyền từ bể prefill sang bể decode qua kết nối băng thông cao.

## The Concept

### Why the bottlenecks differ

**Prefill** — chạy transformer trên toàn bộ prompt đầu vào trong một lượt truyền xuôi. Các phép nhân ma trận chiếm ưu thế; bị giới hạn bởi tính toán. H100 FP8 cho thông lượng hữu ích ~2000 TFLOPS. Hiệu quả lô tốt — một lượt truyền xuôi xử lý nhiều token.

**Decode** — sinh từng token một, đọc toàn bộ trọng số mỗi vòng lặp. Bị giới hạn bởi băng thông bộ nhớ. HBM3 cho ~3 TB/s. Hiệu quả lô chỉ tốt ở độ đồng thời cao — việc đọc trọng số được phân bổ trên cả lô.

Đặt chúng đồng vị trí: bạn mua GPU tối ưu cho cả hai. H100 tốt ở cả hai nhưng có cùng chi phí theo cách nào đi nữa. Ở quy mô lớn, bạn muốn bể prefill trên H100 / thiên về tính toán; bể decode trên H200 / thiên về bộ nhớ, hoặc với lượng tử hóa mạnh.

### The architecture

```
            ┌──────────────┐
  Request → │    Router    │ ───────────────────────┐
            └──────┬───────┘                        │
                   │                                │
                   ▼ (prompt only)                  │
            ┌──────────────┐    KV cache    ┌───────▼──────┐
            │ Prefill pool │ ─── NIXL ────► │ Decode pool  │
            │  (compute)   │                │  (memory)    │
            └──────────────┘                └──────┬───────┘
                                                   │ tokens
                                                   ▼
                                                 Client
```

NIXL là phương thức truyền liên nút của NVIDIA. Dùng RDMA/InfiniBand khi khả dụng, nếu không dự phòng TCP. Độ trễ truyền là có thật — thường 20-80 ms cho bộ nhớ đệm KV của một prompt 4K token trên 70B FP8. Đây là lý do prompt ngắn không đáng tách rời: chi phí truyền vượt mức tiết kiệm.

### Dynamo vs llm-d

**NVIDIA Dynamo** (công bố tại GTC 2025, 1.0 GA):
- Nằm trên vLLM, SGLang, TRT-LLM như một bộ điều phối.
- Planner Profiler đo khối lượng công việc, SLA Planner tự cấu hình tỷ lệ prefill:decode.
- Lõi Rust, khả năng mở rộng Python.
- Tăng thông lượng: NVIDIA báo cáo 6x cho DeepSeek-R1 MoE trên GB200 NVL72 + Dynamo ở chế độ độ trễ trung bình (developer.nvidia.com, 2025-06); báo cáo cộng đồng "tới 30x" trên toàn ngăn xếp Blackwell + Dynamo + DeepSeek-R1 thiếu một nguồn sơ cấp duy nhất và nên được xem là định hướng.
- GB300 NVL72 + Dynamo: thông lượng MoE tới 50x so với Hopper theo trang sản phẩm Dynamo (developer.nvidia.com, không ghi ngày).

**llm-d** (Red Hat + AWS, nguyên bản Kubernetes):
- Prefill / decode / bộ định tuyến dưới dạng các Service Kubernetes độc lập.
- HPA theo vai trò với tín hiệu độ sâu hàng đợi (prefill) / mức sử dụng KV (decode).
- `topologyConstraint packDomain: rack` xếp các nhóm kết nối đầy đủ prefill+decode trên cùng rack để truyền KV băng thông cao.
- llm-d 0.5 (2026): chuyển tải KV phân cấp, định tuyến LoRA nhận biết bộ nhớ đệm, mạng UCCL, giảm quy mô về không.

Dùng Dynamo nếu bạn muốn một bộ điều phối ngăn xếp bên trên được quản lý. Dùng llm-d nếu bạn muốn các thành phần cơ bản nguyên bản Kubernetes và cam kết với hệ sinh thái CNCF.

### Economics

Tổng hợp nội bộ (không phải một nghiên cứu tình huống được công bố duy nhất — mốc bậc độ lớn):

- Chi tiêu suy luận $2M/năm trên phục vụ đồng vị trí.
- Chuyển sang tách rời với Dynamo.
- Cùng lượng yêu cầu, cùng SLA độ trễ P99.
- Tiết kiệm được báo cáo: $600K–$800K/năm (giảm 30–40%).
- Không phần cứng mới.

Chúng tôi tổng hợp con số này từ nhiều công bố của khách hàng thay vì một nghiên cứu tình huống có thể trích dẫn duy nhất; điểm dữ liệu được công bố gần nhất là TTFT nhanh hơn 2x / thông lượng cao hơn 61% của Baseten với định tuyến KV Dynamo (baseten.co, 2025-10), và dự đoán của VAST + CoreWeave về nhiều hơn 60–130% token/$ ở tỷ lệ trúng KV 40–60% (vastdata.com, 2025-12). Tiết kiệm đến từ định cỡ đúng từng bể; khối lượng công việc nặng prefill (RAG với tiền tố 8K+) hưởng lợi nhiều hơn loại cân bằng.

### When NOT to disaggregate

- Prompt < 512 token và đầu ra < 200 token: chi phí truyền lấn át lợi ích.
- Cụm nhỏ (< 4 GPU): không đủ độ đa dạng bể.
- Nhóm không thể vận hành hai bể GPU với mở rộng quy mô theo vai trò: Dynamo giúp nhưng không đơn giản.
- Không có hạ tầng kết nối RDMA: chi phí truyền TCP nặng hơn.

### The router integrates with Phase 17 · 11

Các bộ định tuyến tách rời nhận biết bộ nhớ đệm KV (Giai đoạn 17 · 11). Một yêu cầu đến bể decode giữ tiền tố của nó — nếu không khớp, nó đi theo luồng prefill → decode. Tỷ lệ trúng và tách rời cộng hưởng — bộ định tuyến nhận biết bộ nhớ đệm quyết định liệu có cần prefill mới hay không.

### MoE on Blackwell is where the real numbers are

GB300 NVL72 + Dynamo cho thấy thông lượng MoE 50x so với đường cơ sở Hopper. Định tuyến chuyên gia MoE nặng tính toán ở prefill nhưng nặng bộ nhớ ở decode (bộ nhớ đệm chuyên gia), nên tách rời là lợi ích kép. Phục vụ mô hình tiên tiến hàng đầu năm 2026 bị MoE chi phối (DeepSeek-V3, các biến thể GPT-5 tương lai).

### Numbers you should remember

Số liệu đo chuẩn thay đổi — NVIDIA và ngăn xếp suy luận đăng kết quả cập nhật mỗi quý. Kiểm tra lại trước khi trích dẫn.

- DeepSeek-R1 trên GB200 NVL72 + Dynamo: thông lượng ~6x so với đường cơ sở ở chế độ độ trễ trung bình (developer.nvidia.com, 2025-06); khẳng định cộng đồng "tới 30x" trên toàn ngăn xếp Blackwell + Dynamo là các tổng hợp định hướng không có một nguồn sơ cấp duy nhất.
- GB300 NVL72 + Dynamo: thông lượng MoE tới 50x so với Hopper (developer.nvidia.com, không ghi ngày).
- Mốc tiết kiệm (tổng hợp nội bộ, không phải một nghiên cứu tình huống duy nhất): bớt $600-800K/năm từ chi tiêu hằng năm $2M ở SLA không đổi.
- Ngưỡng tách rời: prompt >512 token + đầu ra >200 token.
- Truyền KV qua NIXL: 20-80 ms cho KV của prompt 4K trên 70B FP8.

```figure
prefill-decode-split
```

## Use It

`code/main.py` mô phỏng phục vụ đồng vị trí so với tách rời. Báo cáo thông lượng, chi phí mỗi yêu cầu và điểm giao độ dài prompt.

## Ship It

Bài học này tạo ra `outputs/skill-disaggregation-decider.md`. Với khối lượng công việc và cụm, quyết định có tách rời hay không.

## Exercises

1. Chạy `code/main.py`. Ở độ dài prompt nào tách rời vượt đồng vị trí?
2. Thiết kế bể prefill và bể decode cho một dịch vụ RAG có độ dài tiền tố P99 8K, đầu ra 300.
3. Dynamo so với llm-d: chọn một cho một tổ chức thuần Kubernetes không có ưu tiên runtime Python.
4. Tính chi phí truyền KV: prefill 4K trên 70B FP8 = ~500 MB KV. Ở RDMA 100 GB/s, truyền = 5 ms. Ở TCP 10 GB/s = 50 ms. Điều nào quan trọng với SLA của bạn?
5. Định tuyến chuyên gia MoE thay đổi mẫu truy cập KV. Tách rời hoạt động ra sao với MoE kích hoạt các chuyên gia khác nhau theo token?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Disaggregated serving (Phục vụ tách rời) | "tách prefill/decode" | Các bể GPU riêng cho từng giai đoạn |
| NIXL | "truyền tải NVIDIA" | Truyền KV liên nút của Dynamo (RDMA/TCP) |
| NVIDIA Dynamo | "bộ điều phối" | Bộ điều phối ngăn xếp bên trên cho vLLM/SGLang/TRT-LLM |
| llm-d | "nguyên bản Kubernetes" | Ngăn xếp tách rời K8s của Red Hat + AWS |
| Planner Profiler | "tự cấu hình Dynamo" | Đo khối lượng công việc, cấu hình tỷ lệ bể |
| SLA Planner | "chính sách Dynamo" | Tự khớp tốc độ prefill:decode để đáp ứng SLO |
| `packDomain: rack` | "cấu trúc liên kết llm-d" | Xếp prefill+decode trên cùng rack cho KV nhanh |
| UCCL | "collective hợp nhất" | Lớp mạng llm-d 0.5 cho giảm quy mô về không |
| MoE expert routing (Định tuyến chuyên gia MoE) | "chuyên gia theo token" | Mẫu DeepSeek-V3; tách rời giúp ích |

## Further Reading

- [NVIDIA — Introducing Dynamo](https://developer.nvidia.com/blog/introducing-nvidia-dynamo-a-low-latency-distributed-inference-framework-for-scaling-reasoning-ai-models/)
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/)
- [TensorRT-LLM Disaggregated Serving blog](https://nvidia.github.io/TensorRT-LLM/blogs/tech_blog/blog5_Disaggregated_Serving_in_TensorRT-LLM.html)
- [llm-d GitHub](https://github.com/llm-d/llm-d)
- [llm-d 0.5 release notes](https://github.com/llm-d/llm-d/releases)
