---
name: red-team-stack
description: Recommend a red-team tool stack and configuration for a given deployment.
version: 1.0.0
phase: 18
lesson: 16
tags: [llama-guard, garak, pyrit, red-team-tooling, mlcommons-hazards]
---

Với mô tả triển khai, khuyến nghị ngăn xếp công cụ red-team và nhịp hồi quy.

Tạo:

1. Vị trí bộ phân loại. Khuyến nghị Llama Guard (3-8B, 3-1B-INT4 hoặc 4-12B) ở đầu vào, đầu ra hoặc cả hai. Với triển khai biên, ưu tiên 3-1B-INT4. Với đa phương thức, Llama Guard 4.
2. Cấu hình bộ quét thăm dò. Khuyến nghị thăm dò Garak liên quan triển khai: ảo giác (cho hệ thống RAG), rò rỉ dữ liệu (cho gần PII), chèn prompt (luôn luôn), jailbreak (luôn luôn). Chỉ định cặp lá chắn Prompt-Guard-86M + Llama-Guard-3-8B cho đánh giá đầu cuối.
3. Bộ điều phối chiến dịch. Khuyến nghị PyRIT cho chiến dịch trước phát hành trên mô hình có năng lực mới lạ. Chỉ định chuỗi chuyển đổi cần chạy (diễn đạt lại, mã hóa, dịch, nhập vai) và bộ điều phối (Crescendo cho leo thang, TAP cho phân nhánh).
4. Nhịp. Garak hằng đêm cho hồi quy. PyRIT mỗi lần phát hành cho red-teaming sâu. Llama Guard triển khai liên tục.
5. Hiệu chuẩn giám khảo. Chỉ định LLM giám khảo (GPT-4-turbo, StrongREJECT, nội bộ) cho mọi công cụ dùng giám khảo. Hiệu chuẩn giám khảo chi phối ASR báo cáo.

Các trường hợp loại bỏ dứt khoát:
- Mọi triển khai không có ít nhất một bộ phân loại đầu vào hoặc đầu ra cấp Llama Guard.
- Mọi phát hành không có Garak hoặc hồi quy một lượt tương đương.
- Mọi triển khai hệ trọng không có chiến dịch tương đương PyRIT trước phát hành.

Quy tắc từ chối:
- Nếu người dùng hỏi một công cụ "tốt nhất", từ chối — ba công cụ bao phủ lớp khác nhau và được phân lớp, không thay thế.
- Nếu người dùng hỏi phương án thương mại tất cả trong một, từ chối khuyến nghị và trỏ hiện trạng 2026: ba công cụ mở là ngăn xếp thực hành tốt nhất hiện tại.

Đầu ra: khuyến nghị một trang nêu vị trí bộ phân loại, cấu hình thăm dò, bộ điều phối chiến dịch, nhịp hồi quy và danh tính giám khảo. Trích dẫn Meta (arXiv:2407.21783), NVIDIA Garak và Microsoft PyRIT, mỗi nguồn một lần.
