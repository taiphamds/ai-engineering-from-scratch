---
id: recall-at-k-first
title: The first metric to read after a wrong answer
card: rag
kind: concept
level: 1
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [screen, ml-breadth]
tags: [rag-eval, recall, precision, qrels]
minutes: 6
lessons: [phases/19-capstone-projects/68-rag-eval-precision-recall, phases/05-nlp-foundations-to-advanced/13-question-answering]
manuals: []
practice: []
cheatsheet: [llm-evaluation, rag-production]
related: [rag/diagnose-from-the-metric-table, rag/rag-or-fine-tune]
updated: 2026-11-03
---

Một người dùng báo rằng trợ lý tài liệu đã đưa một câu trả lời sai. Pipeline có một bộ chia chunk, một retriever, một reranker và một bộ sinh. Bạn được xem một chỉ số trước bất cứ thứ gì khác. Chỉ số nào, và tại sao là nó?

## Short answer

Recall ở k trên giai đoạn truy xuất. Nếu chunk chuẩn không ở trong top k, không reranker nào có thể mang nó trở lại và bộ sinh thường thiếu bằng chứng cho câu trả lời đúng, trừ khi một chunk khác tình cờ giữ nó, nên các chỉ số sau khó đọc. Recall đứng trước trong thứ tự, nhưng nó không phải một cổng: khi recall giữ vững, hoặc khi một chunk truy xuất khác giữ bằng chứng, chuyển sang vị trí thứ hạng rồi sang văn bản được sinh, vì một lỗi ở đó vẫn bị giấu nếu không làm vậy.

## Full answer

### The two retrieval metrics

Precision ở k hỏi tỷ lệ nào của top k là chuẩn. Nếu tập chuẩn có ba tài liệu và top 3 trả về hai trong số đó cùng một tài liệu sai, precision ở 3 là 2 / 3. Recall ở k hỏi tỷ lệ nào của tập chuẩn nằm trong top k. Nếu top 5 giữ cả ba tài liệu chuẩn, recall ở 5 là 1.0.

Các nhóm production trích dẫn recall. Bộ sinh có thể dễ dàng bỏ qua một chunk thêm. Nó không thể bịa một câu trả lời từ một chunk chưa bao giờ thấy.

### The order of the checks

| Triệu chứng | Nguyên nhân có khả năng | Điều cần sửa |
|---|---|---|
| Recall thấp và precision thấp | bộ chia chunk cắt câu trả lời hoặc retriever không thể tìm nó | ranh giới chunk hoặc phương thức truy xuất |
| Recall khá, MRR thấp | chunk đúng nằm trong top k nhưng không ở vị trí 1 | reranker |
| MRR cao, độ trung thực thấp | bộ sinh bịa nội dung dù có ngữ cảnh đúng | prompt sinh, trích dẫn hoặc từ chối |
| Độ trung thực cao, mức liên quan thấp | câu trả lời có căn cứ nhưng lạc đề | bộ viết lại truy vấn hoặc prompt |
| Cả bốn đều cao, người dùng vẫn phàn nàn | tập đánh giá không đại diện các truy vấn thực | thêm các truy vấn người dùng thực vào qrels |

### Keep the eval cheap

Phân tầng qrels: một tập smoke 20 truy vấn chạy trong CI, một tập hồi quy 200 chạy mỗi đêm, và một tập sâu 2000 chạy hàng tuần. Xem một suy giảm recall như một kiểm thử thất bại.

## Follow-ups

- **Level 1:** Precision ở k thêm gì khi recall đã ổn? Expected: nó cho thấy bao nhiêu trong danh sách trả về là nhiễu, điều quan trọng khi một chunk sai đầu độc câu trả lời hoặc lãng phí token.
- **Level 2:** Recall ở 5 ổn nhưng chunk chuẩn nằm ở hạng 4 hoặc 5. Chỉ số nào cho thấy điều đó, và bạn sửa giai đoạn nào? Expected: MRR, và reranker.
- **Level 3:** Recall trung bình 90 phần trăm và một nhóm vẫn phàn nàn mỗi ngày. Điều gì bị giấu? Expected: một lớp truy vấn luôn bỏ lỡ; phân lát qrels theo lớp, như nguyên văn, diễn đạt lại và đa chủ đề, và báo cáo từng lát.
- **Level 3:** Bạn giữ đánh giá đủ nhanh để chạy trên mỗi thay đổi bằng cách nào? Expected: các tầng, với một tập smoke 20 truy vấn trong CI, 200 mỗi đêm và 2000 hàng tuần.

## Wrong answers

- "Đọc câu trả lời và đánh giá nó." Chỉ câu trả lời không thể cho biết giai đoạn nào trong bốn giai đoạn đã thất bại.
- "Precision ở k, vì nhiễu gây ra câu trả lời sai." Precision quan trọng khi chunk đúng đã hiện diện; một chunk bị thiếu là điều đầu tiên cần loại trừ.
- "Độ trung thực, vì mô hình đã ảo giác." Một câu trả lời trung thực với các chunk sai vẫn sai; độ trung thực chỉ chấm bộ sinh theo những gì nó thấy.

## Taught in

Bài học [đánh giá RAG](../../../phases/19-capstone-projects/68-rag-eval-precision-recall/) định nghĩa các chỉ số và bảng chẩn đoán, và bài học [hỏi đáp](../../../phases/05-nlp-foundations-to-advanced/13-question-answering/) nói đo retriever trước reader.
