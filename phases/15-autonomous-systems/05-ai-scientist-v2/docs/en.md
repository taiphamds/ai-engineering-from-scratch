# AI Scientist v2 — Workshop-Level Autonomous Research

> AI Scientist v2 của Sakana (Yamada và cộng sự, arXiv:2504.08066) chạy toàn bộ vòng lặp nghiên cứu: giả thuyết, mã, thí nghiệm, hình, bài viết, nộp bài. Đó là hệ thống đầu tiên có một bài báo được tạo vượt qua bình duyệt tại một workshop ICLR 2025. Đánh giá độc lập (Beel và cộng sự) phát hiện 42% thí nghiệm thất bại do lỗi lập trình và tổng quan tài liệu thường gán nhãn nhầm các khái niệm đã được thiết lập là mới. Chính tài liệu của Sakana cảnh báo rằng cơ sở mã thực thi mã do LLM viết và khuyến nghị cô lập Docker. Cả hai nửa của bức tranh đó đều là trọng tâm.

**Type:** Learn
**Languages:** Python (stdlib, research-loop state-machine toy)
**Prerequisites:** Phase 15 · 03 (AlphaEvolve), Phase 15 · 04 (DGM)
**Time:** ~60 minutes

## The Problem

Nghiên cứu là một tác vụ mở. Khác với tìm kiếm thuật toán của AlphaEvolve hoặc tự sửa đổi bị giới hạn bởi benchmark của DGM, một kết quả nghiên cứu không có tiêu chí tính đúng đắn có thể kiểm tra bằng máy. Một bài báo được các bên bình duyệt đánh giá, không phải các kiểm thử đơn vị. Điều đó làm vòng lặp khó khép hơn — và có giá trị hơn nếu được khép, vì nghiên cứu là nơi tiến bộ tích lũy tồn tại.

AI Scientist v1 (Sakana, 2024) khép vòng lặp bằng cách bắt đầu từ các mẫu do con người soạn. LLM điền các thí nghiệm bên trong một khung cố định. AI Scientist v2 (Yamada và cộng sự, 2025) loại bỏ yêu cầu mẫu bằng cách sử dụng tìm kiếm cây agentic với một vòng lặp phê bình mô hình thị giác-ngôn ngữ. Hệ thống tạo các ý tưởng, triển khai các thí nghiệm, tạo các hình, viết một bài báo và lặp theo phản hồi của bên bình duyệt.

Phán quyết bình duyệt: một bài báo do v2 tạo được chấp nhận tại một workshop ICLR 2025 (có công bố). Phán quyết đánh giá độc lập: hệ thống còn lâu mới đáng tin cậy. Cả hai đều đúng.

## The Concept

### The architecture

1. **Tạo ý tưởng.** LLM đề xuất các ý tưởng nghiên cứu được điều kiện hóa theo một chủ đề và tài liệu trước đó. v1 sử dụng các mẫu; v2 sử dụng tìm kiếm agentic trên một không gian giả thuyết.
2. **Kiểm tra tính mới.** Một bước truy xuất tài liệu kiểm tra liệu ý tưởng đã được công bố chưa. Đây là bước mà đánh giá của Beel và cộng sự phát hiện gán nhãn sai — các phương pháp đã được thiết lập thường bị phân loại là mới.
3. **Kế hoạch thí nghiệm.** Agent soạn một quy trình thí nghiệm và viết mã.
4. **Thực thi.** Mã chạy trong một sandbox. Các thất bại được đưa trở lại một vòng lặp thử lại. Trong các phép đo của Beel và cộng sự, 42% thí nghiệm thất bại do lỗi lập trình ở giai đoạn này.
5. **Tạo hình.** Một mô hình thị giác-ngôn ngữ đọc các hình được tạo và viết lại chúng cho rõ ràng. Đây là phần bổ sung kỹ thuật then chốt của v2.
6. **Viết bài.** LLM soạn một bài báo, lặp với một bên bình duyệt nội bộ.
7. **Tùy chọn: nộp bài.** Bài báo được nộp đến một nơi công bố.

### What the workshop-acceptance result means

Một bài báo do v2 tạo vượt qua bình duyệt tại một workshop ICLR 2025. Các tác giả công bố nguồn gốc bài báo với ban chương trình. Việc chấp nhận là một điểm dữ liệu; đó không phải giấy phép để tuyên bố hệ thống "làm nghiên cứu."

Ngữ cảnh quan trọng: các bài báo workshop có ngưỡng thấp hơn các bài báo hội nghị chính. Bình duyệt nhiễu; một phần nhỏ các bài nộp được chấp nhận vào bất kỳ ngày nào. Một thành công là một chứng minh khái niệm, không phải một tuyên bố độ tin cậy. Bài báo Nature năm 2026 ghi nhận vòng lặp từ đầu đến cuối và chính nó được đồng tác giả bởi các nhà nghiên cứu con người; đó không phải "hệ thống đã viết một bài báo Nature."

### What the independent evaluation found

Beel và cộng sự (arXiv:2502.14297) thực hiện một đánh giá bên ngoài. Các phát hiện nổi bật:

- **Các thất bại thí nghiệm.** 42% thí nghiệm thất bại do lỗi lập trình (import sai, không khớp hình dạng, biến chưa định nghĩa). Vòng lặp thử lại bắt một số, không phải tất cả.
- **Gán nhãn sai tính mới.** Bước truy xuất tài liệu thường gắn cờ các khái niệm đã được thiết lập là mới. Đây là tương đương nghiên cứu của ảo giác.
- **Khoảng cách chất lượng trình bày.** Phê bình hình bằng thị giác-ngôn ngữ tạo các hình ảnh cấp xuất bản, che giấu các điểm yếu thí nghiệm bên dưới.

Phát hiện cuối là phát hiện quan trọng cho giai đoạn này. Một hệ thống tạo các đầu ra thuyết phục mà không làm nghiên cứu thuyết phục nguy hiểm hơn, không an toàn hơn, một hệ thống thất bại rõ ràng. Đánh giá phải chạm đến các khẳng định bên dưới, không dừng ở hình.

### The sandbox-escape concern

README của chính kho mã Sakana cảnh báo:

> Do bản chất của phần mềm này, vốn thực thi mã do LLM tạo, chúng tôi không thể bảo đảm an toàn. Có các rủi ro về các gói nguy hiểm, truy cập web không được kiểm soát và tạo các tiến trình ngoài ý muốn. Tự chịu rủi ro khi sử dụng và cân nhắc cô lập Docker.

Đây là hình thái vận hành của tự chủ trong một miền chưa được xác minh. LLM viết mã; mã chạy; mã có thể làm bất cứ điều gì tiến trình được phép làm. Không có một sandbox giới hạn cứng các hành động hệ thống file, mạng và tiến trình, bất kỳ agent nghiên cứu tự định hướng nào cũng có thể tuồn dữ liệu, đốt tính toán hoặc viết lại chính nó.

Câu chuyện sandbox của AlphaEvolve dễ hơn vì bộ đánh giá của nó chặt. Vòng lặp AI Scientist v2 chạy mã mở với các mục tiêu mở. Đó là lý do nó cần cô lập mạnh hơn (Docker tối thiểu; ưu tiên seccomp / gVisor) và một đánh giá thủ công mọi bài nộp trước khi nó rời hệ thống.

### Where v2 sits in the frontier stack

| Hệ thống | Đích | Loại đầu ra | Bộ đánh giá | Thất bại đã biết |
|---|---|---|---|---|
| AlphaEvolve | thuật toán | mã | đơn vị + benchmark | bị giới hạn bởi độ nghiêm ngặt bộ đánh giá |
| DGM | khung agent | mã | SWE-bench | lách phần thưởng |
| AI Scientist v2 | các bài báo nghiên cứu | văn bản + mã + hình | bình duyệt (yếu) | các thất bại thí nghiệm, gán nhãn sai, trau chuốt che giấu điểm yếu |

v2 có bộ đánh giá tự động yếu nhất trong ba hệ thống, bề mặt đầu ra rộng nhất và đường ngắn nhất đến các sản phẩm công khai. Các biện pháp kiểm soát vận hành (sandbox, đánh giá, công bố) đang làm phần lớn công việc an toàn.

```figure
mx-research-loop
```

## Use It

`code/main.py` mô phỏng vòng lặp v2 như một máy trạng thái: ý tưởng → kiểm tra tính mới → thí nghiệm → hình → viết bài → đánh giá → chấp nhận hoặc lặp. Mỗi trạng thái có một xác suất thất bại có thể cấu hình lấy từ các phát hiện của Beel và cộng sự. Chạy bộ mô phỏng cho N vòng lặp và đếm:

- Bao nhiêu ý tưởng đi đến nộp bài.
- Bao nhiêu bài nộp sẽ có một thiếu sót thí nghiệm nghiêm trọng mà bài báo được trau chuốt che giấu.
- Cách các ngân sách thử lại đánh đổi chất lượng với sản lượng.

## Ship It

`outputs/skill-ai-scientist-sandbox-review.md` là một danh sách kiểm tra đánh giá hai cổng cho bất cứ thứ gì do một agent vòng lặp nghiên cứu tạo trước khi nó rời sandbox.

## Exercises

1. Chạy `code/main.py` với các tham số mặc định. Phần bao nhiêu lần chạy vòng lặp tạo một bài báo "sạch"? Phần bao nhiêu tạo một bài báo với một thiếu sót thất bại thí nghiệm mà phê bình hình đã trau chuốt che đi?

2. Các mặc định đã sử dụng 42% / 25% của Beel và cộng sự. Chạy lại với `--experiment-failure 0.20 --novelty-mislabel 0.10` rồi với `--experiment-failure 0.60 --novelty-mislabel 0.40`. Tỷ lệ được trau chuốt nhưng có thiếu sót thay đổi thế nào giữa hai lần chạy?

3. Đọc README repo AI Scientist v2 của Sakana về các yêu cầu sandbox. Nêu tên hai hạn chế bổ sung (ngoài Docker) bạn sẽ áp dụng cho một lần chạy tự chủ nhiều ngày.

4. Đọc Phần 4 của Beel và cộng sự về khoảng cách chất lượng trình bày. Thiết kế một bộ đánh giá bổ sung sẽ bắt các bài báo trông được trau chuốt nhưng có thiếu sót thí nghiệm.

5. Đề xuất một giao thức đánh giá con người cho các đầu ra agent nghiên cứu mở rộng tốt hơn "một tiến sĩ đọc mọi bài báo." Nhận diện nút thắt và thiết kế quanh nó.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|---|---|---|
| AI Scientist v1 | "Agent nghiên cứu dựa trên mẫu của Sakana" | Điền các thí nghiệm vào một khung cố định |
| AI Scientist v2 | "Agent nghiên cứu không mẫu" | Tìm kiếm cây agentic với phê bình hình VLM |
| Agentic tree search (Tìm kiếm cây agentic) | "Agent nghiên cứu phân nhánh" | Mở rộng nhiều kế hoạch thí nghiệm song song; cắt tỉa bằng bên phê bình nội bộ |
| Vision-language critique (Phê bình thị giác-ngôn ngữ) | "VLM trau chuốt các hình" | Mô hình đa phương thức đọc các hình và viết lại chúng cho rõ ràng |
| Literature retrieval (Truy xuất tài liệu) | "Kiểm tra tính mới" | Tìm công trình trước để xác nhận tính mới ý tưởng — đã được ghi nhận gán nhãn sai |
| Polish masking (Trau chuốt che giấu) | "Bài báo đẹp, nghiên cứu hỏng" | Chất lượng trình bày vượt chất lượng thí nghiệm; che các điểm yếu |
| Sandbox escape (Thoát sandbox) | "Mã LLM thoát ra" | Mã do agent thực thi làm những điều nhà thiết kế vòng lặp không dự định |

## Further Reading

- [Yamada et al. (2025). The AI Scientist-v2](https://arxiv.org/abs/2504.08066) — bài báo.
- [Sakana blog on the Nature 2026 publication](https://sakana.ai/ai-scientist-nature/) — tóm tắt nhà cung cấp với ngữ cảnh bình duyệt.
- [Beel et al. (2025). Independent evaluation of The AI Scientist](https://arxiv.org/abs/2502.14297) — các con số đánh giá bên ngoài.
- [Sakana AI Scientist v1 paper](https://arxiv.org/abs/2408.06292) — tiền nhiệm dựa trên mẫu.
- [Anthropic — Measuring AI agent autonomy](https://www.anthropic.com/research/measuring-agent-autonomy) — cách định khung rộng hơn về các agent nghiên cứu mở.
