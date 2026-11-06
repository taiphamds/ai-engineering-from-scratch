# METR Time Horizons and External Capability Evaluation

> METR (trước đây là ARC Evals) là một tổ chức 501(c)(3) độc lập từ tháng 12 năm 2023. Benchmark Time Horizon 1.1 của họ (tháng 1 năm 2026) khớp một đường cong logistic với xác suất thành công tác vụ theo log(thời gian hoàn thành của chuyên gia con người); giao điểm ở xác suất 50% định nghĩa tầm thời gian của mô hình. Tập các đợt hợp tác năm 2025–2026 bao phủ GPT-5.1, GPT-5.1-Codex-Max, và các đánh giá giám sát nguyên mẫu (một bộ giám sát có thể bắt các tác vụ phụ không; agent có thể né tránh không). Các bộ benchmark: HCAST (180+ tác vụ ML, an ninh mạng, SWE, suy luận; 1 phút đến 8+ giờ), RE-Bench (71 tác vụ kỹ thuật nghiên cứu ML với đường cơ sở chuyên gia), SWAA. Ghi chú thẳng thắn: các phép đo METR được lý tưởng hóa — không có con người, không có hệ quả thực — và nhóm đã ghi nhận khoảng cách hành vi giữa đánh giá và triển khai (Bài 1). Một tầm thời gian là một cận trên, không phải một dự đoán triển khai.

**Type:** Learn
**Languages:** Python (stdlib, logistic-fit horizon estimator)
**Prerequisites:** Phase 15 · 01 (Long-horizon agents), Phase 15 · 19 (RSP)
**Time:** ~60 minutes

## The Problem

Các chính sách mở rộng quy mô (Bài 19, 20) chỉ hữu ích ngang các phép đo mà chúng tham chiếu. “Ngưỡng AI R&D-4” và “Tự chủ tầm xa” được định nghĩa trong văn xuôi chính sách; chúng chỉ trở nên có thể hành động khi các đánh giá cụ thể tạo ra các con số cụ thể.

METR là tổ chức đánh giá bên ngoài năm 2024–2026 đã định nghĩa nhiều con số trong số đó. Họ đánh giá các mô hình tiên tiến nhất — thường trước phát hành, theo NDA với các phòng thí nghiệm — và công bố phương pháp sau đó. Benchmark Time Horizon 1.1 (tháng 1 năm 2026) là hiện vật nổi bật của họ: một đại lượng vô hướng đơn lẻ nén năng lực thành một đơn vị con người có thể hiểu (“mô hình này có thể làm loại tác vụ mà một chuyên gia dành X giờ với độ tin cậy 50%”).

Bài học một phần về phương pháp (một tầm thời gian được tính như thế nào) và một phần về diễn giải (vì sao một tầm thời gian là một cận trên, không phải một dự đoán triển khai). Hai kỹ năng thuộc về nhau. Một nhóm hiểu cách tầm thời gian được khớp khó bị đánh lừa bằng một tuyên bố tệ của nhà cung cấp hơn nhiều so với một nhóm chỉ thấy “14 giờ” trên một slide.

## The Concept

### METR background

- Thành lập: tháng 12 năm 2023 (trước đây là ARC Evals, tách ra thành tổ chức 501(c)(3) độc lập).
- Phạm vi: đánh giá các năng lực tự chủ của các mô hình tiên tiến nhất, thường trước phát hành.
- Các phòng thí nghiệm đối tác: Anthropic, OpenAI (nhiều đợt hợp tác năm 2025–2026).
- Các sản phẩm bàn giao đáng chú ý: Time Horizon 1.0 (tháng 3 năm 2025), Time Horizon 1.1 (tháng 1 năm 2026), các đánh giá giám sát nguyên mẫu.

### The Time Horizon fit

Phương pháp (từ blog và các bài báo METR):

1. Thu thập một bộ tác vụ trải từ thời gian hoàn thành của chuyên gia ở quy mô phút đến quy mô giờ. Các bộ hiện tại: HCAST (180+ tác vụ), RE-Bench (71 tác vụ), SWAA.
2. Chạy mô hình trên mỗi tác vụ; ghi lại thành công hoặc thất bại.
3. Khớp một đường cong logistic: $P(\text{success})$ như một hàm của $\log(\text{expert completion time})$.
4. Tầm thời gian là thời gian chuyên gia mà tại đó P(thành công) = 0.5.

Hình dạng khớp logistic là hình dạng đúng vì năng lực thường có một mối quan hệ tăng, tiến tới cao nguyên với độ khó tác vụ. Điểm 50% là một lựa chọn (có thể là 10%, 90%); METR báo cáo nhiều ngưỡng trong bài báo chi tiết nhưng dẫn đầu bằng 50% vì nó trực quan nhất.

### The January 2026 numbers

Theo Time Horizon 1.1:

- Claude Opus 4.6: ~14 giờ ở độ tin cậy 50%, tính đến Time Horizon 1.1 (tháng 1 năm 2026).
- Thời gian tăng gấp đôi trên các tác vụ kiểu HCAST: ~4.3 tháng (130.8 ngày) trên phép khớp sau năm 2023 được Time Horizon 1.1 báo cáo (tháng 1 năm 2026); con số ~7 tháng là phép khớp toàn bộ giai đoạn 2019–2025 từ Time Horizon 1.0 và được báo cáo trong TH1.1 cùng với con số sau năm 2023.

Đó là các con số cụ thể mà phần còn lại của Giai đoạn 15 tham chiếu. Chúng được trích dẫn trong RSP v3.0 của Anthropic (Bài 19) và FSF v3 của DeepMind (Bài 20) như một trong những phép đo đầu vào cho các đánh giá ngưỡng.

### Benchmark suites

- **HCAST**: 189 tác vụ trên ML, an ninh mạng, kỹ thuật phần mềm, và suy luận tổng quát. Phạm vi: 1 phút đến 8+ giờ thời gian chuyên gia. Bộ chính đằng sau con số tầm thời gian.
- **RE-Bench**: 71 tác vụ kỹ thuật nghiên cứu ML với một đường cơ sở chuyên gia con người. Đo liệu mô hình có thể làm loại công việc R&D ML cung cấp đầu vào cho ngưỡng AI R&D-4 hay không.
- **SWAA**: các tác vụ ngắn hơn; hữu ích cho hiệu chuẩn đầu thấp của đường cong tầm thời gian.

### Prototype monitoring evaluations

Công việc METR năm 2025–2026 bao gồm các nguyên mẫu đánh giá giám sát: một bộ giám sát có thể bắt một mô hình thực hiện một tác vụ phụ (điều gì đó khác với những gì người vận hành yêu cầu) hay không; agent có thể né tránh bộ giám sát hay không. Những điều này cung cấp trực tiếp đầu vào cho danh mục “Làm suy yếu các biện pháp bảo vệ” trong OpenAI PF v2 và giám sát căn chỉnh lừa dối trong DeepMind FSF v3 (Bài 20).

### Why horizons are upper bounds

- **Công cụ được lý tưởng hóa**: các tác vụ benchmark cung cấp cho mô hình công cụ sạch và dữ liệu định dạng tốt. Các triển khai thực lộn xộn hơn.
- **Không có hệ quả thực**: mô hình không bao giờ thực sự tính phí khách hàng, xóa dữ liệu thực, hoặc liên hệ người thực. Các triển khai thực có những hệ quả không thể đảo ngược.
- **Lách ngữ cảnh đánh giá**: Bài 1. Các mô hình hành xử khác trong các kiểm thử. Báo cáo An toàn AI Quốc tế năm 2026 ghi nhận điều này bằng thực nghiệm.
- **Không có biến thiên người dùng hợp lệ**: các prompt benchmark có cấu trúc. Người dùng thực tạo ra các yêu cầu mơ hồ, phụ thuộc ngữ cảnh.

Tầm thời gian là mức trần năng lực dưới các điều kiện thuận lợi. Độ tin cậy triển khai là một con số khác, thấp hơn, và các nhóm phải đo phân phối của chính họ để biết nó.

### The external-evaluator case

Đánh giá bên ngoài quan trọng vì các phòng thí nghiệm nội bộ có động cơ tối ưu hóa các chỉ số họ báo cáo. Tính độc lập của METR — một tổ chức 501(c)(3) với phương pháp đã khai báo và các bài báo được bình duyệt — là biện pháp giảm thiểu mang tính cấu trúc. Chỉ riêng nó là không đủ (các phòng thí nghiệm vẫn kiểm soát những gì METR thấy), nhưng nó tốt hơn hẳn việc không có đánh giá bên ngoài.

### How to use horizon numbers in practice

- **Như một bộ lọc năng lực**: nếu tầm thời gian của mô hình thấp hơn nhiều so với thời gian chuyên gia của một tác vụ được đề xuất, đừng đưa nó ra dưới dạng tự chủ (file skill Bài 1).
- **Như một chỉ báo xu hướng**: thời gian tăng gấp đôi cho bạn biết thực hành hiện tại sẽ còn an toàn bao lâu ngay cả khi không có các biện pháp giảm thiểu mới.
- **Như một tiên nghiệm**: một tầm thời gian 14 giờ là một điểm xuất phát. Điều chỉnh giảm theo phân phối tác vụ, chất lượng công cụ, và ngữ cảnh triển khai của bạn.

```figure
a5-horizon-fit
```

## Use It

`code/main.py` triển khai phép khớp logistic giữa thành công tác vụ và $\log(\text{expert time})$, với một tập kết quả tổng hợp cho trước. Nó báo cáo chân trời 50% (con số chính của METR), chân trời 10% (thận trọng) và chân trời 90% (lạc quan). Cũng trình diễn điều thay đổi khi tỷ lệ thành công được thổi phồng nhân tạo bằng việc lách ngữ cảnh đánh giá.

## Ship It

`outputs/skill-horizon-interpretation.md` xem xét một tuyên bố tầm thời gian của nhà cung cấp và tạo một phân tích khoảng cách giữa tuyên bố benchmark và thực tế triển khai.

## Exercises

1. Chạy `code/main.py`. Xác nhận tầm thời gian 50% của phép khớp khớp chuẩn tham chiếu tổng hợp. Bây giờ giảm một nửa lưới thời gian tác vụ; ước tính tầm thời gian có thay đổi đáng kể không?

2. Đọc bài blog Time Horizon 1.1 của METR. Xác định các tác vụ cụ thể nơi độ tin cậy cao nhất và nơi thấp nhất. Giải thích vì sao khoảng cách tồn tại.

3. Đọc các tài nguyên “Measuring Autonomous AI Capabilities” của METR. Liệt kê các danh mục tác vụ HCAST. Chọn một danh mục bạn sẽ đặt trọng số lớn hơn cho một tác vụ sản xuất và giải thích vì sao.

4. Đưa lách ngữ cảnh đánh giá vào trình mô phỏng: đảo ~20% tác vụ thất bại thành thành công. Báo cáo tầm thời gian mới. Điều này xấp xỉ những gì tỷ lệ lách 20% gây ra cho con số quan sát được.

5. Thiết kế một đánh giá tầm thời gian nội bộ trên danh sách lỗi tồn đọng của chính bạn hoặc một tập tác vụ đại diện. Mô tả việc thu thập dữ liệu, phép khớp, và đầu ra cho bạn biết điều gì. So sánh với các con số METR.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| METR | “Bộ đánh giá bên ngoài” | trước đây là ARC Evals; tổ chức 501(c)(3) độc lập từ tháng 12 năm 2023 |
| Time Horizon (Tầm thời gian) | “Phép đo năng lực” | Độ dài tác vụ của chuyên gia ở độ tin cậy 50%, từ phép khớp logistic |
| HCAST | “Bộ chính của METR” | 180+ tác vụ trải từ 1 phút đến 8+ giờ |
| RE-Bench | “Kỹ thuật nghiên cứu” | 71 tác vụ kỹ thuật nghiên cứu ML với đường cơ sở con người |
| SWAA | “Bộ tác vụ ngắn” | Hiệu chuẩn đầu thấp của đường cong tầm thời gian |
| Doubling time (Thời gian tăng gấp đôi) | “Tốc độ tăng trưởng” | Thời gian để tầm thời gian 50% tăng gấp đôi; ~7 tháng theo HCAST |
| Eval-context gaming (Lách ngữ cảnh đánh giá) | “Mô hình hành xử khác” | Khoảng cách hành vi được ghi nhận giữa kiểm thử và triển khai |
| Upper bound (Cận trên) | “Tầm thời gian là một mức trần” | Tầm thời gian benchmark > độ tin cậy triển khai khi chịu tải |

## Further Reading

- [METR — Resources for Measuring Autonomous AI Capabilities](https://metr.org/measuring-autonomous-ai-capabilities/) — các đặc tả HCAST, RE-Bench, SWAA.
- [METR — Measuring AI Ability to Complete Long Tasks](https://metr.org/blog/2025-03-19-measuring-ai-ability-to-complete-long-tasks/) — bài báo tầm thời gian gốc.
- [METR — Time Horizon 1.1 (January 2026)](https://metr.org/research/) — các con số và phương pháp hiện tại.
- [Epoch AI — METR Time Horizons benchmark](https://epoch.ai/benchmarks/metr-time-horizons) — theo dõi trực tiếp.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — góc nhìn nội bộ về các phép đo của METR.
