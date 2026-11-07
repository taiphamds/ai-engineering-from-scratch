---
id: design-a-research-team
title: Design a lead-and-workers research system for production
card: multi-agent
kind: take-home
level: 4
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [take-home, system-design]
tags: [supervisor, shared-memory, verifier, circuit-breaker, observability]
minutes: 60
lessons: [phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern, phases/16-multi-agent-and-swarms/13-shared-memory-blackboard, phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink]
manuals: []
practice: []
cheatsheet: [multi-agent, research-agent-pipeline, agent-failure-modes]
related: [multi-agent/why-a-fresh-context-wins, multi-agent/the-verifier-that-cannot-write, multi-agent/the-retry-storm]
updated: 2026-11-03
---

Bài làm ở nhà. Thiết kế một hệ thống nghiên cứu trong đó một agent trưởng lập kế hoạch và nhiều worker tìm kiếm song song, cho một sản phẩm mà người dùng hỏi các câu hỏi mở và kỳ vọng một câu trả lời có trích dẫn. Bàn giao một tài liệu thiết kế với dàn ý các prompt trưởng và worker, bộ nhớ dùng chung, các chế độ lỗi bạn kỳ vọng và biện pháp giảm thiểu cho mỗi lỗi, các giới hạn vận hành, và mô hình chi phí. Nói bạn sẽ cắt gì nếu ngân sách giảm một nửa.

## Short answer

Agent trưởng phân rã câu hỏi thành các câu hỏi con, điều chỉnh số worker theo độ phức tạp câu hỏi, và tổng hợp các bản tóm tắt của worker mà không đọc nguồn thô. Mỗi worker có một ngữ cảnh mới, một phạm vi tường minh, một timeout khoảng gấp đôi thời gian chạy trung vị và một giới hạn token. Bộ nhớ dùng chung mang nguồn gốc trên mọi mục, chỉ thêm, và được kiểm tra bởi một bộ xác minh chỉ đọc truy xuất lại nguồn và báo cáo trên kênh riêng. Mọi lời gọi đi ra nằm sau một circuit breaker, hệ thống được triển khai với các phiên bản cạnh nhau, và mô hình chi phí nói trước rằng mẫu này dùng số token gấp khoảng 15 lần một agent đơn.

## Full answer

### The lead

- Dàn ý prompt: phân rã, phân công, tổng hợp, không bao giờ trực tiếp nghiên cứu.
- Điều chỉnh nỗ lực theo truy vấn: một câu hỏi đơn giản nhận một agent và vài lời gọi công cụ, và một câu phức tạp nhận hơn mười worker. Agent trưởng ước lượng điều này, không phải bên gọi.
- Phân rã rộng trước, rồi sinh các worker sâu hơn nơi một câu trả lời con đáng để làm vậy.
- Tổng hợp có nguồn gốc: mọi khẳng định trong câu trả lời nêu tên worker và nguồn nó đến từ.
- Xử lý xung đột: khi hai worker trả về các sự thật mâu thuẫn, hỏi lại với một câu hỏi hẹp hơn hoặc đưa sự bất đồng ra, không bao giờ im lặng chọn.

### The workers

- Dàn ý prompt: một câu hỏi con, các nguồn ưu tiên, những gì ngoài phạm vi, hình dạng đầu ra.
- Ngữ cảnh mới mỗi worker, để các token lập kế hoạch của agent trưởng không bao giờ đi vào cửa sổ của worker.
- Một timeout khoảng gấp đôi thời gian chạy worker trung vị, sau đó agent trưởng sinh lại với phạm vi hẹp hơn hoặc tiếp tục không có kết quả.
- Một giới hạn token cứng mỗi worker, ở mức mười lần đầu vào tổng hợp kỳ vọng, để một worker mất kiểm soát không thể dùng hết ngân sách.

### Shared memory

- Mọi mục mang người ghi, dấu thời gian, hash prompt và nguồn nó trích dẫn.
- Log chỉ thêm; một sửa đổi thay thế và tham chiếu mục nó thay.
- Một bộ xác minh chỉ đọc truy xuất lại các nguồn trích dẫn, gắn cờ các chỗ không khớp, và chỉ ghi vào một kênh xác minh mà agent trưởng và một người đọc.
- Theo dõi tỷ phần các lần ghi là thay thế như một dấu hiệu sớm của một bên ghi đang ảo giác.

### Failure modes and mitigations

| Lỗi kỳ vọng | Biện pháp giảm thiểu |
|---|---|
| Agent trưởng phân rã sai câu hỏi | Ghi log phân rã và so sánh nó với câu hỏi của người dùng trước khi worker bắt đầu |
| Worker khám phá quá mức | Phạm vi tường minh, timeout và giới hạn token |
| Hai worker bất đồng | Phát hiện bằng các khẳng định được chuẩn hóa mỗi câu hỏi con; hỏi lại hoặc đưa ra |
| Đầu độc bộ nhớ | Nguồn gốc, chỉ thêm, bộ xác minh chỉ đọc |
| Bão thử lại đối với một dịch vụ tìm kiếm hoặc truy xuất | Các circuit breaker mở ở tỷ lệ lỗi 5 đến 10 phần trăm và các ngân sách thử lại bị giới hạn |
| Câu trả lời sai im lặng | Một tập vàng các câu hỏi có câu trả lời đã biết, chạy hằng tuần, và đánh giá con người lấy mẫu |

### Operations

- Trace kế hoạch của agent trưởng, các lời gọi công cụ của mỗi worker và việc tổng hợp, để một câu trả lời sai có thể được truy về một worker và một nguồn.
- Triển khai các phiên bản mới cạnh phiên bản cũ và để các câu hỏi chạy lâu hoàn tất trên phiên bản chúng bắt đầu.
- Chạy kiểm toán chế độ lỗi mỗi quý trên một mẫu khoảng 1000 trace và xếp hạng các biện pháp giảm thiểu theo lỗi được loại bỏ.

### Cost model

Nêu hệ số đo được: mẫu tốn số token gấp khoảng 15 lần một agent đơn, và khoảng 80 phần trăm biến thiên chất lượng trên một benchmark duyệt web được giải thích bởi mức dùng token. Báo cáo token và thời gian thực cạnh chất lượng câu trả lời cho mọi lớp câu hỏi.

### With half the budget

Giữ quy tắc điều chỉnh của agent trưởng và tăng độ phức tạp mà một câu hỏi phải đạt trước khi agent trưởng thêm worker, để nhiều câu hỏi hơn đến một agent. Giữ nguồn gốc và bộ xác minh, vì chúng ít tốn kém và bảo vệ câu trả lời có trích dẫn. Cắt số worker mỗi câu hỏi trước khi cắt bộ xác minh, và cắt hoàn toàn các vòng tranh luận.

### What we grade

Các prompt được phác thảo, schema bộ nhớ có các trường nguồn gốc, bảng lỗi với một biện pháp giảm thiểu mỗi dòng, ba giới hạn vận hành với lý do cho mỗi con số, và một phần chi phí cho thấy hệ số thay vì giấu nó.

## Follow-ups

- **Level 3:** Tại sao agent trưởng không bao giờ đọc nguồn thô, ngay cả để kiểm tra một worker? Expected: cửa sổ của nó dành cho lập kế hoạch và tổng hợp, và việc kiểm tra thuộc về bộ xác minh, truy xuất lại nguồn mà không ghi vào pool.
- **Level 3:** Một worker trả về một bản tóm tắt không có nguồn. Thiết kế làm gì với nó? Expected: nguồn gốc đánh dấu mục là không trích dẫn, agent trưởng cân nhắc nó thấp hơn, và bộ xác minh không thể kiểm tra nó, nên câu trả lời hoặc bỏ nó hoặc gắn nhãn nó.
- **Level 4:** Bạn sẽ giữ thành phần nào nếu chỉ có thể giữ một ngoài agent trưởng và worker? Expected: bộ xác minh chỉ đọc với nguồn gốc, vì một câu trả lời có trích dẫn mà sai là lỗi sản phẩm không thể sống sót.
- **Level 4:** Bạn biết hệ thống vẫn hoạt động quý tới như thế nào? Expected: tập vàng chạy hằng tuần, các tỷ lệ thay thế và gắn cờ, tỷ lệ đồng thuận giữa các worker song song, và kiểm toán hằng quý.

## Wrong answers

- "Cấp cho mọi worker toàn bộ cuộc hội thoại để nó có ngữ cảnh." Điều đó tiêu mất lợi thế ngữ cảnh mới và sao chép kế hoạch của agent trưởng vào mọi cửa sổ.
- "Để agent trưởng giải quyết xung đột bằng cách chọn câu trả lời được viết tốt hơn." Một lựa chọn im lặng giấu sự bất đồng khỏi người dùng, và thiết kế phải hỏi lại hoặc đưa nó ra.
- "Bỏ bộ xác minh, vì agent trưởng đã đọc các bản tóm tắt của worker." Agent trưởng so sánh các bản tóm tắt với nhau, không phải với nguồn, và các bản tóm tắt dùng chung có thể chia sẻ một ảo giác.

## Taught in

[Bài học mẫu supervisor](../../../phases/16-multi-agent-and-swarms/05-supervisor-orchestrator-pattern/) đưa ra agent trưởng, worker và các giới hạn, [bài học bộ nhớ dùng chung](../../../phases/16-multi-agent-and-swarms/13-shared-memory-blackboard/) đưa ra các trường nguồn gốc và bộ kiểm tra chỉ đọc, và [bài học các chế độ lỗi](../../../phases/16-multi-agent-and-swarms/23-failure-modes-mast-groupthink/) đưa ra breaker và kiểm toán.
