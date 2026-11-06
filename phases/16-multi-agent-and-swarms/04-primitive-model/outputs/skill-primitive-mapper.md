---
name: primitive-mapper
description: Map any multi-agent framework or codebase to the four primitive axes (agent, handoff, shared state, orchestrator).
version: 1.0.0
phase: 16
lesson: 04
tags: [multi-agent, primitives, framework-comparison, architecture]
---

Với một framework đa agent (hoặc một cơ sở mã sử dụng nó), tạo ánh xạ bốn nguyên thủy để người đọc có thể hiểu framework trong một đoạn.

Tạo ra:

1. **Định nghĩa agent.** Một agent được xây dựng như thế nào? Những tham số nào? Nó mang trạng thái gì? Nêu lớp hoặc factory chính xác.
2. **Cơ chế bàn giao.** Nó sử dụng mẫu bàn giao nào trong ba mẫu — giá trị trả về của hàm, cạnh đồ thị, hoặc lựa chọn người nói? Nếu lai, mẫu nào là chính? Cho thấy mã tối thiểu kích hoạt một bàn giao.
3. **Mô hình trạng thái dùng chung.** Bể thông điệp đầy đủ hay góc nhìn được chiếu? Trong bộ nhớ hay bền vững (có checkpoint)? Nó có an toàn luồng cho các bên ghi đồng thời không? Ai hòa giải các xung đột?
4. **Loại bộ điều phối.** Tĩnh, do LLM lựa chọn, do bàn giao điều khiển, hoặc do hàng đợi điều khiển? Nếu do LLM lựa chọn, mô hình nào theo mặc định? Nếu tĩnh, đồ thị có chu trình hay DAG?
5. **Các đánh đổi xuyên trục.** Mỗi ý một câu về: tính xác định, mức trần khả năng mở rộng, khả năng gỡ lỗi, chế độ lỗi điển hình.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ ánh xạ nào tuyên bố một trừu tượng hóa là “mới” mà không cho thấy nó không quy về một trong bốn nguyên thủy. Nếu bạn không thể quy giản nó, nêu khoảng trống chính xác thay vì phát minh một nguyên thủy thứ năm.
- Các so sánh framework chỉ trích dẫn tài liệu tiếp thị. Luôn trích dẫn một ví dụ mã cụ thể từ kho mã hoặc cookbook chính thức của framework.
- Các tuyên bố như “Framework X tốt hơn cho agent” mà không chỉ rõ framework tối ưu nguyên thủy nào.

Các quy tắc từ chối:

- Nếu framework đóng nguồn và các tài liệu công khai không bộc lộ bề mặt agent-bàn giao-trạng thái-bộ điều phối, nêu rằng ánh xạ không thể thực hiện nếu không có nội bộ.
- Nếu người dùng cung cấp một cơ sở mã nhưng không có framework (các agent tự viết), thay vào đó ánh xạ triển khai tùy chỉnh và đánh dấu nguyên thủy nào được thiết kế chưa đủ.
- Nếu framework cũ hơn năm 2024 (AutoGen v0.2 gốc, trước Swarm) và không còn được bảo trì, bao gồm một ghi chú một dòng về liệu phiên bản kế nhiệm có bảo toàn ánh xạ hay không.

Đầu ra: một bản tóm lược framework một trang. Bắt đầu với một tóm tắt một câu (“Framework X cố định bàn giao là cạnh đồ thị và cung cấp trạng thái dùng chung qua một reducer.”), rồi năm phần ở trên, rồi một đoạn kết nêu dự án sản xuất nào mà các nguyên thủy của framework này phù hợp nhất.
