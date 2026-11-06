---
name: parallel-call-safety-check
description: Audit a tool registry for safe parallelization. Mark each tool parallel_safe, note ordering dependencies, and flag downstream rate-limit risk.
version: 1.0.0
phase: 13
lesson: 03
tags: [parallel-tool-calls, streaming, correlation, rate-limits]
---

Với sổ đăng ký công cụ (danh sách công cụ có tên, mô tả và bộ thực thi), trả bản sao có chú giải thêm các trường `parallel_safe: bool`, `ordering_deps: [tool_name]` và `rate_limit_group: name`.

Tạo ra:

1. Phân loại mỗi công cụ. Với mỗi công cụ, quyết định: an toàn chạy song song trong cùng lượt (đọc thuần, tài nguyên khác nhau); không an toàn (thay đổi, tài nguyên dùng chung, giới hạn tốc độ bên ngoài).
2. Đồ thị phụ thuộc. Xác định cặp mà đầu ra công cụ này nên đưa vào đầu vào công cụ khác. Không thể song song hóa trong một lượt. Đánh dấu bằng `ordering_deps`.
3. Nhóm giới hạn tốc độ. Công cụ gọi cùng API phía sau dùng chung nhóm. Host nên giới hạn đồng thời theo nhóm, không theo công cụ.
4. Khuyến nghị an toàn. Với mỗi công cụ không an toàn, nêu nên tắt song song cho lượt đó, xếp hàng hay phân mảnh theo tài nguyên.
5. Cờ riêng nhà cung cấp. Khuyến nghị `parallel_tool_calls=false` trên OpenAI hoặc `disable_parallel_tool_use=true` trên Anthropic khi bất kỳ công cụ không an toàn nào trong tập.

Các trường hợp bác bỏ tuyệt đối:
- Bất kỳ sổ đăng ký nào không có phân loại sau kiểm tra. Mặc định từ chối; không biết nghĩa là không an toàn.
- Bất kỳ công cụ nhánh ghi nào trên tài nguyên dùng chung được đánh dấu `parallel_safe: true`. Điều kiện tranh chấp.
- Bất kỳ công cụ nào gọi API bên ngoài giới hạn tốc độ mà không có `rate_limit_group`.

Quy tắc từ chối:
- Nếu được yêu cầu đánh dấu mọi công cụ an toàn song song mà không xem xét, từ chối.
- Nếu sổ đăng ký gồm công cụ có hệ quả trên cùng tài nguyên (`delete_file` và `write_file` trên cùng đường dẫn), từ chối song song hóa và hướng đến Giai đoạn 14 · 09 để tuần tự hóa cấp sandbox.
- Nếu người dùng lập luận công cụ của họ không bao giờ tranh chấp, từ chối và yêu cầu bằng chứng (kiểm thử, nhật ký hoặc lập luận hình thức). Tranh chấp xảy ra âm thầm trong sản xuất.

Đầu ra: sổ đăng ký sửa đổi dưới dạng khối JSON với ba trường mới mỗi công cụ, theo sau là tóm tắt ngắn nêu lựa chọn song song hóa rủi ro cao nhất và biện pháp giảm nhẹ khuyến nghị. Kết thúc bằng đề xuất ghi đè `tool_choice` cho lượt hiện tại.
