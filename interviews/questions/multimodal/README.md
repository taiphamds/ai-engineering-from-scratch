# Multimodal

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Cách các mô hình thị giác và ngôn ngữ kết hợp ảnh và văn bản, và cách chúng được huấn luyện.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [How much context one image costs](image-tokens-per-image.md) | Ước lượng | 1 Sơ tuyển | 8 |
| [Why the first VLM stage trains only the bridge](train-only-the-projector.md) | Khái niệm | 1 Sơ tuyển | 8 |
| [The three parts of a vision-language model](vlm-three-parts.md) | Khái niệm | 1 Sơ tuyển | 8 |
| [A caption decoder with its masks swapped](cross-attention-mask-bug.md) | Đọc mã | 2 Làm việc | 12 |
| [Adapter tokens or one shared vocabulary for images](early-or-late-fusion.md) | Đánh đổi | 2 Làm việc | 12 |
| [What one generated image costs in codes and seconds](emu3-generation-cost.md) | Ước lượng | 2 Làm việc | 10 |
| [Which knob moves a multimodal reasoning score](llm-size-sets-ceiling.md) | Khái niệm | 2 Làm việc | 10 |
| [Any number of images, a fixed number of tokens each](perceiver-fixed-tokens.md) | Khái niệm | 2 Làm việc | 12 |
| [Build and test a projection between two frozen models](projector-alignment-take-home.md) | Làm ở nhà | 2 Làm việc | 30 |
| [Query bridge or MLP for the connector](qformer-or-mlp.md) | Đánh đổi | 2 Làm việc | 12 |
| [A general VLM for which shelf the item is on](spatial-reasoning-limit.md) | Đánh đổi | 2 Làm việc | 10 |
| [Predict the next scale instead of the next token](var-next-scale.md) | Khái niệm | 2 Làm việc | 10 |
| [An early-fusion run that diverges at scale](chameleon-diverged.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [A gated VLM fine-tune that forgot how to write](gate-opened-too-fast.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [Dense human captions or two million distilled ones](human-captions-beat-distillation.md) | Đánh đổi | 3 Cao cấp | 12 |
| [Three ways to generate an image from one transformer](show-o-parallel-decoding.md) | Đánh đổi | 3 Cao cấp | 12 |
| [Monitor a deployed VLM for invented objects](vlm-hallucination-kpi.md) | Thiết kế | 3 Cao cấp | 15 |
| [Why the tokenizer caps a generated image](vq-tokenizer-ceiling.md) | Khái niệm | 3 Cao cấp | 12 |
| [Three runs to close a VLM benchmark gap](which-knob-first.md) | Đánh đổi | 3 Cao cấp | 15 |
| [Design a VLM for an on-device UI agent](mobile-ui-agent-vlm.md) | Thiết kế | 4 Staff | 20 |
| [One open model to answer, edit and generate](pick-a-unified-model.md) | Thiết kế | 4 Staff | 15 |
| [Two losses, one transformer, one gradient step](transfusion-two-losses.md) | Khái niệm | 4 Staff | 15 |

[Tất cả các thẻ](../../README.md)
