# Capstone 14 — Speculative-Decoding Inference Server

> Decode suy đoán — một bản nháp rẻ đề xuất token, mô hình đích xác minh chúng trong một lượt — giờ là một tối ưu sẵn sàng cho sản xuất, không phải thủ thuật nghiên cứu. EAGLE-3 trong vLLM 0.7 cung cấp thông lượng 2.5-3x trên lưu lượng thực. P-EAGLE (AWS 2026) đã đẩy suy đoán song song xa hơn nữa. SpecForge của SGLang đã huấn luyện các đầu nháp ở quy mô lớn. Hub Speculators của Red Hat đã công bố các bản nháp được căn chỉnh cho các mô hình mở phổ biến. TensorRT-LLM đã đưa decode suy đoán thành tính năng hạng nhất trên NVIDIA. Ngăn xếp phục vụ sản xuất năm 2026 là vLLM hoặc SGLang với các bản nháp họ EAGLE, lượng tử hóa FP8 hoặc INT4, và HPA theo thời gian chờ hàng đợi. Bài tổng kết này là phục vụ hai mô hình mở ở thông lượng 2.5x+ đường cơ sở với một báo cáo độ trễ đuôi đầy đủ.

**Type:** Capstone
**Languages:** Python (serving), C++ / CUDA (kernel inspection), YAML (configs)
**Prerequisites:** Phase 3 (deep learning), Phase 7 (transformers), Phase 10 (LLMs from scratch), Phase 17 (infrastructure)
**Phases exercised:** P3 · P7 · P10 · P17
**Time:** 30 hours

## Problem

Decode suy đoán đã trở thành hàng hóa phổ thông năm 2026. Các đầu nháp EAGLE-3 huấn luyện trên các trạng thái ẩn của mô hình đích và dự đoán trước N token; mô hình đích xác minh trong một lượt duy nhất. Tỷ lệ chấp nhận 60-80% chuyển thành thông lượng đầu cuối 2-3x. vLLM 0.7 tích hợp điều này một cách nguyên bản. SGLang + SpecForge cung cấp cho bạn pipeline huấn luyện. Speculators của Red Hat công bố các bản nháp được căn chỉnh cho Llama 3.3 70B, Qwen3-Coder-30B MoE, GPT-OSS-120B.

Kỹ nghệ nằm ở vận hành phục vụ, không phải mô hình. Tỷ lệ chấp nhận trôi theo phân phối lưu lượng (ShareGPT so với mã so với dữ liệu miền). Độ trễ đuôi khi bị từ chối tệ hơn khi không suy đoán — bạn phải báo cáo p99 ở nhiều kích thước lô, không chỉ token/giây ở trạng thái ổn định. Chi phí trên mỗi 1M token so với API Anthropic / OpenAI là đòn bẩy độ tin cậy.

## Concept

Decode suy đoán có hai lớp. Một mô hình **nháp** (đầu EAGLE-3, ngram, hoặc mô hình nhỏ hơn được căn chỉnh với đích) đề xuất k token ứng viên mỗi bước. Mô hình **đích** xác minh cả k trong một lượt; bất kỳ tiền tố nào được chấp nhận đều thay thế đường tham lam. Tỷ lệ chấp nhận phụ thuộc vào sự căn chỉnh nháp-đích và phân phối đầu vào.

EAGLE-3 vượt các bản nháp ngram trên hầu hết lưu lượng. P-EAGLE chạy suy đoán song song cho các cây nháp sâu hơn. Sự đánh đổi: độ trễ P99 khi từ chối cao hơn vì lượt xác minh lớn hơn. Cấu hình phục vụ phải báo cáo độ trễ được chia nhóm theo kích thước lô để làm lộ điều này.

Triển khai là Kubernetes. vLLM 0.7 chạy một bản sao trên mỗi GPU hoặc shard song song tensor. HPA tự động mở rộng theo thời gian chờ hàng đợi thay vì CPU. Các bản lượng tử FP8 (Marlin) và INT4 (AWQ) giữ bộ nhớ GPU trong giới hạn H100 / H200. Báo cáo đầu cuối là thông lượng, tỷ lệ chấp nhận, p50/p99 ở lô 1/8/32, và $/1M token.

## Architecture

```
request ingress
    |
    v
vLLM server (0.7) or SGLang (0.4)
    |
    +-- draft: EAGLE-3 heads | P-EAGLE parallel | ngram fallback
    +-- target: Llama 3.3 70B | Qwen3-Coder-30B | GPT-OSS-120B
    |     quantized FP8-Marlin or INT4-AWQ
    |
    v
verify pass: batch k draft tokens through target
    |
    v (accept prefix; resample for rejected suffix)
    v
token stream back to client
    |
    v
Prometheus metrics: throughput, acceptance rate, queue wait, latency p50/p99
    |
    v
HPA on queue-wait metric
```

## Stack

- Phục vụ: vLLM 0.7 hoặc SGLang 0.4
- Phương pháp suy đoán: các đầu nháp EAGLE-3, suy đoán song song P-EAGLE, dự phòng ngram
- Huấn luyện bản nháp: SpecForge (SGLang) hoặc Red Hat Speculators
- Mô hình đích: Llama 3.3 70B, Qwen3-Coder-30B MoE, GPT-OSS-120B
- Lượng tử hóa: FP8 (Marlin), INT4 AWQ
- Triển khai: Kubernetes + plugin thiết bị NVIDIA; HPA theo chỉ số thời gian chờ hàng đợi
- Đánh giá: ShareGPT, MT-Bench-v2, GSM8K, HumanEval cho phép đo mức chấp nhận trải rộng các miền
- Tham chiếu: decode suy đoán TensorRT-LLM cho một đường cơ sở nhà cung cấp

```figure
cf-spec-decode
```

## Build It

1. **Chuẩn bị mô hình đích.** Chọn Llama 3.3 70B. Lượng tử hóa xuống FP8 qua Marlin. Triển khai dưới vLLM 0.7 trên 1xH100 (hoặc song song tensor 2x).

2. **Nguồn bản nháp.** Kéo một đầu nháp EAGLE-3 được căn chỉnh từ Red Hat Speculators (hoặc huấn luyện một đầu qua SpecForge). Nạp vào cấu hình decode suy đoán của vLLM.

3. **Các số liệu đường cơ sở.** Trước suy đoán: token/s ở lô 1/8/32, độ trễ p50/p99, mức sử dụng GPU. Công bố.

4. **Bật EAGLE-3.** Đổi cấu hình; chạy lại cùng benchmark. Báo cáo mức tăng tốc, tỷ lệ chấp nhận, chênh lệch độ trễ đuôi p99.

5. **P-EAGLE.** Bật suy đoán song song; đo cây nháp sâu hơn so với EAGLE-3 tuần tự. Báo cáo điểm chuyển nơi P-EAGLE giúp ích so với gây hại.

6. **Lưu lượng miền.** Chạy ShareGPT so với HumanEval so với lưu lượng đặc thù miền qua cùng máy chủ. Đo tỷ lệ chấp nhận theo phân phối. Xác định khi các bản nháp bị trôi.

7. **Mô hình đích thứ hai.** Chạy cùng pipeline trên Qwen3-Coder-30B MoE. Bản nháp khó hơn (nhiễu định tuyến MoE). Báo cáo.

8. **K8s HPA.** Triển khai dưới K8s với HPA theo dõi `queue_wait_ms`. Chứng minh mở rộng ngang khi tải tăng gấp ba.

9. **So sánh chi phí.** Tính $/1M token so với Anthropic Claude Sonnet 4.7 và OpenAI GPT-5.4 trên cùng đánh giá. Công bố.

## Use It

```
$ curl https://infer.example.com/v1/chat/completions -d '{"messages":[...]}'
[serve]     vLLM 0.7, Llama 3.3 70B FP8, EAGLE-3 active
[decode]    bs=8, accepted_tokens_per_step=3.2, acceptance_rate=0.76
[latency]   first-token 42ms, full-response 980ms (620 tokens)
[cost]      $0.34 per 1M output tokens at sustained throughput
```

## Ship It

`outputs/skill-inference-server.md` mô tả sản phẩm bàn giao. Một ngăn xếp phục vụ được đo lường với decode suy đoán, một báo cáo benchmark đầy đủ, và một bản triển khai K8s.

| Trọng số | Tiêu chí | Cách đo |
|:-:|---|---|
| 25 | Mức tăng tốc đo được so với đường cơ sở | Thông lượng 2.5x+ ở chất lượng tương ứng trên hai mô hình |
| 20 | Tỷ lệ chấp nhận trên lưu lượng thực tế | Báo cáo tỷ lệ chấp nhận theo phân phối |
| 20 | Kỷ luật độ trễ đuôi P99 | p99 ở lô 1/8/32 có và không có suy đoán |
| 20 | Vận hành | Triển khai K8s, HPA theo thời gian chờ hàng đợi, phát hành suôn sẻ |
| 15 | Bài viết và phương pháp luận | Giải thích rõ điều gì đã thay đổi và tại sao |
| **100** | | |

## Exercises

1. Đo sự suy giảm tỷ lệ chấp nhận khi bản nháp chậm hơn đích một phiên bản (ví dụ, độ trôi Llama 3.3 -> 3.4). Xây dựng một cảnh báo giám sát.

2. Triển khai dự phòng ngram: nếu mức chấp nhận EAGLE-3 giảm dưới một ngưỡng, chuyển sang các bản nháp ngram. Báo cáo cải thiện độ tin cậy.

3. Chạy một thí nghiệm MoE có kiểm soát: cùng Qwen3-Coder-30B có chèn nhiễu định tuyến so với không có. Đo độ nhạy của mức chấp nhận bản nháp.

4. Mở rộng sang H200 (141 GB). Báo cáo phần dư kích thước mô hình trên mỗi bản sao đạt được và liệu bạn có thể phục vụ một Llama 3.3 70B chưa lượng tử hóa không.

5. Đo benchmark decode suy đoán TensorRT-LLM trên cùng phần cứng H100. Báo cáo nơi nó thắng so với vLLM.

## Key Terms

| Thuật ngữ | Cách mọi người nói | Ý nghĩa thực sự |
|------|-----------------|------------------------|
| Draft model (Mô hình nháp) | "Bộ suy đoán" | Mô hình nhỏ đề xuất N token để đích xác minh |
| EAGLE-3 | "Kiến trúc nháp năm 2026" | Đầu nháp được huấn luyện trên các trạng thái ẩn của đích; mức chấp nhận ~75% |
| P-EAGLE | "Suy đoán song song" | Cây các nhánh nháp được xác minh trong một lượt của đích |
| Acceptance rate (Tỷ lệ chấp nhận) | "Tỷ lệ trúng" | Tỷ lệ token được nháp được chấp nhận mà không lấy mẫu lại |
| Quantization (Lượng tử hóa) | "FP8 / INT4" | Trọng số có độ chính xác thấp hơn để chứa nhiều mô hình hơn trong bộ nhớ GPU |
| Queue wait (Thời gian chờ hàng đợi) | "Chỉ số HPA" | Thời gian một yêu cầu chờ trong hàng đợi chờ xử lý trước khi suy luận bắt đầu |
| Speculators hub (Hub Speculators) | "Các bản nháp được căn chỉnh" | Hub Red Hat Neural Magic chứa các bản nháp EAGLE cho các mô hình mở phổ biến |

## Further Reading

- [vLLM EAGLE and P-EAGLE documentation](https://docs.vllm.ai) — ngăn xếp phục vụ tham chiếu
- [P-EAGLE (AWS 2026)](https://aws.amazon.com/blogs/machine-learning/p-eagle-faster-llm-inference-with-parallel-speculative-decoding-in-vllm/) — bài báo decode suy đoán song song + tích hợp
- [SGLang SpecForge](https://github.com/sgl-project/SpecForge) — pipeline huấn luyện đầu nháp
- [Red Hat Speculators](https://github.com/neuralmagic/speculators) — hub bản nháp được căn chỉnh
- [TensorRT-LLM speculative decoding](https://nvidia.github.io/TensorRT-LLM/) — lựa chọn thay thế của nhà cung cấp
- [Fireworks.ai serving architecture](https://fireworks.ai/blog) — tham chiếu thương mại
- [EAGLE-3 paper (arXiv:2503.01840)](https://arxiv.org/abs/2503.01840) — bài báo phương pháp
- [vLLM repository](https://github.com/vllm-project/vllm) — mã và benchmark
