---
id: router-or-manual
title: A short router or a long manual for the agent
card: agents
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [design-review, ml-breadth]
tags: [agents-md, router, progressive-disclosure, instructions, context-budget]
minutes: 10
lessons: [phases/14-agent-engineering/32-minimal-agent-workbench, phases/14-agent-engineering/33-instructions-as-executable-constraints]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops, coding-agents]
related: [agents/seven-surfaces-one-symptom-each]
updated: 2026-11-03
---

Một repo có một file chỉ dẫn 3000 dòng cho coding agent của nó. Agent tuân theo khoảng một nửa. Một kỹ sư muốn cắt nó xuống một trang. Người khác nói mọi dòng đến từ một sự cố và không có gì có thể bỏ. Bạn giải quyết thế nào?

## Short answer

Cả hai đều đúng về một điều gì đó, và câu trả lời là một tập file phân lớp, không phải một file ngắn hơn. Giữ một router gốc dưới khoảng 50 dòng chỉ giữ các con trỏ và vài quy tắc cứng. Chuyển các quy tắc vào một file quy tắc với một màn hình cho mỗi danh mục, và chuyển phần chuyên sâu vào các tài liệu chủ đề mà agent chỉ nạp khi một nhiệm vụ chạm đến chúng. Mọi quy tắc ở lại, và agent tiếp cận bất kỳ quy tắc nào trong tối đa hai bước nhảy.

## Full answer

### Why the long file fails

Mô hình nạp file, đọc màn hình đầu tiên, hết ngân sách chú ý, và hành động theo một phần của những gì nó được bảo. Một cẩm nang dài thất bại vì cùng lý do một tài liệu nhập môn bốn mươi trang thất bại. Người đọc lướt nó một lần và không bao giờ trở lại phần có ý nghĩa. Các cẩm nang dài bị phớt lờ. Các router ngắn được tuân theo.

### The three tiers

| Tầng | Nằm trong | Đọc khi | Kích thước |
|---|---|---|---|
| Router | file chỉ dẫn gốc | Mọi phiên | Dưới khoảng 50 dòng |
| Quy tắc | `docs/agent-rules.md` | Mọi phiên, khi khởi động | Một màn hình cho mỗi danh mục |
| Tài liệu chủ đề | `docs/<topic>.md` | Chỉ khi nhiệm vụ chạm đến chủ đề đó | Sâu đến mức cần thiết |

Router trỏ đến file trạng thái, bảng nhiệm vụ, các quy tắc và lệnh xác minh. Nó liên kết mọi tài liệu chủ đề theo đường dẫn, không theo mô tả.

### Two tests that keep it honest

- **Khả năng tiếp cận.** Agent tiếp cận bất kỳ quy tắc nào trong tối đa hai bước nhảy từ router. Một con trỏ không còn phân giải được tệ hơn một quy tắc bị thiếu, nên một liên kết hỏng trong router tự nó là một vi phạm khởi động.
- **Độ mới.** Router đủ ngắn để một người đánh giá đọc lại nó trên mọi pull request. Đó là thứ duy nhất ngăn nó phát triển trở lại thành cẩm nang.

### What to refuse while you trim

Bài học liệt kê các anti-pattern trông như độ bao phủ. Các chỉ dẫn xung đột âm thầm chuyển agent từ hỏi sang đoán; một phép đo đặt tỷ lệ giải quyết tại 48.8 phần trăm với các chỉ dẫn rõ ràng và 28 phần trăm với các chỉ dẫn xung đột. Một quy tắc phong cách không có lệnh lint cho phép agent bịa ra sự tuân thủ, nên ghép mọi quy tắc phong cách với lệnh của nó. Bắt đầu bằng các lệnh và kết thúc bằng phong cách. Viết cho agent, không cho một người đọc, vì sự ngắn gọn tiết kiệm ngữ cảnh.

### Nested files

Các repo lớn giữ một router cho mỗi thành phần con. Các công cụ đi từ file làm việc đến gốc và nối mọi router chúng tìm thấy, nên một file thư mục con mở rộng file gốc. Một repository lớn trong bài học mang 88 file như vậy. Các phép đo trong bài học đặt các file tốt nhất tại một bước nhảy chất lượng bằng một lần nâng cấp mô hình, và các file tệ nhất dưới mức hoàn toàn không có file.

## Follow-ups

- **Level 2:** Nhóm giữ một quy tắc trong router vì nó quan trọng. Phép kiểm tra cho việc nó có thuộc về đó hay không là gì? Expected: router giữ các con trỏ và vài quy tắc cứng áp dụng cho mọi phiên, và bất kỳ thứ gì áp dụng cho một loại nhiệm vụ đi vào một tài liệu chủ đề.
- **Level 2:** Bạn giữ một nguồn sự thật thế nào khi nhóm dùng một số coding agent? Expected: một file gốc và các symlink với các tên mà mỗi công cụ kỳ vọng, để mọi công cụ đọc cùng văn bản.
- **Level 3:** Một lint cho workbench kiểm tra gì? Expected: router dưới ngân sách dòng, mọi đường dẫn nó tham chiếu tồn tại, và không có hai quy tắc xung đột.
- **Level 3:** Tại sao bài học xếp một liên kết chết dưới một quy tắc chưa bao giờ được viết? Expected: agent tin router, đi theo con trỏ, không tìm thấy gì, và tiếp tục như thể quy tắc không tồn tại, trong khi một quy tắc bị thiếu ít nhất không để lại lời hứa sai.

## Wrong answers

- "Cắt file xuống một trang và xóa phần còn lại." Các quy tắc đến từ các sự cố, và xóa chúng lặp lại các sự cố, nên chuyển chúng sang các tầng.
- "Giữ file dài, và bảo agent đọc toàn bộ." Mô hình có một ngân sách chú ý, và một chỉ dẫn đọc mọi thứ không thay đổi lượng nó hành động theo.
- "Đặt file trong system prompt để nó luôn trong ngữ cảnh." Nằm trong ngữ cảnh không phải vấn đề; hành động theo nó mới là vấn đề, và một router ngắn có các con trỏ được tuân theo ở nơi một khối dài không được.

## Taught in

[Bài học workbench tối thiểu](../../../phases/14-agent-engineering/32-minimal-agent-workbench/) làm router thành một trong ba file, và [bài học các ràng buộc thực thi được](../../../phases/14-agent-engineering/33-instructions-as-executable-constraints/) đưa ra các tầng và hai phép kiểm tra.
