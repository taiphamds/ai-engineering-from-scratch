# Model, System, and Dataset Cards

> Ba định dạng tài liệu cấu trúc minh bạch AI. Model Cards (Mitchell và cộng sự 2019) — nhãn dinh dưỡng cho mô hình: dữ liệu huấn luyện, phân tích định lượng phân tách, cân nhắc đạo đức, lưu ý; chỉ 0.3% thẻ mô hình Hugging Face ghi cân nhắc đạo đức (Oreamuno và cộng sự 2023). Datasheets for Datasets (Gebru và cộng sự 2018, CACM) — động cơ, thành phần, quy trình thu thập, gắn nhãn, phân phối, bảo trì; tương tự bảng thông số điện tử. Data Cards (Pushkarna và cộng sự, Google 2022) — chi tiết phân lớp mô-đun (viễn vọng, tiềm vọng, hiển vi) như đối tượng ranh giới cho người đọc đa dạng. Phát triển 2024-2025: tạo tự động qua LLM (CardGen, Liu và cộng sự 2024); chi tiết thẻ mô hình tương quan mức tăng tải xuống tới 29% trên HF (Liang và cộng sự 2024); chứng thực xác minh được (Laminator, Duddu và cộng sự 2024); bổ sung báo cáo bền vững cho carbon/nước (Jouneaux và cộng sự tháng 7 năm 2025); thẻ quy định EU/ISO đang nổi. System Cards (Sidhpurwala 2024; minh bạch cấp hệ thống Meta; "Blueprints of Trust" arXiv:2509.20394) — tài liệu hệ thống AI đầu cuối bao phủ năng lực bảo mật, bảo vệ chèn prompt, phát hiện đưa dữ liệu ra ngoài trái phép, căn chỉnh với giá trị con người.

**Type:** Build
**Languages:** Python (stdlib, model-card + datasheet + system-card generator)
**Prerequisites:** Phase 18 · 18 (safety frameworks), Phase 18 · 24 (regulatory)
**Time:** ~60 minutes

## Learning Objectives

- Mô tả thẻ mô hình Mitchell và cộng sự 2019 ban đầu và bảng thông số Gebru và cộng sự 2018.
- Mô tả phân lớp viễn vọng/tiềm vọng/hiển vi của Data Cards.
- Mô tả System Cards và bao phủ đầu cuối.
- Nêu ba phát triển 2024-2025 (tạo tự động, chứng thực xác minh được, báo cáo bền vững).

## The Problem

Khung quy định (Bài 24) và chính sách an toàn phòng thí nghiệm (Bài 18) đều cần tài liệu. Định dạng tiến hóa từ riêng mô hình (thẻ mô hình) sang riêng tập dữ liệu (bảng thông số) sang riêng hệ thống (thẻ hệ thống). Mỗi định dạng giải quyết phạm vi minh bạch khác. Công trình tự động hóa và chứng thực xác minh được 2024-2025 giải quyết vấn đề áp dụng lâu nay.

## The Concept

### Model Cards (Mitchell et al. 2019)

Các phần:
- Chi tiết mô hình.
- Sử dụng dự định.
- Yếu tố (yếu tố nhân khẩu học hoặc môi trường liên quan cho đánh giá).
- Chỉ số.
- Dữ liệu đánh giá.
- Dữ liệu huấn luyện.
- Phân tích định lượng (phân tách theo yếu tố).
- Cân nhắc đạo đức.
- Lưu ý và khuyến nghị.

Vấn đề áp dụng: kiểm tra thẻ mô hình Hugging Face của Oreamuno và cộng sự 2023 thấy chỉ 0.3% ghi cân nhắc đạo đức.

### Datasheets for Datasets (Gebru et al. 2018)

Tương tự bảng thông số điện tử. Các phần:
- Động cơ (tại sao tập dữ liệu được tạo).
- Thành phần (có gì trong đó).
- Quy trình thu thập (được tập hợp thế nào).
- Gắn nhãn (nếu áp dụng).
- Cách dùng (dự định, bị cấm, rủi ro).
- Phân phối.
- Bảo trì.

Công bố trong CACM 2021. Bảng thông số là tài liệu thượng nguồn; thẻ mô hình phụ thuộc bảng thông số chính xác.

### Data Cards (Pushkarna et al., Google 2022)

Chi tiết phân lớp mô-đun. Ba mức thu phóng:
- **Viễn vọng.** Tóm tắt cấp cao cho người không chuyên.
- **Tiềm vọng.** Tổng quan cấp giữa cho người thực hành ML.
- **Hiển vi.** Tài liệu chi tiết cấp đặc trưng cho bên kiểm toán.

Cách nhìn đối tượng ranh giới: người đọc khác lấy thông tin khác từ cùng tài liệu.

### System Cards

Phạm vi: hệ thống AI đầu cuối gồm mô hình + ngăn xếp an toàn + ngữ cảnh triển khai. Các phần thường gồm:
- Năng lực bảo mật.
- Bảo vệ chèn prompt.
- Phát hiện đưa dữ liệu ra ngoài trái phép.
- Căn chỉnh với giá trị con người được nêu.
- Ứng phó sự cố.

Sidhpurwala 2024 và công trình minh bạch cấp hệ thống Meta. "Blueprints of Trust" (arXiv:2509.20394) hình thức hóa System Card là phần bổ sung cấp triển khai cho Model Cards.

### 2024-2025 developments

- **CardGen (Liu và cộng sự 2024).** Tạo thẻ mô hình tự động qua LLM; báo cáo tính khách quan cao hơn nhiều thẻ người viết trên trường Mitchell 2019 chuẩn hóa.
- **Tương quan tải xuống (Liang và cộng sự 2024).** Thẻ mô hình chi tiết tương quan tỷ lệ tải xuống cao hơn tới 29% trên HF — áp lực áp dụng giờ do thị trường thúc đẩy, không chỉ tuân thủ.
- **Laminator (Duddu và cộng sự 2024).** Chứng thực xác minh được qua TEE phần cứng / chữ ký mật mã — cho thẻ mô hình mang bằng chứng khẳng định, không chỉ khẳng định.
- **Bền vững (Jouneaux và cộng sự tháng 7 năm 2025).** Bổ sung cho dấu chân carbon, nước và năng lượng tính toán; tiêu chuẩn ISO đang nổi.
- **Thẻ quy định.** Chương Minh bạch GPAI Code of Practice thuộc EU AI Act (Bài 24) yêu cầu thẻ mô hình làm tạo tác tuân thủ.

### Where this fits in Phase 18

Bài 24-25 là lớp quy định và CVE. Bài 26 là lớp tài liệu. Bài 27 là quản trị dữ liệu huấn luyện, thượng nguồn của bảng thông số. Bài 28 là hệ sinh thái nghiên cứu tạo đánh giá được tham chiếu trong thẻ.

```figure
an-card-scopes
```

## Use It

`code/main.py` tạo thẻ mô hình, bảng thông số và thẻ hệ thống tối thiểu cho triển khai đơn giản. Mỗi loại theo cấu trúc phần kinh điển. Bạn có thể xem định dạng và so sánh ba phạm vi.

## Ship It

Bài học này tạo ra `outputs/skill-card-audit.md`. Với thẻ mô hình, bảng thông số hoặc thẻ hệ thống, kiểm tra bao phủ phần, phân tách số liệu và có chứng thực xác minh được không.

## Exercises

1. Chạy `code/main.py`. Xem thẻ được tạo. Xác định phần yếu (chỉ chỗ giữ chỗ) và chỉ định bằng chứng củng cố.

2. Mở rộng thẻ mô hình bằng phân tích định lượng phân tách trên hai nhóm nhân khẩu học (Bài 20).

3. Đọc Oreamuno và cộng sự 2023 về tỷ lệ áp dụng 0.3%. Đề xuất một thay đổi cấu trúc đặc tả thẻ mô hình tăng áp dụng cân nhắc đạo đức.

4. Laminator (Duddu và cộng sự 2024) dùng TEE cho chứng thực xác minh được. Thiết kế trường thẻ mô hình mang chứng thực mật mã kết quả đánh giá và mô tả vai bên xác minh.

5. Viết Thẻ Hệ thống (Thẻ Hệ thống, không phải Thẻ Mô hình) cho một dự án trước hoặc triển khai giả định. Xác định phần giá trị cao nhất cho kiểm toán viên bên thứ ba.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Model Card (Thẻ Mô hình) | "thẻ Mitchell" | Tài liệu tiêu chuẩn Mitchell và cộng sự 2019 cho mô hình ML |
| Datasheet (Bảng thông số) | "bảng thông số Gebru" | Tài liệu tiêu chuẩn Gebru và cộng sự 2018 cho tập dữ liệu |
| Data Card (Thẻ Dữ liệu) | "thẻ Pushkarna" | Tài liệu dữ liệu phân lớp mô-đun Google 2022 |
| System Card (Thẻ Hệ thống) | "thẻ triển khai" | Tài liệu hệ thống AI đầu cuối gồm ngăn xếp an toàn |
| Boundary object (Đối tượng ranh giới) | "người đọc khác, một tài liệu" | Cách nhìn Data Cards: cùng tài liệu phục vụ đối tượng đa dạng |
| Verifiable attestation (Chứng thực xác minh được) | "chứng thực Laminator" | Bằng chứng mật mã hoặc TEE đính vào khẳng định tài liệu |
| Sustainability field (Trường bền vững) | "dấu chân carbon / nước" | Bổ sung đang nổi 2025 cho hạch toán môi trường |

## Further Reading

- [Mitchell et al. — Model Cards for Model Reporting (arXiv:1810.03993, FAT* 2019)](https://arxiv.org/abs/1810.03993) — thẻ mô hình kinh điển
- [Gebru et al. — Datasheets for Datasets (CACM 2021, arXiv:1803.09010)](https://arxiv.org/abs/1803.09010) — bài báo bảng thông số
- [Pushkarna et al. — Data Cards (Google 2022)](https://arxiv.org/abs/2204.01075) — tài liệu dữ liệu phân lớp
- [Sidhpurwala et al. — Blueprints of Trust (arXiv:2509.20394)](https://arxiv.org/abs/2509.20394) — hình thức hóa System Card
