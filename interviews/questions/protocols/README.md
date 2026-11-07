# Protocols: MCP, A2A and skills

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Cách các agent gọi công cụ và các agent khác, và cách các lệnh gọi đó giữ an toàn.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [What an A2A client reads before its first message](a2a-card-before-the-call.md) | Khái niệm | 1 Sơ tuyển | 7 |
| [Pick the MCP primitive by who chooses it](tool-resource-or-prompt.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [A protocol error is not a tool error](two-error-layers.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The poll loop that never ends and the deploy that should not](a2a-rejected-task-loop.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Two errors from a client that forgot the version](a2a-version-header-missing.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [A shared cache in front of private notes](cache-scope-private.md) | Đánh đổi | 2 Làm việc | 8 |
| [Three cancellations that look like one](cancel-signal-per-transport.md) | Khái niệm | 2 Làm việc | 8 |
| [The pin that passed a changed tool](descriptor-pin-rug-pull.md) | Gỡ lỗi | 2 Làm việc | 9 |
| [The pagination loop that ends two pages short](empty-cursor-stops-early.md) | Đọc mã | 2 Làm việc | 7 |
| [Sticky sessions, GET streams and resume on the modern wire](post-only-streamable-http.md) | Khái niệm | 2 Làm việc | 9 |
| [A root is a hint, not a permission](roots-are-not-a-sandbox.md) | Khái niệm | 2 Làm việc | 8 |
| [Why every MCP request repeats its metadata](stateless-request-metadata.md) | Khái niệm | 2 Làm việc | 8 |
| [Recover a dropped A2A stream without replay](a2a-stream-drop-resubscribe.md) | Thiết kế | 3 Cao cấp | 10 |
| [A webhook that may fire twice or not at all](a2a-webhook-at-least-once.md) | Đánh đổi | 3 Cao cấp | 10 |
| [The draft that vanished on the second replica](draft-lost-across-replicas.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [The gateway that authorized a read and ran a delete](header-body-mismatch-order.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [When an old server is really old](legacy-probe-fail-closed.md) | Thiết kế | 3 Cao cấp | 12 |
| [Confirm a deletion without a session](mrtr-confirmation-state.md) | Thiết kế | 3 Cao cấp | 12 |
| [The charge that ran twice after a timeout](retry-is-not-idempotency.md) | Thiết kế | 3 Cao cấp | 12 |
| [How conformant is a server that scores 66.7 percent](a2a-tck-score-reading.md) | Ước lượng | 4 Staff | 12 |
| [Build the admission gate of an MCP gateway](gateway-admission-take-home.md) | Làm ở nhà | 4 Staff | 60 |
| [Two issuers, one resource server, no outage](issuer-bound-tokens-and-jwks.md) | Thiết kế | 4 Staff | 15 |

[Tất cả các thẻ](../../README.md)
