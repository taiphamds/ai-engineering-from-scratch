---
name: eval-suite
description: Build a three-layer eval suite (static benchmarks, custom offline, online production) with evaluator-optimizer loop and CI gates.
version: 1.0.0
phase: 14
lesson: 30
tags: [evaluation, ci, regression, benchmarks, llm-judge]
---

Với một sản phẩm agent, xây dựng một bộ đánh giá ba lớp được nối vào CI.

Tạo:

1. **Lớp benchmark tĩnh** — ít nhất một benchmark liên quan (SWE-bench Verified cho mã, BFCL V4 cho sử dụng công cụ, WebArena cho web, OSWorld cho máy tính để bàn, GAIA cho tổng quát). Luôn báo cáo điểm được kiểm toán bằng + bên cạnh.
2. **Lớp ngoại tuyến tùy chỉnh** — ít nhất một bảng tiêu chí giám khảo LLM được chấm điểm trên các chiều dành riêng cho miền (thực tế, giọng điệu, phạm vi, chất lượng từ chối). Ít nhất một trường hợp dựa trên thực thi thăm dò trạng thái thực tế sau khi agent chạy. Ít nhất một trường hợp dựa trên quỹ đạo với một đường chuẩn.
3. **Lớp đánh giá trực tuyến** — các lần phát lại phiên, các cảnh báo được kích hoạt bởi chốt bảo vệ, theo dõi chi phí/độ trễ cho từng bước qua các span OTel GenAI (Bài 23).
4. **Trình chạy bộ đánh giá-bộ tối ưu** — bọc agent trong đề xuất / phán xét / tinh chỉnh với một giới hạn vòng.
5. **Cổng CI** — làm bản dựng thất bại khi hồi quy >=5% so với đường cơ sở. Theo dõi đường cơ sở theo thời gian.
6. **Ánh xạ trường hợp** — mỗi chốt bảo vệ và mỗi quy tắc đã học từ các bài học Giai đoạn 14 có ít nhất một trường hợp.

Các trường hợp từ chối cứng:

- Bộ đánh giá không có đường cơ sở. Bạn không thể phát hiện hồi quy mà không có một tham chiếu.
- Giám khảo LLM không có cơ sở bên ngoài trên các tác vụ thực tế. Mẫu CRITIC (Bài 05) là bắt buộc.
- Các trường hợp chập chờn không có hạt giống được ghim hoặc ảnh chụp trạng thái. Các báo động giả xói mòn sự tin tưởng của nhóm vào các đánh giá.

Các quy tắc từ chối:

- Nếu người dùng muốn "chỉ luồng thành công," từ chối. Mỗi chế độ lỗi (Bài 26) nên có một trường hợp.
- Nếu người dùng muốn "không cổng CI," từ chối cho các sản phẩm tiếp xúc người dùng trả phí. Trôi dạt đánh giá vô hình nếu không.
- Nếu người dùng muốn "tất cả là giám khảo LLM," từ chối trên các tác vụ thực tế và tuân thủ. Các bộ đánh giá dựa trên thực thi hoặc bằng chương trình là bắt buộc ở đó.

Đầu ra: `cases/benchmarks/`, `cases/custom/`, `cases/online/`, `runner.py`, `ci_gate.py`, `README.md` giải thích các bảng tiêu chí, đường cơ sở và bảng ánh xạ Giai đoạn 14. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 24 (khả năng quan sát), Bài 26 (các chế độ lỗi) hoặc Bài 23 (OTel) cho nền tảng.
