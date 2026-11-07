---
id: two-workers-return-different-facts
title: Two workers returned different facts, the report shows one
card: multi-agent
kind: debug
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, design-review]
tags: [synthesis-conflict, supervisor, provenance, worker-timeout, scope]
minutes: 12
lessons: [phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern]
manuals: []
practice: []
cheatsheet: [multi-agent, research-agent-pipeline]
related: [multi-agent/why-a-fresh-context-wins]
updated: 2026-11-03
---

Trong một hệ thống nghiên cứu có agent trưởng và worker, hai worker trả lời các câu hỏi con chồng lấn bằng các con số mâu thuẫn nhau. Báo cáo cuối chứa một trong các con số và không nhắc con số kia. Người dùng tìm thấy con số thứ hai trong một nguồn và hỏi tại sao báo cáo giấu nó. Hệ thống thất bại ở đâu, và bạn thay đổi gì?

## Short answer

Agent trưởng giải quyết một xung đột tổng hợp bằng cách im lặng chọn một phía, điều bài học gọi là lỗi tệ nhất trong mẫu này, vì người dùng không bao giờ biết một bất đồng đã xảy ra. Hai nguyên nhân phía trước khiến nó có khả năng xảy ra: phân rã giao cho hai worker cùng phần đất, và không worker nào có một phạm vi ngăn nó trôi vào lãnh thổ của bên kia. Cách sửa là một agent trưởng phát hiện mâu thuẫn giữa các đầu ra worker và hoặc hỏi lại với một câu hỏi hẹp hơn hoặc viết sự bất đồng vào câu trả lời, cộng nguồn gốc trên mọi khẳng định tổng hợp.

## Full answer

### Three failure modes in the pattern

| Lỗi | Điều gì đã xảy ra ở đây |
|---|---|
| Agent trưởng ảo giác kế hoạch | Các câu hỏi con chồng lấn, nên hai worker nghiên cứu cùng sự thật |
| Worker khám phá quá mức | Một worker không có ranh giới phạm vi trôi qua câu hỏi của nó vào câu hỏi của bên khác |
| Xung đột tổng hợp | Hai sự thật mâu thuẫn đến, và agent trưởng chọn một mà không ghi chú |

Điều thứ ba là điều người dùng thấy. Hai điều đầu khiến nó xảy ra.

### Detect the conflict without a model

Bài học hỏi cách phát hiện mâu thuẫn không có một lời gọi mô hình. Chuẩn hóa các khẳng định: trích xuất mỗi số với đơn vị và thực thể nó mô tả, đặt khóa theo câu hỏi con, và so sánh. Hai giá trị khác nhau dưới một khóa là một xung đột. Với các khẳng định không phải số, chỉ gắn cờ một khóa khi hai worker nêu các khẳng định khác nhau. Chỉ các nguồn trích dẫn khác nhau không phải một xung đột. Để agent trưởng xử lý một khóa được gắn cờ.

### What the lead does with a conflict

1. **Hỏi lại.** Sinh một worker trên một câu hỏi chặt hơn nhắm vào sự bất đồng, thêm một vòng.
2. **Đưa ra.** Viết cả hai giá trị vào câu trả lời với các nguồn của chúng và nói rằng chúng bất đồng.
3. **Không bao giờ im lặng chọn.** Một giá trị được chọn không có ghi chú là lỗi trong prompt.

### Prevent the overlap

Phân rã rộng trước và hẹp sau, và cấp cho mỗi worker một phạm vi tường minh trong prompt: câu hỏi con, những gì ngoài phạm vi, và các nguồn ưu tiên. Thêm một timeout worker khoảng gấp đôi thời gian chạy trung vị và một giới hạn token mỗi worker, để một worker lang thang bị cắt và agent trưởng sinh lại với một câu hỏi hẹp hơn hoặc tiếp tục không có nó.

### Provenance on the synthesis

Mỗi khẳng định trong câu trả lời cuối mang worker và nguồn nó đến từ. Điều đó khiến con số thứ hai bị giấu không thể xảy ra, vì một khẳng định có hai nguồn cho thấy hai giá trị, và khiến việc phân tích sau sự cố là đọc trace thay vì đoán.

## Follow-ups

- **Level 3:** Tại sao một lựa chọn im lặng tệ hơn một lựa chọn sai có ghi chú? Expected: một bất đồng được ghi chú cho phép người đọc kiểm tra nguồn, trong khi một lựa chọn im lặng trình bày một sự thật chưa giải quyết như đã chốt.
- **Level 3:** Việc hỏi lại thêm một vòng và mục tiêu độ trễ chặt. Bạn làm gì? Expected: đưa sự bất đồng ra trong câu trả lời thay vì hỏi lại, và ghi lại khóa cho một lần chạy sau.
- **Level 4:** Bạn kiểm thử bộ phát hiện xung đột như thế nào? Expected: đưa vào các đầu ra worker với một mâu thuẫn được cài trên một khóa và các giá trị khớp trên các khóa khác, và assert rằng chính xác khóa đó được gắn cờ.
- **Level 4:** Hai worker đồng ý và cả hai sai. Điều gì bắt điều đó? Expected: không gì trong agent trưởng, vì đồng thuận không phải tính đúng đắn, nên một bộ xác minh độc lập có quyền truy cập nguồn riêng phải kiểm tra khẳng định.

## Wrong answers

- "Thêm một quy tắc vào prompt của agent trưởng nói hãy cẩn thận với các con số." Agent trưởng không biết một xung đột tồn tại, và một prompt không so sánh các đầu ra worker.
- "Tin worker có độ tự tin cao hơn." Độ tự tin không phải tính đúng đắn, và người dùng vẫn không bao giờ biết một bất đồng đã xảy ra.
- "Chạy ba worker mỗi câu hỏi con và lấy đa số." Một đa số có thể sai cùng nhau, nó tăng chi phí gấp ba, và sự chồng lấn gây ra xung đột vẫn ở trong kế hoạch.

## Taught in

[Bài học mẫu supervisor](../../../phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/) nêu xung đột tổng hợp và timeout worker cùng giới hạn token.
