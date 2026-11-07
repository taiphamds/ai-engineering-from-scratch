---
id: a2a-stream-drop-resubscribe
title: Recover a dropped A2A stream without replay
card: protocols
kind: design
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, debugging]
tags: [a2a, streaming, subscribe, artifacts, reconnect]
minutes: 10
lessons: []
manuals: [a2a-101#s-streaming-and-subscribe-to-task, a2a-101#s-artifact-and-chunks]
practice: []
cheatsheet: [a2a, a2a-and-agent-messaging]
related: [protocols/a2a-rejected-task-loop, protocols/a2a-webhook-at-least-once]
updated: 2026-11-03
---

Client của bạn theo dõi một lần chạy kiểm thử dài qua `SendStreamingMessage`. Sau bốn frame, kết nối rớt, trong khi agent tiếp tục làm việc và thêm các dòng vào artifact nhật ký. Thiết kế việc phục hồi: client biết những gì nó đã bỏ lỡ bằng cách nào, nó xây dựng lại nhật ký bằng cách nào, và nó biết khi nào dừng kết nối lại bằng cách nào.

## Short answer

Không có gì được phát lại, vì một stream là một góc nhìn trực tiếp và đặc tả không định nghĩa cursor. Client gọi `SubscribeToTask` với id tác vụ, và frame đầu tiên phải là một snapshot `Task` đã giữ mọi chunk được ghi trong lúc client vắng mặt. Client thay artifact chưa đầy đủ của nó bằng bản sao trong snapshot và thêm các frame theo sau. Khi một lần đăng ký sau đó trả lời `UnsupportedOperationError`, tác vụ đã kết thúc, nên client dừng kết nối lại và đọc tác vụ cuối cùng bằng `GetTask`.

## Full answer

### What a stream is

Mỗi sự kiện mang một `StreamResponse` với đúng một trong `task`, `message`, `statusUpdate` hoặc `artifactUpdate`. Mọi triển khai phải chuyển các sự kiện theo thứ tự nó tạo chúng và tới mọi stream đang mở của tác vụ. Vòng đời của một tác vụ không phụ thuộc vào vòng đời của bất kỳ stream riêng lẻ nào.

Trong lần chạy được ghi lại, client đóng sau bốn frame. Agent sau đó thêm hai chunk mà không kết nối nào mang. Các sự kiện đó đã mất, và tác vụ đã lưu giữ cả hai chunk.

### The snapshot is the source of truth

```text
SubscribeToTask {id}
  frame 1: task snapshot, state WORKING, artifact test-log with parts 01 to 04
  frames 2 to 5: artifactUpdate, chunks 05 to 08, append true
  frame 6: statusUpdate, TASK_STATE_COMPLETED, "96 passed"
```

Xây dựng lại theo `artifactId`. Một chunk không có `append` thay thế artifact hoặc tạo nó, và một chunk có `append: true` thêm các part của nó vào artifact đã lưu với id đó. Snapshot chỉ giữ `status` hiện tại, nên một client kết nối lại có thể bỏ lỡ các cập nhật trạng thái. Vì lý do đó, các kết quả thuộc về artifact.

### When the stream ends

Phiên bản 1.0 đã loại bỏ cờ `final`, nên không frame nào thông báo kết thúc. Một stream phải đóng khi tác vụ đạt một trạng thái kết thúc. Ở một trạng thái bị gián đoạn, các nguồn không thống nhất: bộ kit được ghi lại đóng ở `TASK_STATE_INPUT_REQUIRED` và giữ mở qua `TASK_STATE_AUTH_REQUIRED`, và sáu SDK phân chia theo cùng cách đó. Vì vậy chỉ riêng việc đóng nghĩa là việc đọc đã kết thúc. Gọi `GetTask`, và nếu tác vụ chưa kết thúc, hành động theo trạng thái của nó và đăng ký lại.

### When to stop

Một `SubscribeToTask` trên một tác vụ đã hoàn tất thất bại với `UnsupportedOperationError`, `-32004`, dưới dạng JSON thuần không có stream. Đó là tín hiệu dừng. Đọc tác vụ cuối cùng bằng `GetTask` và xem các artifact ở đó là kết quả.

### Two more rules from the captures

- Gửi chunk đầu tiên của mọi artifact mà không có `append`, vì các server không thống nhất về `append: true` trên một id không xác định: một server làm tác vụ thất bại, một server bỏ chunk, hai server bắt đầu một artifact mới.
- Qua HTTP+JSON, gửi `POST` tới `/tasks/{id}:subscribe`, vì hai server SDK không định tuyến `GET`; một server nên chấp nhận cả hai.

## Follow-ups

- **Level 3:** Tại sao thay artifact từ snapshot thay vì gộp? Expected: các chunk bị bỏ lỡ không bao giờ phát lại và snapshot là bản sao đã lưu, nên gộp sẽ làm trùng các part.
- **Level 3:** Stream đóng ngay sau một frame trạng thái ở `TASK_STATE_INPUT_REQUIRED`. Tác vụ đã xong chưa? Expected: chưa; việc đóng kết thúc việc đọc, nên gọi `GetTask` và trả lời câu hỏi trên cùng tác vụ.
- **Level 4:** Thông điệp trạng thái cuối nói "xong" nhưng không có trạng thái kết thúc nào đến trước khi đóng. Bạn tin gì? Expected: trạng thái từ `GetTask`; một tác vụ chỉ hoàn tất khi một trạng thái kết thúc được ghi nhận, không bao giờ dựa trên việc đóng hoặc văn xuôi.
- **Level 4:** `lastChunk` liên quan đến kết thúc của tác vụ như thế nào? Expected: nó chỉ đóng một artifact; stream được ghi lại mang thêm hai frame sau một `lastChunk`, và một tác vụ bị hủy có thể lưu một artifact chưa bao giờ nhận được cờ đó.

## Wrong answers

- "Kết nối lại với một id sự kiện cuối để server phát lại." Đặc tả không định nghĩa cursor và không có phát lại. Thay vào đó, `SubscribeToTask` bắt đầu với một snapshot.
- "Việc đóng nghĩa là tác vụ đã hoàn tất." Các server đóng ở các trạng thái khác nhau. Xác nhận trạng thái bằng `GetTask` trước khi bạn dừng.
- "Giữ các chunk bạn đã có và thêm các chunk của snapshot." Điều đó làm trùng các part. Snapshot thay thế bản sao của bạn, và các frame theo sau thêm vào.

## Taught in

[Phần streaming](../../../manuals/a2a-101/sections/4-5-streaming-and-subscribe-to-task.md) ghi lại stream bị rớt và snapshot, và [phần artifact](../../../manuals/a2a-101/sections/3-3-artifact-and-chunks.md) cung cấp các quy tắc xây dựng lại.
