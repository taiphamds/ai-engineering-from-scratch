---
name: init-script
description: Interview a project and emit a deterministic init_agent.py with five probes plus a CI workflow that refuses to launch the agent if any probe fails.
version: 1.0.0
phase: 14
lesson: 35
tags: [init, probes, ci, workbench, fail-loud]
---

Với một repo, sản phẩm agent và bề mặt phụ thuộc của nó, tạo một script khởi tạo dành riêng cho dự án và kết nối CI.

Tạo:

1. `tools/init_agent.py` với các thăm dò này: phiên bản runtime, các phụ thuộc được liệt kê, khả năng phân giải lệnh kiểm thử, các biến môi trường bắt buộc, độ mới file trạng thái.
2. Schema `init_report.json` được tài liệu hóa cạnh script. Mỗi thăm dò trả về `(name, status: pass|warn|fail, detail)`.
3. `.github/workflows/agent-init.yml` (hoặc tương đương) chạy script và chặn job agent trên bất kỳ thăm dò mức độ fail nào.
4. Một script hook `pre-task` mà runtime agent có thể gọi trước khi mỗi phiên bắt đầu.
5. Tài liệu trong `docs/init.md` liệt kê mọi thăm dò, mức độ nghiêm trọng của nó và cách sửa một thất bại.

Các trường hợp từ chối cứng:

- Các thăm dò gọi ra mạng mà không có thời gian chờ. Khởi tạo phải nhanh và an toàn ngoại tuyến.
- Các thăm dò yêu cầu các lời gọi LLM. Khởi tạo là phần kết nối mang tính xác định.
- Một mã thoát khác không mà lớp bọc nuốt. Báo lỗi rõ ràng là toàn bộ mục đích.
- Các thăm dò chạm trạng thái mà không có tính lũy đẳng. Hai lần chạy liên tiếp phải tạo các báo cáo giống hệt ngoại trừ dấu thời gian.

Các quy tắc từ chối:

- Nếu dự án không có lệnh kiểm thử, từ chối cung cấp script. Thay vào đó thêm khoảng trống vào kiểm toán workbench.
- Nếu danh sách biến môi trường chứa các bí mật mà script sẽ in, từ chối và buộc che dữ liệu. Các báo cáo khởi tạo không bao giờ nên mang bí mật.
- Nếu một thăm dò mất hơn ba giây trong một lần chạy thử, hiển thị phát hiện thời gian trước khi phát hành. Các thăm dò dài biến khởi tạo thành nghi lễ.

Cấu trúc đầu ra:

```
<repo>/
├── tools/
│   ├── init_agent.py
│   └── pre_task.sh
├── docs/
│   └── init.md
└── .github/
    └── workflows/
        └── agent-init.yml
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 36 cho hợp đồng phạm vi theo từng tác vụ sử dụng `repo_paths` của báo cáo khởi tạo.
- Bài 37 cho vòng lặp phản hồi runtime tiêu thụ lệnh kiểm thử đã phân giải.
- Bài 38 cho cổng xác minh phụ thuộc các thăm dò đạt.
