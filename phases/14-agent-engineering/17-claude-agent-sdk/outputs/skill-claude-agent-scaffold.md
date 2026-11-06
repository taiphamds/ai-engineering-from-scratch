---
name: claude-agent-scaffold
description: Scaffold a Claude Agent SDK app with subagents, lifecycle hooks, session store, MCP server attachment, and W3C trace propagation.
version: 1.0.0
phase: 14
lesson: 17
tags: [claude-agent-sdk, subagents, hooks, session-store, mcp]
---

Với một miền sản phẩm và một danh sách các máy chủ MCP, tạo khung một ứng dụng Claude Agent SDK.

Tạo:

1. Một định nghĩa agent chính với các chỉ dẫn, truy cập công cụ tích hợp sẵn (read_file, write_file, shell, grep, glob, lấy web) và các công cụ hàm tùy chỉnh.
2. Bộ tạo agent phụ cho song song hóa và cô lập ngữ cảnh. Sử dụng khi nếu không bộ điều phối sẽ vượt ngân sách ngữ cảnh của nó.
3. Các hook vòng đời được đăng ký: PreToolUse + PostToolUse cho kiểm toán, SessionStart cho thiết lập, SessionEnd cho tháo dỡ, UserPromptSubmit cho thực thi quy tắc (xem các mẫu pro-workflow).
4. Kho phiên (SQLite mặc định) với `list_subkeys` được nối để hiển thị một cây agent phụ.
5. Gắn máy chủ MCP cho các bề mặt công cụ/tài nguyên bên ngoài.
6. Lan truyền ngữ cảnh trace W3C để các span OTel từ bên gọi tiếp tục qua CLI.

Các trường hợp từ chối cứng:

- Tạo một agent phụ cho một tác vụ một công cụ. Các agent phụ dành cho song song hóa hoặc cô lập ngữ cảnh; không phải cho "một lời gọi read_file."
- Các hook với công việc tốn kém đồng bộ. Các hook nên từ micro giây đến mili giây. Công việc dài thuộc về một agent phụ.
- Các kho phiên không có chính sách xóa dây chuyền. Các phiên agent phụ mồ côi làm phình lưu trữ.

Các quy tắc từ chối:

- Nếu sản phẩm cần công việc bất đồng bộ chạy lâu (hàng giờ đến hàng ngày), từ chối SDK tự host và định tuyến đến Claude Managed Agents.
- Nếu người dùng yêu cầu `--session-mirror` đến một vị trí dùng chung, từ chối. Các bản ghi phiên mang PII; phản chiếu đến lưu trữ được mã hóa cho từng người dùng.
- Nếu agent phụ thuộc streaming LLM thô cho UX mà không sử dụng công cụ, từ chối Agent SDK và khuyến nghị Client SDK trực tiếp.

Đầu ra: `agent.py`, `tools.py`, `hooks.py`, `session.py`, `README.md` giải thích chính sách agent phụ, sổ đăng ký hook, backend phiên, các gắn kết MCP và kết nối OTel. Kết thúc bằng "đọc gì tiếp theo" chỉ đến Bài 22 cho các bàn giao giọng nói, Bài 23 cho quy thuộc span OTel hoặc Bài 18 nếu sản phẩm cần hình dạng runtime sản xuất.
