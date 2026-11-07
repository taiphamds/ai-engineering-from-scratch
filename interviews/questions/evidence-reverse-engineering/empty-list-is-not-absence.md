---
id: empty-list-is-not-absence
title: callers is empty and coverage says complete
card: evidence-reverse-engineering
kind: concept
level: 1
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [screen, debugging]
tags: [reverse-engineering, evidence, coverage, unknowns, call-graph]
minutes: 6
lessons: [phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns]
manuals: [reverse-engineering-101#s-residual-unknowns-and-coverage, reverse-engineering-101#s-an-agent-investigation]
practice: []
cheatsheet: [reverse-engineering]
related: [evidence-reverse-engineering/observed-derived-inferred]
updated: 2026-11-03
---

Trong bản ghi, hồ sơ cho hàm `_grade` liệt kê `callers: []` và `callees: []`, và `relationship_coverage.status` của nó là `complete`. Agent viết "không có gì gọi grade". Bản ghi hỗ trợ điều gì, và điều gì sẽ làm câu của agent đúng?

## Short answer

`complete` nghĩa là engine trả về mọi tham chiếu gọi đã giải quyết mà không có giới hạn đọc đã biết; chẩn đoán cạnh nó nói các lời gọi tính toán hoặc gián tiếp chưa giải quyết vẫn chưa biết. Tham chiếu đi vào duy nhất là một tham chiếu `DATA` từ bảng bắt đầu hàm, không phải một lệnh call, vì vậy bản ghi hỗ trợ "không lệnh call đã giải quyết nào nhắm đến hàm này trong bản dựng này". Quy tắc thiết kế là độ bao phủ thiếu là chưa biết, không phải vắng mặt, và câu của agent cần một lần chạy hoặc một lập luận bao phủ các lời gọi gián tiếp, vì vậy bước trung thực là ghi một điều chưa biết còn lại cùng phép thăm dò sẽ khép nó.

## Full answer

### Three values and a null

`relationship_coverage` nêu các tập caller và callee hoàn chỉnh đến đâu: `complete`, `partial` với các giới hạn và hướng bị giới hạn, hoặc `unknown` với một lý do, và `null` cho một thao tác không báo cáo quan hệ gọi. Các lưu ý provider giữ trong `limitations` và không làm độ bao phủ thành một phần. Một phần của hồ sơ có khai báo độ bao phủ bằng số: luồng giá trị báo cáo liệu nó có bị cắt và bao nhiêu thao tác, đầu vào và cạnh bị bỏ. Một số không ở đó là một số đếm mà công cụ bảo đảm; một mảng rỗng nơi khác là một số đếm không có phát biểu như vậy.

### The same lesson in two other empty lists

Một phép so sánh bundle giữa hai bản dựng liệt kê mười bản ghi chỉ có trong một bundle và phân loại mọi bản ghi là `unknown` với loại `unresolved_branch`, vì một bundle không có marker nói nó hoàn chỉnh. Một chế độ xem tóm tắt của một ứng dụng sáu file báo cáo `semantic_unknowns: 118` và đánh dấu độ bao phủ `unknown`. Mỗi trường hợp chứng minh không gì được quan sát, không bao giờ là không gì tồn tại.

### The record for what is still open

Một điều chưa biết còn lại là một bản ghi bền vững có một id `unk_`, một chuỗi revision, một trạng thái và bằng chứng sẽ khép nó. Id là một hash của miền, câu hỏi với khoảng trắng được gộp, và digest phạm vi của mục tiêu, để hai nhà phân tích hỏi cùng câu hỏi về cùng file nhận cùng id, và một `record_unknown` thứ hai trả lời `already-exists`. Mọi thay đổi là một revision mới nêu digest của revision trước, mỗi sửa đổi tự nó là một bản ghi bằng chứng với authority `analyst-inference`, và chỉ một bản ghi observed của authority cần thiết có thể đánh dấu một lời giải `verified`. Điều chưa biết cho hồ sơ này hỏi liệu có gì gọi `_grade` lúc chạy, và phép thăm dò là một lần chạy hoặc một lần đọc các đích được tính.

## Follow-ups

- **Level 1:** Hồ sơ có liệt kê một tham chiếu đi vào duy nhất. Nó là gì? Expected: một tham chiếu `DATA` từ mục bắt đầu hàm, được unwinder và crash reporter dùng, không phải một lệnh nhánh.
- **Level 2:** Tại sao một số không trong các số đếm luồng giá trị mang nhiều trọng lượng hơn một mảng callers rỗng? Expected: số đếm là một phát biểu được khai báo về cắt cụt mà công cụ bảo đảm, trong khi mảng không có phát biểu hoàn chỉnh ngoài các tham chiếu đã giải quyết.
- **Level 2:** Bạn viết câu hỏi mở xuống như thế nào để nó sống sót qua phiên? Expected: `record_unknown` với câu hỏi, authority và confidence cần thiết, và một phép thăm dò được khuyến nghị; id suy ra từ câu hỏi.
- **Level 3:** Hai nhà phân tích cập nhật cùng điều chưa biết. Điều gì ngăn người thứ hai ghi đè người đầu? Expected: `update_unknown` nhận `expected_revision` và trả lời `revision-conflict` khi nó cũ, để người thứ hai đọc lại head và quyết định lại.

## Wrong answers

- "`complete` nghĩa là mọi lời gọi có thể xảy ra." Nó nghĩa là mọi tham chiếu đã giải quyết được trả về; các lời gọi gián tiếp và tính toán vẫn chưa biết.
- "Một danh sách rỗng nghĩa là không có." Nó nghĩa là không quan sát thấy; quy tắc thiết kế nói độ bao phủ thiếu là chưa biết.
- "Đóng điều chưa biết bằng một câu trong báo cáo." Một lời giải cần các evidence id có confidence và authority cần thiết, không bao giờ văn bản.

## Taught in

[Phần độ bao phủ](../../../manuals/reverse-engineering-101/sections/5-2-residual-unknowns-and-coverage.md) định nghĩa trường và bản ghi điều chưa biết, [phần điều tra của agent](../../../manuals/reverse-engineering-101/sections/8-2-an-agent-investigation.md) cho thấy bẫy tham chiếu `DATA`, và [bài học bằng chứng](../../../phases/13-tools-and-protocols/35-evidence-confidence-and-unknowns/) xây dựng chuỗi revision.
