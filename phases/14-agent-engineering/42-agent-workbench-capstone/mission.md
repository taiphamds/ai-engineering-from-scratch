# Mission - Capstone: Ship a Reusable Agent Workbench Pack

## Goal
Lắp ráp mười một bài học trước thành một thư mục `outputs/agent-workbench-pack/` có phiên bản với một bộ cài đặt nó lũy đẳng vào bất kỳ repo đích nào.

## Inputs
- Các schema, script và tài liệu từ các bài 32 đến 40
- Bố cục bộ: `AGENTS.md`, `docs/`, `schemas/`, `scripts/`, `bin/`, `README.md`, `VERSION`

## Deliverables
- `outputs/agent-workbench-pack/` với toàn bộ bố cục được điền
- `bin/install.sh` (hoặc `bin/install.py`) từ chối ghi đè mà không có `--force`
- File `VERSION` cộng một `README.md` mô tả điều gì ở trong và điều gì ở ngoài

## Acceptance
- `python3 code/main.py` thoát với mã không và in cây bộ
- Chạy lại bộ lắp ráp là lũy đẳng
- `bin/install.sh` vào một đích mới để lại một workbench hoạt động: trạng thái, bảng, các quy tắc, phạm vi, khởi tạo, trình chạy, cổng, bên đánh giá, bàn giao đều đúng chỗ

## Out of scope
- Nội dung tác vụ theo từng dự án. Các tác vụ thuộc về bảng repo đích, không phải trong bộ.
- Các lời gọi SDK nhà cung cấp. Bộ không phụ thuộc framework theo thiết kế.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-workbench-pack.md` - skill được trích xuất
