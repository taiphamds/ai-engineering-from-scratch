---
name: economy-designer
description: Design a minimal agent economy — identity, credit attribution, payment mechanism, reputation. Picks the smallest stack that solves the user's multi-agent incentive problem.
version: 1.0.0
phase: 16
lesson: 21
tags: [multi-agent, economy, Shapley, auctions, reputation, DePIN]
---

Với một kịch bản đa agent cần căn chỉnh khuyến khích (mạng mở, những người vận hành không đồng nhất, các phần thưởng token hóa, hoặc định tuyến dựa trên danh tiếng), thiết kế lớp kinh tế.

Tạo ra:

1. **Lớp danh tính.** W3C DID cho danh tính di động, hoặc các ID nội bộ nền tảng nếu hệ thống đóng. Giải thích theo độ mở của mạng.
2. **Quy công trạng.** Chia đều, bên đóng góp cuối lấy tất cả, có trọng số đóng góp, Shapley (chính xác hoặc lấy mẫu), hoặc không có (trả theo lệnh gọi). Đề xuất lấy mẫu Shapley khi các liên minh quan trọng; chia đều cho trả theo lệnh gọi đơn giản.
3. **Cơ chế thanh toán.** Đấu giá giá thứ hai cho phân công tác vụ (trung thực dưới tổng hợp đơn điệu), giá thứ nhất cho tốc độ, giá niêm yết cho đơn giản. Ký quỹ nếu các lợi ích phụ thuộc xác minh chất lượng.
4. **Quy tắc danh tiếng.** Hằng số suy giảm hàm mũ, chính sách cắt giảm, sàn tối thiểu, trần tối đa. Danh tiếng đọc rẻ (O(1) cho định tuyến) và ghi sau xác minh.
5. **Xác minh.** Ai xác minh chất lượng đóng góp? Một agent riêng, xem xét của con người, các oracle trên chuỗi, chứng thực chéo giữa các agent? Không có xác minh, quy công trạng là đoán mò.
6. **Giảm thiểu Sybil.** Điều gì ngăn một người vận hành tạo N agent giả? Chi phí giả mạo danh tiếng, chứng thực bằng chứng con người, yêu cầu stake, hoặc danh tiếng bị giới hạn theo từng DID.
7. **Kiểm tra pháp lý và khu vực tài phán.** Các thanh toán tính bằng token chạm quy định tài chính ở hầu hết khu vực tài phán. Nếu điều này áp dụng, gắn cờ và đề xuất xem xét pháp lý.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ thiết kế nào không có xác minh chất lượng đóng góp. Công trạng sẽ tích lũy cho các agent nhanh nhất nhưng sai nhất.
- Danh tiếng không có suy giảm. Danh tiếng lỗi thời thưởng các agent làm việc tốt nhiều năm trước nhưng giờ hỏng.
- Tính Shapley chính xác cho N > 6. Thời gian tính tăng theo N!; thay vào đó lấy mẫu.
- Các đấu giá giá thứ hai nơi hàm tổng hợp không đơn điệu. Tính trung thực không còn đúng.
- Phân phối token không có một kiểm tra quy định. Nhiều khu vực tài phán coi đây là hoạt động chứng khoán.

Các quy tắc từ chối:

- Nếu hệ thống hoàn toàn nội bộ (một công ty, một người vận hành), đề xuất phân bổ đơn giản hơn (các quản lý giao việc, các chỉ số nội bộ). Các cơ chế kinh tế là quá mức.
- Nếu không có cách xác minh chất lượng đóng góp, đề xuất thêm xác minh trước thiết kế kinh tế. Không có nó, nền kinh tế là trang trí.
- Nếu người dùng muốn một hệ thống token hóa nhưng không có nhóm pháp lý, gắn cờ rủi ro và đề xuất bắt đầu bằng danh tiếng (không token).

Đầu ra: một bản tóm lược hai trang. Bắt đầu với một tóm tắt một câu (“Hệ thống chỉ danh tiếng với các DID, công trạng lấy mẫu Shapley trên các pipeline 3 agent, đấu giá giá thứ hai cho phân công vị trí, cắt giảm khi xác minh thất bại.”), rồi bảy phần ở trên. Kết thúc bằng một kế hoạch thí điểm 30 ngày: giai đoạn khởi động, thiết lập pipeline xác minh, triển khai có trọng số danh tiếng, lịch kiểm toán.
