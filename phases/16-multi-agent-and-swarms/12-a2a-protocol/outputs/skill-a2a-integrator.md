---
name: a2a-integrator
description: Design an A2A integration between two agents — Agent Card, task schemas, auth, streaming or polling.
version: 1.0.0
phase: 16
lesson: 12
tags: [multi-agent, a2a, protocol, interoperability, google]
---

Với hai hệ thống agent cần liên vận, tạo kế hoạch tích hợp A2A: nội dung Agent Card, các lược đồ tác vụ, xác thực, chế độ truyền tải.

Tạo ra:

1. **Agent Card.** Tên, mô tả, phiên bản, các kỹ năng (mỗi kỹ năng với `id`, `name`, `description`, `tags`), `supportedInterfaces` (mỗi mục với `url`, `protocolBinding`, `protocolVersion`), `defaultInputModes` và `defaultOutputModes` dưới dạng các kiểu phương tiện (văn bản, JSON có cấu trúc, hình ảnh, âm thanh, video), và khai báo xác thực trong `securitySchemes` cộng với `securityRequirements`.
2. **Các lược đồ tác vụ theo từng kỹ năng.** Lược đồ JSON đầu vào + lược đồ JSON hiện vật. Hãy tường minh — các máy khách sẽ xác thực.
3. **Lựa chọn xác thực.** Bearer token (OAuth2 hoặc không trong suốt), mTLS, hoặc khóa API, mỗi loại được khai báo như một mục `securitySchemes`. Giải thích theo mô hình đe dọa (internet công khai, VPC, hỗn hợp).
4. **Chế độ truyền tải.** Thăm dò (`GetTask`) so với truyền luồng SSE (`SendStreamingMessage`, `SubscribeToTask`) so với thông báo đẩy (`CreateTaskPushNotificationConfig`). Truyền luồng cho các tác vụ chạy dài hoặc nhiều tiến độ; thăm dò cho các tác vụ ngắn.
5. **Giới hạn tốc độ.** Các giới hạn theo từng máy khách và theo từng tác vụ. Bảo vệ khỏi lạm dụng.
6. **Tính lũy đẳng.** Chiến lược cho các yêu cầu `POST /message:send` trùng lặp (`messageId` máy khách ổn định, khử trùng lặp phía máy chủ theo nó).
7. **Xử lý lỗi.** Các trạng thái tác vụ ngoài `TASK_STATE_FAILED` (có thể thử lại so với nghiêm trọng), chính sách thư chết, lược đồ hiện vật lỗi.
8. **Phân chia MCP so với A2A.** Nếu agent từ xa sử dụng MCP nội bộ, ghi nhận những công cụ nào được cung cấp so với giữ nội bộ.

Các trường hợp loại bỏ dứt khoát:

- Các Agent Card có các mục `supportedInterfaces` không khai báo một `protocolVersion`.
- Các lược đồ tác vụ là văn bản dạng tự do khi trường hợp sử dụng cần cấu trúc.
- `securityRequirements` rỗng trên các triển khai internet công khai.

Các quy tắc từ chối:

- Nếu cả hai agent chạy trong cùng tiến trình, từ chối A2A và đề xuất các lệnh gọi Python/JS trực tiếp. A2A dành cho các ranh giới xuyên hệ thống.
- Nếu các yêu cầu độ trễ là khứ hồi dưới 100ms, từ chối A2A và đề xuất RPC trực tiếp với một lược đồ dùng chung.
- Nếu agent từ xa không khai báo một Agent Card, từ chối tích hợp và đề xuất công bố một card trước.

Đầu ra: một bản tóm lược tích hợp một trang. Kết thúc bằng JSON Agent Card được dán nội tuyến để kỹ thuật có thể thả nó vào `/.well-known/agent-card.json`.
