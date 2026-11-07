# Tokenization, sampling and decoding

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Cách văn bản trở thành các token, cách một mô hình chọn token tiếp theo, và cách suy đoán khiến giải mã nhanh hơn.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [One step of byte-pair training and what it leaves behind](bpe-training-loop.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [The same prompt costs more tokens in Korean](multilingual-tax.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Why models read subwords and start from bytes](why-subword-tokens.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Three ways to build a subword vocabulary](bpe-wordpiece-unigram.md) | Đánh đổi | 2 Làm việc | 8 |
| [The notebook works and the service never stops talking](chat-template-garbage.md) | Gỡ lỗi | 2 Làm việc | 8 |
| [How a grammar edits the logits and why it can be faster](constrained-decoding-how.md) | Khái niệm | 2 Làm việc | 8 |
| [Why the encoder replays the merge list in order](merge-order-at-encode.md) | Khái niệm | 2 Làm việc | 8 |
| [What the split before the merges is for](pre-tokenization-regex.md) | Khái niệm | 2 Làm việc | 8 |
| [Two decoders, one breaks on an emoji](read-the-decoder-round-trip.md) | Đọc mã | 2 Làm việc | 8 |
| [Count the windows a token stream gives you](sliding-window-dataset.md) | Đọc mã | 2 Làm việc | 8 |
| [Speculation flies on code and stalls on creative writing](temperature-and-acceptance.md) | Đánh đổi | 2 Làm việc | 8 |
| [Put numbers on growing the vocabulary to 128K](vocab-size-tradeoff.md) | Ước lượng | 2 Làm việc | 8 |
| [Why a draft that reads hidden states accepts more](hidden-state-drafts.md) | Khái niệm | 3 Cao cấp | 10 |
| [Which multi-token design gives a free draft](mtp-sequential-vs-parallel.md) | Khái niệm | 3 Cao cấp | 10 |
| [Read one speculative step and defend each line](read-the-speculative-step.md) | Đọc mã | 3 Cao cấp | 12 |
| [Every output validates and the answers are wrong](schema-field-order.md) | Thiết kế | 3 Cao cấp | 10 |
| [From acceptance rate to tokens per pass](speedup-from-alpha.md) | Ước lượng | 3 Cao cấp | 10 |
| [Take-home, a byte-level tokenizer with tests](take-home-bpe-tokenizer.md) | Làm ở nhà | 3 Cao cấp | 15 |
| [The weights did not change and the score fell](tokenizer-drift-ci.md) | Gỡ lỗi | 3 Cao cấp | 10 |
| [Mean latency improved and the tail got worse](acceptance-fell-after-upgrade.md) | Gỡ lỗi | 4 Staff | 12 |
| [Bake in the draft, train it after, or borrow a small model](choose-the-draft-for-a-new-model.md) | Thiết kế | 4 Staff | 15 |
| [Design the tokenizer for a multilingual coding model](design-tokenizer-for-new-model.md) | Thiết kế | 4 Staff | 15 |

[Tất cả các thẻ](../../README.md)
