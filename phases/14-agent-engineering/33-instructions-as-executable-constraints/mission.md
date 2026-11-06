# Mission - Agent Instructions as Executable Constraints

## Goal
Biến các chỉ dẫn văn xuôi thành các quy tắc có thể kiểm tra bằng máy xuyên năm hạng mục và phát ra một báo cáo quy tắc mà một bên đánh giá có thể chấm điểm.

## Inputs
- `docs/agent-rules.md` với một quy tắc cho mỗi tiêu đề, mỗi quy tắc mang slug, hạng mục, mô tả và một trường `check`
- Một lần chạy agent demo cố ý vi phạm hai quy tắc

## Deliverables
- Bộ phân tích tải `agent-rules.md` vào một dataclass
- Các hàm kiểu `rule_checker.py`, một cho mỗi `check` được tham chiếu
- `rule_report.json` với đạt/không đạt cho mỗi quy tắc và một mức độ nghiêm trọng tổng hợp

## Acceptance
- `python3 code/main.py` thoát với mã không
- Đầu ra in tập quy tắc đã phân tích, trace lần chạy và đạt/không đạt cho từng quy tắc
- `rule_report.json` bắt hai vi phạm cố ý

## Out of scope
- Nối bộ kiểm tra vào CI. Bài học kết thúc ở một báo cáo được ghi.
- Các chốt bảo vệ framework (OpenAI SDK, các ngắt LangGraph). Tập quy tắc là hợp đồng cho con người đọc mà chúng triển khai.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-rule-set-builder.md` - skill được trích xuất
