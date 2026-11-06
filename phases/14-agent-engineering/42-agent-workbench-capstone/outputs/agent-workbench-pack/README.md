# Agent Workbench Pack

Workbench dùng ngay cho bất kỳ repo nào muốn công việc agent đáng tin cậy.

## What you get

- `AGENTS.md` bộ định tuyến ngắn vào phần còn lại của bộ.
- `docs/` các quy tắc, chính sách độ tin cậy, giao thức bàn giao, bảng tiêu chí đánh giá.
- `schemas/` các JSON Schema cho trạng thái, bảng và hợp đồng phạm vi.
- `scripts/` khởi tạo, trình chạy phản hồi, cổng xác minh, bộ tạo bàn giao.
- `bin/install.sh` bộ cài lũy đẳng.

## Quickstart

```
bin/install.sh
$EDITOR task_board.json
python3 scripts/init_agent.py
```

## Versioning

File `VERSION` là hợp đồng. Các lần tăng phiên bản chính yêu cầu một di chuyển trạng thái.
