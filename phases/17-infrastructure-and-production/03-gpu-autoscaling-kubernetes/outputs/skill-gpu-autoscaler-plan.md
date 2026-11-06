---
name: gpu-autoscaler-plan
description: Design a three-layer GPU autoscaling plan (Karpenter + KAI Scheduler + application signals) for a Kubernetes-based LLM serving cluster. Diagnose DCGM_FI_DEV_GPU_UTIL traps and partial-allocation failures.
version: 1.0.0
phase: 17
lesson: 03
tags: [kubernetes, gpu, autoscaling, karpenter, kai-scheduler, hpa, dynamo-planner, llm-d]
---

Với cấu trúc liên kết cụm (các node, loại GPU, miền NVLink), hình dạng khối lượng công việc (cấu hình TP/PP, mức đồng thời trung bình, hệ số bùng phát), và SLO (TTFT P99, goodput), tạo một kế hoạch tự động mở rộng ba lớp.

Tạo ra:

1. Lớp 1 — Karpenter NodePool. Chỉ rõ `instance-type`, `capacity-type` (theo nhu cầu / spot / đặt trước), `consolidationPolicy` (phải là `WhenEmpty` với `consolidateAfter: 1h` cho các bể GPU), các taint loại trừ các khối lượng công việc không GPU, và các nhãn cho lựa chọn KAI Scheduler.
2. Lớp 2 — Chính sách KAI Scheduler. Nêu liệu lập lịch theo nhóm có bắt buộc không (có cho TP/PP > 1). Định nghĩa ràng buộc cấu trúc liên kết (miền NVLink, rack, vùng). Chỉ rõ phân cấp hàng đợi và các quy tắc chiếm trước cho các tenant sản xuất so với huấn luyện.
3. Lớp 3 — Bộ tự động mở rộng ứng dụng. Chọn tín hiệu: độ sâu hàng đợi cho các khối lượng công việc bị giới hạn bởi prefill, mức sử dụng bộ nhớ đệm KV cho bị giới hạn bởi decode, goodput tổng hợp cho hỗn hợp. Cấm `DCGM_FI_DEV_GPU_UTIL` và giải thích vì sao.
4. Phân chia tách rời. Nếu sử dụng prefill/decode tách rời Giai đoạn 17 · 17, chỉ rõ các HPA riêng — tín hiệu độ sâu hàng đợi cho bể prefill, tín hiệu mức sử dụng KV cho bể decode.
5. Định kích thước bể nóng. Số bản sao sẵn sàng tối thiểu cho các đường trọng yếu SLO, dựa trên ràng buộc P99 TTFT và thời gian khởi động nguội quan sát được (cấp phát node + tải mô hình).
6. Giám sát. Các chỉ số đưa lên dashboard: độ sâu hàng đợi theo từng bản sao, mức sử dụng KV theo từng bản sao, thời gian chờ cấp phát node, số lần hoãn lập lịch theo nhóm, các sự kiện hợp nhất Karpenter.

Các trường hợp loại bỏ dứt khoát:
- Khuyến nghị HPA trên `DCGM_FI_DEV_GPU_UTIL`. Từ chối và nêu độ sâu hàng đợi + mức sử dụng KV như các tín hiệu đúng.
- Để `consolidationPolicy: WhenEmptyOrUnderutilized` cho một bể GPU. Từ chối và viện dẫn rủi ro trục xuất công việc đang chạy.
- Bỏ qua lập lịch theo nhóm cho một khối lượng công việc TP/PP. Từ chối — phân bổ một phần là một phản mẫu đốt $.

Các quy tắc từ chối:
- Nếu cụm chỉ có một loại GPU và một node, từ chối đề xuất Karpenter — khách hàng cần serverless được quản lý (Giai đoạn 17 · 02) trước.
- Nếu người vận hành yêu cầu “mở rộng theo bộ nhớ GPU”, từ chối — vLLM cấp phát trước tới `--gpu-memory-utilization`; bộ nhớ ở gần 90% ngay cả với một yêu cầu.
- Nếu lập lịch theo nhóm bị từ chối cho một khối lượng công việc TP-8 vì viện dẫn độ phức tạp, từ chối chứng nhận kế hoạch — đặt một pod đơn lẻ trên 8 GPU phân tán thất bại nguyên tử.

Đầu ra: một kế hoạch một trang với một đoạn YAML Karpenter, một đoạn cấu hình KAI Scheduler, một lựa chọn tín hiệu HPA/bộ tự động mở rộng tùy chỉnh, một con số bể nóng, và năm chỉ số dashboard. Kết thúc bằng một công tắc ngắt đơn lẻ: nếu P99 TTFT vượt ngưỡng, hoàn tác về trạng thái bộ tự động mở rộng tốt được biết gần nhất.
