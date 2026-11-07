---
id: headless-coordinator-loops-to-death
title: Five identical calls, five rejections, exit 1
card: sandboxes
kind: debug
level: 4
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, coding]
tags: [agent-runtime, headless, sub-agents, permissions, regression]
minutes: 12
lessons: []
manuals: [docker-sandboxes-101#s-sub-agents-transfer-task-and-background-agents, docker-sandboxes-101#s-permissions-safety-and-hooks, docker-sandboxes-101#s-session-db-sessions-diff-and-eval]
practice: []
cheatsheet: [agent-harness, agent-failure-modes]
related: [sandboxes/permissions-are-not-a-boundary]
updated: 2026-11-03
---

Một agent điều phối chạy trong CI với `--exec --json`. Luồng sự kiện cho thấy cùng lệnh gọi `run_background_agent` năm lần, mỗi lần được trả lời bằng `The user rejected the tool call.`, rồi `Error: Agent terminated: detected 5 consecutive identical calls to run_background_agent`. Cùng file agent đã hoạt động trên một laptop sáng đó. Giải thích chuỗi sự kiện, sửa nó cho các lần chạy không người giám sát, và thêm kiểm tra lẽ ra đã bắt thay đổi trước CI.

## Short answer

Headless nghĩa là không ai ở đó để trả lời một `tool_call_confirmation`, nên runtime biến lời nhắc thành một sự từ chối; `run_background_agent` nhắc vì nhãn của nó là `unknown`, file không đặt chế độ an toàn, và không mẫu `allow` nào nêu nó, và mô hình lặp lệnh gọi cho đến khi `max_consecutive_tool_calls`, có mặc định là 5, kết thúc lần chạy với mã thoát 1. Sửa bằng `--safety restricted` cùng các quy tắc `allow` cho `run_background_agent` và cho các công cụ mà chính agent phụ nền gọi, vì bên trong một tác vụ đang chạy, một lệnh gọi sẽ hỏi bị tự động từ chối; `transfer_task` không cần gì, vì nó là công cụ duy nhất luôn được phê duyệt không có lời nhắc. Bảo vệ bằng hai phiên được ghi lại và `docker-agent sessions diff --fail-on-divergence -- -1 -2`, so sánh các lệnh gọi công cụ, bỏ qua văn xuôi và dừng ở sự khác biệt đầu tiên.

## Full answer

### Three ways to involve another agent

| Cơ chế | Được thêm bởi | Điều xảy ra |
|---|---|---|
| `transfer_task` | `sub_agents` | agent con chạy trong một phiên phụ sạch với một thông điệp system giữ tác vụ, trả lời như phản hồi công cụ, và không bao giờ thấy lịch sử của người dùng |
| `handoff` | `handoffs` | agent được nêu tên trở thành agent hoạt động cho phần còn lại của hội thoại và thấy toàn bộ lịch sử |
| `run_background_agent` | toolset `background_agents` | bắt đầu một tác vụ và trả về một id ngay; `list`, `view` và `stop` theo dõi nó |

`transfer_task` luôn được phê duyệt không có lời nhắc. Một lần giao việc tới một agent đã nằm trong chuỗi thất bại, và lồng nhau bị chặn ở 10. Một mục `sub_agents` là một tham chiếu registry phân giải lại tag trên mỗi lần chạy trừ khi được ghim vào một digest, đó là cách thứ hai mà một lần chạy laptop và một lần chạy CI khác nhau.

### Why the laptop passed

Laptop có một terminal. Cùng xác nhận xuất hiện và một người phê duyệt nó, hoặc phiên đã được cấp một chế độ. Một phiên không bao giờ chọn một chế độ giữ mặc định cũ: các công cụ chỉ đọc chạy và mọi công cụ khác hỏi. Trong CI, câu hỏi không có người trả lời, sự từ chối quay về mô hình như một kết quả công cụ, mô hình không đổi kế hoạch, và bộ phát hiện vòng lặp dừng lần chạy. `session.db` lưu `safety_policy` theo từng phiên, nên sau đó bạn có thể đọc mỗi lần chạy thất bại có chế độ nào.

### The fix, in order

1. `--safety restricted`, để các lệnh gọi `safe` không khớp chạy và các lệnh gọi `destructive` và `unknown` đóng khi thất bại thay vì nhắc.
2. Các mẫu `allow` cho `run_background_agent` và cho các công cụ agent phụ nền dùng, vì bên trong một tác vụ đang chạy, một lệnh gọi bình thường sẽ hỏi bị tự động từ chối.
3. Giữ `deny` cho bất cứ thứ gì phá hoại; không chế độ nào và không hook allow nào ghi đè một deny.
4. Ghim các tham chiếu agent phụ bên ngoài vào một digest.
5. Chạy agent trong một sandbox để cô lập, vì các quyền được client thực thi.

### The regression check

Ghi lại một lần chạy với `--record=PATH` và `--models-gateway`, phát lại với `--fake`, và so sánh hai phiên bằng `sessions diff`. Chính ví dụ trong phần trợ giúp thất bại vì parser đọc `-1` như một cờ; đặt `--` trước các tham chiếu. Một cặp phát lại giống hệt được ghi lại báo hành vi giống hệt trên mọi lượt, và một lần chạy gọi một công cụ khác trước phân kỳ ở lượt 0 và thoát với mã 1 với `--fail-on-divergence`. Yêu cầu một lệnh gọi công cụ mỗi thông điệp khi bạn ghi, vì một lượt với hai lệnh gọi song song thêm các kết quả theo thứ tự hoàn tất và phần phát lại trả lời `requested interaction not found`.

## Follow-ups

- **Level 3:** Tại sao `transfer_task` không cần một `allow` trong khi `run_background_agent` cần? Expected: giao việc luôn được phê duyệt theo thiết kế, và một lần bắt đầu nền là một lệnh gọi công cụ thông thường do chế độ và các mẫu quyết định.
- **Level 3:** `sessions diff -1 -2` thất bại với một cờ viết tắt không xác định. Tại sao, và bạn gõ gì? Expected: parser đọc `-1` như một cờ; `sessions diff -- -1 -2`.
- **Level 4:** Agent phụ viết được lấy từ một registry theo tag thay vì đọc từ một file. Điều gì có thể thay đổi giữa laptop và CI? Expected: tag được phân giải lại trên mỗi lần chạy, nên ghim một digest.
- **Level 4:** Tại sao so sánh các lệnh gọi công cụ mà không phải văn bản trợ lý? Expected: một mô hình trực tiếp diễn đạt mỗi câu trả lời khác nhau, trong khi chuỗi lệnh gọi công cụ là hành vi bạn đã phát hành.

## Wrong answers

- "Dùng `--yolo` trong CI để không gì nhắc." Đó là `autonomous`; các lệnh gọi phá hoại cũng chạy. `restricted` đóng khi thất bại đối với chúng.
- "Nâng `max_consecutive_tool_calls`." Nó giấu vòng lặp; sự từ chối là lỗi, và bộ phát hiện đã làm việc của nó.
- "Diff các bản ghi hội thoại." Văn xuôi thay đổi giữa các lần chạy; `sessions diff` so sánh chuỗi lệnh gọi công cụ và dừng ở sự khác biệt đầu tiên.

## Taught in

[Phần agent phụ](../../../manuals/docker-sandboxes-101/sections/5-4-sub-agents-transfer-task-and-background-agents.md) ghi lại lệnh gọi nền bị từ chối và bộ phát hiện vòng lặp, [phần quyền](../../../manuals/docker-sandboxes-101/sections/5-5-permissions-safety-and-hooks.md) cung cấp bảng chế độ và thứ tự, và [phần phiên](../../../manuals/docker-sandboxes-101/sections/5-6-session-db-sessions-diff-and-eval.md) cho thấy `sessions diff` và các quy tắc phát lại.
