# Frontier Safety Frameworks — RSP, PF, FSF

> Ba khung của phòng thí nghiệm lớn xác định quản trị ngành năm 2026 đối với năng lực tiên tiến hàng đầu. Responsible Scaling Policy v3.0 của Anthropic (tháng 2 năm 2026) đưa ra AI Safety Levels phân tầng (ASL-1 đến ASL-5+), mô phỏng cấp an toàn sinh học, với ASL-3 kích hoạt tháng 5 năm 2025 cho mô hình liên quan CBRN. Preparedness Framework v2 của OpenAI (tháng 4 năm 2025) xác định năm tiêu chí cho năng lực theo dõi và tách Báo cáo Năng lực khỏi Báo cáo Biện pháp Bảo vệ. Frontier Safety Framework v3.0 của DeepMind (tháng 9 năm 2025) đưa ra Critical Capability Levels gồm CCL Thao túng Có hại mới. Cả ba giờ gồm điều khoản điều chỉnh theo đối thủ cho phép hoãn nếu phòng thí nghiệm ngang hàng phát hành không có biện pháp bảo vệ tương đương. Sự căn chỉnh xuyên phòng thí nghiệm vẫn mang tính cấu trúc, không phải thuật ngữ: "Ngưỡng Năng lực," "ngưỡng Năng lực Cao" và "Mức Năng lực Tới hạn" biểu thị cấu trúc tương tự.

**Type:** Learn
**Languages:** none
**Prerequisites:** Phase 18 · 17 (WMDP), Phase 18 · 07-09 (deception failures)
**Time:** ~75 minutes

## Learning Objectives

- Mô tả cấu trúc tầng ASL Anthropic và điều kích hoạt ASL-3.
- Nêu năm tiêu chí Preparedness Framework v2 OpenAI cho năng lực theo dõi.
- Mô tả cấu trúc Mức Năng lực Tới hạn DeepMind và CCL Thao túng Có hại.
- Giải thích điều khoản điều chỉnh theo đối thủ và tại sao quan trọng với động lực chạy đua.
- Định nghĩa hồ sơ lập luận an toàn và mô tả cấu trúc ba trụ cột (giám sát, tính không dễ hiểu, thiếu năng lực).

## The Problem

Bài 7-17 xác lập lừa dối có thể xảy ra, năng lực lưỡng dụng tồn tại và đánh giá có giới hạn. Phòng thí nghiệm có mô hình năng lực tiên tiến hàng đầu cần cấu trúc quản trị nội bộ:
- Xác định ngưỡng khi cần biện pháp bảo vệ mới.
- Xác định đánh giá bắt buộc trước mở rộng.
- Mô tả hồ sơ lập luận an toàn trông thế nào.
- Xử lý vấn đề động lực chạy đua (nếu đối thủ phát hành không biện pháp bảo vệ, bạn làm gì?).

Ba khung 2025-2026 là tiên tiến nhất — không hoàn hảo, đang tiến hóa, và đủ thống nhất giữa phòng thí nghiệm để câu hỏi quản trị giờ là khung có đủ không, không phải có tồn tại không.

## The Concept

### Anthropic Responsible Scaling Policy v3.0 (February 2026)

Cấu trúc ASL:
- ASL-1: không phải mô hình tiên tiến hàng đầu (được bao hàm bởi đường cơ sở yếu-hơn-tiên-tiến-hàng-đầu).
- ASL-2: đường cơ sở tiên tiến hàng đầu hiện tại; triển khai với biện pháp bảo vệ thông thường.
- ASL-3: rủi ro lạm dụng thảm họa cao hơn đáng kể; năng lực liên quan CBRN. Kích hoạt tháng 5 năm 2025.
- ASL-4: vượt ngưỡng AI R&D-2; mô hình có thể tự động hóa nghiên cứu AI cấp đầu vào.
- ASL-5+: R&D AI tiên tiến; mô hình tăng tốc đáng kể mở rộng hiệu dụng.

Mới trong v3.0:
- Lộ trình An toàn Tiên tiến hàng đầu (công khai dạng đã lược che).
- Báo cáo Rủi ro (hằng quý, một số được bên ngoài rà soát).
- R&D AI tách thành AI R&D-2 và AI R&D-4.
- Khi vượt AI R&D-4, cần hồ sơ lập luận an toàn khẳng định, xác định rủi ro lệch căn chỉnh từ mô hình theo đuổi mục tiêu lệch căn chỉnh.

### OpenAI Preparedness Framework v2 (April 15, 2025)

Năm tiêu chí cho năng lực theo dõi:
- **Hợp lý.** Tồn tại mô hình đe dọa hợp lý.
- **Đo được.** Có thể đánh giá thực nghiệm.
- **Nghiêm trọng.** Thiệt hại lớn.
- **Hoàn toàn mới.** Không phải rủi ro sẵn có được mở rộng.
- **Tức thời-hoặc-không thể khắc phục.** Thiệt hại xảy ra nhanh hoặc không thể đảo ngược.

Năng lực đáp ứng cả năm được theo dõi. Những năng lực khác không được.

Cấu trúc PF v2 khác:
- Tách Báo cáo Năng lực (mô hình làm được gì) khỏi Báo cáo Biện pháp Bảo vệ (có kiểm soát gì).
- Nhóm Tư vấn An toàn rà soát.
- Lãnh đạo phê duyệt; Ủy ban An toàn & Bảo mật của Hội đồng giám sát.
- "Điều khoản điều chỉnh": OpenAI có thể giảm yêu cầu nếu phòng thí nghiệm khác phát hành không có biện pháp bảo vệ tương đương.

### DeepMind Frontier Safety Framework v3.0 (September 2025)

Mức Năng lực Tới hạn (CCL) theo miền:
- Mức nâng Vũ khí Sinh học
- Mức nâng Mạng
- Tăng tốc R&D ML
- Thao túng Có hại (mới trong v3.0): mô hình có thể thay đổi đáng kể niềm tin/hành vi trong ngữ cảnh hệ trọng.

v2.0 (tháng 2 năm 2025) thêm phần Căn chỉnh Mang tính Lừa dối và cấp bảo mật cao hơn cho CCL R&D ML.

### Cross-lab alignment

- Anthropic "Ngưỡng Năng lực."
- DeepMind "Mức Năng lực Tới hạn."
- OpenAI "ngưỡng Năng lực Cao."

Không có thuật ngữ chuẩn toàn ngành. Đồng nhất về cấu trúc: mỗi trong ba framework xác định các ngưỡng năng lực phân tầng với tiêu chí đánh giá được công bố. Cả ba đều có các điều khoản điều chỉnh theo đối thủ cạnh tranh (từ năm 2025 trở đi).

### Safety cases

Hồ sơ lập luận an toàn là lập luận bằng văn bản rằng triển khai an toàn ở mức chấp nhận được dưới giả định trường hợp xấu nhất. Cấu trúc tiêu chuẩn nhắm ba trụ cột:

- **Giám sát.** Có thể phát hiện hành vi xấu nếu xảy ra không?
- **Tính không dễ hiểu.** Mô hình có thiếu khả năng thực hiện kế hoạch mạch lạc gây hại không?
- **Thiếu năng lực.** Mô hình có thiếu năng lực gây thiệt hại đang xét không?

Các hồ sơ an toàn khác nhau nhắm vào các trụ cột khác nhau. Với một hồ sơ ASL-3 CBRN, không có năng lực (qua unlearning) là mục tiêu chính. Với deceptive alignment, giám sát và tính khó đọc hiểu là các mục tiêu. Với nâng cao năng lực cyber, cả ba đều liên quan.

### The race-dynamic problem

Điều khoản điều chỉnh theo đối thủ gây tranh cãi. Người phê bình lập luận chúng tạo cuộc đua xuống đáy: nếu cả ba phòng thí nghiệm giảm yêu cầu khi đối thủ phản bội, cân bằng dịch sang phản bội. Người bảo vệ lập luận phương án khác (biện pháp bảo vệ đơn phương) tạo kết quả tệ hơn nếu phòng thí nghiệm phản bội ít ý thức an toàn hơn.

UK AISI, US CAISI và EU AI Office (Bài 24) là đối tác quản trị bên ngoài. Khung phòng thí nghiệm tự nguyện; khung quy định đang nổi lên.

### Where this fits in Phase 18

Bài 17-18 là lớp đo lường-và-quản trị trên phân tích lừa dối và red-team. Bài 19-24 đề cập phúc lợi, thiên lệch, quyền riêng tư, watermark và cấu trúc quy định. Bài 28 lập bản đồ hệ sinh thái nghiên cứu (MATS, Redwood, Apollo, METR) hiện thực hóa đánh giá.

```figure
al-asl-ladder
```

## Use It

Không có mã cho bài này. Đọc ba nguồn sơ cấp: RSP v3.0, PF v2, FSF v3.0. Ánh xạ cấu trúc tầng mỗi phòng thí nghiệm với các bên khác và xác định một ngưỡng mỗi bên định nghĩa mà các bên khác không có.

## Ship It

Bài học này tạo ra `outputs/skill-framework-diff.md`. Với khung an toàn hoặc ghi chú phát hành, so sánh định nghĩa ngưỡng, đánh giá bắt buộc và cấu trúc hồ sơ lập luận an toàn với RSP v3.0, PF v2, FSF v3.0 và đánh dấu khoảng trống xuyên phòng thí nghiệm.

## Exercises

1. Đọc RSP v3.0, PF v2 và FSF v3.0. Lập bảng ngưỡng CBRN mỗi phòng thí nghiệm, ngưỡng R&D AI mỗi bên và đánh giá trước triển khai bắt buộc mỗi bên.

2. Điều khoản điều chỉnh theo đối thủ có trong cả ba khung (2025+). Viết một đoạn ủng hộ; viết một đoạn phản đối. Xác định giả định mỗi lập trường phụ thuộc.

3. Thiết kế hồ sơ lập luận an toàn cho mô hình vượt ngưỡng AI R&D-4 Anthropic. Nêu bằng chứng mỗi trụ cột (giám sát, tính không dễ hiểu, thiếu năng lực) cần.

4. FSF v3.0 DeepMind đưa ra CCL Thao túng Có hại. Đề xuất ba phép đo thực nghiệm chỉ ra mô hình đã vượt ngưỡng.

5. Đọc "Common Elements of Frontier AI Safety Policies" của METR (2025). Nêu ba hội tụ xuyên phòng thí nghiệm mạnh nhất và hai khác biệt lớn nhất.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| RSP | "khung Anthropic" | Chính sách Mở rộng Có trách nhiệm; tầng ASL; v3.0 tháng 2 năm 2026 |
| PF | "khung OpenAI" | Khung Chuẩn bị; năm tiêu chí; v2 tháng 4 năm 2025 |
| FSF | "khung DeepMind" | Khung An toàn Tiên tiến hàng đầu; CCL; v3.0 tháng 9 năm 2025 |
| ASL-3 | "tương tự cấp an toàn sinh học 3" | Tầng Anthropic cho năng lực liên quan CBRN; kích hoạt tháng 5 năm 2025 |
| CCL | "mức năng lực tới hạn" | Cấu trúc ngưỡng DeepMind; theo miền |
| Safety case (Hồ sơ lập luận an toàn) | "lập luận hình thức" | Lập luận bằng văn bản triển khai an toàn ở mức chấp nhận dưới U trường hợp xấu nhất |
| Adjustment clause (Điều khoản điều chỉnh) | "cho phép đối thủ phản bội" | Điều khoản khung giảm yêu cầu nếu đối thủ phát hành không có biện pháp bảo vệ tương đương |

## Further Reading

- [Anthropic — Responsible Scaling Policy v3.0 (February 2026)](https://www.anthropic.com/responsible-scaling-policy) — tầng ASL, lộ trình, tách R&D AI
- [OpenAI — Updating the Preparedness Framework (April 15, 2025)](https://openai.com/index/updating-our-preparedness-framework/) — năm tiêu chí, điều khoản điều chỉnh
- [DeepMind — Strengthening our Frontier Safety Framework (September 2025)](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — CCL v3.0, Thao túng Có hại
- [METR — Common Elements of Frontier AI Safety Policies (2025)](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) — so sánh xuyên phòng thí nghiệm
