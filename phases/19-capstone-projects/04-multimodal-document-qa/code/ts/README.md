# Capstone 04 - Multimodal Document QA (TypeScript)

Khung trình xem trả URL ảnh trang cộng danh sách JSON hộp bao được trích
dẫn cho tài liệu. Phản hồi HTML nhúng script lớp phủ canvas nhỏ
vẽ vùng được trích trên ảnh trang. Ghép với pipeline Python
trong `../main.py`.

## Layout

```text
ts/
  package.json
  tsconfig.json
  src/
    index.ts        # entrypoint, demo + HTTP server
    server.ts       # hono app, /health, /, /document/:id
    fixtures.ts     # 10-K table + Nature figure fixtures
    render.ts       # HTML index + per-document overlay renderer
    types.ts        # DocumentFixture, EvidenceRegion, BoundingBox
  tests/
    fixtures.test.ts
    render.test.ts
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

Máy chủ tương tác chọn cổng trống khi `PORT` chưa đặt và in
URL đã chọn ra stdout. Truy cập `/` cho chỉ mục, `/document/10k-acme-2025` cho
lớp phủ demo, hoặc đặt `accept: application/json` để nhận phản hồi có cấu trúc.

## Tests

Bộ chạy `node --test` qua tsx. Kiểm thử bao phủ tra fixture (dương + âm),
escape HTML cho năm ký tự thù địch, cấu trúc payload HTML tài liệu,
và tuyến hono (200, 404, thương lượng nội dung).
