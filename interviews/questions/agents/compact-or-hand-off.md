---
id: compact-or-hand-off
title: Compact the context, or end the session and hand off
card: agents
kind: tradeoff
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [design-review, system-design]
tags: [compaction, handoff, context-budget, fresh-session, long-running]
minutes: 10
lessons: [phases/14-agent-engineering/40-multi-session-handoff]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops, coding-agents]
related: [agents/a-handoff-is-not-a-status-report]
updated: 2026-11-03
---

Một phiên lập trình dài đã dùng phần lớn cửa sổ ngữ cảnh của nó. Runtime đề nghị tóm tắt các lượt cũ hơn và tiếp tục. Đồng đội của bạn muốn để nó chạy đến giới hạn, vì việc nén ngữ cảnh là tự động. Khi nào bạn nén ngữ cảnh, khi nào bạn kết thúc phiên, và bạn đo gì để chọn?

## Short answer

Nén ngữ cảnh kéo dài một phiên, và một bản bàn giao đóng một phiên gọn gàng rồi bắt đầu phiên tiếp theo trong ngữ cảnh mới. Nén ngữ cảnh là ổn khi lịch sử được nén vẫn mang những gì nhiệm vụ cần, nhưng chất lượng suy giảm khi việc nén chồng chất. Hướng dẫn của bài học là kết thúc phiên bằng một bản bàn giao được tạo tại 50 đến 75 phần trăm ngân sách, không phải ở bức tường giới hạn, vì gói rẻ để viết khi ngữ cảnh còn nguyên và đắt khi mô hình đã bắt đầu mất vị trí của nó.

## Full answer

### Two different operations

| Thao tác | Nó làm gì | Nó tốn gì |
|---|---|---|
| Nén ngữ cảnh | Nén lịch sử tại chỗ và tiếp tục cùng phiên | Mỗi lượt nén mất chi tiết, và những mất mát chồng chất |
| Bàn giao sang phiên mới | Viết một gói, kết thúc phiên, và tiếp tục trong một ngữ cảnh mới | Một điểm ngắt sạch, với chi phí tạo và nạp gói |

Các runtime triển khai nén ngữ cảnh theo các cách khác nhau: một bản tóm tắt không trong suốt phía server, một bản tóm tắt cục bộ được nối thêm dưới dạng một thông điệp người dùng, một phép nén nhiều giai đoạn tăng tiến gần đỉnh cửa sổ, hoặc việc ẩn các thông điệp cũ dựa trên dấu thời gian cộng một bản tóm tắt ngắn. Cơ chế thay đổi. Nhu cầu giống nhau. Bất kỳ thứ gì sống sót qua việc nén phải được tuần tự hóa thành một sản phẩm có thể di chuyển, và sản phẩm đó là gói bàn giao.

### Why not run to the wall

Một runtime nén tại 95 phần trăm nén một ngữ cảnh đã đầy các sản phẩm nén. Khi đó bộ tạo gói tóm tắt trạng thái đã suy giảm. Sai lầm là tiếp tục nén cho đến khi chất lượng sụp đổ. Cách sửa là dành ngân sách cho một bản bàn giao sớm, sạch. Một phiên kết thúc tại 50 đến 75 phần trăm vẫn có lịch sử còn nguyên, các bản ghi lệnh thật và một hành động tiếp theo rõ ràng.

### Make the choice measurable

- Theo dõi tỷ lệ ngữ cảnh tại đó phiên kết thúc, và so sánh các kết quả nhiệm vụ giữa hai phạm vi.
- Đếm số lần một phiên được nén trước khi kết thúc, và đối chiếu tương quan với các phát hiện đánh giá.
- Đọc các gói bàn giao: một gói có `next_action` mơ hồ là dấu hiệu rằng bộ tạo chạy quá muộn.

### One active handoff per branch

Công việc đa agent hỏng do các bản bàn giao cũ nhiều hơn do đầu ra sai. Mỗi gói mang nhánh, commit tốt cuối cùng đã biết và một trạng thái đang hoạt động, đã bị thay thế hoặc đã lưu trữ. Chỉ gói đang hoạt động điều khiển phiên tiếp theo.

## Follow-ups

- **Level 3:** Tại sao một phiên mới tốt hơn lần nén thứ ba? Expected: các mất mát do nén chồng chất, trong khi một phiên mới bắt đầu từ gói, file trạng thái và repo, là hệ thống lưu bản ghi chính thức.
- **Level 3:** Điều gì phải đúng về cây làm việc trước khi bàn giao chạy? Expected: phép kiểm tra dọn dẹp đạt, nên cây làm việc được commit hoặc stash kèm một ghi chú, không còn file tạm, các kiểm thử xanh hoặc được nêu là rủi ro, và nhánh đúng.
- **Level 4:** Bản bàn giao rẻ, nhưng phiên tiếp theo phải dựng lại ngữ cảnh làm việc của nó. Bạn giữ chi phí đó thấp thế nào? Expected: gói liệt kê chính xác các sản phẩm mà phiên tiếp theo phải nạp trước khi hành động, và router trỏ đến chúng, để phiên nạp trạng thái, bảng và hợp đồng đang hoạt động và không gì khác.
- **Level 4:** Hai sản phẩm coding agent được dùng trên một nhiệm vụ, lần lượt. Điều gì làm cho việc chuyển tiếp hoạt động? Expected: schema gói, vì dạng JSON trung lập với sản phẩm và cả hai runtime đọc cùng các trường.

## Wrong answers

- "Nén ngữ cảnh là tự động, nên để runtime xử lý." Nén ngữ cảnh tự động quyết định khi nào nén, không quyết định liệu trạng thái được nén có còn đủ tốt để làm việc từ đó hay không.
- "Kết thúc mọi phiên càng sớm càng tốt để an toàn." Mỗi lần bàn giao tốn một gói và một lần nạp lại, nên mục tiêu là một phạm vi, không phải một giá trị nhỏ nhất.
- "Một cửa sổ ngữ cảnh dài hơn loại bỏ vấn đề." Một cửa sổ lớn hơn trì hoãn bức tường giới hạn, và sự suy giảm chất lượng từ việc nén chồng chất là như nhau.

## Taught in

[Bài học bàn giao nhiều phiên](../../../phases/14-agent-engineering/40-multi-session-handoff/) so sánh các chiến lược nén ngữ cảnh và đặt cửa sổ bàn giao.
