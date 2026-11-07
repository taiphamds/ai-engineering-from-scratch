---
id: a-number-that-never-existed
title: A number that never existed reached the final report
card: multi-agent
kind: debug
level: 2
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [debugging, ml-breadth]
tags: [memory-poisoning, shared-state, provenance, append-only, verifier]
minutes: 10
lessons: [phases/16-multi-agent-and-swarms/13-shared-memory-blackboard]
manuals: []
practice: []
cheatsheet: [multi-agent, agent-failure-modes]
related: [multi-agent/two-workers-return-different-facts]
updated: 2026-11-03
---

Ba agent chia sẻ một bộ nhớ trên một tác vụ nghiên cứu. Một agent truy xuất đọc một trang và ghi rằng một nghiên cứu tìm thấy cải thiện 42 phần trăm. Trang nói 4.2 phần trăm. Một bộ tóm tắt xây dựng trên mục đó, một nhà phân tích khuyến nghị áp dụng dựa vào con số, và báo cáo cuối trích dẫn nó. Không agent nào crash và không kiểm thử nào thất bại. Lỗi này gọi là gì, tại sao nó mang tính cấu trúc, và ba thay đổi ngăn nó là gì?

## Short answer

Đây là đầu độc bộ nhớ. Ảo giác của một agent đi vào trạng thái dùng chung, và mọi agent phía sau đọc nó như một sự thật đã xác minh, nên lỗi được biến thành bằng chứng khi nó di chuyển. Nó mang tính cấu trúc vì bất kỳ bộ nhớ dùng chung nào không có nguồn gốc và không có bộ xác minh độc lập cuối cùng cũng sẽ làm điều này. Ba thay đổi là nguồn gốc trên mọi lần ghi, một log chỉ thêm nơi các sửa đổi thay thế thay vì ghi đè, và ít nhất một bộ xác minh chỉ đọc truy xuất lại các nguồn và báo cáo trên một kênh riêng.

## Full answer

### Why it is worse than a crash

Không có trạng thái dùng chung, lỗi của agent truy xuất ở trong ngữ cảnh riêng của nó, và một agent phía sau truy xuất lại trang có thể bắt được nó. Với trạng thái dùng chung, ngữ cảnh của agent đầu trở thành ngữ cảnh của mọi người. Triệu chứng là độ chính xác suy giảm chậm, không phải một thất bại. Đến khi một người nhận thấy, chuỗi suy luận sâu vài bước và nguyên nhân gốc là một trong những mục đầu tiên từng được ghi. Bài học đặt họ lỗi này thứ hai trong phân loại đo được của các lỗi đa agent.

### The three mitigations

| Thay đổi | Nó làm gì |
|---|---|
| Nguồn gốc trên mọi lần ghi | Mỗi mục ghi lại ai viết nó, khi nào, dưới prompt nào, và nó trích dẫn nguồn nào, để một người đọc phía sau có thể cân nhắc một mục theo nơi nó đến từ |
| Chỉ thêm với sự thay thế | Một sửa đổi là một mục mới trỏ đến mục nó thay thế, để dấu vết kiểm toán vẫn còn và người đọc có thể thấy một giá trị đã bị tranh chấp |
| Một bộ xác minh chỉ đọc | Một agent đọc pool, truy xuất lại các nguồn được trích dẫn, gắn cờ một chỗ không khớp, và không có handle ghi vào pool |

Trong demo của bài học, bộ xác minh thấy mục không khớp văn bản truy xuất được, mục được gắn cờ, và nhà phân tích thấy cờ trước khi viết phán quyết.

### Why the verifier must not write

Nếu đầu ra của bộ xác minh quay lại pool, một pool bị đầu độc đầu độc bộ xác minh, và các phán quyết của bộ xác minh mang độc đi xa hơn. Các phát hiện của nó đến một người hoặc một agent quyết định riêng trên kênh riêng của chúng. Nó vẫn có thể bị một mục xấu đánh lừa, nhưng nó kiểm tra mỗi mục đối chiếu nguồn gốc, và các sai lầm của nó không bao giờ trở thành sự thật dùng chung.

### What to monitor

Ghi log tỷ phần các lần ghi thay thế một mục trước. Một tỷ phần tăng là bằng chứng sớm rằng các agent đang sửa nhau thường xuyên hơn, là cách đầu độc xuất hiện trước khi ai đó đọc một báo cáo sai.

## Follow-ups

- **Level 2:** Tại sao nguồn gốc giúp một người đọc không thể truy xuất lại nguồn? Expected: người đọc có thể thấy một khẳng định dựa trên một lần truy xuất không có trích dẫn, và cân nhắc nó thấp hơn một khẳng định có nguồn và một cờ xác minh.
- **Level 2:** Nhà phân tích làm gì khi thấy một cờ trên mục nó phụ thuộc? Expected: nó giữ lại khuyến nghị hoặc viết khuyến nghị với cờ đính kèm, và báo cáo cuối mang một lời rút lại thay vì con số.
- **Level 3:** Phân vùng bộ nhớ theo chủ đề sẽ thay thế thay đổi nào trong ba thay đổi? Expected: không thay đổi nào, vì các phân vùng giới hạn agent nào đọc một mục, và một mục bị đầu độc trong một chủ đề vẫn đầu độc mọi người đăng ký nó.
- **Level 3:** Bản thân bộ xác minh ảo giác một chỗ không khớp. Thiệt hại là gì? Expected: một cờ sai trên một mục đúng, mà một người trên kênh xác minh có thể gỡ, và không có sự thật sai mới trong pool vì bộ xác minh không thể ghi.

## Wrong answers

- "Thêm một dòng vào mọi prompt nói hãy xác minh các con số." Bộ tóm tắt và nhà phân tích không có nguồn để xác minh đối chiếu, chỉ có mục dùng chung, và một prompt không cấp cho chúng nguồn.
- "Để bộ xác minh sửa mục tại chỗ." Một sửa đổi tại chỗ phá hủy dấu vết kiểm toán và cấp cho bộ xác minh một handle ghi mà một pool bị đầu độc có thể dùng chống lại nó.
- "Chuyển từ một pool dùng chung sang truyền thông điệp." Các thông điệp là trạng thái dùng chung với việc sao chép bổ sung, và một con số sai trong một thông điệp đầu độc bên nhận theo cùng cách.

## Taught in

[Bài học bộ nhớ dùng chung](../../../phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/) chạy kịch bản đầu độc có và không có bộ xác minh chỉ đọc.
