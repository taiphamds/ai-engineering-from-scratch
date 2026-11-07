---
id: published-port-answers-ipv4-only
title: The port that answers on one loopback and refuses the other
card: sandboxes
kind: debug
level: 2
roles: [agentic-ai-engineer, applied-ai-engineer]
rounds: [debugging, coding]
tags: [sandbox, ports, exec, cp, networking]
minutes: 6
lessons: []
manuals: [docker-sandboxes-101#s-sbx-exec-cp-and-ports]
practice: []
cheatsheet: [docker-sandboxes]
related: [sandboxes/hypervisor-is-the-boundary]
updated: 2026-11-03
---

Bạn công bố `18081:8080` bằng `sbx ports`. Một client trên host kết nối tới `[::1]:18081` nhận một kết nối bị từ chối, trong khi `127.0.0.1:18081` trả lời 200. Giải thích mặc định, viết đặc tả sửa được nó, và nêu hai động từ `sbx` khác có quy tắc khác với các đối tác `docker`.

## Short answer

Không có giao thức trong đặc tả, lệnh công bố dùng `tcp4`, nên binding host chỉ là `127.0.0.1`; điều đó thay đổi trong v0.42.0, và `curl` tới `::1` được ghi lại thất bại với mã thoát 7. Công bố `8080/tcp` để bind cả hai loopback, mỗi cái trên một cổng host tạm thời, và bỏ công bố không có giao thức loại cả hai dạng. Hai động từ kia là `sbx exec`, chạy như người dùng `agent`, khởi động một sandbox đã dừng và không có chế độ tách rời, và `sbx cp`, cần một phía được viết là `SANDBOX:PATH` và từ chối một lần sao chép giữa hai sandbox.

## Full answer

### The address family table

| `PROTOCOL` | Binding host khi `HOST_IP` bị bỏ qua |
|---|---|
| không có | `127.0.0.1` dưới dạng `tcp4`, hoặc `tcp6` trên `::1` khi `HOST_IP` là một địa chỉ IPv6 |
| `tcp`, `udp` | `127.0.0.1` và `::1`, hoặc chỉ `127.0.0.1` khi sandbox chỉ có IPv4 |
| `tcp4`, `udp4` | `127.0.0.1` |
| `tcp6`, `udp6` | `::1` |

`sbx ports SANDBOX --json` liệt kê mọi binding dưới dạng `host_ip`, `host_port`, `sandbox_port` và `protocol`, và `sbx ls` in chúng trong cột `PORTS`. `-p` trên `sbx run` chỉ áp dụng lúc tạo và bị bỏ qua khi gắn lại, nên các thay đổi sau đi qua `sbx ports`. Công bố khởi động một sandbox đã dừng trước. Trong cloud, một cổng được công bố nhận một URL công khai và UDP bị từ chối.

### exec and cp

`sbx exec` chạy lệnh như uid 1000 trong các nhóm `sudo` và `docker`, trong thư mục workspace, và `-u root` là cách phần trợ giúp cài các gói. `-d` chỉ xuất hiện trong phần trợ giúp để nói rằng exec tách rời không được hỗ trợ, và với `--cloud`, các cờ `-d`, `--user` và `--privileged` bị từ chối thay vì bị bỏ qua. Bên trong, `SANDBOX_NAME` và `SANDBOX_ID` nêu sandbox và `WORKSPACE_DIR` nêu mount.

`sbx cp SRC DST` nhận một phía sandbox dưới dạng `SANDBOX:PATH` và một phía host. Lần sao chép được ghi lại từ một sandbox sang một sandbox khác thoát với mã 1 cùng `copying between sandboxes is not supported`, nên một lần sao chép như vậy đi qua host trong hai bước. Một đường dẫn sandbox là một đường dẫn container, nên một file dưới `/tmp` nằm ngoài mount workspace và biến mất cùng sandbox. Sao chép ra có một lịch sử bảo mật: bản phát hành v0.38.0 sửa CVE-2026-17106, một lỗi cho phép một lần sao chép ra thoát khỏi đích của nó.

## Follow-ups

- **Level 2:** Bạn gắn lại với `-p 18081:8080` trên một sandbox được tạo không có nó, và không có gì được công bố. Tại sao? Expected: `-p` chỉ áp dụng lúc tạo; dùng `sbx ports --publish` trên sandbox hiện có.
- **Level 3:** `sbx cp a:/tmp/x b:/tmp/x` thất bại. Bạn chuyển file bằng cách nào? Expected: hai lần sao chép qua một đường dẫn host, vì sao chép sandbox-tới-sandbox không được hỗ trợ.
- **Level 3:** Tại sao `--cloud` từ chối `--privileged` thay vì bỏ qua nó? Expected: một cờ bị bỏ qua âm thầm sẽ để một script tin nó đã chạy có đặc quyền; từ chối giữ hành vi cục bộ và cloud trung thực.
- **Level 4:** Bạn bind `8080/tcp` rồi sau đó bỏ công bố `8080` không có giao thức. Điều gì còn lại? Expected: không có gì; bỏ công bố không có giao thức loại cả dạng mặc định và dạng dual-stack.

## Wrong answers

- "IPv6 bị tắt bên trong VM." Họ binding là một lựa chọn phía host được quyết định bởi giao thức trong đặc tả.
- "Bỏ công bố phải lặp giao thức bạn đã công bố." Nó loại ánh xạ trong cả hai trường hợp khi không có giao thức.
- "`sbx exec -d` chạy lệnh ở nền." Exec tách rời không được hỗ trợ; cờ tồn tại trong phần trợ giúp để nói như vậy.

## Taught in

[Phần exec, cp và ports](../../../manuals/docker-sandboxes-101/sections/2-2-sbx-exec-cp-and-ports.md) ghi lại binding `tcp4`, hai kết quả `curl` và lần sao chép bị từ chối.
