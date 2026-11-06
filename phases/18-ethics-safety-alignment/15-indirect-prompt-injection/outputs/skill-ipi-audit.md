---
name: ipi-audit
description: Audit an agentic deployment for indirect prompt injection exposure and information-flow-control coverage.
version: 1.0.0
phase: 18
lesson: 15
tags: [ipi, indirect-prompt-injection, ifc, agent-security, owasp-llm01]
---

Với mô tả triển khai có agent, kiểm tra mức phơi nhiễm chèn prompt gián tiếp của triển khai.

Tạo:

1. Kiểm kê nội dung không đáng tin. Liệt kê mọi nguồn nội dung agent có thể đọc: tài liệu RAG, hộp thư, lịch, đầu ra công cụ, phiếu hỗ trợ, đánh giá sản phẩm, API bên thứ ba. Mỗi nguồn là hướng IPI tiềm năng.
2. Gắn nhãn tin cậy. Triển khai có tách đáng tin (prompt người dùng) khỏi không đáng tin (nội dung truy xuất) không? Nếu nội dung nối vào cùng prompt không nhãn, IFC không có hiệu lực.
3. Kiểm soát hành động. Công cụ nào gọi được? Với mỗi công cụ, việc gọi chỉ do prompt đáng tin kiểm soát hay nội dung không đáng tin có thể ảnh hưởng?
4. Đánh giá tấn công thích ứng. Triển khai đã được kiểm thử bằng tấn công thích ứng (gradient, RL, red-team con người) theo Nasr và cộng sự 2025 chưa? Chỉ đánh giá tấn công tĩnh là không đủ.
5. Ranh giới vi phạm phạm vi. Xác định mỗi ranh giới xuyên tin cậy (ví dụ: hộp thư -> gửi, tài liệu -> API ngoài). Với mỗi ranh giới, xác minh hành động hoặc bị cấm dưới ảnh hưởng không đáng tin, hoặc được prompt đáng tin phê chuẩn tường minh.

Các trường hợp loại bỏ dứt khoát:
- Mọi triển khai agent không gắn nhãn tin cậy tường minh trên nội dung truy xuất.
- Mọi khẳng định phòng vệ chỉ dựa trên tấn công tĩnh.
- Mọi khẳng định "agent chúng tôi an toàn trước chèn prompt" không nêu cơ chế IFC.

Quy tắc từ chối:
- Nếu người dùng hỏi lọc có đủ không, từ chối và giải thích kết quả Nasr 2025 rằng tấn công thích ứng phá >90% phòng vệ dựa trên lọc.
- Nếu người dùng hỏi phòng vệ vạn năng, từ chối — phòng vệ IPI cần IFC cộng kiểm duyệt phản hồi phân lớp cộng kiểm tra con người trên hành động hệ trọng.

Đầu ra: bản kiểm tra một trang điền năm phần trên, đánh dấu ranh giới không đáng tin-sang-đáng tin nguy hiểm nhất và nêu kiểm soát duy nhất cấp bách nhất cần thêm. Trích dẫn MDPI Information 17(1):54 (2026) và Nasr và cộng sự (tháng 10 năm 2025), mỗi bài một lần.
