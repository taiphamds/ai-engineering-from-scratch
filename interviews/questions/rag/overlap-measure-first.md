---
id: overlap-measure-first
title: Settle a chunk overlap argument with one ablation
card: rag
kind: tradeoff
level: 2
roles: [applied-ai-engineer, ai-data-engineer]
rounds: [design-review, ml-depth]
tags: [chunking, overlap, index-cost, ablation]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag, phases/11-llm-engineering/06-rag]
manuals: []
practice: []
cheatsheet: [rag]
related: [rag/chunk-size-by-query-type]
updated: 2026-11-03
---

Bộ chia chunk của bạn giữ một phần chồng lấn 100 token giữa các chunk lân cận. Sau lần làm mới kho ngữ liệu cuối, kích thước chỉ mục và hóa đơn embedding đều tăng, và một đồng đội nói phần chồng lấn phải giữ lại vì nó bảo vệ các câu mà một ranh giới sẽ cắt đôi. Bạn giải quyết bằng cách nào?

## Short answer

Giải quyết bằng một ablation, không phải một ý kiến. Chạy cùng đánh giá recall ở 5 với chồng lấn bằng không và bằng giá trị hiện tại trên một tập truy vấn phân tầng, và chỉ giữ chồng lấn nếu con số dịch chuyển. Các nghiên cứu gần đây thấy rằng chồng lấn thường không thêm lợi ích đo được, trong khi nó thêm chi phí chỉ mục tỷ lệ với kích thước.

## Full answer

### Where overlap came from

Baseline cửa sổ cố định cắt mỗi N token mà không quan tâm câu. Bài học RAG cho thấy bố trí cổ điển: các chunk 512 token với chồng lấn 50 token, nên chunk 1 giữ các token 0 đến 511 và chunk 2 giữ các token 462 đến 973. Phần đuôi lặp lại bảo đảm một câu bị cắt ở một điểm kém may mắn xuất hiện đầy đủ ở đâu đó.

### Why it matters less now

Một bộ chia đệ quy thử ngắt đoạn trước, rồi ngắt dòng, rồi kết thúc câu, rồi dấu cách. Các ranh giới của nó rơi vào các điểm ngắt tự nhiên, nên vấn đề mà chồng lấn giải quyết phần lớn biến mất. Bài học chunking liệt kê chồng lấn dưới dạng làm theo máy móc: các nghiên cứu 2026 thấy không có lợi ích đo được trong trường hợp đã đo, và mọi token chồng lấn được nhúng và lưu hai lần.

### The test

1. Giữ bộ chia chunk, bộ nhúng và tập truy vấn cố định.
2. Chạy chia đệ quy ở 512 token với chồng lấn bằng không và với chồng lấn hiện tại.
3. So sánh recall ở 5 theo từng lát truy vấn, và so sánh số chunk.
4. Chỉ giữ chồng lấn ở nơi một lát cho thấy lợi ích thực, và ghi lại ablation cạnh thiết lập.

Skill chia chunk trong bài học đặt chồng lấn bằng không theo mặc định và từ chối chồng lấn trên 20 phần trăm nếu không có một ablation cho thấy nó giúp ích.

## Follow-ups

- **Level 2:** Tại sao bộ chia cửa sổ cố định cần chồng lấn? Expected: nó cắt tại một số lượng cố định bất kể văn bản, nên một ranh giới có thể chia một câu; phần đuôi lặp lại đặt câu đó đầy đủ vào chunk tiếp theo.
- **Level 2:** Một bộ chia đệ quy làm gì thay vào đó? Expected: nó lần lượt chia theo các dấu phân cách đoạn, dòng và câu, nên các ranh giới rơi vào các điểm ngắt tự nhiên.
- **Level 3:** Skill chia chunk áp dụng quy tắc nào cho chồng lấn? Expected: mặc định bằng không, và từ chối mọi chồng lấn trên 20 phần trăm nếu không có một ablation.
- **Level 3:** Ablation cho thấy lợi ích chỉ trên một loại tài liệu. Bạn phát hành gì? Expected: chồng lấn chỉ cho loại đó, với ablation được ghi lại, và một lần chạy lại khi kho ngữ liệu hoặc bộ nhúng thay đổi.

## Wrong answers

- "Chồng lấn miễn phí, embedding rẻ mà." Mọi token chồng lấn được nhúng và lưu hai lần, nên chi phí chỉ mục tăng tỷ lệ với chồng lấn.
- "Một bài blog nói chồng lấn 20 phần trăm." Các nghiên cứu thấy không có lợi ích đo được trong trường hợp đã đo; câu trả lời phụ thuộc kho ngữ liệu của bạn, nên đo ở đó.
- "Loại nó ở mọi nơi, không cần kiểm thử." Ablation rẻ và kết quả phụ thuộc kho ngữ liệu; một lát có mất mát ranh giới thực sẽ lộ ra trong đó.

## Taught in

Bài học [chiến lược chunking](../../../phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/) báo cáo các nghiên cứu chồng lấn và đặt quy tắc skill, và bài học [RAG](../../../phases/11-llm-engineering/06-rag/) cho thấy bố trí cửa sổ cố định mà chồng lấn được xây dựng cho.
