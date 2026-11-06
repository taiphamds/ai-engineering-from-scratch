# OpenAI Agents SDK: Handoffs, Guardrails, Tracing

> OpenAI Agents SDK là framework nhiều agent nhẹ được xây dựng trên Responses API. Năm thành phần nguyên thủy: Agent, Handoff, Guardrail, Session, Tracing. Các bàn giao là các công cụ có tên `transfer_to_<agent>`. Các chốt bảo vệ kích hoạt trên đầu vào hoặc đầu ra. Truy vết được bật mặc định.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 06 (Tool Use)
**Time:** ~75 minutes

## Learning Objectives

- Nêu tên năm thành phần nguyên thủy của OpenAI Agents SDK.
- Giải thích các bàn giao: vì sao chúng được mô hình hóa như công cụ, hình dạng tên nào mô hình nhìn thấy và cách ngữ cảnh chuyển giao.
- Phân biệt các chốt bảo vệ đầu vào, chốt bảo vệ đầu ra và chốt bảo vệ công cụ; giải thích `run_in_parallel` so với chế độ chặn.
- Triển khai một runtime dùng thư viện chuẩn với các bàn giao + chốt bảo vệ + truy vết kiểu span.

## The Problem

Các agent không thể ủy nhiệm rõ ràng rốt cuộc nhồi mọi thứ vào một prompt. Các agent không có chốt bảo vệ phát ra PII, đầu ra vi phạm chính sách hoặc lặp mãi. SDK của OpenAI hệ thống hóa ba thành phần nguyên thủy khiến công việc nhiều agent có thể xử lý được.

## The Concept

### Five primitives

1. **Agent.** LLM + các chỉ dẫn + các công cụ + các bàn giao.
2. **Handoff.** Ủy nhiệm cho một agent khác. Được biểu diễn cho mô hình như một công cụ có tên `transfer_to_<agent_name>`.
3. **Guardrail.** Xác thực trên đầu vào (chỉ agent đầu tiên), đầu ra (chỉ agent cuối cùng) hoặc gọi công cụ (cho từng công cụ hàm).
4. **Session.** Lịch sử hội thoại tự động xuyên các lượt.
5. **Tracing.** Các span tích hợp sẵn cho các lần sinh LLM, lời gọi công cụ, bàn giao, chốt bảo vệ.

### Handoffs as tools

Mô hình nhìn thấy `transfer_to_billing_agent` trong danh sách công cụ của nó. Gọi nó báo hiệu cho runtime:

1. Sao chép ngữ cảnh hội thoại (hoặc gộp nó qua bản beta `nest_handoff_history`).
2. Khởi tạo agent đích với các chỉ dẫn của nó.
3. Tiếp tục lần chạy với agent đích.

Đây là mẫu giám sát (Bài 13 / Bài 28) được sản phẩm hóa.

### Guardrails

Ba loại:

- **Các chốt bảo vệ đầu vào.** Chạy trên đầu vào của agent đầu tiên. Từ chối các yêu cầu không an toàn hoặc ngoài phạm vi trước bất kỳ lời gọi LLM nào.
- **Các chốt bảo vệ đầu ra.** Chạy trên đầu ra của agent cuối cùng. Bắt các rò rỉ PII, vi phạm chính sách, phản hồi sai định dạng.
- **Các chốt bảo vệ công cụ.** Chạy cho từng công cụ hàm. Xác thực các đối số, kiểm tra quyền, kiểm toán thực thi.

Chế độ:

- **Song song** (mặc định). LLM chốt bảo vệ chạy cùng LLM chính. Độ trễ đuôi thấp hơn. Nếu kích hoạt, công việc của LLM chính bị loại bỏ (lãng phí token).
- **Chặn** (`run_in_parallel=False`). LLM chốt bảo vệ chạy trước. Nếu kích hoạt, không có token bị lãng phí trên lời gọi chính.

Các dây kích hoạt phát sinh `InputGuardrailTripwireTriggered` / `OutputGuardrailTripwireTriggered`.

### Tracing

Được bật mặc định. Mỗi lần sinh LLM, lời gọi công cụ, bàn giao và chốt bảo vệ phát ra một span. `OPENAI_AGENTS_DISABLE_TRACING=1` chọn không tham gia. `add_trace_processor(processor)` phân các span đến backend riêng của bạn cùng với backend của OpenAI.

### Sessions

`Session` lưu lịch sử hội thoại trong một backend (SQLite, Redis, tùy chỉnh). `Runner.run(agent, input, session=session)` tự tải và thêm vào.

### Where this pattern goes wrong

- **Trôi dạt bàn giao.** Agent A bàn giao cho Agent B mà B bàn giao lại cho Agent A. Thêm một bộ đếm chặng.
- **Vượt qua chốt bảo vệ.** Các chốt bảo vệ công cụ chỉ kích hoạt trên các công cụ hàm; các công cụ tích hợp sẵn (đọc file, lấy web) cần chính sách riêng.
- **Truy vết quá mức.** Nội dung nhạy cảm trong các span. Kết hợp với các quy tắc ghi nội dung OTel GenAI (Bài 23) — lưu bên ngoài, tham chiếu bằng ID.

```figure
ae-agent-handoff
```

## Build It

`code/main.py` triển khai hình dạng SDK bằng thư viện chuẩn:

- `Agent`, `FunctionTool`, `Handoff` (như một công cụ hàm với ngữ nghĩa chuyển giao).
- `Runner` với các chốt bảo vệ đầu vào/đầu ra/công cụ, phân phối bàn giao và bộ đếm chặng.
- Một bộ phát span đơn giản để cho thấy hình dạng trace.
- Một agent phân loại ban đầu bàn giao đến thanh toán hoặc hỗ trợ dựa trên truy vấn của người dùng; chốt bảo vệ kích hoạt trên một đầu vào.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy hai bàn giao thành công, một lần chốt bảo vệ đầu vào kích hoạt và một cây span phản chiếu những gì SDK thực phát ra.

## Use It

- **OpenAI Agents SDK** cho các sản phẩm ưu tiên OpenAI.
- **Claude Agent SDK** (Bài 17) cho các sản phẩm ưu tiên Claude.
- **LangGraph** (Bài 13) khi bạn muốn trạng thái tường minh và tiếp tục bền vững.
- **Tùy chỉnh** khi bạn cần kiểm soát chính xác (giọng nói, nhiều nhà cung cấp, các triển khai liên kết).

## Ship It

`outputs/skill-agents-sdk-scaffold.md` tạo khung một ứng dụng Agents SDK với một agent phân loại ban đầu, các bàn giao, chốt bảo vệ đầu vào/đầu ra/công cụ, kho phiên và một bộ xử lý trace.

## Exercises

1. Thêm một bộ đếm chặng bàn giao: từ chối sau N lần chuyển giao. Truy vết hành vi.
2. Triển khai `nest_handoff_history` như một tùy chọn — gộp các thông điệp trước thành một bản tóm tắt trước khi chuyển giao.
3. Viết một chốt bảo vệ đầu ra chặn. So sánh độ trễ trên các prompt sẽ kích hoạt nó với các prompt vượt qua.
4. Nối `add_trace_processor` vào một bộ ghi log JSON. Nó phát ra hình dạng nào cho mỗi span?
5. Đọc tài liệu SDK. Chuyển bản mô phỏng dùng thư viện chuẩn của bạn sang `openai-agents-python`. Bạn đã mô hình hóa sai điều gì?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Agent (Tác nhân) | "LLM + các chỉ dẫn" | Kiểu Agent trong SDK; sở hữu các công cụ và bàn giao |
| Handoff (Bàn giao) | "Chuyển giao" | Công cụ mà mô hình gọi để ủy nhiệm cho một agent khác |
| Guardrail (Chốt bảo vệ) | "Kiểm tra chính sách" | Xác thực trên đầu vào / đầu ra / gọi công cụ |
| Tripwire (Dây kích hoạt) | "Chốt bảo vệ kích hoạt" | Ngoại lệ được phát sinh khi chốt bảo vệ từ chối |
| Session (Phiên) | "Kho lịch sử" | Bộ nhớ hội thoại được lưu giữ giữa các lần chạy |
| Tracing (Truy vết) | "Các span" | Khả năng quan sát tích hợp sẵn trên LLM + công cụ + bàn giao + chốt bảo vệ |
| Blocking guardrail (Chốt bảo vệ chặn) | "Kiểm tra tuần tự" | Chốt bảo vệ chạy trước; không lãng phí token khi kích hoạt |
| Parallel guardrail (Chốt bảo vệ song song) | "Kiểm tra đồng thời" | Chốt bảo vệ chạy cùng; độ trễ thấp hơn, lãng phí token khi kích hoạt |

## Further Reading

- [OpenAI Agents SDK docs](https://openai.github.io/openai-agents-python/) — các thành phần nguyên thủy, bàn giao, chốt bảo vệ, truy vết
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — đối tác theo phong cách Claude
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — khi nào cần chọn các bàn giao
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — tiêu chuẩn mà các span Agents SDK ánh xạ tới
