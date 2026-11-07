---
id: kit-grants-union-and-widen
title: Two mixins, one host, and the update that must stop
card: sandboxes
kind: design
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [sandbox, kit, capabilities, network-policy, supply-chain]
minutes: 10
lessons: []
manuals: [docker-sandboxes-101#s-com-docker-sandbox-capabilities, docker-sandboxes-101#s-syntax-docker-sandbox-kit-3-and-kit-yaml, docker-sandboxes-101#s-sbx-kit-pack-push-sign-and-verify]
practice: []
cheatsheet: [docker-sandboxes, sandbox-policy]
related: [sandboxes/deny-wins-and-the-two-scopes, protocols/descriptor-pin-rug-pull]
updated: 2026-11-03
---

Composition của bạn là một workload và hai mixin. Mixin A cho phép `api.example.com` hoàn toàn. Mixin B chỉ cho phép `api.example.com` với `methods: [GET]` và từ chối `DELETE` trên nó. Tuần tới mixin A phát hành một phiên bản loại một trong các mục từ chối của nó và thêm một `credential@1`. Dự đoán tập quyền cấp đã gộp, nói những cập nhật nào áp dụng âm thầm, và thiết kế bước review.

## Short answer

Các mục cho phép hợp theo từng pha, các mục từ chối hợp theo từng pha, và từ chối thắng trên kết quả. Cho phép host không giới hạn của A nuốt mục `GET` có giới hạn của B, vì hợp của một quyền cấp không giới hạn và một quyền có giới hạn là quyền không giới hạn, trong khi từ chối `DELETE` của B sống sót và thắng. Mọi quyền cấp ánh xạ lên một tập đã chuẩn hóa mà bên tiêu thụ lưu trong lock file, và một phiên bản ứng viên có tập vẫn nằm trong tập đã lưu áp dụng âm thầm; bất kỳ mở rộng nào dừng để phê duyệt, và một từ chối bị loại cùng một thông tin xác thực mới đều nằm trong danh sách đó, nên phiên bản mới của A dừng hai lần.

## Full answer

### What a capability is

Một kit không tự cấp gì cho nó. Mỗi mục trong `capabilities` là một yêu cầu có kiểu, có phiên bản, `<namespace>/<name>@<version>`, mà host trả lời bằng được cấp, bị từ chối hoặc được hỏi. `config` được giải mã nghiêm ngặt cho các kiểu mà đặc tả định nghĩa, nên một khóa không xác định là một lỗi, và lý do là chính sách: một khóa viết sai mà parser bỏ qua sẽ là một chính sách bị thiếu mà không có cảnh báo. Các kiểu không xác định được cho phép theo thiết kế; một kiểu không xác định bắt buộc làm phân giải thất bại và một kiểu tùy chọn bị bỏ qua và được ghi lại.

### network-policy@2 and credential@1

Một mục `network-policy@2` là một chuỗi host thuần, cấp kết nối cho bất kỳ giao thức nào, hoặc một đối tượng với `hosts`, `methods` và `paths`, cấp các yêu cầu HTTP đó và không gì khác trên host đó. Các mục từ chối liệt kê những gì phải từ chối, và runtime trả lời một yêu cầu bị từ chối bằng trạng thái HTTP `403`. Một mục `credential@1` nêu một `service` và một `phase` và không bao giờ nơi bí mật được giữ, và mọi domain `inject` phải xuất hiện trong danh sách cho phép của cùng pha.

### Resolution

Một composition có đúng một `workload`, và hai kit cung cấp cùng tên đã chuẩn hóa làm phân giải thất bại. Bên trong `sbx`, quyền cấp đến như một quy tắc chính sách với `created_via: provisioned` và `editable: false`, được `--source kit` liệt kê, và `check network` trả lời `allowed: true` cho nó.

### Updates and the lock

Danh sách mở rộng là tường minh: một mục cho phép mới, một mục từ chối bị loại, một thông tin xác thực, đường dẫn hoặc cổng mới, và quyền ghi trên một đường dẫn skill chỉ đọc. Một từ chối bị loại được tính vì từ chối là một phần của điều khiến quyền cấp chấp nhận được. `optional` không thay đổi tập. Sáu kiểu không đóng góp gì vào nó: `resources@1`, `lifecycle@1`, `agent-context@1`, `agent-sessions@1`, `sbx@1` và `long-running@1`.

### The review step

1. Build bằng một builder `docker-container`, vì driver mặc định bỏ annotation descriptor và một image không có nó không phải một kit đối với bất kỳ bên tiêu thụ nào.
2. Ghim mỗi kit theo digest và lưu tập đã chuẩn hóa; diff tập trên mọi ứng viên.
3. Yêu cầu chữ ký: đặt `kit.trustedSigners` trước `kit.requireSignature`, nếu không chỉ các danh tính riêng của nhà cung cấp được qua.
4. Để diff quyết định: một tập con áp dụng, một sự mở rộng mở một ticket nêu mục đó, và một từ chối bị loại là một sự mở rộng.

## Follow-ups

- **Level 3:** Tại sao bộ giải mã nghiêm ngặt xem một khóa không xác định là một lỗi thay vì một cảnh báo? Expected: một khóa bị bỏ qua âm thầm là một chính sách vắng mặt mà không ai biết.
- **Level 3:** Bạn muốn quyền cấp chỉ-`GET` của B giữ vững. Bạn thay đổi gì? Expected: loại cho phép không giới hạn của A, hoặc thêm các mục từ chối cho các phương thức khác trong B, vì một từ chối thắng trong khi một cho phép có giới hạn bị một cho phép không giới hạn nuốt.
- **Level 4:** Những kiểu capability nào không bao giờ kích hoạt phê duyệt khi cập nhật, và tại sao điều đó an toàn? Expected: sáu kiểu ràng buộc và khởi chạy, vì chúng không yêu cầu gì từ host.
- **Level 4:** Một kit đã công bố không cho thấy annotation descriptor trên index của nó. Điều gì đã xảy ra và một bên tiêu thụ làm gì? Expected: builder mặc định đã bỏ nó; một bên tiêu thụ không tìm thấy annotation trên index đọc platform manifest, và một image không có ở bất cứ đâu không phải một kit.

## Wrong answers

- "Quyền cấp hẹp nhất thắng khi các kit chồng lấn." Các cho phép hợp; mục không giới hạn nuốt mục có giới hạn, và chỉ một từ chối thu hẹp.
- "`optional: true` khiến một capability an toàn để thêm." Nó thay đổi liệu phân giải thất bại không, không phải tập quyền cấp.
- "Mọi lần tăng phiên bản cần phê duyệt." Một ứng viên có tập vẫn nằm trong tập đã lưu áp dụng âm thầm; lock là điều khiến việc đó rẻ và an toàn.

## Taught in

[Phần capability](../../../manuals/docker-sandboxes-101/sections/4-2-com-docker-sandbox-capabilities.md) cung cấp phép hợp, từ chối và danh sách mở rộng, [phần descriptor](../../../manuals/docker-sandboxes-101/sections/4-1-syntax-docker-sandbox-kit-3-and-kit-yaml.md) cho thấy giải mã nghiêm ngặt và annotation bị bỏ, và [phần ký](../../../manuals/docker-sandboxes-101/sections/4-3-sbx-kit-pack-push-sign-and-verify.md) nêu các thiết lập người ký.
