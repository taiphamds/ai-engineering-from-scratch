# Inference Metrics — TTFT, TPOT, ITL, Goodput, P99

> Năm chỉ số quyết định liệu một triển khai suy luận có hoạt động hay không. TTFT là prefill cộng hàng đợi cộng mạng. TPOT (thường được báo cáo là ITL, dù các công cụ bất đồng về việc ITL có tính token đầu tiên hay không) là chi phí decode bị giới hạn bởi bộ nhớ trên mỗi token. Độ trễ đầu cuối là TTFT cộng TPOT nhân độ dài đầu ra. Throughput là token mỗi giây được tổng hợp trên toàn bộ đội máy. Nhưng chỉ số quan trọng với sản phẩm là goodput — tỷ lệ yêu cầu đáp ứng mọi SLO đồng thời. Throughput cao với goodput thấp nghĩa là bạn đang xử lý các token không bao giờ đến người dùng đúng giờ. Số liệu tham chiếu cho Llama-3.1-8B-Instruct trên TRT-LLM năm 2026: TTFT trung bình 162 ms, TPOT trung bình 7.33 ms, E2E trung bình 1,093 ms. Luôn báo cáo P50, P90, P99 — đừng bao giờ chỉ báo cáo trung bình. Và chú ý bẫy đo lường: GenAI-Perf loại TTFT khỏi phép tính ITL, LLMPerf bao gồm nó; hai công cụ bất đồng về TPOT cho cùng một lần chạy.

**Type:** Learn
**Languages:** Python (stdlib, toy percentile calculator and goodput reporter)
**Prerequisites:** Phase 17 · 04 (Serving Engine Internals)
**Time:** ~60 minutes

## Learning Objectives

- Định nghĩa chính xác TTFT, TPOT, ITL, E2E, thông lượng, và goodput và nêu thành phần mỗi chỉ số đo.
- Giải thích vì sao trung bình là thống kê sai cho phục vụ LLM và cách đọc P50/P90/P99.
- Xây dựng một đa ràng buộc SLO (ví dụ TTFT<500 ms VÀ TPOT<15 ms VÀ E2E<2 s) và tính goodput theo nó.
- Nêu hai công cụ benchmark bất đồng về TPOT cho cùng lần chạy và giải thích vì sao.

## The Problem

“Thông lượng của chúng tôi là 15,000 token mỗi giây.” Thì sao? Nếu 40% yêu cầu vượt quá 2 giây đầu cuối, người dùng bỏ phiên. Chỉ thông lượng không cho bạn biết liệu sản phẩm có hoạt động không.

Suy luận có nhiều trục độ trễ và mỗi trục thất bại khác nhau. Prefill bị giới hạn bởi tính toán và tăng theo độ dài prompt. Decode bị giới hạn bởi bộ nhớ và tăng theo kích thước lô. Độ trễ xếp hàng là một vấn đề vận hành. Mạng là một vấn đề khoảng cách vật lý. Bạn cần các chỉ số riêng cho mỗi trục, và cần các phân vị, và cần một tổng hợp đơn lẻ nói “người dùng có nhận những gì họ kỳ vọng không” — đó là goodput.

## The Concept

### TTFT — time to first token

`TTFT = queue_time + network_request + prefill_time`

Prefill chi phối khi các prompt dài. Trên Llama-3.3-70B FP8 trên H100, một prompt 32k mất ~800 ms prefill thuần. Thời gian hàng đợi là hành vi bộ lập lịch dưới tải. Yêu cầu mạng là thời gian đường truyền bao gồm TLS. TTFT là độ trễ người dùng thấy trước khi bất kỳ thứ gì truyền luồng trở lại.

### TPOT / ITL — inter-token latency

Nhiều tên cho một đại lượng. `TPOT` (thời gian mỗi token đầu ra), `ITL` (độ trễ giữa token), `decode latency per token` — tất cả như nhau. Nó là thời gian giữa các token truyền luồng liên tiếp sau token đầu.

`TPOT = (decode_forward_time + scheduler_overhead) / tokens_produced`

Trên cùng ngăn xếp Llama-3.3-70B H100 với prefill chia khối, TPOT trung bình ~7 ms. Không có prefill chia khối, trong một prefill dài trên một chuỗi lân cận, TPOT có thể tăng vọt tới 50 ms. Theo dõi P99, không phải trung bình.

### E2E latency

`E2E = TTFT + TPOT * output_tokens + network_response`

Với các đầu ra dài (>500 token), E2E bị TPOT chi phối. Với các đầu ra ngắn có prompt dài, E2E bị TTFT chi phối. Báo cáo E2E có điều kiện theo độ dài đầu ra.

### Throughput

`throughput = total_output_tokens / elapsed_time`

Chỉ số tổng hợp. Cho bạn biết hiệu quả đội máy. Không cho biết sức khỏe từng yêu cầu.

### Goodput — the metric you actually care about

`goodput = fraction of requests meeting (TTFT <= a) AND (TPOT <= b) AND (E2E <= c)`

SLO là đa ràng buộc. Một yêu cầu chỉ "tốt" nếu mọi ràng buộc đều được giữ. Goodput là tỷ lệ đó. Thay vào đó, một số bài báo và dashboard báo cáo goodput như một tốc độ: số yêu cầu mỗi giây đáp ứng mọi SLO. Nhân tỷ lệ với tốc độ yêu cầu để chuyển đổi. Throughput cao ở goodput 60% là thất bại. Throughput thấp hơn ở goodput 99% là mục tiêu.

Năm 2026, goodput là chỉ số được dùng trong các bài nộp MLPerf Inference v6.0 và trong theo dõi SLA nội bộ tại các nhà cung cấp nền tảng AI.

### Why mean is the wrong statistic

Các phân phối độ trễ LLM lệch phải. Một lô decode có một láng giềng prefill dài có thể đưa ra 500 token với TPOT ~7 ms và 20 token với TPOT ~60 ms. TPOT trung bình là 9 ms. P99 TPOT là 65 ms. Người dùng thường xuyên chạm P99 — đó là lý do họ rời đi.

Luôn báo cáo bộ ba (P50, P90, P99). Với trải nghiệm người dùng, P99 là chỉ số bạn tối ưu.

### Reference numbers — Llama-3.1-8B-Instruct on TRT-LLM, 2026

- TTFT trung bình: 162 ms
- TPOT trung bình: 7.33 ms
- E2E trung bình: 1,093 ms
- P99 TPOT: thay đổi 10-25 ms tùy cấu hình prefill chia khối.

Đây là các điểm tham chiếu NVIDIA được công bố. Chúng thay đổi theo kích thước mô hình (70B sẽ cho thấy 3-5x), phần cứng (H100 so với B200 ~3x), và tải.

### The measurement trap

Hai trong các công cụ benchmark được dùng nhiều nhất năm 2026 bất đồng về TPOT cho cùng lần chạy:

- **NVIDIA GenAI-Perf**: loại TTFT khỏi tính ITL. ITL bắt đầu từ token 2.
- **LLMPerf**: bao gồm TTFT. ITL bắt đầu từ token 1.

Với một yêu cầu có TTFT 500 ms và 100 token đầu ra trong tổng decode 700 ms, GenAI-Perf báo `ITL = 700/99 = 7.07 ms`, LLMPerf báo `ITL = 1200/100 = 12.00 ms`. Lựa chọn công cụ thay đổi con số.

Luôn nêu công cụ nào. Luôn công bố định nghĩa.

### Constructing an SLO

Một SLO hướng người tiêu dùng hợp lý cho một mô hình trò chuyện 70B năm 2026:

- TTFT P99 <= 800 ms.
- TPOT P99 <= 25 ms.
- E2E P99 <= 3 s cho các đầu ra <300 token.
- Mục tiêu goodput >= 99%.

Các SLO doanh nghiệp siết TTFT (200-400 ms) và nới E2E. Mục đích là viết chúng xuống, đo cả ba, và theo dõi goodput như một tổng hợp đơn lẻ.

### How to measure

- Chạy lưu lượng thực hoặc tổng hợp thực tế (LLMPerf với `--mean-input-tokens 800 --stddev-input-tokens 300 --mean-output-tokens 150`).
- Nhắm 2x mức đồng thời đỉnh cho lần chạy benchmark.
- Chạy 30-50 lần lặp, lấy các phân vị của mẫu kết hợp.
- Công bố với tên công cụ, phiên bản công cụ, mô hình, phần cứng, mức đồng thời, phân phối prompt.

```figure
throughput-latency
```

## Use It

`code/main.py` là một bộ tính goodput đồ chơi. Sinh một phân phối độ trễ tổng hợp, áp dụng một SLO, và tính goodput. Cũng cho thấy khác biệt TPOT GenAI-Perf so với LLMPerf trên cùng dấu vết.

Máy [Inside an LLM Serving GPU](https://aiengineeringfromscratch.com/inside-an-llm-serving-gpu?users=1) hiển thị thời gian trên mỗi token đầu ra đến từ đâu trên một NVIDIA L4. Một bước decode đọc 16.41 GB trọng số, mất ít nhất 54.7 ms ở 300 GB/s, và bước đo được mất 60.16 ms.

## Ship It

Bài này tạo ra `outputs/skill-slo-goodput-gate.md`. Với một khối lượng công việc và SLO, nó tạo một công thức benchmark sẵn sàng CI/CD đặt cổng triển khai theo goodput thay vì thông lượng.

## Exercises

1. Chạy `code/main.py`. Sinh một phân phối với 1% tăng vọt đuôi. Goodput thay đổi thế nào khi bạn siết P99 TPOT từ 30 ms xuống 15 ms?
2. Một nhà cung cấp trích “15,000 tok/s trên Llama 3.3 70B H100”. Nêu ba câu hỏi cần hỏi trước khi tin.
3. Vì sao prefill chia khối bảo vệ P99 TPOT nhưng không bảo vệ TPOT trung bình?
4. Xây dựng một SLO người tiêu dùng cho một trợ lý giọng nói (token đầu được nghe, không được đọc). Chỉ số nào nhìn thấy rõ nhất với người dùng?
5. Đọc README LLMPerf và tài liệu GenAI-Perf. Xác định ba chỉ số khác nơi các công cụ bất đồng.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Ý nghĩa thực sự |
|------|----------------|------------------------|
| TTFT | “thời gian tới token đầu tiên” | Hàng đợi + mạng + prefill; bị prefill chi phối ở các prompt dài |
| TPOT | “thời gian mỗi token đầu ra” | Chi phí decode bị giới hạn bởi bộ nhớ mỗi token sau token đầu |
| ITL | “độ trễ giữa token” | Giống TPOT trong hầu hết công cụ (không phải tất cả — xem GenAI-Perf) |
| E2E | “đầu cuối” | TTFT + TPOT * output_len; thêm mạng phía phản hồi |
| Throughput (Thông lượng) | “tok/s” | Hiệu quả đội máy; vô dụng nếu thiếu các phân vị độ trễ |
| Goodput | “tỷ lệ đạt SLO” | Tỷ lệ các yêu cầu đáp ứng mọi ràng buộc SLO đồng thời |
| P99 | “đuôi” | Độ trễ trường hợp xấu 1-trong-100; chỉ số trải nghiệm người dùng |
| SLO multi-constraint (Đa ràng buộc SLO) | “phần chung” | VÀ của cả ba giới hạn độ trễ; một yêu cầu thất bại nếu bất kỳ giới hạn nào bị vi phạm |
| GenAI-Perf vs LLMPerf (GenAI-Perf so với LLMPerf) | “bẫy công cụ” | Các công cụ bất đồng về liệu ITL có bao gồm TTFT |

## Further Reading

- [NVIDIA NIM — LLM Benchmarking Metrics](https://docs.nvidia.com/nim/benchmarking/llm/latest/metrics.html) — định nghĩa chuẩn của TTFT, ITL, TPOT.
- [Anyscale — LLM Serving Benchmarking Metrics](https://docs.anyscale.com/llm/serving/benchmarking/metrics) — các định nghĩa thay thế và công thức đo.
- [BentoML — LLM Inference Metrics](https://bentoml.com/llm/inference-optimization/llm-inference-metrics) — phép đo ứng dụng trên các triển khai thực.
- [LLMPerf](https://github.com/ray-project/llmperf) — benchmark mã nguồn mở dựa trên Ray.
- [GenAI-Perf](https://github.com/triton-inference-server/perf_analyzer/blob/main/genai-perf/README.md) — công cụ benchmark của NVIDIA.
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference-datacenter/) — benchmark dựa trên goodput được ngành chấp nhận.
