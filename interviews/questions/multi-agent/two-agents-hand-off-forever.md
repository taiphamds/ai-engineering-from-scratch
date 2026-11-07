---
id: two-agents-hand-off-forever
title: Two agents hand off to each other until the cap
card: multi-agent
kind: debug
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [debugging, screen]
tags: [handoff-loop, routines, stateless, loop-detection, fallback-agent]
minutes: 8
lessons: [phases/16-multi-agent-and-swarms/11-handoffs-and-routines]
manuals: []
practice: []
cheatsheet: [multi-agent, agent-failure-modes]
related: []
updated: 2026-11-03
---

Một hệ thống hỗ trợ dùng điều phối dựa trên bàn giao: mỗi agent là một prompt cộng một tập công cụ, và một trong các công cụ trả về một agent khác. Trace cho thấy agent phân loại ban đầu bàn giao một người dùng sang thanh toán, thanh toán bàn giao người dùng trở lại phân loại ban đầu, và hai bên lặp lại đến khi giới hạn vòng kết thúc lần chạy. Người dùng chưa bao giờ nhận một câu trả lời. Tại sao điều này xảy ra, và cách sửa ít tốn kém là gì?

## Short answer

Trong mẫu này, định tuyến nằm trong các prompt, và agent hiện tại chọn bên kế tiếp bằng một lời gọi công cụ. Prompt phân loại ban đầu nói một câu hỏi thanh toán đến thanh toán, và prompt thanh toán nói bất cứ thứ gì ngoài công cụ của nó trở lại phân loại ban đầu, và thông điệp của người dùng thỏa mãn cả hai. Không gì được lưu bền giữa các lần bàn giao, nên agent mới bắt đầu từ prompt và lịch sử và không biết cùng bàn giao đã thất bại. Cách sửa ít tốn kém là một bộ phát hiện vòng lặp trên vài bàn giao cuối buộc một lối thoát đến một agent dự phòng, cộng một sự kiện trace cho mọi bàn giao.

## Full answer

### Why the pattern loops

Hai thành phần nguyên thủy là routine, một system prompt định nghĩa một vai trò và các công cụ của nó, và bàn giao, một công cụ trả về agent tiếp theo. Công việc duy nhất của framework là thấy giá trị trả về là agent và chuyển. Không có đồ thị và không có máy trạng thái. Định tuyến là bất cứ điều gì các prompt nói, và hai prompt có thể mô tả một chu kỳ mà không ai viết nó. Mẫu không có trạng thái giữa các lần chạy, và trong một lần chạy, bộ nhớ duy nhất là lịch sử thông điệp, mà các agent không đọc để tìm một mẫu lặp.

### Find it in the trace

Một vòng lặp bàn giao là hai agent luân phiên không có lượt người dùng và không có kết quả công cụ giữa chúng. Đọc các sự kiện bàn giao cho cặp. Nếu mỗi bàn giao mang cùng lý do, các prompt bất đồng về ai sở hữu trường hợp.

### The cheap fix

1. **Phát hiện vòng lặp.** Giữ vài bàn giao cuối trong một vòng. Khi cùng hai agent đã bàn giao ba lần liên tiếp, buộc một lối thoát.
2. **Một agent dự phòng.** Lối thoát đến một mặc định an toàn có thể trả lời hoặc chuyển lên một người. Cùng dự phòng bắt một bàn giao đến một agent không tồn tại.
3. **Ghi log bàn giao.** Mọi bàn giao ghi một sự kiện với bên gửi, bên nhận và một bản chụp ngữ cảnh, để vòng lặp nhìn thấy trước giới hạn.

### The real fix

Sửa các prompt để chính xác một agent sở hữu mỗi trường hợp, và cấp cho agent thanh toán một công cụ xử lý trường hợp thay vì một lý do gửi nó trở lại. Quyết định ngữ cảnh nào chuyển trên mỗi bàn giao: toàn bộ lịch sử đắt, N thông điệp cuối mất lý do, và một bản tóm tắt do agent đi ra viết là cách trung gian thông thường. Bản kế nhiệm production của mẫu này thêm session, guardrail và tracing quanh cùng thành phần nguyên thủy, và một bộ lọc bàn giao kiểm soát agent đi vào thấy gì.

### The security angle

Một bàn giao đến một agent có quyền công cụ khác phải được xác thực, vì một thông điệp mà người dùng không viết, chẳng hạn văn bản lấy từ một tài liệu, có thể yêu cầu một bàn giao đến một agent nhiều khả năng hơn. Xem một bàn giao là một thay đổi quyền, không phải một chi tiết định tuyến.

## Follow-ups

- **Level 2:** Tại sao agent thanh toán không nhận thấy nó đã gửi người dùng này trở lại một lần? Expected: nó không có trạng thái và bắt đầu từ prompt cộng lịch sử, và không gì trong vòng lặp đọc lịch sử để tìm một bàn giao lặp.
- **Level 2:** Agent dự phòng nên làm gì? Expected: trả lời với những gì nó có thể, hoặc giao trường hợp cho một người với trace, và không bao giờ bàn giao cho một trong hai agent trong vòng lặp.
- **Level 3:** Bạn chọn ngữ cảnh nào di chuyển trên một bàn giao như thế nào? Expected: toàn bộ lịch sử khi trường hợp ngắn, một bản tóm tắt do agent đi ra viết khi dài, và không bao giờ không có gì, vì agent đi vào khi đó lặp các câu hỏi.
- **Level 3:** Một chat nhóm có bộ chọn tránh vòng lặp cụ thể này như thế nào? Expected: bộ chọn nằm ngoài các agent và có thể thấy sự luân phiên, trong khi trong mẫu bàn giao, agent đang lặp là bên ra quyết định.

## Wrong answers

- "Tăng giới hạn vòng để các agent có thời gian ổn định." Giới hạn là thứ kết thúc vòng lặp, và nhiều vòng hơn cho thêm cùng hai bàn giao.
- "Bảo phân loại ban đầu không bao giờ nhận một bàn giao từ thanh toán." Điều đó chặn một lần trở lại hợp lệ khi thanh toán thực sự không thể giúp, và cách sửa là sở hữu rõ ràng cộng một bộ phát hiện.
- "Chuyển sang một framework đồ thị và vấn đề biến mất." Một đồ thị có thể mã hóa cùng chu kỳ với hai cạnh, và bộ phát hiện vòng lặp hữu ích trong cả hai.

## Taught in

[Bài học bàn giao và routine](../../../phases/16-multi-agent-and-swarms/11-handoffs-and-routines/) xây dựng vòng lặp bàn giao và liệt kê phát hiện vòng lặp và agent dự phòng trong danh sách kiểm tra.
