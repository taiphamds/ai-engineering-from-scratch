# Capstone 10 — Multi-Agent Software Engineering Team

> Hình thức của một nhóm kỹ thuật đa agent năm 2026 đã hội tụ: một kiến trúc sư lập kế hoạch, N lập trình viên làm việc trong các worktree song song, một người rà soát kiểm soát cổng, một người kiểm thử xác minh. Kiến trúc nhà máy của SWE-AF, cách tạo prompt theo vai trò của MetaGPT, đồ thị actor có kiểu của AutoGen 0.4, Devin của Cognition, và Droids của Factory đều độc lập đi đến hình thức đó. Các worktree song song chuyển thời gian thực thành thông lượng. Trạng thái dùng chung và giao thức bàn giao trở thành bề mặt lỗi. Bài tổng kết là xây dựng nhóm, đánh giá trên SWE-bench Pro, và báo cáo những bước bàn giao nào bị hỏng và tần suất của chúng.

**Type:** Capstone
**Languages:** Python / TypeScript (agents), Shell (worktree scripts)
**Prerequisites:** Phase 11 (LLM engineering), Phase 13 (tools), Phase 14 (agents), Phase 15 (autonomous), Phase 16 (multi-agent), Phase 17 (infrastructure)
**Phases exercised:** P11 · P13 · P14 · P15 · P16 · P17
**Time:** 40 hours

## Problem

Các harness lập trình đơn agent chạm trần ở những nhiệm vụ lớn. Không phải vì bất kỳ agent riêng lẻ nào yếu, mà vì ngữ cảnh 200k token không thể chứa một kế hoạch kiến trúc cộng bốn phần cơ sở mã song song cộng bình luận của người rà soát cộng đầu ra kiểm thử. Các nhà máy đa agent chia nhỏ vấn đề: một kiến trúc sư sở hữu kế hoạch, các lập trình viên sở hữu việc triển khai trong các worktree song song, một người rà soát kiểm soát cổng, một người kiểm thử xác minh. Kiến trúc "nhà máy" của SWE-AF, các vai trò của MetaGPT, đồ thị actor có kiểu của AutoGen — cả ba cách nhìn đều mô tả cùng một hình thức.

Bề mặt lỗi là bước bàn giao. Kiến trúc sư lên kế hoạch cho thứ mà các lập trình viên không thể triển khai. Các lập trình viên tạo ra các diff xung đột. Người rà soát chấp thuận một bản sửa ảo giác. Người kiểm thử chạy đua với một lập trình viên vẫn đang viết. Bạn sẽ xây dựng một trong những nhóm này, chạy nó trên 50 issue SWE-bench Pro, theo dõi mọi bước bàn giao, và công bố bản phân tích sau sự cố.

## Concept

Các vai trò là những agent có kiểu. **Kiến trúc sư** (Claude Opus 4.7) đọc issue, viết kế hoạch, và chia nó thành các nhiệm vụ con với giao diện rõ ràng. **Các lập trình viên** (Claude Sonnet 4.7, N thực thể song song, mỗi thực thể trong một `git worktree` + sandbox Daytona) triển khai các nhiệm vụ con độc lập. **Người rà soát** (GPT-5.4) đọc diff đã hợp nhất và chấp thuận hoặc yêu cầu những thay đổi cụ thể. **Người kiểm thử** (Gemini 2.5 Pro) chạy bộ kiểm thử trong môi trường cô lập và báo cáo đạt/trượt kèm hiện vật.

Giao tiếp thông qua một bảng nhiệm vụ dùng chung (dựa trên file hoặc Redis). Mỗi vai trò tiêu thụ các nhiệm vụ mà nó được phép xử lý. Các bước bàn giao là thông điệp có kiểu theo giao thức A2A. Các mối quan tâm về điều phối: giải quyết xung đột hợp nhất (vai trò điều phối hoặc hợp nhất ba chiều tự động), đồng bộ trạng thái dùng chung (kế hoạch được đóng băng khi các lập trình viên bắt đầu; việc lập lại kế hoạch là những sự kiện riêng), và kiểm soát cổng của người rà soát (người rà soát không thể chấp thuận các thay đổi của chính mình hoặc các thay đổi do mình đề xuất).

Khuếch đại token là chi phí ẩn. Mỗi ranh giới vai trò bổ sung các prompt tóm tắt và ngữ cảnh bàn giao. Một lần chạy đơn agent 40 lượt trở thành tổng cộng 160 lượt trên bốn vai trò. Thang đánh giá đặc biệt đặt trọng số cho hiệu quả token so với đường cơ sở đơn agent vì câu hỏi không phải là "đa agent có hoạt động không" mà là "nó có thắng trên mỗi đô la không."

## Architecture

```
GitHub issue URL
      |
      v
Architect (Opus 4.7)
   reads issue, produces plan with subtasks + interfaces
      |
      v
Task board (file / Redis)
      |
   +-- subtask 1 ---+-- subtask 2 ---+-- subtask 3 ---+-- subtask 4 ---+
   v                v                v                v                v
Coder A          Coder B          Coder C          Coder D          (4 parallel)
 (Sonnet)         (Sonnet)         (Sonnet)         (Sonnet)
 worktree A       worktree B       worktree C       worktree D
 Daytona          Daytona          Daytona          Daytona
      |                |                |                |
      +--------+-------+-------+--------+
               v
           merge coordinator  (three-way merge + conflict resolution)
               |
               v
           Reviewer (GPT-5.4)
               |
               v
           Tester  (Gemini 2.5 Pro)  -> passes? -> open PR
                                     -> fails?  -> route back to coder
```

## Stack

- Điều phối: LangGraph với trạng thái dùng chung + đồ thị con cho mỗi agent
- Nhắn tin: giao thức A2A (Google 2025) cho các thông điệp có kiểu giữa agent
- Mô hình: Opus 4.7 (kiến trúc sư), Sonnet 4.7 (lập trình viên), GPT-5.4 (người rà soát), Gemini 2.5 Pro (người kiểm thử)
- Cô lập worktree: `git worktree add` cho mỗi lập trình viên + sandbox Daytona
- Bộ điều phối hợp nhất: hợp nhất ba chiều tùy chỉnh + giải quyết xung đột qua trung gian LLM
- Đánh giá: SWE-bench Pro (50 issue), các kịch bản SWE-AF, HumanEval++ cho kiểm thử đơn vị
- Khả năng quan sát: Langfuse với các span gắn nhãn vai trò, hạch toán token theo agent
- Triển khai: K8s với mỗi vai trò là một Deployment riêng + HPA theo lượng công việc tồn đọng

```figure
ce-team-handoff
```

## Build It

1. **Bảng nhiệm vụ.** JSONL dựa trên file với các thông điệp có kiểu: `plan_request`, `subtask`, `diff_ready`, `review_needed`, `test_needed`, `approved`, `rejected`, `replan_needed`. Các agent đăng ký theo nhãn.

2. **Kiến trúc sư.** Đọc issue GitHub, chạy Opus 4.7 với một mẫu kế hoạch yêu cầu giao diện nhiệm vụ con rõ ràng (các file được chạm tới, các hàm công khai, tác động đến kiểm thử). Phát ra một `plan_request` với một DAG các nhiệm vụ con.

3. **Các lập trình viên.** N worker song song, mỗi worker nhận một nhiệm vụ con từ bảng. Mỗi worker tạo một nhánh `git worktree add` mới cùng một sandbox Daytona. Triển khai nhiệm vụ con. Phát ra `diff_ready` với patch + các chênh lệch kiểm thử.

4. **Bộ điều phối hợp nhất.** Khi tất cả lập trình viên hoàn thành, hợp nhất ba chiều N nhánh vào một nhánh staging. Chỉ giải quyết xung đột qua trung gian LLM khi có chồng lấn ở mức file.

5. **Người rà soát.** GPT-5.4 đọc diff đã hợp nhất. Không thể chấp thuận các diff do chính nó tạo. Phát ra `approved` (không thao tác) hoặc `review_feedback` với các yêu cầu thay đổi cụ thể được chuyển lại cho lập trình viên liên quan.

6. **Người kiểm thử.** Gemini 2.5 Pro chạy bộ kiểm thử trong một sandbox sạch. Thu thập hiện vật. Phát ra `test_passed` hoặc `test_failed` với stacktrace. Các kiểm thử trượt quay lại lập trình viên sở hữu nhiệm vụ con bị lỗi.

7. **Hạch toán bàn giao.** Mỗi thông điệp vượt qua một ranh giới vai trò nhận một span trong Langfuse với kích thước payload và mô hình được sử dụng. Tính mức khuếch đại token theo nhiệm vụ con (coder_tokens + reviewer_tokens + tester_tokens + architect_share / coder_tokens).

8. **Đánh giá.** Chạy trên 50 issue SWE-bench Pro. So sánh pass@1 và $-trên-mỗi-issue-đã-giải với một đường cơ sở đơn agent (một Sonnet 4.7 trong một worktree duy nhất).

9. **Phân tích sau sự cố.** Với mỗi issue thất bại, xác định bước bàn giao bị hỏng (kế hoạch quá mơ hồ, xung đột hợp nhất, người rà soát chấp thuận sai, người kiểm thử chập chờn). Tạo một biểu đồ tần suất lỗi bàn giao.

## Use It

```
$ team run --issue https://github.com/acme/widget/issues/842
[architect] plan: 4 subtasks (parser, cache, api, migration)
[board]     dispatched to 4 coders in parallel worktrees
[coder-A]   subtask parser  -> 42 lines, tests pass locally
[coder-B]   subtask cache   -> 88 lines, tests pass locally
[coder-C]   subtask api     -> 31 lines, tests pass locally
[coder-D]   subtask migration -> 19 lines, tests pass locally
[merge]     3-way merge: 0 conflicts
[reviewer]  comments on cache (thread pool sizing); routed to coder-B
[coder-B]   revision: 92 lines; submits
[reviewer]  approved
[tester]    all 412 tests pass
[pr]        opened #3382   4 coders, 1 revision, $4.90, 18m
```

## Ship It

`outputs/skill-multi-agent-team.md` là sản phẩm bàn giao. Với một URL issue và mức song song được cung cấp, nhóm tạo ra một PR sẵn sàng hợp nhất với hạch toán token theo vai trò.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | SWE-bench Pro pass@1 | Tập con 50 issue tương ứng, pass@1 |
| 20 | Mức tăng tốc song song | Thời gian thực so với đường cơ sở đơn agent |
| 20 | Chất lượng rà soát | Tỷ lệ chấp thuận sai trên phép thăm dò chèn lỗi |
| 20 | Hiệu quả token | Tổng token trên mỗi issue đã giải so với đơn agent |
| 15 | Kỹ thuật điều phối | Giải quyết xung đột hợp nhất, biểu đồ tần suất lỗi bàn giao |
| **100** | | |

## Exercises

1. Chèn một lỗi rõ ràng vào diff giữa lần chạy (thêm `return None` trước phần thân chính). Đo tỷ lệ chấp thuận sai của người rà soát. Điều chỉnh prompt của người rà soát cho đến khi mức chấp thuận sai dưới 5%.

2. Giảm xuống hai lập trình viên (kiến trúc sư + lập trình viên + người rà soát + người kiểm thử, lập trình viên chạy hai nhiệm vụ con tuần tự). So sánh thời gian thực và tỷ lệ đạt.

3. Thay bộ điều phối hợp nhất bằng một ràng buộc người ghi duy nhất (các nhiệm vụ con chạm đến các tập file rời nhau). Đo gánh nặng lập kế hoạch lên kiến trúc sư.

4. Đổi người rà soát từ GPT-5.4 sang Claude Opus 4.7. Đo tỷ lệ chấp thuận sai và chênh lệch chi phí token.

5. Thêm vai trò thứ năm: người viết tài liệu (Haiku 4.5). Sau khi rà soát, nó tạo một mục nhật ký thay đổi. Đo xem chất lượng tài liệu có xứng đáng với lượng token chi thêm không.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Parallel worktree (Worktree song song) | "Nhánh cô lập" | `git worktree add` tạo ra một cây làm việc mới cho mỗi lập trình viên |
| Task board (Bảng nhiệm vụ) | "Bus thông điệp dùng chung" | Kho file hoặc Redis chứa các thông điệp có kiểu mà agent đăng ký |
| Handoff (Bàn giao) | "Ranh giới vai trò" | Bất kỳ thông điệp nào đi từ ngữ cảnh của một vai trò sang ngữ cảnh của vai trò khác |
| Token amplification (Khuếch đại token) | "Chi phí phụ đa agent" | Tổng token trên các vai trò / token đơn agent cho cùng nhiệm vụ |
| A2A protocol (Giao thức A2A) | "Agent với agent" | Đặc tả năm 2025 của Google cho các thông điệp có kiểu giữa agent |
| Merge coordinator (Bộ điều phối hợp nhất) | "Bộ tích hợp" | Thành phần chạy hợp nhất ba chiều và làm trung gian cho xung đột |
| False approval (Chấp thuận sai) | "Ảo giác của người rà soát" | Người rà soát chấp thuận một diff có các lỗi đã biết |

## Further Reading

- [SWE-AF factory architecture](https://github.com/Agent-Field/SWE-AF) — nhà máy đa agent tham chiếu năm 2026
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) — framework đa agent theo vai trò
- [AutoGen v0.4](https://github.com/microsoft/autogen) — framework actor có kiểu của Microsoft
- [Cognition AI (Devin)](https://cognition.ai) — sản phẩm tham chiếu
- [Factory Droids](https://www.factory.ai) — sản phẩm tham chiếu thay thế
- [Google A2A protocol](https://a2a-protocol.org/latest/) — đặc tả nhắn tin giữa agent
- [git worktree documentation](https://git-scm.com/docs/git-worktree) — nền tảng cô lập
- [SWE-bench Pro](https://www.swebench.com) — mục tiêu đánh giá
