---
name: reflexion-buffer
description: Maintain an episodic-memory buffer of reflections for verbal RL with TTL, dedup, and scoped scope.
version: 1.0.0
phase: 14
lesson: 03
tags: [reflexion, episodic-memory, self-healing, verbal-rl, sleep-time]
---

Với một loại tác vụ (kiểu lần chạy agent lặp lại — ví dụ "tái cấu trúc một hàm," "đóng một phiếu hỗ trợ"), duy trì một bộ đệm bộ nhớ tình tiết gồm các phản tư. Mỗi phản tư ghi lại một chế độ lỗi và nhận thức sửa chữa bằng ngôn ngữ tự nhiên. Bộ đệm được thêm vào đầu lần thử tiếp theo của cùng loại tác vụ.

Tạo:

1. Ghi lại phản tư. Sau khi một lần thử kết thúc với điểm bộ đánh giá dưới ngưỡng, phát ra một phản tư một dòng có dạng "Tôi đã thất bại khi làm X vì Y; lần sau, Z." Loại bỏ các phản tư về lỗi bên ngoài (mạng, lỗi 500 thượng nguồn) trừ khi chúng có thể tái tạo.
2. TTL và loại trùng. Các phản tư mặc định hết hạn sau N lần thử (đề xuất 10). Các bản trùng chính xác được gộp. Các bản gần trùng (>0.9 cosine trên một mô hình embedding nhỏ, hoặc chuỗi con chung >= 80%) chỉ giữ bản mới nhất.
3. Chính sách phạm vi. Ba phạm vi: loại tác vụ (theo tên tác vụ), người dùng (xuyên các tác vụ cho cùng người dùng), agent (xuyên mọi người dùng). Mặc định là loại tác vụ. Chỉ nâng lên phạm vi người dùng nếu phản tư đề cập các sở thích riêng của người dùng; không bao giờ tự động nâng lên phạm vi agent.
4. Cô đọng. Khi bộ đệm vượt ngân sách, chạy cô đọng lúc ngủ: phân cụm các bản gần trùng, tóm tắt, hợp nhất. Cô đọng chạy ngoài đường xử lý chính — đừng trì hoãn phản hồi của agent chính.
5. Tích hợp prompt. Phát ra một khối duy nhất có tiêu đề "Những gì tôi học được từ các lần thử trước" với một danh sách dấu đầu dòng. Giới hạn ở 6 mục trong prompt; phần tràn đi vào một mục tóm tắt riêng ("... và 4 phản tư cũ hơn về hết thời gian chờ").

Các trường hợp từ chối cứng:

- Viết các phản tư dưới dạng "lần sau cẩn thận hơn." Điều đó không thể hành động được. Chạy lại bộ phản tư với một prompt buộc đưa ra chỉ dẫn cụ thể cho lần sau.
- Cho các phản tư hết hạn dựa trên thời gian đồng hồ thay vì số lần thử. TTL nên có phạm vi lần thử, không phải phạm vi thời gian, cho các lần chạy có thể phát lại ngoại tuyến.
- Lưu các phản tư tham chiếu bí mật (khóa API, token, PII). Từ chối với một lỗi cụ thể thuộc lớp "chứa bí mật" trước khi ghi vào bộ đệm.

Các quy tắc từ chối:

- Nếu không có bộ đánh giá được gắn vào, từ chối và khuyến nghị Bài 05 (Self-Refine/CRITIC) — phản tư yêu cầu một tín hiệu, không phải một cảm giác.
- Nếu loại tác vụ chỉ diễn ra một lần (không bao giờ tái diễn), từ chối; bộ nhớ tình tiết không làm gì cho một tác vụ không bao giờ lặp lại.

Đầu ra: một file bộ đệm có cấu trúc (JSON với các đối tượng phản tư: id lần thử, loại tác vụ, phạm vi, văn bản, created_at, ttl_remaining), một khối prompt cho lần thử tiếp theo và một báo cáo "các phản tư cũ" liệt kê các mục sắp hết hạn.

Kết thúc bằng một ghi chú "đọc gì tiếp theo" chỉ đến Bài 06 (nén ngữ cảnh) nếu bộ đệm liên tục chạm giới hạn, hoặc Bài 08 (tính toán lúc ngủ của Letta) để chuyển việc cô đọng ra ngoài đường xử lý chính.
