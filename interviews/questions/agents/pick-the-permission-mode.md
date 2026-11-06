---
id: pick-the-permission-mode
title: Pick the permission mode for the task in front of you
card: agents
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, design-review]
tags: [permission-modes, autonomy, classifier, budgets, isolation]
minutes: 8
lessons: [phases/15-autonomous-systems/10-claude-code-permission-modes]
manuals: []
practice: []
cheatsheet: [autonomous-agents, coding-agents]
related: []
updated: 2026-11-03
---

Một coding agent cung cấp sáu chế độ quyền hạn, từ một chế độ hỏi trước mọi hành động đến một chế độ phê duyệt mọi thứ. Một đồng nghiệp chạy mọi nhiệm vụ trong chế độ phê duyệt mọi thứ, vì các lời nhắc gây phiền. Đưa ra quy tắc bạn dùng để chọn một chế độ, và nói những nhiệm vụ nào đi đâu.

## Short answer

Chọn chế độ từ nhiệm vụ, không từ sự phiền toái. Bắt đầu một nhiệm vụ chưa quen hoặc gần production trong chế độ lập kế hoạch, nơi đọc kế hoạch rẻ hơn hoàn tác một lần chạy sai. Dùng chế độ mặc định cho phần lớn các phiên tương tác, và chế độ tự phê duyệt các lần ghi file cho một lần refactor đã biết trên nhiều file. Dành chế độ auto do bộ phân loại điều khiển cho các lần chạy không giám sát bên trong một workspace mà bạn đã đo tầm với, và dành chế độ phê duyệt mọi thứ cho một container dùng rồi bỏ.

## Full answer

### The ladder

| Chế độ | Hành vi | Phù hợp |
|---|---|---|
| `plan` | Agent đề xuất một kế hoạch, và mọi hành động được đánh giá trước khi chạy | Một nhiệm vụ chưa quen, mã gần production, lần chạy đầu tiên trên một repo |
| `default` | Các hành động chạy, và agent hỏi về bất kỳ thứ gì rủi ro như shell, thao tác phá hủy hoặc mạng | Phần lớn các phiên tương tác |
| `acceptEdits` | Các lần ghi file được phê duyệt, và shell cùng mạng vẫn hỏi | Một lần refactor trên nhiều file |
| `auto` | Một mô hình phân loại riêng đánh giá mỗi hành động và chặn sự leo thang vượt yêu cầu | Một lần chạy dài không giám sát trong một workspace bị ràng buộc |
| `dontAsk` | Không bao giờ nhắc, và bất kỳ thứ gì không được một quy tắc phê duyệt trước bị từ chối | Các sandbox tạm thời, các job CI |
| `bypassPermissions` | Phê duyệt mọi thứ | Chỉ một container mà bạn sẵn lòng vứt bỏ |

### What the classifier mode adds and misses

Chế độ auto đưa việc phê duyệt ra khỏi đường đi của người dùng. Một mô hình riêng phán xét mỗi hành động được đề xuất đối chiếu với nhiệm vụ được khai báo và trạng thái phiên, và một hành động bị chặn quay về người dùng. Nó bắt prompt injection rõ ràng ánh xạ đến một dạng hành động rủi ro đã biết, các vòng lặp công cụ lặp lại nơi hành động N+1 trông như hành động N năm lần liên tiếp, và các lệnh shell không đúng chỗ trong một phiên chỉnh sửa file. Nó bỏ sót injection tinh vi thay đổi hành vi mà không có một hành động bị đánh dấu, và nó bỏ sót một quỹ đạo gây hại được tạo từ các hành động an toàn riêng lẻ, vì nó phán xét hành động và không suy ra lại ý định của người dùng. Tính khả dụng phụ thuộc vào gói, tổ chức, mô hình và nhà cung cấp, và tài liệu nói rõ bộ phân loại là một lớp, không phải một giải pháp.

### Budgets travel with the mode

Bất kỳ chế độ nào, đặt các biện pháp kiểm soát ngân sách: một mức trần lượt, một mức trần đô la hủy phiên, và các giới hạn số hành động theo công cụ. Trong trường hợp không giám sát, thêm một danh sách cho phép, một workspace cô lập không có thông tin xác thực và không có mount production, và một lần kiểm toán quỹ đạo sau đó.

### The answer to the colleague

Chế độ phê duyệt mọi thứ được ghi tài liệu dành cho một container dùng rồi bỏ. Trên một laptop có thông tin xác thực, một phiên trình duyệt và một terminal mở, bề mặt tấn công là mọi thứ agent có thể tiếp cận. Các lời nhắc là biện pháp kiểm soát, và cách sửa cho quá nhiều lời nhắc là một chế độ lên một bậc trên thang, không phải đỉnh của nó.

## Follow-ups

- **Level 2:** Tại sao chế độ refactor vẫn hỏi về các lệnh shell? Expected: một lần ghi file có thể đảo ngược từ quản lý phiên bản, trong khi một lệnh shell có thể xóa, gửi hoặc cài, nên chế độ chỉ phê duyệt lớp rẻ để hoàn tác.
- **Level 2:** Chế độ không bao giờ nhắc khác với đỉnh thang thế nào? Expected: chế độ không bao giờ nhắc từ chối bất kỳ thứ gì mà một quy tắc chưa phê duyệt trước, trong khi chế độ phê duyệt mọi thứ phê duyệt nó.
- **Level 3:** Một lần chạy không giám sát cần một ngân sách 24 giờ. Bạn đặt gì? Expected: một mức trần lượt, một mức trần đô la, các mức trần hành động theo công cụ và một danh sách cho phép, mỗi thứ có một lý do, bên trong một workspace không có thông tin xác thực và không có lưu lượng đi ra mà bạn chưa chủ động cho phép.
- **Level 3:** Bộ phân loại phê duyệt mọi hành động và lần chạy vẫn tuồn dữ liệu ra ngoài. Bằng cách nào? Expected: một chuỗi các hành động được phép, như viết dữ liệu bạn sở hữu vào một file rồi push lên một repository công khai, nơi sự kết hợp là vấn đề và không hành động đơn lẻ nào bị đánh dấu.

## Wrong answers

- "Phê duyệt mọi thứ, vì dù sao agent cũng ở trong quản lý phiên bản." Quản lý phiên bản bao phủ các lần ghi file, và rủi ro nằm trong shell, mạng và thông tin xác thực, mà không commit nào hoàn tác.
- "Chế độ bộ phân loại an toàn cho bất kỳ thứ gì, vì một mô hình đánh giá mỗi bước." Bộ phân loại phán xét các hành động, không các quỹ đạo, và tài liệu ghép nó với các ngân sách, danh sách cho phép và cô lập.
- "Chế độ lập kế hoạch dành cho người mới." Chế độ lập kế hoạch dành cho nhiệm vụ mà một lần chạy sai tốn hơn một lần đọc, và đó là một thuộc tính của nhiệm vụ, không của người vận hành.

## Taught in

[Bài học các chế độ quyền hạn](../../../phases/15-autonomous-systems/10-claude-code-permission-modes/) trình bày sáu chế độ, bộ phân loại và các biện pháp kiểm soát ngân sách.
