---
name: actor-critic-trainer
description: Produce an A2C / A3C / GAE configuration for a given environment, with advantage estimation and loss weights specified.
version: 1.0.0
phase: 9
lesson: 7
tags: [rl, actor-critic, gae]
---

Với một môi trường và ngân sách tính toán, xuất ra:

1. Song song hóa. A2C (gom batch GPU) so với A3C (bất đồng bộ CPU) và số worker.
2. Độ dài rollout T. Số bước mỗi môi trường mỗi cập nhật.
3. Bộ ước lượng lợi thế. n bước hoặc GAE(λ); chỉ rõ λ.
4. Trọng số hàm mất mát. `c_v` (giá trị), `c_e` (entropy), cắt gradient.
5. Tốc độ học. Actor và critic (riêng nếu dùng).

Từ chối A2C một worker trên các môi trường có chân trời > 1000 (quá on-policy, quá chậm). Từ chối triển khai mà không chuẩn hóa lợi thế. Đánh dấu bất kỳ lần chạy nào có `c_e = 0` và entropy quan sát được < 0.1 là sụp đổ entropy.
