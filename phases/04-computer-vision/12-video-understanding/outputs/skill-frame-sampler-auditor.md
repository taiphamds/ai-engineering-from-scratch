---
name: skill-frame-sampler-auditor
description: Audit a video pipeline's frame sampler for off-by-one, short-clip handling, and crop consistency
version: 1.0.0
phase: 4
lesson: 12
tags: [computer-vision, video, sampling, debugging]
---

# Frame Sampler Auditor

Lấy mẫu khung hình là nơi các pipeline video hỏng. Các lỗi ở đây lan tới mọi thước đo phía sau.

## When to use

- Viết một bộ tải dữ liệu video mới.
- Tái tạo các con số từ một bài báo và accuracy huấn luyện thấp hơn báo cáo.
- Gỡ lỗi một mô hình video có accuracy eval không ổn định giữa các lần chạy.

## Inputs

- `sampler_code`: hàm Python nhận (num_frames_total, T) và trả về T chỉ số.
- `T`: độ dài clip đích.
- Các trường hợp kiểm thử tùy chọn: các giá trị `num_frames_total` cần thử (ví dụ `[3, T-1, T, T+1, 30, 300, 3000]`).

## Checks

### 1. Short clip handling
Đưa vào `num_frames_total < T`. Mọi chỉ số trả về phải nằm trong `[0, num_frames_total - 1]`. Chính sách đệm tiêu chuẩn là lặp khung hình cuối cho các vị trí còn lại.

### 2. Boundary indices
Đưa vào `num_frames_total == T`. Các chỉ số trả về phải đúng là `[0, 1, ..., T-1]`.

### 3. Uniform distribution
Đưa vào `num_frames_total == 10 * T`. Các chỉ số trả về phải tăng đơn điệu và cách nhau gần đều.

### 4. Dense window bounds
Với lấy mẫu dày, đưa vào `num_frames_total == 3 * T`. Các chỉ số trả về phải tạo một cửa sổ liên tiếp, không bao giờ vượt cuối clip.

### 5. Determinism
Gọi bộ lấy mẫu hai lần với cùng đầu vào và (với bộ lấy mẫu tất định) cùng RNG. Các chỉ số nên khớp.

### 6. Crop consistency
Nếu pipeline cũng trả về vùng cắt không gian mỗi khung hình, chạy bộ lấy mẫu hai lần cho cùng clip với cùng seed và xác nhận mọi khung hình sử dụng cùng hộp cắt (cùng `(x, y, w, h)`). Các vùng cắt khác nhau mỗi khung hình trong một clip phá hủy tính nhất quán thời gian và là lỗi âm thầm kinh điển. Biến đổi chấp nhận được: tăng cường áp dụng *theo clip*, nhất quán trong clip.

## Report

```
[sampler audit]
  name: <function name>
  T:    <int>

[short-clip handling]
  passed | failed (<details>)

[boundary]
  passed | failed

[uniform spacing]
  passed | failed (<stddev of gaps>)

[dense window]
  passed | failed (<details>)

[determinism]
  passed | failed

[crop consistency]
  passed | failed (<per-frame crop varies: yes/no>)

[verdict]
  ok | fix required
```

## Rules

- Không bao giờ đánh dấu bộ lấy mẫu "ok" nếu xử lý clip ngắn trả về các chỉ số ngoài phạm vi.
- Các bộ lấy mẫu dày không bao giờ nên trả về cửa sổ vượt `num_frames_total - 1`.
- Nếu bộ lấy mẫu ngẫu nhiên (dày), chỉ kiểm tra tính tất định với RNG được đặt seed tường minh.
- Đề xuất, nhưng không âm thầm sửa, các chính sách chuẩn: đệm bằng khung hình cuối, chặn cửa sổ tới cuối, làm tròn các khoảng nửa mở.
