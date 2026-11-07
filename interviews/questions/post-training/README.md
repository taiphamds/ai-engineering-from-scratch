# Post-training

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Tinh chỉnh có giám sát, tinh chỉnh preference, LoRA và học tăng cường trên một mô hình đã huấn luyện.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [Train the head only, or fine-tune the whole model](classifier-head-or-full.md) | Đánh đổi | 1 Sơ tuyển | 8 |
| [Count the parameters of one LoRA adapter](lora-parameter-count.md) | Ước lượng | 1 Sơ tuyển | 6 |
| [A million scraped pairs or a small curated set](sft-data-quality-wins.md) | Đánh đổi | 1 Sơ tuyển | 8 |
| [Why the SFT loss skips the instruction tokens](sft-loss-mask.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [Replacing the human labeler with a principled model](constitutional-ai-not-cheaper.md) | Khái niệm | 2 Làm việc | 10 |
| [Where the reward model went in DPO](dpo-implicit-reward.md) | Khái niệm | 2 Làm việc | 12 |
| [A DPO trainer whose loss never moves](dpo-reference-bug.md) | Đọc mã | 2 Làm việc | 12 |
| [A flat GRPO reward and the groups that teach nothing](grpo-groups-teach-nothing.md) | Gỡ lỗi | 2 Làm việc | 12 |
| [What the KL penalty in RLHF protects](kl-penalty-purpose.md) | Khái niệm | 2 Làm việc | 10 |
| [Fit a 7B fine-tune on a 24 GB GPU](qlora-on-one-gpu.md) | Ước lượng | 2 Làm việc | 10 |
| [Why reward models learn from pairs, not scores](reward-model-pairwise.md) | Khái niệm | 2 Làm việc | 10 |
| [The GPU is idle and the RL log keeps growing](rl-engine-died-silent.md) | Gỡ lỗi | 2 Làm việc | 10 |
| [Reusing the pretraining learning rate for SFT](sft-learning-rate-gap.md) | Khái niệm | 2 Làm việc | 8 |
| [Margin up, chosen answers down, in a DPO run](dpo-chosen-logprob-falls.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [DPO or the full RLHF stack for a small team](dpo-or-rlhf.md) | Đánh đổi | 3 Cao cấp | 12 |
| [Remove a cause of the gap before you reweight it](gap-remove-before-reweight.md) | Đánh đổi | 3 Cao cấp | 15 |
| [A step-0 gap several times the healthy range](logprob-gap-at-step-zero.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [Pick a preference loss for four kinds of data](preference-loss-picker.md) | Thiết kế | 3 Cao cấp | 15 |
| [The reward climbs and the human ratings do not](reward-up-humans-flat.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [Write and prove a custom reward for GRPO](rl-custom-reward-take-home.md) | Làm ở nhà | 3 Cao cấp | 30 |
| [Review a claimed RL speedup before it becomes a default](rl-report-a-change.md) | Thiết kế | 3 Cao cấp | 12 |
| [Design async RL rollout and control the sample age](async-rl-sample-age.md) | Thiết kế | 4 Staff | 15 |
| [Does dropping the reward model end reward hacking](daa-still-overoptimize.md) | Khái niệm | 4 Staff | 12 |
| [Plan the post-training of a support assistant](post-training-pipeline-take-home.md) | Làm ở nhà | 4 Staff | 45 |

[Tất cả các thẻ](../../README.md)
