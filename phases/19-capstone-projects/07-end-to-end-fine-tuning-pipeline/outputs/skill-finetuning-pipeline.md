---
name: finetuning-pipeline
description: Run a reproducible data-to-SFT-to-DPO-to-serve fine-tuning pipeline with ablations, quantization, and a 2026 Model Openness Framework model card.
version: 1.0.0
phase: 19
lesson: 07
tags: [capstone, fine-tuning, axolotl, trl, dpo, grpo, vllm, eagle-3, mof]
---

Với một mô hình cơ sở (Llama 3.1 8B, Qwen3 14B hoặc Gemma 3 12B) và một bộ dữ liệu đặc thù tác vụ, xây dựng một pipeline một lệnh tạo ra một endpoint phục vụ và một model card có thể tái tạo.

Kế hoạch xây dựng:

1. Giai đoạn dữ liệu: khử trùng Datatrove, lọc chất lượng kiểu Nemotron-CC, làm sạch PII Presidio, phân chia train/val có seed.
2. Kiểm tra nhiễm: MinHashLSH so MMLU-Pro, MT-Bench-v2, RewardBench-2. Từ chối khi chồng lấp.
3. SFT: Axolotl v0.8 với ZeRO-3, Flash Attention 3, chuỗi đóng gói, 2-3 epoch trên 8xH100.
4. Tinh chỉnh ưu tiên: DPO TRL 0.15 (hoặc GRPO với phần thưởng xác minh được) trong 1 epoch, quét beta.
5. Lượng tử hóa: GPTQ-INT4-Marlin + AWQ-INT4 + GGUF-Q4_K_M.
6. Phục vụ: vLLM 0.7 với decode suy đoán EAGLE-3 (đầu nháp qua Red Hat Speculators hoặc SGLang SpecForge). Deployment K8s với HPA theo chờ hàng đợi.
7. Đánh giá: lm-evaluation-harness, RewardBench-2, MT-Bench-v2, MMLU-Pro trên nền/chỉ SFT/SFT+DPO/SFT+GRPO.
8. An toàn: tỷ lệ vượt Llama Guard 4, bộ lọc đầu ra ShieldGemma-2.
9. Thẻ mô hình theo Model Openness Framework 2026 có phần dữ liệu, huấn luyện, đánh giá, an toàn, tái lập.

Tiêu chí đánh giá:

| Trọng số | Tiêu chí | Phép đo |
|:-:|---|---|
| 25 | Chênh lệch đánh giá so nền | Mức tăng đo được trên MMLU-Pro, MT-Bench-v2, phép đo chuẩn riêng tác vụ |
| 20 | Khả năng tái lập pipeline | Chạy lại một lệnh với seed giống hệt cho hash khớp |
| 20 | Giữ gìn dữ liệu | Tỷ lệ khử trùng, bao phủ làm sạch PII, kiểm tra nhiễm xanh |
| 20 | Hiệu quả phục vụ | token/s ở lô 1/8/32, chấp nhận EAGLE-3, $/1M token |
| 15 | Thẻ mô hình + đánh giá an toàn | Đầy đủ MOF 2026 + tỷ lệ vượt Llama Guard 4 |

Các trường hợp loại bỏ dứt khoát:

- Pipeline bỏ kiểm tra nhiễm MinHash. Làm lộ MMLU-Pro vào huấn luyện là chế độ lỗi gian lận đánh giá kinh điển.
- Lần huấn luyện không đính seed hoặc YAML. Tái lập là yêu cầu cứng.
- Phục vụ không có EAGLE-3 hoặc cấu hình decode suy đoán tương đương. Token/s đường cơ sở không là tiêu chuẩn 2026.
- Thiếu đánh giá an toàn. Mọi bản tinh chỉnh đi kèm tỷ lệ vượt Llama Guard 4.

Quy tắc từ chối:

- Từ chối công bố thẻ mô hình khẳng định điểm phép đo chuẩn không đính SHA commit lm-eval-harness.
- Từ chối tinh chỉnh trên dữ liệu có giấy phép cấm mô hình phái sinh. MOF chấm cấp phép dữ liệu.
- Từ chối phát hành mô hình lượng tử hóa không đo mất chất lượng trên ma trận đánh giá.

Đầu ra: một kho mã chứa trình điều phối pipeline, các YAML cho Llama 3.1 8B + một mô hình cơ sở thay thế, nhật ký chạy W&B SFT và DPO, các sản phẩm lượng tử hóa, endpoint phục vụ, ma trận đánh giá ba benchmark, đánh giá an toàn, model card MOF 2026 và một bài viết về ba vấn đề vệ sinh dữ liệu lớn nhất bạn phát hiện và sửa.
