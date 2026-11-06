---
id: locked-bounded-delegated
title: Write a specification that leaves judgment where it belongs
card: behavioral
kind: design
level: 3
roles: [agentic-ai-engineer, applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [behavioral, design-review]
tags: [specification, decision-modes, proof, invariants]
minutes: 12
lessons: [phases/14-agent-engineering/51-write-specifications-that-preserve-judgment]
manuals: []
practice: []
cheatsheet: [agent-planning, delegation-feedback]
related: [behavioral/agent-decides-alone, behavioral/plan-you-would-reject]
updated: 2026-11-03
---

Bạn giao một nhiệm vụ cho một coding agent, hoặc cho một kỹ sư mới, để thêm một bước chẩn đoán chỉ đọc vào một công cụ sự cố. Lần trước bản tóm lược là hai câu và kết quả đoán hệ thống. Lần trước nữa, bản tóm lược là một thiết kế mười hai trang và kết quả chép lại một sai lầm trong đó. Bạn viết bản này thế nào?

## Short answer

Tôi viết một hợp đồng thực thi được với sáu bề mặt: kết quả, các bất biến phải luôn giữ đúng, các ví dụ cụ thể, các điều không phải mục tiêu, một chính sách quyết định, và phép chứng minh bắt buộc trước khi hoàn tất. Mọi quyết định được đánh dấu bị khóa, có giới hạn hoặc được ủy quyền theo hậu quả và khả năng đảo ngược. Ranh giới ghi production bị khóa, ngân sách thời gian cho nguồn dữ liệu có giới hạn, và cấu trúc cục bộ cùng các tên được ủy quyền với yêu cầu giải thích.

## Full answer

### Two bad extremes

Một nhiệm vụ được đặc tả thiếu khiến người xây dựng đoán hệ thống. Một nhiệm vụ được đặc tả quá mức khiến người xây dựng chép lại một thiết kế có thể đã sai. Khoảng giữa hữu ích cố định các bất biến và bằng chứng và để các lựa chọn có thể đảo ngược mở.

### The six surfaces

| Bề mặt | Mục đích |
|---|---|
| Kết quả | Kết quả có thể quan sát |
| Các bất biến | Các điều kiện phải luôn đúng |
| Các ví dụ | Các trường hợp cụ thể cho thấy ý định |
| Các điều không phải mục tiêu | Hành vi lân cận được chủ ý loại trừ |
| Chính sách quyết định | Những lựa chọn nào bị khóa, có giới hạn hoặc được ủy quyền |
| Phép chứng minh | Bằng chứng bắt buộc trước khi hoàn tất |

### Three decision modes

- Bị khóa: người xây dựng không được chọn. Tính tương thích công khai, thẩm quyền, an toàn, chi phí không thể đảo ngược, các cam kết sản phẩm.
- Có giới hạn: người xây dựng có thể chọn bên trong các giới hạn rõ ràng. Các ngân sách tìm kiếm, số lần thử lại, dependency được phép, một họ giao diện đã biết.
- Được ủy quyền: người xây dựng sở hữu lựa chọn và giải thích nó. Cấu trúc cục bộ, tên, các lần refactor có thể đảo ngược, chi tiết triển khai.

"Triển khai có thể dùng bất kỳ nguồn chỉ đọc nào trả về trong ngân sách thời gian" không mơ hồ. Nó là một quyết định được ủy quyền với một ranh giới và một phép chứng minh.

### Examples compress intent

"Hữu ích", "vững chắc" và "sẵn sàng cho production" không thực thi được. Một tập nhỏ các trường hợp bình thường, biên, thất bại và bị cấm cho người xây dựng và bộ xác minh cùng mục tiêu. Các ví dụ không thay thế các bất biến; một trường hợp đạt không thể chứng minh một quy tắc an toàn phổ quát.

### Proof matches the claim

Một kiểm thử đơn vị chứng minh một hợp đồng hàm cục bộ. Một kiểm thử đường truyền chứng minh việc tuần tự hóa và truyền tải. Một hành trình trình duyệt chứng minh một đường giao diện. Một tập phát lại chứng minh hành vi trên các trường hợp đại diện. Một log kiểm toán chứng minh các ranh giới thẩm quyền được giữ. Tôi không chấp nhận một lớp thấp hơn làm bằng chứng cho một khẳng định lớp cao hơn.

## Follow-ups

- **Level 3:** Ai đó chuyển quyết định ghi production từ bị khóa sang được ủy quyền. Schema chấp nhận nó. Tại sao nó vẫn sai? Expected: schema kiểm tra hình dạng, không phải rủi ro sản phẩm; một lần ghi production không thể đảo ngược và thay đổi thẩm quyền, nên nó vẫn bị khóa.
- **Level 3:** Một số lần thử lại được đặt thành một con số cố định trong bản tóm lược. Đó là bị khóa hay có giới hạn? Expected: có giới hạn là chế độ tốt hơn; người xây dựng có thể chọn trong một phạm vi đã nêu và phạm vi mang lý do.
- **Level 4:** Ba chỉ dẫn triển khai mô tả cùng hành vi. Bạn thay chúng bằng gì? Expected: một bất biến và hai ví dụ, để ý định sống sót qua một thay đổi triển khai.
- **Level 4:** Tại sao ghi lại lý do đằng sau mỗi lựa chọn bị khóa? Expected: để một nhóm sau này có thể sửa đổi nó khi bằng chứng thay đổi, mà không khai quật qua các luồng trao đổi cũ.

## Wrong answers

- "Đặc tả mọi bước để không có gì có thể sai." Một script từng bước chép lại các sai lầm của tác giả và loại bỏ phán đoán bắt được chúng.
- "Đưa mục tiêu và tin người xây dựng." Không có các bất biến và bằng chứng, người xây dựng đoán hệ thống và kết quả không thể được xác minh.
- "Một kiểm thử đơn vị đạt chứng minh tính năng hoạt động." Một kiểm thử đơn vị chứng minh một hợp đồng cục bộ, không phải một đường giao diện hoặc một ranh giới thẩm quyền.

## Taught in

[Bài học đặc tả](../../../phases/14-agent-engineering/51-write-specifications-that-preserve-judgment/) đưa ra sáu bề mặt, ba chế độ quyết định và quy tắc rằng phép chứng minh phải khớp khẳng định.
