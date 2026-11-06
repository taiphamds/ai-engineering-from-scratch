# The Multi-Agent Primitive Model

> Bốn nguyên thủy, không hơn — agent, bàn giao, trạng thái dùng chung, bộ điều phối — trải thành một không gian thiết kế bốn chiều, và các framework đa agent lớn được phát hành trong năm 2026 (AutoGen, LangGraph, CrewAI, OpenAI Agents SDK, Microsoft Agent Framework) là các điểm trong đó. Bài này xây dựng chúng từ số không, chạy một hệ thống đồ chơi trên cả bốn, rồi ánh xạ mọi framework lớn lên cùng các trục để bạn có thể đọc bất kỳ bản phát hành mới nào trong một đoạn.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 (Agent Engineering), Phase 16 · 01 (Why Multi-Agent)
**Time:** ~60 minutes

## Problem

Cứ sáu tháng một framework đa agent mới được phát hành. AutoGen năm 2023. CrewAI năm 2024. LangGraph và OpenAI Swarm năm 2024. Google ADK tháng 4 năm 2025. Microsoft Agent Framework RC tháng 2 năm 2026. Mỗi thông cáo báo chí tuyên bố là “sự trừu tượng hóa đúng.”

Nếu bạn cố học từng framework một bạn sẽ kiệt sức. Các API trông khác nhau. Các tài liệu bất đồng về “agent” là gì. Một framework gọi bộ nhớ dùng chung là “bảng đen”, một framework khác gọi là “bể thông điệp”, framework thứ ba gọi là “StateGraph.” Bạn bắt đầu nghi ngờ lĩnh vực chỉ đang xáo trộn.

Không phải vậy. Bên dưới tiếp thị, bốn nguyên thủy ổn định. Học chúng một lần, đọc mọi framework mới trong một đoạn.

## Concept

### The four primitives

1. **Agent** — một prompt hệ thống cộng với một danh sách công cụ. Không trạng thái; mỗi lần chạy bắt đầu từ prompt hệ thống và lịch sử thông điệp hiện tại.
2. **Bàn giao** — một lần chuyển quyền điều khiển có cấu trúc từ agent này sang agent khác. Về cơ học, một lệnh gọi công cụ trả về một agent mới hoặc một cạnh đồ thị đi theo một điều kiện.
3. **Trạng thái dùng chung** — bất kỳ cấu trúc dữ liệu nào mà nhiều hơn một agent có thể đọc (đôi khi ghi). Bể thông điệp, bảng đen, kho khóa-giá trị, bộ nhớ vector.
4. **Bộ điều phối** — bên quyết định ai nói tiếp theo. Các lựa chọn: một đồ thị tường minh (xác định), một bộ chọn người nói LLM (mềm), lệnh gọi bàn giao của người nói cuối cùng (OpenAI Swarm), hoặc một bộ lập lịch trên một hàng đợi (kiến trúc bầy đàn).

Đó là toàn bộ không gian thiết kế. Mỗi framework chọn các mặc định cho mỗi trục; phần còn lại là cú pháp bề mặt.

### How every 2026 framework maps to it

| Framework | Agent | Bàn giao | Trạng thái dùng chung | Bộ điều phối |
|-----------|-------|---------|--------------|--------------|
| OpenAI Swarm / Agents SDK | `Agent(instructions, tools)` | công cụ trả về Agent | vấn đề của bên gọi | lệnh gọi bàn giao tiếp theo của LLM |
| AutoGen v0.4 / AG2 | `ConversableAgent` | bộ chọn người nói trên GroupChat | bể thông điệp | hàm chọn (LLM hoặc luân phiên) |
| CrewAI | `Agent(role, goal, backstory)` | `Process.Sequential / Hierarchical` | Các đầu ra Task được nối chuỗi | LLM quản lý hoặc thứ tự tĩnh |
| LangGraph | hàm node | cạnh đồ thị + điều kiện | reducer `StateGraph` | đồ thị, xác định |
| Microsoft Agent Framework | agent + các mẫu điều phối | riêng theo mẫu | luồng / ngữ cảnh | riêng theo mẫu |
| Google ADK | agent + card A2A | tác vụ A2A | các hiện vật A2A | máy chủ quyết định |

Các khác biệt bề mặt trông khổng lồ. Bên dưới: cùng bốn núm điều chỉnh.

### Why this matters

Một khi bạn thấy các nguyên thủy, so sánh framework trở thành một danh sách kiểm tra ngắn:

- Bộ điều phối tin LLM để định tuyến (Swarm) hay ghim định tuyến trong mã (LangGraph)?
- Trạng thái dùng chung là toàn bộ lịch sử (GroupChat) hay được chiếu (reducer StateGraph)?
- Các agent có thể sửa prompt của nhau (bộ quản lý CrewAI) hay chỉ bàn giao (Swarm)?

Ba câu hỏi đó trả lời 80% việc framework nào phù hợp với một vấn đề nhất định. Bạn ngừng tìm mua “framework đa agent tốt nhất” và bắt đầu thiết kế cho trục bạn thực sự quan tâm.

### The stateless insight

Mọi nguyên thủy ngoại trừ trạng thái dùng chung đều không trạng thái. Agent là một hàm của (prompt, công cụ). Bàn giao là một lệnh gọi hàm. Bộ điều phối là một bộ lập lịch. **Thứ duy nhất có trạng thái trong hệ thống là trạng thái dùng chung.** Đó là nơi mọi lỗi thú vị nằm: đầu độc bộ nhớ (Bài 15), thứ tự thông điệp, quản lý phiên bản, tranh chấp ghi.

Các framework ẩn trạng thái dùng chung (Swarm) đẩy vấn đề sang bên gọi. Các framework tập trung hóa nó (checkpoint LangGraph, bể AutoGen) làm nó có thể kiểm tra nhưng chuyển chi phí phối hợp lên triển khai trạng thái dùng chung.

### Anatomy of a single primitive

#### Agent

```
Agent = (system_prompt, tools, model, optional_name)
```

Không bộ nhớ. Không trạng thái. Hai agent có cùng prompt hệ thống và công cụ có thể thay thế cho nhau. Mọi thứ trông như trạng thái theo từng agent thực ra nằm trong trạng thái dùng chung hoặc giao thức bàn giao.

#### Handoff

```
Handoff = (from_agent, to_agent, reason, payload)
```

Ba triển khai chiếm ưu thế:

- **Giá trị trả về của hàm** — công cụ trả về agent tiếp theo. Đây là mẫu OpenAI Swarm. Các agent mang định tuyến trong lược đồ công cụ.
- **Cạnh đồ thị** — LangGraph. Các cạnh mang tính khai báo. LLM tạo ra một giá trị; một điều kiện chọn node tiếp theo.
- **Lựa chọn người nói** — AutoGen GroupChat. Một hàm chọn (đôi khi tự nó là một lệnh gọi LLM) đọc bể và chọn ai nói tiếp theo.

#### Shared state

```
SharedState = { messages: [], artifacts: {}, context: {} }
```

Tối thiểu, một danh sách thông điệp. Thường nhiều hơn: các hiện vật có cấu trúc (đầu ra Task CrewAI), ngữ cảnh có kiểu (các reducer LangGraph), bộ nhớ bên ngoài (MCP, DB vector).

Hai cấu trúc liên kết: **bể đầy đủ** (mọi agent thấy mọi thông điệp) và **được chiếu** (các agent thấy một góc nhìn giới hạn theo vai trò). Các bể đầy đủ đơn giản và mở rộng kém. Các bể được chiếu mở rộng nhưng yêu cầu thiết kế lược đồ từ trước.

#### Orchestrator

```
Orchestrator = ({state, last_speaker}) -> next_agent
```

Bốn biến thể:

- **Tĩnh** — đồ thị được cố định tại thời điểm xây dựng (LangGraph xác định, CrewAI Sequential).
- **LLM lựa chọn** — một LLM đọc bể và chọn người nói tiếp theo (AutoGen, CrewAI Hierarchical).
- **Bàn giao điều khiển** — agent hiện tại quyết định bằng cách gọi một công cụ bàn giao (Swarm).
- **Hàng đợi điều khiển** — các worker kéo từ một hàng đợi dùng chung; không có người nói tiếp theo tường minh (các kiến trúc bầy đàn, Matrix).

### What changes between frameworks

Một khi các nguyên thủy được cố định, các quyết định thiết kế còn lại là:

- **Chiến lược bộ nhớ** — tạm thời so với tạo checkpoint bền vững (bộ tạo checkpoint LangGraph).
- **Ranh giới an toàn** — ai có thể phê duyệt một bàn giao (con người trong vòng lặp).
- **Hạch toán chi phí** — ngân sách token theo từng agent.
- **Khả năng quan sát** — truy vết các bàn giao, lưu bền vững trạng thái để phát lại.

Tất cả có thể triển khai trên các nguyên thủy. Không cái nào là nguyên thủy mới.

```figure
a5-primitive-radar
```

## Build It

`code/main.py` triển khai bốn nguyên thủy trong ~150 dòng thư viện chuẩn Python. Không có LLM thực — mỗi agent là một chính sách được viết kịch bản để sự tập trung ở lại cấu trúc phối hợp.

File xuất:

- `Agent` — một dataclass gồm tên, prompt hệ thống, công cụ, hàm chính sách.
- `Handoff` — một hàm trả về một agent mới.
- `SharedState` — một bể thông điệp an toàn luồng.
- `Orchestrator` — ba biến thể: `StaticOrchestrator`, `HandoffOrchestrator`, `LLMSelectorOrchestrator` (mô phỏng).

Demo chạy cùng pipeline ba agent (nghiên cứu → viết → xem xét) qua cả ba loại bộ điều phối và in bể thông điệp khi kết thúc. Bạn có thể thấy các đầu ra chỉ khác nhau ở *ai chọn tiếp theo*; các agent và trạng thái dùng chung giống hệt qua các lần chạy.

Chạy nó:

```
python3 code/main.py
```

Đầu ra kỳ vọng: ba lần chạy bộ điều phối, một lần cho mỗi mẫu. Mỗi lần in bể thông điệp cuối cùng. Lần chạy do bàn giao điều khiển tới ít agent hơn nếu nhà nghiên cứu quyết định nó xong sớm — đó là đánh đổi định tuyến LLM ở dạng thu nhỏ.

## Use It

`outputs/skill-primitive-mapper.md` là một skill đọc bất kỳ cơ sở mã đa agent hoặc tài liệu framework nào và trả về ánh xạ bốn nguyên thủy. Chạy nó trên một bản phát hành framework mới để có hiểu biết một đoạn trước khi đọc sâu tài liệu.

## Ship It

Trước khi áp dụng một framework mới, viết ánh xạ nguyên thủy cho nó. Nếu bạn không thể, tài liệu không đầy đủ hoặc framework đang phát minh một nguyên thủy thứ năm (hiếm — kiểm tra một biến thể trạng thái dùng chung bạn chưa thấy).

Ghim ánh xạ trong tài liệu kiến trúc. Khi một thành viên nhóm mới tham gia, gửi họ ánh xạ trước tài liệu API. Khi các phiên bản framework thay đổi, so sánh khác biệt ánh xạ, không phải nhật ký thay đổi.

## Exercises

1. Chạy `code/main.py` ba lần với các chính sách agent khác nhau. Quan sát cách lựa chọn bộ điều phối thay đổi những agent nào chạy.
2. Triển khai một loại bộ điều phối thứ tư: một loại do hàng đợi điều khiển nơi các agent thăm dò trạng thái dùng chung để lấy công việc. Bế tắc nào có thể xảy ra, và bạn phát hiện nó như thế nào?
3. Lấy hướng dẫn bắt đầu nhanh LangGraph (https://docs.langchain.com/oss/python/langgraph/workflows-agents) và viết lại nó như bốn nguyên thủy. Những trừu tượng hóa nào của LangGraph ánh xạ 1:1 và những cái nào là lớp bọc tiện lợi?
4. Đọc cookbook OpenAI Swarm (https://developers.openai.com/cookbook/examples/orchestrating_agents). Xác định nguyên thủy nào trong bốn nguyên thủy Swarm làm thuận tiện nhất, và nguyên thủy nào nó đẩy sang bên gọi.
5. Tìm một framework trong bảng này ẩn hoàn toàn trạng thái dùng chung. Giải thích những gì hỏng khi các agent cần phối hợp qua các bàn giao mà không đọc lại lịch sử.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Agent | “Một LLM có công cụ” | Một bộ ba `(system_prompt, tools, model)`. Không trạng thái. |
| Handoff (Bàn giao) | “Chuyển quyền điều khiển” | Một lệnh gọi có cấu trúc nêu tên agent tiếp theo và payload tùy chọn. Ba triển khai: giá trị trả về của hàm, cạnh đồ thị, lựa chọn người nói. |
| Shared state (Trạng thái dùng chung) | “Bộ nhớ” / “ngữ cảnh” | Phần có trạng thái duy nhất của một hệ thống đa agent. Bể thông điệp hoặc bảng đen. |
| Orchestrator (Bộ điều phối) | “Bộ phối hợp” | Bên quyết định ai chạy tiếp theo. Đồ thị tĩnh, bộ chọn LLM, do bàn giao điều khiển, hoặc do hàng đợi điều khiển. |
| Primitive (Nguyên thủy) | “Trừu tượng hóa” | Một trong bốn trục mà mọi framework tham số hóa. Không phải một tính năng framework. |
| Message pool (Bể thông điệp) | “Lịch sử trò chuyện dùng chung” | Trạng thái dùng chung toàn bộ lịch sử. Dễ suy luận, mở rộng kém. |
| Projected state (Trạng thái được chiếu) | “Góc nhìn có phạm vi giới hạn” | Góc nhìn riêng theo vai trò vào trạng thái dùng chung. Mở rộng, yêu cầu thiết kế lược đồ. |
| Speaker selection (Lựa chọn người nói) | “Ai nói tiếp theo” | Mẫu bộ điều phối nơi một hàm (thường là một LLM) chọn agent tiếp theo từ một nhóm. |

## Further Reading

- [OpenAI cookbook: Orchestrating Agents — Routines and Handoffs](https://developers.openai.com/cookbook/examples/orchestrating_agents) — diễn đạt rõ ràng nhất về điều phối do bàn giao điều khiển
- [AutoGen stable docs](https://microsoft.github.io/autogen/stable/) — GroupChat + lựa chọn người nói là tham chiếu cho điều phối do LLM lựa chọn
- [LangGraph workflows and agents](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — điều phối cạnh đồ thị và trạng thái dùng chung dựa trên reducer
- [CrewAI introduction](https://docs.crewai.com/en/introduction) — các agent vai trò-mục tiêu-câu chuyện nền, các quy trình Sequential / Hierarchical
- [AG2 (community AutoGen continuation)](https://github.com/ag2ai/ag2) — dòng AutoGen v0.2 đang hoạt động sau khi Microsoft chuyển v0.4 sang bảo trì
