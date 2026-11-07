---
id: cross-encoder-passes-per-query
title: Count the work of a reranker over the whole index
card: rag
kind: estimate
level: 2
roles: [applied-ai-engineer, ai-data-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [reranking, cross-encoder, estimate, latency]
minutes: 8
lessons: [phases/19-capstone-projects/66-reranker-cross-encoder, phases/11-llm-engineering/07-advanced-rag]
manuals: []
practice: []
cheatsheet: [rag-production]
related: [rag/bi-encoder-vs-cross-encoder, rag/rerank-pool-size]
updated: 2026-11-03
---

Một đề xuất thay retriever vector bằng một cross-encoder chấm điểm mọi chunk trong một chỉ mục 10 triệu chunk, để không bao giờ bỏ sót gì. Ước lượng công việc cho một câu hỏi, và nói bạn đề xuất gì thay vào đó.

## Short answer

Một lượt truyền xuôi mỗi chunk nghĩa là 10 triệu lượt truyền xuôi cho một câu hỏi, điều không ngân sách yêu cầu nào cho phép. Giữ một bi-encoder cho giai đoạn đầu, vì các vector tài liệu của nó được tính một lần ở thời điểm lập chỉ mục, và chạy cross-encoder trên một nhóm 50 đến 200 ứng viên. Bài học RAG nâng cao đặt chi phí mỗi cặp ở mức 100 đến 1000 lần một phép so sánh bi-encoder.

## Full answer

### The count

| Giai đoạn | Công việc ở thời điểm lập chỉ mục | Công việc mỗi truy vấn |
|---|---|---|
| Bi-encoder | một embedding mỗi chunk, được lưu | một embedding của truy vấn, rồi một phép so sánh vector mỗi chunk |
| Cross-encoder | không có gì có thể được lưu, điểm phụ thuộc vào truy vấn | một lượt truyền xuôi mỗi cặp, nên một lượt mỗi chunk trong nhóm |

Với cross-encoder trên toàn bộ chỉ mục, nhóm là chỉ mục. Một chỉ mục 10 triệu chunk nghĩa là 10 triệu lượt cho một câu hỏi.

### The staged shape

Truy xuất một tập ứng viên lớn hơn bằng giai đoạn rẻ, chẳng hạn top 50 từ tìm kiếm lai, và xếp hạng lại bằng cross-encoder tới top 5 cuối cùng. Mô hình đắt chạy 50 lần thay vì 10 triệu, và mức tăng của nó rơi vào nơi quan trọng, trong thứ tự cuối cùng.

### Two more numbers to plan

- Một cross-encoder production khoảng 22M tham số tốn 88 MB ở float32. Nạp nó một lần và giữ nó thường trú.
- Chạy N ứng viên thành một batch. Chấm điểm từng cái một thì độ trễ nhân lên N lần.

## Follow-ups

- **Level 2:** Phần nào của chi phí bi-encoder được trả một lần? Expected: các embedding tài liệu, ở thời điểm lập chỉ mục; một truy vấn trả cho một embedding và các phép so sánh.
- **Level 2:** Tại sao mô hình đắt tự bù được chi phí trên top 50? Expected: 50 lượt vừa ngân sách yêu cầu và mức tăng tập trung trong thứ tự cuối cùng của các ứng viên.
- **Level 3:** Chỉ mục tăng gấp đôi kích thước. Giai đoạn nào tăng chi phí mỗi truy vấn? Expected: giai đoạn đầu, vì nó so sánh với mọi chunk; reranker giữ ở N lượt trong khi N cố định.
- **Level 3:** Ở quy mô này, bản thân giai đoạn đầu không phải một lần quét vét cạn. Nó dùng gì, và điều đó tốn gì? Expected: một chỉ mục láng giềng gần nhất xấp xỉ, đánh đổi một ít recall để lấy tốc độ; bài học RAG nâng cao lưu ý rằng ở 2 triệu chunk, sai số có thể đẩy một chunk liên quan ra khỏi top k.

## Wrong answers

- "Chấm điểm mọi thứ, GPU nhanh mà." 10 triệu lượt mỗi câu hỏi không phải độ trễ mà người dùng chờ, và mô hình của bài học tốn 88 MB trước bất kỳ batch nào.
- "Tính trước điểm cross-encoder cho mọi chunk." Điểm phụ thuộc vào truy vấn, nên không có gì để tính trước.
- "Dùng một cross-encoder nhỏ hơn trên toàn bộ kho ngữ liệu." Các reranker nhỏ hơn mất chất lượng nhanh hơn mức chúng tiết kiệm độ trễ, và số lượt giữ nguyên.

## Taught in

Bài học [cross-encoder](../../../phases/19-capstone-projects/66-reranker-cross-encoder/) đếm các lượt và xác định kích thước mô hình, và bài học [RAG nâng cao](../../../phases/11-llm-engineering/07-advanced-rag/) cung cấp khoảng cách chi phí và phễu từ top 50 xuống top 5.
