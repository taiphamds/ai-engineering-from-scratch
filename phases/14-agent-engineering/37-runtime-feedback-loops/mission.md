# Mission - Runtime Feedback Loops

## Goal
Xây `run_with_feedback` bọc `subprocess.run`, ghi stdout, stderr, mã thoát và thời lượng, cắt ngắn đầu ra mang tính xác định và thêm một bản ghi JSONL mà cả lượt tiếp theo lẫn cổng xác minh đều đọc.

## Inputs
- Ba lệnh demo để thực hành trình chạy: một thành công, một thất bại, một chậm
- Ngân sách token: đầu cộng đuôi mang tính xác định với một dấu hiệu `...truncated N lines...`

## Deliverables
- `run_with_feedback(command, agent_note)` ghi vào `feedback_record.jsonl`
- Một bộ tải truyền JSONL vào một danh sách Python
- Một bộ in cho thấy bản ghi cuối cho mỗi lệnh

## Acceptance
- `python3 code/main.py` thoát với mã không
- `feedback_record.jsonl` tích lũy một bản ghi cho mỗi lệnh xuyên các lần chạy lại
- Một lệnh với `exit_code: null` không thể được vòng lặp đánh dấu thành công

## Out of scope
- Các pipeline telemetry (OTel, Langfuse). Phản hồi dành cho lượt tiếp theo; telemetry dành cho người vận hành.
- Các lượt che dữ liệu và chính sách xoay vòng. Các đề bài tập của bài học bao phủ chúng.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-feedback-runner.md` - skill được trích xuất
