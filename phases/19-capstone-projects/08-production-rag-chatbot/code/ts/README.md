# Capstone 08 - Production RAG Chatbot (TypeScript)

Khung UI trò chuyện truyền phản hồi có neo trích dẫn qua Server-Sent
Events. Ghép pipeline Python trong `../main.py`. Trạng thái hội thoại nằm
trong Map nội bộ tiến trình khóa bằng `sessionId`, nên cùng id phiên có thể điều khiển
đối thoại nhiều lượt.

## Layout

```text
ts/
  package.json
  tsconfig.json
  src/
    index.ts        # entrypoint, demo + HTTP server
    server.ts      # hono app, /, /chat/stream (SSE), /sessions, /health
    session.ts     # SessionStore (Map<sessionId, Session>)
    stream.ts      # SSE frame encoder + parser + mock retrieval + tokenizer
    types.ts        # Session, Turn, Citation, KbEntry, SseEvent
  tests/
    session.test.ts
    stream.test.ts
    server.test.ts
```

## Run

```bash
npm install
npm run typecheck
npm test
npm start          # one self-check pass, exits 0
npm run serve      # interactive HTTP server on 127.0.0.1:<port>
```

Máy chủ tương tác chọn cổng trống khi `PORT` chưa đặt, gắn client HTML
trò chuyện trên `/`, truyền qua `GET /chat/stream?sessionId=...&q=...`.
Client demo dùng `EventSource`, lắng nghe sự kiện `session`, `citations`, `token`,
và `done`.

## Tests

Bộ chạy `node --test` qua tsx. Bao phủ:

- SessionStore: tạo, tra, nối thêm, liệt kê, không làm gì khi thiếu id.
- Bộ mã hóa + phân tích SSE khứ hồi; tăng trọng số truy xuất theo thẻ khu vực tài phán;
  dự phòng tokenizer + phần đuôi "Xem thêm".
- Máy chủ: đường thành công `/`, `/health`, `/chat/stream` (session + citations +
  token + done), 400 khi thiếu q, lưu bền phiên nhiều lượt,
  liệt kê `/sessions`.
