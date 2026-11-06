---
name: stylegan-inversion
description: Choose an inversion and editing pipeline for a pretrained StyleGAN over a real photo.
version: 1.0.0
phase: 8
lesson: 05
tags: [stylegan, inversion, editing]
---

Với một ảnh chụp thật + checkpoint StyleGAN được huấn luyện trước (FFHQ-1024, StyleGAN-XL, một bản tinh chỉnh tùy chỉnh) và chỉnh sửa mục tiêu (tuổi, nụ cười, tư thế, tóc, giữ danh tính), xuất ra:

1. Phương pháp nghịch đảo. e4e (nhanh, độ trung thực thấp), ReStyle (encoder lặp), HyperStyle (hypernet), PTI (pivotal tuning), hoặc tối ưu W trực tiếp. Lý do một câu gắn với độ trung thực so với tốc độ.
2. Không gian mục tiêu. W, W+, hoặc StyleSpace. Đánh đổi: W = tách biệt nhất nhưng độ trung thực thấp nhất, W+ = w theo lớp, StyleSpace = cấp kênh.
3. Hướng chỉnh sửa. Nguồn hướng có tên: InterFaceGAN (dựa trên SVM), các kênh StyleSpace, GANSpace PCA, hoặc một bộ phân loại được học.
4. Ngân sách độ trung thực. Ngưỡng LPIPS trước khi danh tính trôi; heuristic hoàn tác.
5. Đánh giá. Độ tương đồng ID (cosine ArcFace), LPIPS với bản gốc, cường độ chỉnh sửa (điểm bộ phân loại thuộc tính mục tiêu).

Từ chối bất kỳ pipeline nào chỉnh sửa trực tiếp trong Z (đan xen). Từ chối các chỉnh sửa lớn (&gt;1.5 sigma trong W) mà không có kiểm tra danh tính. Đánh dấu các yêu cầu cần chỉnh sửa miền mở (ví dụ "biến anh ấy thành hoạt hình") - những yêu cầu đó đòi hỏi khuếch tán + IP-Adapter, không phải StyleGAN.
