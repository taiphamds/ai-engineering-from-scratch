---
name: runtime-shape
description: Pick a production runtime shape (request-response, streaming, queue, event, cron, durable) and wire observability.
version: 1.0.0
phase: 14
lesson: 29
tags: [production, runtime, queue, event, durable, observability]
---

Với một loại tác vụ (thời lượng được mong đợi, số bước, loại kích hoạt, ngân sách độ trễ), chọn hình dạng runtime.

Quyết định:

1. < 30 giây, người dùng chờ -> **yêu cầu-phản hồi**.
2. UX dần dần hoặc giọng nói -> **streaming**.
3. Vài phút đến vài giờ, người dùng không chờ -> **dựa trên hàng đợi**.
4. Phản ứng với các sự kiện bên ngoài -> **hướng sự kiện**.
5. Bảo trì định kỳ -> **cron**.
6. Bất kỳ điều nào ở trên mà chi phí khởi động lại cao -> thêm **thực thi bền vững**.

Tạo:

1. Khung hình dạng trong stack của bạn.
2. Khả năng quan sát: các span OTel GenAI (Bài 23), backend được nối (Bài 24).
3. Với hàng đợi: DLQ + chính sách thử lại + thước đo độ sâu hàng đợi.
4. Với sự kiện: sổ đăng ký bên đăng ký tường minh + đường phát lại.
5. Với cron: file khóa hoặc khóa phân tán để ngăn các lần chạy chồng lấp.
6. Với bền vững: backend bộ tạo checkpoint + ngữ nghĩa tiếp tục.

Các trường hợp từ chối cứng:

- HTTP đồng bộ cho một tác vụ 5 phút. Người dùng cúp máy; các worker chồng chất.
- Dựa trên hàng đợi mà không có DLQ. Các job thất bại biến mất.
- Công việc nền mà không xuất trace. Các lỗi vô hình cho đến khi người dùng phàn nàn.
- "Không trạng thái bền vững, chúng tôi chỉ thử lại." Các tầm dài phải tạo checkpoint.

Các quy tắc từ chối:

- Nếu sản phẩm có SLA + các yêu cầu phát lại, từ chối cấu trúc bầy đàn + runtime không bền vững.
- Nếu tác vụ bị ràng buộc tuân thủ, từ chối hướng sự kiện mà không có dấu vết kiểm toán.
- Nếu người dùng muốn cron + không khóa, từ chối. Các lần chạy cron chồng lấp tốt nhất là công việc trùng lặp, tệ nhất là hỏng dữ liệu.

Đầu ra: khung runtime + các hook khả năng quan sát + README với SLA, chính sách thử lại, lựa chọn bộ tạo checkpoint. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 23 (OTel), Bài 24 (khả năng quan sát) hoặc Bài 17 (Managed Agents cho chạy lâu được host).
