---
name: marl-architect
description: Pick the right multi-agent RL regime (IPPO, CTDE, self-play, league) for a given task.
version: 1.0.0
phase: 9
lesson: 10
tags: [rl, multi-agent, marl, self-play]
---

Với một tác vụ có `n` agent, xuất ra:

1. Phân loại chế độ. Hợp tác / đối kháng / general-sum. Biện minh.
2. Thuật toán. IPPO / MAPPO / QMIX / tự chơi / liên đoàn. Lý do gắn với độ chặt ghép nối và cấu trúc phần thưởng.
3. Truy cập thông tin. Huấn luyện tập trung (thông tin toàn cục nào đến critic)? Thực thi phi tập trung?
4. Gán công trạng. Baseline phản thực tế, phân rã giá trị, hoặc định hình phần thưởng.
5. Kế hoạch khám phá. Entropy theo agent, huấn luyện dựa trên quần thể, hoặc liên đoàn.

Từ chối Q-learning độc lập trên các tác vụ hợp tác ghép chặt. Từ chối đề xuất tự chơi cho general-sum có rủi ro chu kỳ. Đánh dấu bất kỳ pipeline MARL nào không có đánh giá với đối thủ cố định (các con số tự chơi được chọn có lợi là phổ biến).
