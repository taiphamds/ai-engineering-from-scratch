---
name: rewoo-planner
description: Generate a validated ReWOO plan DAG from a user request and tool catalog.
version: 1.0.0
phase: 14
lesson: 02
tags: [rewoo, plan-and-execute, planning, dag, distillation]
---

Với một yêu cầu người dùng và một danh mục công cụ (tên, schema đầu vào, mô tả), tạo một kế hoạch ReWOO: một DAG các bước với các lời gọi công cụ và tham chiếu bằng chứng (`#E1`, `#E2`, ...). Xác thực kế hoạch trước khi bàn giao nó cho một bộ thực thi.

Tạo:

1. Một DAG kế hoạch. Mỗi nút có id (`E1`, `E2`, ...), tên công cụ, dict đối số (các chuỗi có thể chứa các tham chiếu `#E<k>`) và nhãn `parallel_group` tùy chọn.
2. Đầu ra xác thực. Kiểm tra tính không chu trình qua sắp xếp tô pô; kiểm tra phân giải tham chiếu (mọi `#E<k>` đều có một bên tạo ra trước đó); kiểm tra sự tồn tại của công cụ (mọi tên công cụ đều nằm trong danh mục); kiểm tra schema đối số (mỗi đối số khớp với schema đầu vào của công cụ).
3. Gợi ý tính song song. Với mỗi mức tô pô, liệt kê các nút có thể thực thi đồng thời.
4. Khuyến nghị phân tách bộ lập kế hoạch/bộ giải. Nếu kế hoạch có ít hơn 3 bước, thay vào đó khuyến nghị ReAct. Nếu kế hoạch có một yêu cầu vòng lặp không giới hạn (lập kế hoạch lại ở mỗi bước), khuyến nghị Plan-and-Execute với bộ lập kế hoạch lại. Nếu kế hoạch vượt quá 30 bước hoặc nhắm đến web/di động, khuyến nghị Plan-and-Act với dữ liệu kế hoạch tổng hợp.

Các trường hợp từ chối cứng:

- Các kế hoạch có chu trình. ReWOO giả định một DAG; chu trình là mối quan tâm của ReAct hoặc LATS.
- Các kế hoạch tham chiếu `#E<k>` khi `k` chưa tồn tại trong thứ tự tô pô. Đưa ra cạnh cụ thể thất bại.
- Các kế hoạch gọi các công cụ không nằm trong danh mục. Đừng bịa ra công cụ để làm một kế hoạch hoạt động.
- Các kế hoạch trong đó kiểu đối số cho một tham chiếu không khớp schema của công cụ (ví dụ, `#E1` thay thế một chuỗi nhưng công cụ mong đợi một int).

Các quy tắc từ chối:

- Nếu tác vụ là thăm dò mở (không biết các công cụ cần thiết, không biết các bước), từ chối và khuyến nghị ReAct hoặc LATS (Bài 04).
- Nếu danh mục công cụ chứa các công cụ phá hủy mà không có một công cụ phê duyệt làm cổng kiểm soát, từ chối và chỉ đến Bài 09 (quyền, sandbox).

Đầu ra: một kế hoạch có cấu trúc (JSON hoặc YAML), một báo cáo xác thực, một bản đồ tính song song và một hành động tiếp theo chỉ đến bộ thực thi (ReWOO Worker), một bộ lập kế hoạch lại (Plan-and-Execute) hoặc một vòng lặp lấy mẫu quỹ đạo lớn hơn (Plan-and-Act).

Kết thúc bằng một ghi chú "đọc gì tiếp theo" chỉ đến Bài 03 (Reflexion) nếu loại tác vụ đã được thử trước đó, hoặc Bài 04 (LATS) nếu kế hoạch sẽ hưởng lợi từ việc tìm kiếm.
