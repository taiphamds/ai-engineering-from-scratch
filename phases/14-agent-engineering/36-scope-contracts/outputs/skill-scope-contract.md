---
name: scope-contract
description: Generate per-task scope contracts with allowed/forbidden globs, acceptance criteria, and rollback plan, plus a CI-ready glob-aware checker that runs on every agent diff.
version: 1.0.0
phase: 14
lesson: 36
tags: [scope, contract, globs, diff-check, ci]
---

Với một mô tả tác vụ và một bố cục repo, tạo một hợp đồng phạm vi và một bộ kiểm tra nhận biết diff.

Tạo:

1. `scope_contract.json` cho tác vụ với các trường: `task_id`, `goal`, `allowed_files` (các glob), `forbidden_files` (các glob), `acceptance_criteria`, `rollback_plan`, `approvals_required`.
2. `tools/scope_check.py` nhận một đường dẫn hợp đồng và một danh sách các file đã chạm và trả về một `ScopeReport` cộng thoát khác không trên bất kỳ vi phạm nào.
3. Bước CI (`.github/workflows/scope-check.yml` hoặc tương đương) chạy bộ kiểm tra đối với diff hợp nhất.
4. Quy ước lưu trữ `outputs/scope/closed/<task_id>.json` để các hợp đồng được cung cấp cùng lịch sử thay đổi.

Các trường hợp từ chối cứng:

- Một hợp đồng không có `forbidden_files`. Không gian âm là một phần hợp đồng.
- Một hợp đồng liệt kê các đường dẫn thô thay vì các glob cho các thư mục mã. Các lần tái cấu trúc làm mất hiệu lực các đường dẫn thô qua đêm.
- Một trường `rollback_plan` rỗng hoặc "xem sổ tay vận hành." Nêu rõ nó.
- Các phê duyệt được liệt kê là "từng trường hợp." Các ranh giới phê duyệt phải có thể liệt kê.

Các quy tắc từ chối:

- Nếu mô tả tác vụ không giới hạn một vùng repo, từ chối soạn `allowed_files` chỉ từ mô tả. Hỏi thư mục mà tác vụ nằm trong.
- Nếu repo không có lệnh kiểm thử, từ chối thêm `acceptance_criteria` cho đến khi một lệnh được cung cấp hoặc tạo stub. Một hợp đồng không thể xác minh là một mong muốn.
- Nếu runtime agent không thể tôn trọng các ranh giới phê duyệt (không có con người tham gia), hiển thị khoảng trống trước khi phát hành; mở rộng phạm vi vào các hành động yêu cầu phê duyệt sẽ là thất bại chiếm ưu thế.

Cấu trúc đầu ra:

```
<repo>/
├── scope_contract.json
├── outputs/scope/closed/
│   └── T-XXX.json
├── tools/
│   └── scope_check.py
└── .github/
    └── workflows/
        └── scope-check.yml
```

Kết thúc bằng "đọc gì tiếp theo" chỉ đến:

- Bài 37 cho phản hồi runtime liên kết các lệnh đã chạy trở lại hợp đồng.
- Bài 38 cho cổng xác minh tiêu thụ báo cáo phạm vi.
- Bài 39 cho agent đánh giá kiểm toán kho lưu trữ hợp đồng đã đóng.
