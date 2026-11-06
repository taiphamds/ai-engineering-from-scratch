---
name: td-agent
description: Pick between Q-learning, SARSA, Expected SARSA for a tabular or small-feature RL task.
version: 1.0.0
phase: 9
lesson: 4
tags: [rl, td-learning, q-learning, sarsa]
---

Với một môi trường dạng bảng hoặc ít đặc trưng, xuất ra:

1. Thuật toán. Q-learning / SARSA / Expected SARSA / biến thể n bước. Lý do một câu gắn với on-policy so với off-policy và phương sai.
2. Siêu tham số. α, γ, ε, lịch giảm dần.
3. Khởi tạo. Giá trị Q_0 (lạc quan so với không) và biện minh.
4. Chẩn đoán hội tụ. Đường cong học mục tiêu, kiểm tra `|Q - Q*|` nếu DP khả thi.
5. Lưu ý triển khai. Khám phá sẽ hành xử thế nào khi suy luận? Có cần tính bảo thủ của SARSA không?

Từ chối áp dụng TD dạng bảng cho các không gian trạng thái > 10⁶. Từ chối triển khai một agent Q-learning mà không có lưu ý về độ chệch max. Đánh dấu bất kỳ agent nào được huấn luyện với ε giữ ở 1.0 suốt quá trình (không có giai đoạn khai thác).
