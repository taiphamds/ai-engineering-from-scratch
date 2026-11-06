# Capstone 01 — Terminal-Native Coding Agent

> Đến 2026, hình dạng agent lập trình đã ổn định. Một harness TUI, kế hoạch có trạng thái, bề mặt công cụ trong sandbox, vòng lặp lập kế hoạch, hành động, quan sát, khôi phục. Claude Code, Cursor 3 và OpenCode đều trông như nhau từ khoảng cách 50 foot. Bài tổng kết này yêu cầu bạn xây một hệ thống đầu cuối — CLI vào, pull request ra — và đo so với mini-swe-agent và Live-SWE-agent trên SWE-bench Pro. Bạn sẽ học tại sao phần khó không phải lệnh gọi mô hình mà là vòng lặp công cụ, sandbox và trần chi phí trong lần chạy 50 lượt.

**Type:** Capstone
**Languages:** TypeScript / Bun (harness), Python (eval scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools and protocols), Phase 14 (agents), Phase 15 (autonomous systems), Phase 17 (infrastructure)
**Phases exercised:** P0 · P5 · P7 · P10 · P11 · P13 · P14 · P15 · P17 · P18
**Time:** 35 hours

## Problem

Agent lập trình trở thành nhóm ứng dụng AI chi phối năm 2026. Claude Code (Anthropic), Cursor 3 với Composer 2 và Agent Tabs (Cursor), Amp (Sourcegraph), OpenCode (112k sao), Factory Droids và Google Jules đều cung cấp biến thể cùng kiến trúc: harness terminal, bề mặt công cụ có phân quyền, sandbox và vòng lặp lập kế hoạch-hành động-quan sát xây quanh mô hình tiên tiến hàng đầu. Biên tiên tiến hẹp — Live-SWE-agent đạt 79.2% trên SWE-bench Verified với Opus 4.5 — nhưng kỹ nghệ rộng. Phần lớn chế độ lỗi không phải sai sót mô hình. Đó là bất ổn vòng lặp công cụ, đầu độc ngữ cảnh, chi phí token mất kiểm soát và thao tác hệ thống file phá hủy.

Bạn không thể suy luận về các agent này từ bên ngoài. Bạn phải xây một agent, xem vòng lặp sập ở lượt 47 khi ripgrep trả 8MB kết quả khớp, và xây lại lớp cắt bớt. Đó là mục đích bài tổng kết này.

## Concept

Harness có bốn bề mặt. **Lập kế hoạch** duy trì đối tượng trạng thái kiểu TodoWrite mà mô hình viết lại mỗi lượt. **Hành động** phân phối lệnh gọi công cụ (đọc, sửa, chạy, tìm, git). **Quan sát** thu stdout / stderr / mã thoát, cắt bớt và đưa tóm tắt trở lại. **Khôi phục** xử lý lỗi công cụ mà không làm nổ cửa sổ ngữ cảnh hoặc lặp vô tận. Hình dạng 2026 thêm một điều: **hook**. `PreToolUse`, `PostToolUse`, `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `Notification`, `Stop` và `PreCompact` — điểm mở rộng cấu hình được nơi người vận hành đưa chính sách, dữ liệu đo từ xa và chốt bảo vệ vào.

Sandbox là E2B hoặc Daytona. Mỗi tác vụ chạy trong devcontainer mới có git worktree gắn đọc-ghi. Harness không bao giờ chạm hệ thống file máy chủ. Worktree bị dỡ khi thành công hoặc thất bại. Kiểm soát chi phí thực thi ở ba lớp: trần token mỗi lượt, ngân sách đô la mỗi phiên và giới hạn lượt cứng (thường 50). Lớp khả năng quan sát là span OpenTelemetry với quy ước ngữ nghĩa GenAI, gửi đến Langfuse tự lưu trữ.

## Architecture

```
  user CLI  ->  harness (Bun + Ink TUI)
                  |
                  v
           plan / act / observe loop  <--->  Claude Sonnet 4.7 / GPT-5.4-Codex / Gemini 3 Pro
                  |                          (via OpenRouter, model-agnostic)
                  v
           tool dispatcher (MCP StreamableHTTP client)
                  |
     +------------+------------+----------+
     v            v            v          v
  read/edit    ripgrep     tree-sitter   git/run
     |            |            |          |
     +------------+------------+----------+
                  |
                  v
           E2B / Daytona sandbox  (worktree isolated)
                  |
                  v
           hooks: Pre/Post, Session, Prompt, Compact
                  |
                  v
           OpenTelemetry -> Langfuse (spans, tokens, $)
                  |
                  v
           PR via GitHub app
```

## Stack

- Runtime harness: Bun 1.2 + Ink 5 (React-trong-terminal)
- Truy cập mô hình: API hợp nhất OpenRouter với Claude Sonnet 4.7, GPT-5.4-Codex, Gemini 3 Pro, Opus 4.5 (cho tác vụ khó nhất)
- Truyền tải công cụ: Model Context Protocol StreamableHTTP (bản sửa đổi MCP 2026)
- Sandbox: sandbox E2B (SDK JS) hoặc devcontainer Daytona
- Tìm mã: tiến trình con ripgrep, bộ phân tích tree-sitter cho 17 ngôn ngữ (biên dịch sẵn)
- Cô lập: `git worktree add` mỗi tác vụ, dọn khi thành công / thất bại
- Bộ kiểm thử đánh giá: SWE-bench Pro (tập con đã xác minh) + Terminal-Bench 2.0 + tập giữ riêng 30 tác vụ của bạn
- Khả năng quan sát: SDK OpenTelemetry với semconv `gen_ai.*` → Langfuse tự lưu trữ
- Đăng PR: GitHub App với token quyền chi tiết, phạm vi giới hạn repo mục tiêu

```figure
ce-agent-loop
```

## Build It

1. **TUI và vòng lặp lệnh.** Dựng khung dự án Bun với Ink. Nhận `agent run <repo> "<task>"`. In khung nhìn chia: ô kế hoạch (trên), luồng gọi công cụ (giữa), ngân sách token (dưới). Thêm hủy bằng Ctrl-C kích hoạt hook `SessionEnd` trước thoát.

2. **Trạng thái kế hoạch.** Định nghĩa schema TodoWrite có kiểu (mục pending / in_progress / done kèm ghi chú). Mô hình viết lại toàn trạng thái mỗi lượt dưới dạng lệnh gọi công cụ — không cho biến đổi từng phần. Lưu bền kế hoạch vào `.agent/state.json` để tiếp tục sau sập.

3. **Bề mặt công cụ.** Định nghĩa sáu công cụ: `read_file`, `edit_file` (có xem trước diff), `ripgrep`, `tree_sitter_symbols`, `run_shell` (có thời gian chờ), `git` (status / diff / commit / push). Cung cấp qua MCP StreamableHTTP để harness không phụ thuộc truyền tải. Mọi công cụ trả đầu ra cắt bớt (trần 4k token mỗi lệnh gọi).

4. **Bọc sandbox.** Mỗi tác vụ tạo sandbox E2B. `git worktree add -b agent/$TASK_ID` một nhánh mới. Mọi lệnh gọi công cụ thực thi trong sandbox. Không thể truy cập hệ thống file máy chủ.

5. **Hook.** Triển khai đủ tám loại hook 2026. Kết nối ít nhất bốn hook người dùng viết: (a) chốt lệnh phá hủy `PreToolUse` chặn `rm -rf` ngoài worktree, (b) tính token `PostToolUse`, (c) khởi tạo ngân sách `SessionStart`, (d) `Stop` ghi gói dấu vết cuối.

6. **Vòng lặp đánh giá.** Clone tập con 30 issue SWE-bench Pro Python. Chạy harness trên từng issue. So với mini-swe-agent (đường cơ sở tối thiểu) trên pass@1, lượt-mỗi-tác-vụ và $-mỗi-tác-vụ. Ghi kết quả vào `eval/results.jsonl`.

7. **Kiểm soát chi phí.** Ngưỡng cắt cứng: 50 lượt, ngữ cảnh 200k, $5 mỗi tác vụ. Hook `PreCompact` tóm tắt lượt cũ thành block trạng thái trước ở mốc 150k, giải phóng chỗ quan sát mới mà không mất kế hoạch.

8. **Đăng PR.** Khi thành công, bước cuối là `git push` + lệnh gọi API GitHub mở PR với kế hoạch và tóm tắt diff trong nội dung.

## Use It

```
$ agent run ./my-repo "Fix the race condition in worker.rs"
[plan]  1 locate worker.rs and enumerate mutex uses
        2 identify shared state under contention
        3 propose fix, verify tests
[tool]  ripgrep mutex.*lock -t rust           (44 matches, truncated)
[tool]  read_file src/worker.rs 120..180
[tool]  edit_file src/worker.rs (+8 -3)
[tool]  run_shell cargo test worker::          (passed)
[plan]  1 done · 2 done · 3 done
[done]  PR opened: #482   turns=9   tokens=38k   cost=$0.41
```

## Ship It

Skill bàn giao nằm trong `outputs/skill-terminal-coding-agent.md`. Với đường dẫn repo và mô tả tác vụ, chạy toàn vòng lặp lập kế hoạch-hành động-quan sát trong sandbox và trả URL PR cộng gói dấu vết. Tiêu chí chấm cho bài tổng kết:

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 so với đường cơ sở | Harness của bạn so với mini-swe-agent trên 30 tác vụ Python đối sánh |
| 20 | Rõ ràng kiến trúc | Tách lập kế hoạch/hành động/quan sát, bề mặt hook, schema công cụ — rà theo bố cục Live-SWE-agent |
| 20 | An toàn | Kiểm thử thoát sandbox, yêu cầu quyền, chốt lệnh phá hủy vượt red-team |
| 20 | Khả năng quan sát | Đầy đủ dấu vết (100% lệnh gọi công cụ có span), tính token mỗi lượt |
| 15 | UX nhà phát triển | Khởi động nguội < 2s, khôi phục sau sập tiếp tục kế hoạch, Ctrl-C hủy sạch giữa công cụ |
| **100** | | |

## Exercises

1. Đổi mô hình nền từ Claude Sonnet 4.7 sang Qwen3-Coder-30B phục vụ trên vLLM. So sánh pass@1 và $-mỗi-tác-vụ. Báo cáo nơi mô hình mở kém hơn.

2. Thêm agent phụ `reviewer` đọc diff trước đăng PR và có thể yêu cầu vòng lặp sửa đổi. Đo đánh giá dương tính giả có giảm tỷ lệ vượt SWE-bench dưới đường cơ sở một agent không (gợi ý: thường có).

3. Kiểm thử sức chịu đựng sandbox: viết tác vụ thử `curl` URL ngoài và tác vụ ghi ngoài worktree. Xác nhận cả hai bị hook PreToolUse chặn. Ghi log nỗ lực.

4. Triển khai tóm tắt `PreCompact` bằng mô hình nhỏ hơn (Haiku 4.5). Đo độ trung thực kế hoạch mất bao nhiêu ở nén ngữ cảnh 3x.

5. Đổi truyền tải MCP StreamableHTTP sang stdio. Đo chuẩn khởi động nguội và độ trễ mỗi lệnh gọi. Chọn phương án thắng cho dùng chỉ cục bộ.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Harness | "Vòng lặp agent" | Mã quanh mô hình phân phối công cụ, duy trì trạng thái kế hoạch và thực thi ngân sách |
| Hook | "Bộ lắng nghe sự kiện agent" | Script người dùng viết được harness chạy trên một trong tám sự kiện vòng đời |
| Worktree | "Sandbox Git" | Checkout git liên kết ở đường dẫn riêng; dùng xong bỏ mà không chạm bản clone chính |
| TodoWrite | "Trạng thái kế hoạch" | Danh sách có kiểu các mục chờ/đang làm/hoàn tất mô hình viết lại mỗi lượt |
| StreamableHTTP | "Truyền tải MCP" | Bản sửa MCP 2026: kết nối HTTP sống lâu với truyền luồng hai chiều; thay SSE |
| Token ceiling (Trần token) | "Ngân sách ngữ cảnh" | Trần token đầu vào+đầu ra mỗi lượt hoặc phiên; kích hoạt nén ngữ cảnh hoặc kết thúc |
| pass@1 | "Tỷ lệ vượt một lần thử" | Tỷ phần tác vụ SWE-bench giải được lần chạy đầu không thử lại hoặc nhìn trộm tập kiểm thử |

## Further Reading

- [Claude Code documentation](https://docs.anthropic.com/en/docs/claude-code) — harness tham chiếu từ Anthropic
- [Cursor 3 changelog](https://cursor.com/changelog) — ghi chú sản phẩm Agent Tabs và Composer 2
- [mini-swe-agent](https://github.com/SWE-agent/mini-swe-agent) — đường cơ sở tối thiểu để so harness SWE-bench
- [Live-SWE-agent](https://github.com/OpenAutoCoder/live-swe-agent) — 79.2% SWE-bench Verified với Opus 4.5
- [OpenCode](https://opencode.ai) — harness mở, 112k sao
- [SWE-bench Pro leaderboard](https://www.swebench.com) — đánh giá bài tổng kết nhắm đến
- [Model Context Protocol 2026 roadmap](https://blog.modelcontextprotocol.io/posts/2026-mcp-roadmap/) — StreamableHTTP, metadata năng lực
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) — schema span cho lệnh gọi công cụ và sử dụng token
