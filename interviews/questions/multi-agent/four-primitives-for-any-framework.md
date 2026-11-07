---
id: four-primitives-for-any-framework
title: Read any multi-agent framework in one paragraph
card: multi-agent
kind: concept
level: 1
roles: [agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-breadth]
tags: [primitives, handoff, shared-state, orchestrator, frameworks]
minutes: 6
lessons: [phases/16-multi-agent-and-swarms/04-primitive-model]
manuals: []
practice: []
cheatsheet: [multi-agent, agent-frameworks-compared]
related: [multi-agent/the-single-agent-ceiling]
updated: 2026-11-03
---

Một framework đa agent mới ra mắt mỗi vài tháng, mỗi framework có từ vựng riêng. Đưa ra phương pháp bạn dùng để hiểu nhanh một framework mới, và nêu phần của mọi hệ thống như vậy nơi các bug khó sống.

## Short answer

Ánh xạ framework lên bốn thành phần nguyên thủy: agent, bàn giao, trạng thái dùng chung và orchestrator. Mọi framework chọn một mặc định trên mỗi trục, và phần còn lại là cú pháp bề mặt. Agent là một system prompt cộng công cụ và không có trạng thái, bàn giao là một chuyển giao quyền điều khiển có cấu trúc, orchestrator quyết định ai chạy tiếp, và trạng thái dùng chung là phần có trạng thái duy nhất của hệ thống. Đó là nơi các bug khó nằm: đầu độc bộ nhớ, thứ tự thông điệp, quản lý phiên bản và tranh chấp ghi.

## Full answer

### The four axes

| Thành phần nguyên thủy | Định nghĩa | Các triển khai thông dụng |
|---|---|---|
| Agent | Một system prompt, một danh sách công cụ và một mô hình, không có bộ nhớ riêng | Có thể hoán đổi với bất kỳ agent nào có cùng prompt và công cụ |
| Bàn giao | Một chuyển giao quyền điều khiển có cấu trúc từ một agent đến một agent khác | Một công cụ trả về agent tiếp theo, một cạnh đồ thị có điều kiện, hoặc một hàm chọn người nói |
| Trạng thái dùng chung | Bất kỳ dữ liệu nào mà hơn một agent đọc, và đôi khi ghi | Một pool thông điệp đầy đủ, một blackboard có khóa chủ đề, một trạng thái có kiểu với reducer, bộ nhớ bên ngoài |
| Orchestrator | Bất cứ bên nào quyết định ai nói tiếp | Một đồ thị tĩnh, một mô hình chọn người nói, lời gọi bàn giao của agent hiện tại, hoặc một bộ lập lịch trên một hàng đợi |

### Three questions answer most of it

1. Orchestrator có tin mô hình để định tuyến, hay mã ghim route?
2. Trạng thái dùng chung là toàn bộ lịch sử, hay một góc nhìn chiếu theo vai trò?
3. Các agent có thể thay đổi prompt của nhau, hay chỉ bàn giao?

Bài học khẳng định ba câu này trả lời khoảng 80 phần trăm việc framework nào phù hợp một vấn đề. Bạn ngừng tìm mua framework tốt nhất và bắt đầu thiết kế cho trục bạn quan tâm.

### The stateless insight

Agent là một hàm của prompt và công cụ của nó. Bàn giao là một lời gọi hàm. Orchestrator là một bộ lập lịch. Chỉ trạng thái dùng chung mang bất cứ thứ gì từ một bước đến bước tiếp theo, nên mọi bug thú vị là một bug trạng thái dùng chung. Một framework giấu trạng thái đẩy vấn đề sang bên gọi. Một framework tập trung nó khiến trạng thái có thể kiểm tra và chuyển chi phí phối hợp vào triển khai trạng thái.

### What is not a primitive

Checkpoint bền vững, con người phê duyệt một bàn giao, ngân sách token mỗi agent và tracing đều được xây trên bốn thành phần. Chúng là các quyết định thiết kế, không phải trục mới. Nếu một framework tuyên bố một thành phần nguyên thủy thứ năm, kiểm tra liệu nó có phải một dạng trạng thái dùng chung bạn chưa thấy.

## Follow-ups

- **Level 1:** Hai agent có cùng prompt và cùng công cụ. Chúng khác nhau như thế nào? Expected: chúng không khác, vì mọi thứ trông như trạng thái mỗi agent nằm trong trạng thái dùng chung hoặc bàn giao.
- **Level 2:** Nêu ba cách một bàn giao được triển khai. Expected: một công cụ trả về agent tiếp theo, một cạnh đồ thị được chọn bởi một điều kiện, và một hàm chọn người nói tiếp theo từ một pool.
- **Level 2:** Pool đầy đủ hay trạng thái chiếu, loại nào mở rộng xa hơn và nó tốn gì? Expected: trạng thái chiếu mở rộng xa hơn, và nó tốn một schema từ đầu để góc nhìn của mỗi vai trò được định nghĩa.
- **Level 3:** Trước khi áp dụng một framework, bạn viết gì trước? Expected: ánh xạ bốn thành phần nguyên thủy của nó, và nếu bạn không thể viết, tài liệu không đầy đủ hoặc framework đang phát minh một thành phần nguyên thủy.

## Wrong answers

- "Mỗi framework có kiến trúc riêng, nên học từng cái một." Các kiến trúc là các điểm trong một không gian bốn trục, và học các trục một lần đọc được mọi bản phát hành.
- "Các agent giữ bộ nhớ." Agent không có trạng thái theo định nghĩa, và bộ nhớ nằm trong trạng thái dùng chung hoặc trong payload bàn giao.
- "Orchestrator là phần thông minh, nên chọn framework có orchestrator tốt nhất." Orchestrator là một bộ lập lịch với bốn dạng, và lựa chọn phụ thuộc vào mức bạn tin mô hình để định tuyến.

## Taught in

[Bài học mô hình thành phần nguyên thủy](../../../phases/16-multi-agent-and-swarms/04-primitive-model/) xây dựng bốn thành phần nguyên thủy và ánh xạ các framework hiện tại lên chúng.
