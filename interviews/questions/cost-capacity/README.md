# Cost and capacity

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Caching, định tuyến, batch API, cold start và chi phí của mỗi request.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [Sort a workload into interactive, async or batch](batch-lane-triage.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [The metric to give finance instead of a token price](cost-per-outcome.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Two caches, and why one did not move the bill](two-cache-layers.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Controls that stop a bug from spending the month](budget-circuit-breaker.md) | Thiết kế | 2 Làm việc | 10 |
| [How many reads a cached prefix needs to pay off](cache-break-even.md) | Ước lượng | 2 Làm việc | 8 |
| [Read the exact-match cache before it ships](exact-cache-temperature.md) | Đọc mã | 2 Làm việc | 10 |
| [Which gateways fit in a 20 ms tail budget](gateway-latency-budget.md) | Ước lượng | 2 Làm việc | 8 |
| [Two cache hit rates from one scrape](hit-rate-gauge-lies.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Ten parallel tool calls, ten cache writes, no reads](parallel-calls-miss-the-cache.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Per-token or per-minute billing for a daytime load](per-token-or-per-minute.md) | Đánh đổi | 2 Làm việc | 8 |
| [A lower cache threshold hits more and answers wrong](semantic-threshold.md) | Đánh đổi | 2 Làm việc | 8 |
| [A warm replica all night, or a cold start at eight](warm-pool-or-cold-start.md) | Đánh đổi | 2 Làm việc | 10 |
| [Autoscale a model service on queue and cache signals](autoscale-on-the-right-signal.md) | Thiết kế | 3 Cao cấp | 15 |
| [The router saved half the bill, then the escalations climbed](cheap-model-drift.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [Break an eight-minute start into its parts](cold-start-anatomy.md) | Ước lượng | 3 Cao cấp | 12 |
| [A few endless answers fill the pool for everyone](loops-hold-the-pool.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [Price a nightly pipeline on batch with a cached prompt](overnight-pipeline-cost.md) | Ước lượng | 3 Cao cấp | 12 |
| [A second replica that undoes the prefix cache](router-decides-hit-rate.md) | Thiết kế | 3 Cao cấp | 15 |
| [A bigger KV pool that bought nothing, until it did](size-the-pool-from-peak.md) | Đánh đổi | 3 Cao cấp | 12 |
| [Build a cost attribution and enforcement simulator](cost-attribution-take-home.md) | Làm ở nhà | 4 Staff | 60 |
| [Warm replicas per tier, with the arithmetic](scale-to-zero-policy.md) | Thiết kế | 4 Staff | 18 |
| [Survive a provider outage without a redeploy](two-provider-minimum.md) | Thiết kế | 4 Staff | 18 |

[Tất cả các thẻ](../../README.md)
