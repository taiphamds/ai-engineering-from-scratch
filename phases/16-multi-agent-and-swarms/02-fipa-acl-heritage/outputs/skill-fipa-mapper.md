---
name: fipa-mapper
description: Map any 2026 agent-protocol spec (MCP, A2A, ACP, ANP, CA-MCP, NLIP, or a new one) onto FIPA-ACL performatives and interaction protocols to decide what is genuine novelty and what is reinvention.
version: 1.0.0
phase: 16
lesson: 02
tags: [multi-agent, protocols, FIPA, speech-acts, interoperability]
---

Với một đặc tả giao thức agent mới, tạo ánh xạ FIPA-ACL để người đọc có thể biết những phần nào là tái phát minh và những phần nào là cấu trúc thực sự mới.

Tạo ra:

1. **Ánh xạ vỏ bọc.** Với mỗi loại thông điệp đặc tả định nghĩa, nêu hành vi ngôn hành FIPA gần nhất (`inform`, `request`, `query-if`, `query-ref`, `propose`, `accept-proposal`, `reject-proposal`, `cfp`, `subscribe`, `cancel`, `failure`, `not-understood`, hoặc một trong ~20 hành vi khác). Nếu không hành vi ngôn hành nào phù hợp, mô tả khoảng trống chính xác.
2. **Mô hình tương quan.** Đặc tả tương quan các yêu cầu với trả lời, việc hủy với yêu cầu gốc, và các sự kiện truyền luồng với đăng ký như thế nào? So sánh với các trường `:conversation-id` và `:reply-with` của FIPA.
3. **Lập trường ngôn ngữ nội dung.** Đặc tả bắt buộc một lược đồ nội dung (các hiện vật có kiểu, JSON-Schema), chấp nhận ngôn ngữ tự nhiên, hay để mở? So sánh với SL0/SL1 và các trường bản thể học của FIPA.
4. **Thư viện giao thức tương tác.** Các giao thức tương tác FIPA nào có thể triển khai trên đặc tả: contract-net, subscribe-notify, request-when, propose-accept? Nêu các thông điệp sẽ triển khai mỗi giao thức.
5. **Mô hình khám phá.** Một agent tìm các đối tác và năng lực như thế nào (MCP `listTools`, Agent Card A2A, ANP DID + siêu giao thức)? So sánh với bộ hỗ trợ danh bạ và dịch vụ trang vàng của FIPA.
6. **Tái phát minh so với tính mới.** Tạo một bảng ngắn với ba cột: [khái niệm FIPA, dạng tương đương trong đặc tả hiện đại, những gì thay đổi]. Đánh dấu mỗi hàng là [tái phát minh] hoặc [cấu trúc mới]. Một hàng chỉ là “cấu trúc mới” khi đặc tả đưa vào một nguyên thủy FIPA không có — danh tính phi tập trung, các hiện vật đa phương thức có kiểu, và nội dung LLM có thể diễn giải là các ứng viên phổ biến.

Các trường hợp loại bỏ dứt khoát:

- Bất kỳ ánh xạ nào tuyên bố một đặc tả là “cách mạng” mà không cho thấy một nguyên thủy FIPA không có. Lý thuyết hành vi ngôn ngữ + chi phí phụ bản thể học là chế độ lỗi, không phải các nguyên thủy.
- Các so sánh framework bỏ qua lớp khám phá. Một đặc tả không có khám phá là không đầy đủ, không phải mới.
- Các tuyên bố như “Giao thức X thay thế FIPA” mà không giải quyết điều gì xảy ra khi hai agent không đồng ý về ý nghĩa nội dung (trôi ngữ nghĩa).

Các quy tắc từ chối:

- Nếu đặc tả ở giai đoạn trước tiêu chuẩn hóa (bản dự thảo < 6 tháng tuổi, không có triển khai công khai), nêu rằng ánh xạ là tạm thời và đánh dấu ba thay đổi có khả năng cao nhất.
- Nếu đặc tả đóng nguồn hoặc chỉ dành cho doanh nghiệp (một số biến thể ACP), ánh xạ những gì được ghi tài liệu và nêu các khoảng trống.
- Nếu người dùng chỉ cung cấp một bài blog (không có tài liệu đặc tả), yêu cầu đặc tả trước khi ánh xạ.

Đầu ra: một bản tóm lược một trang. Bắt đầu với một tóm tắt một câu (“Giao thức X là FIPA `request`/`subscribe` với cú pháp JSON và một lớp khám phá dựa trên DID.”), rồi sáu phần ở trên, rồi một đoạn kết trả lời: “Đặc tả này sẽ khám phá lại chế độ lỗi FIPA cũ nào?”
