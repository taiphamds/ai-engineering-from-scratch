---
id: when-one-agent-is-enough
title: Five agents for a task that one call handles
card: multi-agent
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [design-review, system-design]
tags: [single-agent, complexity-cost, lossy-boundary, coordination, latency]
minutes: 8
lessons: [phases/16-multi-agent-and-swarms/01-why-multi-agent]
manuals: []
practice: []
cheatsheet: [multi-agent]
related: [multi-agent/the-single-agent-ceiling]
updated: 2026-11-03
---

Một nhóm đề xuất một pipeline năm agent, với một bên lập kế hoạch, một bên truy xuất, một bên viết, một bên phê bình và một bên định dạng, cho một tính năng tóm tắt mà một agent xử lý hôm nay trong một tá lời gọi công cụ. Lập luận là các chuyên gia tạo đầu ra tốt hơn. Bạn quyết định như thế nào, và pipeline sẽ tốn gì mà slide không cho thấy?

## Short answer

Giữ agent đơn trừ khi tác vụ không vượt qua một trong ba kiểm tra: nó cần nhiều ngữ cảnh hơn một cửa sổ chứa, nó cần các prompt khác nhau ở các giai đoạn khác nhau, hoặc nó có công việc có thể chạy cùng lúc. Một tá lời gọi công cụ trên một tác vụ vừa trong một cửa sổ không thỏa mãn điều nào. Pipeline thêm một bước nén mất mát ở mỗi trong bốn ranh giới, logic phối hợp có bug riêng, độ trễ ít nhất năm lời gọi mô hình tuần tự, và chi phí token gấp năm.

## Full answer

### The three tests

| Kiểm tra | Nó hỏi gì | Tác vụ này |
|---|---|---|
| Ngữ cảnh | Dữ liệu làm việc có vượt một cửa sổ, khoảng 100k token không? | Không, một tá lời gọi công cụ vừa |
| Chuyên môn | Các giai đoạn có cần các system prompt khác nhau không? | Một bộ tóm tắt và một bộ định dạng có thể chia sẻ một prompt |
| Song song | Các phần công việc có thể chạy cùng lúc không? | Các giai đoạn tuần tự |

Quy tắc kinh nghiệm của bài học là một tác vụ dưới 20 lời gọi công cụ và 100k token ở lại với một agent.

### The hidden costs

- **Các ranh giới mất mát.** Mọi thông điệp giữa các agent nén toàn bộ ngữ cảnh bên gửi thành một thông điệp. Bốn ranh giới là bốn nơi chi tiết bên phê bình cần biến mất.
- **Các bug phối hợp.** Ai chạy khi nào, theo thứ tự nào, với đầu vào nào là mã mới, và nó thất bại theo những cách mới.
- **Độ trễ.** Năm agent là ít nhất năm lời gọi mô hình tuần tự, nhiều hơn nếu bên phê bình gửi công việc trở lại bên viết.
- **Chi phí.** Mỗi agent dùng token riêng, nên hóa đơn nhân lên.
- **Gỡ lỗi.** Một cuộc hội thoại thành năm, và một câu trả lời sai phải được truy vết qua các thông điệp giữa chúng.

### When the slide would be right

Nếu tính năng tăng đến việc tóm tắt các tài liệu không vừa trong một cửa sổ, chia theo tài liệu và gộp. Nếu bên phê bình cần một prompt phản biện bên viết, đó là một vai trò thứ hai thực sự. Nếu ba nguồn có thể được đọc cùng lúc, phân nhánh. Mỗi điều đó là một trong ba kiểm tra, và việc chia nên khớp kiểm tra nó thỏa mãn, không phải thêm mọi vai trò cùng lúc.

### How to settle it

Chạy cả hai trên cùng tập tác vụ và đo chất lượng, độ trễ và token. So sánh của bài học cho thấy phiên bản đa agent dùng nhiều tổng token hơn trong khi ngữ cảnh mỗi giai đoạn giữ sạch. Nếu mức tăng chất lượng không trả được độ trễ và chi phí, agent đơn thắng.

## Follow-ups

- **Level 2:** Bên phê bình gửi bản nháp trở lại bên viết. Điều đó làm gì với độ trễ? Expected: mỗi vòng thêm hai lời gọi mô hình tuần tự nữa, nên vòng lặp phải có một giới hạn số vòng.
- **Level 2:** Bạn sẽ chấp nhận phép chia đơn lẻ nào trước, nếu có? Expected: một bên phê bình có một prompt đối kháng, vì đó là vai trò duy nhất cần một system prompt khác, và chỉ nếu đánh giá cho thấy mức tăng.
- **Level 3:** Tại sao ranh giới giữa các agent được mô tả là nén mất mát? Expected: agent nhận chỉ thấy thông điệp, không phải kết quả công cụ và suy luận của bên gửi, nên bất kỳ chi tiết nào không được viết vào thông điệp đều mất.
- **Level 3:** Lựa chọn thay đổi như thế nào nếu các bản tóm tắt phải được tạo dưới một mục tiêu độ trễ nghiêm ngặt? Expected: các giai đoạn tuần tự là kẻ thù của độ trễ, nên giữ agent đơn hoặc chỉ phân nhánh các phần chạy song song.

## Wrong answers

- "Các chuyên gia luôn thắng một người tổng quát." Các chuyên gia thắng khi tác vụ không vượt qua một trong ba kiểm tra, và tác vụ này không trượt kiểm tra nào.
- "Nhiều agent hơn có nghĩa nhiều kiểm tra hơn, nên chất lượng tăng." Mỗi ranh giới mất thông tin, và một bên phê bình không bao giờ thấy các nguồn không thể kiểm tra chúng.
- "Chi phí token không quan trọng ở quy mô chúng ta." Năm agent nhân hóa đơn và độ trễ trên mọi yêu cầu, và đó là một quyết định sản phẩm, không phải một chi tiết.

## Taught in

[Bài học tại sao đa agent](../../../phases/16-multi-agent-and-swarms/01-why-multi-agent/) đưa ra ba kiểm tra, chi phí phức tạp và quy tắc kinh nghiệm.
