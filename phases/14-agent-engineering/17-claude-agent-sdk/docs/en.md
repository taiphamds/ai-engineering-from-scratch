# The Harness as a Library — Subagents and Session Store

> Một harness bạn có thể import: các công cụ tích hợp sẵn, agent phụ để cô lập ngữ cảnh, hook, lan truyền trace W3C, lưu giữ phiên. Claude Agent SDK là ví dụ tham chiếu — dạng thư viện của harness Claude Code — và Claude Managed Agents là lựa chọn được host cho công việc bất đồng bộ chạy lâu.

**Type:** Learn + Build
**Languages:** Python (stdlib)
**Prerequisites:** Phase 14 · 01 (Agent Loop), Phase 14 · 10 (Skill Libraries)
**Time:** ~75 minutes

## Learning Objectives

- Giải thích sự khác biệt giữa Anthropic Client SDK (API thô) và Claude Agent SDK (hình dạng harness).
- Mô tả các agent phụ — song song hóa và cô lập ngữ cảnh — và khi nào chọn chúng.
- Nêu tên bề mặt kho phiên của Python SDK (`append`, `load`, `list_sessions`, `delete`, `list_subkeys`) và vai trò của `--session-mirror`.
- Triển khai một harness dùng thư viện chuẩn với các công cụ tích hợp sẵn, tạo agent phụ có ngữ cảnh cô lập, các hook vòng đời và một kho phiên.

## The Problem

Một API LLM thô cho bạn một lượt khứ hồi. Một agent sản xuất cần thực thi công cụ, các máy chủ MCP, các hook vòng đời, tạo agent phụ, lưu giữ phiên, lan truyền trace. Claude Agent SDK cung cấp hình dạng này như một thư viện — cùng harness mà Claude Code sử dụng, được cung cấp cho các agent tùy chỉnh.

## The Concept

### Client SDK vs Agent SDK

- **Client SDK (`anthropic`).** Messages API thô. Bạn sở hữu vòng lặp, các công cụ, trạng thái.
- **Agent SDK (`claude-agent-sdk`).** Thực thi công cụ tích hợp sẵn, các kết nối MCP, hook, tạo agent phụ, kho phiên. Vòng lặp Claude Code dưới dạng thư viện.

### Built-in tools

SDK cung cấp sẵn 10+ công cụ: đọc/ghi file, shell, grep, glob, lấy web, nhiều nữa. Các công cụ tùy chỉnh đăng ký qua giao diện schema công cụ tiêu chuẩn.

### Subagents

Hai mục đích được Anthropic tài liệu hóa:

1. **Song song hóa.** Chạy công việc độc lập đồng thời. "Tìm file kiểm thử cho mỗi mô-đun trong số 20 mô-đun này" là 20 tác vụ agent phụ song song.
2. **Cô lập ngữ cảnh.** Các agent phụ sử dụng cửa sổ ngữ cảnh riêng; chỉ các kết quả trả về bộ điều phối. Ngân sách của bộ điều phối được giữ lại.

Các phần bổ sung gần đây của Python SDK: `list_subagents()`, `get_subagent_messages()` để đọc các bản ghi agent phụ.

### Session store

Tính tương đương giao thức với TypeScript:

- `append(session_id, message)` — thêm một lượt.
- `load(session_id)` — khôi phục hội thoại.
- `list_sessions()` — liệt kê.
- `delete(session_id)` — với xóa dây chuyền đến các phiên agent phụ.
- `list_subkeys(session_id)` — liệt kê các khóa agent phụ.

`--session-mirror` (cờ CLI) phản chiếu bản ghi đến một file bên ngoài khi nó được truyền, để gỡ lỗi.

### Hooks

Các hook vòng đời bạn có thể đăng ký:

- `PreToolUse`, `PostToolUse` — kiểm soát hoặc kiểm toán các lời gọi công cụ.
- `SessionStart`, `SessionEnd` — thiết lập và tháo dỡ.
- `UserPromptSubmit` — hành động trên đầu vào người dùng trước khi mô hình nhìn thấy nó.
- `PreCompact` — chạy trước khi cô đọng ngữ cảnh.
- `Stop` — dọn dẹp khi agent thoát.
- `Notification` — các cảnh báo kênh bên.

Các hook là cách pro-workflow (tham chiếu chương trình học Giai đoạn 14) và các hệ thống tương tự thêm hành vi xuyên suốt.

### W3C trace context

Các span OTel đang hoạt động trên bên gọi lan truyền vào tiến trình con CLI qua các header ngữ cảnh trace W3C. Toàn bộ trace nhiều tiến trình xuất hiện như một trace trong backend của bạn.

### Claude Managed Agents

Lựa chọn được host (header beta `managed-agents-2026-04-01`). Công việc bất đồng bộ chạy lâu, lưu đệm prompt tích hợp sẵn, cô đọng tích hợp sẵn. Đánh đổi quyền kiểm soát lấy hạ tầng được quản lý.

### Where this pattern goes wrong

- **Tạo quá nhiều agent phụ.** Tạo 100 agent phụ cho 100 tác vụ nhỏ. Chi phí phụ chiếm ưu thế. Thay vào đó gom nhóm.
- **Hook mở rộng dần.** Mỗi nhóm thêm hook; thời gian khởi động phình to. Đánh giá các hook hàng quý.
- **Phiên phình to.** Các phiên tích lũy; kích thước tăng. Sử dụng `list_sessions` + chính sách hết hạn.

```figure
ae-subagent-isolation
```

## Build It

`code/main.py` triển khai hình dạng SDK bằng thư viện chuẩn:

- `Tool`, `ToolRegistry` với `read_file`, `write_file`, `list_dir` tích hợp sẵn.
- `Subagent` — ngữ cảnh riêng, lần chạy cô lập, các kết quả được trả về.
- `SessionStore` — append, load, list, delete, list_subkeys.
- `Hooks` — `pre_tool_use`, `post_tool_use`, `session_start`, `session_end`.
- Một demo: agent chính tạo 3 agent phụ song song (mỗi agent được cô lập), tổng hợp các kết quả, lưu giữ phiên.

Chạy nó:

```
python3 code/main.py
```

Trace cho thấy cô lập ngữ cảnh agent phụ (kích thước ngữ cảnh bộ điều phối vẫn có giới hạn), thực thi hook và lưu giữ phiên.

## Use It

- **Claude Agent SDK** cho các sản phẩm ưu tiên Claude muốn hình dạng harness Claude Code.
- **Claude Managed Agents** cho công việc bất đồng bộ chạy lâu được host.
- **OpenAI Agents SDK** (Bài 16) cho các đối tác ưu tiên OpenAI.
- **LangGraph + các công cụ tùy chỉnh** nếu thay vào đó bạn muốn máy trạng thái có dạng đồ thị.

## Ship It

`outputs/skill-claude-agent-scaffold.md` tạo khung một ứng dụng Claude Agent SDK với các agent phụ, hook, kho phiên, gắn máy chủ MCP và lan truyền trace W3C.

## Exercises

1. Thêm một bộ tạo agent phụ gom 20 tác vụ thành các nhóm 5 agent phụ song song. Đo kích thước ngữ cảnh bộ điều phối so với một agent cho mỗi tác vụ.
2. Triển khai một hook `PreToolUse` giới hạn tốc độ các lời gọi `write_file` (5 mỗi phút cho mỗi phiên). Truy vết hành vi.
3. Nối `list_subkeys` để hiển thị một cây agent phụ. Lồng nhau sâu trông như thế nào?
4. Chuyển bản mô phỏng sang gói Python `claude-agent-sdk` thực. Điều gì thay đổi về đăng ký công cụ?
5. Đọc tài liệu Claude Managed Agents. Khi nào bạn sẽ chuyển từ tự host sang được quản lý?

## Key Terms

| Thuật ngữ | Mọi người nói gì | Nó thực sự có nghĩa gì |
|------|----------------|------------------------|
| Agent SDK | "Claude Code dưới dạng thư viện" | Hình dạng harness: công cụ, MCP, hook, agent phụ, kho phiên |
| Subagent (Agent phụ) | "Agent con" | Ngữ cảnh riêng, ngân sách riêng; các kết quả nổi lên trên |
| Session store (Kho phiên) | "Cơ sở dữ liệu hội thoại" | Lưu giữ, tải, liệt kê, xóa các lượt với xử lý dây chuyền agent phụ |
| Hook | "Callback vòng đời" | Trước/sau công cụ, phiên, gửi prompt, cô đọng, dừng |
| W3C trace context (Ngữ cảnh trace W3C) | "Trace xuyên tiến trình" | Span cha lan truyền vào tiến trình con CLI |
| Managed Agents | "Harness được host" | Công việc bất đồng bộ chạy lâu được Anthropic host |
| `--session-mirror` | "Bản phản chiếu bản ghi" | Ghi các lượt phiên vào một file bên ngoài khi chúng được truyền |
| MCP server (Máy chủ MCP) | "Bề mặt công cụ" | Nguồn công cụ/tài nguyên bên ngoài được gắn vào agent |

## Further Reading

- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview) — dạng thư viện của Claude Code
- [Anthropic, Building agents with the Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk) — các mẫu sản xuất
- [Claude Managed Agents overview](https://platform.claude.com/docs/en/managed-agents/overview) — lựa chọn được host
- [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/) — đối tác
