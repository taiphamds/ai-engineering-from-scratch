# Bias and Representational Harm in LLMs

> Gallegos, Rossi, Barrow, Tanjim, Kim, Dernoncourt, Yu, Zhang, Ahmed (Computational Linguistics 2024, arXiv:2309.00770). Khảo sát nền tảng 2024 phân biệt tổn hại biểu đạt (khuôn mẫu, xóa bỏ) với tổn hại phân bổ (phân phối tài nguyên bất bình đẳng) và phân nhóm chỉ số đánh giá thành dựa trên embedding, xác suất hoặc văn bản được sinh. Thực nghiệm 2024-2025: An và cộng sự (PNAS Nexus, tháng 3 năm 2025) đo thiên lệch giao thoa giới x chủng tộc trên GPT-3.5 Turbo, GPT-4o, Gemini 1.5 Flash, Claude 3.5 Sonnet, Llama 3-70B trong đánh giá hồ sơ tự động cho 20 việc làm cấp đầu vào. WinoIdentity (COLM 2025, arXiv:2508.07111) đưa ra đánh giá công bằng dựa trên bất định cho bản sắc giao thoa. Yu & Ananiadou 2025 xác định neuron giới trong lớp MLP; Ahsan & Wallace 2025 dùng SAE phơi bày thiên lệch chủng tộc lâm sàng; Zhou và cộng sự 2024 (UniBias) thao tác đầu attention để khử thiên lệch. Phê bình tổng quan (arXiv:2508.11067): tài liệu 10 năm tập trung không tương xứng vào thiên lệch giới nhị nguyên.

**Type:** Build
**Languages:** Python (stdlib, toy embedding-based bias probe)
**Prerequisites:** Phase 05 (word embeddings), Phase 18 · 01 (instruction following)
**Time:** ~60 minutes

## Learning Objectives

- Định nghĩa tổn hại biểu đạt so với phân bổ và cho một ví dụ mỗi loại trong triển khai LLM.
- Nêu ba nhóm chỉ số đánh giá từ Gallegos và cộng sự 2024 và mô tả một chỉ số mỗi nhóm.
- Mô tả tính giao thoa và tại sao phép đo công bằng dựa trên bất định WinoIdentity giải quyết khoảng trống đánh giá thiên lệch một trục.
- Mô tả ba cách tiếp cận mechanistic interpretability đối với thiên lệch (neuron giới tính, đặc trưng SAE, thao tác attention-head).

## The Problem

Các bài trước đề cập gây hại có chủ ý (jailbreak, mưu đồ) và quản trị an toàn. Thiên lệch là tổn hại xuất hiện không có ý định — từ phân phối dữ liệu huấn luyện, cách đóng khung prompt, lựa chọn thiết kế tích lũy. Đo và giảm nó là thách thức phương pháp khác độ vững đối kháng.

## The Concept

### Representational vs allocational

- **Tổn hại biểu đạt.** Khuôn mẫu, xóa bỏ, mô tả hạ thấp. LLM mô tả y tá chỉ là nữ đang tạo tổn hại biểu đạt.
- **Tổn hại phân bổ.** Kết quả vật chất bất bình đẳng. LLM chấm hồ sơ ứng viên Da đen thấp hơn có hệ thống đang tạo tổn hại phân bổ.

Đây không là cùng một điều. Mô hình có thể "không thiên lệch biểu đạt" (tạo mô tả đa dạng) trong khi "thiên lệch phân bổ" (đưa khuyến nghị bất bình đẳng). Đánh giá cần đo cả hai.

### Three evaluation-metric categories (Gallegos et al. 2024)

- **Dựa trên embedding.** Kiểm thử kiểu WEAT trên embedding trước RLHF. Đo liên hệ thống kê giữa từ bản sắc và từ thuộc tính. Hạn chế: đo biểu diễn, không phải hành vi.
- **Dựa trên xác suất.** Log-likelihood phần hoàn thành xác nhận so với vi phạm khuôn mẫu. Đo phía decoder. Nắm bắt một phần thiên lệch hành vi.
- **Dựa trên văn bản được sinh.** Đo tác vụ hạ nguồn trên văn bản được sinh. Chấm hồ sơ, viết khuyến nghị, đối thoại. Giá trị sinh thái cao nhất; khó tái tạo nhất.

### Intersectionality

Đánh giá thiên lệch trên "giới" bỏ sót thiên lệch chỉ kích hoạt trên cặp (giới, chủng tộc). An và cộng sự 2025 thấy GPT-4o phạt phụ nữ Da đen trong chấm hồ sơ nhiều hơn nam giới Da đen và nhiều hơn phụ nữ da trắng xét riêng. Đánh giá một trục không nắm được điều này.

WinoIdentity (COLM 2025) đưa ra công bằng giao thoa dựa trên bất định. Nó đo bất định mô hình về kết quả có khác giữa bộ bản sắc giao thoa không — không chỉ dự đoán điểm. Điều này bắt trường hợp mô hình sai như nhau giữa nhóm nhưng bất định hơn cho một số nhóm, tạo hành vi phân bổ hạ nguồn khác.

### Mechanistic approaches

Công trình khả năng diễn giải 2024-2025 mở thiên lệch cho can thiệp cơ chế:

- **Neuron giới (Yu & Ananiadou 2025).** Neuron MLP cụ thể tương quan hành vi riêng theo giới. Loại bỏ neuron này giảm chỉ số khoảng cách giới với chi phí năng lực hạn chế.
- **Thiên lệch chủng tộc lâm sàng qua SAE (Ahsan & Wallace 2025).** Đặc trưng autoencoder thưa phân tách biểu diễn nội bộ thành chiều diễn giải được; đặc trưng tương quan chủng tộc có thể được xác định và ức chế.
- **UniBias (Zhou và cộng sự 2024).** Thao tác đầu attention để khử thiên lệch zero-shot. Đầu cụ thể khuếch đại độ nhạy lớp bản sắc; đặt về không hoặc điều chỉnh trọng số các đầu giảm thiên lệch không cần tinh chỉnh.

### The meta-critique

Tổng quan tài liệu 10 năm (arXiv:2508.11067, 2025) thấy lĩnh vực tập trung không tương xứng vào thiên lệch giới nhị nguyên. Trục khác — khuyết tật, tôn giáo, tình trạng di cư, bản sắc đa ngôn ngữ — nhận ít chú ý hơn nhiều. Phê bình tổng quan lập luận tập trung hẹp có thể hại nhóm bên lề do bỏ bê: mô hình được khử tốt thiên lệch giới nhị nguyên có thể thiên lệch nặng ở chiều không ai kiểm tra.

### Where this fits in Phase 18

Bài 20-21 đề cập thiên lệch và công bằng một cách hình thức. Bài 22 đề cập quyền riêng tư. Bài 23 đề cập watermark. Đây là lớp tổn hại người dùng bổ sung lớp lừa dối/an toàn trước.

```figure
an-bias-two-harms
```

## Use It

`code/main.py` xây thăm dò thiên lệch dựa trên embedding đơn giản: đo khoảng cách kiểu WEAT giữa từ bản sắc và từ thuộc tính trong embedding đồng xuất hiện đơn giản. Bạn có thể đưa thiên lệch vào và quan sát chỉ số kích hoạt; áp dụng thao tác khử thiên lệch đơn giản và quan sát khôi phục một phần.

## Ship It

Bài học này tạo ra `outputs/skill-bias-eval.md`. Với thẻ mô hình hoặc khẳng định công bằng, kiểm tra đánh giá trên ba nhóm chỉ số (embedding, xác suất, văn bản được sinh), bao phủ giao thoa và cơ chế mọi can thiệp khử thiên lệch.

## Exercises

1. Chạy `code/main.py`. Báo cáo điểm thiên lệch kiểu WEAT trước và sau bước khử thiên lệch. Giải thích tại sao chỉ số không giảm về không.

2. Mở rộng thăm dò bằng kiểm thử giao thoa: (giới, chủng tộc) x (sự nghiệp, gia đình). Báo cáo điểm thiên lệch xuyên trục.

3. Đọc An và cộng sự 2025 (PNAS Nexus). Xác định hai hiệu ứng giao thoa họ báo cáo mà đánh giá giới một trục bỏ sót.

4. Yu & Ananiadou 2025 xác định neuron giới. Phác thảo thí nghiệm bác bỏ phân biệt "neuron này gây thiên lệch giới" với "neuron này tương quan thiên lệch giới."

5. Phê bình tổng quan lập luận lĩnh vực tập trung quá hẹp vào giới nhị nguyên. Chọn một trục ít được nghiên cứu và mô tả giao thức đo tổn hại biểu đạt cho nó.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Representational harm (Tổn hại biểu đạt) | "khuôn mẫu / xóa bỏ" | Mô tả thiên lệch về nhóm |
| Allocational harm (Tổn hại phân bổ) | "quyết định bất bình đẳng" | Kết quả vật chất thiên lệch cho nhóm |
| WEAT | "kiểm thử embedding" | Kiểm thử Liên hệ Word Embedding; thăm dò thiên lệch dựa trên đồng xuất hiện |
| Intersectionality (Tính giao thoa) | "hiệu ứng bản sắc kết hợp" | Thiên lệch xuất hiện tại giao điểm nhiều trục bản sắc |
| Gender neurons (Neuron giới) | "neuron thiên lệch MLP" | Neuron cụ thể có kích hoạt tương quan hành vi riêng theo giới |
| SAE feature (Đặc trưng SAE) | "chiều diễn giải được" | Đặc trưng do autoencoder thưa xác định; hữu ích cho phân tích thiên lệch cơ chế |
| UniBias | "khử thiên lệch đầu attention" | Khử thiên lệch zero-shot bằng điều chỉnh trọng số đầu attention |

## Further Reading

- [Gallegos et al. — Bias and Fairness in LLMs: A Survey (arXiv:2309.00770, Computational Linguistics 2024)](https://arxiv.org/abs/2309.00770) — khảo sát kinh điển
- [An et al. — Intersectional resume-evaluation bias (PNAS Nexus, March 2025)](https://academic.oup.com/pnasnexus/article/4/3/pgaf089/8111343) — nghiên cứu giao thoa năm mô hình
- [WinoIdentity — uncertainty-based intersectional fairness (arXiv:2508.07111, COLM 2025)](https://arxiv.org/abs/2508.07111) — phép đo chuẩn mới
- [UniBias — attention-head manipulation (Zhou et al. 2024, ACL)](https://arxiv.org/abs/2405.20612) — khử thiên lệch zero-shot
