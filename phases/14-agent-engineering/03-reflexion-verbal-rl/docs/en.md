# Reflexion: Verbal Reinforcement Learning

> RL dựa trên gradient cần hàng nghìn lần thử và một cụm GPU để khắc phục một chế độ lỗi. Reflexion (Shinn và cộng sự, NeurIPS 2023) làm điều đó bằng ngôn ngữ tự nhiên: sau mỗi lần thử thất bại, agent viết một phản tư, lưu nó trong bộ nhớ tình tiết và đặt điều kiện cho lần thử tiếp theo dựa trên bộ nhớ đó. Đây là mẫu đằng sau tính toán lúc ngủ của Letta, những điều học được trong CLAUDE.md của Claude Code và learn-rule của pro-workflow.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 02 (ReWOO)
**Time:** ~60 minutes

## Learning Objectives

- Nêu tên ba thành phần của Reflexion (Actor, Evaluator, Self-Reflector) và vai trò của bộ nhớ tình tiết.
- Triển khai một vòng lặp Reflexion dùng thư viện chuẩn với bộ đánh giá nhị phân, bộ đệm phản tư và những lần thử lại mới.
- Chọn giữa các nguồn phản hồi vô hướng, heuristic và tự đánh giá cho một tác vụ cho trước.
- Giải thích vì sao củng cố bằng ngôn từ bắt được những lỗi mà RL dựa trên gradient sẽ cần hàng nghìn lần thử để khắc phục.

## The Problem

Một agent thất bại ở một tác vụ. Trong RL tiêu chuẩn bạn sẽ chạy thêm hàng nghìn lần thử, tính gradient, cập nhật trọng số. Tốn kém, chậm và hầu hết các agent sản xuất không có ngân sách huấn luyện cho mỗi lần thất bại.

Reflexion (Shinn và cộng sự, arXiv:2303.11366) đặt một câu hỏi khác: nếu agent chỉ suy nghĩ về vì sao nó thất bại và thử lại với suy nghĩ đó trong prompt thì sao? Không cập nhật trọng số. Không gradient. Chỉ ngôn ngữ tự nhiên được lưu giữa các lần thử.

Kết quả: trên ALFWorld nó đánh bại ReAct và các đường cơ sở không tinh chỉnh khác. Trên HotpotQA nó cải thiện so với ReAct. Trên sinh mã (HumanEval/MBPP) nó thiết lập mức tốt nhất tại thời điểm đó. Tất cả đều không có một bước gradient nào.

## The Concept

### The three components

```
Actor         : generates a trajectory (ReAct-style loop)
Evaluator     : scores the trajectory — binary, heuristic, or self-eval
Self-Reflector: writes a natural-language reflection on the failure
```

Cộng một cấu trúc dữ liệu:

```
Episodic memory: list of prior reflections, prepended to the next trial's prompt
```

Một lần thử chạy Actor. Evaluator chấm điểm nó. Nếu điểm thấp, Self-Reflector tạo một phản tư ("Tôi đã chọn sai công cụ vì tôi đọc nhầm câu hỏi thành hỏi về X trong khi nó hỏi về Y"). Phản tư đi vào bộ nhớ tình tiết. Lần thử tiếp theo bắt đầu mới nhưng nhìn thấy phản tư.

### Three evaluator types

1. **Vô hướng** — một tín hiệu nhị phân bên ngoài. ALFWorld thành công hoặc thất bại. Các kiểm thử HumanEval đạt hoặc không đạt. Đơn giản nhất, tín hiệu cao nhất.
2. **Heuristic** — các dấu hiệu lỗi được định nghĩa trước. "Nếu agent tạo ra cùng một hành động hai lần liên tiếp, đánh dấu là mắc kẹt." "Nếu quỹ đạo vượt quá 50 bước, đánh dấu là kém hiệu quả."
3. **Tự đánh giá** — LLM chấm điểm quỹ đạo của chính nó. Cần khi không có sự thật chuẩn. Tín hiệu yếu hơn; kết hợp tốt với xác minh dựa trên công cụ (Bài 05 — CRITIC).

Mặc định năm 2026 là một sự pha trộn: vô hướng khi khả dụng, tự đánh giá khi không, heuristic làm các thanh chắn an toàn.

### Why this generalizes

Reflexion không hẳn là một thuật toán mới mà là một mẫu có tên. Gần như mọi agent "tự chữa lành" trong sản xuất đều chạy một biến thể nào đó:

- Tính toán lúc ngủ của Letta (Bài 08): một agent riêng phản tư về các hội thoại trước và ghi vào các khối bộ nhớ.
- Mẫu `CLAUDE.md` / "lưu bộ nhớ" của Claude Code: các phản tư được ghi lại thành những điều học được, được thêm vào đầu các phiên tương lai.
- Lệnh `/learn-rule` của pro-workflow: các sửa chữa được ghi lại thành quy tắc tường minh.
- Các nút phản tư của LangGraph: một nút chấm điểm đầu ra và định tuyến đến tinh chỉnh nếu cần.

Tất cả đều bắt nguồn từ cùng một nhận thức: ngôn ngữ tự nhiên là một phương tiện đủ phong phú để mang "những gì tôi học được từ thất bại" giữa các lần chạy.

### When it works and when it does not

Reflexion hoạt động khi:

- Có một tín hiệu thất bại rõ ràng (kiểm thử thất bại, lỗi công cụ, câu trả lời sai).
- Loại tác vụ có thể tái tạo (cùng một kiểu câu hỏi có thể được hỏi lại).
- Phản tư có dư địa để cải thiện quỹ đạo (đủ ngân sách hành động).

Reflexion không giúp ích khi:

- Agent đã thành công ngay lần thử đầu tiên.
- Lỗi là bên ngoài (mạng ngừng hoạt động, công cụ hỏng) — phản tư về "mạng đã ngừng hoạt động" không giúp các lần chạy tương lai.
- Phản tư biến thành mê tín — lưu một câu chuyện về một lần chạy chập chờn chỉ xảy ra một lần.

Cạm bẫy năm 2026: bộ nhớ mục nát. Các phản tư tích lũy; một số lỗi thời hoặc sai; các lần chạy lại chậm hơn khi bộ đệm tình tiết tăng lên. Giảm thiểu: cô đọng định kỳ (Bài 06), TTL cho các phản tư hoặc một agent dọn dẹp lúc ngủ riêng (Letta).

```figure
react-trace
```

## Build It

`code/main.py` triển khai Reflexion trên một câu đố mô phỏng: tạo một danh sách 3 phần tử có tổng bằng một mục tiêu. Actor phát ra các danh sách ứng viên; Evaluator kiểm tra tổng; Self-Reflector viết một dòng về điều đã sai. Phản tư đi vào bộ nhớ tình tiết cho lần thử tiếp theo.

Các thành phần:

- `Actor` — một chính sách được viết kịch bản cải thiện khi nó nhìn thấy các phản tư.
- `Evaluator.binary()` — đạt/không đạt theo tổng mục tiêu.
- `SelfReflector` — tạo một chẩn đoán một dòng về lỗi.
- `EpisodicMemory` — một danh sách có giới hạn với ngữ nghĩa TTL.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy ba lần thử. Lần thử 1 thất bại, một phản tư được lưu, lần thử 2 nhìn thấy phản tư và cải thiện nhưng vẫn thất bại, lần thử 3 thành công. So sánh với một lần chạy đường cơ sở (không phản tư) — nó vẫn mắc kẹt ở câu trả lời của lần thử 1.

## Use It

LangGraph cung cấp phản tư như một mẫu nút. Lệnh `/memory` của Claude Code và `/learn-rule` của pro-workflow đưa bộ đệm tình tiết ra ngoài thành một file markdown. Tính toán lúc ngủ của Letta chạy Self-Reflector trong thời gian nhàn rỗi để agent chính vẫn bị ràng buộc bởi độ trễ. OpenAI Agents SDK không cung cấp Reflexion trực tiếp; bạn xây dựng nó với một Guardrail tùy chỉnh từ chối các quỹ đạo theo điểm và một `Session` bộ nhớ tồn tại qua các lần chạy.

## Ship It

`outputs/skill-reflexion-buffer.md` tạo và duy trì một bộ đệm tình tiết với việc ghi lại phản tư, TTL và loại trùng. Với một loại tác vụ và một thất bại cho trước, nó phát ra một phản tư thực sự giúp lần thử tiếp theo (không phải một câu "cẩn thận hơn" chung chung).

## Exercises

1. Chuyển từ bộ đánh giá nhị phân sang vô hướng trả về một thước đo khoảng cách (cách mục tiêu bao xa). Nó có hội tụ nhanh hơn không?
2. Thêm một TTL 10 lần thử cho các phản tư. Các phản tư cũ hơn gây hại hay giúp ích sau thời điểm đó?
3. Triển khai bộ đánh giá heuristic: đánh dấu lần thử là mắc kẹt nếu cùng một hành động lặp lại. Điều này tương tác với Self-Reflector như thế nào?
4. Chạy Reflexion với một Actor đối kháng bỏ qua các phản tư. Mức kỹ thuật prompt phản tư tối thiểu buộc Actor chú ý đến chúng là gì?
5. Đọc Phần 4 của bài báo Reflexion về AlfWorld. Tái tạo mức cải thiện tỷ lệ thành công 130% về mặt khái niệm: khác biệt chính so với ReAct nguyên bản là gì?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Reflexion | "Tự sửa chữa" | Shinn và cộng sự 2023 — Actor, Evaluator, Self-Reflector cộng bộ nhớ tình tiết |
| Verbal reinforcement (Củng cố bằng ngôn từ) | "Học không có gradient" | Phản tư bằng ngôn ngữ tự nhiên được thêm vào đầu prompt của lần thử tiếp theo |
| Episodic memory (Bộ nhớ tình tiết) | "Các phản tư theo tác vụ" | Bộ đệm có giới hạn của các phản tư trước cho một loại tác vụ |
| Scalar evaluator (Bộ đánh giá vô hướng) | "Tín hiệu thành công nhị phân" | Đạt/không đạt hoặc điểm số từ sự thật chuẩn |
| Heuristic evaluator (Bộ đánh giá heuristic) | "Bộ phát hiện dựa trên mẫu" | Các dấu hiệu lỗi được định nghĩa trước (ví dụ vòng lặp mắc kẹt, quá nhiều bước) |
| Self-evaluator (Bộ tự đánh giá) | "LLM làm giám khảo trên trace của chính nó" | Phương án dự phòng có tín hiệu thấp hơn khi không có sự thật chuẩn — kết hợp với xác minh dựa trên công cụ |
| Memory rot (Bộ nhớ mục nát) | "Các phản tư cũ" | Bộ đệm tình tiết đầy các mục lỗi thời; khắc phục bằng cô đọng/TTL |
| Sleep-time reflection (Phản tư lúc ngủ) | "Tự phản tư bất đồng bộ" | Chạy Self-Reflector ngoài đường xử lý chính để agent chính vẫn nhanh |

## Further Reading

- [Shinn et al., Reflexion: Language Agents with Verbal Reinforcement Learning (arXiv:2303.11366)](https://arxiv.org/abs/2303.11366) — bài báo kinh điển
- [Letta, Sleep-time Compute](https://www.letta.com/blog/sleep-time-compute) — phản tư bất đồng bộ trong sản xuất
- [Anthropic, Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) — quản lý bộ đệm tình tiết như một phần của ngữ cảnh
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — mẫu nút phản tư
