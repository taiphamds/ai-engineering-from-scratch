---
name: disaggregation-decider
description: Decide whether to adopt disaggregated prefill/decode (Dynamo or llm-d) for a given workload and cluster. Quantify prefill:decode ratios, KV transfer cost, and the expected savings.
version: 1.0.0
phase: 17
lesson: 17
tags: [disaggregated-serving, dynamo, llm-d, nixl, kv-transfer, prefill-decode]
---

Với hồ sơ khối lượng công việc (phân phối độ dài prompt/đầu ra, mô hình, độ đồng thời), cấu trúc liên kết cụm (GPU, hạ tầng kết nối, tính khả dụng RDMA) và chi phí phục vụ hiện tại, tạo một quyết định tách rời.

Tạo:

1. Tách rời? Có / Không với giải thích đánh số. Đường cơ sở: prompt > 512 VÀ đầu ra > 200. Hạ tầng kết nối: có RDMA giúp ích; chỉ TCP đẩy điểm hòa vốn ra dài hơn.
2. Chọn ngăn xếp. NVIDIA Dynamo (bộ điều phối được quản lý trên vLLM/SGLang/TRT-LLM) hoặc llm-d (các Service nguyên bản Kubernetes). Ghép với bối cảnh vận hành.
3. Tỷ lệ prefill:decode. Dùng số đo Dynamo Planner Profiler, hoặc tính từ dạng khối lượng công việc (TFLOPS prefill so với byte/giây decode). Ví dụ: 2 prefill : 1 decode cho nặng RAG; 1:2 cho nặng đầu ra.
4. Kế hoạch truyền KV. Phương thức truyền có tên (NIXL qua InfiniBand / RDMA / dự phòng TCP). Tính chi phí truyền mỗi yêu cầu cho P99 prompt của bạn.
5. Tích hợp bộ định tuyến. Bộ định tuyến nhận biết bộ nhớ đệm (Giai đoạn 17 · 11) phải ở phía trước — tách rời không khớp tiền tố mất lợi ích bộ nhớ đệm.
6. Tiết kiệm dự kiến. Tính so với đường cơ sở đồng vị trí; trích dẫn trường hợp được công bố (30-40% ở cùng SLA).

Các trường hợp loại bỏ dứt khoát:
- Tách rời khối lượng công việc prompt ngắn (<512 token). Từ chối — chi phí truyền chiếm ưu thế.
- Triển khai không có bộ định tuyến nhận biết bộ nhớ đệm. Từ chối — định tuyến mù triệt tiêu tính cục bộ KV.
- Bỏ qua cấu trúc liên kết (xếp cùng rack). Từ chối — truyền KV qua nhiều chặng rack tốn hơn RDMA trên cùng rack.

Quy tắc từ chối:
- Nếu cụm có < 4 GPU, từ chối — không đủ độ đa dạng bể để tách rời mang lại lợi ích.
- Nếu không có RDMA/InfiniBand và không có kế hoạch, ghi nhận rằng TCP nâng điểm hòa vốn lên prompt >2K; đánh giá lại.
- Nếu nhóm không thể vận hành hai bể GPU với mở rộng quy mô theo vai trò, từ chối llm-d và yêu cầu Dynamo làm phương án thay thế được quản lý.

Đầu ra: một quyết định một trang với tách rời Có/Không, chọn ngăn xếp, tỷ lệ, phương thức truyền, bộ định tuyến, tiết kiệm dự kiến. Kết thúc bằng chỉ số duy nhất cần xác minh: độ trễ P99 truyền KV; kiểm soát khi vượt ngưỡng được chỉ định trong kế hoạch.
