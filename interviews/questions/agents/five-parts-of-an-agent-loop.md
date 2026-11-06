---
id: five-parts-of-an-agent-loop
title: What makes a loop an agent and not a chat bot
card: agents
kind: concept
level: 1
roles: [agentic-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [agent-loop, react, tool-registry, stop-condition, turn-budget]
minutes: 5
lessons: [phases/14-agent-engineering/01-the-agent-loop]
manuals: []
practice: []
cheatsheet: [agent-harness]
related: []
updated: 2026-11-03
---

Một đồng đội nói ứng dụng trò chuyện của họ là một agent vì nó gọi một mô hình bên trong một vòng lặp while. Nêu các phần mà một vòng lặp agent thật cần, và nói điều gì sai khi thiếu mỗi phần.

## Short answer

Một vòng lặp agent cần năm phần: một bộ đệm thông điệp tăng theo mỗi lượt, một registry công cụ mà mô hình gọi theo tên, một điều kiện dừng, một ngân sách lượt, và một bộ định dạng quan sát. Mô hình giống nhau trong một chat bot và trong một agent. Sự khác biệt là agent có thể tạm dừng, gọi một công cụ, đọc kết quả và tiếp tục. Không có năm phần, vòng lặp là một chat bot có thêm các bước.

## Full answer

### The loop

Mẫu là mẫu từ bài báo ReAct. Mô hình viết một suy nghĩ, chọn một hành động, đọc một quan sát, và lặp lại cho đến khi quyết định kết thúc. Các mô hình hiện đại di chuyển suy nghĩ sang một kênh suy luận riêng, nhưng luồng điều khiển giống nhau. Quan sát, suy nghĩ, hành động, quan sát, suy nghĩ, hành động, dừng.

### The five parts

| Phần | Nó làm gì | Thất bại khi thiếu |
|---|---|---|
| Bộ đệm thông điệp | Giữ lượt người dùng, các lượt trợ lý, các lượt công cụ và lượt cuối cùng theo thứ tự | Mô hình quên những gì nó đã làm và lặp lại công việc |
| Registry công cụ | Ánh xạ một tên công cụ đến một schema và một callable | Mô hình nêu các công cụ không tồn tại, và không có gì chạy |
| Điều kiện dừng | Kết thúc lần chạy khi có một finish rõ ràng, một lượt không có lời gọi công cụ, một ngân sách, hoặc một guardrail | Lần chạy không bao giờ kết thúc, hoặc chỉ kết thúc khi ngữ cảnh đầy |
| Ngân sách lượt | Giới hạn số lần lặp cho lớp nhiệm vụ này | Một quyết định sai ở bước 38 trở thành một lần chạy vô tận |
| Bộ định dạng quan sát | Chuyển mọi đầu ra công cụ, bao gồm mọi lỗi, thành một chuỗi mô hình có thể đọc | Một lời gọi thất bại trở thành một sự cố thay vì một lần sửa |

Bộ định dạng là phần mọi người quên. Bài học nói mọi lỗi 400 trong stack phải trở thành một chuỗi quan sát, không phải một ngoại lệ. Một mô hình thấy lỗi có thể sửa lời gọi tiếp theo. Một mô hình không bao giờ thấy nó không thể.

### Why the parts matter now

Các agent chạy 40 đến 400 bước cho mỗi nhiệm vụ. Mọi framework được dùng hiện nay dựng cùng vòng lặp dưới các tên riêng. Những thứ khác nhau nằm quanh vòng lặp: checkpoint, thông điệp actor, mẫu vai trò, tracing. Bản thân vòng lặp không thay đổi.

## Follow-ups

- **Level 1:** Một quan sát là gì? Expected: dạng chuỗi của một kết quả công cụ mà vòng lặp nối thêm vào bộ đệm cho lời gọi mô hình tiếp theo.
- **Level 2:** Tại sao một ngân sách lượt là một phần riêng với điều kiện dừng? Expected: điều kiện dừng phụ thuộc vào những gì mô hình phát ra, và ngân sách bảo vệ lần chạy khi mô hình không bao giờ phát ra một lần dừng.
- **Level 2:** Suy nghĩ đi đâu trong một mô hình có một kênh suy luận native? Expected: trong một trường riêng mà runtime truyền giữa các lượt, để bản ghi hiển thị các lời gọi công cụ và kết quả mà không có văn bản suy nghĩ inline.
- **Level 3:** Điều gì thay đổi khi hai lời gọi công cụ trong một lượt trả về không theo thứ tự? Expected: mỗi kết quả cần một id tương quan gắn nó với lời gọi của nó, hoặc mô hình đọc kết quả sai cho một lời gọi.

## Wrong answers

- "Một agent là một mô hình có một system prompt dài." Một prompt không thể chạy một công cụ hoặc đọc một kết quả, nên mô hình vẫn dừng tại lần đoán sai đầu tiên.
- "Vòng lặp kết thúc khi mô hình nói đã xong." Một mô hình có thể nói đã xong quá sớm hoặc không bao giờ, nên vòng lặp cũng cần một ngân sách lượt và một cách dừng không có lời gọi công cụ.
- "Các lỗi công cụ nên phát sinh ngoại lệ để nhà phát triển thấy chúng." Một lỗi phát sinh ngoại lệ kết thúc lần chạy, trong khi một lỗi trở thành một quan sát cho phép mô hình sửa lời gọi.

## Taught in

[Bài học vòng lặp agent](../../../phases/14-agent-engineering/01-the-agent-loop/) dựng năm phần bằng một mô hình theo kịch bản và ba công cụ.
