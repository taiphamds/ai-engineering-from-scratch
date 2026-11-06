# Lesson 17 - Personal AI Tutor (TypeScript web app)

Nửa TypeScript của bài tổng kết. Phía Python cung cấp mô hình người học và
chính sách gia sư; dự án này cung cấp bề mặt ứng dụng web: một trình duyệt DAG chương trình học,
một mô hình người học kiểu BKT, và một bộ lập lịch lặp lại ngắt quãng FSRS-lite
phía sau hai tuyến HTTP.

## Layout

```text
src/
  index.ts       entry: demo (default) or HTTP server (--serve)
  server.ts      Hono routes (GET /lesson/next, POST /lesson/:id/submit)
  curriculum.ts  DAG fixture + Kahn topo sort + next-lesson picker
  mastery.ts     MasteryStore (per-lesson BKT-ish update)
  repetition.ts  scheduleNextDue (interval doubling / halving, clamped)
  types.ts       Lesson, Mastery, Pick
tests/
  curriculum.test.ts  topo order, BKT update, FSRS scheduling
```

## Run

```bash
npm install
npm run typecheck
npm test
npm start            # self-terminating curriculum walk
npm run serve        # HTTP server on :8090
```
