---
name: distributed-fsdp-ddp
description: Bring up multi-rank training with a from-scratch DDP wrapper and an FSDP parameter sharding sketch on the gloo or nccl backend.
version: 1.0.0
phase: 19
lesson: 48
tags: [distributed, ddp, fsdp, collectives]
---

## When to use

Mô hình vừa trên một thiết bị nhưng bạn cần nhiều thông lượng hơn (DDP). Mô hình không vừa trên một thiết bị (FSDP). Cả hai trường hợp: một thiết lập huấn luyện đa rank với cùng đường mã.

## Bring up the process group

```python
os.environ["MASTER_ADDR"] = "127.0.0.1"
os.environ["MASTER_PORT"] = str(port)
dist.init_process_group(backend="gloo", rank=rank, world_size=world_size)
```

`gloo` là backend CPU; `nccl` là backend GPU. Cả hai triển khai cùng bề mặt tập thể.

## Wrap the model

1. Trên rank 0, xây dựng mô hình từ seed của bạn.
2. Bọc nó bằng vỏ DDP.
3. `__init__` của vỏ gọi `dist.broadcast(p.data, src=0)` cho mọi tham số và buffer.
4. Sau mọi `loss.backward()`, bộ huấn luyện gọi `sync_grads()`.
5. `sync_grads()` gọi `dist.all_reduce(p.grad, op=SUM)` và `p.grad.div_(world_size)`.
6. Bước bộ tối ưu trên mọi rank với cùng gradient được lấy trung bình.

## Shard parameters (FSDP sketch)

1. Làm phẳng mỗi tham số, đệm đến một bội số của `world_size`.
2. Giữ shard của bạn cục bộ; giải phóng phần còn lại.
3. Trước lượt tiến, `dist.all_gather(...)` để dựng lại tensor đầy đủ trên mọi rank.
4. Sau lượt tiến, bỏ tensor đầy đủ.

## Failure modes

- Bỏ phát quảng bá: các rank bắt đầu từ khởi tạo khác nhau, phân kỳ âm thầm.
- Quên chia sau cộng: các gradient được chia tỷ lệ theo world_size, các bước bộ tối ưu quá lớn.
- Dùng đổi tên chéo thiết bị cho checkpoint: không nguyên tử; cùng bẫy bài 47.
- Trộn các tensor CPU và CUDA trên cùng phép tập thể: backend không khớp, lần chạy treo.
