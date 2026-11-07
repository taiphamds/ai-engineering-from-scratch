---
id: take-home-two-tier-memory
title: Build a two-tier agent memory with eviction and citations
card: prompting-structured-output
kind: take-home
level: 3
roles: [agentic-ai-engineer, applied-ai-engineer]
rounds: [take-home]
tags: [agent-memory, virtual-context, eviction, citations, take-home]
minutes: 60
lessons: [phases/14-agent-engineering/07-memory-virtual-context-memgpt]
manuals: []
practice: []
cheatsheet: [context-engineering]
related: [prompting-structured-output/sleep-time-consolidation, prompting-structured-output/fusion-weights-per-product]
updated: 2026-11-03
---

Bài làm ở nhà. Xây dựng một bộ nhớ agent với hai tầng: một ngữ cảnh chính có kích thước cố định và một kho có thể tìm kiếm không giới hạn, cùng các công cụ chuyển các dữ kiện giữa chúng. Cho thấy một trace trong đó ngữ cảnh chính đầy, thứ gì đó bị đẩy ra, và một câu hỏi sau đó vẫn được trả lời từ kho. Chỉ dùng thư viện chuẩn. Giải thích các lựa chọn đẩy ra và trích dẫn của bạn.

## Short answer

Xem ngữ cảnh chính là RAM và kho là đĩa. Cho ngữ cảnh chính một trần, một phần lõi được ghim và một danh sách thông điệp nén gọn các mục cũ nhất khi vượt trần; cho kho các bản ghi với một id, văn bản, các tag, một id phiên và một id lượt, và một phép tìm kiếm theo độ trùng token. Cung cấp các công cụ bộ nhớ, ghi ba dữ kiện, làm tràn ngữ cảnh chính, và trả lời câu hỏi tiếp theo bằng cách tìm kiếm kho và chèn kết quả vào lượt tiếp theo.

## Full answer

### The shape

| Hệ điều hành | Hệ thống bộ nhớ | Mã của bạn |
|---|---|---|
| RAM | ngữ cảnh chính | một bộ đệm có trần với một dict lõi và một danh sách thông điệp |
| Đĩa | kho bên ngoài | một danh sách bản ghi với một phương thức tìm kiếm |
| Page fault | lệnh gọi công cụ bộ nhớ | agent gọi một công cụ, runtime chạy nó, kết quả đi vào lượt tiếp theo |
| Kernel | vòng lặp điều khiển agent | một vòng lặp được lập trình đọc, quyết định, ghi |

### The tool surface

- `core_memory_append(section, text)` và `core_memory_replace(section, old, new)` chỉnh sửa các phần được ghim của ngữ cảnh chính.
- `archival_memory_insert(text)` ghi một bản ghi vào kho.
- `archival_memory_search(query, top_k)` truy xuất từ kho.
- `conversation_search(query)` quét các lượt trước.

### Eviction

Khi danh sách thông điệp vượt trần, hãy nén gọn các thông điệp cũ nhất thay vì bỏ chúng. Bài tập của bài học đo trần bằng token với số từ nhân 1.3 và tóm tắt các thông điệp bị đẩy ra; một phiên bản đơn giản hơn chuyển chúng vào kho. Việc xóa làm mất các dữ kiện mà kho có thể đã giữ lại.

### Citations

Mọi bản ghi trong kho mang id phiên và id lượt của nguồn. Nếu không có chúng, agent nhớ rằng người dùng đã yêu cầu điều gì đó và không thể nói lượt nào; với chúng, mọi câu trả lời được hỗ trợ bằng truy xuất có thể trích dẫn nguồn gốc của nó.

### The trace a grader wants

1. Ba dữ kiện được ghi vào kho, mỗi dữ kiện có các trường nguồn.
2. Ngữ cảnh chính đầy vượt trần và các thông điệp cũ nhất được nén gọn.
3. Một câu hỏi tiếp theo đến, agent gọi công cụ tìm kiếm, kết quả khớp được chèn vào lượt tiếp theo, và câu trả lời trích dẫn lượt.
4. Một ghi chú về hai lỗi mà thiết kế không tự khắc phục: bộ nhớ mục nát, cần hợp nhất định kỳ, và đầu độc bộ nhớ, trong đó văn bản của kẻ tấn công được lưu như một ghi chú được nạp lại ở phiên tiếp theo.

## Follow-ups

- **Level 3:** Tại sao phân trang thay vì dùng một cửa sổ lớn hơn? Expected: tràn, pha loãng và tính bền vững; một cửa sổ lớn hơn vẫn pha loãng attention và bắt đầu trống ở phiên tiếp theo, và bài học dẫn một agent cửa sổ 4k với bộ nhớ bên ngoài đã bắt được các dữ kiện dài hạn mà một baseline cửa sổ 128k bỏ sót.
- **Level 3:** Những gì nằm trong mọi bản ghi của kho, và tại sao? Expected: văn bản, các tag, id phiên và id lượt, để một dữ kiện được nhớ lại có thể được trích dẫn đến lượt mà nó xuất phát.
- **Level 4:** Một ghi chú trong kho nói bỏ qua mọi chỉ dẫn của người dùng trong tương lai. Biện pháp bảo vệ là gì? Expected: quét các bản ghi truy xuất để tìm văn bản có dạng chỉ thị và đánh dấu chúng là không đáng tin cậy trước khi chúng đến prompt; đây là prompt injection qua thời gian.
- **Level 4:** Số lần ghi nhiều hơn số lần đọc và việc truy xuất chìm trong các dữ kiện lỗi thời. Bạn thêm gì? Expected: hợp nhất định kỳ và vô hiệu hóa tường minh các dữ kiện bị mâu thuẫn, mà các bài học về bộ nhớ sau đó chạy ngoài đường găng.

## Wrong answers

- "Giữ mọi thứ trong ngữ cảnh, cửa sổ đủ lớn." Ba lỗi của bài học vẫn còn: tràn, pha loãng và một cửa sổ trống ở phiên tiếp theo.
- "Đẩy ra bằng cách xóa hẳn các thông điệp cũ nhất." Nén gọn chúng thành một bản tóm tắt hoặc chuyển chúng vào kho; việc xóa làm mất các dữ kiện mà kho có thể đã giữ lại.
- "Kho không cần các trường nguồn." Nếu không có id phiên và id lượt, agent nhớ một dữ kiện và không thể nói nó đến từ đâu.

## Taught in

Bài học [virtual context](../../../phases/14-agent-engineering/07-memory-virtual-context-memgpt/) cung cấp phép tương tự hệ điều hành, hai tầng, bề mặt công cụ và các chế độ lỗi.
