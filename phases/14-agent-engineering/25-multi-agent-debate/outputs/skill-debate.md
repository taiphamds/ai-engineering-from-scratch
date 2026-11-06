---
name: debate
description: Scaffold a multi-agent debate with N debaters, R rounds, configurable topology (full mesh, star, ring), and a convergence rule.
version: 1.0.0
phase: 14
lesson: 25
tags: [debate, multi-agent, society-of-minds, sparse-topology]
---

Với một lớp câu hỏi và mục tiêu độ chính xác, tạo khung một giao thức tranh luận.

Tạo:

1. `Debater` với các prompt khác nhau (và lý tưởng là các mô hình khác nhau) để tránh đồng nhất hóa.
2. Trình chạy vòng: cấu trúc lưới đầy đủ, hình sao hoặc vòng.
3. Quy tắc hội tụ: bỏ phiếu đa số, có trọng số theo độ tin cậy hoặc siêu đa số với phương án dự phòng.
4. Bất đồng bắt buộc vòng 1: mọi bên tranh luận trả về một đề xuất khác biệt nếu có thể.
5. Hạch toán chi phí: tổng thao tác phê bình + chi phí token cho mỗi câu hỏi.

Các trường hợp từ chối cứng:

- Mọi bên tranh luận với cùng prompt VÀ cùng mô hình. Bảo đảm tư duy nhóm.
- Lưới đầy đủ với N >= 6 mà không kiểm tra chi phí. Các thao tác tranh luận tăng theo O(N*R).
- Không có quy tắc hội tụ. Trả về câu trả lời vòng R của bên tranh luận 0 không phải hội tụ.

Các quy tắc từ chối:

- Nếu sản phẩm nhạy cảm độ trễ (ngân sách <1 giây), từ chối tranh luận. Thay vào đó sử dụng Self-Refine (Bài 05) hoặc bỏ phiếu song song (Bài 12).
- Nếu lớp câu hỏi là tra cứu sự thật đơn giản (thủ đô, ngày, định nghĩa), từ chối tranh luận. Tra cứu + CRITIC (Bài 05) rẻ hơn.
- Nếu các bên tranh luận không có bất đồng sau vòng 1 trên bất kỳ câu hỏi nào trong tập đánh giá, từ chối giao thức. Bạn cần sự đa dạng mô hình/prompt.

Đầu ra: `debater.py`, `topology.py`, `convergence.py`, `runner.py`, `README.md` giải thích lựa chọn N/R, lý do cấu trúc và các phép đo chi phí so với độ chính xác trên tập đánh giá. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 12 (các mẫu workflow) nếu tác vụ đơn giản hơn, hoặc Bài 28 (các mẫu điều phối) để nhúng tranh luận vào một hệ thống lớn hơn.
