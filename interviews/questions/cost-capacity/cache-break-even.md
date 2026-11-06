---
id: cache-break-even
title: How many reads a cached prefix needs to pay off
card: cost-capacity
kind: estimate
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer, inference-engineer]
rounds: [screen, system-design]
tags: [prompt-caching, break-even, ttl, cost]
minutes: 8
lessons: [phases/11-llm-engineering/15-prompt-caching, phases/17-infrastructure-and-production/14-prompt-semantic-caching]
manuals: []
practice: []
cheatsheet: [llm-cost-caching]
related: [cost-capacity/two-cache-layers, cost-capacity/parallel-calls-miss-the-cache]
updated: 2026-11-03
---

Nhà cung cấp của bạn thu thêm 25 phần trăm để ghi một tiền tố vào cache của họ, và tính phí một lần đọc cache bằng một phần mười giá đầu vào thông thường. Cache tồn tại trong năm phút. Một biến thể một giờ tốn gấp đôi giá đầu vào thông thường để ghi. Mỗi biến thể cần bao nhiêu lần đọc để có lợi, và bạn đưa ra quy tắc gì cho nhóm?

## Short answer

Với cache năm phút, một lần ghi và một lần đọc có chi phí trung bình 0.675 chi phí thông thường mỗi request, tiết kiệm khoảng 32 phần trăm, vì vậy cache có lợi ngay lần đọc đầu tiên. Một lần ghi và mười lần đọc có trung bình 0.205, tiết kiệm khoảng 80 phần trăm. Cache một giờ tính 2x cho lần ghi, vì vậy khối đó cần hai lần đọc trước khi có lợi. Quy tắc: cache bất cứ thứ gì bạn mong đợi tái sử dụng ít nhất ba lần trong thời gian tồn tại của nó.

## Full answer

### The arithmetic

Một lần ghi tốn 1.25 lần giá đầu vào thông thường, và một lần đọc tốn 0.1 lần giá đó.

- Một lần ghi và một lần đọc: hai request có giá trung bình 0.675 giá thông thường. Đó là tiết kiệm 32 phần trăm ngay lần đọc đầu tiên.
- Một lần ghi và mười lần đọc: các request có giá trung bình 0.205 giá thông thường, tiết kiệm khoảng 80 phần trăm.
- Cache một giờ ghi ở mức 2 lần giá thông thường. Với một lần đọc trung bình nằm trên giá thông thường, và với hai lần đọc nó xuống dưới. Bài học nói khối một giờ hoàn vốn nhanh trên bất kỳ batch nào tái sử dụng tiền tố hơn năm lần.

Ba lần tái sử dụng trong thời gian tồn tại vượt điểm hòa vốn trên cả hai biến thể, là quy tắc mà bài học đưa ra.

### What breaks the arithmetic

- Một tiền tố khác đi một token trên mỗi request, vì một dấu thời gian, một request id hoặc một danh sách công cụ bị xáo lại. Mọi request đều ghi và không request nào đọc.
- Một khối dưới kích thước tối thiểu có thể cache, là 1,024 token ở nhà cung cấp trong bài học. Một khối nhỏ hơn âm thầm không được cache.
- Các request đến song song trước khi lần ghi đầu tiên hoàn tất. Mỗi request trả khoản phí ghi thêm, và không request nào đọc.

### Verify it

Đọc các trường usage trên mọi phản hồi: các token được ghi vào cache và các token được đọc từ nó. Trong CI, khẳng định rằng request giống hệt thứ hai đọc nhiều hơn không. Trên dashboard, chia các token đầu vào thành đã cache và chưa cache, nếu không một đợt giảm lưu lượng sẽ trông như một thắng lợi của cache.

## Follow-ups

- **Level 2:** Tại sao cache năm phút có lợi ngay lần đọc đầu tiên? Expected: phí ghi thêm là một phần tư và lần đọc tiết kiệm chín phần mười, vì vậy hai lần cùng nhau đã có trung bình dưới giá thông thường.
- **Level 2:** Khi nào cache một giờ hợp lý? Expected: một công việc batch tái sử dụng tiền tố qua các lần chạy cách nhau hơn năm phút, hơn năm lần.
- **Level 3:** Các token đầu vào giảm và hóa đơn không đổi. Dashboard sai ở đâu? Expected: nó không chia đầu vào đã cache khỏi chưa cache, vì vậy một đợt giảm lưu lượng trông như một thắng lợi của cache.
- **Level 3:** Mười request song song dùng chung một tiền tố mà chưa ai cache. Điều gì xảy ra với phép tính? Expected: cả mười đều trả khoản phí ghi thêm và không request nào đọc, vì vậy cache tốn nhiều hơn không cache. Gửi một request trước, rồi phần còn lại.

## Wrong answers

- "Caching luôn tiết kiệm tiền." Một tiền tố được ghi một lần và không bao giờ được đọc tốn hơn 25 phần trăm so với không cache.
- "Chọn cache một giờ, nó tồn tại lâu hơn." Nó ghi ở mức gấp đôi giá đầu vào thông thường, vì vậy một khối được đọc một lần tốn hơn khi không có cache.
- "Đánh dấu toàn bộ prompt là có thể cache." Tin nhắn người dùng thay đổi mỗi lần, vì vậy lần khớp kết thúc ở token khác đầu tiên, và một khối dưới kích thước tối thiểu hoàn toàn không được cache.

## Taught in

[Bài học prompt caching](../../../phases/11-llm-engineering/15-prompt-caching/) đưa ra phép tính hòa vốn và các trường xác minh, và [bài học kinh tế caching](../../../phases/17-infrastructure-and-production/14-prompt-semantic-caching/) nêu bẫy ghi song song.
