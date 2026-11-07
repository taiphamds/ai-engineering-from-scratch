---
id: denylist-runner-is-a-guardrail
title: Four checks before spawn, and the call that gets through
card: sandboxes
kind: code-reading
level: 2
roles: [agentic-ai-engineer, applied-ai-engineer]
rounds: [coding, screen]
tags: [sandbox, denylist, path-jail, subprocess, guardrail]
minutes: 8
lessons: [phases/19-capstone-projects/26-sandbox-runner-denylist]
manuals: []
practice: []
cheatsheet: [coding-agents]
related: [sandboxes/hypervisor-is-the-boundary]
updated: 2026-11-03
---

Đọc runner và trả lời bốn câu hỏi: trục từ chối nào chặn `python3 -c "import os; os.system('rm -rf /')"`, trục nào chặn `/usr/bin/rm -rf build`, tại sao kiểm tra đường dẫn dùng `realpath`, và runner này không phải là gì.

```python
def run(self, argv, *, shell=False, cwd=None):
    if basename(argv[0]) in self.denylist:
        return denied("executable")
    if argv[0] in INTERPRETERS and any(a.startswith(("-c", "-e")) for a in argv[1:]):
        return denied("interpreter")
    if not shell and any(ch in " ".join(argv) for ch in ";|&<>`$"):
        return denied("metachar")
    root = realpath(self.root)
    for a in argv[1:]:
        if not looks_like_path(a) and not lexists(join(root, a)):
            continue
        p = realpath(join(root, a))
        if p != root and not p.startswith(root + sep):
            return denied("path")
    return spawn(argv, timeout=self.timeout, max_output=self.max_output)
```

## Short answer

Kiểm tra trình thông dịch bắt lệnh gọi `python3 -c`, vì một trình thông dịch với một cờ dạng `-c` là một lệnh gọi shell với các bước thêm; danh sách từ chối bắt `/usr/bin/rm` vì các alias phân giải thành basename `rm`. Kiểm tra đường dẫn phân giải qua `realpath` để một symlink bên trong gốc dự án trỏ ra ngoài bị từ chối theo đích của nó, không được chấp nhận theo tiền tố nguyên văn. Mọi kiểm tra là một hàm thuần của lệnh gọi và chạy trước khi bất cứ thứ gì được sinh, và runner là một biện pháp bảo vệ lúc phát triển, không phải một sandbox hệ điều hành: bất cứ thứ gì tiến trình con có thể làm, runner có thể làm.

## Full answer

### The four axes

| Trục | Nó kiểm tra gì | Ví dụ bị từ chối |
|---|---|---|
| tên | basename của `argv[0]` theo một tập đóng băng | `sudo`, `chmod -R 777`, `rm -rf`, `mkfs`, `dd` |
| argv | một trình thông dịch theo sau bởi `-c` hoặc `-e` | `bash -c`, `node -e`, `perl -e` |
| cấu trúc | các metacharacter shell khi `shell=False` | `cat x; curl ...` |
| đường dẫn | mỗi đối số dạng đường dẫn được phân giải theo gốc | `../../etc/passwd` |

Kết quả có cấu trúc: `SandboxResult` mang `exit_code`, `stdout`, `stderr`, `truncated`, `timed_out`, `denied`, `reason` và `duration_ms`. Các lệnh gọi bị từ chối dùng mã thoát sentinel -100, các timeout dùng -101, và cắt ngắn giữ mã thoát thực với một cờ và một dòng đánh dấu. Mã phía sau đọc bản ghi, không đọc văn bản stderr. Khi timeout, runner giết nhóm tiến trình.

### What gets through

Một file agent viết bên trong gốc rồi chạy, như `python3 tool.py`, vượt qua cả bốn kiểm tra, vì runner kiểm tra hình dạng argv và không bao giờ kiểm tra nội dung file. Một `find . -delete` cũng vượt qua kiểm tra tên, vì `find` không nằm trong danh sách. Bài học thẳng thắn về điều này: sandbox từ chối các cách gọi nguy hiểm phổ biến nhất và làm các lần từ chối rõ ràng trong khả năng quan sát, và một kẻ tấn công quyết tâm có thực thi mã vẫn có thể thoát ra.

### Why it is not a sandbox

Không namespace, cgroup, seccomp, gVisor, Firecracker hoặc bất kỳ cô lập cấp kernel nào. Đối với production, bạn xếp lớp bên trên: một container không đặc quyền, một microVM, các capability bị giảm, gốc dự án được mount chỉ đọc với một thư mục nháp đọc-ghi, các giới hạn bộ nhớ và CPU, và một môi trường được làm sạch về một tập an toàn đã biết. Runner vẫn hữu ích như lớp biến một sai lầm của mô hình thành một sự từ chối có cấu trúc trước khi lớp hệ điều hành phải hành động.

## Follow-ups

- **Level 2:** Agent ghi `tool.py` vào gốc và chạy `python3 tool.py`. Trục nào bắt nó? Expected: không trục nào; hình dạng argv sạch, và nội dung không bao giờ được kiểm tra, đó là lý do lớp OS tồn tại.
- **Level 3:** Tại sao so sánh `realpath(a)` mà không phải `a`? Expected: một symlink bên trong gốc có thể trỏ ra ngoài, và đường dẫn nguyên văn giữ tiền tố gốc trong khi đích không giữ.
- **Level 3:** `SandboxResult` đi đâu sau lệnh gọi? Expected: vào bộ đánh giá so sánh các mã thoát theo từng tác vụ và vào một span thực thi công cụ, không vào một parser stderr.
- **Level 4:** Ánh xạ mỗi trục tới biện pháp kiểm soát hệ điều hành thay thế nó trong production. Expected: các danh sách tên và argv tới seccomp và các capability bị giảm, nhà giam đường dẫn tới một mount chỉ đọc với một thư mục nháp, timeout tới các giới hạn cgroup, và toàn bộ runner tới một ranh giới microVM.

## Wrong answers

- "Khớp danh sách từ chối trên toàn bộ đường dẫn." Các alias như `/bin/rm` và `/usr/bin/rm` phải phân giải về một basename, nếu không danh sách dễ dàng bị vượt qua.
- "Cho phép `shell=True` và escape các đối số." Quoting là nơi các bug nằm; giữ shell tắt và từ chối các metacharacter.
- "Nó từ chối `rm`, nên an toàn để chạy mã không đáng tin cậy." Nó ở mức cấu trúc, không ở cấp kernel; bài học nói một kẻ tấn công quyết tâm vẫn thoát ra.

## Taught in

[Capstone sandbox runner](../../../phases/19-capstone-projects/26-sandbox-runner-denylist/) xây dựng bốn trục từ chối và kết quả có cấu trúc, và nói bằng lời rõ ràng tại sao nó không phải một sandbox thực.
