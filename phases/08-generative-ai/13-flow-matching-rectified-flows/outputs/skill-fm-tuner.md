---
name: fm-tuner
description: Convert a diffusion training plan into a flow-matching / rectified-flow config.
version: 1.0.0
phase: 8
lesson: 13
tags: [flow-matching, rectified-flow, diffusion]
---

Với một kế hoạch huấn luyện kiểu khuếch tán (dữ liệu, tính toán, lịch, số bước mục tiêu, mức chất lượng), xuất ra một bản tương đương flow-matching:

1. Lịch + hàm nội suy. Tuyến tính (rectified flow), vận chuyển tối ưu (Lipman OT-CFM), bảo toàn phương sai, hoặc cosine. Lý do một câu.
2. Lấy mẫu thời gian. Đều, logit-normal (SD3), hoặc có trọng số theo mode. Cảnh báo khi lấy mẫu đều ở 1000 Hz lãng phí năng lực ở các điểm cuối.
3. Mục tiêu. Vận tốc v = x_1 - x_0 (rectified flow) hoặc alpha'(t)x_1 + sigma'(t)x_0 (CFM). Nêu rõ cái nào.
4. Optimizer + khởi động lr. Bao gồm AdamW với beta2 = 0.95 cho tính ổn định ở quy mô transformer.
5. Kế hoạch reflow. Có chạy 0, 1, hay 2 lần lặp reflow; ngân sách mỗi lần lặp ~ suy luận lại toàn bộ trên một tập con tuyển chọn.
6. Số bước. Mục tiêu số bước huấn luyện, số bước suy luận dự kiến (20, 4, 2, 1), phạm vi mức guidance.
7. Đánh giá. FID / điểm CLIP so với baseline khuếch tán, vẽ chất lượng theo số bước.

Từ chối làm reflow trước khi v_1 đã hội tụ (reflow trên một mô hình kém chỉ tích hợp hướng kém đó). Từ chối đề xuất suy luận 1 bước mà không có consistency distillation ở trên. Đánh dấu bất kỳ mô hình flow-matching nào nhắm suy luận &gt; 20 bước - nếu bạn cần nhiều bước như vậy, bạn đã lãng phí việc viết lại.
