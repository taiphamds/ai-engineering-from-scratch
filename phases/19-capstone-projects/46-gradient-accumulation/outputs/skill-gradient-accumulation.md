---
name: gradient-accumulation
description: Train at an effective batch larger than device memory by scaling micro-batch losses and stepping the optimizer once per window.
version: 1.0.0
phase: 19
lesson: 46
tags: [training, batch-size, distributed, scaling]
---

## When to use

Lô hiệu dụng là đòn bẩy làm mượt gradient và khớp lịch tốc độ học. Khi bạn không đủ khả năng đáp ứng nó trong một lượt tiến duy nhất, đây là công thức.

## Recipe

1. Chọn `micro_batch` là kích thước lớn nhất vừa trong bộ nhớ và bão hòa bộ tăng tốc.
2. Chọn `effective_batch` từ lịch tốc độ học.
3. Đặt `accum_steps = effective_batch // (micro_batch * world_size)` và khẳng định nó chia hết.
4. Theo lô vi mô: `loss = criterion(model(x), y) / accum_steps; loss.backward()`.
5. Trên các lô vi mô không cuối, vào `model.no_sync()` để bỏ qua all-reduce gradient trong DDP.
6. Sau lô vi mô cuối, chạy `optimizer.step()` một lần. Đặt gradient về không trước cửa sổ tiếp theo.
7. Trạng thái bộ tối ưu tiến một lần mỗi lô hiệu dụng; lịch tốc độ học tiến một nhịp mỗi lô hiệu dụng.

## Logging

Phát ra một bản ghi JSON nhỏ mỗi bước hiệu dụng với `samples_per_sec`, `median_step_ms`, `sync_calls`, `accum_steps`, `effective_batch`. Không có điều này đánh đổi chi phí không thể thấy.

## Failure modes

- Quên chia tỷ lệ `/ accum_steps`: gradient bùng nổ theo N.
- Thực hiện bước giữa cửa sổ: các tham số trôi.
- Đồng bộ trên mọi lô vi mô: bị giới hạn bởi mạng mà không có lợi ích thống kê.
- Trộn điều này với bỏ tỷ lệ độ chính xác hỗn hợp: chỉ chia tỷ lệ mất mát chưa được chia tỷ lệ.
