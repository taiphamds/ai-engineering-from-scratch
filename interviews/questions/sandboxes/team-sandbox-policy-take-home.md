---
id: team-sandbox-policy-take-home
title: Six engineers, one repository, one reviewable sandbox setup
card: sandboxes
kind: take-home
level: 4
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [take-home, system-design]
tags: [sandbox, network-policy, kit, environment-file, secrets, take-home]
minutes: 60
lessons: []
manuals: [docker-sandboxes-101#s-sbx-policy-init-allow-deny-and-check-network, docker-sandboxes-101#s-sbx-policy-log-and-the-proxy, docker-sandboxes-101#s-com-docker-sandbox-capabilities, docker-sandboxes-101#s-sbxenv-yaml-and-sbx-env-plan, docker-sandboxes-101#s-clone-and-run-sandbox-source, docker-sandboxes-101#s-sbx-secret-set-import-and-set-custom]
practice: []
cheatsheet: [docker-sandboxes, sandbox-policy]
related: [sandboxes/deny-wins-and-the-two-scopes, sandboxes/kit-grants-union-and-widen, sandboxes/clone-mode-and-the-hidden-hook]
updated: 2026-11-03
---

Bài làm ở nhà. Sáu kỹ sư chạy các agent lập trình trên một repository. Yêu cầu: các agent tiếp cận registry gói và một API nội bộ, và trên API đó chỉ `GET` và `POST`, không bao giờ `DELETE`; một agent không bao giờ có thể thay các hook hoặc script trong repository host; tồn tại một khóa provider dùng chung và không bao giờ đi vào một VM; một người đóng góp mới nhận cùng cấu hình từ một file được đưa vào repository và thấy một kế hoạch trước khi bất cứ thứ gì chạy; và mọi host mà một agent tiếp cận phải có thể giải thích sau đó. Bàn giao lựa chọn chính sách, kit, file môi trường, xử lý bí mật, các kiểm thử bạn cung cấp và bằng chứng mà một người review nên mong đợi.

## Short answer

Khởi tạo một preset toàn cục và ghi lại `sbx policy ls --wide --json` trước khi tin nó. Đặt các host dùng chung trong `network-policy@2` của một kit dưới dạng các mục có giới hạn với `hosts` và `methods` cùng một từ chối `DELETE`, để quyền cấp đi cùng tham chiếu kit và đến dưới dạng `created_via: provisioned`, không phải các cho phép cục bộ của sáu laptop. Dùng chế độ clone thông qua đối tượng workspace của file môi trường để repository host đi vào chỉ đọc, lưu khóa bằng `sbx secret set` và để `credential@1` gắn nó để VM thấy `proxy-managed`, và đưa `sbxenv.yaml` vào repository với `sbx env plan` làm cổng. Kiểm thử bằng `check network --json` cho một host được cho phép, một host bị từ chối và một host không khớp, bằng một yêu cầu thực từ bên trong cho quy tắc phương thức, và bàn giao kế hoạch, danh sách chính sách, các kết quả kiểm tra và các dòng `policy log`.

## Full answer

### Policy preset

`policy init` đặt chính sách toàn cục đầu tiên một lần. `deny-all` biến mọi host không khớp thành một yêu cầu phê duyệt; `balanced` cung cấp một danh sách cho phép mặc định dài thay đổi giữa các bản phát hành không có changelog. Dù cách nào, danh sách được ghi lại với phiên bản và ngày là một phần của sản phẩm bàn giao. Các quy tắc nhóm đi trong kit, không trong các quy tắc toàn cục, vì một quy tắc kit đi cùng tham chiếu và chủ sandbox không thể chỉnh sửa. Dưới quản trị tổ chức, các quy tắc cho phép cục bộ và kit đều không hoạt động, nên các host registry và API khi đó cũng cần các quy tắc cho phép tổ chức.

### Kit

Một capability `network-policy@2` với một chuỗi host cho registry và một đối tượng có giới hạn cho API: `hosts`, `methods: [GET, POST]`, và một mục từ chối cho `DELETE`. Một mục có giới hạn cấp các yêu cầu đó và không gì khác trên host đó, một từ chối thắng trên phép hợp, và runtime trả lời một yêu cầu bị từ chối bằng `403`. Thêm `credential@1` cho provider với `apiKey.proxyManaged`, và nhớ rằng mọi domain inject phải xuất hiện trong danh sách cho phép của cùng pha. Build bằng một builder `docker-container` và ghim digest.

### Environment file

`sbxenv.yaml` khai báo `name`, `agent`, kit như một `source` hoặc tham chiếu, workspace trong dạng đối tượng cho chế độ clone, `secrets` và `bindings`, và `ports` tùy chọn. File được bind chỉ đọc bên trong sandbox, vì một agent có thể sửa nó quyết định kế hoạch tiếp theo hỏi về điều gì. Tránh các lệnh host `lifecycle` trừ khi bạn chấp nhận chi phí: chúng chạy trên host với đặc quyền của người dùng, và một môi trường khai báo bất kỳ lệnh nào trong số đó hỏi ở mỗi lần gọi.

### Secrets

Khóa đi vào bằng `sbx secret set`, có phạm vi toàn cục hoặc theo từng sandbox, và agent thấy một sentinel. Không bao giờ `-e`, không bao giờ `env:` trong file. Một kế hoạch hiển thị một giá trị bí mật nguyên văn như digest SHA-256 của nó, đó là gợi ý rằng nó đã đi vào sai nơi.

### Tests to ship

1. `sbx policy check network --sandbox NAME <registry>:443 --json` trả về `allowed: true`; host API tương tự; một host không liên quan trả về `deny_kind: implicit`, và một host bạn đã từ chối trả về `explicit` với id quy tắc.
2. Một `DELETE` thực từ bên trong sandbox nhận `403` với phần thân của proxy, vì cả `check network` lẫn `policy log` đều không đánh giá một phương thức hoặc một đường dẫn.
3. `sbx env plan` trên một clone mới in chỉ các dòng `+` và cảnh báo lệnh host chỉ khi bạn giữ một block `lifecycle`; một kế hoạch thứ hai sau một thay đổi đối số in một dòng `~`.
4. `git push` tới `origin` từ bên trong thất bại và `git fetch sandbox-<name>` trên host mang commit về.
5. `env | grep -c proxy-managed` bên trong khác không và bộ nhận bạn kiểm soát ghi nhật ký giá trị thực chỉ trên host được gắn.

### Evidence

Đầu ra kế hoạch, danh sách chính sách với phiên bản và ngày, descriptor kit và digest của nó, ba kết quả JSON `check network`, bản ghi `403`, và các dòng `policy log --json` với `proxy_type` và `rule` cho mỗi host đã tiếp cận.

## Follow-ups

- **Level 3:** Tại sao không để mỗi kỹ sư thêm hai host bằng `sbx policy allow network`? Expected: sáu bản sao trôi dạt và chúng có thể chỉnh sửa; một quy tắc kit đi cùng tham chiếu và được cấp sẵn. Dưới quản trị cả hai ngừng cấp quyền, và chỉ các quy tắc cho phép tổ chức áp dụng.
- **Level 4:** Bạn chứng minh quy tắc phương thức giữ vững bằng cách nào khi lệnh kiểm tra không thể thấy phương thức? Expected: gửi một yêu cầu thực từ bên trong và mong đợi `403` của proxy; nhật ký chỉ ghi các host và số đếm.
- **Level 4:** Kế hoạch của một người đóng góp hiển thị một dòng `!`. Nó nghĩa là gì? Expected: một resource mà môi trường đã áp dụng trước đó và không còn khai báo; review trước khi áp dụng.
- **Level 4:** File giữ một block `lifecycle`. Bạn nói gì với nhóm? Expected: nó chạy trên host với đặc quyền của họ, nó nhắc ở mỗi lần gọi, phê duyệt nó là tin script, và `--skip-host-commands` tồn tại cho một lượt chạy thử.

## Wrong answers

- "Cho phép `**` và dựa vào mount clone." `**` cấp mọi host; danh sách cho phép ngừng có ý nghĩa.
- "Đặt khóa dưới `env:` để mọi người nhận nó." Nó là một biến thuần bên trong VM và trong mọi template được lưu từ nó; dùng `secrets` và proxy.
- "Mount repository `:ro` để bảo vệ các hook." Agent cũng không thể commit; chế độ clone cho nó một clone ghi được và giữ host chỉ đọc.

## Taught in

[Phần chính sách](../../../manuals/docker-sandboxes-101/sections/3-3-sbx-policy-init-allow-deny-and-check-network.md) và [phần proxy](../../../manuals/docker-sandboxes-101/sections/3-4-sbx-policy-log-and-the-proxy.md) cung cấp các quy tắc và nhật ký, [phần capability](../../../manuals/docker-sandboxes-101/sections/4-2-com-docker-sandbox-capabilities.md) cung cấp các mục có giới hạn, [phần file môi trường](../../../manuals/docker-sandboxes-101/sections/4-4-sbxenv-yaml-and-sbx-env-plan.md) cung cấp kế hoạch, và các phần [clone](../../../manuals/docker-sandboxes-101/sections/3-2-clone-and-run-sandbox-source.md) và [bí mật](../../../manuals/docker-sandboxes-101/sections/3-5-sbx-secret-set-import-and-set-custom.md) cung cấp hai yêu cầu còn lại.
