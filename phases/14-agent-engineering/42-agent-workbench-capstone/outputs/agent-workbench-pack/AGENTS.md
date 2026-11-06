# AGENTS.md

Bạn đang làm việc bên trong một kho mã chạy với một workbench agent.

Đọc những thứ này trước khi hành động:

1. `agent_state.json` — nơi phiên cuối cùng dừng lại.
2. `task_board.json` — điều gì đang thực hiện, điều gì tiếp theo.
3. `docs/agent-rules.md` — khởi động, bị cấm, hoàn thành, bất định, phê duyệt.
4. `docs/reliability-policy.md` — các chế độ lỗi mà workbench này được thiết kế để hấp thụ.
5. `docs/handoff-protocol.md` — điều kết thúc phiên phải tạo ra.
6. `docs/reviewer-rubric.md` — cách công việc hoàn tất được phán xét.

Lệnh xác minh: xem `acceptance_criteria` trong tác vụ hoạt động trên bảng.

Phiên bản bộ: 1.0.0
