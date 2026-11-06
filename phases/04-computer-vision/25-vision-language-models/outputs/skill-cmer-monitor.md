---
name: skill-cmer-monitor
description: Instrument a production VLM endpoint with Cross-Modal Error Rate monitoring, dashboards, and alerts
version: 1.0.0
phase: 4
lesson: 25
tags: [vlm, production, monitoring, hallucination]
---

# CMER Monitor

Coi căn chỉnh liên phương thức như một KPI production hạng nhất.

## When to use

- Triển khai bất kỳ endpoint VLM nào tạo văn bản dựa trên hình ảnh.
- Điều tra báo cáo phản hồi ảo giác.
- Theo dõi liệu dịch chuyển phân phối đầu vào làm giảm khả năng bám hình ảnh của mô hình.

## Inputs

- `vlm_output`: văn bản sinh.
- `text_confidence`: xác suất trung bình từng token sau softmax, trong `[0, 1]`. Tính bằng `exp(mean(log_probs))`. Không truyền logit thô; logit thô không bị chặn và `conf_threshold` giả định xác suất.
- `image_embedding`: embedding họ CLIP của hình ảnh (DINOv3, SigLIP, CLIP).
- `text_embedding`: embedding họ CLIP của văn bản sinh.
- `prompt_type` tùy chọn: nhãn để nhóm (vqa / ocr / captioning / agent).

## Per-request computation

```python
import torch

def cmer_flag(image_emb, text_emb, text_conf, sim_thr=0.25, conf_thr=0.8):
    if image_emb.shape != text_emb.shape:
        raise ValueError(f"emb shape mismatch: {image_emb.shape} vs {text_emb.shape}")
    image_emb = image_emb / (image_emb.norm() + 1e-8)
    text_emb = text_emb / (text_emb.norm() + 1e-8)
    sim = float((image_emb * text_emb).sum())
    flagged = (text_conf > conf_thr) and (sim < sim_thr)
    return {"sim": sim, "flagged": flagged}
```

Các embedding là tensor PyTorch 1-D (`torch.float32`) từ encoder họ CLIP độc lập. Nếu dùng mảng NumPy, đổi `.norm()` thành `np.linalg.norm(...)` và ép kiểu đầu ra tương ứng.

Lưu `sim`, `text_conf`, `flagged`, `prompt_type`, `timestamp`, `model_version`, `request_id` vào pipeline giám sát (Prometheus, DataDog, OpenTelemetry).

## Aggregate metric

```
CMER = (flagged requests in window) / (total requests in window)
```

Báo cáo từng endpoint, từng prompt_type, từng phiên bản mô hình.

## Alert thresholds

- CMER cơ sở: thiết lập qua 7 ngày lưu lượng bình thường.
- Cảnh báo: CMER >= 1.5 lần mức cơ sở trong 1 giờ.
- Nghiêm trọng: CMER >= 2 lần mức cơ sở trong 30 phút hoặc tuyệt đối > 15% cho bất kỳ cửa sổ nào.

## Dashboard panels

1. CMER theo thời gian (nhóm 5 phút, cửa sổ 7 ngày).
2. CMER theo prompt_type (thanh xếp chồng).
3. Phân phối `sim` mỗi giờ (histogram).
4. Các đầu ra ảo giác hàng đầu (lấy mẫu 20 phản hồi đánh dấu mỗi ngày để con người xem xét).

## Actions when CMER spikes

1. Lấy mẫu các yêu cầu đánh dấu.
2. Xác minh phiên bản mô hình không thay đổi ngoài ý muốn.
3. Kiểm tra phân phối đầu vào (định dạng file mới? nguồn hình ảnh mới? nén khác?).
4. Chuyển lưu lượng bị ảnh hưởng tới con người xem xét tới khi đỉnh tăng giải quyết.
5. Nếu đỉnh tăng dai dẳng, tinh chỉnh hoặc thay mô hình; không tắt cảnh báo.

## Rules

- Không bao giờ tính CMER bằng embedding của chính VLM; dùng encoder độc lập (DINOv3, SigLIP hoặc CLIP-L/14). Nếu không bạn đo tự nhất quán của mô hình, không phải căn chỉnh.
- Luôn ghi giá trị `sim` thô, không chỉ bit `flagged`; dịch chuyển phân phối xuất hiện ở tứ phân vị dưới trước khi tỷ lệ đánh dấu thay đổi.
- Không phát hành endpoint VLM thiếu giám sát CMER; ảo giác là kiểu thất bại production chủ đạo và âm thầm nếu không có thước đo này.
- Với lĩnh vực nhạy cảm (y tế, pháp lý, tài chính), tăng `sim_threshold` lên 0.35 hoặc cao hơn; điều kiện đánh dấu là `sim < sim_threshold`, nên ngưỡng cao hơn phát hiện nhiều đầu ra có thể không bám ảnh — mặc định đúng cho sử dụng hệ trọng.
