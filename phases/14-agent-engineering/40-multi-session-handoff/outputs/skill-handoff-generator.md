---
name: handoff-generator
description: Generate end-of-session handoff packets from workbench artifacts, producing both human-readable Markdown and machine-readable JSON keyed to the seven canonical fields.
version: 1.0.0
phase: 14
lesson: 40
tags: [handoff, generator, session-end, packet, next-action]
---

Với một workbench (trạng thái, phán quyết, đánh giá, log phản hồi, diff), tạo một bộ tạo bàn giao cuối phiên được nối vào runtime agent.

Tạo:

1. `tools/generate_handoff.py` cung cấp `generate_handoff(snapshot) -> (markdown, payload)`.
2. `outputs/handoff/<session_id>/handoff.md` và `handoff.json`.
3. `handoff.schema.json` bao phủ bảy trường bắt buộc và định dạng đuôi phản hồi.
4. Script hook cuối phiên chạy bộ tạo và từ chối đóng phiên nếu bất kỳ trường nào bị thiếu.
5. `docs/handoff.md` liệt kê bảy trường, các nguồn của chúng và chính sách cắt gọn.

Các trường hợp từ chối cứng:

- Một bàn giao không có một `next_action`. Các báo cáo trạng thái giả dạng bàn giao đầu độc phiên tiếp theo.
- Một bộ tạo viết tay bản tóm tắt. Công việc của agent là để workbench trong một trạng thái có thể tạo được.
- Một gói markdown khác JSON. JSON là nguồn; markdown là một bản dựng JSON.
- Một đuôi phản hồi dài hơn 30 mục. Toàn bộ log nằm trong quản lý phiên bản; gói phải giữ nhỏ.

Các quy tắc từ chối:

- Nếu báo cáo xác minh bị thiếu, từ chối tạo gói. Một bàn giao không có phán quyết là một mong muốn.
- Nếu báo cáo đánh giá bị thiếu và một bên đánh giá con người được mong đợi, từ chối và yêu cầu lượt đánh giá trước.
- Nếu bản tóm tắt diff rỗng nhưng phiên chạy lâu hơn 5 phút, hiển thị sự bất thường trước khi tạo; nghi ngờ một phiên bị kẹt thay vì một lần không làm gì thực.

Cấu trúc đầu ra:

```
<repo>/
├── outputs/handoff/<session_id>/
│   ├── handoff.md
│   └── handoff.json
├── tools/generate_handoff.py
├── handoff.schema.json
└── docs/handoff.md
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 41 cho bài tập từ đầu đến cuối trên một ứng dụng mẫu kiểu thực.
- Bài 42 để đóng gói bộ tạo vào bộ workbench capstone.
- Bài 29 (Các runtime sản xuất) để nối kết thúc phiên vào các kích hoạt hàng đợi, sự kiện và cron.
