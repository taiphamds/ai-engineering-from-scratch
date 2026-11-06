---
id: budget-exhausted-looks-like-an-answer
title: Read the loop, what the caller gets at the turn cap
card: agents
kind: code-reading
level: 2
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [coding, debugging]
tags: [agent-loop, turn-budget, code-reading, return-type]
minutes: 8
lessons: [phases/14-agent-engineering/01-the-agent-loop, phases/19-capstone-projects/20-agent-harness-loop-contract]
manuals: []
practice: []
cheatsheet: [agent-harness]
related: [agents/the-agent-loops-forever]
updated: 2026-11-03
---

Đọc phương thức run này từ vòng lặp agent đồ chơi. Một bên gọi hiển thị chuỗi được trả về cho người dùng như câu trả lời. Hợp đồng sai ở đâu, và bạn sẽ thay đổi nó thế nào?

```python
def run(self, user_message: str) -> str:
    self.history.append(Turn(kind="user", content=user_message))
    for step in range(self.max_turns):
        reply = self.llm.respond(self.history)
        if reply["kind"] == "finish":
            self.history.append(Turn(kind="final", content=reply["content"]))
            return reply["content"]
        thought = reply.get("thought", "")
        self.history.append(Turn(kind="thought", content=thought))
        call = ToolCall(name=reply["action"], args=reply.get("args", {}))
        observation = self.tools.dispatch(call)
        self.history.append(Turn(kind="action", content=call.name, tool_call=call, observation=observation))
    self.history.append(Turn(kind="final", content="budget exhausted"))
    return "budget exhausted"
```

## Short answer

Phương thức trả về một chuỗi thuần trong cả hai trường hợp, nên bên gọi không thể phân biệt một câu trả lời thật với một lần chạy chạm mức trần. Văn bản `budget exhausted` đến người dùng như thể mô hình đã nói nó. Cách sửa là trả về một kết quả có kiểu kèm một lý do, hoặc nhường quyền điều khiển theo cách hợp đồng harness làm, để bên gọi quyết định mở rộng ngân sách hay dừng.

## Full answer

### What the code does

Vòng lặp chạy tối đa `max_turns` lần lặp. Mỗi lần lặp yêu cầu mô hình một câu trả lời. Một câu trả lời `finish` kết thúc lần chạy và trả về nội dung của nó. Bất kỳ câu trả lời nào khác là một hành động: vòng lặp ghi suy nghĩ, điều phối công cụ, và nối thêm quan sát. Khi vòng lặp hết số lần lặp, nó nối thêm một lượt cuối với văn bản `budget exhausted` và trả về văn bản đó.

### The three problems

1. **Một kiểu trả về cho hai kết quả.** Một lần chạy hoàn tất và một lần chạy chạm mức trần đều trả về `str`. Bên gọi không có trường để kiểm tra. Bất kỳ mã nào hiển thị kết quả cho người dùng hiển thị thông điệp mức trần như một câu trả lời.
2. **Mức trần là một ngõ cụt.** Trạng thái một phần nằm trong `self.history`, nhưng không có gì cho bên gọi biết lần chạy có thể tiếp tục. Hợp đồng harness coi ngân sách là một lần nhường quyền: nó phát ra `budget.warn`, kích hoạt `on_budget_exceeded`, và trả về một yêu cầu pull có lý do. Bên gọi kiểm tra trạng thái và gọi `resume`.
3. **Một câu trả lời không có hành động và không có finish là một sự cố.** Mã đọc `reply["action"]` cho mọi câu trả lời không phải finish. Một mô hình trả lời bằng văn xuôi mà không có lời gọi công cụ phát sinh một `KeyError`. Bài học liệt kê một lượt không có lời gọi công cụ là một điều kiện dừng bình thường.

### The change

Trả về một đối tượng kết quả nhỏ với văn bản cuối cùng, một lý do như `finished`, `budget` hoặc `no_tool_call`, và số lượt. Giữ lịch sử trên đối tượng để bên gọi có thể tiếp tục hoặc bàn giao. Coi một câu trả lời không có hành động là một lần dừng, không phải một lỗi. Giữ ngân sách làm một mức trần trên lời gọi này, và để bên gọi quyết định làm gì sau nó.

## Follow-ups

- **Level 2:** Bộ định dạng quan sát nằm ở đâu trong mã này? Expected: bên trong `tools.dispatch`, trả về một chuỗi lỗi cho một công cụ không biết, các đối số sai, hoặc một ngoại lệ, nên mô hình luôn nhận lại một chuỗi.
- **Level 2:** Một công cụ phát sinh một ngoại lệ. Mô hình thấy gì ở lượt tiếp theo? Expected: một quan sát bắt đầu bằng `error:` và mang kiểu cùng văn bản ngoại lệ, cho phép nó sửa lời gọi.
- **Level 3:** Harness biết trở về trạng thái nào sau một lần tạm dừng ngân sách thế nào? Expected: nó ghi lại trạng thái trước đó trước khi tạm dừng, đặt lại các bộ đếm khi tiếp tục, và đi lại vào thực thi hoặc phản tư từ bản ghi đó.
- **Level 3:** Thuộc tính nào của harness làm cho một trace đã lưu có thể phát lại mà không có mô hình? Expected: máy trạng thái có tính xác định, nên cùng log sự kiện đi lại vào cùng trạng thái.

## Wrong answers

- "Trả về một chuỗi rỗng tại mức trần, và bên gọi sẽ xử lý nó." Một chuỗi rỗng vẫn là một chuỗi, và bên gọi vẫn không có mã lý do để kiểm tra.
- "Phát sinh một ngoại lệ tại mức trần." Lịch sử một phần hữu ích, và một ngoại lệ buộc bên gọi bắt đầu lại từ không thay vì tiếp tục.
- "Đặt số lượt tối đa đủ cao để không bao giờ chạm mức trần." Mức trần tồn tại cho lần chạy không hội tụ, và một mức trần cao chỉ làm lần chạy đó dài hơn.

## Taught in

[Bài học vòng lặp agent](../../../phases/14-agent-engineering/01-the-agent-loop/) cung cấp vòng lặp này, và [hợp đồng vòng lặp harness](../../../phases/19-capstone-projects/20-agent-harness-loop-contract/) thay chuỗi bằng một điểm pull mà bên gọi tiếp tục.
