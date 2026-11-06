---
id: parallel-calls-miss-the-cache
title: Ten parallel tool calls, ten cache writes, no reads
card: cost-capacity
kind: debug
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, inference-engineer]
rounds: [debugging, ml-breadth]
tags: [prompt-caching, agents, fan-out, cost]
minutes: 8
lessons: [phases/17-infrastructure-and-production/14-prompt-semantic-caching, phases/11-llm-engineering/15-prompt-caching]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [cost-capacity/cache-break-even, cost-capacity/two-cache-layers]
updated: 2026-11-03
---

Một agent phân nhánh mười lời gọi công cụ cùng lúc cho mỗi câu hỏi người dùng. Cả mười dùng chung cùng system prompt dài, và prompt caching đang bật. Hóa đơn gấp vài lần mức mà cache đáng lẽ cho phép, và các trường usage cho thấy các lần ghi cache trên gần như mọi lời gọi và gần như không có lần đọc cache. Điều gì đang xảy ra?

## Short answer

Cả mười request đến nhà cung cấp trước khi request đầu tiên ghi xong tiền tố vào cache. Mỗi request thấy một miss, mỗi request trả khoản phí ghi thêm, và không request nào đọc. Cách sửa là tuần tự trước: gửi một request riêng, để lần ghi cache của nó hoàn tất, rồi phân nhánh chín request còn lại. Nó thêm khoảng một độ trễ ghi vào lời gọi công cụ đầu tiên và loại bỏ sự tăng phồng.

## Full answer

### The mechanism

Các lần ghi cache xảy ra theo request. Bài học đặt lần ghi đầu tiên ở khoảng 300 ms sau khi nhà cung cấp thấy prompt. Các request đến trong khoảng thời gian đó không tìm thấy gì để đọc, vì vậy mỗi request ghi. Mười lần ghi và không lần đọc, trên mọi câu hỏi người dùng gặp tiền tố lạnh. Một câu hỏi đến khi một lần ghi trước vẫn còn trong thời gian tồn tại cache đọc nó, vì vậy cái bẫy xuất hiện khi các câu hỏi cách nhau xa hơn thời gian tồn tại đó. Bài học báo cáo một hóa đơn bằng 5 đến 10 lần chi phí đã cache dự kiến chỉ từ mẫu này.

### Read the usage fields

Mỗi phản hồi báo cáo các token được ghi vào cache và các token được đọc từ nó. Trong sự cố này số đếm ghi cao trên mọi request và số đếm đọc gần không. Đó là dấu hiệu. Một request tuần tự sau đó với cùng tiền tố có đọc, phân biệt trường hợp này với một tiền tố không bao giờ khớp.

### The fix

Gửi request đầu tiên riêng và chờ nó trả về. Lần ghi của nó đã hoàn tất vào lúc đó. Phân nhánh chín request còn lại, và mỗi request đọc. Chi phí là khoảng 300 ms trên lời gọi công cụ đầu tiên. Bài tập của bài học yêu cầu cùng cách sửa mà không thêm độ trễ đầu cuối: làm ấm tiền tố bằng một lời gọi lúc bắt đầu phiên, trước lần phân nhánh đầu tiên, để lời gọi công cụ đầu tiên đã đọc.

### Rule out the other cause

Một tiền tố mang văn bản động trông giống như vậy trong các trường usage: các lần ghi trên mọi request, không bao giờ có lần đọc. Ví dụ của bài học có thời gian đến phút, một user id và một thứ tự ví dụ bị xáo lại bên trong system prompt. Một báo cáo thực địa chuyển hit rate từ 7 lên 74 phần trăm bằng cách chuyển văn bản đó xuống dưới ranh giới cache. Kiểm tra prompt template trước khi đổ lỗi cho việc phân nhánh.

## Follow-ups

- **Level 2:** Bạn phân biệt bẫy phân nhánh với văn bản động trong tiền tố như thế nào? Expected: cả hai cho thấy các lần ghi và không có lần đọc. Sau bẫy phân nhánh, một request tuần tự sau đó với cùng tiền tố đọc. Với văn bản động, không có gì từng đọc.
- **Level 3:** Bạn sửa việc phân nhánh mà không thêm độ trễ cho người dùng như thế nào? Expected: làm ấm tiền tố bằng một lời gọi khi phiên bắt đầu, để lần phân nhánh đầu tiên đã đọc.
- **Level 3:** Một prefix cache tự lưu trữ có cùng cái bẫy không? Expected: bài học nói các cache tự lưu trữ theo cùng mẫu tiền tố trên tài nguyên tính toán của chính bạn, vì vậy đo các token đã cache trên một lần phân nhánh trước khi giả định chúng được dùng chung.

## Wrong answers

- "Caching đang bật, vì vậy nhà cung cấp nên khử trùng lặp chúng." Các lần ghi là theo request, và cache chỉ có thể được đọc sau khi lần ghi đầu tiên đã hoàn tất.
- "Rút ngắn system prompt." Điều đó giảm mọi hóa đơn một chút và vẫn để nguyên mười lần ghi và không lần đọc.
- "Tắt caching, nó tốn hơn." Nó chỉ tốn hơn vì mẫu thời điểm đến. Tuần tự trước biến mười lần ghi thành một lần ghi và chín lần đọc.

## Taught in

[Bài học kinh tế caching](../../../phases/17-infrastructure-and-production/14-prompt-semantic-caching/) nêu phản mẫu song song hóa và cách sửa của nó, và [bài học prompt caching](../../../phases/11-llm-engineering/15-prompt-caching/) cho thấy các trường usage cần đọc.
