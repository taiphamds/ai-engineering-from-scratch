# Mission - The Minimal Agent Workbench

## Goal
Đặt workbench tối thiểu ba file (bộ định tuyến, trạng thái, bảng tác vụ) vào một `workdir/` mới và chứng minh một lượt agent duy nhất có thể đọc trạng thái, lấy một tác vụ, ghi trong phạm vi và lưu giữ trạng thái đã cập nhật.

## Inputs
- Một thư mục `workdir/` rỗng cạnh mã bài học
- Kiến thức về ba file: `AGENTS.md`, `agent_state.json`, `task_board.json`

## Deliverables
- `code/main.py` tạo ba file và chạy một lượt
- Bộ định tuyến ngắn `workdir/AGENTS.md` chỉ đến trạng thái, bảng và lệnh xác minh
- `workdir/agent_state.json` với id tác vụ hoạt động, các file đã chạm, hành động tiếp theo
- `workdir/task_board.json` với một backlog nhỏ và các trạng thái

## Acceptance
- `python3 code/main.py` thoát với mã không ở lần chạy thứ nhất và thứ hai
- Lần chạy thứ hai tiếp nối nơi lần đầu dừng lại, không phải từ đầu
- Diff được script in cho thấy một file mà lượt đã chạm

## Out of scope
- Các hợp đồng phạm vi, cổng xác minh, agent đánh giá. Những thứ đó được xếp lớp lên trên trong các bài sau.
- `AGENTS.md` nguyên khối dài. Bộ định tuyến được giữ ngắn có chủ ý.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-minimal-workbench.md` - skill được trích xuất
