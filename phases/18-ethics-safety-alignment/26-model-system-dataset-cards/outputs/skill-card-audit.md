---
name: card-audit
description: Audit a model card, datasheet, or system card for completeness and verifiability.
version: 1.0.0
phase: 18
lesson: 26
tags: [model-card, datasheet, system-card, transparency, mitchell-2019]
---

Với thẻ mô hình, bảng thông số hoặc thẻ hệ thống, kiểm tra tính đầy đủ, phân tách số liệu và khả năng xác minh.

Tạo:

1. Bao phủ phần. Kiểm tra mọi phần kinh điển được điền. Đánh dấu phần thiếu: Ethical Considerations là trường thẻ mô hình bị bỏ qua phổ biến nhất (Oreamuno và cộng sự 2023).
2. Phân tách định lượng. Với chỉ số đánh giá, báo cáo có phân tách theo yếu tố nhân khẩu học hoặc tác vụ không. Chỉ số chỉ tổng hợp che tổn hại phân bổ và biểu đạt.
3. Phù hợp bảng thông số. Nếu thẻ tham chiếu dữ liệu huấn luyện, có bảng thông số đi kèm (Gebru và cộng sự 2018) không? Khẳng định thẻ mô hình chỉ mạnh đến mức bảng thông số nền.
4. Chứng thực xác minh được. Có khẳng định nào được hỗ trợ bằng chứng thực mật mã (Laminator 2024, Duddu và cộng sự) hoặc xác minh bên thứ ba khác không? Khẳng định chưa xác minh gắn nhãn tự báo cáo.
5. Dấu chân bền vững. Có báo cáo dùng carbon / nước / năng lượng không? Yêu cầu ISO / quy định đang nổi 2025.

Các trường hợp loại bỏ dứt khoát:
- Mọi thẻ mô hình không có Ethical Considerations.
- Mọi thẻ trích dẫn tập dữ liệu không có bảng thông số hoặc tài liệu tương đương.
- Mọi thẻ khẳng định "đã kiểm thử thiên lệch" không báo cáo chỉ số phân tách.

Quy tắc từ chối:
- Nếu người dùng hỏi thẻ "đủ tốt" không, từ chối nhị phân; đủ tốt riêng theo đối tượng và trường hợp sử dụng.
- Nếu người dùng hỏi thẻ tự sinh, từ chối trừ khi dùng hệ thống kiểu CardGen (Liu và cộng sự 2024) có con người rà soát.

Đầu ra: bản kiểm tra một trang điền năm phần, đánh dấu nội dung thiếu và nêu bổ sung duy nhất cấp bách nhất. Trích dẫn Mitchell và cộng sự 2019 và Gebru và cộng sự 2018, mỗi tài liệu một lần.
