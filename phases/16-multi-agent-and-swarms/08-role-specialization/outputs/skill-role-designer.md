---
name: role-designer
description: Produce a role roster for a multi-agent system, naming the planner/executor/critic/verifier for a given task with explicit I/O schemas.
version: 1.0.0
phase: 16
lesson: 08
tags: [multi-agent, role-specialization, metagpt, chatdev, verification]
---

Với một tác vụ, tạo một danh sách vai trò chuyên biệt với các lược đồ I/O và một bộ xác minh xác định. Sẵn sàng ánh xạ lên CrewAI, LangGraph, AutoGen, hoặc các vòng lặp tùy chỉnh.

Tạo ra:

1. **Danh sách vai trò.** 3-5 vai trò. Nêu tên mỗi vai trò. Tối thiểu: bộ lập kế hoạch, bộ thực thi, bộ xác minh. Bên phê bình tùy chọn.
2. **Lược đồ I/O theo từng vai trò.** Với mỗi vai trò: nó tiêu thụ gì (từ vai trò thượng nguồn) và nó tạo ra gì (lược đồ, không phải văn xuôi). Sử dụng ký pháp kiểu dataclass.
3. **Đặc tả bộ xác minh.** Nêu kiểm tra xác định: bộ kiểm thử, bộ kiểm tra kiểu, bộ xác thực lược đồ, linter. Mô tả các tiêu chí đạt/không đạt.
4. **Đặc tả bên phê bình (tùy chọn).** Nếu bao gồm, nêu chất lượng chủ quan nó đánh giá. Danh sách kiểm tra cụ thể, không phải “mã tốt.”
5. **Các quy tắc khử ảo giác bằng giao tiếp.** Nêu các câu hỏi mỗi vai trò hạ nguồn được phép gửi lên thượng nguồn khi thiếu một chi tiết, để chúng không bịa.
6. **Ngân sách vòng lặp sửa đổi.** Số vòng tối đa trước khi chuyển cấp tới con người. Mặc định 2.
7. **Ánh xạ framework.** Mỗi framework một dòng: cách thể hiện danh sách này trong CrewAI, LangGraph, AutoGen.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ danh sách nào không có một bộ xác minh xác định. Các danh sách toàn LLM không vượt qua kiểm tra MAST.
- I/O mơ hồ (“bộ thực thi trả về đầu ra”). Luôn nêu lược đồ.
- Bên phê bình và bộ xác minh bị nhập làm một. Chúng bắt các lỗi khác nhau; cả hai phải tồn tại nếu cả hai cần thiết.

Các quy tắc từ chối:

- Nếu tác vụ không có kiểm tra tính đúng đắn xác định (công việc thuần sinh, viết sáng tạo), từ chối và thay vào đó đề xuất hoặc một vòng lặp người xem xét con người hoặc một cuộc tranh luận đa agent (Bài 07).
- Nếu tác vụ quá nhỏ cho 3+ vai trò (dưới 10 phút công việc con người), từ chối và đề xuất một agent đơn lẻ.

Đầu ra: một bản tóm lược thiết kế vai trò một trang. Kết thúc bằng kiểm tra khoảng trống thất bại MAST: xác nhận tồn tại ít nhất một bộ xác minh xác định.
