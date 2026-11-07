---
id: json-mode-is-not-a-schema
title: What JSON mode guarantees and what it does not
card: prompting-structured-output
kind: concept
level: 1
roles: [applied-ai-engineer, agentic-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-breadth]
tags: [json-mode, json-schema, strict-mode, constrained-decoding]
minutes: 6
lessons: [phases/11-llm-engineering/03-structured-outputs, phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding, phases/13-tools-and-protocols/04-structured-output]
manuals: []
practice: []
cheatsheet: [structured-outputs]
related: [prompting-structured-output/three-failure-modes-structured, prompting-structured-output/schema-valid-value-wrong]
updated: 2026-11-03
---

Một đồng đội bật chế độ JSON của nhà cung cấp và nói đầu ra trích xuất giờ được bảo đảm. Chế độ JSON bảo đảm gì, không bảo đảm gì, và thay vào đó bạn bật gì?

## Short answer

Chế độ JSON bảo đảm một đầu ra hoàn tất phân tích được, không gì hơn; một phản hồi bị cắt ở giới hạn token vẫn có thể thất bại, nên kiểm tra finish reason trước. Nó không bảo đảm các khóa, các kiểu, các giá trị enum hoặc không có trường bổ sung của bạn. Bật chế độ schema, nơi nhà cung cấp nhận một JSON Schema và ràng buộc decoding theo nó, và giữ một kiểm tra phía bạn cho các giá trị một schema không thể phán xét.

## Full answer

### Four levels of control

| Cấp | Bảo đảm | Lỗi điển hình |
|---|---|---|
| Một prompt nói "phản hồi bằng JSON" | không có; khoảng 90 phần trăm hợp lệ | code fence, văn bản mở đầu, cắt cụt, cấu trúc sai |
| Chế độ JSON | cú pháp hợp lệ | khóa bổ sung, kiểu sai, trường thiếu |
| Chế độ schema | đầu ra tuân schema của bạn | một giá trị sai có kiểu đúng, hoặc một từ chối |
| Constrained decoding | mọi token hợp lệ cho schema | giống chế độ schema; đây là cách chế độ schema được xây |

Bài học constrained decoding nói thẳng: chế độ JSON thuần bảo đảm JSON hợp lệ, không phải JSON hợp lệ cho trường hợp sử dụng của bạn, nên luôn cung cấp một schema đầy đủ.

### What strict schema mode asks of you

Bài học đầu ra có cấu trúc liệt kê các quy tắc chế độ nghiêm ngặt: mọi thuộc tính xuất hiện trong `required`, `additionalProperties` là false ở mọi nơi, và không có tham chiếu chưa phân giải. Một schema phá các quy tắc này bị từ chối lúc yêu cầu với một 400.

### What stays with you

Dưới thực thi nghiêm ngặt, hai lỗi biến mất cho một phản hồi hoàn tất, lỗi phân tích và vi phạm schema. Một phản hồi bị cắt ở giới hạn token vẫn có thể không phân tích được, nên kiểm tra finish reason trước khi đọc. Hai lỗi nữa còn lại. Mô hình có thể từ chối khi đầu vào không phù hợp schema, điều mã xử lý như một kết quả có kiểu. Và mô hình có thể điền một trường bằng một giá trị có kiểu đúng và nội dung sai; không lớp định dạng nào thấy điều đó.

## Follow-ups

- **Level 1:** Lỗi nào còn lại dưới chế độ schema nghiêm ngặt? Expected: một từ chối, khi mô hình quyết định đầu vào không phù hợp schema; xử lý nó như một kết quả có kiểu, và định tuyến một phản hồi bị cắt ở giới hạn token đến đường lỗi.
- **Level 2:** Chế độ nghiêm ngặt đòi hỏi gì từ schema? Expected: mọi thuộc tính bắt buộc, cấm thuộc tính bổ sung, không tham chiếu chưa phân giải; nếu không yêu cầu bị từ chối với một 400.
- **Level 2:** Đầu ra khớp schema và giá sai. Lớp nào thất bại? Expected: không lớp định dạng nào; giá trị được bịa, và chỉ một kiểm tra ngữ nghĩa hoặc một đánh giá bắt điều đó.
- **Level 3:** Một trường đôi khi không biết trong văn bản nguồn. Bạn viết schema như thế nào? Expected: cho phép null hoặc một sentinel; một ngữ pháp ép một giá trị khiến mô hình bịa một giá trị, như một ngày.

## Wrong answers

- "Chế độ JSON có nghĩa các khóa khớp mô hình của tôi." Nó chỉ bảo đảm cú pháp; khóa bổ sung, kiểu sai và trường thiếu vẫn xảy ra.
- "Thêm 'phản hồi bằng JSON hợp lệ' vào prompt là cùng thứ." Một cách chỉ dùng prompt đáng tin cậy khoảng 90 phần trăm và thất bại với fence, mở đầu và cắt cụt.
- "Với chế độ schema tôi có thể bỏ xác thực." Một schema không thể bắt một giá trị sai có kiểu đúng; giữ một kiểm tra ngữ nghĩa.

## Taught in

Bài học [các đầu ra có cấu trúc](../../../phases/11-llm-engineering/03-structured-outputs/) trình bày bốn cấp, bài học [constrained decoding](../../../phases/05-nlp-foundations-to-advanced/20-structured-outputs-constrained-decoding/) cảnh báo chống chế độ JSON không có schema, và bài học [đầu ra có cấu trúc](../../../phases/13-tools-and-protocols/04-structured-output/) đưa ra các quy tắc chế độ nghiêm ngặt.
