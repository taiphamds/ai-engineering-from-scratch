---
id: full-pool-or-blackboard
title: Every agent reads everything, or agents subscribe to topics
card: multi-agent
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [design-review, system-design]
tags: [message-pool, blackboard, subscription, projection, write-contention]
minutes: 10
lessons: [phases/16-multi-agent-and-swarms/13-shared-memory-blackboard]
manuals: []
practice: []
cheatsheet: [multi-agent]
related: [multi-agent/a-number-that-never-existed, multi-agent/four-primitives-for-any-framework]
updated: 2026-11-03
---

Một nhóm bốn agent chia sẻ một log thông điệp, và mọi agent đọc toàn bộ nó. Nhóm sắp tăng lên vài chục agent, và ngữ cảnh mỗi agent mang đã lớn. So sánh việc giữ log đơn với chuyển sang các chủ đề mà agent đăng ký, và nói bạn sẽ xử lý nhiều agent ghi cùng lúc như thế nào.

## Short answer

Một pool đầy đủ đơn giản, minh bạch và dễ kiểm tra, và nó ngừng mở rộng ở khoảng 10 agent vì cửa sổ mỗi agent đầy công việc của các agent khác. Một blackboard có đăng ký chỉ định tuyến các thông điệp liên quan đến mỗi agent, nên nó mở rộng xa hơn, và nó tốn một schema từ đầu khiến các chủ đề có ý nghĩa. Nhiều hệ thống trộn cả hai: một pool nhỏ ở lớp lập kế hoạch và các blackboard bên dưới. Với ghi, phần lớn hệ thống tuần tự hóa qua một bên ghi, vì các lời gọi mô hình đủ chậm để tranh chấp hiếm.

## Full answer

### The two topologies

| Cấu trúc liên kết | Ai đọc gì | Thắng khi | Chi phí |
|---|---|---|---|
| Pool thông điệp đầy đủ | Mọi agent đọc mọi thông điệp | Ít agent, vai trò hỗn hợp, thời hạn ngắn | Ngữ cảnh tăng với mọi lượt, và đầu độc lan đến mọi người |
| Blackboard có đăng ký | Các agent khai báo chủ đề và chỉ nhận những chủ đề đó | Nhiều agent, vai trò tương tự, chạy lâu | Một schema phải tồn tại trước khi các chủ đề có ý nghĩa |

Pool thắng khi suy luận ai nói gì ít tốn kém vì mọi người thấy mọi thứ. Blackboard thắng khi định tuyến tiết kiệm token và giữ công việc không liên quan ngoài mỗi cửa sổ.

### Projection goes one step further

Một blackboard cho mọi bên đăng ký một chủ đề cùng góc nhìn. Một phép chiếu theo agent cho mỗi vai trò một góc nhìn được tính từ trạng thái toàn cục, là điều các state reducer làm trong graph runtime. Nó mở rộng xa nhất và cần một schema, và không có schema thì mỗi agent xây lại phép chiếu riêng trong prompt của nó.

### Writes

Các lần ghi đồng thời từ nhiều agent là một vấn đề đồng thời, không phải một vấn đề mô hình. Ba mẫu hoạt động:

1. **Một bên ghi duy nhất.** Tất cả lần ghi đi qua một coordinator tuần tự hóa chúng. Đơn giản, và là một nút thắt.
2. **Đồng thời lạc quan có phiên bản.** Mỗi mục mang một phiên bản, và một lần ghi thất bại rồi thử lại khi không khớp.
3. **Phân vùng chủ đề.** Mỗi agent sở hữu các chủ đề, nên không có tranh chấp xuyên chủ đề, và các ranh giới phân vùng phải được thiết kế.

Phần lớn framework mặc định dùng một bên ghi, vì các lời gọi mô hình đủ chậm để nút thắt không gây hại.

### What does not change

Cả hai cấu trúc liên kết là trạng thái dùng chung, phần có trạng thái duy nhất của hệ thống, và cả hai cần nguồn gốc trên mọi mục, một log chỉ thêm và một bộ xác minh chỉ đọc. Phân vùng chủ đề giới hạn ai đọc một mục bị đầu độc. Nó không ngăn đầu độc.

### The pattern has a history

Blackboard có trước các agent mô hình bốn thập kỷ. Các nguồn tri thức chuyên biệt quan sát một bảng dùng chung, đóng góp các lời giải một phần và kích hoạt nhau. Các hệ thống hiện tại là cùng mẫu với agent mô hình làm nguồn tri thức và các mục có cấu trúc làm lời giải một phần, và tài liệu cũ đã ghi nhận tranh chấp ghi và tính nhất quán.

## Follow-ups

- **Level 2:** Một lớp lập kế hoạch ba agent và một lớp worker ba mươi agent. Cấu trúc liên kết nào ở đâu? Expected: một pool đầy đủ cho ba bên lập kế hoạch, những bên cần thấy nhau, và các blackboard cho worker, những bên chỉ cần các chủ đề của mình.
- **Level 2:** Phân vùng chủ đề làm những kịch bản đầu độc nào khó hơn? Expected: một mục bị đầu độc chỉ đến các bên đăng ký chủ đề của nó, nên lan truyền xuyên chủ đề bị cắt, trong khi các bên đăng ký chủ đề đó bị đầu độc theo cùng cách.
- **Level 3:** Khi nào bạn sẽ chuyển từ một bên ghi sang quản lý phiên bản lạc quan? Expected: khi các lần ghi đủ thường xuyên để hàng đợi của coordinator thêm độ trễ nhìn thấy, điều hiếm khi xảy ra trong khi mỗi lần ghi theo sau một lời gọi mô hình chậm.
- **Level 3:** Điều gì sai khi bạn thêm một blackboard không có schema? Expected: các chủ đề được đặt tên tùy hứng, các agent đăng ký sai chủ đề hoặc mọi thứ, và bạn xây lại pool đầy đủ với nhiều mã hơn.

## Wrong answers

- "Giữ pool và cấp cho agent cửa sổ lớn hơn." Pool tăng với mọi lượt từ mọi agent, và một cửa sổ lớn hơn trì hoãn giới hạn mà không loại bỏ nó.
- "Truyền các thông điệp trực tiếp giữa agent thay vì chia sẻ trạng thái." Các thông điệp trực tiếp là trạng thái dùng chung với sao chép bổ sung, và chúng mất log có thể kiểm tra.
- "Phân vùng theo chủ đề và vấn đề đầu độc được giải quyết." Các phân vùng giới hạn lan truyền, và một mục không có nguồn gốc và không có bộ xác minh vẫn đầu độc mọi bên đăng ký chủ đề của nó.

## Taught in

[Bài học bộ nhớ dùng chung](../../../phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/) xây dựng cả hai cấu trúc liên kết và các mẫu tranh chấp ghi.
