# Compliance — SOC 2, HIPAA, GDPR, PCI-DSS, EU AI Act, ISO 42001

> Bao phủ nhiều khung là yêu cầu tối thiểu cho giao dịch doanh nghiệp năm 2026. **EU AI Act**: có hiệu lực từ ngày 1 tháng 8 năm 2024. Phần lớn yêu cầu rủi ro cao được thực thi ngày 2 tháng 8 năm 2026. Tiền phạt tới €15M hoặc 3% doanh thu hằng năm toàn cầu cho nghĩa vụ hệ thống rủi ro cao (Điều 99(4)); tới €35M hoặc 7% cho thực hành AI bị cấm (Điều 99(3)). Áp dụng toàn cầu nếu phục vụ người dùng EU. **Colorado AI Act**: hiệu lực ngày 30 tháng 6 năm 2026 (hoãn từ tháng 2 năm 2026 bởi SB25B-004) — đánh giá tác động cho hệ thống rủi ro cao, quyền kháng nghị quyết định AI. Virginia tương tự cho tín dụng/việc làm/nhà ở/giáo dục. **SOC 2 Type II**: yêu cầu B2B AI trên thực tế (Type II, không phải Type I, cho fintech). **GDPR**: tiền phạt riêng cho AI lớn nhất được ghi nhận là €30.5M đối với Clearview AI (DPA Hà Lan, tháng 9 năm 2024); Garante của Ý phạt OpenAI €15M vào tháng 12 năm 2024 (sau đó bị hủy khi kháng cáo vào tháng 3 năm 2026). Che PII thời gian thực lúc suy luận là tiêu chuẩn có thể bảo vệ được; làm sạch hậu xử lý là không đủ. **HIPAA**: ràng buộc y tế — không thể gửi PHI đến dịch vụ AI bên ngoài mà không có BAA. **PCI-DSS**: bao phủ lớp tương tác AI yêu cầu cấu hình + thỏa thuận hợp đồng, không tự động. **ISO 42001**: tiêu chuẩn quản trị AI đang nổi lên, yêu cầu mua sắm ngày càng tăng bên cạnh ISO 27001. Hồ sơ tham chiếu: OpenAI duy trì SOC 2 Type 2, ISO/IEC 27001:2022, ISO/IEC 27701:2019, GDPR/CCPA/HIPAA (BAA)/FERPA, PCI-DSS cho thành phần thanh toán ChatGPT. Ánh xạ xuyên khung giảm mệt mỏi kiểm toán: kiểm soát truy cập ánh xạ trên ISO 27001 A.5.15-5.18, GDPR Điều 32, HIPAA §164.312(a).

**Type:** Learn
**Languages:** (Python optional — compliance is policy + process, not code)
**Prerequisites:** Phase 17 · 25 (Security), Phase 17 · 13 (Observability)
**Time:** ~60 minutes

## Learning Objectives

- Liệt kê bảy khung năm 2026 liên quan đến sản phẩm LLM và ghép mỗi khung với một phân khúc khách hàng.
- Trích dẫn dòng thời gian thực thi EU AI Act (hiệu lực tháng 8 năm 2024; thực thi rủi ro cao tháng 8 năm 2026) và trần phạt hai tầng (€15M / 3% cho nghĩa vụ rủi ro cao, €35M / 7% cho thực hành bị cấm).
- Giải thích tại sao làm sạch PII hậu xử lý không đủ cho GDPR và nêu che ở lớp suy luận thời gian thực là tiêu chuẩn có thể bảo vệ được.
- Mô tả ánh xạ kiểm soát xuyên khung (ví dụ: kiểm soát truy cập ánh xạ đến ISO 27001 A.5.15-5.18 + GDPR Điều 32 + HIPAA §164.312(a)).

## The Problem

Bộ phận mua sắm của khách hàng doanh nghiệp yêu cầu SOC 2 Type II, GDPR, HIPAA BAA, ISO 27001 và "tuyên bố tuân thủ EU AI Act." Nhóm của bạn có SOC 2 Type I. Bạn còn sáu tháng mới đạt Type II và chưa bắt đầu hồ sơ Điều 30 GDPR.

Bao phủ nhiều khung không phải vấn đề LLM — đó là vấn đề SaaS doanh nghiệp, với các lớp phủ riêng cho LLM. Nhóm mua sắm năm 2026 muốn một ma trận có một hàng mỗi khung và một cột mỗi kiểm soát, không phải PDF.

## The Concept

### The seven frameworks

| Khung | Phạm vi | Yêu cầu riêng cho LLM |
|-----------|-------|--------------------------|
| SOC 2 Type II | Cơ sở B2B SaaS | Kiểm soát quy trình được kiểm toán trong 6-12 tháng |
| HIPAA | Y tế Mỹ | Bắt buộc BAA; PHI không thể rời hạ tầng nếu không có thỏa thuận đã ký |
| GDPR | Người dùng EU | Che PII thời gian thực; quyền chủ thể dữ liệu; hồ sơ Điều 30 |
| PCI-DSS | Dữ liệu thanh toán | Cấu hình + hợp đồng cho AI tiếp xúc thanh toán |
| EU AI Act | Phục vụ người dùng EU | Phân loại tầng rủi ro; hệ thống rủi ro cao: đánh giá sự phù hợp, lập tài liệu, ghi log |
| Colorado AI Act | Phục vụ cư dân CO | Đánh giá tác động; quyền kháng nghị |
| ISO 42001 | Quản trị AI | Đang nổi lên; kết hợp với ISO 27001 |

### EU AI Act timeline

- Ngày 1 tháng 8 năm 2024: có hiệu lực.
- Ngày 2 tháng 2 năm 2025: thực thi thực hành AI bị cấm.
- Ngày 2 tháng 8 năm 2026: thực thi hệ thống rủi ro cao (đánh giá sự phù hợp, lập tài liệu, ghi log).
- Tháng 8 năm 2027: hệ thống rủi ro cao trong sản phẩm theo pháp luật hài hòa hóa.

Tầng rủi ro: Không thể chấp nhận (bị cấm), Rủi ro cao (sự phù hợp + ghi log), Rủi ro hạn chế (minh bạch), Rủi ro tối thiểu (không ràng buộc). Phần lớn LLM SaaS B2B có rủi ro hạn chế; rủi ro cao bắt đầu với việc làm, tín dụng, giáo dục, thực thi pháp luật, di cư, dịch vụ thiết yếu.

Tiền phạt (Điều 99): tới €15M hoặc 3% doanh thu hằng năm toàn cầu cho vi phạm nghĩa vụ hệ thống rủi ro cao (Điều 99(4)); tới €35M hoặc 7% cho thực hành AI bị cấm (Điều 99(3)); áp dụng mức nào cao hơn.

### GDPR — real-time redaction is the standard

Làm sạch hậu xử lý (che PII sau khi LLM thấy nó) không phải định hướng có thể bảo vệ được — mô hình đã thấy dữ liệu. Che ở lớp suy luận thời gian thực là tiêu chuẩn năm 2026:

- Nhận dạng thực thể trước lệnh gọi LLM.
- Token hóa nhất quán (cách tiếp cận Mesh) giữ ngữ nghĩa.
- Chỉ lưu prompt đã che + dữ liệu thô được đồng ý chủ động cho phép.

Thực thi gần đây: €30.5M đối với Clearview AI (DPA Hà Lan, tháng 9 năm 2024) là tiền phạt GDPR riêng cho AI lớn nhất được ghi nhận đến nay; €15M đối với OpenAI (Garante của Ý, tháng 12 năm 2024) là tiền phạt riêng cho LLM lớn nhất, dù bị hủy khi kháng cáo vào tháng 3 năm 2026 và phán quyết vẫn đang được xem xét thêm. Các lập luận hậu xử lý đã không qua kiểm toán.

### HIPAA — BAA is not optional

Bạn không thể gửi PHI đến dịch vụ AI bên ngoài nếu không có Thỏa thuận Đối tác Kinh doanh đã ký. Cả ba nền tảng LLM hyperscaler (Bedrock, Azure OpenAI, Vertex) cung cấp BAA. API trực tiếp OpenAI cung cấp BAA. API trực tiếp Anthropic cung cấp BAA. Xác nhận trước khi gửi PHI.

### SOC 2 Type II

Type I: kiểm soát được thiết kế và lập tài liệu.
Type II: kiểm soát hoạt động hiệu quả trong 6-12 tháng.

Mua sắm B2B năm 2026 mặc định Type II. Type I là bước đầu; Type II là cổng.

Các yếu tố kiểm toán phổ biến: log truy cập (ai thấy gì), quản lý thay đổi (đã triển khai thế nào), đánh giá rủi ro (hằng quý), ứng phó sự cố (đã kiểm thử?). Log kiểm toán từ Giai đoạn 17 · 25 có thể tái sử dụng trực tiếp.

### Cross-framework mapping

Một chính sách kiểm soát truy cập đáp ứng các kiểm soát của nhiều khung:

| Kiểm soát | Các khung |
|---------|-----------|
| Ghi log truy cập | ISO 27001 A.5.15-5.18, GDPR Điều 32, HIPAA §164.312(a) |
| Quản lý thay đổi | ISO 27001 A.8.32, PCI DSS Yêu cầu 6, phạm vi thông báo vi phạm HIPAA |
| Mã hóa khi truyền | ISO 27001 A.8.24, GDPR Điều 32, HIPAA §164.312(e) |
| Quản lý bí mật | ISO 27001 A.8.19, PCI DSS Yêu cầu 8, SOC 2 CC6.1 |

Công cụ tuân thủ (Drata, Vanta, Secureframe) tự động hóa ánh xạ này. Đáng chi phí ở quy mô lớn.

### ISO 42001 — emerging

Công bố cuối năm 2023. Yêu cầu mua sắm ngày càng tăng bên cạnh ISO 27001. Khung quản trị AI bao gồm quản lý rủi ro, chất lượng dữ liệu, minh bạch, giám sát con người.

### OpenAI's reference profile

OpenAI duy trì SOC 2 Type 2, ISO/IEC 27001:2022, ISO/IEC 27701:2019, GDPR/CCPA/HIPAA (BAA)/FERPA, PCI-DSS cho thành phần thanh toán ChatGPT. Đó xấp xỉ là yêu cầu tối thiểu doanh nghiệp năm 2026.

### Numbers you should remember

- Tiền phạt EU AI Act: tới €15M / 3% (nghĩa vụ rủi ro cao, Điều 99(4)); tới €35M / 7% (thực hành bị cấm, Điều 99(3)).
- Thực thi rủi ro cao EU AI Act: ngày 2 tháng 8 năm 2026.
- Tiền phạt GDPR riêng cho AI lớn nhất được ghi nhận: €30.5M, Clearview AI (DPA Hà Lan, tháng 9 năm 2024).
- Tiền phạt GDPR riêng cho LLM lớn nhất: €15M, OpenAI (Garante của Ý, tháng 12 năm 2024; bị hủy khi kháng cáo tháng 3 năm 2026).
- Cửa sổ SOC 2 Type II: 6-12 tháng kiểm soát được vận hành.
- Ngày hiệu lực Colorado AI Act: ngày 30 tháng 6 năm 2026 (hoãn từ tháng 2 năm 2026 bởi SB25B-004).

```figure
i4-control-matrix
```

## Use It

`code/main.py` là bảng tính ánh xạ tuân thủ bằng Python — với một kiểm soát, liệt kê các khung nó đáp ứng.

## Ship It

Bài học này tạo ra `outputs/skill-compliance-matrix.md`. Với phân khúc khách hàng và địa lý, chỉ định các khung và kiểm soát bắt buộc.

## Exercises

1. Khách hàng doanh nghiệp đầu tiên của bạn yêu cầu SOC 2 Type II, HIPAA BAA, tuyên bố EU AI Act. Định hướng tuân thủ khả thi tối thiểu để thắng giao dịch là gì?
2. Phân loại ba sản phẩm LLM giả định theo tầng rủi ro EU AI Act. Điều gì thay đổi ở rủi ro cao?
3. Bạn vô tình gửi PHI đến nhà cung cấp không có BAA. Đi qua quy trình ứng phó sự cố.
4. Lập luận liệu ISO 42001 có "cần thiết năm 2026" cho một nhà cung cấp AI thị trường tầm trung hay không.
5. Ánh xạ các trường log kiểm toán LLM của bạn (Giai đoạn 17 · 25) đến ít nhất ba kiểm soát khung.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| SOC 2 Type II | "kiểm soát được kiểm toán" | Kiểm soát vận hành trong 6-12 tháng, được chứng thực độc lập |
| HIPAA BAA | "hợp đồng y tế" | Thỏa thuận Đối tác Kinh doanh; bắt buộc cho PHI |
| GDPR | "quyền riêng tư EU" | Che PII thời gian thực là tiêu chuẩn có thể bảo vệ được năm 2026 |
| EU AI Act | "quy tắc AI EU" | Thực thi rủi ro cao tháng 8 năm 2026; €15M / 3% (nghĩa vụ rủi ro cao) — €35M / 7% (thực hành bị cấm) |
| Colorado AI Act | "luật AI tiểu bang Mỹ" | Hiệu lực ngày 30 tháng 6 năm 2026 (hoãn bởi SB25B-004); đánh giá tác động |
| ISO 42001 | "quản trị AI" | Khung đang nổi lên cho rủi ro AI + minh bạch |
| ISO 27001 | "ISMS bảo mật" | Cơ sở Hệ thống Quản lý An toàn Thông tin |
| Conformity assessment (Đánh giá sự phù hợp) | "gói tài liệu AI EU" | Yêu cầu rủi ro cao: tài liệu, kiểm thử, ghi log |
| Cross-framework mapping (Ánh xạ xuyên khung) | "một kiểm soát, nhiều khung" | Một chính sách đáp ứng kiểm soát của nhiều khung |

## Further Reading

- [OpenAI Security and Privacy](https://openai.com/security-and-privacy/) — hồ sơ tuân thủ tham chiếu.
- [GuardionAI — LLM Compliance 2026: ISO 42001, EU AI Act, SOC 2, GDPR](https://guardion.ai/blog/llm-compliance-guide-iso-42001-eu-ai-act-soc2-gdpr-2026)
- [Dsalta — SOC 2 Type 2 Audit Guide 2026: 10 AI Controls](https://www.dsalta.com/resources/ai-compliance/soc-2-type-2-audit-guide-2026-10-ai-powered-controls-every-saas-team-needs)
- [EU AI Act official text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj) — nguồn sơ cấp.
- [Colorado AI Act](https://leg.colorado.gov/bills/sb24-205) — nguồn sơ cấp.
- [ISO/IEC 42001:2023](https://www.iso.org/standard/81230.html) — tiêu chuẩn hệ thống quản lý AI.
