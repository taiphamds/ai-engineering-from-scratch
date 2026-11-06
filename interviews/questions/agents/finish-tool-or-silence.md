---
id: finish-tool-or-silence
title: Explicit finish tool or no-tool-call stop
card: agents
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [ml-breadth, design-review]
tags: [stop-condition, finish-tool, early-termination, agent-loop]
minutes: 8
lessons: [phases/14-agent-engineering/01-the-agent-loop, phases/19-capstone-projects/20-agent-harness-loop-contract]
manuals: []
practice: []
cheatsheet: [agent-harness]
related: [agents/budget-exhausted-looks-like-an-answer]
updated: 2026-11-03
---

Hai kỹ sư không thống nhất về cách vòng lặp nên kết thúc. Một người muốn một công cụ `finish` rõ ràng mà mô hình phải gọi. Người kia muốn vòng lặp kết thúc ngay khi một lượt trợ lý không có lời gọi công cụ trong đó. Bạn chọn cách nào, và mỗi lựa chọn sai ở điều gì?

## Short answer

Cả hai đều là các điều kiện dừng, và một vòng lặp production cần cả hai cộng một ngân sách. Dừng khi không có lời gọi công cụ đơn giản và khớp với cách các mô hình hành xử, nhưng nó kết thúc lần chạy ở bất kỳ lượt nào mà mô hình trả lời bằng văn xuôi, bao gồm một lượt mà nó chỉ định suy nghĩ thành lời. Một finish rõ ràng cho một tín hiệu rõ ràng có payload, nhưng một mô hình không bao giờ gọi nó chạy cho đến ngân sách. Chọn dừng khi không có lời gọi công cụ làm mặc định, giữ finish là một công cụ mang câu trả lời cuối cùng, và làm ngân sách thành chốt bảo vệ cuối cùng.

## Full answer

### What each one gets right

| Cách dừng | Điểm mạnh | Điểm yếu |
|---|---|---|
| Công cụ `finish` rõ ràng | Điểm kết thúc là một lời gọi có cấu trúc với câu trả lời là payload của nó, nên bên gọi không bao giờ đoán văn bản nào là câu trả lời | Một mô hình quên gọi nó, hoặc được bảo không gọi, không bao giờ tự dừng |
| Không có lời gọi công cụ trong lượt | Không cần công cụ bổ sung, và khớp với một mô hình trả lời khi đã xong | Một lượt văn xuôi ở giữa một nhiệm vụ kết thúc lần chạy sớm với một câu trả lời chưa hoàn chỉnh |

### Early termination is the real risk

Bài học hỏi lựa chọn nào an toàn hơn trước các lỗi chấm dứt sớm. Dừng khi không có lời gọi công cụ kết thúc lần chạy ở lượt văn xuôi đầu tiên. Một mô hình viết một kế hoạch trước khi hành động, hoặc nhận xét về một quan sát mà không có lời gọi tiếp theo, dừng vòng lặp quá sớm. Một finish rõ ràng không thể vô tình kết thúc sớm, vì việc kết thúc cần một lời gọi có chủ ý.

### Why you need the budget anyway

Không cách dừng nào giúp khi mô hình lặp. Một công cụ finish không bao giờ được gọi bởi một mô hình cứ thử lại. Dừng khi không có lời gọi công cụ không bao giờ kích hoạt khi mọi lượt đều có một lời gọi. Ngân sách lượt là cách dừng không phụ thuộc vào những gì mô hình phát ra. Trong hợp đồng harness ngân sách nhường quyền cho bên gọi, và bên gọi quyết định có tiếp tục hay không.

### A practical shape

1. Đăng ký `finish` làm một công cụ có đối số là câu trả lời cuối cùng.
2. Coi một lượt không có lời gọi công cụ là một lần dừng với lý do `no_tool_call`, và trả về văn xuôi làm một câu trả lời nháp, không phải câu trả lời cuối cùng.
3. Đặt mức trần lượt theo lớp nhiệm vụ, và nhường quyền tại mức trần.
4. Ghi lại cách dừng nào đã kích hoạt trong kết quả, để bên gọi và eval có thể phân biệt chúng.

## Follow-ups

- **Level 2:** Một mô hình trả về văn xuôi và một lời gọi công cụ trong cùng lượt. Cách dừng nào áp dụng? Expected: không cách nào, vì lượt có một lời gọi công cụ, nên vòng lặp điều phối nó và tiếp tục.
- **Level 3:** Tại sao kết quả cần tên của cách dừng đã kích hoạt? Expected: một eval tính một lần dừng không có lời gọi công cụ là thành công thưởng cho việc chấm dứt sớm, nên lý do phải nhìn thấy được đối với bộ chấm.
- **Level 3:** Suy luận hiện đi trên một kênh riêng. Điều đó có thay đổi cách dừng không có lời gọi công cụ không? Expected: có, một lượt có nội dung suy luận và không có văn bản hiển thị hoặc lời gọi công cụ không được tính là một câu trả lời, nên phép kiểm tra phải đọc đầu ra hiển thị.
- **Level 4:** Bạn sẽ đo việc chấm dứt sớm trên một tập nhiệm vụ thế nào? Expected: so sánh lý do dừng với một gate kiểm tra các lệnh nghiệm thu, và đếm các lần chạy dừng không có lời gọi công cụ trong khi các lệnh nghiệm thu chưa bao giờ chạy.

## Wrong answers

- "Chỉ dùng công cụ finish, vì nó rõ ràng." Một mô hình không bao giờ gọi nó chạy đến ngân sách trên mọi nhiệm vụ mà nó không thể hoàn thành.
- "Chỉ dùng cách dừng không có lời gọi công cụ, vì mô hình biết khi nào đã xong." Một mô hình tạm dừng để suy nghĩ bằng văn xuôi kết thúc lần chạy với một nửa công việc đã xong.
- "Ngân sách tự nó là đủ." Ngân sách là chốt bảo vệ cho một vòng lặp không bao giờ hội tụ, và một lần chạy chờ nó lãng phí mọi lượt sau điểm kết thúc thật.

## Taught in

[Bài học vòng lặp agent](../../../phases/14-agent-engineering/01-the-agent-loop/) liệt kê cả hai cách dừng và hỏi cách nào an toàn hơn, và [hợp đồng vòng lặp harness](../../../phases/19-capstone-projects/20-agent-harness-loop-contract/) chuyển ngân sách thành một lần nhường quyền.
