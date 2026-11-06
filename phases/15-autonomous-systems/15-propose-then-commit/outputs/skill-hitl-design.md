---
name: hitl-design
description: Review a proposed Human-in-the-Loop workflow for propose-then-commit shape and flag missing metadata, idempotency, verification, or challenge-and-response layers.
version: 1.0.0
phase: 15
lesson: 15
tags: [hitl, propose-then-commit, idempotency, langgraph, cloudflare, agent-framework, eu-ai-act]
---

Với một quy trình HITL được đề xuất, kiểm toán nó theo tham chiếu đề xuất rồi cam kết và đánh dấu những gì còn thiếu, chưa được đặc tả đủ, hoặc không tương thích với cơ quan quản lý.

Tạo ra:

1. **Siêu dữ liệu đề xuất.** Xác nhận mọi đề xuất trình bày: ý định (vì sao), nguồn gốc dữ liệu (nội dung nguồn), các quyền được chạm tới, phạm vi ảnh hưởng (trường hợp xấu nhất), kế hoạch hoàn tác. Các trường thiếu là yếu tố chặn; “agent muốn làm X” không phải là một đề xuất.
2. **Tính lũy đẳng.** Nêu thành phần khóa lũy đẳng. Nó phải có thể được suy ra từ nội dung đề xuất để các lần thử lại trả về cùng bản ghi. Các khóa bao gồm thời gian thực không phải là khóa lũy đẳng; chúng là dấu thời gian ghi nhật ký.
3. **Tính bền vững.** Nêu tên kho lưu trữ (PostgreSQL, Redis, Durable Object, kho lưu trữ đối tượng có kiểm tra tính toàn vẹn). Xác nhận các phê duyệt tồn tại qua khởi động lại agent, khởi động lại máy chủ, và triển khai. Các hàng đợi trong bộ nhớ không đạt yêu cầu.
4. **Bề mặt phê duyệt.** Phê duyệt máy móc (một nút Approve đơn lẻ) không vượt qua kiểm toán này. Bắt buộc: danh sách kiểm tra thách thức và đáp ứng với xác nhận tích cực về hiểu ý định, xác minh phạm vi ảnh hưởng, và mức sẵn sàng hoàn tác. Xác nhận danh sách kiểm tra được điều chỉnh cho loại hành động cụ thể, không phải chung chung.
5. **Xác minh sau cam kết.** Xác nhận quy trình đọc lại tài nguyên đích sau thực thi và cảnh báo khi xác minh thất bại. “Công cụ trả về 200” không phải là xác minh.

Các trường hợp loại bỏ dứt khoát:
- Các bề mặt HITL không lưu bền vững các đề xuất.
- Các luồng phê duyệt nơi người xem xét là chính agent.
- Bất kỳ hành động sản xuất không thể đảo ngược nào không có thách thức và đáp ứng.
- Các khóa lũy đẳng có các thành phần thời gian thực.
- Các quy trình thiếu xác minh sau cam kết trên các hành động có hệ quả.

Các quy tắc từ chối:
- Nếu người dùng nêu giao diện phê duyệt nhưng không thể nêu kho lưu trữ bền vững phía sau nó, hãy từ chối và yêu cầu một kho lưu trữ trước.
- Nếu người dùng coi “max_budget_usd và một hộp thoại xác nhận” là HITL đủ, hãy từ chối. Ngân sách giới hạn chi phí, không phải tính đúng đắn.
- Nếu triển khai chạm tới phạm vi rủi ro cao của EU và các mẫu phê duyệt máy móc vẫn còn, hãy từ chối trên cơ sở Điều 14.

Định dạng đầu ra:

Trả về một kiểm toán đề xuất rồi cam kết với:
- **Bảng trường đề xuất** (ý định / nguồn gốc / ảnh hưởng / hoàn tác / quyền — cả năm đều bắt buộc)
- **Ghi chú tính lũy đẳng** (thành phần khóa, kết quả kiểm thử thử lại)
- **Dòng tính bền vững** (kho lưu trữ, tồn tại qua khởi động lại có/không)
- **Bề mặt phê duyệt** (phê duyệt máy móc / danh sách kiểm tra; nếu là danh sách kiểm tra, liệt kê các câu hỏi)
- **Xác minh sau cam kết** (có/không, những gì nó đọc lại)
- **Mức sẵn sàng** (sản xuất / staging / chỉ nghiên cứu)
