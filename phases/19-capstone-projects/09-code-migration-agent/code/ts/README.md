# Code migration agent dashboard (TypeScript skeleton)

Bộ khung TypeScript nhiều file cho lớp bảng điều khiển của bài tổng kết
agent di chuyển mã. Agent (Python) chạy trong một sandbox; máy chủ này hiển thị
tiến độ cho người vận hành.

## Layout

- `src/index.ts` — điểm vào, mô phỏng các nhịp và tùy chọn phục vụ HTTP.
- `src/server.ts` — các tuyến Hono cho `/`, `/dashboard`, `/migrations`, `/migrations/:id`.
- `src/migrations.ts` — máy trạng thái theo file và dữ liệu seed.
- `src/cost.ts` — thực thi số lượt và ngân sách đô la.
- `src/types.ts` — các kiểu dùng chung.
- `tests/*.test.ts` — kiểm thử kiểu `node --test` qua `tsx`.

## Install

```bash
npm install
```

## Run

```bash
npm start         # offline: simulate 40 ticks and print rollup
npm run serve     # serve the HTML dashboard on PORT (default 8009)
```

## Verify

```bash
npm run typecheck
npm test
```

## Spec references

- Bài học nguồn: `phases/19-capstone-projects/09-code-migration-agent/docs/en.md`
- Công thức: [OpenRewrite](https://docs.openrewrite.org), libcst.
