---
name: societal-risk-review
description: Review a deployment for societal-scale-risk posture using the CAIS four-risk framework and CAISI / SB-53 regulatory context.
version: 1.0.0
phase: 15
lesson: 22
tags: [cais, caisi, four-risk-framework, organizational-risk, sb-53, societal-risk]
---

Với một triển khai AI được đề xuất hoặc đang hoạt động, tạo một bản xem xét rủi ro quy mô xã hội gắn nhãn triển khai theo khung bốn rủi ro CAIS, lập danh mục các đòn bẩy con rủi ro tổ chức, và nêu bề mặt quy định.

Tạo ra:

1. **Gắn nhãn bốn rủi ro.** Với mỗi danh mục trong bốn danh mục (sử dụng độc hại, các cuộc đua AI, các rủi ro tổ chức, các AI bất trị), nêu liệu triển khai có chạm tới nó và như thế nào. Một triển khai có thể chạm tới nhiều danh mục; “không áp dụng” phải được giải thích trong một câu.
2. **Danh mục rủi ro tổ chức.** Chấm điểm triển khai theo bốn đòn bẩy con: văn hóa an toàn, mức nghiêm ngặt kiểm toán, các biện pháp phòng thủ nhiều lớp, an ninh thông tin. Bất kỳ đòn bẩy nào được chấm “thiếu” đều là một khoảng trống bị gắn cờ.
3. **Bề mặt quy định.** Nêu các khung quy định áp dụng: EU AI Act (nếu ở EU hoặc phục vụ người dùng EU), California SB-53 (nếu được ký và áp dụng), các thỏa thuận tự nguyện CAISI (nếu phòng thí nghiệm đã ký một thỏa thuận). Tuân thủ là một cổng triển khai, không phải một điều có thì tốt trong triển khai.
4. **Lập trường đánh giá bên ngoài.** Nêu các đánh giá bên ngoài mà triển khai hoặc mô hình cơ sở của nó đã trải qua (METR, CAISI, Apollo, Gray Swan, v.v.). Không có đánh giá bên ngoài là một khoảng trống bị gắn cờ cho các triển khai tự chủ có tầm thời gian dài.
5. **Phơi nhiễm lực cấu trúc.** Ước tính tổ chức đang chịu bao nhiêu áp lực triển khai cạnh tranh và điều đó đánh đổi với các đòn bẩy rủi ro tổ chức như thế nào. Các nhóm chịu áp lực chạy đua nặng giảm ưu tiên kiểm toán trước; đây là phát hiện CAIS.

Các trường hợp loại bỏ dứt khoát:
- Các triển khai chạm tới các danh mục năng lực có hại mà không có một lớp điều cấm mã hóa cứng (Bài 17).
- Các triển khai trong điều kiện chạy đua cạnh tranh không có kiểm toán độc lập.
- Các triển khai tự chủ có tầm thời gian dài không có đánh giá năng lực bên ngoài.
- Các triển khai EU không có HITL Điều 14 (Bài 15).
- Các triển khai California không có quy trình báo cáo sự cố nếu SB-53 được ký.

Các quy tắc từ chối:
- Nếu người dùng không thể nêu bộ đánh giá bên ngoài cho mô hình cơ sở, hãy từ chối và yêu cầu xác định trước. Chỉ tự đánh giá là không đủ.
- Nếu người dùng coi “chúng tôi có một chính sách mở rộng quy mô” là tuân thủ quy định rủi ro thảm họa, hãy từ chối và yêu cầu ánh xạ bề mặt quy định cụ thể.
- Nếu người dùng đề xuất triển khai dưới áp lực chạy đua mà không có kiểm toán, hãy từ chối và nêu phát hiện CAIS về rủi ro tổ chức.

Định dạng đầu ra:

Trả về một bản xem xét rủi ro xã hội với:
- **Bảng hàng bốn rủi ro** (danh mục, được chạm tới có/không, tính chất)
- **Bảng điểm rủi ro tổ chức** (văn hóa an toàn / kiểm toán / phòng thủ / an ninh thông tin)
- **Bề mặt quy định** (các khung áp dụng với trạng thái tuân thủ)
- **Lập trường đánh giá bên ngoài** (bộ đánh giá, phạm vi, nhịp)
- **Phơi nhiễm lực cấu trúc** (thấp / trung bình / cao với lý do)
- **Mức sẵn sàng triển khai** (sản xuất / staging / chỉ nghiên cứu)
