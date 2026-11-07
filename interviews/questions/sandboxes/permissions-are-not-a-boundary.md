---
id: permissions-are-not-a-boundary
title: pwd was rejected in one run and ran in the next
card: sandboxes
kind: concept
level: 2
roles: [agentic-ai-engineer, ai-evaluation-reliability-engineer, applied-ai-engineer]
rounds: [screen, debugging]
tags: [agent-runtime, permissions, safety-mode, hooks, headless]
minutes: 8
lessons: []
manuals: [docker-sandboxes-101#s-permissions-safety-and-hooks, docker-sandboxes-101#s-docker-agent-run-new-and-doctor]
practice: []
cheatsheet: [agent-harness, agent-failure-modes]
related: [sandboxes/hypervisor-is-the-boundary]
updated: 2026-11-03
---

Một file agent có `allow: shell:cmd=echo*` và `deny: shell:cmd=rm*`, và agent chạy không người giám sát trong CI với `--exec`. Một lệnh gọi `pwd` bị từ chối trong một lần chạy và chạy trong lần khác. Giải thích thứ tự quyết định, chọn chế độ an toàn cho một lần chạy không người giám sát, và nói các quyền không cho bạn điều gì.

## Short answer

Một lệnh gọi được quyết định theo thứ tự: các hook `pre_tool_use` ưu tiên trước, rồi `deny`, rồi `allow`, rồi `ask`, rồi chế độ an toàn trên nhãn của lệnh gọi, rồi các hook mặc định, rồi người dùng. `pwd` không khớp mẫu nào và mang nhãn `safe`, nên `strict` hỏi và terminal trống biến lời nhắc thành một sự từ chối, trong khi `restricted` cho phép nó. Chọn `restricted` cho các lần chạy không người giám sát, vì nó cho phép `safe` và từ chối `destructive` và `unknown`. Các quyền được client thực thi; tài liệu nói chúng ngăn tai nạn và không phải một ranh giới bảo mật cho một agent bạn không tin, nên cô lập cần một sandbox.

## Full answer

### The safety-mode table

| Chế độ | `safe` | `destructive` | `unknown` |
|---|---|---|---|
| `strict` | hỏi | hỏi | hỏi |
| `balanced` | cho phép | hỏi | hỏi |
| `restricted` | cho phép | từ chối | từ chối |
| `autonomous` | cho phép | cho phép | cho phép |

`--yolo` là `--safety autonomous`. Một phiên không bao giờ chọn một chế độ giữ mặc định cũ hơn: các công cụ chỉ đọc chạy không có lời nhắc và mọi công cụ khác hỏi. Đó là lý do một lệnh gọi `wc -l` hỏi trong một lần chạy được ghi lại dù nhãn của nó là `safe`: công cụ `shell` mang `readOnlyHint: false`.

### What the recorded runs showed

Ba lệnh đi qua `strict` và `restricted` mà không có terminal. `echo` chạy trong cả hai vì mẫu cho phép khớp. `rm -rf` bị từ chối trong cả hai bằng `Tool 'shell' is denied by permissions configuration.` Chỉ `pwd` không khớp thay đổi giữa các chế độ. Các mẫu từ file agent và từ các thiết lập người dùng gộp lại, và một từ chối từ một trong hai phía thắng.

### What a hook can and cannot change

Một hook `command` đọc một đối tượng JSON trên stdin, trả lời bằng JSON trên stdout, chặn bằng mã thoát 2, và mặc định hết thời gian chờ sau 60 giây. Một hook được đánh dấu `preempt_yolo` chạy đầu và không chế độ hay quy tắc cho phép nào có thể vượt qua deny hoặc ask của nó. Allow của nó chỉ là lời khuyên: hook được ghi lại in `permission_decision: allow` trên cả ba lệnh gọi, và `rm` vẫn bị từ chối và `strict` vẫn hỏi cho `pwd`. Hai hook biến đổi tích hợp chạy trên mọi lệnh gọi vì `redact_secrets` bật theo mặc định. Khi một thông điệp yêu cầu ba lệnh, hook chạy ba lần cùng lúc và hai lần chạy ghi vào nhật ký cùng nhau, nên ghi mỗi bản ghi trong một lần ghi.

### The headless failure

Với `--exec` và không có terminal, `tool_call_confirmation` không có ai trả lời. Kết quả công cụ trở thành `The user rejected the tool call.`, và mô hình đi vòng qua nó hoặc tự lặp lại. Vì vậy một lần chạy không người giám sát cần `restricted` cùng các quy tắc `allow` tường minh cho các công cụ nó phải gọi.

## Follow-ups

- **Level 2:** Tại sao một lệnh chỉ đọc nhắc khi không chế độ nào được đặt? Expected: mặc định cũ chỉ cho phép các công cụ chỉ đọc, và `shell` khai báo `readOnlyHint: false`, nên nhãn của nó không giúp.
- **Level 3:** Một hook ưu tiên trước trả về allow cho một lệnh gọi `rm`. Nó có chạy không? Expected: không; một allow từ một hook ưu tiên trước là lời khuyên, và mẫu deny chặn lệnh gọi.
- **Level 3:** Nhật ký hook của bạn có các nửa dòng xen kẽ. Điều gì đã xảy ra? Expected: nhiều instance hook chạy cùng lúc cho một thông điệp; thêm mỗi bản ghi bằng một lần ghi duy nhất.
- **Level 4:** `restricted` để lại điều gì không được bao phủ? Expected: bất cứ thứ gì không đi qua runtime, một công cụ có nhãn sai, và chính host; chạy agent trong một sandbox để cô lập.

## Wrong answers

- "`restricted` là một ranh giới bảo mật, nên host an toàn." Tài liệu gọi nó là một lớp thêm chống các lệnh gọi không mong muốn, được thực thi phía client.
- "Dùng `autonomous` trong CI để không gì chặn." Nó cũng cho phép các lệnh gọi `destructive`; `restricted` đóng khi thất bại đối với chúng.
- "Một hook có thể cấp một lệnh gọi mà `deny` chặn." Một deny từ bất kỳ phía nào thắng, và allow của một hook là lời khuyên.

## Taught in

[Phần quyền](../../../manuals/docker-sandboxes-101/sections/5-5-permissions-safety-and-hooks.md) ghi lại hai chế độ và đầu vào hook, và [phần chạy](../../../manuals/docker-sandboxes-101/sections/5-1-docker-agent-run-new-and-doctor.md) cho thấy xác nhận headless đã trở thành một sự từ chối.
