# Role-Based Agent Teams — Roles, Tasks, Processes

> Bốn thành phần nguyên thủy: Agent, Task, Crew, Process. Hai hình dạng cấp cao: Crews (hợp tác tự chủ, dựa trên vai trò) và Flows (hướng sự kiện, mang tính xác định). CrewAI là triển khai tham chiếu năm 2026, và tài liệu của nó nói thẳng: "với bất kỳ ứng dụng sẵn sàng cho sản xuất nào, hãy bắt đầu với một Flow."

**Type:** Learn + Build
**Languages:** Python (with numpy)
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 14 (Actor Model)
**Time:** ~75 minutes

## Learning Objectives

- Nêu tên bốn thành phần nguyên thủy của CrewAI (Agent, Task, Crew, Process) và điều mỗi thành phần sở hữu.
- Phân biệt các quy trình Sequential, Hierarchical và Consensus được lên kế hoạch; chọn một cho mỗi khối lượng công việc.
- Phân biệt Crews (tự chủ dựa trên vai trò) với Flows (hướng sự kiện mang tính xác định), và giải thích khuyến nghị sản xuất của tài liệu.
- Nối các công cụ bằng decorator `@tool` và lớp con `BaseTool`; suy luận về đầu ra có cấu trúc so với văn bản tự do.
- Nêu tên bốn loại bộ nhớ CrewAI và khi nào mỗi loại mang lại lợi ích.
- Triển khai một crew ba agent (nhà nghiên cứu, người viết, biên tập viên) bằng Python thuần túy tạo ra một bản tóm tắt.
- Nhận diện bốn dạng lỗi CrewAI: phình to prompt, phụ phí manager-LLM, chuyển giao dễ vỡ, Crew làm môi trường vận hành thực tế.

## The Problem

Các nhóm áp dụng các framework nhiều agent gặp cùng một bức tường. "Hợp tác tự chủ" nghe tuyệt trong một bản demo. Rồi một khách hàng báo một lỗi và bạn cần phát lại mang tính xác định. Hoặc bộ phận tài chính hỏi một crew do LLM định tuyến tốn bao nhiêu cho mỗi lần chạy. Hoặc người trực cần biết agent nào bị đình trệ lúc 3 giờ sáng.

Các crew do LLM định tuyến tự do không trả lời rõ ràng điều nào trong số đó. Các DAG thuần trả lời tất cả nhưng mất hình dạng khám phá mà một agent động não cần.

Sự phân tách của CrewAI trung thực về đánh đổi. Crews cho công việc hợp tác, dựa trên vai trò, khám phá. Flows cho sản xuất hướng sự kiện, do mã sở hữu, có thể kiểm toán. Cùng framework, hai hình dạng, chọn theo bề mặt.

## The Concept

### Four primitives

Bề mặt của CrewAI nhỏ. Ghi nhớ điều này và phần còn lại là cấu hình.

- **Agent.** `role + goal + backstory + tools + (optional) llm`. Bối cảnh đóng vai trò trụ cột. Nó định hình giọng điệu, phán đoán, khi nào agent dừng. Các công cụ là các hàm mà agent có thể gọi (thêm ở dưới).
- **Task.** `description + expected_output + agent + (optional) context + (optional) output_pydantic`. Một đơn vị công việc tái sử dụng. `expected_output` là hợp đồng. `context` liệt kê các tác vụ thượng nguồn có đầu ra được truyền vào. `output_pydantic` buộc một hình dạng có cấu trúc.
- **Crew.** Vật chứa. Sở hữu danh sách `agents`, danh sách `tasks`, `process` và các thiết lập `memory` + `verbose` + `manager_llm` tùy chọn.
- **Process.** Chiến lược thực thi. Sequential, Hierarchical, Consensus (được lên kế hoạch). Chọn hình dạng của lần chạy.

Các agent không nhìn thấy nhau trực tiếp. Các task tham chiếu các agent. Crew sắp thứ tự các task. Process quyết định ai chọn task tiếp theo. Đó là toàn bộ mô hình tư duy.

> **Được xác thực đối với** CrewAI 0.86 (2026-05). Các phiên bản mới hơn có thể đổi tên hoặc hợp nhất các loại process; kiểm tra [tài liệu CrewAI Processes](https://docs.crewai.com/concepts/processes) trước khi dựa vào một hình dạng cụ thể.

### Sequential vs Hierarchical vs Consensus

- **Sequential.** Các task chạy theo thứ tự khai báo. Đầu ra của task N khả dụng dưới dạng `context` cho task N+1. Chi phí thấp nhất. Dễ dự đoán nhất. Sử dụng khi thứ tự cố định.
- **Hierarchical.** Một Agent quản lý (lời gọi LLM riêng) định tuyến giữa các chuyên gia. CrewAI tạo bộ quản lý từ cấu hình `manager_llm` của bạn hoặc một mặc định. Bộ quản lý chọn task tiếp theo mỗi vòng và có thể từ chối hoặc định tuyến lại. Sử dụng khi bạn có bốn chuyên gia trở lên và thứ tự thực sự phụ thuộc đầu ra trước đó.
- **Consensus.** Được lên kế hoạch, hiện chưa được triển khai trong API công khai. Tài liệu dành riêng tên này cho một process dựa trên bỏ phiếu trong tương lai. Đừng dựa vào nó hôm nay.

Hierarchical thêm một lời gọi LLM cho từng vòng (bộ quản lý) bên trên mỗi lời gọi chuyên gia. Chi phí token có thể tăng gấp ba trên một lần chạy năm bước. Chỉ trả chi phí đó khi bạn cần định tuyến.

### Crews vs Flows

Đây là cách định khung mà tài liệu dẫn đầu trong năm 2026.

- **Crew.** Tính tự chủ do LLM điều khiển. Framework chọn hình dạng khi chạy. Tốt cho: nghiên cứu, động não, bản nháp đầu tiên, bất kỳ nơi nào đường đi là một phần của câu trả lời. Khó phát lại. Khó kiểm thử. Rẻ để tạo nguyên mẫu.
- **Flow.** Đồ thị hướng sự kiện mà bạn sở hữu. `@start` đánh dấu điểm vào. `@listen(topic)` đánh dấu một bước kích hoạt khi một bước khác phát ra topic đó. Mỗi bước là Python thuần (có thể gọi một Crew bên trong). Tốt cho: sản xuất. Có thể quan sát. Có thể kiểm thử. Mang tính xác định.

Khuyến nghị sản xuất năm 2026 của tài liệu: bắt đầu với một Flow. Đưa Crews vào dưới dạng các lời gọi `Crew.kickoff()` từ bên trong các bước Flow khi tính tự chủ xứng đáng với chi phí. Flow cho bạn dấu vết kiểm toán, Crew cho bạn khám phá. Kết hợp, đừng chọn.

### Tool integration

Ba cách cho một Agent một công cụ. Chọn cách đơn giản nhất phù hợp.

1. **Decorator `@tool`.** Các hàm thuần trở thành công cụ. Chữ ký là schema; docstring là mô tả mà LLM nhìn thấy. Tốt nhất cho các hàm trợ giúp dùng một lần.

   ```python
   from crewai.tools import tool

   @tool("Search the web")
   def search(query: str) -> str:
       """Return top results for the query."""
       return run_search(query)
   ```

2. **Lớp con `BaseTool`.** Công cụ dựa trên lớp với schema đối số tường minh, hỗ trợ bất đồng bộ, các lần thử lại. Sử dụng khi công cụ có trạng thái (một client, một bộ nhớ đệm) hoặc cần các đối số có cấu trúc.

   ```python
   from crewai.tools import BaseTool
   from pydantic import BaseModel

   class SearchArgs(BaseModel):
       query: str
       limit: int = 10

   class SearchTool(BaseTool):
       name = "web_search"
       description = "Search the web and return top results."
       args_schema = SearchArgs

       def _run(self, query: str, limit: int = 10) -> str:
           return self.client.search(query, limit=limit)
   ```

3. **Các bộ công cụ tích hợp sẵn.** CrewAI cung cấp các bộ điều hợp chính chủ: `SerperDevTool`, `FileReadTool`, `DirectoryReadTool`, `CodeInterpreterTool`, `RagTool`, `WebsiteSearchTool`. Được nối bằng một import.

Các đầu ra có cấu trúc sử dụng Pydantic. Truyền `output_pydantic=MyModel` trên Task. CrewAI xác thực phản hồi LLM đối với mô hình và ép kiểu hoặc thử lại. Kết hợp điều này với một chuỗi `expected_output` chặt chẽ. Các đầu ra văn bản tự do ổn cho các bản nháp; các đầu ra có cấu trúc là thứ mà các Flow hạ nguồn có thể tiêu thụ.

### Memory hooks

CrewAI cung cấp sẵn bốn loại bộ nhớ. Chúng kết hợp được: một Crew có thể bật cả bốn cùng lúc.

> **Được xác thực đối với** CrewAI 0.86 (2026-05). Các bản phát hành gần đây định tuyến mọi thứ qua một hệ thống `Memory` thống nhất bọc bốn kho này. Mô hình khái niệm bên dưới vẫn đúng, nhưng bề mặt lớp công khai có thể gộp về một điểm vào `Memory` duy nhất trong các phiên bản mới hơn; kiểm tra [tài liệu bộ nhớ CrewAI](https://docs.crewai.com/concepts/memory) để biết API hiện tại.

- **Ngắn hạn.** Bộ đệm hội thoại trong một lần chạy duy nhất. Được xóa sạch ở cuối.
- **Dài hạn.** Được lưu giữ xuyên các lần chạy. Được lưu trong một cơ sở dữ liệu vector (Chroma mặc định, có thể thay thế). Được truy xuất theo độ tương tự với tác vụ hiện tại.
- **Thực thể.** Các sự thật cho từng thực thể. "Khách hàng X ở gói doanh nghiệp." Được đánh khóa theo thực thể, không phải độ tương tự. Tồn tại xuyên các lần chạy.
- **Theo ngữ cảnh.** Truy xuất tại thời điểm lắp ráp. Lấy bộ nhớ liên quan vào lúc Agent cần nó, không tải trước.

Bật trên Crew với `memory=True` hoặc cấu hình theo từng loại. Được hỗ trợ bởi một nhà cung cấp embedding bạn cấu hình (mặc định là OpenAI, có thể đổi sang cục bộ). Bộ nhớ là một trong những nơi CrewAI chứng tỏ giá trị so với các framework mỏng hơn; LangGraph thuần yêu cầu bạn tự nối từng loại này.

### When role-based teams fit

- Ba đến sáu agent với các vai trò có tên và một workflow hợp tác. Soạn nháp, đánh giá, lập kế hoạch, động não.
- Định tuyến nơi phán đoán của LLM về bước tiếp theo là một phần giá trị (Hierarchical).
- Bất kỳ nơi nào nhóm thích đọc `role + goal + backstory` hơn đọc một định nghĩa đồ thị.

### When they do not

- Các DAG mang tính xác định với thứ tự nghiêm ngặt. Sử dụng LangGraph (Bài 13). Hình dạng đồ thị là trừu tượng đúng; cách định khung vai trò của CrewAI là ma sát.
- Các ngân sách độ trễ dưới một giây. Hierarchical thêm các lượt khứ hồi. Ngay cả Sequential cũng tuần tự hóa các prompt bao gồm các bối cảnh và đầu ra trước.
- Các vòng lặp một agent. Bỏ qua framework; một vòng lặp agent (Bài 1) cộng một sổ đăng ký công cụ ngắn hơn.

Bài 28 (Orchestration Patterns) so sánh các cấu trúc liên kết cạnh nhau. Phiên bản ngắn: CrewAI nằm ở góc "cộng tác dựa trên vai trò".

### Dependency shape

Độc lập với LangChain. Python 3.10 đến 3.13. Sử dụng `uv`. Số sao: xem [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) (ảnh chụp tại thời điểm 2026-05). Tích hợp AWS Bedrock được tài liệu hóa; các benchmark của nhà cung cấp báo cáo tăng tốc đáng kể so với LangGraph trên các khối lượng công việc QA, nhưng phương pháp (tập dữ liệu, phần cứng, thước đo đánh giá) không được công bố, vì vậy chỉ coi các con số của nhà cung cấp framework là định hướng.

### Where this pattern goes wrong

- **Prompt phình to từ các bối cảnh.** Một bối cảnh 2000 từ cho mỗi agent và một crew năm agent đốt ngân sách ngữ cảnh trước lời gọi công cụ đầu tiên. Giữ các bối cảnh dưới 200 từ. Tái sử dụng các cụm từ xuyên các agent; đừng lặp lại phong cách chung năm lần.
- **Phụ phí token Manager-LLM.** Quy trình phân cấp thêm một lệnh gọi LLM quản lý trước mỗi lệnh gọi chuyên gia. Trên một crew năm tác vụ, đó là mười lệnh gọi LLM thay vì năm, và lệnh gọi quản lý mang toàn bộ danh sách tác vụ cùng các đầu ra trước đó. Chuyển sang Sequential trừ khi định tuyến phụ thuộc vào đầu ra.
- **Các bàn giao mong manh.** `expected_output` của task N là "một dàn ý". Task N+1 đọc nó dưới dạng `context` và cố phân tích ba phần. LLM tạo ra bốn. Agent hạ nguồn ứng biến. Khắc phục với `output_pydantic` trên Task N để Task N+1 đọc một đối tượng có kiểu, không phải văn bản tự do.
- **Crew làm sản xuất.** Crew tự do được đưa vào sản xuất mà không có một lớp bọc Flow. Độ biến thiên đầu ra cao; phát lại là bất khả thi; người trực không thể diff một lần chạy xấu với một lần tốt. Bọc bằng một Flow.

```figure
ae-crew-vs-flow
```

## Build It

`code/main.py` triển khai các phiên bản Python thuần túy của cả hai hình dạng cộng một crew ba agent. Phụ thuộc duy nhất ngoài thư viện chuẩn là numpy, cho độ tương đồng được mô phỏng.

Hình dạng:

- Các dataclass `Agent`, `Task` khớp bề mặt CrewAI.
- `SequentialCrew.kickoff(inputs)` chạy các task theo thứ tự khai báo, truyền các đầu ra dưới dạng `context`.
- `HierarchicalCrew.kickoff(topic)` thêm một Agent quản lý chọn chuyên gia tiếp theo mỗi vòng, dừng ở "xong".
- `Flow` với các decorator `@start` và `@listen(topic)`, một vòng lặp sự kiện nhỏ và một trace.
- Decorator `tool(name)` phản chiếu hình dạng `@tool` của CrewAI.
- `Memory` với các kho `short_term`, `long_term`, `entity`; độ tương tự mô phỏng sử dụng numpy.
- Các phản hồi LLM mô phỏng là các chuỗi được mã hóa cứng đánh khóa theo vai trò cộng tiền tố đầu vào. Không mạng. Mang tính xác định.

Demo cụ thể: crew nhà nghiên cứu, người viết, biên tập viên tạo một bản thông tin ngắn về "kỹ thuật agent 2026". Nhà nghiên cứu lấy các nguồn (mô phỏng). Người viết soạn nháp. Biên tập viên làm gọn. Cùng crew chạy qua một Flow để cho thấy hình dạng mang tính xác định.

Chạy nó:

```bash
python3 code/main.py
```

Trace bao phủ: crew tuần tự truyền các đầu ra qua `context`, crew phân cấp với các lựa chọn của bộ quản lý (nhà nghiên cứu, người viết, biên tập viên, rồi "xong"), flow chạy cùng ba bước với các topic tường minh (`researched`, `drafted`, `edited`), các lời gọi công cụ được định tuyến qua `@tool`, và bộ nhớ dài hạn tồn tại xuyên hai lần khởi chạy.

Trace Crew linh hoạt; bộ quản lý về nguyên tắc có thể sắp xếp lại. Trace Flow cố định. Lựa chọn đó là bài học.

## Use It

- **CrewAI Flow** cho sản xuất. Ngay cả khi Flow là một bước gọi `Crew.kickoff()`. Flow cho ranh giới kiểm toán.
- **CrewAI Crew (Sequential)** cho công việc hợp tác có thứ tự rõ ràng, đặc biệt là các bản nháp đầu tiên và các vòng lặp đánh giá.
- **CrewAI Crew (Hierarchical)** khi định tuyến phụ thuộc đầu ra và bạn có bốn chuyên gia trở lên.
- **LangGraph** (Bài 13) cho các máy trạng thái tường minh, tiếp tục bền vững, thứ tự nghiêm ngặt.
- **AutoGen v0.4** (Bài 14) cho tính đồng thời theo mô hình actor và cô lập lỗi.
- **OpenAI Agents SDK** (Bài 16) cho các sản phẩm ưu tiên OpenAI với các bàn giao và chốt bảo vệ.
- **Claude Agent SDK** (Bài 17) cho các sản phẩm ưu tiên Claude với các agent phụ và kho phiên.

## Ship It

`outputs/skill-crew-or-flow.md` chọn Crew so với Flow cho một tác vụ và tạo khung triển khai tối thiểu. Từ chối cứng Crew không có bối cảnh, Flow không có các topic tường minh, Hierarchical với dưới ba chuyên gia.

## Pitfalls

- **Bối cảnh như gia vị.** Nó định hình đầu ra. Kiểm thử ba biến thể cho mỗi agent; sự biến thiên là thực. Chọn một, cố định nó.
- **Bỏ qua `expected_output`.** Không có hợp đồng cho từng task, các task hạ nguồn nhận bất cứ thứ gì LLM tạo ra. Crew chạy; kiểm toán thất bại.
- **Bộ nhớ luôn bật.** Ghi dài hạn mỗi lần chạy. Cơ sở dữ liệu vector tăng. Truy xuất trở nên nhiễu. Giới hạn các lần ghi vào các tác vụ mà sự thật có tính lâu dài.
- **Trôi dạt prompt quản lý.** Prompt quản lý của Hierarchical là ngầm định. Nếu định tuyến trở nên kỳ lạ, xuất nó trong chế độ verbose và đọc.
- **Các tác dụng phụ công cụ trong Crews.** Một Crew có thể gọi một công cụ nhiều lần hơn mong đợi. POST, DELETE, thanh toán thuộc về một bước Flow, không bao giờ là một công cụ Crew.

## Exercises

1. Chuyển crew Sequential thành một Flow. Đếm các điểm tiếp xúc nơi độ biến thiên giảm. Ghi lại nơi tính dễ đọc giảm.
2. Thêm bộ nhớ thực thể vào crew: các sự thật về một khách hàng lưu giữ xuyên các lần khởi chạy. Xác minh truy xuất lấy đúng thực thể.
3. Triển khai một process Hierarchical trong đó bộ quản lý từ chối định tuyến đến biên tập viên cho đến khi đầu ra của người viết có ít nhất ba đoạn. Truy vết lần thử lại.
4. Nối một lớp con `BaseTool` cho một tìm kiếm web (mô phỏng). So sánh hình dạng trace với phiên bản decorator `@tool`.
5. Thêm `output_pydantic=Brief` vào task biên tập viên, trong đó `Brief` có `title`, `summary`, `sections`. Làm cho task người viết xuất JSON sai định dạng một lần; xác minh hành vi thử lại của CrewAI trong trace.
6. Đọc phần giới thiệu tài liệu CrewAI. Chuyển bản mô phỏng sang API `crewai` thực. Phiên bản thư viện chuẩn đã bỏ qua những bảo đảm nào?
7. Nối AgentOps hoặc Langfuse (Bài 24) vào một lần chạy thực. Bạn đã bỏ lỡ những trace nào trong phiên bản thư viện chuẩn?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Agent (Tác nhân) | "Nhân cách" | Vai trò + mục tiêu + bối cảnh + công cụ |
| Task (Tác vụ) | "Đơn vị công việc" | Mô tả + đầu ra được mong đợi + bên được giao + đầu ra có cấu trúc tùy chọn |
| Crew (Đội) | "Nhóm agent" | Vật chứa cho các Agent + Task + Process |
| Process (Quy trình) | "Chiến lược thực thi" | Sequential / Hierarchical / Consensus (được lên kế hoạch) |
| Flow (Luồng) | "Workflow mang tính xác định" | Hướng sự kiện, do mã sở hữu, có thể kiểm thử |
| Backstory (Bối cảnh) | "Prompt nhân cách" | Bộ định hình giọng điệu và phán đoán cho Agent |
| `@tool` | "Công cụ hàm" | Decorator biến một hàm thành một công cụ mà Agent có thể gọi |
| `BaseTool` | "Công cụ lớp" | Công cụ dựa trên lớp với schema đối số, các lần thử lại, hỗ trợ bất đồng bộ |
| Entity memory (Bộ nhớ thực thể) | "Các sự thật cho từng thực thể" | Bộ nhớ giới hạn phạm vi vào một khách hàng / tài khoản / vấn đề |
| Long-term memory (Bộ nhớ dài hạn) | "Bộ nhớ xuyên lần chạy" | Bộ nhớ dựa trên vector tồn tại giữa các lần khởi chạy |
| Contextual memory (Bộ nhớ theo ngữ cảnh) | "Truy xuất đúng lúc" | Bộ nhớ được lấy vào lúc Agent cần nó |
| Manager LLM (LLM quản lý) | "Agent định tuyến" | LLM bổ sung trong process Hierarchical chọn task tiếp theo |
| `expected_output` | "Hợp đồng tác vụ" | Chuỗi cho Agent (và kiểm toán) biết cần trả về hình dạng nào |

## Further Reading

- [CrewAI docs introduction](https://docs.crewai.com/en/introduction): các khái niệm và đường sản xuất được khuyến nghị
- [CrewAI Flows guide](https://docs.crewai.com/en/concepts/flows): hình dạng hướng sự kiện, `@start`, `@listen`
- [CrewAI tools reference](https://docs.crewai.com/en/concepts/tools): `@tool`, `BaseTool`, các bộ công cụ tích hợp sẵn
- [CrewAI memory](https://docs.crewai.com/en/concepts/memory): ngắn hạn, dài hạn, thực thể, theo ngữ cảnh
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents): khi nào nhiều agent giúp ích và khi nào không
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview): lựa chọn máy trạng thái
