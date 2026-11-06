---
name: state-schema
description: Generate project-specific JSON Schemas for agent state and task board, a Python StateManager with atomic writes, and a migration scaffold so schema bumps cannot corrupt the workbench.
version: 1.0.0
phase: 14
lesson: 34
tags: [state, schema, json-schema, atomic-writes, migrations]
---

Với một repo và sản phẩm agent chạy bên trong nó, tạo các file trạng thái theo schema trước cho workbench.

Tạo:

1. `schemas/agent_state.schema.json` bao phủ các khóa bắt buộc, các giá trị trạng thái được phép, kỷ luật mảng so với null và một số nguyên `schema_version`.
2. `schemas/task_board.schema.json` bao phủ mẫu id tác vụ, các bên chịu trách nhiệm được phép, các trạng thái được phép và các mảng nghiệm thu.
3. `tools/state_manager.py` cung cấp `load`, `commit` và `update` với các lần ghi nguyên tử tạm-và-đổi tên.
4. Khung `tools/migrate_state.py` cho lần tăng schema tiếp theo, báo lỗi rõ ràng nếu file từ một phiên bản không xác định.
5. `agent_state.json` và `task_board.json` được khởi tạo ở `schema_version: 1` và một backlog mới.

Các trường hợp từ chối cứng:

- Một schema không có một trường `schema_version`. Các lần di chuyển không phải tùy chọn.
- Cho phép `null` ở nơi mong đợi một mảng. `null` là một lỗi thời điểm ghi giả dạng dữ liệu.
- Một bên ghi sử dụng `open(path, "w")` thuần. Chỉ các lần ghi nguyên tử; các file một phần làm hỏng nguồn sự thật.
- Lưu token, các bản ghi trò chuyện thô hoặc PII bên trong trạng thái. Trạng thái dành cho các sự thật liên quan đến repo.

Các quy tắc từ chối:

- Nếu repo không có quản lý phiên bản, từ chối cung cấp các file trạng thái. Các lần ghi nguyên tử cộng git diff là câu chuyện tính bền vững.
- Nếu dự án không có ít nhất một lệnh nghiệm thu để xác thực chuyển tiếp `done`, từ chối giá trị enum `status: done`. Thêm `done` mà không có một kiểm tra nghiệm thu là diễn kịch.
- Nếu dự án dự định chia sẻ trạng thái xuyên các tiến trình mà không có một chiến lược khóa, hiển thị phát hiện đó trước khi phát hành; đổi tên nguyên tử là cần thiết nhưng chưa đủ.

Cấu trúc đầu ra:

```
<repo>/
├── agent_state.json
├── task_board.json
├── schemas/
│   ├── agent_state.schema.json
│   └── task_board.schema.json
└── tools/
    ├── state_manager.py
    └── migrate_state.py
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 35 cho script khởi tạo gọi bộ quản lý khi khởi động.
- Bài 38 cho cổng xác minh đọc trạng thái để chấm điểm hoàn thành.
- Bài 40 cho bộ tạo bàn giao tiêu thụ cùng schema.
