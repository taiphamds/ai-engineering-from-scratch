# LLM observability dashboard (TypeScript skeleton)

Bộ khung TypeScript nhiều file cho bài tổng kết bảng điều khiển quan sát LLM.
Một máy chủ Hono nhận các span GenAI của OpenTelemetry, giữ chúng trong một bộ đệm vòng 10k
và hiển thị độ trễ p50/p95/p99 cùng chi phí theo mô hình.

## Layout

- `src/index.ts` — điểm vào, tạo seed các span tổng hợp và tùy chọn phục vụ HTTP.
- `src/server.ts` — các tuyến Hono cho `/trace`, `/`, `/dashboard`, `/dashboard.json`, `/healthz`.
- `src/spans.ts` — `RingBuffer` và `ObservabilityStore` (mặc định 10k span).
- `src/rollup.ts` — `percentile` và `rollUpByModel`.
- `src/pricing.ts` — giá theo mô hình năm 2026 và các hàm hỗ trợ chi phí.
- `src/types.ts` — các kiểu dùng chung.
- `tests/*.test.ts` — kiểm thử kiểu `node --test` qua `tsx`.

## Install

```bash
npm install
```

## Run

```bash
npm start         # seeds 1200 synthetic spans and prints the rollup
npm run serve     # also serves the HTTP ingest + dashboard on PORT (default 8011)
```

## Verify

```bash
npm run typecheck
npm test
```

## Spec references

- Bài học nguồn: `phases/19-capstone-projects/11-llm-observability-dashboard/docs/en.md`
- [OpenTelemetry GenAI semantic conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
