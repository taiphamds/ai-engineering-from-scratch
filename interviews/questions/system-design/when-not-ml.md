---
id: when-not-ml
title: When to say no to a model
card: system-design
kind: concept
level: 1
roles: [applied-ai-engineer, ai-data-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, screen]
tags: [problem-framing, baselines, rules-vs-ml]
minutes: 8
lessons: [phases/02-ml-fundamentals/01-what-is-machine-learning, phases/02-ml-fundamentals/19-ml-system-design]
manuals: []
practice: []
cheatsheet: [ml-system-design]
related: [system-design/metric-layers-churn-auc, system-design/design-doc-blocking-review]
updated: 2026-11-03
---

Một chủ sản phẩm yêu cầu nhóm của bạn "một mô hình" để quyết định các phiếu hỗ trợ nào được chuyển cấp. Trước khi bạn thiết kế bất cứ thứ gì, các câu hỏi nào quyết định liệu điều này có nên là một mô hình được học hay không, và điều gì sẽ khiến bạn trả lời bằng một quy tắc thay vào đó?

## Short answer

Tôi hỏi liệu một quy tắc ngắn đã đạt mục tiêu chưa, liệu các nhãn tồn tại hoặc có thể được thu thập không, liệu ai đó sẽ hành động trên dự đoán không, liệu dữ liệu ở thời điểm quyết định giữ tín hiệu không, và liệu một lỗi có chấp nhận được không. Một mô hình thua khi một ít điều kiện giữ đúng và tự giải thích, khi không có nhãn, hoặc khi chi phí xây và chạy hệ thống vượt giá trị của các quyết định tốt hơn. Một mô hình thắng khi quy tắc đã dài và mong manh, vì một mô hình được học dễ cập nhật hơn một heuristic phức tạp.

## Full answer

### The cases against a model

| Điều kiện | Tại sao một quy tắc thắng |
|---|---|
| Logic vừa trong một ít điều kiện và giữ đúng | Rẻ hơn để chạy, kiểm thử và giải thích |
| Không nhãn và không cách thực tế để thu thập | Không có gì để học từ |
| Không ai hành động trên dự đoán | Một điểm tốt hơn không thay đổi gì |
| Dữ liệu thời điểm quyết định không chứa tín hiệu | Mô hình không thể thấy điều quan trọng |
| Một lỗi không chấp nhận được và không người nào kiểm tra đầu ra | Một hệ thống xác suất đôi khi sẽ sai |
| Hệ thống tốn hơn giá trị của các quyết định tốt hơn | Lợi tức âm |
| Vấn đề thay đổi nhanh hơn huấn luyện lại | Mô hình luôn cũ |

Một bảng tra cứu hoặc một ngưỡng bao phủ 99% trường hợp là hệ thống đúng, và thêm một mô hình nâng chi phí bảo trì cho ít lợi ích.

### The cases for a model

Hướng dẫn quy tắc được trích trong bài học thiết kế nói đừng sợ ra mắt không có machine learning, và cũng ưu tiên một mô hình hơn một heuristic phức tạp. Điểm giao là khi quy tắc có nhiều nhánh, hỏng trên các trường hợp mới, và không ai có thể nói tại sao nó quyết định như vậy. Một mô hình được học được huấn luyện lại; một quy tắc dài được viết lại.

### How I would run the ticket case

1. Hỏi quyết định chuyển cấp là gì, ai đưa ra, và khi nào các feature tồn tại.
2. Xây quy tắc mà nhóm hỗ trợ đã dùng, ngay cả nếu nó nằm trong một bảng tính, và đo nó.
3. Đặt mức tăng tối thiểu một mô hình phải thể hiện so với quy tắc đó trước bất kỳ huấn luyện nào.
4. Chỉ sau đó thu thập các nhãn và huấn luyện, và so với quy tắc bằng cùng chỉ số.

Quy tắc cũng là mặc định an toàn khi dịch vụ mô hình thất bại, nên dù cách nào nó cũng được xây trước.

## Follow-ups

- **Level 1:** Các nhãn cho chuyển cấp phiếu đến từ đâu, và độ trễ là gì? Expected: từ các quyết định chuyển cấp hoặc các kết quả quá khứ, đến sau khi phiếu đóng; độ trễ đặt mức mới mà dữ liệu huấn luyện có thể đạt.
- **Level 2:** Nhóm hoàn toàn không có lịch sử chuyển cấp. Bạn xây gì trước? Expected: quy tắc, với ghi nhật ký quyết định và các đầu vào, để các nhãn bắt đầu tích lũy.
- **Level 2:** Một cơ quan quản lý yêu cầu mọi quyết định chuyển cấp có thể giải thích. Điều gì thay đổi? Expected: hoặc giữ quy tắc hoặc giới hạn mô hình vào các dạng diễn giải được như một cây nhỏ hoặc một mô hình tuyến tính.

## Wrong answers

- "Một mô hình luôn đánh bại một quy tắc khi có đủ dữ liệu." Quy tắc có thể thắng khi các feature mang tín hiệu yếu, và mức tăng phải được đo, không được giả định.
- "Thu thập dữ liệu sau; phát hành mô hình trước." Không có nhãn, không có gì để huấn luyện trên và không có gì để đánh giá theo.
- "Baseline heuristic chỉ là một kiểm tra hợp lý." Nó là đối thủ thực và mặc định an toàn cho các lỗi.

## Taught in

[Bài giới thiệu machine learning](../../../phases/02-ml-fundamentals/01-what-is-machine-learning/) cung cấp lưu đồ quyết định khi nào không dùng một mô hình, và [bài học thiết kế hệ thống ML](../../../phases/02-ml-fundamentals/19-ml-system-design/) liệt kê các trường hợp một quy tắc thắng và đặt mức tăng tối thiểu.
