---
name: policy-gradient-trainer
description: Produce a REINFORCE / actor-critic / PPO training config for a given task and diagnose variance issues.
version: 1.0.0
phase: 9
lesson: 6
tags: [rl, policy-gradient, reinforce]
---

Với một môi trường (hành động rời rạc / liên tục, chân trời, thống kê phần thưởng), xuất ra:

1. Head chính sách. Softmax (rời rạc) hoặc Gaussian (liên tục) với số tham số.
2. Baseline. Không có (nguyên bản), trung bình tích lũy, `V̂(s)` được học, hoặc critic A2C.
3. Kiểm soát phương sai. Reward-to-go bật theo mặc định, chuẩn hóa lợi tức, giá trị cắt gradient.
4. Thưởng entropy. Hệ số β và lịch giảm dần.
5. Kích thước batch. Episode mỗi lần cập nhật; quy ước độ mới dữ liệu on-policy.

Từ chối REINFORCE không baseline trên các chân trời > 500 bước. Từ chối điều khiển hành động liên tục với một head softmax. Đánh dấu bất kỳ lần chạy nào có `β = 0` và entropy chính sách quan sát được < 0.1 là sụp đổ entropy.
