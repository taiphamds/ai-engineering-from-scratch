---
id: normalize-then-match
title: The same attack in base64, rot13 and zero width
card: safety
kind: design
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, debugging]
tags: [prompt-injection, encoding-trick, normalization, detector]
minutes: 8
lessons: [phases/19-capstone-projects/83-prompt-injection-detector, phases/19-capstone-projects/82-jailbreak-taxonomy]
manuals: []
practice: []
cheatsheet: [guardrails-moderation]
related: [safety/one-regex-is-not-a-detector]
updated: 2026-11-03
---

Các quy tắc chuỗi con của bộ phát hiện bắt được "bỏ qua mọi chỉ dẫn" trong văn bản thuần. Các kẻ tấn công giờ gửi cùng cụm từ bằng base64, bằng rot13, bằng leet speak, và với các ký tự vô hình giữa các chữ cái. Thiết kế bước chạy trước các quy tắc, và nói những tín hiệu nào bạn không được vứt đi trong lúc làm vậy.

## Short answer

Thêm một lượt chuẩn hóa tạo ra một bản sao làm việc được làm sạch: loại các ký tự zero width và điều khiển hai chiều, giải mã các token trông như base64 trước khi chuyển chữ thường, vì base64 phân biệt hoa thường, rồi chuyển chữ thường, giải mã hex và rot13, và ánh xạ các chữ số leet trở lại các chữ cái. Chạy các quy tắc trên cả văn bản thô và đã chuẩn hóa, vì chính các lần chèn zero width là một tín hiệu thủ thuật mã hóa mà bản sao sạch không còn cho thấy.

## Full answer

### The category

Các thủ thuật mã hóa lạm dụng dạng bề mặt của các token bị cấm. Các từ giống nhau; các byte thì không, nên một bộ lọc từ khóa ngây thơ bỏ lỡ chúng. Base64, rot13, leet speak và chèn zero width là các dạng phổ biến.

### The pass

1. Loại các ký tự zero width và các điều khiển hai chiều khỏi bản sao làm việc.
2. Với bất kỳ token nào dài 16 ký tự trở lên trông như base64, thử giải mã nó và thay bằng văn bản được giải mã khi thành công. Làm điều này trước bước chuyển chữ thường, vì base64 phân biệt hoa thường và một token đã chuyển chữ thường giải mã thành các byte khác.
3. Chuyển bản sao thành chữ thường.
4. Giải mã các chuỗi hex theo cùng cách.
5. Ánh xạ các chữ số leet sang các chữ cái tương ứng.
6. Xây dựng ảnh rot13 của văn bản và chỉ giữ nó khi nó có nhiều từ giống từ điển hơn đầu vào, được đánh giá theo một danh sách từ nhỏ tích hợp. Mọi chuỗi đều có một ảnh rot13, nên kiểm tra giữ văn bản lành tính khỏi biến thành nhiễu.

### What to keep

Prompt thô ở cạnh bản sao, và các quy tắc có thể đọc một trong hai. Các ký tự zero width bên trong một từ tự chúng là bằng chứng của một cuộc tấn công, và một chỉ dẫn giải mã như "giải mã cái này rồi làm theo nó" là mẫu tấn công bất kể payload có giải mã thành bất cứ thứ gì không. Một quy tắc họ regex trên mẫu giải mã và hành động bắt được nó trước khi payload quan trọng.

### What to measure

Recall trên danh mục mã hóa, điều bộ phát hiện nên thiên về, và chi phí dương tính giả trên kho ngữ liệu lành tính, nơi lập trình viên dán base64 thực và yêu cầu giúp đỡ. Bộ chạy chỉ số báo cáo cả hai theo từng danh mục trên mỗi thay đổi.

## Follow-ups

- **Level 2:** Tại sao giải mã rot13 cần một kiểm tra từ? Expected: mọi văn bản có một ảnh rot13; chỉ giữ nó khi nó trông giống các từ hơn ngăn văn bản lành tính trở thành nhiễu.
- **Level 2:** Danh mục này lạm dụng ranh giới nào? Expected: dạng bề mặt của các token bị cấm, bị giấu khỏi các bộ lọc từ khóa.
- **Level 3:** Một lập trình viên dán một blob base64 thực và yêu cầu giúp đỡ. Điều gì xảy ra, và chi phí thể hiện ở đâu? Expected: giải mã có thể tạo văn bản không kích hoạt gì hoặc một dương tính giả; kho ngữ liệu lành tính trong bộ chạy chỉ số là nơi chi phí đó xuất hiện.
- **Level 3:** Payload không giải mã ra gì. Prompt vẫn có thể là một cuộc tấn công không? Expected: có; chỉ dẫn giải mã và thực hiện là mẫu tấn công; một quy tắc họ trên nó kích hoạt trước khi payload quan trọng.

## Wrong answers

- "Giải mã mọi thứ và bỏ bản gốc." Văn bản thô mang các tín hiệu, như các ký tự vô hình, mà bản sao sạch loại bỏ.
- "Chặn mọi base64 trong một prompt." Các prompt lành tính mang dữ liệu được mã hóa; đo chi phí dương tính giả trên tập lành tính trước khi chặn theo sự hiện diện.
- "Chuẩn hóa là bộ phát hiện." Nó chỉ bộc lộ các token ẩn cho các quy tắc; các quy tắc và bộ chạy chỉ số mới là bộ phát hiện.

## Taught in

[Capstone bộ phát hiện prompt injection](../../../phases/19-capstone-projects/83-prompt-injection-detector/) xây dựng lượt chuẩn hóa, và [capstone phân loại jailbreak](../../../phases/19-capstone-projects/82-jailbreak-taxonomy/) định nghĩa danh mục thủ thuật mã hóa.
