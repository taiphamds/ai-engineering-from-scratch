# Multi-agent software team (TypeScript skeleton)

Bộ khung TypeScript nhiều file cho bài tổng kết nhóm phần mềm đa agent.
Các agent lập kế hoạch, lập trình, và rà soát dùng chung một không gian làm việc và luân phiên qua một
bộ điều phối. Một stub worktree khởi chạy các tiến trình con qua execFile với một
danh sách cấm và cơ chế từ chối siêu ký tự shell.

## Layout

- `src/index.ts` — trình chạy demo.
- `src/agent.ts` — lớp `Agent` cơ sở cùng `PlannerAgent`, `CoderAgent`, `ReviewerAgent`.
- `src/coordinator.ts` — vòng lặp luân phiên và theo dõi luân chuyển.
- `src/workspace.ts` — hệ thống file trong bộ nhớ dùng chung và nhật ký thông điệp.
- `src/runtime.ts` — stub worktree `child_process.execFile` với danh sách cấm.
- `src/types.ts` — các kiểu dùng chung.
- `tests/*.test.ts` — kiểm thử kiểu `node --test` qua `tsx`.

## Install

```bash
npm install
```

## Run

```bash
npm start
```

## Verify

```bash
npm run typecheck
npm test
```

## Spec references

- Bài học nguồn: `phases/19-capstone-projects/10-multi-agent-software-team/docs/en.md`
- [MetaGPT](https://github.com/FoundationAgents/MetaGPT) framework đa agent theo vai trò.
