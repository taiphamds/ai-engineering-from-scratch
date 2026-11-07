---
id: readonly-database-in-the-sandbox
title: Three failures in one sandboxed agent run
card: sandboxes
kind: debug
level: 3
roles: [agentic-ai-engineer, forward-deployed-ai-engineer]
rounds: [debugging, coding]
tags: [sandbox, agent-runtime, virtiofs, sqlite, allowlist]
minutes: 10
lessons: []
manuals: [docker-sandboxes-101#s-docker-agent-run-sandbox-end-to-end, docker-sandboxes-101#s-sbx-and-docker-agent]
practice: []
cheatsheet: [docker-sandboxes, agent-harness]
related: [sandboxes/blocked-host-reads-as-timeout, sandboxes/sentinel-is-not-the-key]
updated: 2026-11-03
---

`docker-agent run --sandbox agent.yaml` in một bản tóm tắt khởi chạy, tạo VM, và chết với `Error: creating session store: migration failed even after database reset: failed to create migrations table: attempt to write a readonly database (1032)`. Một lần thử trước bị từ chối vì `--data-dir` trỏ tới thư mục home, và lệnh gọi mô hình đầu tiên trong ngày trả về `403 Blocked by network policy`. Giải thích cả ba, và nói bản tóm tắt khởi chạy lẽ ra phải cho bạn biết gì trước lần chạy.

## Short answer

Ba nguyên nhân, không nguyên nhân nào là file agent. Với `--sandbox`, một thư mục dữ liệu ngoài workspace bị từ chối, vì chỉ workspace ghi được từ VM. 403 nghĩa là host mô hình không nằm trên danh sách cho phép bền vững: `docker-agent sandbox allow localhost:12434` sửa nó, và cổng là `localhost` vì proxy viết lại `host.docker.internal` thành `localhost` trước khi kiểm tra quy tắc. Cơ sở dữ liệu chỉ đọc là SQLite không ghi được qua mount workspace `virtiofs` trên host này, dù `mount` liệt kê nó là `rw`; một lần ghi Python `sqlite3` thuần trên cùng mount thất bại theo cùng cách, và VM tiếp tục chạy sau lỗi, nên bạn tự xóa nó.

## Full answer

### Read the launch summary first

Bản tóm tắt nêu mọi thứ mà lần chạy sẽ tin: `Models gateway: none configured`, host catalog được cho phép cho proxy, danh sách cho phép người dùng với các host bạn đã thêm, rồi tên sandbox, các mount với chế độ, image và các tài nguyên. Trong lần chạy được ghi lại, workspace là `rw`, và thư mục của file agent, kit được chuẩn bị dưới `.m101/cache/sandbox-kits/<hash>` và thư mục config là `ro`. Image là `docker/docker-agent-sbx-templates:latest`, với `cpu 10` và `memory 32 GiB`. Mọi lỗi sau được giải thích bởi một trong các dòng đó.

### The data directory

Kit ghi lại giữ runtime ngoài `~/.cagent` bằng `--data-dir`, `--cache-dir` và `--config-dir`. Với `--sandbox`, thông báo từ chối là `--data-dir must be inside the sandbox's writable workspace`, nên cả ba đi dưới `.m101/` trong workspace. Điều đó đặt cơ sở dữ liệu phiên trên mount, nơi lỗi thứ ba xuất phát.

### The model host and the proxy

Bên trong VM, `127.0.0.1` là VM, nên provider trong file agent trỏ tới `host.docker.internal:12434`. Yêu cầu đi ra qua `HTTP_PROXY` tại `gateway.docker.internal:3128`, vì host đó không có trong `NO_PROXY`, và proxy sandbox dịch tên thành `localhost`. Vì vậy quy tắc phải nói `localhost:12434`. Danh sách cho phép trong VM đọc ra trống, vì các host được cho phép đến như các quy tắc proxy trên host, không phải một danh sách bên trong. Các khóa provider bên trong đọc ra `proxy-managed`.

### The readonly database

Thư mục dữ liệu nằm trên mount workspace, được liệt kê là `rw`. SQLite không thể tạo bảng migrations ở đó, và một probe Python `sqlite3` trên cùng mount thất bại giống hệt, nên lỗi là đường ghi qua `virtiofs` trên host này, không phải agent. Bản ghi chứng minh phần còn lại của đường bằng cách khởi động cùng file agent bên trong VM bằng tay với trạng thái dưới `/tmp/m101`: lệnh gọi mô hình đi ra qua proxy và câu trả lời đúng. Runtime thoát khi lỗi và không dừng hoặc xóa VM; `sbx ls` vẫn cho thấy nó `running`, và `sbx rm --force` kết thúc nó. Một lần chạy sau từ cùng workspace dùng lại VM trừ khi tập mount thay đổi.

## Follow-ups

- **Level 3:** Tại sao `127.0.0.1:12434` trong file agent thất bại bên trong trong khi hoạt động trên host? Expected: loopback bên trong VM là VM; dùng `host.docker.internal`, và cho phép `localhost:12434` vì proxy viết lại tên.
- **Level 3:** Bạn cho phép một host và agent bên trong in một danh sách cho phép trống. Quy tắc có bị thiếu không? Expected: không; quy tắc nằm trong proxy host, và danh sách trong VM không phải nơi thực thi xảy ra.
- **Level 4:** Bạn chứng minh lỗi SQLite là do mount bằng cách nào? Expected: một lần ghi Python `sqlite3` trên cùng mount thất bại giống hệt, `mount` vẫn cho thấy `rw`, và cùng agent chạy với trạng thái dưới `/tmp` bên trong.
- **Level 4:** Lần chạy thất bại để lại gì, và điều gì dọn nó? Expected: một VM đang chạy mà runtime không dừng cũng không xóa; dùng `sbx rm` với sandbox, hoặc dự kiến lần chạy tiếp theo dùng lại nó.

## Wrong answers

- "Workspace chỉ đọc, nên thay các quyền của nó." Mount là `rw`; lỗi là đường ghi của SQLite qua mount, được một probe trực tiếp tái hiện.
- "Trỏ `--data-dir` tới thư mục home như phần trợ giúp gợi ý." Với `--sandbox`, điều đó bị từ chối; chỉ workspace ghi được.
- "Cho phép `host.docker.internal:12434`." Proxy dịch tên thành `localhost` trước kiểm tra, nên quy tắc phải nêu `localhost`.

## Taught in

[Phần chạy đầu cuối](../../../manuals/docker-sandboxes-101/sections/1-2-docker-agent-run-sandbox-end-to-end.md) ghi lại cả ba lỗi và bản tóm tắt khởi chạy, và [phần đầu](../../../manuals/docker-sandboxes-101/sections/1-1-sbx-and-docker-agent.md) nêu hai đường khởi chạy.
