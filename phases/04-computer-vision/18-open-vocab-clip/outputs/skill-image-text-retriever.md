---
name: skill-image-text-retriever
description: Build an image embedding index with any CLIP checkpoint; support query-by-text and query-by-image
version: 1.0.0
phase: 4
lesson: 18
tags: [clip, retrieval, faiss, zero-shot]
---

# Image-Text Retriever

Biến một thư mục hình ảnh thành chỉ mục có thể tìm kiếm bằng embedding CLIP.

## When to use

- Xây tìm kiếm hình ảnh zero-shot trên một danh mục nội bộ.
- Loại trùng các hình ảnh gần giống hệt bằng khoảng cách embedding.
- Xây nhanh thành phần "tìm tương tự" mà không có tập dữ liệu gán nhãn.

## Inputs

- `image_folder`: thư mục các file hình ảnh.
- `clip_model`: id HuggingFace như `openai/clip-vit-base-patch32` hoặc `google/siglip-base-patch16-224`.
- `index_type`: flat | IVF | HNSW.
- `embedding_dim`: suy ra từ mô hình.

## Steps

1. Tải mô hình CLIP và bộ tiền xử lý.
2. Mã hóa theo batch mọi hình ảnh trong thư mục. Lưu các embedding thành float32 (N, D) + danh sách tên file.
3. Xây chỉ mục FAISS trên các embedding. Sử dụng tích vô hướng trên các vector chuẩn hóa L2 cho độ tương đồng cosine.
4. Cung cấp hai giao diện truy vấn:
   - `search_by_text(text, k)` — embedding văn bản, tìm kiếm.
   - `search_by_image(image_path, k)` — embedding hình ảnh, tìm kiếm.

## Output template

```python
import os
import glob
import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPProcessor
import faiss


class ImageTextRetriever:
    def __init__(self, model_name="openai/clip-vit-base-patch32"):
        self.model = CLIPModel.from_pretrained(model_name).eval()
        self.processor = CLIPProcessor.from_pretrained(model_name)
        self.dim = self.model.config.projection_dim
        self.index = None
        self.filenames = []

    @torch.no_grad()
    def _encode_images(self, paths, batch=16):
        embs = []
        for i in range(0, len(paths), batch):
            imgs = [Image.open(p).convert("RGB") for p in paths[i:i + batch]]
            inputs = self.processor(images=imgs, return_tensors="pt")
            out = self.model.get_image_features(**inputs)
            out = out / out.norm(dim=-1, keepdim=True)
            embs.append(out.cpu().numpy())
        return np.concatenate(embs).astype(np.float32)

    @torch.no_grad()
    def _encode_text(self, texts):
        inputs = self.processor(text=texts, return_tensors="pt", padding=True)
        out = self.model.get_text_features(**inputs)
        out = out / out.norm(dim=-1, keepdim=True)
        return out.cpu().numpy().astype(np.float32)

    def build_index(self, folder, index_type="flat"):
        exts = ("*.jpg", "*.jpeg", "*.png", "*.webp", "*.bmp")
        files = []
        for ext in exts:
            files.extend(glob.glob(os.path.join(folder, ext)))
        self.filenames = sorted(files)
        embs = self._encode_images(self.filenames)
        if index_type == "IVF":
            quantizer = faiss.IndexFlatIP(self.dim)
            nlist = min(256, max(4, len(embs) // 32))
            self.index = faiss.IndexIVFFlat(quantizer, self.dim, nlist)
            self.index.train(embs)
        elif index_type == "HNSW":
            self.index = faiss.IndexHNSWFlat(self.dim, 32, faiss.METRIC_INNER_PRODUCT)
        else:
            self.index = faiss.IndexFlatIP(self.dim)
        self.index.add(embs)

    def search_by_text(self, text, k=5):
        q = self._encode_text([text])
        dist, idx = self.index.search(q, k)
        return [(self.filenames[i], float(d)) for d, i in zip(dist[0], idx[0])]

    def search_by_image(self, image_path, k=5):
        q = self._encode_images([image_path])
        dist, idx = self.index.search(q, k)
        return [(self.filenames[i], float(d)) for d, i in zip(dist[0], idx[0])]
```

## Report

```
[retriever]
  model:          <name>
  num_images:     <int>
  dim:            <int>
  index_type:     flat | IVF | HNSW
  index_size_mb:  <float>
```

## Rules

- Luôn chuẩn hóa L2 các embedding trước lập chỉ mục; tích vô hướng FAISS trên các vector chuẩn hóa bằng độ tương đồng cosine.
- Với < 100k hình ảnh, `IndexFlatIP` (chính xác) đơn giản và nhanh nhất.
- Với 100k-10M, `IndexIVFFlat` là đánh đổi tiêu chuẩn.
- Với > 10M, sử dụng HNSW hoặc biến thể lượng tử hóa tích.
- Không bao giờ xây lại chỉ mục mỗi truy vấn; embedding một lần, tìm kiếm nhiều lần.
