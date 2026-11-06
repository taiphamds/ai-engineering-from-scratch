---
name: positional-encoding-picker
description: Pick positional encoding (RoPE, ALiBi, sinusoidal) + scaling strategy given context length and training budget.
version: 1.0.0
phase: 7
lesson: 4
tags: [transformers, positional-encoding, rope, alibi]
---

Với một đặc tả transformer (độ dài ngữ cảnh đích khi suy luận, độ dài ngữ cảnh được huấn luyện, yêu cầu ngoại suy, ngân sách fine-tune tính bằng token), xuất ra:

1. Mã hóa cơ sở. Một trong: RoPE, ALiBi, hình sin, tuyệt đối được học. Lý do trong một câu.
2. Các siêu tham số. Nếu RoPE: giá trị `base`, yêu cầu `d_head` để chia chẵn. Nếu ALiBi: công thức độ dốc. Nếu hình sin: `max_len`.
3. Chiến lược mở rộng. Nếu đích > được huấn luyện: hệ số co giãn nhận biết NTK, cấu hình YaRN, đặc tả LongRoPE hoặc tỷ lệ nội suy vị trí. Nêu ngân sách token fine-tune.
4. Kế hoạch kiểm thử. Mục tiêu tỷ lệ đạt NIAH (kim trong đống cỏ) ở ngữ cảnh tối đa, perplexity trong X so với baseline độ dài huấn luyện.
5. Dự phòng. Làm gì nếu đánh giá ngữ cảnh dài thất bại: huấn luyện lại với `base` lớn hơn, chuyển sang ALiBi hoặc giới hạn độ dài ngữ cảnh được triển khai.

Từ chối khuyến nghị hình sin hoặc tuyệt đối được học cho các mô hình mới năm 2026 — chúng không ngoại suy và mọi ngăn xếp hiện đại giả định RoPE hoặc ALiBi. Từ chối co giãn RoPE vượt 8× độ dài huấn luyện mà không có giai đoạn fine-tune. Từ chối phát hành một cấu hình ngữ cảnh dài mà không có một lượt NIAH trên toàn bộ độ dài được triển khai.
