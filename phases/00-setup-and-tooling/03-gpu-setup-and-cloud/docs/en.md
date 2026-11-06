# GPU Setup & Cloud

> Huấn luyện trên CPU là đủ để học. Huấn luyện thực sự cần GPU.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 minutes

## Learning Objectives

- Xác minh GPU cục bộ có sẵn bằng `nvidia-smi` và API CUDA của PyTorch
- Cấu hình Google Colab với GPU T4 cho các thử nghiệm miễn phí trên đám mây
- Đo hiệu năng phép nhân ma trận trên CPU so với GPU và đo mức tăng tốc
- Ước tính mô hình lớn nhất vừa với VRAM của bạn bằng quy tắc ước lượng fp16

## The Problem

Hầu hết bài học ở các giai đoạn 1-3 chạy tốt trên CPU. Nhưng khi bạn bắt đầu huấn luyện CNN, transformer hoặc LLM (giai đoạn 4+), bạn cần tăng tốc bằng GPU. Một lượt huấn luyện mất 8 giờ trên CPU chỉ mất 10 phút trên GPU.

Bạn có ba lựa chọn: GPU cục bộ, GPU đám mây hoặc Google Colab (miễn phí).

## The Concept

```
Your options:

1. Local NVIDIA GPU
   Cost: $0 (you already have it)
   Setup: Install CUDA + cuDNN
   Best for: Regular use, large datasets

2. Google Colab (free tier)
   Cost: $0
   Setup: None
   Best for: Quick experiments, no GPU at home

3. Cloud GPU (Lambda, RunPod, Vast.ai)
   Cost: $0.20-2.00/hr
   Setup: SSH + install
   Best for: Serious training, large models
```

```figure
s0-gpu-dispatch
```

## Build It

### Option 1: Local NVIDIA GPU

Kiểm tra xem bạn có GPU hay không:

```bash
nvidia-smi
```

Cài PyTorch với CUDA. Trên Linux, wheel mặc định đi kèm CUDA. Trên Windows, sao chép lệnh CUDA từ bộ chọn tại pytorch.org.

```bash
pip install torch torchvision torchaudio
```

Sau đó kiểm tra rằng PyTorch nhận diện GPU:

```python
import torch

print(f"CUDA available: {torch.cuda.is_available()}")
print(f"CUDA version: {torch.version.cuda}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
```

### Option 2: Google Colab

1. Truy cập [colab.research.google.com](https://colab.research.google.com)
2. Runtime > Change runtime type > T4 GPU
3. Chạy `!nvidia-smi` để xác minh

Tải trực tiếp các notebook của khóa học này lên Colab.

### Option 3: Cloud GPU

Đối với Lambda Labs, RunPod hoặc Vast.ai:

```bash
ssh user@your-gpu-instance

pip install torch torchvision torchaudio
python -c "import torch; print(torch.cuda.get_device_name(0))"
```

### No GPU? No problem.

Hầu hết bài học hoạt động trên CPU. Những bài cần GPU sẽ nêu rõ và kèm liên kết Colab.

```python
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using: {device}")
```

## Build It: GPU vs CPU benchmark

```python
import torch
import time

size = 5000

a_cpu = torch.randn(size, size)
b_cpu = torch.randn(size, size)

start = time.time()
c_cpu = a_cpu @ b_cpu
cpu_time = time.time() - start
print(f"CPU: {cpu_time:.3f}s")

if torch.cuda.is_available():
    a_gpu = a_cpu.to("cuda")
    b_gpu = b_cpu.to("cuda")

    torch.cuda.synchronize()
    start = time.time()
    c_gpu = a_gpu @ b_gpu
    torch.cuda.synchronize()
    gpu_time = time.time() - start
    print(f"GPU: {gpu_time:.3f}s")
    print(f"Speedup: {cpu_time / gpu_time:.0f}x")
```

## Exercises

1. Chạy phép đo hiệu năng bên trên và so sánh thời gian CPU với GPU
2. Nếu bạn không có GPU, hãy chạy trên Google Colab và so sánh
3. Kiểm tra dung lượng bộ nhớ GPU bạn có và ước tính mô hình lớn nhất có thể chứa (quy tắc ước lượng: 2 byte mỗi tham số đối với fp16)

### Hints

**Bài tập 1.** Chạy nguyên trạng mã trong phần Build It, rồi ghi lại thời gian CPU, thời gian GPU và dòng mức tăng tốc. Chạy lần thứ hai; lần chạy GPU đầu tiên bao gồm chi phí khởi động, vì vậy các số ở lần thứ hai là những số dùng để so sánh.

**Bài tập 2.** Trong Colab, chọn Runtime > Change runtime type > GPU, rồi dán phép đo hiệu năng vào một ô. Trước tiên chạy `!nvidia-smi` trong một ô khác; nó phải hiển thị tên GPU trước khi kết quả đo hiệu năng có ý nghĩa.

**Bài tập 3.** Đọc tổng bộ nhớ bằng `torch.cuda.get_device_properties(0).total_memory / 1e9`, như trong `code/gpu_check.py`. Chia bộ nhớ tính bằng byte cho 2 để có số tham số cho fp16, rồi chừa một khoảng dự phòng, vì activation và ngữ cảnh CUDA cũng sử dụng bộ nhớ.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|----------------|----------------------|
| CUDA | "Lập trình GPU" | Nền tảng tính toán song song của NVIDIA cho phép bạn chạy mã trên GPU |
| VRAM | "Bộ nhớ GPU" | RAM video trên GPU, tách biệt với RAM hệ thống. Giới hạn kích thước mô hình. |
| fp16 | "Độ chính xác một nửa" | Số dấu phẩy động 16-bit, sử dụng một nửa bộ nhớ của fp32 với mức suy giảm độ chính xác tối thiểu |
| Tensor Core | "Phần cứng ma trận nhanh" | Các lõi GPU chuyên dụng cho phép nhân ma trận, nhanh hơn các lõi thông thường 4-8 lần |
