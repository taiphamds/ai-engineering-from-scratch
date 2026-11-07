---
id: the-verifier-that-cannot-write
title: Design the verifier that has no write handle
card: multi-agent
kind: design
level: 3
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [verifier, read-only, shared-memory, provenance, verification-channel]
minutes: 12
lessons: [phases/16-multi-agent-and-swarms/13-shared-memory-blackboard]
manuals: []
practice: []
cheatsheet: [multi-agent, agent-failure-modes]
related: [multi-agent/a-number-that-never-existed]
updated: 2026-11-03
---

Bạn đang thêm một agent kiểm tra vào một nhóm chia sẻ một bộ nhớ. Một đồng nghiệp muốn bên kiểm tra sửa trực tiếp các mục sai, vì đó là thiết kế đơn giản nhất. Đặc tả bên kiểm tra: nó đọc gì, được ghi gì, kết quả của nó đến đâu, và nó có thể và không thể bảo vệ chống gì. Bảo vệ các hạn chế.

## Short answer

Bên kiểm tra đọc bộ nhớ dùng chung như mọi agent khác, truy xuất lại các nguồn các mục trích dẫn, và so sánh. Nó không có handle ghi vào bộ nhớ dùng chung, chỉ vào một kênh xác minh riêng mà một người hoặc một agent quyết định đọc. Nó không thể ngăn một mục xấu được ghi, và nó có thể bị một mục không trích dẫn nguồn đánh lừa, nhưng các phán quyết của nó không bao giờ có thể thành một sự thật dùng chung. Một bên kiểm tra ghi vào bộ nhớ bị đầu độc bởi cùng bộ nhớ nó kiểm tra, và rồi các phán quyết của nó mang độc đi xa hơn.

## Full answer

### The specification

| Khía cạnh | Quy tắc |
|---|---|
| Đọc | Toàn bộ pool, hoặc các chủ đề nó đăng ký trên một blackboard |
| Ghi | Không gì trong bộ nhớ dùng chung, chỉ các mục trên kênh xác minh riêng |
| Phương pháp | Với mỗi mục có một nguồn trích dẫn, truy xuất nguồn độc lập và so sánh nội dung |
| Đầu ra | Một phát hiện mỗi chỗ không khớp với id mục và lý do, được định tuyến đến một người hoặc một agent quyết định riêng |
| Tác động | Bộ xác minh không ghi gì vào pool. Bên gọi có thể gắn phát hiện vào mục như một cờ, như demo của bài học làm, nhưng nội dung mục không đổi, và một sửa đổi là một mục mới thay thế nó |

Trong mã của bài học, bộ xác minh trả về một danh sách các phát hiện và không bao giờ chạm pool. Bên gọi quyết định làm gì với chúng.

### Why no write handle

Bộ nhớ dùng chung là phần có trạng thái duy nhất của hệ thống, và là nơi đầu độc xảy ra. Một bộ xác minh ghi trở thành một bên ghi nữa có thể sai. Tệ hơn, nó đọc pool nó ghi vào, nên một pool bị đầu độc định hình góc nhìn của bộ xác minh, và các kết luận của bộ xác minh tái nhập pool như những sự thật mới với thẩm quyền của một kiểm tra phía sau. Sự tách biệt phá chu kỳ đó. Bộ xác minh có thể bị một mục xấu đánh lừa, nhưng các sai lầm của nó ở lại trên kênh riêng.

### Why not fix entries in place

Một cách sửa tại chỗ phá hủy dấu vết kiểm toán. Quy tắc của bài học là chỉ thêm: một sửa đổi là một mục mới tham chiếu mục nó thay thế. Với phát hiện của bộ xác minh được gắn vào, bản ghi cho thấy một giá trị đã được ghi, một kiểm tra bất đồng, và kiểm tra tìm thấy gì. Một người đọc ba bước sau có thể thấy tranh chấp. Một mục bị ghi đè không cho thấy gì.

### What it protects against, and what it does not

Nó bắt một mục trích dẫn một nguồn và không khớp nguồn đó, là trường hợp đầu độc. Nó không bắt một mục không có trích dẫn, một mục có nguồn tự nó sai, hoặc một kết luận sai được rút ra đúng từ các đầu vào đã gắn cờ. Với những điều đó bạn cần nguồn gốc để các khẳng định không trích dẫn được cân nhắc thấp hơn, sự đa dạng nguồn, và một agent quyết định đọc các phát hiện.

### How it fits the rest

Nguồn gốc trên mọi lần ghi cho bộ xác minh thứ để kiểm tra. Log chỉ thêm cho các phát hiện của nó nơi để gắn vào. Kênh xác minh cho đầu ra của nó một người đọc không phải pool. Ba biện pháp giảm thiểu là một thiết kế.

## Follow-ups

- **Level 3:** Bộ xác minh gắn cờ một mục mà nhà phân tích đã dùng. Điều gì xảy ra với mục của nhà phân tích? Expected: nó ở lại trong log, một mục mới có thể thay thế nó với phát hiện làm lý do, và báo cáo cuối mang lời rút lại.
- **Level 3:** Bạn triển khai bao nhiêu bộ xác minh? Expected: ít nhất một, và nhiều hơn nếu pool được phân vùng theo chủ đề, với mỗi bộ xác minh đăng ký các chủ đề nó có thể kiểm tra.
- **Level 4:** Bạn giữ quyền truy cập nguồn của bộ xác minh độc lập như thế nào? Expected: nó truy xuất từ vị trí gốc bằng các công cụ riêng, không phải từ một cache mà một bên ghi lấp đầy, nếu không nó kiểm tra mục đối chiếu một bản sao của chính mục đó.
- **Level 4:** Chỉ số nào cho bạn biết bộ xác minh đang làm việc hữu ích? Expected: tỷ phần các lần ghi là thay thế và tỷ phần các mục được gắn cờ, được đọc cùng nhau, với một tỷ lệ gắn cờ tăng là dấu hiệu sớm của một bên ghi ảo giác.

## Wrong answers

- "Để bên kiểm tra sửa mục, vì nó có nguồn." Cách sửa ghi đè dấu vết kiểm toán và cấp cho bên kiểm tra một đường ghi mà một pool bị đầu độc có thể dùng chống lại nó.
- "Một agent đánh giá thứ hai đọc pool là đủ." Một bên đánh giá chỉ đọc pool so sánh các mục với nhau và kế thừa cùng các sự thật bị đầu độc; bộ xác minh phải truy xuất lại nguồn.
- "Định tuyến các phát hiện của bộ xác minh vào pool để mọi agent thấy chúng." Các phát hiện khi đó thành sự thật dùng chung, và một phát hiện sai đầu độc pool theo cách mới; phát hiện trên kênh xác minh, có khóa là id mục, là tín hiệu nhìn thấy, không phải một mục mới trong pool.

## Taught in

[Bài học bộ nhớ dùng chung](../../../phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/) đặc tả bộ xác minh chỉ đọc và kênh riêng của nó.
