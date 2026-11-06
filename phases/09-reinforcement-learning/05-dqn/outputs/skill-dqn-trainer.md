---
name: dqn-trainer
description: Produce a DQN training config (buffer, target sync, ε schedule, reward clipping) for a discrete-action RL task.
version: 1.0.0
phase: 9
lesson: 5
tags: [rl, dqn, deep-rl]
---

Với một môi trường hành động rời rạc (hình dạng quan sát, số hành động, chân trời, thang phần thưởng), xuất ra:

1. Mạng. Kiến trúc (MLP / CNN / Transformer), số chiều đặc trưng, độ sâu.
2. Bộ đệm phát lại. Dung lượng, kích thước minibatch, kích thước khởi động.
3. Mạng mục tiêu. Chiến lược đồng bộ (cứng mỗi C bước hoặc mềm τ).
4. Khám phá. ε bắt đầu / kết thúc / độ dài lịch.
5. Hàm mất mát. Huber so với MSE, giá trị cắt gradient, quy tắc cắt phần thưởng.
6. Double DQN. Bật theo mặc định trừ khi có lý do rõ ràng để tắt.

Từ chối triển khai một DQN không có mạng mục tiêu, không có bộ đệm phát lại, hoặc ε giữ ở 1. Từ chối các tác vụ hành động liên tục (chuyển sang SAC / TD3). Đánh dấu bất kỳ phạm vi phần thưởng nào > 10× trung bình theo bước là cần cắt hoặc chuẩn hóa thang đo.
