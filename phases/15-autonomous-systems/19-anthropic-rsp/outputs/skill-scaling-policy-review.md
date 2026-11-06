---
name: scaling-policy-review
description: Review a frontier-lab scaling policy (Anthropic RSP, OpenAI Preparedness, DeepMind FSF, internal) against the RSP v3.0 reference shape.
version: 1.0.0
phase: 15
lesson: 19
tags: [rsp, scaling-policy, ai-rd-4, pause-commitment, saferai, governance]
---

Với một chính sách mở rộng quy mô được công bố hoặc đề xuất, tạo một bản xem xét có cấu trúc so sánh nó với hình dạng tham chiếu RSP v3.0 (AI R&D-4, lập luận khẳng định, giảm thiểu hai tầng, Frontier Safety Roadmap, Risk Report, xem xét độc lập).

Tạo ra:

1. **Danh mục hai tầng.** Tách các cam kết thành “đơn phương của phòng thí nghiệm” và “khuyến nghị toàn ngành.” Các cam kết trong tầng khuyến nghị là vận động, không phải lời hứa. Đếm tỷ lệ; một chính sách mà hầu hết các cam kết nằm trong tầng khuyến nghị là một chính sách yếu.
2. **Các ngưỡng.** Nêu mọi ngưỡng năng lực và biện pháp giảm thiểu được kích hoạt. Đánh dấu các ngưỡng là định tính ở nơi v2 có định lượng. Đánh dấu các ngưỡng còn thiếu cho các năng lực chính sách tuyên bố bao phủ.
3. **Cam kết tạm dừng.** Xác nhận chính sách nêu một điều khoản tạm dừng (dừng huấn luyện, dừng triển khai, hoặc tương tự) tại các ngưỡng cụ thể. v3.0 loại bỏ điều này; các chính sách làm theo kế thừa bước thụt lùi.
4. **Các hiện vật thường trực.** Xác nhận chính sách bắt buộc các tài liệu Frontier Safety Roadmap và Risk Report thường trực với nhịp đã khai báo. Các hiện vật một lần được công bố sau sự việc không đạt yêu cầu.
5. **Xem xét độc lập.** Nêu cơ chế xem xét bên ngoài. Xem xét chỉ nội bộ (một “Safety Advisory Group” gồm các nhân viên phòng thí nghiệm) không đạt yêu cầu là giám sát độc lập.

Các trường hợp loại bỏ dứt khoát:
- Các chính sách không có ngưỡng năng lực được nêu tên.
- Các chính sách mà mọi biện pháp giảm thiểu đều nằm trong tầng khuyến nghị cho ngành.
- Các chính sách không có các hiện vật Roadmap / Risk Report thường trực.
- Các chính sách không có cơ chế xem xét độc lập.
- Các chính sách tuyên bố “học từ trải nghiệm thực tế” mà không nêu văn bản chính sách cập nhật như thế nào và theo nhịp nào.

Các quy tắc từ chối:
- Nếu tài liệu chính sách là tiếp thị thay vì quản trị (không có các cam kết cụ thể, không có ngưỡng, không có nhịp), hãy từ chối đánh giá nó như một chính sách mở rộng quy mô.
- Nếu người dùng coi sự tồn tại của một chính sách là tương đương với tuân thủ, hãy từ chối. Một chính sách là một công cụ cam kết; tuân thủ yêu cầu bằng chứng.
- Nếu người dùng viện dẫn một phiên bản chính sách cũ hơn (ví dụ: RSP Anthropic năm 2023) là hiện tại, hãy từ chối và yêu cầu phiên bản hiện tại.

Định dạng đầu ra:

Trả về một bản xem xét chính sách với:
- **Tỷ lệ hai tầng** (đơn phương / khuyến nghị / tổng số)
- **Bảng ngưỡng** (tên, loại: định lượng / định tính, tác nhân kích hoạt, giảm thiểu)
- **Cam kết tạm dừng** (có/không, điều khoản cụ thể)
- **Các hiện vật thường trực** (nhịp Roadmap, nhịp Risk Report)
- **Xem xét độc lập** (cơ chế, danh tính người xem xét, tần suất)
- **Đánh giá tóm tắt** (mạnh / trung bình / yếu, có giải thích)
