---
id: why-a-fresh-context-wins
title: Why a lead with workers beats one agent on research
card: multi-agent
kind: concept
level: 1
roles: [agentic-ai-engineer, applied-ai-engineer]
rounds: [screen, ml-breadth]
tags: [supervisor, fresh-context, token-usage, parallelism, synthesis]
minutes: 6
lessons: [phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern]
manuals: []
practice: []
cheatsheet: [multi-agent, research-agent-pipeline]
related: [multi-agent/the-single-agent-ceiling]
updated: 2026-11-03
---

Một hệ thống nghiên cứu có một agent trưởng và nhiều agent worker thắng một agent đơn trên một đánh giá nội bộ với một khoảng cách lớn. Giải thích cơ chế, và nói biến đơn lẻ nào giải thích phần lớn mức tăng.

## Short answer

Agent trưởng lập kế hoạch và phân rã câu hỏi, mỗi worker nhận một cửa sổ mới cho một câu hỏi con hẹp, và agent trưởng tổng hợp các bản tóm tắt worker mà không bao giờ đọc nguồn thô. Ba cơ chế mang mức tăng: ngữ cảnh mới mỗi worker, một prompt hẹp mỗi vai trò, và các worker chạy cùng lúc. Biến giải thích phần lớn là tổng mức dùng token, mà nguồn của bài học đặt ở 80 phần trăm variance trên một benchmark duyệt web. Một worker không mang các token lập kế hoạch của agent trưởng có chỗ để đọc.

## Full answer

### The shape

Agent trưởng nhận câu hỏi, chia nó thành các câu hỏi con, và gửi một câu đến mỗi worker. Mỗi worker bắt đầu từ system prompt riêng và câu hỏi con của nó, không phải từ lịch sử của agent trưởng. Các worker trả về các bản tóm tắt. Agent trưởng không bao giờ thấy tài liệu thô, chỉ các bản tóm tắt, và viết câu trả lời từ chúng.

### The three mechanisms

1. **Ngữ cảnh mới.** Một worker trên một câu hỏi con không mang hàng chục nghìn token agent trưởng đã dùng lập kế hoạch. Nó có một cửa sổ đầy đủ cho câu hỏi của nó. Con số của bài học là một cửa sổ 200k mỗi worker so với 40k agent trưởng đã dùng.
2. **Chuyên môn hóa bằng prompt.** Prompt của agent trưởng nói phân rã và tổng hợp. Prompt của mỗi worker nói tìm điều đã thay đổi trong một thứ. Các prompt hẹp tạo các đầu ra hẹp, dùng được.
3. **Song song.** Các worker chạy đồng thời, nên thời gian thực khoảng bằng worker lâu nhất cộng lập kế hoạch cộng tổng hợp, không phải tổng của mọi worker.

### The gain and its price

Bài học báo cáo một mức tăng 90.2 phần trăm so với agent đơn trên đánh giá nội bộ, và một chi phí khoảng gấp 15 lần token của một agent đơn. Cùng nguồn nói rằng khoảng 80 phần trăm variance trên một benchmark duyệt web được giải thích chỉ bởi mức dùng token. Mẫu thắng vì nó dùng nhiều token hơn ở nơi chúng giúp, không phải vì agent trưởng khéo.

### Operational lessons that come with it

Điều chỉnh nỗ lực theo câu hỏi: một truy vấn đơn giản cần một agent và vài lời gọi công cụ, và một câu phức tạp có thể cần hơn mười worker, và agent trưởng phải ước lượng điều đó. Phân rã rộng trước, rồi đi sâu hơn nơi một câu trả lời đáng để làm vậy. Các agent có trạng thái chạy lâu cần một triển khai dần nơi các phiên bản cũ hoàn tất công việc, không phải một lần thay nóng.

## Follow-ups

- **Level 1:** Tại sao agent trưởng không đọc nguồn thô? Expected: để cửa sổ của nó giữ trống cho lập kế hoạch và tổng hợp, và để mỗi nguồn được đọc một lần bởi worker sở hữu nó.
- **Level 2:** Khi nào mẫu thua một pipeline? Expected: khi bước hai cần đầu ra bước một, vì khi đó không có công việc song song và các agent bổ sung chỉ thêm token.
- **Level 2:** Agent trưởng làm gì khi hai worker bất đồng? Expected: nó hỏi lại hoặc ghi chú sự bất đồng trong câu trả lời, và không bao giờ im lặng chọn một phía.
- **Level 3:** Một worker trôi ra ngoài câu hỏi con của nó. Điều gì dừng nó? Expected: một phạm vi tường minh trong prompt, một timeout khoảng gấp đôi thời gian chạy worker trung vị, và một giới hạn token, sau đó agent trưởng sinh lại với một câu hỏi hẹp hơn hoặc tiếp tục không có nó.

## Wrong answers

- "Agent trưởng là một mô hình lớn hơn, nên thông minh hơn." Mức tăng theo mức dùng token, và các worker làm việc đọc; chỉ một agent trưởng lớn hơn không thay đổi gì về ngữ cảnh.
- "Đa agent rẻ hơn vì các worker nhỏ." Nó tốn khoảng gấp 15 lần token, và chỉ đáng khi giá trị tác vụ trang trải điều đó.
- "Cấp cả nguồn thô cho agent trưởng, để nó có thể kiểm tra worker." Điều đó lấp cửa sổ của agent trưởng bằng những gì các worker đã đọc và loại bỏ lợi thế ngữ cảnh mới.

## Taught in

[Bài học mẫu supervisor](../../../phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/) xây dựng agent trưởng và các worker song song và báo cáo mức tăng đo được.
