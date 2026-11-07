# Prompting and structured output

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Thiết kế prompt, context engineering, schema, constrained decoding và các lệnh gọi hàm.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [Where step-by-step prompting helps and where it costs](cot-when-it-hurts.md) | Khái niệm | 1 Sơ tuyển | 7 |
| [What JSON mode guarantees and what it does not](json-mode-is-not-a-schema.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The three parts of a chat call and the prefill trick](system-user-prefill.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Valid JSON, worse accuracy, and the field order to blame](answer-before-reasoning.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [How many examples go in the prompt, and which ones](few-shot-example-count.md) | Đánh đổi | 2 Làm việc | 7 |
| [Where each part of the context goes, and why](lost-in-the-middle-order.md) | Khái niệm | 2 Làm việc | 8 |
| [Read the constrained generation loop](read-the-constrained-decoder.md) | Đọc mã | 2 Làm việc | 8 |
| [Five votes, one path, five times the bill](self-consistency-at-temperature-zero.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Typed data or an action, and why the difference matters](structured-output-vs-function-call.md) | Đánh đổi | 2 Làm việc | 7 |
| [The three ways a structured output call fails](three-failure-modes-structured.md) | Khái niệm | 2 Làm việc | 7 |
| [Cache reads stay at zero on every request](timestamp-kills-the-cache.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Tool descriptions decide which tool gets called](tool-description-is-a-prompt.md) | Khái niệm | 2 Làm việc | 7 |
| [Pick the cache lifetime for a batch of code reviews](cache-break-even.md) | Ước lượng | 3 Cao cấp | 10 |
| [Design an extraction service for purchase-order emails](design-extraction-with-refusals.md) | Thiết kế | 3 Cao cấp | 20 |
| [Zero validation errors and wrong invoice totals](schema-valid-value-wrong.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [Move memory consolidation off the critical path](sleep-time-consolidation.md) | Đánh đổi | 3 Cao cấp | 10 |
| [Build a two-tier agent memory with eviction and citations](take-home-two-tier-memory.md) | Làm ở nhà | 3 Cao cấp | 60 |
| [What fifty tool definitions cost on every call](tool-budget-fifty-tools.md) | Ước lượng | 3 Cao cấp | 9 |
| [Design the executor behind an agent's tool calls](tool-call-security-rules.md) | Thiết kế | 3 Cao cấp | 15 |
| [Make each reasoning stage earn its cost](escalation-pipeline-cost.md) | Đánh đổi | 4 Staff | 15 |
| [Tune a three-store memory for three products](fusion-weights-per-product.md) | Thiết kế | 4 Staff | 15 |
| [Review a state write that can corrupt the next session](state-file-atomic-write.md) | Đọc mã | 4 Staff | 12 |

[Tất cả các thẻ](../../README.md)
