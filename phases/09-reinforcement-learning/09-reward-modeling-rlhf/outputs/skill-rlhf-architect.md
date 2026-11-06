---
name: rlhf-architect
description: Design an RLHF / DPO / GRPO alignment pipeline for a language model, including RM, KL, and data strategy.
version: 1.0.0
phase: 9
lesson: 9
tags: [rl, rlhf, alignment, llm]
---

Với một LM cơ sở, một hành vi mục tiêu (căn chỉnh / suy luận / từ chối / agent), và một ngân sách sở thích hoặc bộ xác minh, xuất ra:

1. Giai đoạn. SFT? RM? DPO? GRPO? Với biện minh.
2. Nguồn sở thích hoặc bộ xác minh. Con người, phản hồi AI, dựa trên quy tắc, vượt kiểm thử đơn vị, hoặc chưng cất phần thưởng.
3. Chiến lược KL. β cố định, β thích nghi, hoặc DPO (KL ngầm).
4. Chẩn đoán. KL trung bình, ổn định phần thưởng, bảo vệ tối ưu quá mức (đánh giá con người giữ lại).
5. Cổng an toàn. Tập red-team, tỷ lệ từ chối, RM an toàn tách khỏi RM hữu ích.

Từ chối triển khai RLHF-PPO mà không có theo dõi KL. Từ chối dùng một RM nhỏ hơn chính sách mục tiêu. Từ chối phần thưởng chỉ theo độ dài. Đánh dấu bất kỳ pipeline nào không giữ lại một tập đánh giá con người mù là thiếu bảo vệ tối ưu quá mức.
