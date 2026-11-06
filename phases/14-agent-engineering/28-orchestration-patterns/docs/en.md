# Orchestration Patterns: Supervisor, Swarm, Hierarchical

> Bốn mẫu điều phối tái diễn xuyên các framework năm 2026: bộ giám sát-worker, bầy đàn / ngang hàng, phân cấp, tranh luận. Hướng dẫn của Anthropic: "Đó là về xây dựng hệ thống phù hợp với nhu cầu của bạn." Bắt đầu đơn giản; chỉ thêm cấu trúc khi một agent đơn cộng năm mẫu workflow là không đủ.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 12 (Workflow Patterns), Phase 14 · 25 (Multi-Agent Debate)
**Time:** ~60 minutes

## Learning Objectives

- Nêu tên bốn mẫu điều phối tái diễn và khi nào mỗi mẫu phù hợp.
- Mô tả khuyến nghị LangChain năm 2026: giám sát dựa trên lời gọi công cụ so với các thư viện giám sát.
- Giải thích quy tắc "xây dựng hệ thống phù hợp" của Anthropic và cách nó kiểm soát lựa chọn cấu trúc.
- Triển khai cả bốn bằng thư viện chuẩn với một LLM được viết kịch bản chung.

## The Problem

Các nhóm chọn "nhiều agent" trước khi họ cần nó. Bốn mẫu tái diễn xuyên các framework; khi bạn có thể gọi tên chúng, bạn có thể chọn đúng mẫu — hoặc bỏ qua cấu trúc hoàn toàn.

## The Concept

### Supervisor-worker

- Một LLM định tuyến trung tâm phân phối đến các agent chuyên gia.
- Quyết định: lặp lại về chính nó, bàn giao cho chuyên gia, kết thúc.
- Các chuyên gia không nói chuyện với nhau; mọi định tuyến đi qua bộ giám sát.

Các framework: `create_supervisor` LangGraph, bộ điều phối-worker Anthropic, Process Hierarchical CrewAI.

**Khuyến nghị LangChain năm 2026:** thực hiện giám sát qua các lời gọi công cụ trực tiếp thay vì `create_supervisor`. Cho quyền kiểm soát kỹ thuật ngữ cảnh tinh hơn — bạn quyết định chính xác mỗi chuyên gia nhìn thấy gì.

### Swarm / peer-to-peer

- Các agent bàn giao trực tiếp qua một bề mặt công cụ dùng chung.
- Không có bộ định tuyến trung tâm.
- Độ trễ thấp hơn bộ giám sát (ít chặng hơn).
- Khó suy luận hơn (không có điểm kiểm soát duy nhất).

Các framework: cấu trúc bầy đàn LangGraph, các bàn giao OpenAI Agents SDK (khi mọi agent có thể bàn giao cho tất cả các agent khác).

### Hierarchical

- Các bộ giám sát quản lý các bộ giám sát con quản lý các worker.
- Được triển khai dưới dạng các đồ thị con lồng nhau trong LangGraph; các crew lồng nhau trong CrewAI.
- Mở rộng đến các quần thể agent lớn với chi phí phức tạp vận hành.

Khi bạn cần nó: khi ngân sách ngữ cảnh của một bộ giám sát đơn không thể chứa các mô tả của mọi chuyên gia.

### Debate

- Các bộ đề xuất song song + phê bình chéo lặp (Bài 25).
- Không thực sự là điều phối — thiên về xác minh hơn — nhưng xuất hiện như một lựa chọn cấu trúc trong các framework.

### Autonomous crews vs deterministic flows

CrewAI hình thức hóa hai chế độ triển khai:

- **Flow** cho tự động hóa hướng sự kiện mang tính xác định (điểm bắt đầu được khuyến nghị cho sản xuất).
- **Crew** cho hợp tác tự chủ dựa trên vai trò.

Điều này trực giao với bốn mẫu ở trên nhưng ánh xạ sang cấu trúc: Flow thường là giám sát hoặc phân cấp; Crew thường là giám sát với một bộ định tuyến LLM.

### Anthropic's guidance

"Thành công trong không gian LLM không phải là về xây dựng hệ thống tinh vi nhất. Đó là về xây dựng hệ thống phù hợp với nhu cầu của bạn."

Thứ tự quyết định:

1. Một agent đơn + các mẫu workflow (Bài 12) — bắt đầu ở đây.
2. Bộ giám sát-worker — khi bạn có 2-4 chuyên gia.
3. Bầy đàn — khi độ trễ quan trọng hơn sự rõ ràng của suy luận.
4. Phân cấp — chỉ khi ngân sách ngữ cảnh bộ giám sát thất bại.
5. Tranh luận — khi độ chính xác quan trọng hơn chi phí.

### Where this pattern goes wrong

- **Tư duy cấu trúc trước.** "Chúng ta cần nhiều agent" trước khi xác định nhiều agent giải quyết vấn đề gì.
- **Các bàn giao bật qua lại trong bầy đàn.** A -> B -> A -> B. Sử dụng các bộ đếm chặng.
- **Phân cấp giả.** Ba lớp vì "doanh nghiệp"; hai nhóm thực tế. Gộp lại.

```figure
orchestration-pattern
```

## Build It

`code/main.py` triển khai cả bốn mẫu bằng thư viện chuẩn với một LLM được viết kịch bản:

- `Supervisor` — bộ định tuyến trung tâm.
- `Swarm` — ngang hàng với các bàn giao trực tiếp.
- `Hierarchical` — các bộ giám sát của các bộ giám sát.
- `Debate` — các bộ đề xuất song song + phê bình.

Mỗi mẫu xử lý cùng một tác vụ ba ý định (hoàn tiền / lỗi / bán hàng). Các hình dạng trace khác nhau.

Chạy nó:

```
python3 code/main.py
```

Đầu ra: trace cho từng mẫu + số thao tác. Giám sát rõ ràng nhất; bầy đàn ngắn nhất; phân cấp sâu nhất; tranh luận đắt nhất.

## Use It

- **LangGraph** cho giám sát và phân cấp (các đồ thị con lồng nhau).
- **OpenAI Agents SDK** cho các bàn giao như công cụ (có dạng giám sát).
- **CrewAI Flow** cho sản xuất mang tính xác định.
- **Tùy chỉnh** cho tranh luận hoặc khi bạn muốn kiểm soát chính xác.

## Ship It

`outputs/skill-orchestration-picker.md` chọn một cấu trúc và triển khai nó.

## Exercises

1. Chuyển một bộ giám sát-worker thành một bầy đàn bằng cách loại bỏ bộ định tuyến. Điều gì hỏng? Điều gì cải thiện?
2. Thêm một bộ đếm chặng vào bầy đàn: từ chối sau 3 bàn giao. Nó có bắt được sự bật qua lại A->B->A không?
3. Xây một hệ thống phân cấp hai mức cho một miền 12 chuyên gia. Ngân sách ngữ cảnh thất bại ở đâu nếu không lồng nhau?
4. Đo hiệu năng bốn mẫu trên một khối lượng công việc có dạng sản xuất. Mẫu nào thắng trên thước đo nào (độ trễ, chi phí, độ chính xác, khả năng gỡ lỗi)?
5. Đọc bài đăng "Building Effective Agents" của Anthropic. Ánh xạ mỗi luồng sản xuất của bạn vào một trong bốn mẫu. Có luồng nào không ánh xạ rõ ràng không?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Supervisor-worker (Bộ giám sát-worker) | "Bộ định tuyến + các chuyên gia" | LLM trung tâm phân phối đến các chuyên gia; họ không nói chuyện với nhau |
| Swarm (Bầy đàn) | "Ngang hàng" | Các bàn giao trực tiếp qua các công cụ dùng chung; không có bộ định tuyến trung tâm |
| Hierarchical (Phân cấp) | "Các bộ giám sát của các bộ giám sát" | Các đồ thị con lồng nhau cho các quần thể lớn |
| Debate (Tranh luận) | "Bộ đề xuất + phê bình" | Các bộ đề xuất song song, phê bình chéo (Bài 25) |
| Tool-call-based supervision (Giám sát dựa trên lời gọi công cụ) | "Bộ giám sát không có thư viện" | Triển khai bộ giám sát như các lời gọi công cụ trực tiếp để kiểm soát ngữ cảnh |
| Crew (Đội) | "Nhóm tự chủ" | Chế độ hợp tác dựa trên vai trò của CrewAI |
| Flow (Luồng) | "Workflow mang tính xác định" | Chế độ sản xuất hướng sự kiện của CrewAI |

## Further Reading

- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — năm mẫu + agent so với workflow
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — giám sát, bầy đàn, phân cấp
- [CrewAI docs](https://docs.crewai.com/en/introduction) — Crew so với Flow
- [Du et al., Society of Minds (arXiv:2305.14325)](https://arxiv.org/abs/2305.14325) — mẫu tranh luận
