# Mission - Initialization Scripts for Agents

## Goal
Xây `init_agent.py` thăm dò runtime, các phụ thuộc, lệnh kiểm thử, các biến môi trường và độ mới trạng thái, rồi ghi `init_report.json` và dừng phiên rõ ràng khi một thăm dò mức độ block thất bại.

## Inputs
- Một repo với một `requirements.txt` (hoặc tương đương), một lệnh kiểm thử và file trạng thái workbench từ bài 34
- Bảng thăm dò từ bài học (runtime, các phụ thuộc, đường dẫn, môi trường, độ mới trạng thái, commit tốt cuối cùng đã biết)

## Deliverables
- `init_agent.py` với một hàm cho mỗi thăm dò trả về `(name, status, detail)`
- `init_report.json` mang toàn bộ tập thăm dò và một dấu thời gian
- Thoát khác không trên bất kỳ thất bại thăm dò mức độ block nào

## Acceptance
- `python3 code/main.py` thoát với mã không trên luồng thành công
- Chạy nó hai lần liên tiếp không làm gì ngoại trừ dấu thời gian
- Một thăm dò biến môi trường bị thiếu được mô phỏng hiển thị trong báo cáo và đảo mã thoát

## Out of scope
- Tự cài các phụ thuộc bị thiếu. Script dừng và hiển thị; con người khắc phục.
- Gọi một LLM từ một thăm dò. Các thăm dò giữ vai trò kết nối mang tính xác định.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-init-script.md` - skill được trích xuất
