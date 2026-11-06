# Anthropic Responsible Scaling Policy v3.0

> RSP v3.0 có hiệu lực ngày 24 tháng 2 năm 2026, thay thế chính sách năm 2023. Giảm thiểu hai tầng: những gì Anthropic sẽ đơn phương làm so với những gì được định hình như một khuyến nghị toàn ngành (bao gồm các tiêu chuẩn bảo mật RAND SL-4). Bổ sung Frontier Safety Roadmap và Risk Report như các tài liệu thường trực thay vì các sản phẩm bàn giao một lần. Bỏ cam kết tạm dừng năm 2023. Đưa vào ngưỡng AI R&D-4: một khi vượt qua, Anthropic phải công bố một lập luận khẳng định xác định các rủi ro lệch căn chỉnh và các biện pháp giảm thiểu. Claude Opus 4.6 không vượt qua nó. Anthropic tuyên bố trong thông báo v3.0 rằng “việc tự tin loại trừ điều này đang trở nên khó khăn.” SaferAI đánh giá RSP năm 2023 ở mức 2.2; họ hạ v3.0 xuống 1.9, đưa Anthropic vào nhóm RSP “yếu” cùng với OpenAI và DeepMind. Các ngưỡng định tính thay thế các cam kết định lượng năm 2023; việc loại bỏ điều khoản tạm dừng là bước thụt lùi rõ rệt nhất.

**Type:** Learn
**Languages:** Python (stdlib, RSP threshold decision engine)
**Prerequisites:** Phase 15 · 06 (AAR), Phase 15 · 07 (RSI)
**Time:** ~45 minutes

## The Problem

Các phòng thí nghiệm tiên tiến nhất công bố các chính sách mở rộng quy mô vừa là tài liệu kỹ thuật, vừa là tài liệu quản trị, vừa là tín hiệu cho các cơ quan quản lý. RSP v3.0 là tài liệu hiện tại của Anthropic. Đọc kỹ nó quan trọng không phải vì tuân thủ nó có tính ràng buộc (không phải), mà vì cách định hình tác động đến cách một phòng thí nghiệm quan niệm về rủi ro thảm họa và cách họ truyền đạt các đánh đổi tới công chúng.

Phần khác biệt giữa v3.0 và v2.0 là đơn vị hữu ích. Những gì được bổ sung: Frontier Safety Roadmap, Risk Report, ngưỡng AI R&D-4. Những gì bị loại bỏ: cam kết tạm dừng năm 2023. Những gì được định hình lại: một lịch trình giảm thiểu hai tầng chia giữa đơn phương của Anthropic và khuyến nghị cho ngành. Đánh giá bên ngoài — SaferAI — hạ điểm từ 2.2 (v2) xuống 1.9 (v3.0). Đây là cách một chính sách mở rộng quy mô có thể trở nên kém nghiêm ngặt hơn trong khi trông trau chuốt hơn.

## The Concept

### The two-tier mitigation schedule

- **Các hành động đơn phương của Anthropic**: những gì Anthropic sẽ làm bất kể các phòng thí nghiệm khác làm gì. Dừng huấn luyện trên một ngưỡng, các biện pháp bảo mật cụ thể, các cổng triển khai cụ thể.
- **Các khuyến nghị toàn ngành**: những gì Anthropic nghĩ cả ngành nên cùng làm. Bao gồm các tiêu chuẩn bảo mật RAND SL-4. Đây không phải là các cam kết từ phía Anthropic; chúng là vận động chính sách.

Cấu trúc hai tầng không có trong v2. Điều đó có nghĩa là người đọc cần nhìn xem mỗi cam kết nằm ở cột nào. Một biện pháp bảo mật trong cột “khuyến nghị toàn ngành” không phải là lời hứa của Anthropic; nó là hy vọng của Anthropic.

### The AI R&D-4 threshold

Đây là mức năng lực RSP v3.0 nêu tên là ngưỡng quan trọng tiếp theo. Cụ thể: một mô hình có thể tự động hóa một phần đáng kể nghiên cứu AI với chi phí cạnh tranh. Một khi Anthropic tin một mô hình vượt qua nó, họ phải công bố một lập luận khẳng định xác định các rủi ro lệch căn chỉnh và các biện pháp giảm thiểu trước khi tiếp tục mở rộng quy mô.

Claude Opus 4.6 không vượt qua nó theo thông báo v3.0. Tài liệu bổ sung: “việc tự tin loại trừ điều này đang trở nên khó khăn.” Cách diễn đạt đó quan trọng; nó thừa nhận ngưỡng đủ gần để là một mối quan ngại hiện hữu, không phải một giới hạn suy đoán.

Bài 6 (Nghiên cứu căn chỉnh tự động) và Bài 7 (Tự cải thiện đệ quy) đóng góp trực tiếp vào ngưỡng này. Các nhà nghiên cứu căn chỉnh tự động vượt qua các mức chất lượng nghiên cứu là bằng chứng ngưỡng AI R&D-4 đang đến gần.

### Frontier Safety Roadmaps and Risk Reports

v3.0 nâng hai loại hiện vật lên thành tài liệu thường trực:

- **Lộ trình an toàn tiên tiến nhất**: tài liệu hướng tới tương lai mô tả công việc an toàn dự kiến, kỳ vọng năng lực, và nghiên cứu giảm thiểu.
- **Báo cáo rủi ro**: tài liệu nhìn lại về các mô hình cụ thể sau phát hành, mô tả năng lực quan sát được và rủi ro còn lại.

Cả hai đều công khai. Cả hai được cập nhật theo một nhịp đã khai báo. Ích lợi là: người đọc có thể theo dõi cách những gì Anthropic nói họ sẽ làm trong một Roadmap so với những gì họ báo cáo trong một Risk Report.

### Removing the pause clause

RSP năm 2023 bao gồm một cam kết tạm dừng tường minh: nếu một mô hình vượt qua các ngưỡng năng lực cụ thể, huấn luyện sẽ tạm dừng cho đến khi các biện pháp giảm thiểu được áp dụng. v3.0 thay thế việc tạm dừng tường minh bằng một cách diễn đạt mềm hơn (công bố một lập luận khẳng định, tiến hành nếu các biện pháp giảm thiểu đầy đủ). SaferAI và các nhà phân tích khác đã trực tiếp chỉ ra điều này là bước thụt lùi mạnh nhất trong tài liệu mới.

Lập luận chính sách cho thay đổi: các ngưỡng định lượng năm 2023 hóa ra không thể đạt được bằng các benchmark năng lực thời kỳ 2026 vì bản thân các benchmark đã được thay đổi thang đo. Phản biện: một điều khoản tạm dừng trong một chính sách mở rộng quy mô là một công cụ cam kết; loại bỏ nó loại bỏ độ tin cậy của chính sách.

### SaferAI's downgrade

SaferAI là một tổ chức độc lập đánh giá các tài liệu kiểu RSP. Đánh giá công khai của họ: RSP Anthropic năm 2023 đạt 2.2 (trên một thang mà 4.0 là RSP hiện tại tốt nhất và 1.0 là danh nghĩa). v3.0 đạt 1.9. Điều này chuyển Anthropic từ “trung bình” sang “yếu”, gia nhập OpenAI và DeepMind trong nhóm yếu.

Các yếu tố hạ điểm theo SaferAI:
- Các ngưỡng định tính thay thế các ngưỡng định lượng.
- Cam kết tạm dừng bị loại bỏ.
- Các biện pháp giảm thiểu ngưỡng AI R&D-4 được mô tả là “lập luận khẳng định” thay vì các biện pháp cụ thể.
- Các cơ chế xem xét phụ thuộc vào Safety Advisory Group của Anthropic, với sự giám sát độc lập hạn chế.

### What this lesson is not

Đây không phải là một bài học về tuân thủ. RSP v3.0 không phải là một quy định; không có gì buộc Anthropic phải làm theo nó. Bài học nằm ở việc đọc tài liệu với sự cụ thể và hoài nghi mà nó xứng đáng. Các chính sách mở rộng quy mô là tín hiệu công khai chính mà các phòng thí nghiệm tiên tiến nhất phát ra về lập trường rủi ro thảm họa. Đọc chúng tốt là một kỹ năng thực tế cho bất kỳ ai có công việc phụ thuộc vào các năng lực tiên tiến nhất.

```figure
a5-rsp-ladder
```

## Use It

`code/main.py` triển khai một engine quyết định nhỏ phản ánh hình dạng đánh giá ngưỡng RSP: với một mô hình ứng viên và một tập phép đo năng lực, trả về liệu ngưỡng AI R&D-4 có bị vượt qua hay không, các phần lập luận khẳng định bắt buộc, và liệu triển khai có thể tiến hành hay không. Nó có chủ đích đơn giản; mục đích là làm logic của tài liệu trở nên tường minh.

## Ship It

`outputs/skill-scaling-policy-review.md` xem xét một chính sách mở rộng quy mô (Anthropic, OpenAI, DeepMind, hoặc nội bộ) theo tham chiếu v3.0: cấu trúc hai tầng, các ngưỡng, các cam kết tạm dừng, xem xét độc lập.

## Exercises

1. Chạy `code/main.py`. Đưa vào ba mô hình tổng hợp ở các mức năng lực khác nhau. Xác nhận bộ đánh giá ngưỡng hành xử như kỳ vọng và tạo ra mẫu lập luận khẳng định đúng.

2. Đọc toàn bộ RSP v3.0 (32 trang). Xác định mọi cam kết nằm trong tầng “khuyến nghị toàn ngành”. Cam kết nào trong số đó sẽ là “đơn phương của Anthropic” trong v2?

3. Đọc phương pháp chấm điểm RSP của SaferAI. Tái lập điểm 1.9 của họ cho v3.0 bằng cách áp dụng thang đánh giá của họ cho tài liệu. Hàng nào trong thang đánh giá thúc đẩy việc hạ điểm nhiều nhất?

4. Cam kết tạm dừng năm 2023 đã bị loại bỏ. Đề xuất một cam kết thay thế giữ độ tin cậy của chính sách trong khi thừa nhận vấn đề thay đổi thang đo benchmark năm 2026.

5. So sánh RSP v3.0 với OpenAI Preparedness Framework v2 (Bài 20). Chọn một lĩnh vực mà v3.0 mạnh hơn. Chọn một lĩnh vực mà Preparedness Framework mạnh hơn.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|---|---|---|
| RSP | “Chính sách mở rộng quy mô của Anthropic” | Responsible Scaling Policy; v3.0 có hiệu lực ngày 24 tháng 2 năm 2026 |
| AI R&D-4 | “Ngưỡng tự động hóa nghiên cứu” | Năng lực tự động hóa nghiên cứu AI đáng kể với chi phí cạnh tranh |
| Affirmative case (Lập luận khẳng định) | “Lý giải an toàn” | Lập luận được công bố rằng các rủi ro được xác định và các biện pháp giảm thiểu đầy đủ |
| Frontier Safety Roadmap (Lộ trình an toàn tiên tiến nhất) | “Kế hoạch phía trước” | Tài liệu thường trực về công việc an toàn dự kiến và năng lực kỳ vọng |
| Risk Report (Báo cáo rủi ro) | “Nhìn lại một mô hình” | Tài liệu thường trực về năng lực quan sát được và rủi ro còn lại sau phát hành |
| Two-tier mitigation (Giảm thiểu hai tầng) | “Đơn phương so với ngành” | Các cam kết Anthropic so với các khuyến nghị ngành, được tách riêng |
| Pause commitment (Cam kết tạm dừng) | “Điều khoản năm 2023” | Lời hứa tường minh tạm dừng huấn luyện; bị loại bỏ trong v3.0 |
| SaferAI rating (Đánh giá SaferAI) | “Điểm RSP độc lập” | Thang đánh giá bên thứ ba; v3.0 đạt 1.9 (v2 là 2.2) |

## Further Reading

- [Anthropic — Responsible Scaling Policy v3.0](https://anthropic.com/responsible-scaling-policy/rsp-v3-0) — toàn bộ chính sách dài 32 trang.
- [Anthropic — RSP v3.0 announcement](https://www.anthropic.com/news/responsible-scaling-policy-v3) — tóm tắt các thay đổi từ v2.
- [Anthropic — Frontier Safety Roadmap](https://www.anthropic.com/responsible-scaling-policy/roadmap) — tài liệu thường trực được liên kết từ RSP v3.0.
- [Anthropic — Risk Report: February 2026](https://www.anthropic.com/feb-2026-risk-report) — nhìn lại Claude Opus 4.6, mô hình tiên tiến nhất khi nó được công bố.
- [Anthropic — Measuring agent autonomy in practice](https://www.anthropic.com/research/measuring-agent-autonomy) — kết nối AI R&D-4 với tính tự chủ được đo.
