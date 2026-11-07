---
id: batch-vs-online-serving-choice
title: Batch or online serving for a two-hour freshness limit
card: system-design
kind: tradeoff
level: 2
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer]
rounds: [system-design]
tags: [batch-inference, online-inference, staleness, cost]
minutes: 12
lessons: [phases/02-ml-fundamentals/19-ml-system-design]
manuals: []
practice: []
cheatsheet: [ml-system-design]
related: [system-design/churn-model-system, system-design/fraud-check-100ms]
updated: 2026-11-03
---

Một điểm xếp hạng feed phải không cũ hơn hai giờ cho 5,000,000 mục, và đỉnh phục vụ là 120 yêu cầu mỗi giây. Tính giá phục vụ batch và online bằng mô hình chi phí của bài học, chọn một cách, và nói điều gì sẽ đảo lựa chọn.

## Short answer

Với một công việc batch một giờ và một giới hạn lỗi thời hai giờ, công việc phải chạy mỗi giờ, được mô hình chi phí của bài học tính giá ở 24.0 lần chạy mỗi ngày trên 5,000,000 mục cho $48.50 một ngày. Hai replica online được định cỡ cho 120 QPS đỉnh tốn $24.00 một ngày và phục vụ dữ liệu mới nhất. Online thắng ở đây; lựa chọn đảo khi giới hạn độ tươi nới đủ để cắt các lần chạy, hoặc khi lưu lượng đỉnh tăng đủ để cần nhiều replica.

## Full answer

### How each plan is priced

| Thuộc tính | Batch | Online |
|---|---|---|
| Độ tươi | Cũ bằng lần chạy cuối cộng thời gian chạy | Dữ liệu của yêu cầu |
| Độ trễ yêu cầu | Một lần đọc key-value, vài mili giây | Lấy feature cộng thời gian mô hình, 35 ms trong mô hình |
| Yếu tố chi phí | Số thực thể nhân số lần chạy mỗi ngày | Các replica được định cỡ cho QPS đỉnh, tối thiểu hai |
| Các thực thể mới | Không có điểm cho đến lần chạy tiếp theo | Được chấm điểm ở yêu cầu đầu |
| Khi nó hỏng | Các điểm cũ vẫn đọc được | Các yêu cầu thất bại hoặc hết thời gian chờ |

Batch phải hoàn tất trong giới hạn lỗi thời, nên thời gian giữa các lần chạy là giới hạn trừ thời gian công việc. Mỗi lần chạy chấm điểm mọi thực thể bất kể có ai hỏi không. Online trả phí cho các replica nhàn rỗi giữa các đỉnh, với mức sàn hai để có tính sẵn sàng.

### The arithmetic for this workload

Giới hạn lỗi thời hai giờ trừ một công việc một giờ để lại một giờ giữa các lần chạy, nên 24.0 lần chạy mỗi ngày. Mỗi lần chạy chấm điểm tất cả 5,000,000 mục. Đó là lý do kế hoạch batch tốn $48.50 một ngày trong khi kế hoạch online nằm ở mức sàn hai replica $24.00, vì 120 QPS đỉnh vừa trong năng lực hai replica.

### What flips it

- Một giới hạn lỗi thời dài hơn cắt các lần chạy và chi phí batch theo tỷ lệ; công việc churn hàng đêm trong cùng bài học tốn dưới một đô la.
- Một giới hạn lỗi thời ngắn hơn một công việc batch khiến batch không khả thi ở bất kỳ giá nào.
- Một đỉnh cao hơn nhiều cần thêm replica và tăng chi phí online tuyến tính theo lưu lượng đỉnh.
- Một ngân sách độ trễ dưới thời gian mô hình của đường online loại online, và một cách lai phục vụ các mục đã biết từ một kho và các mục mới online.

### What the decision is not about

Độ tươi và chi phí quyết định; chất lượng mô hình không thay đổi giữa hai kế hoạch. Các chế độ lỗi khác nhau: một công việc batch hỏng để lại các điểm cũ nhưng đọc được, trong khi một dịch vụ online hỏng làm các yêu cầu thất bại, nên thiết kế online cần một mặc định như điểm được lưu cuối hoặc heuristic.

## Follow-ups

- **Level 2:** Tại sao kế hoạch online ở mức tối thiểu tại đây? Expected: hai replica là sàn tính sẵn sàng, và 120 QPS đỉnh vừa trong những gì hai replica xử lý, nên lưu lượng không quyết định số lượng.
- **Level 2:** Công việc mất lâu hơn giới hạn lỗi thời. Bộ lập kế hoạch trả về gì? Expected: không khả thi; không lịch nào thỏa giới hạn, nên các ngân sách hoặc công việc phải thay đổi.
- **Level 3:** Thiết kế cách lai. Expected: batch chấm điểm các mục đã biết theo lịch được nới, online chấm điểm các mục mới và các yêu cầu cần dữ liệu mới; tính giá như tổng của một kế hoạch batch rẻ hơn và một tầng online nhỏ.
- **Level 3:** Điều này cung cấp cho kiểm tra tài liệu thiết kế nào? Expected: kiểm tra mức phù hợp phục vụ, tính giá chế độ được chọn theo các ngân sách lỗi thời, độ trễ và chi phí và đánh trượt một chế độ thiếu bất kỳ ngân sách nào.

## Wrong answers

- "Batch luôn rẻ hơn." Chi phí batch tăng theo số lần chạy mỗi ngày nhân số thực thể; một giới hạn độ tươi chặt khiến nó là kế hoạch đắt.
- "Online luôn mới hơn, nên luôn tốt hơn." Mới hơn tốn replica, và một tiến trình hàng đêm không thể dùng độ tươi nó không đọc.
- "Chọn theo độ chính xác mô hình." Độ chính xác giống nhau trong cả hai kế hoạch; lựa chọn là về độ tươi, độ trễ và chi phí.

## Taught in

[Bài học thiết kế hệ thống ML](../../../phases/02-ml-fundamentals/19-ml-system-design/) xây dựng mô hình chi phí batch và online và chạy nó trên workload xếp hạng feed.
