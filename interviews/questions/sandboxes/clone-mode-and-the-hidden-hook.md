---
id: clone-mode-and-the-hidden-hook
title: A clean diff and a new pre-commit hook
card: sandboxes
kind: debug
level: 2
roles: [agentic-ai-engineer, applied-ai-engineer, forward-deployed-ai-engineer]
rounds: [debugging, system-design]
tags: [sandbox, workspace, clone-mode, git, supply-chain]
minutes: 8
lessons: []
manuals: [docker-sandboxes-101#s-clone-and-run-sandbox-source]
practice: []
cheatsheet: [docker-sandboxes, coding-agents]
related: [sandboxes/hypervisor-is-the-boundary]
updated: 2026-11-03
---

Bạn để một agent làm việc trên một repository qua đêm trong một sandbox với workspace mount mặc định. Buổi sáng `git diff` sạch và một file mới nằm trong `.git/hooks/pre-commit`. Giải thích agent đã ghi một file mà không diff nào cho thấy bằng cách nào, chế độ workspace nào ngăn điều đó, và các commit của agent vẫn đến bạn bằng cách nào dưới chế độ đó.

## Short answer

Mount mặc định là đường dẫn host được mount đọc-ghi bên trong VM tại cùng đường dẫn tuyệt đối, nên agent có thể chỉnh sửa bất cứ thứ gì trong cây, bao gồm Git hook, cấu hình CI, các script `package.json` và các thiết lập agent, và một hook dưới `.git/hooks` không bao giờ xuất hiện trong `git diff`. `--clone` lúc tạo chạy agent trên một clone riêng trong khi repository host đi vào VM chỉ đọc tại `/run/sandbox/source`, nên một lần push trở lại bị từ chối. Các commit về nhà qua một git daemon trong VM mà `sbx` công bố trên một cổng loopback và đăng ký như remote `sandbox-<name>` trong repository host, nên bạn fetch remote đó trước khi xóa sandbox.

## Full answer

### Three workspace modes

| Chế độ | Agent thấy gì | Nó có thể thay đổi gì trên host |
|---|---|---|
| mount trực tiếp | thư mục host tại cùng đường dẫn, `virtiofs`, đọc-ghi | mọi thứ trong cây, bao gồm hook |
| không mount | thư mục làm việc của template, `/home/agent/workspace` | không có gì |
| `--clone` | một clone riêng tại cùng đường dẫn trên volume ext4 riêng, `origin` tại `/run/sandbox/source` | không có gì; mount nguồn chỉ đọc |

Các đường dẫn thêm đi theo đường dẫn đầu, và `:ro` khiến một đường dẫn chỉ đọc, ngay cả một file đơn lẻ. `sbx run` không có đường dẫn mount thư mục hiện tại, đó là cái bẫy trong câu hỏi.

### What the recorded clone run showed

Bên trong, `touch /run/sandbox/source/x` thất bại với `Read-only file system`, và một `git push` tới `origin` kết thúc với `remote unpack failed`. Git daemon lắng nghe trên 9418 bên trong, và CLI ghi hai fetch refspec vào `.git/config` của host, nên một lần fetch cập nhật `refs/remotes/sandbox-<name>/<branch>` và `refs/sandboxes/<name>/<branch>`. `sbx rm` loại remote và daemon và in lệnh khôi phục, và bản sao `refs/sandboxes` từ lần fetch trước sống sót qua việc loại bỏ. `sbx stop` dừng daemon, và một lần khởi động lại gán một cổng mới và viết lại URL remote.

### What clone mode does not do

Nó ngăn ghi, không ngăn đọc. Một `.env` không được theo dõi dưới repository có thể đọc bên trong clone, nên giữ các bí mật ngoài một repository bạn clone vào sandbox. Cờ thay thế `--branch` trong v0.31.0 và không làm gì khi gắn lại, nên quyết định được đưa ra tại `sbx create`.

## Follow-ups

- **Level 2:** Bạn có thể chuyển một sandbox hiện có sang chế độ clone không? Expected: không; chế độ cố định lúc tạo và cờ không làm gì khi gắn lại, nên xóa và tạo lại.
- **Level 3:** Agent đã commit trên `main` bên trong. Commit đó ở đâu trên host sau một lần fetch? Expected: trên `refs/remotes/sandbox-<name>/main` và `refs/sandboxes/<name>/main`, không trên `main` riêng của host.
- **Level 3:** Bạn fetch một lần, rồi xóa sandbox. Bạn có thể khôi phục gì? Expected: các commit đã fetch; `refs/sandboxes/<name>/<branch>` sống sót và `git branch <local> refs/sandboxes/<name>/<branch>` khôi phục nó. Các commit được tạo sau lần fetch cuối mất cùng clone, nên fetch trước `sbx rm`.
- **Level 4:** Chế độ clone để mở rủi ro nào, và bạn đóng nó bằng cách nào? Expected: đọc; các file không được theo dõi như `.env` hiển thị qua mount chỉ đọc, nên giữ chúng ngoài repository hoặc mount một đường dẫn hẹp hơn.

## Wrong answers

- "`git status` lẽ ra đã cho thấy hook." Các file dưới `.git/` không thuộc cây làm việc; cả `status` lẫn `diff` đều không liệt kê chúng.
- "Mount repository `:ro` và để agent commit." Một mount chỉ đọc cũng chặn các commit riêng của agent; chế độ clone cho nó một clone ghi được và giữ host chỉ đọc.
- "Dùng `--branch` để agent làm việc trên một nhánh." Cờ đó đã bị loại và giờ thất bại với một gợi ý dùng `--clone`.

## Taught in

[Phần chế độ clone](../../../manuals/docker-sandboxes-101/sections/3-2-clone-and-run-sandbox-source.md) ghi lại lần push bị từ chối, hai refspec và các ref sống sót.
