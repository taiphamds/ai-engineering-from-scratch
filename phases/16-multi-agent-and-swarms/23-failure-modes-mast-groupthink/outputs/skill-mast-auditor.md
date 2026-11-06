---
name: mast-auditor
description: Run a MAST-style failure-mode audit on a multi-agent system. Categorize execution-trace failures into Specification / Coordination / Verification and the Groupthink families; rank mitigations by expected failure reduction.
version: 1.0.0
phase: 16
lesson: 23
tags: [multi-agent, failure-modes, MAST, groupthink, circuit-breaker, audit]
---

Với một hệ thống đa agent và các dấu vết thực thi được lấy mẫu, chạy một kiểm toán chế độ lỗi.

Tạo ra:

1. **Xây dựng mẫu.** Ít nhất 200 dấu vết từ sản xuất, được lấy mẫu đồng đều trên các loại tác vụ và cửa sổ thời gian. Ghi tài liệu phương pháp lấy mẫu và các rủi ro thiên lệch.
2. **Lượt phân loại.** Với mỗi dấu vết, đánh dấu `success | failure`. Với các thất bại, gán một danh mục MAST (đặc tả / phối hợp / xác minh) và, khi áp dụng, một hoặc nhiều thẻ họ Tư duy nhóm (đơn văn hóa / thuận theo / tom / động cơ hỗn hợp / dây chuyền).
3. **Bảng phân phối.** Các số đếm và tỷ lệ phần trăm theo danh mục MAST và thẻ Tư duy nhóm. So sánh với phân phối tham chiếu của Cemri 2025 (41.77 / 36.94 / 21.30). Các hệ thống lệch mạnh khỏi tham chiếu thường có một lớp yếu cụ thể.
4. **Các mẫu lỗi hàng đầu.** Xác định 3 mẫu cụ thể thường gặp nhất (ví dụ: “hai agent đều xem xét”). Ghi tài liệu các bước tái tạo.
5. **Xếp hạng giảm thiểu.** Với mỗi mẫu hàng đầu, đề xuất một biện pháp giảm thiểu từ thư viện tiêu chuẩn: các hợp đồng vai trò tường minh, trạng thái dùng chung có phiên bản, bộ xác minh độc lập, bộ ngắt mạch, bộ ba phát hiện-chẩn đoán-xác thực (STRATUS). Xếp hạng theo giảm thất bại dự kiến theo tần suất của mẫu.
6. **Rủi ro các thất bại âm thầm.** Bao nhiêu thất bại tạo ra các đầu ra có vẻ hợp lý nhưng sai so với các lỗi ồn ào? Tỷ lệ âm thầm thúc đẩy đầu tư lớp xác minh.
7. **Các chỉ báo thay thế lỗi chậm.** Đề xuất 2-3 chỉ số trực tiếp sẽ bộc lộ sự trôi trước khi nó thành một lỗi ồn ào: tỷ lệ đồng ý, tỷ lệ thử lại, phân phối độ dài đầu ra, khoảng cách chỉnh sửa giữa các agent.

Các trường hợp loại bỏ dứt khoát:

- Các kiểm toán không có một mẫu ngẫu nhiên hoặc phân tầng. Các thất bại được chọn tay đại diện quá mức các trường hợp kịch tính và bỏ sót sự trôi lỗi chậm.
- Các khuyến nghị giảm thiểu không có một phép đo đường cơ sở. “Thêm một bộ xác minh” không có nghĩa gì trừ khi tỷ lệ thất bại hiện tại đã biết.
- Bỏ qua các sự cố MAST chưa biết. Nếu một dấu vết không phù hợp một danh mục, hệ phân loại không đầy đủ; đề xuất một mở rộng thay vì ép một danh mục.
- Tuyên bố một kiểm toán hằng quý là đủ mà không có giám sát lỗi chậm vận hành. Hằng quý bỏ lỡ sự trôi giữa các kiểm toán.

Các quy tắc từ chối:

- Nếu các dấu vết thiếu quy nguồn theo từng agent (ai viết gì, ai đọc gì), kiểm toán không thể phân biệt các lỗi phối hợp với các xung đột vai trò. Đề xuất thêm ghi nhật ký theo từng agent có cấu trúc trước khi kiểm toán lại.
- Nếu hệ thống có tổng cộng ít hơn 50 dấu vết thất bại, mẫu quá nhỏ để tạo các ước tính phân phối. Đề xuất cửa sổ quan sát dài hơn.
- Nếu các dấu vết chứa PII, che trước phân tích.

Đầu ra: một báo cáo ba trang. Bắt đầu với một tóm tắt một câu (“41% lỗi đặc tả, 12% phối hợp, 39% khoảng trống xác minh, 8% chưa biết; mẫu hàng đầu là xung đột hai người xem xét; biện pháp giảm thiểu ROI cao nhất là các hợp đồng vai trò tường minh.”), rồi bảy phần ở trên. Kết thúc bằng một danh sách hành động theo ưu tiên: ba biện pháp giảm thiểu với chi phí triển khai ước tính và mức giảm tỷ lệ thất bại dự kiến.
