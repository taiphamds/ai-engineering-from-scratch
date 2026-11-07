---
id: chunk-size-by-query-type
title: Review a chunking choice before the first index build
card: rag
kind: tradeoff
level: 2
roles: [applied-ai-engineer, ai-data-engineer, forward-deployed-ai-engineer]
rounds: [design-review, ml-depth]
tags: [chunking, chunk-size, overlap, recall]
minutes: 10
lessons: [phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag, phases/11-llm-engineering/06-rag, phases/19-capstone-projects/64-chunking-strategies-advanced]
manuals: []
practice: []
cheatsheet: [rag]
related: [rag/overlap-measure-first, rag/take-home-stratified-eval]
updated: 2026-11-03
---

Một nhóm sắp lập chỉ mục một kho ngữ liệu tài liệu mới và yêu cầu bạn xem xét bộ chia chunk. Họ chọn chia theo ngữ nghĩa, 1000 token mỗi chunk và chồng lấn 20 phần trăm, vì một bài blog đã khuyến nghị nó. Bạn nói gì với họ?

## Short answer

Bắt đầu từ loại truy vấn, không phải từ một bài viết. Các câu hỏi dữ kiện muốn 256 đến 512 token, các câu hỏi phân tích hoặc multi-hop 512 đến 1024, và các câu hỏi toàn phần 1024 đến 2048. Bắt đầu bằng chia đệ quy ở 512 token và không chồng lấn, rồi đo recall ở 5 trên một tập 50 truy vấn trước khi bạn thay bất kỳ núm chỉnh nào.

## Full answer

### Why size follows the question

Một chunk phải đủ lớn để chứa câu trả lời cùng ngữ cảnh cục bộ của nó, và đủ nhỏ để top k trả về câu trả lời chứ không phải nhiễu. Quá nhỏ, ở 64 đến 128 token, và một chunk nói "nó tăng 15% trong quý trước" mà không có chủ thể. Quá lớn, ở 2048 token trở lên, và một chunk có 10% về doanh thu và 90% về nhân sự, nên embedding của nó không chỉ tới đâu.

| Loại truy vấn | Kích thước chunk |
|---|---|
| Dữ kiện | 256 đến 512 token |
| Phân tích hoặc multi-hop | 512 đến 1024 token |
| Hiểu toàn phần | 1024 đến 2048 token |

### What the measurements say

- Chia đệ quy ở 512 token đánh bại chia theo ngữ nghĩa với tỷ lệ 69% so với 54% trong nghiên cứu chunking.
- Chồng lấn không mang lại lợi ích đo được trong nghiên cứu truy xuất thưa, và mọi token chồng lấn được nhúng và lưu lại, nên chi phí chỉ mục tăng theo chồng lấn.
- Chất lượng phản hồi giảm mạnh quanh 2,500 token ngữ cảnh, nên các chunk lớn hơn chạm một vách dốc.
- Chia theo ngữ nghĩa không có kích thước tối thiểu tạo ra các mảnh 40 token làm hại truy xuất.

### Pick a default without a benchmark

Ba đặc tính quyết định bộ chia chunk đầu tiên: loại tài liệu, độ dài đoạn văn, và định dạng có mang cấu trúc không. Văn xuôi không cấu trúc nhận chia đệ quy. Markdown và tài liệu API nhận bộ chia theo heading. Mã nhận một bộ chia nhận biết cú pháp. Khi không chắc, chia đệ quy là baseline đơn lẻ mạnh nhất.

### Then measure

Xây dựng một tập đánh giá 50 truy vấn, phân tầng theo loại truy vấn, và đọc recall ở 5 cho từng ứng viên. Chặn mọi bộ chia chunk bằng một kích thước tối thiểu và tối đa. Không bao giờ để một chunk trải qua hai tài liệu.

## Follow-ups

- **Level 2:** Tại sao kích thước chunk phụ thuộc vào loại câu hỏi? Expected: chunk phải chứa câu trả lời với ngữ cảnh của nó, và vẫn đủ nhỏ để top k nói về câu trả lời chứ không phải nhiễu xung quanh.
- **Level 2:** Kho ngữ liệu là tài liệu API markdown. Bạn thử gì trước? Expected: bộ chia heading theo cấu trúc, vì định dạng mang cấu trúc tường minh; bỏ hoặc gộp các chunk chỉ có heading.
- **Level 3:** Mọi bộ chia chunk cần hai biện pháp bảo vệ nào, bất kể chiến lược? Expected: một kích thước tối thiểu và tối đa, vì các chunk 5 token hoặc 5000 token đều phá hỏng truy xuất.
- **Level 3:** Bạn chuyển mô hình embedding sau đó. Bạn chạy lại gì? Expected: đánh giá chunking, vì bên thắng phụ thuộc vào kho ngữ liệu và mô hình, và chia theo ngữ nghĩa di chuyển các ranh giới khi mô hình thay đổi.

## Wrong answers

- "Chia theo ngữ nghĩa tốt nhất vì nó đi theo ý nghĩa." Nó thua chia đệ quy ở 512 token trong nghiên cứu đã đo, và nó tạo ra các mảnh nhỏ trừ khi bạn đặt một mức sàn.
- "Chồng lấn là một biên an toàn, hãy giữ nó." Các nghiên cứu thấy rằng chồng lấn thường không thêm gì, và nó thêm chi phí chỉ mục tỷ lệ với kích thước; biện minh cho mọi chồng lấn bằng một ablation.
- "Các chunk lớn hơn cho mô hình nhiều ngữ cảnh hơn." Chất lượng giảm quanh 2,500 token ngữ cảnh, và một chunk bao phủ nhiều chủ đề pha loãng embedding của chính nó.

## Taught in

Bài học [chiến lược chunking](../../../phases/05-nlp-foundations-to-advanced/23-chunking-strategies-rag/) cung cấp bảng kích thước và các phép đo, bài học [RAG](../../../phases/11-llm-engineering/06-rag/) giải thích các lỗi quá nhỏ và quá lớn, và bài học [so sánh chunking](../../../phases/19-capstone-projects/64-chunking-strategies-advanced/) chọn một mặc định từ ba đặc tính.
