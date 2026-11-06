# Mission - Reviewer Agent: Separate Builder from Marker

## Goal
Xây một vòng lặp đánh giá đọc các sản phẩm của bên xây dựng với quyền chỉ đọc và phát ra một `review_report.json` được chấm điểm xuyên năm chiều, tổng trên 10, với một phán quyết pass, soft_fail hoặc hard_fail.

## Inputs
- `ReviewerInputs` đóng gói diff, trạng thái, phản hồi và phán quyết xác minh từ các bài trước
- Các chiều bảng tiêu chí: sự phù hợp vấn đề, kỷ luật phạm vi, các giả định, chất lượng xác minh, sự sẵn sàng bàn giao

## Deliverables
- Một hàm chấm điểm cho mỗi chiều (mức stub cho bài học, mang tính xác định)
- Bộ ghi `review_report.json` với năm điểm, tổng và phán quyết
- Hai trường hợp demo: một thay đổi sạch và một thay đổi "đúng kiểm thử, sai vấn đề"

## Acceptance
- `python3 code/main.py` thoát với mã không
- Thay đổi sạch đạt ít nhất 7 với phán quyết `pass`
- Thay đổi sai vấn đề giảm dưới 5 trên ít nhất một chiều và phán quyết đảo sang `hard_fail`

## Out of scope
- Các lời gọi LLM thực. Bài học tạo stub mỗi chiều; skill thay một mô hình vào sau.
- Chỉnh sửa diff. Bên đánh giá đọc, chấm điểm và báo cáo. Các bản vá là công việc của bên xây dựng ở lượt tiếp theo.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-reviewer-agent.md` - skill được trích xuất
