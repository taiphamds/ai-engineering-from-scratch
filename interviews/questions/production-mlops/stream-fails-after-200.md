---
id: stream-fails-after-200
title: Half an answer and then silence
card: production-mlops
kind: debug
level: 2
roles: [ai-evaluation-reliability-engineer, applied-ai-engineer, inference-engineer]
rounds: [debugging, coding]
tags: [sse, streaming, error-handling, demo]
minutes: 8
lessons: [phases/17-infrastructure-and-production/29-model-demo-interfaces]
manuals: []
practice: []
cheatsheet: [production-llm-app]
related: [production-mlops/checks-in-order-of-cost]
updated: 2026-11-03
---

Demo của bạn stream các token đến trang qua server-sent events. Người dùng báo cáo trang đôi khi hiển thị nửa câu trả lời rồi dừng, không có thông báo. Log máy chủ cho thấy một ngoại lệ mô hình trên chính các yêu cầu đó. Tại sao người dùng không thấy gì, và bạn sửa giao thức như thế nào?

## Short answer

Máy chủ gửi dòng trạng thái với trạng thái 200 trước token đầu tiên. Khi mô hình thất bại sau đó, trạng thái không thể thay đổi, nên client thấy một stream kết thúc sớm và không gì khác. Gửi một sự kiện `error` bên trong stream, và khiến trang hiển thị sự kiện đó như một lỗi. Cũng dừng bộ sinh khi client ngắt kết nối, để một tab đóng dừng mô hình.

## Full answer

### The protocol problem

Một phản hồi stream có một dòng trạng thái, và nó đi ra trước. Mọi token sau nó là một chunk body. Một ngoại lệ trong bộ sinh sau token đầu không thể biến một 200 thành một 500. Kết nối đóng, và trang không có cách phân biệt một câu trả lời ngắn với một thất bại.

### The fix in the lesson

Bộ sinh stream bắt ngoại lệ và yield thêm một sự kiện:

```text
event: error
data: {"code":"model_error","message":"...","hint":"...","request_id":"..."}
```

Sau đó nó return. Trang đọc mỗi frame và xử lý ba tên sự kiện: `token` nối văn bản, `done` kết thúc yêu cầu và cho thấy các tổng, và `error` hiển thị thông báo và gợi ý. Lỗi mang một request id, để một báo cáo người dùng ánh xạ đến một bản ghi log mà không lưu bất kỳ đầu vào nào.

### Two details that make it hold

- Trang buffer các byte đến và cắt frame tại dòng trống, vì một chunk mạng có thể kết thúc giữa một sự kiện. Một parser coi mỗi chunk là một sự kiện hỏng trên các câu trả lời dài.
- `json.dumps` escape một ký tự xuống dòng bên trong một chuỗi, nên mỗi sự kiện có một dòng data. Một ký tự xuống dòng thô bên trong data sẽ kết thúc sự kiện sớm.

### Stop the model when the user leaves

Khi người dùng đóng tab, lần ghi tiếp theo thất bại với một broken pipe. Handler bắt nó và đóng bộ sinh, để mô hình dừng và yêu cầu không tốn thêm gì. Bài học cũng đặt một socket timeout trên lớp handler, để một client ngừng gửi không giữ một thread máy chủ.

### Log the failure

Handler yêu cầu ghi một dòng log cho mọi yêu cầu trong block `finally`, với route, trạng thái, mã lỗi, độ trễ và độ dài đầu vào. Một stream thất bại với một sự kiện lỗi xuất hiện ở đó với mã của nó, nên các thất bại đếm được.

## Follow-ups

- **Level 2:** Tại sao máy chủ không thể gửi một 500 khi mô hình thất bại giữa chừng? Expected: dòng trạng thái đi ra trước token đầu tiên, và một phản hồi có một trạng thái.
- **Level 2:** Một người dùng đóng tab giữa chừng. Máy chủ nên làm gì? Expected: lần ghi thất bại với một broken pipe, handler đóng bộ sinh, và mô hình dừng.
- **Level 3:** Tại sao trang buffer các byte thay vì phân tích mỗi chunk như một sự kiện? Expected: một chunk có thể kết thúc giữa một sự kiện, nên bên đọc giữ văn bản một phần đến khi dòng trống đến.
- **Level 3:** Điều gì đi vào sự kiện lỗi ngoài thông báo? Expected: một mã ổn định các kiểm thử có thể so sánh, một gợi ý có một hành động, và request id nối báo cáo với một bản ghi log.

## Wrong answers

- "Buffer toàn bộ câu trả lời và trả JSON thay vào đó." Điều đó loại bỏ streaming, và người dùng chờ token cuối trên mọi yêu cầu.
- "Gửi văn bản lỗi như một token khác." Trang không thể phân biệt một lỗi với đầu ra mô hình, và sự kiện done không bao giờ đến.
- "Thử lại yêu cầu trên máy chủ khi mô hình thất bại." Người dùng đã có nửa câu trả lời. Một lần thử lại lặp đầu ra và tăng gấp đôi chi phí.

## Taught in

[Bài học giao diện demo mô hình](../../../phases/17-infrastructure-and-production/29-model-demo-interfaces/) viết stream sự kiện bằng tay và gửi sự kiện lỗi sau dòng trạng thái.
