---
id: exfil-through-an-allowed-host
title: The allowlist that still lets the repository leave
card: sandboxes
kind: design
level: 4
roles: [agentic-ai-engineer, forward-deployed-ai-engineer, ai-evaluation-reliability-engineer]
rounds: [design-review, system-design]
tags: [sandbox, network-policy, exfiltration, http-rules, proxy]
minutes: 12
lessons: []
manuals: [docker-sandboxes-101#s-sbx-policy-log-and-the-proxy, docker-sandboxes-101#s-com-docker-sandbox-capabilities, docker-sandboxes-101#s-org-policies-profiles-and-the-audit-log]
practice: []
cheatsheet: [sandbox-policy, ai-security-incidents]
related: [sandboxes/blocked-host-reads-as-timeout, sandboxes/kit-grants-union-and-widen, sandboxes/governance-narrows-never-widens]
updated: 2026-11-03
---

Preset balanced cho phép `github.com:443` và `**.github.com:443`. Một người review lập luận rằng một agent đọc một repository riêng tư có thể đăng nội dung của nó vào một issue hoặc một gist trên cùng host được cho phép đó, nên danh sách cho phép chỉ là hình thức. Đánh giá khẳng định, nêu sản phẩm có thể và không thể thấy gì trên kết nối đó, và thiết kế việc thu hẹp.

## Short answer

Khẳng định đúng với các quy tắc host: một cho phép host cho phép mọi yêu cầu tới host đó với bất kỳ phương thức, đường dẫn và phần thân nào, chính nhân viên nhà cung cấp đã nói vào năm 2026 rằng một phần thân issue hoặc một gist trên một host được cho phép không bị chặn, và tài liệu ghi khẳng định là bị tranh cãi mà không có bản ghi nào kiểm thử nó. Trên một kết nối được cho phép, proxy chạy `forward-bypass`, một đường hầm không kiểm tra và không chèn thông tin xác thực; nó chỉ kết thúc TLS để lên tiếng trên một host bị chặn hoặc để chèn trên một host có thông tin xác thực được gắn. Việc thu hẹp là một quy tắc HTTP, một mục `network-policy@2` của kit với `methods` và `paths` hoặc một quy tắc HTTP tổ chức, cùng với ít thứ để đọc hơn ngay từ đầu: chế độ clone với các bí mật ngoài repository, và deny-all với phê duyệt để một host bất ngờ chờ một người.

## Full answer

### What the proxy sees, and when

Các agent gửi HTTP và HTTPS qua một forward proxy, và TCP khác được chuyển tiếp trong suốt; cả hai đường thực thi chính sách. Guest tin cơ quan chứng nhận của proxy, đó là lý do một host bị chặn nhận một `403` bên trong TLS với một phần thân phê duyệt. Sau một cho phép, yêu cầu được ghi lại nhận `HTTP/1.0 200 Connection established` rồi `HTTP/2 200` của chính nguồn, và nhật ký phân loại nó là `forward-bypass`. Vì vậy trên đường mà người review lo ngại, proxy là một đường ống. `policy log` giữ một dòng mỗi host với một số đếm yêu cầu, không phải một phần thân.

### What a host rule cannot say

Một từ chối bao phủ TCP, UDP và tra cứu tên, và ICMP không thể được cho phép. Một cho phép không nói gì về phương thức hoặc đường dẫn. Câu trả lời của sản phẩm là quy tắc HTTP: một mục `network-policy@2` với `hosts`, `methods` và `paths` cấp những yêu cầu đó và không gì khác, một mục từ chối có thể từ chối một phương thức trên một host, và proxy trả lời một yêu cầu bị từ chối bằng `403`. Một cho phép mạng là một trần mà các quy tắc HTTP khắc vào. Hai giới hạn kéo theo. Cả `check network` lẫn `policy log` đều không đánh giá một phương thức hoặc một đường dẫn, nên kiểm thử duy nhất là một yêu cầu thực. Và các cờ cục bộ `--method` và `--path` vắng mặt trong phần trợ giúp v0.47.0, nên các quy tắc HTTP đến từ kit hoặc từ một chính sách tổ chức.

### What governance adds

Một quy tắc mạng tổ chức có thể là HTTP, một đích với các phương thức và mẫu đường dẫn, và nó có thể yêu cầu phê duyệt. Dưới quản trị, chỉ các cho phép tổ chức cấp quyền, nên một lập trình viên không thể mở rộng lại host. Bản ghi kiểm toán cho `http_request` mang phương thức, host, cổng và đường dẫn, đó là nơi đầu tiên hình dạng yêu cầu trở nên hiển thị sau đó, và vẫn không bao giờ là phần thân.

### The design

1. Giảm tập có thể đọc: chế độ clone, không bí mật trong repository, không mount ở nơi tác vụ cho phép.
2. Thay cho phép host cho host mã bằng các mục có giới hạn: các đường dẫn đọc với `GET`, một đường dẫn ghi mà workflow cần với `POST`, một từ chối cho phần còn lại.
3. Giữ deny-all hoặc balanced với phê duyệt, để một đích mới là một quyết định con người để lại một quy tắc `created_via: approval`.
4. Đặt các quy tắc có giới hạn trong một kit hoặc một chính sách tổ chức, ghim kit, và xem bất kỳ cho phép mới nào là một sự mở rộng khiến phải dừng.
5. Kiểm thử bằng một `DELETE` thực và một lần post thực tới một đường dẫn ngoài quyền cấp, mong đợi `403`, và giữ các dòng `policy log` như bản ghi các host đã tiếp cận.

Điều vẫn mở được nêu rõ: một `POST` có giới hạn tới một đường dẫn ghi vẫn là một kênh. Thiết kế thu kênh về yêu cầu mà workflow cần và biến mọi đích khác thành một quyết định.

## Follow-ups

- **Level 3:** Tại sao proxy không đọc phần thân của một yêu cầu được cho phép dù nó giữ một CA mà guest tin? Expected: nó chỉ kết thúc TLS khi phải lên tiếng hoặc chèn; một host được cho phép không có thông tin xác thực được gắn là một đường hầm `forward-bypass`.
- **Level 4:** Một quy tắc phương thức được thực thi ở đâu, và bạn có thể thấy nó đã kích hoạt ở đâu? Expected: được thực thi bởi proxy từ một quy tắc kit hoặc tổ chức, hiển thị như một `403` cho yêu cầu và trong một bản ghi kiểm toán tổ chức, không trong `check network` hoặc `policy log`.
- **Level 4:** Workflow phải mở pull request. Viết quyền cấp tối thiểu. Expected: các mục `GET` có giới hạn cho các đường dẫn đọc, một `POST` có giới hạn cho đường dẫn pull-request, một từ chối cho `DELETE`, và chế độ clone để tập có thể đọc chỉ là repository.

## Wrong answers

- "Từ chối host chính và chỉ cho phép host API." Nó vẫn là một cho phép host; bất kỳ phần thân nào tới host đó đều qua.
- "Proxy có một CA, nên nó kiểm tra mọi thứ." Nó chỉ chặn giữa để chặn hoặc chèn; đường được cho phép là một đường hầm.
- "`policy log` sẽ cho thấy rò rỉ." Nó cho thấy host và một số đếm; phần thân không bao giờ xuất hiện ở đâu.

## Taught in

[Phần proxy](../../../manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md) ghi lại đường hầm và các giới hạn của một cho phép cấp host, [phần capability](../../../manuals/docker-sandboxes-101/sections/4-2-com-docker-sandbox-capabilities.md) định nghĩa các mục có giới hạn, và [phần quản trị](../../../manuals/docker-sandboxes-101/sections/7-2-org-policies-profiles-and-the-audit-log.md) cho thấy payload kiểm toán `http_request`.
