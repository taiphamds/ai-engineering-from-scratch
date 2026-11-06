---
id: metric-before-result
title: Set the success metric before the first result exists
card: behavioral
kind: design
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, forward-deployed-ai-engineer, ai-data-engineer]
rounds: [behavioral]
tags: [metrics, guardrails, thresholds, gqm]
minutes: 10
lessons: [phases/14-agent-engineering/52-design-success-metrics]
manuals: []
practice: []
cheatsheet: [product-discovery, eval-driven-agents]
related: [behavioral/smallest-slice-that-decides, behavioral/feedback-ratchet-owner]
updated: 2026-11-03
---

Hãy kể cho tôi về một lần bạn định nghĩa cách một dự án sẽ được phán xét trước khi có bất kỳ kết quả nào. Bạn đã viết ra gì, và từ chối để điều gì mở đến sau này?

## Short answer

Tôi bắt đầu từ mục tiêu, suy ra các câu hỏi nó đặt ra, và chỉ sau đó chọn các metric nhỏ nhất trả lời chúng. Mỗi metric có một hướng, một ngưỡng, một khoảng thời gian, một nguồn và một quần thể trước khi bất kỳ giá trị nào được quan sát, và mỗi metric kết quả được ghép với một guardrail và một counter-metric. Tôi cũng viết trước các quyết định đạt, trượt và mơ hồ, vì một nhóm thấy kết quả trước dịch chuyển ngưỡng để bảo vệ bản xây dựng.

## Full answer

### Goal, question, metric

Với một công cụ sự cố mục tiêu là cắt thời gian để xác định dịch vụ bị ảnh hưởng mà không tăng các hành động không an toàn. Các câu hỏi theo sau: dịch vụ đúng được tìm nhanh thế nào, nó đúng thường xuyên đến đâu, chẩn đoán có giữ chỉ đọc không, và workflow có làm tăng việc bỏ qua cảnh báo hoặc tải người vận hành không. Các metric làm mỗi câu hỏi có thể vận hành.

### A metric needs a contract

| Trường | Ví dụ |
|---|---|
| Tên | số giây nhận diện trung vị |
| Hướng | tối đa |
| Ngưỡng | 120 |
| Khoảng thời gian | mười lần phát lại sự cố |
| Nguồn | log sự kiện phát lại |
| Quần thể | các kỹ sư trực trong đợt pilot |
| Loại | kết quả hoặc guardrail |

Không có một nguồn và một khoảng thời gian một con số không thể được tái tạo. Không có một ngưỡng nó không thể dẫn đến một quyết định.

### Three kinds of metric

- Kết quả: trạng thái mong muốn có cải thiện không?
- Guardrail: một ràng buộc cố định có giữ đúng không?
- Counter-metric: mức tăng cục bộ có chuyển chi phí hoặc tác hại sang nơi khác không?

Chỉ tốc độ là không đủ. Tính đúng, các lần ghi production, khối lượng công việc người vận hành và các cảnh báo bị bỏ sót bảo vệ khỏi một kết quả nhanh nhưng không an toàn. Một kế hoạch không có một guardrail là không hợp lệ ngay cả khi các metric kết quả trông đầy đủ.

### Decide before you measure

Ví dụ của bài học: đạt khi tỷ lệ dịch vụ đúng ít nhất 0.9 và thời gian trung vị tối đa 120 giây; trượt khi có bất kỳ lần ghi production nào hoặc một tỷ lệ đúng dưới 0.75; mơ hồ khi mức tăng nhỏ với phương sai rộng, đòi hỏi một tập phát lại lớn hơn. Một tỷ lệ đúng ổn định giữa 0.75 và 0.9 không khớp quy tắc nào trong ba quy tắc, nên tôi cũng viết một quy tắc cho nó trước lần phát lại: nó không đạt, và nêu phép kiểm thử tiếp theo. Phát lại ngoại tuyến cho khả năng lặp lại và độ bao phủ biên. Một pilot có giới hạn cho hành vi thật và sự tin cậy. Tôi dùng bằng chứng rẻ nhất trả lời quyết định hiện tại và không đưa người dùng thật vào chỉ vì mã đã sẵn sàng.

## Follow-ups

- **Level 2:** Một metric dễ thu thập nhưng không thể thay đổi quyết định. Bạn làm gì với nó? Expected: loại bỏ nó; đo lường trả lời một quyết định, không trang trí một dashboard.
- **Level 2:** Đưa ra một counter-metric cho công cụ sự cố. Expected: thời gian đánh giá bổ sung cho người chỉ huy sự cố, hoặc các trường hợp chuyển cấp đã chuyển sang một nhóm khác.
- **Level 3:** Metric kết quả đạt và guardrail trượt. Kết luận là gì? Expected: trượt; một ràng buộc cố định bị phá vỡ nghĩa là kết quả chưa được đạt.
- **Level 3:** Các kết quả trở lại mơ hồ. Điều gì đã được viết cho trường hợp đó? Expected: bước tiếp theo, như một tập phát lại lớn hơn, được quyết định trước kết quả để không ai tranh luận ngưỡng sau đó.

## Wrong answers

- "Chọn metric sau khi bạn thấy hệ thống có thể làm gì." Khi đó ngưỡng dịch chuyển để bảo vệ bản xây dựng và việc đo lường không quyết định gì.
- "Một metric kết quả tốt là đủ." Không có một guardrail, một kết quả nhanh nhưng không an toàn đạt.
- "Chạy một pilot trực tiếp vì triển khai đã sẵn sàng." Sự sẵn sàng không phải một lý do để đưa người dùng vào; bằng chứng rẻ nhất trả lời quyết định đến trước.

## Taught in

[Bài học các metric thành công](../../../phases/14-agent-engineering/52-design-success-metrics/) đưa ra hợp đồng metric, ba loại metric và quy tắc quyết định trước khi đo.
