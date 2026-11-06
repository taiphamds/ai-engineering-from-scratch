---
name: durable-execution-review
description: Review a proposed long-running agent deployment for correct durable-execution shape (activities, determinism, checkpoint backend, human-input state, HITL-on-resume).
version: 1.0.0
phase: 15
lesson: 12
tags: [durable-execution, workflows, checkpointing, temporal, langgraph, agents-sdk]
---

Với một triển khai agent chạy dài được đề xuất (Temporal + OpenAI Agents SDK, LangGraph với bộ tạo checkpoint PostgreSQL, Microsoft Agent Framework, Claude Code Routines, Cloudflare Durable Objects, hoặc một hệ thống tương đương nội bộ), kiểm toán thiết kế theo mẫu thực thi bền vững.

Tạo ra:

1. **Danh mục hoạt động.** Liệt kê mọi hoạt động (lệnh gọi LLM, lệnh gọi công cụ, yêu cầu HTTP, ghi file). Với mỗi hoạt động, xác nhận nó được bọc thành một hoạt động với chính sách thử lại, thời gian chờ, và khóa lũy đẳng. Các lệnh gọi LLM thô ngoài lớp bọc hoạt động là một lỗ hổng độ tin cậy.
2. **Tính xác định của quy trình.** Xác định mọi lần đọc không xác định bên trong mã quy trình (thời gian thực, ngẫu nhiên, trạng thái bên ngoài). Mỗi lần phải được đăng ký dưới dạng một hoạt động tác dụng phụ để phát lại trả về cùng giá trị. Tính không xác định ẩn là nguyên nhân phổ biến nhất của sự trôi khi phát lại.
3. **Backend checkpoint.** Nêu tên backend (PostgreSQL, SQLite, Redis, Durable Objects). Xác nhận nó tồn tại qua các lần triển khai. SQLite chỉ dành cho phát triển. Redis yêu cầu cấu hình AOF hoặc snapshot. Cloudflare Durable Objects trong suốt nhưng yêu cầu kỷ luật khóa duy nhất.
4. **Trạng thái đầu vào từ con người.** Xác nhận các lần tạm dừng cho HITL là trạng thái quy trình hạng nhất, không phải một vòng lặp thăm dò. Quy trình nên chặn trên một tín hiệu bên ngoài (hàng đợi phê duyệt, webhook, nguyên thủy `interrupt()`) tiếp tục đúng khi phê duyệt đến.
5. **Chính sách HITL khi tiếp tục.** Với bất kỳ lần tiếp tục nào sau sự cố, nêu liệu HITL mới có được yêu cầu trước khi thực thi hoạt động tiếp theo hay không. Không có điều này, thực thi bền vững cộng với một phê duyệt được cấp trước sự cố có thể kích hoạt lại một hành động đã được phê duyệt khi ngữ cảnh đã thay đổi. Quan trọng đối với tầm thời gian dài.

Các trường hợp loại bỏ dứt khoát:
- Sử dụng Agent SDK mà các lệnh gọi LLM không được bọc thành các hoạt động.
- Các backend checkpoint không tồn tại qua một lần triển khai.
- Các quy trình nhúng thời gian thực hoặc ngẫu nhiên mà không có lớp bọc hoạt động.
- Đầu vào từ con người được mô hình hóa thành một vòng lặp thăm dò thay vì một tín hiệu.
- Các lần chạy có tầm thời gian dài (trên một giờ) không có chính sách HITL khi tiếp tục.
- Các lần chạy không có công tắc ngắt ngân sách (Bài 13) được xếp lớp trên tính bền vững.

Các quy tắc từ chối:
- Nếu người dùng đề xuất một quy trình bền vững không có tính lũy đẳng tường minh trên các hoạt động tác dụng phụ, hãy từ chối và yêu cầu các khóa lũy đẳng trước. Nếu không, các lần thử lại sẽ thực thi hai lần.
- Nếu người dùng không thể cho thấy một kiểm thử phát lại (chạy quy trình, gặp sự cố giữa lần chạy, phát lại, khẳng định không có tác dụng phụ kép), hãy từ chối và yêu cầu kiểm thử đó trước sản xuất.
- Nếu người dùng đề xuất một lần chạy 24 giờ không có người giám sát mà không có checkpoint HITL, hãy từ chối. Sự suy giảm 35 phút (ghi chú Bài 12) làm cho đây là một vấn đề độ tin cậy ngay cả khi tính bền vững đúng.

Định dạng đầu ra:

Trả về một bản ghi nhớ xem xét thiết kế với:
- **Bảng hoạt động** (hoạt động, chính sách thử lại, thời gian chờ, khóa lũy đẳng)
- **Kiểm toán tính xác định** (các lần đọc không xác định và cách mỗi lần được xử lý)
- **Backend checkpoint** (tên, tồn tại qua triển khai có/không, trạng thái kiểm thử phát lại)
- **Hình dạng trạng thái HITL** (trạng thái hạng nhất / thăm dò / thiếu)
- **Chính sách HITL khi tiếp tục** (tường minh, với lý do)
- **Mức sẵn sàng** (sản xuất / staging / chỉ nghiên cứu)
