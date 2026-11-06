---
id: vendor-patterns-to-primitives
title: Translate eight harness patterns into primitives
card: agents
kind: concept
level: 4
roles: [agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [ml-depth, system-design]
tags: [primitives, harness, queues, authorization, session-persistence]
minutes: 15
lessons: [phases/14-agent-engineering/31-agent-workbench-why-models-fail]
manuals: []
practice: []
cheatsheet: [agent-harness, production-agent-runtimes]
related: [agents/harness-or-a-smarter-model]
updated: 2026-11-03
---

Một bộ slide nhà cung cấp liệt kê các tính năng harness của họ: một vòng lặp chèn lại ý định gốc khi agent cố dừng sớm, một sự tách lập kế hoạch-thực thi-xác minh, tách mặt phẳng điều khiển, các hộ chiếu lời gọi công cụ đã ký, nén ngữ cảnh tăng tiến, hook, các skill có tiết lộ tăng tiến, và các agent trong sandbox. Chuyển mỗi thứ thành primitive mà nó là, và nói bộ slide bỏ sót gì.

## Short answer

Mỗi mục là một primitive hệ thống phân tán với một tên mới. Vòng lặp chèn lại là một trigger đưa nhiệm vụ lại vào hàng đợi với ngữ cảnh mới, lập kế hoạch-thực thi-xác minh là ba worker có một hàng đợi giữa chúng, hộ chiếu là một chính sách ủy quyền được một worker trước hành động thực thi, và nén ngữ cảnh là một worker quản lý trạng thái trên lưu giữ phiên. Các hook là các trigger quanh đường gọi, các skill là một registry hàm có metadata nạp đúng lúc, các sandbox là mặt phẳng tính toán, và mục mặt phẳng điều khiển là sự tách mặt phẳng điều khiển và mặt phẳng dữ liệu có trước các agent. Các bộ slide thường bỏ sót hàng đợi, worker là đơn vị triển khai, ngữ nghĩa trigger, lưu giữ là mối quan tâm riêng và ủy quyền là một mặt phẳng riêng.

## Full answer

### The eight primitives

| Primitive | Nó mang gì cho một agent |
|---|---|
| Hàm | Một lời gọi công cụ, một phép kiểm tra quy tắc, một bước xác minh, một lời gọi mô hình |
| Worker | Người xây dựng, người đánh giá, bộ xác minh, một server giao thức |
| Trigger | Một nhịp vòng lặp, một yêu cầu HTTP, một thông điệp hàng đợi, một cron, một thay đổi file, một hook |
| Runtime | Ranh giới quyết định thứ gì chạy ở đâu, với các timeout và tài nguyên nào |
| HTTP hoặc RPC | Đường truyền giữa bên gọi và worker, bao gồm giao thức lời gọi công cụ và API mô hình |
| Hàng đợi | Bộ đệm bền vững có back-pressure, thử lại và tính idempotent: bảng nhiệm vụ, log phản hồi, hộp thư đánh giá |
| Lưu giữ phiên | File trạng thái, checkpoint, các kho khóa-giá trị, chính repository |
| Chính sách ủy quyền | Các file được phép và bị cấm, các ranh giới phê duyệt, các danh sách khả năng |

### The translation

| Mục trong bộ slide | Nó là gì |
|---|---|
| Chèn lại ý định khi agent dừng sớm | Một trigger đưa nhiệm vụ lại vào hàng đợi với một ngữ cảnh sạch; lưu giữ mang mục tiêu về phía trước |
| Lập kế hoạch, thực thi, xác minh | Ba worker, mỗi vai trò một worker, giao tiếp qua trạng thái và một hàng đợi giữa các giai đoạn |
| Một mặt phẳng điều khiển tách khỏi mặt phẳng thực thi | Sự tách mặt phẳng điều khiển và mặt phẳng dữ liệu, đã có hàng thập kỷ |
| Một hộ chiếu ký mỗi lời gọi công cụ | Một chính sách ủy quyền được một worker trước hành động thực thi, với một hàng đợi kiểm toán đã ký |
| Nén ngữ cảnh tăng tiến | Một worker quản lý trạng thái chạy theo lịch trên lưu giữ phiên để giữ nó trong một ngân sách |
| Hook và middleware | Các trigger cộng các hàm bọc quanh đường gọi của runtime |
| Các skill tự tiết lộ từng bước | Một registry hàm có metadata được nạp vào ngữ cảnh chỉ khi cần |
| Các agent trong sandbox | Mặt phẳng tính toán: một runtime với hệ thống file, mạng và vòng đời cô lập |

### How the surfaces map

Các chỉ dẫn là chính sách cộng metadata hàm. Trạng thái là lưu giữ phiên. Phạm vi là một chính sách ủy quyền theo nhiệm vụ. Phản hồi là một log lời gọi được viết vào một hàng đợi. Xác minh là một hàm xác định được kích hoạt khi đóng nhiệm vụ và fail-closed. Đánh giá là một worker riêng có quyền chỉ đọc các sản phẩm của người xây dựng và quyền chỉ ghi các báo cáo đánh giá. Bàn giao là một bản ghi bền vững được một trigger cuối phiên phát ra và được trigger khởi động phiên tiếp theo đọc.

### What the decks leave out

Bài học đọc các bài viết đang lưu hành và tìm cùng khoảng trống: chúng mô tả harness là một đối tượng bạn cấu hình, không là một hệ thống bạn triển khai. Chúng hiếm khi nêu hàng đợi, worker là một đơn vị triển khai, ngữ nghĩa trigger, lưu giữ phiên là một mối quan tâm riêng, hoặc một chính sách ủy quyền là mặt phẳng riêng. Dòng mạnh nhất trong tài liệu đó, rằng harness là ranh giới bảo mật chính, là chính sách ủy quyền được phát biểu lại. Khi hệ thống được dựng từ các primitive, các bề mặt xuất hiện từ nó. Khi hệ thống được dựng mà không có chúng, không lượng trau chuốt file chỉ dẫn nào thay thế hàng đợi bị thiếu.

### Why the translation matters

Từ vựng thay đổi mỗi chu kỳ phát hành. Các primitive không thay đổi. Một nhóm chuyển mỗi mẫu mới trước khi áp dụng nó có thể so sánh các nhà cung cấp trên một bảng, phát hiện một mẫu là hai primitive mang một tên, và nhận thấy khi một bộ slide không có câu trả lời cho lưu giữ hoặc ủy quyền.

## Follow-ups

- **Level 3:** Primitive nào thường thiếu nhất ở một sản phẩm agent trông hoàn chỉnh về mặt khác? Expected: hàng đợi, vì không có một bộ đệm bền vững bảng, log phản hồi và hộp thư đánh giá là các thông điệp trò chuyện cuộn mất.
- **Level 3:** Bộ slide nói các hook của nó là một ranh giới bảo mật. Kiểm tra khẳng định. Expected: một hook là một trigger cộng một hàm bên trong runtime, và một ranh giới bảo mật là một chính sách ủy quyền được thực thi ngoài tầm với của agent, nên hỏi chính sách nằm ở đâu và ai có thể thay đổi nó.
- **Level 4:** Hai nhà cung cấp mô tả cùng thứ là một bản bàn giao và một checkpoint. Bạn phân biệt thế nào? Expected: ánh xạ cả hai đến lưu giữ và trigger, và xem liệu bản ghi được trigger khởi động phiên tiếp theo đọc, khiến nó là một bản bàn giao, hay được cùng phiên đọc khi tiếp tục, khiến nó là một checkpoint.
- **Level 4:** Điều gì sẽ làm một primitive thứ chín hợp lệ? Expected: một khả năng không thể dựng từ tám primitive, điều hiếm, nên phép kiểm tra đầu tiên là liệu nó có phải một dạng trạng thái dùng chung hoặc một dạng chính sách bạn chưa thấy hay không.

## Wrong answers

- "Các mẫu này mới vì các agent mới." Mỗi mẫu có một tên trong hệ thống phân tán, và nhãn agent thay đổi từ vựng chứ không phần kỹ thuật.
- "Chọn nhà cung cấp có nhiều mẫu nhất." Nhiều tên hơn trên một bộ slide không phải nhiều primitive được bao phủ hơn, và câu hỏi là primitive nào trong tám primitive bị thiếu.
- "Một file chỉ dẫn tốt là harness." Các chỉ dẫn là chính sách và metadata hàm, một trong tám, và một file không thể thay thế một hàng đợi hoặc một lớp lưu giữ.

## Taught in

[Bài học tại sao các mô hình có năng lực vẫn thất bại](../../../phases/14-agent-engineering/31-agent-workbench-why-models-fail/) đưa ra bảng primitive, việc chuyển các mẫu đang lưu hành và các khoảng trống trong các bài viết nhà cung cấp.
