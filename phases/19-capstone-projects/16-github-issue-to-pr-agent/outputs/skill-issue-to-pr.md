---
name: issue-to-pr
description: Build an async GitHub issue-to-PR agent that runs in a cloud sandbox, reproduces the build, verifies tests, and opens review-ready PRs within strict per-repo budgets.
version: 1.0.0
phase: 19
lesson: 16
tags: [capstone, async-agent, github, fargate, daytona, swe-bench, budget, safety]
---

Với một kho GitHub có các issue được gắn nhãn `@agent fix this`, cung cấp một agent đám mây tự lưu trữ biến mỗi issue được gắn nhãn thành một PR sẵn sàng rà soát với thông tin xác thực được giới hạn phạm vi và chi phí có giới hạn.

Kế hoạch xây dựng:

1. GitHub App với token chi tiết: issues đọc ghi, PR ghi, contents đọc ghi, workflows đọc. Không force-push. Bảo vệ nhánh trên main ngăn ghi trực tiếp.
2. Bộ nhận webhook (Lambda hoặc Fly.io) lọc các sự kiện nhãn / bình luận PR và đưa vào hàng đợi SQS.
3. Dispatcher thực thi các trần $ và số PR theo repo mỗi ngày; khởi động một tác vụ ECS Fargate cho mỗi công việc được phép.
4. Suy ra môi trường: phát hiện ngôn ngữ + trình quản lý gói + runtime từ nội dung repo. Tổng hợp một Dockerfile ngay khi chạy nếu thiếu.
5. Sandbox Daytona hoặc E2B cho mỗi tác vụ. Clone repo vào một `git worktree` mới + nhánh agent.
6. Vòng lặp agent (mini-swe-agent hoặc SWE-agent v2 trên Claude Opus 4.7 hoặc GPT-5.4-Codex). Công cụ: ripgrep, repo-map tree-sitter, read_file, edit_file, run_tests, git. Trần: $20, 30 lượt, 30 phút.
7. Xác minh: CI đầy đủ trong sandbox; chênh lệch độ bao phủ qua jacoco / coverage.py; gắn nhãn `needs-review` nếu chênh lệch < -2%; dừng nếu CI đỏ.
8. Mở PR qua GitHub API với lý do, tóm tắt diff, URL trace, chi phí, số lượt.
9. Khả năng quan sát: trace Langfuse cho mỗi PR; xóa bí mật khỏi nhật ký; bảng điều khiển ngân sách theo repo.
10. Đánh giá trên 30 issue nội bộ được tạo sẵn; so sánh với Cursor Background Agents và AWS Remote SWE Agents trên một tập con ba issue dùng chung.

Thang đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Tỷ lệ đạt trên 30 issue | Thành công đầu cuối (CI xanh + độ bao phủ OK) |
| 20 | Chất lượng PR | Kích thước diff, chênh lệch độ bao phủ, tuân thủ phong cách |
| 20 | Chi phí và độ trễ trên mỗi issue đã giải quyết | $/PR và thời gian thực/PR |
| 20 | An toàn | Token được giới hạn phạm vi, ngân sách theo repo, không force-push, vệ sinh thông tin xác thực |
| 15 | UX người vận hành | Bình luận lý do, khả năng thử lại, trao đổi tiếp qua @-mention |

Các trường hợp loại thẳng:

- Bất kỳ agent nào có thể force-push. Loại trừ cứng.
- Các dispatcher bỏ qua kiểm tra ngân sách. Các vòng lặp mất kiểm soát là lỗi kinh điển.
- Các PR được mở mà CI đầy đủ chưa đạt trong sandbox.
- Các kho trace chứa token hoặc PII chưa được che.

Quy tắc từ chối:

- Từ chối cài đặt mà không có bảo vệ nhánh trên main.
- Từ chối chạy mà không có ngân sách hàng ngày theo repo (đô la và số PR).
- Từ chối tự động thử lại các lần chạy thất bại; mọi lần thử lại đều yêu cầu con người gắn lại nhãn.

Đầu ra: một repo chứa GitHub App, bộ nhận webhook, dispatcher + sổ cái ngân sách, định nghĩa tác vụ Fargate, bộ quản lý vòng đời sandbox, vòng lặp mini-swe-agent, lần chạy đánh giá 30 issue, một so sánh song song với Cursor Background Agents và AWS Remote SWE Agents, và một bài viết nêu tên ba lỗi suy ra bản dựng hàng đầu cùng thay đổi tổng hợp Dockerfile đã làm giảm từng lỗi.
