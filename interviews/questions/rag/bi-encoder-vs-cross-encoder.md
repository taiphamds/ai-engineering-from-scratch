---
id: bi-encoder-vs-cross-encoder
title: The retriever model and the reranker model
card: rag
kind: concept
level: 1
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-depth]
tags: [reranking, cross-encoder, bi-encoder, latency]
minutes: 6
lessons: [phases/19-capstone-projects/66-reranker-cross-encoder, phases/11-llm-engineering/07-advanced-rag]
manuals: []
practice: []
cheatsheet: [rag-production]
related: [rag/rerank-pool-size, rag/cross-encoder-passes-per-query]
updated: 2026-11-03
---

Một pipeline truy xuất dùng một mô hình để tìm các chunk ứng viên và một mô hình thứ hai để sắp xếp chúng. Giải thích mỗi mô hình thấy gì ở đầu vào, và tại sao mô hình thứ hai không chạy trên toàn bộ kho ngữ liệu.

## Short answer

Một bi-encoder nhúng truy vấn và từng tài liệu riêng rẽ và so sánh các vector, nên mỗi vector tài liệu được tính một lần ở thời điểm lập chỉ mục. Một cross-encoder đọc truy vấn và một tài liệu cùng nhau như một chuỗi duy nhất và xuất ra một điểm liên quan, nên nó có thể thấy hai văn bản tương tác như thế nào. Điểm đó tốn một lượt truyền xuôi cho mỗi cặp, nên cross-encoder chỉ chạy trên một danh sách ứng viên ngắn.

## Full answer

### Input shape

Bi-encoder ánh xạ một văn bản thành một vector. Vector truy vấn và các vector tài liệu nằm trong cùng không gian, và thứ hạng là cosine giữa chúng. Hai biểu diễn mã hóa không bao giờ thấy nhau, nên mô hình phải nén mọi thứ hữu ích về một tài liệu vào một vector mà không biết câu hỏi.

Cross-encoder nhận `[CLS] query_tokens [SEP] document_tokens [SEP]` như một chuỗi. Attention chạy qua chỗ nối, nên mọi token tài liệu có thể chú ý tới mọi token truy vấn. Đầu ra ở vị trí đầu đi vào một head tuyến tính cho ra một con số.

### Cost

Bi-encoder nhúng một lần và trả lời truy vấn mãi mãi. Cross-encoder chạy một lần cho mỗi cặp. Trên một kho ngữ liệu 10 triệu tài liệu, đó là 10 triệu lượt truyền xuôi cho một truy vấn, điều không ngân sách yêu cầu nào cho phép. Bài học RAG nâng cao đặt khoảng cách ở mức chậm hơn một bi-encoder từ 100 đến 1000 lần.

### Staging

Truy xuất top N bằng mô hình rẻ, rồi xếp hạng lại N xuống K bằng mô hình đắt. N nhỏ, 50 đến 200. Chất lượng là chất lượng cross-encoder, bị chặn bởi recall của giai đoạn đầu ở N. Một N thấp giới hạn chất lượng, không chỉ độ trễ.

Điểm phù hợp cho production là một cross-encoder khoảng 22M tham số. Các reranker lớn hơn được giữ cho công việc offline hoặc cho một K rất nhỏ.

## Follow-ups

- **Level 1:** Đầu ra nào trong hai đầu ra bạn có thể tính trước khi có bất kỳ truy vấn nào đến? Expected: các vector tài liệu bi-encoder; một điểm cross-encoder phụ thuộc vào truy vấn.
- **Level 2:** Điều gì giới hạn chất lượng của pipeline hai giai đoạn? Expected: recall của giai đoạn đầu ở N, vì reranker chỉ có thể sắp xếp lại những gì retriever trả về.
- **Level 2:** Thứ tự của hai văn bản trong cặp có quan trọng không? Expected: có, cross-encoder không đối xứng; đưa truy vấn trước, nếu không recall sụp đổ.
- **Level 3:** Một nhóm hứa p95 dưới 100 ms với một reranker 22M tham số. Bạn lên kế hoạch gì trước? Expected: bộ nhớ, vì trọng số tốn 88 MB ở float32, và batching, vì chấm điểm N ứng viên từng cái một nhân độ trễ lên N lần.

## Wrong answers

- "Cross-encoder là một mô hình embedding tốt hơn." Nó không tạo một embedding; nó tạo một điểm cho một truy vấn và một tài liệu.
- "Chạy cross-encoder trên mọi chunk để có chất lượng tốt nhất." Trên một kho ngữ liệu 10 triệu tài liệu, đó là 10 triệu lượt truyền xuôi cho mỗi truy vấn.
- "Một reranker lớn hơn luôn thắng." Lớp 22M tham số là điểm phù hợp cho production; các mô hình lớn hơn mất nhiều độ trễ hơn những gì chúng thu được và được giữ cho xếp hạng lại offline hoặc một K rất nhỏ.

## Taught in

Bài học [cross-encoder](../../../phases/19-capstone-projects/66-reranker-cross-encoder/) xây dựng pipeline hai giai đoạn, và bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) cung cấp khoảng cách chi phí.
