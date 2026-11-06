# Long-Running Background Agents: Durable Execution

> Các agent có tầm thời gian dài trong môi trường sản xuất không chạy trong `while True`. Mỗi lệnh gọi LLM trở thành một hoạt động có checkpoint, thử lại, và phát lại. Tích hợp OpenAI Agents SDK của Temporal chuyển sang GA vào tháng 3 năm 2026. Claude Code Routines (Anthropic) chạy các lần gọi Claude Code theo lịch mà không có tiến trình cục bộ bền vững. Các phiên tạm dừng khi cần đầu vào từ con người, tồn tại qua các lần triển khai, và tiếp tục từ checkpoint mới nhất được định khóa bằng `thread_id`. Đằng sau sự tiện dụng mới là một mẫu cũ — điều phối quy trình — với một đầu vào mới: các lệnh gọi LLM dưới dạng các hoạt động không xác định phải được phát lại một cách xác định khi phục hồi.

**Type:** Learn
**Languages:** Python (stdlib, minimal durable-execution state machine)
**Prerequisites:** Phase 15 · 10 (Permission modes), Phase 15 · 01 (Long-horizon agents)
**Time:** ~60 minutes

## The Problem

Xét một agent chạy trong bốn giờ. Nó gọi ba công cụ, nhắc người dùng hai lần, và thực hiện bốn mươi lệnh gọi LLM. Đến nửa chừng, máy chủ nó đang chạy trên đó khởi động lại. Điều gì xảy ra?

- Trong một vòng lặp `while True` ngây thơ: mọi thứ bị mất. Lần chạy bắt đầu lại từ đầu. Ba lệnh gọi công cụ (với các tác dụng phụ thực) thực thi lại. Người dùng được nhắc lại về những điều họ đã phê duyệt. Bốn mươi lệnh gọi LLM bị tính phí lại.
- Với thực thi bền vững: lần chạy tiếp tục từ checkpoint gần nhất. Các hoạt động đã hoàn thành không được thực thi lại; kết quả của chúng được phát lại từ nhật ký bền vững. Người dùng không phê duyệt lại những điều họ đã phê duyệt. Các lệnh gọi LLM đã thực hiện không bị tính phí lại.

Đây là cùng mẫu mà các engine quy trình đã cung cấp trong một thập kỷ (Temporal, Cadence, Cherami của Uber). Điều mới là các lệnh gọi LLM giờ đây là một loại hoạt động — không xác định, tốn kém, có tác dụng phụ — và chúng phù hợp gọn gàng với mẫu này.

Chủ đề xuyên suốt bài học: độ tin cậy ở tầm thời gian dài suy giảm (METR quan sát thấy “sự suy giảm 35 phút” — tỷ lệ thành công giảm gần theo bậc hai với tầm thời gian). Thực thi bền vững cho phép các lần chạy dài hơn mức hồ sơ độ tin cậy hỗ trợ, là một cách mới để thất bại an toàn nếu thiết kế đúng và không an toàn nếu thiết kế sai.

## The Concept

### Activities, workflows, and replay

- **Quy trình**: mã điều phối xác định. Định nghĩa chuỗi hoạt động, các nhánh, các lần chờ. Phải xác định để có thể phát lại từ nhật ký sự kiện mà không có phân kỳ bất ngờ.
- **Hoạt động**: một đơn vị công việc không xác định, có khả năng thất bại. Lệnh gọi LLM, lệnh gọi công cụ, ghi file, yêu cầu HTTP. Mỗi hoạt động được ghi nhật ký với đầu vào và (khi hoàn thành) đầu ra.
- **Nhật ký sự kiện**: kho lưu trữ nền bền vững. Mọi lần bắt đầu, hoàn thành, thất bại, thử lại hoạt động, và mọi quyết định quy trình đều được ghi lại.
- **Phát lại**: khi phục hồi, mã quy trình chạy lại từ đầu; mọi hoạt động đã hoàn thành trả về kết quả đã ghi nhật ký mà không thực thi lại. Chỉ những hoạt động chưa hoàn thành mới thực sự được chạy.

Điều này có cùng hình dạng với việc React hiển thị lại dựa trên DOM ảo, hoặc Git xây dựng lại cây làm việc từ các commit. Tính xác định trong bộ điều phối là điều làm cho tính bền vững trở nên rẻ.

### Why LLM calls fit the pattern

Các lệnh gọi LLM là:
- Không xác định (temperature > 0; ngay cả temperature 0 cũng trôi qua các phiên bản mô hình).
- Tốn kém (tiền và độ trễ).
- Có khả năng thất bại (giới hạn tốc độ, hết thời gian chờ).
- Có tác dụng phụ (nếu chúng gọi công cụ).

Đây chính xác là hồ sơ hoạt động. Bọc mỗi lệnh gọi LLM thành một hoạt động mang lại cho bạn thử lại với thời gian chờ tăng theo cấp số nhân, tạo checkpoint qua các lần khởi động lại, và một dấu vết có thể phát lại để gỡ lỗi.

### Checkpoints keyed by `thread_id`

LangGraph, Microsoft Agent Framework, Cloudflare Durable Objects, và Claude Code Routines đều hội tụ về cùng một hình dạng API: một `thread_id` (hoặc tương đương) định danh phiên; mỗi chuyển trạng thái lưu bền vững vào một backend (PostgreSQL mặc định, SQLite cho phát triển, Redis cho bộ nhớ đệm); việc tiếp tục đọc checkpoint mới nhất.

Lựa chọn backend có ý nghĩa:

- **PostgreSQL**: bền vững, có thể truy vấn, tồn tại qua các lần triển khai. Mặc định cho LangGraph.
- **SQLite**: chỉ phát triển cục bộ; mất dữ liệu giữa các máy chủ.
- **Redis**: nhanh nhưng tạm thời trừ khi AOF/snapshot được cấu hình.
- **Cloudflare Durable Objects**: phân tán trong suốt; được giới hạn phạm vi bằng một khóa duy nhất; tồn tại từ hàng giờ đến hàng tuần.

### Human-input as a first-class state

Đề xuất rồi cam kết (Bài 15) yêu cầu một trạng thái “đang chờ con người” bền vững. Quy trình tạm dừng, hàng đợi bên ngoài giữ yêu cầu đang chờ, và một phê duyệt tiếp tục từ đúng điểm đó. Không có tính bền vững, đây là nỗ lực tối đa; có nó, một phê duyệt đến qua đêm và quy trình tiếp tục vào buổi sáng.

### The 35-minute degradation

METR quan sát thấy mọi loại agent được đo đều cho thấy sự suy giảm độ tin cậy sau ~35 phút hoạt động liên tục. Tăng gấp đôi thời lượng tác vụ làm tỷ lệ thất bại tăng gần gấp bốn. Thực thi bền vững không sửa điều này; nó cho phép bạn chạy lâu hơn mức hồ sơ độ tin cậy hỗ trợ. Mẫu an toàn là kết hợp tính bền vững với các checkpoint yêu cầu HITL mới khi vào lại, và với các công tắc ngắt ngân sách (Bài 13) giới hạn tổng tính toán bất kể thời gian thực trôi qua.

### When durable execution is the wrong answer

- Các lần chạy ngắn hơn vài phút không có đầu vào từ con người. Chi phí phụ > lợi ích.
- Truy xuất thông tin chỉ đọc nghiêm ngặt.
- Các tác vụ mà tính đúng đắn yêu cầu đầu cuối trong một cửa sổ ngữ cảnh (một số tác vụ suy luận; một số lần sinh một lượt).

```figure
memory-consolidation
```

## Use It

`code/main.py` triển khai một engine thực thi bền vững tối thiểu bằng thư viện chuẩn Python. Nó hỗ trợ:

- Decorator `@activity` ghi nhật ký đầu vào và đầu ra vào một nhật ký sự kiện JSON.
- Một hàm quy trình sắp xếp tuần tự các hoạt động.
- Một hàm `run_or_replay(workflow, event_log)` phát lại các hoạt động đã hoàn thành mà không thực thi lại chúng.

Trình điều khiển mô phỏng một quy trình ba hoạt động, gặp sự cố giữa chừng, và cho thấy (a) một lần thử lại ngây thơ thực thi lại mọi thứ so với (b) một lần phát lại chỉ chạy hoạt động còn thiếu.

## Ship It

`outputs/skill-durable-execution-review.md` xem xét một triển khai agent chạy dài được đề xuất về hình dạng thực thi bền vững đúng: các hoạt động, tính xác định, backend checkpoint, trạng thái đầu vào từ con người, và chính sách HITL khi tiếp tục.

## Exercises

1. Chạy `code/main.py`. Quan sát sự khác biệt về số lần thực thi hoạt động giữa thử lại ngây thơ và phát lại. Thay đổi điểm gặp sự cố và cho thấy số lần phát lại thay đổi tương ứng.

2. Chuyển engine đồ chơi sang sử dụng `thread_id` tường minh. Mô phỏng hai phiên đồng thời dùng chung engine và xác nhận các nhật ký sự kiện của chúng không va chạm.

3. Lấy một hoạt động trong engine đồ chơi. Đưa vào một yếu tố không xác định (một dấu thời gian thực bên trong một quyết định quy trình). Minh họa sự phân kỳ khi phát lại. Giải thích cách các engine thực xử lý điều này (đăng ký tác dụng phụ, các API `Workflow.now()`).

4. Đọc bài viết “Runtime behind production deep agents” của LangChain. Liệt kê mọi trạng thái mà môi trường chạy lưu bền vững và nêu mỗi trạng thái bao phủ chế độ lỗi nào.

5. Thiết kế một chính sách checkpoint cho một tác vụ lập trình tự chủ 6 giờ. Bạn tạo checkpoint ở đâu? Tiếp tục khi gặp sự cố trông như thế nào? Điều gì yêu cầu HITL mới?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| Workflow (Quy trình) | “Script của agent” | Mã điều phối xác định; có thể phát lại từ nhật ký sự kiện |
| Activity (Hoạt động) | “Một bước” | Đơn vị không xác định (lệnh gọi LLM, lệnh gọi công cụ); được ghi nhật ký trước và sau |
| Event log (Nhật ký sự kiện) | “Kho lưu trữ nền” | Bản ghi bền vững của mọi chuyển trạng thái |
| Replay (Phát lại) | “Tiếp tục” | Chạy lại quy trình; các hoạt động đã hoàn thành trả về kết quả đã ghi nhật ký mà không thực thi lại |
| Checkpoint (Điểm kiểm tra) | “Điểm lưu” | Trạng thái được lưu bền vững định khóa bằng thread_id; mới nhất thắng khi tiếp tục |
| thread_id | “Khóa phiên” | Định danh giới hạn phạm vi trạng thái bền vững |
| 35-minute degradation (Sự suy giảm 35 phút) | “Suy giảm độ tin cậy” | METR: tỷ lệ thành công giảm ~theo bậc hai với tầm thời gian |
| Non-determinism (Tính không xác định) | “Trôi khi phát lại” | Thời gian thực, ngẫu nhiên, đầu ra LLM; phải được đăng ký dưới dạng tác dụng phụ |

## Further Reading

- [Anthropic — Claude Code Agent SDK: agent loop](https://code.claude.com/docs/en/agent-sdk/agent-loop) — ngân sách, lượt, và ngữ nghĩa tiếp tục.
- [Microsoft — Agent Framework: human-in-the-loop and checkpointing](https://learn.microsoft.com/en-us/agent-framework/workflows/human-in-the-loop) — hình dạng RequestInfoEvent.
- [LangChain — The Runtime Behind Production Deep Agents](https://www.langchain.com/conceptual-guides/runtime-behind-production-deep-agents) — các yêu cầu môi trường chạy cụ thể.
- [OpenAI Agents SDK + Temporal integration (Trigger.dev announcement)](https://trigger.dev) — hình dạng hoạt động cho các lệnh gọi LLM.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — tham chiếu sự suy giảm 35 phút.
