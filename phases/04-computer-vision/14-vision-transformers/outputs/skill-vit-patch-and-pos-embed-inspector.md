---
name: skill-vit-patch-and-pos-embed-inspector
description: Verify a ViT's patch embedding and positional embedding shapes match the model's expected sequence length
version: 1.0.0
phase: 4
lesson: 14
tags: [vision-transformer, debugging, pytorch]
---

# ViT Patch and Positional Embedding Inspector

Lỗi chuyển đổi ViT thường gặp nhất: tải một checkpoint được tiền huấn luyện ở 224x224 vào mô hình cấu hình cho 384x384 (hoặc ngược lại). Embedding vị trí có độ dài chuỗi sai và mô hình âm thầm tạo rác.

## When to use

- Tinh chỉnh một ViT được tiền huấn luyện tại độ phân giải không mặc định.
- Kiểm tra tại sao chuyển trọng số giữa ViT-B/16 và ViT-B/32 thất bại; bộ kiểm tra đánh dấu kích thước patch không khớp để bên gọi biết đổi kiến trúc thay vì ép chuyển.
- Gỡ lỗi một ViT tải không lỗi nhưng huấn luyện kém.

## Inputs

- `model`: một `nn.Module` ViT đã khởi tạo.
- `expected_image_size`: H x W mô hình sẽ thấy trong production.
- `patch_size`: kích thước patch kỳ vọng.

## Steps

1. Định vị tích chập patch embedding trong mô hình. Báo cáo `kernel_size`, `stride`, `in_channels`, `out_channels` của nó.
2. Tính số patch kỳ vọng. Với hình vuông: `(image_size / patch_size)^2`. Với hình chữ nhật: `(H / patch_size) * (W / patch_size)`. Yêu cầu `H % patch_size == 0` và `W % patch_size == 0`; nếu không đánh dấu và từ chối.
3. Định vị embedding vị trí được học. Báo cáo hình dạng `(1, N, dim)`.
4. So sánh `N` với `num_patches + 1` (có CLS) hoặc `num_patches` (không CLS). Không khớp nghĩa là checkpoint được tiền huấn luyện tại độ phân giải hoặc kích thước patch khác.
5. Kiểm tra `out_channels` của tích chập patch bằng `dim` của embedding vị trí.
6. Nếu mô hình được cho là nội suy các embedding vị trí cho các độ phân giải mới, xác minh tiện ích nội suy tồn tại (hầu hết ViT `timm` tự động làm qua `resize_pos_embed`).

## Report

```
[vit-inspector]
  image_size:         HxW
  patch_size:         <int>
  num_patches (computed): <int>
  patch_conv:         k=<int>  s=<int>  in=<int>  out=<int>
  pos_embed shape:    (1, N, dim)
  has CLS token:      yes | no
  pos_embed N:        <int>    expected: <int>
  verdict:            ok | mismatch

[if mismatch]
  action:  reinitialise pos_embed for new sequence length
  tool:    timm.models.vision_transformer.resize_pos_embed
```

## Rules

- Không bao giờ âm thầm nội suy mà không cảnh báo; làm rõ hành động để người dùng biết cấu trúc vị trí được tiền huấn luyện có thể đã dịch chuyển.
- Nếu patch_size không khớp, từ chối khuyến nghị nội suy — đổi sang kiến trúc đúng.
- Không cố sửa mô hình tại chỗ; báo cáo và đề xuất.
