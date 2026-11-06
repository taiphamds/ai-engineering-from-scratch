# Deep learning

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Backpropagation, các loss, các bộ tối ưu hóa, khởi tạo và cách gỡ lỗi một mạng không học.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [Ten layers with no activation are one layer](stacked-linear-layers-collapse.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Test accuracy that changes with the same weights](train-mode-and-eval-mode.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Why one perceptron never learns XOR](xor-needs-a-hidden-layer.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [What Adam's bias correction does in the first steps](adam-bias-correction-first-steps.md) | Khái niệm | 2 Làm việc | 8 |
| [Weight decay in the loss or in the optimizer](adamw-not-adam-plus-l2.md) | Đánh đổi | 2 Làm việc | 8 |
| [Why the dropout mask holds 1 over (1 minus p)](inverted-dropout-scale.md) | Đọc mã | 2 Làm việc | 8 |
| [Where the 2 in Kaiming initialization comes from](kaiming-factor-of-two.md) | Khái niệm | 2 Làm việc | 8 |
| [A classifier that predicts 0.5 and has a low loss](mse-predicts-half-for-everything.md) | Khái niệm | 2 Làm việc | 8 |
| [How much gradient survives ten sigmoid layers](sigmoid-gradient-after-ten-layers.md) | Ước lượng | 2 Làm việc | 8 |
| [Three lines that differentiate the cross-entropy loss](softmax-cross-entropy-gradient.md) | Đọc mã | 2 Làm việc | 8 |
| [Read the shapes of a 2-3-1 network from its Layer class](weight-matrix-rows-and-columns.md) | Đọc mã | 2 Làm việc | 8 |
| [A wide layer that behaves like one neuron](zero-init-symmetry.md) | Khái niệm | 2 Làm việc | 6 |
| [Two layers where most ReLU outputs are exactly zero](half-the-relus-are-dead.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [Why transformers normalize across features, not the batch](layernorm-not-batchnorm.md) | Đánh đổi | 3 Cao cấp | 12 |
| [A loss that sits at 2.3 on a ten class problem](loss-stuck-at-log-classes.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [A training loop whose loss swings after a few steps](missing-zero-grad.md) | Đọc mã | 3 Cao cấp | 10 |
| [The 30 second check before a multi-day run](overfit-one-batch-first.md) | Thiết kế | 3 Cao cấp | 10 |
| [Why a deep residual stack needs more than Kaiming](residual-scaling-deep-transformer.md) | Khái niệm | 3 Cao cấp | 12 |
| [What a learning rate warmup protects](warmup-before-the-peak-rate.md) | Khái niệm | 3 Cao cấp | 10 |
| [Warmup plus cosine schedule with pinned boundaries](cosine-warmup-schedule-boundaries.md) | Làm ở nhà | 4 Staff | 25 |
| [A smooth loss that turns inf and then NaN hours in](loss-becomes-nan-mid-run.md) | Gỡ lỗi | 4 Staff | 15 |
| [Choose a peak learning rate and a schedule in a few hours](pick-the-peak-rate-and-schedule.md) | Thiết kế | 4 Staff | 15 |

[Tất cả các thẻ](../../README.md)
