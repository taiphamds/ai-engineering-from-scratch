---
id: prototype-became-production
title: A prototype that quietly acquired real users
card: behavioral
kind: debug
level: 3
roles: [applied-ai-engineer, agentic-ai-engineer, forward-deployed-ai-engineer, inference-engineer]
rounds: [behavioral]
tags: [stage-drift, prototype, pilot, production, ownership]
minutes: 12
lessons: [phases/14-agent-engineering/53-prototype-pilot-or-production]
manuals: []
practice: []
cheatsheet: [product-discovery, production-llm-app]
related: [behavioral/smallest-slice-that-decides, behavioral/decision-brief-after-setback]
updated: 2026-11-03
---

Bạn phát hiện một prototype cuối tuần bạn đã chia sẻ nội bộ hiện được một nhóm khác dùng mỗi ngày, với dữ liệu production, và ai đó vừa báo cáo một lần ngừng hoạt động cho bạn. Hãy trình bày điều gì đã sai trước thời điểm này và bạn làm gì trong tuần đầu.

## Short answer

Hệ thống trôi qua các giai đoạn. Nó có thêm người dùng, dữ liệu và thẩm quyền mà không có thêm quyền sở hữu, và không có gì trong chính hệ thống đánh dấu nó là một prototype. Trong tuần đầu tôi làm giai đoạn có thể quan sát trong cấu hình, kiểm soát truy cập, telemetry và tài liệu, cắt đường dữ liệu production cho đến khi một người phụ trách được nêu chấp nhận nó, và quyết định cùng nhóm đó liệu giai đoạn tiếp theo đúng là một pilot có giới hạn hay một lần dừng.

## Full answer

### Three stages ask three questions

| Giai đoạn | Câu hỏi chính |
|---|---|
| Prototype | Cơ chế này có thể tạo ra bằng chứng hay không? |
| Pilot | Nó có hoạt động an toàn với một nhóm người dùng thật có giới hạn và các điều kiện thật không? |
| Production | Chúng ta có thể sở hữu nó liên tục ở mức độ tin cậy và rủi ro đã hứa không? |

Đây là các môi trường học hỏi, không phải các mức độ trau chuốt. Một prototype có thể hoàn chỉnh về kỹ thuật và vẫn có thể bỏ đi. Production bắt đầu khi tổ chức chấp nhận trách nhiệm liên tục.

### What went wrong

Prototype được xây dựng cho một câu hỏi và không có các bảo đảm vận hành sai, điều đó đúng. Thất bại là sự trôi giai đoạn: nó có thêm một nhóm người dùng, dữ liệu thật và thẩm quyền ảnh hưởng công việc của nhóm khác, và không ai nhận quyền sở hữu. Một banner cảnh báo sẽ không ngăn được điều này. Giai đoạn phải được hệ thống thực thi: một cờ cấu hình chặn dữ liệu production, kiểm soát truy cập giới hạn nhóm người dùng, telemetry cho thấy ai dùng nó, và tài liệu nói nó là gì.

### The first week

1. Cầm máu: chặn đường dữ liệu production bằng một biện pháp kiểm soát kỹ thuật, không phải một thông điệp.
2. Nêu giai đoạn trong hệ thống để bất kỳ ai cũng có thể thấy.
3. Gặp nhóm kia với các yêu cầu pilot: một nhóm người dùng được nêu, một con người phụ trách, thời lượng và thẩm quyền có giới hạn, kiểm toán và rollback, các ngưỡng kết quả và guardrail, và các tiêu chí thoát để mở rộng, sửa đổi hoặc dừng.
4. Quyết định. Nếu không ai sẽ sở hữu nó, kết quả trung thực là một lần dừng, và bằng chứng nó tạo ra vẫn được tính.

### What production would require

Một mục tiêu mức dịch vụ, quyền sở hữu trực và sự cố, đánh giá bảo mật và quyền riêng tư, các biện pháp kiểm soát chi phí và dung lượng, rollback và khôi phục, giám sát liên tục, và một con đường loại bỏ. Triển khai không phải production. Quyền sở hữu mới là production.

## Follow-ups

- **Level 3:** Nhóm kia nói lần ngừng hoạt động cho thấy công cụ có giá trị. Bạn trả lời thế nào? Expected: giá trị là một lý do để chạy một pilot có giới hạn với một người phụ trách, không phải một lý do để giữ một hệ thống không có người phụ trách trên dữ liệu production.
- **Level 3:** Biện pháp kiểm soát kỹ thuật nào sẽ ngăn được sự trôi? Expected: một cấu hình hoặc kiểm soát truy cập từ chối dữ liệu production trừ khi một người phụ trách đặt giai đoạn thành pilot hoặc production.
- **Level 4:** Trách nhiệm vận hành đầu tiên nào làm một bản xây dựng thành production? Expected: ai đó chấp nhận một cam kết trực hoặc sở hữu sự cố; trước đó, hệ thống có người dùng nhưng không có người phụ trách.
- **Level 4:** Nhóm muốn bỏ pilot và đi thẳng đến production. Bằng chứng nào sẽ biện minh điều đó? Expected: hậu quả thấp, sự sẵn sàng vận hành, và các kết quả đo được về kết quả và guardrail từ một nhóm người dùng thật có giới hạn.

## Wrong answers

- "Thêm một banner nói prototype." Một banner không ngăn dữ liệu, người dùng hoặc thẩm quyền chảy vào.
- "Gia cố prototype thành sản phẩm vì mọi người đã dùng nó." Mã prototype chỉ giành được một giai đoạn nữa nếu bằng chứng nói vậy; việc sử dụng không phải bằng chứng đó.
- "Tắt nó mà không thảo luận." Bằng chứng nó tạo ra là thật; người chịu trách nhiệm quyết định cần các lựa chọn, không phải một bất ngờ.

## Taught in

[Bài học prototype, pilot hoặc production](../../../phases/14-agent-engineering/53-prototype-pilot-or-production/) đưa ra ba câu hỏi giai đoạn, các yêu cầu pilot và các biện pháp kiểm soát sự trôi giai đoạn.
