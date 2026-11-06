# Watermarking — SynthID, Stable Signature, C2PA

> Ba công nghệ cấu trúc nguồn gốc nội dung do AI tạo năm 2026. SynthID (Google DeepMind) — watermark ảnh ra mắt tháng 8 năm 2023, văn bản+video tháng 5 năm 2024 (Gemini + Veo), văn bản mở nguồn tháng 10 năm 2024 qua Responsible GenAI Toolkit, bộ phát hiện đa phương tiện hợp nhất tháng 11 năm 2025 cùng Gemini 3 Pro. Watermark văn bản điều chỉnh xác suất lấy mẫu token tiếp theo không thể cảm nhận; watermark ảnh/video sống sót qua nén, cắt ảnh, bộ lọc, đổi tốc độ khung hình. Stable Signature (Fernandez và cộng sự, ICCV 2023, arXiv:2303.15435) — tinh chỉnh decoder khuếch tán tiềm ẩn để mọi đầu ra chứa thông điệp cố định; ảnh sinh bị cắt (10% nội dung) được phát hiện >90% ở FPR<1e-6. Công trình tiếp nối "Stable Signature is Unstable" (arXiv:2405.07145, tháng 5 năm 2024) — tinh chỉnh loại watermark trong khi giữ chất lượng. C2PA — tiêu chuẩn metadata ký mật mã, thể hiện dấu hiệu can thiệp (C2PA 2.2 Explainer 2025). Watermark và C2PA bổ sung nhau: metadata có thể bị gỡ nhưng mang nguồn gốc phong phú hơn; watermark tồn tại qua chuyển mã nhưng mang ít thông tin hơn.

**Type:** Build
**Languages:** Python (stdlib, token-watermark embed + detect)
**Prerequisites:** Phase 10 · 04 (sampling), Phase 01 · 09 (information theory)
**Time:** ~75 minutes

## Learning Objectives

- Mô tả watermark cấp token (kiểu SynthID-text) và cơ chế khiến nó phát hiện được.
- Mô tả Stable Signature và tấn công loại bỏ 2024 phá vỡ nó.
- Nêu vai trò C2PA và tại sao bổ sung watermark.
- Mô tả hạn chế chính: tín hiệu riêng theo mô hình, độ vững dưới diễn đạt lại và tấn công giữ nghĩa (arXiv:2508.20228).

## The Problem

Năm 2023-2024 chứng kiến deepfake và nội dung AI tạo vào ngữ cảnh chính trị và tiêu dùng ở quy mô lớn. Watermark là tín hiệu nguồn gốc kỹ thuật được đề xuất: đánh dấu khi tạo, phát hiện sau. Bằng chứng 2025: không watermark nào vững vô điều kiện, nhưng phân lớp cùng metadata C2PA cung cấp câu chuyện nguồn gốc dùng được.

## The Concept

### Text watermarking (SynthID-text style)

Cơ chế Kirchenbauer và cộng sự 2023, được Google đưa vào sản xuất:

1. Ở mỗi bước decode, hash K token trước để tạo phân hoạch giả ngẫu nhiên từ vựng thành tập "xanh" và "đỏ".
2. Thiên lấy mẫu về tập xanh bằng thêm δ vào logit xanh.
3. Phần sinh chứa nhiều token xanh hơn ngẫu nhiên tạo ra.

Phát hiện: hash lại mỗi tiền tố, đếm token xanh trong phần sinh, tính z-score. Z-score >0 với văn bản có watermark, ~0 với văn bản con người.

Thuộc tính:
- Người đọc không cảm nhận được (δ đủ nhỏ để mất chất lượng nhỏ).
- Phát hiện được với quyền truy cập hàm phân hoạch từ vựng.
- Không vững trước diễn đạt lại — viết lại văn bản phá tín hiệu.

SynthID-text mở nguồn tháng 10 năm 2024 qua Responsible GenAI Toolkit của Google.

### Stable Signature (image)

Fernandez và cộng sự ICCV 2023. Tinh chỉnh decoder khuếch tán tiềm ẩn để mọi ảnh sinh chứa thông điệp nhị phân cố định nhúng trong biểu diễn tiềm ẩn. Phát hiện được giải mã từ tiềm ẩn bằng decoder nơ-ron. Ảnh bị cắt (còn 10% nội dung) được phát hiện >90% ở FPR<1e-6.

Tháng 5 năm 2024 "Stable Signature is Unstable" (arXiv:2405.07145): tinh chỉnh decoder loại watermark trong khi giữ chất lượng ảnh. Tinh chỉnh đối kháng sau sinh rẻ; độ vững đối kháng watermark hạn chế.

### SynthID unified detector (November 2025)

Cùng Gemini 3 Pro: bộ phát hiện đa phương tiện đọc tín hiệu SynthID từ văn bản, ảnh, âm thanh và video trong một API. Hợp nhất ngăn xếp nguồn gốc Google.

### C2PA

Liên minh về Nguồn gốc và Tính xác thực Nội dung. Tiêu chuẩn metadata ký mật mã thể hiện dấu hiệu can thiệp. C2PA 2.2 Explainer (2025). Manifest C2PA ghi khẳng định nguồn gốc (ai tạo, khi nào, biến đổi gì) được ký bằng khóa người tạo.

Bổ sung watermark:
- Metadata có thể bị gỡ; watermark không thể (dễ dàng).
- Metadata phong phú (toàn chuỗi nguồn gốc); watermark mang bit.
- C2PA phụ thuộc nền tảng áp dụng; watermark tự nhúng.

Google tích hợp cả hai trong Search, Ads và "Giới thiệu về hình ảnh này."

### Limitations

- **Riêng theo mô hình.** SynthID đánh watermark phần sinh từ mô hình bật SynthID. Phần sinh từ mô hình không SynthID không có watermark, nên "không có tín hiệu SynthID" không là bằng chứng xác thực.
- **Diễn đạt lại.** Watermark văn bản không sống sót qua diễn đạt lại giữ nghĩa.
- **Tấn công biến đổi.** arXiv:2508.20228 (2025) cho thấy tấn công giữ nghĩa phá cả watermark văn bản lẫn nhiều watermark ảnh.
- **Loại bỏ qua tinh chỉnh.** Theo "Stable Signature is Unstable," tinh chỉnh sau sinh loại watermark nhúng.

### EU AI Act Article 50

Bộ quy tắc Minh bạch cho gắn nhãn nội dung AI tạo (dự thảo đầu tháng 12 năm 2025, dự thảo hai tháng 3 năm 2026, dự kiến cuối cùng tháng 6 năm 2026 theo [trang trạng thái Ủy ban châu Âu](https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content)). Bộ quy tắc vẫn là dự thảo tính đến tháng 4 năm 2026 và dòng thời gian có thể thay đổi. Lớp quy định yêu cầu lớp kỹ thuật. Deepfake phải được gắn nhãn.

### Where this fits in Phase 18

Bài 22-23 nói về điều mô hình xuất (dữ liệu riêng tư, tín hiệu nguồn gốc). Bài 27 đề cập quản trị dữ liệu huấn luyện. Bài 24 là khung quy định yêu cầu các biện pháp kỹ thuật này.

```figure
an-watermark-greenlist
```

## Use It

`code/main.py` xây watermark văn bản đơn giản. Token là số nguyên 0..N-1; lấy mẫu có watermark thiên về tập xanh do hash xác định. Bộ phát hiện tính z-score token xanh. Bạn có thể quan sát phát hiện ở phần sinh 1000 token, xem diễn đạt lại phá tín hiệu và đo tỷ lệ dương tính giả trên văn bản con người.

## Ship It

Bài học này tạo ra `outputs/skill-provenance-audit.md`. Với triển khai nội dung có khẳng định nguồn gốc, kiểm tra: cơ chế watermark (nếu có), chuỗi ký C2PA (nếu có), độ vững đối kháng mỗi loại và bao phủ theo phương thức.

## Exercises

1. Chạy `code/main.py`. Báo cáo z-score cho phần sinh 1000 token có watermark so với văn bản người viết. Xác định tỷ lệ dương tính giả ở ngưỡng tin cậy 95%.

2. Triển khai tấn công diễn đạt lại thay 30% token bằng từ đồng nghĩa. Đo lại z-score.

3. Đọc Phần 6 Kirchenbauer và cộng sự 2023 về độ vững. Tại sao watermark văn bản thất bại dưới diễn đạt lại nhưng watermark ảnh sống sót qua cắt ảnh?

4. Thiết kế triển khai dùng SynthID-text + metadata C2PA. Mô tả chuỗi nguồn gốc người tiêu dùng thấy. Xác định một chế độ lỗi mỗi thành phần.

5. Kết quả "Stable Signature is Unstable" 2024 cho thấy tinh chỉnh loại watermark ảnh. Thiết kế kiểm soát triển khai hạn chế tấn công này — ví dụ, yêu cầu bản phát hành checkpoint tinh chỉnh được ký.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| SynthID | "watermark Google" | Tín hiệu nguồn gốc xuyên phương thức; văn bản, ảnh, âm thanh, video |
| Token watermark (Watermark token) | "kiểu Kirchenbauer" | Watermark văn bản lấy mẫu thiên lệch phát hiện qua z-score token xanh |
| Stable Signature | "watermark ảnh" | Watermark decoder tinh chỉnh; ICCV 2023 |
| C2PA | "tiêu chuẩn metadata" | Metadata nguồn gốc ký mật mã thể hiện dấu hiệu can thiệp |
| Paraphrase robustness (Độ vững trước diễn đạt lại) | "đổi cách viết có phá nó không" | Thuộc tính watermark văn bản; hiện hạn chế |
| Fine-tune removal (Loại bỏ qua tinh chỉnh) | "gỡ watermark đối kháng" | Tấn công loại watermark ảnh qua tinh chỉnh decoder |
| Cross-modal detector (Bộ phát hiện xuyên phương thức) | "SynthID hợp nhất" | API hợp nhất tháng 11 năm 2025 xuyên phương thức |

## Further Reading

- [Kirchenbauer et al. — A Watermark for Large Language Models (ICML 2023, arXiv:2301.10226)](https://arxiv.org/abs/2301.10226) — cơ chế watermark token
- [Fernandez et al. — Stable Signature (ICCV 2023, arXiv:2303.15435)](https://arxiv.org/abs/2303.15435) — bài báo watermark ảnh
- ["Stable Signature is Unstable" (arXiv:2405.07145)](https://arxiv.org/abs/2405.07145) — tấn công loại bỏ
- [Google DeepMind — SynthID](https://deepmind.google/models/synthid/) — watermark xuyên phương thức
- [C2PA 2.2 Explainer (2025)](https://c2pa.org/specifications/specifications/2.2/explainer/Explainer.html) — tiêu chuẩn metadata
