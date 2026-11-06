---
id: why-the-gate-has-no-model
title: Why the verification gate has no model in it
card: agents
kind: concept
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [design-review, ml-depth]
tags: [verification-gate, deterministic, llm-judge, override-log, defense-in-depth]
minutes: 10
lessons: [phases/14-agent-engineering/38-verification-gates]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops, eval-driven-agents]
related: [agents/tests-passed-but-nothing-ran, agents/rules-the-workbench-can-check]
updated: 2026-11-03
---

Một đề xuất thay script quyết định liệu một nhiệm vụ agent đã xong hay chưa bằng một mô hình giám khảo. Lập luận là một giám khảo đọc diff, hiểu ý định, và bắt được nhiều hơn một script có thể. Lập luận ủng hộ hoặc phản đối, và nói một giám khảo thực sự thuộc về đâu.

## Short answer

Phản đối. Gate trả lời một câu hỏi, nhiệm vụ này đã hoàn tất chưa, và kết luận đó phải giống nhau cho cùng các sản phẩm mỗi lần, trong quản lý phiên bản, trong CI, không có cách nào để agent tranh luận với nó. Một mô hình giám khảo cho một câu trả lời khác vào một ngày khác và có thể bị thuyết phục cho đạt. Một giám khảo thuộc phía đánh giá, nơi câu hỏi mang tính định tính: mã có dễ đọc, an toàn và đúng phong cách không.

## Full answer

### What the gate reads and decides

| Phép kiểm tra | Nguồn | Mức độ nghiêm trọng |
|---|---|---|
| Mọi lệnh nghiệm thu đã chạy | các bản ghi phản hồi | chặn |
| Mọi lệnh nghiệm thu thoát với mã không | các bản ghi phản hồi | chặn |
| Không có lần ghi vào một đường dẫn bị cấm | báo cáo phạm vi | chặn |
| Không có lần ghi ngoài phạm vi | báo cáo phạm vi | chặn hoặc cảnh báo |
| Mọi quy tắc mức độ chặn đạt | báo cáo quy tắc | chặn |
| Không có mã thoát null | các bản ghi phản hồi | chặn |
| Các file đã chạm khớp các glob được phép | cả hai | cảnh báo |

Một cảnh báo chú thích kết luận. Một chặn ngăn `passed: true`. Mọi phép kiểm tra là một phép so sánh giữa các sản phẩm agent đã tạo. Không cần phán xét, nên không cần giám khảo.

### Why determinism is the point

Ba dạng thất bại chi phối công việc agent: "trông tốt", "các kiểm thử đạt" không có bản ghi, và nghiệm thu được đọc lỏng đến mức có thể nghĩa là bất kỳ thứ gì. Một mô hình giám khảo chịu cả ba. Nó đọc diff và quyết định trông tốt. Nó đọc bản ghi trò chuyện và tin khẳng định. Nó diễn giải dòng nghiệm thu rộng rãi. Script không thể làm bất kỳ điều nào trong số đó, vì nó không bao giờ đọc văn xuôi. Bài học ghép hai loại tín hiệu: các phép kiểm tra xác minh được như kiểm thử, phép kiểm tra schema và mã thoát trả lời liệu mã đã giải quyết vấn đề hay chưa, và các giám khảo rubric trả lời liệu nó dễ đọc và đúng phong cách hay không. Trộn chúng làm sụp đổ tín hiệu.

### Overrides are human and signed

Một chặn không thể bị agent ghi đè. Một con người có thể ghi đè nó, và lần ghi đè viết một hàng với mã phát hiện, một lý do, người dùng ký và commit hiện tại vào một log kiểm toán mà git theo dõi. Runtime từ chối một lần ghi đè không có chữ ký. Đó là ranh giới giữa một chính sách ghi đè và một màn diễn ghi đè.

### One report, several layers

Gate viết một `verification_report.json` cho mỗi nhiệm vụ dưới một đường dẫn, và CI đọc cùng đường dẫn. Quanh nó có các lớp xác định khác: một pre-commit hook, một phép kiểm tra trạng thái CI, một hook ủy quyền trước công cụ và một gate trước gộp. Một thất bại trong một lớp được lớp tiếp theo bắt. Pre-commit hook không phụ thuộc vào việc agent tuân theo các chỉ dẫn, nhưng nó là một phép kiểm tra cục bộ mà `git commit --no-verify` bỏ qua, nên phép kiểm tra trạng thái CI và gate trước gộp giữ kết luận.

### Where the judge goes

Người đánh giá, một lượt riêng với một vai trò khác, đọc diff và các báo cáo sau khi gate đạt. Nó chấm khả năng đọc, bảo mật và phong cách. Đầu ra của nó đến một con người hoặc vào bản bàn giao, không bao giờ vào kết luận của gate.

## Follow-ups

- **Level 3:** Một agent xóa các kiểm thử thất bại, và gate vẫn xanh. Thiếu phép kiểm tra nào? Expected: một mức sàn độ bao phủ được đọc từ một báo cáo độ bao phủ, với một chặn khi độ bao phủ giảm dưới mức sàn hoặc giảm hơn một điểm phần trăm so với lần gộp trước.
- **Level 3:** Khi nào nâng mọi cảnh báo thành một chặn là mặc định đúng? Expected: trên các nhánh phát hành và trong phân loại sau sự cố thông qua một cờ nghiêm ngặt, và không phải toàn cục, vì nghiêm ngặt ở mọi nơi làm suy yếu luồng hằng ngày.
- **Level 4:** Điều gì ngăn log ghi đè trở thành một hình thức? Expected: runtime từ chối một mục không có chữ ký, log nằm trong git, và việc đánh giá đọc nó, nên mọi lần ghi đè có một tên và một lý do gắn kèm.
- **Level 4:** Gate và người đánh giá không thống nhất. Ai thắng? Expected: gate quyết định liệu nhiệm vụ đã xong hay chưa, và người đánh giá quyết định liệu nó tốt hay không, nên một thất bại gate chặn bất kể đánh giá, và một thất bại đánh giá mở lại nhiệm vụ mà không chạm kết luận.

## Wrong answers

- "Một giám khảo hiểu ý định, nên nó bắt nhiều hơn." Gate không cần ý định, và một giám khảo suy ra ý định có thể bị thuyết phục rằng một nhiệm vụ chưa hoàn tất là hoàn tất.
- "Chạy giám khảo và script, và cho đạt nếu một trong hai đạt." Khi đó giám khảo trở thành cách vượt qua script, nên các phép kiểm tra xác định phải quyết định đã xong và giám khảo chỉ được chú thích.
- "Để agent giải thích tại sao một chặn không áp dụng." Agent là bên đang được kiểm tra, và một lần ghi đè cần một chữ ký con người kèm lý do.

## Taught in

[Bài học các gate xác minh](../../../phases/14-agent-engineering/38-verification-gates/) dựng gate xác định, log ghi đè đã ký và mức sàn độ bao phủ.
