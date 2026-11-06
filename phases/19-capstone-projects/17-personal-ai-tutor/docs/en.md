# Capstone 17 — Personal AI Tutor (Adaptive, Multimodal, with Memory)

> Khanmigo (Khan Academy), Duolingo Max, Google LearnLM / Gemini for Education, Quizlet Q-Chat, và Synthesis Tutor đều đã cung cấp dạy kèm đa phương thức thích ứng ở quy mô lớn năm 2026. Hình thức chung là một chính sách Socrates (không bao giờ chỉ tuôn ra đáp án), một mô hình người học cập nhật sau mỗi tương tác (kiểu theo dõi kiến thức Bayes), đầu vào giọng nói + văn bản + toán qua ảnh, truy xuất đồ thị chương trình học, lập lịch lặp lại ngắt quãng, và các bộ lọc an toàn cứng cho nội dung phù hợp lứa tuổi. Bài tổng kết là cung cấp một gia sư theo môn học (đại số K-12 hoặc nhập môn Python), chạy một nghiên cứu hiệu quả hai tuần với 10 người học, và vượt qua một cuộc kiểm toán an toàn nội dung.

**Type:** Capstone
**Languages:** Python (backend, learner model), TypeScript (web app), SQL (curriculum graph via Postgres + Neo4j)
**Prerequisites:** Phase 5 (NLP), Phase 6 (speech), Phase 11 (LLM engineering), Phase 12 (multimodal), Phase 14 (agents), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P5 · P6 · P11 · P12 · P14 · P17 · P18
**Time:** 30 hours

## Problem

Dạy kèm thích ứng từng là một ngách nghiên cứu công nghệ giáo dục. Đến năm 2026 nó là một sản phẩm tiêu dùng. Khanmigo được triển khai khắp hầu hết các học khu Hoa Kỳ. Duolingo Max đạt hàng chục triệu MAU. LearnLM / Gemini for Education của Google hỗ trợ dạy kèm trong Google Classroom. Quizlet Q-Chat nằm cạnh các thẻ ghi nhớ. Synthesis Tutor lan truyền mạnh với gia sư cho trẻ tò mò. Các yếu tố chung: đầu vào đa phương thức (gõ, nói, chụp phương trình), phương pháp sư phạm Socrates (hỏi trước, giải thích sau), một mô hình người học cập nhật sau mỗi tương tác, và an toàn nghiêm ngặt phù hợp lứa tuổi.

Bạn sẽ xây dựng một trong những hệ thống này cho một nhóm cụ thể. Chuẩn đo lường là một nghiên cứu hiệu quả thực tế: điểm kiểm tra trước và sau trong hai tuần với 10 người học. Vòng lặp giọng nói phải có cảm giác tự nhiên (ngăn xếp con bài tổng kết 03). Bộ nhớ phải tôn trọng quyền riêng tư. Bộ lọc an toàn phải vượt qua red-team có nhận thức COPPA cho K-12.

## Concept

Bốn thành phần. **Chính sách gia sư** là một vòng lặp Socrates: khi người học hỏi đáp án, chính sách hỏi một câu gợi mở; khi họ trả lời đúng, nó chuyển sang khái niệm tiếp theo; khi họ mắc kẹt, nó cung cấp một gợi ý có hỗ trợ từng bước. **Mô hình người học** là theo dõi kiến thức Bayes (hoặc một biến thể đơn giản) cập nhật xác suất thành thạo theo nút chương trình học sau mỗi tương tác. **Đồ thị chương trình học** là một Neo4j các khái niệm với các cạnh tiên quyết; chính sách duyệt đồ thị để chọn khái niệm tiếp theo. **Bộ nhớ** là một kho tình tiết + ngữ nghĩa (kiểu agentmemory) chứa các tương tác, sai lầm, và sở thích trong quá khứ.

UX là đa phương thức. Đầu vào văn bản cho các câu trả lời được gõ. Đầu vào giọng nói qua LiveKit + Whisper (tái sử dụng bài tổng kết 03). Đầu vào ảnh cho các bài toán qua dots.ocr hoặc PaliGemma 2. Đầu ra giọng nói qua Cartesia Sonic-2. An toàn sử dụng Llama Guard 4 cùng một bộ lọc phù hợp lứa tuổi (chặn nội dung người lớn, bạo lực, tự hại) và một chính sách lưu giữ bộ nhớ có nhận thức COPPA.

Nghiên cứu hiệu quả là sản phẩm bàn giao. 10 người học, kiểm tra trước và sau, hai tuần. Báo cáo chênh lệch mức tiến bộ học tập và khoảng tin cậy. So sánh với một đường cơ sở không thích ứng (cùng nội dung được cung cấp tuyến tính mà không có chính sách gia sư).

## Architecture

```
learner device
  |
  +-- text         -> web app
  +-- voice        -> LiveKit Agents (ASR + TTS)
  +-- photo math   -> dots.ocr / PaliGemma 2
       |
       v
  tutor policy (LangGraph)
       - Socratic decision head
       - next-concept chooser (curriculum graph walk)
       - hint scaffolder
       - mastery update
       |
       v
  learner model (BKT / item-response theory)
       - per-concept mastery probability
       - spaced-repetition scheduler (SM-2 or FSRS)
       |
       v
  memory (agentmemory-style)
       - episodic: every interaction
       - semantic: learned mistakes, preferences
       - retention policy: COPPA / GDPR aware
       |
       v
  curriculum graph (Neo4j)
       - prerequisite edges
       - OER content attached
       |
       v
  safety:
    Llama Guard 4 + age-appropriate filter
    memory access guarded by learner ID scope
```

## Stack

- Lựa chọn môn học: đại số K-12 hoặc nhập môn Python (chọn một để đi sâu)
- Chính sách gia sư: LangGraph trên Claude Sonnet 4.7 (với lưu đệm prompt)
- Mô hình người học: theo dõi kiến thức Bayes (kinh điển) hoặc FSRS cho khoảng cách ôn tập
- Đồ thị chương trình học: Neo4j các khái niệm + các cạnh tiên quyết + nội dung OER
- Bộ nhớ: kho vector + tình tiết + ngữ nghĩa bền vững kiểu agentmemory
- Giọng nói: LiveKit Agents 1.0 + Cartesia Sonic-2 (tái sử dụng ngăn xếp con bài tổng kết 03)
- Toán qua ảnh: dots.ocr hoặc PaliGemma 2 để nhận dạng phương trình
- An toàn: Llama Guard 4 + bộ lọc phù hợp lứa tuổi tùy chỉnh
- Đánh giá: tạo câu hỏi theo mức Bloom, bộ kiểm thử trước/sau, công cụ nghiên cứu hiệu quả

```figure
cf-tutor-loop
```

## Build It

1. **Đồ thị chương trình học.** Xây dựng một Neo4j với 50-150 nút khái niệm (ví dụ, đại số K-12 từ "trục số" đến "công thức nghiệm phương trình bậc hai") với các cạnh tiên quyết. Gắn nội dung OER cho mỗi nút (Open Textbook, OpenStax).

2. **Mô hình người học.** Khởi tạo theo dõi kiến thức Bayes với các tiên nghiệm: đoán, nhầm, tốc độ học. Cập nhật mức thành thạo theo khái niệm sau mỗi tương tác. Lưu bền vững theo người học.

3. **Chính sách gia sư.** LangGraph với các nút: `read_signal` (câu trả lời của người học đúng / một phần / mắc kẹt?), `select_concept` (duyệt đồ thị chương trình học chọn khái niệm ưu tiên cao nhất), `scaffold` (prompt Socrates), `update_mastery`.

4. **Bộ nhớ.** Mỗi tương tác ghi vào một kho tình tiết. Các sai lầm và sở thích được nâng lên bộ nhớ ngữ nghĩa. Chính sách lưu giữ có nhận thức COPPA: tự động xóa sau 1 năm, phụ huynh có thể truy cập.

5. **Đường giọng nói.** Worker LiveKit Agents được gắn với chính sách gia sư. ASR qua Whisper-v3-turbo. TTS qua Cartesia Sonic-2. Hỗ trợ ngắt lời (tái sử dụng cơ chế bài tổng kết 03).

6. **Đường toán qua ảnh.** Tải lên hoặc chụp ảnh; chạy dots.ocr hoặc PaliGemma 2 để nhận dạng phương trình; đưa cho gia sư dưới dạng đầu vào có cấu trúc.

7. **An toàn.** Mọi đầu ra mô hình đều qua Llama Guard 4 + một bộ lọc phù hợp lứa tuổi (chặn tự hại, nội dung người lớn, bạo lực). Quyền truy cập bộ nhớ được giới hạn theo ID người học; bề mặt truy cập của phụ huynh để xóa.

8. **Nghiên cứu hiệu quả.** 10 người học, kiểm tra trước (đường cơ sở chuẩn hóa 30 câu hỏi), hai tuần tương tác với gia sư (3 buổi/tuần), kiểm tra sau. So sánh với một nhóm đường cơ sở không thích ứng gồm 10 người học trên cùng nội dung.

9. **Báo cáo tiến độ hàng tuần.** Theo người học, tự động tạo một bản tóm tắt PDF về các chủ đề đã khám phá, diễn biến thành thạo, và các bước tiếp theo được đề xuất.

## Use It

```
learner: "I don't understand why 3x + 6 = 12 means x = 2"
[signal]   stuck
[concept]  'isolating variables' (prerequisite: addition-subtraction-equality)
[scaffold] "what number would you subtract from both sides to start?"
learner: "6"
[signal]   correct
[mastery]  addition-subtraction-equality: 0.62 -> 0.77
[concept]  continue 'isolating variables'
[scaffold] "great. now what is 3x / 3 equal to?"
```

## Ship It

`outputs/skill-ai-tutor.md` là sản phẩm bàn giao. Một gia sư thích ứng theo môn học với đầu vào đa phương thức, một mô hình người học, bộ nhớ, an toàn, và hiệu quả được đo lường.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Chênh lệch mức tiến bộ học tập | Chênh lệch kiểm tra trước/sau trong một nghiên cứu hai tuần với 10 người học |
| 20 | Mức trung thành với Socrates | Điểm theo thang đánh giá trên các mẫu bản chép lời |
| 20 | UX đa phương thức | Tính nhất quán giọng nói + ảnh + văn bản từ đầu đến cuối |
| 20 | Tư thế an toàn + quyền riêng tư | Tỷ lệ đạt Llama Guard 4 + lưu giữ có nhận thức COPPA |
| 15 | Độ rộng chương trình học và chất lượng đồ thị | Độ bao phủ khái niệm + tính nhất quán đồ thị tiên quyết |
| **100** | | |

## Exercises

1. Chạy nghiên cứu hiệu quả có và không có mô hình người học thích ứng (thứ tự khái niệm ngẫu nhiên). Báo cáo chênh lệch. Kỳ vọng thích ứng thắng, nhưng độ lớn là con số thú vị.

2. Thêm một phép thăm dò đa phương thức: cùng câu hỏi khái niệm được cung cấp dưới dạng văn bản, giọng nói, và ảnh. Đo xem người học có hội tụ nhanh hơn với phương thức họ thích không.

3. Xây dựng một bảng điều khiển phụ huynh: các chủ đề đã luyện tập, diễn biến thành thạo, các khái niệm sắp tới, các sự kiện an toàn (bất kỳ lần kích hoạt chốt bảo vệ nào). Phù hợp COPPA.

4. Thêm một chế độ chuyển ngôn ngữ: gia sư nhận đầu vào tiếng Tây Ban Nha và dạy bằng tiếng Tây Ban Nha. Đo độ bao phủ X-Guard.

5. Thử thách quyền riêng tư bộ nhớ: xác minh rằng người học A không thể thấy dữ liệu của người học B ngay cả qua một tấn công tiếp nhận lại đoạn ghi âm giọng nói. Ghi lại lần thử truy cập và cảnh báo.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Socratic policy (Chính sách Socrates) | "Hỏi, đừng tuôn đáp án" | Gia sư hỏi một câu gợi mở thay vì đưa đáp án |
| Bayesian knowledge tracing (Theo dõi kiến thức Bayes) | "BKT" | Các phương trình mô hình người học kinh điển cho xác suất thành thạo theo khái niệm |
| FSRS | "Bộ lập lịch lặp lại ngắt quãng tự do" | Bộ lập lịch lặp lại ngắt quãng năm 2024, tốt hơn SM-2 |
| Curriculum graph (Đồ thị chương trình học) | "DAG khái niệm" | Neo4j các khái niệm với các cạnh tiên quyết |
| Episodic memory (Bộ nhớ tình tiết) | "Nhật ký theo tương tác" | Mỗi tương tác được lưu để truy xuất sau này |
| Semantic memory (Bộ nhớ ngữ nghĩa) | "Kho mẫu đã học" | Các sai lầm và sở thích được cô đọng và nâng lên từ bộ nhớ tình tiết |
| COPPA | "Luật quyền riêng tư trẻ em" | Luật Hoa Kỳ hạn chế thu thập dữ liệu từ trẻ dưới 13 tuổi |

## Further Reading

- [Khanmigo (Khan Academy)](https://www.khanmigo.ai) — gia sư K-12 tiêu dùng tham chiếu
- [Duolingo Max](https://blog.duolingo.com/duolingo-max/) — gia sư học ngôn ngữ tham chiếu
- [Google LearnLM / Gemini for Education](https://blog.google/products-and-platforms/products/education/google-learnlm-gemini-generative-ai/) — mô hình tham chiếu được lưu trữ
- [Quizlet Q-Chat](https://quizlet.com) — tham chiếu thay thế
- [Synthesis Tutor](https://www.synthesis.com) — tham chiếu startup
- [FSRS algorithm](https://github.com/open-spaced-repetition/fsrs4anki) — bộ lập lịch lặp lại ngắt quãng
- [Bayesian Knowledge Tracing](https://en.wikipedia.org/wiki/Bayesian_knowledge_tracing) — mô hình người học kinh điển
- [LiveKit Agents](https://github.com/livekit/agents) — ngăn xếp giọng nói
