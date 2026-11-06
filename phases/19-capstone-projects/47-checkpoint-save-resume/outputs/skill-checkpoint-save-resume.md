---
name: checkpoint-save-resume
description: Atomic, sharded checkpoints with full RNG capture so a killed run resumes mid-epoch with the same loss trajectory.
version: 1.0.0
phase: 19
lesson: 47
tags: [training, durability, resume, sharded-state]
---

## When to use

Bất kỳ lần chạy huấn luyện nào dài hơn trần thời gian thực của cụm, bất kỳ lần chạy nào phải sống sót qua một nút khởi động lại, bất kỳ mô hình nào quá lớn cho một payload duy nhất.

## Payload shape

```python
{
  "schema": "ckpt.v1",
  "model": model.state_dict(),
  "optimizer": opt.state_dict(),
  "scheduler": sched.state_dict(),
  "state": {"step": int, "epoch": int, "batch_in_epoch": int, "losses": [float, ...]},
  "rng": {"python": ..., "numpy": ..., "torch_cpu": ..., "torch_cuda": ...},
  "wall_saved_at": time.time(),
}
```

## Atomic save

1. Ghi payload vào một file tạm duy nhất trong cùng thư mục như đích.
2. `os.replace(tmp, target)` để hoán đổi nguyên tử.
3. Không bao giờ ghi trực tiếp vào tên đích.

## Sharded layout

- `model.shard-NNN.pt` mỗi shard, luân phiên trên các khóa hoặc chia theo nhóm tham số.
- `meta.pt` mang bộ tối ưu, bộ lập lịch, trạng thái huấn luyện, RNG, và bản kê khai shard.
- `index.json` mang `sha256` cho mọi shard và cho `meta.pt`.
- Loader xác minh mọi băm trước khi hợp nhất và từ chối các đường dẫn shard ngoài thư mục checkpoint.
- Nạp mọi file bằng `torch.load(path, map_location="cpu", weights_only=True)`. Giữ trạng thái RNG như các danh sách thông thường để nó sống sót qua loader chỉ trọng số.

## Mid-epoch resume

- Lưu `(epoch, batch_in_epoch)` cạnh `step`.
- Khôi phục trạng thái RNG trước lô đầu của epoch được tiếp tục.
- Tua nhanh bộ sinh qua các lô đã tiêu thụ.

## Failure modes

- Đổi tên chéo thiết bị: không nguyên tử, mất file trước. Đặt file tạm trong cùng thư mục.
- Quên RNG: mất mát được tiếp tục phân kỳ khỏi đường cơ sở. Chạy khẳng định của demo.
- Quên trạng thái bộ tối ưu: bước tiếp theo giật. Cùng diff bùng nổ.
- Loại bỏ sai checkpoint: giữ K cuối cộng bản tốt nhất.
- Nạp bằng `weights_only=False`: một file `.pt` là một pickle, nên một checkpoint không đáng tin cậy chạy mã khi nạp.
