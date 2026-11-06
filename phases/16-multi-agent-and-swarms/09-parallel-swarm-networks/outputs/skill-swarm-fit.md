---
name: swarm-fit
description: Decide whether a task fits a swarm (decentralized) architecture or a supervisor (centralized) one.
version: 1.0.0
phase: 16
lesson: 09
tags: [multi-agent, swarm, decentralized, langgraph, matrix]
---

Với một tác vụ và các yêu cầu thông lượng / tính xác định của nó, đề xuất bầy đàn hoặc bộ giám sát và liệt kê các lựa chọn hàng đợi và rào chắn cụ thể.

Tạo ra:

1. **Kiểm tra tính độc lập tác vụ.** Các tác vụ con độc lập hay phụ thuộc nhau? Bầy đàn chỉ phù hợp khi tính độc lập cao.
2. **Phân phối thời lượng.** Đồng đều so với biến thiên. Bầy đàn thắng chủ yếu trên các khối lượng công việc có thời lượng biến thiên.
3. **Yêu cầu thứ tự.** Nghiêm ngặt, nới lỏng, hoặc không có. Bầy đàn không bảo toàn thứ tự; bộ giám sát có.
4. **Nhu cầu khả năng gỡ lỗi.** Cao (tài chính, y tế) → bộ giám sát. Trung bình → bầy đàn với các ID truy vết theo từng tác vụ.
5. **Lựa chọn hàng đợi.** Trong bộ nhớ (`queue.Queue`) cho demo; Kafka / Redis Streams / NATS / được DB bền vững hỗ trợ cho sản xuất.
6. **Các yêu cầu thiết kế worker.** Phải lũy đẳng; phải phát dấu vết theo từng tác vụ; phải xử lý áp lực ngược.
7. **Kế hoạch chống đói.** Lão hóa ưu tiên, chuyên biệt hóa worker, hàng đợi bị giới hạn.
8. **Kế hoạch khả năng quan sát.** Các ID theo từng tác vụ, các sự kiện bắt đầu/kết thúc, lược đồ bể kết quả.

Các trường hợp loại bỏ dứt khoát:

- Khuyến nghị bầy đàn cho các tác vụ có yêu cầu thứ tự cứng.
- Bầy đàn không có các worker lũy đẳng.
- Bầy đàn không có hàng đợi bền vững trong sản xuất.

Các quy tắc từ chối:

- Nếu tác vụ có ít hơn 10 đơn vị độc lập mỗi giây, từ chối bầy đàn và đề xuất bộ giám sát. Chi phí phụ bầy đàn không được lý giải ở thông lượng thấp.
- Nếu các yêu cầu khả năng quan sát cần một dấu vết mạch lạc duy nhất (kiểm toán, tuân thủ), từ chối bầy đàn và thay vào đó đề xuất đồ thị xác định LangGraph.

Đầu ra: một bản tóm lược kiến trúc một trang. Mở đầu bằng kết luận độ phù hợp, kết thúc bằng khuyến nghị broker thông điệp cụ thể cho thông lượng mục tiêu.
