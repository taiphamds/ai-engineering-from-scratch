---
id: rules-the-workbench-can-check
title: Turn be careful into a rule a checker can score
card: agents
kind: design
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [design-review, system-design]
tags: [agent-rules, executable-constraints, severity, rule-expiry, definition-of-done]
minutes: 12
lessons: [phases/14-agent-engineering/33-instructions-as-executable-constraints]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops]
related: [agents/router-or-manual]
updated: 2026-11-03
---

Một file chỉ dẫn bảo agent cẩn thận, kiểm thử kỹ lưỡng, và hỏi nếu không chắc. Ba ngày sau agent phát hành một thay đổi không có kiểm thử, ghi vào một thư mục nó không nên chạm đến, và không bao giờ đặt một câu hỏi. Thiết kế lại các chỉ dẫn này để một runtime có thể thực thi ràng buộc và một người đánh giá có thể chấm chúng.

## Short answer

Viết lại mỗi mong muốn thành một quy tắc với một slug, một danh mục, một mô tả một dòng và một hàm kiểm tra có tên. Năm danh mục bao phủ phần lớn quy tắc: khởi động, bị cấm, định nghĩa hoàn tất, sự không chắc chắn và phê duyệt. Cho mọi quy tắc một mức độ chặn, cảnh báo hoặc thông tin, để runtime chỉ từ chối ở mức chặn. Giữ các quy tắc trong một file markdown với một quy tắc cho mỗi tiêu đề, để việc đánh giá có thể thấy mọi thay đổi.

## Full answer

### From wishes to rules

| Mong muốn | Danh mục | Quy tắc | Phép kiểm tra |
|---|---|---|---|
| Cẩn thận | Bị cấm | Không bao giờ chỉnh sửa script phát hành hoặc cấu hình production | Một phép kiểm tra diff đối chiếu với các glob bị cấm |
| Kiểm thử kỹ lưỡng | Định nghĩa hoàn tất | Lệnh nghiệm thu thoát với mã không, và log phản hồi giữ bản ghi | Một lần đọc các bản ghi phản hồi |
| Hỏi nếu không chắc | Sự không chắc chắn | Mở một ghi chú câu hỏi thay vì đoán khi một giả định không được một file hỗ trợ | Một phép kiểm tra rằng một ghi chú câu hỏi tồn tại khi file trạng thái liệt kê một giả định không có nguồn |
| Cẩn thận | Phê duyệt | Bất kỳ dependency mới hoặc lần ghi production nào cần một phê duyệt của con người | Một phép kiểm tra rằng bản ghi phê duyệt tồn tại trước hành động |
| Cẩn thận | Khởi động | File trạng thái tồn tại và còn mới trước khi công việc bắt đầu | Một phép kiểm tra file lúc bắt đầu phiên |

Một quy tắc không khớp một trong năm danh mục thường muốn là hai quy tắc. Buộc sự tách đó.

### Severity at write time

Mỗi quy tắc mang `block`, `warn` hoặc `info`. Bộ kiểm tra báo cáo cả ba. Runtime chỉ từ chối ở mức chặn. Gắn nhãn tại thời điểm viết buộc việc hiệu chỉnh ngay từ đầu, vì các nhóm bắt đầu với mọi quy tắc là một quy tắc cứng sau đó làm yếu chúng dưới áp lực thời hạn mà không có bản ghi. Một lần ghi đè quy tắc chặn đi vào một log kiểm toán đã ký qua gate xác minh.

### Expiry as a forcing function

Mọi quy tắc mang một ngày hết hạn, mặc định 90 ngày từ khi soạn. Bộ kiểm tra cảnh báo khi một quy tắc có không vi phạm trong 60 ngày liên tiếp. Tại lần đánh giá tiếp theo nhóm giữ nó với một lý do, hạ nó xuống thông tin, hoặc xóa nó. Một triển khai đánh giá lớn trong bài học, với 131,246 lần chạy đánh giá trên 5,169 repository trong 30 ngày, thấy rằng các tập quy tắc có hết hạn rõ ràng ở dưới 30 quy tắc mỗi repository, trong khi các tập không có hết hạn tăng vượt 80 quy tắc mà phần lớn không bao giờ kích hoạt.

### Source and cache

File markdown là nguồn được soạn. Một file khóa JSON là cache mà bộ kiểm tra đọc trên đường xử lý thường xuyên, được tạo lại bởi một pre-commit hook. Diff markdown có thể đánh giá, và việc phân tích nằm ngoài mỗi lượt.

### Rules and runtime guardrails

Các guardrail framework thực thi các quy tắc trong một lượt. File quy tắc là hợp đồng con người đọc được mà các guardrail đó triển khai, và bộ kiểm tra chứng minh trong CI rằng runtime đã làm đúng. Bạn cần cả hai.

## Follow-ups

- **Level 2:** Tại sao xóa một quy tắc cũ thay vì comment nó đi? Expected: workbench là nguồn sự thật, và một quy tắc được comment là một quy tắc agent vẫn có thể đọc trong khi bộ kiểm tra bỏ qua nó.
- **Level 3:** Một quy tắc nói tuân theo một hướng dẫn phong cách đã xuất bản. Tại sao nó trượt thiết kế? Expected: nó không có lệnh thực thi ràng buộc, nên agent có thể bịa ra sự tuân thủ, và cách sửa là ghép nó với lệnh lint chính xác.
- **Level 3:** Phép kiểm tra sự không chắc chắn lấy tín hiệu từ đâu? Expected: từ file trạng thái, liệt kê các giả định, và từ các ghi chú câu hỏi, nên một giả định không có nguồn và không có ghi chú là một vi phạm.
- **Level 4:** Tập quy tắc giữ tính di chuyển được qua ba sản phẩm agent thế nào? Expected: file là markdown cộng các tên hàm, nên mỗi runtime đăng ký cùng các phép kiểm tra làm các guardrail hoặc ngắt riêng của nó trong khi file vẫn là hợp đồng.

## Wrong answers

- "Làm mọi quy tắc thành một chặn cứng để agent coi chúng nghiêm túc." Các nhóm âm thầm làm yếu các chặn dưới áp lực thời hạn, và một tập quy tắc nơi mọi thứ chặn kết thúc với không có gì được thực thi.
- "Giữ các quy tắc trong prompt, nơi mô hình đọc chúng." Mô hình đọc chúng và vẫn không thể kiểm tra chúng, trong khi một hàm kiểm tra có tên cho runtime và người đánh giá cùng một kết luận.
- "Các quy tắc là vĩnh viễn vì chúng đến từ các sự cố." Một quy tắc không bao giờ kích hoạt vẫn tốn sự chú ý, nên hết hạn buộc một lần đánh giá giữ, hạ, hoặc xóa nó với một lý do.

## Taught in

[Bài học các ràng buộc thực thi được](../../../phases/14-agent-engineering/33-instructions-as-executable-constraints/) phân tích file quy tắc thành các phép kiểm tra và chấm một lần chạy đối chiếu với nó.
