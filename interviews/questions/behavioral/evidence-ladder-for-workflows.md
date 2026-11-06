---
id: evidence-ladder-for-workflows
title: Weigh what a stakeholder tells you about their workflow
card: behavioral
kind: concept
level: 2
roles: [forward-deployed-ai-engineer, applied-ai-engineer, ai-developer-relations-engineer]
rounds: [behavioral, customer]
tags: [workflow-discovery, evidence, requirements]
minutes: 10
lessons: [phases/14-agent-engineering/48-discover-the-real-workflow]
manuals: []
practice: []
cheatsheet: [product-discovery]
related: [behavioral/two-users-two-workflows]
updated: 2026-11-03
---

Một người phụ trách phía khách hàng dành một giờ mô tả cách nhóm hỗ trợ của họ xử lý một yêu cầu hoàn tiền. Bây giờ bạn phải quyết định phiên bản đầu tiên của một trợ lý làm gì. Hãy nói bạn coi giờ mô tả đó thế nào, và làm gì tiếp theo.

## Short answer

Một cuộc phỏng vấn là hành vi được báo cáo, là bậc thứ ba của một thang bốn bậc. Tôi gắn nhãn mỗi khẳng định từ giờ đó theo bậc của nó, rồi tìm bằng chứng trực tiếp cho các khẳng định quan trọng nhất: một trace, một bản ghi hình, một ticket hoặc một biểu mẫu đã hoàn tất. Các bước vẫn chưa được chứng minh vẫn nhìn thấy được như các khẳng định còn mở thay vì biến thành các yêu cầu.

## Full answer

### The ladder

1. Hành vi trực tiếp: một quan sát, một trace, một bản ghi hình hoặc một sự kiện hệ thống.
2. Một sản phẩm: một ticket, một runbook, một log, một biểu mẫu hoặc một đầu ra đã hoàn tất.
3. Hành vi được báo cáo: một người mô tả những gì họ làm.
4. Suy luận: nhóm kết luận điều gì có lẽ xảy ra.

Cả bốn đều giúp ích. Chỉ hai bậc đầu chứng minh hành vi hiện tại. Khi tôi viết workflow ra, mỗi bước mang bậc của nó, để độ tin cậy không tự tăng.

### What I reconstruct

Tôi không bắt đầu với các mong muốn tính năng. Tôi dựng lại điều xảy ra hiện nay, từng bước, với tác nhân, trigger, hành động, đầu vào, đầu ra, ma sát, người giữ thẩm quyền cho một thay đổi có hậu quả, và bằng chứng. Workflow lớn hơn màn hình. Nó bao gồm chờ đợi, sao chép và dán, các kênh phụ, phê duyệt, khôi phục lỗi và các bước mọi người đã ngừng nhận thấy.

### Four things I search for

- Ma sát: công sức lặp lại, trì hoãn, nhập lại hoặc khôi phục.
- Trạng thái ẩn: các thông tin được mang trong trí nhớ, trò chuyện hoặc ghi chú cá nhân.
- Thẩm quyền: người hoặc hệ thống được phép thực hiện thay đổi có hậu quả.
- Các ngoại lệ: trường hợp đường bình thường ngừng bình thường.

Các trợ lý thất bại thường xuyên nhất tại các lần bàn giao và ngoại lệ, vì chỉ đường thành công được định hình. Vì vậy thứ đầu tiên tôi yêu cầu sau cuộc phỏng vấn là một trace thật của một ngoại lệ.

### How this changes the first version

Một bước có bằng chứng trực tiếp có thể trở thành một yêu cầu. Một bước chỉ có bằng chứng được báo cáo trở thành một giả định để kiểm thử. Mô tả từ giờ đó cho tôi biết nhìn ở đâu, không phải xây dựng gì.

## Follow-ups

- **Level 2:** Người phụ trách nói "chúng tôi luôn kiểm tra lịch sử đơn hàng trước." Bạn xác nhận điều đó thế nào? Expected: yêu cầu một bản ghi hình hoặc một log của ba trường hợp thật và đánh dấu khẳng định là được báo cáo cho đến khi một trường hợp cho thấy nó.
- **Level 2:** Tỷ lệ bằng chứng trực tiếp là gì và tại sao theo dõi nó? Expected: tỷ lệ các bước workflow được hỗ trợ bởi quan sát hoặc một sản phẩm; một tỷ lệ thấp nghĩa là mô hình workflow phần lớn là niềm tin.
- **Level 3:** Bạn chỉ có thể quan sát đường thành công. Rủi ro là gì? Expected: đường ngoại lệ, nơi phần lớn thất bại nằm, vẫn chưa được định hình, nên trợ lý hỏng tại lần bàn giao có ý nghĩa.
- **Level 3:** Một tính năng được đề xuất loại bỏ một bước nhìn thấy được. Bạn kiểm tra gì trước khi chấp nhận nó? Expected: liệu công việc ẩn đằng sau bước đó có còn tồn tại, để tính năng chỉ di chuyển công sức đến nơi vô hình.

## Wrong answers

- "Khách hàng biết quy trình của họ, nên cuộc phỏng vấn là yêu cầu." Một mô tả là hành vi được báo cáo; nó hữu ích nhưng không chứng minh điều xảy ra.
- "Lấy trung bình các mô tả từ một số người thành một workflow." Một workflow được lấy trung bình có thể không mô tả ai; các biến thể phải giữ riêng cho đến khi biết nguyên nhân của chúng.
- "Suy ra các bước thiếu từ các nhóm tương tự." Suy luận là bậc yếu nhất và phải giữ nhãn là một phỏng đoán.

## Taught in

[Bài học khám phá workflow](../../../phases/14-agent-engineering/48-discover-the-real-workflow/) đưa ra thang bằng chứng và bản ghi bước.
