---
id: answer-before-reasoning
title: Valid JSON, worse accuracy, and the field order to blame
card: prompting-structured-output
kind: debug
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer]
rounds: [debugging, ml-depth]
tags: [constrained-decoding, schema-design, field-order, reasoning]
minutes: 8
lessons: [phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding, phases/11-llm-engineering/03-structured-outputs]
manuals: []
practice: []
cheatsheet: [structured-outputs]
related: [prompting-structured-output/json-mode-is-not-a-schema, prompting-structured-output/read-the-constrained-decoder]
updated: 2026-11-03
---

Một bộ phân loại dùng constrained decoding với một schema có hai trường, `answer` và `reasoning`, theo thứ tự đó. Đầu ra luôn là JSON hợp lệ và độ chính xác tệ hơn phiên bản văn bản tự do trước đó. Điều gì sai?

## Short answer

Thứ tự trường. Mô hình chốt câu trả lời trước khi viết bất kỳ suy luận nào, nên các token suy luận không bao giờ định hình câu trả lời, và bạn mất mức tăng mà từng bước mang lại. Đặt `reasoning` trước và `answer` cuối; schema giữ hợp lệ, và không bộ xác thực nào từng gắn cờ khác biệt, vì thứ tự là logic chứ không phải định dạng.

## Full answer

### The pitfall

Bài học constrained decoding gọi nó là cạm bẫy khiến bạn trả giá. Với `answer` trước, mô hình viết token quyết định ở vị trí đầu ngữ pháp cho phép, và suy luận theo sau là một câu chuyện về một lựa chọn đã đưa ra. Với `reasoning` trước, chuỗi đến trước quyết định, và token quyết định được điều kiện hóa trên nó. Cả hai tài liệu xác thực. Chỉ một đúng.

Skill của bài học từ chối bất kỳ thiết kế nào đặt một trường `answer` hoặc `decision` trước các trường suy luận.

### Neighbors of the same mistake

| Lựa chọn schema | Điều gì sai | Cách sửa |
|---|---|---|
| Một pattern nghiêm ngặt cho một giá trị có thể thiếu, như một ngày | mô hình bịa một giá trị để thỏa ngữ pháp | cho phép null hoặc một sentinel |
| Một trường quan trọng bị để tùy chọn | mô hình bỏ nó khi bất tiện | làm nó bắt buộc và cho phép null, để sự vắng mặt tường minh |
| Lồng sâu bốn cấp trở lên | mỗi cấp là thêm một nơi mất cấu trúc | làm phẳng |
| Một enum có hàng nghìn lựa chọn | ngữ pháp biên dịch chậm hoặc timeout | dự đoán một danh sách ứng viên ngắn trước, rồi ràng buộc vào nó |

### Why the unconstrained reply did better

Một phản hồi văn bản tự do có xu hướng giải thích trước khi kết luận, nên nó tình cờ có chuỗi. Schema ràng buộc loại bỏ nó. Cách sửa khôi phục nó có chủ đích.

## Follow-ups

- **Level 2:** Tại sao không bộ xác thực nào có thể bắt điều này? Expected: cả hai thứ tự hợp lệ theo schema; tác hại nằm ở những gì mô hình đã thấy khi viết token câu trả lời.
- **Level 2:** Schema ép một pattern ngày và mô hình điền các ngày không có trong văn bản. Đó là sai lầm liên quan nào? Expected: một ngữ pháp quá nghiêm ngặt cho dữ liệu thiếu; cho phép null hoặc một sentinel để mô hình không bịa một giá trị.
- **Level 3:** Một trường tùy chọn và mô hình bỏ nó khi nó quan trọng. Bạn thay đổi gì? Expected: làm nó bắt buộc và cho phép null, để mô hình phải nêu giá trị thiếu.
- **Level 3:** Schema lồng sâu bốn cấp và lỗi tăng. Bạn làm gì? Expected: làm phẳng, vì mỗi cấp lồng là thêm một nơi mất dấu cấu trúc.

## Wrong answers

- "Constrained decoding bảo đảm một đầu ra đúng." Nó bảo đảm hình dạng; bài học cho thấy JSON hợp lệ với một đáp án sai.
- "Thứ tự không quan trọng trong JSON." Nó không quan trọng với parser; nó quan trọng với mô hình, viết các trường theo thứ tự.
- "Thêm một kiểm tra rằng suy luận hỗ trợ câu trả lời." Đó là một đánh giá, không phải một cách sửa; cách sửa là sinh suy luận trước.

## Taught in

Bài học [constrained decoding](../../../phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/) nêu cạm bẫy thứ tự trường và cạm bẫy ngữ pháp nghiêm ngặt, và bài học [đầu ra có cấu trúc](../../../phases/11-llm-engineering/03-structured-outputs/) trình bày độ sâu lồng và các trường tùy chọn.
