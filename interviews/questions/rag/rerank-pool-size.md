---
id: rerank-pool-size
title: Pick how many candidates the reranker scores
card: rag
kind: tradeoff
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, ml-depth]
tags: [reranking, cross-encoder, latency, recall]
minutes: 10
lessons: [phases/19-capstone-projects/66-reranker-cross-encoder]
manuals: []
practice: []
cheatsheet: [rag-production]
related: [rag/bi-encoder-vs-cross-encoder, rag/cross-encoder-passes-per-query]
updated: 2026-11-03
---

Bạn thêm một cross-encoder phía sau một retriever lai. Prompt nhận K chunk. Nhóm muốn một quy tắc cho N, số ứng viên mà reranker chấm điểm, và một kỹ sư đề xuất một N nhỏ để bảo vệ ngân sách độ trễ. Bạn chọn N bằng cách nào, và bạn từ chối gì?

## Short answer

Chọn N từ đường cong recall của đầu ra được xếp hạng lại và ngân sách độ trễ cùng nhau. Quét N trên một tập truy vấn giữ lại; mức tăng bão hòa ở một điểm gối đâu đó quanh 20 đến 50 ứng viên, và vượt qua nó mỗi ứng viên thêm tốn một lượt truyền xuôi vô ích. Giữ N ít nhất ba lần K, vì reranker chỉ có thể đẩy lên một chunk mà retriever đã đặt trong nhóm.

## Full answer

### The one tunable

Pipeline hai giai đoạn có một núm chỉnh. Bi-encoder trả về N ứng viên, cross-encoder chấm mỗi cặp và giữ K. Bài học cho thấy hình dạng đường cong với các giá trị minh họa: recall ở 1 tăng từ N bằng 5 tới N bằng 20, tăng ít hơn tới N bằng 50, và không thay đổi ở N bằng 100. Các giá trị không phải phép đo từ fixture; điểm gối là thật.

### The cap

Cross-encoder không thể nâng recall cao hơn recall bi-encoder ở N. Một N thấp giới hạn chất lượng, không chỉ độ trễ. Nếu N bằng K, reranker có thể sắp xếp lại K ứng viên nhưng không thể đưa một ứng viên mới vào, nên recall ở K không thể dịch chuyển và mức tăng trông như bằng không.

### The cost side

- Gom N cặp vào một lượt truyền xuôi. Chấm từng cái một thì độ trễ nhân lên N lần.
- Lên kế hoạch bộ nhớ. Một cross-encoder 22M tham số tốn 88 MB ở float32 trước bất kỳ batch nào.
- Cache đầu ra reranker theo hash của truy vấn và id tài liệu. Một kho ngữ liệu ổn định được xếp hạng lại theo cùng cách, nên các lần trúng mang lại một mức cắt độ trễ miễn phí.

### Pin the three together

Bi-encoder, cross-encoder và N là một lựa chọn. Một thay đổi trong bất kỳ thứ nào vô hiệu hóa đánh giá, nên việc quét chạy lại sau một thay đổi mô hình.

## Follow-ups

- **Level 3:** Tại sao đường cong phẳng đi? Expected: vượt qua điểm gối, các ứng viên thêm hiếm khi liên quan, nên reranker không có gì thêm để đẩy lên trong khi mỗi ứng viên vẫn tốn một lượt truyền xuôi.
- **Level 3:** Bạn cắt N từ 50 xuống 10 để tiết kiệm độ trễ. Còn gì dịch chuyển? Expected: trần recall, vì reranker không thể thấy một chunk ngoài nhóm; chạy lại đánh giá thay vì giả định.
- **Level 4:** Bộ nhúng được nâng cấp. N đã chọn còn hợp lệ không? Expected: không; một bi-encoder mới thay đổi recall ở N, nên việc quét phải chạy lại trước bản phát hành.
- **Level 4:** Bạn lấy lại độ trễ mà không có một N nhỏ hơn bằng cách nào? Expected: một lượt truyền xuôi theo batch cho N cặp, và một cache được khóa theo truy vấn và id tài liệu.

## Wrong answers

- "Đặt N bằng K để tiết kiệm thời gian." Khi đó reranker chỉ có thể sắp xếp lại K chunk và không bao giờ đưa một chunk mới vào, nên recall ở K không thể dịch chuyển.
- "N càng lớn càng tốt." Vượt qua điểm gối, mức tăng bão hòa và mỗi ứng viên thêm tốn một lượt truyền xuôi.
- "Chọn N một lần và giữ nó." N được ghim cùng hai mô hình; một thay đổi trong bất kỳ mô hình nào vô hiệu hóa lựa chọn.

## Taught in

Bài học [cross-encoder](../../../phases/19-capstone-projects/66-reranker-cross-encoder/) cung cấp đường cong độ trễ theo chất lượng, quy tắc ba lần K và các ghi chú batching và bộ nhớ.
