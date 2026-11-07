---
id: rrf-beats-score-sum
title: Why hybrid search fuses ranks and not scores
card: rag
kind: concept
level: 2
roles: [applied-ai-engineer, ai-data-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-depth]
tags: [rrf, hybrid-search, rank-fusion, bm25]
minutes: 8
lessons: [phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense, phases/11-llm-engineering/07-advanced-rag]
manuals: []
practice: [reciprocal-rank-fusion]
cheatsheet: [rag-production]
related: [rag/read-the-rrf-function, rag/error-code-query-misses]
updated: 2026-11-03
---

Bạn có một danh sách xếp hạng BM25 và một danh sách xếp hạng vector cho cùng truy vấn. Một kỹ sư đề xuất gộp chúng thành alpha nhân điểm BM25 cộng một trừ alpha nhân cosine. Điều đó sai ở đâu, và bạn làm gì thay vào đó?

## Short answer

Các điểm BM25 không bị chặn và thay đổi theo kho ngữ liệu, trong khi một cosine nằm giữa -1 và 1, nên một tổng có trọng số cần một alpha mới mỗi lần bạn lập chỉ mục lại. Reciprocal rank fusion thay vào đó gộp theo thứ hạng: mỗi tài liệu nhận tổng, trên các danh sách, của một chia cho k cộng thứ hạng của nó, với k bằng 60. Các thứ hạng có thể so sánh giữa hai retriever, nên không có gì phải hiệu chuẩn.

## Full answer

### The formula and one worked case

Một tài liệu ở hạng 1 trong danh sách vector và hạng 5 trong danh sách BM25 nhận 1/(60+1) + 1/(60+5) = 0.0164 + 0.0154 = 0.0318. Một tài liệu ở hạng 3 và hạng 2 nhận 1/(60+3) + 1/(60+2) = 0.0159 + 0.0161 = 0.0320. Tài liệu thứ hai thắng sít sao: một tài liệu tốt trong cả hai danh sách đánh bại một tài liệu đứng đầu một danh sách và nằm sâu trong danh sách kia.

### What k does

Với k bằng 60, hạng 1 đóng góp 1/61 và hạng 10 đóng góp 1/70. Đóng góp suy giảm chậm, nên các ứng viên sâu vẫn bỏ phiếu. Một k nhỏ hơn để các kết quả đầu chi phối. Một k lớn hơn làm phẳng đường cong.

### Why ranks and not scores

Một tổ hợp tuyến tính của các điểm cần một alpha được tinh chỉnh theo từng kho ngữ liệu, và nó hỏng ở mỗi lần lập chỉ mục lại vì độ phân tán điểm BM25 dịch chuyển. Các thứ hạng không có thang đo. Bài học capstone lưu ý rằng baseline dựa trên thứ hạng đã đánh bại nội suy điểm trong mọi track TREC công khai kể từ 2010, và rằng các công cụ tìm kiếm production có ghi tài liệu về tìm kiếm lai đã đi đến cùng kết luận.

### A knob that keeps the method honest

Nếu bạn có bằng chứng rằng một retriever đánh bại retriever kia trên dữ liệu của bạn, nhân đóng góp thứ hạng của nó với một trọng số. Hình dạng suy giảm thứ hạng giữ nguyên và phương pháp vẫn độc lập với thang đo.

## Follow-ups

- **Level 2:** Hằng số k kiểm soát gì? Expected: mức nhanh mà đóng góp suy giảm theo thứ hạng; ở 60, hạng 1 cho 1/61 và hạng 10 cho 1/70, nên các ứng viên sâu vẫn được tính.
- **Level 2:** Khi nào bạn hạ k? Expected: khi kết quả đầu của mỗi danh sách nên chi phối thứ tự hợp nhất.
- **Level 3:** Bạn biết BM25 tốt hơn trên kho ngữ liệu của mình. Bạn biểu diễn điều đó bằng cách nào? Expected: một trọng số theo từng danh sách nhân đóng góp thứ hạng của danh sách BM25; hình dạng suy giảm và đặc tính độc lập với thang đo đều giữ lại.
- **Level 3:** Tại sao phương pháp thứ hạng sống sót qua một lần lập chỉ mục lại khi tổng có trọng số không thể? Expected: các thứ hạng giữ ý nghĩa khi kho ngữ liệu thay đổi, trong khi điểm BM25 và độ phân tán của chúng dịch chuyển, nên alpha đã tinh chỉnh không còn phù hợp.

## Wrong answers

- "Chuẩn hóa cả hai điểm vào một khoảng từ không đến một và cộng chúng." Hai phân phối vẫn khác theo từng truy vấn và từng kho ngữ liệu, nên sự cân bằng đã tinh chỉnh trôi dạt sau một lần lập chỉ mục lại.
- "Lấy tài liệu có điểm cao nhất trong một trong hai danh sách." Một điểm BM25 không bị chặn khi đó chi phối mọi truy vấn; thứ hạng là đơn vị có thể so sánh.
- "Hợp nhất chỉ là một cách phá hòa giữa hai danh sách." Trong demo, nó quyết định kết quả đầu trên mọi lớp truy vấn; một tài liệu tốt trong cả hai danh sách đánh bại một tài liệu chỉ đứng đầu trong một danh sách.

## Taught in

Bài học [truy xuất lai](../../../phases/19-capstone-projects/65-hybrid-retrieval-bm25-dense/) cung cấp công thức đã công bố, vai trò của k và lập luận chống nội suy điểm, và bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) giải ví dụ hai tài liệu.
