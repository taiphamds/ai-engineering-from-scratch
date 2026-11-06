---
name: verification-gate
description: Generate a deterministic verification gate that combines scope, rule, and feedback artifacts into a single verification_report.json per task, plus CI wiring that refuses to merge without a green verdict.
version: 1.0.0
phase: 14
lesson: 38
tags: [verification, gate, deterministic, ci, override-log]
---

Với các tiêu chí nghiệm thu của một dự án và các sản phẩm workbench hiện có, tạo cổng xác minh và log kiểm toán override.

Tạo:

1. `tools/verify_agent.py` cung cấp `verify(task_id, artifacts) -> VerdictReport`. Hàm thuần, mang tính xác định, không lời gọi LLM.
2. `outputs/verification/<task_id>.json` làm phán quyết nguồn sự thật duy nhất.
3. `tools/override.py` thêm các mục override có chữ ký vào `outputs/verification/overrides.jsonl` (phải bao gồm lý do, id người dùng, dấu thời gian, mã phát hiện).
4. Workflow CI thất bại trên `passed: false` và hiển thị báo cáo nội tuyến.
5. `docs/verification.md` liệt kê mọi kiểm tra, mức độ nghiêm trọng của nó, sản phẩm nguồn của nó và chính sách override.

Các trường hợp từ chối cứng:

- Một kiểm tra gọi một LLM. Cổng là phần kết nối mang tính xác định; phán đoán LLM thuộc về bên đánh giá.
- Một đường override mà agent có thể đi mà không có một mục có chữ ký. Các override chỉ dành cho con người.
- Một báo cáo xác minh bỏ qua các đường dẫn sản phẩm mà nó đã tiêu thụ. Các báo cáo phải có thể kiểm toán.
- Các phát hiện mức độ block mà workflow có thể âm thầm hạ cấp. Mức độ nghiêm trọng được cố định tại thời điểm ghi, không phải tại thời điểm đọc.

Các quy tắc từ chối:

- Nếu dự án không có lệnh nghiệm thu, từ chối cung cấp cổng cho đến khi có một lệnh. Một cổng không chứng minh gì là diễn kịch.
- Nếu báo cáo quy tắc không tồn tại, từ chối bỏ qua kiểm tra quy tắc; thất bại theo hướng đóng.
- Nếu log phản hồi không tồn tại, từ chối bỏ qua kiểm tra nghiệm thu; các log bị thiếu tự chúng là một block.
- Nếu các mục override không được quản lý phiên bản, từ chối nối đường override; các override ngoài hồ sơ đánh bại cổng.

Cấu trúc đầu ra:

```
<repo>/
├── tools/
│   ├── verify_agent.py
│   └── override.py
├── outputs/verification/
│   ├── overrides.jsonl
│   └── <task_id>.json
├── docs/verification.md
└── .github/workflows/verify.yml
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 39 cho agent đánh giá tiếp nối sau một phán quyết xanh.
- Bài 40 cho bộ tạo bàn giao đưa phán quyết vào gói.
- Bài 41 để chạy cổng đối với một ứng dụng mẫu kiểu thực.
