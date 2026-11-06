# Vision Transformers (ViT)

> Một ảnh là một lưới các patch. Một câu là một lưới các token. Cùng transformer ăn cả hai.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 7 · 05 (Full Transformer), Phase 4 · 03 (CNNs), Phase 4 · 14 (Vision Transformers intro)
**Time:** ~45 minutes

## The Problem

Trước năm 2020, thị giác máy tính nghĩa là tích chập. Mọi SOTA trên ImageNet, COCO và các benchmark phát hiện đều dùng một backbone CNN. Transformer dành cho ngôn ngữ.

Dosovitskiy và cộng sự (2020) — "An Image is Worth 16x16 Words" — cho thấy bạn có thể bỏ hoàn toàn các tích chập. Cắt một ảnh thành các patch kích thước cố định, chiếu tuyến tính mỗi patch thành một embedding, đưa chuỗi vào một encoder transformer nguyên bản. Ở quy mô đủ lớn (tiền huấn luyện ImageNet-21k hoặc lớn hơn), ViT ngang hoặc thắng các mô hình dựa trên ResNet.

ViT là khởi đầu của một mẫu rộng hơn năm 2026: một kiến trúc, nhiều phương thức. Whisper tokenize âm thanh. ViT tokenize ảnh. Token hành động cho robot học. Token pixel cho video. Transformer không quan tâm — đưa cho nó một chuỗi và nó học.

Đến năm 2026, ViT và các hậu duệ (DeiT, Swin, DINOv2, ViT-22B, SAM 3) sở hữu hầu hết thị giác. CNN vẫn thắng trên các thiết bị biên và các tác vụ nhạy độ trễ. Mọi thứ khác có một ViT ở đâu đó trong ngăn xếp.

## The Concept

![Image → patches → tokens → transformer](../assets/vit.svg)

### Step 1 — patchify

Chia một ảnh `H × W × C` thành một chuỗi `N × (P·P·C)` các patch phẳng. Thiết lập điển hình: ảnh `224 × 224`, patch `16 × 16` → 196 patch mỗi patch 768 giá trị.

```
image (224, 224, 3) → 14 × 14 grid of 16x16x3 patches → 196 vectors of length 768
```

Kích thước patch là đòn bẩy. Patch nhỏ hơn = nhiều token hơn, độ phân giải tốt hơn, chi phí attention bậc hai. Patch lớn hơn = thô hơn, rẻ hơn.

### Step 2 — linear embedding

Một ma trận được học duy nhất chiếu mỗi patch phẳng sang `d_model`. Tương đương một tích chập có kích thước kernel `P` và stride `P`. Trong PyTorch đây theo nghĩa đen là `nn.Conv2d(C, d_model, kernel_size=P, stride=P)` — một triển khai 2 dòng.

### Step 3 — prepend `[CLS]` token, add positional embeddings

- Thêm vào đầu một token `[CLS]` có thể học. Trạng thái ẩn cuối của nó là biểu diễn ảnh được dùng để phân loại.
- Thêm các embedding vị trí có thể học (ViT gốc) hoặc hình sin 2D (các biến thể sau).
- Từ 2024+ RoPE mở rộng sang 2D cho vị trí, đôi khi không có các embedding tường minh.

### Step 4 — standard transformer encoder

Xếp L khối `LayerNorm → Self-Attention → + → LayerNorm → MLP → +`. Giống hệt BERT. Không có tầng riêng thị giác. Đây là điểm nhấn sư phạm của bài báo.

### Step 5 — head

Với phân loại: lấy trạng thái ẩn `[CLS]` → tuyến tính → softmax. Với DINOv2 hoặc SAM, bỏ `[CLS]`, dùng trực tiếp các embedding patch.

### Variants that mattered

| Mô hình | Năm | Thay đổi |
|-------|------|--------|
| ViT | 2020 | Bản gốc. Kích thước patch cố định, attention toàn cục đầy đủ. |
| DeiT | 2021 | Chưng cất; chỉ cần ImageNet-1k để huấn luyện. |
| Swin | 2021 | Phân cấp với các cửa sổ dịch chuyển. Chi phí dưới bậc hai cố định. |
| DINOv2 | 2023 | Tự giám sát (không nhãn). Các đặc trưng thị giác tổng quát tốt nhất. |
| ViT-22B | 2023 | 22B tham số; các quy luật mở rộng áp dụng. |
| SigLIP | 2023 | ViT + cặp ngôn ngữ, sigmoid contrastive loss. |
| SAM 3 | 2025 | Phân đoạn bất kỳ thứ gì; ViT-Large + decoder mặt nạ nhận prompt. |

### Why it took a while

ViT cần *rất nhiều* dữ liệu để ngang CNN vì nó không có thiên kiến quy nạp nào của CNN (bất biến tịnh tiến, tính cục bộ). Không có >100M ảnh có nhãn hoặc tiền huấn luyện tự giám sát mạnh, CNN vẫn thắng ở tính toán tương ứng. DeiT sửa điều này năm 2021 bằng các thủ thuật chưng cất; DINOv2 sửa vĩnh viễn năm 2023 bằng tự giám sát.

```figure
n5-patch-stream
```

## Build It

Xem `code/main.py`. Chia patch + embedding tuyến tính + các kiểm tra hợp lý chỉ dùng stdlib. Không huấn luyện — ViT ở bất kỳ quy mô thực tế nào cần PyTorch và hàng giờ GPU.

### Step 1: fake image

Một ảnh RGB 24 × 24 dưới dạng một danh sách các hàng tuple `(R, G, B)`. Chúng ta dùng các patch 6×6 → 16 patch, mỗi patch một vector embedding 108 chiều.

### Step 2: patchify

```python
def patchify(image, P):
    H = len(image)
    W = len(image[0])
    patches = []
    for i in range(0, H, P):
        for j in range(0, W, P):
            patch = []
            for di in range(P):
                for dj in range(P):
                    patch.extend(image[i + di][j + dj])
            patches.append(patch)
    return patches
```

Thứ tự raster: ưu tiên hàng trên lưới. Mọi ViT dùng thứ tự này.

### Step 3: linear embed

Nhân mỗi patch phẳng với một ma trận ngẫu nhiên `(patch_flat_size, d_model)`. Xác minh hình dạng đầu ra là `(N_patches + 1, d_model)` sau khi thêm `[CLS]` vào đầu.

### Step 4: count parameters for a realistic ViT

In số tham số cho ViT-Base: 12 tầng, 12 head, d=768, patch=16. So sánh với ResNet-50 (~25M). ViT-Base đạt ~86M. ViT-Large ~307M. ViT-Huge ~632M.

## Use It

```python
from transformers import ViTImageProcessor, ViTModel
import torch
from PIL import Image

processor = ViTImageProcessor.from_pretrained("google/vit-base-patch16-224-in21k")
model = ViTModel.from_pretrained("google/vit-base-patch16-224-in21k")

img = Image.open("cat.jpg")
inputs = processor(img, return_tensors="pt")
out = model(**inputs).last_hidden_state   # (1, 197, 768): [CLS] + 196 patches
cls_emb = out[:, 0]                       # image representation
```

**Các embedding DINOv2 là mặc định năm 2026 cho đặc trưng ảnh.** Đóng băng backbone, huấn luyện một head tí hon. Hoạt động cho phân loại, truy xuất, phát hiện, chú thích. Các checkpoint DINOv2 của Meta vượt CLIP trên mọi tác vụ thị giác phi văn bản.

**Chọn kích thước patch.** Các mô hình nhỏ dùng 16×16 (ViT-B/16). Dự đoán đặc (phân đoạn) dùng 8×8 hoặc 14×14 (SAM, DINOv2). Các mô hình rất lớn dùng 14×14.

## Ship It

Xem `outputs/skill-vit-configurator.md`. Skill chọn một biến thể ViT và kích thước patch cho một tác vụ thị giác mới với kích thước tập dữ liệu, độ phân giải và ngân sách tính toán.

## Exercises

1. **Dễ.** Chạy `code/main.py`. Xác minh số patch bằng `(H/P) * (W/P)` và số chiều patch phẳng bằng `P*P*C`.
2. **Trung bình.** Triển khai các embedding vị trí hình sin 2D — hai mã hình sin độc lập cho `row` và `col` của mỗi patch, được nối lại. Đưa chúng vào một ViT PyTorch tí hon và so sánh accuracy với các embedding vị trí có thể học trên CIFAR-10.
3. **Khó.** Xây dựng một ViT 3 tầng (PyTorch), huấn luyện trên 1,000 ảnh MNIST với các patch 4×4. Đo accuracy kiểm thử. Giờ thêm tiền huấn luyện DINOv2 trên cùng 1,000 ảnh (đơn giản hóa: chỉ huấn luyện encoder dự đoán các embedding patch từ các patch được che). Accuracy có cải thiện không?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Patch | "Token vision-transformer" | Vector phẳng các giá trị pixel cho một vùng `P × P × C` của ảnh. |
| Patchify (Chia patch) | "Cắt + làm phẳng" | Cắt ảnh thành các patch không chồng lấn, làm phẳng mỗi patch thành một vector. |
| `[CLS]` token | "Bản tóm tắt ảnh" | Token có thể học được thêm vào đầu; embedding cuối của nó là biểu diễn ảnh. |
| Inductive bias (Thiên kiến quy nạp) | "Điều mô hình giả định" | ViT có ít tiên nghiệm hơn CNN; cần nhiều dữ liệu hơn để bù khoảng cách. |
| DINOv2 | "ViT tự giám sát" | Được huấn luyện không nhãn bằng tăng cường ảnh + mô hình giáo viên momentum. Các đặc trưng ảnh tổng quát tốt nhất năm 2026. |
| SigLIP | "Kế nhiệm CLIP" | ViT + encoder văn bản được huấn luyện bằng sigmoid contrastive loss; tốt hơn CLIP ở tính toán tương ứng. |
| Swin | "ViT cửa sổ" | ViT phân cấp với attention cục bộ + các cửa sổ dịch chuyển; dưới bậc hai. |
| Register tokens (Các token thanh ghi) | "Thủ thuật năm 2023" | Một vài token có thể học bổ sung hấp thụ các attention sink; cải thiện các đặc trưng DINOv2. |

## Further Reading

- [Dosovitskiy et al. (2020). An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale](https://arxiv.org/abs/2010.11929) — bài báo ViT.
- [Touvron et al. (2021). Training data-efficient image transformers & distillation through attention](https://arxiv.org/abs/2012.12877) — DeiT.
- [Liu et al. (2021). Swin Transformer: Hierarchical Vision Transformer using Shifted Windows](https://arxiv.org/abs/2103.14030) — Swin.
- [Oquab et al. (2023). DINOv2: Learning Robust Visual Features without Supervision](https://arxiv.org/abs/2304.07193) — DINOv2.
- [Darcet et al. (2023). Vision Transformers Need Registers](https://arxiv.org/abs/2309.16588) — cách sửa bằng token thanh ghi cho DINOv2.
