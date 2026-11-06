# Capstone 19/02 — RAG over Codebase (TypeScript)

API tìm mã TypeScript nhiều file cho pipeline truy xuất lai
mô tả trong `../docs/en.md`. Ngoại tuyến, xác định, corpus mẫu sáu đoạn,
node:http phía sau trình xử lý fetch hono.

## Layout

```text
src/
  index.ts        entry point; boots node:http + self-probe + exits 0
  server.ts       hono routes (/healthz, /query) with zod-validated POST body
  retrieval.ts    runQuery + RRF merge over dense and BM25
  index_store.ts  FNV-1a hash embedder, cosine, field-weighted BM25
  corpus.ts       six-chunk sample (uploader / auth / client / catalog)
  types.ts        Chunk, RankedChunk, QueryResponse, anchor()
tests/
  index_store.test.ts
  retrieval.test.ts
  server.test.ts
```

## Run

```bash
npm install
npm start                # boots api, probes three queries, exits 0
npm start -- --serve     # keep server up; ctrl-c to stop
npm test                 # node --test runner via tsx
npm run typecheck        # tsc --noEmit
```

Đường chạy `npm start` không tương tác khẳng định `/healthz` trả 200 và
mọi truy vấn thăm dò trả ít nhất một trích dẫn. Tuyến:

- `GET /healthz` — trả `{ok, corpus}`.
- `GET /query?q=...` — chạy truy vấn lai.
- `POST /query` — JSON `{q, topK?}`, xác thực bằng zod (`topK` giới hạn ở 50).
