# Capstone 07 — End-to-End Fine-Tuning Pipeline (Data to SFT to DPO to Serve)

> Một mô hình lớp 8B được huấn luyện trên dữ liệu của riêng bạn, được DPO-align theo các ưu tiên của riêng bạn, được lượng tử hóa, speculative-decode và phục vụ ở $/1M token có thể đo được. Ngăn xếp mở năm 2026 là Axolotl v0.8, TRL 0.15, Unsloth để lặp lại, GPTQ/AWQ/GGUF để lượng tử hóa, vLLM 0.7 với EAGLE-3 để phục vụ. Capstone là chạy toàn bộ pipeline có thể tái tạo (YAML vào, endpoint phục vụ ra) và công bố một model card theo Model Openness Framework 2026.

**Type:** Capstone
**Languages:** Python (pipeline), YAML (configs), Bash (scripts)
**Prerequisites:** Phase 2 (ML), Phase 3 (DL), Phase 7 (transformers), Phase 10 (LLMs from scratch), Phase 11 (LLM engineering), Phase 17 (infrastructure), Phase 18 (safety)
**Phases exercised:** P2 · P3 · P7 · P10 · P11 · P17 · P18
**Time:** 35 hours

## Problem

Mọi nhóm AI nghiêm túc năm 2026 giữ pipeline tinh chỉnh sẵn dùng. Không vì phát hành mô hình nền tiên tiến hàng đầu, mà vì thích nghi hạ nguồn — SFT miền, DPO theo ưu tiên có nhãn, bản nháp chưng cất cho decode suy đoán, phục vụ EAGLE-3 — là nơi có lợi ích đo được. Axolotl v0.8 xử lý cấu hình SFT đa GPU. TRL 0.15 xử lý DPO và GRPO. Unsloth cho lặp nhanh một GPU. vLLM 0.7 với EAGLE-3 đẩy thông lượng decode 2-3x không mất chất lượng. Công cụ hoạt động; kỹ nghệ nằm ở YAML, giữ gìn dữ liệu và kỷ luật đánh giá.

Bạn sẽ đưa một mô hình cơ sở 8B đến 14B (Llama 3.1 8B, Qwen3 14B hoặc Gemma 3 12B) qua SFT rồi DPO trên dữ liệu đặc thù tác vụ, lượng tử hóa để phục vụ và đo các cải thiện với lm-evaluation-harness, RewardBench-2, MT-Bench-v2 và MMLU-Pro. Bạn sẽ tạo một model card theo Model Openness Framework 2026. Điểm chính là khả năng tái tạo: một lệnh chạy lại toàn bộ pipeline từ đầu đến cuối.

## Concept

Pipeline có năm giai đoạn. **Dữ liệu**: khử trùng (MinHash / Datatrove), lọc chất lượng (bộ phân loại kiểu Nemotron-CC), làm sạch PII, kiểm tra phân chia chống nhiễm phép đo chuẩn công khai. **SFT**: YAML Axolotl, ZeRO-3 trên 8xH100, lịch cosine, chuỗi đóng gói, 2-3 epoch. **DPO hoặc GRPO**: cấu hình TRL, 1 epoch, cặp ưu tiên do con người gắn nhãn hoặc mô hình chấm, chỉnh beta. **Lượng tử hóa**: GPTQ + AWQ + GGUF cho linh hoạt triển khai. **Phục vụ**: vLLM 0.7 với đầu suy đoán EAGLE-3 (hoặc SGLang với SpecForge), deployment K8s, HPA theo chờ hàng đợi.

Thí nghiệm loại bỏ là sản phẩm bàn giao: chỉ SFT so SFT+DPO so SFT+GRPO trên ba phép đo chuẩn riêng tác vụ. Chỉ số phục vụ: token/s ở lô 1 / 8 / 32, tỷ lệ chấp nhận EAGLE-3, $/1M token. Đánh giá an toàn: tỷ lệ vượt Llama Guard 4. Thẻ mô hình: đánh giá thiên lệch, seed tái lập, cấp phép dữ liệu.

## Architecture

```
raw data (HF datasets + internal)
    |
    v
Datatrove dedup + Nemotron-CC quality filter + PII scrub
    |
    v
split hygiene (MMLU-Pro contamination check)
    |
    v
Axolotl SFT config (YAML)  ---> 8xH100, ZeRO-3
    |
    v
TRL DPO / GRPO config       ---> 4xH100, 1 epoch
    |
    v
GPTQ + AWQ + GGUF quantize
    |
    v
vLLM 0.7 + EAGLE-3 speculative decoding
    |
    v
K8s deployment, HPA on queue-wait
    |
    v
lm-eval-harness + RewardBench-2 + MT-Bench-v2 + MMLU-Pro
    |
    v
model card (2026 MOF) + safety eval (Llama Guard 4)
```

## Stack

- Dữ liệu: Datatrove khử trùng, bộ phân loại Nemotron-CC cho chất lượng, Presidio cho PII
- Cơ sở: Llama 3.1 8B, Qwen3 14B hoặc Gemma 3 12B
- SFT: Axolotl v0.8 với ZeRO-3, Flash Attention 3, chuỗi đóng gói
- Tinh chỉnh ưu tiên: TRL 0.15 cho DPO hoặc GRPO; Unsloth cho lặp một GPU
- Lượng tử hóa: GPTQ (Marlin), AWQ, GGUF qua llama.cpp
- Phục vụ: vLLM 0.7 với decode suy đoán EAGLE-3 (hoặc SGLang 0.4 + SpecForge)
- Đánh giá: lm-evaluation-harness, RewardBench-2, MT-Bench-v2, MMLU-Pro
- Đánh giá an toàn: Llama Guard 4, ShieldGemma-2
- Hạ tầng: Kubernetes + plugin thiết bị NVIDIA, HPA theo chỉ số chờ hàng đợi
- Khả năng quan sát: W&B cho huấn luyện, Langfuse cho suy luận

```figure
ce-finetune-stages
```

## Build It

1. **Pipeline dữ liệu.** Chạy khử trùng Datatrove trên corpus thô. Áp bộ phân loại chất lượng kiểu Nemotron-CC. Presidio làm sạch PII. Ghi phân chia train/val với seed tường minh.

2. **Kiểm tra nhiễm.** Với mỗi phần validation, tính MinHash so tập kiểm thử MMLU-Pro, MT-Bench-v2, RewardBench-2. Từ chối mọi chồng lấp.

3. **SFT Axolotl.** YAML với ZeRO-3, FA3, đóng gói chuỗi. 2-3 epoch trên 8xH100. Ghi log W&B.

4. **DPO / GRPO TRL.** Lấy checkpoint SFT, chạy một epoch DPO trên cặp ưu tiên (hoặc GRPO với phần thưởng xác minh được trên toán/mã). Quét beta.

5. **Lượng tử hóa.** Tạo ba bản lượng tử: GPTQ-INT4-Marlin, AWQ-INT4, GGUF-Q4_K_M cho llama.cpp. Ghi kích thước và thông lượng danh định.

6. **Phục vụ bằng decode suy đoán.** Cấu hình vLLM 0.7 với đầu nháp EAGLE-3 huấn luyện qua Red Hat Speculators. Đo tỷ lệ chấp nhận và độ trễ đuôi ở lô 1 / 8 / 32. Báo cáo $/1M token so Anthropic / OpenAI trên cùng đánh giá.

7. **Ma trận đánh giá.** Chạy lm-eval-harness, RewardBench-2, MT-Bench-v2, MMLU-Pro trên nền, chỉ SFT, SFT+DPO, SFT+GRPO. Tạo bảng.

8. **Đánh giá an toàn.** Tỷ lệ vượt Llama Guard 4 trên tập dev. Bộ lọc đầu ra ShieldGemma-2.

9. **Thẻ mô hình.** Mẫu MOF 2026: dữ liệu, huấn luyện, đánh giá, an toàn, giấy phép, phần tái lập với YAML và SHA commit.

## Use It

```
$ ./pipeline.sh config/llama3.3-8b-domainX.yaml
[data]    300k deduped, 12k filtered, 280k accepted (seed=7)
[SFT]     3 epochs, 8xH100, 6h12m, val loss 1.42 -> 1.03
[DPO]     1 epoch, beta=0.08, 4xH100, 1h40m
[quant]   GPTQ-INT4 4.6 GB, AWQ-INT4 4.8 GB, GGUF-Q4_K_M 5.1 GB
[serve]   vLLM 0.7, EAGLE-3 acceptance 0.74, p99 126ms @ bs=8
[eval]    MMLU-Pro +3.2, MT-Bench-v2 +0.41, RewardBench-2 +0.08
[card]    model-card.md generated under 2026 MOF
```

## Ship It

`outputs/skill-finetuning-pipeline.md` mô tả sản phẩm bàn giao. Một lệnh chạy dữ liệu qua SFT qua DPO qua lượng tử qua phục vụ qua đánh giá, xuất thẻ mô hình + endpoint phục vụ.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Chênh lệch đánh giá so nền | Mức tăng đo được trên tác vụ mục tiêu (MMLU-Pro, MT-Bench-v2, riêng tác vụ) |
| 20 | Khả năng tái lập pipeline | Một lệnh chạy lại đầu cuối với seed giống hệt |
| 20 | Giữ gìn dữ liệu | Tỷ lệ khử trùng, bao phủ làm sạch PII, kiểm tra nhiễm xanh |
| 20 | Hiệu quả phục vụ | token/s ở bs=1/8/32, tỷ lệ chấp nhận EAGLE-3, $/1M token |
| 15 | Thẻ mô hình + đánh giá an toàn | Đầy đủ MOF 2026 + tỷ lệ vượt Llama Guard 4 |
| **100** | | |

## Exercises

1. Chạy chỉ SFT so SFT+DPO so SFT+GRPO trên cùng phép đo chuẩn riêng tác vụ. Báo cáo phương pháp ưu tiên nào thắng và bao nhiêu.

2. Thay Llama 3.1 8B bằng Qwen3 14B. Đo $/1M token ở chất lượng khớp nhau.

3. Đo tỷ lệ chấp nhận EAGLE-3 trên dữ liệu miền so ShareGPT chung. Báo cáo chênh lệch và ý nghĩa cho ngân sách độ trễ.

4. Chèn 1% nhiễm (làm lộ câu trả lời MMLU-Pro vào dữ liệu huấn luyện) và chạy lại đánh giá. Xem độ chính xác MMLU-Pro tăng phi thực tế. Xây cổng CI kiểm tra nhiễm bắt điều này.

5. Thêm SFT LoRA làm thay thế tinh chỉnh đầy đủ. Đo khoảng cách chất lượng ở bộ nhớ thấp hơn 10x.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|-----------------|------------------------|
| Axolotl | "Bộ huấn luyện SFT" | Bộ huấn luyện hợp nhất điều khiển YAML cho SFT, DPO và chưng cất |
| TRL | "Bộ tinh chỉnh ưu tiên" | Thư viện Hugging Face cho DPO, GRPO, PPO trên LLM |
| GRPO | "Tối ưu hóa chính sách tương đối nhóm" | Công thức RL DeepSeek R1 với phần thưởng xác minh được |
| EAGLE-3 | "Bản nháp decode suy đoán" | Đầu nháp dự đoán trước N token; vLLM xác minh bằng mô hình mục tiêu |
| MOF | "Khung Độ mở Mô hình" | Tiêu chuẩn 2026 chấm phát hành mô hình về dữ liệu, mã, giấy phép |
| Contamination check (Kiểm tra nhiễm) | "Giữ gìn phân chia" | Phát hiện rò rỉ tập kiểm thử vào huấn luyện dựa trên MinHash |
| Acceptance rate (Tỷ lệ chấp nhận) | "Chỉ số EAGLE / MTP" | Tỷ phần token nháp mô hình mục tiêu chấp nhận |

## Further Reading

- [Axolotl documentation](https://axolotl-ai-cloud.github.io/axolotl/) — bộ huấn luyện SFT / DPO tham chiếu
- [TRL documentation](https://huggingface.co/docs/trl) — triển khai DPO và GRPO tham chiếu
- [Unsloth](https://github.com/unslothai/unsloth) — tham chiếu lặp một GPU
- [DeepSeek R1 paper (arXiv:2501.12948)](https://arxiv.org/abs/2501.12948) — phương pháp GRPO
- [vLLM + EAGLE-3 documentation](https://docs.vllm.ai) — ngăn xếp phục vụ tham chiếu
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) — bộ huấn luyện decode suy đoán thay thế
- [Model Openness Framework (arXiv:2403.13784)](https://arxiv.org/abs/2403.13784): tiêu chuẩn chấm hạng phát hành mở
- [lm-evaluation-harness](https://github.com/EleutherAI/lm-evaluation-harness) — bộ chạy đánh giá kinh điển
