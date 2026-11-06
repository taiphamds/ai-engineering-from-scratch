---
name: horizon-reality-check
description: Given a task you want to hand to an agent, decide whether the current frontier's horizon covers it with enough margin.
version: 1.0.0
phase: 15
lesson: 1
tags: [autonomous-agents, metr, time-horizon, reliability, deployment]
---

Với một tác vụ tự chủ được đề xuất (agent nên làm gì, một chuyên gia con người sẽ mất bao lâu, chi phí thất bại là gì), tạo một kiểm tra thực tế về việc tầm thời gian của mô hình tiên tiến nhất hiện tại có thực sự bao phủ nó không.

Tạo:

1. **Ước lượng thời gian chuyên gia.** Hỏi người dùng thời gian hoàn thành trung vị của chuyên gia theo phút hoặc giờ. Nếu họ không thể ước lượng nó, từ chối và hướng họ đo một mẫu nhỏ trước.
2. **Tỷ lệ dư địa.** Chia tầm METR 50% của mô hình được chọn cho ước lượng thời gian chuyên gia. Gắn cờ bất kỳ tỷ lệ nào dưới 4 lần — ở xác suất thành công 50%, bạn muốn một biên rộng rãi. Ở tỷ lệ 2 lần hoặc thấp hơn, từ chối triển khai trừ khi HITL nằm trong vòng lặp trên mọi hành động đáng kể.
3. **Ngân sách độ tin cậy.** Ước lượng độ dài quỹ đạo theo lời gọi công cụ, rồi tính thành công từ đầu đến cuối tại độ tin cậy cho mỗi bước 0.95, 0.99, 0.995. Nếu độ dài tác vụ vượt ngưỡng thành công 50% tại độ tin cậy cho mỗi bước bạn giả định, yêu cầu các checkpoint hoặc chia tác vụ.
4. **Điều chỉnh đánh giá với triển khai.** Áp dụng một khoảng cách 20-40% giữa tầm thời gian benchmark và tầm thời gian ngữ cảnh triển khai. Trích dẫn nghiên cứu giả vờ căn chỉnh năm 2024 của Anthropic hoặc Báo cáo An toàn AI Quốc tế năm 2026 khi biện minh với các bên liên quan.
5. **Các biện pháp kiểm soát bắt buộc.** Dựa trên dư địa, liệt kê tập biện pháp kiểm soát tối thiểu: giới hạn ngân sách, giới hạn lặp, công tắc ngắt, các điểm checkpoint HITL, canary token và lịch kiểm toán quỹ đạo.

Các trường hợp từ chối cứng:
- Bất kỳ triển khai nào ở tỷ lệ tầm thời gian dưới 2 lần mà không có HITL trên mọi hành động có hệ quả.
- Bất kỳ tuyên bố nào rằng một mô hình "có thể làm" một tác vụ chỉ dựa trên tầm thời gian METR. Tầm thời gian là mốc 50% trên một đường cong logistic; các thất bại đuôi được bảo đảm.
- Coi các tầm thời gian METR như một sàn thay vì một trần.

Các quy tắc từ chối:
- Nếu người dùng không thể ước lượng thời gian chuyên gia cho tác vụ, từ chối và yêu cầu họ đo một mẫu nhỏ trước. Bất cứ thứ gì khác là phỏng đoán.
- Nếu tác vụ được đề xuất sẽ tốn hơn ngân sách trường hợp xấu nhất của người dùng ở giá mô hình đầy đủ, từ chối và khuyến nghị các biện pháp kiểm soát ngân sách từ Bài 13 trước khi tiếp tục.
- Nếu người dùng mô tả một tác vụ chạm các hành động không thể đảo ngược (giao dịch tài chính, ghi cơ sở dữ liệu sản xuất, email cho khách hàng) mà không có bất kỳ lớp HITL nào, từ chối. Lập luận tầm thời gian không cho phép triển khai không thể đảo ngược.

Định dạng đầu ra:

Trả về một bản ghi nhớ ngắn với:
- **Tóm tắt tác vụ** (một câu)
- **Ước lượng thời gian chuyên gia** (với đơn vị)
- **Tỷ lệ dư địa** (với con số tường minh)
- **Ước lượng độ tin cậy từ đầu đến cuối** (bảng ở ba tỷ lệ cho mỗi bước)
- **Các biện pháp kiểm soát tối thiểu** (dấu đầu dòng)
- **Tiến hành / giữ / không tiến hành** (phán quyết tường minh cộng lý do một câu)
