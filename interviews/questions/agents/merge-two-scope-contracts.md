---
id: merge-two-scope-contracts
title: Two scope contracts apply to one diff, define the merge
card: agents
kind: design
level: 4
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [scope-contract, least-privilege, merge-semantics, egress, time-budget]
minutes: 15
lessons: [phases/14-agent-engineering/36-scope-contracts]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops]
related: [agents/a-login-fix-touched-five-files, agents/safe-actions-harmful-trajectory]
updated: 2026-11-03
---

Một repository có một hợp đồng phạm vi toàn dự án, và mỗi nhiệm vụ thêm hợp đồng riêng. Bộ kiểm tra hiện đọc bất kỳ file nào nó tìm thấy trước. Viết quy tắc gộp cho mọi trường để kết quả mang tính cơ học, có thể đánh giá và không bao giờ lỏng hơn bất kỳ đầu vào nào.

## Short answer

Gộp theo đặc quyền tối thiểu. Lấy giao các glob được phép, để một đường dẫn phải được cả hai hợp đồng cho phép, và lấy hợp các glob bị cấm, để bất kỳ hợp đồng nào cũng có thể cấm một đường dẫn. Lấy ngân sách thời gian nhỏ hơn, tích lũy các phê duyệt bắt buộc, và xử lý danh sách cho phép lưu lượng đi ra với ba trạng thái: chưa đặt nhường cho phía kia, hai danh sách lấy giao, và một danh sách rỗng vẫn từ chối tất cả. Viết quy tắc vào schema hợp đồng để bộ kiểm tra và người đánh giá áp dụng cùng phép gộp.

## Full answer

### The field rules

| Trường | Phép gộp | Lý do |
|---|---|---|
| `allowed_files` | Giao | Cả hai hợp đồng phải cho phép lần ghi |
| `forbidden_files` | Hợp | Bất kỳ hợp đồng nào cũng có thể cấm |
| `time_budget_minutes` | Nhỏ nhất | Đồng hồ nghiêm ngặt hơn thắng |
| `approvals_required` | Hợp | Một phê duyệt được bất kỳ bên nào yêu cầu được phép gộp yêu cầu |
| `network_egress` | Xem bên dưới | Ba trạng thái, với từ chối tất cả có tính hấp thụ |
| `acceptance_criteria` | Hợp | Mọi phép chứng minh được bất kỳ bên nào yêu cầu phải chạy |
| `rollback_plan` | Giữ cả hai | Người vận hành cần mỗi runbook |

### The egress rule in full

`network_egress` có ba trạng thái. `None` nghĩa là không thực thi ràng buộc từ hợp đồng này. `[]` nghĩa là từ chối tất cả. Một danh sách nghĩa là một danh sách cho phép. Khi gộp, `None` nhường cho phía kia, hai danh sách lấy giao, và `[]` ở bất kỳ phía nào cho `[]`. Điểm cuối đó có ý nghĩa: một hợp đồng nhiệm vụ không thể mở mạng khi hợp đồng dự án đã đóng nó.

### Why the merge is in the schema

Một quy tắc gộp nằm trong mã của bộ kiểm tra vô hình với người đánh giá phê duyệt các hợp đồng. Một quy tắc nằm trong schema được bộ kiểm tra, người đánh giá và agent đọc. Cách đặt vấn đề của bài học là hợp đồng chuyển "ở trong phạm vi" từ một mong muốn thành một phép kiểm tra, và một phép gộp không được viết ra lại là một mong muốn.

### Severity still comes from the contract

Các lần ghi ngoài phạm vi vào tài liệu thường là một cảnh báo, và các lần ghi dưới script, migration hoặc cấu hình production luôn là một chặn. Khi gộp, lấy mức độ nghiêm trọng hơn cho một đường dẫn mà cả hai hợp đồng phân loại. Giữ ngân sách vi phạm theo nhiệm vụ, để các sai sót nhỏ xuất hiện dưới dạng cảnh báo và chỉ một lần vượt ngân sách chặn.

### Where the feature list sits

Danh sách tính năng giới hạn dự án, và hợp đồng giới hạn nhiệm vụ. `allowed_files` được gộp phải nằm bên trong những gì tính năng đang hoạt động chạm đến. Nếu hợp đồng nhiệm vụ yêu cầu một đường dẫn mà tính năng không bao phủ, phép kiểm tra khởi động thất bại trước bất kỳ lần ghi nào.

## Follow-ups

- **Level 3:** Hợp đồng dự án không có trường lưu lượng đi ra và hợp đồng nhiệm vụ liệt kê một host. Lưu lượng đi ra được gộp là gì? Expected: danh sách cho phép một host, vì một giá trị chưa đặt nhường cho phía kia.
- **Level 4:** Tại sao lấy giao các glob được phép thay vì hợp chúng? Expected: một phép hợp cho phép một hợp đồng nhiệm vụ cấp một đường dẫn mà dự án cấm bằng cách bỏ sót, và đặc quyền tối thiểu nghĩa là cả hai bên phải đồng ý về mọi lần ghi.
- **Level 4:** Một nhiệm vụ cần một file ngoài hợp đồng dự án một cách hợp lệ. Con đường đến phê duyệt là gì? Expected: một mục trong `approvals_required` với một phê duyệt của con người được ghi lại, và hợp đồng dự án được cập nhật trong đánh giá, không bao giờ một quy tắc gộp lỏng hơn.
- **Level 4:** Bạn kiểm thử phép gộp thế nào? Expected: một bảng các cặp đầu vào và đầu ra kỳ vọng cho mỗi trường, với sự hấp thụ từ chối tất cả và sự nhường của chưa đặt là các trường hợp được đặt tên, chạy trong CI đối với bộ kiểm tra.

## Wrong answers

- "Để hợp đồng nhiệm vụ ghi đè hợp đồng dự án, vì nó cụ thể hơn." Cụ thể không giống an toàn, và một lần ghi đè cho phép bất kỳ nhiệm vụ nào mở bất kỳ đường dẫn hoặc host nào.
- "Lấy hợp các file được phép để không có gì hợp lệ bị chặn." Một phép hợp là kết quả lỏng nhất, và phép gộp không bao giờ được lỏng hơn bất kỳ đầu vào nào.
- "Gộp trong bộ kiểm tra và giữ các hợp đồng đơn giản." Một phép gộp mà người đánh giá không thể đọc là một quy tắc mà nhóm không thể kiểm toán.

## Taught in

[Bài học hợp đồng phạm vi](../../../phases/14-agent-engineering/36-scope-contracts/) đưa ra phép gộp đặc quyền tối thiểu và quy tắc lưu lượng đi ra ba trạng thái.
