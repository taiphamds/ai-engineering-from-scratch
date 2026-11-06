---
name: workbench-pack
description: Generate a project-tuned drop-in agent workbench pack — rules sharpened to the team's history, scope globs matched to the repo, rubric dimensions extended with one domain-specific entry.
version: 1.0.0
phase: 14
lesson: 42
tags: [capstone, workbench-pack, installer, schemas, drop-in]
---

Với một repo, lịch sử sự cố của nhóm và sản phẩm agent chạy bên trong nó, phát ra một agent-workbench-pack được điều chỉnh và một bộ cài.

Tạo:

1. Thư mục `agent-workbench-pack/` khớp bố cục chuẩn: AGENTS.md, docs/, schemas/, scripts/, bin/, README.md, VERSION.
2. Một `bin/install.sh` từ chối ghi đè một bộ hiện có mà không có `--force` và ghi `.workbench-version` vào repo đích.
3. Các phiên bản được điều chỉnh theo dự án của `agent-rules.md` (với ít nhất một quy tắc cho mỗi hạng mục suy ra từ sáu sự cố cuối của nhóm), `reviewer-rubric.md` (với một chiều miền thứ sáu) và `scope_contract.schema.json` (với các glob dành riêng cho dự án).
4. Một script `lint_pack.py` thất bại khi trôi dạt giữa các script và schema hoặc giữa VERSION và `schema_version` của các schema.
5. Tích hợp CI tùy chọn cài bộ trên các nhánh demo và chạy cổng xác minh đối với một tác vụ tốt đã biết.

Các trường hợp từ chối cứng:

- Một bộ chứa các tác vụ dành riêng cho dự án. Các tác vụ nằm trên bảng repo đích.
- Một bộ gắn với một SDK nhà cung cấp duy nhất. Chỉ không phụ thuộc framework; kết nối SDK là công việc của repo đích.
- Một bộ cài thay đổi các file trạng thái. Bộ cài lũy đẳng chỉ trên bề mặt; trạng thái thuộc về agent và con người.
- Các quy tắc không có một hàm kiểm tra tương ứng. Các quy tắc nguyện vọng thuộc về nhập môn, không phải trong bộ.

Các quy tắc từ chối:

- Nếu lịch sử sự cố rỗng, từ chối cung cấp một `agent-rules.md` được điều chỉnh. Sử dụng mặc định chuẩn và hiển thị khoảng trống.
- Nếu CI của repo đích không tương thích với việc cài (không `.github/workflows/`, không tương đương), từ chối bước CI tùy chọn và tài liệu hóa đường thủ công.
- Nếu nhóm sử dụng một fork riêng tư của bộ, từ chối viết một bộ cài công khai. Các bộ cài riêng tư mang các bất biến riêng tư.

Cấu trúc đầu ra:

```
agent-workbench-pack/
├── AGENTS.md
├── docs/
├── schemas/
├── scripts/
├── bin/install.sh
├── lint_pack.py
├── VERSION
└── README.md
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 41 cho benchmark trước/sau mà bộ này cải thiện.
- Bài 30 (Phát triển agent dựa trên đánh giá) cho vòng lặp đánh giá tiêu thụ các phán quyết của bộ.
- [SkillKit](https://github.com/rohitg00/skillkit) để phân phối bộ xuyên 32 agent AI.
