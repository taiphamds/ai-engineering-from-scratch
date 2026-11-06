# Tree of Thoughts and LATS: Deliberate Search

> Một quỹ đạo chain-of-thought đơn lẻ không có chỗ để quay lui. ToT (Yao và cộng sự, 2023) biến suy luận thành một cây với tự đánh giá ở mỗi nút. LATS (Zhou và cộng sự, 2024) hợp nhất ToT với ReAct và Reflexion dưới Monte Carlo Tree Search. Game of 24 đi từ 4% (CoT) lên 74% (ToT); LATS đạt pass@1 92.7% trên HumanEval.

**Type:** Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 03 (Reflexion)
**Time:** ~75 minutes

## Learning Objectives

- Định khung suy luận như tìm kiếm: các nút là "suy nghĩ," các cạnh là "mở rộng," giá trị là "triển vọng đến đâu."
- Triển khai một tìm kiếm cây BFS kiểu ToT dùng thư viện chuẩn với chấm điểm tự đánh giá.
- Mở rộng thành một vòng lặp MCTS LATS mô phỏng với chọn / mở rộng / mô phỏng / lan truyền ngược.
- Quyết định khi nào tìm kiếm đáng với hệ số nhân token (Game of 24, sinh mã) và khi nào một quỹ đạo đơn là đủ (hỏi đáp đơn giản).

## The Problem

Chain-of-thought là một bước đi tuyến tính. Nếu bước đầu tiên sai, mọi bước tiếp theo hoạt động trên một tiền đề xấu. Trên Game of 24 (sử dụng bốn chữ số với + − × ÷ để tạo ra 24), GPT-4 CoT đạt độ chính xác 4%. Mô hình chọn sai biểu thức con từ sớm và không thể phục hồi.

Điều suy luận cần là khả năng đề xuất nhiều ứng viên, đánh giá chúng, chọn những ứng viên có triển vọng và quay lui khi xuất hiện ngõ cụt. Đó là tìm kiếm. Tree of Thoughts và LATS là hai cách xây dựng kinh điển.

## The Concept

### Tree of Thoughts (Yao et al., NeurIPS 2023)

Mỗi nút là một bước trung gian mạch lạc ("một suy nghĩ"). Mỗi nút có thể mở rộng thành K suy nghĩ con. LLM tự đánh giá mỗi nút bằng một prompt chấm điểm. Tìm kiếm khám phá cây — BFS, DFS hoặc beam.

```
                     (root: "find 24 from 4 6 4 1")
                    /               |            \
           ("6 - 4 = 2")    ("4 + 1 = 5")    ("4 * 6 = 24")  <- Score: HIGH
              /   \              |                  |
          ...    ...          ...                finish
```

Tự đánh giá là phần trụ cột. Bài báo cho thấy ba biến thể: phân loại `sure / likely / impossible`, điểm số `1..10` và bỏ phiếu giữa các ứng viên. Cả ba đều vượt CoT đáng kể trên Game of 24 (4% -> 74% với GPT-4).

### LATS (Zhou et al., ICML 2024)

LATS hợp nhất ToT, ReAct và Reflexion dưới MCTS. LLM đóng ba vai trò:

- **Chính sách**: đề xuất các hành động tiếp theo ứng viên (kiểu ReAct).
- **Hàm giá trị**: chấm điểm một quỹ đạo một phần (tự đánh giá kiểu ToT).
- **Bộ tự phản tư**: khi thất bại, viết một phản tư bằng ngôn ngữ tự nhiên (kiểu Reflexion) và dùng nó để gieo lại hạt giống cho các rollout tương lai.

Phản hồi môi trường (các quan sát) hòa vào hàm giá trị để tìm kiếm được cung cấp thông tin bởi các kết quả công cụ thực, không chỉ ý kiến mô hình. Các kết quả tại thời điểm bài báo: HumanEval pass@1 92.7% với GPT-4 (SOTA), WebShop trung bình 75.9 với GPT-3.5 (tiệm cận tinh chỉnh dựa trên gradient).

### MCTS, minimally

Bốn pha cho mỗi lần lặp:

1. **Chọn** — đi từ gốc đến một lá bằng UCT (cận trên độ tin cậy cho cây).
2. **Mở rộng** — tạo K nút con qua chính sách.
3. **Mô phỏng** — rollout từ một nút con bằng chính sách, chấm điểm lá bằng hàm giá trị (hoặc phần thưởng môi trường).
4. **Lan truyền ngược** — cập nhật số lượt thăm và các ước lượng giá trị ngược lên đường đi.

Công thức UCT: `Q(s, a) + c * sqrt(ln N(s) / N(s, a))`. Số hạng đầu là khai thác; số hạng thứ hai là khám phá. Điều chỉnh `c` cho từng tác vụ.

### The cost reality

Tìm kiếm làm bùng nổ token. ToT trên Game of 24 sử dụng số token gấp 100–1000 lần CoT. LATS tương tự. Điều này không miễn phí; dành tìm kiếm cho:

- Các tác vụ mà một quỹ đạo đơn rõ ràng là không đủ (Game of 24, mã phức tạp).
- Các tác vụ mà thời gian đồng hồ ít quan trọng hơn tính đúng đắn.
- Các tác vụ có một hàm giá trị rẻ, đáng tin cậy (kiểm thử đơn vị cho mã, mục tiêu tường minh cho toán).

Nếu tác vụ của bạn có một câu trả lời đúng duy nhất và một bộ đánh giá nhiễu, tìm kiếm thường làm mọi thứ tệ hơn — nó tìm thấy một câu trả lời sai "được điểm tốt."

### 2026 positioning

Hầu hết các agent sản xuất không chạy LATS. Chúng chạy ReAct với xác minh dựa trên công cụ (CRITIC, Bài 05). Tìm kiếm xuất hiện trong các ngách chuyên biệt:

- Các agent lập trình chạy kiểm thử làm hàm giá trị (kiểu HumanEval).
- Các agent nghiên cứu sâu khám phá nhiều đường truy vấn.
- Các workflow nặng về lập kế hoạch bên trong các đồ thị con LangGraph.

AlphaEvolve (Bài 11) là cực điểm năm 2025: tìm kiếm tiến hóa trên mã, độ thích nghi có thể kiểm tra bằng máy, các cải tiến tiên phong (cải tiến phép nhân ma trận 4x4 đầu tiên trong 56 năm).

```figure
tree-of-thoughts
```

## Build It

`code/main.py` triển khai:

- Một BFS ToT nhỏ trên một tác vụ "chọn các phép toán số học" được cách điệu.
- Một vòng lặp MCTS LATS mô phỏng trên cùng tác vụ (Chọn / Mở rộng / Mô phỏng / Lan truyền ngược) với lựa chọn UCT.
- Một hàm giá trị kết hợp một điểm biểu tượng cộng một điểm tự đánh giá.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy ToT mở rộng ba ứng viên cho mỗi nút bằng BFS, so với LATS hội tụ vào rollout tốt nhất qua MCTS. Số token được in cho cả hai.

## Use It

LangGraph cung cấp khám phá kiểu ToT dưới dạng các mẫu đồ thị con; blog của nhóm LangChain về LATS (tháng 5 năm 2024) là hướng dẫn tham chiếu. LlamaIndex cung cấp một agent `TreeOfThoughts`. Với hầu hết các agent sản xuất năm 2026, mẫu này nằm sau một cổng `if task_complexity > threshold: use_search()` — xem mẫu bộ đánh giá-bộ tối ưu trong Bài 05.

## Ship It

`outputs/skill-search-policy.md` lựa chọn giữa ReAct tuyến tính, ToT, LATS và tìm kiếm tiến hóa với hình dạng tác vụ, ngân sách và độ trung thực của bộ đánh giá cho trước.

## Exercises

1. Chạy LATS mô phỏng với UCT c=0.1 so với c=2.0. Điều gì thay đổi trong trace?
2. Thay hàm giá trị bằng một bộ chấm điểm nhiễu hơn (thêm dao động ngẫu nhiên). MCTS còn tìm thấy lá tốt nhất không? Tỷ số tín hiệu trên nhiễu tối thiểu mà nó chịu được là bao nhiêu?
3. Triển khai ToT tìm kiếm chùm (giữ top-k ở mỗi mức) và so sánh với BFS. Cách nào tốt hơn với ngân sách token eo hẹp?
4. Đọc Phần 5.1 của LATS. Tái tạo số quỹ đạo HumanEval: cần bao nhiêu rollout để đạt pass@1 được báo cáo?
5. Đọc phần thảo luận của bài báo LATS về "khi nào LATS giúp ít hơn." Viết một quy tắc quyết định một đoạn ánh xạ hình dạng tác vụ sang chiến lược tìm kiếm.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Tree of Thoughts (Cây suy nghĩ) | "CoT phân nhánh" | Yao và cộng sự — cây các nút suy nghĩ với tự đánh giá |
| LATS | "MCTS cho LLM" | Zhou và cộng sự — hợp nhất ToT + ReAct + Reflexion dưới MCTS |
| UCT | "Cận trên độ tin cậy" | Công thức chọn cân bằng khai thác (Q) và khám phá (ln N / n) |
| Value function (Hàm giá trị) | "Trạng thái này tốt đến đâu" | Điểm LLM được gợi bằng prompt hoặc phần thưởng môi trường; cung cấp cho lan truyền ngược |
| Policy (Chính sách) | "Bộ đề xuất hành động" | Bộ tạo kiểu ReAct; phát ra các suy nghĩ/hành động tiếp theo ứng viên |
| Rollout | "Quỹ đạo mô phỏng" | Đi từ một nút đến một lá bằng chính sách, chấm điểm bằng giá trị |
| Backpropagate (Lan truyền ngược) | "Cập nhật các tổ tiên" | Đẩy phần thưởng của lá ngược lên đường đi, cập nhật số lượt thăm và Q |
| Search cost (Chi phí tìm kiếm) | "Bùng nổ token" | Gấp 100-1000 lần CoT trên Game of 24; lập ngân sách trước khi áp dụng |

## Further Reading

- [Yao et al., Tree of Thoughts (arXiv:2305.10601)](https://arxiv.org/abs/2305.10601) — bài báo kinh điển
- [Zhou et al., LATS (arXiv:2310.04406)](https://arxiv.org/abs/2310.04406) — MCTS với phản hồi Reflexion
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — các mẫu đồ thị con cho tìm kiếm
- [AlphaEvolve (arXiv:2506.13131)](https://arxiv.org/abs/2506.13131) — tìm kiếm tiến hóa với các bộ đánh giá bằng chương trình
