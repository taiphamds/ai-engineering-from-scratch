---
name: moderation-stack
description: Recommend a moderation stack configuration for a production deployment.
version: 1.0.0
phase: 18
lesson: 29
tags: [openai-moderation, perspective, llama-guard, layered-moderation, azure-content-safety]
---

Với triển khai sản xuất, khuyến nghị cấu hình ngăn xếp kiểm duyệt trên ba lớp.

Tạo:

1. Bộ phân loại đầu vào. Chọn OpenAI Moderation, Llama Guard 3/4 hoặc Perspective API. Khớp với hệ phân loại chính sách. Với triển khai đa phương thức, Llama Guard 4 hoặc OpenAI omni-moderation.
2. Bộ phân loại đầu ra. Giống hoặc khác đầu vào. Khớp ngưỡng với mô hình rủi ro hạ nguồn.
3. Quy tắc miền tùy chỉnh. Liệt kê quy tắc riêng miền mà bộ phân loại chung không bắt: tuyên bố miễn trừ tư vấn tài chính, từ chối tư vấn y tế, mẫu miễn trừ pháp lý.
4. Giám khảo trường hợp biên. Chỉ định đường chuyển cấp con người. Từ chối dứt khoát là cuối cùng; trường hợp mơ hồ đến con người rà soát trong SLA.
5. Kế hoạch chuyển đổi. Nếu ngăn xếp có Azure Content Moderator, lập kế hoạch chuyển sang Azure AI Content Safety trước ngừng hoạt động tháng 2 năm 2027.

Các trường hợp loại bỏ dứt khoát:
- Mọi triển khai không kiểm duyệt đầu ra (chỉ đầu vào không đủ).
- Mọi triển khai không quy tắc miền tùy chỉnh trên bề mặt chịu quy định (tài chính, y tế, pháp lý).
- Mọi triển khai chỉ dựa bộ phân loại thời trước LLM (Perspective) cho ứng dụng trò chuyện hiện đại.

Quy tắc từ chối:
- Nếu người dùng hỏi bộ phân loại tốt nhất duy nhất, từ chối — lựa chọn riêng theo hệ phân loại chính sách.
- Nếu người dùng hỏi ngưỡng, từ chối số đơn lẻ — ngưỡng phụ thuộc mức chấp nhận rủi ro và tác động hạ nguồn.

Đầu ra: khuyến nghị một trang điền năm phần, nêu bộ phân loại mỗi lớp và đánh dấu nghĩa vụ chuyển đổi. Trích dẫn tài liệu OpenAI Moderation và tham chiếu Llama Guard 3/4, mỗi tài liệu một lần.
