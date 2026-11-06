# The Actor Model for Agents — Async Messages and Typed Runtimes

> Các agent như actor: trao đổi thông điệp bất đồng bộ, các bộ xử lý hướng sự kiện, cô lập lỗi, tính đồng thời tự nhiên. AutoGen v0.4 (Microsoft Research, tháng 1 năm 2025) thiết kế lại điều phối agent quanh mô hình này; framework hiện ở chế độ bảo trì, với Microsoft Agent Framework (bản xem trước công khai tháng 10 năm 2025) là bên kế nhiệm sản xuất của nó.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~75 minutes

## Learning Objectives

- Mô tả mô hình actor: các agent như actor, các thông điệp là IPC duy nhất, cô lập lỗi cho từng actor.
- Nêu tên ba lớp API của AutoGen v0.4 — Core, AgentChat, Extensions — và mỗi lớp dùng để làm gì.
- Giải thích vì sao tách biệt việc chuyển thông điệp khỏi xử lý mang lại cô lập lỗi và tính đồng thời tự nhiên.
- Triển khai một runtime actor dùng thư viện chuẩn trong Python và chuyển một luồng đánh giá mã hai agent lên nó.

## The Problem

Hầu hết các framework agent là đồng bộ: một agent tạo, một agent tiêu thụ, trong một ngăn xếp lời gọi. Các lỗi làm sập ngăn xếp. Tính đồng thời được gắn thêm. Phân tán yêu cầu viết lại.

Câu trả lời của AutoGen v0.4: mô hình actor. Mỗi agent là một actor với một hộp thư đến riêng. Các thông điệp là tương tác duy nhất. Runtime tách biệt chuyển giao khỏi xử lý. Các lỗi được cô lập vào một actor. Tính đồng thời là gốc. Phân tán chỉ là phương thức truyền tải khác.

## The Concept

### Actors

Một actor có:

- Một trạng thái riêng (không bao giờ được chạm trực tiếp từ bên ngoài).
- Một hộp thư đến (hàng đợi thông điệp).
- Một bộ xử lý: `receive(message) -> effects` trong đó các hiệu ứng có thể là "trả lời," "gửi đến actor khác," "tạo actor mới," "cập nhật trạng thái," "tự dừng."

Hai actor không thể chia sẻ bộ nhớ. Chúng chỉ có thể gửi thông điệp.

### Three API layers

AutoGen v0.4 chia bề mặt của nó thành ba:

1. **Core.** Framework actor cấp thấp. `AgentRuntime`, `Agent`, `Message`, `Topic`. Trao đổi thông điệp bất đồng bộ, hướng sự kiện.
2. **AgentChat.** API cấp cao do tác vụ dẫn dắt (thay thế ConversableAgent của v0.2). `AssistantAgent`, `UserProxyAgent`, `RoundRobinGroupChat`, `SelectorGroupChat`.
3. **Extensions.** Các tích hợp — OpenAI, Anthropic, Azure, công cụ, bộ nhớ.

### Why decoupling matters

Trong mô hình v0.2, gọi `agent_a.chat(agent_b)` đồng bộ chặn agent_a cho đến khi agent_b trả về. Trong v0.4, `send(agent_b, msg)` đặt thông điệp vào hộp thư đến của agent_b và trả về. Runtime chuyển giao sau. Ba hệ quả:

- **Cô lập lỗi.** Agent B bị sập không làm sập Agent A — runtime bắt lỗi trong bộ xử lý của B và quyết định làm gì (ghi log, thử lại, đưa vào hàng đợi thông điệp lỗi).
- **Tính đồng thời tự nhiên.** Nhiều thông điệp đang truyền cùng lúc; các actor xử lý hộp thư đến của chúng đồng thời.
- **Sẵn sàng phân tán.** Hộp thư đến + truyền tải là cùng một trừu tượng dù actor ở trong tiến trình hay trên một host khác.

### Topologies

- **RoundRobinGroupChat.** Các agent thay phiên theo một vòng xoay cố định.
- **SelectorGroupChat.** Một agent lựa chọn chọn ai đi tiếp dựa trên ngữ cảnh hội thoại.
- **Magentic-One.** Nhóm nhiều agent tham chiếu cho duyệt web, thực thi mã, xử lý file. Được xây dựng trên AgentChat.

### Observability

Hỗ trợ OpenTelemetry được tích hợp sẵn. Mỗi thông điệp phát ra một span; các lời gọi công cụ mang các thuộc tính `gen_ai.*` theo các quy ước ngữ nghĩa OTel GenAI năm 2026 (Bài 23).

### Status: maintenance mode

Đầu năm 2026: AutoGen v0.7.x ổn định cho nghiên cứu và tạo nguyên mẫu. Microsoft đã chuyển phát triển tích cực sang Microsoft Agent Framework, bên kế nhiệm sản xuất (bản xem trước công khai ngày 1 tháng 10 năm 2025; 1.0 GA được nhắm tới cuối Q1 năm 2026). Các mẫu AutoGen chuyển tiếp gọn gàng — mô hình actor là ý tưởng bền vững.

```figure
actor-mailbox
```

## Build It

`code/main.py` triển khai một runtime actor dùng thư viện chuẩn:

- `Message` — payload có kiểu với `sender`, `recipient`, `topic`, `body`.
- `Actor` — trừu tượng với `receive(message, runtime)`.
- `Runtime` — vòng lặp sự kiện với một hàng đợi dùng chung, chuyển giao, cô lập lỗi.
- Một demo hai actor: `ReviewerAgent` đánh giá mã, `ChecklistAgent` chạy một danh sách kiểm tra; chúng trao đổi thông điệp cho đến khi đồng thuận.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy việc chuyển giao thông điệp, một lỗi mô phỏng trong một actor không làm sập actor kia, và sự hội tụ vào một phán quyết dùng chung.

## Use It

- **AutoGen v0.4/v0.7** (bảo trì) — ổn định cho nghiên cứu, tạo nguyên mẫu, các mẫu nhiều agent.
- **Microsoft Agent Framework** — bên kế nhiệm sản xuất (bản xem trước công khai tháng 10 năm 2025); cùng các ý tưởng mô hình actor trong một API được làm mới.
- **Cấu trúc bầy đàn LangGraph** (Bài 13) — mẫu tương tự qua các bàn giao bằng công cụ dùng chung.
- **Runtime actor tùy chỉnh** — khi bạn cần phương thức truyền tải cụ thể (NATS, RabbitMQ, gRPC).

## Ship It

`outputs/skill-actor-runtime.md` tạo một runtime actor tối thiểu cộng một mẫu nhóm (RoundRobin hoặc Selector) cho một tác vụ nhiều agent cho trước.

## Exercises

1. Thêm một hàng đợi thông điệp lỗi: khi một bộ xử lý phát sinh ngoại lệ, giữ thông điệp thất bại để con người kiểm tra. DLQ được chạm tới thường xuyên thế nào trong bản mô phỏng của bạn?
2. Triển khai `SelectorGroupChat`: một actor lựa chọn chọn ai xử lý thông điệp tiếp theo dựa trên trạng thái hội thoại.
3. Thêm truyền tải phân tán: thay hàng đợi trong tiến trình bằng một máy chủ JSON-over-HTTP để các actor có thể chạy trong các tiến trình riêng.
4. Nối một span OTel cho mỗi thông điệp (hoặc một bản thay thế không làm gì). Phát ra `gen_ai.agent.name`, `gen_ai.operation.name` theo Bài 23.
5. Đọc bài đăng kiến trúc AutoGen v0.4. Chuyển bản mô phỏng của bạn sang API `autogen_core` thực. Bạn đã bỏ qua điều gì quan trọng trong sản xuất?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Actor | "Agent" | Trạng thái riêng + hộp thư đến + bộ xử lý; không có bộ nhớ dùng chung |
| Message (Thông điệp) | "Sự kiện" | Payload có kiểu; cách duy nhất các actor tương tác |
| Inbox (Hộp thư đến) | "Hộp thư" | Hàng đợi các thông điệp đang chờ cho từng actor |
| Runtime (Môi trường thực thi) | "Host agent" | Vòng lặp sự kiện định tuyến thông điệp và cô lập các lỗi |
| Topic (Chủ đề) | "Kênh" | Tuyến xuất bản-đăng ký có tên giữa các actor |
| Fault isolation (Cô lập lỗi) | "Cứ để nó sập" | Một actor thất bại không làm sập các actor khác |
| RoundRobinGroupChat | "Nhóm xoay vòng cố định" | Các agent thay phiên theo thứ tự |
| SelectorGroupChat | "Nhóm định tuyến theo ngữ cảnh" | Bộ lựa chọn chọn ai đi tiếp |
| Magentic-One | "Nhóm tham chiếu" | Đội nhiều agent cho web + mã + file |

## Further Reading

- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — bài đăng thiết kế lại
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — lựa chọn có dạng đồ thị
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — các span AutoGen phát ra mặc định
