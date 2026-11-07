---
id: exact-match-vs-token-f1
title: Exact match gives zero to a correct answer
card: evaluation
kind: concept
level: 1
roles: [applied-ai-engineer, ai-evaluation-reliability-engineer, ai-data-engineer]
rounds: [screen, ml-breadth]
tags: [exact-match, token-f1, normalization, metrics]
minutes: 5
lessons: [phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks, phases/19-capstone-projects/41-eval-pipeline]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/tokenizer-is-the-benchmark]
updated: 2026-11-03
---

Hệ thống hỏi đáp của bạn trả về "June 29th, 2007." Tham chiếu nói "June 29, 2007." Một đồng đội báo cáo rằng trường hợp này nhận không và yêu cầu bạn thay toàn bộ đánh giá bằng token F1. Bạn nói gì với họ?

## Short answer

Cả hai metric đúng cho các hình dạng câu trả lời khác nhau. Exact match so sánh toàn bộ chuỗi sau chuẩn hóa, vì vậy một ký tự thêm làm nó bằng không. Token F1 so sánh các túi token, vì vậy cặp này đạt khoảng 75 phần trăm. Trước tiên thêm chuẩn hóa vào exact match, rồi chọn metric theo hình dạng của các câu trả lời bạn chấm.

## Full answer

### What each metric compares

Exact match chuẩn hóa cả hai phía rồi kiểm tra bằng nhau. Đánh giá exact match của capstone chuyển chữ thường, bỏ hai đầu, gộp các dãy khoảng trắng và bỏ dấu câu kết thúc ở cuối khi hai phía chỉ khác bởi nó. Sau bước đó "Paris", "Paris." và "  paris  " đều tính là cùng câu trả lời. Hậu tố trong "29th" không phải dấu câu, vì vậy cặp này vẫn thất bại.

Token F1 chia cả hai phía thành các token, đếm giao đa tập, và lấy trung bình điều hòa của precision và recall. Nó bỏ qua khác biệt thứ tự từ và diễn đạt lại. Nó bị đánh lừa bởi trùng lặp từ vựng: một dự đoán dùng chung phần lớn token với tham chiếu nhưng thay đổi một sự kiện vẫn đạt điểm cao.

### Which one to use

| Hình dạng câu trả lời | Metric |
|---|---|
| Một ngày tháng, một con số, một chữ cái, một nhãn | Exact match với chuẩn hóa |
| Một cụm ngắn có nhiều cách diễn đạt hợp lệ | Token F1, điểm tốt nhất trên tất cả tham chiếu |
| Một câu hoặc một đoạn | Token F1 làm mức sàn, một bộ chấm được hiệu chuẩn cho ý nghĩa |

### Why not switch everything

Token F1 thưởng cho các từ dùng chung, không cho tính đúng đắn. Một câu trả lời dài lặp lại câu hỏi rồi cho thực thể sai có thể đạt điểm cao hơn một câu trả lời đúng ngắn. Giữ exact match nơi câu trả lời có tính xác định. Dùng token F1 nơi diễn đạt lại là bình thường. Dùng một bộ chấm nơi chỉ ý nghĩa được tính, và hiệu chuẩn nó trước.

## Follow-ups

- **Level 1:** Một token F1 bằng một có nghĩa là gì? Expected: dự đoán và tham chiếu có cùng đa tập token sau chuẩn hóa, theo bất kỳ thứ tự nào.
- **Level 2:** Tham chiếu là "Paris" và dự đoán là "Paris." Metric nào thất bại khi không có chuẩn hóa? Expected: exact match; với quy tắc dấu câu cuối nó đạt.
- **Level 2:** Khi nào bạn lấy điểm tốt nhất trên nhiều tham chiếu? Expected: khi một câu hỏi có nhiều hơn một chuỗi câu trả lời hợp lệ; các metric F1 và ROUGE-L lấy mục tiêu đạt điểm cao nhất.
- **Level 3:** Token F1 cao và câu trả lời sai. Điều đó xảy ra như thế nào? Expected: trùng lặp từ vựng với nội dung sai, chẳng hạn một thực thể sai bên trong một câu dùng chung phần lớn token với tham chiếu; chấm thực thể bằng exact match hoặc dùng một bộ chấm.

## Wrong answers

- "Exact match hỏng, vì vậy loại bỏ nó." Exact match với chuẩn hóa là metric đúng cho ngày tháng, con số và chữ cái trắc nghiệm; bước thiếu là chuẩn hóa.
- "Token F1 hiểu ý nghĩa." Nó đếm các token dùng chung; hai câu trả lời không có token dùng chung đều có thể đúng, và một câu trả lời sai có thể dùng chung phần lớn token.
- "Một người sẽ cho trường hợp này 100, vì vậy luôn dùng một bộ chấm." Một bộ chấm tốn tiền và cần một lần hiệu chuẩn; với một ngày tháng, exact match đã chuẩn hóa miễn phí và chính xác.

## Taught in

[Bài học các framework đánh giá LLM](../../../phases/05-nlp-foundations-to-advanced/27-llm-evaluation-frameworks/) mở đầu bằng cặp này, và [capstone pipeline đánh giá](../../../phases/19-capstone-projects/41-eval-pipeline/) đưa ra các quy tắc chuẩn hóa cho exact match và token F1.
