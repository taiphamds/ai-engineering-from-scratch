# GPU Autoscaling on Kubernetes — Karpenter, KAI Scheduler, Gang Scheduling

> Ba lớp, không phải một. Karpenter cấp phát các node động (dưới một phút, nhanh hơn 40% so với Cluster Autoscaler). KAI Scheduler xử lý lập lịch theo nhóm, nhận biết cấu trúc liên kết, và các hàng đợi phân cấp — nó ngăn bẫy phân bổ một phần 7-trong-8 nơi bảy node chờ và đốt tiền vì một GPU thiếu. Các bộ tự động mở rộng cấp ứng dụng (NVIDIA Dynamo Planner, llm-d Workload Variant Autoscaler) mở rộng theo các tín hiệu riêng cho suy luận — độ sâu hàng đợi, mức sử dụng bộ nhớ đệm KV — không phải CPU/chu kỳ hoạt động DCGM. Bẫy HPA cổ điển là `DCGM_FI_DEV_GPU_UTIL` là một phép đo chu kỳ hoạt động: 100% có thể là 10 yêu cầu hoặc 100. vLLM cấp phát trước bộ nhớ đệm KV, nên bộ nhớ không bao giờ kích hoạt giảm quy mô. Bài này dạy bạn kết hợp ba lớp và tránh chính sách Karpenter mặc định `WhenEmptyOrUnderutilized` chấm dứt các công việc GPU đang chạy giữa suy luận.

**Type:** Learn
**Languages:** Python (stdlib, toy queue-depth autoscaler simulator)
**Prerequisites:** Phase 17 · 02 (Inference Platform Economics), Phase 17 · 04 (Serving Engine Internals)
**Time:** ~75 minutes

## Learning Objectives

- Vẽ sơ đồ ba lớp tự động mở rộng (cấp phát node, lập lịch theo nhóm, cấp ứng dụng) và nêu công cụ được dùng ở mỗi lớp.
- Giải thích vì sao `DCGM_FI_DEV_GPU_UTIL` là tín hiệu HPA sai cho vLLM và nêu hai thay thế (độ sâu hàng đợi, mức sử dụng bộ nhớ đệm KV).
- Mô tả lập lịch theo nhóm và chế độ lỗi phân bổ một phần mà KAI Scheduler ngăn (7 trong 8 GPU nhàn rỗi).
- Nêu chính sách hợp nhất Karpenter (`WhenEmptyOrUnderutilized`) chấm dứt các công việc GPU đang chạy và nêu lựa chọn an toàn năm 2026.

## The Problem

Nhóm của bạn phát hành một dịch vụ phục vụ LLM trên Kubernetes. Bạn thiết lập HPA với `DCGM_FI_DEV_GPU_UTIL` làm tín hiệu. Dịch vụ ghim ở mức sử dụng 100% trong giờ làm việc. HPA không bao giờ tăng quy mô — nó đã nghĩ bạn đầy. Bạn thêm một bản sao bằng tay; TTFT giảm. HPA vẫn không mở rộng. Tín hiệu đang nói dối bạn.

Riêng biệt, bạn sử dụng Cluster Autoscaler cho các node. Một prompt 1M token đến lúc 2 giờ sáng; cụm dành 3 phút cấp phát một node, và yêu cầu hết thời gian chờ.

Lại một trường hợp riêng khác, bạn triển khai một mô hình 70B cần 8 GPU trên 2 node. Cụm có 7 GPU trống, phân tán trên 3 node, và cần thêm 1. Cluster Autoscaler cấp phát một node cho 1 GPU còn thiếu. 7 GPU đã dành chỗ nằm nhàn rỗi trong 4 phút đốt tiền trong khi Kubernetes khởi động GPU cuối cùng.

Ba lớp, ba chế độ lỗi khác nhau. Tự động mở rộng nhận biết GPU năm 2026 không phải “bật HPA.” Nó là kết hợp cấp phát node, lập lịch theo nhóm, và tự động mở rộng theo tín hiệu ứng dụng.

## The Concept

### Layer 1 — node provisioning (Karpenter)

Karpenter theo dõi các pod đang chờ và cấp phát các node trong ~45-60 giây (Cluster Autoscaler thường mất 90-120 giây cho các node GPU). Nó chọn các loại instance động theo ràng buộc `NodePool` — nếu pod cần 8 H100 và cụm không có node khớp, Karpenter cấp phát trực tiếp một node thay vì mở rộng một nhóm hiện có.

**Bẫy hợp nhất**: `consolidationPolicy: WhenEmptyOrUnderutilized` mặc định của Karpenter nguy hiểm cho các bể GPU. Nó sẽ chấm dứt một node GPU đang chạy để di chuyển các pod tới một instance rẻ hơn có kích thước phù hợp. Với các khối lượng công việc suy luận, điều đó có nghĩa trục xuất các yêu cầu đang chạy và tải lại một mô hình 70B trên node mới. Tổn thất là nhiều phút dung lượng cộng các yêu cầu thất bại.

Thiết lập an toàn cho các bể GPU:

```yaml
disruption:
  consolidationPolicy: WhenEmpty
  consolidateAfter: 1h
```

Cho phép Karpenter hợp nhất các node thực sự trống sau một giờ nhưng không bao giờ trục xuất một công việc đang chạy.

### Layer 2 — gang scheduling (KAI Scheduler)

KAI Scheduler (dự án “Karp” rồi đổi tên) xử lý những gì kube-scheduler mặc định không làm:

**Lập lịch theo nhóm** — lập lịch tất cả hoặc không gì. Một pod suy luận phân tán cần 8 GPU hoặc cả 8 khởi động cùng nhau hoặc không cái nào khởi động. Không có điều này, bạn nhận bẫy phân bổ một phần: 7 trong 8 pod khởi động, chờ vô thời hạn, đốt tiền.

**Nhận biết cấu trúc liên kết** — biết các GPU nào chia sẻ NVLink, các GPU nào nằm trên cùng rack, các GPU nào có InfiniBand giữa chúng. Đặt các pod tương ứng. Một khối lượng công việc song song tensor DeepSeek-V3 67B phải ở trong một miền NVLink; KAI Scheduler tôn trọng điều đó.

**Các hàng đợi phân cấp** — nhiều nhóm cạnh tranh cùng bể GPU với ưu tiên và hạn ngạch. Nhu cầu sản xuất cấp bách của Nhóm A chỉ bị công việc huấn luyện của Nhóm B chiếm trước nếu các quy tắc ưu tiên cho phép.

KAI được triển khai cạnh kube-scheduler như một bộ lập lịch thứ cấp; bạn chú thích các khối lượng công việc để sử dụng nó. Ray và vLLM production-stack đều tích hợp.

### Layer 3 — application-level signals

**Bẫy HPA**: `DCGM_FI_DEV_GPU_UTIL` là một chỉ số chu kỳ hoạt động — nó đo liệu GPU có đang làm việc tại mỗi khoảng lấy mẫu không. Mức sử dụng 100% có thể có nghĩa 10 yêu cầu đồng thời hoặc 100; GPU bận trong cả hai trường hợp. Mở rộng theo chu kỳ hoạt động là mở rộng mù quáng.

Tệ hơn, vLLM và các engine tương tự cấp phát trước bộ nhớ đệm KV (tới `--gpu-memory-utilization`). Mức dùng bộ nhớ ở gần 90% ngay cả ở một yêu cầu. HPA dựa trên bộ nhớ không bao giờ giảm quy mô.

**Các tín hiệu thay thế năm 2026**:

- Độ sâu hàng đợi (số yêu cầu chờ prefill).
- Mức sử dụng bộ nhớ đệm KV (tỷ lệ các block được cấp phát cho các chuỗi hoạt động).
- P99 TTFT theo từng bản sao (tín hiệu SLA của bạn).
- Goodput (các yêu cầu đáp ứng mọi SLO mỗi giây).

NVIDIA Dynamo Planner và llm-d Workload Variant Autoscaler tiêu thụ các tín hiệu này và mở rộng các bản sao. Chúng thay HPA hoàn toàn cho phục vụ LLM.

### When to use what

| Quyết định mở rộng | Công cụ |
|----------------|------|
| Thêm/bỏ các node | Karpenter |
| Lập lịch các công việc nhiều GPU | KAI Scheduler |
| Thêm/bỏ các bản sao | Dynamo Planner / llm-d WVA (hoặc HPA tùy chỉnh trên độ sâu hàng đợi) |
| Chọn loại GPU | Karpenter NodePool |
| Chiếm trước ưu tiên thấp | Các hàng đợi KAI Scheduler |

### Disaggregated prefill/decode complicates everything

Nếu bạn chạy prefill/decode tách rời (Giai đoạn 17 · 17), bạn có hai lớp pod với các tác nhân kích hoạt mở rộng khác nhau: các pod prefill mở rộng theo độ sâu hàng đợi, các pod decode mở rộng theo áp lực bộ nhớ đệm KV. llm-d cung cấp chúng như các `Services` riêng với HPA theo từng vai trò. Đừng cố đặt một HPA đơn lẻ phía trước cả hai.

### Cold start matters here too

Giảm thiểu khởi động nguội (Giai đoạn 17 · 10) là nơi thời gian cấp phát node trở nên nhìn thấy với người dùng. Làm nóng 45-60 giây của Karpenter cộng tải mô hình 20GB cộng khởi tạo engine có nghĩa một yêu cầu từ số không mất 2-5 phút. Giữ một bể nóng (`min_workers=1`) cho các đường trọng yếu SLO, hoặc sử dụng tạo checkpoint kiểu Modal ở lớp ứng dụng.

### Numbers you should remember

- Cấp phát node Karpenter: ~45-60s so với Cluster Autoscaler ~90-120s (các node GPU).
- KAI Scheduler ngăn lãng phí phân bổ một phần — bẫy 7-trong-8.
- `DCGM_FI_DEV_GPU_UTIL` làm tín hiệu HPA: hỏng; sử dụng độ sâu hàng đợi hoặc mức sử dụng KV.
- Karpenter `WhenEmptyOrUnderutilized`: chấm dứt các công việc GPU đang chạy. Sử dụng `WhenEmpty + consolidateAfter: 1h` cho suy luận.

```figure
autoscaling
```

## Use It

`code/main.py` mô phỏng một bộ tự động mở rộng ba lớp trên một khối lượng công việc GPU bùng phát. So sánh HPA ngây thơ (chu kỳ hoạt động), HPA độ sâu hàng đợi, và mở rộng được KAI lập lịch theo nhóm. Báo cáo các yêu cầu không được đáp ứng, số phút GPU nhàn rỗi, và một điểm tổng hợp.

## Ship It

Bài này tạo ra `outputs/skill-gpu-autoscaler-plan.md`. Với cấu trúc liên kết cụm, hình dạng khối lượng công việc, và SLO, nó thiết kế một kế hoạch tự động mở rộng ba lớp.

## Exercises

1. Chạy `code/main.py`. Dưới một khối lượng công việc bùng phát, HPA chu kỳ hoạt động ngây thơ bỏ bao nhiêu yêu cầu mà HPA độ sâu hàng đợi bắt được? Khác biệt đến từ đâu?
2. Thiết kế một Karpenter NodePool cho một cụm phục vụ Llama 3.3 70B FP8 trên H100 SXM5. Chỉ rõ `capacity-type`, `disruption.consolidationPolicy`, `consolidateAfter`, và một taint giữ các khối lượng công việc không GPU khỏi các node này.
3. Nhóm của bạn báo các triển khai mắc kẹt ở Pending vì “các GPU có sẵn nhưng pod không được lập lịch.” Chẩn đoán — đây là Karpenter, kube-scheduler, hay KAI Scheduler? Các chỉ số nào xác nhận?
4. Chọn một tín hiệu để tự động mở rộng các pod prefill tách rời và một tín hiệu khác cho các pod decode. Giải thích cả hai.
5. Tính chi phí bẫy hợp nhất `WhenEmptyOrUnderutilized` trên một dịch vụ sản xuất 24x7 có trung bình 60 sự kiện bỏ yêu cầu/ngày ở P99 TTFT > 10s.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Karpenter | “bộ cấp phát node” | Bộ tự động mở rộng node Kubernetes; cấp phát dưới một phút |
| Cluster Autoscaler | “bộ mở rộng cũ” | Tiền thân bộ tự động mở rộng node Kubernetes; chậm hơn, dựa trên nhóm |
| KAI Scheduler | “bộ lập lịch GPU” | Bộ lập lịch thứ cấp cho nhóm + cấu trúc liên kết + hàng đợi |
| Gang scheduling (Lập lịch theo nhóm) | “tất cả hoặc không gì” | Lập lịch N pod một cách nguyên tử hoặc hoãn tất cả |
| Topology awareness (Nhận biết cấu trúc liên kết) | “nhận biết rack” | Đặt các pod dựa trên vị trí NVLink/IB/rack |
| `DCGM_FI_DEV_GPU_UTIL` | “mức sử dụng GPU” | Chỉ số chu kỳ hoạt động; KHÔNG phải tín hiệu mở rộng cho các LLM |
| Queue depth (Độ sâu hàng đợi) | “các yêu cầu đang chờ” | Tín hiệu HPA đúng cho mở rộng bị giới hạn bởi prefill |
| KV cache utilization (Mức sử dụng bộ nhớ đệm KV) | “áp lực bộ nhớ” | Tín hiệu HPA đúng cho mở rộng bị giới hạn bởi decode |
| Consolidation (Hợp nhất) | “Hợp nhất Karpenter” | Chấm dứt node để chuyển sang loại instance rẻ hơn |
| `WhenEmpty + 1h` | “hợp nhất an toàn” | Chính sách không trục xuất các công việc GPU đang chạy |

## Further Reading

- [KAI Scheduler GitHub](https://github.com/kai-scheduler/KAI-Scheduler) — các tài liệu thiết kế và ví dụ cấu hình.
- [Karpenter Disruption Controls](https://karpenter.sh/docs/concepts/disruption/) — ngữ nghĩa chính sách hợp nhất và các mặc định an toàn GPU.
- [NVIDIA — Disaggregated LLM Inference on Kubernetes](https://developer.nvidia.com/blog/deploying-disaggregated-llm-inference-workloads-on-kubernetes/) — các tín hiệu mở rộng Dynamo Planner.
- [Ray docs — KAI Scheduler for RayClusters](https://docs.ray.io/en/latest/cluster/kubernetes/k8s-ecosystem/kai-scheduler.html) — mẫu tích hợp Ray.
- [AWS EKS Compute and Autoscaling Best Practices](https://docs.aws.amazon.com/eks/latest/best-practices/aiml-compute.html) — hướng dẫn riêng cho Kubernetes được quản lý.
- [llm-d GitHub](https://github.com/llm-d/llm-d) — thiết kế Workload Variant Autoscaler.
