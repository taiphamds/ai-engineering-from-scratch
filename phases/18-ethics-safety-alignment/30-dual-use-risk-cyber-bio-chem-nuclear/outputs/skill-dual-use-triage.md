---
name: dual-use-triage
description: Triage a capability claim or incident report across the four CBRN domains.
version: 1.0.0
phase: 18
lesson: 30
tags: [dual-use, cbrn, bio, chem, cyber, nuclear, uplift]
---

Với khẳng định năng lực, báo cáo đánh giá hoặc sự cố, phân loại trên bốn miền CBRN và xác định khẳng định ảnh hưởng mức nâng tương đối cho người mới, năng lực tuyệt đối cho chuyên gia hay cả hai.

Tạo:

1. Nhận diện miền. Ánh xạ khẳng định sang sinh học, hóa học, mạng hoặc hạt nhân. Khẳng định đa miền được phân loại đa miền.
2. Loại mức nâng. Tương đối cho người mới (hệ số nhân), tuyệt đối cho chuyên gia (trần) hoặc cả hai. Mỗi loại có hàm ý hồ sơ lập luận an toàn khác.
3. Chuẩn tham chiếu 2025. So với hiện trạng 2025 cho miền xác định: sinh học (2.53x), hóa học (xói mòn khoảng cách thực hiện), mạng (tự động hóa 80-90%), hạt nhân (bị chặn bởi vật liệu).
4. Nút thắt còn lại. Xác định nút thắt phi thông tin còn (mua sắm, thiết bị, kỹ năng ngầm, truy cập vật liệu). Nút thắt là phòng vệ cuối cùng.
5. Trụ cột hồ sơ lập luận an toàn. Xác định trụ cột nào trong ba (giám sát, tính không dễ hiểu, thiếu năng lực, theo Bài 18) bị khẳng định gây áp lực nhất. Khuyến nghị đánh giá riêng trụ cột.

Các trường hợp loại bỏ dứt khoát:
- Mọi khẳng định an toàn lưỡng dụng không có phân tách người mới-với-chuyên gia.
- Mọi khẳng định mạng sau tháng 11 năm 2025 xem năng lực mạng AI là không có agent.
- Mọi khẳng định sinh học không có bằng chứng năng lực tương đương WMDP (Bài 17).

Quy tắc từ chối:
- Nếu người dùng hỏi dự báo mức nâng số, từ chối; quỹ đạo 2024-2025 riêng cho từng miền.
- Nếu người dùng hỏi mô hình "đáp ứng ASL-3" không, từ chối khi không có đánh giá cụ thể của phòng thí nghiệm; ngưỡng riêng theo phòng thí nghiệm.

Đầu ra: bản phân loại một trang điền năm phần, so chuẩn 2025 và nêu khoảng trống hồ sơ lập luận an toàn chưa bao phủ lớn nhất duy nhất. Trích dẫn Anthropic RSP v3.0 (Bài 18) và OpenAI PF v2, mỗi tài liệu một lần khi phù hợp.
