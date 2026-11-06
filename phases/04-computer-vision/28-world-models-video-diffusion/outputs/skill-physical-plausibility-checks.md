---
name: skill-physical-plausibility-checks
description: Automated checks for object permanence, gravity, and continuity on any generated video before shipping
version: 1.0.0
phase: 4
lesson: 28
tags: [video-generation, quality, physics, evaluation]
---

# Physical Plausibility Checks

Các triển khai video được sinh trong môi trường production cần các biện pháp bảo vệ tự động. Việc rà soát của con người không mở rộng được; các kiểm tra vật lý phát hiện những dạng lỗi kinh điển.

## When to use

- Bất kỳ sản phẩm nào sinh video từ prompt văn bản hoặc hình ảnh.
- Tự động hóa QA trên một API endpoint sinh video.
- Giám sát độ trôi chất lượng của một mô hình video sau khi fine-tuning hoặc cập nhật mô hình cơ sở.

## Inputs

- `video`: một tensor `(T, H, W, 3)` hoặc một đường dẫn đến một mp4.
- Thông tin tham chiếu tùy chọn: số lượng đối tượng dự kiến, mô tả cảnh ban đầu.

## Checks

### 1. Object permanence
Theo dõi mọi phát hiện qua các khung hình bằng SAM 3.1 Object Multiplex. Đánh dấu khi một track ổn định biến mất trong <=3 khung hình rồi xuất hiện lại — mô hình đã tạm thời mất đối tượng. Đánh giá không đạt nghiêm trọng khi một đối tượng biến mất gần tâm khung hình (không phải ở một cạnh); đánh giá không đạt nhẹ ở các cạnh.

### 2. Motion smoothness
Optical flow giữa các khung hình liên tiếp phải hầu như liên tục. Các đột biến flow đột ngột trên từng pixel cho thấy sự dịch chuyển tức thời. Tính flow bằng RAFT; đánh dấu các khung hình mà độ lớn flow ở phân vị thứ 99 vượt trung vị với hệ số > 10.

### 3. Gravity / support
Đối với các đối tượng được phát hiện là vật rắn (thức ăn, bóng, dụng cụ), kiểm tra rằng vị trí thẳng đứng của chúng không tăng khi không có hành động nâng. Đánh dấu sự trôi lên trừ khi phát hiện một "bàn tay đang nắm" gần đối tượng.

### 4. Identity consistency
Đối với người hoặc nhân vật, sử dụng một embedding nhận dạng khuôn mặt xuyên suốt các khung hình. Cosine similarity phải duy trì > 0.8 trên các cửa sổ 5 khung hình để danh tính được duy trì. Dưới ngưỡng nghĩa là nhân vật đã biến dạng.

### 5. Hands and limbs
Chạy một bộ ước lượng tư thế (Bài 21). Đánh dấu các khung hình mà một bàn tay có > 5 hoặc < 4 ngón tay nhìn thấy được; mà độ dài một cánh tay tăng gấp đôi giữa các khung hình; mà các chi giao cắt với cơ thể xuyên qua một bề mặt.

### 6. Text rendering (if prompt asked for text)
Nếu prompt của người dùng chứa một chuỗi trong dấu ngoặc kép, thực hiện OCR các khung hình được sinh và tính CER so với chuỗi được yêu cầu. Đánh dấu CER > 20%.

## Report

```
[plausibility]
  video frames:           <T>
  permanence violations:  <N>
  smoothness violations:  <N>
  gravity violations:     <N>
  identity drift:         <N of 5-frame windows>
  limb anomalies:         <N>
  OCR CER vs requested:   <float>

[verdict]
  ship | hold | reject

[samples for review]
  frame ranges where each failure occurred
```

## Rules

- Không chặn cứng dựa trên bất kỳ kiểm tra đơn lẻ nào; tổng hợp điểm và giữ video để rà soát khi tổng số bất thường vượt một ngưỡng.
- Gán trọng số cao nhất cho độ trôi danh tính và các vi phạm tính thường tồn — người dùng nhận ra chúng trước tiên.
- Ghi nhật ký tỷ lệ không đạt của từng kiểm tra theo thời gian; xu hướng tăng thường có nghĩa là mô hình cơ sở đã được cập nhật hoặc phân phối prompt đã dịch chuyển.
- Không bao giờ xóa video bị đánh dấu; giữ lại để gỡ lỗi mô hình và phân tích sau sự cố.
- Đối với nội dung nhạy cảm (người, trẻ em, nhân vật công chúng), yêu cầu con người rà soát mọi video bất kể điểm số.
