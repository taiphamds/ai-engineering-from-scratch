# Production Serving Stack — KV Offloading and Cache-Aware Routing

> Một ngăn xếp phục vụ sản xuất kết nối bộ định tuyến, engine và khả năng quan sát thành một triển khai Kubernetes — và xem bộ nhớ đệm KV như một tài nguyên có thể rời GPU. Chuyển tải KV lấy bộ nhớ đệm KV ra khỏi bộ nhớ GPU và tái sử dụng nó trên các truy vấn và engine (DRAM CPU, rồi đĩa/Ceph). Production-stack của vLLM là triển khai tham chiếu; LMCache là lớp chuyển tải. KV Offloading Connector vLLM 0.11.0 (tháng 1 năm 2026) làm việc này bất đồng bộ và có thể cắm vào qua Connector API (v0.9.0+). Đường chuyển tải thường được ẩn khỏi đường yêu cầu, dù trượt bộ nhớ đệm và đưa dữ liệu lên tầng cao hơn có thể thêm độ trễ đầu cuối. LMCache có giá trị ngay cả khi không có tiền tố chung — khi GPU hết chỗ KV, các yêu cầu bị tạm chiếm có thể được khôi phục từ CPU thay vì tính toán lại prefill. Các phép đo chuẩn được công bố trên 16x H100 (HBM 80GB) trên 4 a3-highgpu-4g: khi bộ nhớ đệm KV vượt HBM, cả chuyển tải CPU nguyên bản lẫn LMCache đều cải thiện đáng kể thông lượng; ở dung lượng KV thấp, mọi cấu hình khớp đường cơ sở với chi phí phụ nhỏ.

**Type:** Learn
**Languages:** Python (stdlib, toy KV-spill simulator)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals), Phase 17 · 06 (SGLang/RadixAttention)
**Time:** ~60 minutes

## Learning Objectives

- Vẽ sơ đồ các lớp production-stack vLLM: bộ định tuyến, engine, chuyển tải KV, khả năng quan sát.
- Giải thích KV Offloading Connector API (v0.9.0+) và cách đường bất đồng bộ 0.11.0 ẩn độ trễ chuyển tải.
- Định lượng khi nào DRAM CPU LMCache giúp ích (KV > HBM) so với thêm chi phí phụ (KV đủ nhỏ để chứa vừa HBM).
- Chọn giữa chuyển tải CPU vLLM nguyên bản và connector LMCache với các ràng buộc triển khai.

## The Problem

Phục vụ vLLM của bạn cho thấy GPU ở 100% HBM với các sự kiện tạm chiếm mỗi khi độ đồng thời tăng. Yêu cầu bị loại, xếp lại hàng và bạn prefill lại cùng prompt 2K token bốn lần trong một phút. Tính toán GPU dành cho prefill dư thừa; goodput thấp hơn nhiều so với thông lượng thô.

Thêm GPU tốn chi phí tuyến tính. Thêm HBM không thể thực hiện. Nhưng DRAM CPU rẻ — một socket có 512 GB+ ở độ trễ tệ hơn HBM nhiều bậc độ lớn nhưng ổn cho bộ nhớ đệm KV "nóng tạm thời".

LMCache lấy bộ nhớ đệm KV sang DRAM CPU để các yêu cầu bị tạm chiếm khôi phục nhanh, và tiền tố lặp lại trên các engine chia sẻ bộ nhớ đệm mà không phải mỗi engine prefill lại.

## The Concept

### vLLM production-stack

`github.com/vllm-project/production-stack` là triển khai Kubernetes tham chiếu:

- **Bộ định tuyến** — nhận biết bộ nhớ đệm (Giai đoạn 17 · 11). Tiêu thụ sự kiện KV.
- **Engine** — các worker vLLM. Một cho mỗi GPU hoặc mỗi nhóm TP/PP.
- **Chuyển tải bộ nhớ đệm KV** — triển khai LMCache hoặc connector nguyên bản.
- **Khả năng quan sát** — thu thập Prometheus, bảng điều khiển Grafana, dấu vết OTel.
- **Mặt phẳng điều khiển** — khám phá dịch vụ, cấu hình, cập nhật cuốn chiếu.

Được cung cấp dưới dạng Helm chart + operator.

### The KV Offloading Connector API (v0.9.0+)

vLLM 0.9.0 giới thiệu Connector API cho các backend bộ nhớ đệm KV có thể cắm vào. Engine của bạn chuyển tải block sang connector; connector lưu chúng (RAM, đĩa, lưu trữ đối tượng, LMCache). Yêu cầu cần một block, connector nạp nó trở lại.

vLLM 0.11.0 (tháng 1 năm 2026) thêm đường chuyển tải bất đồng bộ — chuyển tải có thể diễn ra dưới nền để engine không bị chặn bởi nó trong trường hợp phổ biến. Độ trễ đầu cuối và thông lượng vẫn phụ thuộc dạng khối lượng công việc, tỷ lệ trúng bộ nhớ đệm KV và áp lực hệ thống; ghi chú của chính vLLM chỉ ra chuyển tải bằng kernel tùy chỉnh có thể làm suy giảm thông lượng ở tỷ lệ trúng thấp và lập lịch bất đồng bộ có các vấn đề tương tác đã biết với speculative decoding.

### Native CPU offload vs LMCache

**Chuyển tải CPU vLLM nguyên bản**: cục bộ engine. Lưu block KV trong RAM máy chủ. Triển khai nhanh, không chặng mạng. Không xuyên engine.

**Connector LMCache**: quy mô cụm. Lưu block trong máy chủ LMCache dùng chung (DRAM CPU + tầng Ceph/S3). Block có thể được truy cập bởi bất kỳ engine nào. Đã công bố phép đo chuẩn 16x H100.

Chọn nguyên bản khi một engine có áp lực HBM. Chọn LMCache khi nhiều engine chia sẻ tiền tố (RAG với system prompt chung, đa tenant với mẫu dùng chung).

### Benchmark behavior

Thử nghiệm 16x H100 (HBM 80 GB) trải trên 4 a3-highgpu-4g:

- Dung lượng KV thấp (prompt ngắn, độ đồng thời thấp): mọi cấu hình khớp đường cơ sở, LMCache thêm chi phí phụ ~3-5%.
- Dung lượng vừa phải: LMCache bắt đầu giúp ích với tái sử dụng tiền tố xuyên engine.
- KV vượt HBM: chuyển tải CPU nguyên bản và LMCache đều cải thiện đáng kể thông lượng; LMCache tăng lớn hơn vì chia sẻ xuyên engine.

### When LMCache is decisive

- Phục vụ đa tenant nơi system prompt được chia sẻ giữa các tenant.
- RAG nơi các đoạn tài liệu lặp lại trên các truy vấn.
- Các biến thể tinh chỉnh (LoRA) trên cùng mô hình nền nơi tái sử dụng KV mô hình nền cắt công việc dư thừa.
- Khối lượng công việc tạm chiếm nhiều: khôi phục từ CPU rẻ hơn prefill lại.

### When NOT to enable

- Áp lực HBM nhỏ — bạn trả chi phí phụ mà không có lợi ích.
- Ngữ cảnh ngắn (<1K token) — thời gian truyền > prefill lại.
- Khối lượng công việc một tenant một prompt — không có tái sử dụng để tận dụng.

### Integration with disaggregated serving

Phục vụ tách rời Giai đoạn 17 · 17 + LMCache cộng hưởng: KV truyền từ bể prefill sang bể decode đến LMCache nếu không được dùng; các truy vấn tiếp theo lấy từ LMCache. Bộ định tuyến nhận biết bộ nhớ đệm Giai đoạn 17 · 11 có thể định tuyến đến engine có bộ nhớ đệm cục bộ HOẶC dùng chung qua LMCache khớp.

### Numbers you should remember

- vLLM 0.9.0: Connector API được phát hành.
- vLLM 0.11.0 (tháng 1 năm 2026): đường chuyển tải bất đồng bộ; tác động độ trễ đầu cuối phụ thuộc khối lượng công việc, tỷ lệ trúng KV và áp lực hệ thống (không phải bảo đảm tuyệt đối).
- Phép đo chuẩn 16x H100: LMCache giúp khi dung lượng KV vượt HBM.
- Áp lực HBM nhỏ: chi phí phụ 3-5% mà không có lợi ích.

```figure
zero-sharding
```

## Use It

`code/main.py` mô phỏng khối lượng công việc tạm chiếm nhiều có và không có LMCache. Báo cáo số lần prefill lại tránh được, mức tăng thông lượng và mức sử dụng HBM hòa vốn.

## Ship It

Bài học này tạo ra `outputs/skill-vllm-stack-decider.md`. Với dạng khối lượng công việc và triển khai vLLM, quyết định nguyên bản hay LMCache hay không dùng cả hai.

## Exercises

1. Chạy `code/main.py`. Ở mức sử dụng HBM nào LMCache bắt đầu mang lại lợi ích?
2. Một tenant chia sẻ system prompt 6K token trên 200 truy vấn/giờ. Tính tiết kiệm LMCache dự kiến cho mỗi tenant.
3. Máy chủ LMCache là một điểm lỗi đơn. Thiết kế chiến lược HA (bản sao, dự phòng về nguyên bản).
4. LMCache lưu vào Ceph trên đĩa quay. Với KV 4K token ở 70B FP8 (500 MB), thời gian đọc so với prefill lại là bao nhiêu?
5. Lập luận liệu đường bất đồng bộ vLLM 0.11.0 có "miễn phí" — chi phí phụ ẩn ở đâu?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| Production-stack | "triển khai tham chiếu" | Helm chart Kubernetes + operator của vLLM |
| Connector API | "giao diện backend KV" | Giao diện kho KV có thể cắm vào của vLLM 0.9.0+ |
| Native CPU offload (Chuyển tải CPU nguyên bản) | "tràn cục bộ engine" | Lưu KV trong RAM máy chủ của cùng engine |
| LMCache | "bộ nhớ đệm KV cụm" | Máy chủ bộ nhớ đệm KV xuyên engine trên DRAM CPU + đĩa |
| 0.11.0 async | "chuyển tải không chặn" | Chuyển tải ẩn phía sau luồng engine |
| Preemption (Tạm chiếm) | "loại bỏ để nhường chỗ" | Xáo chuyển bộ nhớ đệm KV khi HBM đầy |
| Prefix reuse (Tái sử dụng tiền tố) | "cùng system prompt" | Nhiều truy vấn chia sẻ phần đầu; trúng bộ nhớ đệm |
| Ceph tier (Tầng Ceph) | "tầng đĩa" | Lưu trữ bền vững dưới DRAM trong hệ phân cấp bộ nhớ đệm |

## Further Reading

- [vLLM Blog — KV Offloading Connector (Jan 2026)](https://blog.vllm.ai/2026/01/08/kv-offloading-connector.html)
- [vLLM Production Stack GitHub](https://github.com/vllm-project/production-stack) — Helm chart + operator.
- [LMCache for Enterprise-Scale LLM Inference (arXiv:2510.09665)](https://arxiv.org/html/2510.09665v2)
- [LMCache GitHub](https://github.com/LMCache/LMCache) — cách triển khai Connector.
- [vLLM 0.11.0 release notes](https://github.com/vllm-project/vllm/releases) — chi tiết đường bất đồng bộ.
