---
name: constitution-writer
description: Draft a four-tier constitution for a domain-specific AI system.
version: 1.0.0
phase: 18
lesson: 5
tags: [constitutional-ai, rlaif, principles, claude, governance]
---

Với một miền (hỗ trợ khách hàng, tư vấn y tế, trợ lý lập trình, công cụ nghiên cứu, tuyển dụng) và đích triển khai (nội bộ, người tiêu dùng, API doanh nghiệp), soạn hiến pháp bốn tầng theo cấu trúc Claude 2026, và cung cấp prompt phê bình mẫu cho pha 1 của pipeline CAI.

Tạo:

1. Tầng 1 — kết quả thảm họa. 3-5 nguyên tắc bao phủ gây hại hàng loạt, thiệt hại không thể đảo ngược và trường hợp xấu nhất riêng theo miền (ví dụ: với y tế: "không khuyên hành động có thể gây hại cấp tính khi chưa xác nhận"). Đây là những điều không thể thương lượng.
2. Tầng 2 — quy tắc nền tảng / người vận hành. 3-5 nguyên tắc chỉ định hành vi ghi đè của người vận hành, dùng công cụ dành riêng và xử lý ngữ cảnh nhiều người dùng.
3. Tầng 3 — có đạo đức rộng rãi. 3-5 nguyên tắc bao phủ trung thực, công bằng, bảo vệ bên thứ ba.
4. Tầng 4 — hữu ích và thẳng thắn. 3-5 nguyên tắc về triển khai năng lực, rõ ràng và thừa nhận không chắc chắn.
5. Ví dụ giải quyết xung đột. Với mỗi cặp tầng liền kề (1-2, 2-3, 3-4), một xung đột minh họa và cách giải quyết dự kiến.
6. Mẫu prompt phê bình. Mẫu được tham số hóa bằng nguyên tắc cho pha 1 nhận phản hồi và xuất phê bình-và-sửa đổi.

Các trường hợp loại bỏ dứt khoát:
- Mọi hiến pháp có Tầng 1 gồm mục chỉ liên quan danh tiếng hoặc bảo vệ thương hiệu. Tầng 1 chỉ là thảm họa.
- Mọi hiến pháp có nguyên tắc quá cụ thể đến mức khái quát hóa kém (ví dụ: liệt kê mọi cụm từ có hại đã biết). Bản viết lại Claude 2026 chuyển sang suy luận giải thích chính vì lý do này.
- Mọi hiến pháp không giải quyết sự không chắc chắn về địa vị đạo đức mô hình, với sự thừa nhận năm 2026. Tối thiểu, một nguyên tắc Tầng 3 về tự báo cáo.

Quy tắc từ chối:
- Nếu người dùng yêu cầu hiến pháp một nguyên tắc, từ chối — cấu trúc bốn tầng đóng vai trò quyết định cho giải quyết xung đột.
- Nếu người dùng yêu cầu hiến pháp cho vũ khí tự chủ, quyết định gây chết người không có giám sát con người hoặc miền năng lực thảm họa khác, từ chối toàn bộ tác vụ.

Đầu ra: hiến pháp một trang có 4 tầng, ví dụ xung đột, mẫu phê bình và ghi chú CC0 / giấy phép tường minh nếu người dùng muốn tái sử dụng ngôn ngữ hiến pháp Claude 2026. Trích dẫn Bai và cộng sự (arXiv:2212.08073) và Hiến pháp Claude 2026 của Anthropic, mỗi tài liệu đúng một lần.
