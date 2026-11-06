# Data Provenance and Training-Data Governance

> EU AI Act yêu cầu tiêu chuẩn từ chối tham gia máy đọc được cho GPAI trước tháng 8 năm 2025 (qua ngoại lệ TDM Chỉ thị Bản quyền EU). California AB 2013 (ký 2024) — minh bạch dữ liệu huấn luyện AI tạo sinh yêu cầu nhà phát triển công bố tóm tắt tập dữ liệu với 12 trường bắt buộc. Thống nhất DPA 2025 về lợi ích chính đáng: DPC Ireland (ngày 21 tháng 5 năm 2025) chấp nhận huấn luyện LLM Meta trên nội dung công khai bên thứ nhất của người trưởng thành EU/EEA có biện pháp bảo vệ sau ý kiến EDPB; Tòa Thượng thẩm Khu vực Cologne (ngày 23 tháng 5 năm 2025) bác lệnh cấm; DPA Hamburg bỏ thủ tục khẩn cấp; ICO Anh (ngày 23 tháng 9 năm 2025) đưa phản hồi quản lý tích cực với biện pháp bảo vệ huấn luyện AI LinkedIn (minh bạch, từ chối tham gia đơn giản, kéo dài cửa sổ phản đối) và tiếp tục giám sát — không phải chấp thuận chính thức. ANPD Brazil (ngày 2 tháng 7 năm 2024) đình chỉ xử lý của Meta do minh bạch thông tin không đủ; biện pháp phòng ngừa được dỡ ngày 30 tháng 8 năm 2024 sau Meta nộp kế hoạch tuân thủ. Vấn đề không thể đảo ngược chính: khung đồng ý cookie thiết kế cho theo dõi thời gian thực, đảo ngược được; khi dữ liệu vào trọng số mô hình, không thể xóa chính xác — không có quyền xóa GDPR thực tế cho mạng nơ-ron đã huấn luyện. Cửa sổ tuân thủ ở lúc thu thập. Data Provenance Initiative (dataprovenance.org, Longpre, Mahari, Lee và cộng sự, "Consent in Crisis", tháng 7 năm 2024): kiểm tra quy mô lớn cho thấy suy giảm nhanh tài nguyên dữ liệu AI chung khi nhà xuất bản thêm hạn chế robots.txt.

**Type:** Learn
**Languages:** Python (stdlib, 12-field California AB 2013 scaffolding generator)
**Prerequisites:** Phase 18 · 24 (regulatory), Phase 18 · 26 (cards)
**Time:** ~60 minutes

## Learning Objectives

- Mô tả 12 trường bắt buộc California AB 2013 cho minh bạch dữ liệu huấn luyện AI tạo sinh.
- Nêu lập trường DPA 2025 về huấn luyện LLM dựa trên lợi ích chính đáng (DPC Ireland, ICO Anh, Hamburg, Cologne).
- Mô tả vấn đề không thể đảo ngược: tại sao quyền xóa GDPR không có tương đương thực tế cho mạng nơ-ron đã huấn luyện.
- Nêu phát hiện "Consent in Crisis" của Data Provenance Initiative.

## The Problem

Quản trị dữ liệu huấn luyện là thượng nguồn mọi thẻ mô hình (Bài 26) và nghĩa vụ quy định (Bài 24). Năm 2024-2025, bức tranh quy định hợp nhất trên ba nguyên tắc: hạ tầng từ chối tham gia, công bố theo tập dữ liệu và điều chỉnh lợi ích chính đáng cho dữ liệu công khai. Nhà cung cấp không tuân lúc thu thập không thể khắc phục hạ nguồn.

## The Concept

### California AB 2013

Ký 2024. Tài liệu phải đăng vào hoặc trước ngày 1 tháng 1 năm 2026 cho hệ thống phát hành vào hoặc sau ngày 1 tháng 1 năm 2022. Mục 3111(a) yêu cầu nhà phát triển công bố tóm tắt cấp cao tập dữ liệu dùng huấn luyện với 12 mục luật định:
1. Nguồn hoặc chủ sở hữu tập dữ liệu.
2. Mô tả cách tập dữ liệu thúc đẩy mục đích dự định của hệ thống AI.
3. Số điểm dữ liệu trong tập (chấp nhận khoảng chung; ước tính cho tập động).
4. Mô tả loại điểm dữ liệu (loại nhãn cho tập có nhãn; đặc điểm chung cho tập không nhãn).
5. Tập dữ liệu có gồm dữ liệu được bảo vệ bởi bản quyền, nhãn hiệu hoặc bằng sáng chế, hay hoàn toàn thuộc phạm vi công cộng.
6. Tập dữ liệu được mua hay cấp phép.
7. Tập dữ liệu có gồm thông tin cá nhân (theo Cal. Civ. Code §1798.140(v)).
8. Tập dữ liệu có gồm thông tin người tiêu dùng tổng hợp (theo Cal. Civ. Code §1798.140(b)).
9. Làm sạch, xử lý hoặc sửa đổi khác bởi nhà phát triển, cùng mục đích dự định.
10. Khoảng thời gian thu thập dữ liệu, kèm thông báo nếu thu thập đang tiếp tục.
11. Ngày tập dữ liệu được dùng lần đầu trong phát triển.
12. Hệ thống có dùng hoặc liên tục dùng tạo dữ liệu tổng hợp không.

Mục 12 (dữ liệu tổng hợp) mới so với bảng thông số Gebru và cộng sự 2018. Mục 7 (thông tin cá nhân) kích hoạt nghĩa vụ Luật Quyền riêng tư (CPRA). Luật miễn hệ thống bảo mật/toàn vẹn, vận hành máy bay và an ninh quốc gia chỉ liên bang (Mục 3111(b)).

### EU AI Act (Lesson 24) and TDM opt-out

Ngoại lệ khai phá văn bản và dữ liệu Chỉ thị Bản quyền EU cho phép huấn luyện trên nội dung công khai trừ khi chủ thể quyền từ chối tham gia. Chương Bản quyền GPAI Code of Practice EU AI Act yêu cầu nhà cung cấp GPAI tôn trọng tín hiệu từ chối máy đọc được (robots.txt, khẳng định C2PA "No AI Training", v.v.).

### 2025 DPA convergence on legitimate interest

DPC Ireland (ngày 21 tháng 5 năm 2025): kế hoạch Meta huấn luyện trên nội dung công khai bên thứ nhất của người dùng trưởng thành EU/EEA được chấp nhận có biện pháp bảo vệ sau ý kiến EDPB. Tòa Thượng thẩm Khu vực Cologne (ngày 23 tháng 5 năm 2025) bác lệnh cấm Meta: từ chối tham gia là đủ. DPA Hamburg bỏ thủ tục khẩn cấp để nhất quán toàn EU. ICO Anh (ngày 23 tháng 9 năm 2025) đưa phản hồi quản lý tích cực — không phải chấp thuận chính thức — với việc LinkedIn nối lại huấn luyện AI có biện pháp bảo vệ tương tự và giám sát tiếp tục.

Nguyên tắc hội tụ: lợi ích chính đáng có thể biện minh huấn luyện trên nội dung công khai bên thứ nhất với từ chối tham gia. Không cần đồng ý.

### Brazilian ANPD (June 2024)

Đình chỉ Meta xử lý dữ liệu người dùng Brazil cho huấn luyện AI do minh bạch thông tin không đủ. Kết quả khác DPA EU — ANPD ưu tiên minh bạch hơn tính chấp nhận lợi ích chính đáng.

### The irreversibility problem

Đồng ý cookie thiết kế cho theo dõi thời gian thực, đảo ngược được. Dữ liệu huấn luyện khác: khi dữ liệu vào trọng số mô hình, không thể xóa chính xác. Huấn luyện lại từ đầu là khắc phục hoàn chỉnh duy nhất và tốn kém không khả thi.

Khắc phục một phần:
- **Quên học.** Loại bỏ xấp xỉ; đo bằng MIA (Bài 22).
- **Định vị dựa trên hàm ảnh hưởng.** Xác định trọng số chịu ảnh hưởng dữ liệu nhiều nhất; cập nhật chọn lọc.
- **Ức chế qua tinh chỉnh.** Huấn luyện mô hình từ chối đầu ra suy từ dữ liệu.

Không biện pháp nào giải quyết hoàn toàn. Cửa sổ tuân thủ ở lúc thu thập.

### Data Provenance Initiative

dataprovenance.org. Longpre, Mahari, Lee và cộng sự "Consent in Crisis" (tháng 7 năm 2024): kiểm tra quy mô lớn tài nguyên dữ liệu huấn luyện AI chung. Phát hiện: nhà xuất bản thêm hạn chế robots.txt với tốc độ tăng. Tài nguyên chung có thể huấn luyện công khai đang co nhanh. 2023 -> 2024 chứng kiến khoảng 25% nguồn huấn luyện hàng đầu thêm một số hạn chế. Hàm ý: tính sẵn có dữ liệu huấn luyện tương lai phụ thuộc mô hình thu nhận mới (cấp phép, sinh tổng hợp, tham gia có khuyến khích).

### Where this fits in Phase 18

Bài 26 là tài liệu cấp mô hình. Bài 27 là quản trị cấp tập dữ liệu. Cùng nhau xác định lớp minh bạch. Bài 28 lập bản đồ hệ sinh thái nghiên cứu làm các câu hỏi này.

```figure
an-provenance-oneway
```

## Use It

`code/main.py` tạo khung tóm tắt tập dữ liệu 12 trường tuân thủ California AB 2013 cho tập dữ liệu đơn giản. Bạn có thể điền trường và quan sát trường nào kích hoạt nghĩa vụ riêng tư hoặc bản quyền tiếp theo.

## Ship It

Bài học này tạo ra `outputs/skill-provenance-check.md`. Với tập dữ liệu dùng huấn luyện, kiểm tra bao phủ 12 trường AB 2013, tuân thủ hạ tầng từ chối tham gia, phù hợp DPA và đánh giá rủi ro không thể đảo ngược.

## Exercises

1. Chạy `code/main.py`. Tạo tóm tắt 12 trường cho tập dữ liệu đơn giản và xác định trường chưa chỉ định đủ.

2. Từ chối TDM Chỉ thị Bản quyền EU máy đọc được. Đề xuất định dạng tiêu chuẩn cho tín hiệu từ chối và so sánh với robots.txt và C2PA "No AI Training."

3. Đọc "Consent in Crisis" của Data Provenance Initiative (tháng 7 năm 2024). Mô tả ba nhóm nội dung hạn chế nhanh nhất và lập luận một hệ quả kinh tế.

4. Sự thống nhất DPA 2025 chấp nhận lợi ích chính đáng cho huấn luyện nội dung công khai. Xây kịch bản lợi ích chính đáng không đủ và xác định cơ sở pháp lý nhà cung cấp cần thay vào.

5. Phác thảo manifest nguồn gốc dữ liệu huấn luyện kết hợp trường AB 2013 và chuỗi nguồn gốc ký C2PA cho mỗi tập dữ liệu. Xác định một rào cản kỹ thuật và một pháp lý.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| AB 2013 | "luật California" | Minh bạch dữ liệu huấn luyện AI tạo sinh; 12 trường bắt buộc |
| TDM exception (Ngoại lệ TDM) | "khai phá văn bản và dữ liệu" | Ngoại lệ dữ liệu huấn luyện Chỉ thị Bản quyền EU với từ chối tham gia |
| Legitimate interest (Lợi ích chính đáng) | "cơ sở EU" | Cơ sở Điều 6 GDPR có thể biện minh huấn luyện trên nội dung công khai |
| Opt-out signal (Tín hiệu từ chối tham gia) | "không huấn luyện máy đọc được" | robots.txt, C2PA "No AI Training," TDM.Reservation |
| Irreversibility (Tính không thể đảo ngược) | "không thể bỏ huấn luyện" | Dữ liệu trong trọng số mô hình không thể xóa chính xác |
| Unlearning (Quên học) | "loại bỏ xấp xỉ" | Can thiệp sau huấn luyện giảm phụ thuộc mô hình vào dữ liệu cụ thể |
| Consent in Crisis | "kiểm tra DPI" | Phát hiện tháng 7 năm 2024 về hạn chế robots.txt tăng tốc |

## Further Reading

- [California AB 2013](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB2013) — luật minh bạch dữ liệu huấn luyện AI tạo sinh
- [EU AI Act + GPAI Code of Practice (Lesson 24)](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) — chương Bản quyền
- [Longpre, Mahari, Lee et al. — Consent in Crisis (dataprovenance.org, July 2024)](https://www.dataprovenance.org/consent-in-crisis-paper) — kiểm tra DPI
- [IAPP — EU Digital Omnibus GDPR amendments (2025)](https://iapp.org/news/a/eu-digital-omnibus-amendments-to-gdpr-to-facilitate-ai-training-miss-the-mark) — ngữ cảnh quy định
