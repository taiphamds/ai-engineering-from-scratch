---
name: minimal-workbench
description: Lay down the three-file minimum viable agent workbench for any repo — short AGENTS.md router, durable agent_state.json, and a JSON task_board.json keyed to the project's current backlog.
version: 1.0.0
phase: 14
lesson: 32
tags: [workbench, agents-md, state, task-board, scaffold]
---

Với một đường dẫn repo và một backlog ngắn, tạo khung workbench agent khả dụng tối thiểu.

Tạo:

1. `AGENTS.md` không dài hơn 80 dòng. Nó phải định tuyến đến: file trạng thái, bảng tác vụ, tài liệu quy tắc sâu hơn (ngay cả khi rỗng) và lệnh xác minh. Không có các hướng dẫn văn xuôi trong file này.
2. `agent_state.json` với các khóa này: `active_task_id`, `touched_files`, `assumptions`, `blockers`, `next_action`. Mọi trường tùy chọn mặc định là mảng rỗng hoặc chuỗi rỗng, không bao giờ là `null` cho các mảng.
3. `task_board.json` dưới dạng một mảng JSON các tác vụ. Mỗi tác vụ có `id`, `goal`, `owner` (`builder` | `reviewer` | `human`), `acceptance` (danh sách các chuỗi) và `status` (`todo` | `in_progress` | `done` | `blocked`).
4. Chỗ giữ chỗ `docs/agent-rules.md` với một H2 duy nhất cho mỗi bề mặt để các bài sau có thể điền nó.

Các trường hợp từ chối cứng:

- `AGENTS.md` vượt 80 dòng hoặc dưới 10 dòng. Quá dài và agent bỏ qua nó; quá ngắn và nó không mang định tuyến.
- Một file trạng thái tham chiếu lịch sử trò chuyện thay vì repo. Repo là hệ thống ghi nhận chính thức.
- Một bảng tác vụ không có `acceptance`. Các tác vụ không có tiêu chí nghiệm thu trở thành các dấu phê duyệt máy móc "trông ổn".
- Các tác vụ có `owner` là `agent` hoặc `model`. Các bên chịu trách nhiệm là các vai trò, không phải các thực thể.

Các quy tắc từ chối:

- Nếu repo không có lệnh xác minh, từ chối viết `AGENTS.md` cho đến khi một lệnh được cung cấp hoặc tạo stub. Một bộ định tuyến chỉ đến một cổng bị thiếu tệ hơn không có bộ định tuyến.
- Nếu backlog có hơn 12 tác vụ mở, từ chối và yêu cầu người dùng chia nó. Các bảng quá một màn hình trôi vào diễn kịch lập kế hoạch.
- Nếu dự án được phát hành với các bí mật trong các file được theo dõi, từ chối viết file trạng thái và hiển thị rò rỉ bí mật như một phát hiện chặn trước.

Cấu trúc đầu ra:

```
<repo>/
├── AGENTS.md
├── agent_state.json
├── task_board.json
└── docs/
    └── agent-rules.md
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 33 để biến chỗ giữ chỗ các quy tắc thành các ràng buộc thực thi được.
- Bài 34 cho schema trạng thái bền vững.
- Bài 36 cho hợp đồng phạm vi theo từng tác vụ.
