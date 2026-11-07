---
id: browser-agent-trust-boundary
title: A travel agent that reads any page and is logged in
card: sandboxes
kind: design
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [system-design, design-review]
tags: [browser-agent, prompt-injection, trust-boundary, computer-use, hitl]
minutes: 10
lessons: [phases/15-autonomous-systems/11-browser-agents, phases/14-agent-engineering/21-computer-use-agents]
manuals: []
practice: []
cheatsheet: [autonomous-agents, embodied-computer-use]
related: [sandboxes/screen-text-is-not-permission]
updated: 2026-11-03
---

Thiết kế ranh giới tin cậy cho một browser agent đặt chuyến đi cho nhân viên. Nó đọc các trang tùy ý, nó đã đăng nhập vào trang du lịch, và nó có thể gửi biểu mẫu. Nêu các lớp tấn công bạn giả định, vẽ ranh giới, chọn đánh giá phù hợp công việc, và nêu một biện pháp phòng vệ bạn từ chối chỉ dựa vào riêng nó.

## Short answer

Giả định năm lớp: chỉ dẫn trong văn bản trang, các payload trong fragment URL hoặc query string không bao giờ render, một trang yêu cầu agent ghi một bộ nhớ bền vững kích hoạt ở phiên tiếp theo, các yêu cầu dạng CSRF đi nhờ phiên đã đăng nhập, và một nút trông vô hại mang một hành động tiếp nối. Vẽ một ranh giới đọc/ghi: đọc không bao giờ có hệ quả, và mọi thao tác ghi, một lần gửi biểu mẫu, một bài đăng, một công cụ có tác dụng phụ hoặc một điều hướng thay đổi trạng thái, cần phê duyệt con người mới khi nội dung khởi xướng đến từ ngoài ranh giới tin cậy, với một danh sách công cụ cho phép theo từng tác vụ, chỉ thông tin xác thực có phạm vi, và mọi yêu cầu HTTP được ghi nhật ký. Đánh giá trên các luồng web giao dịch, không phải tìm dữ kiện. Biện pháp phòng vệ bạn không bao giờ chỉ dựa vào riêng nó là bộ làm sạch nội dung, vì agent phải đọc nội dung không đáng tin cậy để làm việc và một bộ lọc mẫu chỉ loại các cuộc tấn công dễ.

## Full answer

### Why the class stays open

Cuộc tấn công đẳng cấu với capability: agent phải đọc nội dung không đáng tin cậy, bất kỳ nội dung nào nó đọc có thể chứa chỉ dẫn, và bất kỳ chỉ dẫn nào nó làm theo có thể lệch với người dùng. Đó là lập luận đằng sau tuyên bố công khai rằng injection gián tiếp không phải một bug có thể được vá hoàn toàn. Các biện pháp phòng vệ tăng chi phí và thu hẹp phạm vi ảnh hưởng. Thiết kế để kiềm chế, không phải cho một lớp đã đóng.

### The boundary, piece by piece

| Thành phần | Nó làm gì |
|---|---|
| ranh giới đọc/ghi | đọc không bao giờ hành động; ghi có nguồn gốc ngoài tin cậy chờ phê duyệt mới |
| danh sách công cụ cho phép theo từng tác vụ | agent có thể duyệt, và nó không thể khởi xướng thanh toán trừ khi công cụ đó được bật cho tác vụ |
| cô lập phiên | chỉ thông tin xác thực có phạm vi, không có xác thực production và không có hộp thư cá nhân, với một nhật ký yêu cầu để kiểm toán |
| kiểm tra an toàn theo từng bước | một hành động được đánh giá trước khi chạy, và các click ngoài vùng được cho phép hoặc việc gõ mang các mẫu injection bị từ chối |
| xác nhận con người | đăng nhập, mua hàng và CAPTCHA luôn chờ một người |
| bộ làm sạch | HTML được lấy được loại các mẫu xấu đã biết trước khi đi vào ngữ cảnh |
| canary bộ nhớ | một mục bộ nhớ được cài được hiển thị cho người dùng khi nó kích hoạt |

Cả ba mô hình computer-use production đều dựa trên thị giác và xem ảnh chụp màn hình, văn bản DOM, đầu ra công cụ và nội dung PDF là không đáng tin cậy; chỉ các chỉ dẫn trực tiếp của người dùng được tính là sự cho phép. Một lần chạy dài cần các trace theo từng bước, vì một lần chạy 200 click thất bại muộn không thể gỡ lỗi nếu thiếu chúng.

### Pick the benchmark that matches the task

Một benchmark tìm dữ kiện đo liệu agent tìm thấy các dữ kiện trên web mở không; một benchmark desktop đo liệu nó điều khiển một hệ điều hành đầy đủ không; benchmark tác vụ web đã xác minh đo liệu nó hoàn thành các luồng giao dịch trong các trang mô phỏng không, với một tập con khó cho trạng thái nhiều trang. Một điểm tìm dữ kiện cao không nói gì về đặt một chuyến bay. Đánh giá cho sản phẩm này là đánh giá giao dịch, và kiểm thử chấp nhận là cổng ghi kích hoạt trên mọi thao tác ghi bị injection.

## Follow-ups

- **Level 3:** Việc đặt chỗ kết thúc bằng một lần mua. Đầu vào nào được ủy quyền nó? Expected: chỉ một chỉ dẫn trực tiếp của người dùng; không gì đọc từ một trang, một fragment hoặc một kết quả công cụ.
- **Level 3:** Một trang bảo agent nhớ một quy tắc cho lần sau. Điều gì chặn payload trì hoãn? Expected: xem một thao tác ghi bộ nhớ là một thao tác ghi cần phê duyệt, và giữ một canary để một mục được cài được hiển thị khi nó kích hoạt.
- **Level 4:** Tại sao một nhật ký yêu cầu thuộc về ranh giới? Expected: các hành động dạng CSRF đi nhờ phiên với cookie hợp lệ, nên nhật ký là cách duy nhất để thấy agent đã làm gì với chúng sau đó.
- **Level 4:** Một bộ làm sạch vẫn bỏ lỡ gì, theo cách xây dựng? Expected: bất cứ thứ gì không phải một mẫu đã biết, bao gồm một câu thuần đọc như một yêu cầu, vì agent không thể ngừng đọc.

## Wrong answers

- "Loại HTML và vấn đề được giải quyết." Bộ lọc loại các dạng đã biết; lớp không thể đóng vì agent phải đọc.
- "Mô hình được huấn luyện để từ chối injection." Chính tài liệu của các nhà cung cấp xem nội dung truy xuất là không đáng tin cậy và đặt cổng bên ngoài mô hình.
- "Chọn agent có điểm duyệt tốt nhất." Tìm dữ kiện và các luồng giao dịch là các trục khác nhau; đánh giá trên luồng bạn phát hành.

## Taught in

[Bài học về browser agent](../../../phases/15-autonomous-systems/11-browser-agents/) nêu các lớp tấn công và các biện pháp phòng vệ được cung cấp, và [bài học computer-use](../../../phases/14-agent-engineering/21-computer-use-agents/) nêu hợp đồng đầu vào không đáng tin cậy và mẫu theo từng bước.
