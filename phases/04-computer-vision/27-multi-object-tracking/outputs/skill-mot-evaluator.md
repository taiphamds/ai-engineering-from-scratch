---
name: skill-mot-evaluator
description: Write a complete evaluation harness for MOTA / IDF1 / HOTA against ground-truth tracks
version: 1.0.0
phase: 4
lesson: 27
tags: [mot, evaluation, tracking, metrics]
---

# MOT Evaluator

Bao bọc đầu ra bộ theo dõi vào pipeline MOTA/IDF1/HOTA tiêu chuẩn để so sánh công bằng với tài liệu nghiên cứu.

## When to use

- Đo hiệu năng bộ theo dõi mới trên MOT17 / MOT20 / DanceTrack / SportsMOT.
- So sánh ByteTrack với BoT-SORT với SAM 2 trên cảnh quay của bạn.
- Tạo con số có thể tái lập cho bài báo hoặc mô tả PR.

## Inputs

- `predictions`: danh sách mỗi khung gồm các tuple `(track_id, x, y, w, h, confidence)`.
- `ground_truth`: danh sách mỗi khung gồm các tuple `(gt_id, x, y, w, h)`.
- `iou_threshold`: 0.5 điển hình cho MOTA; HOTA dùng quét.
- `evaluator`: `py-motmetrics` (MOTA, IDF1) hoặc `TrackEval` (HOTA).

## Output format contract

Cả `py-motmetrics` và `TrackEval` kỳ vọng định dạng cụ thể trên đĩa:

```
# predictions.txt
<frame>,<track_id>,<x>,<y>,<w>,<h>,<confidence>,-1,-1,-1

# ground_truth.txt
<frame>,<gt_id>,<x>,<y>,<w>,<h>,1,-1,-1,-1
```

Các khung đánh số từ 1, hộp là (x, y, w, h), không phải (x1, y1, x2, y2). Chuyển đổi là nơi hầu hết lỗi tích hợp tồn tại.

## Steps

1. Chuyển đầu ra bộ theo dõi sang định dạng văn bản MOT Challenge.
2. Chạy `py-motmetrics.io.loadtxt` trên cả hai file.
3. Tính MOTA + IDF1 bằng `mm.metrics.create().compute()`.
4. Với HOTA, gọi `TrackEval` với cùng các file và `Metrics: HOTA`.
5. Lưu kết quả thành JSON cho bảng điều khiển.

## Implementation sketch

```python
import motmetrics as mm

def evaluate_mota_idf1(pred_path, gt_path):
    gt = mm.io.loadtxt(gt_path, fmt="mot15-2D")
    pred = mm.io.loadtxt(pred_path, fmt="mot15-2D")
    acc = mm.utils.compare_to_groundtruth(gt, pred, dist="iou", distth=0.5)
    metrics = mm.metrics.create().compute(
        acc, metrics=["num_frames", "mota", "motp", "idf1", "idp", "idr", "num_switches"]
    )
    return metrics


def write_mot_txt(predictions, path):
    with open(path, "w") as f:
        for frame_idx, detections in enumerate(predictions, start=1):
            for tid, x, y, w, h, conf in detections:
                f.write(f"{frame_idx},{tid},{x:.2f},{y:.2f},{w:.2f},{h:.2f},{conf:.3f},-1,-1,-1\n")
```

## Report

```
[mot evaluation]
  frames:     <int>
  gt tracks:  <int>
  pred tracks: <int>

[metrics]
  MOTA:       <float>
  MOTP:       <float>
  IDF1:       <float>
  IDP/IDR:    <float/float>
  ID switches: <int>
  HOTA:       <float>  (from TrackEval)
```

## Rules

- Luôn dùng khung đánh số từ 1 trong file văn bản đầu ra; công cụ MOT kỳ vọng điều này.
- Chuyển (x1, y1, x2, y2) thành (x, y, w, h) trước khi ghi.
- Không báo cáo chỉ MOTA cho so sánh hiện đại; bao gồm IDF1 và HOTA.
- Chú ý phát hiện riêng so với công khai trên MOT17 — chúng được đánh giá riêng và trộn chúng làm tăng điểm.
- Ghi điểm từng chuỗi; tổng hợp che giấu thất bại trên chuỗi khó riêng lẻ.
