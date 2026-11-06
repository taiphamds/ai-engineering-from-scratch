# CAIS, CAISI, and Societal-Scale Risk

> Center for AI Safety (CAIS, San Francisco, được Hendrycks và Zhang thành lập năm 2022) công bố khung bốn rủi ro — sử dụng độc hại, các cuộc đua AI, các rủi ro tổ chức, các AI bất trị — và tuyên bố tháng 5 năm 2023 về rủi ro tuyệt chủng được hàng trăm giáo sư và lãnh đạo công ty ký. Các bản phát hành năm 2026 từ CAIS: AI Dashboard cho đánh giá mô hình tiên tiến nhất, Remote Labor Index (với Scale AI), Superintelligence Strategy Paper, bản tin AI Frontiers. Một thực thể riêng biệt: NIST Center for AI Standards and Innovation (CAISI) — các thỏa thuận tự nguyện hướng tới chính phủ Mỹ và các đánh giá năng lực không mật tập trung vào các rủi ro an ninh mạng, sinh học, và vũ khí hóa học. CAIS đánh dấu rủi ro tổ chức là một trong bốn rủi ro cấp cao nhất: văn hóa an toàn, kiểm toán nghiêm ngặt, các biện pháp phòng thủ nhiều lớp, và an ninh thông tin là nền tảng nhưng thường xuyên bị đánh đổi lấy tốc độ triển khai. California SB-53, nếu được ký, sẽ là quy định rủi ro thảm họa cấp tiểu bang đầu tiên của Mỹ.

**Type:** Learn
**Languages:** Python (stdlib, four-risk inventory and mitigation matcher)
**Prerequisites:** Phase 15 · 19 (RSP), Phase 15 · 20 (PF + FSF)
**Time:** ~45 minutes

## The Problem

Bài 19 và 20 trình bày các chính sách mở rộng quy mô nội bộ phòng thí nghiệm. Bài 21 trình bày đánh giá năng lực độc lập. Bài này trình bày góc nhìn thứ ba: các tổ chức xã hội dân sự và chính phủ định hình thảo luận công khai và đường cơ sở quy định cho rủi ro AI thảm họa.

Hai thực thể riêng biệt quan trọng. CAIS là một tổ chức nghiên cứu phi lợi nhuận công bố các khung để suy nghĩ về rủi ro AI và điều phối các tuyên bố công khai. CAISI là một trung tâm chính phủ Mỹ trong NIST thực hiện các thỏa thuận tự nguyện với các phòng thí nghiệm và các đánh giá năng lực không mật. Các tên có vần; các sứ mệnh không chồng lấp. Một người thực hành nên biết cả hai.

Nội dung thực tế: khung bốn rủi ro của CAIS là hệ phân loại rủi ro quy mô xã hội được trích dẫn rộng rãi nhất trong tài liệu nghiên cứu. Văn hóa an toàn và rủi ro tổ chức là một trong bốn loại đó, và đây là loại trực tiếp nhất dưới sự kiểm soát của người thực hành. SB-53 (California) sẽ là quy định rủi ro thảm họa cấp tiểu bang đầu tiên của Mỹ nếu được ký; cách định hình của dự luật quan trọng vì quy định cấp tiểu bang trong lịch sử đã dẫn dắt hành động liên bang trong chính sách công nghệ Mỹ.

## The Concept

### CAIS — Center for AI Safety

- Thành lập: năm 2022 tại San Francisco, bởi Dan Hendrycks và Oliver Zhang. Hendrycks là Giám đốc Điều hành và Nghiên cứu; Zhang là Giám đốc Quản lý.
- Tình trạng: tổ chức phi lợi nhuận 501(c)(3).
- Đầu ra đáng chú ý năm 2023: tuyên bố về rủi ro tuyệt chủng, được hàng trăm nhà nghiên cứu và CEO cùng ký. Nêu rằng: “Giảm thiểu rủi ro tuyệt chủng từ AI nên là một ưu tiên toàn cầu bên cạnh các rủi ro quy mô xã hội khác như đại dịch và chiến tranh hạt nhân.”
- Các đầu ra năm 2026: AI Dashboard cho đánh giá mô hình tiên tiến nhất, Remote Labor Index (chung với Scale AI), Superintelligence Strategy Paper, bản tin AI Frontiers.

### The four-risk framework

Khung của CAIS nhóm rủi ro AI thảm họa thành bốn danh mục cấp cao nhất:

1. **Sử dụng độc hại**: một kẻ xấu sử dụng AI để gây hại (tổng hợp vũ khí sinh học, thông tin sai lệch, tấn công mạng).
2. **Các cuộc đua AI**: áp lực cạnh tranh giữa các phòng thí nghiệm, công ty, hoặc quốc gia đẩy triển khai vượt qua điểm mà nó an toàn.
3. **Các rủi ro tổ chức**: các động lực nội bộ phòng thí nghiệm (thất bại văn hóa an toàn, kiểm toán không đủ, bảo mật thiếu nguồn lực) tạo ra một triển khai tệ.
4. **Các AI bất trị**: một AI đủ năng lực theo đuổi các mục tiêu xung đột với phúc lợi con người.

Đây không phải là hệ phân loại duy nhất; nó là hệ được trích dẫn nhiều nhất. Các danh mục không loại trừ lẫn nhau — một AI bất trị do một tổ chức đánh đổi kiểm toán lấy tốc độ trong một cuộc đua tạo ra là cả bốn.

### Where organizational risk lives

Trong bốn danh mục, rủi ro tổ chức là loại người thực hành có thể hành động nhiều nhất. Văn hóa an toàn, mức nghiêm ngặt kiểm toán, xếp lớp phòng thủ, và an ninh thông tin của một phòng thí nghiệm quyết định liệu mô hình của họ được phát hành với các kiểm soát của Bài 10–18 thực sự được áp dụng, hay các kiểm soát đó là các mục danh sách kiểm tra không ai xác minh.

Các đòn bẩy rủi ro tổ chức cụ thể:

- **Văn hóa an toàn**: các thành viên nhóm có cảm thấy có thể chuyển cấp một mối quan ngại mà không phải trả giá về sự nghiệp không? Các khảo sát CAIS nhận thấy đây là một yếu tố dự đoán mạnh của các đòn bẩy khác.
- **Kiểm toán nghiêm ngặt**: bên ngoài và nội bộ. Các kiểm toán chỉ nội bộ tạo ra các báo cáo lạc quan.
- **Các biện pháp phòng thủ nhiều lớp**: không lớp đơn lẻ nào là đủ (chủ đề xuyên suốt Giai đoạn 15).
- **An ninh thông tin**: rò rỉ trọng số mô hình, rò rỉ dữ liệu đánh giá, rò rỉ các kỹ thuật vượt bộ giám sát. RAND SL-4 trong Bài 19 là một tiêu chuẩn cụ thể.

### CAISI — Center for AI Standards and Innovation

- Hoạt động trong NIST.
- Thực hiện các thỏa thuận tự nguyện với các phòng thí nghiệm tiên tiến nhất.
- Công bố các đánh giá năng lực không mật tập trung vào các rủi ro an ninh mạng, sinh học, và vũ khí hóa học.
- Khác với CAIS; các từ viết tắt đụng nhau; kiểm tra URL (nist.gov) để xác nhận bạn đang đọc bên nào.

Vai trò của CAISI là đối tác công khai, hướng tới chính phủ đối với các đợt hợp tác phòng thí nghiệm riêng tư của METR (Bài 21). Các báo cáo CAISI không mật; các báo cáo METR thường bị giới hạn bởi NDA. Một người thực hành đọc cả hai sẽ có bức tranh đầy đủ hơn.

### California SB-53

Dự luật Thượng viện California (kỳ họp 2025–2026) giải quyết rủi ro thảm họa từ các mô hình tiên tiến nhất. Các điều khoản then chốt theo bản dự thảo:

- Các ngưỡng năng lực cụ thể kích hoạt các nghĩa vụ cấp tiểu bang.
- Các bảo vệ người tố giác cho nhân viên phòng thí nghiệm AI.
- Các yêu cầu báo cáo sự cố đối với các thất bại thảm họa.

Nếu được ký, nó sẽ là quy định rủi ro thảm họa cấp tiểu bang đầu tiên của Mỹ. Bất kể tình trạng ký, cách định hình của dự luật định hình cách các cơ quan lập pháp tiểu bang khác tiếp cận vấn đề. Những người thực hành tại California nên theo dõi tình trạng dự luật; những người thực hành ở nơi khác nên đọc nó để hiểu quy định cấp tiểu bang của Mỹ có khả năng sẽ trông như thế nào.

### Societal-scale risk is not a single-layer problem

Chủ đề xuyên suốt Giai đoạn 15 — phòng thủ theo chiều sâu — cũng áp dụng ở lớp xã hội. Không tổ chức, quy định, hoặc khung đơn lẻ nào khép lại rủi ro thảm họa. Hệ sinh thái chỉ hoạt động khi:

- Các phòng thí nghiệm phát hành các chính sách mở rộng quy mô (Bài 19, 20).
- Các bộ đánh giá bên ngoài tạo ra các phép đo (Bài 21).
- Xã hội dân sự theo dõi và công bố rộng rãi (CAIS).
- Chính phủ thực hiện các chương trình tự nguyện và quy định cơ sở (CAISI, SB-53).
- Những người thực hành xây dựng các kiểm soát nhiều lớp (Bài 10–18).

Đây là sự tổng hợp cuối cùng cho giai đoạn: mọi bài trước là một lớp trong một ngăn xếp mà tính đầy đủ quan trọng hơn sức mạnh của bất kỳ lớp đơn lẻ nào.

```figure
a5-four-risks
```

## Use It

`code/main.py` triển khai một công cụ danh mục rủi ro nhỏ. Với một triển khai được đề xuất, nó gắn nhãn triển khai theo các danh mục bốn rủi ro và trả về một danh sách kiểm tra giảm thiểu. Nó là một công cụ hỗ trợ đọc cho khung, không phải thứ thay thế phán đoán của con người.

## Ship It

`outputs/skill-societal-risk-review.md` xem xét một triển khai về lập trường rủi ro quy mô xã hội: nó chạm tới danh mục nào trong bốn danh mục, những biện pháp giảm thiểu nào đang được áp dụng, mức phơi nhiễm rủi ro tổ chức là gì.

## Exercises

1. Chạy `code/main.py`. Đưa vào ba triển khai tổng hợp ở các quy mô khác nhau. Xác nhận các nhãn bốn rủi ro khớp những gì bạn kỳ vọng; xác định một trường hợp công cụ gắn nhãn thiếu hoặc quá mức.

2. Đọc toàn bộ bài báo bốn rủi ro của CAIS. Chọn một danh mục rủi ro và viết hai đoạn về những gì bạn tin là phát triển quan trọng nhất năm 2026 trong danh mục đó.

3. Đọc một bản dự thảo hiện tại của California SB-53. Xác định một điều khoản bạn tin củng cố lập trường rủi ro thảm họa và một điều khoản bạn tin làm suy yếu nó. Giải thích cả hai.

4. Chọn một triển khai AI sản xuất bạn biết (của bạn hoặc một triển khai được công bố). Chấm điểm nó theo các đòn bẩy con rủi ro tổ chức: văn hóa an toàn, mức nghiêm ngặt kiểm toán, các biện pháp phòng thủ nhiều lớp, an ninh thông tin. Loại nào yếu nhất? Sẽ tốn bao nhiêu để đưa nó lên ngang mức?

5. Phác thảo một phiên bản năm 2028 của khung bốn rủi ro phản ánh thêm một năm năng lực và thêm một năm kinh nghiệm triển khai. Bạn sẽ thêm, bỏ, hoặc nhóm lại những gì?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| CAIS | “Trung tâm An toàn AI” | Phi lợi nhuận; khung bốn rủi ro; tuyên bố tuyệt chủng năm 2023 |
| CAISI | “An toàn AI chính phủ Mỹ” | Trung tâm NIST; các thỏa thuận tự nguyện; các đánh giá không mật |
| Four-risk framework (Khung bốn rủi ro) | “Hệ phân loại của CAIS” | sử dụng độc hại, các cuộc đua AI, các rủi ro tổ chức, các AI bất trị |
| Malicious use (Sử dụng độc hại) | “Kẻ xấu sử dụng AI” | Vũ khí sinh học, thông tin sai lệch, tấn công mạng |
| AI races (Các cuộc đua AI) | “Áp lực cạnh tranh” | Các phòng thí nghiệm/công ty/quốc gia đẩy triển khai vượt quá an toàn |
| Organizational risk (Rủi ro tổ chức) | “Thất bại nội bộ phòng thí nghiệm” | Văn hóa an toàn, kiểm toán, phòng thủ, an ninh thông tin |
| Rogue AI (AI bất trị) | “Agent lệch căn chỉnh” | AI có năng lực theo đuổi các mục tiêu xung đột với phúc lợi con người |
| California SB-53 | “Quy định cấp tiểu bang” | Dự luật 2025–2026; quy định rủi ro thảm họa tiểu bang đầu tiên của Mỹ nếu được ký |

## Further Reading

- [Center for AI Safety](https://safe.ai/) — nơi đặt khung bốn rủi ro về mặt tổ chức.
- [CAIS — AI Risks that Could Lead to Catastrophe](https://safe.ai/ai-risk) — bài báo bốn rủi ro.
- [CAIS — May 2023 statement on extinction risk](https://safe.ai/statement-on-ai-risk) — tuyên bố chung ngắn.
- [NIST CAISI](https://www.nist.gov/caisi) — trung tâm tiêu chuẩn và đổi mới AI hướng tới chính phủ.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — kết nối các cam kết cấp phòng thí nghiệm với cách định hình quy mô xã hội.
