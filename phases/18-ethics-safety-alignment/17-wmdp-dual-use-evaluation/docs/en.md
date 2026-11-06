# WMDP and Dual-Use Capability Evaluation

> Li và cộng sự, "The WMDP Benchmark: Measuring and Reducing Malicious Use With Unlearning" (ICML 2024, arXiv:2403.03218). 4,157 câu hỏi trắc nghiệm trên an ninh sinh học (1,520), an ninh mạng (2,225) và hóa học (412). Câu hỏi hoạt động trong "vùng vàng" — kiến thức hỗ trợ gần kề, được lọc qua rà soát đa chuyên gia và tuân thủ pháp lý ITAR/EAR. Mục đích kép: đánh giá đại diện năng lực lưỡng dụng và phép đo chuẩn quên học (phương pháp RMU đi kèm giảm hiệu năng WMDP trong khi giữ năng lực chung). Câu chuyện lĩnh vực 2024-2025: đánh giá OpenAI/Anthropic đầu năm 2024 báo cáo "mức nâng nhẹ" so với tìm kiếm internet; đến tháng 4 năm 2025, Preparedness Framework v2 của OpenAI nói mô hình "sắp có thể giúp đáng kể người mới tạo đe dọa sinh học đã biết." Thử nghiệm thu nhận vũ khí sinh học Anthropic cho mức nâng 2.53x, không đủ loại trừ ASL-3.

**Type:** Learn
**Languages:** Python (stdlib, WMDP-shaped uplift evaluation harness)
**Prerequisites:** Phase 18 · 16 (red-team tooling), Phase 14 (agent engineering)
**Time:** ~60 minutes

## Learning Objectives

- Mô tả ba miền WMDP, số câu hỏi và tiêu chí lọc "vùng vàng".
- Giải thích RMU và tại sao WMDP vừa là đánh giá vừa là phép đo chuẩn quên học.
- Mô tả câu chuyện mức nâng 2024-2025: "mức nâng nhẹ" -> "sắp có thể" -> "không đủ loại trừ ASL-3."
- Phân biệt mức nâng tương đối cho người mới với năng lực tuyệt đối cho chuyên gia.

## The Problem

Năng lực lưỡng dụng là vấn đề đo lường dưới khung an toàn tiên tiến hàng đầu của mọi phòng thí nghiệm (Bài 18). Câu hỏi: mô hình X có nâng đáng kể khả năng người mới gây hại hàng loạt trong sinh học, hóa học hay mạng không? Đo trực tiếp (yêu cầu mô hình thực sự tạo gây hại) là bất hợp pháp và phi đạo đức. Đo đại diện cần phép đo chuẩn mô hình không thể từ chối (để tạo số liệu năng lực trung thực) nhưng câu hỏi tự chúng không phải công bố có hại.

## The Concept

### The "yellow zone"

Câu hỏi cần kiến thức hỗ trợ gần kề của quá trình có hại mà không phải công thức tổng hợp trực tiếp. "Thuốc thử nào xúc tác bước 4 của [con đường đã công bố]?" chứ không phải "làm thế nào tạo [hợp chất nguy hiểm]?" Mỗi câu được nhiều chuyên gia miền rà soát; lọc tuân thủ kiểm soát xuất khẩu ITAR/EAR.

Tổng 4,157 câu hỏi:
- An ninh sinh học: 1,520
- An ninh mạng: 2,225
- Hóa học: 412

Dạng trắc nghiệm. Mô hình trả lời mà không được yêu cầu hỗ trợ điều gì; năng lực đo được mà không gợi hành vi có hại.

### RMU — Representation Misdirection for Unlearning

Phương pháp quên học đi kèm. Áp dụng cho LLaMa-2-7B, giảm điểm WMDP gần ngẫu nhiên trong khi giữ MMLU và phép đo chuẩn năng lực chung khác trong vài điểm phần trăm. Phương pháp công bố là đường cơ sở quên học cho mọi bài báo quên học sinh-hóa-mạng sau đó.

### The 2024-2025 uplift narrative

Ba pha:

1. **2024 "mức nâng nhẹ."** Đánh giá Preparedness/RSP sớm của OpenAI và Anthropic báo cáo lợi thế nhỏ so với tìm kiếm internet cho người mới thử tác vụ gần sinh học. Cách mô tả công khai: mô hình tiên tiến hàng đầu giúp, nhưng không nhiều hơn Google đáng kể.

2. **Tháng 4 năm 2025 "sắp có thể."** Preparedness Framework v2 của OpenAI báo cáo mô hình "sắp có thể giúp đáng kể người mới tạo đe dọa sinh học đã biết." Không phải khẳng định năng lực — cảnh báo ngưỡng đó đã gần.

3. **Thử nghiệm thu nhận vũ khí sinh học 2025 của Anthropic.** Nghiên cứu có kiểm soát với người tham gia mới, đo thành công tương đối trên tác vụ pha thu nhận. Báo cáo mức nâng 2.53x. Không đủ loại trừ ASL-3 (Bài 18) — ngưỡng tầng 3 Responsible Scaling Policy của Anthropic đã đạt hoặc gần đạt.

### Novice-relative vs expert-absolute

Phân biệt cốt yếu:

- **Mức nâng tương đối cho người mới.** Mô hình giúp người không chuyên bao nhiêu? Theo hệ số nhân. Lợi thế tương đối cao vì người mới biết ít; ngay cả thông tin vừa phải cũng giúp.
- **Năng lực tuyệt đối cho chuyên gia.** Mô hình tạo bao nhiêu thông tin ở nỗ lực tối đa? Chuyên gia có thể lấy nhiều hơn người mới. Trần tuyệt đối cao.

Hồ sơ lập luận an toàn (Bài 18) nhắm cả hai: "mô hình không thể cho người mới đủ mức nâng để thực hiện" cộng "chuyên gia không thể lấy thông tin chưa công bố từ mô hình."

### The measurement pitfall

WMDP là đại diện năng lực, không phải đo triển khai. Mô hình điểm WMDP cao có thể hoặc không thể bị người mới khai thác thực tế, tùy:
- Khả năng chống gợi năng lực (khó đến đâu để lấy năng lực mà không kích hoạt bộ lọc an toàn)
- Kiến thức ngầm (năng lực cần kỹ năng phòng thí nghiệm ướt, không phải thông tin)
- Rào cản thực hiện (mua sắm, thiết bị)

Thử nghiệm thu nhận vũ khí sinh học 2025 của Anthropic thêm lớp gợi năng lực của người mới trên năng lực kiểu WMDP: đo thành công tác vụ thực, không phải năng lực trắc nghiệm.

### Where this fits in Phase 18

Bài 12-16 là công cụ tấn công và phòng vệ trên đầu ra mô hình. Bài 17 là lớp năng lực lưỡng dụng — phép đo mà khung an toàn tiên tiến hàng đầu (Bài 18) đánh giá. Bài 30 khép mạch bằng bằng chứng mức nâng mạng/sinh/hóa/hạt nhân hiện tại năm 2026.

```figure
al-wmdp-yellow-zone
```

## Use It

`code/main.py` xây bộ kiểm thử đánh giá dạng WMDP đơn giản. Mô hình giả được kiểm thử trên câu hỏi chia nhóm; điểm theo miền được báo cáo. Can thiệp quên học đơn giản (đặt biểu diễn riêng theo miền về không) giảm điểm; bạn có thể đo đánh đổi với năng lực chung.

## Ship It

Bài học này tạo ra `outputs/skill-wmdp-eval.md`. Với khẳng định năng lực lưỡng dụng ("mô hình chúng tôi không giúp đáng kể với vũ khí sinh học"), kiểm tra: phép đo chuẩn nào chạy, đường từ chối nào dùng cho đánh giá (hoàn thành thô so với có cổng chính sách), và nghiên cứu gợi năng lực của người mới có bổ sung kết quả trắc nghiệm không.

## Exercises

1. Chạy `code/main.py`. Báo cáo độ chính xác theo miền trước và sau bước quên học đơn giản. Giải thích đánh đổi năng lực chung.

2. Bổ sung miền thứ tư cho WMDP đơn giản (ví dụ: phóng xạ). Chỉ định hai loại câu hỏi minh họa trong vùng vàng. Giải thích tại sao soạn câu hỏi như vậy khó hơn thêm câu hỏi dạng MMLU.

3. Đọc Phần 5 WMDP 2024 (phương pháp RMU). Phác thảo cách quên học đơn giản hơn (ví dụ: ức chế top-k neuron cho nội dung miền) và mô tả chi phí năng lực chung dự kiến.

4. Thử nghiệm thu nhận vũ khí sinh học Anthropic 2025 báo cáo mức nâng 2.53x. Mô tả hai cách con số có thể thiên lệch lên (cỡ mẫu người mới, độ trung thực tác vụ) và hai cách xuống (trần gợi năng lực, cổng an toàn mô hình).

5. Trình bày hồ sơ lập luận an toàn cho ASL-3 cần gì ngoài vượt quên học WMDP. Nêu ít nhất hai nghiên cứu gợi năng lực bổ sung.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| WMDP | "phép đo chuẩn lưỡng dụng" | 4,157 câu hỏi MCQ trên sinh/mạng/hóa trong vùng vàng |
| Yellow zone (Vùng vàng) | "hỗ trợ nhưng không tổng hợp" | Kiến thức gần năng lực có hại mà không là công thức tổng hợp |
| RMU | "đường cơ sở quên học" | Chuyển hướng Biểu diễn để Quên học; giảm điểm WMDP, giữ năng lực chung |
| Novice-relative uplift (Mức nâng tương đối cho người mới) | "giúp người không chuyên bao nhiêu" | Lợi thế theo hệ số nhân so với tìm internet hiện trạng cho người mới |
| Expert-absolute capability (Năng lực tuyệt đối cho chuyên gia) | "trần cho chuyên gia" | Thông tin tối đa chuyên gia có động lực lấy được từ mô hình |
| Acquisition-phase task (Tác vụ pha thu nhận) | "bước trước tổng hợp" | Mua sắm, thiết bị, giấy phép — phần sớm nhất của con đường gây hại |
| ITAR/EAR | "tuân thủ kiểm soát xuất khẩu" | Khung pháp lý ràng buộc công bố một số kiến thức hỗ trợ |

## Further Reading

- [Li et al. — The WMDP Benchmark (arXiv:2403.03218, ICML 2024)](https://arxiv.org/abs/2403.03218) — bài báo phép đo chuẩn và RMU
- [OpenAI — Preparedness Framework v2 (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) — cách nói "sắp có thể"
- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) — ngưỡng sinh học ASL-3 và kết quả thử nghiệm thu nhận
- [DeepMind — Frontier Safety Framework v3.0 (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — CCL mức nâng sinh học
