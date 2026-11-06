# Mission - Multi-Session Handoff

## Goal
Tạo `handoff.md` và `handoff.json` từ các sản phẩm workbench ở cuối phiên để phiên tiếp theo hữu ích trong phút đầu. Cả hai dạng mang cùng bảy trường; JSON thắng khi bất đồng.

## Inputs
- `agent_state.json`, `verification_report.json`, `review_report.json`, `feedback_record.jsonl` từ các bài trước
- Bảy trường: summary, changed_files, commands_run, failed_attempts, open_risks, next_action, verdict_pointer

## Deliverables
- Một bộ tải `WorkbenchSnapshot` đóng gói bốn sản phẩm
- `generate_handoff(snapshot) -> (markdown, payload)`
- Một bộ lọc phản hồi chọn K bản ghi cuối cộng mọi mã thoát khác không
- `handoff.md` và `handoff.json` được ghi cạnh script

## Acceptance
- `python3 code/main.py` thoát với mã không
- Cả hai file mang đủ bảy trường và một `next_action` không rỗng
- Chạy lại script với cùng các đầu vào tạo một gói giống hệt

## Out of scope
- Các chiến lược cô đọng (endpoint compact Codex, năm giai đoạn Claude Code). Bàn giao đóng một phiên; cô đọng kéo dài một phiên.
- Tạo mẫu PR. Markdown có thể tái sử dụng như một body PR nhưng bài học dừng ở file.

## References
- `docs/en.md` - bài học đầy đủ
- `code/main.py` - triển khai tham chiếu
- `outputs/skill-handoff-generator.md` - skill được trích xuất
