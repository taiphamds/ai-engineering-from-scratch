# Agent State Machines — Graphs, Nodes, Checkpoints

> Vòng lặp ReAct viết tay là một `while True`. Cùng vòng lặp viết thành đồ thị tường minh là thứ bạn có thể checkpoint, ngắt, phân nhánh và du hành thời gian qua. Tác tử chưa thay đổi. Bộ khung quanh nó đã thay đổi.

**Type:** Build
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 14 (Model Context Protocol)
**Time:** ~75 minutes

## The Problem

Bạn phát hành tác tử function-calling. Nó hoạt động ba lượt, rồi có sự cố: mô hình thử công cụ trả 500, người dùng đổi ý giữa tác vụ hoặc tác tử quyết định hoàn tiền đơn hàng mà không có con người ký duyệt. Vòng lặp `while True:` không có hook. Bạn không thể tạm dừng, không thể tua lại, không thể rẽ sang "nếu mô hình chọn công cụ kia thì sao." Ngay khi đưa nó vượt demo, tác tử trở thành hộp đen chỉ có hoạt động hoặc không.

Bước tiếp theo hiển nhiên khi bạn thấy. Tác tử đã là máy trạng thái — system prompt cộng lịch sử thông điệp cộng lệnh gọi công cụ chờ cộng hành động tiếp theo. Làm máy trạng thái tường minh: node cho "mô hình suy nghĩ", "công cụ chạy", "con người phê duyệt" và cạnh cho chuyển tiếp có điều kiện giữa chúng. Khi đồ thị tường minh, bộ khung nhận miễn phí bốn thứ: checkpointing (lưu trạng thái giữa các bước), ngắt (dừng cho con người), streaming (stream token và sự kiện trung gian), du hành thời gian (tua về trạng thái trước và thử nhánh khác).

Triển khai tham chiếu của trừu tượng này là LangGraph. Nó không phải framework tác tử theo nghĩa LangChain ("đây là AgentExecutor, chúc may mắn"). Nó là runtime đồ thị với trạng thái, lưu bền và ngắt được hỗ trợ hạng nhất. Vòng lặp tác tử là thứ bạn vẽ, không phải thứ viết tay.

## The Concept

![LangGraph StateGraph: nodes, edges, and the checkpointer](../assets/langgraph-stategraph.svg)

Một `StateGraph` có ba thứ.

1. **Trạng thái.** Dict có kiểu (TypedDict hoặc mô hình Pydantic) chảy qua đồ thị. Mỗi node nhận toàn trạng thái và trả cập nhật một phần, mà LangGraph gộp bằng *reducer* mỗi trường — `operator.add` cho danh sách phải tích lũy, mặc định ghi đè.
2. **Node.** Hàm Python `state -> partial_state`. Mỗi hàm là bước rời rạc: "gọi mô hình", "chạy công cụ", "tóm tắt."
3. **Cạnh.** Chuyển tiếp giữa các node. Cạnh tĩnh đi một nơi. Cạnh có điều kiện nhận hàm router `state -> next_node_name` để đồ thị phân nhánh theo đầu ra mô hình.

Bạn biên dịch đồ thị. Biên dịch gắn cấu trúc liên kết, đính checkpointer (tùy chọn nhưng thiết yếu cho sản xuất) và trả runnable. Bạn gọi với trạng thái đầu và `thread_id`. Mỗi bước thực thi lưu bền checkpoint có khóa `(thread_id, checkpoint_id)`.

### The four superpowers

**Checkpointing.** Mọi chuyển tiếp node ghi trạng thái mới vào kho (trong bộ nhớ để kiểm thử, Postgres/Redis/SQLite cho sản xuất). Tiếp tục bằng gọi đồ thị lại với cùng `thread_id`. Đồ thị tiếp nối nơi tạm dừng.

**Ngắt.** Đánh dấu node bằng `interrupt_before=["human_review"]` và thực thi dừng trước khi node chạy. Trạng thái lưu bền. API phản hồi người dùng "đang chờ phê duyệt." Yêu cầu sau đến cùng `thread_id` với `Command(resume=...)` tiếp tục thực thi.

**Streaming.** `graph.stream(state, mode="updates")` phát chênh lệch trạng thái khi xảy ra. `mode="messages"` stream token LLM trong node mô hình. `mode="values"` phát snapshot đầy đủ. Bạn chọn thứ hiển thị trên UI.

**Du hành thời gian.** `graph.get_state_history(thread_id)` trả toàn log checkpoint. Truyền bất kỳ `checkpoint_id` trước vào `graph.invoke` và bạn rẽ nhánh từ điểm đó. Tuyệt cho gỡ lỗi ("nếu mô hình chọn công cụ B thay thế?") và kiểm thử hồi quy phát lại trace sản xuất.

### Reducers are the point

Mọi trường trạng thái có reducer. Hầu hết mặc định ổn — giá trị mới ghi đè giá trị cũ. Nhưng danh sách thông điệp cần `operator.add` để thông điệp mới thêm thay vì thay thế. Cạnh song song gộp cập nhật qua reducer. Nếu hai node cùng cập nhật `messages` và bạn quên `Annotated[list, add_messages]`, node thứ hai âm thầm thắng và bạn mất nửa lượt. Reducer là thứ tinh tế duy nhất trong thư viện; làm đúng thì phần còn lại kết hợp được.

### The ReAct graph in four nodes

Tác tử ReAct sản xuất là bốn node và hai cạnh:

1. `agent` — gọi LLM với lịch sử thông điệp hiện tại. Trả thông điệp trợ lý (có thể chứa tool_calls).
2. `tools` — thực thi mọi tool_calls trong thông điệp trợ lý cuối, thêm kết quả công cụ dưới dạng thông điệp công cụ.
3. Cạnh có điều kiện từ `agent` định tuyến đến `tools` nếu thông điệp cuối có tool_calls, nếu không đến `END`.
4. Cạnh tĩnh từ `tools` trở về `agent`.

Chỉ vậy thôi. Bạn có vòng lặp ReAct đầy đủ (Suy nghĩ → Hành động → Quan sát → Suy nghĩ → …) với checkpointing, ngắt và streaming trong khoảng 40 dòng mã.

### StateGraph vs Send (fanout)

`Send(node_name, state)` cho phép node điều phối các đồ thị con song song. Ví dụ: tác tử quyết định truy vấn ba bộ truy xuất cùng lúc. Mỗi `Send` tạo thực thi song song node đích; đầu ra gộp qua reducer trạng thái. Đây là cách LangGraph biểu đạt mẫu bộ điều phối-worker mà không thành phần cơ bản luồng.

### Subgraphs

Đồ thị đã biên dịch có thể là node trong đồ thị khác. Đồ thị ngoài thấy một node; đồ thị trong có trạng thái riêng và checkpoint riêng. Đây là cách nhóm xây tác tử giám sát-worker: đồ thị giám sát định tuyến ý định người dùng đến đồ thị con worker từng miền.

```figure
l5-state-graph-ledger
```

## Build It

### Step 1: state and nodes

```python
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langgraph.prebuilt import ToolNode
from langgraph.checkpoint.memory import MemorySaver

class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]

def agent_node(state: State) -> dict:
    response = llm.invoke(state["messages"])
    return {"messages": [response]}

def should_continue(state: State) -> str:
    last = state["messages"][-1]
    return "tools" if getattr(last, "tool_calls", None) else END

tool_node = ToolNode(tools=[search_web, read_file])

graph = StateGraph(State)
graph.add_node("agent", agent_node)
graph.add_node("tools", tool_node)
graph.set_entry_point("agent")
graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
graph.add_edge("tools", "agent")

app = graph.compile(checkpointer=MemorySaver())
```

`add_messages` là reducer khiến danh sách thông điệp tích lũy thay vì ghi đè. Quên nó là lỗi LangGraph phổ biến nhất.

### Step 2: run with a thread

```python
config = {"configurable": {"thread_id": "user-42"}}
for event in app.stream(
    {"messages": [HumanMessage("find the Anthropic headquarters address")]},
    config,
    stream_mode="updates",
):
    print(event)
```

Mỗi cập nhật là dict `{node_name: state_delta}`. Frontend có thể stream chúng đến UI để người dùng thấy "tác tử đang suy nghĩ… gọi search_web… có kết quả… trả lời."

### Step 3: add a human-in-the-loop interrupt

Đánh dấu node để thực thi dừng trước khi chạy.

```python
app = graph.compile(
    checkpointer=MemorySaver(),
    interrupt_before=["tools"],  # pause before every tool call
)

state = app.invoke({"messages": [HumanMessage("delete the production database")]}, config)
# state["__interrupt__"] is set. Inspect proposed tool calls.
# If approved:
from langgraph.types import Command
app.invoke(Command(resume=True), config)
# If denied: write a rejection message and resume
app.update_state(config, {"messages": [AIMessage("Blocked by human reviewer.")]})
```

Trạng thái, checkpoint và thread đều lưu bền qua ngắt. Không thứ gì ở trong bộ nhớ trừ khi đang thực thi.

### Step 4: time-travel for debugging

```python
history = list(app.get_state_history(config))
for snapshot in history:
    print(snapshot.values["messages"][-1].content[:80], snapshot.config)

# Fork from a prior checkpoint
target = history[3].config  # three steps back
for event in app.stream(None, target, stream_mode="values"):
    pass  # replay from that point forward
```

Truyền `None` làm đầu vào phát lại từ checkpoint đã cho; truyền giá trị thêm nó làm cập nhật trạng thái checkpoint đó trước khi tiếp tục. Đây là cách tái hiện lượt tác tử kém mà không chạy lại toàn hội thoại.

### Step 5: swap the checkpointer for production

```python
from langgraph.checkpoint.postgres import PostgresSaver

with PostgresSaver.from_conn_string("postgresql://...") as checkpointer:
    checkpointer.setup()
    app = graph.compile(checkpointer=checkpointer)
```

SQLite, Redis và Postgres được cung cấp. `MemorySaver` cho kiểm thử. Mọi thứ lưu bền qua khởi động lại cần kho thực.

## The Skill

> Bạn xây tác tử thành đồ thị, không phải vòng lặp `while True`.

Trước khi dùng LangGraph, làm thiết kế 60 giây:

1. **Đặt tên node.** Mọi quyết định rời rạc hoặc hành động có tác dụng phụ là node. "Tác tử suy nghĩ", "công cụ chạy", "người xem xét phê duyệt", "phản hồi stream." Nếu không thể liệt kê, tác vụ chưa có hình dạng tác tử.
2. **Khai báo trạng thái.** TypedDict tối thiểu với reducer cho mọi trường danh sách. Không nhồi mọi thứ vào `messages`; đưa trường riêng tác vụ (`plan` đang làm, bộ đếm `budget`, danh sách `retrieved_docs`) lên cấp cao nhất.
3. **Vẽ cạnh.** Tĩnh trừ khi bước tiếp theo phụ thuộc đầu ra mô hình. Mọi cạnh có điều kiện cần hàm router với nhánh có tên.
4. **Chọn checkpointer ngay từ đầu.** `MemorySaver` cho kiểm thử, Postgres/Redis/SQLite cho mọi thứ khác. Không phát hành thiếu nó — không checkpointer nghĩa là không tiếp tục, không ngắt, không du hành thời gian.
5. **Quyết định ngắt trước khi công cụ chạy, không phải sau.** Phê duyệt nằm trên cạnh vào node có tác dụng phụ để hủy trước tác hại; xác thực nằm trên cạnh ra mô hình để từ chối lệnh gọi kém với chi phí thấp.
6. **Stream mặc định.** `mode="updates"` cho UI, `mode="messages"` cho streaming cấp token trong node mô hình, `mode="values"` cho snapshot đầy đủ trong đánh giá.

Từ chối phát hành tác tử LangGraph không checkpointer. Từ chối phát hành tác tử ngắt *sau* tác dụng phụ. Từ chối phát hành trường `messages` không có `add_messages` làm reducer.

## Exercises

1. **Dễ.** Triển khai đồ thị ReAct bốn node trên với công cụ máy tính và tìm kiếm web. Xác minh `list(app.get_state_history(config))` trả ít nhất bốn checkpoint cho hội thoại hai lượt.
2. **Trung bình.** Thêm node `planner` chạy trước `agent` và ghi `plan: list[str]` có cấu trúc vào trạng thái. Để `agent` đánh dấu bước kế hoạch đã xong. Cho kiểm thử thất bại nếu `plan` mất qua tiếp tục từ checkpoint (reducer sai).
3. **Khó.** Xây đồ thị giám sát định tuyến giữa ba đồ thị con (`researcher`, `writer`, `reviewer`) bằng `Send`. Mỗi đồ thị con có trạng thái và checkpointer riêng. Thêm `interrupt_before=["writer"]` trên đồ thị ngoài để con người phê duyệt bản tóm lược nghiên cứu. Xác nhận du hành thời gian từ checkpoint trước chỉ chạy lại nhánh đã rẽ.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| StateGraph | "Đồ thị LangGraph" | Đối tượng builder bạn thêm node và cạnh trước biên dịch. |
| Reducer (Hàm gộp) | "Cách trường gộp" | Hàm `(old, new) -> merged` áp dụng khi node trả cập nhật cho trường; mặc định ghi đè, `add_messages` thêm vào. |
| Thread (Luồng) | "ID hội thoại" | Chuỗi `thread_id` đặt phạm vi mọi checkpoint cho một phiên. |
| Checkpoint (Điểm kiểm tra) | "Trạng thái tạm dừng" | Snapshot lưu bền toàn trạng thái đồ thị sau chuyển tiếp node, có khóa `(thread_id, checkpoint_id)`. |
| Interrupt (Ngắt) | "Dừng cho con người" | `interrupt_before` / `interrupt_after` dừng thực thi ở ranh giới node; tiếp tục bằng `Command(resume=...)`. |
| Time-travel (Du hành thời gian) | "Rẽ từ bước trước" | `graph.invoke(None, config_with_old_checkpoint_id)` phát lại từ checkpoint đó về phía trước. |
| Send | "Điều phối đồ thị con song song" | Hàm tạo mà node có thể trả để tạo N thực thi song song node đích. |
| Subgraph (Đồ thị con) | "Đồ thị biên dịch làm node" | StateGraph đã biên dịch dùng làm node trong đồ thị khác; giữ phạm vi trạng thái riêng. |

## Further Reading

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) — tài liệu tham chiếu chuẩn cho StateGraph, reducer, checkpointer và ngắt.
- [LangGraph concepts: state, reducers, checkpointers](https://langchain-ai.github.io/langgraph/concepts/low_level/) — mô hình tư duy bài học dùng, trực tiếp từ nguồn.
- [LangGraph Persistence and Checkpoints](https://langchain-ai.github.io/langgraph/concepts/persistence/) — chi tiết kho Postgres/SQLite/Redis, namespace checkpoint và ID thread.
- [LangGraph Human-in-the-loop](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/) — `interrupt_before`, `interrupt_after`, `Command(resume=...)` và mẫu chỉnh trạng thái.
- [Yao et al., "ReAct: Synergizing Reasoning and Acting in Language Models" (ICLR 2023)](https://arxiv.org/abs/2210.03629) — mẫu mọi tác tử LangGraph triển khai; đọc để biết lý do vết suy luận.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) — hình dạng đồ thị nào (chuỗi, router, bộ điều phối-worker, bộ đánh giá-bộ tối ưu) nên ưu tiên và khi nào.
- Giai đoạn 11 · 09 (Function Calling) — thành phần cơ bản tool-call mà mọi node tác tử LangGraph tái sử dụng.
- Giai đoạn 11 · 14 (Model Context Protocol) — khám phá công cụ ngoài cắm vào `ToolNode` LangGraph qua adapter MCP.
- Giai đoạn 11 · 17 (Agent framework tradeoffs) — khi nào chọn LangGraph hơn CrewAI, AutoGen hoặc Agno.
