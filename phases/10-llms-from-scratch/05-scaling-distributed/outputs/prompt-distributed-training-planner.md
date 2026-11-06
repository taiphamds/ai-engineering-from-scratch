---
name: prompt-distributed-training-planner
description: Plan a distributed training run given model size and available hardware
version: 1.0.0
phase: 10
lesson: 5
tags: [distributed-training, fsdp, deepspeed, tensor-parallelism, pipeline-parallelism, scaling]
---

# Distributed Training Planner

Khi lập kế hoạch một lần huấn luyện phân tán cho một mô hình ngôn ngữ lớn, dùng khung này để xác định chiến lược song song hóa, ngân sách bộ nhớ, chi phí giao tiếp và thông lượng kỳ vọng.

## Input Requirements

Cung cấp:
- **Kích thước mô hình** (tham số theo tỷ)
- **Token huấn luyện mục tiêu** (theo nghìn tỷ)
- **GPU sẵn có** (loại: A100/H100/H200, số lượng, kết nối: NVLink/InfiniBand)
- **Bộ nhớ GPU** (80GB cho A100/H100, 141GB cho H200)
- **Node** (GPU mỗi node, số node)
- **Ràng buộc ngân sách** (chi phí tối đa bằng đô la, thời gian thực tối đa)

## Step 1: Memory Budget

Tính bộ nhớ mỗi GPU cho mỗi thành phần:

| Thành phần | Công thức | FP16 | FP32 |
|-----------|---------|------|------|
| Trọng số | params x bytes_per_param | params x 2 | params x 4 |
| Optimizer Adam (m + v) | params x 4 x 2 | luôn 8 byte/tham số | 8 byte/tham số |
| Gradient | params x bytes_per_param | params x 2 | params x 4 |
| Activation (ước lượng) | seq_len x batch x hidden x layers x 2 | thay đổi | thay đổi |

Nếu tổng vượt bộ nhớ GPU, cần phân mảnh. Thử theo thứ tự:
1. ZeRO-1 (chỉ phân mảnh optimizer) -- giao tiếp rẻ nhất
2. ZeRO-2 (+ gradient) -- giao tiếp vừa phải
3. FSDP/ZeRO-3 (+ trọng số) -- giao tiếp cao nhất nhưng tiết kiệm bộ nhớ tối đa
4. Thêm activation checkpointing nếu activation vẫn quá lớn
5. Thêm song song tensor nếu một lớp không vừa trên một GPU

## Step 2: Parallelism Strategy

### Decision Tree

1. **Một lớp có vừa trên một GPU không?**
   - Không: Bạn cần song song tensor. Đặt TP = 2, 4 hoặc 8 (trong một node).
   - Có: Bỏ qua song song tensor.

2. **Toàn bộ mô hình (có phân mảnh) có vừa trên các GPU trong một node không?**
   - Không: Bạn cần song song pipeline. Đặt PP = số node / nhóm.
   - Có: Bỏ qua song song pipeline.

3. **Còn bao nhiêu GPU cho song song dữ liệu?**
   - DP = total_gpus / (TP x PP)

4. **Mức phân mảnh nào trong nhóm song song dữ liệu?**
   - Bắt đầu với FSDP (ZeRO-3). Giảm xuống ZeRO-2 hoặc ZeRO-1 nếu giao tiếp là nút thắt.

### Typical Configurations

| Kích thước mô hình | Tổng GPU | TP | PP | DP | Phân mảnh |
|-----------|-----------|----|----|-----|----------|
| 7B | 8 | 1 | 1 | 8 | FSDP |
| 13B | 16 | 2 | 1 | 8 | FSDP |
| 70B | 64 | 8 | 1 | 8 | FSDP |
| 70B | 128 | 8 | 2 | 8 | FSDP |
| 405B | 16,384 | 8 | 16 | 128 | FSDP |

## Step 3: Communication Analysis

Ước lượng lượng giao tiếp mỗi bước huấn luyện:

- **Song song dữ liệu (all-reduce)**: 2 x gradient_size x (N-1)/N mỗi bước
- **FSDP (all-gather + reduce-scatter)**: ~3 x weight_size x (N-1)/N mỗi bước (cao hơn DP)
- **Song song tensor (all-reduce mỗi lớp)**: 2 x activation_size x num_layers mỗi bước (cần NVLink)
- **Song song pipeline (điểm-điểm)**: activation_size mỗi ranh giới giai đoạn (tối thiểu)

Nếu thời gian giao tiếp vượt 20% thời gian tính toán, chiến lược bị giới hạn giao tiếp. Giải pháp:
- Tích lũy gradient (giảm tần suất all-reduce)
- Chồng lấp giao tiếp với tính toán (FSDP làm điều này theo mặc định)
- Tăng kích thước micro-batch (tỷ lệ tính toán/giao tiếp tốt hơn)
- Chuyển sang giai đoạn phân mảnh ít giao tiếp hơn

## Step 4: Throughput and Cost Estimate

**FLOPS mỗi bước huấn luyện:**
- Truyền xuôi: ~2 x params x tokens_per_batch
- Truyền ngược: ~4 x params x tokens_per_batch (2x truyền xuôi)
- Tổng: ~6 x params x tokens_per_batch

**Thời gian huấn luyện:**
- total_flops = 6 x params x total_tokens
- time_seconds = total_flops / (num_gpus x gpu_tflops x 1e12 x utilization)
- Mức sử dụng điển hình: 35-45% (tính cả giao tiếp, bong bóng pipeline, chi phí bộ nhớ)

**Chi phí:**
- total_gpu_hours = num_gpus x time_seconds / 3600
- cost = total_gpu_hours x cost_per_gpu_hour

## Step 5: Validation Checklist

Trước khi khởi chạy:

1. Bộ nhớ mỗi GPU vừa giới hạn phần cứng (với dư địa 10%)
2. Kích thước batch hiệu dụng khớp mục tiêu (per_gpu_batch x DP x gradient_accumulation_steps)
3. Tỷ lệ giao tiếp/tính toán dưới 20%
4. Tỷ lệ bong bóng pipeline dưới 15% (đủ micro-batch)
5. Tốc độ học được co giãn cho kích thước batch hiệu dụng
6. Tần suất checkpoint tính đến xác suất lỗi (lưu mỗi 1-2 giờ cho các lần chạy lớn)
7. Cắt gradient đã được đặt (thường là 1.0 cho mô hình lớn)
8. Số bước khởi động tỷ lệ với tổng bước (thường 0.1-1% tổng)

## Red Flags

- **TP > 8**: Song song tensor xuyên node (qua InfiniBand) hầu như luôn chậm hơn song song pipeline
- **Giai đoạn pipeline > 32**: Chi phí bong bóng trở nên đáng kể ngay cả với nhiều micro-batch
- **Kích thước batch hiệu dụng > 10M token**: Lợi ích giảm dần; có thể hại hội tụ
- **Mức sử dụng dưới 30%**: Bị giới hạn giao tiếp -- đánh giá lại chiến lược song song hóa
- **Không activation checkpointing trên 13B**: Bạn sẽ hết bộ nhớ trong truyền ngược
- **Không tích lũy gradient với batch mỗi GPU nhỏ**: Nhiễu gradient tăng; tích lũy đến batch hiệu dụng 256+ mẫu
