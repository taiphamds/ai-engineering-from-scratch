# Inference and serving systems

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Batching, KV cache, prefix caching, các bộ lập lịch và cách đo một engine phục vụ.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [Why 255 tokens per second is a slogan](goodput-not-a-slogan.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The two phases of one request](prefill-and-decode.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The knee that the prefix cache hid](flush-before-you-compare.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [What an FP8 KV cache buys and costs](fp8-kv-cache.md) | Đánh đổi | 2 Làm việc | 10 |
| [How speculative decoding keeps the output the same](how-speculation-keeps-the-output.md) | Khái niệm | 2 Làm việc | 8 |
| [How many users fit in the KV pool](kv-pool-users-fit.md) | Ước lượng | 2 Làm việc | 10 |
| [Cached tokens at zero with a stable template](low-hit-rate-with-a-stable-template.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [What many LoRA adapters cost one server](multi-lora-serving-cost.md) | Thiết kế | 2 Làm việc | 8 |
| [One token budget instead of two phases](one-token-budget-per-step.md) | Khái niệm | 2 Làm việc | 8 |
| [Why the KV cache is a pool of 16-token blocks](paged-blocks-and-the-hash-chain.md) | Khái niệm | 2 Làm việc | 8 |
| [Why one ID at the top of a prompt kills the cache](prefix-cache-order.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Read the GPU clock before the throughput](read-the-clock-first.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Read three scheduler log lines](read-three-scheduler-lines.md) | Đọc mã | 2 Làm việc | 8 |
| [Why the shared part of the prompt goes first](shared-prefix-first.md) | Khái niệm | 2 Làm việc | 8 |
| [Sleep, wake and weight updates for an RL loop](sleep-mode-for-rl-rollouts.md) | Khái niệm | 2 Làm việc | 8 |
| [Temperature zero gave two different answers](temperature-zero-two-answers.md) | Khái niệm | 2 Làm việc | 8 |
| [Choose tensor, pipeline or data parallelism](tensor-pipeline-or-data-parallel.md) | Thiết kế | 2 Làm việc | 10 |
| [Two clients, two numbers, one server](the-client-is-part-of-the-measurement.md) | Khái niệm | 2 Làm việc | 8 |
| [An admission cap decides who waits](a-cap-only-chooses-who-waits.md) | Đánh đổi | 3 Cao cấp | 10 |
| [Acceptance by draft position, tokens per pass](acceptance-length-on-long-answers.md) | Ước lượng | 3 Cao cấp | 8 |
| [Pick the EAGLE3 draft depth for your concurrency](eagle3-draft-depth.md) | Đánh đổi | 3 Cao cấp | 10 |
| [When an FP8 checkpoint pays](fp8-weights.md) | Đánh đổi | 3 Cao cấp | 10 |
| [Pick a concurrency cap when throughput keeps rising](goodput-sets-the-cap.md) | Đánh đổi | 3 Cao cấp | 12 |
| [Should the prefill chunk be smaller](smaller-prefill-chunks.md) | Đánh đổi | 3 Cao cấp | 10 |
| [Speculation won the benchmark and lost in production](speculation-on-real-prompts.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [What determinism costs a live server](the-cost-of-batch-invariance.md) | Đánh đổi | 3 Cao cấp | 10 |
| [A larger token budget at low load](token-budget-at-low-load.md) | Đánh đổi | 3 Cao cấp | 10 |
| [Two data-parallel copies, less output than one card](two-copies-served-less-than-one.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [When prefill-decode disaggregation pays](when-to-split-prefill-and-decode.md) | Thiết kế | 3 Cao cấp | 12 |
| [A split-server benchmark that counted empty answers](a-benchmark-that-counted-empty-answers.md) | Đọc mã | 4 Staff | 10 |
| [Design a chat service on a fleet of L4 cards](design-a-chat-service-on-l4s.md) | Thiết kế | 4 Staff | 15 |
| [Same throughput, two choices at a full pool](same-throughput-two-choices.md) | Đánh đổi | 4 Staff | 12 |

[Tất cả các thẻ](../../README.md)
