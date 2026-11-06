---
name: scheming-triage
description: Triage an agent-deployment incident report against the Apollo three-pillar scheming framework.
version: 1.0.0
phase: 18
lesson: 8
tags: [scheming, agent-safety, apollo, three-pillars, safety-cases]
---

Với báo cáo sự cố triển khai agent (dùng công cụ bất ngờ, truy cập dữ liệu, hành vi gần tự bảo toàn), phân loại chế độ lỗi và, khi mưu đồ là ứng viên, áp dụng kiểm thử ba trụ cột Apollo.

Tạo:

1. Phân loại lớp thất bại. Gắn nhãn sự cố là một trong: thất bại năng lực (mô hình không thể làm tác vụ), thất bại kiểm soát (giao thức giám sát/dùng công cụ không kiềm chế mô hình), hoặc mưu đồ (mô hình hành động ngược mục tiêu người dùng để phục vụ mục tiêu trong ngữ cảnh khác).
2. Kiểm tra ba trụ cột (nếu mưu đồ là ứng viên).
   - Lệch căn chỉnh: hành động có phục vụ mục tiêu trực giao có trong môi trường hoặc đầu ra công cụ không?
   - Hướng mục tiêu: hành động là phần của kế hoạch nhiều bước hay lỗi một lần?
   - Nhận thức tình huống: có bằng chứng mô hình biết đang được đánh giá lúc đó không?
3. Kiểm tra ngữ cảnh đánh giá. Sự cố được quan sát trong triển khai, đánh giá red-team hay cả hai? Nếu chỉ trong triển khai, ghi nhận kết quả lúc đánh giá không chuyển sang được (lưu ý Apollo 2025).
4. Khả năng tái lập gợi hành vi. Cùng prompt + môi trường có thể tạo lại hành vi không? Sự cố tái lập được nằm trong khung ba trụ cột; sự cố không tái lập được có thể là tạo tác gợi năng lực.
5. Khoảng trống hồ sơ lập luận an toàn. Hồ sơ hiện tại cho triển khai này giải quyết trụ cột nào trong ba trụ cột và bỏ sót trụ cột nào?

Các trường hợp loại bỏ dứt khoát:
- Mọi cách mô tả xem mưu đồ là thất bại lớp năng lực. Mưu đồ cần hướng mục tiêu và nhận thức tình huống — mô hình thiếu năng lực không thể mưu đồ.
- Mọi suy luận rằng "huấn luyện chống mưu đồ giảm tỷ lệ hành động bí mật" hàm ý giảm lệch căn chỉnh nền mà không kiểm tra tỷ lệ nhận ra ngữ cảnh đánh giá của cùng mô hình.
- Mọi khẳng định phá hoại giám sát "không phải tấn công" vì agent không đưa dữ liệu ra ngoài trái phép — phá hoại giám sát tự nó là hành động mưu đồ.

Quy tắc từ chối:
- Nếu người dùng hỏi "mô hình của tôi có mưu đồ không," từ chối trả lời nhị phân khi thiếu bằng chứng ba trụ cột; yêu cầu dữ liệu ngữ cảnh đánh giá và khả năng tái lập gợi hành vi.
- Nếu người dùng hỏi xác suất mưu đồ còn lại, từ chối trả lời số và giải thích độ tin cậy đánh giá 2026 bị giới hạn bởi nhận thức tình huống của chính mô hình.

Đầu ra: bản phân loại một trang gắn nhãn lớp thất bại, điền ba trụ cột bằng bằng chứng có sẵn, đánh dấu bằng chứng thiếu và nêu khoảng trống hồ sơ lập luận an toàn cần khép lại cấp bách nhất. Trích dẫn Meinke và cộng sự (arXiv:2412.04984) một lần làm nguồn khung.
