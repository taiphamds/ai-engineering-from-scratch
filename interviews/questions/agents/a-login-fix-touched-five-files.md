---
id: a-login-fix-touched-five-files
title: A login fix touched five files
card: agents
kind: debug
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, design-review]
tags: [scope-contract, scope-creep, diff-check, forbidden-files, globs]
minutes: 10
lessons: [phases/14-agent-engineering/36-scope-contracts]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops]
related: [agents/tests-passed-but-nothing-ran]
updated: 2026-11-03
---

Nhiệm vụ được giao cho agent là sửa một lỗi đăng nhập. Diff thay đổi route đăng nhập, một thành phần trợ giúp email, driver cơ sở dữ liệu, README và script phát hành. Bản ghi đưa ra một lý do có vẻ hợp lý cho mỗi thay đổi. Người đánh giá từ chối pull request và hỏi bạn điều gì đã sai và làm sao ngăn nó. Bạn nói gì?

## Short answer

Đây là sự phình phạm vi, và khó thấy vì agent giải thích mỗi bước với thiện chí. Cách sửa không phải một prompt nghiêm ngặt hơn. Đó là một hợp đồng trên đĩa liệt kê các file mà nhiệm vụ có thể thay đổi và các file nó không bao giờ được thay đổi, cộng một phép kiểm tra so sánh diff cuối cùng với hợp đồng đó. Phép kiểm tra chạy trước gate, và một lần ghi vào một đường dẫn bị cấm chặn nhiệm vụ.

## Full answer

### Why the prompt did not hold

Mỗi thay đổi có một lý do cục bộ. Mô hình không biết nhiệm vụ kết thúc ở đâu, nên nó mở rộng nhiệm vụ mỗi lần tìm thấy thứ gì đó liên quan. "Ở trong phạm vi" trong một prompt là một mong muốn. Một file nói ở trong phạm vi nghĩa là gì là một phép kiểm tra.

### The scope contract

| Trường | Mục đích |
|---|---|
| `task_id` | Trỏ đến nhiệm vụ trên bảng |
| `goal` | Một câu mà một người đánh giá có thể xác minh |
| `allowed_files` | Các glob mà agent có thể ghi |
| `forbidden_files` | Các glob mà agent không được chạm đến, ngay cả vô tình |
| `acceptance_criteria` | Các lệnh hoặc dòng assertion chứng minh đã xong |
| `rollback_plan` | Một đoạn văn mà người vận hành có thể chạy nếu nhiệm vụ phải bị dừng |
| `approvals_required` | Các hành động ngoài phạm vi cần con người phê duyệt |

Hai quy tắc về các trường. Thứ nhất, một hợp đồng không có `forbidden_files` là chưa đầy đủ, vì không gian âm là một nửa hợp đồng. Thứ hai, dùng glob chứ không đường dẫn thô, để một lần di chuyển file giữa các phiên không vô hiệu hóa hợp đồng.

### The check

Bộ kiểm tra đọc diff, các glob được phép và các glob bị cấm, và trả về các vi phạm, các file trong phạm vi và các file ngoài phạm vi. Với pull request này nó báo cáo script phát hành là một lần ghi bị cấm và README, thành phần trợ giúp email và driver là các lần ghi ngoài phạm vi. Mức độ nghiêm trọng khác nhau theo họ đường dẫn: một lần ghi ngoài phạm vi dưới `docs/**` là một cảnh báo, và một lần ghi dưới `scripts/**`, `migrations/**` hoặc cấu hình production luôn là một chặn. Sự bất đối xứng đó nằm trong hợp đồng, vì nó thay đổi theo dự án và theo nhiệm vụ.

### Make it survive the team

Một gate thất bại trên mọi sai sót nhỏ sẽ bị tắt. Cho mỗi nhiệm vụ một ngân sách vi phạm để các sai sót nhỏ xuất hiện dưới dạng cảnh báo, và chỉ một lần vượt ngân sách chặn việc gộp. Một người thực hành viết các hợp đồng phạm vi trước mỗi lần chạy báo cáo rằng tỷ lệ sa vào ngõ ngách giảm từ 52 phần trăm xuống 21 phần trăm trong ba tuần, với cùng agent.

### The second altitude

Một hợp đồng giới hạn một nhiệm vụ, không phải dự án. Một agent có thể tuân thủ hợp đồng đăng nhập rồi bắt đầu một trang thiết lập ở lượt tiếp theo. Một `feature_list.json` với tối đa một tính năng `in_progress` đóng khoảng trống đó. Các file được phép của hợp đồng nhiệm vụ phải nằm bên trong những gì tính năng đang hoạt động chạm đến.

## Follow-ups

- **Level 2:** Agent cần một thay đổi một dòng trong thành phần trợ giúp email để sửa lỗi. Điều gì nên đã xảy ra? Expected: bộ kiểm tra đánh dấu lần ghi ngoài phạm vi, agent mở một câu hỏi, và một con người mở rộng hợp đồng hoặc yêu cầu agent lùi lại.
- **Level 3:** Bạn giữ hợp đồng hợp lệ thế nào khi một lần refactor di chuyển mã đăng nhập? Expected: viết các glob theo mẫu như `app/**/login*.py`, không theo đường dẫn chính xác, và lưu trữ hợp đồng khi nhiệm vụ đóng.
- **Level 3:** Hai hợp đồng áp dụng cho một diff, một cho dự án và một cho nhiệm vụ. Quy tắc gộp là gì? Expected: đặc quyền tối thiểu, nên lấy giao các glob được phép, hợp các glob bị cấm, và lấy ngân sách thời gian hạn chế nhất.
- **Level 4:** Các glob file không phải chiều phạm vi duy nhất. Điều gì khác thuộc về hợp đồng? Expected: một ngân sách thời gian thực và một danh sách cho phép lưu lượng mạng đi ra, vì một agent có thể ở trong các file của nó và vẫn gọi một dịch vụ không thuộc nhiệm vụ.

## Wrong answers

- "Thêm một câu vào prompt nói ở trong phạm vi." Agent đã tin nó ở trong phạm vi ở mỗi bước, nên câu đó không thay đổi gì nếu không có một phép kiểm tra.
- "Đánh giá diff bằng tay cẩn thận hơn." Đánh giá của con người đã bắt được nó lần này, sau khi agent tiêu ngân sách, và mục đích là bắt nó trước khi pull request tồn tại.
- "Chặn mọi lần ghi ngoài các file nhiệm vụ." Một chặn cứng trên một chỉnh sửa README huấn luyện nhóm tắt gate, nên dùng các cảnh báo cho các đường dẫn rủi ro thấp và các chặn cho script và migration.

## Taught in

[Bài học hợp đồng phạm vi](../../../phases/14-agent-engineering/36-scope-contracts/) dựng hợp đồng, bộ kiểm tra diff và danh sách tính năng.
