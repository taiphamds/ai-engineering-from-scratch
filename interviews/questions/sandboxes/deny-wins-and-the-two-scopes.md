---
id: deny-wins-and-the-two-scopes
title: Why the deny for example.com was refused
card: sandboxes
kind: concept
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [sandbox, network-policy, allow, deny, scope]
minutes: 8
lessons: []
manuals: [docker-sandboxes-101#s-sbx-policy-init-allow-deny-and-check-network, docker-sandboxes-101#s-org-policies-profiles-and-the-audit-log]
practice: []
cheatsheet: [sandbox-policy]
related: [sandboxes/blocked-host-reads-as-timeout]
updated: 2026-11-03
---

`sbx policy init balanced` cho một chính sách toàn cục với 194 mục cho phép. Một lập trình viên thêm `example.com` với `--sandbox m101-policy`, sau đó thử một từ chối cho cùng host ở cùng cấp, và nhận một sự từ chối. Giải thích ngữ pháp quy tắc, hai phạm vi, và thứ tự mà bộ ủy quyền quyết định một kết nối.

## Short answer

Một quy tắc cho phép là một danh sách phân cách bằng dấu phẩy gồm các hostname, domain, địa chỉ IP hoặc tiền tố CIDR, với các glob như `*.example.com`, `**.example.com`, `api?.example.com`, `example.com:443` và `**` cho mọi host; một cho phép bao phủ TCP trừ khi `--protocol` nói khác, và một từ chối bao phủ TCP và UDP. Các quy tắc nằm trong hai phạm vi, toàn cục theo mặc định và cục bộ với `--sandbox`. Với cùng hostname hoặc CIDR, một từ chối thắng một cho phép, nên CLI từ chối một từ chối xung đột với một cho phép trong cùng phạm vi và bạn loại cho phép trước. Bộ ủy quyền dừng tại một từ chối khớp, cho vào khi có một cho phép từ bất kỳ phạm vi hoạt động nào, và nếu không thì từ chối là `implicit`.

## Full answer

### What `init` sets

`policy init` đặt chính sách toàn cục đầu tiên, không phải một mặc định cho mỗi sandbox. Nó chạy một lần với `allow-all`, `balanced` hoặc `deny-all`, và `sbx policy reset` hoặc `sbx daemon start --policy` bắt đầu lại. Preset balanced trên host được ghi lại giữ sáu nhóm mạng và hai quy tắc hệ thống file, tất cả với `created_via: default`. Danh sách thay đổi giữa các bản phát hành không có changelog, nên đọc `sbx policy ls --wide --json` trước khi tin nó.

### Scope, provenance and who may edit

Một quy tắc được thêm với `--sandbox` in `scope: sandbox:<name>`, `layer: local`, `origin: scoped`, `created_via: added` và `editable: true`. Một quyền cấp của kit đến dưới dạng `created_via: provisioned` với `editable: false`, và `--source kit` liệt kê nó. `--deny-network HOST` trên `create` hoặc `run` thêm một từ chối theo từng sandbox lúc tạo, và phần trợ giúp nói tại sao điều đó an toàn dưới quản trị: một từ chối cục bộ chỉ có thể làm lưu lượng ra hẹp hơn, không bao giờ rộng hơn.

### The decision order

1. Một từ chối khớp kết thúc việc duyệt ngay, và từ chối cũng bao phủ UDP và tra cứu tên.
2. Một cho phép từ bất kỳ phạm vi hoạt động nào cho host vào.
3. Không có gì khớp: từ chối `implicit`, với lý do `No matching allow rule (default deny)`, dưới balanced hoặc deny-all trở thành một yêu cầu phê duyệt.

Một host không có cổng được đánh giá ở cổng 443, và `check network` chỉ kiểm tra truy cập mạng, không bao giờ một phương thức hoặc đường dẫn HTTP. Một hostname được cho phép không được kiểm tra theo các quy tắc CIDR cho địa chỉ mà nó phân giải tới.

### Under organization governance

Khi một chính sách tổ chức hoạt động, chỉ các quy tắc cho phép của tổ chức cấp truy cập. Các quy tắc cho phép cục bộ và kit không hoạt động, và các quy tắc từ chối cục bộ và kit vẫn áp dụng. Một từ chối cục bộ thậm chí thắng một yêu cầu phê duyệt tổ chức: yêu cầu bị chặn và không lời nhắc nào xuất hiện.

| Quy tắc | Được đánh giá dưới quản trị |
|---|---|
| cho phép tổ chức | có |
| từ chối tổ chức | có |
| cho phép cục bộ | không |
| từ chối cục bộ | có |
| cho phép kit | không |
| từ chối kit | có |

## Follow-ups

- **Level 2:** Bạn cho phép `*.example.com` và từ chối một CIDR bao phủ địa chỉ của nó. Điều gì xảy ra với một kết nối tới `api.example.com`? Expected: nó được cho phép; một hostname được cho phép không được kiểm tra theo các quy tắc CIDR cho địa chỉ đã phân giải.
- **Level 3:** Một kit đã cấp `example.com` cho một sandbox và bạn muốn nó bị chặn ở đó. Bạn làm gì, biết rằng quy tắc kit không thể chỉnh sửa? Expected: thêm một từ chối cục bộ với `--deny-network` hoặc `sbx policy deny network --sandbox`, vì một từ chối thắng và một từ chối cục bộ chỉ thu hẹp.
- **Level 3:** Tại sao một từ chối cục bộ có thể được tin dưới quản trị trung tâm? Expected: nó chỉ có thể giảm lưu lượng ra; nó được đánh giá trong khi các cho phép cục bộ không được, và nó thậm chí ngăn một lời nhắc phê duyệt tổ chức.
- **Level 4:** Bạn giữ một danh sách chính sách được ghi lại trung thực qua các bản phát hành bằng cách nào? Expected: ghi lại `sbx policy ls --wide --json` với phiên bản và ngày, vì preset thay đổi không có changelog.

## Wrong answers

- "Quy tắc sau thắng, nên thêm từ chối sau cho phép." Một từ chối thắng bất kể thứ tự, và CLI từ chối cặp xung đột trong một phạm vi.
- "Một từ chối hostname cũng chặn địa chỉ mà nó phân giải tới." Các quy tắc host và CIDR được đánh giá riêng; một hostname được cho phép bỏ qua kiểm tra CIDR.
- "`policy init` đặt mặc định cho mỗi sandbox mới." Nó đặt một chính sách toàn cục; các quy tắc theo từng sandbox đến từ `--sandbox`, `--deny-network` hoặc một kit.

## Taught in

[Phần chính sách](../../../manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md) cung cấp ngữ pháp, các phạm vi và xung đột được ghi lại, và [phần quản trị](../../../manuals/docker-sandboxes-101/sections/7-2-org-policies-profiles-and-the-audit-log.md) in bảng ưu tiên.
