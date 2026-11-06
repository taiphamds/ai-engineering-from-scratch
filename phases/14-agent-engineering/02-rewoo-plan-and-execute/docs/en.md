# ReWOO and Plan-and-Execute: Decoupled Planning

> ReAct đan xen suy nghĩ và hành động trong một luồng. ReWOO tách chúng ra: một kế hoạch lớn ngay từ đầu, rồi thực thi. Ít token hơn 5 lần, độ chính xác +4% trên HotpotQA, và bạn có thể chưng cất bộ lập kế hoạch vào một mô hình 7B. Plan-and-Execute khái quát hóa nó; Plan-and-Act mở rộng nó cho điều hướng web.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop)
**Time:** ~60 minutes

## Learning Objectives

- Giải thích vì sao sự phân tách Planner / Worker / Solver của ReWOO tiết kiệm token và cải thiện tính vững chắc so với vòng lặp đan xen của ReAct.
- Triển khai một DAG kế hoạch, một bộ thực thi theo thứ tự phụ thuộc và một bộ giải kết hợp đầu ra của worker — tất cả bằng thư viện chuẩn.
- Quyết định khi nào một tác vụ nên chạy theo kiểu lập kế hoạch rồi thực thi so với ReAct đan xen, sử dụng cách định khung "năm mẫu workflow" năm 2026 (Anthropic).
- Nhận biết khi nào dữ liệu kế hoạch tổng hợp của Plan-and-Act là cần thiết cho các tác vụ web hoặc di động có tầm dài.

## The Problem

Vòng lặp suy nghĩ-hành động-quan sát đan xen của ReAct đơn giản và linh hoạt, nhưng mỗi lời gọi công cụ phải mang toàn bộ ngữ cảnh trước đó — bao gồm mọi suy nghĩ trước đó. Mức sử dụng token tăng theo bậc hai với độ sâu. Tệ hơn: khi một công cụ thất bại giữa vòng lặp, mô hình phải suy ra lại toàn bộ kế hoạch từ quan sát lỗi.

ReWOO (Xu và cộng sự, arXiv:2305.18323, tháng 5 năm 2023) nhận thấy điều này và đặt cược: lập kế hoạch toàn bộ ngay từ đầu, lấy bằng chứng song song, kết hợp câu trả lời ở cuối. Một lời gọi LLM để lập kế hoạch, N lời gọi công cụ để lấy bằng chứng (có thể song song), một lời gọi LLM để giải. Sự đánh đổi là ít linh hoạt hơn (kế hoạch tĩnh) để có hiệu quả token tốt hơn nhiều và các chế độ lỗi rõ ràng hơn.

## The Concept

### The three roles

```
Planner:  user_question -> [plan_dag]
Workers:  [plan_dag]     -> [evidence]        (tool calls, possibly parallel)
Solver:   user_question, plan_dag, evidence -> final_answer
```

Planner tạo ra một DAG. Mỗi nút nêu tên một công cụ, các đối số của nó và những nút trước đó mà nó phụ thuộc vào (các tham chiếu như `#E1`, `#E2`). Các Worker thực thi các nút theo thứ tự tô pô. Solver ghép mọi thứ lại với nhau.

### Why 5x fewer tokens

ReAct tăng độ dài prompt tuyến tính với số bước. Ở bước 10, prompt chứa suy nghĩ 1 cộng hành động 1 cộng quan sát 1 cộng suy nghĩ 2 cộng hành động 2 cộng quan sát 2, và cứ thế. Mỗi bước trung gian cũng bao gồm prompt gốc một cách dư thừa.

ReWOO trả chi phí cho một prompt lập kế hoạch (lớn), N prompt worker nhỏ (mỗi prompt chỉ có lời gọi công cụ, không có chuỗi) và một prompt bộ giải. Trên HotpotQA, bài báo đo được ít token hơn ~5 lần trong khi đạt độ chính xác tuyệt đối +4.

### Why it is more robust

Nếu worker 3 thất bại trong ReAct, vòng lặp phải suy luận để thoát khỏi lỗi giữa luồng. Trong ReWOO, worker 3 trả về một chuỗi lỗi; bộ giải nhìn thấy nó trong ngữ cảnh với kế hoạch gốc và có thể suy giảm một cách êm ái. Định vị lỗi là theo từng nút, không phải từng bước.

### Planner distillation

Kết quả thứ hai của bài báo: vì bộ lập kế hoạch không nhìn thấy các quan sát, bạn có thể tinh chỉnh một mô hình 7B trên các đầu ra lập kế hoạch từ một mô hình giáo viên 175B. Mô hình nhỏ xử lý việc lập kế hoạch; mô hình lớn không cần thiết khi suy luận. Điều này hiện là tiêu chuẩn — nhiều agent sản xuất năm 2026 sử dụng một bộ lập kế hoạch nhỏ và một bộ thực thi lớn hoặc ngược lại.

### Plan-and-Execute (2023)

Bài đăng tháng 8 năm 2023 của nhóm LangChain khái quát hóa ReWOO thành một tên mẫu: Plan-and-Execute. Bộ lập kế hoạch đầu tiên phát ra một danh sách bước, bộ thực thi chạy từng bước, một bộ lập kế hoạch lại tùy chọn có thể chỉnh sửa sau khi quan sát các kết quả. Điều này gần ReAct hơn ReWOO (bộ lập kế hoạch lại đưa các quan sát trở lại việc lập kế hoạch) nhưng giữ lại phần tiết kiệm token.

### Plan-and-Act (Erdogan et al., arXiv:2503.09572, ICML 2025)

Plan-and-Act mở rộng mẫu này cho các agent web và di động có tầm dài. Đóng góp chính là dữ liệu kế hoạch tổng hợp: một bộ tạo quỹ đạo có nhãn tạo dữ liệu huấn luyện trong đó kế hoạch là tường minh. Được sử dụng để tinh chỉnh các mô hình lập kế hoạch tiếp tục hoạt động qua 30–50 bước trên các tác vụ giống WebArena, nơi một quỹ đạo ReAct đơn lẻ mất tính mạch lạc.

### When to pick which

| Mẫu | Khi nào |
|---------|------|
| ReAct | Tác vụ ngắn, môi trường không xác định, cần xử lý ngoại lệ có tính phản ứng |
| ReWOO | Tác vụ có cấu trúc với các công cụ đã biết, nhạy cảm về token, bằng chứng có thể song song hóa |
| Plan-and-Execute | Như ReWOO nhưng có lập kế hoạch lại sau khi thực thi một phần |
| Plan-and-Act | Tầm dài (>30 bước), web/di động/sử dụng máy tính |
| Tree of Thoughts | Việc tìm kiếm đáng để trả chi phí (Bài 04) |

Hướng dẫn tháng 12 năm 2024 của Anthropic: bắt đầu với thứ đơn giản nhất. Nếu tác vụ là một lời gọi công cụ cộng một bản tóm tắt, đừng xây dựng ReWOO. Nếu tác vụ là một nhiệm vụ nghiên cứu 40 bước, đừng chỉ dùng ReAct.

```figure
rewoo-plan
```

## Build It

`code/main.py` triển khai một ReWOO mô phỏng:

- `Planner` — một chính sách được viết kịch bản phát ra một DAG kế hoạch từ một prompt.
- `Worker` — phân phối lời gọi công cụ của mỗi nút qua sổ đăng ký.
- `Solver` — phép kết hợp được viết kịch bản đọc bằng chứng và tạo một câu trả lời cuối cùng.
- Phân giải phụ thuộc — các tham chiếu như `#E1` được thay thế bằng các đầu ra worker trước đó.

Bản demo trả lời "Dân số của thủ đô nước Pháp là bao nhiêu, làm tròn đến hàng triệu?" bằng một kế hoạch hai bước: (1) tra cứu thủ đô, (2) tra cứu dân số, rồi giải.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy kế hoạch đầy đủ trước, rồi các kết quả worker, rồi phép kết hợp của bộ giải. So sánh số token (chúng ta in một số đếm ký tự gần đúng) với một lần chạy đan xen kiểu ReAct — ReWOO thắng trên loại tác vụ có cấu trúc này.

## Use It

LangGraph cung cấp Plan-and-Execute dưới dạng một công thức (`create_react_agent` cho ReAct, các đồ thị tùy chỉnh cho lập kế hoạch-thực thi). Flows của CrewAI mã hóa trực tiếp mẫu này: bạn định nghĩa các tác vụ từ đầu và DAG Flow thực thi chúng. Cách tiếp cận dữ liệu tổng hợp của Plan-and-Act vẫn chủ yếu là nghiên cứu; mẫu runtime (DAG kế hoạch tường minh) được đưa vào sản xuất qua LangGraph và CrewAI Flows.

## Ship It

`outputs/skill-rewoo-planner.md` tạo một DAG kế hoạch ReWOO từ một yêu cầu người dùng, với một danh mục công cụ cho trước. Nó xác thực kế hoạch (không chu trình, mọi tham chiếu được phân giải, mọi công cụ tồn tại) trước khi bàn giao cho một bộ thực thi.

## Exercises

1. Song song hóa việc thực thi worker cho các nút kế hoạch độc lập. Nó mang lại gì cho bạn trên một DAG 6 nút với 2 nhóm song song?
2. Thêm một nút lập kế hoạch lại kích hoạt nếu bất kỳ worker nào trả về một lỗi. Thay đổi nhỏ nhất đối với ReWOO để biến nó thành Plan-and-Execute là gì?
3. Thay `Planner` bằng một mô hình nhỏ (cỡ 7B) và giữ `Solver` trên một mô hình tiên tiến nhất. So sánh chất lượng từ đầu đến cuối — sự phân tách thất bại ở đâu?
4. Đọc Phần 4 của bài báo ReWOO về chưng cất bộ lập kế hoạch. Tái tạo kết quả 175B -> 7B về mặt khái niệm: bạn cần dữ liệu huấn luyện nào, và bạn chấm điểm chất lượng kế hoạch như thế nào?
5. Chuyển bản mô phỏng sang hình dạng quỹ đạo của Plan-and-Act: kế hoạch là một chuỗi, không phải một DAG. Những đánh đổi nào thay đổi?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| ReWOO | "Suy luận không có quan sát" | Lập kế hoạch, rồi lấy bằng chứng song song, rồi giải — không có quan sát trong prompt lập kế hoạch |
| Plan-and-Execute | "Mẫu lập kế hoạch-thực thi của LangChain" | ReWOO với một nút lập kế hoạch lại tùy chọn sau khi thực thi |
| Plan-and-Act | "Lập kế hoạch-thực thi được mở rộng" | Sự phân tách bộ lập kế hoạch/bộ thực thi tường minh với dữ liệu huấn luyện kế hoạch tổng hợp cho các tác vụ có tầm dài |
| Evidence reference (Tham chiếu bằng chứng) | "#E1, #E2, ..." | Chỗ giữ chỗ của nút kế hoạch được thay thế bằng đầu ra worker trước đó tại thời điểm phân phối |
| Planner distillation (Chưng cất bộ lập kế hoạch) | "Bộ lập kế hoạch nhỏ, bộ thực thi lớn" | Tinh chỉnh một mô hình nhỏ trên các trace lập kế hoạch từ một mô hình giáo viên lớn |
| Token efficiency (Hiệu quả token) | "Ít lượt khứ hồi hơn" | Ít token hơn 5 lần trên HotpotQA so với ReAct trong bài báo |
| DAG executor (Bộ thực thi DAG) | "Bộ phân phối tô pô" | Chạy các nút kế hoạch theo thứ tự phụ thuộc; song song ở mỗi mức |

## Further Reading

- [Xu et al., ReWOO: Decoupling Reasoning from Observations (arXiv:2305.18323)](https://arxiv.org/abs/2305.18323) — bài báo kinh điển
- [Erdogan et al., Plan-and-Act (arXiv:2503.09572)](https://arxiv.org/abs/2503.09572) — bộ lập kế hoạch-thực thi được mở rộng với các kế hoạch tổng hợp
- [LangGraph Plan-and-Execute tutorial](https://docs.langchain.com/oss/python/langgraph/overview) — công thức framework
- [Anthropic, Building Effective Agents](https://www.anthropic.com/research/building-effective-agents) — chọn mẫu đơn giản nhất hoạt động được
