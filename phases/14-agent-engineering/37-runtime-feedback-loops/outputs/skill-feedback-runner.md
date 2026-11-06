---
name: feedback-runner
description: Wrap shell commands with deterministic stdout/stderr/exit/duration capture, persist a JSONL record per command, and refuse to advance the agent loop when feedback is missing.
version: 1.0.0
phase: 14
lesson: 37
tags: [feedback, subprocess, runner, jsonl, loop-control]
---

Với một dự án chạy các lệnh shell bên trong một vòng lặp agent, tạo một trình chạy phản hồi và JSONL mà nó ghi.

Tạo:

1. `tools/run_with_feedback.py` cung cấp `run_with_feedback(command: list[str], agent_note: str, timeout_s: float) -> FeedbackRecord`.
2. Vị trí `feedback_record.jsonl` dưới workbench, một bản ghi cho mỗi dòng.
3. `tools/feedback_loader.py` trả về N bản ghi gần nhất cho tác vụ hoạt động.
4. Một hàm trợ giúp `loop_can_advance(record) -> bool` mà vòng lặp agent gọi trước khi tuyên bố thành công.
5. Các kiểm thử bao phủ: đường thành công, thoát khác không, hết thời gian chờ, thiếu tệp nhị phân, cắt ngắn đầu/đuôi mang tính xác định.

Các trường hợp từ chối cứng:

- `shell=True` ở bất kỳ đâu trong trình chạy. Chỉ argv.
- Cắt ngắn phụ thuộc thời gian đồng hồ hoặc lấy mẫu ngẫu nhiên. Cùng đầu vào phải tạo cùng bản ghi.
- Các bản ghi không có `duration_ms`. Các thăm dò chậm là dấu hiệu đầu tiên của một workbench bị kẹt.
- Một bộ tải trả về một danh sách không giới hạn. Giới hạn ở N bản ghi cuối hoặc phân trang.

Các quy tắc từ chối:

- Nếu dự án dẫn bí mật qua stdout, từ chối cung cấp trình chạy mà không có một bước che dữ liệu. Hiển thị các dòng lẽ ra đã được ghi.
- Nếu dự án có các lệnh có thể treo vô hạn, từ chối cung cấp mà không có một thời gian chờ mặc định và một danh sách override tường minh.
- Nếu trình chạy chạy bên trong một worker với trạng thái dùng chung, từ chối bỏ qua một khóa file quanh việc thêm JSONL. Nhiều bên ghi sẽ xé file.

Cấu trúc đầu ra:

```
<repo>/
├── feedback_record.jsonl
└── tools/
    ├── run_with_feedback.py
    ├── feedback_loader.py
    └── test_feedback_runner.py
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 38 cho cổng xác minh tiêu thụ các bản ghi.
- Bài 39 cho agent đánh giá đọc phản hồi khi chấm điểm một lần chạy.
- Bài 23 cho các quy ước OTel GenAI để thêm vào phía telemetry khi phản hồi đã vững.
