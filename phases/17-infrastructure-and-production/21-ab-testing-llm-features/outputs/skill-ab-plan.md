---
name: ab-plan
description: Design an LLM A/B test — pick platform (Statsig or GrowthBook), primary metric, guardrails, sample size with LLM-noise buffer, CUPED, sequential stopping, and multiple-comparison correction.
version: 1.0.0
phase: 17
lesson: 21
tags: [ab-testing, statsig, growthbook, cuped, sequential, benjamini-hochberg, srm]
---

Với thay đổi tính năng (prompt / mô hình / tham số sinh), chỉ số cơ sở, mức tăng kỳ vọng và định hướng nhóm (OSS nguyên bản kho dữ liệu so với SaaS gộp), tạo một kế hoạch A/B.

Tạo:

1. Nền tảng. Statsig (SaaS gộp, OpenAI sở hữu) hoặc GrowthBook (OSS MIT, nguyên bản kho dữ liệu). Giải thích.
2. Chỉ số chính + chốt bảo vệ. Chính là chỉ số bạn đang cố thay đổi; chốt bảo vệ là những thứ không được suy giảm (chi phí/yêu cầu, P99 độ trễ, tỷ lệ từ chối).
3. Cỡ mẫu. Tính lực kiểm định cổ điển × 1.4 (dự phòng tính không xác định của LLM).
4. Thiết kế. Chân trời cố định hoặc tuần tự. Tuần tự nếu bạn kỳ vọng tín hiệu mạnh; cố định nếu thay đổi tinh tế.
5. CUPED. Bật nếu có dữ liệu trước kỳ cho chỉ số chính; chỉ định biến hồi quy.
6. Hiệu chỉnh. Bonferroni cho ít kiểm định; Benjamini-Hochberg cho nhiều kiểm định liên quan.
7. SRM. Yêu cầu kiểm tra SRM trên mọi thí nghiệm; dừng và gỡ lỗi nếu bị đánh dấu.

Các trường hợp loại bỏ dứt khoát:
- Triển khai theo cảm tính. Từ chối — yêu cầu A/B hoặc ngoại lệ không A/B được ghi lại.
- Chạy >5 thí nghiệm trên cùng chỉ số chính mà không BH/Bonferroni. Từ chối — chắc chắn có phát hiện sai.
- Bỏ qua kiểm tra SRM. Từ chối — lỗi phân bổ phổ biến.

Quy tắc từ chối:
- Nếu lưu lượng < 1000 người dùng/tuần cho tính năng, từ chối A/B cố định — thay vào đó yêu cầu bóng + canary (Giai đoạn 17 · 20).
- Nếu chỉ số chính chủ quan (ví dụ: "chất lượng") mà không có đại diện khách quan, yêu cầu đánh giá con người song song.
- Nếu giả thuyết mức tăng nhỏ hơn sàn nhiễu LLM, từ chối — thí nghiệm không thể phát hiện nó với cỡ mẫu thực tế.

Đầu ra: một kế hoạch một trang với nền tảng, chỉ số chính + chốt bảo vệ, cỡ mẫu, thiết kế, CUPED, hiệu chỉnh, chính sách SRM. Kết thúc bằng quy tắc quyết định: chỉ số chính có ý nghĩa thống kê + mọi chốt bảo vệ không âm có ý nghĩa thống kê → triển khai; bất kỳ vi phạm chốt bảo vệ nào → không triển khai bất kể chỉ số chính.
