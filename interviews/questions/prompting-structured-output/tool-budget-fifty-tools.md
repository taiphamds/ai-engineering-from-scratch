---
id: tool-budget-fifty-tools
title: What fifty tool definitions cost on every call
card: prompting-structured-output
kind: estimate
level: 3
roles: [agentic-ai-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, screen]
tags: [context-engineering, tool-pruning, token-budget, estimate]
minutes: 9
lessons: [phases/11-llm-engineering/05-context-engineering]
manuals: []
practice: []
cheatsheet: [context-engineering]
related: [prompting-structured-output/lost-in-the-middle-order, prompting-structured-output/tool-description-is-a-prompt]
updated: 2026-11-03
---

Một trợ lý lập trình cung cấp 50 công cụ, mỗi công cụ được định nghĩa bằng một tên, một mô tả và một schema tham số. Ước lượng các định nghĩa công cụ tốn bao nhiêu trên mỗi lệnh gọi, và nói bạn sẽ cắt chi phí đó bằng cách nào mà không loại một công cụ nào khỏi sản phẩm.

## Short answer

Mỗi định nghĩa tốn 50 đến 200 token, nên 50 công cụ với 150 token mỗi công cụ là 7,500 token trước khi hội thoại bắt đầu, lặp lại trên mỗi lệnh gọi. Phân loại ý định của truy vấn và chỉ bao gồm các công cụ phù hợp với nó; bài học đặt mức giảm ở 60 đến 80 phần trăm, từ khoảng 8,000 token xuống khoảng 1,000. Sản phẩm giữ mọi công cụ; chỉ danh sách định nghĩa theo từng lệnh gọi thay đổi.

## Full answer

### The count in context

Phân tích của bài học cho một trợ lý lập trình: system prompt 500 token, định nghĩa công cụ cho 50 công cụ 8,000, tài liệu được truy xuất 4,000, lịch sử cho mười lượt 6,000, truy vấn 200, và ngân sách sinh 4,000, tổng cộng 22,700 token. Block công cụ là mục lớn nhất, và khác với lịch sử, nó không phụ thuộc vào hội thoại đã kéo dài bao lâu.

### Why it repeats

Các định nghĩa nằm trong ngữ cảnh, nên một hội thoại 50 lượt trả phí cho toàn bộ block 50 lần. Mỗi token của nó cũng chiếm chỗ một token có thể mang tín hiệu, đó là điểm của context engineering: cửa sổ là một tài nguyên khan hiếm, không phải một bãi chứa.

### Pruning without removing

1. Phân loại ý định của truy vấn. Bài học làm điều đó bằng các danh sách từ khóa theo từng ý định: mã, lịch, email, nghiên cứu, dữ liệu.
2. Gắn tag cho mỗi công cụ bằng các danh mục mà nó phục vụ.
3. Bao gồm các công cụ có danh mục khớp với các ý định, theo thứ tự, cho đến khi đạt ngân sách token; bộ chọn của bài học dừng ở 2,000 token.
4. Một câu hỏi về mã không bao giờ thấy các công cụ lịch, và một câu hỏi lên lịch không bao giờ thấy các công cụ hệ thống file.

### Check the cost of being wrong

Việc cắt tỉa có nguy cơ bỏ sót một công cụ mà bộ phân loại không dự đoán. Bài tập của bài học đo mức thành công tác vụ khi bao gồm 5, 10, 20 và 50 công cụ và so sánh các đường cong; một điểm ưu tiên cho từng công cụ, được điền theo thứ tự giảm dần cho đến khi dùng hết ngân sách, là bước cải tiến so với lựa chọn nhị phân bao gồm hoặc loại trừ.

## Follow-ups

- **Level 3:** Tại sao chi phí lặp lại? Expected: các định nghĩa nằm trong ngữ cảnh trên mỗi lệnh gọi, nên một hội thoại 50 lượt trả phí cho toàn bộ block 50 lần.
- **Level 3:** Bài học chọn các công cụ để gửi bằng cách nào? Expected: phân loại ý định bằng từ khóa trên truy vấn, rồi thêm các công cụ có danh mục khớp cho đến khi đạt ngân sách 2,000 token.
- **Level 4:** Cắt tỉa có nguy cơ gì, và bạn kiểm tra nó bằng cách nào? Expected: một công cụ cần thiết bị bỏ sót do đọc sai truy vấn; đo mức thành công tác vụ khi bao gồm 5, 10, 20 và 50 công cụ và theo dõi các lần bỏ sót theo từng ý định.
- **Level 4:** 7,500 token so với phần còn lại trong phân tích của bài học như thế nào? Expected: phân tích có tổng 22,700 token, và block công cụ khoảng 8,000 là mục lớn nhất, đứng trước lịch sử ở mức 6,000 và văn bản được truy xuất ở mức 4,000.

## Wrong answers

- "Token rẻ, gửi cả 50." Nó là block lớn nhất trong phân tích của bài học và nó lặp lại trên mỗi lệnh gọi; nó cũng chiếm chỗ ngữ cảnh mang tín hiệu.
- "Rút ngắn mọi mô tả xuống một từ." Khi đó mô hình không thể phân biệt các công cụ; cắt tỉa theo mức liên quan và giữ mỗi mô tả chính xác.
- "Loại các công cụ hiếm khi dùng khỏi sản phẩm." Sản phẩm không cần thay đổi; danh sách định nghĩa theo từng lệnh gọi thì cần.

## Taught in

Bài học [context engineering](../../../phases/11-llm-engineering/05-context-engineering/) cung cấp phân tích token, các con số cắt tỉa công cụ và bộ chọn công cụ động.
