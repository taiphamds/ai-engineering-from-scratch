# Handoff Protocol

Mỗi phiên kết thúc bằng một gói bàn giao chứa:

- summary
- changed_files
- commands_run
- failed_attempts
- open_risks (mức độ nghiêm trọng + chi tiết)
- next_action (một bước cụ thể)
- verdict_pointer (các đường dẫn đến các báo cáo xác minh + đánh giá)

Gói được cung cấp dưới cả dạng handoff.md (con người) và handoff.json (agent tiếp theo).
Các trường bị thiếu dừng hook cuối phiên.
