---
name: skill-recall-at-k-runner
description: Write a clean evaluation harness for recall@K with train/val/gallery splits and proper data contract
version: 1.0.0
phase: 4
lesson: 20
tags: [retrieval, evaluation, recall, faiss]
---

# Recall@K Runner

Biến một thư mục hình ảnh truy vấn và gallery cùng nhãn thành con số recall@K có thể tái lập.

## When to use

- Benchmark truy xuất đầu cho một backbone mới.
- Theo dõi chất lượng embedding qua các epoch tinh chỉnh.
- So sánh hai hệ thống truy xuất trên cùng tập dữ liệu.

## Inputs

- `query_images`: danh sách đường dẫn.
- `gallery_images`: danh sách đường dẫn (truy vấn có thể trùng hoặc không).
- `query_labels`, `gallery_labels`: ID lớp hoặc thực thể.
- `encoder_fn`: đối tượng gọi được `image -> embedding` (tính trước hoặc trực tiếp).
- `ks`: danh sách như `[1, 5, 10]`.

## Steps

1. Mã hóa mọi hình ảnh gallery một lần. Lưu dưới dạng mảng numpy.
2. Mã hóa mọi hình ảnh truy vấn.
3. Chuẩn hóa L2 cả hai tập embedding.
4. Với mỗi truy vấn, tính tương đồng với mọi mục gallery.
5. Sắp giảm dần, lấy top max(ks).
6. Với mỗi K, kiểm tra liệu bất kỳ mục gallery top-K nào có cùng nhãn truy vấn.
7. Báo cáo `recall@K = fraction of queries that had at least one correct neighbour in top K`.

## Output template

```python
import numpy as np
from sklearn.preprocessing import normalize

def encode_all(images, encoder_fn, batch=32):
    out = []
    for i in range(0, len(images), batch):
        embs = encoder_fn(images[i:i + batch])
        out.append(embs)
    return np.concatenate(out)


def recall_at_k(query_emb, gallery_emb, q_labels, g_labels,
                ks=(1, 5, 10), query_ids=None, gallery_ids=None):
    if len(query_emb) == 0 or len(gallery_emb) == 0:
        return {f"recall@{k}": 0.0 for k in ks}

    g_label_set = set(g_labels.tolist())
    keep = np.array([lbl in g_label_set for lbl in q_labels])
    if not keep.any():
        return {f"recall@{k}": 0.0 for k in ks}

    q_emb_f = query_emb[keep]
    q_lab_f = q_labels[keep]
    q_id_f = query_ids[keep] if query_ids is not None else None

    q = normalize(q_emb_f)
    g = normalize(gallery_emb)
    sims = q @ g.T

    if q_id_f is not None and gallery_ids is not None:
        self_mask = q_id_f[:, None] == gallery_ids[None, :]
        sims = np.where(self_mask, -np.inf, sims)

    top_k_max = min(max(ks), g.shape[0])
    if top_k_max <= 0:
        return {f"recall@{k}": 0.0 for k in ks}

    top = np.argpartition(-sims, top_k_max - 1, axis=1)[:, :top_k_max]
    sorted_top = np.take_along_axis(
        top, np.argsort(-sims[np.arange(len(q))[:, None], top], axis=1), axis=1
    )
    out = {}
    for k in ks:
        k_eff = min(k, top_k_max)
        hits = np.any(g_labels[sorted_top[:, :k_eff]] == q_lab_f[:, None], axis=1)
        out[f"recall@{k}"] = float(hits.mean())
    return out


def evaluate(query_images, query_labels, gallery_images, gallery_labels, encoder_fn, ks=(1, 5, 10)):
    q_emb = encode_all(query_images, encoder_fn)
    g_emb = encode_all(gallery_images, encoder_fn)
    return recall_at_k(q_emb, g_emb, np.array(query_labels), np.array(gallery_labels), ks)
```

## Report

```
[evaluation]
  num queries:   <int>
  num gallery:   <int>
  embedding_dim: <int>

[recall]
  recall@1:  <float>
  recall@5:  <float>
  recall@10: <float>
```

## Rules

- Chuẩn hóa embedding trước tính tương đồng; FAISS IndexFlatIP trên các vector chuẩn hóa bằng cosine.
- Khi nhãn sự thật nền truy vấn vắng trong gallery, loại nó; nếu không recall bị chặn dưới 1 một cách hiển nhiên.
- Nếu truy vấn và gallery trùng nhau, loại chính truy vấn khỏi top-K của nó hoặc bạn đo tự tương đồng, không phải truy xuất.
- Với `num_queries > 10,000`, chia batch phép nhân ma trận tương đồng để tránh OOM.
