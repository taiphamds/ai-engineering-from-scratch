---
id: output-router-severity
title: The input passed and the output leaked
card: safety
kind: design
level: 2
roles: [applied-ai-engineer, agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [output-classifier, pii, instruction-leakage, router, redaction]
minutes: 9
lessons: [phases/19-capstone-projects/85-content-classifier-integration]
manuals: []
practice: []
cheatsheet: [guardrails-moderation]
related: [safety/one-regex-is-not-a-detector]
updated: 2026-11-03
---

Mọi yêu cầu tới trợ lý của bạn vượt qua một bộ phát hiện đầu vào, nhưng một phản hồi tuần trước chứa địa chỉ email của một khách hàng và một phần system prompt. Thiết kế phía đầu ra, nói ba bộ phân loại riêng kết hợp thành một hành động bằng cách nào, và giải thích điều xảy ra với độ trễ.

## Short answer

Đặt ba bộ phân loại trên đầu ra mô hình phía sau một bộ định tuyến: độc hại bằng các quy tắc, dữ liệu cá nhân bằng các regex cho email, số điện thoại và các chuỗi có dạng thẻ, và rò rỉ chỉ dẫn bằng độ trùng trigram với system prompt đã biết. Mỗi bộ trả về một mức nghiêm trọng, và bộ định tuyến lấy mức tối đa và áp dụng một hành động: chặn ở cao, che dữ liệu ở trung bình, cảnh báo ở thấp, ghi nhật ký ở none. Chạy các bộ phân loại song song với streaming token và giữ chunk cuối cho đến khi phán quyết đến. Các chunk trước đã được đưa ra, nên ở nơi một lần chặn hoặc che dữ liệu phải bao phủ toàn bộ phản hồi, giữ toàn bộ phản hồi và chấp nhận độ trễ.

## Full answer

### Why the output side exists

Lớp đầu vào hỏi prompt đã đến đây bằng cách nào. Lớp đầu ra hỏi liệu điều sắp đưa ra có chấp nhận được không, bất kể prompt là gì. Một mô hình có thể rò rỉ dữ liệu cá nhân, lặp một lời miệt thị từ phân phối huấn luyện hoặc lặp lại system prompt mà không có cuộc tấn công nào trong đầu vào. Bỏ phân loại đầu ra trao cho mọi họ tấn công mới một lần vượt qua ngay lần đầu.

### The verdict

Mỗi bộ phân loại là một callable trả về một tên, một điểm trong khoảng đơn vị, một mức nghiêm trọng none, low, medium hoặc high, và một danh sách phát hiện. Ba bộ phân loại:

- **Độc hại.** Một danh sách từ khóa được tuyển chọn với khớp có ranh giới khoảng trắng và một cửa sổ phủ định nhỏ, để một câu phủ nhận lời miệt thị không kích hoạt.
- **Dữ liệu cá nhân.** Các regex cho các dạng phổ biến: email, điện thoại, số an sinh xã hội, thẻ tín dụng, địa chỉ IP.
- **Rò rỉ chỉ dẫn.** Bộ phân loại giữ system prompt và đo độ trùng trigram với đầu ra; độ trùng cao là tín hiệu.

### The router

| Mức nghiêm trọng tối đa | Hành động |
|---|---|
| cao | chặn, trả về một sự từ chối theo chính sách |
| trung bình | che dữ liệu bằng bộ che dữ liệu của từng bộ phân loại |
| thấp | cảnh báo, ghi nhật ký và thêm một thông báo nhẹ |
| none | ghi nhật ký và đưa ra nguyên trạng |

Block thắng. Redact cộng warn là redact. Mỗi bộ phân loại sở hữu bộ che dữ liệu, nên một đầu ra có cả lời miệt thị và email đi qua cả hai: email trở thành một tag email đã che, các chữ số thành một tag thẻ đã che, lời miệt thị thành một tag ngôn ngữ đã che, và rò rỉ loại các dòng trông như header system prompt. Bộ định tuyến phát ra một hành động với động từ, đầu ra, mức nghiêm trọng, các phán quyết và metadata cho trace.

### Latency

Các bộ phân loại chạy song song với streaming token. Cổng đệm chunk cuối, áp dụng phán quyết rồi đẩy ra. Các chunk trước nó đã tới client, nên một email hoặc một đoạn system prompt trong một chunk sớm được đưa ra trước khi một lần chặn hoặc che dữ liệu có thể hành động. Khi sự phơi lộ đó không chấp nhận được, giữ toàn bộ phản hồi trước lần đẩy đầu và chấp nhận độ trễ thêm. Với các bộ phân loại dựa trên quy tắc, thời gian thêm gần bằng không; các bộ phân loại neural thêm thời gian riêng, và hệ thống kết nối giữ nguyên.

## Follow-ups

- **Level 2:** Tại sao block thắng khi hai bộ phân loại không thống nhất? Expected: bộ định tuyến lấy mức nghiêm trọng tối đa, nên phát hiện nguy hiểm nhất đặt hành động.
- **Level 2:** Tại sao mỗi bộ phân loại sở hữu bộ che dữ liệu? Expected: một đầu ra có cả lời miệt thị và email phải đi qua cả hai bộ che dữ liệu, và tính độc lập khiến việc kết hợp tự động.
- **Level 3:** Kiểm tra rò rỉ hoạt động mà không có mô hình bằng cách nào? Expected: nó giữ system prompt và đo độ trùng trigram với đầu ra; độ trùng cao là tín hiệu rò rỉ và các dòng giống header bị loại.
- **Level 3:** Nhóm sản phẩm nói các kiểm tra đầu ra thêm độ trễ mà họ không chịu được. Expected: các bộ phân loại chạy song song với streaming và chỉ chunk cuối chờ, nhưng các chunk trước được đưa ra trước phán quyết; giữ toàn bộ phản hồi ở nơi sự phơi lộ đó không chấp nhận được, vì lựa chọn còn lại là một lần vượt qua ngay lần đầu cho mọi họ tấn công mới.

## Wrong answers

- "Bộ phát hiện đầu vào đã cho qua, nên đầu ra ổn." Lớp đầu vào không thể biết về các đầu ra mà mô hình tự tạo, như một lời miệt thị từ dữ liệu huấn luyện hoặc một system prompt bị lặp lại.
- "Một bộ phân loại kết hợp đơn giản hơn." Ba phán quyết độc lập với các bộ che dữ liệu riêng kết hợp được; một mô hình giấu phát hiện nào dẫn dắt hành động.
- "Che mọi thứ cho an toàn." Che dữ liệu là hành động trung bình; một phát hiện cao phải chặn, và một phát hiện none phải được đưa ra nguyên trạng với một nhật ký, nếu không sản phẩm suy giảm.

## Taught in

[Capstone tích hợp bộ phân loại nội dung](../../../phases/19-capstone-projects/85-content-classifier-integration/) xây dựng ba bộ phân loại, bộ định tuyến và các bộ che dữ liệu.
