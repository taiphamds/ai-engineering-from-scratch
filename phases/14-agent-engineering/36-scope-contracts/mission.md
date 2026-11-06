# Mission - Scope Contracts and Task Boundaries

## Goal
Viết một `scope_contract.json` cho từng tác vụ và một bộ kiểm tra nhận biết glob so sánh diff của agent với hợp đồng và gắn cờ bất kỳ lần ghi bị cấm hoặc ngoài phạm vi nào.

## Inputs
- Một mô tả tác vụ với các glob được phép, glob bị cấm, lệnh nghiệm thu, đoạn khôi phục, các phê duyệt bắt buộc
- Hai lần chạy demo: một lần ở trong phạm vi, một lần mở rộng dần

## Deliverables
- Bộ xác thực schema `scope_contract.json` (tập con JSON Schema, các mảng glob)
- Một bộ phân tích diff tạo một `RunSummary` từ các file đã chạm cộng các lệnh đã chạy
- `scope_check(contract, run) -> (violations, in_scope, off_scope)`
- `scope_report.json` được lưu cạnh script

## Acceptance
- `python3 code/main.py` thoát với mã không
- Lần chạy trong phạm vi báo cáo không có vi phạm
- Lần chạy mở rộng dần báo cáo chính xác các file ngoài phạm vi và lý do cho mỗi file

## Out of scope
- Các ngân sách thời gian, danh sách cho phép lưu lượng mạng ra. Bài học cung cấp các glob file; các đề bài tập mở rộng nó.
- Nối vào một ngắt runtime. Bài học kết thúc ở báo cáo.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-scope-contract.md` - skill được trích xuất
