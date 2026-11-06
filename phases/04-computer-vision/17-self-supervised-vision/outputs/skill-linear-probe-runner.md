---
name: skill-linear-probe-runner
description: Write the complete linear-probe evaluation for any frozen encoder and labelled dataset
version: 1.0.0
phase: 4
lesson: 17
tags: [self-supervised, evaluation, linear-probe, pytorch]
---

# Linear Probe Runner

Đánh giá các đặc trưng encoder đóng băng bằng cách huấn luyện một bộ phân loại tuyến tính duy nhất trên đó. Đánh giá tiêu chuẩn cho mọi bài báo tự giám sát.

## When to use

- So sánh các checkpoint tự giám sát.
- Theo dõi chất lượng đặc trưng qua các epoch tiền huấn luyện.
- Quyết định liệu một encoder được tiền huấn luyện có đủ tốt cho tác vụ phía sau mà không tinh chỉnh.

## Inputs

- `encoder`: `nn.Module` đóng băng trả về một đặc trưng chiều cố định mỗi hình ảnh.
- `feature_dim`: số chiều đầu ra encoder.
- `train_dataset`: tập dữ liệu gán nhãn (image, class_id).
- `val_dataset`: tập được giữ lại.
- `num_classes`: các lớp tác vụ.
- `epochs`: thường 100 cho quy mô ImageNet, 50 cho các tập dữ liệu nhỏ hơn.

## Steps

1. Đặt encoder ở chế độ eval và `requires_grad=False` trên mọi tham số.
2. Trích xuất đặc trưng cả tập huấn luyện và validation một lần. Lưu thành mảng numpy hoặc file ánh xạ bộ nhớ.
3. Huấn luyện một `nn.Linear(feature_dim, num_classes)` trên các đặc trưng lưu đệm với SGD + lịch cosine.
4. Các siêu tham số tiêu chuẩn: `lr=0.1`, `momentum=0.9`, `weight_decay=0`, `batch_size=1024`. Linear probe nhạy với `lr` đáng ngạc nhiên — quét nếu accuracy kém.
5. Báo cáo accuracy top-1 trên validation ở cuối huấn luyện.

## Output template

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader
from torch.optim import SGD
from torch.optim.lr_scheduler import CosineAnnealingLR

def extract(encoder, loader, device="cpu"):
    encoder.eval()
    feats, labels = [], []
    with torch.no_grad():
        for x, y in loader:
            f = encoder(x.to(device)).cpu()
            feats.append(f)
            labels.append(y)
    return torch.cat(feats), torch.cat(labels)


def linear_probe(encoder, feature_dim, train_loader, val_loader,
                 num_classes, epochs=50, lr=0.1, device="cpu"):
    for p in encoder.parameters():
        p.requires_grad = False

    f_train, y_train = extract(encoder, train_loader, device)
    f_val, y_val = extract(encoder, val_loader, device)

    head = nn.Linear(feature_dim, num_classes).to(device)
    opt = SGD(head.parameters(), lr=lr, momentum=0.9, weight_decay=0)
    sched = CosineAnnealingLR(opt, T_max=epochs)

    ds = torch.utils.data.TensorDataset(f_train, y_train)
    train_iter = DataLoader(ds, batch_size=1024, shuffle=True)

    best_val = 0.0
    for ep in range(epochs):
        head.train()
        for x, y in train_iter:
            x, y = x.to(device), y.to(device)
            loss = F.cross_entropy(head(x), y)
            opt.zero_grad(); loss.backward(); opt.step()
        sched.step()

        head.eval()
        with torch.no_grad():
            acc = (head(f_val.to(device)).argmax(-1).cpu() == y_val).float().mean().item()
        best_val = max(best_val, acc)
    return best_val
```

## Report

```
[linear probe]
  encoder:     <name + pretrain checkpoint>
  feature_dim: <int>
  epochs:      <int>
  best_val_top1: <float>
```

## Rules

- Không bao giờ cập nhật các trọng số encoder trong linear probe; đó sẽ là tinh chỉnh, không phải probe.
- Tính trước các đặc trưng một lần; huấn luyện lại encoder mỗi epoch lãng phí tính toán 100 lần.
- Sử dụng SGD với lịch cosine và không weight decay; Adam đôi khi hoạt động kém ở đây.
- Quét tốc độ học ít nhất một lần mỗi họ encoder; tối ưu thay đổi giữa các phương pháp SSL.
