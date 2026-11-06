---
id: a-handoff-is-not-a-status-report
title: What a handoff packet carries that a status report does not
card: agents
kind: concept
level: 1
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-breadth]
tags: [handoff, next-action, multi-session, clean-state, state-file]
minutes: 6
lessons: [phases/14-agent-engineering/40-multi-session-handoff]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops]
related: [agents/seven-surfaces-one-symptom-each]
updated: 2026-11-03
---

Vào cuối mỗi phiên, agent của bạn viết một đoạn văn nói nó đã làm gì. Phiên tiếp theo vẫn dành nửa giờ đầu để tìm hiểu tình hình hiện tại. Sản phẩm cuối phiên thiếu điều gì, và bạn tạo nó thế nào để nó không bao giờ bị bỏ qua?

## Short answer

Đoạn văn là một báo cáo trạng thái, và một lần bàn giao cần bảy trường: một bản tóm tắt, các file đã thay đổi, các lệnh đã chạy, các lần thử thất bại, các rủi ro còn mở, hành động tiếp theo và một con trỏ đến các báo cáo xác minh và đánh giá. Hành động tiếp theo là trường quan trọng nhất, vì nó làm cho bước đầu tiên của phiên tiếp theo có tính xác định. Tạo gói từ các sản phẩm của workbench thay vì yêu cầu agent viết nó, và chạy một phép kiểm tra dọn dẹp trước để gói mô tả một cây làm việc mà phiên tiếp theo có thể tin cậy.

## Full answer

### The seven fields

| Trường | Câu hỏi nó trả lời |
|---|---|
| `summary` | Điều đã được làm, trong một đoạn văn |
| `changed_files` | Diff nhìn thoáng qua |
| `commands_run` | Những gì đã được thực thi, từ các bản ghi phản hồi |
| `failed_attempts` | Những gì đã được thử và tại sao không hiệu quả |
| `open_risks` | Những gì có thể gây hại cho phiên tiếp theo, kèm mức độ nghiêm trọng |
| `next_action` | Bước cụ thể đầu tiên mà phiên tiếp theo thực hiện |
| `verdict_pointer` | Đường dẫn đến các báo cáo xác minh và đánh giá |

Một gói có mọi trường trừ `next_action` là một báo cáo trạng thái. Nó hữu ích, nhưng phiên tiếp theo vẫn phải quyết định làm gì trước.

### Generated, not written

Một bản bàn giao viết tay là thứ bị bỏ qua vào một ngày khó khăn. Bộ tạo đọc file trạng thái, báo cáo xác minh, báo cáo đánh giá và log phản hồi, rồi phát ra gói ở hai dạng. `handoff.md` dành cho con người. `handoff.json` dành cho agent tiếp theo. Nếu chúng không thống nhất, JSON thắng. Công việc của agent là để workbench ở một trạng thái mà bộ tạo có thể tóm tắt.

### Trim the log

Log phản hồi có thể chứa hàng trăm bản ghi. Gói chỉ mang K bản ghi cuối cùng cộng mọi bản ghi có mã thoát khác không. Phiên tiếp theo nạp toàn bộ log nếu cần.

### Leave a clean state

Một gói hoàn hảo là vô dụng nếu phiên tiếp theo mở ra trên một diff mới áp dụng một phần, một file tạm lạc chỗ, một nhánh sai và các kiểm thử báo lỗi trước khi chạy. Dọn dẹp là một giai đoạn riêng, và nó là một phép kiểm tra, không phải một thói quen. Cây làm việc được commit hoặc stash kèm một ghi chú. Không còn sản phẩm tạm nào. Các kiểm thử xanh, hoặc đỏ với lỗi được nêu trong các rủi ro còn mở. Bảng tính năng khớp thực tế. Nhánh là nhánh được kỳ vọng. Giai đoạn dọn dẹp phát ra một danh sách các vấn đề chặn, và một danh sách rỗng là tiền điều kiện mà bộ tạo khẳng định trước khi viết.

## Follow-ups

- **Level 1:** Tại sao JSON thắng khi hai dạng không thống nhất? Expected: agent tiếp theo nạp JSON, nên dạng máy đọc được là dạng điều khiển phiên tiếp theo.
- **Level 2:** Những lần thử thất bại nào thuộc về gói? Expected: mọi bản ghi có mã thoát khác không, với chuỗi thử lại nhìn thấy được, để phiên tiếp theo không lặp lại một ngõ cụt đã biết.
- **Level 2:** Sự khác biệt giữa một bản bàn giao và file trạng thái là gì? Expected: file trạng thái được đọc ở mỗi lượt và giữ agent đang ở đâu, trong khi bản bàn giao được tạo một lần vào cuối phiên và cho phiên tiếp theo biết bắt đầu ở đâu.
- **Level 3:** Hai phiên trên hai nhánh mỗi phiên viết một bản bàn giao. Phiên tiếp theo chọn một bản thế nào? Expected: mỗi gói mang một nhánh, một commit tốt cuối cùng đã biết và một trạng thái đang hoạt động, đã bị thay thế hoặc đã lưu trữ, và chỉ gói đang hoạt động cho nhánh này điều khiển phiên.

## Wrong answers

- "Yêu cầu agent viết một bản tóm tắt chi tiết vào cuối." Một bản tóm tắt được viết bị bỏ qua khi phiên kết thúc tệ, và chính các phiên tệ cần bản bàn giao nhất.
- "Lịch sử trò chuyện là bản bàn giao." Lịch sử bị cắt bớt hoặc mất, và phiên tiếp theo không thể phát lại một giờ trò chuyện trong phút đầu tiên.
- "Một báo cáo xác minh xanh là đủ để tiếp tục." Báo cáo chứng minh trạng thái nhiệm vụ, không phải trạng thái cây làm việc, và một cây làm việc bẩn làm phiên tiếp theo mất mười phút đầu tiên.

## Taught in

[Bài học bàn giao nhiều phiên](../../../phases/14-agent-engineering/40-multi-session-handoff/) dựng gói từ các file workbench và thêm phép kiểm tra dọn dẹp.
