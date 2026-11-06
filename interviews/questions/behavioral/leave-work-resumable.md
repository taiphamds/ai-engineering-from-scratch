---
id: leave-work-resumable
title: Leave work so that someone else can resume it
card: behavioral
kind: concept
level: 1
roles: [agentic-ai-engineer, applied-ai-engineer, inference-engineer, ai-data-engineer]
rounds: [behavioral, screen]
tags: [handoff, planning, resumable-work]
minutes: 6
lessons: [phases/14-agent-engineering/44-plan-from-evidence]
manuals: []
practice: []
cheatsheet: [agent-planning]
related: [behavioral/plan-you-would-reject]
updated: 2026-11-03
---

Phiên của bạn kết thúc không báo trước ở giữa một thay đổi nhiều bước, và một đồng nghiệp tiếp quản vào sáng hôm sau. Họ phải có thể tìm thấy gì, và ở đâu?

## Short answer

Họ cần thấy những mục nào đã xong, phép chứng minh nào đã chạy cho mỗi mục, những file nào đã thay đổi, những dependency nào hiện đã được gỡ chặn, và mục an toàn tiếp theo là gì. Trạng thái đó nằm cạnh công việc, trong repository, dưới dạng các mục nhỏ có bằng chứng rõ ràng, không phải các ô đã đánh dấu bên trong một cuộc trò chuyện.

## Full answer

### Design for interruption

Các phiên kết thúc bất ngờ. Một kế hoạch có thể tiếp tục có các mục công việc đủ nhỏ để một người khác, hoặc một agent khác, có thể xác định trạng thái của mỗi mục chỉ từ các sản phẩm. Năm điều họ phải có thể đọc:

- mục nào đã hoàn tất;
- phép chứng minh nào đã chạy và nó trả về gì;
- những sản phẩm nào đã thay đổi;
- những dependency nào hiện đã được gỡ chặn;
- mục an toàn tiếp theo là gì.

### Why chat is the wrong place

Một ô đã đánh dấu trong một cuộc hội thoại nói ai đó tin một mục đã xong. Nó không nói lệnh nào đã chứng minh điều đó hoặc những file nào nó đã chạm. Người tiếp theo hoặc tin ô hoặc làm lại công việc. Một kế hoạch được lưu cạnh mã, với một định danh cho mỗi mục và lệnh chứng minh được viết ra, cho phép họ xác minh thay vì tin.

### The habit

Tôi dừng ở các ranh giới mục khi có thể. Khi không thể, kế hoạch vẫn cho thấy phép chứng minh cuối cùng đã đạt, nên điểm tiếp tục là mục đầu tiên có phép chứng minh chưa chạy.

## Follow-ups

- **Level 1:** Bạn giữ kế hoạch ở đâu? Expected: trong repository cạnh công việc, như nguồn sự thật, với bất kỳ bản kết xuất nào như một dạng xem Markdown được tạo từ nó.
- **Level 2:** Một mục được đánh dấu đã xong nhưng không ghi bằng chứng. Đồng nghiệp làm gì? Expected: coi nó là chưa xong và chạy phép chứng minh của nó; một ô không có bằng chứng là một niềm tin.
- **Level 2:** Tại sao kích thước mục có ý nghĩa đối với việc tiếp tục? Expected: một mục nhỏ hoặc đã hoàn tất hoặc chưa; một mục lớn làm dở một nửa buộc người tiếp theo dựng lại nơi nó dừng.

## Wrong answers

- "Viết một thông điệp tóm tắt vào cuối phiên." Phiên có thể kết thúc trước bản tóm tắt; trạng thái phải tồn tại khi công việc tiến triển.
- "Git log là đủ." Các commit cho thấy những gì đã thay đổi, không cho thấy phép chứng minh nào đã chạy hoặc mục nào tiếp theo.
- "Chỉ người bắt đầu có thể hoàn tất nó." Đó là thất bại mà kế hoạch nên ngăn.

## Taught in

[Bài học kế hoạch có bằng chứng hỗ trợ](../../../phases/14-agent-engineering/44-plan-from-evidence/) bao quát việc thiết kế một kế hoạch cho sự gián đoạn và lưu nó cạnh công việc.
