# Lesson 16 - GitHub Issue-to-PR Agent (TypeScript webhook receiver)

Nửa TypeScript của bài tổng kết. Phía Python cung cấp vòng lặp agent và
dispatcher; phía YAML cung cấp workflow Actions. Dự án này là bộ nhận webhook GitHub
App: xác minh HMAC phần thân thô, định tuyến theo loại sự kiện, điều phối
một agent stub cho `issues.opened`.

## Layout

```text
src/
  index.ts    entry: demo (default) or HTTP server (--serve)
  server.ts   Hono webhook receiver (POST /webhook)
  verify.ts   X-Hub-Signature-256 HMAC, timing-safe
  router.ts   event-type routing (ping, issues, pull_request)
  agent.ts    stub agent + audit log
  types.ts    payload + audit shapes
tests/
  verify.test.ts  signature pass, tampered, router pathing
```

## Run

```bash
npm install
npm run typecheck
npm test
npm start            # self-terminating demo (in-process replays)
npm run serve        # HTTP server on :8081
```

Bí mật HMAC được đọc từ `GH_WEBHOOK_SECRET` (mặc định `demo-shared-secret`
cho demo).
