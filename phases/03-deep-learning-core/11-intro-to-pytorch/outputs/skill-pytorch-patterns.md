---
name: skill-pytorch-patterns
description: Reference patterns for PyTorch training, evaluation, and deployment
version: 1.0.0
phase: 03
lesson: 11
tags: [pytorch, training, deep-learning, gpu, patterns]
---

## Canonical Training Loop

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = Model().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=0.01)

for epoch in range(num_epochs):
    model.train()
    for inputs, targets in train_loader:
        inputs, targets = inputs.to(device), targets.to(device)
        optimizer.zero_grad()
        outputs = model(inputs)
        loss = criterion(outputs, targets)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
        optimizer.step()

    model.eval()
    with torch.no_grad():
        for inputs, targets in val_loader:
            inputs, targets = inputs.to(device), targets.to(device)
            outputs = model(inputs)
```

## Mixed Precision Training

```python
from torch.amp import autocast, GradScaler

scaler = GradScaler()
for inputs, targets in train_loader:
    inputs, targets = inputs.to(device), targets.to(device)
    optimizer.zero_grad()
    with autocast(device_type="cuda"):
        outputs = model(inputs)
        loss = criterion(outputs, targets)
    scaler.scale(loss).backward()
    scaler.step(optimizer)
    scaler.update()
```

Sử dụng khi: huấn luyện trên GPU với phần cứng hỗ trợ float16 (V100, A100, H100, RTX 3090+). Kỳ vọng tăng tốc ~1.5-2 lần và giảm bộ nhớ ~50%.

## Gradient Accumulation

```python
accumulation_steps = 4
optimizer.zero_grad()
for i, (inputs, targets) in enumerate(train_loader):
    inputs, targets = inputs.to(device), targets.to(device)
    outputs = model(inputs)
    loss = criterion(outputs, targets) / accumulation_steps
    loss.backward()
    if (i + 1) % accumulation_steps == 0:
        optimizer.step()
        optimizer.zero_grad()
```

Sử dụng khi: kích thước batch hiệu dụng cần lớn hơn bộ nhớ GPU cho phép. Chia mất mát cho accumulation_steps giữ thang đo gradient nhất quán.

## Save and Load

```python
torch.save({
    "epoch": epoch,
    "model_state_dict": model.state_dict(),
    "optimizer_state_dict": optimizer.state_dict(),
    "loss": loss.item(),
}, "checkpoint.pt")

checkpoint = torch.load("checkpoint.pt", weights_only=True)
model.load_state_dict(checkpoint["model_state_dict"])
optimizer.load_state_dict(checkpoint["optimizer_state_dict"])
```

Luôn lưu trạng thái bộ tối ưu hóa để tiếp tục huấn luyện. Với chỉ suy luận, chỉ lưu `model.state_dict()`.

## Custom Dataset

```python
class CustomDataset(torch.utils.data.Dataset):
    def __init__(self, data_dir, transform=None):
        self.samples = self._load_samples(data_dir)
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        x, y = self.samples[idx]
        if self.transform:
            x = self.transform(x)
        return x, y

    def _load_samples(self, data_dir):
        ...
```

## DataLoader Configuration

```python
train_loader = torch.utils.data.DataLoader(
    dataset,
    batch_size=64,
    shuffle=True,
    num_workers=4,
    pin_memory=True,
    drop_last=True,
    persistent_workers=True,
)
```

| Tham số | Chức năng | Khi nào sử dụng |
|-----------|-------------|-------------|
| num_workers=4 | Tải dữ liệu song song | Luôn luôn trên các máy nhiều lõi |
| pin_memory=True | Bộ nhớ CPU được khóa trang | Khi huấn luyện trên GPU |
| drop_last=True | Bỏ batch cuối không đầy đủ | Khi sử dụng BatchNorm |
| persistent_workers=True | Giữ các worker sống qua các epoch | Khi num_workers > 0 |

## Learning Rate Schedules

```python
scheduler = torch.optim.lr_scheduler.OneCycleLR(
    optimizer,
    max_lr=1e-3,
    total_steps=num_epochs * len(train_loader),
    pct_start=0.1,
)

for epoch in range(num_epochs):
    for inputs, targets in train_loader:
        ...
        optimizer.step()
        scheduler.step()
```

OneCycleLR: mặc định tốt nhất cho hầu hết các tác vụ. Warmup tới max_lr, rồi suy giảm cosine. Gọi `scheduler.step()` sau mỗi batch, không phải mỗi epoch.

## Weight Initialization

```python
def init_weights(module):
    if isinstance(module, nn.Linear):
        nn.init.kaiming_normal_(module.weight, nonlinearity="relu")
        if module.bias is not None:
            nn.init.zeros_(module.bias)
    elif isinstance(module, nn.Conv2d):
        nn.init.kaiming_normal_(module.weight, mode="fan_out", nonlinearity="relu")

model.apply(init_weights)
```

## Inference Mode

```python
model.eval()

with torch.inference_mode():
    outputs = model(inputs)
```

`torch.inference_mode()` nhanh hơn `torch.no_grad()` vì nó tắt hoàn toàn autograd thay vì chỉ ngăn tính gradient.

## Common Mistakes Checklist

1. Áp dụng softmax trước CrossEntropyLoss (nó bao gồm log_softmax bên trong)
2. Quên gọi model.eval() trong validation
3. Quên chuyển các tensor tới cùng thiết bị với mô hình
4. Không gọi optimizer.zero_grad() (các gradient tích lũy theo mặc định)
5. Sử dụng torch.no_grad() trong huấn luyện (tắt tính gradient)
6. Đặt num_workers quá cao (tạo quá nhiều tiến trình, gây thrashing bộ nhớ)
7. Không sử dụng pin_memory=True khi huấn luyện trên GPU
8. Lưu toàn bộ đối tượng mô hình thay vì state_dict (hỏng khi tái cấu trúc)
