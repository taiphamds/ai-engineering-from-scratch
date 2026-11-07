---
id: the-single-agent-ceiling
title: Where one agent stops working, and why
card: multi-agent
kind: concept
level: 1
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, ml-breadth]
tags: [single-agent-ceiling, context-saturation, role-confusion, parallelism]
minutes: 6
lessons: [phases/16-multi-agent-and-swarms/01-why-multi-agent]
manuals: []
practice: []
cheatsheet: [multi-agent]
related: []
updated: 2026-11-03
---

Agent đơn của bạn làm tốt các tác vụ nhỏ. Khi được hướng đến một codebase 200 file trong ba ngôn ngữ, với các kiểm thử cần hạ tầng và một API bên ngoài phải nghiên cứu trước, nó ngừng tiến triển. Nhóm đề xuất một mô hình có cửa sổ lớn hơn. Trần nó chạm là gì, và một cửa sổ lớn hơn có loại bỏ nó không?

## Short answer

Tác vụ vượt những gì một vòng lặp, một cửa sổ và một system prompt có thể gánh, và một cửa sổ lớn hơn chỉ di chuyển một trong ba giới hạn. Ngữ cảnh bão hòa khi các kết quả công cụ chất lên, nên các chi tiết từ một lượt sớm biến mất ở lượt 30, và một prompt yêu cầu mô hình nghiên cứu, viết mã, đánh giá và kiểm thử tạo ra một agent làm kém từng việc. Một vòng lặp đọc file A, rồi B, rồi C, không có song song. Cách sửa cho cả ba là chia công việc để mỗi agent có một công việc, một cửa sổ và một prompt.

## Full answer

### Three things break

1. **Bão hòa ngữ cảnh.** Các kết quả công cụ tích lũy. Đến lượt 30 agent đã dùng khoảng 150k token nội dung file, đầu ra lệnh và suy luận riêng, và chi tiết từ lượt 5 bị mất. Đọc 50 file lớn có thể vượt một cửa sổ 200k.
2. **Nhầm lẫn vai trò.** Một system prompt nói bạn là nhà nghiên cứu, người viết mã, người đánh giá và người kiểm thử tạo ra một agent nghiên cứu dở dang, viết mã dở dang và không bao giờ hoàn tất đánh giá.
3. **Nút thắt tuần tự.** Agent đọc ba file trong ba lời gọi mô hình tuần tự và ba lần thực thi công cụ tuần tự. Không gì chạy cùng lúc.

### What a bigger window changes

Nó trì hoãn giới hạn đầu và không làm gì cho hai giới hạn còn lại. Agent vẫn quên những gì đã đọc 40 lời gọi công cụ trước, vì vấn đề là attention trên một lịch sử dài, không phải giới hạn cứng. Prompt vẫn yêu cầu một mô hình làm bốn vai trò. Vòng lặp vẫn tuần tự.

### The split

Cấp cho mỗi agent một công việc, một cửa sổ và một prompt được tinh chỉnh cho công việc đó. Nhà nghiên cứu đọc tài liệu và chỉ xuất các sự thật cần cho triển khai. Người viết mã nhận các sự thật đó và viết mã. Người đánh giá nhận mã và tìm bug. Phần đọc của nhà nghiên cứu không bao giờ đi vào cửa sổ của người đánh giá, vì mỗi agent chỉ nhận các thông điệp gửi đến nó.

### When to stay single

Quy tắc kinh nghiệm của bài học: một tác vụ mất dưới 20 lời gọi công cụ và vừa trong 100k token ở lại với một agent. Chia tốn nhiều tổng token hơn, thêm logic phối hợp có bug riêng, và biến gỡ lỗi từ đọc một cuộc hội thoại thành truy vết thông điệp qua nhiều cuộc.

## Follow-ups

- **Level 1:** Song song giải quyết giới hạn nào trong ba giới hạn? Expected: chỉ nút thắt tuần tự, vì đọc ba file cùng lúc không thu nhỏ bất kỳ cửa sổ nào hay làm sắc bất kỳ prompt nào.
- **Level 2:** Tại sao một prompt chuyên biệt cải thiện mỗi giai đoạn? Expected: một prompt bao phủ một vai trò có thể cụ thể về đầu vào, đầu ra và những gì bỏ qua, trong khi một prompt cho bốn vai trò phải tổng quát.
- **Level 2:** Chi phí mà việc chia luôn thêm là gì? Expected: nhiều tổng token hơn, vì mỗi agent là một lời gọi mô hình riêng, cộng độ trễ và logic phối hợp.
- **Level 3:** Thông tin bị mất ở đâu trong một phép chia đa agent? Expected: ở mọi ranh giới agent, nơi toàn bộ ngữ cảnh của một agent được nén thành một thông điệp cho agent tiếp theo.

## Wrong answers

- "Một cửa sổ ngữ cảnh lớn hơn giải quyết nó." Cửa sổ di chuyển một giới hạn và để sự nhầm lẫn vai trò và vòng lặp tuần tự nguyên vẹn.
- "Một system prompt dài hơn, chi tiết hơn bao phủ các vai trò." Một prompt đơn bao phủ bốn vai trò là nguyên nhân nhầm lẫn vai trò, không phải cách chữa.
- "Luôn chia, vì các chuyên gia tốt hơn." Dưới khoảng 20 lời gọi công cụ và 100k token, việc chia thêm chi phí và bug mà không có lợi ích.

## Taught in

[Bài học tại sao đa agent](../../../phases/16-multi-agent-and-swarms/01-why-multi-agent/) nêu ba giới hạn và quy tắc kinh nghiệm để giữ agent đơn.
