---
id: template-or-kit-for-the-toolchain
title: Share an hour of installs as a template or as a kit
card: sandboxes
kind: tradeoff
level: 2
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [system-design, design-review]
tags: [sandbox, template, kit, snapshot, secrets]
minutes: 8
lessons: []
manuals: [docker-sandboxes-101#s-sbx-template-save-and-load, docker-sandboxes-101#s-sbx-cloud-run-move-and-ttl]
practice: []
cheatsheet: [docker-sandboxes]
related: [sandboxes/sentinel-is-not-the-key]
updated: 2026-11-03
---

Một đồng đội đã dành một giờ cài một toolchain bên trong một sandbox và muốn mọi người bắt đầu từ nó ngày mai. Một lựa chọn là `sbx template save` và một tar; lựa chọn kia là một kit khai báo các bước cài đặt. So sánh hai cách, và nêu những gì một template mang mà một kit không bao giờ mang.

## Short answer

Một template là một snapshot của hệ thống file container được lưu như một image, dùng lại bằng `sbx run --pull never -t TAG AGENT` và mang sang host khác như một OCI tar thông qua `sbx template load`; nó nhanh và chính xác, và nó là các byte không ai review. Một kit khai báo các lệnh cài đặt, file, host và thông tin xác thực, nên nó đọc được, ký được và được phân giải lại lúc tạo, và một template không giữ thiết lập runtime nào trong số đó. Template có giữ mọi file mà một agent viết bên trong, bao gồm bất kỳ khóa nào được ghi xuống đĩa, đó là lý do thông tin xác thực thuộc về `sbx secret` chứ không trong một sandbox đã lưu.

## Full answer

### What a template holds and leaves out

Các hệ thống file được mount không nằm trong nó: workspace host và kho của engine bị loại, nên một template đã lưu không phải một bản sao lưu của toàn bộ sandbox. Mọi thứ khác trong hệ thống file container nằm trong nó. Các file cấu hình agent như file thiết lập của agent được viết lại mỗi khi một sandbox được tạo, nên các chỉnh sửa ở đó cũng không tồn tại. Kit vẫn cung cấp các thiết lập runtime, thông tin xác thực và các quy tắc mạng; template chỉ cung cấp nội dung image.

### The mechanics that trip people

`sbx template save SANDBOX TAG` cần một sandbox đã dừng; lần thử được ghi lại trên một sandbox đang chạy in `cannot save a running sandbox`. Image đi vào kho riêng của runtime sandbox, tách biệt với kho daemon host, nên `docker image inspect` trên host không tìm thấy gì và `sbx template ls` là lệnh đúng. Tar được xuất có 24 mục trong bố trí OCI, và `sbx template load FILE` nhập nó trên một host khác mà không có registry tham gia. Nêu agent mà template được xây cho khi bạn dùng lại; một template được xây cho một agent và chạy như một agent khác in một cảnh báo rằng sandbox có thể thất bại.

### The same trade in `sbx move`

Di chuyển một sandbox lên cloud chụp hệ thống file thành một image template và tải nó lên. Các quy tắc mạng kit và môi trường cục bộ đi bên trong image. Bind mount host, các bí mật trong kho, các quy tắc chính sách cục bộ, các binding cổng host và các tiến trình đang chạy ở lại. Các file thông tin xác thực được ghi bởi một lần đăng nhập tương tác là các file thông thường, nên chúng di chuyển trừ khi bạn xóa trước. Di chuyển trở về cục bộ có thể chuẩn bị tối đa 32 GiB trong thư mục tạm của host.

### The decision

| Nhu cầu | Chọn |
|---|---|
| các byte chính xác, hôm nay, một nhóm | template, với các bí mật được giữ ngoài file |
| review, chữ ký, phân giải lại, chính sách | kit |
| một chính sách hoặc một thông tin xác thực | kit, vì một template không thể biểu diễn nó |

## Follow-ups

- **Level 2:** `sbx template save` trên sandbox đang chạy thất bại. Trình tự là gì? Expected: `sbx stop`, rồi lưu với `--output` cho tar, rồi `sbx run --pull never -t TAG AGENT` với cùng agent.
- **Level 2:** `docker image ls` của host không liệt kê template. Nó ở đâu? Expected: trong kho image của runtime sandbox, mà daemon host không dùng chung; dùng `sbx template ls`.
- **Level 3:** Một agent đăng nhập vào một dịch vụ một cách tương tác bên trong sandbox. Điều gì xảy ra với thông tin xác thực đó trên `sbx move` hoặc `template save`? Expected: nó là một file trong hệ thống file container và đi trong image trừ khi bị xóa trước.
- **Level 3:** Một đồng nghiệp muốn cùng các host được cho phép như tác giả template. Template có cho họ điều đó không? Expected: không; các quy tắc mạng đến từ một kit hoặc một chính sách, và một template chỉ mang nội dung image.

## Wrong answers

- "Một template là một bản sao lưu của sandbox." Các workspace được mount và kho của engine bị loại.
- "Template mang các host được cho phép." Kit mang các thiết lập runtime; template mang các byte.
- "Các khóa bên trong an toàn vì môi trường hiển thị `proxy-managed`." Sentinel an toàn; một giá trị mà một agent ghi vào một file được sao chép cùng file.

## Taught in

[Phần template](../../../manuals/docker-sandboxes-101/sections/2-3-sbx-template-save-and-load.md) ghi lại lần lưu bị từ chối, kho riêng và tar, và [phần cloud](../../../manuals/docker-sandboxes-101/sections/7-1-sbx-cloud-run-move-and-ttl.md) liệt kê những gì `sbx move` mang.
