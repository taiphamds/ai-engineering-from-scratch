---
id: sleep-time-consolidation
title: Move memory consolidation off the critical path
card: prompting-structured-output
kind: tradeoff
level: 3
roles: [agentic-ai-engineer, applied-ai-engineer]
rounds: [system-design, design-review]
tags: [agent-memory, memory-blocks, sleep-time, latency]
minutes: 10
lessons: [phases/14-agent-engineering/08-memory-blocks-sleep-time-compute, phases/14-agent-engineering/07-memory-virtual-context-memgpt]
manuals: []
practice: []
cheatsheet: [context-engineering]
related: [prompting-structured-output/take-home-two-tier-memory, prompting-structured-output/fusion-weights-per-product]
updated: 2026-11-03
---

Độ trễ đuôi của một trợ lý tăng lên vì mỗi lượt cũng cắt tỉa, tóm tắt và đối chiếu bộ nhớ trước khi nó trả lời. Một đề xuất chuyển công việc đó sang một agent thứ hai chạy trong lúc người dùng không hoạt động. Sự phân chia này mang lại gì, tốn gì, và tạo ra lỗi mới nào?

## Short answer

Sự phân chia đưa công việc bộ nhớ ra khỏi đường găng, nên câu trả lời không bao giờ chờ hợp nhất, và agent nền có thể là một mô hình chậm hơn và mạnh hơn vì không ai đang chờ nó. Nó tốn một agent thứ hai, một kho block dùng chung và sự phối hợp quanh chúng. Lỗi mới là trôi dạt âm thầm: agent nền viết lại một block và agent chính không bao giờ nhận thấy, nên hãy đánh phiên bản các block, hiển thị các diff trong trace, và xem bộ ghi nền là không đáng tin cậy khi nó chạm vào block persona hoặc block an toàn.

## Full answer

### What the primary agent keeps

Ba tầng. Bộ nhớ lõi luôn nằm trong prompt và được tạo thành từ các block có kiểu, mỗi block có một id, một nhãn, một giá trị, một giới hạn ký tự và một mô tả cho mô hình biết khi nào chỉnh sửa nó: một block con người, một block persona, và các block do người dùng định nghĩa như một block tác vụ hoặc an toàn. Recall là lịch sử hội thoại. Archival là kho bên ngoài. Agent chính phục vụ các lượt và thực hiện các thao tác ghi thô thông qua `block_append`, `block_replace`, `block_read` và `block_summarize`.

### What the background agent does

Nó đọc các bản ghi hội thoại và ngữ cảnh trong lúc người dùng không hoạt động, ghi ngữ cảnh đã học vào các block dùng chung, khử trùng lặp và tóm tắt, và vô hiệu hóa các dữ kiện bị mâu thuẫn. Ba đặc tính kéo theo: không tốn độ trễ trên câu trả lời, một mô hình mạnh hơn trở nên đủ khả năng chi trả, và việc hợp nhất có một khoảng thời gian tự nhiên khi không ai đang chờ.

### The three failures and their guards

| Lỗi | Biện pháp bảo vệ |
|---|---|
| Block phình to: các lần thêm chạm giới hạn ký tự | chạy bộ tóm tắt trước thao tác ghi sẽ vượt trần |
| Trôi dạt âm thầm: một block thay đổi và agent chính không bao giờ nhận thấy | đánh phiên bản các block, ghi lại giá trị cũ và diff ở mỗi lần ghi, cung cấp lịch sử theo từng block |
| Hợp nhất bị đầu độc: nội dung mà kẻ tấn công có thể tiếp cận lọt vào lõi | xem agent nền là một bộ ghi không đáng tin cậy; một thay đổi đối với block persona hoặc block an toàn cần một agent thứ hai xem xét trước khi được ghi nhận |

### Keep the heavy work in the sleep pass

Khử trùng lặp các bản ghi có văn bản trùng nhau hơn 90 phần trăm thuộc về lượt chạy nền và không bao giờ nằm trên đường găng; bài tập của bài học nói rõ điều đó.

## Follow-ups

- **Level 3:** Tại sao agent nền có thể dùng một mô hình đắt hơn? Expected: nó không bị ràng buộc về độ trễ, nên một mô hình chậm hơn và mạnh hơn là đủ khả năng chi trả.
- **Level 3:** Một block liên tục tăng lên gần giới hạn của nó. Thành phần nào chạy, và khi nào? Expected: bộ tóm tắt block, trước thao tác ghi sẽ đẩy block vượt trần; ngưỡng kích hoạt đánh đổi các lệnh gọi tóm tắt với việc tràn.
- **Level 4:** Bạn làm cho một lần viết lại ở nền trở nên hiển thị bằng cách nào? Expected: đánh phiên bản mọi block, ghi lại giá trị cũ và một diff ở mỗi lần ghi, và cung cấp lịch sử theo từng block để người vận hành có thể thấy tại sao agent quên điều gì đó.
- **Level 4:** Agent nền đọc nội dung mà kẻ tấn công có thể tiếp cận. Biện pháp kiểm soát là gì? Expected: xem nó là một bộ ghi không đáng tin cậy; một thay đổi đối với block persona hoặc block an toàn cần một agent thứ hai xem xét trước khi được ghi nhận.

## Wrong answers

- "Chạy việc hợp nhất ở cuối mỗi lượt, nó nhanh mà." Nó nằm trên đường găng và độ trễ đuôi là điều đang bị phàn nàn; mục đích của sự phân chia là câu trả lời không bao giờ chờ.
- "Dùng mô hình rẻ nhất cho agent nền để tiết kiệm tiền." Đó là nơi duy nhất một mô hình mạnh hơn là đủ khả năng chi trả, và các lần viết lại của nó định hình mọi lượt sau đó.
- "Cũng khử trùng lặp trên đường găng, đó là cùng mã mà." Bài học chỉ chạy khử trùng lặp trong lượt chạy khi nghỉ, không bao giờ trong lúc người dùng chờ.

## Taught in

Bài học [memory blocks](../../../phases/14-agent-engineering/08-memory-blocks-sleep-time-compute/) cung cấp ba tầng, mẫu block, agent nền và các chế độ lỗi của nó, và bài học [virtual context](../../../phases/14-agent-engineering/07-memory-virtual-context-memgpt/) thiết lập mẫu hai tầng mà nó mở rộng.
