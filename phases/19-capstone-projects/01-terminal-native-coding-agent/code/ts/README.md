# Capstone 19/01 — Terminal-Native Coding Agent (TypeScript)

Harness TypeScript nhiều file cho vòng lặp lập kế hoạch/hành động/quan sát mô tả trong
`../docs/en.md`. Ngoại tuyến, xác định, không có lệnh gọi mạng.

## Layout

```text
src/
  index.ts     entry point; runs a scripted demo and the eval, then exits 0
  repl.ts      interactive command parser (run / eval / help / quit)
  harness.ts   the plan-act-observe loop, wired through the hook bus
  hooks.ts     eight-event hook bus plus a destructive-command guard
  model.ts     scripted offline LLM that drives the demo
  tools.ts     read_file + run_shell with zod-validated args
  plan.ts     PlanState (todo rewrite) + Budget (turn / token / dollar ceilings)
  eval.ts      tiny pass/fail counter across three offline tasks
  types.ts     shared shape definitions
tests/
  harness.test.ts
  tools.test.ts
```

## Run

```bash
npm install
npm start                # runs the scripted demo + offline eval, exits 0
npm start -- --repl      # opens the interactive harness REPL
npm test                 # node --test runner via tsx
npm run typecheck        # tsc --noEmit
```

Đường chạy `npm start` không tương tác khẳng định đánh giá báo cáo `passed=3
failed=0` và lần chạy theo kịch bản hội tụ về kế hoạch hoàn tất mọi mục. Mọi sai lệch
làm lần chạy thất bại.
