---
id: hyde-invents-a-symbol
title: The invented passage made code search worse
card: rag
kind: debug
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [hyde, query-rewriting, bm25, hybrid-search]
minutes: 10
lessons: [phases/19-capstone-projects/67-query-rewriting-hyde, phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense]
manuals: []
practice: []
cheatsheet: [rag-production]
related: [rag/pick-the-query-rewriter, rag/error-code-query-misses]
updated: 2026-11-03
---

Bạn đã bật bộ viết lại bằng câu trả lời giả định cho một trợ lý tìm kiếm mã. Các câu hỏi về một hệ thống con trở nên tệ hơn: tài liệu chuẩn, trước đó nằm ở hạng 2, giờ rơi khỏi top 10 ở phía từ vựng. Các đoạn giả định đọc trôi chảy. Điều gì đã xảy ra, và bạn thay đổi gì?

## Short answer

Mô hình viết một tên hàm không tồn tại trong chỉ mục. Symbol thực mang kết quả khớp từ vựng đã biến mất khỏi truy vấn được viết lại, phần còn lại của đoạn là văn xuôi chung chung có điểm trên nhiều tài liệu, và phía dense trả về một láng giềng có vẻ hợp lý cho token bịa ra. Giới hạn đoạn giả định ở hai hoặc ba câu, hạ trọng số BM25 trong hợp nhất cho các truy vấn được viết lại, và định tuyến các truy vấn đã chứa một symbol nguyên văn bỏ qua bộ viết lại.

## Full answer

### Why the rewriter exists

Các từ của người dùng và các từ của kho ngữ liệu khác nhau. Bộ viết lại yêu cầu mô hình viết đoạn sẽ trả lời câu hỏi, bằng giọng của tài liệu, và nhúng đoạn đó thay cho truy vấn. Đoạn đó sai về mặt dữ kiện, vì mô hình không biết kho ngữ liệu của bạn, và điều đó ổn với phía dense: retriever quan tâm phân phối token, không phải sự thật.

### Why it broke here

Tìm kiếm mã là trường hợp tệ nhất cho thủ thuật này. Mô hình tự tin bịa các định danh. Ở phía từ vựng, tên bịa ra thay thế symbol thực, nên thuật ngữ hiếm duy nhất lẽ ra có điểm cao trên tài liệu đúng bị vắng mặt, và văn xuôi chung chung quanh nó phân tán điểm trên nhiều tài liệu. Ở phía dense, một token không có trong tài liệu nào vẫn nhận một vector trông có vẻ hợp lý, nên retriever trả về các láng giềng trông đúng nhưng sai. Hợp nhất chỉ hấp thụ điều đó khi phía từ vựng bỏ phiếu đúng, và ở đây nó không còn làm vậy.

### The fixes, in order

1. Giới hạn đoạn giả định ở hai hoặc ba câu. Các đoạn dài hơn thu thêm các token nhiễu; các đoạn ngắn hơn mất tín hiệu từ vựng mà thủ thuật cần.
2. Đặt trọng số danh sách BM25 thấp hơn trong hợp nhất khi truy vấn được viết lại, như bài học khuyên.
3. Chọn chiến lược theo từng truy vấn. Heuristic của bài học gửi các câu diễn đạt lại nhiều thuật ngữ chuyên môn tới câu trả lời giả định; một truy vấn đã mang symbol chính xác là một truy vấn nguyên văn, và retriever từ vựng xử lý nó ở hạng 1 mà không cần giúp.
4. Chứng minh. Phân lát đánh giá theo lớp truy vấn và so sánh recall khi có và không có bộ viết lại cho từng lát. Chỉ giữ nó bật ở nơi nó nâng recall.

## Follow-ups

- **Level 3:** Tại sao một đoạn giả định dài hơn khiến điều đó tệ hơn? Expected: nó thu thêm các token có điểm trên nhiều tài liệu; bài học giới hạn nó ở hai hoặc ba câu.
- **Level 3:** Những truy vấn nào nên bỏ qua bộ viết lại? Expected: các truy vấn đã chứa một symbol nguyên văn, vì retriever từ vựng xếp chúng đầu tiên mà không cần giúp.
- **Level 4:** Bạn chứng minh cách sửa thay vì tranh luận bằng cách nào? Expected: phân lát đánh giá theo lớp truy vấn, so sánh recall theo từng lát khi có và không có bộ viết lại, và chỉ bật nó trên các lát nó giúp ích.
- **Level 4:** Tại sao phía dense không cứu truy vấn? Expected: token bịa ra vẫn nhận một vector có vẻ hợp lý, nên retriever dense trả về các láng giềng sai trông đúng; hợp nhất chỉ sửa điều đó khi phía từ vựng bỏ phiếu đúng.

## Wrong answers

- "Bảo mô hình đừng bịa tên." Nó không thể biết những tên nào tồn tại trong kho ngữ liệu của bạn; bài học nói đoạn đó sai về mặt dữ kiện theo thiết kế.
- "Tắt bộ viết lại ở mọi nơi." Nó thắng trên các truy vấn có cách diễn đạt không khớp kho ngữ liệu; thay vào đó hãy định tuyến theo lớp truy vấn.
- "Nâng trọng số BM25 để lấy lại tín hiệu từ vựng." Tín hiệu từ vựng là phần token bịa ra đã phá; bài học hạ trọng số BM25 cho truy vấn được viết lại.

## Taught in

Bài học [viết lại truy vấn](../../../phases/19-capstone-projects/67-query-rewriting-hyde/) nêu lỗi định danh bịa ra và hai cách sửa, và bài học [truy xuất lai](../../../phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/) giải thích mỗi retriever làm gì với một token ngoài từ vựng.
