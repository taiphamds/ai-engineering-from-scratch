---
id: a-turn-cap-for-every-task
title: One turn cap for every task, what number do you give
card: agents
kind: estimate
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [turn-budget, task-class, budgets, wall-clock, cost-cap]
minutes: 8
lessons: [phases/14-agent-engineering/01-the-agent-loop, phases/15-autonomous-systems/10-claude-code-permission-modes]
manuals: []
practice: []
cheatsheet: [agent-harness, autonomous-agents]
related: [agents/the-agent-loops-forever, agents/pick-the-permission-mode]
updated: 2026-11-03
---

Nhóm sản phẩm muốn một số lượt tối đa duy nhất áp dụng cho mọi lần chạy của agent của bạn. Agent xử lý các chỉnh sửa một dòng, các lần refactor nhiều file, và các lần chạy không giám sát điều khiển một máy tính trong nhiều giờ. Bạn cho họ con số nào, và bảo vệ nó thế nào?

## Short answer

Không có một con số duy nhất, và ước lượng cho thấy tại sao. Các agent chạy 40 đến 400 bước cho mỗi nhiệm vụ, và một nhiệm vụ sử dụng máy tính chạy hàng chục đến hàng trăm bước như một trường hợp bình thường. Một mức trần phù hợp với một chỉnh sửa một dòng dừng mọi lần refactor, và một mức trần phù hợp với một lần chạy không giám sát cho phép một chỉnh sửa bị kẹt tiêu hàng trăm lượt. Cho một mức trần theo mỗi lớp nhiệm vụ, đặt từng mức từ phân phối trace của các lần chạy thành công trong lớp đó, và ghép mọi mức trần với một ngân sách thời gian thực và một mức trần chi phí.

## Full answer

### Why one number fails

| Lớp nhiệm vụ | Độ dài bình thường | Tác động của một mức trần dùng chung |
|---|---|---|
| Chỉnh sửa một dòng | Một vài lượt | Một mức trần cao cho phép một lần chạy bị kẹt đốt hàng trăm lượt trước khi ai đó thấy nó |
| Refactor nhiều file | Hàng chục lượt | Một mức trần thấp kết thúc lần chạy với một nửa các file được thay đổi |
| Sử dụng máy tính không giám sát | Hàng chục đến hàng trăm bước | Một mức trần thấp khiến chế độ không sử dụng được |

Quy tắc của bài học là chọn một mức trần phù hợp với lớp nhiệm vụ, không phải một kích thước cho tất cả.

### How to set each cap

1. Lấy các trace cho lớp và đọc các số lượt của các lần chạy vượt qua gate.
2. Đặt mức trần trên lần chạy đạt dài nhất với một khoảng dự phòng, và dưới điểm mà các trace cho thấy các hành động lặp lại.
3. Coi mức trần là một lần nhường quyền, không phải một lần kết liễu. Khi vòng lặp chạm nó, bên gọi thấy trạng thái một phần và quyết định có mở rộng hay không.
4. Xem xét các mức trần khi các trace dịch chuyển. Một mô hình mới hoặc một công cụ mới thay đổi phân phối.

### The other two budgets

Một mức trần lượt đơn độc bỏ sót hai dạng thất bại. Một lần chạy có thể tiêu ít lượt và nhiều thời gian thực, chờ các công cụ chậm. Một lần chạy có thể tiêu ít lượt và nhiều tiền, với các ngữ cảnh dài trên một mô hình đắt tiền. Chế độ không giám sát trong bài học cung cấp một mức trần lượt, một mức trần đô la hủy phiên, và các giới hạn số hành động theo công cụ. Một lần chạy không giám sát 24 giờ cần cả ba, cộng một danh sách cho phép, và mỗi con số cần một lý do được viết ra.

### What to tell the product team

Cho họ một bảng, không phải một con số: một hàng cho mỗi lớp nhiệm vụ với mức trần lượt, ngân sách thời gian thực, mức trần chi phí và các giới hạn theo công cụ, và dữ liệu trace mà mỗi hàng đến từ. Đưa ra một mặc định cho một nhiệm vụ chưa phân loại, được đặt thấp, để một nhiệm vụ chưa biết nhường quyền sớm và một con người quyết định.

## Follow-ups

- **Level 2:** Một lần chạy chạm mức trần với nhiệm vụ gần xong. Điều gì xảy ra? Expected: vòng lặp nhường quyền với một lý do ngân sách, bên gọi kiểm tra trạng thái một phần, và bên gọi mở rộng ngân sách hoặc đóng phiên bằng một bản bàn giao.
- **Level 2:** Tại sao mức trần dự phòng cho một nhiệm vụ không có lớp nên nhỏ? Expected: một nhiệm vụ chưa biết là nhiệm vụ có khả năng lặp nhất, và một lần nhường quyền sớm tốn một quyết định của con người trong khi một lần muộn tốn nhiều giờ.
- **Level 3:** Bạn phân biệt một lần chạy dài với một lần chạy bị kẹt trước mức trần thế nào? Expected: một bộ phát hiện lặp trên các hash hành động và quan sát, để năm hành động gần giống hệt liên tiếp tạm dừng lần chạy sớm.
- **Level 3:** Các trace cho một lớp cho thấy hai cụm số lượt. Điều đó cho bạn biết gì? Expected: lớp đó là hai lớp, và mỗi lớp cần mức trần riêng.

## Wrong answers

- "Đặt cao để không nhiệm vụ hợp lệ nào bị cắt." Một mức trần cao trên một lớp nhiệm vụ ngắn cho phép một lần chạy bị kẹt tiêu hàng trăm lượt, và mục đích của mức trần là bắt lần chạy bị kẹt.
- "Đặt thấp và để người dùng thử lại." Một mức trần thấp trên một lần refactor kết thúc mọi lần chạy với một nửa công việc, và một lần thử lại bắt đầu từ không.
- "Mức trần lượt là đủ, vì các lượt là thứ tốn tiền." Các lượt là một trục, và một lần chạy có thể chậm về thời gian hoặc đắt về token với ít lượt.

## Taught in

[Bài học vòng lặp agent](../../../phases/14-agent-engineering/01-the-agent-loop/) đặt mức trần theo lớp nhiệm vụ, và [bài học các chế độ quyền hạn](../../../phases/15-autonomous-systems/10-claude-code-permission-modes/) ghép nó với một mức trần chi phí và các giới hạn theo công cụ.
