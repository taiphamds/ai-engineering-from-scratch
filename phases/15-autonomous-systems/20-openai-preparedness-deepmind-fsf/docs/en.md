# OpenAI Preparedness Framework and DeepMind Frontier Safety Framework

> OpenAI Preparedness Framework v2 (tháng 4 năm 2025) đưa vào các Danh mục nghiên cứu — Tự chủ tầm xa, Cố ý thể hiện dưới năng lực, Tự sao chép và thích nghi, Làm suy yếu các biện pháp bảo vệ — khác với các Danh mục được theo dõi. Các Danh mục được theo dõi kích hoạt Báo cáo năng lực cộng với Báo cáo biện pháp bảo vệ được Safety Advisory Group xem xét. FSF v3 của DeepMind (tháng 9 năm 2025, với các Mức năng lực được theo dõi được bổ sung ngày 17 tháng 4 năm 2026) gộp tính tự chủ vào các lĩnh vực R&D ML và An ninh mạng (mức tự chủ R&D ML 1 = tự động hóa hoàn toàn pipeline R&D AI với chi phí cạnh tranh so với con người + công cụ AI). FSF v3 giải quyết rõ ràng căn chỉnh lừa dối thông qua giám sát tự động việc lạm dụng suy luận công cụ. Ghi chú thẳng thắn: các Danh mục nghiên cứu trong PF v2 (bao gồm Tự chủ tầm xa) không tự động kích hoạt các biện pháp giảm thiểu; ngôn ngữ chính sách là “tiềm năng.” Bản thân DeepMind nói giám sát tự động “sẽ không còn đủ trong dài hạn” nếu suy luận công cụ mạnh lên.

**Type:** Learn
**Languages:** Python (stdlib, three-framework decision-table diff tool)
**Prerequisites:** Phase 15 · 19 (Anthropic RSP)
**Time:** ~45 minutes

## The Problem

Bài 19 đọc kỹ chính sách mở rộng quy mô của Anthropic. Bài này hoàn thiện bức tranh bằng cách đọc các chính sách của OpenAI và DeepMind. Ba tài liệu là các hiện vật họ hàng giải quyết cùng câu hỏi — khi nào một phòng thí nghiệm tiên tiến nhất nên tạm dừng hoặc đặt cổng kiểm soát một mô hình — và chúng hội tụ vào một tập nhỏ các danh mục và khác biệt ở các điểm cụ thể quan trọng.

Sự hội tụ: cả ba đều gắn nhãn tự chủ tầm xa là một loại năng lực đáng theo dõi. Cả ba thừa nhận hành vi lừa dối (giả vờ căn chỉnh, cố ý thể hiện dưới năng lực) là một loại rủi ro cụ thể. Cả ba có một cơ quan xem xét nội bộ. Sự khác biệt: OpenAI tách các danh mục thành “Được theo dõi” (giảm thiểu bắt buộc) và “Nghiên cứu” (không có kích hoạt tự động). DeepMind gộp tính tự chủ vào hai lĩnh vực thay vì nêu tên riêng. Phòng thí nghiệm đặt tên Được theo dõi so với Nghiên cứu, hoặc Tới hạn so với Trung bình, hoặc Tầng-1 so với Tầng-2; hệ quả vận hành của việc một năng lực nằm trong nhóm nào khác nhau giữa các phòng thí nghiệm.

Đọc chúng cùng nhau là bài tập hữu ích. Cùng một năng lực có thể là “giảm thiểu bắt buộc” tại Anthropic, “được giám sát nhưng không kích hoạt” tại OpenAI, và “được theo dõi trong một lĩnh vực cụ thể” tại DeepMind. Lập trường chính sách quan trọng.

## The Concept

### OpenAI Preparedness Framework v2 (April 2025)

Cấu trúc:

- **Các Danh mục được theo dõi**: kích hoạt Báo cáo năng lực (mô hình có thể làm gì) cộng với Báo cáo biện pháp bảo vệ (các biện pháp giảm thiểu nào đang được áp dụng). Được Safety Advisory Group xem xét trước triển khai.
- **Các Danh mục nghiên cứu**: các năng lực mô hình mà phòng thí nghiệm đang theo dõi nhưng chưa cam kết các biện pháp giảm thiểu cụ thể. Bao gồm Tự chủ tầm xa, Cố ý thể hiện dưới năng lực, Tự sao chép và thích nghi, Làm suy yếu các biện pháp bảo vệ.

Cách định hình then chốt trong v2: các Danh mục nghiên cứu không tự động kích hoạt các biện pháp giảm thiểu. Ngôn ngữ chính sách là các biện pháp giảm thiểu “tiềm năng”. Đây là khác biệt cụ thể cần theo dõi: vị trí của một danh mục trong Được theo dõi hay Nghiên cứu là bản lề giữa “được đặt cổng kiểm soát” và “được quan sát.”

### DeepMind Frontier Safety Framework v3 (September 2025; Tracked Capability Levels added April 17, 2026)

Cấu trúc:

- **Các Mức năng lực tới hạn (CCL)**: các ngưỡng năng lực trên năm lĩnh vực: An ninh mạng, Sinh học, R&D ML, CBRN, Tự chủ (được gộp vào R&D ML và An ninh mạng).
- **Các Mức năng lực được theo dõi**: độ hạt bổ sung được thêm vào tháng 4 năm 2026. Ví dụ cụ thể: mức tự chủ R&D ML 1 = tự động hóa hoàn toàn pipeline R&D AI với chi phí cạnh tranh so với con người + công cụ AI.
- **Giám sát căn chỉnh lừa dối**: cam kết tường minh giám sát tự động việc lạm dụng suy luận công cụ.

Cách định hình tính tự chủ khác với OpenAI. DeepMind không giữ “Tự chủ” như một lĩnh vực cấp cao nhất; nó được gộp vào các lĩnh vực mà tính tự chủ sẽ gây hại (R&D ML và An ninh mạng). Lập luận là tính tự chủ không có lĩnh vực là năng lực không có rủi ro; phản biện là tính tự chủ xuyên lĩnh vực là một siêu rủi ro mà khung nên nêu tên.

### What all three converge on

- Safety Advisory Group nội bộ (được đặt tên Anthropic SAG, OpenAI SAG, ủy ban nội bộ DeepMind). Xem xét trước triển khai đối với các mô hình năng lực cao.
- Đề cập tường minh căn chỉnh lừa dối / giả vờ căn chỉnh như một loại rủi ro.
- Các hiện vật thường trực theo một nhịp đã khai báo (Anthropic: Frontier Safety Roadmap, Risk Report; OpenAI: Báo cáo năng lực và biện pháp bảo vệ; DeepMind: chu kỳ cập nhật FSF).
- Thừa nhận rằng các biện pháp phòng thủ chỉ giám sát có một mức trần. DeepMind nói rõ: “giám sát tự động sẽ không còn đủ trong dài hạn.”

### Where they diverge

- **Anthropic**: cam kết tạm dừng bị loại bỏ trong v3.0; ngưỡng AI R&D-4 là cổng tiếp theo được nêu tên.
- **OpenAI**: sự tách biệt Được theo dõi so với Nghiên cứu; các Danh mục nghiên cứu (bao gồm Tự chủ tầm xa) không tự động đặt cổng kiểm soát.
- **DeepMind**: tính tự chủ được gộp vào các lĩnh vực khác; các Mức năng lực được theo dõi bổ sung độ hạt vào tháng 4 năm 2026.

### Sandbagging: a specific capability that complicates all three

Cố ý thể hiện dưới năng lực (một mô hình thể hiện dưới năng lực một cách chiến lược trên các đánh giá) nằm trong các Danh mục nghiên cứu của OpenAI. RSP v3.0 của Anthropic giải quyết nó thông qua khoảng cách ngữ cảnh đánh giá (Bài 1). DeepMind giải quyết nó thông qua giám sát căn chỉnh lừa dối trong FSF v3.

Nếu một mô hình cố ý thể hiện dưới năng lực trên các đánh giá, các ngưỡng năng lực của mọi khung đều bị đánh giá thấp. Khung chỉ hoạt động nếu phép đo hoạt động. Đây là lý do phép đo bên ngoài (Bài 21, METR) và đánh giá đối kháng là cần thiết bên cạnh tự đánh giá của phòng thí nghiệm.

### The policy-reading skill

- Định vị: mọi năng lực bạn quan tâm nên có thể tìm thấy trong chính sách. Nếu không thể tìm thấy, chính sách không bao phủ nó.
- Phân loại: nó là Được theo dõi (kích hoạt giảm thiểu) hay Nghiên cứu (được theo dõi nhưng không kích hoạt)? OpenAI nêu tên điều này; Anthropic và DeepMind có các dạng tương đương riêng.
- Nhịp: chính sách được cập nhật theo một lịch đã khai báo, hay chỉ sau các sự kiện cụ thể? Nhịp đã khai báo mạnh hơn.
- Tính độc lập: xem xét bên ngoài là bắt buộc hay tùy chọn? Anthropic hợp tác với Apollo và US AI Safety Institute; OpenAI với METR; DeepMind chủ yếu với SAG nội bộ.

```figure
a5-tracked-vs-research
```

## Use It

`code/main.py` triển khai một công cụ so sánh khác biệt bảng quyết định nhỏ. Với một năng lực (tự chủ, căn chỉnh lừa dối, tự động hóa R&D, nâng cao năng lực an ninh mạng, v.v.), nó xuất cách mỗi chính sách trong ba chính sách phân loại năng lực, và các biện pháp giảm thiểu nào kích hoạt. Nó là một công cụ hỗ trợ đọc, không phải một công cụ chính sách.

## Ship It

`outputs/skill-cross-policy-diff.md` tạo một phép so sánh xuyên chính sách cho một năng lực cụ thể, sử dụng ba khung làm tham chiếu.

## Exercises

1. Chạy `code/main.py`. Xác nhận đầu ra công cụ so sánh khác biệt khớp các chính sách cho ít nhất hai năng lực bạn có thể xác minh dựa trên các tài liệu nguồn.

2. Đọc toàn bộ OpenAI Preparedness Framework v2. Xác định mỗi Danh mục nghiên cứu. Với mỗi danh mục, viết một câu về vì sao nó nằm trong Nghiên cứu thay vì Được theo dõi.

3. Đọc toàn bộ DeepMind FSF v3, cộng với bản cập nhật các Mức năng lực được theo dõi tháng 4 năm 2026. Xác định các tiêu chí đánh giá cụ thể của mức tự chủ R&D ML 1. Bạn sẽ đo nó từ bên ngoài như thế nào?

4. Cố ý thể hiện dưới năng lực nằm trong các Danh mục nghiên cứu của OpenAI. Thiết kế một đánh giá sẽ buộc một mô hình cố ý thể hiện dưới năng lực bộc lộ năng lực thực tế. Tham chiếu thảo luận lách ngữ cảnh đánh giá ở Bài 1.

5. So sánh ba chính sách trên một năng lực cụ thể (bạn chọn). Nêu phân loại của chính sách nào bạn thấy nghiêm ngặt nhất và ít nghiêm ngặt nhất. Giải thích bằng văn bản nguồn.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| Preparedness Framework (Khung sẵn sàng) | “Chính sách mở rộng quy mô của OpenAI” | PF v2 (tháng 4 năm 2025); các danh mục Được theo dõi so với Nghiên cứu |
| Tracked Category (Danh mục được theo dõi) | “Giảm thiểu bắt buộc” | Kích hoạt Báo cáo năng lực + biện pháp bảo vệ; xem xét SAG |
| Research Category (Danh mục nghiên cứu) | “Chỉ được giám sát” | Được theo dõi nhưng không có giảm thiểu tự động; bao gồm Tự chủ tầm xa |
| Frontier Safety Framework (Khung an toàn tiên tiến nhất) | “Chính sách mở rộng quy mô của DeepMind” | FSF v3 (tháng 9 năm 2025) + các Mức năng lực được theo dõi (tháng 4 năm 2026) |
| CCL | “Mức năng lực tới hạn” | Ngưỡng DeepMind theo từng lĩnh vực (An ninh mạng, Sinh học, R&D ML, CBRN) |
| ML R&D autonomy level 1 (Mức tự chủ R&D ML 1) | “Tự động hóa R&D” | Tự động hóa hoàn toàn pipeline R&D AI với chi phí cạnh tranh |
| Sandbagging (Cố ý thể hiện dưới năng lực) | “Thể hiện dưới năng lực có chiến lược” | Mô hình thể hiện dưới năng lực trên các đánh giá; trong các Danh mục nghiên cứu của OpenAI |
| Instrumental reasoning (Suy luận công cụ) | “Suy luận phương tiện-mục đích” | Suy luận về cách đạt mục tiêu; đích giám sát của DeepMind |

## Further Reading

- [OpenAI — Updating our Preparedness Framework](https://openai.com/index/updating-our-preparedness-framework/) — thông báo v2.
- [OpenAI — Preparedness Framework v2 PDF](https://cdn.openai.com/pdf/18a02b5d-6b67-4cec-ab64-68cdfbddebcd/preparedness-framework-v2.pdf) — toàn bộ tài liệu.
- [DeepMind — Strengthening our Frontier Safety Framework](https://deepmind.google/blog/strengthening-our-frontier-safety-framework/) — thông báo FSF v3.
- [DeepMind — Updating the Frontier Safety Framework (April 2026)](https://deepmind.google/blog/updating-the-frontier-safety-framework/) — bổ sung các Mức năng lực được theo dõi.
- [Gemini 3 Pro FSF Report](https://storage.googleapis.com/deepmind-media/gemini/gemini_3_pro_fsf_report.pdf) — ví dụ về một Risk Report theo định dạng FSF.
