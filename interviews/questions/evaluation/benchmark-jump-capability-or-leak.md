---
id: benchmark-jump-capability-or-leak
title: Eight points after a new training corpus
card: evaluation
kind: design
level: 4
roles: [ai-evaluation-reliability-engineer, ai-data-engineer, applied-ai-engineer]
rounds: [design-review, ml-depth]
tags: [contamination, benchmarks, model-diff, custom-eval]
minutes: 12
lessons: [phases/10-llms-from-scratch/10-evaluation, phases/11-llm-engineering/10-evaluation]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/benchmarks-stop-discriminating]
updated: 2026-11-03
---

Một mô hình bạn fine-tune tăng tám điểm trên một benchmark công khai sau khi bạn thêm một corpus thu thập từ web mới vào cơ cấu huấn luyện. Ban lãnh đạo muốn công bố nó. Thiết kế cuộc kiểm toán cho bạn biết mức tăng là năng lực hay rò rỉ, và nói bạn sẽ công bố gì thay vào đó nếu đó là rò rỉ.

## Short answer

Kiểm toán nhiễm bẩn trước khi bất kỳ ai công bố bất cứ điều gì. Tìm các câu hỏi benchmark và các bản diễn đạt lại gần giống của chúng trong corpus mới và báo cáo tỷ lệ tìm thấy, rồi chạy lại mô hình trên một đánh giá tùy chỉnh có phiên bản mà corpus không thể chứa và so sánh các trường hợp kiểm thử riêng lẻ với mô hình trước. Nếu phần trùng lặp đáng kể và đánh giá tùy chỉnh không dịch chuyển, mức tăng là ghi nhớ, và bạn công bố kết quả đánh giá tùy chỉnh với tỷ lệ nhiễm bẩn.

## Full answer

### Why the jump is suspect

Các corpus huấn luyện thu thập web và các câu hỏi benchmark nằm trên web. Không ai phải có chủ ý. Một corpus mới thu thập là đường có khả năng nhất để bài kiểm thử đi vào huấn luyện, và một benchmark bão hòa thưởng cho sự ghi nhớ bằng các bước tăng lớn. Cùng bài học liệt kê dạy để làm bài kiểm thử và bão hòa là hai cơ chế khác dịch chuyển một điểm mà không dịch chuyển năng lực.

### The audit

1. **Tìm nhiễm bẩn.** Kiểm tra tỷ lệ các câu hỏi đánh giá, hoặc các bản diễn đạt lại gần giống của chúng, xuất hiện trong corpus mới. Báo cáo các lần khớp chính xác và khớp gần riêng biệt cùng phương pháp.
2. **So sánh mô hình.** So sánh hai phiên bản mô hình theo từng trường hợp: những mục nào cải thiện, những mục nào thoái lui, những mục nào giữ nguyên. Nếu các cải thiện tập trung trên các mục mà việc tìm kiếm phát hiện, phép so sánh nêu sự rò rỉ.
3. **Đánh giá tùy chỉnh.** Chạy cả hai mô hình trên bộ đánh giá có phiên bản riêng của bạn gồm ít nhất 200 trường hợp có các trường hợp biên, giữ tách biệt khỏi mọi ví dụ huấn luyện và prompt. Một lợi ích thật xuất hiện ở đó với một khoảng; một sự rò rỉ thì không.
4. **Kiểm tra tách biệt.** Xác nhận rằng không trường hợp đánh giá nào trùng với các ví dụ prompt hoặc dữ liệu fine-tuning, vì một trường hợp kiểm thử cũng từng là một ví dụ huấn luyện đo sự ghi nhớ.

### What to publish

Các con số đánh giá tùy chỉnh với các khoảng, tỷ lệ nhiễm bẩn và phương pháp, và điểm benchmark với lưu ý đó đính kèm. Không bao giờ một con số benchmark trần. Và thêm bước khử trùng lặp vào pipeline huấn luyện để corpus tiếp theo được kiểm tra với mọi tập đánh giá trước khi huấn luyện bắt đầu.

## Follow-ups

- **Level 3:** Việc tìm kiếm thấy các lần khớp chính xác cho một tỷ lệ nhỏ và các bản diễn đạt lại cho nhiều hơn. Cái nào được tính? Expected: cả hai; các bản diễn đạt lại cũng làm rò rỉ câu trả lời, vì vậy báo cáo các lần khớp chính xác và khớp gần riêng biệt cùng phương pháp.
- **Level 3:** Đánh giá tùy chỉnh cũng tăng. Mức tăng có thật không? Expected: có khả năng hơn, nếu bộ đánh giá có phiên bản, tách biệt khỏi dữ liệu huấn luyện và đủ lớn để mức tăng vượt khoảng của nó.
- **Level 4:** Bạn ngăn câu hỏi này lần tới như thế nào? Expected: khử trùng lặp các corpus huấn luyện với mọi tập đánh giá trước huấn luyện, giữ dữ liệu đánh giá ngoài prompt và dữ liệu fine-tuning, và ghi lại phép kiểm tra trong báo cáo huấn luyện.

## Wrong answers

- "Chúng tôi không cố ý đưa benchmark vào, vì vậy nó sạch." Thu thập ở quy mô web đưa nó vào mà không có chủ ý; bài học gọi đây là đường bình thường dẫn đến nhiễm bẩn.
- "Tám điểm quá lớn để là nhiễu." Nhiễu không phải phương án khác; ghi nhớ mới là nó, và nó tạo ra các bước tăng lớn.
- "Công bố benchmark và thêm lưu ý sau." Công bố đánh giá tùy chỉnh với các khoảng và tỷ lệ nhiễm bẩn; một con số benchmark trần là tuyên bố bạn không thể bảo vệ.

## Taught in

[Bài học đánh giá](../../../phases/10-llms-from-scratch/10-evaluation/) giải thích nhiễm bẩn và đặt các bài tập phát hiện nhiễm bẩn và so sánh mô hình, và [bài học đánh giá và kiểm thử](../../../phases/11-llm-engineering/10-evaluation/) cảnh báo việc kiểm thử trên các ví dụ huấn luyện.
