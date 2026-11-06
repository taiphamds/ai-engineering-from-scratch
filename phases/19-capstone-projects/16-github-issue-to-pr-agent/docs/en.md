# Capstone 16 — GitHub Issue-to-PR Autonomous Agent

> Gắn nhãn một issue, nhận một PR — hình thức sản phẩm năm 2026 cho agent lập trình tự trị: chạy một agent trong một sandbox đám mây, xác minh kiểm thử đạt, và đăng một PR sẵn sàng rà soát với lý do. AWS Remote SWE Agents, Cursor Background Agents, OpenAI Codex cloud, và Google Jules đều cung cấp nó. Các phần khó là tự động tái tạo môi trường dựng của repo, ngăn rò rỉ thông tin xác thực, thực thi ngân sách theo repo, và bảo đảm agent không thể force-push. Bài tổng kết này xây dựng phiên bản tự lưu trữ và so sánh nó về chi phí và tỷ lệ đạt với các lựa chọn được lưu trữ.

**Type:** Capstone
**Languages:** Python (agent), TypeScript (GitHub App), YAML (Actions)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 17 (infrastructure)
**Phases exercised:** P11 · P13 · P14 · P15 · P17
**Time:** 30 hours

## Problem

Agent lập trình đám mây bất đồng bộ là một hạng mục sản phẩm riêng so với agent lập trình tương tác (bài tổng kết 01). UX là một nhãn GitHub. Bạn gắn nhãn một issue `@agent fix this`, một worker khởi động trong một sandbox đám mây, clone repo, chạy kiểm thử, chỉnh sửa file, xác minh, và mở một PR với lý do của agent trong phần thân. Không có vòng lặp tương tác, không có terminal. AWS Remote SWE Agents, Cursor Background Agents, OpenAI Codex cloud, Google Jules, và Factory Droids đều hội tụ vào điều này.

Các thách thức kỹ thuật rất cụ thể: tái tạo môi trường (agent phải dựng repo từ đầu mà không có image phát triển được lưu đệm), kiểm thử chập chờn (phải được chạy lại hoặc cô lập), giới hạn phạm vi thông tin xác thực (một GitHub App với quyền chi tiết tối thiểu), thực thi ngân sách theo repo mỗi ngày, và chính sách không force-push. Bài tổng kết đo tỷ lệ đạt, chi phí, và an toàn so với các lựa chọn được lưu trữ.

## Concept

Bộ kích hoạt là một webhook GitHub (nhãn issue hoặc bình luận PR). Một dispatcher đưa công việc vào hàng đợi ECS Fargate hoặc Lambda. Worker kéo repo vào một sandbox Daytona hoặc E2B với một Dockerfile tổng quát được suy ra từ repo (ngôn ngữ, framework). Agent chạy một vòng lặp mini-swe-agent hoặc SWE-agent v2 với Claude Opus 4.7 hoặc GPT-5.4-Codex. Nó lặp: đọc mã, đề xuất bản sửa, áp dụng patch, chạy kiểm thử.

Xác minh là bước kiểm soát cổng. CI đầy đủ phải đạt trong sandbox trước khi PR mở. Chênh lệch độ bao phủ được tính; nếu âm vượt một ngưỡng, PR mở nhưng được gắn nhãn `needs-review`. Agent đăng lý do dưới dạng mô tả PR cùng một luồng `@agent` mà người rà soát có thể ping để trao đổi tiếp.

An toàn được giới hạn phạm vi qua hai bề mặt GitHub khác nhau: App cung cấp một token cài đặt ngắn hạn với `workflows: read` và các phạm vi nội dung repo/PR hẹp; bảo vệ nhánh (không phải quyền app) thực thi "không ghi trực tiếp vào `main`" và "không force-push" — app không bao giờ được thêm vào danh sách bỏ qua. Quyền truy cập chỉ đọc theo đường dẫn tới `.github/workflows` không phải một cơ chế gốc thực sự của GitHub App, nên danh sách cho phép chỉnh sửa file của agent phải thực thi điều đó tại worker. Trần ngân sách theo repo mỗi ngày được thực thi tại dispatcher (ví dụ, tối đa 5 PR mỗi repo mỗi ngày, $20 mỗi PR).

## Architecture

```
GitHub issue labeled `@agent fix` or PR comment
            |
            v
    GitHub App webhook -> AWS Lambda dispatcher
            |
            v
    ECS Fargate task (or GitHub Actions self-hosted runner)
       - pull repo
       - infer Dockerfile (language, package manager)
       - Daytona / E2B sandbox with target runtime
       - clone -> git worktree -> agent branch
            |
            v
    mini-swe-agent / SWE-agent v2 loop
       Claude Opus 4.7 or GPT-5.4-Codex
       tools: ripgrep, tree-sitter, read/edit, run_tests, git
            |
            v
    verify CI passes in-sandbox + coverage delta check
            |
            v (verified)
    git push + open PR via GitHub App
       PR body = rationale + diff summary + trace URL
       label: needs-review
            |
            v
    operator reviews; can @-mention agent for follow-ups
```

## Stack

- Kích hoạt: GitHub App với token chi tiết; bộ nhận webhook qua Lambda hoặc Fly.io
- Worker: tác vụ ECS Fargate (hoặc runner GitHub Actions tự lưu trữ)
- Sandbox: devcontainer Daytona hoặc sandbox E2B cho mỗi tác vụ
- Vòng lặp agent: đường cơ sở mini-swe-agent hoặc SWE-agent v2 trên Claude Opus 4.7 / GPT-5.4-Codex
- Truy xuất: repo-map tree-sitter + ripgrep
- Xác minh: CI đầy đủ trong sandbox + cổng chênh lệch độ bao phủ
- Khả năng quan sát: Langfuse với kho trace theo PR được liên kết từ phần thân PR
- Ngân sách: trần đô la hàng ngày theo repo; số PR tối đa mỗi repo mỗi ngày

```figure
cf-issue-to-pr
```

## Build It

1. **GitHub App.** Token cài đặt chi tiết: issues đọc+ghi, pull_requests ghi, contents đọc+ghi, workflows đọc. Bảo vệ nhánh (bề mặt duy nhất có thể làm điều này) thực thi "không push trực tiếp vào `main`" và "không force-push"; app không nằm trong danh sách bỏ qua. Worker thực thi "không ghi dưới `.github/workflows`" dưới dạng kiểm tra danh sách cho phép trên diff được đề xuất, vì quyền GitHub App không được giới hạn theo đường dẫn.

2. **Bộ nhận webhook.** Hàm Lambda nhận các webhook nhãn issue / bình luận PR. Lọc theo nhãn `@agent fix this`. Đưa vào hàng đợi SQS.

3. **Dispatcher.** Lấy các tác vụ khỏi SQS. Thực thi ngân sách theo repo mỗi ngày. Khởi động một tác vụ ECS Fargate với URL repo, phần thân issue, và một sandbox Daytona mới.

4. **Suy ra môi trường.** Phát hiện ngôn ngữ (Python, Node, Go, Rust) và trình quản lý gói (uv, pnpm, go mod, cargo). Tạo một Dockerfile ngay khi chạy nếu chưa có.

5. **Vòng lặp agent.** mini-swe-agent hoặc SWE-agent v2 với Claude Opus 4.7. Công cụ: ripgrep, repo-map tree-sitter, read_file, edit_file, run_tests, git. Giới hạn cứng: chi phí $20, 30 phút thời gian thực, 30 lượt agent.

6. **Xác minh.** Sau khi vòng lặp kết thúc, chạy bộ kiểm thử đầy đủ trong sandbox. Tính chênh lệch độ bao phủ qua jacoco / coverage.py. Nếu CI đỏ: dừng, không mở PR. Nếu độ bao phủ giảm hơn 2%: mở PR với nhãn `needs-review`.

7. **Đăng PR.** Đẩy nhánh agent. Mở PR qua GitHub API với: tiêu đề, lý do, tóm tắt diff, URL trace, chi phí, số lượt.

8. **Vệ sinh thông tin xác thực.** Worker chạy với một token cài đặt GitHub App ngắn hạn. Các nhật ký được xóa bí mật trước khi lưu trữ.

9. **Đánh giá.** 30 issue nội bộ được tạo sẵn với độ khó khác nhau. Đo tỷ lệ đạt, chất lượng PR (kích thước diff, phong cách, độ bao phủ), chi phí, độ trễ. So sánh với Cursor Background Agents và AWS Remote SWE Agents trên cùng các issue.

## Use It

```
# on github.com
  - user labels issue #842 with `@agent fix this`
  - PR #1903 appears 14 minutes later
  - body:
    > Fixed NPE in widget.dedupe() caused by null comparator entry.
    > Added regression test widget_test.go::TestDedupeNullComparator.
    > Coverage delta: +0.12%
    > Turns: 7  Cost: $1.80  Trace: langfuse:...
    > Label: needs-review
```

## Ship It

`outputs/skill-issue-to-pr.md` là sản phẩm bàn giao. Một GitHub App + worker đám mây bất đồng bộ biến các issue được gắn nhãn thành các PR sẵn sàng rà soát với chi phí có giới hạn và thông tin xác thực được giới hạn phạm vi.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Tỷ lệ đạt trên 30 issue | Thành công đầu cuối (CI xanh + độ bao phủ OK) |
| 20 | Chất lượng PR | Kích thước diff, chênh lệch độ bao phủ, tuân thủ phong cách |
| 20 | Chi phí và độ trễ trên mỗi issue đã giải quyết | $ và thời gian thực trên mỗi PR |
| 20 | An toàn | Token được giới hạn phạm vi, ngân sách theo repo, không force-push, vệ sinh thông tin xác thực |
| 15 | UX người vận hành | Bình luận lý do, khả năng thử lại, trao đổi tiếp qua @-mention |
| **100** | | |

## Exercises

1. Thêm một chế độ "sửa kiểm thử chập chờn": nhãn `@agent stabilize-flake TestX` chạy kiểm thử 50 lần trong sandbox và đề xuất một thay đổi tối thiểu làm nó ổn định.

2. So sánh chi phí với Cursor Background Agents trên ba issue dùng chung. Báo cáo công cụ nào thắng ở đâu.

3. Triển khai một bảng điều khiển ngân sách: chi phí theo repo mỗi ngày, chi phí theo người dùng. Cảnh báo khi bất thường.

4. Xây dựng một chế độ "chạy thử" mở một PR nháp mà không chạy CI, để người rà soát có thể xem xét kế hoạch với chi phí thấp.

5. Thêm một chính sách lưu giữ: các nhánh PR quá 7 ngày mà chưa hợp nhất được xóa tự động.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| GitHub App | "Danh tính bot được giới hạn phạm vi" | App với quyền chi tiết + token cài đặt ngắn hạn |
| Async cloud agent (Agent đám mây bất đồng bộ) | "Agent nền" | Worker không tương tác chạy trong một sandbox đám mây, không phải terminal |
| Environment inference (Suy ra môi trường) | "Tổng hợp Dockerfile" | Phát hiện ngôn ngữ + trình quản lý gói, tạo một Dockerfile nếu thiếu |
| Verification (Xác minh) | "CI trong sandbox" | Chạy bộ kiểm thử đầy đủ bên trong worker trước khi mở một PR |
| Coverage delta (Chênh lệch độ bao phủ) | "Bảo toàn độ bao phủ" | Thay đổi % độ bao phủ kiểm thử từ nhánh cơ sở đến nhánh agent |
| Per-repo budget (Ngân sách theo repo) | "Trần hàng ngày" | Trần đô la và số PR được thực thi tại dispatcher |
| Rationale (Lý do) | "Giải thích phần thân PR" | Tóm tắt của agent về điều gì đã thay đổi và tại sao; bắt buộc trong phần thân PR |

## Further Reading

- [AWS Remote SWE Agents](https://github.com/aws-samples/remote-swe-agents) — tham chiếu agent đám mây bất đồng bộ chuẩn
- [SWE-agent](https://github.com/SWE-agent/SWE-agent) — tham chiếu CLI
- [Cursor Background Agents](https://docs.cursor.com/background-agent) — lựa chọn thay thế thương mại
- [OpenAI Codex (cloud)](https://openai.com/codex) — đối thủ được lưu trữ
- [Google Jules](https://jules.google) — phiên bản được lưu trữ của Google
- [Factory Droids](https://www.factory.ai) — tham chiếu thương mại thay thế
- [GitHub App documentation](https://docs.github.com/en/apps) — danh tính bot được giới hạn phạm vi
- [Daytona cloud sandboxes](https://daytona.io) — sandbox tham chiếu
