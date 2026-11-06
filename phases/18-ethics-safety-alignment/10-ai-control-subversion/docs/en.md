# AI Control — Safety Despite Subversion

> Greenblatt, Shlegeris, Sachan, Roger (Redwood Research, arXiv:2312.06942, ICML 2024). Kiểm soát đặt lại câu hỏi an toàn: với mô hình mạnh không đáng tin U có thể đang tối ưu đối kháng chống bạn, giao thức nào cho phép lấy công việc hữu ích trong khi giới hạn xác suất kết quả không thể chấp nhận? Tài nguyên là mô hình yếu hơn đáng tin T, ngân sách lao động con người đáng tin H, và khả năng sửa đầu ra U. Trong khung này, Chỉnh sửa Đáng tin trội Pareto hơn Giám sát Không đáng tin trên tác vụ cửa hậu mã. Khung kế thừa giả định trường hợp xấu nhất từ kỹ thuật bảo mật: an toàn là xác suất U được chọn đối kháng không thể gây kết quả không thể chấp nhận cụ thể, được đo dưới áp lực red-team thay thế cho U.

**Type:** Learn
**Languages:** Python (stdlib, safety-vs-usefulness frontier on code-backdoor task)
**Prerequisites:** Phase 18 · 07 (sleeper agents), Phase 18 · 08 (scheming), Phase 18 · 09 (alignment faking)
**Time:** ~75 minutes

## Learning Objectives

- Định nghĩa mô hình đe dọa AI Control: mô hình mạnh không đáng tin U, mô hình yếu hơn đáng tin T, ngân sách con người đáng tin H.
- Mô tả giao thức Chỉnh sửa Đáng tin và tại sao nó trội Pareto hơn Giám sát Không đáng tin trên tác vụ cửa hậu mã ICML 2024.
- Giải thích khác biệt giữa căn chỉnh (U đáng tin) và kiểm soát (U không đáng tin và chúng ta vẫn an toàn).
- Nêu ba giới hạn kiểm soát: con người không mở rộng được, mô hình yếu đáng tin cuối cùng tụt sau, kiểm soát không tạo mô hình mạnh đáng tin.

## The Problem

Bài 7-9 xác lập mô hình tiên tiến hàng đầu có thể căn chỉnh mang tính lừa dối, mưu đồ hoặc giả vờ căn chỉnh. Câu hỏi an toàn được đặt lại: có thể lấy công việc hữu ích từ mô hình không tin cậy mà không cho cơ hội gây kết quả không thể chấp nhận không? Đây là vấn đề kiểm soát, có cấu trúc như bảo mật cổ điển: giả định đối thủ trường hợp xấu nhất, thiết kế giao thức, đo tỷ lệ thành công của đối thủ dưới áp lực red-team.

## The Concept

### The threat model

Kiểm soát giả định:
- U — mô hình mạnh không đáng tin. Có năng lực. Có thể đối kháng (đánh giá xem nó như vậy).
- T — mô hình yếu hơn đáng tin. Ít năng lực hơn, nhưng biết không đối kháng.
- H — lao động con người đáng tin. Ngân sách nhỏ; không mở rộng được.

Hệ thống phải tạo đầu ra hữu ích bằng U. Đối thủ cố gây kết quả không thể chấp nhận cụ thể (ví dụ: cửa hậu trong mã được phát hành) trong khi duy trì một tỷ phần công việc hữu ích hợp lệ để vượt ngưỡng hữu ích.

Kiểm soát từ bỏ tin U. Nó hỏi giao thức nào duy trì an toàn khi thiếu niềm tin vào U.

### The ICML 2024 backdoor task

Prompt là bài toán lập trình cấp thi đấu. U tạo lời giải ứng viên. Một oracle ẩn đánh dấu nếu lời giải chứa cửa hậu (đầu vào cụ thể khiến mã tạo đầu ra sai). Red team kiểm soát U và được thấy toàn bộ nội bộ giao thức. Giao thức phải tối đa hóa tỷ lệ giải được bài trong khi giữ tỷ lệ phát hành cửa hậu dưới ngưỡng.

### Four protocols compared

- **Đường cơ sở:** phát hành trực tiếp đầu ra U. Hữu ích tối đa. An toàn tối thiểu.
- **Kiểm tra trước:** dùng H trên mọi đầu ra. An toàn tối đa. Ngân sách cạn nhanh.
- **Giám sát Không đáng tin:** phiên bản U thứ hai chấm đầu ra phiên bản đầu; H kiểm tra đầu ra bị đánh dấu. Rủi ro: hai phiên bản U có thể thông đồng.
- **Chỉnh sửa Đáng tin:** T sửa đầu ra U trên mọi truy vấn. Nếu T không tự tin, định tuyến đến H.

Greenblatt và cộng sự thấy Chỉnh sửa Đáng tin trội Pareto hơn Giám sát Không đáng tin: hữu ích cao hơn ở mọi mức an toàn.

### Why Trusted Editing wins

Giám sát Không đáng tin yêu cầu phiên bản U thứ hai không thể phối hợp với phiên bản đầu. Thông đồng có thể qua tín hiệu giấu tin hoặc tiên nghiệm huấn luyện chung. Giao thức phải đầu tư ngân sách chống thông đồng (diễn đạt lại, làm rối) làm giảm tín hiệu bộ giám sát. Chỉnh sửa Đáng tin tránh hoàn toàn thông đồng vì T đáng tin — theo giả định, mọi sửa đổi T đề xuất không đối kháng. Chi phí là T ít năng lực hơn nên có thể từ chối quá mức hoặc bỏ sót cửa hậu tinh vi.

### The four protocol axes

1. U đóng vai gì: chỉ tạo, giám sát hay cả hai.
2. T đóng vai gì: chỉnh sửa, giám sát hay lấy mẫu lại.
3. H được phân bổ thế nào: kiểm tra đồng đều, ngẫu nhiên hay theo cờ.
4. Giao thức dành bao nhiêu tính toán cho chống thông đồng.

### Alignment vs control

- Căn chỉnh: "U có an toàn để tin không?" Bài 2, 4, 5, 6, 7, 8, 9 đều liên quan.
- Kiểm soát: "có thể dùng U an toàn mà không tin nó không?" Bài 10.

Căn chỉnh là thuộc tính mô hình. Kiểm soát là thuộc tính giao thức triển khai. Kiểm soát không tạo mô hình được căn chỉnh; nó tạo việc dùng an toàn mô hình có thể không được căn chỉnh. Cần cả hai chương trình.

### Three fundamental limits

- Con người không mở rộng được. Ngân sách H bị chặn bởi số người sẵn lòng kiểm tra đầu ra AI khó.
- Mô hình yếu đáng tin cuối cùng tụt sau. Khi T yếu hơn U nhiều, tín hiệu chỉnh sửa của T thành nhiễu.
- Kiểm soát không phải căn chỉnh. Giao thức hoạt động ở ASL-3 (Bài 18) có thể không hoạt động ở ASL-4 — nếu U thao túng T hoặc suy luận về phân phối kiểm tra H, kiểm soát thất bại.

### The 2025 development

UK AISI và Redwood hợp tác về Control Safety Cases (metr.org / redwoodresearch.org 2025): hồ sơ lập luận an toàn kiểm soát lập luận dưới giả định trường hợp xấu nhất về U, giao thức giới hạn xác suất kết quả không thể chấp nhận. Hồ sơ lập luận an toàn (Bài 18) kế thừa khung kiểm soát.

### Where this fits in Phase 18

Bài 6-9 mô tả đe dọa (lừa dối có thể xảy ra). Bài 10 mô tả mô hình phòng vệ dưới giả định đe dọa là thật. Bài 11 mô tả mô hình tấn công bổ sung (làm U đáng tin qua giám sát có thể mở rộng).

```figure
al-control-protocol
```

## Use It

`code/main.py` mô phỏng bốn giao thức trên tác vụ cửa hậu đơn giản. U tạo đầu ra; một phần có cửa hậu (chính sách red-team). T phê duyệt hoặc sửa. H được gọi theo ngân sách. Bạn có thể quét ngân sách và tham số thông đồng để tái tạo biên Pareto trong Hình 2 Greenblatt và cộng sự 2024 (hình dạng, không phải số liệu).

## Ship It

Bài học này tạo ra `outputs/skill-control-protocol-audit.md`. Với mô tả giao thức triển khai, xác định vai U / T / H, nêu hướng thông đồng và ước tính vị trí giao thức trên biên hữu ích-an toàn dưới áp lực red-team.

## Exercises

1. Chạy `code/main.py`. Tái tạo biên hữu ích-an toàn của Chỉnh sửa Đáng tin so với Giám sát Không đáng tin. Xác định chế độ ngân sách trong đó giả định thông đồng của Giám sát Không đáng tin trở nên then chốt.

2. Thêm giao thức mới: "T lấy mẫu lại với temperature thấp, rồi U sửa đầu ra T." Đo vị trí trên biên. Tại sao thất bại thảm họa hơn Chỉnh sửa Đáng tin?

3. Bài báo 2024 giả định U thấy giao thức. Thiết kế giao thức giấu U đầu ra nào đang được kiểm tra. Giao thức cần gì từ hạ tầng triển khai?

4. Đọc Phần 7 Greenblatt và cộng sự 2024 (thông đồng). Đề xuất biện pháp chống thông đồng và giải thích chi phí hữu ích dự kiến.

5. Trình bày hồ sơ lập luận an toàn kiểm soát cho triển khai dùng U = cấp GPT-4, T = cấp GPT-3.5, H = 1% đầu ra được kiểm tra. Xác định giả định mạnh nhất duy nhất mà hồ sơ phụ thuộc.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| AI Control (Kiểm soát AI) | "an toàn dưới phá hoại" | Thiết kế giao thức chặn kết quả không thể chấp nhận dưới U trường hợp xấu nhất |
| Untrusted model (U) (Mô hình không đáng tin) | "mô hình mạnh" | Mô hình có năng lực muốn lấy công việc nhưng không tin cậy |
| Trusted model (T) (Mô hình đáng tin) | "mô hình yếu" | Mô hình yếu hơn, biết không đối kháng, dùng chỉnh sửa/giám sát |
| Trusted human (H) (Con người đáng tin) | "ngân sách kiểm tra" | Lao động chuyên gia bị giới hạn; đắt; tín hiệu sự thật nền |
| Trusted Editing (Chỉnh sửa Đáng tin) | "T sửa U" | Giao thức T là cổng cho đầu ra U; gọi H với đầu ra mơ hồ |
| Untrusted Monitoring (Giám sát Không đáng tin) | "U giám sát U" | Giao thức phiên bản U thứ hai chấm đầu ra; chỉ chống thông đồng khi đầu tư thêm |
| Control safety case (Hồ sơ lập luận an toàn kiểm soát) | "lập luận hình thức" | Lập luận bằng văn bản rằng giao thức giới hạn mức thành công của đối thủ dưới U trường hợp xấu nhất |

## Further Reading

- [Greenblatt, Shlegeris, Sachan, Roger — AI Control (arXiv:2312.06942)](https://arxiv.org/abs/2312.06942) — bài báo ICML 2024 kinh điển
- [Redwood Research — Recent AI Control papers index](https://redwoodresearch.substack.com/) — công trình tiếp nối 2024-2025
- [UK AISI + METR — Control safety cases](https://metr.org/blog/2025-03-26-common-elements-of-frontier-ai-safety-policies/) — hiện thực hóa cho phòng thí nghiệm tiên tiến hàng đầu
- [Hubinger et al. — Sleeper Agents (Lesson 7, arXiv:2401.05566)](https://arxiv.org/abs/2401.05566) — mô hình đe dọa kiểm soát giả định
