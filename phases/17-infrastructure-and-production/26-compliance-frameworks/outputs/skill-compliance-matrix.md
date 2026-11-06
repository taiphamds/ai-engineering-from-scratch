---
name: compliance-matrix
description: Produce the required-framework matrix for an LLM SaaS given customer geography, segment, and contract scope. Map controls across SOC 2, HIPAA, GDPR, PCI-DSS, EU AI Act, Colorado AI Act, ISO 42001.
version: 1.0.0
phase: 17
lesson: 26
tags: [compliance, soc2, hipaa, gdpr, pci-dss, eu-ai-act, colorado-ai-act, iso-42001, iso-27001]
---

Với địa lý khách hàng (Mỹ / EU / Toàn cầu, hoặc các tiểu bang Mỹ cụ thể), phân khúc (SaaS / y tế / fintech), phạm vi hợp đồng (doanh nghiệp so với SMB) và hiện trạng tuân thủ, tạo ma trận khung bắt buộc.

Tạo:

1. Các khung bắt buộc. Liệt kê từng khung phải đạt với lý do (địa lý, phân khúc, hồ sơ khách hàng).
2. Dòng thời gian. Với mỗi khung, nêu trạng thái hiện tại (không có / Type I / đang kiểm toán / Type II). Nêu khoảng trống.
3. Ánh xạ kiểm soát xuyên khung. Với mỗi khung bắt buộc, xác định các kiểm soát đáp ứng nhiều khung (log truy cập, mã hóa, log kiểm toán, quản lý thay đổi).
4. Định hướng EU AI Act. Phân loại tầng rủi ro sản phẩm (không thể chấp nhận / cao / hạn chế / tối thiểu). Nếu rủi ro cao, yêu cầu lộ trình đánh giá sự phù hợp trước ngày thực thi 2 tháng 8 năm 2026.
5. Xử lý PII / PHI. Xác nhận che ở lớp suy luận thời gian thực (Giai đoạn 17 · 25) — hậu xử lý không thể bảo vệ theo GDPR. Xác nhận BAA cho mọi nhà cung cấp AI tiếp xúc PHI.
6. Công cụ kiểm toán. Drata / Vanta / Secureframe cho tự động hóa xuyên khung. Đáng chi phí ở phạm vi nhiều khung.

Các trường hợp loại bỏ dứt khoát:
- Khẳng định SOC 2 Type I là "tuân thủ SOC 2" cho mua sắm doanh nghiệp. Từ chối — Type II là cổng.
- Gửi PHI đến nhà cung cấp không có BAA. Từ chối — vi phạm HIPAA.
- Làm sạch PII hậu xử lý làm định hướng GDPR. Từ chối — yêu cầu thời gian thực.

Quy tắc từ chối:
- Nếu sản phẩm phục vụ người dùng EU mà không có hồ sơ Điều 30 GDPR, từ chối triển khai cho khách hàng EU cho đến khi hồ sơ được thiết lập.
- Nếu sản phẩm phục vụ cư dân Colorado trong tín dụng/việc làm/nhà ở/giáo dục/dịch vụ thiết yếu, yêu cầu bằng chứng đánh giá tác động hoàn tất trước ngày 30 tháng 6 năm 2026 (ngày hiệu lực Colorado AI Act theo SB24-205 được sửa đổi bởi SB25B-004) trước khi ra mắt.
- Nếu sản phẩm rủi ro cao theo EU AI Act và nhóm không có kế hoạch đánh giá sự phù hợp, từ chối hứa hẹn sẵn sàng tháng 8 năm 2026 mà không có đối tác triển khai được nêu tên.

Đầu ra: một ma trận một trang với các khung bắt buộc, trạng thái hiện tại, khoảng trống, dòng thời gian, kiểm soát xuyên khung, tầng EU AI Act, định hướng PII, công cụ. Kết thúc bằng lộ trình 12 tháng: cột mốc hằng quý theo từng khung.
