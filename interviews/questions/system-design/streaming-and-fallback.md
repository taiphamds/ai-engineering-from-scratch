---
id: streaming-and-fallback
title: Keep a chat service answering when the provider does not
card: system-design
kind: design
level: 2
roles: [applied-ai-engineer, inference-engineer, forward-deployed-ai-engineer, agentic-ai-engineer]
rounds: [system-design]
tags: [streaming, retries, fallback-chain, graceful-degradation]
minutes: 15
lessons: [phases/11-llm-engineering/13-production-app]
manuals: []
practice: []
cheatsheet: [production-llm-app]
related: [system-design/batched-inference-api-budget, system-design/llm-cost-projection]
updated: 2026-11-03
---

Thiết kế đường yêu cầu của một dịch vụ chat gọi một mô hình được lưu trữ. Người dùng rời đi khi không gì xuất hiện trong vài giây, provider trả về các giới hạn tốc độ và lỗi server vào ban đêm, và kho vector phía sau truy xuất đôi khi hết thời gian chờ. Bao phủ những gì người dùng thấy, cách bạn thử lại, và điều xảy ra khi mỗi phần thất bại.

## Short answer

Stream các token qua server-sent events để token đầu xuất hiện trong vài trăm mili giây dù câu trả lời đầy đủ mất vài giây. Thử lại các lỗi provider với exponential backoff và jitter, giới hạn ở ba lần thử lại, rồi đi xuống một chuỗi mô hình có thứ tự tới một câu trả lời được cache và cuối cùng một thông điệp không khả dụng ngắn. Các hệ thống phụ suy giảm thay vì làm yêu cầu thất bại: không ngữ cảnh truy xuất khi kho vector ngừng hoạt động, một lệnh gọi mô hình trực tiếp khi cache ngừng hoạt động, và một thông điệp rõ ràng khi một guardrail chặn.

## Full answer

### Streaming

Một phản hồi vài trăm token đầu ra mất 3-8 giây để hoàn tất. Không có streaming, người dùng nhìn một biểu tượng chờ suốt thời gian. Với streaming, token đầu đến trong 200-500ms, tổng thời gian giống nhau, và độ trễ cảm nhận giảm. Server-sent events là mặc định: một chiều, qua HTTP thuần, được event source của trình duyệt hoặc bất kỳ client HTTP nào tiêu thụ. Websocket dành cho các nhu cầu hai chiều như giọng nói, và long polling dành cho các client không thể làm một trong hai.

### Three layers of failure

| Lớp | Ví dụ | Phục hồi |
|---|---|---|
| Provider | Giới hạn tốc độ 429, lỗi server 500, timeout | Backoff với jitter, rồi chuỗi fallback |
| Mô hình | JSON sai định dạng, tên hàm bịa ra | Thử lại một lần với lỗi trong prompt |
| Ứng dụng | Kho vector chậm, cache ngừng hoạt động, ngoại lệ guardrail | Suy giảm: bỏ hệ thống phụ |

Backoff bắt đầu ở một giây, tăng gấp đôi ở mỗi lần thử và thêm jitter ngẫu nhiên để nhiều client không thử lại đồng bộ. Ba lần thử lại là trần; sau đó yêu cầu chuyển tới mô hình tiếp theo. Mọi lệnh gọi bên ngoài có một timeout, với mặc định khoảng 30s.

### The fallback chain

Mô hình chính, rồi một mô hình rẻ hơn hoặc sẵn sàng hơn, rồi một mô hình nhỏ hơn, rồi một phản hồi được cache, rồi thông điệp không khả dụng. Mỗi bước đánh đổi chất lượng lấy tính sẵn sàng. Người dùng luôn nhận thứ gì đó, và nhật ký ghi bước nào trả lời để bộ theo dõi chi phí và dashboard chất lượng có thể quy thuộc nó.

### Degradation table

- 429: thử lại với backoff; đưa yêu cầu vào hàng đợi và báo người dùng nó đang được xử lý.
- 500: thử lại tối đa ba lần, rồi chuyển mô hình; trong suốt với người dùng.
- Timeout: một lần thử lại với một prompt ngắn hơn hoặc một mô hình nhỏ hơn.
- Đầu ra sai định dạng: thử lại với lỗi đính kèm, nếu không trả về văn bản thô.
- Guardrail chặn: không thử lại; giải thích tại sao yêu cầu bị chặn.
- Kho vector ngừng hoạt động: không thử lại trên kho; trả lời không có ngữ cảnh truy xuất.
- Cache ngừng hoạt động: không thử lại trên cache; gọi mô hình trực tiếp.

### The user-visible contract

Các mục tiêu dashboard là trung vị dưới 2s và p99 dưới 10s. Streaming chuyển thời gian token đầu vào trong mục tiêu trung vị ngay cả khi phản hồi đầy đủ không đạt. Một phản hồi được stream có một bẫy: dòng trạng thái được gửi trước token đầu, nên một lỗi sau đó phải được gửi như một sự kiện lỗi bên trong stream.

## Follow-ups

- **Level 2:** Tại sao thêm jitter vào backoff? Expected: nhiều client thất bại cùng lúc nếu không sẽ thử lại tại cùng các thời điểm và tái tạo quá tải.
- **Level 2:** Tại sao một lần guardrail chặn không được thử lại? Expected: đầu vào là vấn đề; thử lại cùng đầu vào cho cùng lần chặn và tiêu một lệnh gọi.
- **Level 3:** Mô hình fallback có một giá khác. Điều đó thể hiện ở đâu? Expected: trong bộ theo dõi chi phí theo từng yêu cầu và từng mô hình, để dashboard cho thấy chi phí ngừng hoạt động, không chỉ tỷ lệ.
- **Level 3:** Stream đã bắt đầu và mô hình thất bại. Server vẫn có thể làm gì? Expected: gửi một sự kiện lỗi bên trong stream, vì trạng thái HTTP đã được ghi nhận.

## Wrong answers

- "Thử lại cho đến khi provider trả lời." Các lần thử lại không giới hạn chồng chất trong một sự cố ngừng hoạt động; giới hạn chúng và đi xuống chuỗi.
- "Nếu truy xuất ngừng hoạt động, làm yêu cầu thất bại để câu trả lời giữ có căn cứ." Một hệ thống phụ không được kéo sập luồng chính; trả lời với ngữ cảnh giảm và ghi nhật ký.
- "Đệm toàn bộ phản hồi và gửi cùng lúc cho đơn giản." Người dùng không thấy gì trong vài giây và rời đi; tổng thời gian giống nhau theo cả hai cách.

## Taught in

[Bài học ứng dụng LLM production](../../../phases/11-llm-engineering/13-production-app/) cung cấp các giao thức streaming, ba lớp lỗi, lịch backoff và chuỗi fallback.
