---
id: the-agent-loops-forever
title: This agent loops forever, find out why
card: agents
kind: debug
level: 2
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, screen]
tags: [infinite-loop, turn-budget, stop-condition, observation, tool-error]
minutes: 10
lessons: [phases/14-agent-engineering/01-the-agent-loop, phases/19-capstone-projects/20-agent-harness-loop-contract, phases/15-autonomous-systems/10-claude-code-permission-modes]
manuals: []
practice: []
cheatsheet: [agent-harness, agent-failure-modes]
related: [agents/five-parts-of-an-agent-loop]
updated: 2026-11-03
---

Một kỹ sư trực gọi bạn. Một coding agent đã chạy hai giờ trên một nhiệm vụ thường mất mười phút. Trace cho thấy một lệnh shell, một kết quả, rồi cùng lệnh lần nữa, lặp đi lặp lại. Trình bày cách bạn tìm nguyên nhân và những gì bạn thay đổi để điều này không thể xảy ra lần nữa.

## Short answer

Đọc trace để tìm cặp hành động và quan sát lặp lại, rồi hỏi tại sao mô hình không phản ứng với quan sát. Các nguyên nhân thường gặp là một lỗi mà vòng lặp không bao giờ cho mô hình thấy, một quan sát đọc giống nhau ở mọi lượt, và thiếu một ngân sách lượt. Sửa nguyên nhân, rồi thêm hai chốt bảo vệ dừng bất kỳ vòng lặp tương lai nào: một ngân sách nhường quyền điều khiển cho bên gọi, và một phép kiểm tra một hành động lặp với một quan sát lặp.

## Full answer

### Find the cause

1. **Tìm cặp lặp lại.** Lấy hai mươi lượt cuối và so sánh mỗi hành động với hành động trước nó. Một vòng lặp là một hành động cộng quan sát lặp lại mà không có thay đổi trong bộ đệm thông điệp giữa chúng.
2. **Kiểm tra mô hình đã thấy gì.** Nếu công cụ phát sinh một ngoại lệ và runner bắt nó ngoài vòng lặp, mô hình chưa bao giờ nhận được một quan sát. Khi đó nó làm thứ duy nhất nó biết: cùng lời gọi. Quy tắc của bài học là mọi lỗi, bao gồm một 400 từ một dịch vụ, phải trở lại dưới dạng một chuỗi quan sát.
3. **Kiểm tra liệu quan sát có mang thông tin hay không.** Một quan sát `ok` sau một lần ghi không làm gì, hoặc một runner kiểm thử không in gì khi thất bại, không cho mô hình lý do để thay đổi kế hoạch. Bộ định dạng quan sát phải bao gồm mã thoát và phần đuôi đầu ra.
4. **Kiểm tra các điều kiện dừng.** Một vòng lặp chỉ kết thúc trên một lời gọi finish rõ ràng chạy cho đến khi ngữ cảnh đầy khi mô hình không bao giờ gọi finish. Một vòng lặp không có ngân sách lượt chạy cho đến khi ai đó gọi bạn.

### Fix it so the loop cannot recur

- **Một ngân sách lượt theo lớp nhiệm vụ.** Các agent chạy 40 đến 400 bước cho mỗi nhiệm vụ, nên chọn một mức trần cho lớp, không phải một mức trần cho mọi nhiệm vụ. Trong hợp đồng harness ngân sách không phải một công tắc kết liễu. Khi chạm một giới hạn vòng lặp kích hoạt `on_budget_exceeded`, phát ra `budget.warn`, và nhường quyền cho bên gọi. Bên gọi mở rộng ngân sách hoặc đóng phiên.
- **Một bộ phát hiện lặp.** Bài học chế độ quyền hạn mô tả một bộ phân loại thấy hành động N+1 gần bằng hành động N năm lần liên tiếp. Bạn không cần một mô hình cho trường hợp đơn giản. Hash hành động và quan sát, giữ vài hash cuối, và tạm dừng khi một hash lặp lại.
- **Các lỗi làm quan sát.** Đưa mọi ngoại lệ qua bộ định dạng để mô hình có thể sửa lời gọi.
- **Một cách dừng không có lời gọi công cụ.** Khi một lượt trợ lý không chứa lời gọi công cụ, coi lần chạy là hoàn tất.

### Prove the fix

Phát lại trace đã lưu qua vòng lặp đã sửa. Hợp đồng harness là một máy trạng thái xác định, nên cùng log sự kiện đi lại vào cùng trạng thái mà không có lời gọi mô hình mới. Việc phát lại phải tạm dừng ở lần lặp và phát ra sự kiện ngân sách ở nơi lần chạy cũ tiếp tục.

## Follow-ups

- **Level 2:** Mô hình lặp một lời gọi vì công cụ trả về một chuỗi rỗng khi thất bại. Ai chịu trách nhiệm sửa? Expected: bộ định dạng quan sát, phải thêm mã thoát và văn bản lỗi để quan sát thay đổi khi lời gọi thất bại.
- **Level 3:** Tại sao harness nhường quyền khi chạm ngân sách thay vì phát sinh ngoại lệ? Expected: một lần nhường quyền là một giá trị trả về mà bên gọi có thể kiểm tra và tiếp tục từ đó, trong khi một ngoại lệ mất trạng thái một phần và buộc bắt đầu lại.
- **Level 3:** Một bộ phát hiện lặp chỉ hash hành động. Nó bỏ sót vòng lặp nào? Expected: một vòng lặp nơi hành động thay đổi nhẹ mỗi lần, như một bộ đếm trong một đối số, trong khi quan sát không bao giờ thay đổi, nên cũng hash quan sát.
- **Level 4:** Vòng lặp đã sửa, nhưng agent vẫn chạy hai giờ trước khi ai đó nhận thấy. Bề mặt thiếu là gì? Expected: khả năng quan sát, một ngân sách thời gian thực có một cảnh báo, và một trace mà ai đó có thể đọc tại bước 38 mà không đọc toàn bộ lần chạy.

## Wrong answers

- "Tăng số lượt tối đa để nhiệm vụ có thể hoàn tất." Nhiệm vụ không tiến triển, nên thêm lượt cho thêm cùng lời gọi.
- "Thêm một dòng vào prompt nói đừng lặp lại chính mình." Mô hình lặp vì nó chưa bao giờ thấy lỗi, và một prompt không thể cho nó thấy những gì vòng lặp giấu.
- "Kết liễu tiến trình khi chạm ngân sách." Một lần kết liễu mất trạng thái một phần, trong khi một lần nhường quyền cho bên gọi kiểm tra nó, mở rộng ngân sách, hoặc đóng phiên với một bản bàn giao sạch.

## Taught in

[Bài học vòng lặp agent](../../../phases/14-agent-engineering/01-the-agent-loop/) nêu ngân sách lượt và bộ định dạng cho các quan sát, [hợp đồng vòng lặp harness](../../../phases/19-capstone-projects/20-agent-harness-loop-contract/) làm ngân sách thành một lần nhường quyền, và [bài học các chế độ quyền hạn](../../../phases/15-autonomous-systems/10-claude-code-permission-modes/) mô tả bộ phân loại hành động lặp.
