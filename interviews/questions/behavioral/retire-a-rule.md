---
id: retire-a-rule
title: Decide what to delete from a bloated instruction file
card: behavioral
kind: tradeoff
level: 3
roles: [agentic-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [behavioral]
tags: [controls, retirement, instructions, agent-workbench]
minutes: 10
lessons: [phases/14-agent-engineering/46-turn-feedback-into-system, phases/14-agent-engineering/54-build-the-feedback-ratchet]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops, delegation-feedback]
related: [behavioral/correction-to-control, behavioral/feedback-ratchet-owner]
updated: 2026-11-03
---

File hướng dẫn agent của một nhóm đã phình ra trong một năm. Các quy tắc mâu thuẫn nhau, ngữ cảnh nặng nề, và không ai nhớ tại sao một nửa số đó tồn tại. Bạn được yêu cầu dọn dẹp nó. Bạn quyết định điều gì giữ lại, điều gì bỏ đi, và điều gì bạn chưa đụng đến như thế nào?

## Short answer

Mỗi biện pháp kiểm soát cần một điều kiện ngừng áp dụng, và việc ngừng áp dụng cần bằng chứng như mọi thay đổi khác. Tôi xem xét mỗi quy tắc theo bốn câu hỏi: kiến trúc hoặc quy trình làm việc mà nó bảo vệ đã thay đổi chưa, một biện pháp kiểm soát thực thi được mạnh hơn đã thay thế nó chưa, lỗi đã không xuất hiện trong một khoảng thời gian có ý nghĩa chưa, và quy tắc có cản trở công việc hợp lệ thường xuyên hơn là ngăn ngừa tác hại không. Một quy tắc không đáp ứng điều nào trong số đó thì giữ lại, và một quy tắc mà tôi không thể truy nguyên về một nguyên nhân sẽ được giao một người phụ trách và một ngày xem xét trước khi bị xóa.

## Full answer

### Why the file grew

Mỗi quy tắc là một lần sửa được nâng thành văn bản. Văn bản là lớp bền vững yếu nhất. Qua một năm, các quy tắc đã mã hóa một hệ thống không còn tồn tại, bắt đầu xung đột, và giờ tiêu tốn ngữ cảnh trong mỗi lần chạy. Mục tiêu không phải là file hướng dẫn dài nhất. Đó là hệ thống nhỏ nhất lưu giữ được sự phán đoán khó khăn mới có được.

### The review

| Câu hỏi | Nếu có |
|---|---|
| Kiến trúc hoặc quy trình làm việc đã thay đổi chưa? | Quy tắc bảo vệ một hệ thống đã không còn; ngừng áp dụng nó |
| Một kiểu, một kiểm thử hoặc một quyền đã thay thế nó chưa? | Xóa văn bản và giữ lại biện pháp kiểm soát thực thi được |
| Lỗi đã không tái diễn trong khoảng thời gian đó chưa? | Ngừng áp dụng nó, và ghi lại khoảng thời gian đó làm bằng chứng |
| Nó có cản trở công việc hợp lệ nhiều hơn là ngăn ngừa tác hại không? | Viết lại nó với phạm vi hẹp hơn hoặc ngừng áp dụng nó |

### Replace before delete

Với một quy tắc vẫn bảo vệ trước một rủi ro thực sự, bước đi tốt hơn thường là nâng cấp thay vì ngừng áp dụng: một quy tắc bằng văn bản về hình dạng đầu ra trở thành một ví dụ cộng với một bộ xác thực, một quy tắc bằng văn bản về file trở thành một chính sách phạm vi. Tôi chỉ xóa câu đó sau khi chứng minh biện pháp kiểm soát mạnh hơn tồn tại và kích hoạt.

### What I do not touch yet

Một quy tắc không có nguyên nhân được ghi lại và không có người phụ trách là một khoảng trống trong hồ sơ, không phải một ứng viên để xóa. Tôi giao cho nó một người phụ trách và một ngày xem xét, và tôi tìm lần sửa đã tạo ra nó. Xóa nó vì nó có vẻ cũ là sai lầm mà bài học cảnh báo.

### Guard against regrowth

Mỗi biện pháp kiểm soát mới được giao một người phụ trách, một cách xác minh, một khoảng thời gian xem xét hoặc hết hạn và một điều kiện ngừng áp dụng khi được tạo ra. Thiếu điều đó, file lại đầy lên trong một năm.

## Follow-ups

- **Level 3:** Hai quy tắc mâu thuẫn nhau. Bạn làm gì trước? Expected: tìm nguyên nhân đằng sau mỗi quy tắc; một mâu thuẫn thường có nghĩa là một trong số chúng bảo vệ một hệ thống hoặc quyết định đã thay đổi.
- **Level 3:** Một quy tắc đã không kích hoạt trong nhiều tháng. Thế đã đủ để xóa nó chưa? Expected: chỉ khi khoảng thời gian đó có ý nghĩa đối với lỗi đó và rủi ro mà nó bảo vệ vẫn còn hiện diện ở nơi khác; tần suất thấp với hậu quả cao có thể khiến một quy tắc tiếp tục tồn tại.
- **Level 4:** Bạn cho thấy một lần xóa là an toàn như thế nào? Expected: biện pháp kiểm soát mạnh hơn thay thế nó kích hoạt trên trường hợp lỗi ban đầu, và sự tái diễn vẫn không xuất hiện trong khoảng thời gian xem xét.
- **Level 4:** Điều gì ngăn file phình ra trở lại? Expected: một quy tắc khi tạo rằng mỗi biện pháp kiểm soát đều mang theo một người phụ trách, một cách xác minh và một điều kiện ngừng áp dụng, với việc xem xét định kỳ.

## Wrong answers

- "Xóa mọi thứ cũ hơn một năm và xem thứ gì hỏng." Việc ngừng áp dụng cần bằng chứng; một lỗi âm thầm có thể mất nhiều tháng mới xuất hiện.
- "Giữ lại tất cả, ngữ cảnh rẻ mà." Các quy tắc lỗi thời xung đột, mã hóa một hệ thống đã chết và làm phình mọi lần chạy.
- "Viết lại toàn bộ file từ đầu." File lưu giữ sự phán đoán đã phải trả giá để có được; công việc là chuyển nó sang các lớp mạnh hơn, không phải đánh mất nó.

## Taught in

[Bài học từ phản hồi đến hệ thống](../../../phases/14-agent-engineering/46-turn-feedback-into-system/) đưa ra các phép kiểm tra ngừng áp dụng và [bài học ratchet phản hồi](../../../phases/14-agent-engineering/54-build-the-feedback-ratchet/) đưa ra các trường người phụ trách và hết hạn.
