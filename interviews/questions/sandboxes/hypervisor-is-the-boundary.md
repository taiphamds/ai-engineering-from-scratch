---
id: hypervisor-is-the-boundary
title: The agent has sudo and a Docker Engine, so where is the wall
card: sandboxes
kind: concept
level: 1
roles: [agentic-ai-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [screen, system-design]
tags: [sandbox, microvm, isolation, docker-engine, boundary]
minutes: 6
lessons: []
manuals: [docker-sandboxes-101#s-sbx-diagnose-and-the-microvm-boundary, docker-sandboxes-101#s-sbx-mcp-add-load-and-static-mcp]
practice: []
cheatsheet: [docker-sandboxes]
related: [protocols/roots-are-not-a-sandbox]
updated: 2026-11-03
---

Bên trong một Docker sandbox, agent chạy với uid 1000 trong các nhóm `sudo` và `docker`, và `docker version` trả lời với một server. Một đồng đội kết luận sandbox không an toàn hơn một container chạy dưới root. Bức tường ở đâu, và agent sở hữu gì bên trong nó?

## Short answer

Bức tường là ranh giới hypervisor dưới kernel guest, không phải người dùng bên trong. Tài liệu nêu rõ: agent là một người dùng không phải root có quyền sudo bên trong VM, ranh giới hypervisor cô lập agent, và phân tách đặc quyền bên trong VM thì không. Mọi thứ dưới ranh giới đó thuộc về agent, bao gồm một Docker Engine riêng có các image không bao giờ xuất hiện trong `docker ps` trên host, và host hoàn toàn không cung cấp Docker API cho sandbox.

## Full answer

### Five layers, read from inside

`sbx diagnose` nêu nền tảng: `kern.hv_support is 1` là ảo hóa phần cứng, và guest chạy trên hypervisor host. Từ bên trong, `uname`, `id`, `docker version` và `mount` cho thấy một kernel guest trên `aarch64` với các trang 16 KiB (`getconf PAGESIZE` in 16384), người dùng `agent` với uid 1000, một server Docker Engine với containerd riêng, và workspace như một mount `virtiofs` tại cùng đường dẫn tuyệt đối như trên host.

Tài liệu nêu năm lớp cô lập: hypervisor, mạng, Docker Engine, workspace và thông tin xác thực. Engine bên trong là của agent. Các image nó build nằm trong VM, và agent không thể tiếp cận daemon trên host của bạn. Cũng không có Moby API từ host, nên các client REST mong đợi một API không hoạt động, và `sbx exec` là đường vào.

### The doors through the wall

Đếm các dòng trong môi trường guest vượt qua ranh giới:

| Cửa | Dòng của guest |
|---|---|
| mount | `host on <workspace> type virtiofs (rw,...)`, cùng một bind chỉ đọc của `/etc/resolv.conf` |
| mạng | `HTTPS_PROXY` trỏ tới `gateway.docker.internal:3128` |
| bí mật | một biến khóa nhà cung cấp được đặt thành sentinel `proxy-managed` |
| MCP | `MCP_GATEWAY_URL` trỏ tới `mcp-gateway.docker.internal/mcp` |
| SSH agent | `SSH_AUTH_SOCK=/run/ssh-agent.sock` được chuyển tiếp qua `gateway.docker.internal:3129` |

Mỗi cửa là một nơi chính sách host áp dụng. Không điều gì agent làm với sudo thay đổi các cửa nào tồn tại.

### What the teammate gets right

Bên trong VM, agent sở hữu hệ thống file, engine và mọi tiến trình. Một bản build giả định các trang 4 KiB thất bại trên guest này. VM có các giới hạn riêng: bộ nhớ mặc định bằng một nửa bộ nhớ host, được chặn giữa 512 MiB và 32 GiB, và `--cpus 0` nghĩa là mọi CPU host, nhiều nhất 16 trên Linux arm64. Không thứ nào là một biện pháp kiểm soát; nó là một ngân sách.

### One thing that is not inside

Một MCP server được đăng ký trên host bằng `--command` chạy trên host với các quyền của người dùng host của bạn, ngoài ranh giới engine và ngoài chính sách mạng. Chỉ một server mà agent khởi động bên trong VM chịu các quy tắc sandbox.

## Follow-ups

- **Level 1:** Agent chạy `docker build` và `docker ps` của host không cho thấy gì. Tại sao? Expected: engine và kho image của nó nằm bên trong VM; daemon host là một engine khác.
- **Level 2:** Một công cụ đã biên dịch gặp sự cố bên trong với một lỗi kích thước trang. Điều gì khác về guest? Expected: kernel guest dùng các trang 16 KiB, mà `getconf PAGESIZE` báo là 16384, và `sbx diagnose` so sánh kích thước block `mkfs.erofs` với nó.
- **Level 2:** Nêu từng đường mà một thứ từ host đi vào VM. Expected: mount workspace, proxy cho mạng, các sentinel bí mật, URL MCP gateway và SSH agent được chuyển tiếp.
- **Level 3:** MCP server được đăng ký nào không được bức tường bao phủ? Expected: một server được thêm bằng `--command`, chạy trên host như người dùng của bạn và không dưới chính sách mạng.

## Wrong answers

- "Sudo bên trong nghĩa là root trên laptop của tôi." Người dùng bên trong là một người dùng guest; hypervisor là biện pháp kiểm soát, và tài liệu nói phân tách đặc quyền bên trong không phải.
- "Sandbox dùng chung Docker daemon của tôi." Mỗi sandbox chạy Docker Engine riêng, và host không cung cấp API cho VM.
- "Nó không cần tài khoản vì nó chạy không có Docker Desktop." `sbx` chạy không có Desktop và vẫn từ chối tạo một sandbox nếu chưa đăng nhập; FAQ đưa ra các lý do.

## Taught in

[Phần ranh giới microVM](../../../manuals/docker-sandboxes-101/sections/3-1-sbx-diagnose-and-the-microvm-boundary.md) đọc guest từ bên trong và nêu năm cửa, và [phần MCP](../../../manuals/docker-sandboxes-101/sections/3-6-sbx-mcp-add-load-and-static-mcp.md) cho thấy một server chạy trên host.
