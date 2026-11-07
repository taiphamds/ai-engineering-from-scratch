---
id: pick-the-query-rewriter
title: Which query rewriter fits a two-topic question
card: rag
kind: tradeoff
level: 2
roles: [applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [ml-depth, system-design]
tags: [query-rewriting, hyde, multi-query, decomposition]
minutes: 9
lessons: [phases/19-capstone-projects/67-query-rewriting-hyde, phases/11-llm-engineering/07-advanced-rag]
manuals: []
practice: []
cheatsheet: [rag-production]
related: [rag/hyde-invents-a-symbol]
updated: 2026-11-03
---

Pipeline của bạn cung cấp ba bộ viết lại truy vấn: viết một câu trả lời giả định và tìm kiếm bằng nó, viết nhiều cách diễn đạt lại và gộp, hoặc phân rã nó thành các câu hỏi con và gộp. Một người dùng hỏi "nhóm của chúng ta làm gì khi upload thất bại và ngân sách đã hết?" Bộ viết lại nào phù hợp, và khi nào mỗi bộ trong hai bộ còn lại là lựa chọn đúng?

## Short answer

Chia nó, vì câu hỏi nối hai chủ đề bằng một liên từ, một lần upload thất bại và một ngân sách cạn kiệt, và không chunk đơn lẻ nào giữ cả hai. Câu trả lời giả định phù hợp với một câu hỏi nhiều thuật ngữ chuyên môn có các từ không khớp từ vựng kho ngữ liệu. Các cách diễn đạt lại phù hợp với một câu hỏi ngắn có thể được hỏi theo nhiều cách tốt ngang nhau.

## Full answer

### The three, side by side

| Bộ viết lại | Nó làm gì | Thắng khi | Thua khi |
|---|---|---|---|
| Câu trả lời giả định | mô hình viết một đoạn bằng giọng kho ngữ liệu; embedding của nó thay vector truy vấn | truy vấn và kho ngữ liệu dùng các từ khác nhau | mô hình bịa một định danh không có trong chỉ mục |
| Các cách diễn đạt lại | mô hình viết N bản viết lại; truy xuất từng bản; gộp các danh sách bằng hợp nhất thứ hạng | bất kỳ cách nào trong nhiều cách diễn đạt đều sẽ hỏi tốt hơn | các bản viết lại đều hội tụ, nên việc gộp bằng một lần truy xuất |
| Các câu hỏi con | mô hình chia câu hỏi; truy xuất từng phần; gộp | câu hỏi có các liên từ hoặc hai chủ đề không liên quan | câu hỏi là nguyên tử nhưng vẫn bị chia |

### Costs

Mỗi bộ viết lại thêm một lệnh gọi mô hình trước truy xuất, và bài học RAG nâng cao đặt câu trả lời giả định ở mức thêm 500 đến 2000 ms. Các lần truy xuất sau lệnh gọi chạy song song, nên lệnh gọi mô hình là mức sàn. Cache đầu ra bộ viết lại theo một hash của truy vấn, vì nhiều truy vấn lặp lại.

### Guards

- Giới hạn đoạn giả định ở hai hoặc ba câu; các đoạn dài hơn thu nhiễu, các đoạn ngắn hơn mất tín hiệu từ vựng.
- Thêm một chỉ dẫn đa dạng tường minh vào prompt diễn đạt lại, và bỏ các bản gần trùng theo độ trùng Jaccard.
- Kiểm tra các câu hỏi con khác biệt trước khi fan-out, để một câu hỏi nguyên tử được trả về không đổi.

### Choosing per query

Bài học đầu cuối chọn một chiến lược từ các heuristic về độ dài truy vấn, các liên từ và tỷ lệ thuật ngữ chuyên môn. Lựa chọn khác là chạy cả ba song song và hợp nhất ba tập kết quả; chi phí là ba lệnh gọi mô hình và một lần hợp nhất.

## Follow-ups

- **Level 2:** Một bộ viết lại tốn bao nhiêu độ trễ? Expected: một lệnh gọi mô hình trước truy xuất, 500 đến 2000 ms cho một câu trả lời giả định trong bài học RAG nâng cao, với các lần truy xuất sau đó chạy song song.
- **Level 2:** Các cách diễn đạt lại quay về gần như giống hệt nhau. Điều gì xảy ra và bạn thay đổi gì? Expected: danh sách gộp bằng một lần truy xuất; thêm một chỉ dẫn đa dạng và bỏ các bản gần trùng theo độ trùng Jaccard.
- **Level 3:** Bộ chia biến một câu hỏi nguyên tử thành ba phần. Thiệt hại và biện pháp bảo vệ là gì? Expected: cùng tài liệu quay về ba lần ở thứ hạng thấp hơn và việc gộp tệ hơn; kiểm tra các phần khác biệt trước khi fan-out.
- **Level 3:** Hệ thống đầu cuối chọn mà không có con người bằng cách nào? Expected: các heuristic về độ dài, các liên từ và tỷ lệ thuật ngữ chuyên môn, hoặc chạy cả ba và hợp nhất.

## Wrong answers

- "Luôn viết câu trả lời giả định, nó mạnh nhất." Nó nối một khoảng cách từ vựng và không làm gì cho một câu hỏi hai chủ đề; một định danh bịa ra cũng có thể làm hại phía từ vựng.
- "Một bộ viết lại sửa một retriever yếu." Nó chỉ chuyển truy vấn gần giọng kho ngữ liệu hơn; một bộ chia chunk đã cắt câu trả lời vẫn thua.
- "Chia mọi truy vấn thành các câu hỏi con." Các câu hỏi nguyên tử bị chia quá mức và quay về tệ hơn bản gốc.

## Taught in

Bài học [viết lại truy vấn](../../../phases/19-capstone-projects/67-query-rewriting-hyde/) xây dựng ba bộ viết lại và các chế độ lỗi của chúng, và bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) cung cấp chi phí độ trễ.
