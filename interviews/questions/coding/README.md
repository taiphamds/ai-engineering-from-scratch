# Coding

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Viết mã mà các bài học xây dựng. Mỗi mục liên kết đến một nhiệm vụ thực hành có các phép kiểm tra.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [The scale factor in dot-product attention](scale-by-sqrt-dk.md) | Đọc mã | 1 Sơ tuyển | 6 |
| [Why softmax subtracts the row maximum first](softmax-shift-max.md) | Đọc mã | 1 Sơ tuyển | 6 |
| [What temperature does to sampling](temperature-knob.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Weight decay that went into the gradient](adamw-decoupled-decay.md) | Đọc mã | 2 Làm việc | 10 |
| [A merge that lets two matches share a symbol](bpe-merge-no-overlap.md) | Đọc mã | 2 Làm việc | 8 |
| [Train a BPE merge list from word counts](bpe-train-loop.md) | Làm ở nhà | 2 Làm việc | 30 |
| [A causal mask that blocks the token itself](causal-mask-off-by-one.md) | Đọc mã | 2 Làm việc | 8 |
| [Dropout that still acts during evaluation](dropout-off-at-eval.md) | Đọc mã | 2 Làm việc | 8 |
| [A training loss that reaches zero and learns nothing](loss-shift-flatten.md) | Đọc mã | 2 Làm việc | 8 |
| [Swap the learned position table for a fixed one](sinusoidal-table-swap.md) | Làm ở nhà | 2 Làm việc | 20 |
| [Split heads with the right shape and the wrong numbers](split-heads-reshape.md) | Đọc mã | 2 Làm việc | 8 |
| [Write the sampling step of a generation loop](top-k-then-sample.md) | Làm ở nhà | 2 Làm việc | 20 |
| [Train the smallest language model past its baseline](bigram-beats-unigram.md) | Làm ở nhà | 3 Cao cấp | 30 |
| [Which parameters get weight decay](decay-split-param-groups.md) | Đọc mã | 3 Cao cấp | 10 |
| [GQA that pairs query heads with the wrong group](gqa-repeat-not-tile.md) | Đọc mã | 3 Cao cấp | 10 |
| [A KV cache that loses its last slot](kv-cache-capacity-slide.md) | Đọc mã | 3 Cao cấp | 10 |
| [Sweep the peak learning rate and mark divergence](lr-peak-sweep.md) | Làm ở nhà | 3 Cao cấp | 25 |
| [Attention heads that never mix](output-projection-missing.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [Swap the final LayerNorm for RMSNorm without breaking it](rmsnorm-vs-layernorm.md) | Đọc mã | 3 Cao cấp | 10 |
| [Nucleus sampling that drops the token which reaches p](top-p-crossing-token.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [Convert a multi-head checkpoint to grouped-query heads](gqa-checkpoint-pooling.md) | Ước lượng | 4 Staff | 15 |
| [A byte-level tokenizer with protected special tokens](tokenizer-roundtrip-specials.md) | Làm ở nhà | 4 Staff | 45 |

[Tất cả các thẻ](../../README.md)
