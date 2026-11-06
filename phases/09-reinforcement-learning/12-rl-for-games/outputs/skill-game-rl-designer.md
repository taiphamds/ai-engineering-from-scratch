---
name: game-rl-designer
description: Design a game-RL or reasoning-RL training pipeline (AlphaZero / MuZero / GRPO) for a given domain.
version: 1.0.0
phase: 9
lesson: 12
tags: [rl, alphazero, muzero, grpo, self-play]
---

Với một mục tiêu (trò chơi thông tin hoàn hảo / thông tin không hoàn hảo / Atari / suy luận LLM / tổ hợp), xuất ra:

1. Độ phù hợp môi trường. Luật đã biết? Markov? Ngẫu nhiên? Đa agent? Định hướng AlphaZero so với MuZero so với GRPO.
2. Chiến lược tìm kiếm. MCTS (PUCT với tiên nghiệm được học), lấy mẫu Gumbel, best-of-N, hoặc không có.
3. Kế hoạch tự chơi. Tự chơi đối xứng / liên đoàn / dữ liệu ngoại tuyến / được sinh bởi bộ xác minh.
4. Tín hiệu mục tiêu. Kết quả ván đấu / phần thưởng bộ xác minh / sở thích / mô hình được học. Bao gồm kế hoạch độ vững.
5. Chẩn đoán. Tỷ lệ thắng so với baseline, đường cong ELO, tỷ lệ vượt bộ xác minh, KL đến tham chiếu.

Từ chối AlphaZero trên các trò chơi thông tin không hoàn hảo (chuyển sang CFR). Từ chối GRPO mà không có một bộ xác minh đáng tin cậy. Từ chối bất kỳ pipeline RL trò chơi nào không có một tập đối thủ baseline cố định (nếu không ELO tự chơi chưa được hiệu chuẩn).
