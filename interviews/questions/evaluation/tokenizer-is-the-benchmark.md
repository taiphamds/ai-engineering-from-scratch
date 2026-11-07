---
id: tokenizer-is-the-benchmark
title: BLEU 28.3 in one paper and 0.283 in another
card: evaluation
kind: debug
level: 2
roles: [ai-evaluation-reliability-engineer, ai-data-engineer, applied-ai-engineer]
rounds: [debugging, ml-depth]
tags: [bleu, rouge-l, tokenizer, reproducibility]
minutes: 8
lessons: [phases/19-capstone-projects/71-classical-metrics]
manuals: []
practice: []
cheatsheet: [llm-evaluation]
related: [evaluation/exact-match-vs-token-f1]
updated: 2026-11-03
---

Hai bài báo báo cáo BLEU trên cùng tập kiểm thử. Một nói 28.3 và bài kia nói 0.283. Một nhóm thứ ba báo cáo điểm ROUGE-L thấp hơn của bạn mười điểm trên cùng đầu ra. Quản lý của bạn hỏi con số nào đúng. Bạn trả lời như thế nào?

## Short answer

Tất cả có thể đúng cho các thiết lập metric khác nhau. BLEU là một tỷ lệ, và một bài báo nhân nó với một trăm. ROUGE-L dịch chuyển mười điểm khi một thư viện chuyển chữ thường và thư viện kia không, hoặc khi hai bên tokenize khác nhau. Đọc thiết lập metric trước khi so sánh, và trong harness riêng cố định một tokenizer và một quy tắc làm trơn và ghim chúng bằng các kiểm thử.

## Full answer

### The scale

Hai con số BLEU là cùng điểm trên hai thang. Không có gì để gỡ lỗi; viết thang cạnh mọi con số bạn công bố.

### The tokenizer

Capstone dùng một tokenizer cho mọi metric: chuyển văn bản thành chữ thường và giữ các dãy ký tự từ. Mọi metric đọc cùng các token. Đổi tokenizer và bạn chạy một benchmark khác. Khoảng cách ROUGE-L mười điểm là điều lần đổi đó trông như khi một phía giữ kiểu chữ và phía kia bỏ.

### What else is inside the number

- **BLEU-4** đếm precision n-gram đã sửa đổi cho n từ 1 đến 4. Số đếm mỗi n-gram ứng viên được chặn ở số đếm tối đa trong bất kỳ tham chiếu nào, để một ứng viên không thể thắng bằng cách lặp một cụm. Hình phạt ngắn hạ điểm một ứng viên ngắn hơn tham chiếu. Làm trơn cộng một trên các số đếm tránh một log của không khi không có 4-gram khớp, và giữ gần giá trị không làm trơn trên các ứng viên dài.
- **ROUGE-L** tìm dãy con chung dài nhất. Recall là độ dài dãy con chia độ dài tham chiếu, precision là cùng độ dài chia độ dài ứng viên, và điểm là F1 của chúng.

### What to do in your harness

Tự viết các metric để một đồng nghiệp có thể kiểm toán chúng. Ghim chúng bằng các vector tham chiếu từ các ví dụ tính sẵn, không từ một thư viện bên thứ ba. Kiểm thử các trường hợp biên: dự đoán rỗng, tham chiếu rỗng, không có token dùng chung, một lần khớp chính xác và một cụm lặp.

## Follow-ups

- **Level 2:** Tại sao clipping quan trọng trong BLEU? Expected: một ứng viên lặp một cụm khớp sẽ thổi phồng precision n-gram; clipping chặn số đếm ở số đếm tham chiếu.
- **Level 2:** Hình phạt ngắn làm gì? Expected: nó hạ điểm một ứng viên ngắn hơn tham chiếu, để một đầu ra ngắn không thể thắng chỉ bằng precision.
- **Level 3:** Tại sao cộng một vào các số đếm n-gram? Expected: một cặp không có 4-gram khớp sẽ cho một log của không và một điểm không; làm trơn giữ trung bình nhân hữu hạn và gần như không dịch chuyển các ứng viên dài.
- **Level 3:** Bạn giữ các con số metric so sánh được qua một năm các lần chạy như thế nào? Expected: ghim tokenizer và việc làm trơn trong mã, giữ các vector tham chiếu trong kiểm thử, và ghi lại phiên bản metric với mọi bảng xếp hạng.

## Wrong answers

- "Dùng thư viện mọi người dùng." Hai thư viện khác mười điểm trên cùng đầu ra; bạn vẫn cần biết mỗi bên áp dụng tokenizer và xử lý kiểu chữ nào.
- "BLEU cũ, bỏ nó." Nó vẫn đứng sau phần lớn con số được công bố; học đọc nó, rồi thêm các metric dựa trên mô hình lên trên.
- "Chuyển chữ thường không thể dịch chuyển một điểm mười điểm." Capstone báo cáo rằng nó có cho ROUGE-L giữa hai thư viện; kiểu chữ thay đổi các token nào khớp.

## Taught in

[Capstone các metric cổ điển](../../../phases/19-capstone-projects/71-classical-metrics/) giải thích tại sao tokenizer là một hợp đồng và cách BLEU và ROUGE-L được tính.
