---
id: governance-narrows-never-widens
title: One allowlist for every laptop, and who can widen it
card: sandboxes
kind: tradeoff
level: 3
roles: [forward-deployed-ai-engineer, agentic-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [system-design, design-review]
tags: [sandbox, governance, audit-log, network-policy, compliance]
minutes: 10
lessons: []
manuals: [docker-sandboxes-101#s-org-policies-profiles-and-the-audit-log, docker-sandboxes-101#s-sbx-policy-init-allow-deny-and-check-network]
practice: []
cheatsheet: [sandbox-policy, ai-governance]
related: [sandboxes/deny-wins-and-the-two-scopes]
updated: 2026-11-03
---

Bộ phận bảo mật muốn một danh sách cho phép trên mọi laptop lập trình viên, một bản ghi của mỗi host mà một agent tiếp cận, và bằng chứng rằng không lập trình viên nào có thể mở rộng danh sách. So sánh chính sách cục bộ trên mỗi laptop với một chính sách tổ chức từ sản phẩm quản trị. Điều gì thay đổi trên một laptop ngay khi một chính sách hoạt động, và một bản ghi kiểm toán giữ gì?

## Short answer

Chính sách cục bộ cho mỗi laptop preset và các quy tắc riêng, một `policy log` theo từng host, và một lập trình viên có thể thêm một cho phép toàn cục tùy ý, nên nó không đạt yêu cầu thứ ba. Một chính sách tổ chức được viết tập trung, đến daemon trong vòng 5 phút, và từ đó chỉ các quy tắc cho phép tổ chức cấp truy cập: các quy tắc cho phép cục bộ và kit ngừng hoạt động, các quy tắc từ chối cục bộ và kit vẫn áp dụng, và một từ chối cục bộ thậm chí thắng một yêu cầu phê duyệt tổ chức. Daemon sau đó ghi một bản ghi kiểm toán JSONL mỗi quyết định, giữ metadata như quyết định, resource, lý do từ chối, loại hành động và agent, và không bao giờ nội dung prompt, đầu ra agent hoặc các giá trị tham số; chi phí là một gói đăng ký trả phí, và phạm vi bao phủ chỉ là các sandbox cục bộ.

## Full answer

### What the organization can write

Có ba loại chính sách: truy cập mạng, truy cập hệ thống file và truy cập MCP. Một quy tắc mạng là HTTP, một đích với các phương thức và mẫu đường dẫn, hoặc mọi lưu lượng qua TCP, UDP hoặc cả hai, với cho phép hoặc từ chối, và nó có thể yêu cầu phê duyệt để mỗi đích được cho phép chờ một lần cho xác nhận của lập trình viên. Một chính sách MCP là Cedar trong namespace `MCP`, mặc định từ chối, nơi một `forbid` thắng mọi `permit`. Một tổ chức giữ nhiều nhất 100 chính sách, mỗi chính sách 250 quy tắc và 400 KB. Các quy tắc mạng áp dụng cho yêu cầu tiếp theo, các quy tắc hệ thống file chỉ khi một sandbox được tạo, và các quy tắc đăng ký MCP ở `sbx mcp add` tiếp theo.

### What the laptop loses and keeps

| Quy tắc | Được đánh giá dưới quản trị |
|---|---|
| cho phép tổ chức | có |
| từ chối tổ chức | có |
| cho phép cục bộ | không |
| từ chối cục bộ | có |
| cho phép kit | không |
| từ chối kit | có |

`sbx policy reset` buộc việc lấy về với cái giá là mọi quy tắc cục bộ và phê duyệt được ghi lại. Kiểm tra cho một chính sách hoạt động là dòng `Governance: Managed by <org>` trong `sbx policy ls`, và `check network` báo `"governance": {"active": false}` trên một máy không được quản lý, đó là điều bản ghi đã cho thấy. Việc thực thi đăng nhập liệt kê `allowedOrgs` trong một hồ sơ được quản lý, và `sbx login` sau đó thu hồi một thông tin xác thực từ bất kỳ tài khoản nào khác.

### The audit record

Daemon chỉ ghi các bản ghi cho một người dùng đã đăng nhập có giấy phép quản trị dưới một chính sách được thực thi; CLI không bao giờ ghi bản ghi nào. Các file có tên `audit-<utc-timestamp>-<process-uuid>-<seq>.jsonl`, được hoàn tất từ `.tmp` mỗi 5 phút, 1000 sự kiện hoặc 50 MiB, và không bao giờ bị xóa. `category` là management, evaluation hoặc execution; `decision` có năm giá trị từ allow đến approval-deny; `action_type` nêu payload, như `network_egress`, `http_request` với phương thức, host, cổng và đường dẫn, hoặc `tool_invocation`. `deny_reason` của bản ghi mẫu mang cùng chuỗi mà một `policy log` cục bộ in: `no applicable policies for op(action=net:connect:tcp, resource=net:domain:example.com:443)`. Việc chuyển lên cloud giữ các sự kiện có thể tìm kiếm trong 90 ngày và chuyển tiếp tới các SIEM.

### Where governance stops

Nó chỉ bao phủ các sandbox cục bộ; một cloud sandbox dùng tài khoản và kho chính sách riêng. Một server được đăng ký trên host với `--command` chạy như người dùng host bên ngoài proxy. Và một quy tắc cho phép một host vẫn cho phép mọi yêu cầu tới nó trừ khi một quy tắc HTTP thu hẹp.

## Follow-ups

- **Level 3:** Một lập trình viên thêm một cho phép toàn cục cho một host mới dưới quản trị. Agent có tiếp cận nó không? Expected: không; các quy tắc cho phép cục bộ không hoạt động trong khi một chính sách hoạt động, và chỉ các cho phép của tổ chức cấp quyền.
- **Level 3:** Tổ chức thắt chặt một quy tắc hệ thống file. Những sandbox nào thấy nó? Expected: các sandbox mới; các quy tắc hệ thống file áp dụng lúc tạo, nên xóa và tạo lại các sandbox đang chạy.
- **Level 4:** Một pipeline SIEM không được mong đợi gì từ các bản ghi này? Expected: văn bản prompt, đầu ra hoặc các giá trị tham số; ánh xạ các trường theo `schema_version` và chỉ thu thập các file `.jsonl` đã hoàn tất.
- **Level 4:** Một kẻ tấn công kiểm soát một laptop vẫn sẽ mở rộng lưu lượng ra ở đâu? Expected: không đâu thông qua chính sách; một MCP server `--command` phía host hoặc một cloud sandbox dưới một tài khoản khác nằm ngoài proxy được quản trị.

## Wrong answers

- "Một chính sách tổ chức bổ sung vào danh sách cho phép cục bộ." Nó thay thế danh sách; các cho phép cục bộ và kit ngừng cấp quyền trong khi nó hoạt động.
- "Mọi laptop có nhật ký kiểm toán." Chỉ một người dùng có giấy phép, đã đăng nhập dưới một chính sách được thực thi tạo các bản ghi; bản ghi đã ghi lại không tạo bản ghi nào.
- "Một từ chối cục bộ dưới quản trị nhắc phê duyệt." Nó chặn không có lời nhắc; một từ chối thắng yêu cầu phê duyệt.

## Taught in

[Phần quản trị](../../../manuals/docker-sandboxes-101/sections/7-2-org-policies-profiles-and-the-audit-log.md) in bảng ưu tiên và bản ghi mẫu, và [phần chính sách](../../../manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md) cho thấy cờ quản trị trong `check network`.
