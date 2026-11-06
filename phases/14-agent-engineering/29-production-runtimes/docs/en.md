# Production Runtimes: Queue, Event, Cron

> Các agent sản xuất chạy trên sáu hình dạng runtime: yêu cầu-phản hồi, streaming, thực thi bền vững, nền dựa trên hàng đợi, hướng sự kiện và được lập lịch. Chọn hình dạng trước khi bạn chọn framework. Khả năng quan sát là trụ cột ở mọi hình dạng.

**Type:** Learn
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 13 (LangGraph), Phase 14 · 22 (Voice)
**Time:** ~60 minutes

## Learning Objectives

- Nêu tên sáu hình dạng runtime sản xuất và ghép mỗi hình dạng với một mẫu framework / sản phẩm.
- Giải thích vì sao thực thi bền vững (LangGraph) quan trọng cho các tác vụ tầm dài.
- Mô tả runtime hướng sự kiện và khi nào Claude Managed Agents phù hợp.
- Giải thích tuyên bố khả năng quan sát là trụ cột đối với các agent nhiều bước.

## The Problem

Các agent sản xuất thất bại theo những cách mà một notebook Jupyter không phơi bày: hết thời gian chờ mạng ở bước 37, người dùng cúp máy giữa cuộc gọi giọng nói, job cron chết khi máy khởi động lại, worker nền hết bộ nhớ. Hình dạng runtime quyết định những lỗi nào có thể sống sót qua.

## The Concept

### Request-response

- HTTP đồng bộ. Người dùng chờ hoàn thành.
- Chỉ khả thi cho các tác vụ ngắn (<30 giây).
- Các stack: Agno (Python + FastAPI), Mastra (TypeScript + Express/Hono/Fastify/Koa).
- Khả năng quan sát: các log truy cập HTTP tiêu chuẩn + các span OTel.

### Streaming

- SSE hoặc WebSocket cho đầu ra dần dần.
- LiveKit mở rộng điều này sang WebRTC cho giọng nói/video (Bài 22).
- Các stack: bất kỳ framework nào có hỗ trợ streaming + một frontend xử lý SSE/WS.
- Khả năng quan sát: thời gian cho từng phần, độ trễ token đầu tiên, độ trễ đuôi.

### Durable execution

- Trạng thái được tạo checkpoint sau mỗi bước; tự tiếp tục khi thất bại.
- Mô hình actor AutoGen v0.4 cô lập các lỗi vào một agent (Bài 14).
- Điểm khác biệt cốt lõi của LangGraph (Bài 13).
- Thiết yếu khi không biết số bước và chi phí phục hồi cao.

### Queue-based / background

- Job đi vào một hàng đợi, các worker nhận, các kết quả chảy trở lại qua webhook hoặc pub/sub.
- Thiết yếu cho các agent tầm dài (hàng chục đến hàng trăm bước cho mỗi tác vụ, theo công bố sử dụng máy tính của Anthropic).
- Các stack: Celery (Python), BullMQ (Node), SQS + Lambda (AWS), tùy chỉnh.
- Khả năng quan sát: độ sâu hàng đợi, phân phối độ trễ cho từng job, kích thước DLQ.

### Event-driven

- Các agent đăng ký các kích hoạt: email mới, PR được mở, cron kích hoạt.
- Claude Managed Agents bao phủ sẵn điều này (Bài 17).
- CrewAI Flows (Bài 15) cấu trúc các workflow hướng sự kiện mang tính xác định.
- Khả năng quan sát: nguồn kích hoạt, độ trễ từ sự kiện đến bắt đầu, độ trễ agent.

### Scheduled

- Các agent có dạng cron chạy định kỳ.
- Kết hợp với thực thi bền vững để một lần chạy ban đêm thất bại tiếp tục ở nhịp tiếp theo.
- Các stack: Kubernetes CronJob + một framework bền vững; được host (Render cron, Vercel cron).

### 2026 deployment patterns

- **CrewAI Flows** cho sản xuất hướng sự kiện.
- **Agno** FastAPI không trạng thái cho các microservice Python.
- Các bộ điều hợp máy chủ **Mastra** (Express, Hono, Fastify, Koa) để nhúng.
- **Pipecat Cloud / LiveKit Cloud** cho giọng nói được quản lý (Bài 22).
- **Claude Managed Agents** cho bất đồng bộ chạy lâu được host.

### Observability is load-bearing

Không có các span OpenTelemetry GenAI (Bài 23) cộng một backend Langfuse/Phoenix/Opik (Bài 24), bạn không thể gỡ lỗi một agent nhiều bước thất bại ở bước 40. Điều này không phải tùy chọn cho sản xuất. Đó là khác biệt giữa "chúng tôi gỡ lỗi nhanh" và "chúng tôi phát lại từ đầu với nhiều ghi log hơn."

### Where production runtimes fail

- **Lựa chọn hình dạng sai.** Chọn yêu cầu-phản hồi cho một tác vụ 5 phút. Người dùng cúp máy; các worker chồng chất; các lần thử lại dồn thêm.
- **Không có DLQ.** Các worker hàng đợi không có hàng đợi thông điệp lỗi. Các job thất bại biến mất.
- **Công việc nền mờ đục.** Agent nền chạy mà không xuất trace. Các lỗi vô hình cho đến khi người dùng báo cáo chúng.
- **Bỏ qua trạng thái bền vững.** Bất kỳ lần chạy nào > 30 giây mà bạn không thể chấp nhận khởi động lại đều cần thực thi bền vững.

```figure
wb-runtime-shapes
```

## Build It

`code/main.py` là một demo nhiều hình dạng dùng thư viện chuẩn:

- Endpoint yêu cầu-phản hồi (hàm thuần).
- Bộ xử lý streaming (generator).
- Worker dựa trên hàng đợi với DLQ.
- Sổ đăng ký kích hoạt sự kiện.
- Bộ lập lịch có dạng cron.

Chạy nó:

```bash
python3 code/main.py
```

Đầu ra: năm trace cho thấy hành vi của mỗi hình dạng trên cùng tác vụ. Cùng logic agent, các lớp vỏ ngoài khác nhau. Thực thi bền vững (hình dạng thứ sáu) được chủ ý bao phủ trong Bài 13 với tạo checkpoint LangGraph.

## Use It

- **Yêu cầu-phản hồi** cho UX kiểu trò chuyện.
- **Streaming** cho các phản hồi dần dần.
- **Bền vững** cho các tác vụ tầm dài.
- **Hàng đợi** cho theo lô / bất đồng bộ / chạy lâu.
- **Sự kiện** cho khả năng phản ứng của agent.
- **Cron** cho bảo trì (hợp nhất bộ nhớ, đánh giá, các báo cáo chi phí).

## Ship It

`outputs/skill-runtime-shape.md` chọn một hình dạng runtime cho một tác vụ và nối các yêu cầu khả năng quan sát.

## Exercises

1. Chuyển vòng lặp ReAct Bài 01 của bạn sang cả sáu hình dạng trong stack của bạn. Hình dạng nào phù hợp bề mặt sản phẩm nào?
2. Thêm một DLQ vào demo dựa trên hàng đợi. Mô phỏng 10% job thất bại; hiển thị kích thước DLQ.
3. Viết một agent đánh giá được kích hoạt bằng cron chạy hàng đêm đối với 20 trace hàng đầu của bạn trong ngày.
4. Triển khai streaming với áp lực ngược: nếu client chậm, tạm dừng agent. Điều này tương tác với một ngân sách lượt như thế nào?
5. Đọc tài liệu Claude Managed Agents. Khi nào bạn sẽ chuyển một agent tầm dài tự host sang được quản lý?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Request-response (Yêu cầu-phản hồi) | "Đồng bộ" | Người dùng chờ; chỉ các tác vụ ngắn |
| Streaming (Truyền luồng) | "SSE / WS" | Đầu ra dần dần; UX tốt hơn; độ trễ có thể quan sát cho từng phần |
| Durable execution (Thực thi bền vững) | "Tiếp tục từ thất bại" | Trạng thái được tạo checkpoint; khởi động lại tại bước cuối |
| Queue-based (Dựa trên hàng đợi) | "Các job nền" | Bộ tạo / nhóm worker / DLQ |
| Event-driven (Hướng sự kiện) | "Dựa trên kích hoạt" | Agent phản ứng với các sự kiện bên ngoài |
| DLQ | "Hàng đợi thông điệp lỗi" | Chỗ đỗ cho các job thất bại |
| Claude Managed Agents | "Harness được host" | Bất đồng bộ chạy lâu được Anthropic host với lưu đệm + cô đọng |

## Further Reading

- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — các chi tiết thực thi bền vững
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — bất đồng bộ chạy lâu được host
- [Anthropic, Introducing computer use](https://www.anthropic.com/news/3-5-models-and-computer-use) — "hàng chục đến hàng trăm bước cho mỗi tác vụ"
- [AutoGen v0.4 (Microsoft Research)](https://www.microsoft.com/en-us/research/articles/autogen-v0-4-reimagining-the-foundation-of-agentic-ai-for-scale-extensibility-and-robustness/) — cô lập lỗi mô hình actor
