# GPU memory, quantization and hardware

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Bộ nhớ GPU đi đâu, lượng tử hóa giải phóng nó như thế nào, và công việc chia qua các GPU như thế nào.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [The model is 35 GB now, so it fits](the-kv-cache-trap.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Why an 8B model fails to start on a 24 GB card](an-8b-model-on-a-24-gb-card.md) | Ước lượng | 2 Làm việc | 8 |
| [Count the KV bytes per token from the config](kv-bytes-per-token.md) | Ước lượng | 2 Làm việc | 8 |
| [Pick a 4-bit format for a 14B model on 24 GB](pick-a-4-bit-format.md) | Đánh đổi | 2 Làm việc | 10 |
| [The pool was 95 percent empty and the server died](an-empty-pool-and-an-oom.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [Why FP8 grew the pool 4.77 times and not 2](fp8-grew-the-pool-twice.md) | Ước lượng | 3 Cao cấp | 8 |
| [The FP8 KV scales that never loaded](kv-scales-silently-at-one.md) | Gỡ lỗi | 3 Cao cấp | 8 |
| [Split the model or copy it across two cards](split-or-copy-on-two-cards.md) | Thiết kế | 3 Cao cấp | 10 |
| [Pick the memory fraction on unified memory](unified-memory-fraction-on-a-gb10.md) | Ước lượng | 3 Cao cấp | 10 |
| [Eight copies of the same KV cache](attention-data-parallel-for-latent-attention.md) | Khái niệm | 4 Staff | 10 |

[Tất cả các thẻ](../../README.md)
