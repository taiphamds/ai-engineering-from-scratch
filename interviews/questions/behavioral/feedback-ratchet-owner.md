---
id: feedback-ratchet-owner
title: Turn telemetry nobody owns into a learning loop
card: behavioral
kind: design
level: 4
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [behavioral]
tags: [feedback-loop, ownership, routing, retirement]
minutes: 15
lessons: [phases/14-agent-engineering/54-build-the-feedback-ratchet, phases/14-agent-engineering/52-design-success-metrics]
manuals: []
practice: []
cheatsheet: [delegation-feedback, eval-driven-agents]
related: [behavioral/correction-to-control, behavioral/retire-a-rule, behavioral/metric-before-result]
updated: 2026-11-03
---

Bạn tiếp quản một nhóm thu thập các trace, điểm đánh giá, ticket hỗ trợ và log sự cố cho một trợ lý. Không ai có thể nêu một thay đổi mà bất kỳ thứ nào trong đó gây ra. Thiết kế cơ chế chuyển các tín hiệu đó thành các cải tiến, và nói cách bạn ngăn nó trở thành một backlog nữa.

## Short answer

Phần thiếu là nâng cấp: một đường được định nghĩa từ một quan sát đến một thay đổi bền vững có một người phụ trách và bằng chứng. Mỗi tín hiệu được kết nối với một kết quả, một ràng buộc hoặc một giả định, được truy đến một nguyên nhân gốc, và được định tuyến đến lớp sớm nhất sở hữu nguyên nhân đó, là đánh giá, ngữ cảnh, chính sách, runtime hoặc một mục backlog được định hình. Mọi hành động kết quả mang một người phụ trách, một mức ưu tiên từ hậu quả và tái diễn, sản phẩm cần thay đổi, cách xác minh, một khoảng thời gian đánh giá và một điều kiện loại bỏ, để vòng lặp tạo ra các biện pháp kiểm soát được xem xét lại sau đó thay vì các quy tắc chỉ tích tụ.

## Full answer

### The loop

1. Quan sát một tín hiệu cụ thể.
2. Kết nối nó với một kết quả, một ràng buộc hoặc một giả định.
3. Xác định lớp hệ thống sớm nhất sở hữu nguyên nhân.
4. Tạo một thay đổi có giới hạn.
5. Xác minh rằng việc tái diễn trở nên ít có khả năng hơn.
6. Đánh giá liệu biện pháp kiểm soát có nên ở lại.

### Route to the owning layer

| Tín hiệu | Nơi chuyển đến |
|---|---|
| Dương tính giả, sự suy giảm, kết quả sai | Đánh giá hoặc kiểm thử |
| Thiếu ngữ cảnh, công việc trùng lặp, thông tin cũ | Nguồn ngữ cảnh hoặc tuyến truy xuất |
| Hành động không an toàn hoặc khoảng trống thẩm quyền | Chính sách hoặc ranh giới quyền hạn |
| Timeout, bão thử lại, dependency không khả dụng | Biện pháp kiểm soát runtime |
| Nhu cầu sản phẩm mới hoặc đánh đổi chưa được giải quyết | Mục backlog được định hình |

Một timeout thuộc về runtime, không thuộc backlog chung, và một câu trả lời sai thuộc về một kiểm thử, không thuộc một đoạn prompt nữa. Nguyên nhân được sửa ở lớp hiệu quả sớm nhất.

### Ownership is part of the control

Một cải tiến không có người phụ trách là một quan sát có định dạng tốt hơn. Mọi hành động có một người phụ trách, một mức ưu tiên dựa trên hậu quả và tái diễn, sản phẩm cần thay đổi, cách xác minh chứng minh thay đổi, một khoảng thời gian đánh giá hoặc hết hạn, và một điều kiện loại bỏ.

### Why it is not a backlog

Một backlog lưu các mong muốn. Ratchet lưu các biện pháp kiểm soát có bằng chứng và hết hạn. Các biện pháp kiểm soát được đánh giá khi kiến trúc thay đổi, khi một bất biến cấp thấp hơn thay thế một chỉ dẫn cấp cao hơn, khi thất bại được bảo vệ đã không xuất hiện trong khoảng thời gian, hoặc khi biện pháp kiểm soát chặn công việc hợp lệ nhiều hơn ngăn tác hại. Việc loại bỏ cũng cần bằng chứng.

### Metrics close the loop

Các tín hiệu chỉ có ý nghĩa khi đối chiếu với các metric được định nghĩa trước kết quả: kết quả, guardrail và counter-metric, mỗi thứ có một ngưỡng, một khoảng thời gian và một nguồn. Khi đó ratchet thay đổi khung kết quả, các giả định, lát cắt hoặc kế hoạch đo lường cho bằng chứng sản phẩm, và các kiểm thử, ngữ cảnh, phạm vi hoặc bàn giao cho các lần sửa coding agent. Các sự cố có thể thay đổi cả hai.

## Follow-ups

- **Level 3:** Hai nhóm dùng chung trợ lý và bất đồng về một đánh đổi mà một tín hiệu bộc lộ. Nó đi đâu? Expected: đến một mục backlog được định hình với một con người chịu trách nhiệm quyết định; ratchet không tự giải quyết các bất đồng sản phẩm.
- **Level 4:** Bạn ưu tiên giữa nhiều tín hiệu thế nào? Expected: theo hậu quả và tái diễn cùng nhau, để một sự kiện đơn lẻ nghiêm trọng và một sự kiện nhỏ thường xuyên đều vượt trên một sự kiện nhỏ hiếm.
- **Level 4:** Điều gì chứng minh vòng lặp hoạt động sau một quý? Expected: các biện pháp kiểm soát được nêu truy ngược về các tín hiệu, các kết quả xác minh cho thấy tái diễn giảm, và các lần loại bỏ với bằng chứng của chúng; không phải lượng telemetry được thu thập.

## Wrong answers

- "Dựng một dashboard để mọi người có thể thấy các tín hiệu." Tính hiển thị không có nâng cấp và quyền sở hữu không thay đổi gì.
- "Thêm mỗi bài học rút ra vào system prompt." Văn xuôi là lớp yếu nhất; một ranh giới quyền hạn có thể khiến hành động không an toàn không thể thực hiện, và một kiểm thử có thể chặn một lần phát hành lặp lại thất bại.
- "Giữ mọi biện pháp kiểm soát mãi mãi vì nó đã được giành lấy." Các biện pháp kiểm soát suy giảm và xung đột; mỗi biện pháp cần một điều kiện loại bỏ và đánh giá định kỳ.

## Taught in

[Bài học feedback ratchet](../../../phases/14-agent-engineering/54-build-the-feedback-ratchet/) đưa ra bảng định tuyến và các trường quyền sở hữu, và [bài học các metric thành công](../../../phases/14-agent-engineering/52-design-success-metrics/) đưa ra hợp đồng metric mà các tín hiệu được phán xét theo.
