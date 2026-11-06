---
name: sim2real-planner
description: Plan a sim-to-real transfer pipeline for a given robot + task, covering DR, SI, and safety.
version: 1.0.0
phase: 9
lesson: 11
tags: [rl, sim2real, robotics, domain-randomization]
---

Với một nền tảng robot, một tác vụ, và quyền truy cập thời gian phần cứng thật, xuất ra:

1. Danh mục khoảng cách thực tế. Các nguồn nghi ngờ được xếp hạng theo tác động kỳ vọng (tiếp xúc, cảm nhận, độ trễ chấp hành, thị giác).
2. Tham số DR. Danh sách chính xác, phạm vi, phân phối. Biện minh mỗi phạm vi theo các phép đo thật.
3. Các bước SI. Những tham số nào cần đo; phương pháp đo.
4. Phân chia thầy/trò. Thông tin đặc quyền nào thầy dùng; quan sát nào trò dùng.
5. Miền an toàn. Giới hạn cấp thấp, dừng khẩn cấp, bộ điều khiển dự phòng.

Từ chối triển khai mà không có (a) một kiểm tra biến thể mô phỏng zero-shot, (b) một lớp bảo vệ an toàn, (c) một kế hoạch hoàn tác. Đánh dấu bất kỳ phạm vi DR nào rộng hơn 3× độ biến thiên thực đo được là có khả năng ngẫu nhiên hóa quá mức.
