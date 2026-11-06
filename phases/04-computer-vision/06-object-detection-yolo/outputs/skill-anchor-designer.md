---
name: skill-anchor-designer
description: Given a dataset of ground-truth boxes, run k-means on (w, h) and return anchor sets per FPN level plus coverage statistics
version: 1.0.0
phase: 4
lesson: 6
tags: [computer-vision, detection, anchors, kmeans]
---

# Anchor Designer

Anchor là siêu tham số riêng theo tập dữ liệu nhất trong một bộ phát hiện dựa trên anchor. Các anchor COCO mặc định hoạt động kém trên ảnh nuôi cấy tế bào, ô ảnh vệ tinh hoặc giám sát đối tượng nhỏ. Skill này suy ra các anchor thực sự khớp dữ liệu đích.

## When to use

- Trước lần huấn luyện đầu trên một tập dữ liệu mới.
- Khi recall trên các đối tượng rất nhỏ hoặc rất lớn yếu trong một mô hình nhìn chung khỏe mạnh.
- Sau một đợt mở rộng tập dữ liệu lớn nơi phân phối kích thước hộp có thể đã dịch chuyển.

## Inputs

- `boxes`: mảng numpy hình dạng (N, 4) ở định dạng `(cx, cy, w, h)` hoặc `(x1, y1, x2, y2)`; khuyến nghị ít nhất 1000 hộp dương.
- `num_anchors_per_level`: thường 3.
- `num_fpn_levels`: thường 3 (P3, P4, P5) hoặc 4.
- `input_size`: HxW độ phân giải huấn luyện.
- `strides` tùy chọn: stride mỗi mức; khi bỏ qua, lấy `num_fpn_levels` phần tử đầu của `[8, 16, 32, 64]`. Truyền tường minh một mảng dài hoặc ngắn hơn nếu FPN của bộ phát hiện có stride khác.

## Steps

1. **Chuẩn hóa các hộp** thành các cặp `(w, h)` theo đơn vị pixel tại `input_size`. Bỏ mọi hộp có w hoặc h < 2 pixel.

2. **Chạy k-means** trên các cặp `(w, h)`, với `k = num_anchors_per_level * num_fpn_levels`. Sử dụng `1 - IoU(box, cluster)` làm hàm khoảng cách, không phải khoảng cách Euclid — Euclid trên `(w, h)` gộp các hộp cao mảnh và hộp vuông lại với nhau. Mọi hộp đóng góp ngang nhau (không trọng số); nếu bạn có tập dữ liệu mất cân bằng lớp và muốn recall hộp lớn hơn, lặp lại các hộp lớp hiếm trong mảng đầu vào thay vì truyền một vector trọng số.

3. **Sắp xếp các cụm theo diện tích** tăng dần. Chia thành `num_fpn_levels` nhóm gồm `num_anchors_per_level`. Các diện tích nhỏ nhất tới mức độ phân giải cao nhất (stride nhỏ nhất).

4. **Tính thống kê bao phủ** mỗi mức:
   - `median IoU` của mỗi hộp sự thật nền với anchor tốt nhất của nó ở mức đó.
   - `recall@IoU=0.5` — phần trăm hộp có anchor tốt nhất đạt IoU >= 0.5.
   - `area coverage` — tỷ lệ hộp có diện tích nằm trong `[anchor_min_area / 4, anchor_max_area * 4]` của mức.

5. **Báo cáo các anchor mỗi mức** và đánh dấu các mức có `recall@IoU=0.5 < 0.9`; các anchor của mức đó không khớp dữ liệu tốt và nên được điều chỉnh lại hoặc tăng số anchor mỗi mức.

## Report format

```
[anchor-designer]
  total boxes:         <N>
  clusters:            <k>
  distance metric:     1 - IoU

[level P3  stride=8]
  anchors (w, h):      [(A, B), (C, D), (E, F)]
  median IoU:          <X>
  recall@IoU=0.5:      <X>
  coverage:            <X>
  flag:                ok | retune

[level P4  stride=16]
  ...

[summary]
  overall recall@IoU=0.5: <X>
  smallest anchor:        <w x h>
  largest anchor:         <w x h>
  recommendation:         <one sentence if any level flagged>
```

## Rules

- Luôn sử dụng khoảng cách dựa trên IoU; k-means Euclid tạo ra các anchor trông hợp lý nhưng tệ hơn theo thực nghiệm.
- Sắp xếp các cụm theo diện tích, rồi gán tới các mức theo thứ tự tăng dần.
- Khi `num_anchors_per_level = 1`, bỏ qua k-means hoàn toàn: chia các hộp thành `num_fpn_levels` bin theo phân vị diện tích (ví dụ ba phân vị cho 3 mức), rồi đặt anchor mỗi mức thành trung vị (w, h) theo bin. Cách này vững hơn chạy k-means với `k = num_fpn_levels` trên các tập dữ liệu nhỏ.
- Không bao giờ xuất kích thước anchor âm; chặn ở 1.
- Nếu tập dữ liệu có < 200 hộp, cảnh báo người dùng rằng tìm kiếm anchor không đáng tin cậy và khuyến nghị dùng các anchor COCO mặc định cộng thêm dữ liệu huấn luyện.
