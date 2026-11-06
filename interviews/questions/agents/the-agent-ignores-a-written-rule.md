---
id: the-agent-ignores-a-written-rule
title: The rule is in the repo, and the agent keeps breaking it
card: agents
kind: debug
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, design-review]
tags: [agent-rules, reachability, conflicting-instructions, aspirational-rule, router]
minutes: 12
lessons: [phases/14-agent-engineering/33-instructions-as-executable-constraints, phases/14-agent-engineering/32-minimal-agent-workbench]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops, coding-agents]
related: [agents/router-or-manual, agents/rules-the-workbench-can-check]
updated: 2026-11-03
---

Một quy tắc nói không file migration nào được thay đổi nếu không có một phê duyệt. Nó nằm trong `docs/database.md`, được `docs/architecture.md` liên kết, được file chỉ dẫn cấp cao nhất liên kết. File gốc cũng nói luôn dùng ORM, trong khi tài liệu cơ sở dữ liệu nói viết SQL thô trong các migration. Agent đã thay đổi một migration hai lần tuần này mà không hỏi. Tìm các nguyên nhân và sửa chúng theo thứ tự.

## Short answer

Có ba nguyên nhân độc lập, và bất kỳ nguyên nhân nào cũng đủ. Quy tắc cách router ba bước nhảy, vượt giới hạn tiếp cận hai bước nhảy, nên agent không bao giờ nạp nó, và nó là văn xuôi không có phép kiểm tra, nên không có gì từ chối lần ghi ngay cả khi agent đọc nó. Và file gốc xung đột với tài liệu cơ sở dữ liệu, và các chỉ dẫn xung đột âm thầm chuyển một agent từ hỏi sang đoán. Sửa tầm tiếp cận trước, làm quy tắc thành một quy tắc danh mục phê duyệt với một phép kiểm tra mức độ chặn, và loại bỏ xung đột.

## Full answer

### Cause one: reachability

Agent nên tiếp cận bất kỳ quy tắc nào trong tối đa hai bước nhảy từ router. Quy tắc này cần ba. Router phải liên kết mọi tài liệu chủ đề theo đường dẫn, nên `docs/database.md` thuộc về router, và bản thân quy tắc thuộc về `docs/agent-rules.md`, mà agent đọc ở mỗi lần khởi động. Một con trỏ không phân giải được là một thất bại tệ hơn một quy tắc bị thiếu, nên kiểm tra mỗi đường dẫn trong router tồn tại, và làm một liên kết hỏng thành một vi phạm khởi động.

### Cause two: an aspirational rule

"Không thay đổi các migration nếu không có phê duyệt" là một mong muốn cho đến khi có một phép kiểm tra. Viết lại nó thành một quy tắc danh mục phê duyệt với một slug, một mô tả một dòng, một `check` so sánh diff với `migrations/**` và tìm một bản ghi phê duyệt, và mức độ `block`. Runtime từ chối ở mức chặn. Bộ kiểm tra báo cáo nó. Một lần ghi đè cần một chữ ký con người trong log kiểm toán.

### Cause three: conflicting instructions

File gốc yêu cầu ORM ở mọi nơi. Tài liệu cơ sở dữ liệu yêu cầu SQL thô bên trong các file migration. Agent không thể thỏa mãn cả hai, và tác động đo được của các chỉ dẫn xung đột là một sự dịch chuyển âm thầm từ một chế độ tương tác, nơi agent hỏi, sang một chế độ tham lam, nơi nó đoán. Một phép đo trong bài học đặt tỷ lệ giải quyết tại 48.8 phần trăm khi không có xung đột và 28 phần trăm khi có. Một agent trong chế độ tham lam không hỏi phê duyệt. Đánh số các mức ưu tiên thay vì xếp chúng ngang nhau, hoặc giới hạn quy tắc ORM vào mã ứng dụng và quy tắc SQL vào các migration để chúng không còn chồng lấp.

### The order

1. Chuyển quy tắc vào file quy tắc và liên kết tài liệu cơ sở dữ liệu từ router. Bây giờ agent đọc nó.
2. Thêm phép kiểm tra và mức độ nghiêm trọng. Bây giờ runtime từ chối.
3. Giải quyết xung đột. Bây giờ agent hỏi thay vì đoán.
4. Thêm một lint workbench thất bại khi router vượt ngân sách dòng hoặc tham chiếu một file bị thiếu, để sự suy giảm không thể trở lại.

### Prove it

Chạy bộ kiểm tra trên hai lần chạy tuần này. Báo cáo quy tắc phải cho thấy quy tắc phê duyệt trượt trên cả hai, với mức độ chặn. Sau đó chạy agent trên một nhiệm vụ chạm đến một migration và xác nhận rằng nó mở một yêu cầu phê duyệt trước lần ghi.

## Follow-ups

- **Level 3:** Tại sao một file gốc ngắn hơn giúp ở đây? Expected: một router ngắn được đọc đầy đủ ở mỗi phiên và mỗi lần đánh giá pull request, nên một con trỏ đến tài liệu cơ sở dữ liệu giữ tính hiện hành và tiếp cận được.
- **Level 3:** Nhóm muốn giữ quy tắc trong tài liệu cơ sở dữ liệu vì đó là nơi có ngữ cảnh. Bạn làm gì? Expected: giữ phần giải thích ở đó, đặt quy tắc và phép kiểm tra của nó trong file quy tắc, và liên kết cả hai từ router, để quy tắc cách hai bước nhảy và vẫn có ngữ cảnh của nó.
- **Level 4:** Bạn sẽ tìm hai quy tắc mâu thuẫn nhau trước một sự cố thế nào? Expected: một lint đánh dấu hai quy tắc có các phạm vi chồng lấp với các động từ khác nhau, và một thói quen đánh giá đánh số các mức ưu tiên trong router.
- **Level 4:** Bộ kiểm tra đạt trong CI, và agent vẫn chỉnh sửa một migration trong một phiên trực tiếp. Khoảng trống ở đâu? Expected: bộ kiểm tra chạy sau sự việc, nên cùng phép kiểm tra cũng phải chạy như một pre-tool hook trong runtime, nơi nó có thể từ chối lần ghi trước khi xảy ra.

## Wrong answers

- "Thêm quy tắc vào system prompt bằng chữ in hoa." Nhấn mạnh không thêm một phép kiểm tra, và xung đột trong router vẫn đẩy agent về phía đoán.
- "Mô hình đang phớt lờ các chỉ dẫn, nên đổi mô hình." Quy tắc không tiếp cận được, không kiểm tra được và bị mâu thuẫn, và một mô hình khác gặp cùng ba vấn đề.
- "Xóa quy tắc ORM, vì nó gây xung đột." Quy tắc ORM đúng cho mã ứng dụng, nên giới hạn phạm vi của nó thay vì xóa nó.

## Taught in

[Bài học các ràng buộc thực thi được](../../../phases/14-agent-engineering/33-instructions-as-executable-constraints/) đặt quy tắc hai bước nhảy và năm danh mục, và [bài học workbench tối thiểu](../../../phases/14-agent-engineering/32-minimal-agent-workbench/) đo chi phí của các chỉ dẫn mâu thuẫn nhau.
