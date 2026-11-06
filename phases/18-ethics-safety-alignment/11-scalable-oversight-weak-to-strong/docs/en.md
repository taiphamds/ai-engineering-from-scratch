# Scalable Oversight and Weak-to-Strong Generalization

> Burns và cộng sự (OpenAI Superalignment, "Weak-to-Strong Generalization", 2023) đề xuất đại diện cho vấn đề siêu căn chỉnh: tinh chỉnh mô hình mạnh bằng nhãn do mô hình yếu hơn tạo. Nếu mô hình mạnh khái quát hóa đúng từ giám sát yếu không hoàn hảo, phương pháp căn chỉnh quy mô con người hiện tại có thể mở rộng đến hệ thống siêu nhân. Giám sát có thể mở rộng và W2SG bổ sung nhau. Giám sát có thể mở rộng (tranh luận, mô hình hóa phần thưởng đệ quy, phân rã tác vụ) tăng năng lực hiệu dụng của bên giám sát để theo kịp mô hình được giám sát. W2SG bảo đảm mô hình mạnh khái quát hóa đúng từ bất kỳ giám sát không hoàn hảo nào bên giám sát cung cấp. Debate Helps W2SG (arXiv:2501.13124, tháng 1 năm 2025) kết hợp chúng.

**Type:** Learn
**Languages:** Python (stdlib, W2SG gap simulator)
**Prerequisites:** Phase 18 · 01 (instruction-following), Phase 18 · 10 (AI Control), Phase 09 (RL foundations)
**Time:** ~60 minutes

## Learning Objectives

- Định nghĩa giám sát có thể mở rộng và khái quát hóa từ yếu đến mạnh, giải thích cách chúng bổ sung nhau.
- Mô tả thiết lập thí nghiệm Burns và cộng sự 2023: tinh chỉnh GPT-4 bằng nhãn từ GPT-2.
- Giải thích chỉ số khoảng cách hiệu năng được khôi phục (PGR) và điều nó đo.
- Nêu ba cơ chế giám sát có thể mở rộng chính (tranh luận, mô hình hóa phần thưởng đệ quy, phân rã tác vụ) và một điểm mạnh mỗi cơ chế.

## The Problem

Mọi kỹ thuật căn chỉnh đến nay trong Giai đoạn 18 giả định bên giám sát có thể đánh giá hành vi mô hình. Khi mô hình siêu nhân, bên giám sát là mắt xích yếu. Câu hỏi siêu căn chỉnh: bên giám sát yếu hơn có thể tạo đáng tin cậy mô hình mạnh hơn, được căn chỉnh không?

Burns và cộng sự quy điều này thành thiết lập thực nghiệm được hiện thực hóa: giám sát mạnh bằng yếu, đo bao nhiêu năng lực mô hình mạnh sống sót qua giám sát yếu. Đây không phải giải pháp siêu căn chỉnh — là đại diện cho phép đo tiến bộ.

## The Concept

### W2SG: the Burns et al. setup

- Mô hình yếu: cấp GPT-2.
- Mô hình mạnh: cấp GPT-4.
- Mục tiêu: trần GPT-4 mạnh trên tác vụ.

Quy trình:
1. Lấy dự đoán zero-shot của mô hình yếu trên tác vụ.
2. Tinh chỉnh mô hình mạnh trên dữ liệu gắn nhãn yếu.
3. Đo độ chính xác mô hình mạnh đã tinh chỉnh.

Đường cơ sở: độ chính xác của chính mô hình yếu, trần có giám sát của mô hình mạnh trên nhãn chuẩn.

Chỉ số khoảng cách: Khoảng cách Hiệu năng Được khôi phục (PGR) = (fine-tuned - weak) / (ceiling - weak). PGR 1.0 nghĩa là giám sát yếu khép hoàn toàn khoảng cách; PGR 0 nghĩa là giám sát yếu không giúp.

### Burns et al. empirical findings

Trên tác vụ NLP, câu đố cờ vua và mô hình hóa phần thưởng, PGR luôn dương: mô hình mạnh khái quát hóa vượt sai sót của bên giám sát yếu. PGR riêng theo tác vụ thay đổi từ ~20% đến ~80%. Mô hình mạnh "hiểu" tác vụ dự định từ nhãn không hoàn hảo, lấp vào bằng tiên nghiệm tiền huấn luyện.

Hạn chế Burns và cộng sự ghi nhận:
- Khoảng cách yếu-đến-mạnh ở đây là năng lực, không phải căn chỉnh. Mô hình yếu được căn chỉnh; mô hình thực sự siêu nhân có thể được con người căn chỉnh nhưng với khoảng cách năng lực lớn hơn nhiều.
- Khái quát hóa của mô hình mạnh có thể thiên về tiên nghiệm tác vụ hơn khôi phục ý định theo sự thật nền.
- Gợi kiến thức tiềm ẩn của mô hình mạnh là vấn đề thực; PGR đo một cách hiện thực hóa cụ thể.

### Scalable oversight: three mechanisms

- **Tranh luận (Irving và cộng sự 2018).** Hai phiên bản U lập luận hai phía đối lập; giám khảo yếu quyết định. Giả định: tìm câu trả lời đúng thuyết phục dễ hơn tìm câu trả lời sai thuyết phục. Công trình 2024-2025 gần đây (Khan và cộng sự, Michael và cộng sự) cho thấy tranh luận đôi khi giúp, đôi khi không, và việc có giúp phụ thuộc cấu trúc tác vụ.
- **Mô hình hóa Phần thưởng Đệ quy (Leike và cộng sự 2018).** U giúp con người huấn luyện mô hình phần thưởng cho U+1. Năng lực hiệu dụng bên giám sát tăng cùng mô hình.
- **Phân rã Tác vụ (Christiano, Shlegeris, Amodei 2018).** Phân rã đệ quy tác vụ khó thành tác vụ con con người kiểm tra được. Giả định khả năng phân rã.

Mỗi cơ chế giả định điều gì đó về cấu trúc tác vụ hoặc căn chỉnh của thành phần trung gian.

### Why scalable oversight and W2SG are complementary

Giám sát có thể mở rộng tăng chất lượng tín hiệu hiệu dụng của bên giám sát.
W2SG khép khoảng cách từ bất kỳ tín hiệu không hoàn hảo nào bên giám sát có thể cung cấp.

Lang và cộng sự — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124) kết hợp chúng: giao thức tranh luận cung cấp nhãn yếu tốt hơn, và mô hình mạnh được huấn luyện trên nhãn đó. Báo cáo mức tăng PGR trên tác vụ NLP.

### The organizational drama

Nhóm Superalignment của OpenAI giải thể tháng 5 năm 2024 sau khi Jan Leike rời sang Anthropic. Chương trình (giám sát có thể mở rộng, W2SG, nghiên cứu căn chỉnh tự động) tiếp tục tại Anthropic và phòng thí nghiệm học thuật — MATS (Bài 28), Redwood (Bài 10), Apollo (Bài 8), METR (Bài 28). Cấu trúc tổ chức thay đổi; câu hỏi nghiên cứu không đổi.

### Where this fits in Phase 18

Bài 6-10 mô tả đe dọa và mô hình phòng vệ dưới giả định U không đáng tin. Bài 11 là mô hình tấn công: làm bên giám sát đủ mạnh để xác minh căn chỉnh U. Bài 12-16 sau đó chuyển sang công cụ thực tiễn của đánh giá đối kháng.

```figure
scalable-oversight
```

## Use It

`code/main.py` mô phỏng tinh chỉnh W2SG trên tác vụ tổng hợp. Bên gắn nhãn yếu có độ chính xác 70% với lỗi có cấu trúc; mô hình mạnh có trần 95% trên nhãn chuẩn. Bạn tinh chỉnh mô hình mạnh trên nhãn yếu, đo PGR và so sánh với mạnh-trên-chuẩn và yếu-riêng.

## Ship It

Bài học này tạo ra `outputs/skill-w2sg-pgr.md`. Với mô tả thiết lập giám sát, xác định bên giám sát yếu, mô hình mạnh, chất lượng giám sát, và tính (hoặc yêu cầu) PGR. Nó đánh dấu khẳng định là "yếu có thể giám sát mạnh" hay "yếu + cơ chế giám sát có thể giám sát mạnh."

## Exercises

1. Chạy `code/main.py`. Báo cáo PGR cho weak_accuracy = 0.60, 0.70, 0.80. Giải thích hình dạng đường cong PGR.

2. Sửa bên gắn nhãn yếu để có lỗi có cấu trúc (ví dụ: luôn sai trên một lớp đầu vào cụ thể). PGR tăng, giảm hay giữ nguyên? Giải thích.

3. Đọc Phần 4.3 Burns và cộng sự 2023 (tác vụ NLP). Tái tạo trực giác "hàm mất mát phụ độ tin cậy": khi mô hình mạnh tự tin hơn nhãn yếu, ai thắng?

4. Thiết kế giao thức giám sát có thể mở rộng kết hợp tranh luận và phân rã tác vụ cho tác vụ kỹ thuật phần mềm. Nêu một chế độ lỗi mỗi thành phần và giải thích tổ hợp giải quyết hoặc không giải quyết từng lỗi thế nào.

5. Trình bày điều bác bỏ khẳng định "khái quát hóa từ yếu đến mạnh là con đường khả thi đến siêu căn chỉnh". Cụ thể về dấu hiệu thực nghiệm bạn cần thấy.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Scalable oversight (Giám sát có thể mở rộng) | "làm bên giám sát mạnh hơn" | Cơ chế tăng khả năng bên giám sát đánh giá mô hình có năng lực hơn |
| W2SG | "yếu giám sát mạnh" | Tinh chỉnh mô hình mạnh trên nhãn yếu và đo năng lực khôi phục |
| PGR | "khoảng cách hiệu năng được khôi phục" | (fine-tuned - weak) / (ceiling - weak); 1.0 = khép hoàn toàn, 0 = không giúp |
| Debate (Tranh luận) | "hai phiên bản U tranh luận" | Cơ chế giám sát có thể mở rộng nơi giám khảo yếu chọn giữa hai bên biện hộ U |
| RRM | "mô hình hóa phần thưởng đệ quy" | U giúp huấn luyện mô hình phần thưởng cho U+1; năng lực bên giám sát theo sát U |
| Task decomposition (Phân rã tác vụ) | "tác vụ con con người kiểm tra" | Chia đệ quy tác vụ khó thành tác vụ con con người xác minh được |
| Superalignment (Siêu căn chỉnh) | "căn chỉnh AI siêu nhân" | Chương trình nghiên cứu quan tâm căn chỉnh mô hình con người không thể đánh giá trực tiếp |

## Further Reading

- [Burns et al. — Weak-to-Strong Generalization (OpenAI 2023)](https://openai.com/index/weak-to-strong-generalization/) — bài báo W2SG
- [Irving, Christiano, Amodei — AI safety via debate (arXiv:1805.00899)](https://arxiv.org/abs/1805.00899) — cơ chế tranh luận
- [Leike et al. — Scalable agent alignment via reward modeling (arXiv:1811.07871)](https://arxiv.org/abs/1811.07871) — mô hình hóa phần thưởng đệ quy
- [Khan et al. — Debating with More Persuasive LLMs Leads to More Truthful Answers (arXiv:2402.06782)](https://arxiv.org/abs/2402.06782) — nghiên cứu thực nghiệm 2024 về tranh luận với bên tranh luận mạnh hơn
- [Lang et al. — Debate Helps Weak-to-Strong Generalization (arXiv:2501.13124)](https://arxiv.org/abs/2501.13124) — kết hợp tranh luận + W2SG năm 2025
