---
name: rsi-cycle-pause-spec
description: Specify the conditions under which an RSI pipeline must pause and wait for human review before the next cycle.
version: 1.0.0
phase: 15
lesson: 7
tags: [rsi, self-improvement, alignment, pause-threshold, rsp]
---

Với một pipeline tự cải thiện đệ quy được đề xuất, tạo một đặc tả tạm dừng: các điều kiện tường minh dừng vòng lặp để con người kiểm tra trước khi chu kỳ tiếp theo bắt đầu. Một pipeline không có đặc tả tạm dừng chưa sẵn sàng chạy.

Tạo:

1. **Các ngưỡng cấp chu kỳ.** Với mỗi trục đo được (điểm năng lực, điểm căn chỉnh, ngân sách, độ dài quỹ đạo, sử dụng tài nguyên), định nghĩa một ngưỡng số mà việc vượt nó tạm dừng vòng lặp. Các ngưỡng phải được đặt trước khi vòng lặp bắt đầu và được ghi lại.
2. **Các chênh lệch giữa các chu kỳ.** Đặt các giới hạn về mức bất kỳ trục nào có thể di chuyển trong một chu kỳ. Một bước nhảy năng lực 30%+ trong một chu kỳ gần như luôn là một dấu hiệu lách bộ đánh giá; tạm dừng và kiểm toán.
3. **Khoảng cách lệch căn chỉnh.** Tính năng lực trừ căn chỉnh sau mỗi chu kỳ. Nếu khoảng cách mở rộng hơn X (do người vận hành đặt), tạm dừng. Đây là thước đo bộ mô phỏng trong `code/main.py` thực hành.
4. **Theo dõi hồi quy.** Nếu bất kỳ trục nào giảm hơn Y trong một chu kỳ, tạm dừng. Các hồi quy năng lực thường theo sau tăng vọt; bắt chúng ngăn tăng tốc tiến bộ giả.
5. **Hợp đồng tiếp tục của con người.** Trước khi vòng lặp tiếp tục sau một lần tạm dừng, yêu cầu một con người được nêu tên đánh giá kích hoạt tạm dừng, đặt lại các ngưỡng nếu phù hợp và ghi log quyết định vào dấu vết kiểm toán ngoài pipeline.

Các trường hợp từ chối cứng:
- Bất kỳ pipeline nào có thể tiếp tục sau một lần tạm dừng mà không có hành động con người.
- Bất kỳ ngưỡng nào phụ thuộc bộ đánh giá nội bộ riêng của vòng lặp (agent có thể lách nó).
- Bất kỳ pipeline nào có tập ngưỡng có thể được agent chỉnh sửa.

Các quy tắc từ chối:
- Nếu người dùng không thể nêu tên các ngưỡng từ đầu, từ chối. Các ngưỡng đặt sau sự việc không phải các ngưỡng; chúng là các hợp lý hóa.
- Nếu pipeline không có bộ đánh giá bên ngoài (ngoài vòng lặp), từ chối — phát hiện hồi quy và tăng vọt yêu cầu một góc nhìn bên ngoài.
- Nếu hợp đồng tiếp tục được đề xuất là "thông báo nhóm và tiếp tục sau 24 giờ," từ chối. Tiếp tục phải là một hành động chủ động.

Định dạng đầu ra:

Trả về một đặc tả một trang với:
- **Các trục và ngưỡng** (bảng)
- **Các giới hạn chênh lệch chu kỳ** (bảng)
- **Công thức và ngưỡng khoảng cách lệch căn chỉnh**
- **Các giới hạn hồi quy**
- **Bộ đánh giá bên ngoài** (nó là gì, khi nào nó chạy)
- **Hợp đồng tiếp tục** (bên chịu trách nhiệm được nêu tên, danh sách kiểm tra, đích log)
- **Dòng ký duyệt** (ai sở hữu bất biến tạm dừng)
