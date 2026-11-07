---
id: a2a-webhook-at-least-once
title: A webhook that may fire twice or not at all
card: protocols
kind: tradeoff
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [a2a, push-notifications, webhook, idempotency, ssrf]
minutes: 10
lessons: []
manuals: [a2a-101#s-push-notification-configs, a2a-101#s-security-requirements]
practice: []
cheatsheet: [a2a-and-agent-messaging]
related: [protocols/a2a-stream-drop-resubscribe, protocols/retry-is-not-idempotency]
updated: 2026-11-03
---

Một lần chạy kiểm thử kéo dài hơn bất kỳ kết nối nào mà bộ lập kế hoạch của bạn có thể giữ mở, nên bạn muốn một webhook. So sánh webhook với thăm dò và với streaming cho trường hợp này. Sau đó liệt kê các nhiệm vụ của bộ nhận, biết rằng agent chỉ hứa cố gắng mỗi lần chuyển ít nhất một lần, và các thao tác cấu hình trả về thông tin xác thực webhook đã lưu cho bất kỳ ai có thể gọi chúng.

## Short answer

Đăng ký cấu hình trực tiếp trong `SendMessage` với `returnImmediately: true`, để không sự kiện nào lọt qua trước khi cấu hình tồn tại, và đóng kết nối. Việc chuyển là ít nhất một lần, nên một thông báo có thể đến hai lần hoặc, sau một đợt ngừng hoạt động, không đến lần nào: bộ nhận trả lời 2xx, kiểm tra id tác vụ, xử lý một cách idempotent, và đọc tác vụ bằng `GetTask` trước khi hành động. Đặt bí mật mà bộ nhận của bạn kiểm tra trong `authentication`, vì `token` không có header chuẩn, và giới hạn ai có thể gọi bốn thao tác cấu hình, vì một lần đọc trả về thông tin xác thực ở dạng rõ.

## Full answer

### Three ways to wait

| Cơ chế | Giữ một kết nối | Biết về một thay đổi | Chi phí khi client khởi động lại |
|---|---|---|---|
| thăm dò bằng `GetTask` | không | ở lần thăm dò tiếp theo | không có, tác vụ được lưu |
| `SendStreamingMessage` hoặc `SubscribeToTask` | có | ngay lập tức | các frame bị bỏ lỡ; đăng ký lại để lấy một snapshot |
| webhook | không | ngay lập tức, khi chuyển thành công | các lần chuyển bị bỏ lỡ; đọc tác vụ |

Một webhook phù hợp với công việc kéo dài hơn bên gọi. Nó chuyển vấn đề kết nối sang bộ nhận và thêm một ranh giới tin cậy thứ hai.

### What arrives

Mỗi thông báo là một HTTP POST có phần thân là một `StreamResponse` ở dạng HTTP+JSON, không có vỏ JSON-RPC. Trong lần chạy được ghi lại, phần thân đầu tiên là một `statusUpdate` với `TASK_STATE_WORKING`, dưới `Content-Type: application/a2a+json`, `Authorization: Bearer <secret>` và `X-A2A-Notification-Token`. Các SDK khác nhau về content type, về header token, và về thời gian chờ 5 s hoặc 30 s, và không SDK nào thử lại. Vì vậy hãy chấp nhận cả hai content type, đọc một trong hai header token, và xử lý mọi thành viên `StreamResponse`, vì SDK tham chiếu cũng post `Task` đầu tiên.

### The receiver's duties

1. Trả lời với một trạng thái 2xx để xác nhận đã nhận.
2. Kiểm tra id tác vụ khớp với một tác vụ mà bạn mong đợi.
3. Xử lý một cách idempotent. Một cập nhật trạng thái an toàn khi áp dụng hai lần, được khóa theo id tác vụ và timestamp. Một `artifactUpdate` với `append: true` thì không, và không tồn tại id chuyển.
4. Xem mỗi thông báo là một tín hiệu và đọc tác vụ bằng `GetTask` trước khi bạn hành động.
5. Kiểm tra giá trị `Authorization` so với thông tin xác thực bạn đặt trong `authentication`.

### The agent's duties, and where they fail

Agent phải đặt thông tin xác thực đã cấu hình trong các header yêu cầu và nên xác thực URL để chống server-side request forgery, từ chối các dải riêng như `10.0.0.0/8` và `192.168.0.0/16`, các địa chỉ loopback và link-local. Bộ xác thực của SDK tham chiếu chỉ làm điều đó khi host bật nó. Một cấu hình phải tồn tại cho đến khi tác vụ hoàn tất hoặc một client xóa nó, và một lần xóa phải idempotent.

### The trade

Đăng ký trực tiếp tốn một trường và đóng khoảng hở giữa sự kiện đầu tiên và cấu hình. Bí mật trong `authentication` tốn một giá trị theo từng lần chạy và mang lại một phép kiểm tra mà bộ nhận có thể thực hiện. Việc đọc lại thông tin xác thực ở dạng rõ là cái giá của bốn thao tác cấu hình, nên giới hạn chúng cho chủ sở hữu tác vụ.

## Follow-ups

- **Level 3:** Một `artifactUpdate` với `append: true` đến hai lần. Tại sao bạn không thể áp dụng nó hai lần? Expected: nó làm trùng các part, và không có id chuyển để khử trùng lặp theo, nên thay vào đó hãy đọc tác vụ.
- **Level 3:** Bộ nhận ngừng hoạt động trong một phút. Nó đã bỏ lỡ gì? Expected: có thể là mọi thứ, vì không SDK nào thử lại; đọc tác vụ khi bộ nhận trở lại.
- **Level 4:** Tại sao agent phải từ chối một URL webhook nằm trong một dải riêng? Expected: agent gọi URL đó cho mọi sự kiện về sau của tác vụ, nên một bên gọi bên ngoài có thể hướng các yêu cầu của agent tới một dịch vụ nội bộ.
- **Level 4:** Ai được gọi `ListTaskPushNotificationConfigs`, và tại sao? Expected: chỉ chủ sở hữu tác vụ, vì phản hồi trả về `credentials` và `token` không thay đổi.

## Wrong answers

- "Đăng ký webhook sau khi tác vụ bắt đầu bằng thao tác create." Các sự kiện trước khi cấu hình tồn tại bị mất. Đăng ký trực tiếp không để lại khoảng hở.
- "Xác thực dựa trên header token." Đặc tả không cho `token` phương thức vận chuyển, và các SDK dùng hai tên header. Đặt bí mật trong `authentication` và kiểm tra `Authorization`.
- "Áp dụng mỗi thông báo ngay khi nó đến." Cả trùng lặp và mất các lần chuyển đều xảy ra. Tác vụ đã lưu là nguồn sự thật.

## Taught in

[Phần thông báo push](../../../manuals/a2a-101/sections/4-6-push-notification-configs.md) ghi lại tám lần chuyển và bảng SDK, và [phần các yêu cầu bảo mật](../../../manuals/a2a-101/sections/6-3-security-requirements.md) liệt kê các quy tắc webhook.
