---
id: a2a-rejected-task-loop
title: The poll loop that never ends and the deploy that should not
card: protocols
kind: debug
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [debugging, coding]
tags: [a2a, task-state, terminal-state, artifacts, polling]
minutes: 8
lessons: []
manuals: [a2a-101#s-cancel-task-and-terminal-states, a2a-101#s-task-and-task-state]
practice: []
cheatsheet: [a2a]
related: [protocols/a2a-card-before-the-call]
updated: 2026-11-03
---

Một bộ lập kế hoạch thăm dò một agent từ xa bằng `GetTask` cho đến khi một tác vụ xong. Nó dừng khi trạng thái là completed, failed hoặc canceled. Với một agent triển khai, vòng lặp không bao giờ trả về. Với một bộ chạy kiểm thử, bộ lập kế hoạch triển khai một bản build có bộ kiểm thử đã có một lỗi. Giải thích cả hai lỗi.

## Short answer

Vòng lặp biết ba trạng thái kết thúc, và có bốn. Agent triển khai đã từ chối tác vụ, và một tác vụ ở `TASK_STATE_REJECTED` không bao giờ thay đổi nữa, nên vòng lặp quay mãi. Bộ chạy kiểm thử đã hoàn thành công việc mà nó được yêu cầu làm, nên tác vụ của nó là `TASK_STATE_COMPLETED` ngay cả khi một kiểm thử thất bại, vì phán quyết là một kết quả và các kết quả đi trong artifact.

## Full answer

### Nine states, two sets the client must hard-code

| Lớp | Các trạng thái |
|---|---|
| đang hoạt động | `TASK_STATE_SUBMITTED`, `TASK_STATE_WORKING` |
| bị gián đoạn | `TASK_STATE_INPUT_REQUIRED`, `TASK_STATE_AUTH_REQUIRED` |
| kết thúc | `TASK_STATE_COMPLETED`, `TASK_STATE_FAILED`, `TASK_STATE_CANCELED`, `TASK_STATE_REJECTED` |

`TASK_STATE_UNSPECIFIED` là giá trị không của proto. Xem nó, và mọi tên không xác định, là một lỗi. Proto đánh dấu bốn trạng thái là kết thúc và hai là bị gián đoạn, và nó không đưa ra bảng chuyển trạng thái, nên chấp nhận mọi chuyển đổi ra khỏi một trạng thái không phải kết thúc. Một agent triển khai có thể từ chối ngay từ submitted.

### Bug one: the forgotten ending

Rejected nghĩa là agent quyết định không làm tác vụ. Trong lần chạy được ghi lại, thông điệp trạng thái là "Các lần triển khai production nằm ngoài chính sách của agent này. Hãy dùng quy trình phát hành theo đợt." Cùng yêu cầu nhận cùng sự từ chối, nên bộ lập kế hoạch nên dừng và làm theo thông điệp, không thử lại.

### Bug two: a state is not a verdict

Completed nghĩa là tác vụ hoàn tất thành công, và công việc là chạy bộ kiểm thử. Trong lần chạy chặn được ghi lại, thông điệp trạng thái nói "1 thất bại, 11 đạt", và artifact `summary.json` mang `"passed": 11` và `"failed": 1`. Một bộ lập kế hoạch đọc số lượng `failed` trong part dữ liệu đó trước khi triển khai. Một thông điệp không nên mang đầu ra của một tác vụ.

### What a finished task still answers

| Lệnh gọi trên một tác vụ kết thúc | Phản hồi |
|---|---|
| `GetTask` | tác vụ cuối cùng, trong lúc server giữ nó |
| `SendMessage` với `taskId` của nó | `UnsupportedOperationError`, `-32004` |
| `SubscribeToTask` | `UnsupportedOperationError`, `-32004` |
| `CancelTask` | `TaskNotCancelableError`, `-32002` |

Để tiếp tục, bắt đầu một tác vụ mới trong cùng `contextId` và nêu tác vụ đã hoàn tất trong `referenceTaskIds`.

## Follow-ups

- **Level 2:** Vòng lặp phải xử lý những trạng thái nào khác, và bằng cách nào? Expected: hai trạng thái bị gián đoạn; trả lời `TASK_STATE_INPUT_REQUIRED` bằng một thông điệp trên cùng tác vụ, và chuyển `TASK_STATE_AUTH_REQUIRED` đến một người phê duyệt bên ngoài A2A trong lúc bạn đăng ký hoặc thăm dò.
- **Level 3:** Bạn gọi `CancelTask` và nhận `-32002`. Tiếp theo là gì? Expected: gọi `GetTask`; canceled nghĩa là một lần hủy trước đó đã thành công, một trạng thái kết thúc khác nghĩa là tác vụ đã kết thúc trước, và một trạng thái đang chạy nghĩa là server không thể dừng nó.
- **Level 3:** Tiến trình agent gặp sự cố giữa tác vụ và lệnh gửi chặn của bạn trả về một lỗi. Tác vụ có thất bại không? Expected: xem kết quả là không xác định; SDK tham chiếu lưu tác vụ là failed, nhưng client chỉ thấy một lỗi, nên hãy đọc lại tác vụ.
- **Level 4:** Bạn tiếp tục một lần review đã hoàn tất với một diff đã thay đổi bằng cách nào? Expected: một tác vụ mới với cùng `contextId`, không có `taskId`, và tác vụ cũ trong `referenceTaskIds`; một tác vụ kết thúc không nhận thêm thông điệp.

## Wrong answers

- "So sánh trạng thái với chuỗi chữ thường `completed`." Phiên bản hiện tại gửi các tên enum như `TASK_STATE_COMPLETED`, và một tên không xác định phải là một lỗi, không phải một lần chờ.
- "Một tác vụ completed nghĩa là các kiểm thử đã đạt." Completed nghĩa là agent đã hoàn thành công việc mà nó được yêu cầu làm. Phán quyết nằm trong artifact.
- "Gửi một thông điệp khác đến tác vụ bị từ chối và hỏi lại." Một tác vụ kết thúc từ chối các thông điệp. Bắt đầu một tác vụ mới trong cùng ngữ cảnh.

## Taught in

[Phần trạng thái kết thúc](../../../manuals/a2a-101/sections/4-4-cancel-task-and-terminal-states.md) cho thấy bốn kết thúc từ các lần chạy được ghi lại, và [phần trạng thái tác vụ](../../../manuals/a2a-101/sections/3-4-task-and-task-state.md) phân loại cả chín giá trị.
