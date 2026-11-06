---
id: decision-brief-after-setback
title: Brief the decision owner after a setback
card: behavioral
kind: design
level: 3
roles: [forward-deployed-ai-engineer, applied-ai-engineer, ai-developer-relations-engineer, agentic-ai-engineer]
rounds: [behavioral, customer]
tags: [decision-brief, setback, authority, tradeoffs]
minutes: 12
lessons: [phases/14-agent-engineering/54-build-the-feedback-ratchet]
manuals: []
practice: []
cheatsheet: [decision-briefing-tools, product-discovery]
related: [behavioral/prototype-became-production, behavioral/feedback-ratchet-owner]
updated: 2026-11-03
---

Hãy kể cho tôi về một dự án mà bằng chứng quay lại chống kế hoạch của bạn. Bạn đã làm gì trong thẩm quyền của chính mình, và trình bày tình hình với người phải quyết định thế nào?

## Short answer

Tôi tách những gì tôi quan sát khỏi những gì được báo cáo và những gì tôi suy ra, nêu trở ngại và bằng chứng thay đổi hiểu biết của tôi, và thúc đẩy công việc có thể đảo ngược mà tôi được phép làm trong khi quyết định bị chặn chờ. Sau đó tôi viết một bản tóm lược ngắn cho người chịu trách nhiệm quyết định: vấn đề người dùng và bằng chứng mới, ít nhất hai lựa chọn bao gồm một lựa chọn thủ công hoặc không xây dựng rẻ hơn khi đáng tin cậy, các đánh đổi về chất lượng, công sức, chi phí và rủi ro, khuyến nghị của tôi với sự không chắc chắn còn lại, và quyết định cần thiết với người phụ trách cùng ngày của nó.

## Full answer

### Establish what happened

Một trở ngại là một giả định thất bại, một kết quả không sử dụng được, một chi phí bất ngờ hoặc một lần bàn giao bị trì hoãn. Tôi ghi lại người dùng, nhiệm vụ, workflow hiện tại và kết quả tôi muốn, và liên kết một quan sát có sự đồng ý, một bản ghi đã che thông tin hoặc một trace có thể tái tạo. Các quan sát mô phỏng giữ nhãn là mô phỏng. Tôi không bịa ra các cuộc phỏng vấn, phê duyệt hoặc việc áp dụng.

### Progress inside my authority

Tôi liệt kê những điều chưa biết và chọn hành động có thể đảo ngược rẻ nhất giải quyết điều có hậu quả lớn nhất. Tôi nêu những gì tôi có thể quyết định, những gì một thỏa thuận hiện có giới hạn, và những gì cần ủy quyền. Chuẩn bị một bản phát lại ngoại tuyến đã che thông tin trong khi chờ quyền sử dụng dữ liệu khách hàng là sự chủ động. Mở rộng quyền truy cập của chính mình thì không.

### The brief

Bản tóm lược dành cho người không cần chi tiết triển khai:

- vấn đề người dùng và bằng chứng đã thay đổi kế hoạch;
- ít nhất hai lựa chọn, với một lựa chọn thủ công hoặc không xây dựng rẻ hơn khi đáng tin cậy;
- các đánh đổi về chất lượng, thiết kế tương tác, công sức, chi phí vận hành và rủi ro;
- khuyến nghị của tôi, sự không chắc chắn còn lại và quyết định cần thiết;
- người chịu trách nhiệm quyết định, các bên liên quan bị ảnh hưởng và ngày cần quyết định.

Tôi yêu cầu một đồng nghiệp đại diện cho một bên liên quan bị ảnh hưởng và thách thức một đánh đổi, và ghi lại liệu sự phản đối có thay đổi khuyến nghị hay không. Việc đóng vai giữ nhãn; nó không thể thay thế sự đồng ý của bên liên quan thật.

### Close the loop

Tôi khuyến nghị tiếp tục, thay đổi hoặc dừng đối chiếu với các tiêu chí được khai báo trước. Nếu bằng chứng chưa ngã ngũ, tôi nêu quan sát còn thiếu và phép thử có giới hạn tiếp theo. Phản hồi của người chịu trách nhiệm quyết định đi vào bản ghi, hoặc vẫn đang chờ nếu chưa có phản hồi nào. Thời gian đánh giá và sửa của con người được tính là một phần workflow: một phản hồi mô hình nhanh hơn vẫn có thể làm toàn bộ nhiệm vụ chậm hơn hoặc khó tin cậy hơn.

## Follow-ups

- **Level 3:** Tại sao bao gồm một lựa chọn không xây dựng bất cứ khi nào đáng tin cậy? Expected: thu hẹp workflow hoặc giữ một bước thủ công có thể là quyết định tốt hơn; không có lựa chọn đó bản tóm lược chỉ xin phép tiếp tục.
- **Level 3:** Điều gì đi cạnh mỗi con số trong phép so sánh kết quả? Expected: các số lượng mẫu, các mục bị loại trừ và các liên kết bằng chứng, với cùng định nghĩa metric và các khoảng thời gian so sánh được cho đường cơ sở và theo dõi sau đó.
- **Level 4:** Một lần duyệt mô phỏng vượt qua mọi bước. Bạn có thể đưa ra khẳng định nào? Expected: chỉ một khẳng định học hỏi có giới hạn; hành vi người dùng thật chưa quan sát vẫn là một khoảng trống được nêu với quan sát tiếp theo cần để đóng nó.
- **Level 4:** Bạn chuyển trở ngại thành một thay đổi trong cách nhóm bàn giao thế nào? Expected: chọn một cải tiến quy trình với một người phụ trách và một ngày đánh giá, rồi giữ, sửa đổi hoặc loại bỏ nó theo bằng chứng.

## Wrong answers

- "Chờ quyết định trước khi làm bất cứ điều gì." Công việc có thể đảo ngược, được ủy quyền có thể tiến lên; chỉ quyết định bị chặn chờ.
- "Chỉ trình bày khuyến nghị để giữ đơn giản." Người phụ trách cần các lựa chọn và các đánh đổi để đưa ra một quyết định thay vì phê duyệt một kết luận.
- "Báo cáo mức tăng đo được và bỏ thời gian đánh giá." Nhiệm vụ đầy đủ bao gồm đánh giá và sửa của con người; một mô hình nhanh hơn vẫn có thể làm nhiệm vụ chậm hơn.

## Taught in

[Bài học feedback ratchet](../../../phases/14-agent-engineering/54-build-the-feedback-ratchet/) đưa ra bản tóm lược quyết định, quy tắc thẩm quyền và rubric nghiệm thu.
