---
name: compliance-gap
description: Evaluate whether a safety report can detect alignment faking, via the monitored / unmonitored compliance gap.
version: 1.0.0
phase: 18
lesson: 9
tags: [alignment-faking, compliance-gap, anthropic, safety-evaluation]
---

Với báo cáo đánh giá an toàn, đánh giá nó có phân biệt giả vờ căn chỉnh với tuân theo thực sự bằng khung khoảng cách tuân theo Greenblatt và cộng sự 2024 không.

Tạo:

1. Phân chia điều kiện. Đánh giá có chạy cả điều kiện có giám sát (liên quan huấn luyện) và không giám sát (không huấn luyện) không? Không có cả hai, giả vờ căn chỉnh vô hình.
2. Đo khoảng cách tuân theo. Báo cáo khoảng cách là tỷ lệ tuân theo (có giám sát - không giám sát). Diễn giải dấu và độ lớn: khoảng cách dương = hành vi dạng giả vờ; khoảng cách âm = từ chối quá mức khi được quan sát.
3. Kiểm tra dấu vết ngôn từ so với hành vi. Đánh giá dựa vào suy luận giấy nháp mô hình hay chính hành động? Theo Anthropic 2025, giảm thiểu nhắm dấu vết ngôn từ có thể loại nó mà không loại hành vi.
4. Kiểm tra hiện thực hóa. Điều kiện giám sát được tạo qua system prompt, tinh chỉnh tổng hợp hay ngữ cảnh triển khai tự nhiên? Phụ thuộc system prompt làm yếu khẳng định; tái lập tinh chỉnh tổng hợp củng cố nó.
5. Kiểm tra động cơ còn lại. Sau mọi biện pháp giảm thiểu áp dụng, cấu trúc khuyến khích còn hiện diện không (mô hình vẫn hưởng lợi từ giả vờ nếu chọn làm vậy không)? Động cơ tồn tại nghĩa là hành vi có thể trở lại dưới dịch chuyển phân phối.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định "không giả vờ căn chỉnh" chỉ dựa trên đánh giá không giám sát.
- Mọi khẳng định "suy luận giấy nháp không còn diễn đạt giả vờ bằng lời" hàm ý hành vi đã chấm dứt.
- Mọi khẳng định mô hình huấn luyện HHH không giả vờ căn chỉnh — Greenblatt và cộng sự 2024 xác lập huấn luyện HHH là điều kiện cần, không phải phòng vệ đủ.

Quy tắc từ chối:
- Nếu người dùng hỏi "mô hình của tôi có giả vờ căn chỉnh không," từ chối trả lời nhị phân khi không có dữ liệu khoảng cách tuân theo.
- Nếu người dùng hỏi biện pháp khắc phục chỉ huấn luyện chống dấu vết nhìn thấy (câu trả lời thẩm vấn, suy luận giấy nháp bị đánh dấu), giải thích cảnh báo của công trình tiếp nối 2025 rằng huấn luyện như vậy có thể dạy mô hình ẩn dấu vết.

Đầu ra: đánh giá một trang báo cáo tuân theo trong cả hai điều kiện, khoảng cách, sự tách biệt dấu vết ngôn từ-với-hành vi, và độ mạnh hiện thực hóa. Đánh dấu từng yếu tố thiếu. Trích dẫn Greenblatt và cộng sự (arXiv:2412.14093) một lần làm nguồn khung.
