# Math and classical ML

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Đại số tuyến tính, xác suất, tối ưu hóa, và các mô hình cổ điển vẫn thắng trên dữ liệu dạng bảng.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [Read a shape error in a dense layer](dense-layer-weight-shape.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Two products in NumPy that print different numbers](elementwise-or-matmul.md) | Đọc mã | 1 Sơ tuyển | 5 |
| [A sentence score that comes out as exactly zero](log-probs-instead-of-products.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [An R-squared below zero on the test set](negative-r-squared.md) | Khái niệm | 1 Sơ tuyển | 5 |
| [Why minimizing cross-entropy also minimizes KL](cross-entropy-is-kl-plus-entropy.md) | Khái niệm | 2 Làm việc | 8 |
| [Score a tree node with Gini and with entropy](gini-for-a-mixed-node.md) | Ước lượng | 2 Làm việc | 8 |
| [Why autograd adds gradients instead of setting them](grad-accumulate-plus-equals.md) | Đọc mã | 2 Làm việc | 8 |
| [Why plain gradient descent zigzags and momentum does not](momentum-in-a-narrow-valley.md) | Khái niệm | 2 Làm việc | 8 |
| [Read a perplexity from a mean cross-entropy](perplexity-from-cross-entropy.md) | Ước lượng | 2 Làm việc | 6 |
| [Why backpropagation runs the chain rule in reverse](reverse-mode-one-pass.md) | Khái niệm | 2 Làm việc | 8 |
| [A test score that production never reaches](scaler-fit-before-split.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [A cross-entropy that returns inf on real batches](softmax-inf-at-large-logits.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [Pick a threshold when 95 percent of the data is negative](threshold-precision-or-recall.md) | Đánh đổi | 2 Làm việc | 8 |
| [Bag the deep trees or boost the stumps](bag-or-boost-the-base-model.md) | Đánh đổi | 3 Cao cấp | 12 |
| [Pick a 16-bit format for training and one for inference](bfloat16-or-float16-for-training.md) | Đánh đổi | 3 Cao cấp | 12 |
| [A gradient check that fails for the wrong reason](gradient-check-step-size.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [A logistic regression whose weights never stop growing](logistic-loss-on-separable-data.md) | Khái niệm | 3 Cao cấp | 12 |
| [A forest that ranks a user id as its top feature](mdi-ranks-noise-feature.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [A variance that comes out wrong on large values](variance-of-large-numbers.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [Decide whether a small win on one split is real](compare-two-models-with-folds.md) | Thiết kế | 4 Staff | 15 |
| [Test error that falls, spikes and falls again](past-the-interpolation-threshold.md) | Khái niệm | 4 Staff | 15 |
| [Build a stacking ensemble whose meta-learner never cheats](stacking-without-leakage.md) | Làm ở nhà | 4 Staff | 25 |

[Tất cả các thẻ](../../README.md)
