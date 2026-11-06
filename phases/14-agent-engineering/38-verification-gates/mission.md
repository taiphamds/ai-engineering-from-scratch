# Mission - Verification Gates

## Goal
Triển khai `verify(task_id, artifacts)` như một hàm thuần mang tính xác định trên báo cáo phạm vi, báo cáo quy tắc, log phản hồi và diff, phát ra một `verification_report.json` cho mỗi lần đóng tác vụ.

## Inputs
- Các bộ tải stub cho `scope_report.json`, `rule_report.json`, `feedback_record.jsonl` và diff
- Bảng kiểm tra: nghiệm thu đã chạy, nghiệm thu thoát với mã không, phạm vi sạch, không mã thoát `null`, mọi quy tắc mức độ block đều đạt

## Deliverables
- Một `verify(task_id, artifacts) -> VerdictReport` thuần
- Một bộ in cho thấy các kết quả cho từng kiểm tra và đạt/không đạt cuối cùng
- Ba kịch bản demo được ghi vào đĩa: đạt sạch, mở rộng phạm vi, thiếu nghiệm thu

## Acceptance
- `python3 code/main.py` thoát với mã không
- Kịch bản đạt sạch báo cáo `passed: true`; hai kịch bản còn lại báo cáo `passed: false`
- Mỗi kịch bản ghi một `verification_report.json` riêng dưới `outputs/verification/`

## Out of scope
- Logic LLM làm giám khảo. Cổng giữ tính xác định; phán đoán định tính thuộc về bên đánh giá trong bài 39.
- Các log kiểm toán override có chữ ký. Các đề bài tập mở rộng cổng theo cách đó.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-verification-gate.md` - skill được trích xuất
