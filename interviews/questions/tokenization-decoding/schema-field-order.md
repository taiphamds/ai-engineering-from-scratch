---
id: schema-field-order
title: Every output validates and the answers are wrong
card: tokenization-decoding
kind: design
level: 3
roles: [applied-ai-engineer, agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [design-review, system-design]
tags: [structured-output, json-schema, field-order, constrained-decoding, schema-design]
minutes: 10
lessons: [phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding]
manuals: []
practice: []
cheatsheet: [structured-outputs]
related: [tokenization-decoding/constrained-decoding-how]
updated: 2026-11-03
---

Bạn review schema của một dịch vụ trích xuất. Nó là `{"answer": ..., "reasoning": ..., "date": <a strict year-month-day regex>}`, được constrained decoding thực thi. Sự tuân thủ hoàn hảo, nhưng độ chính xác kém và một số ngày bị bịa. Thiết kế sai ở đâu, và bạn thay đổi nó bằng cách nào?

## Short answer

Hai lỗi không bộ xác thực nào có thể bắt. Trường câu trả lời đứng trước trường suy luận, nên mô hình cam kết một câu trả lời trước khi đã suy luận, và mẫu ngày nghiêm ngặt không để cách hợp lệ nào nói không biết, nên mô hình tuân thủ bằng cách bịa một ngày. Đặt suy luận trước và câu trả lời cuối, và cho phép một null hoặc một sentinel cho một ngày thiếu; thứ tự trường là logic, không phải định dạng, và một ngữ pháp quá nghiêm ngặt ép một giá trị sai tự tin.

## Full answer

### Fault one: premature commitment

Sinh từ trái sang phải. Với `answer` trước, mô hình phải phát nhãn trước khi viết một từ phân tích nào; suy luận theo sau là một sự biện minh cho một lựa chọn đã đưa ra. Đổi thứ tự và mô hình viết phân tích vào ngữ cảnh mà câu trả lời sau đó được điều kiện hóa theo. JSON hợp lệ ngang nhau theo cả hai cách. Chỉ cách thứ hai đúng.

```json
{"reasoning": "... therefore ...", "answer": "yes"}
```

### Fault two: a grammar with no exit

Regex ngày chỉ nhận các ngày đúng định dạng. Khi nguồn không có ngày, mô hình không thể xuất "không biết", và một mask cấm mọi token trung thực chỉ để lại các token không trung thực. Cho phép `null` hoặc một chuỗi sentinel trong schema và chỉ dẫn mô hình dùng nó.

### The other pitfalls to check in the same review

- **Các schema đệ quy phía sau một thư viện máy trạng thái.** Máy làm phẳng đệ quy tới một độ sâu cố định; các cấu trúc lồng nhau cần một bộ máy ngữ pháp phi ngữ cảnh.
- **Các enum khổng lồ.** Một enum 10,000 lựa chọn biên dịch chậm hoặc hết thời gian chờ; thu hẹp các ứng viên bằng một retriever trước, rồi ràng buộc vào chúng.
- **Chế độ JSON thuần không có schema.** Nó bảo đảm cú pháp, không phải các trường của bạn.

### The validation plan that would have caught it

Tỷ lệ tuân thủ là một con số trong bốn. Thêm tính hợp lệ ngữ nghĩa, được đo bằng một bộ chấm hoặc một tập được gán nhãn, tỷ lệ bao phủ trường, và độ trễ ở p50 và p99. Một hệ thống tuân thủ hoàn hảo và tính hợp lệ ngữ nghĩa kém chính là trường hợp này.

### The rule for the team

Từ chối mọi schema đặt `answer` hoặc `decision` trước các trường suy luận. Từ chối chế độ JSON trần không có schema. Đánh dấu mọi schema đệ quy nằm phía sau một thư viện chỉ-máy-trạng-thái.

## Follow-ups

- **Level 3:** Bạn đo tính hợp lệ ngữ nghĩa khi sự tuân thủ đã hoàn hảo bằng cách nào? Expected: một mẫu được gán nhãn được chấm bởi một bộ chấm hoặc bằng các quy tắc trên nội dung, được theo dõi tách biệt với tuân thủ schema.
- **Level 3:** Đầu ra cần một cây, như các bình luận lồng nhau. Điều gì thay đổi? Expected: một thư viện máy trạng thái làm phẳng đệ quy; chuyển sang một bộ máy ngữ pháp phi ngữ cảnh.
- **Level 4:** Sản phẩm stream câu trả lời tới người dùng và muốn nó trước vì độ trễ. Bạn giải quyết xung đột bằng cách nào? Expected: nêu đánh đổi; các lựa chọn là hai lệnh gọi, suy luận trong một trường ẩn trước một câu trả lời hiển thị, hoặc chấp nhận độ trễ; không bao giờ câu-trả-lời-trước với cùng kỳ vọng độ chính xác.
- **Level 4:** Các ngày bịa ra sẽ thể hiện thế nào trong giám sát? Expected: một tỷ lệ bao phủ trường gần 100 phần trăm trên một kho ngữ liệu nơi ngày thường bị thiếu tự nó là báo động; so tỷ lệ với tỷ lệ cơ sở của trường trong nguồn.

## Wrong answers

- "Thắt chặt regex để chỉ các ngày hợp lý qua." Ngữ pháp đã là vấn đề; một ngữ pháp chặt hơn ép nhiều bịa đặt hơn.
- "Thêm một dòng vào prompt yêu cầu mô hình trung thực." Mask cấm các token trung thực; không chỉ dẫn nào có thể khiến mô hình phát một token có logit âm vô cùng.
- "Xác thực đạt, nên hệ thống hoạt động." Xác thực kiểm tra hình dạng; nó không thể thấy câu trả lời đã được cam kết trước suy luận hoặc một ngày đã được bịa.

## Taught in

[Bài học structured outputs và constrained decoding](../../../phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/) nêu cạm bẫy thứ tự trường, ngữ pháp quá nghiêm ngặt, và kế hoạch xác thực.
