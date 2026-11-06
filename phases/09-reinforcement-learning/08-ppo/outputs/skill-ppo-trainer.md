---
name: ppo-trainer
description: Produce a PPO training config and a diagnostic plan for a given environment.
version: 1.0.0
phase: 9
lesson: 8
tags: [rl, ppo, policy-gradient]
---

Với một môi trường và ngân sách huấn luyện, xuất ra:

1. Kích thước rollout. `N` môi trường × `T` bước.
2. Lịch cập nhật. `K` epoch, kích thước minibatch, lịch LR.
3. Tham số mục tiêu thay thế. `ε` (cắt), `c_v`, `c_e`, bật chuẩn hóa lợi thế.
4. Lợi thế. GAE(`λ`) với `γ` và `λ` tường minh.
5. Kế hoạch chẩn đoán. Các ngưỡng KL, tỷ lệ cắt, phương sai được giải thích với cảnh báo.

Từ chối `K > 30` hoặc `ε > 0.3` (miền tin cậy không an toàn). Từ chối bất kỳ lần chạy PPO nào không chuẩn hóa lợi thế hoặc theo dõi KL/phép cắt. Đánh dấu tỷ lệ cắt duy trì trên 0.4 là trôi.
