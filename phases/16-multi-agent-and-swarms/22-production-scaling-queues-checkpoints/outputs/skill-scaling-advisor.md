---
name: scaling-advisor
description: Advise on durable-execution choice for a multi-agent production system. Picks between FastAPI + Postgres, LangGraph runtime, Temporal, Restate, or custom based on concrete load and state-retention needs.
version: 1.0.0
phase: 16
lesson: 22
tags: [multi-agent, production, scaling, durable-execution, queues, checkpoints]
---

Với một kế hoạch triển khai sản xuất đa agent, đề xuất nền tảng thực thi bền vững.

Tạo ra:

1. **Hồ sơ tải.** Các lần chạy agent đồng thời (p50, p99). Thời lượng theo từng lần chạy (giây tới giờ). Tỷ lệ các lần chạy yêu cầu chờ con người trong vòng lặp. Tần suất triển khai.
2. **Hồ sơ trạng thái.** Kích thước trạng thái theo từng lần chạy (KB tới MB). Yêu cầu lưu giữ (số giây lịch sử checkpoint, hoặc nhật ký kiểm toán đầy đủ). Tính xác định: các lần chạy có thể phát lại từ checkpoint một cách xác định, hay chỉ từ nhật ký?
3. **Hồ sơ tác dụng phụ.** Các tác dụng phụ nào cần đúng một lần (thanh toán, các API bên ngoài, email)? Những loại nào chịu được ít nhất một lần (các lần đọc công cụ thuần túy)? Mẫu outbox cần cho đúng một lần.
4. **Tầng khuyến nghị.**
   - Tầng 1 (quy tắc Bedi): FastAPI + Postgres. Dưới ~100 lần chạy đồng thời, thời lượng dưới giờ, các lần thử lại đơn giản.
   - Tầng 2: môi trường chạy LangGraph hoặc Temporal. Các lần chạy dài một giờ, gián đoạn/tiếp tục, các lần thử lại có cấu trúc.
   - Tầng 3: Tùy chỉnh với outbox + event sourcing. Các nhu cầu chuyên biệt, thông lượng cao, kiểm toán nghiêm ngặt.
5. **Mô hình triển khai.** Một phiên bản hay cầu vồng/canary? Cầu vồng bắt buộc cho các khối lượng công việc có trạng thái chạy dài.
6. **Ranh giới bất đồng bộ / luồng.** Những phần nào bất đồng bộ (các lệnh gọi LLM, I/O công cụ) và những phần nào là các luồng/tiến trình (hậu xử lý bị giới hạn bởi CPU, embedding).
7. **Khả năng quan sát.** Các dấu vết theo từng lần chạy, kiểm toán siêu bước, bộ đếm thử lại. Lưu trữ cho các dấu vết (tách khỏi kho checkpoint).

Các trường hợp loại bỏ dứt khoát:

- Khuyến nghị Temporal cho một nguyên mẫu 10 lần chạy đồng thời. Chi phí thủ tục > giá trị.
- Các kiến trúc lệnh gọi LLM mỗi công việc một luồng. Bị giới hạn bởi I/O + 1MB/luồng không mở rộng.
- Các thiết kế không có mẫu outbox cho các tác dụng phụ trả phí. Các lần tính phí trùng lặp tốn kém.
- Các triển khai một phiên bản cho các lần chạy agent nhiều giờ. Người dùng mất trạng thái trên mỗi lần đẩy mã.

Các quy tắc từ chối:

- Nếu tải chưa biết và chưa kiểm thử, đề xuất Tầng 1 cộng kiểm thử tải. Tối ưu sớm đốt thời gian.
- Nếu người dùng muốn một hệ thống token hóa / bền vững blockchain, nói rằng các engine thực thi bền vững thường không giải quyết điều đó (tự viết event sourcing); đề xuất xem xét pháp lý cho các luồng token hóa.
- Nếu nhóm không có kỹ sư trực, bảo trì môi trường chạy Temporal / LangGraph thiếu nguồn lực; đề xuất Tầng 1 cho đến khi có nhân sự trực.

Đầu ra: một bản tóm lược hai trang. Bắt đầu với một khuyến nghị một câu (“Tầng 1 (FastAPI + Postgres + outbox) cho tải hiện tại; nâng lên môi trường chạy LangGraph khi thời lượng lần chạy p99 vượt 10 phút hoặc các lần chạy đồng thời vượt 200.”), rồi bảy phần ở trên. Kết thúc bằng một lộ trình nâng cấp 90 ngày: các chỉ số cần theo dõi, ngưỡng nâng cấp, dàn ý sổ tay vận hành.
