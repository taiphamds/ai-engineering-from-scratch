# Lesson 12 - Video Understanding Pipeline (TypeScript UI)

Nửa TypeScript của bài tổng kết. Phía Python (`code/main.py`) sở hữu
chỉ mục đa vector và định vị thời gian. Dự án này cung cấp nửa bảng điều khiển
gồm: một ứng dụng Hono trên bốn giai đoạn pipeline (chunk, embed, index, qa).

## Layout

```text
src/
  index.ts     entry: demo (default) or HTTP server (--serve)
  server.ts    Hono routes (/, /jobs, /job/:id) + HTML index
  jobs.ts     JobStore + fixture seeder
  stages.ts    stage advance + overall status
  types.ts     Stage, StageState, Job
tests/
  stages.test.ts  job state transitions + store
```

## Run

```bash
npm install
npm run typecheck
npm test
npm start              # self-terminating demo
npm run serve          # HTTP server on :8123
```
