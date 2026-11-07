---
id: diagnose-from-the-metric-table
title: Recall holds, MRR drops, nobody touched the retriever
card: rag
kind: debug
level: 3
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, ml-depth]
tags: [rag-eval, mrr, recall, reranking, regression]
minutes: 10
lessons: [phases/19-capstone-projects/68-rag-eval-precision-recall]
manuals: []
practice: []
cheatsheet: [llm-evaluation, rag-production]
related: [rag/recall-at-k-first, rag/judge-grades-its-own-work]
updated: 2026-11-03
---

Sau một bản phát hành, đánh giá RAG hàng đêm cho thấy recall ở 5 không thay đổi và vẫn cao, MRR giảm so với tuần trước, và độ trung thực không đổi. Không ai chạm vào retriever. Bạn nghi ngờ giai đoạn nào, xác nhận bằng cách nào, và những mẫu khác sẽ cho bạn biết gì?

## Short answer

Reranker. Tính trung bình, chunk chuẩn vẫn đến trong top 5, nên recall giữ nguyên, nhưng nó nằm thấp hơn trong danh sách, nên MRR giảm, và bộ sinh vẫn bám vào những gì nó nhận được. Xác nhận từ trace theo từng truy vấn: so sánh thứ hạng của chunk chuẩn trước và sau bản phát hành, rồi xem điều gì thay đổi trong reranker, như trọng số, kích thước nhóm ứng viên, hoặc thứ tự truy vấn và tài liệu trong cặp.

## Full answer

### Why the pattern points at one stage

MRR là trung bình trên các truy vấn của một chia cho thứ hạng của tài liệu liên quan đầu tiên. Hạng 1 đóng góp 1.0, hạng 2 đóng góp 0.5, hạng 10 đóng góp 0.1, nên chỉ số bị chi phối bởi đầu danh sách. Recall ở 5 không thấy vị trí bên trong top 5. Một sự dịch chuyển MRR với recall phẳng gợi ý rằng chunk đúng đã chuyển xuống trong cửa sổ, và giai đoạn đặt thứ tự bên trong cửa sổ là reranker. Một trung bình phẳng không chứng minh điều đó: một truy vấn có thể mất chunk chuẩn khỏi top 5 trong khi truy vấn khác có thêm một chunk. Trace thứ hạng theo từng truy vấn bên dưới tách chuyển động của reranker khỏi mất mát truy xuất.

### The full table

| Triệu chứng | Nguyên nhân có khả năng | Điều cần sửa |
|---|---|---|
| Recall ở k thấp, precision ở k thấp | bộ chia chunk cắt câu trả lời, hoặc retriever không thể tìm nó | ranh giới chunk, hoặc phương thức truy xuất |
| Recall ở k khá, MRR thấp | chunk đúng ở trong top k nhưng không ở vị trí 1 | reranker |
| MRR cao, độ trung thực thấp | bộ sinh bịa nội dung với ngữ cảnh đúng trước mặt | prompt sinh, buộc trích dẫn hoặc từ chối |
| Độ trung thực cao, mức liên quan thấp | câu trả lời có căn cứ nhưng lạc đề | bộ viết lại truy vấn, hoặc prompt |
| Cả bốn đều cao, người dùng vẫn phàn nàn | tập đánh giá không có tính đại diện | thêm các truy vấn người dùng thực vào qrels |

### Confirm, do not guess

Lưu bền vững trace chỉ số theo từng truy vấn trên mỗi lần chạy CI. Khi đó câu hỏi không phải "con số nào giảm" mà là "những truy vấn nào giảm, và xuống hạng nào". Phân lát theo lớp truy vấn. Một mức giảm chỉ trong một lớp, như các truy vấn mang một symbol nguyên văn, chỉ tới một thay đổi khác với một mức giảm trên mọi lớp.

## Follow-ups

- **Level 3:** Trace cho thấy chunk chuẩn ở hạng 3 chỉ với các truy vấn định danh nguyên văn. Lát cắt gợi ý gì? Expected: một thay đổi làm hại tín hiệu từ vựng trong nhóm cho các truy vấn đó; phân lát theo lớp để tìm nó thay vì lấy trung bình làm nó biến mất.
- **Level 3:** Những thay đổi phát hành nào có thể làm MRR dịch chuyển trong khi recall ở 5 giữ nguyên? Expected: bất kỳ thứ gì bên trong reranker: trọng số mới, một nhóm ứng viên nhỏ hơn, hoặc truy vấn và tài liệu bị đổi chỗ trong cặp.
- **Level 4:** Độ trung thực cũng giảm trong khi recall và MRR vẫn ổn. Bạn xem ở đâu? Expected: prompt sinh, và chính bộ chấm, vì một bộ chấm từ cùng họ mô hình chấm đầu ra của chính nó quá dễ; chấm tay một mẫu.
- **Level 4:** Tại sao giữ trace theo từng truy vấn thay vì các trung bình? Expected: một trung bình 90 phần trăm giấu một lớp luôn bỏ lỡ, và khi một người dùng phàn nàn bạn có thể tìm qrel tương ứng và xem liệu đánh giá có bắt được nó không.

## Wrong answers

- "Retriever đã suy giảm." Không ai chạm vào retriever và recall ở 5 không dịch chuyển; một trung bình phẳng vẫn có thể giấu một truy vấn mất chunk chuẩn, nên kiểm tra trace thứ hạng theo từng truy vấn trước khi bạn đổ lỗi cho truy xuất.
- "Mô hình bắt đầu ảo giác." Độ trung thực không dịch chuyển; bộ sinh vẫn bám vào những gì nó nhận được.
- "Chạy lại, đó là nhiễu." Đánh giá là offline và xác định trên fixture; một chỉ số giảm với các chỉ số khác phẳng chỉ tới một giai đoạn.

## Taught in

Bài học [đánh giá RAG](../../../phases/19-capstone-projects/68-rag-eval-precision-recall/) định nghĩa MRR và cung cấp bảng triệu chứng.
