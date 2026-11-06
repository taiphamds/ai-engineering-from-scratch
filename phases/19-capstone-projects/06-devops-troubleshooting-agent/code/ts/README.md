# Capstone 06 - DevOps Troubleshooting Agent (TypeScript)

Khung tích hợp Slack cho agent trực trong `../main.py`. Cung cấp
endpoint slash-command và endpoint tương tác (bấm nút), cả hai kiểm soát
bằng chữ ký yêu cầu HMAC-SHA256 Slack cộng cửa sổ phát lại 5 phút.
Khắc phục phá hủy chỉ chạy sau thẻ Slack được phê duyệt.

## Layout

```text
ts/
  package.json
  tsconfig.json
  src/
    index.ts          # entrypoint, demo + HTTP server
    server.ts         # hono app, /slack/command + /slack/interactivity
    slack_verify.ts   # HMAC v0 verification + timing-safe compare
    agent.ts          # mocked hypothesis ranker
    blocks.ts         # Block Kit response builder
    types.ts          # Hypothesis, AgentReport, SlackResponse, OutboundCall
  tests/
    slack_verify.test.ts
    agent.test.ts
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

Đặt `SLACK_SIGNING_SECRET=...` để ghi đè bí mật giữ chỗ.
Máy chủ tương tác in cổng đã chọn (ngẫu nhiên khi `PORT` chưa đặt).

## Tests

Bộ chạy `node --test` qua tsx. Bao phủ:

- Xác minh chữ ký Slack: chữ ký hợp lệ qua, chữ ký sửa bị
  từ chối, dấu thời gian cũ (lệch >5 phút) bị từ chối, dấu thời gian không phải số bị
  từ chối, đường không khớp độ dài được thực hiện trước so sánh thời gian hằng.
- Agent giả: đường từ khóa OOM, đường từ khóa CrashLoop, đường dự phòng.
- Máy chủ: đường thành công/bị sửa/cũ của `/health`, `/slack/command`,
  hành động phê duyệt `/slack/interactivity`.
