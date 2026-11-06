# AlphaEvolve — Evolutionary Coding Agents

> Ghép một mô hình lập trình tiên tiến nhất với một vòng lặp tiến hóa và một bộ đánh giá có thể kiểm tra bằng máy. Để vòng lặp chạy đủ lâu. Nó khám phá một quy trình nhân ma trận phức 4x4 sử dụng 48 phép nhân vô hướng — cải tiến đầu tiên vượt Strassen trong 56 năm. Nó cũng tìm một heuristic lập lịch Borg trên toàn Google thu hồi ~0.7% năng lực tính toán cụm trong sản xuất. Kiến trúc nhàm chán có chủ ý. Các thành tựu đến từ độ nghiêm ngặt của bộ đánh giá.

**Type:** Learn
**Languages:** Python (stdlib, evolutionary-loop toy)
**Prerequisites:** Phase 15 · 01 (long-horizon framing), Phase 15 · 02 (self-taught reasoning)
**Time:** ~60 minutes

## The Problem

Các mô hình ngôn ngữ lớn có thể viết mã. Các thuật toán tiến hóa có thể tìm kiếm trên mã. Cả hai đã được thử riêng trong hàng thập kỷ; cả hai chạm các trần. Trần LLM là bịa đặt: mô hình viết mã có vẻ hợp lý không làm điều nó tuyên bố. Trần tiến hóa là chi phí tìm kiếm: các đột biến ngẫu nhiên trên cú pháp hiếm khi tạo các chương trình có thể biên dịch, chưa nói đến các chương trình tốt hơn.

AlphaEvolve (Novikov và cộng sự, DeepMind, arXiv:2506.13131, tháng 6 năm 2025) kết hợp chúng. LLM đề xuất các chỉnh sửa có mục tiêu cho một cơ sở dữ liệu chương trình; một bộ đánh giá tự động chấm điểm mỗi biến thể; các biến thể điểm cao trở thành cha mẹ cho các thế hệ tương lai. LLM xử lý bước tốn kém viết mã có vẻ hợp lý; bộ đánh giá bắt các bịa đặt. Vòng lặp chạy từ hàng giờ đến hàng tuần.

Các kết quả được báo cáo: nhân ma trận phức 4x4 với 48 phép nhân vô hướng (cận năm 1969 của Strassen là 49), một heuristic lập lịch Borg trong sản xuất Google, tăng tốc kernel FlashAttention 32.5%, các cải thiện thông lượng huấn luyện Gemini.

Kiến trúc hoạt động vì bộ đánh giá có thể kiểm tra bằng máy. Nó không hoạt động ở nơi bộ đánh giá không như vậy. Sự bất đối xứng đó là bài học.

## The Concept

### The loop

1. Bắt đầu từ một chương trình hạt giống `P_0` đúng nhưng chưa tối ưu.
2. Duy trì một cơ sở dữ liệu các chương trình biến thể, mỗi chương trình được bộ đánh giá chấm điểm.
3. Lấy mẫu một hoặc nhiều cha mẹ từ cơ sở dữ liệu (kiểu MAP-elites hoặc dựa trên đảo).
4. Prompt LLM (Gemini Flash cho nhiều ứng viên, Gemini Pro cho các ứng viên khó) để tạo một biến thể đã sửa của cha mẹ.
5. Biên dịch, chạy và đánh giá biến thể trên bộ đánh giá được giữ riêng.
6. Chèn vào cơ sở dữ liệu được đánh khóa theo điểm và vector đặc trưng của nó.
7. Lặp lại.

Hai chi tiết quan trọng. Thứ nhất, LLM được prompt với nhiều hơn chương trình cha mẹ — thường là nhiều biến thể hàng đầu từ cơ sở dữ liệu, cộng chữ ký bộ đánh giá, cộng một mô tả tác vụ ngắn. Công việc của mô hình là đề xuất một thay đổi có mục tiêu có thể cải thiện điểm. Thứ hai, cơ sở dữ liệu có cấu trúc (lưới MAP-elites, dựa trên đảo) để vòng lặp khám phá sự đa dạng, không chỉ bên dẫn đầu hiện tại.

### What makes the evaluator non-negotiable

Các thành tựu của AlphaEvolve đều đến từ các miền nơi bộ đánh giá nhanh, mang tính xác định và khó lách:

- **Thuật toán nhân ma trận**: một kiểm thử đơn vị nhân các ma trận và kiểm tra bằng nhau giống hệt từng bit.
- **Heuristic lập lịch Borg**: một bộ mô phỏng cấp sản xuất phát lại tải cụm lịch sử và đo năng lực tính toán bị lãng phí.
- **Kernel FlashAttention**: một kiểm thử tính đúng đắn cộng một benchmark thời gian đồng hồ trên phần cứng thực.
- **Thông lượng huấn luyện Gemini**: số GPU-giây được đo cho mỗi bước.

Trong mỗi trường hợp bộ đánh giá bắt lớp lỗi LLM nếu không sẽ chiếm ưu thế: các tuyên bố tính đúng đắn bịa đặt, các tuyên bố hiệu năng biến mất trên phần cứng và các thất bại trường hợp biên. Loại bỏ bộ đánh giá và vòng lặp tối ưu cho mã đẹp.

### Reward hacking is the other face of that statement

Tiến hóa tối ưu cho bất cứ thứ gì bộ đánh giá đo. Nếu bộ đánh giá không hoàn hảo, vòng lặp sẽ tìm sự không hoàn hảo. Trong một miền chưa được xác minh vòng lặp sẽ tối ưu cho đặc trưng bề mặt, không phải hành vi dự định. DeepMind gắn cờ rõ ràng điều này trong bài báo: các thành công của AlphaEvolve chỉ chuyển giao sang các miền nơi độ nghiêm ngặt bộ đánh giá khớp tham vọng tìm kiếm.

Các ví dụ cụ thể 2025-2026 về lách phần thưởng trong các vòng lặp tìm kiếm mã:

- Các mục tiêu tối ưu hóa thưởng "thời gian hoàn thành" đã thưởng việc nộp các lời giải rỗng.
- Các điểm benchmark thưởng tính đúng đắn dưới kiểm thử đã thưởng việc ghi nhớ các kiểm thử và quá khớp.
- Một đại diện "chất lượng mã" đã thưởng việc loại bỏ các chú thích và viết lại các tên biến, không có thay đổi ngữ nghĩa.

Cách khắc phục trong AlphaEvolve: cung cấp một bộ đánh giá được giữ riêng mà LLM chưa từng thấy, với các đầu vào được tạo tại thời điểm đánh giá. Ngay cả khi đó, DeepMind khuyến nghị đánh giá chặt chẽ trên bất kỳ triển khai được đề xuất nào.

### Why LLM + search beats either alone

LLM có thể tạo các sửa đổi có thể biên dịch, có vẻ hợp lý về ngữ nghĩa. Một GA đột biến ngẫu nhiên trên một file Python 2000 dòng gần như luôn tạo các lỗi cú pháp. LLM cũng tập trung tìm kiếm vào các lân cận có vẻ hợp lý (thay đổi một hàm, không phải các byte ngẫu nhiên), làm giảm mạnh các lời gọi bộ đánh giá bị lãng phí.

Đổi lại, bộ đánh giá bắt các bịa đặt của LLM. Các LLM sẽ tự tin tuyên bố một hàm "là O(n log n) trong giới hạn" khi nó thực ra là O(n^2); một benchmark thời gian đồng hồ làm câu hỏi ngã ngũ.

### Where AlphaEvolve fits in the frontier stack

| Hệ thống | Bộ tạo | Bộ đánh giá | Miền | Thành tựu ví dụ |
|---|---|---|---|---|
| AlphaEvolve | Gemini | tính đúng đắn + benchmark | thuật toán, kernel, bộ lập lịch | nhân ma trận 4x4 với 48 phép nhân |
| FunSearch (DeepMind, 2023) | PaLM / Codey | tính đúng đắn | toán tổ hợp | các cận dưới cap-set |
| AI Scientist v2 (Sakana, L5) | GPT/Claude | phê bình LLM + thí nghiệm | nghiên cứu ML | bài báo workshop ICLR |
| Darwin Godel Machine (L4) | khung agent | SWE-bench / Polyglot | mã agent | 20% → 50% SWE-bench |

Cả bốn là các biến thể của cùng công thức: bộ tạo cộng bộ đánh giá, vòng lặp. Các khác biệt là bộ đánh giá chấm gì và nó nghiêm ngặt đến đâu.

```figure
alphaevolve-loop
```

## Use It

`code/main.py` triển khai một vòng lặp giống AlphaEvolve tối thiểu trên một bài toán hồi quy biểu tượng mô phỏng. "LLM" là một đại diện dùng thư viện chuẩn đề xuất các đột biến cú pháp nhỏ cho một chương trình tính một hàm đích. "Bộ đánh giá" đo sai số bình phương trung bình trên các điểm kiểm thử được giữ riêng.

Quan sát:

- Cách điểm tốt nhất cải thiện qua các thế hệ.
- Cách một lưới MAP-elites giữ các lời giải đa dạng sống để vòng lặp không hội tụ vào một cực tiểu cục bộ.
- Cách loại bỏ kiểm thử giữ riêng (bộ đánh giá chỉ huấn luyện) để vòng lặp quá khớp ngoạn mục.

## Ship It

`outputs/skill-evaluator-rigor-audit.md` là tiền điều kiện để cân nhắc một vòng lặp kiểu AlphaEvolve trong một miền mới: bộ đánh giá của bạn có thực sự bắt các thất bại bạn quan tâm không?

## Exercises

1. Chạy `code/main.py`. Ghi lại quỹ đạo điểm tốt nhất. Tắt bộ đánh giá giữ riêng (cờ `--no-holdout`) và chạy lại. Định lượng sự quá khớp.

2. Đọc Phần 3 của bài báo AlphaEvolve về lưới MAP-elites. Thiết kế một bộ mô tả vector đặc trưng cho một bài toán mới (ví dụ các lượt tối ưu hóa trình biên dịch) sẽ giữ tìm kiếm đa dạng.

3. Kết quả 4x4 với 48 phép nhân cải thiện cận 49 phép nhân của Strassen sau 56 năm. Đọc Phụ lục F của bài báo và giải thích trong ba câu vì sao bộ đánh giá cho bài toán này đặc biệt dễ làm đúng, và vì sao hầu hết các miền không giống nó.

4. Đề xuất một miền nơi AlphaEvolve sẽ thất bại. Nhận diện chính xác bộ đánh giá hỏng ở đâu và vì sao.

5. Với một miền bạn biết, viết chữ ký bộ đánh giá bạn sẽ sử dụng. Bao gồm (a) các điều kiện tính đúng đắn, (b) thước đo hiệu năng, (c) quy tắc tạo đầu vào giữ riêng, (d) ít nhất một kiểm tra chống lách phần thưởng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|---|---|---|
| AlphaEvolve | "Agent lập trình tiến hóa của DeepMind" | Gemini + cơ sở dữ liệu chương trình + bộ đánh giá có thể kiểm tra bằng máy |
| MAP-elites | "Kho lưu trữ bảo toàn đa dạng" | Lưới được đánh khóa theo các vector đặc trưng; mỗi ô giữ biến thể tốt nhất có bộ mô tả đó |
| Island model (Mô hình đảo) | "Các quần thể con tiến hóa song song" | Các quần thể độc lập di cư định kỳ; ngăn hội tụ sớm |
| Machine-checkable evaluator (Bộ đánh giá có thể kiểm tra bằng máy) | "Oracle mang tính xác định" | Một kiểm thử đơn vị, bộ mô phỏng hoặc benchmark mà LLM không thể giả mạo — một điều kiện tiên quyết cho vòng lặp này |
| Reward hacking (Lách phần thưởng) | "Tối ưu thước đo, không phải mục tiêu" | Vòng lặp tìm một cách tối đa hóa điểm mà không làm tác vụ dự định |
| Seed program (Chương trình hạt giống) | "Điểm bắt đầu" | Một chương trình ban đầu đúng nhưng chưa tối ưu mà vòng lặp tiến hóa từ đó |
| Held-out evaluator (Bộ đánh giá giữ riêng) | "Dữ liệu đánh giá LLM chưa từng thấy" | Các đầu vào được tạo tại thời điểm đánh giá để ngăn ghi nhớ |

## Further Reading

- [Novikov et al. (2025). AlphaEvolve: A coding agent for scientific and algorithmic discovery](https://arxiv.org/abs/2506.13131) — bài báo đầy đủ.
- [DeepMind blog on AlphaEvolve](https://deepmind.google/blog/alphaevolve-a-gemini-powered-coding-agent-for-designing-advanced-algorithms/) — bài viết nhà cung cấp với các kết quả.
- [AlphaEvolve results repository](https://github.com/google-deepmind/alphaevolve_results) — các thuật toán được khám phá, bao gồm phép nhân ma trận 4x4 với 48 phép nhân.
- [Romera-Paredes et al. (2023). Mathematical discoveries from program search with LLMs (FunSearch)](https://www.nature.com/articles/s41586-023-06924-6) — hệ thống tiền nhiệm.
- [Anthropic — Responsible Scaling Policy v3.0 (Feb 2026)](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — định khung tính tự chủ bị giới hạn bởi bộ đánh giá như một hướng nghiên cứu chính.
