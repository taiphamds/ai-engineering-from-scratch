---
name: terminal-coding-agent
description: Build and evaluate a terminal-native coding agent against SWE-bench Pro with bounded cost, sandboxed tools, and full 2026 hook surface.
version: 1.0.0
phase: 19
lesson: 01
tags: [capstone, coding-agent, claude-code, swe-bench, mcp, hooks, sandbox]
---

Với repo mục tiêu và tác vụ ngôn ngữ tự nhiên, xây harness lập kế hoạch, thực thi trong sandbox và mở pull request. Đạt ngang hoặc vượt đường cơ sở mini-swe-agent trên tập con SWE-bench Pro 30 tác vụ trong khi giữ dưới ngân sách $5-mỗi-tác-vụ.

Kế hoạch xây dựng:

1. Dựng harness TUI Bun + Ink với ô kế hoạch, luồng gọi công cụ và ngân sách token/đô la trực tiếp.
2. Định nghĩa sáu công cụ (read_file, edit_file, ripgrep, tree_sitter_symbols, run_shell, git) qua Model Context Protocol StreamableHTTP. Mọi lệnh gọi trả tối đa 4k token.
3. Chạy mọi lệnh gọi công cụ trong sandbox E2B hoặc Daytona trên nhánh `git worktree add` mới. Không bao giờ chạm hệ thống file máy chủ.
4. Kết nối đủ tám sự kiện hook 2026: SessionStart, SessionEnd, PreToolUse, PostToolUse, UserPromptSubmit, Notification, Stop, PreCompact. Bàn giao ít nhất bốn hook người dùng viết (chốt lệnh phá hủy, tính token, bộ phát span OTel, bộ ghi gói dấu vết).
5. Thực thi ba ngân sách: 50 lượt, 200k token, $5 đô la. PreCompact kích hoạt ở 150k và tóm tắt lượt cũ.
6. Phát span OpenTelemetry với quy ước ngữ nghĩa GenAI đến Langfuse tự lưu trữ.
7. Khi thành công, đẩy nhánh và mở PR với kế hoạch và gói dấu vết trong nội dung.
8. Đánh giá so với mini-swe-agent trên tập con SWE-bench Pro Python 30 issue và ghi pass@1, lượt, token, đô la mỗi tác vụ.

Tiêu chí đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | Tập con 30 tác vụ đối sánh so với đường cơ sở mini-swe-agent |
| 20 | Rõ ràng kiến trúc | Tách lập kế hoạch/hành động/quan sát, bề mặt hook, tính dễ đọc schema công cụ |
| 20 | An toàn | Red-team thoát sandbox + kiểm tra chốt lệnh phá hủy |
| 20 | Khả năng quan sát | 100% lệnh gọi công cụ có span, tính token mỗi lượt |
| 15 | UX nhà phát triển | Khởi động nguội dưới 2s, khôi phục sau sập, ngữ nghĩa hủy Ctrl-C |

Các trường hợp loại bỏ dứt khoát:

- Harness gọi git qua shell trên hệ thống file máy chủ thay vì trong sandbox.
- Mọi agent có thể ghi ngoài worktree hoặc curl URL ngoài không có hook danh sách cho phép tường minh.
- Số đánh giá báo cáo không có lần chạy đường cơ sở đối sánh trên cùng 30 issue.
- Khẳng định "tỷ lệ vượt" phụ thuộc `git reset --hard` giữa thử lại; SWE-bench Pro là pass@1.

Quy tắc từ chối:

- Từ chối đẩy trực tiếp lên main dưới mọi cấu hình. Chỉ nhánh PR.
- Từ chối tắt chốt lệnh phá hủy. Đây là yêu cầu cứng của tiêu chí chấm.
- Từ chối chạy không có trần ngân sách. Lần chạy mở làm nhiễu so sánh đánh giá.

Đầu ra: repo chứa harness, bộ kiểm thử đánh giá SWE-bench Pro cố định 30 tác vụ với lần chạy đường cơ sở mini-swe-agent đối sánh, kho dấu vết OpenTelemetry cho ít nhất 5 lần chạy đầy đủ và bài viết nêu tác vụ harness giải được mà đường cơ sở không giải được và ngược lại. Kết thúc bằng phần về ba chế độ lỗi hàng đầu bạn quan sát và thay đổi hook sửa từng lỗi.
