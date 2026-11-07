# Production and MLOps

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Khả năng quan sát, triển khai tiến dần, các kiểm thử A/B, kiểm thử chaos và trực vận hành cho các dịch vụ mô hình.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [What must exist before the first chaos experiment](chaos-before-you-start.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Why a higher eval score still needs an experiment](evals-or-ab-test.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [What a week in shadow mode proves](shadow-mode-is-a-smoke-test.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Which agent spans are CLIENT and which are INTERNAL](span-kind-client-or-internal.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [How many samples a one percent canary gives a gate](canary-samples-at-one-percent.md) | Ước lượng | 2 Làm việc | 8 |
| [Order the checks before a paid model call](checks-in-order-of-cost.md) | Thiết kế | 2 Làm việc | 10 |
| [Detect that the questions changed when the evals did not](drift-score-on-prompts.md) | Khái niệm | 2 Làm việc | 8 |
| [Read the prompt router's experiment assignment](hash-bucket-assignment.md) | Đọc mã | 2 Làm việc | 8 |
| [Trace retention when traces cost more than the model](keep-every-error-trace.md) | Thiết kế | 2 Làm việc | 10 |
| [Should the full prompt live on the span](prompts-in-span-attributes.md) | Đánh đổi | 2 Làm việc | 8 |
| [The token dashboard reads zero after an SDK upgrade](renamed-token-attribute.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Make the next rollback take seconds](rollback-without-redeploy.md) | Thiết kế | 2 Làm việc | 10 |
| [An even split that lands at 47 to 53](split-ratio-mismatch.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Half an answer and then silence](stream-fails-after-200.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [When the triage agent should say it is unsure](two-models-disagree.md) | Khái niệm | 2 Làm việc | 8 |
| [Set canary gates that do not halt on noise](canary-gates-above-noise.md) | Thiết kế | 3 Cao cấp | 12 |
| [Pick an observability stack without locking in](dev-platform-or-telemetry-tool.md) | Đánh đổi | 3 Cao cấp | 12 |
| [Catch a leaking prompt within five minutes](five-minute-detection.md) | Thiết kế | 3 Cao cấp | 15 |
| [Which fixes an operations agent may run alone](narrow-auto-remediation.md) | Đánh đổi | 3 Cao cấp | 12 |
| [Stopping an experiment on the first good morning](peeking-at-an-ab-test.md) | Đánh đổi | 3 Cao cấp | 12 |
| [Review one span from a new instrumentation branch](read-this-span.md) | Đọc mã | 3 Cao cấp | 12 |
| [The provider slowed down and your service fell over](retries-that-amplify.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [One trace across HTTP and stdio tool servers](trace-context-over-stdio.md) | Thiết kế | 3 Cao cấp | 12 |
| [Keep a production chaos experiment from becoming an incident](budget-burn-pauses-chaos.md) | Thiết kế | 4 Staff | 18 |
| [What the system does with a predicted outage](prediction-without-action.md) | Thiết kế | 4 Staff | 15 |
| [Simulate a shadow, canary and rollback plan](rollout-plan-take-home.md) | Làm ở nhà | 4 Staff | 60 |

[Tất cả các thẻ](../../README.md)
