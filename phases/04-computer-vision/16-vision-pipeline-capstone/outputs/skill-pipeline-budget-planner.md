---
name: skill-pipeline-budget-planner
description: Given target latency and throughput, assign a time budget to every pipeline stage and flag which stage will miss its budget first
version: 1.0.0
phase: 4
lesson: 16
tags: [vision, pipeline, performance, deployment]
---

# Pipeline Budget Planner

Biến một mục tiêu độ trễ/thông lượng thành ngân sách từng giai đoạn để mọi thành viên biết con số họ đang hướng tới khi xây dựng.

## When to use

- Trước khi xây một dịch vụ thị giác mới, để đặt kỳ vọng cho từng giai đoạn.
- Sau lần đo hiệu năng đầu, để thấy giai đoạn nào xa ngân sách nhất.
- Khi SLA thay đổi và các ngân sách cần được thương lượng lại.

## Inputs

- `p95_latency_target_ms`: ngân sách mỗi yêu cầu.
- `target_qps`: thông lượng mỗi bản sao.
- `stages`: danh sách `{ name: str, current_ms: float }`.

## Allocation rules

Phân bổ mặc định trên bảy giai đoạn tiêu chuẩn nếu không có các phép đo hiện tại:

| Giai đoạn | Tỷ phần |
|-------|-------|
| giải mã + tiền xử lý | 15% |
| truyền xuôi bộ phát hiện | 55% |
| hậu xử lý phát hiện (NMS, chặn) | 5% |
| cắt + đổi kích thước cho bộ phân loại | 5% |
| truyền xuôi bộ phân loại | 15% |
| xác thực schema | <1% |
| tuần tự hóa phản hồi | 4% |

Trên các pipeline giới hạn GPU (đám mây), tỷ phần bộ phát hiện thường tăng tới 70%. Trên CPU, tiền xử lý và chia batch bộ phân loại chiếm nhiều hơn.

## Report

```
[budget plan]
  p95 target:  <ms>
  throughput:  <qps per replica>

| stage               | target_ms | current_ms | headroom | gate |
|---------------------|-----------|------------|----------|------|
| decode+preprocess   | ...       | ...        | ...      | ok|X |
| detector            | ...       | ...        | ...      | ok|X |
| ...                 | ...       | ...        | ...      |      |

[bottleneck]
  stage:  <name>
  miss:   <ms over budget>
  lever:  <specific action>

[levers]
  decode+preprocess:   Pillow-SIMD, libjpeg-turbo, decode on GPU via NVJPEG
  detector:            smaller backbone, lower input resolution, INT8, TensorRT
  postprocess:         GPU-side NMS (torchvision.ops), fused masks
  crop+resize:         GPU crop with grid_sample, batched interpolate
  classifier:          smaller backbone, INT8, warm cache, batch
  schema:              skip validation in hot path, validate at boundaries only
  response:            orjson, stream protobuf
```

## Rules

- Không bao giờ khuyến nghị bỏ xác thực schema khỏi đường production; đề xuất chuyển tới ranh giới thay thế.
- Nếu tiền xử lý không đạt ngân sách, luôn thử Pillow-SIMD hoặc NVJPEG trước khi thay mô hình.
- Nếu bộ phát hiện không đạt hơn 30% mục tiêu, đổi mô hình thay vì tối ưu mô hình hiện tại.
- Đánh dấu cổng là `X` khi current_ms > 1.1 * target_ms; đánh dấu `ok` nếu trong 10% ngân sách.
