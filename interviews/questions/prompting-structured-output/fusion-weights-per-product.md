---
id: fusion-weights-per-product
title: Tune a three-store memory for three products
card: prompting-structured-output
kind: design
level: 4
roles: [agentic-ai-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design]
tags: [agent-memory, hybrid-memory, fusion-scoring, scope]
minutes: 15
lessons: [phases/14-agent-engineering/09-hybrid-memory-mem0, phases/14-agent-engineering/07-memory-virtual-context-memgpt]
manuals: []
practice: []
cheatsheet: [context-engineering]
related: [prompting-structured-output/take-home-two-tier-memory, prompting-structured-output/sleep-time-consolidation]
updated: 2026-11-03
---

Bạn sở hữu lớp bộ nhớ cho ba sản phẩm trên một nền tảng: một trợ lý chat tiêu dùng, một agent đánh giá tuân thủ và một agent truy xuất nghiên cứu. Hệ thống bộ nhớ chạy một vector store, một key-value store và một graph store song song và hợp nhất các kết quả. Bạn cấu hình hợp nhất cho mỗi sản phẩm như thế nào, và sai lầm phạm vi nào sẽ khiến bạn bị gọi trực?

## Short answer

Điểm hợp nhất là một tổng có trọng số của độ liên quan, độ quan trọng và độ mới, và các trọng số được tinh chỉnh theo sản phẩm: tăng độ mới cho trợ lý chat, tăng độ quan trọng cho agent tuân thủ, tăng độ liên quan cho agent truy xuất. Mỗi kho thắng một lớp truy vấn các kho khác bỏ lỡ, nên các trọng số điều hướng lớp nào chi phối mà không bỏ một kho. Sai lầm gây gọi trực là một rò rỉ phạm vi: mọi lần ghi chọn phạm vi người dùng, phiên hoặc agent, và một truy xuất trộn các phạm vi không có trọng số theo phạm vi kể cho một người dùng về dự án của người dùng khác.

## Full answer

### Why three stores

| Lớp truy vấn | Ví dụ | Bên thắng |
|---|---|---|
| Độ tương tự ngữ nghĩa | chúng ta đã thảo luận gì về drift tuần trước | vector |
| Tra cứu sự thật | số điện thoại người dùng | key-value, có khóa theo người dùng, loại sự thật và thực thể |
| Suy luận quan hệ | các khách hàng nào chia sẻ một thực thể thanh toán | graph, như các cạnh có kiểu |

Một kho đơn sai cho hai trong ba lớp. Một lần ghi trích xuất các sự thật từ văn bản và ghi mỗi sự thật vào cả ba kho; một tìm kiếm chạy cả ba và hợp nhất.

### The fusion

Điểm là `w_relevance * relevance + w_importance * importance + w_recency * recency`. Độ liên quan là cosine, khớp khóa chính xác hoặc trọng số đường graph. Độ quan trọng được gắn lúc ghi hoặc được học. Độ mới suy giảm theo thời gian từ lần ghi hoặc đọc cuối. Nó là một tổng có trọng số và không phải phân cấp, vì một phân cấp sẽ khiến hai trong ba lớp chờ sai kho.

| Sản phẩm | Trọng số cần tăng | Tại sao |
|---|---|---|
| Trợ lý chat | độ mới | vài lượt cuối quan trọng nhất |
| Agent tuân thủ | độ quan trọng | tên, id và policy xếp trên trò chuyện |
| Agent truy xuất | độ liên quan | câu hỏi quyết định, không phải đồng hồ |

### Temporal truth for compliance

Khi một sự thật mới mâu thuẫn một cạnh graph, cạnh cũ được đánh dấu không hợp lệ và không bao giờ bị xóa. Một câu hỏi về điều gì đúng vào tháng Ba duyệt các cạnh hợp lệ ở thời điểm đó. Agent tuân thủ phụ thuộc vào điều này.

### The scope rule

Mỗi lần ghi chọn một phạm vi: bộ nhớ người dùng lưu bền xuyên các phiên, bộ nhớ phiên sống trong một thread, bộ nhớ agent theo instance. Truy xuất có thể đọc xuyên phạm vi với trọng số theo phạm vi, nhưng một tìm kiếm trộn chúng không suy nghĩ là cách một trợ lý kể cho một người dùng về dự án của người dùng khác.

### Maintenance that scales with the corpus

- Các kết quả vector trôi khi corpus tăng; embed lại các bản ghi được dùng nhiều nhất theo lịch.
- Tập kiểu key-value tăng dần khi các nhóm thêm kiểu; kiểm toán nó hằng quý.
- Một bộ trích xuất nhiễu thêm hàng chục cạnh mỗi thông điệp; giới hạn các lần ghi graph mỗi lần thêm và bỏ các cạnh độ tự tin thấp.

## Follow-ups

- **Level 3:** Mỗi kho thắng lớp truy vấn nào? Expected: vector cho độ tương tự ngữ nghĩa, key-value cho tra cứu sự thật, graph cho suy luận quan hệ.
- **Level 4:** Tại sao một tổng có trọng số và không phải vector trước với các fallback? Expected: mỗi kho thắng một lớp khác; một phân cấp khiến hai trong ba lớp chờ sai kho.
- **Level 4:** Agent tuân thủ hỏi điều gì đúng vào tháng Ba. Kho nào trả lời, và bằng cách nào? Expected: graph, bằng duyệt các cạnh hợp lệ tại thời điểm đó; các cạnh bị mâu thuẫn được đánh dấu không hợp lệ và giữ lại.
- **Level 4:** Lỗi nào tăng theo corpus, và bảo trì là gì? Expected: embedding drift trong vector store; embed lại các bản ghi được dùng nhiều nhất định kỳ, kiểm toán tập kiểu key-value hằng quý, và giới hạn các lần ghi graph mỗi lần thêm.

## Wrong answers

- "Một vector store đủ, embedding nắm mọi thứ." Một tra cứu sự thật lãng phí trên một vector store và một truy vấn quan hệ không thể trên một kho như vậy.
- "Đặt các trọng số một lần cho nền tảng." Chat muốn độ mới, tuân thủ muốn độ quan trọng, truy xuất muốn độ liên quan; một thiết lập sai cho hai trong ba.
- "Xóa sự thật cũ khi một sự thật mới mâu thuẫn nó." Đánh dấu nó không hợp lệ và giữ, nếu không truy vấn thời gian mất lịch sử.

## Taught in

Bài học [bộ nhớ lai](../../../phases/14-agent-engineering/09-hybrid-memory-mem0/) đưa ra ba kho, công thức hợp nhất, hệ phân loại phạm vi và danh sách bảo trì, và bài học [ngữ cảnh ảo](../../../phases/14-agent-engineering/07-memory-virtual-context-memgpt/) đặt mẫu giữa các loại bộ nhớ.
