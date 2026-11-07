---
id: who-picks-the-next-speaker
title: Round-robin, a model selector, or the current agent decides
card: multi-agent
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [design-review, ml-breadth]
tags: [speaker-selection, group-chat, handoff, orchestrator, termination]
minutes: 10
lessons: [phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection, phases/16-multi-agent-and-swarms/11-handoffs-and-routines]
manuals: []
practice: []
cheatsheet: [multi-agent, agent-frameworks-compared]
related: [multi-agent/two-agents-hand-off-forever, multi-agent/four-primitives-for-any-framework]
updated: 2026-11-03
---

Bốn agent, một bên viết mã, một bên đánh giá, một bên kiểm thử và một bên nghiên cứu, chia sẻ một cuộc hội thoại. Bạn phải quyết định người nói tiếp theo được chọn như thế nào trên mỗi lượt. Các lựa chọn đang xét là một vòng luân phiên cố định, một mô hình đọc các thông điệp gần đây và chọn, và để agent hiện tại nêu tên bên kế tiếp. So sánh chúng và nói bạn sẽ triển khai gì với mỗi lựa chọn.

## Short answer

Một vòng luân phiên cố định có tính xác định và ít tốn kém, và nó cho bên viết mã lượt khi chủ đề là một câu hỏi pháp lý. Một bộ chọn mô hình nhận biết ngữ cảnh, và nó tốn một lời gọi mô hình bổ sung mỗi lượt, chọn khác nhau trên đầu vào giống hệt, và có xu hướng thiên vị một agent. Một bàn giao bởi agent hiện tại giữ định tuyến trong các prompt không có quản lý bên ngoài, và nó là mẫu lặp khi hai prompt bất đồng. Phần lớn chat production dùng một bộ chọn với các quy tắc dự phòng, một giới hạn vòng, một tín hiệu kết thúc và một log mọi lựa chọn.

## Full answer

### The three selectors

| Bộ chọn | Điểm mạnh | Điểm yếu |
|---|---|---|
| Round-robin | Có tính xác định, không có lời gọi bổ sung, mở rộng tuyến tính theo agent | Bỏ qua ngữ cảnh, nên sai agent nhận lượt |
| Do mô hình chọn | Đọc pool và chọn người nói tiếp tốt nhất | Một lời gọi bổ sung mỗi lượt, không nhất quán giữa các lần chạy, và có thể thiên vị một người nói thường xuyên |
| Agent hiện tại bàn giao | Không có quản lý, định tuyến nằm trong mỗi prompt | Hai prompt có thể tạo một chu kỳ, và một thông điệp được chèn có thể buộc một bàn giao |

### Who decides, and where

Khác biệt giữa thứ hai và thứ ba là nơi quyết định nằm. Trong một chat nhóm, bộ chọn nằm ngoài các agent và đọc pool dùng chung. Trong mẫu bàn giao, agent hoạt động quyết định bằng cách gọi một công cụ trả về agent tiếp theo. Một quản lý bên ngoài có thể thấy sự luân phiên giữa hai agent và phá nó. Một agent bên trong vòng lặp không thể.

### What goes wrong in a group chat

- **Tính không xác định.** Cùng pool cho những người nói tiếp khác nhau ở các lần chạy khác nhau, gây hại cho kiểm toán và phát lại.
- **Dây chuyền nhường theo.** Các agent theo bất cứ ai nói tự tin nhất, nên các prompt phải nói khi nào bất đồng.
- **Tăng ngữ cảnh.** Mọi agent đọc mọi thông điệp, và sau khoảng 10 lượt pool lớn, nên cấp cho mỗi agent một góc nhìn có phạm vi.
- **Một agent chi phối.** Bộ chọn tiếp tục chọn agent có chuyên môn khớp các thông điệp gần đây, nên theo dõi số lượt mỗi agent và cảnh báo về mất cân bằng.

### What to ship

1. Một giới hạn vòng, 10 đến 20 cho một tác vụ điển hình.
2. Một tín hiệu kết thúc: một token sentinel từ một agent, hoặc một bộ xác minh kiểm tra mục tiêu mỗi lượt.
3. Một chỉ số cân bằng người nói, với một cảnh báo khi một agent lấy quá nhiều lượt.
4. Một bộ chọn tùy chỉnh kết hợp lựa chọn của mô hình với các quy tắc như "bên kiểm thử nói sau bên viết mã".
5. Một log đầu vào của bộ chọn và lựa chọn của nó, vì không có nó, một lựa chọn sai không thể được gỡ lỗi.

### When each one fits

Một vòng luân phiên cố định phù hợp một pipeline theo giai đoạn nơi thứ tự đã biết. Một bộ chọn mô hình phù hợp một cuộc hội thoại khám phá nơi luồng không phải đồ thị. Các bàn giao phù hợp phân loại ban đầu, nơi một agent phía trước định tuyến một người dùng đến một chuyên gia và cuộc hội thoại ngắn.

## Follow-ups

- **Level 2:** Tại sao bộ chọn mô hình cần một log đầu vào cũng như đầu ra? Expected: lựa chọn phụ thuộc vào những gì bộ chọn thấy, và không có đầu vào, một người đánh giá không thể biết lựa chọn sai hay pool sai.
- **Level 2:** Kết thúc dựa trên bộ xác minh thêm gì so với một token sentinel? Expected: chat dừng khi một kiểm tra đạt, không phải khi một agent tuyên bố đã xong, loại bỏ kết thúc sớm bởi một agent tự tin.
- **Level 3:** Lựa chọn nào trong ba lựa chọn làm prompt injection tệ hơn, và tại sao? Expected: mẫu bàn giao, vì lời gọi công cụ quyết định được thực hiện bởi agent vừa đọc văn bản được chèn, trong khi một bộ chọn bên ngoài có thể áp dụng các quy tắc các agent không kiểm soát.
- **Level 3:** Một bộ chọn tùy chỉnh sửa vấn đề người nói thường xuyên mà không mất nhận biết ngữ cảnh như thế nào? Expected: để mô hình đề xuất, rồi áp dụng một quy tắc giới hạn các lượt liên tiếp mỗi agent và buộc bộ xác minh hoặc một agent ít nói tham gia.

## Wrong answers

- "Dùng bộ chọn mô hình, vì nó hiểu cuộc hội thoại." Nó cũng thêm một lời gọi mỗi lượt, chọn không nhất quán, và thiên vị một agent trừ khi các quy tắc và một chỉ số cân bằng ràng buộc nó.
- "Round-robin công bằng, nên an toàn." Các lượt công bằng không phải các lượt hữu ích, và một bên viết mã nói về một câu hỏi pháp lý lãng phí một vòng và thêm nhiễu vào pool.
- "Để các agent tự quyết định với nhau." Đó là mẫu bàn giao, và nó là mẫu tạo chu kỳ và một thông điệp được chèn có thể điều hướng.

## Taught in

[Bài học chat nhóm](../../../phases/16-multi-agent-and-swarms/10-group-chat-speaker-selection/) xây dựng ba bộ chọn và các quy tắc kết thúc, và [bài học bàn giao và routine](../../../phases/16-multi-agent-and-swarms/11-handoffs-and-routines/) đối chiếu quyết định của quản lý với của agent.
