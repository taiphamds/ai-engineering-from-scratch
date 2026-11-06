# Capstone 19/03 — Realtime Voice Assistant (TypeScript)

Harness client web TypeScript nhiều file cho pipeline giọng nói truyền luồng
mô tả trong `../docs/en.md`. Mô phỏng máy trạng thái ngoại tuyến cộng máy chủ
WebSocket trực tiếp dựa trên gói `ws`.

## Layout

```text
src/
  index.ts        entry point; runs two offline sessions, probes the live ws, exits 0
  server.ts       hono /healthz + ws upgrade via WebSocketServer
  orchestrator.ts IDLE -> LISTENING -> WAITING -> THINKING -> SPEAKING with barge-in
  vad.ts          turn-completion scorer + synthetic 20ms-frame generator
  protocol.ts     zod-validated frame envelope (event / summary)
  types.ts        AudioChunk, Metrics, SessionOptions, SessionSummary
tests/
  vad.test.ts
  orchestrator.test.ts
  protocol.test.ts
```

## Run

```bash
npm install
npm start                # runs two offline sessions + ws self-probe, exits 0
npm start -- --serve     # keep ws server up; ctrl-c to stop
npm test                 # node --test runner via tsx
npm run typecheck        # tsc --noEmit
```

Đường chạy `npm start` không tương tác khẳng định phiên sạch đạt
`first_audio_out`, phiên ngắt lời ghi ít nhất một sự kiện ngắt lời,
và thăm dò WebSocket trực tiếp nhận khung `summary` trước đóng.
