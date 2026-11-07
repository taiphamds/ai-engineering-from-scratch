---
id: sentinel-is-not-the-key
title: The key reads proxy-managed and the agent still works
card: sandboxes
kind: concept
level: 1
roles: [agentic-ai-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, debugging]
tags: [sandbox, secrets, proxy, sentinel, credentials]
minutes: 6
lessons: []
manuals: [docker-sandboxes-101#s-sbx-secret-set-import-and-set-custom, docker-sandboxes-101#s-sbx-and-docker-agent]
practice: []
cheatsheet: [docker-sandboxes]
related: [sandboxes/hypervisor-is-the-boundary]
updated: 2026-11-03
---

Một agent bên trong sandbox in môi trường của nó. Biến khóa provider đọc ra `proxy-managed`, và `GH_TOKEN` trông như một token thực bắt đầu bằng `gho_sbxproxymanaged`. Lập trình viên đã export khóa thực trong `~/.zshrc` và, khi điều đó thất bại, truyền `-e KEY=value`. Giải thích agent giữ gì, giá trị thực nằm ở đâu, và một yêu cầu vẫn đến provider với một khóa hợp lệ bằng cách nào.

## Short answer

Agent giữ một placeholder, không bao giờ giá trị. Có ba định dạng sentinel: `proxy-managed` cho các khóa provider, một `gho_sbxproxymanaged000000000000000000000` có dạng token cho `GH_TOKEN`, và `sbx-cs-<rand>` cho các bí mật tùy chỉnh. Giá trị nằm trong kho host, macOS Keychain, Windows Credential Manager hoặc Linux Secret Service, và proxy host thay placeholder bằng giá trị sau khi yêu cầu đã rời VM, chỉ trên một yêu cầu tới host mà bí mật được gắn. Môi trường host không được đọc từ v0.35.0, và `-e` truyền một biến thuần, không phải một bí mật.

## Full answer

### Three ways in, and one that is not

`sbx secret set` lưu một giá trị dưới một trong 13 tên dịch vụ, từ `-t`, stdin, `--command` hoặc `--ref`, và `--refresh` đặt một thời gian cache với mặc định 55 phút. `sbx secret import` đọc môi trường host một lần, hiển thị mỗi ứng viên với một bản xem trước last-4, và lưu những gì bạn chấp nhận. `sbx secret set-custom` gắn một giá trị với các đích `--host` và một tên `--env` riêng của bạn.

`-e KEY=VALUE` là đường thứ tư và nó không phải một đường bí mật. Biến đến phiên agent dưới dạng văn bản thuần, và một `sbx template save` sau đó sao chép nó cùng mọi file khác trong hệ thống file container.

### What the receiver on the host saw

Lần chạy được ghi lại gắn một bí mật tùy chỉnh với `host.docker.internal` và `localhost`, khởi động một bộ nhận trên host tại `127.0.0.1:18080`, và gửi các yêu cầu từ bên trong với placeholder ở ba nơi. Bộ nhận ghi nhật ký giá trị thực bên trong `Bearer`, trong một header `X-Demo` và như toàn bộ giá trị `Authorization`. Vì vậy phép thay xảy ra trên HTTP thuần và nó là một phép thay chuỗi con ở bất kỳ đâu trong yêu cầu tới một host được gắn.

Một yêu cầu thứ tư đi tới một tên được liệt kê trong `NO_PROXY`, nên curl bỏ qua forward proxy. Đường trong suốt chặn nó và không thay gì. Sandbox hiện có không bao giờ nhận biến tùy chỉnh mới; một bí mật tùy chỉnh chỉ đến các sandbox mới. Việc loại bỏ có hiệu lực ngay cho các sandbox đang chạy.

### The one credential path that does cross

Chuyển tiếp SSH agent bật theo mặc định. Guest thấy `SSH_AUTH_SOCK=/run/ssh-agent.sock` với một gateway trên cổng 3129. Khóa riêng ở lại trên host, và bất kỳ tiến trình nào bên trong có thể yêu cầu agent đó ký. `ssh.agentForwardingEnabled` tắt nó, theo sau bởi một lần khởi động lại daemon.

## Follow-ups

- **Level 1:** Tại sao export trong hồ sơ shell không thay đổi gì bên trong? Expected: từ v0.35.0 môi trường host không được đọc; lưu giá trị bằng `sbx secret set` hoặc `sbx secret import`.
- **Level 2:** Cái giá của `-e API_KEY=...` ngoài sự tiện lợi là gì? Expected: giá trị hiển thị cho agent và cho mọi template được lưu từ sandbox đó, và không phép thay proxy nào bảo vệ nó.
- **Level 2:** Placeholder cũng xuất hiện trong một query string của một yêu cầu tới host được gắn. Điều gì đến? Expected: giá trị thực, vì phép thay là một phép thay chuỗi con ở bất kỳ đâu trong yêu cầu.
- **Level 3:** Tại sao gắn một bí mật tùy chỉnh với các host chính xác thay vì một mẫu rộng? Expected: proxy điền placeholder trên bất kỳ yêu cầu nào tới một host được gắn, nên một binding rộng cho phép agent chuyển giá trị tới một đích bạn không dự định.

## Wrong answers

- "Agent cần khóa thực nếu không lệnh gọi provider thất bại." Proxy thêm khóa sau khi yêu cầu rời VM; lần chạy được ghi lại trả lời đúng với `proxy-managed` bên trong.
- "`GH_TOKEN` bên trong là một token thực bị rò rỉ." Nó là một sentinel có dạng token để các công cụ chấp nhận; giá trị ở lại trên host.
- "Export khóa trên host và sandbox kế thừa nó." Đường đó đã đóng trong v0.35.0; một hướng dẫn nói như vậy đã lỗi thời.

## Taught in

[Phần bí mật](../../../manuals/docker-sandboxes-101/sections/3-5-sbx-secret-set-import-and-set-custom.md) ghi lại các sentinel và nhật ký bộ nhận, và [phần đầu](../../../manuals/docker-sandboxes-101/sections/1-1-sbx-and-docker-agent.md) nêu ai sở hữu kho và proxy.
