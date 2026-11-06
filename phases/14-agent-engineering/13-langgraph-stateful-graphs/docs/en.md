# Stateful Graph Orchestration — Durable Execution and Checkpoints

> Agent là một máy trạng thái; các nút là các hàm; các cạnh là các chuyển tiếp; trạng thái được tạo checkpoint sau mỗi nút. Tiếp tục từ bất kỳ thất bại nào tại checkpoint thành công cuối cùng. LangGraph là tham chiếu năm 2026 cho mô hình điều phối có trạng thái cấp thấp này.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 12 (Workflow Patterns)
**Time:** ~75 minutes

## Learning Objectives

- Mô tả mô hình cốt lõi của LangGraph: máy trạng thái với trạng thái có kiểu, các nút hàm, các cạnh có điều kiện và các checkpoint sau nút.
- Nêu tên bốn khả năng mà tài liệu nhấn mạnh: thực thi bền vững, streaming, có con người tham gia, bộ nhớ toàn diện.
- Giải thích ba cấu trúc điều phối mà LangGraph hỗ trợ: giám sát, ngang hàng (bầy đàn), phân cấp (các đồ thị con lồng nhau).
- Triển khai một đồ thị trạng thái dùng thư viện chuẩn với trạng thái có kiểu, các cạnh có điều kiện và một chu kỳ checkpoint/tiếp tục.

## The Problem

Các agent và workflow có chung một vấn đề: khi một lần chạy 40 bước thất bại ở bước 38, bạn muốn tiếp tục từ bước 38, không phải bắt đầu lại. Các mô hình trạng thái hạng hai khiến người vận hành phải chắp vá các lần thử lại quanh một thư viện giả định các lần chạy mới.

Câu trả lời thiết kế của LangGraph: trạng thái là một đối tượng có kiểu hạng nhất, các thay đổi là tường minh, và các checkpoint được lưu giữ sau mỗi nút. Tiếp tục là một lời gọi `load_state(session_id)`.

## The Concept

### The graph

Một đồ thị được định nghĩa bởi:

- **Kiểu trạng thái.** Một dict có kiểu (hoặc mô hình Pydantic) mà mọi nút đọc và thay đổi.
- **Các nút.** Các hàm thuần `(state) -> state_update`. Các cập nhật được hợp nhất vào trạng thái sau khi trả về.
- **Các cạnh.** Các chuyển tiếp có điều kiện hoặc trực tiếp giữa các nút.
- **Điểm vào và ra.** Các nút dấu hiệu `START` và `END` đánh dấu ranh giới.

Ví dụ: một agent với các nút `classify`, `refund`, `bug`, `sales`, `done` — một workflow định tuyến dưới dạng một đồ thị.

### Durable execution

Sau khi mỗi nút trả về, runtime tuần tự hóa trạng thái và ghi nó vào một bộ tạo checkpoint (SQLite, Postgres, Redis, tùy chỉnh). Khi thất bại ở bước N, runtime có thể `resume(session_id)` và tiếp nối từ bước N+1 với trạng thái chính xác.

Tài liệu LangGraph nhấn mạnh rõ ràng các bên sử dụng trong sản xuất nơi điều này quan trọng: Klarna, Uber, J.P. Morgan. Tuyên bố không phải hình dạng đồ thị; mà là hình dạng đồ thị cộng tạo checkpoint làm cho phục hồi rẻ.

### Streaming

Mỗi nút có thể yield đầu ra một phần. Đồ thị truyền các sự kiện delta theo từng nút đến bên gọi để các UI cập nhật khi đồ thị chạy.

### Human-in-the-loop

Kiểm tra và sửa đổi trạng thái giữa các nút. Các triển khai: tạm dừng trước một nút then chốt, hiển thị trạng thái cho một con người, chấp nhận các sửa đổi, tiếp tục. Bộ tạo checkpoint làm điều này dễ vì trạng thái đã được tuần tự hóa.

### Memory

Ngắn hạn (trong một lần chạy — lịch sử hội thoại trong trạng thái) và dài hạn (xuyên các lần chạy — lưu giữ qua bộ tạo checkpoint cộng một kho dài hạn riêng). LangGraph tích hợp với các hệ thống bộ nhớ bên ngoài (Mem0, tùy chỉnh) qua công cụ.

### Three topologies

1. **Giám sát.** LLM định tuyến trung tâm phân phối đến các agent phụ chuyên gia. `create_supervisor()` trong `langgraph-supervisor` (dù nhóm LangChain năm 2026 khuyến nghị làm điều này trực tiếp qua các lời gọi công cụ để kiểm soát ngữ cảnh nhiều hơn).
2. **Bầy đàn / ngang hàng.** Các agent bàn giao trực tiếp qua một bề mặt công cụ dùng chung. Không có bộ định tuyến trung tâm.
3. **Phân cấp.** Các bộ giám sát quản lý các bộ giám sát con, được triển khai dưới dạng các đồ thị con lồng nhau.

### Where this pattern goes wrong

- **Các checkpoint quá nhỏ.** Chỉ tạo checkpoint các lượt hội thoại khiến trạng thái công cụ và các lần ghi bộ nhớ không thể phục hồi. Toàn bộ trạng thái phải được tuần tự hóa.
- **Các nút không mang tính xác định.** Tiếp tục giả định các đầu vào nút tạo ra cùng một cập nhật trạng thái. Các hạt giống ngẫu nhiên, thời gian đồng hồ, API bên ngoài phải được ghi lại.
- **Lạm dụng các cạnh có điều kiện.** Một đồ thị với mọi cạnh có điều kiện là một máy trạng thái không thể suy luận về nó. Ưu tiên các chuỗi tuyến tính với các nhánh thỉnh thoảng.

```figure
langgraph-state
```

## Build It

`code/main.py` triển khai một đồ thị có trạng thái dùng thư viện chuẩn:

- `State` — một dict có kiểu với `messages`, `step`, `route`, `output`, `human_approval`.
- `Node` — callable nhận trạng thái và trả về một dict cập nhật.
- `StateGraph` — các nút + các cạnh + các cạnh có điều kiện + chạy + tiếp tục.
- `SQLiteCheckpointer` (bản giả trong bộ nhớ) — tuần tự hóa trạng thái sau mỗi nút; `load(session_id)` khôi phục.
- Một đồ thị demo: phân loại -> phân nhánh(hoàn tiền / lỗi / bán hàng) -> cổng con người -> gửi.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy lần chạy đầu tiên thất bại tại cổng con người, lưu giữ, rồi tiếp tục tạo ra đầu ra cuối cùng.

## Use It

- **LangGraph** — tham chiếu, sẵn sàng cho sản xuất. Sử dụng `create_react_agent`, `create_supervisor` hoặc xây đồ thị của riêng bạn.
- **AutoGen v0.4** (Bài 14) — lựa chọn mô hình actor cho các kịch bản có tính đồng thời cao.
- **Claude Agent SDK** (Bài 17) — harness được quản lý với kho phiên tích hợp sẵn.
- **Tùy chỉnh** — khi bạn cần kiểm soát chính xác hình dạng trạng thái hoặc backend bộ tạo checkpoint.

## Ship It

`outputs/skill-state-graph.md` tạo một đồ thị trạng thái có dạng LangGraph trong bất kỳ runtime đích nào với tạo checkpoint và tiếp tục được nối sẵn.

## Exercises

1. Thêm một cạnh có điều kiện từ `classify` đến `end` khi độ tin cậy phân loại dưới một ngưỡng. Tiếp tục lần chạy sau khi một con người đặt `route` thủ công.
2. Thay bản giả giống SQLite bằng một bộ tạo checkpoint SQLite thực. Đo chi phí phụ tuần tự hóa cho từng bước.
3. Triển khai các cạnh song song: hai nút chạy đồng thời, hợp nhất bằng một reducer tùy chỉnh. Trạng thái bất biến mang lại gì ở đây?
4. Đọc tài liệu tham chiếu `langgraph-supervisor`. Chuyển bản mô phỏng sang `create_supervisor`. So sánh các hình dạng trace.
5. Thêm streaming: mỗi nút yield trạng thái một phần trong khi nó chạy. In các delta khi chúng đến.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| State graph (Đồ thị trạng thái) | "Agent như máy trạng thái" | Trạng thái có kiểu + các nút + các cạnh + các reducer |
| Checkpointer (Bộ tạo checkpoint) | "Backend lưu giữ" | Tuần tự hóa trạng thái sau mỗi nút; cho phép tiếp tục |
| Reducer (Bộ hợp nhất) | "Bộ hợp nhất trạng thái" | Hàm kết hợp trạng thái hiện tại với cập nhật của một nút |
| Conditional edge (Cạnh có điều kiện) | "Nhánh" | Cạnh được chọn bởi một hàm của trạng thái |
| Subgraph (Đồ thị con) | "Đồ thị lồng nhau" | Một đồ thị được sử dụng như một nút bên trong một đồ thị khác |
| Durable execution (Thực thi bền vững) | "Tiếp tục từ thất bại" | Khởi động lại tại nút thành công cuối cùng với trạng thái chính xác |
| Supervisor (Bộ giám sát) | "LLM định tuyến" | Bộ phân phối trung tâm cho các agent phụ chuyên gia |
| Swarm (Bầy đàn) | "Các agent P2P" | Các agent bàn giao qua các công cụ dùng chung; không có bộ định tuyến trung tâm |

## Further Reading

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — tài liệu tham chiếu
- [langgraph-supervisor reference](https://reference.langchain.com/python/langgraph/supervisor/) — API mẫu giám sát
- [AutoGen v0.4, Microsoft Research](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — lựa chọn mô hình actor
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — kho phiên và các agent phụ
