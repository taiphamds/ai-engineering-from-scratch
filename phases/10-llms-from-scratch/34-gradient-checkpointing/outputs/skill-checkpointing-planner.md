---
name: checkpointing-planner
description: Choose an activation recomputation policy per layer (none / selective / full / offload) given a training config and HBM budget.
version: 1.0.0
phase: 10
lesson: 34
tags: [gradient-checkpointing, activation-recomputation, selective-checkpoint, fsdp-offload, training-memory]
---

Với cấu hình huấn luyện (số lớp L, kích thước ẩn d, độ dài chuỗi S, microbatch B, số byte dtype trên mỗi giá trị, kernel attention, bậc tensor-parallel TP, bậc pipeline-parallel PP, bậc expert-parallel EP nếu MoE) và ngân sách HBM mỗi rank sau trọng số và trạng thái bộ tối ưu, xuất:

1. Chính sách từng lớp. Với mỗi họ lớp trong ngăn xếp (embedding, attention, FFN, expert MoE, norm, head đầu ra), chọn không, chọn lọc, đầy đủ hoặc offload. Mặc định chọn lọc cho attention khi S vượt 4_096; mặc định không với các luồng residual và norm; mặc định offload trên FFN chỉ khi thời gian truyền PCIe đo được cho activation của lớp đó nhỏ hơn thời gian tính lại đo được của nó.
2. Kích thước đoạn k. Nếu bật checkpointing đầy đủ, chọn k là round(sqrt(L)) cho chi phí lớp đồng đều, k nhỏ hơn khi bộ nhớ activation chiếm ưu thế trong ngân sách. Báo cáo phần trăm FLOP bổ sung dưới dạng (1/k) của FLOPs forward.
3. Tương tác FlashAttention. Xác nhận liệu kernel attention đã tính lại softmax chưa. Nếu có, checkpointing attention chọn lọc mang lại ít lợi ích; hạ xuống không. Nêu tên kernel (FlashAttention-2/3, xFormers memory-efficient, vanilla).
4. Kế hoạch TP / PP. Với TP, nêu tên các activation cần gather hoặc scatter lại khi tính lại và số byte giao tiếp bổ sung mỗi bước. Với PP, xác nhận những stage pipeline nào được checkpoint từ đầu đến cuối để các microbatch ngược giải phóng bộ nhớ activation trước khi đi ngược về.
5. Phép tính ngân sách. Dự đoán bộ nhớ activation trước và sau chính sách (bằng MB mỗi rank). Dự đoán chi phí FLOP bổ sung dưới dạng phần trăm fwd+bwd. Loại bỏ bất kỳ kế hoạch nào không vừa ngân sách HBM với 10 phần trăm dư.

Từ chối checkpointing đầy đủ mọi lớp khi chỉ chọn lọc trên attention đã đáp ứng ngân sách; phân tích cho thấy chi phí FLOP bổ sung cao gấp nhiều lần chọn lọc với cùng mức tiết kiệm bộ nhớ, và tỷ lệ chính xác phụ thuộc khối lượng công việc. Từ chối offload khi thời gian truyền activation đo được của lớp trên liên kết PCIe đích vượt thời gian tính lại đo được của nó; tính lại thắng. Từ chối "checkpoint mọi nơi" cho huấn luyện FP8 khi framework đã chọn không chụp lại lịch sử amax; tính lại sẽ làm trôi tỷ lệ và âm thầm làm hỏng gradient.

Đầu vào ví dụ: "L=64, d=8192, S=8192, B=1, bf16, FlashAttention-3, TP=8, PP=4, ngân sách HBM mỗi rank 32 GB sau trọng số, MoE với 8 expert và EP=8."

Đầu ra ví dụ:
- Chính sách từng lớp: attention chọn lọc, FFN không, expert MoE đầy đủ, embedding không, head đầu ra offload.
- Kích thước đoạn: đầy đủ chỉ áp dụng trên MoE ở k=8; chi phí FLOP bổ sung 12 phần trăm trên đường expert, 0 ở nơi khác.
- Tương tác FlashAttention: FA-3 đã tính lại softmax; chọn lọc ở wrapper lớp, không phải bên trong kernel.
- Kế hoạch TP / PP: TP gather đầu vào attention khi tính lại, giao tiếp bổ sung 0.3 GB mỗi bước; mỗi stage PP checkpoint toàn bộ forward của nó; stage PP 3 giữ lại activation cho backward cuối cùng.
- Phép tính ngân sách: activation 38 GB không có chính sách, 11 GB có chính sách. Tổng chi phí FLOP bổ sung 7.5 phần trăm fwd+bwd.
