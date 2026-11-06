# Mission - Repo Memory and Durable State

## Goal
Soạn các JSON Schema cho `agent_state.json` và `task_board.json`, xây một `StateManager` tải, xác thực, thay đổi và ghi nguyên tử, và chứng minh vòng đi-về qua hai lượt.

## Inputs
- Hình dạng workbench ba file từ bài 32
- Một bộ xác thực chỉ dùng thư viện chuẩn bao phủ required, type, enum, pattern và items

## Deliverables
- `agent_state.schema.json` và `task_board.schema.json` cạnh mã
- `StateManager.load`, `StateManager.update`, `StateManager.commit` với các lần ghi tạm-và-đổi tên
- Một lần chạy demo thay đổi trạng thái qua hai lượt và tải lại sạch sẽ

## Acceptance
- `python3 code/main.py` thoát với mã không
- Một lần ghi xấu (thiếu trường bắt buộc, enum xấu) bị từ chối, không được lưu giữ
- `workdir/agent_state.json` sau lần chạy được xác thực đối với schema

## Out of scope
- SQLite hoặc các backend lưu trữ bên ngoài. File cục bộ là bài học.
- Các bộ tạo checkpoint LangGraph, các khối bộ nhớ Letta. Cùng ý tưởng, lưu trữ khác; ngoài phạm vi ở đây.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-state-schema.md` - skill được trích xuất
