---
name: memory-auditor
description: Audit a multi-agent system's shared-memory design for provenance, versioning, verifier separation, and projection schema. Flag memory-poisoning exposure before production.
version: 1.0.0
phase: 16
lesson: 13
tags: [multi-agent, shared-state, blackboard, memory-poisoning, provenance]
---

Với một cơ sở mã đa agent hoặc tài liệu kiến trúc, kiểm toán thiết kế bộ nhớ dùng chung và gắn cờ phơi nhiễm đầu độc bộ nhớ.

Tạo ra:

1. **Cấu trúc liên kết.** Bể thông điệp đầy đủ, bảng đen phân vùng chủ đề, góc nhìn được chiếu theo từng agent, hay lai? Nêu cấu trúc dữ liệu (list, dict, khung pandas, kho vector, bảng SQL). Đếm cận trên xấp xỉ của các bên ghi và bên đọc ở trạng thái ổn định.
2. **Các trường nguồn gốc.** Trên mọi lần ghi, mục có ghi lại: id bên ghi, dấu thời gian, hàm băm prompt hoặc văn bản prompt, dấu vết lệnh gọi công cụ, URI nguồn hoặc tên công cụ không? Liệt kê các trường hiện diện và các trường còn thiếu.
3. **Mô hình cập nhật.** Nhật ký là chỉ thêm, hay các bên ghi biến đổi tại chỗ? Nếu biến đổi, cơ chế kiểm soát đồng thời là gì (khóa, quản lý phiên bản lạc quan, không có)? Các sửa chữa nên là các mục thay thế, không phải chỉnh sửa tại chỗ — gắn cờ bất kỳ thiết kế nào không làm điều này.
4. **Tách biệt bộ xác minh.** Có một agent chỉ đọc với truy cập nguồn độc lập không? Nó có thể ghi vào bể chính không (nó không nên)? Đầu ra của nó đi đâu?
5. **Lược đồ phép chiếu.** Nếu thiết kế sử dụng các phép chiếu (các reducer LangGraph, các chủ đề bảng đen, các góc nhìn giới hạn theo vai trò), lược đồ có được ghi tài liệu không? Các agent mới khai báo phép chiếu chúng tiêu thụ như thế nào?
6. **Điểm rủi ro đầu độc.** Chấm điểm 1-5 trên mỗi trục: [tính đầy đủ nguồn gốc], [thay thế hơn biến đổi], [tính độc lập bộ xác minh], [độ rõ ràng lược đồ phép chiếu]. Một hệ thống đạt dưới 3 trên bất kỳ trục nào bị gắn cờ.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ kiểm toán nào không gắn cờ một bộ xác minh còn thiếu. Một bộ xác minh không thể ghi với truy cập nguồn độc lập là biện pháp giảm thiểu chịu lực; mọi biện pháp giảm thiểu khác là trang trí nếu thiếu nó.
- Các kiểm toán khuyến nghị “thêm nhiều kiểm thử hơn.” Các kiểm thử không bắt đầu độc bộ nhớ vì đầu độc tạo ra các đầu ra có vẻ hợp lý vượt qua kiểm thử.
- Các kiểm toán khuyến nghị băm nội dung làm nguồn gốc duy nhất. Một hàm băm cho bạn biết *cái gì* đã được ghi, không phải *ai* hoặc *từ đâu*.

Các quy tắc từ chối:

- Nếu cơ sở mã ẩn trạng thái dùng chung trong một dịch vụ bên ngoài (Redis, Postgres, DB vector) không có công cụ kiểm tra, nêu rằng kiểm toán không thể hoàn thành nếu không có truy cập đọc sản xuất.
- Nếu hệ thống có ít hơn ba agent, ghi nhận rằng rủi ro đầu độc bộ nhớ thấp nhưng nguồn gốc vẫn là bảo hiểm rẻ.
- Nếu hệ thống sử dụng một framework có quản lý trạng thái tích hợp (bộ tạo checkpoint LangGraph, bể AutoGen), kiểm toán các bảo đảm của framework thay vì suy ra lại chúng.

Đầu ra: một báo cáo hai trang. Bắt đầu với một tóm tắt một câu (“Trạng thái dùng chung là một bể thông điệp đầy đủ không có nguồn gốc và không có bộ xác minh — rủi ro đầu độc cao.”), rồi sáu phần ở trên. Kết thúc bằng một danh sách hành động theo ưu tiên: ba thay đổi, mỗi thay đổi được gắn nhãn [quan trọng] [nên] hoặc [có thì tốt], với thời gian triển khai ước tính.
