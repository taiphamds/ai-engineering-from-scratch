# Document and Diagram Understanding

> Tài liệu không phải ảnh chụp. PDF, bài báo khoa học, hóa đơn hoặc biểu mẫu viết tay có bố cục, bảng, sơ đồ, chú thích chân trang, đầu trang và cấu trúc ngữ nghĩa mà hiểu ảnh đơn thuần không thể nắm bắt. Ngăn xếp trước VLM là pipeline: Tesseract OCR + LayoutLMv3 + heuristic trích xuất bảng. Làn sóng VLM thay thế nó bằng mô hình không OCR — Donut (2022), Nougat (2023), DocLLM (2023) — phát trực tiếp mã đánh dấu có cấu trúc. Đến năm 2026, mức tiên tiến nhất chỉ là "đưa ảnh trang vào Claude Opus 4.7 ở 2576px gốc", và đầu ra mã đánh dấu có cấu trúc có được miễn phí. Bài học này đọc tiến trình ba kỷ nguyên của AI tài liệu.

**Type:** Build
**Languages:** Python (stdlib, layout-aware document parser skeleton)
**Prerequisites:** Phase 12 · 05 (LLaVA), Phase 5 (NLP)
**Time:** ~180 minutes

## Learning Objectives

- Giải thích ba kỷ nguyên của AI tài liệu: pipeline OCR, không OCR, VLM nguyên bản.
- Mô tả ba luồng đầu vào của LayoutLMv3: văn bản, bố cục (bbox), patch ảnh, với che thống nhất.
- So sánh Donut (không OCR, ảnh → mã đánh dấu), Nougat (bài báo khoa học → LaTeX), DocLLM (tạo sinh nhận biết bố cục), PaliGemma 2 (VLM nguyên bản).
- Chọn mô hình tài liệu cho tác vụ mới (hóa đơn, bài báo khoa học, biểu mẫu viết tay, biên lai tiếng Trung).

## The Problem

"Hiểu PDF này" khó một cách dễ gây nhầm tưởng. Thông tin nằm trong:

- Nội dung văn bản (90% tín hiệu).
- Bố cục (đầu trang, chú thích chân trang, thanh bên, định dạng hai cột).
- Bảng (hàng, cột, ô gộp).
- Hình và sơ đồ.
- Chú giải viết tay.
- Phông chữ và kiểu trình bày chữ (tiêu đề so với nội dung).

OCR thô xuất văn bản và mất phần còn lại. Hệ thống quan tâm hóa đơn cần biết "Tổng: $1,245" đến từ góc dưới bên phải, không phải chú thích chân trang.

## The Concept

### Era 1 — OCR pipeline (pre-2021)

Ngăn xếp cổ điển:

1. PDF → ảnh mỗi trang.
2. Tesseract (hoặc OCR thương mại) trích xuất văn bản với hộp bao mỗi từ.
3. Bộ phân tích bố cục xác định khối (đầu trang, bảng, đoạn văn).
4. Bộ nhận dạng cấu trúc bảng phân tích bảng.
5. Quy tắc miền + regex trích xuất trường.

Hoạt động với văn bản in sạch. Hỏng trên chữ viết tay, bản quét lệch, bảng phức tạp, hệ chữ ngoài tiếng Anh. Mỗi dạng lỗi đòi hỏi nhánh ngoại lệ tùy chỉnh.

### TrOCR (2021)

TrOCR (Li và cộng sự, arXiv:2109.10282) thay CNN-CTC cổ điển của Tesseract bằng transformer mã hóa-giải mã huấn luyện trên ảnh văn bản tổng hợp + thực. Thắng rõ ràng trên văn bản viết tay và đa ngôn ngữ. Vẫn là pipeline (bộ phát hiện rồi TrOCR rồi bố cục), nhưng bước OCR cải thiện mạnh.

### Era 2 — OCR-free (2022-2023)

Các mô hình không OCR đầu tiên nói: bỏ qua hoàn toàn phát hiện, ánh xạ pixel ảnh trực tiếp sang đầu ra có cấu trúc.

Donut (Kim và cộng sự, arXiv:2111.15664):
- Transformer mã hóa-giải mã, bộ mã hóa là Swin-B.
- Đầu ra là JSON để hiểu biểu mẫu, markdown để tóm tắt, hoặc bất kỳ lược đồ riêng cho tác vụ nào.
- Không OCR, không bố cục, không phát hiện.

Nougat (Blecher và cộng sự, arXiv:2308.13418):
- Được huấn luyện riêng trên bài báo khoa học.
- Đầu ra là LaTeX / markdown.
- Xử lý phương trình, bố cục nhiều cột, hình.
- Mô hình mọi bộ phân tích arXiv gọi.

Đây là các mô hình chuyên biệt, không phải tổng quát. Donut trên bài báo khoa học thất bại; Nougat trên hóa đơn thất bại.

### LayoutLMv3 (2022)

Một hướng khác. LayoutLMv3 (Huang và cộng sự, arXiv:2204.08387) giữ OCR nhưng thêm hiểu bố cục:

- Ba luồng đầu vào: token văn bản OCR, hộp bao 2D mỗi token, patch ảnh.
- Mục tiêu huấn luyện có mặt nạ trên cả ba phương thức (văn bản bị che, patch bị che, bố cục bị che).
- Phía sau: phân loại, trích xuất thực thể, hỏi đáp bảng.

LayoutLMv3 là đỉnh cao của hiểu tài liệu dựa trên OCR. Mạnh trên biểu mẫu và hóa đơn. Đòi hỏi OCR phía trước. Độ chính xác trước VLM tốt nhất trên benchmark tài liệu chuẩn hóa.

### DocLLM (2023)

DocLLM (Wang và cộng sự, arXiv:2401.00908, được nộp ngày 31 tháng 12 năm 2023, vì vậy ID mang tiền tố tháng 1 năm 2024) là mô hình anh em có tính tạo sinh của LayoutLM. Tạo câu trả lời tự do có điều kiện theo các token bố cục. Tốt hơn cho QA trên tài liệu; vẫn phụ thuộc đầu vào OCR.

### Era 3 — VLM-native (2024+)

VLM năm 2024 trở nên đủ tốt để thay hoàn toàn pipeline. Đưa ảnh toàn trang độ phân giải cao vào VLM, đặt câu hỏi, nhận câu trả lời.

- AnyRes ô 336 của LLaVA-NeXT hoạt động cho tài liệu nhỏ.
- Độ phân giải động của Qwen2.5-VL xử lý nguyên bản 2048+ pixel.
- Claude Opus 4.7 hỗ trợ tài liệu 2576px.
- PaliGemma 2 (tháng 12 năm 2024) huấn luyện riêng cho tài liệu + chữ viết tay.

Khoảng cách giữa VLM nguyên bản và pipeline OCR khép lại nhanh chóng. Đến năm 2026, VLM nguyên bản thắng trên:

- Văn bản trong cảnh (viết tay + in, hệ chữ hỗn hợp).
- Bảng phức tạp với ô gộp.
- Phương trình toán nhúng trong văn bản.
- Hình có chú giải văn bản.

Pipeline OCR vẫn thắng trên:

- Khối lượng công việc thuần bản quét ở quy mô cực lớn nơi độ trễ mỗi trang quan trọng.
- Độ tin cậy pipeline (lỗi xác định so với ảo giác VLM).
- Môi trường chịu quản lý đòi hỏi đầu ra OCR có thể kiểm toán.

### The Claude 4.7 / GPT-5 frontier

Ở đầu vào gốc 2576 pixel, VLM tiên tiến hiểu tài liệu với độ chính xác gần con người. Số liệu benchmark từ đầu năm 2026:

- DocVQA: Claude 4.7 ~95.1, PaliGemma 2 ~88.4, Nougat ~77.3, LayoutLMv3 qua pipeline ~83.
- ChartQA: Claude 4.7 ~92.2, GPT-4V ~78.
- VisualMRC: Claude 4.7 ~94.

Khoảng cách với mô hình đóng chủ yếu là độ phân giải và quy mô LLM nền. Mô hình mở ở 7B kém vài điểm nhưng đang bắt kịp.

### Math equations and LaTeX output

Bài báo khoa học cần đầu ra LaTeX chính xác cho phương trình. Nougat được huấn luyện trên điều này. VLM được huấn luyện với mục tiêu LaTeX (Qwen2.5-VL-Math, các dẫn xuất Nougat) tạo LaTeX dùng được. Không huấn luyện LaTeX tường minh, VLM tạo bản chép đọc được nhưng thiếu chính xác.

Với pipeline bài báo khoa học năm 2026: nối Nougat trên PDF, rồi VLM trên các trang khó.

### Handwriting

Vẫn là tác vụ con khó nhất. Hỗn hợp in + viết tay (ghi chú bác sĩ, biểu mẫu đã điền) là nơi pipeline OCR vẫn vượt VLM về chi phí. VLM chỉ chữ viết tay đang cải thiện (Claude 4.7, PaliGemma 2).

### 2026 recipe

Với dự án AI tài liệu mới:

- Hóa đơn thuần in ở quy mô lớn: LayoutLMv3 + quy tắc, hiệu quả chi phí.
- Tài liệu hỗn hợp (khoa học + viết tay + biểu mẫu): VLM nguyên bản (PaliGemma 2 hoặc Qwen2.5-VL).
- Tiếp nhận toàn bộ arXiv: Nougat cho toán, VLM cho hình.
- Quy định: pipeline OCR + bộ xác thực VLM để kiểm tra chéo.

```figure
mm-doc-layout
```

## Use It

`code/main.py`:

- Tokenizer nhận biết bố cục đơn giản: với các cặp (văn bản, bbox), tạo đầu vào kiểu LayoutLMv3.
- Bộ tạo lược đồ tác vụ kiểu Donut: mẫu JSON cho biểu mẫu.
- So sánh ngân sách token mỗi trang giữa pipeline OCR, Donut, Nougat và VLM nguyên bản.

## Ship It

Bài học này tạo ra `outputs/skill-document-ai-stack-picker.md`. Với dự án AI tài liệu (miền, quy mô, chất lượng, quy định), chọn giữa pipeline OCR, mô hình chuyên biệt không OCR và VLM nguyên bản.

## Exercises

1. Dự án của bạn là 10M hóa đơn mỗi ngày. Ngăn xếp nào giảm thiểu chi phí mỗi trang mà không mất độ chính xác?

2. Tại sao LayoutLMv3 vượt VLM thuần CLIP trên hỏi đáp biểu mẫu nhưng kém trên văn bản trong cảnh? Luồng bbox từ bỏ điều gì?

3. Nougat tạo LaTeX. Đề xuất ca kiểm tra trong đó đầu ra VLM nguyên bản vượt Nougat về độ trung thực LaTeX và ca trong đó Nougat thắng.

4. Đọc bài báo PaliGemma 2 (Google, 2024). Bổ sung dữ liệu huấn luyện then chốt nào nâng độ chính xác tài liệu so với PaliGemma 1?

5. Thiết kế hệ lai an toàn về quy định: pipeline OCR làm chính, VLM làm kiểm tra chéo phụ. Bạn giải quyết bất đồng thế nào?

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| OCR pipeline (Pipeline OCR) | "Kiểu Tesseract" | Ngăn xếp từng giai đoạn: phát hiện -> OCR -> bố cục -> quy tắc; xác định, mong manh |
| OCR-free (Không OCR) | "Kiểu Donut" | Transformer ảnh-thành-đầu-ra bỏ qua OCR tường minh; một mô hình |
| Layout-aware (Nhận biết bố cục) | "LayoutLM" | Đầu vào gồm tọa độ bbox mỗi token; che thống nhất trên các phương thức |
| VLM-native (VLM nguyên bản) | "VLM tiên tiến nhất" | Đưa ảnh trang trực tiếp vào VLM Claude/GPT/Qwen ở độ phân giải cao; không pipeline |
| DocVQA | "Benchmark tài liệu" | Tiêu chuẩn VQA tài liệu; điểm được trích dẫn nhiều nhất |
| Markup output (Đầu ra mã đánh dấu) | "LaTeX / MD" | Định dạng đầu ra có cấu trúc thay vì văn bản tự do; cho phép tự động hóa phía sau |

## Further Reading

- [Li et al. — TrOCR (arXiv:2109.10282)](https://arxiv.org/abs/2109.10282)
- [Blecher et al. — Nougat (arXiv:2308.13418)](https://arxiv.org/abs/2308.13418)
- [Huang et al. — LayoutLMv3 (arXiv:2204.08387)](https://arxiv.org/abs/2204.08387)
- [Kim et al. — Donut (arXiv:2111.15664)](https://arxiv.org/abs/2111.15664)
- [Wang et al. — DocLLM (arXiv:2401.00908)](https://arxiv.org/abs/2401.00908)
