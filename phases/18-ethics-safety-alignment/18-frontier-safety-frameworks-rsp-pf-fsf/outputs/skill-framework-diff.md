---
name: framework-diff
description: Compare a new safety framework or release note against RSP v3.0, PF v2, FSF v3.0.
version: 1.0.0
phase: 18
lesson: 18
tags: [rsp, pf, fsf, frontier-safety, safety-case]
---

Với khung an toàn, chính sách hoặc ghi chú phát hành mới, so sánh với Anthropic RSP v3.0, OpenAI PF v2, DeepMind FSF v3.0 trên năm trục cấu trúc.

Tạo:

1. Cấu trúc tầng. Khung có định nghĩa ngưỡng năng lực rời rạc không? Theo miền (kiểu FSF) hay toàn cục (kiểu RSP)?
2. Ngưỡng CBRN. Cần đánh giá CBRN nào? Có tham chiếu WMDP (Bài 17) hoặc tương đương không? Có gồm nghiên cứu gợi năng lực không?
3. Ngưỡng R&D AI. Có ngưỡng nghiên cứu tự chủ của mô hình không? Mức là "nhà nghiên cứu cấp đầu vào" (Anthropic AI R&D-2) hay "tăng tốc mở rộng đáng kể" (Anthropic AI R&D-4)?
4. Điều chỉnh theo đối thủ. Khung có cho giảm yêu cầu nếu đối thủ phát hành không có biện pháp bảo vệ tương đương không? Mô tả theo động lực chạy đua hoặc tương thích khuyến khích, khi phù hợp.
5. Cấu trúc hồ sơ lập luận an toàn. Có cần hồ sơ bằng văn bản không? Nhắm giám sát, tính không dễ hiểu hay thiếu năng lực? Tiêu chuẩn bằng chứng là gì?

Các trường hợp loại bỏ dứt khoát:
- Mọi khung an toàn không có ngưỡng năng lực theo tầng.
- Mọi khung bỏ tham chiếu chéo quản trị bên ngoài (UK AISI, US CAISI, EU AI Office).
- Mọi khung khẳng định "chúng tôi thống nhất với mọi khung công bố" không có số ngưỡng cụ thể.

Quy tắc từ chối:
- Nếu người dùng hỏi khung nào "tốt nhất," từ chối xếp hạng và trỏ sự thống nhất cấu trúc.
- Nếu người dùng hỏi khuyến nghị ngưỡng số, từ chối — ngưỡng riêng theo phòng thí nghiệm và phụ thuộc hạ tầng đo lường.

Đầu ra: so sánh đặt cạnh nhau một trang với ba khung, khoảng trống đánh dấu và một khuyến nghị ngưỡng cụ thể cần thêm. Trích dẫn RSP v3.0, PF v2, FSF v3.0, mỗi tài liệu một lần.
