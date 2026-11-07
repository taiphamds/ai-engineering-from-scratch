---
id: blocked-host-reads-as-timeout
title: The host that timed out in 90 bytes
card: sandboxes
kind: debug
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [debugging, coding]
tags: [sandbox, network-policy, proxy, policy-log, tls]
minutes: 8
lessons: []
manuals: [docker-sandboxes-101#s-sbx-policy-log-and-the-proxy, docker-sandboxes-101#s-sbx-policy-init-allow-deny-and-check-network]
practice: []
cheatsheet: [docker-sandboxes, sandbox-policy]
related: [sandboxes/deny-wins-and-the-two-scopes]
updated: 2026-11-03
---

Agent của bạn báo rằng `example.com` qua HTTPS hết thời gian chờ bên trong sandbox, và `npm install` thất bại với một lỗi kết nối. Sandbox không giữ lịch sử shell. Cho thấy cách bạn tìm ra quy tắc nào đã quyết định, và chứng minh đây là một quyết định chính sách chứ không phải một lỗi mạng.

## Short answer

Nó không hết thời gian chờ: proxy chấp nhận `CONNECT`, rồi trả lời bên trong phiên TLS bằng `403 Forbidden` và một phần thân 90 byte ghi `Approval required for example.com:443`. Chạy `sbx policy log SANDBOX --json` và đọc dòng `blocked_hosts`: `proxy_type`, văn bản `rule` và `reason`. Rồi chạy `sbx policy check network --sandbox NAME example.com:443 --json` và đọc `deny_kind`, nơi `implicit` nghĩa là không quy tắc nào khớp và mặc định từ chối, và `explicit` nêu quy tắc từ chối. Thêm một cho phép trong đúng phạm vi, hoặc loại từ chối trước.

## Full answer

### What curl shows

Với `-I`, yêu cầu in hai dòng trạng thái. `HTTP/1.1 200 OK` là proxy chấp nhận đường hầm. `HTTP/1.1 403 Forbidden` với `Content-Length: 90` đến bên trong TLS, dưới cơ quan chứng nhận riêng của proxy, được guest tin vì `PROXY_CA_CERT_B64` được gộp vào `/etc/ssl/certs/ca-certificates.crt`. Agent đọc phần thân như một lỗi và gọi nó là timeout.

Sau `sbx policy allow network --sandbox NAME example.com`, cùng yêu cầu nhận `HTTP/1.0 200 Connection established` rồi `HTTP/2 200` từ nguồn. Nhật ký phân loại lần đó là `forward-bypass`: một đường hầm không kiểm tra và không chèn thông tin xác thực. Proxy chỉ kết thúc TLS khi nó phải lên tiếng, trên một host bị chặn hoặc một host có thông tin xác thực được gắn.

### Reading the log

Mỗi dòng `blocked_hosts` mang `host`, `vm_name`, `proxy_type`, `rule`, `reason`, `last_seen`, `since` và `count_since`. Văn bản `rule` nêu thao tác, `op(action=net:connect:tcp, resource=net:domain:example.com:443)`, và hoặc `no applicable policies` hoặc quy tắc đã khớp. Một dòng được cho phép có thể mang `rule` trống, nên nhật ký nói một host đã được cho qua và `check network` nói tại sao. `PROXY` nhận năm giá trị: `forward`, `forward-bypass`, `transparent`, `network` và `browser-open`.

### When npm cannot resolve the host

Một từ chối bao phủ nhiều hơn TCP. Từ v0.33.0, một tiến trình trong sandbox không thể phân giải một domain mà chính sách từ chối, ngoại trừ các tên loopback, và từ v0.45.0, DNS dừng khi không quy tắc nào cho phép host. ICMP đi ra vẫn bị chặn và không thể được cho phép. Card cho đến giờ chỉ cho thấy một từ chối đối với `example.com`, và `registry.npmjs.org:443` nằm trên danh sách cho phép mặc định `balanced`, nên trước tiên tìm host npm trong `blocked_hosts`. Nếu một dòng nêu nó, lỗi kết nối từ npm là việc tra cứu thất bại, trông như một lỗi mạng và là một quyết định chính sách. Nếu không dòng nào nêu nó, tìm một nguyên nhân khác.

### The bypass that is not one

Một yêu cầu tới một tên được liệt kê trong `NO_PROXY` bỏ qua forward proxy và mở một kết nối TCP thuần. Đường trong suốt bắt nó, chặn nó, và nhật ký ghi `transparent`. Cả hai đường thực thi cùng chính sách.

## Follow-ups

- **Level 2:** Một dòng được cho phép cho thấy một trường `rule` trống. Lệnh nào cho bạn biết quy tắc nào đã cho nó vào? Expected: `sbx policy check network` với cùng ngữ cảnh; nhật ký ghi một host đã được cho qua và phép kiểm tra nêu quy tắc.
- **Level 2:** Phân giải tên có nằm ngoài chính sách không? Expected: không; một domain bị từ chối không phân giải, và từ v0.45.0 chính việc tra cứu dừng khi không quy tắc nào cho phép.
- **Level 3:** `deny_kind` là `explicit`. Điều gì thay đổi về cách sửa? Expected: một từ chối tồn tại cho host đó trong phạm vi đó, và CLI từ chối một cho phép xung đột với nó, nên loại từ chối trước hoặc chuyển phạm vi.
- **Level 3:** Tại sao `curl -I` in một 200 trước 403? Expected: 200 là đường hầm được chấp nhận, và 403 là câu trả lời riêng của proxy bên trong phiên TLS mà nó đã kết thúc.

## Wrong answers

- "Mạng chập chờn, thử lại với timeout dài hơn." Proxy trả lời ngay bằng một phần thân nêu lệnh phê duyệt; không có gì chờ.
- "Đặt host trong `NO_PROXY` để yêu cầu đi vòng proxy." Đường trong suốt bắt kết nối trực tiếp và chặn nó; nhật ký cho thấy nó là `transparent`.
- "Thư viện TLS của agent hỏng vì chứng chỉ không xác định." Guest tin CA của proxy có chủ đích; đó là cách 403 đến bên trong TLS.

## Taught in

[Phần proxy](../../../manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md) ghi lại các yêu cầu bị chặn và được cho phép cùng các dòng nhật ký, và [phần chính sách](../../../manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md) cho thấy hai loại từ chối từ `check network`.
