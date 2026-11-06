---
name: marl-picker
description: Choose a MARL algorithm (MADDPG, QMIX, MAPPO, IQL, or extensions) for a given multi-agent task. Consider cooperative vs competitive, action-space type, heterogeneity, reward structure, and scale.
version: 1.0.0
phase: 16
lesson: 20
tags: [multi-agent, MARL, MADDPG, QMIX, MAPPO, CTDE]
---

Với một mô tả tác vụ đa agent, chọn thuật toán MARL.

Tạo ra:

1. **Hệ phân loại tác vụ.** Hoàn toàn hợp tác (phần thưởng dùng chung), hoàn toàn cạnh tranh (tổng bằng không), hỗn hợp, tổng bất kỳ. Số agent. Đồng nhất so với không đồng nhất.
2. **Khả năng quan sát.** Đầy đủ (mọi agent thấy trạng thái toàn cục), một phần (mỗi agent chỉ thấy quan sát riêng), hoặc cho phép giao tiếp.
3. **Không gian hành động.** Rời rạc (giống Atari, SMAC) hoặc liên tục (thế giới hạt, MuJoCo). Ảnh hưởng lựa chọn thuật toán.
4. **Cấu trúc phần thưởng.** Dày đặc (được định hình theo từng bước) so với thưa (chỉ kết thúc). Dày đặc làm MAPPO thực tế; thưa cần trợ giúp gán công trạng (phân rã giá trị của QMIX).
5. **Khuyến nghị thuật toán.** Bắt đầu với MAPPO làm đường cơ sở theo Yu và cộng sự năm 2022. Chuyển sang:
   - QMIX khi hợp tác + đồng nhất + cần gán công trạng phần thưởng thưa mạnh
   - MADDPG khi hỗn hợp (hợp tác + cạnh tranh) + các hành động liên tục
   - Các mở rộng (QTRAN, QPLEX, FACMAC) khi ràng buộc đơn điệu quá hạn chế
6. **Cơ sở hạ tầng huấn luyện.** Bạn có: đủ dữ liệu tương tác, ngân sách tính toán, chuyên môn định hình phần thưởng, ngân sách ổn định (5-10 seed mỗi thí nghiệm) không? Nếu không, đề xuất các chính sách cấp prompt cho các agent LLM.
7. **Hợp đồng triển khai.** CTDE: tại thời điểm triển khai mỗi agent chỉ thấy quan sát cục bộ. Viết hợp đồng tường minh để mã thời gian chạy tôn trọng nó.

Các trường hợp loại bỏ dứt khoát:

- Chọn một đường cơ sở không phải MAPPO cho lần chạy đầu. MAPPO là đường cơ sở năm 2026; bắt đầu ở đó.
- Sử dụng QMIX cho các tác vụ hợp tác-cạnh tranh hỗn hợp. Phân rã giá trị giả định tổng hợp đơn điệu.
- Khuyến nghị huấn luyện MARL cho các hệ thống agent LLM thiếu dữ liệu tương tác hoặc tín hiệu phần thưởng. Các chính sách cấp prompt sẽ vượt cho đến khi có dữ liệu.
- Huấn luyện không ghi nhật ký các quan sát và hành động theo từng agent. Gỡ lỗi là không thể.

Các quy tắc từ chối:

- Nếu tác vụ có ít hơn ~1000 episode dữ liệu tương tác, đề xuất các chính sách cấp prompt hoặc tinh chỉnh có giám sát.
- Nếu tác vụ không Markov (yêu cầu bộ nhớ) nhưng khuyến nghị không bao gồm các critic hồi tiếp, gắn cờ khoảng trống.
- Nếu tác vụ cạnh tranh tổng bất kỳ (nhiều cân bằng), chỉ MARL không chọn một cân bằng; đề xuất thiết kế cơ chế hoặc lựa chọn cân bằng.

Đầu ra: một bản tóm lược một trang. Bắt đầu với một khuyến nghị một câu (“Đường cơ sở MAPPO với hàm giá trị tập trung; actor rời rạc theo từng agent; CTDE khi triển khai; 5 seed mỗi thí nghiệm.”), rồi bảy phần ở trên. Kết thúc bằng một pipeline từ huấn luyện tới triển khai: thu thập dữ liệu, huấn luyện, đánh giá, triển khai.
