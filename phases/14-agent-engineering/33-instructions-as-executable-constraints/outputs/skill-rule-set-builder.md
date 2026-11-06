---
name: rule-set-builder
description: Interview a project owner, classify their existing prose instructions into five operational categories, and emit a versioned agent-rules.md plus a Python checker stub.
version: 1.0.0
phase: 14
lesson: 33
tags: [rules, instructions, constraints, checker, workbench]
---

Với một repo và bất kỳ chỉ dẫn văn xuôi hiện có nào (`AGENTS.md`, `CONTRIBUTING.md`, các tài liệu nhập môn), tạo một tập quy tắc năm hạng mục mà workbench có thể thực thi.

Năm hạng mục:

1. `startup` — điều gì phải đúng trước khi công việc bắt đầu.
2. `forbidden` — điều gì không bao giờ được xảy ra.
3. `definition_of_done` — điều gì chứng minh tác vụ đã hoàn tất.
4. `uncertainty` — agent làm gì khi không chắc.
5. `approval` — điều gì yêu cầu con người ký duyệt.

Tạo:

1. `docs/agent-rules.md` với một tiêu đề `##` cho mỗi quy tắc. Mỗi quy tắc mang `category`, `check` và một mô tả một dòng.
2. `tools/rule_checker.py` với một lớp `RuleChecker` cung cấp một phương thức cho mỗi `check`. Mỗi phương thức nhận một dataclass `TurnTrace` và trả về `bool`.
3. Trình chạy `tools/rule_report.py` tải các quy tắc, chạy bộ kiểm tra trên một trace, phát ra một `rule_report.json`.
4. Một file ghi chú di chuyển: những dòng văn xuôi nào trở thành quy tắc nào, những dòng nào bị bỏ vì mang tính nguyện vọng, vì sao.

Các trường hợp từ chối cứng:

- Các quy tắc không có một trường `check`. Các quy tắc chỉ mang tính nguyện vọng thuộc về tài liệu nhập môn, không phải tập quy tắc workbench.
- Một quy tắc "cẩn thận" duy nhất. Chỉ rõ một hạng mục và một kiểm tra hoặc loại bỏ nó.
- Các kiểm tra yêu cầu các lời gọi LLM. Các kiểm tra quy tắc phải mang tính xác định và rẻ để chúng có thể chạy mỗi lượt.
- Các file quy tắc vượt 200 dòng. Chia theo hạng mục thành `agent-rules.{startup,forbidden,done,uncertainty,approval}.md` và định tuyến từ một chỉ mục cha.

Các quy tắc từ chối:

- Nếu sản phẩm agent không thể cung cấp một `TurnTrace` (không đo lường), từ chối nối bộ kiểm tra cho đến khi ít nhất `read_state_file`, `edited_files` và `tests_exit_code` được ghi lại.
- Nếu các chỉ dẫn hiện có chủ yếu mang tính nguyện vọng (>50%), hiển thị phát hiện đó trước khi phát ra các quy tắc. Tập quy tắc sẽ trông mỏng; điều đó đúng.
- Nếu một quy tắc được thêm vì một sự cố quá khứ đơn lẻ, gắn id sự cố để đánh giá tương lai có thể quyết định liệu nó còn cần thiết không.

Cấu trúc đầu ra:

```
<repo>/
├── docs/
│   └── agent-rules.md
├── tools/
│   ├── rule_checker.py
│   └── rule_report.py
└── docs/migration-notes.md
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 36 cho các hợp đồng phạm vi theo từng tác vụ mở rộng hạng mục bị cấm.
- Bài 38 cho các cổng xác minh tiêu thụ báo cáo quy tắc.
- Bài 39 cho agent đánh giá chấm điểm tuân thủ quy tắc.
