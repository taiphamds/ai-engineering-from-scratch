---
id: a-hook-aborts-the-tool-call
title: Read the harness, a hook aborts a tool call mid-plan
card: agents
kind: code-reading
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [coding, debugging]
tags: [harness, hooks, state-machine, event-stream, pull-point]
minutes: 12
lessons: [phases/19-capstone-projects/20-agent-harness-loop-contract]
manuals: []
practice: []
cheatsheet: [agent-harness, agent-state-graphs]
related: [agents/budget-exhausted-looks-like-an-answer]
updated: 2026-11-03
---

Đọc phần này của vòng lặp harness. Một bên đăng ký trên `before_tool_call` phát sinh `HookAbort` ở bước thứ hai của một kế hoạch ba bước, vì tên công cụ nằm trong một danh sách cấm. Theo vết những gì vòng lặp làm tiếp theo: nó phát ra những sự kiện nào, những hook nào kích hoạt, nó đi vào trạng thái nào, và bên gọi nhận được gì.

```python
step = self._plan[self._cursor]
self.hooks.fire("before_step", {"step": step})
self._emit("step.start", {"step_id": step.id, "desc": step.description})
if step.requires_tool:
    try:
        self.hooks.fire("before_tool_call", {"step": step})
    except HookAbort as exc:
        step.error = f"hook_abort:{exc}"
        self._emit("tool.error", {"step": step.id, "error": step.error})
        self.hooks.fire("on_error", {"step": step, "error": step.error})
        self._transition(State.REFLECTING)
        return self._step()
    self.budget.tool_calls += 1
    self._emit("tool.call", {"step": step.id, "tool": step.tool_name, "args": step.tool_args})
    self._transition(State.AWAITING_TOOL)
    self._emit("step.end", {"step_id": step.id, "outcome": "awaiting_tool"})
    self.hooks.fire("after_step", {"step": step, "outcome": "awaiting_tool"})
    return PullRequest(reason="tool_call", state=self.state, payload={...})
```

## Short answer

Việc hủy bỏ được xử lý bên trong vòng lặp, không được ném đến bên gọi. Vòng lặp ghi lỗi trên bước, phát ra `tool.error`, kích hoạt `on_error`, chuyển sang trạng thái phản tư và tự gọi lại. Phản tư tiến con trỏ và đếm một lượt, nên bước bị từ chối được bỏ qua, không được thử lại, và vòng lặp tiếp tục đến bước thứ ba. Bên gọi không bao giờ thấy việc hủy bỏ dưới dạng một ngoại lệ: nó thấy yêu cầu pull tiếp theo cho lời gọi công cụ của bước thứ ba hoặc việc hoàn tất, hoặc một lần tạm dừng với lý do vượt ngân sách nếu một giới hạn ngân sách hết trước, và nó có thể đọc bước bị từ chối trong luồng sự kiện.

## Full answer

### Step by step

1. `before_step` kích hoạt và `step.start` được phát ra cho bước hai.
2. `before_tool_call` kích hoạt. Bên đăng ký phát sinh `HookAbort`.
3. Vòng lặp viết `hook_abort:<reason>` vào `step.error`.
4. Nó phát ra `tool.error` với id bước và văn bản lỗi.
5. Nó kích hoạt `on_error` với bước và lỗi.
6. Nó chuyển sang `REFLECTING`. Bảng chuyển trạng thái cho phép đang thực thi sang đang phản tư.
7. Nó gọi `_step()` lần nữa. Trong nhánh phản tư con trỏ di chuyển đến bước ba và số lượt tăng thêm một.
8. Bước ba yêu cầu một công cụ, nên vòng lặp kích hoạt các hook của nó, đếm một lời gọi công cụ, phát ra `tool.call`, chuyển sang `AWAITING_TOOL`, phát ra `step.end`, kích hoạt `after_step`, và trả về một yêu cầu pull với lý do `tool_call`.

### What did not happen

- Không có sự kiện `tool.call` cho bước hai, và không tăng bộ đếm lời gọi công cụ, vì việc hủy bỏ đến trước cả hai.
- Không có sự kiện `step.end` và không có hook `after_step` cho bước hai. Đường hủy bỏ rời bước mà không có một sự kiện đóng. Đó là một khoảng trống mà người đọc nên nêu: một bên đăng ký ghép `step.start` với `step.end` thấy một bước còn mở.
- Không thử lại. Hợp đồng bỏ qua bước và phản tư. Một chính sách thử lại sẽ nằm trong planner, có thể trả về một kế hoạch mới từ phản tư.

### Why this shape

Các hook mang tính mệnh lệnh và có thể thay đổi, hủy bỏ hoặc bỏ qua. Các sự kiện mang tính quan sát và chỉ ghi lại. Việc hủy bỏ là một quyết định hook, và bản ghi của nó là một sự kiện, nên một tracer đăng ký luồng thấy sự từ chối mà không kiểm tra vòng lặp. Máy trạng thái có tính xác định, nên phát lại cùng log sự kiện đi lại vào cùng trạng thái mà không gọi một mô hình.

### How the caller learns about the denial

Yêu cầu pull nó nhận là cho bước ba. Để thấy sự từ chối nó đọc luồng sự kiện để tìm `tool.error` có tiền tố `hook_abort`, hoặc nó đăng ký một bên đăng ký `on_error`. Một harness production cũng sẽ đặt bước bị từ chối vào các lần thử thất bại của bản bàn giao.

## Follow-ups

- **Level 3:** Việc hủy bỏ xảy ra ở bước cuối cùng của kế hoạch. Bên gọi nhận được gì? Expected: một kết quả phiên với lý do `goal_met`, vì phản tư di chuyển con trỏ qua cuối, mặc dù bước cuối chưa bao giờ chạy, nên bên gọi phải đọc các sự kiện để thấy bước bị từ chối.
- **Level 3:** Tại sao vòng lặp đếm lượt trong phản tư mà không trong thực thi? Expected: một lượt là một bước đã hoàn tất, và phản tư là nơi vòng lặp quyết định tiến tiếp, lập kế hoạch lại hoặc kết thúc.
- **Level 4:** `_transition` bảo vệ bất biến nào, và điều gì sẽ hỏng nếu không có nó? Expected: chỉ các cặp trạng thái được liệt kê là hợp lệ, nên một lỗi di chuyển từ chờ công cụ thẳng sang thực thi sẽ phát sinh ngoại lệ thay vì làm hỏng việc phát lại.
- **Level 4:** Bạn sẽ làm cho đường hủy bỏ phát ra một `step.end` tương ứng thế nào? Expected: phát ra `step.end` với kết quả `aborted` trước khi chuyển trạng thái, để mọi lần bắt đầu có một lần kết thúc và một tracer có thể ghép chúng.

## Wrong answers

- "HookAbort lan truyền đến bên gọi dưới dạng một ngoại lệ." Vòng lặp bắt nó, ghi lại và tiếp tục, nên bên gọi thấy yêu cầu pull tiếp theo hoặc kết quả.
- "Bước bị từ chối được thử lại với một công cụ khác." Hợp đồng bỏ qua đến phản tư và tiến con trỏ, và một lần thử lại cần planner trả về một kế hoạch mới.
- "Bộ đếm lời gọi công cụ tăng vì một lời gọi công cụ đã được thử." Bộ đếm chỉ tăng sau khi hook vượt qua, nên một lời gọi bị từ chối không tiêu ngân sách.

## Taught in

[Hợp đồng vòng lặp harness](../../../phases/19-capstone-projects/20-agent-harness-loop-contract/) định nghĩa các trạng thái, các chủ đề hook, luồng sự kiện và đường hủy bỏ này.
