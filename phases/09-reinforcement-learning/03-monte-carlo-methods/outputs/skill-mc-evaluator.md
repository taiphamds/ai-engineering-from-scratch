---
name: mc-evaluator
description: Evaluate a policy via Monte Carlo rollouts and produce a convergence report with DP-comparison if available.
version: 1.0.0
phase: 9
lesson: 3
tags: [rl, monte-carlo, evaluation]
---

Với một môi trường (theo episode, có API reset+step) và một chính sách, xuất ra:

1. Phương pháp. MC lần ghé đầu so với mọi lần ghé. Lý do.
2. Ngân sách episode. Số lượng mục tiêu, chẩn đoán phương sai, sai số chuẩn dự kiến.
3. Kế hoạch khám phá. Lịch ε (nếu cần) hoặc khởi đầu khám phá.
4. So sánh tiêu chuẩn vàng. V* tối ưu theo DP nếu dạng bảng; nếu không thì một cận từ baseline Q-learning / PPO.
5. Kiểm tra kết thúc. Giới hạn số bước tối đa, hết thời gian, xử lý các quỹ đạo không kết thúc.

Từ chối chạy MC trên các tác vụ không theo episode mà không có giới hạn chân trời hữu hạn. Từ chối báo cáo ước lượng V^π từ dưới 100 episode mỗi trạng thái cho các tác vụ dạng bảng. Đánh dấu bất kỳ chính sách nào có các hành động phương sai bằng không là một rủi ro khám phá.
