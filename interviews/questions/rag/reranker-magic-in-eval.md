---
id: reranker-magic-in-eval
title: The reranker is perfect offline and worse in production
card: rag
kind: debug
level: 2
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [reranking, cross-encoder, eval-leak, rag-eval]
minutes: 8
lessons: [phases/19-capstone-projects/66-reranker-cross-encoder, phases/19-capstone-projects/69-end-to-end-rag-system]
manuals: []
practice: []
cheatsheet: [rag-production, llm-evaluation]
related: [rag/rerank-pool-size, rag/bi-encoder-vs-cross-encoder]
updated: 2026-11-03
---

Một reranker cross-encoder mới nâng MRR trên fixture offline lên một giá trị gần hoàn hảo. Trong production, cùng reranker khiến kết quả đầu tệ hơn chỉ dùng retriever. Liệt kê các nguyên nhân bạn kiểm tra, theo thứ tự, và nói mỗi nguyên nhân biểu hiện như thế nào.

## Short answer

Kiểm tra dữ liệu huấn luyện trước: nếu các cặp huấn luyện được gán nhãn tay bao gồm các truy vấn đánh giá, đánh giá là một bài kiểm tra trí nhớ và mức tăng là giả. Rồi kiểm tra thứ tự cặp trong production, vì một cross-encoder không đối xứng và một truy vấn và tài liệu đổi chỗ làm recall sụp đổ. Rồi kiểm tra nhóm ứng viên, vì các ứng viên production đến từ bi-encoder thực, và recall ở N của nó giới hạn những gì reranker có thể thấy.

## Full answer

### Cause 1: the eval leaked into training

Bài học reranker cảnh báo rằng nếu các cặp huấn luyện được gán nhãn tay bao gồm các truy vấn đánh giá, việc xếp hạng lại trông kỳ diệu. Bài học đầu cuối làm điểm đó cụ thể: 14 bộ ba huấn luyện của nó giống các truy vấn đánh giá, nên demo cố ý giữ các truy vấn đánh giá không giao nhau. Một rò rỉ biểu hiện thành một fixture gần hoàn hảo và một kết quả production trông như một mô hình khác.

### Cause 2: the pair is swapped

Điểm cho truy vấn theo sau bởi tài liệu không phải điểm cho tài liệu theo sau bởi truy vấn. Luôn đưa truy vấn trước. Một lần đổi chỗ biểu hiện thành một sự sụp đổ, không phải trôi dạt, vì mọi điểm được tính theo sai hướng.

### Cause 3: the pool is not the production pool

Một fixture offline có thể trao cho reranker một nhóm dựng lên luôn chứa chunk chuẩn. Trong production, nhóm đến từ bi-encoder, và reranker không thể nâng recall cao hơn recall bi-encoder ở N. Cách sửa của bài học là ghim bi-encoder, cross-encoder và N cùng nhau; một thay đổi trong bất kỳ thứ nào vô hiệu hóa đánh giá.

### What to log so the next one is cheaper

Ghi nhật ký điểm cross-encoder rank-1 theo từng truy vấn. Một điểm cao nhất dưới một ngưỡng kho ngữ liệu đánh dấu một truy vấn ngoài lĩnh vực, và một dịch chuyển trong phân phối điểm sau một bản phát hành đánh dấu một suy giảm trước người dùng.

## Follow-ups

- **Level 2:** Bạn khiến rò rỉ trở nên không thể bằng cách nào? Expected: giữ nghiêm ngặt các truy vấn đánh giá ngoài các bộ ba huấn luyện, ngay cả trên một fixture, như bài học đầu cuối làm.
- **Level 2:** Một cặp đổi chỗ trông như thế nào trong các con số? Expected: một sự sụp đổ thay vì một sự trôi dạt, vì mọi điểm được tính cho sai hướng.
- **Level 3:** Tại sao một nhóm ứng viên tổng hợp thổi phồng kết quả offline? Expected: nó có thể chứa chunk chuẩn mọi lần, trong khi recall ở N của bi-encoder thực giới hạn những gì reranker thấy trong production.
- **Level 3:** Bạn ghi nhật ký một con số nào theo từng truy vấn để bắt suy giảm tiếp theo? Expected: điểm cross-encoder rank-1; một điểm cao nhất dưới một ngưỡng kho ngữ liệu đánh dấu một truy vấn ngoài lĩnh vực.

## Wrong answers

- "Mô hình production là một bản build khác." Kiểm tra dữ liệu và các đầu vào trước trọng số; một rò rỉ và một cặp đổi chỗ đều tái hiện với cùng trọng số.
- "Fixture quá nhỏ để có ý nghĩa." Kích thước không tạo một rò rỉ; sự chồng lấn giữa các truy vấn huấn luyện và đánh giá mới tạo ra.
- "Hạ N trong production để khớp fixture." Một N nhỏ hơn hạ trần recall và khiến pipeline tệ hơn.

## Taught in

Bài học [cross-encoder](../../../phases/19-capstone-projects/66-reranker-cross-encoder/) nêu rò rỉ, tính bất đối xứng và trần nhóm, và bài học [RAG đầu cuối](../../../phases/19-capstone-projects/69-end-to-end-rag-system/) giữ các bộ ba huấn luyện không giao với các truy vấn đánh giá.
