---
id: ship-a-workbench-pack
title: Package the workbench so one command installs it anywhere
card: agents
kind: take-home
level: 3
roles: [agentic-ai-engineer, ai-developer-relations-engineer, forward-deployed-ai-engineer]
rounds: [take-home, design-review]
tags: [workbench-pack, installer, versioning, schemas, idempotent]
minutes: 45
lessons: [phases/14-agent-engineering/42-agent-workbench-capstone]
manuals: []
practice: []
cheatsheet: [agent-workbench-ops, agent-harness]
related: [agents/seven-surfaces-one-symptom-each, agents/rules-the-workbench-can-check]
updated: 2026-11-03
---

Bài làm tại nhà. Nhóm của bạn có các bề mặt workbench dưới dạng các script rời, một tài liệu chung và một ít ký ức. Đóng gói chúng vào một thư mục mà một repository mới có thể cài bằng một lệnh, và bảo vệ những gì bạn để ra ngoài. Mang bố cục, trình cài đặt, quy tắc phiên bản và quy tắc gỡ cài đặt. Chúng tôi chấm lần cài thứ hai ngang lần đầu.

## Short answer

Cung cấp một thư mục có phiên bản với bốn phần: các tài liệu mang các quy tắc và rubric, các schema là hợp đồng, các script là runtime, và một trình cài đặt ngắn. Trình cài đặt từ chối cài đè một gói hiện có nếu không có cờ force, sao chép gói, kết nối CI nếu một thư mục workflow tồn tại, và in các bước tiếp theo. Chạy nó hai lần cho cùng kết quả. Các nhiệm vụ dự án, các lời gọi SDK nhà cung cấp và văn xuôi nhập môn ở ngoài, vì gói là công thức và mỗi lần cài là một khẩu phần.

## Full answer

### Layout

```text
agent-workbench-pack/
  AGENTS.md
  docs/        agent-rules.md  reliability-policy.md  handoff-protocol.md  reviewer-rubric.md
  schemas/     agent_state.schema.json  task_board.schema.json  scope_contract.schema.json
  scripts/     init_agent.py  run_with_feedback.py  verify_agent.py  generate_handoff.py
  bin/         install.sh
  README.md
  VERSION
```

### In and out

Bên trong: các schema, vì chúng là hợp đồng; bốn script, vì chúng là runtime; bốn tài liệu, vì chúng là các quy tắc và rubric.

Bên ngoài: các nhiệm vụ đặc thù dự án, thuộc bảng của repository đích; các lời gọi SDK nhà cung cấp, vì gói độc lập với framework; văn xuôi nhập môn, vì gói nằm cạnh phần nhập môn của nhóm chứ không bên trong nó.

### The installer

1. Từ chối cài đè một gói hiện có trừ khi `--force` được truyền.
2. Sao chép gói vào repository đích.
3. Kết nối CI nếu `.github/workflows/` tồn tại.
4. In các bước tiếp theo: điền bảng, đặt các lệnh nghiệm thu, chạy script init.

Trình cài đặt cũng viết phiên bản gói vào repository đích, và phát ra các symlink để mọi sản phẩm coding agent đọc cùng file gốc. Fork gói cho một sản phẩm là một dạng thất bại.

### Versioning

`VERSION` là hợp đồng. Một thay đổi schema hoặc script cần một migration tăng phiên bản major. Một thay đổi chỉ có tài liệu tăng patch. File trạng thái của đích ghi lại phiên bản gói mà nó được khởi tạo theo, và một lint từ chối phát hành khi phiên bản được ghi của đích không thống nhất với của gói. Đây là cách các trình quản lý gói sống sót qua một thập kỷ biến động, và không có gì về các agent thay đổi quy tắc.

### Uninstall

Trình gỡ cài đặt loại bỏ các schema, các script, các tài liệu và file gốc, và từ chối chạy khi các file trạng thái có thay đổi chưa commit. Nó không bao giờ xóa file trạng thái, bảng hoặc thư mục đầu ra. Trạng thái thuộc về người dùng. Gói không sở hữu nó.

### What we grade

- Lần chạy thứ hai của trình cài đặt không thay đổi gì.
- Lint thất bại khi gói lệch khỏi `VERSION`.
- Trình gỡ cài đặt từ chối trên trạng thái không tầm thường và để các file của người dùng tại chỗ.
- Phần bảo vệ được viết cho mỗi mục cắt bỏ, mỗi mục một đoạn văn.

## Follow-ups

- **Level 3:** Một tài liệu thứ năm tùy chọn nào bạn sẽ nâng vào gói, và tại sao? Expected: một lựa chọn có lý lẽ với mục cắt bỏ được bảo vệ, ví dụ một runbook migration, với lập luận rằng nó cần trên mỗi lần tăng major và không phải trên một dự án.
- **Level 3:** Điều gì được tính là trạng thái không tầm thường cho trình gỡ cài đặt? Expected: bất kỳ thay đổi chưa commit nào trong file trạng thái, bảng hoặc các đầu ra, vì đó là công việc của người dùng và không của gói.
- **Level 4:** Bạn di chuyển một workbench tự dựng sang gói với ít thời gian ngừng nhất thế nào? Expected: cài cạnh nó, ánh xạ mỗi file hiện có đến một schema, chạy gate trên cả hai cho một nhiệm vụ, rồi đổi con trỏ router và lưu trữ các file cũ.
- **Level 4:** Điều gì hỏng nếu hai repository ghim các phiên bản major khác nhau của gói? Expected: không gì, miễn mỗi repo ghi phiên bản của nó và lint kiểm tra mỗi repo với gói riêng, trong khi một job CI chung phải chạy phiên bản tương ứng theo repository.

## Wrong answers

- "Đặt backlog hiện tại của nhóm vào gói để các repo mới bắt đầu với các nhiệm vụ thật." Các nhiệm vụ thuộc repository đích, và một gói mang chúng là sai cho mọi repository trừ một.
- "Gọi SDK nhà cung cấp từ các script để tiết kiệm thời gian." Gói phải sống sót qua một thay đổi framework, và một lời gọi SDK gắn mọi lần cài với một runtime.
- "Làm cho trình cài đặt mặc định ghi đè để cập nhật dễ dàng." Một lần ghi đè không có cờ phá hủy các thay đổi cục bộ, và cờ force là thứ làm một cập nhật thành một quyết định.

## Taught in

[Bài tổng kết workbench](../../../phases/14-agent-engineering/42-agent-workbench-capstone/) lắp ráp gói, trình cài đặt và quy tắc phiên bản.
