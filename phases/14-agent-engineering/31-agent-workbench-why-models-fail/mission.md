# Mission - Agent Workbench: Why Capable Models Still Fail

## Goal
Chạy cùng một tác vụ repo nhỏ hai lần, một lần chỉ có prompt và một lần với bảy bề mặt workbench được nối vào, và phát ra một báo cáo chế độ lỗi ánh xạ mỗi bề mặt bị thiếu đến triệu chứng mà nó gây ra.

## Inputs
- Một agent stub và một bộ xử lý kiểu FastAPI nhỏ cần xác thực
- Danh sách bảy bề mặt (chỉ dẫn, trạng thái, phạm vi, phản hồi, xác minh, đánh giá, bàn giao)

## Deliverables
- `code/main.py` chạy cả hai pipeline liên tiếp
- `failure_modes.json` tóm tắt lần chạy chỉ có prompt
- Phán quyết một dòng cho lần chạy workbench

## Acceptance
- `python3 code/main.py` thoát với mã không
- Đầu ra cho thấy một log đặt cạnh nhau của hai lần chạy
- `failure_modes.json` liệt kê mọi bề mặt bị thiếu với triệu chứng khớp

## Out of scope
- Gọi một mô hình thực. Stub dựa trên quy tắc có chủ ý.
- Xây bất kỳ một bề mặt nào chuyên sâu. Đó là mục đích của mười một bài học tiếp theo.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-workbench-audit.md` - skill được trích xuất
