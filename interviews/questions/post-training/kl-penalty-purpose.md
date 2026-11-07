---
id: kl-penalty-purpose
title: What the KL penalty in RLHF protects
card: post-training
kind: concept
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [ml-depth]
tags: [rlhf, kl-penalty, reward-hacking, ppo, alignment-tax]
minutes: 10
lessons: [phases/09-reinforcement-learning/09-reward-modeling-rlhf, phases/10-llms-from-scratch/07-rlhf, phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal]
manuals: []
practice: [ppo-clip-loss]
cheatsheet: [rlhf-dpo, alignment-training]
related: [post-training/reward-model-pairwise]
updated: 2026-11-03
---

Trong giai đoạn PPO của RLHF, mục tiêu trừ một số hạng KL giữa policy và một bản sao đóng băng của mô hình SFT. Một người mới hỏi tại sao pipeline giữ một bản sao thứ hai của mô hình trong bộ nhớ cho một số hạng đó. Giải thích lỗi nó ngăn và cách bạn tinh chỉnh hệ số.

## Short answer

Reward model được huấn luyện trên các câu trả lời trông như đầu ra SFT. Không có số hạng, PPO chuyển policy vào các vùng reward model chưa bao giờ thấy và tìm các chuỗi đạt điểm cao nhưng con người không thích. Số hạng tính phí policy khi rời phân phối SFT, nên nó là một regularizer, không phải một ràng buộc cứng. Tinh chỉnh beta từ KL đo được: quá thấp và reward tăng cùng KL, quá cao và policy hầu như không rời SFT.

## Full answer

### The objective

```text
maximize  E[ R(x, y) ]  -  beta * KL( policy(. | x) || reference(. | x) )
```

Reference là checkpoint SFT, đóng băng. Reward model chấm toàn bộ câu trả lời; KL được lấy tổng trên các token của mỗi câu trả lời và trừ khỏi reward.

### Without the KL term

Reward model là một phép khớp hữu hạn với preference con người và có điểm mù. Các cụm từ lặp báo hiệu tính hữu ích, văn bản trang trọng dài dòng không nội dung, gạch đầu dòng khắp nơi: mỗi loại đạt điểm cao trong các pipeline thật. Không có neo, policy sụp về một vài mode reward cao. Pipeline ba giai đoạn đồ chơi trong bài học InstructGPT cho thấy điều này trong 50 bước cập nhật khi beta bằng 0.

### Reading the KL

Theo dõi KL trung bình mỗi câu trả lời trên mọi cập nhật. Bài học về reward modeling đưa ra 5 đến 10 nat, lấy tổng trên token, là điểm policy đã trôi xa SFT: hoặc beta quá thấp, hoặc reward hacking đã bắt đầu.

### Tuning beta

Các giá trị tham chiếu: 0.01 đến 0.05 trong bài học reward modeling, 0.02 trong pipeline bài học RLHF mô tả. Thủ thuật thông dụng là một beta thích nghi với một KL mục tiêu. Khi KL quan sát vượt mục tiêu, beta tăng gấp đôi; khi nó giảm dưới một nửa mục tiêu, beta giảm một nửa. Thư viện bài học cho thấy dùng một mục tiêu 6.0 với bộ điều khiển thích nghi bật.

### The second anchor

KL bảo vệ phong cách và phân phối. Nó không bảo vệ kỹ năng benchmark mà reward không bao giờ hỏi. Sự giảm đó là alignment tax, và cách sửa trộn các gradient pretraining vào mục tiêu RL.

## Follow-ups

- **Level 2:** Tại sao số hạng là một regularizer và không phải một trust region? Expected: nó thêm một chi phí tăng theo khoảng cách; không gì ngăn policy trả nó, nên một reward lớn vẫn có thể mua một di chuyển lớn.
- **Level 2:** Hai điều gì phải đúng về reference model trong mã? Expected: các trọng số của nó không bao giờ nhận gradient, và nó không bao giờ chia sẻ tham số với policy; một module dùng chung âm thầm loại bỏ neo.
- **Level 3:** Reward tăng, KL tăng, và đánh giá con người giữ phẳng. Núm nào trước? Expected: tăng beta hoặc dừng sớm; rồi mở rộng dữ liệu huấn luyện reward model để vùng bị khai thác được bao phủ.
- **Level 3:** Sau RLHF, mô hình đạt điểm thấp hơn trên các benchmark đọc hiểu. Đó có phải công việc của KL? Expected: không; đó là alignment tax, được giải quyết bằng một số hạng log-likelihood pretraining trong mục tiêu, như biến thể PPO-ptx làm.

## Wrong answers

- "Bỏ reference model để tiết kiệm bộ nhớ và clip tỷ số PPO mạnh hơn." Clip chặn một cập nhật; nó không chặn sự trôi qua nhiều cập nhật, là điều KL làm.
- "Đặt beta cao cho chắc." Một beta cao ghim policy vào SFT, và lần chạy không mua được gì cho tính toán của nó.
- "KL là một bộ lọc an toàn cho văn bản có hại." Nó đo khoảng cách từ phân phối SFT và không biết gì về nội dung; một reference an toàn là điều khiến nó hữu ích.

## Taught in

[Bài học reward modeling](../../../phases/09-reinforcement-learning/09-reward-modeling-rlhf/) giải thích KL như núm chống reward hacking, [bài học RLHF](../../../phases/10-llms-from-scratch/07-rlhf/) xây mục tiêu có phạt, và [bài học tín hiệu alignment](../../../phases/18-ethics-safety-alignment/01-instruction-following-alignment-signal/) trình bày alignment tax.
