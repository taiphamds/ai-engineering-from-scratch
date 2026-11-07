# System design

File này được tạo bởi `node scripts/interviews/validate.js --write`. Không chỉnh sửa nó.

Thiết kế một dịch vụ mô hình đầu cuối: các yêu cầu, dữ liệu, mô hình, phục vụ, đánh giá và chi phí.

| Câu hỏi | Loại | Cấp độ | Phút |
|---|---|---|---|
| [The signals that a demo has become a product](demo-to-product-signals.md) | Khái niệm | 1 Sơ tuyển | 6 |
| [A churn model with a good AUC that nobody uses](metric-layers-churn-auc.md) | Khái niệm | 1 Sơ tuyển | 8 |
| [When to say no to a model](when-not-ml.md) | Khái niệm | 1 Sơ tuyển | 8 |
| [Roll out a new prompt without betting the product on it](ab-test-prompt-rollout.md) | Thiết kế | 2 Làm việc | 12 |
| [Batch or online serving for a two-hour freshness limit](batch-vs-online-serving-choice.md) | Đánh đổi | 2 Làm việc | 12 |
| [Design the churn system, not the churn model](churn-model-system.md) | Thiết kế | 2 Làm việc | 20 |
| [A spam classifier from 800 messages and a pretrained body](classifier-head-swap-choice.md) | Đánh đổi | 2 Làm việc | 12 |
| [Design monitoring for a payment risk model](drift-monitoring-design.md) | Thiết kế | 2 Làm việc | 15 |
| [Design a feature store that keeps training honest](feature-store-design.md) | Thiết kế | 2 Làm việc | 15 |
| [Project the monthly bill of a chat feature](llm-cost-projection.md) | Ước lượng | 2 Làm việc | 10 |
| [Put a model demo behind a public link safely](public-demo-controls.md) | Thiết kế | 2 Làm việc | 15 |
| [Keep a chat service answering when the provider does not](streaming-and-fallback.md) | Thiết kế | 2 Làm việc | 15 |
| [Design a chat API for ten thousand daily users](batched-inference-api-budget.md) | Thiết kế | 3 Cao cấp | 25 |
| [Accuracy fell and every input monitor stayed green](concept-drift-blind-spot.md) | Gỡ lỗi | 3 Cao cấp | 12 |
| [Design the gate that decides whether a model ships](eval-platform-ship-gate.md) | Thiết kế | 3 Cao cấp | 20 |
| [One command from raw data to a served tuned model](finetune-pipeline-design.md) | Thiết kế | 3 Cao cấp | 25 |
| [A payment fraud check inside a hundred milliseconds](fraud-check-100ms.md) | Thiết kế | 3 Cao cấp | 20 |
| [Design cited search over ten repositories of code](rag-service-company-docs.md) | Thiết kế | 3 Cao cấp | 25 |
| [Offline accuracy was fine and live accuracy is not](skew-triage.md) | Gỡ lỗi | 3 Cao cấp | 15 |
| [Review an ML design document and name the blockers](design-doc-blocking-review.md) | Thiết kế | 4 Staff | 20 |
| [Keep clean data when the model changes its own future](feedback-loop-clean-data.md) | Thiết kế | 4 Staff | 15 |
| [Write the rollback plan before the training run starts](pipeline-rollback-plan.md) | Đánh đổi | 4 Staff | 20 |

[Tất cả các thẻ](../../README.md)
