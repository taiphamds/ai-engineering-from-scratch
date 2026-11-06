# Parallel / Swarm / Networked Architectures

> Đối chiếu với bộ giám sát: không có bên quyết định trung tâm. Các agent đọc một bus sự kiện dùng chung, nhận công việc bất đồng bộ, ghi kết quả trở lại. LangGraph hỗ trợ tường minh “Kiến trúc bầy đàn” cho các môi trường phi tập trung, động. Matrix (arXiv:2511.21686) biểu diễn cả luồng điều khiển và dữ liệu dưới dạng các thông điệp được tuần tự hóa truyền qua các hàng đợi phân tán để loại bỏ nút thắt bộ điều phối. Đánh đổi là tường minh: tính xác định và khả năng truy vết để lấy khả năng mở rộng. Bầy đàn phù hợp với các tác vụ có nhiều bài toán con độc lập; nó không phù hợp với các tác vụ cần một kế hoạch mạch lạc duy nhất.

**Type:** Learn + Build
**Languages:** Python (stdlib, `threading`, `queue`)
**Prerequisites:** Phase 16 · 05 (Supervisor Pattern), Phase 16 · 04 (Primitive Model)
**Time:** ~75 minutes

## Problem

Bộ giám sát mở rộng tới một vài worker. Còn hàng trăm thì sao? Bản thân bộ giám sát trở thành nút thắt: mọi quyết định ai làm gì dồn qua một agent. Một bước lập kế hoạch chậm làm đình trệ toàn hệ thống.

Các kiến trúc bầy đàn lật thiết kế. Thay vì một bộ lập kế hoạch trung tâm phân công công việc, các worker nhận công việc từ một hàng đợi dùng chung. Sự “phối hợp” được tích hợp vào ngữ nghĩa bus sự kiện. Không có bộ điều phối; hệ thống mở rộng cho đến khi hàng đợi chạm giới hạn.

## Concept

### The shape

```
                ┌──── shared queue ────┐
                │                      │
       ┌────────┼────────┐  ◄──────┬───┘
       ▼        ▼        ▼         │
     Worker  Worker  Worker   Worker
      A       B       C        D
       │        │        │         │
       └────────┴────────┴─────────┘
                 │
                 ▼
            results pool
```

Không có bộ điều phối. Mỗi worker lặp lại: kéo một tác vụ, xử lý, ghi kết quả (và tùy chọn đưa các tác vụ tiếp nối vào hàng đợi).

### When swarm fits

- **Nhiều tác vụ độc lập.** Thu thập dữ liệu, biến đổi, phân loại. Các tác vụ không phụ thuộc nhau.
- **Công việc có thời lượng biến thiên.** Nếu một số tác vụ mất 100ms và những tác vụ khác mất 10s, một bầy đàn cân bằng tải tự động — các worker nhanh kéo công việc tiếp theo. Một bộ giám sát phải dự đoán thời lượng.
- **Thông lượng hơn tính xác định.** Bạn quan tâm tổng thời gian hoàn thành, không phải thứ tự nghiêm ngặt.

### When swarm fails

- **Các quy trình có thứ tự.** Nếu bước 3 cần đầu ra bước 2, một bầy đàn có nguy cơ bước 3 kích hoạt trước khi bước 2 xong.
- **Các tác vụ kế hoạch toàn cục.** Các câu hỏi nghiên cứu phức tạp hưởng lợi từ một bộ lập kế hoạch. Một bầy nhà nghiên cứu tạo ra các sự kiện độc lập, không phải một báo cáo mạch lạc.
- **Gỡ lỗi.** Không có một nhật ký trung tâm và với công việc bất đồng bộ, tái tạo một lỗi tốn kém.

### Matrix (arXiv:2511.21686)

Matrix là bài báo năm 2025 đưa bầy đàn tới kết luận tự nhiên: cả luồng điều khiển và luồng dữ liệu là các thông điệp được tuần tự hóa trên các hàng đợi phân tán. Không có bộ phối hợp trung tâm. Khả năng chịu lỗi đến từ tính bền vững thông điệp. Khả năng mở rộng là vấn đề của broker thông điệp, không phải của hệ thống.

Đóng góp: một mô hình lập trình nơi phối hợp đa agent là “agent này đăng ký chủ đề thông điệp nào?” thay vì “bộ giám sát chọn agent nào tiếp theo?” Điều này làm hệ thống trông như một lưới sự kiện pub/sub.

### Swarm in graph frameworks

Tài liệu LangGraph năm 2025 mô tả tường minh “Kiến trúc bầy đàn” như một trong các mẫu đa agent: các agent là các node, nhưng các cạnh tạo thành một đồ thị có hướng có chu trình và bất kỳ node nào cũng có thể được kích hoạt từ bể. Một worker chọn từ công việc có sẵn theo điều kiện, không phải theo phân công của bộ giám sát.

### Failure mode: starvation and hot-spotting

Nếu mọi worker kéo tác vụ có sẵn nhanh nhất, các tác vụ chạy dài không bao giờ được chọn cho đến khi chúng là những tác vụ duy nhất còn lại. Đói hàng đợi kinh điển.

Các biện pháp giảm thiểu:
- Các hàng đợi ưu tiên với lão hóa tường minh (tăng ưu tiên theo thời gian chờ).
- Chuyên biệt hóa worker: một số worker chỉ nhận các tác vụ “dài”.
- Áp lực ngược: giới hạn bao nhiêu tác vụ nhanh đi vào hàng đợi.

### The content-based routing link

Bầy đàn ghép tự nhiên với định tuyến dựa trên nội dung (Bài 22). Thay vì một hàng đợi chung, có một hàng đợi cho mỗi loại thông điệp. Các worker chuyên gia chỉ đăng ký loại của chúng. Đây là cơ sở cho các kiến trúc bus thông điệp mở rộng tới hàng nghìn agent.

```figure
sw-work-stealing
```

## Build It

`code/main.py` triển khai một bầy 4 luồng worker kéo từ một `queue.Queue` dùng chung. Các tác vụ có thời lượng biến thiên (một số nhanh, một số chậm). Demo đối chiếu:

- **Đường cơ sở tuần tự:** một worker xử lý mọi tác vụ nối tiếp.
- **Phân công cố định:** mỗi tác vụ được giao trước cho một worker cụ thể (kiểu bộ giám sát).
- **Bầy đàn:** các worker kéo từ một hàng đợi dùng chung.

Bầy đàn cân bằng tải tự động; phân công cố định để các worker nhanh nhàn rỗi khi tác vụ được giao của chúng chậm.

Chạy:

```
python3 code/main.py
```

Đầu ra cho thấy số tác vụ theo từng worker (bầy đàn phân phối không đều nhưng tối ưu) và thời gian thực trôi qua.

## Use It

`outputs/skill-swarm-fit.md` đánh giá liệu một tác vụ nên sử dụng bầy đàn hay bộ giám sát. Đầu vào: tính độc lập tác vụ, phương sai thời lượng, các yêu cầu thứ tự, các nhu cầu khả năng gỡ lỗi.

## Ship It

Danh sách kiểm tra:

- **Hàng đợi ưu tiên có lão hóa.** Ngăn đói tác vụ dài.
- **Tính lũy đẳng worker.** Một tác vụ có thể bị kéo nhiều hơn một lần nếu một worker gặp sự cố giữa lần chạy. Các worker phải lũy đẳng.
- **Hàng đợi bền vững.** Sử dụng Kafka, Redis Streams, hoặc một hàng đợi được cơ sở dữ liệu hỗ trợ cho sản xuất. `queue.Queue` chỉ nằm trong bộ nhớ.
- **Khả năng quan sát theo từng tác vụ.** Mọi tác vụ có một ID truy vết; mọi worker ghi nhật ký bắt đầu/kết thúc với nó.
- **Áp lực ngược.** Nếu hàng đợi tăng nhanh hơn các worker xử lý nó, làm chậm bên sản xuất.

## Exercises

1. Chạy `code/main.py`. Bầy đàn nhanh hơn tuần tự bao nhiêu trên khối lượng công việc có thời lượng biến thiên? Nhanh hơn phân công cố định bao nhiêu?
2. Thêm một biến thể hàng đợi ưu tiên (sử dụng `queue.PriorityQueue`). Gán ưu tiên theo trường “mức quan trọng” của tác vụ. Quan sát liệu các tác vụ ưu tiên thấp có bao giờ bị đói dưới tải liên tục hay không.
3. Triển khai một bộ phát hiện điểm nóng: ghi nhật ký khi bất kỳ worker nào xử lý nhiều tác vụ hơn 3× so với worker chậm nhất. Điều đó chỉ ra gì về phân phối thời lượng tác vụ?
4. Đọc tóm tắt và Phần 3 bài báo Matrix (arXiv:2511.21686). Xác định một đánh đổi cụ thể Matrix chấp nhận (tăng khả năng mở rộng) và một thứ nó từ bỏ (khả năng truy vết, tính xác định).
5. Chuyển demo bầy đàn sang sử dụng một `queue.Queue` gồm các tuple (task_type, payload), với các worker chỉ đăng ký các loại cụ thể. Các quy tắc định tuyến nào hợp lý khi các tác vụ không đồng nhất?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| Swarm architecture (Kiến trúc bầy đàn) | “Các agent phi tập trung” | Các worker kéo từ hàng đợi dùng chung; không có bộ điều phối trung tâm. |
| Event bus (Bus sự kiện) | “Các agent đăng ký các chủ đề” | Broker thông điệp định tuyến các tác vụ tới các worker theo loại hoặc nội dung. |
| Starvation (Đói) | “Tác vụ không bao giờ chạy” | Tác vụ ưu tiên thấp không bao giờ được chọn vì công việc ưu tiên cao hơn đến liên tục. |
| Hot-spotting (Tập trung điểm nóng) | “Một worker chìm” | Mất cân bằng tải nơi một worker nhận hầu hết tác vụ. |
| Back-pressure (Áp lực ngược) | “Làm chậm bên sản xuất” | Cơ chế báo hiệu thượng nguồn ngừng sản xuất khi hàng đợi đầy. |
| Idempotent worker (Worker lũy đẳng) | “An toàn để chạy lại” | Một tác vụ được xử lý hai lần tạo cùng kết quả. Bắt buộc vì các worker có thể gặp sự cố giữa lần chạy. |
| Durable queue (Hàng đợi bền vững) | “Tồn tại qua sự cố” | Hàng đợi được đĩa hoặc lưu trữ nhân bản hỗ trợ; các tác vụ không mất khi một worker gặp sự cố. |
| Matrix framework (Framework Matrix) | “Bầy đàn truyền thông điệp hoàn toàn” | Cả luồng dữ liệu và điều khiển là các thông điệp được tuần tự hóa trên các hàng đợi phân tán. |

## Further Reading

- [LangGraph workflows and agents — Swarm Architecture](https://docs.langchain.com/oss/python/langgraph/workflows-agents) — hỗ trợ bầy đàn tường minh
- [Matrix — A Decentralized Framework for Multi-Agent Systems](https://arxiv.org/abs/2511.21686) — bầy đàn truyền thông điệp hoàn toàn
- [Anthropic engineering — why supervisor not swarm in Research](https://www.anthropic.com/engineering/multi-agent-research-system) — vì sao một hệ thống sản xuất cụ thể chọn tường minh bộ giám sát thay cho bầy đàn
- [AutoGen v0.4 actor-model docs](https://microsoft.github.io/autogen/stable/) — bản viết lại actor hướng sự kiện, gần bầy đàn hơn GroupChat của v0.2
