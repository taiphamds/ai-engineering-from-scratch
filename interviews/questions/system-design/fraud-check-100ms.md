---
id: fraud-check-100ms
title: A payment fraud check inside a hundred milliseconds
card: system-design
kind: design
level: 3
roles: [applied-ai-engineer, ai-data-engineer, inference-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design]
tags: [fraud, online-inference, latency, label-delay, feedback-loop]
minutes: 20
lessons: [phases/02-ml-fundamentals/19-ml-system-design, phases/02-ml-fundamentals/20-model-monitoring-and-drift]
manuals: []
practice: []
cheatsheet: [ml-system-design]
related: [system-design/batch-vs-online-serving-choice, system-design/drift-monitoring-design, system-design/feedback-loop-clean-data]
updated: 2026-11-03
---

Một dịch vụ thanh toán phải phê duyệt, review hoặc chặn mỗi thanh toán trong 100 ms, ở 400 yêu cầu mỗi giây lúc đỉnh. Các nhãn gian lận đến dưới dạng chargeback vài tuần sau. Thiết kế hệ thống: tác vụ, chế độ phục vụ và định cỡ, kế hoạch dữ liệu và nhãn, rollout, các mặc định khi lỗi, và hai thứ sẽ âm thầm phá nó sau ra mắt.

## Short answer

Tác vụ là phân loại nhị phân xác suất gian lận với hai ngưỡng chia điểm thành phê duyệt, review và chặn, được phục vụ online vì quyết định cần dữ liệu của yêu cầu. Ở 400 yêu cầu một giây và 50 ms mỗi yêu cầu, khoảng 20 yêu cầu đang thực hiện tại bất kỳ thời điểm nào, nên dịch vụ nhỏ, và ngân sách để chỗ cho một lần lấy feature cộng mô hình. Các nhãn chargeback đến vài tuần sau thanh toán, nên huấn luyện dùng một phần tách thời gian và các feature tồn tại ở thời điểm thanh toán, và rollout đi shadow, rồi canary trên một tỷ lệ nhỏ, với quy tắc heuristic làm mặc định khi timeout. Hai lỗi im lặng là vòng phản hồi, nơi các thanh toán bị chặn không bao giờ có nhãn, và concept drift, nơi cùng giỏ hàng thay đổi rủi ro gian lận và chỉ các bộ giám sát kết quả thấy nó.

## Full answer

### Task and decision

| Câu hỏi | Câu trả lời |
|---|---|
| Dự đoán, theo từng thực thể | Xác suất thanh toán này là gian lận |
| Quyết định | Phê duyệt, gửi tới review, hoặc chặn, trong 100 ms |
| Khi nào, với dữ liệu gì | Tại yêu cầu, với thanh toán, lịch sử thẻ và thiết bị |
| Thành công | Tổn thất gian lận giảm với tỷ lệ phê duyệt làm một guardrail |

### Serving and sizing

Batch không thể phục vụ điều này: giới hạn lỗi thời bằng không vì thanh toán chưa tồn tại một phút trước. Suy luận online lấy các feature và chạy mô hình trong ngân sách. Định luật Little định cỡ nó: thông lượng nhân độ trễ là số đang tiến hành, nên 400 yêu cầu một giây ở 50 ms mỗi yêu cầu là 20 yêu cầu đang thực hiện, thấp xa những gì hai replica xử lý. p99, không phải trung bình, phải giữ dưới ngân sách; một p99 100 ms nghĩa là 99 trong 100 yêu cầu hoàn tất kịp.

### Data and labels

Chargeback đến vài tuần sau thanh toán, nên kết quả của lưu lượng gần đây không biết. Huấn luyện trên một phần tách thời gian với giai đoạn được gán nhãn gần nhất được giữ lại. Mọi feature phải tồn tại ở thời điểm thanh toán; bất cứ thứ gì được ghi sau kết quả, như một cờ tranh chấp, làm rò rỉ nhãn.

### Rollout

Shadow: chấm điểm các thanh toán trực tiếp và ghi nhật ký, không bao giờ hành động; so sánh độ trễ, tỷ lệ lỗi và phân phối điểm với quy tắc hiện tại. Canary: hành động trên một tỷ lệ nhỏ, thường 1 đến 5 phần trăm, mở rộng theo các bước, rollback bằng cấu hình khi một guardrail dịch chuyển. Rồi đo các tổn thất so với một nhóm giữ lại.

### Failure defaults

- Mô hình hết thời gian chờ: áp dụng baseline heuristic mà nhóm đã dùng.
- Một feature thiếu hoặc ngoài khoảng: dùng mặc định đã ghi tài liệu và ghi nhật ký nó.
- Một thẻ mới không có lịch sử: quy tắc hoặc trung bình quần thể.
- Phân phối điểm dịch chuyển đột ngột: tạm dừng các lần chặn tự động và gọi một người.

### The two quiet failures

1. Vòng phản hồi. Một thanh toán bị chặn không bao giờ nhận chargeback, nên mô hình được huấn luyện lại thấy ít ví dụ gian lận hơn từ vùng nó chặn và từ từ học rằng vùng đó an toàn. Cho một tỷ lệ nhỏ ngẫu nhiên các thanh toán một quyết định không chặn và ghi nhật ký điểm cùng hành động với mọi dòng, để huấn luyện sau có thể phân biệt dữ liệu bị ảnh hưởng với dữ liệu sạch.
2. Concept drift. Những kẻ gian lận đổi chiến thuật, và các thanh toán từng an toàn bắt đầu bị chargeback. Các đầu vào trông giống nhau, nên các bộ giám sát đầu vào giữ im lặng; chỉ bộ giám sát kết quả thấy nó, và chỉ sau độ trễ nhãn. Prior drift, như tỷ lệ gian lận tăng gấp đôi trong một cuộc tấn công, xuất hiện sớm hơn trong bộ giám sát dự đoán như một tỷ lệ dương dịch chuyển.

### Monitoring

Sức khỏe hệ thống ngay lập tức, đầu vào và dự đoán ngay lập tức, các kết quả được join khi chargeback đến và chỉ tính trên phần được gán nhãn. Chính sách cảnh báo với các kích thước hiệu ứng, một alpha đã hiệu chỉnh và tính dai dẳng, để người trực đọc các cảnh báo.

## Follow-ups

- **Level 3:** Tại sao một phần tách thời gian quan trọng hơn một phần tách ngẫu nhiên ở đây? Expected: một phần tách ngẫu nhiên làm rò rỉ các chiến thuật tương lai vào huấn luyện và nói quá hiệu năng trên gian lận tháng tới.
- **Level 3:** Hàng đợi review tăng sau ra mắt. Guardrail nào bắt được nó và bạn điều chỉnh gì? Expected: guardrail tỷ lệ review; di chuyển ngưỡng review, không phải mô hình.
- **Level 4:** Tỷ lệ không chặn ngẫu nhiên tốn tổn thất gian lận thực. Bạn định cỡ nó bằng cách nào? Expected: như tỷ lệ nhỏ nhất giữ đủ các ví dụ gian lận được gán nhãn từ vùng bị chặn để huấn luyện lại; tính giá nó như chi phí dữ liệu sạch so với chi phí một mô hình trôi dạt mù.
- **Level 4:** Huấn luyện lại trên các nhãn quý cuối sau một thay đổi chiến thuật khiến mô hình tệ hơn. Tại sao? Expected: concept drift; phần lớn các nhãn vẫn mô tả quan hệ cũ, nên các nhãn mới phải được thu thập trước khi huấn luyện lại giúp ích.

## Wrong answers

- "Tính trước các điểm gian lận hàng đêm cho mọi thẻ." Thanh toán chưa tồn tại đêm qua; quyết định cần dữ liệu ở thời điểm yêu cầu.
- "Huấn luyện lại hàng tuần trên mọi thanh toán bị chặn và được phê duyệt." Các thanh toán bị chặn không có kết quả, nên tập huấn luyện trôi về các quyết định riêng của mô hình.
- "Theo dõi feature drift và bạn sẽ thấy những kẻ gian lận thay đổi." Concept drift để các đầu vào không đổi; chỉ các kết quả cho thấy nó.

## Taught in

[Bài học thiết kế hệ thống ML](../../../phases/02-ml-fundamentals/19-ml-system-design/) cung cấp ngân sách độ trễ, định luật Little, các giai đoạn rollout và vòng phản hồi, và [bài học giám sát mô hình](../../../phases/02-ml-fundamentals/20-model-monitoring-and-drift/) giải thích các loại drift và độ trễ nhãn.
