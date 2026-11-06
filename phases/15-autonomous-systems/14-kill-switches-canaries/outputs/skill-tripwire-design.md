---
name: tripwire-design
description: Review a proposed agent detector stack (kill switch, circuit breakers, canary tokens) and flag missing tripwires before the first autonomous run.
version: 1.0.0
phase: 15
lesson: 14
tags: [kill-switch, circuit-breaker, canary, honeytoken, detection-and-response]
---

Với một ngăn xếp bộ phát hiện được đề xuất cho một triển khai agent, kiểm toán nó theo tham chiếu ba bộ phát hiện (công tắc ngắt, bộ ngắt mạch, canary) và đánh dấu những gì còn thiếu, điều chỉnh sai, hoặc bị lộ cho agent.

Tạo ra:

1. **Kiểm toán công tắc ngắt.** Công tắc nằm ở đâu (cờ tính năng, Redis, cấu hình có chữ ký)? Xác nhận thông tin xác thực của agent không thể đặt nó tắt. Xác nhận mọi hành động có hệ quả đều kiểm tra công tắc, chứ không chỉ khởi động. Xác nhận bật lại là một hành động tường minh của con người.
2. **Danh mục bộ ngắt mạch.** Liệt kê mọi mẫu mà một bộ ngắt theo dõi (sự lặp lại, các thất bại liên tiếp, tốc độ, công cụ cụ thể sau lần đọc ngoài vùng tin cậy). Nêu ngưỡng và thời gian hạ nhiệt cho mỗi mẫu. Các ngưỡng trên 10 thường quá lỏng.
3. **Thiết kế canary.** Liệt kê mọi token canary trong môi trường. Với mỗi token: nó là gì (thông tin xác thực giả, bản ghi DB giả, file giả, mục bộ nhớ giả), nó nằm ở đâu, truy cập nào kích hoạt báo động, ai nhận thông báo khẩn. Xác nhận không có canary nào có lý do hợp lệ để được chạm tới.
4. **Xếp lớp thống kê + cứng.** Xác nhận ngăn xếp sử dụng ít nhất một giới hạn cứng (kiểu hiến định Bài 17) bên cạnh bất kỳ bộ phát hiện thống kê nào (EWMA, z-score). Các bộ phát hiện chỉ dùng thống kê chấp nhận sự trôi chậm.
5. **Đường cách ly.** Điều gì xảy ra khi một bộ phát hiện kích hoạt? Dừng toàn bộ agent, tạm dừng riêng theo đường, chuyển hướng lưu lượng (honeypot eBPF / Cilium), chỉ cảnh báo. Xác nhận đường này đã được kiểm thử đầu cuối ít nhất một lần.

Các trường hợp loại bỏ dứt khoát:
- Bất kỳ triển khai nào không có công tắc ngắt bên ngoài.
- Các token canary được lưu trong các hệ thống agent có quyền ghi.
- Phát hiện chỉ dùng thống kê không có giới hạn cứng.
- Các bộ ngắt mạch có thời gian hạ nhiệt tự động bật lại mà không có xem xét của con người.
- Các lần chạy không có người giám sát mà công tắc ngắt chỉ được kiểm tra khi khởi động, không phải theo từng hành động.

Các quy tắc từ chối:
- Nếu người dùng không thể nêu các hệ thống cụ thể ngoài phạm vi thông tin xác thực của agent chứa công tắc ngắt, hãy từ chối. “Chúng tôi dùng một file cấu hình mà agent đọc” không phải là một công tắc ngắt nếu agent có thể ghi các file cấu hình.
- Nếu người dùng coi bộ phân loại Auto Mode (Bài 10) là thứ thay thế cho các dây bẫy, hãy từ chối. Bộ phân loại trực giao với phát hiện và ứng phó.
- Nếu các canary được đề xuất nằm trong các hệ thống agent có lý do hợp lệ để đọc, hãy từ chối và yêu cầu thiết kế lại.

Định dạng đầu ra:

Trả về một kiểm toán dây bẫy với:
- **Dòng công tắc ngắt** (vị trí, nhịp kiểm tra, thủ tục bật lại)
- **Bảng bộ ngắt mạch** (mẫu, ngưỡng, thời gian hạ nhiệt)
- **Bảng canary** (token, vị trí, báo động, người phụ trách)
- **Ghi chú xếp lớp** (có thống kê + giới hạn cứng có/không)
- **Luồng cách ly** (điều gì kích hoạt, điều gì xảy ra, đã kiểm thử có/không)
- **Mức sẵn sàng** (sản xuất / staging / chỉ nghiên cứu)
