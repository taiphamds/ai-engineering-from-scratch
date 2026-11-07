# Transformers

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Attention, vị trí, khối transformer, KV cache và chi phí của ngữ cảnh dài.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [Count the attention work for 100 generated tokens](count-attention-ops-with-cache.md) | Ước lượng | 1 Sơ tuyển | 6 |
| [Shuffle the words and attention does not notice](permutation-blind-attention.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Explain query, key and value in one minute](query-key-value-lookup.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Why the attention scores are divided before the softmax](why-scale-by-sqrt-dk.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Attention runs, and the context has the wrong shape](attention-shape-bug.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Where the triangle of minus infinity comes from](causal-mask-minus-infinity.md) | Khái niệm | 2 Làm việc | 8 |
| [Pick the attention variant for a 70B decoder](gqa-mla-cache-tradeoff.md) | Đánh đổi | 2 Làm việc | 10 |
| [What eight heads cost that one head does not](heads-are-nearly-free.md) | Khái niệm | 2 Làm việc | 8 |
| [The loss collapses and the samples are nonsense](loss-drops-to-zero-no-mask.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Encoder, decoder or both for three products](pick-encoder-or-decoder.md) | Đánh đổi | 2 Làm việc | 8 |
| [Why the norm moved in front of the sublayer](pre-norm-vs-post-norm.md) | Đánh đổi | 2 Làm việc | 8 |
| [One reshape is right and one scrambles the heads](read-split-and-combine-heads.md) | Đọc mã | 2 Làm việc | 8 |
| [What the skip path does and where dropout may go](residual-stream-and-dropout.md) | Khái niệm | 2 Làm việc | 8 |
| [Absolute angles, relative distances](rope-relative-from-absolute.md) | Khái niệm | 2 Làm việc | 8 |
| [A heatmap is not an explanation](attention-weights-as-proof.md) | Khái niệm | 3 Cao cấp | 10 |
| [Count the parameters of a decoder stack by hand](block-parameter-count.md) | Ước lượng | 3 Cao cấp | 10 |
| [Take-home, a character-level decoder on a laptop](char-level-gpt-take-home.md) | Làm ở nhà | 3 Cao cấp | 15 |
| [Take a model from 8K to 128K](extend-context-past-training.md) | Thiết kế | 3 Cao cấp | 12 |
| [Is a tiled attention kernel an approximation](flash-attention-is-exact.md) | Khái niệm | 3 Cao cấp | 10 |
| [Review a 2017-style block against today's defaults](modernize-a-2017-block.md) | Thiết kế | 3 Cao cấp | 12 |
| [Read the running softmax and find the fragile line](read-the-tiled-softmax.md) | Đọc mã | 3 Cao cấp | 12 |
| [Design the attention stack for 128K context on one card](attention-for-128k-context.md) | Thiết kế | 4 Staff | 15 |
| [Split a fixed compute budget between size and tokens](compute-split-params-tokens.md) | Đánh đổi | 4 Staff | 15 |
| [A benchmark jumps between two model sizes](emergence-or-scorer-artifact.md) | Khái niệm | 4 Staff | 12 |

[Tất cả các thẻ](../../README.md)
