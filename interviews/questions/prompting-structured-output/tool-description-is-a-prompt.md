---
id: tool-description-is-a-prompt
title: Tool descriptions decide which tool gets called
card: prompting-structured-output
kind: concept
level: 2
roles: [agentic-ai-engineer, applied-ai-engineer, ai-developer-relations-engineer]
rounds: [screen, ml-depth]
tags: [function-calling, tool-schema, tool-choice, error-handling]
minutes: 7
lessons: [phases/11-llm-engineering/09-function-calling]
manuals: []
practice: [tool-call-parser]
cheatsheet: [tool-calling]
related: [prompting-structured-output/structured-output-vs-function-call, prompting-structured-output/tool-call-security-rules]
updated: 2026-11-03
---

Một agent có tám công cụ và liên tục gọi sai công cụ. Các mô tả công cụ mỗi mô tả là một hoặc hai từ, chẳng hạn "lấy thời tiết". Mô tả làm gì, và bạn viết lại một mô tả bằng cách nào?

## Short answer

Mô hình đọc mô tả để quyết định khi nào và gọi công cụ như thế nào, nên mô tả là một prompt để lựa chọn công cụ. Viết lại nó thành một câu đầy đủ nói công cụ làm gì và trả về gì, chẳng hạn nó lấy thời tiết hiện tại cho một thành phố và trả về nhiệt độ theo Celsius cùng các điều kiện, và mô tả từng tham số với một giá trị ví dụ và một enum ở nơi tập hợp là đóng. Sau đó xác thực các đối số theo schema trước khi bất cứ thứ gì thực thi.

## Full answer

### What the model sees

Một định nghĩa công cụ là một hợp đồng JSON Schema: một tên, một mô tả, và các tham số với các kiểu, mô tả riêng của chúng, và danh sách bắt buộc. Mô hình không bao giờ thấy mã của bạn. Nó chọn một công cụ và điền các đối số chỉ từ văn bản này, nên một mô tả mơ hồ tạo ra lựa chọn kém hơn một mô tả chính xác, và một tham số có ví dụ như tên thành phố được điền đáng tin cậy hơn một chuỗi trần.

### Beyond the description

- **Lựa chọn công cụ.** Auto để mô hình quyết định. Required buộc ít nhất một lệnh gọi, ngăn mô hình đoán khi bạn biết cần một lần tra cứu. Một công cụ được nêu tên buộc dùng công cụ đó, để định tuyến khi logic phía trước đã biết.
- **Các lệnh gọi song song.** Hai thành phố trong một câu hỏi có thể quay về dưới dạng hai lệnh gọi trong một lượt; thực thi cả hai và trả về cả hai kết quả.
- **Các lỗi có cấu trúc.** Trả về các thất bại dưới dạng kết quả với một thông điệp, một mã và các gợi ý, chẳng hạn thành phố không được tìm thấy và các tên gần nhất. Mô hình tự sửa từ các lỗi có cấu trúc và không tự sửa từ các lỗi trống hoặc chung chung.
- **Một ngân sách lệnh gọi.** Đặt mức tối đa 10 đến 20 lệnh gọi mỗi hội thoại để một vòng lặp không thể chạy mất kiểm soát.

### Measure it

Viết một tập truy vấn với công cụ mong đợi cho từng truy vấn; bài tập của bài học dùng 30. Chạy lựa chọn và báo cáo tỷ lệ đã chọn đúng công cụ, và liệt kê các cặp bị nhầm lẫn.

## Follow-ups

- **Level 2:** Ngoài bản thân công cụ, mô tả còn giúp ở đâu? Expected: trên mỗi tham số, với một giá trị ví dụ và một enum ở nơi tập hợp là đóng, để các đối số xuất ra đúng.
- **Level 2:** Mô hình vẫn đoán thay vì gọi công cụ khi nó nên gọi. Thiết lập nào thay đổi điều đó? Expected: lựa chọn công cụ đặt thành required, hoặc thành một công cụ được nêu tên khi logic phía trước đã biết công cụ nào.
- **Level 3:** Bạn chứng minh việc viết lại có tác dụng bằng cách nào? Expected: một tập truy vấn kiểm thử với các tên công cụ mong đợi, 30 trong bài học, tỷ lệ chọn đúng công cụ, và các cặp nhầm lẫn được liệt kê.
- **Level 3:** Một công cụ thất bại. Nó nên trả về gì để mô hình phục hồi? Expected: một lỗi có cấu trúc với một thông điệp, một mã và các gợi ý, không phải một ngoại lệ hoặc một phản hồi trống.

## Wrong answers

- "Mô hình suy ra mục đích từ tên hàm." Nó đọc mô tả; một mô tả mơ hồ tạo ra lựa chọn kém hơn một câu đầy đủ.
- "Mô tả mọi công cụ bằng một đoạn văn để chắc chắn." Các định nghĩa đi cùng mọi yêu cầu; một câu chính xác cộng các mô tả tham số là mục tiêu.
- "Để mô hình gọi bất kỳ hàm nào theo tên." Quy tắc của bài học là một danh sách cho phép các công cụ bạn định nghĩa, không bao giờ là một công cụ thực thi theo tên tổng quát.

## Taught in

Bài học [function calling](../../../phases/11-llm-engineering/09-function-calling/) cung cấp hợp đồng định nghĩa công cụ, các chế độ lựa chọn công cụ, các lỗi có cấu trúc và bài tập độ chính xác lựa chọn.
