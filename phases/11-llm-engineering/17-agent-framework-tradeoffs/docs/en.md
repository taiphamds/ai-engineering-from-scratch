# Agent Framework Tradeoffs — Graph, Role, and Actor Orchestration

> Mọi framework bán cùng demo (tác tử nghiên cứu xây báo cáo) và giấu cùng lỗi (schema trạng thái xung đột lớp điều phối). Chọn framework có trừu tượng khớp hình dạng bài toán; mọi thứ khác là phần kết nối bạn viết hai lần.

**Type:** Learn
**Languages:** Python
**Prerequisites:** Phase 11 · 09 (Function Calling), Phase 11 · 16 (LangGraph)
**Time:** ~45 minutes

## The Problem

Bạn có tác vụ cần hơn một lệnh gọi LLM. Có thể là quy trình nghiên cứu (lập kế hoạch, tìm kiếm, tóm tắt, trích dẫn). Có thể là pipeline review mã (phân tích diff, phê bình, vá, xác thực). Có thể là trợ lý nhiều lượt đặt chuyến bay, viết email và nộp báo cáo chi phí. Bạn chọn framework.

Ba ngày sau, bạn phát hiện các trừu tượng của framework bị rò rỉ. CrewAI cho vai trò nhưng chống lại khi "người nghiên cứu" cần giao kế hoạch có cấu trúc cho "người viết." AutoGen cho chat giữa tác tử nhưng không trạng thái hạng nhất nên checkpoint là pickle của log hội thoại. LangGraph cho đồ thị trạng thái nhưng buộc đặt tên mọi chuyển tiếp trước khi biết tác tử sẽ làm gì. Agno cho trừu tượng một tác tử kêu lên khi bạn thử phân tán sang ba worker đồng thời.

Cách sửa không phải "chọn framework tốt nhất." Nó là khớp trừu tượng cốt lõi của framework với hình dạng bài toán. Bài học này vẽ bản đồ đó.

## The Concept

![Agent framework matrix: core abstraction vs problem shape](../assets/framework-matrix.svg)

Bốn framework thống trị bức tranh năm 2026. Trừu tượng cốt lõi của chúng không giống nhau.

| Framework | Trừu tượng cốt lõi | Phù hợp nhất | Kém phù hợp nhất |
|-----------|------------------|----------|-----------|
| **LangGraph** | `StateGraph` — trạng thái có kiểu, node, cạnh có điều kiện, checkpointer. | Quy trình với trạng thái rõ và ngắt có con người tham gia; tác tử sản xuất cần gỡ lỗi du hành thời gian. | Động não lỏng, theo vai trò nơi cấu trúc liên kết chưa biết. |
| **CrewAI** | `Crew` — vai trò (mục tiêu, lai lịch), tác vụ, quy trình (tuần tự hoặc phân cấp). | Quy trình nhập vai hoặc theo nhân vật với kế hoạch tuyến tính/phân cấp ngắn. | Mọi thứ có trạng thái vượt lịch sử lượt của crew; phân nhánh phức tạp. |
| **AutoGen** | Cặp `ConversableAgent` — hai hoặc nhiều tác tử nói theo lượt đến điều kiện thoát. | *Đối thoại* đa tác tử (thầy-trò, người đề xuất-người phê bình, người thực hiện-người xem xét) nơi suy nghĩ xuất hiện từ chat. | Quy trình tất định có DAG đã biết; mọi thứ cần trạng thái bền qua khởi động lại. |
| **Agno** | `Agent` — một LLM + công cụ + bộ nhớ, kết hợp được thành nhóm. | Tác tử đơn xây nhanh và nhóm nhẹ; đa phương thức mạnh và driver lưu trữ tích hợp. | Đồ thị sâu, phân nhánh rõ với reducer tùy chỉnh. |

### What "abstraction" actually means

Trừu tượng cốt lõi framework là thứ bạn vẽ lên bảng khi trình bày kiến trúc.

- **LangGraph** → bạn vẽ đồ thị. Node là bước, cạnh là chuyển tiếp và đối tượng trạng thái tại mọi điểm có kiểu. Mô hình tư duy là máy trạng thái.
- **CrewAI** → bạn vẽ sơ đồ tổ chức. Mỗi vai trò có mô tả công việc và người quản lý định tuyến tác vụ. Mô hình tư duy là nhóm nhỏ chuyên gia.
- **AutoGen** → bạn vẽ tin nhắn trực tiếp Slack. Hai tác tử nhắn nhau; tác tử thứ ba tham gia nếu cần người điều hành. Mô hình tư duy là chat.
- **Agno** → bạn vẽ một hộp với công cụ treo vào. Đặt các hộp cạnh nhau thành nhóm. Mô hình tư duy là "tác tử có sẵn đủ đồ dùng."

### The state question

Trạng thái là nơi hầu hết lựa chọn framework đổ vỡ trong sản xuất.

- **LangGraph.** Trạng thái có kiểu (`TypedDict` hoặc mô hình Pydantic), reducer từng trường, checkpointer hạng nhất (SQLite/Postgres/Redis). Tiếp tục, ngắt và du hành thời gian miễn phí. *(Xem Giai đoạn 11 · 16.)*
- **CrewAI.** Trạng thái chảy như chuỗi giữa tác vụ qua trường `context`, hoặc có cấu trúc qua `output_pydantic`. Không kho bền từng crew sẵn có; bạn tự gắn nếu crew phải sống qua khởi động lại.
- **AutoGen.** Trạng thái là lịch sử chat và mọi `context` do người dùng định nghĩa. Bản ghi hội thoại lưu bền; trạng thái quy trình tùy ý không lưu trừ khi bạn viết adapter.
- **Agno.** Driver lưu trữ tích hợp (SQLite, Postgres, Mongo, Redis, DynamoDB) gắn vào `Agent` qua `storage=` — phiên hội thoại và ký ức người dùng tự lưu bền. Không phải checkpointer đồ thị đầy đủ; là kho phiên.

### The branching question

Mọi tác tử không đơn giản đều phân nhánh. Ai quyết định nhánh là quan trọng.

- **LangGraph** — bạn quyết định qua cạnh có điều kiện. Định tuyến là hàm Python có nhánh đặt tên. Nhánh là thành phần hạng nhất trong đồ thị biên dịch; checkpointer ghi nhánh đã đi.
- **CrewAI** — người quản lý quyết định ở chế độ phân cấp; ở chế độ tuần tự bạn quyết định lúc xây. Định tuyến ngầm trong danh sách tác vụ; không "if" hạng nhất ngoài prompt người quản lý.
- **AutoGen** — tác tử quyết định qua chat. Phân nhánh tự xuất hiện từ người nói tiếp. `GroupChatManager` chọn người nói tiếp; bạn có thể tự viết `speaker_selection_method` nhưng mặc định do LLM chi phối.
- **Agno** — tác tử quyết định bằng công cụ gọi tiếp theo. Nhóm có chế độ điều phối/định tuyến/cộng tác; phân nhánh vượt đó là trách nhiệm lập trình viên.

### The observability question

- **LangGraph** — OpenTelemetry qua LangSmith hoặc mọi bộ xuất OTel. Mỗi chuyển tiếp node là span trace; checkpoint đồng thời là trace phát lại được. LangSmith là lựa chọn chính chủ; Langfuse/Phoenix cũng có adapter.
- **CrewAI** — OpenTelemetry hạng nhất từ cuối năm 2025; tích hợp Langfuse, Phoenix, Opik, AgentOps.
- **AutoGen** — tích hợp OpenTelemetry qua `autogen-core`; AgentOps và Opik có connector. Mức hạt tracing là mỗi thông điệp tác tử, không phải mỗi node.
- **Agno** — cờ `monitoring=True` tích hợp cộng bộ xuất OpenTelemetry; tích hợp chặt với Langfuse cho trace phiên.

### Cost and latency

Cả bốn framework thêm chi phí mỗi lệnh gọi (logic framework, xác thực, tuần tự hóa). Thứ tự tăng chi phí gần đúng: Agno ≈ LangGraph < CrewAI ≈ AutoGen. Khác biệt bị chi phối bởi lượng định tuyến LLM bổ sung framework làm. Người quản lý phân cấp CrewAI tốn token quyết định ai tiếp theo; `GroupChatManager` AutoGen cũng vậy. LangGraph chỉ tốn token nơi bạn viết `llm.invoke`. Đường một tác tử Agno mỏng.

Khi chi phí mỗi lượt quan trọng, ưu tiên định tuyến rõ ràng (cạnh LangGraph, `speaker_selection_method` AutoGen) hơn định tuyến do LLM chọn.

### Interoperability

- **LangGraph** ↔ công cụ, bộ truy xuất, LLM **LangChain**. Adapter MCP hạng nhất (công cụ nhập dưới dạng máy chủ MCP).
- **CrewAI** ↔ công cụ kế thừa `BaseTool`; công cụ LangChain, LlamaIndex và MCP đều thích ứng vào được. Ủy nhiệm giữa crew qua `allow_delegation=True`.
- **AutoGen** → `FunctionTool` bọc mọi callable Python; có adapter MCP. Gắn chặt hệ sinh thái AG2 cho mẫu tác tử-tác tử.
- **Agno** → decorator `@tool` hoặc lớp con BaseTool; adapter MCP; công cụ chia sẻ được giữa tác tử và nhóm.

## The Skill

> Bạn có thể giải thích trong một câu tại sao framework cho trước phù hợp với bài toán tác tử cho trước.

Danh sách kiểm tra trước xây dựng:

1. **Vẽ hình dạng.** Đây là đồ thị (trạng thái có kiểu, chuyển tiếp có tên)? Nhập vai (chuyên gia bàn giao việc)? Chat (tác tử nói đến khi xong)? Một tác tử có công cụ?
2. **Quyết định ai phân nhánh.** Lập trình viên quyết định → LangGraph. Tác tử quản lý quyết định → CrewAI phân cấp. Tự phát từ chat → AutoGen. Lệnh gọi công cụ quyết định → Agno.
3. **Kiểm tra ngân sách trạng thái.** Có cần tiếp tục từ checkpoint? Du hành thời gian? Ngắt cho con người giữa lượt chạy? Nếu có, LangGraph là mặc định; phiên Agno bao quát trạng thái trong phạm vi hội thoại.
4. **Kiểm tra ngân sách chi phí.** Định tuyến do LLM chọn tốn token bổ sung mỗi lượt. Nếu tác tử chạy hàng nghìn lần mỗi ngày, ưu tiên định tuyến rõ ràng.
5. **Lập ngân sách chi phí framework bổ sung.** Mọi framework là một phụ thuộc nữa. Nếu tác vụ là hai lệnh gọi LLM và một công cụ, viết 30 dòng Python thường; không framework nào rẻ hơn không dùng framework.

Từ chối dùng framework trước khi vẽ được đồ thị, sơ đồ tổ chức, chat hoặc hộp tác tử. Từ chối chọn framework buộc bạn chống lại mô hình trạng thái của nó cho thứ thực sự cần.

## The Decision Matrix

| Hình dạng bài toán | Framework ưu tiên | Tại sao |
|---------------|---------------------|-----|
| DAG quy trình với trạng thái có kiểu, phê duyệt con người, chạy dài | LangGraph | Trạng thái hạng nhất, checkpointer, ngắt, du hành thời gian. |
| Pipeline nghiên cứu / viết có vai trò riêng | CrewAI (tuần tự) hoặc đồ thị con LangGraph | Vai trò mỗi tác vụ biểu đạt rẻ trong CrewAI; mở rộng bằng LangGraph khi phân nhánh phức tạp. |
| Đối thoại người đề xuất-người phê bình hoặc thầy-trò | AutoGen | Chat hai tác tử là hình dạng nguyên bản. |
| Một tác tử với công cụ, phiên, bộ nhớ | Agno | Thiết lập mỏng nhất, lưu trữ và bộ nhớ tích hợp. |
| Hàng nghìn phân tán song song có reducer | LangGraph + `Send` | Duy nhất có API điều phối song song hạng nhất. |
| Bản mẫu nhanh, không cam kết framework | Python thường + SDK nhà cung cấp | Không dùng framework là framework nhanh nhất. |

```figure
l5-framework-fit
```

## Exercises

1. **Dễ.** Lấy cùng tác vụ — "nghiên cứu trụ sở Anthropic, viết bản lược 200 từ, trích nguồn" — và triển khai trong LangGraph (bốn node: lập kế hoạch, tìm kiếm, viết, trích dẫn) và CrewAI (ba vai trò: người nghiên cứu, người viết, biên tập viên). Báo chi phí token mỗi lượt và số dòng mã.
2. **Trung bình.** Xây cùng tác vụ trong AutoGen (chat người nghiên cứu ↔ người viết, biên tập viên tham gia qua `GroupChat`) và Agno (một tác tử với `search_tools` và `write_tools`, cộng kho phiên). Xếp bốn triển khai theo (a) chi phí mỗi lượt, (b) khả năng tiếp tục sau sập, (c) khả năng chèn phê duyệt con người trước bước viết.
3. **Khó.** Xây script cây quyết định `pick_framework.py` nhận mô tả bài toán ngắn (JSON: `{has_typed_state, has_roles, has_dialogue, has_parallel_fanout, needs_resume}`) và trả khuyến nghị kèm lý giải một câu. Xác minh trên sáu trường hợp bạn tự thiết kế.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|-----------------|-----------------------|
| Orchestration (Điều phối) | "Cách tác tử phối hợp" | Lớp quyết định node/vai trò/tác tử nào chạy tiếp. |
| Durable state (Trạng thái bền vững) | "Tiếp tục sau khởi động lại" | Trạng thái sống qua tiến trình chết, gắn với checkpoint hoặc kho phiên. |
| LLM-selected routing (Định tuyến do LLM chọn) | "Để mô hình quyết định" | LLM lập kế hoạch chọn bước tiếp mỗi lượt; linh hoạt nhưng trả token trên mọi quyết định. |
| Explicit routing (Định tuyến rõ ràng) | "Lập trình viên quyết định" | Hàm Python hoặc cạnh tĩnh chọn bước tiếp; rẻ và kiểm toán được. |
| Crew | "Nhóm CrewAI" | Vai trò + tác vụ + quy trình (tuần tự hoặc phân cấp) gắn thành một runnable. |
| GroupChat | "Chat đa tác tử AutoGen" | Hội thoại được quản lý giữa N tác tử với bộ chọn người nói. |
| Team (Agno) (Nhóm) | "Agno đa tác tử" | Chế độ định tuyến / điều phối / cộng tác trên tập tác tử. |
| StateGraph | "Đồ thị LangGraph" | Trừu tượng trạng thái có kiểu, node, cạnh có điều kiện, checkpointer. |

## Further Reading

- [LangGraph documentation](https://langchain-ai.github.io/langgraph/) — StateGraph, checkpointer, ngắt, du hành thời gian.
- [CrewAI documentation](https://docs.crewai.com/) — Crew, luồng, tác tử, tác vụ, quy trình.
- [AutoGen documentation](https://microsoft.github.io/autogen/) — ConversableAgent, GroupChat, nhóm, công cụ.
- [Agno documentation](https://docs.agno.com/) — Agent, Team, Workflow, lưu trữ, bộ nhớ.
- [Anthropic — Building effective agents (Dec 2024)](https://www.anthropic.com/research/building-effective-agents) — thư viện mẫu (nối chuỗi prompt, định tuyến, song song hóa, bộ điều phối-worker, bộ đánh giá-bộ tối ưu) không phụ thuộc framework.
- [Yao et al., "ReAct: Synergizing Reasoning and Acting" (ICLR 2023)](https://arxiv.org/abs/2210.03629) — vòng lặp mọi framework khoác áo.
- [Wu et al., "AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation" (2023)](https://arxiv.org/abs/2308.08155) — bài báo thiết kế AutoGen.
- [Park et al., "Generative Agents: Interactive Simulacra of Human Behavior" (UIST 2023)](https://arxiv.org/abs/2304.03442) — nền tảng nhập vai mà ngăn xếp nhân vật kiểu CrewAI xây dựa trên.
- Giai đoạn 11 · 16 (LangGraph) — framework bài học này dùng làm đối chiếu benchmark.
- Giai đoạn 11 · 19 (Reflexion) — mẫu ánh xạ gọn vào LangGraph nhưng vụng vào CrewAI.
- Giai đoạn 11 · 22 (Production observability) — cách gắn đo bất kỳ framework nào bạn chọn.
