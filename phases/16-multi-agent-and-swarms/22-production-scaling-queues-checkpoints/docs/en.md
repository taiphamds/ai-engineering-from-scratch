# Production Scaling — Queues, Checkpoints, Durability

> Mở rộng các hệ thống đa agent tới hàng nghìn lần chạy đồng thời yêu cầu **thực thi bền vững** — các hàng đợi công việc cộng với checkpoint, để bất kỳ worker nào có thể tiếp tục bất kỳ lần chạy nào sau bất kỳ sự cố nào, miễn là xử lý lease, các tác dụng phụ lũy đẳng, và phát lại xác định được áp dụng. Môi trường chạy LangGraph là ví dụ tham chiếu: nó ghi một checkpoint sau mỗi siêu bước được định khóa bằng `thread_id` (Postgres theo mặc định); các sự cố worker giải phóng một lease và một worker khác tiếp tục. Các agent có thể ngủ vô thời hạn chờ đầu vào con người. **MegaAgent** (arXiv:2408.09955) chạy một hàng đợi bên sản xuất-bên tiêu thụ theo từng agent với ba trạng thái (Nhàn rỗi / Đang xử lý / Phản hồi) và phối hợp hai lớp (trò chuyện trong nhóm + trò chuyện quản trị giữa các nhóm). **Fiber/async** vượt luồng cho mỗi công việc đối với truyền luồng LLM: các luồng nhàn rỗi 99% thời gian chờ token, các fiber nhường hợp tác trên I/O. Điểm đối trọng: “Scaling Agentic Software” của Ashpreet Bedi lập luận cho **FastAPI + Postgres + không gì khác** cho đến khi tải chứng minh ngược lại — các kiến trúc đơn giản đi xa hơn kỳ vọng. Bài này xây dựng một nhật ký checkpoint bền vững, một hàng đợi công việc theo từng agent với các chuyển trạng thái, một demo bất đồng bộ so với luồng, và khắc sâu quy tắc thực dụng “bắt đầu đơn giản”.

**Type:** Learn + Build
**Languages:** Python (stdlib, `asyncio`, `sqlite3`)
**Prerequisites:** Phase 16 · 09 (Parallel Swarm Networks), Phase 16 · 13 (Shared Memory)
**Time:** ~75 minutes

## Problem

Một hệ thống đa agent nguyên mẫu hoạt động trên một laptop với ba agent trong một vòng lặp sự kiện trong bộ nhớ. Bạn chuyển sang sản xuất:

- Các agent đôi khi chạy hàng giờ (nghiên cứu dài, các lần chờ con người trong vòng lặp).
- Các tiến trình worker gặp sự cố. Khởi động lại mất trạng thái.
- Tải đỉnh là 10x trung bình; bạn cần mở rộng ngang.
- Người dùng trả theo lần chạy agent; bạn cần ngữ nghĩa đúng một lần cho tính phí.

Vòng lặp sự kiện trong bộ nhớ không làm điều nào trong số này. Bạn cần một lớp thực thi bền vững bên dưới. Các lựa chọn chuẩn năm 2026 là:

1. Một engine quy trình có checkpoint (Temporal, môi trường chạy LangGraph).
2. Một hàng đợi thông điệp với một kho trạng thái (Postgres + SQS/RabbitMQ).
3. Các framework mô hình actor (bên sản xuất-bên tiêu thụ theo từng agent của MegaAgent).
4. FastAPI + Postgres tự viết (lập luận của Bedi).

Bài này xây dựng một bản thu nhỏ của mỗi loại.

## Concept

### Durable execution, the pattern

Một engine thực thi bền vững lưu bền vững toàn bộ trạng thái chương trình sau mỗi “bước” (siêu bước, theo ngôn ngữ LangGraph). Khi gặp sự cố:

```
worker crashes mid-step
  -> lease timeout
  -> another worker picks up the thread_id
  -> resumes from last checkpoint
  -> no duplicate side effects
```

Các yêu cầu để điều này hoạt động:

- **Trạng thái có thể tuần tự hóa.** Mọi trạng thái agent phải có thể lưu bền vững. Các closure hàm với các kết nối cơ sở dữ liệu đang hoạt động không tồn tại qua sự cố.
- **Tiếp tục xác định.** Với cùng trạng thái và cùng các đầu vào, agent tạo ra cùng các hành động (hoặc nhường cho một oracle xác định bên ngoài cho các lệnh gọi LLM).
- **Các tác dụng phụ lũy đẳng.** Các lệnh gọi bên ngoài (lệnh gọi công cụ, thanh toán) phải lũy đẳng hoặc sử dụng một khóa khử trùng lặp.

LangGraph ghi một checkpoint sau mỗi siêu bước; Temporal ghi sau mỗi hoạt động; Restate sử dụng các nhật ký theo event sourcing. Cả ba triển khai cùng mẫu.

### A checkpoint-per-step runtime

Môi trường chạy LangGraph là ví dụ được trình bày: mỗi agent có một `thread_id`; trạng thái là một dict có kiểu; mỗi siêu bước ghi một hàng vào bảng checkpoint. Khi tiếp tục, môi trường chạy phát lại từ checkpoint cuối cùng, không phải từ đầu. Các agent có thể `interrupt()` chờ đầu vào con người; môi trường chạy lưu bền vững và giải phóng worker. Khi đầu vào đến, bất kỳ worker nào có thể tiếp tục.

Đây là thiết kế sản xuất tham chiếu vào tháng 4 năm 2026.

### MegaAgent's per-agent queue

arXiv:2408.09955 mô tả một thí nghiệm quy mô: hàng nghìn agent đồng thời trong một cụm. Kiến trúc:

```
agent i:
  state ∈ {Idle, Processing, Response}
  in_queue   <- messages addressed to agent i
  out_queue  -> replies + side effects

coordinators:
  intra-group chat  (agents in the same group)
  inter-group admin chat  (high-level routing)
```

Phối hợp hai lớp cho phép hội thoại trong nhóm diễn ra dày đặc trong khi giữa các nhóm vẫn thưa — mẫu được dùng để giữ chi phí tuyến tính trong hàng nghìn agent.

### Async vs thread-per-job

Các lệnh gọi LLM bị giới hạn bởi I/O. Một luồng chờ token tiếp theo nhàn rỗi 99% thời gian. Các luồng tốn ~1MB RAM mỗi luồng; ở 10,000 lệnh gọi đồng thời, đó là 10GB chỉ cho các ngăn xếp.

Các fiber (Python `asyncio`, goroutine Go, Rust `tokio`) nhường hợp tác trên I/O. Cùng 10,000 lệnh gọi vừa thoải mái trong tiến trình. Ở quy mô agent LLM, bất đồng bộ không phải là một tối ưu hóa — nó là kiến trúc.

Ngoại lệ: hậu xử lý bị giới hạn bởi CPU (embedding, các mẹo tokenizer) vẫn muốn các luồng hoặc tiến trình. Tách lớp I/O khỏi lớp CPU.

### Bedi's counterpoint

“Scaling Agentic Software” (Ashpreet Bedi, 2026) lập luận rằng hầu hết các nhóm thiết kế quá mức trước khi đo tải. Mặc định thực dụng:

- FastAPI + Postgres.
- Mỗi lần chạy agent là một hàng; trạng thái cập nhật tại chỗ với đồng thời lạc quan.
- Các công việc nền qua `pg_notify` hoặc một worker Celery đơn giản.
- Chính sách thử lại trong mã ứng dụng.

Với tải dưới ~100 lần chạy agent đồng thời trên các tác vụ quản lý được, đây thường là tất cả những gì bạn cần. Nâng cấp khi bạn đo được nó thất bại.

Quy tắc: áp dụng các framework thực thi bền vững khi bạn chạm một vấn đề cụ thể mà các kiến trúc đơn giản không thể giải quyết. Áp dụng sớm đốt thời gian vào các thủ tục không đem lại lợi ích.

### Exactly-once semantics

Với các lần chạy agent trả phí, bạn cần “hiệu lực đúng một lần” (giao ít nhất một lần + bên tiêu thụ lũy đẳng). Các bước kỹ thuật:

- **Khóa khử trùng lặp theo từng lần chạy.** Bao gồm nó trong mọi lệnh gọi tác dụng phụ.
- **Mẫu outbox.** Các tác dụng phụ ghi vào một bảng trước, rồi một tiến trình riêng thực thi chúng. Cả hai bước lũy đẳng.
- **Các giao dịch bù trừ.** Khi một tác dụng phụ thành công nhưng lần ghi theo dõi của nó thất bại, lên lịch một bù trừ.

Đây là các mẫu kỹ thuật cơ sở dữ liệu, không riêng LLM. Thuế LLM chỉ là các lệnh gọi LLM chậm; mọi thứ khác là các hệ thống phân tán tiêu chuẩn.

### Rainbow deployment

Hệ thống nghiên cứu đa agent của Anthropic sử dụng “các triển khai cầu vồng”: nhiều phiên bản môi trường chạy agent chạy đồng thời để các agent chạy dài không phải bị ngắt trong mỗi lần triển khai mã. Thử canary các phiên bản mới trên một phần lưu lượng; loại các phiên bản cũ khi các agent của chúng kết thúc.

Đây là tiêu chuẩn cho các hệ thống có trạng thái chạy dài; điều chỉnh năm 2026 là các agent có thể tồn tại hàng giờ, nên các chu kỳ triển khai phải đáp ứng.

### The canonical production checklist

- Trạng thái bền vững (checkpoint, snapshot, hoặc outbox + nhật ký có thể phát lại).
- Các tác dụng phụ lũy đẳng.
- Lớp I/O bất đồng bộ cho các lệnh gọi LLM.
- Giao ít nhất một lần với khử trùng lặp.
- Triển khai cầu vồng/canary cho các khối lượng công việc có trạng thái.
- Khả năng quan sát: các dấu vết theo từng agent, kiểm toán siêu bước, bộ đếm thử lại.

```figure
sw-checkpoint-replay
```

## Build It

`code/main.py` triển khai:

- `CheckpointStore` — nhật ký checkpoint được SQLite hỗ trợ với các khóa id luồng. Mỗi siêu bước thêm một hàng.
- `run_with_checkpoint(agent, thread_id)` — mô phỏng một sự cố giữa lần chạy; một worker thứ hai tiếp tục từ checkpoint cuối.
- `AgentQueue` — máy trạng thái Nhàn rỗi / Đang xử lý / Phản hồi theo từng agent với một hàng đợi công việc nhỏ.
- `demo_async_vs_threads()` — chạy 500 “lệnh gọi LLM” mô phỏng đồng thời qua asyncio và qua các luồng; báo cáo thời gian thực và bộ nhớ đỉnh (xấp xỉ).

Chạy:

```
python3 code/main.py
```

Đầu ra kỳ vọng: tiếp tục checkpoint thành công sau sự cố mô phỏng; phiên bản bất đồng bộ xử lý 500 lệnh gọi đồng thời trong < 1s; phiên bản luồng mất vài giây và dùng bộ nhớ nhiều hơn nhiều bậc độ lớn cho mỗi đơn vị đồng thời.

## Use It

`outputs/skill-scaling-advisor.md` tư vấn lựa chọn thực thi bền vững: FastAPI + Postgres, môi trường chạy LangGraph, Temporal, hoặc tùy chỉnh. Được hiệu chuẩn theo tải, các nhu cầu lưu giữ trạng thái, và tần suất triển khai.

## Ship It

Gia cố sản xuất chuẩn:

- **Bắt đầu đơn giản (quy tắc Bedi).** FastAPI + Postgres cho đến khi bạn đo được nó thất bại.
- **Gắn đo lường mọi thứ trước khi tối ưu.** Histogram độ trễ theo từng lần chạy, thời gian theo từng bước, số lần thử lại, phân loại lỗi.
- **Mẫu outbox cho các tác dụng phụ.** Đặc biệt các thanh toán và lệnh gọi API bên ngoài.
- **Các triển khai cầu vồng.** Không bao giờ ngắt các lần chạy agent đang diễn ra trong các lần triển khai.
- **Áp dụng các engine thực thi bền vững (Temporal / LangGraph / Restate) khi** bạn chạm các vấn đề cụ thể: các lần chờ con người trong vòng lặp dài một giờ, phối hợp xuyên vùng, các chính sách thử lại/bù trừ phức tạp.
- **Bất đồng bộ cho lớp I/O.** Các luồng chỉ cho hậu xử lý bị giới hạn bởi CPU.

## Exercises

1. Chạy `code/main.py`. Xác nhận tiếp tục checkpoint hoạt động; đo khác biệt đồng thời bất đồng bộ so với luồng.
2. Triển khai một bảng **outbox**: mọi lệnh gọi công cụ ghi vào outbox trước, rồi một goroutine/tác vụ riêng thực thi. Xác minh tính lũy đẳng bằng cách chạy lệnh gọi công cụ hai lần.
3. Mô phỏng một **triển khai cầu vồng**: hai phiên bản môi trường chạy đồng thời; định tuyến nửa các thread_id mới tới mỗi phiên bản; xác nhận các luồng đang diễn ra trên phiên bản cũ không bị gián đoạn.
4. Đọc tài liệu môi trường chạy LangGraph (được liên kết bên dưới). Xác định các tính năng nào của môi trường chạy sẽ mất lâu nhất để tái tạo trong một phiên bản FastAPI + Postgres tự viết. Đó có phải lý do để áp dụng, hay bạn có thể hoãn?
5. Đọc MegaAgent (arXiv:2408.09955) Phần 3. Phối hợp hai lớp (trong nhóm + trò chuyện quản trị giữa các nhóm) là tường minh. Phác thảo cách bạn sẽ ánh xạ điều này tới một hàng đợi thông điệp với hai họ hàng đợi.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Durable execution (Thực thi bền vững) | “Lưu bền vững trạng thái chương trình” | Engine ghi trạng thái sau mỗi siêu bước; phục hồi sự cố là xác định. |
| Super-step (Siêu bước) | “Ranh giới giao dịch” | Đơn vị công việc giữa các checkpoint. Thuật ngữ LangGraph. |
| thread_id | “Định danh lần chạy agent” | Khóa gắn các checkpoint và logic tiếp tục. |
| Idempotency (Tính lũy đẳng) | “An toàn để thử lại” | Lặp một tác dụng phụ tạo cùng kết quả như một lần thử. |
| Outbox pattern (Mẫu outbox) | “Tách các tác dụng phụ” | Ghi ý định vào một bảng; một bộ thực thi riêng thực hiện và đánh dấu xong. |
| At-least-once delivery (Giao ít nhất một lần) | “Có thể trùng lặp” | Ngữ nghĩa hàng đợi thông điệp; khóa khử trùng lặp làm bên tiêu thụ có hiệu lực một lần. |
| Rainbow deploy (Triển khai cầu vồng) | “Các phiên bản chồng lấp” | Nhiều phiên bản môi trường chạy đồng thời trong các khối lượng công việc chạy dài. |
| Async fiber (Fiber bất đồng bộ) | “Nhường hợp tác” | Đồng thời chế độ người dùng; rẻ so với các luồng cho các tải bị giới hạn bởi I/O. |
| Checkpoint (Điểm kiểm tra) | “Snapshot trạng thái” | Trạng thái được tuần tự hóa tại một ranh giới siêu bước; chìa khóa cho tiếp tục. |

## Further Reading

- [LangChain — The runtime behind production deep agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) — thiết kế môi trường chạy LangGraph
- [MegaAgent](https://arxiv.org/abs/2408.09955) — hàng đợi bên sản xuất-bên tiêu thụ theo từng agent; phối hợp hai lớp ở hàng nghìn agent đồng thời
- [Matrix](https://arxiv.org/abs/2511.21686) — framework phi tập trung với các hàng đợi thông điệp làm nền tảng phối hợp
- [Temporal docs](https://docs.temporal.io/) — engine quy trình tham chiếu cho thực thi bền vững
- [Anthropic — Multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system) — các bài học sản xuất bao gồm triển khai cầu vồng
