# Load Testing LLM APIs — Why k6 and Locust Lie

> Các công cụ kiểm thử tải truyền thống không được thiết kế cho phản hồi truyền theo luồng, độ dài đầu ra biến thiên, chỉ số cấp token hay bão hòa GPU. Hai bẫy ảnh hưởng hầu hết các nhóm. Bẫy GIL: phép đo cấp token của Locust chạy tokenization dưới GIL Python, cạnh tranh với việc tạo yêu cầu ở độ đồng thời cao; tồn đọng tokenization sau đó làm tăng độ trễ giữa token được báo cáo — client của bạn là nút thắt, không phải máy chủ. Bẫy prompt đồng nhất: các prompt giống hệt trong một vòng lặp kiểm thử một điểm trên phân phối token; lưu lượng thực có độ dài biến thiên và các khớp tiền tố đa dạng. LLMPerf sửa điều này bằng `--mean-input-tokens` + `--stddev-input-tokens`. Ánh xạ công cụ năm 2026: chuyên biệt LLM (GenAI-Perf, LLMPerf, LLM-Locust, guidellm) cho độ chính xác cấp token; **k6 v2026.1.0** + **k6 Operator 1.0 GA (tháng 9 năm 2025)** — nhận biết truyền theo luồng, phân tán nguyên bản Kubernetes qua CRD TestRun/PrivateLoadZone, tốt nhất cho cổng CI/CD; Vegeta cho bão hòa tốc độ không đổi bằng Go; Locust 2.43.3 chỉ với phần mở rộng LLM-Locust cho truyền theo luồng. Mẫu tải: trạng thái ổn định, tăng dần, đột biến (kiểm thử tự mở rộng quy mô), kéo dài (rò rỉ bộ nhớ).

**Type:** Build
**Languages:** Python (stdlib, toy realistic-prompt generator + latency collector)
**Prerequisites:** Phase 17 · 08 (Inference Metrics), Phase 17 · 03 (GPU Autoscaling)
**Time:** ~75 minutes

## Learning Objectives

- Giải thích hai phản mẫu (bẫy GIL, bẫy prompt đồng nhất) làm các công cụ kiểm thử tải tổng quát nói sai với API LLM.
- Chọn công cụ cho một mục đích: LLMPerf (lần chạy đo chuẩn), k6 + phần mở rộng truyền theo luồng (cổng CI), guidellm (tổng hợp quy mô lớn), GenAI-Perf (tham chiếu NVIDIA).
- Thiết kế bốn mẫu tải (ổn định, tăng dần, đột biến, kéo dài) và nêu chế độ lỗi mà mỗi mẫu bắt được.
- Xây một phân phối prompt thực tế bằng trung bình + độ lệch chuẩn token đầu vào thay vì độ dài cố định.

## The Problem

Bạn kiểm thử endpoint LLM bằng k6 ở 500 người dùng đồng thời. Nó trụ được. Bạn triển khai. Trong sản xuất ở 200 người dùng thực, dịch vụ sụp đổ — P99 TTFT bùng nổ, GPU bị ghim ở mức tối đa.

Hai việc đã xảy ra. Thứ nhất, k6 gửi 500 prompt giống hệt — việc hợp nhất yêu cầu và lưu bộ nhớ đệm tiền tố của bạn làm có vẻ bạn xử lý 500 lượt decode đồng thời trong khi thực ra chỉ xử lý một. Thứ hai, k6 không theo dõi độ trễ giữa token trên phản hồi truyền theo luồng theo cách mắt cảm nhận; nó thấy một kết nối HTTP, không phải 500 token đến ở các khoảng thời gian khác nhau.

Kiểm thử tải cho LLM là một chuyên môn riêng.

## The Concept

### The GIL trap (Locust)

Locust dùng Python và chạy tokenization phía client dưới GIL. Ở độ đồng thời cao, tokenizer xếp hàng sau việc tạo yêu cầu. Độ trễ giữa token được báo cáo bao gồm tồn đọng tokenization phía client. Bạn nghĩ máy chủ chậm; đó là bộ kiểm thử.

Giải pháp: phần mở rộng LLM-Locust chuyển tokenization sang tiến trình riêng, hoặc dùng bộ kiểm thử bằng ngôn ngữ biên dịch (k6, LLMPerf dùng tokenizers.rs).

### The prompt-uniformity trap

Mọi công cụ kiểm thử tải đã biết đều cho phép bạn cấu hình một prompt. Trong kiểm thử vòng lặp 10,000 lượt, cùng một prompt được gửi mỗi lần. Máy chủ thấy cùng tiền tố mỗi lần — lượt trúng bộ nhớ đệm tiền tố tiến gần 100%, thông lượng trông tuyệt vời.

Giải pháp: lấy mẫu từ một phân phối prompt. LLMPerf dùng `--mean-input-tokens 500 --stddev-input-tokens 150` — độ dài đa dạng, nội dung đa dạng.

### Four load patterns

1. **Trạng thái ổn định** — RPS không đổi trong 30-60 phút. Bắt được: suy giảm hiệu năng cơ sở.
2. **Tăng dần** — tăng RPS tuyến tính từ 0 đến mục tiêu trong 15 phút. Bắt được: điểm gãy năng lực, bất thường làm nóng.
3. **Đột biến** — RPS đột ngột 3-10x trong 2 phút rồi trở lại. Bắt được: độ trễ tự mở rộng quy mô, bão hòa hàng đợi, tác động khởi động nguội.
4. **Kéo dài** — trạng thái ổn định trong 4-8 giờ. Bắt được: rò rỉ bộ nhớ, độ trôi bể kết nối, tràn khả năng quan sát.

### 2026 tool mapping

**LLMPerf** (Anyscale) — Python nhưng tokenization dựa trên Rust. Prompt theo trung bình/độ lệch chuẩn. Nhận biết truyền theo luồng. Mặc định tốt nhất cho các lần chạy hiệu năng.

**NVIDIA GenAI-Perf** — tham chiếu của NVIDIA. Dùng client Triton; bao phủ chỉ số toàn diện. Lưu ý ITL của nó loại TTFT; của LLMPerf bao gồm TTFT. Hai công cụ cho TPOT khác nhau trên cùng máy chủ.

**LLM-Locust** (TrueFoundry) — phần mở rộng Locust sửa bẫy GIL. DSL Locust quen thuộc + chỉ số truyền theo luồng.

**guidellm** — đo chuẩn tổng hợp quy mô lớn.

**k6 v2026.1.0** + **k6 Operator 1.0 GA (tháng 9 năm 2025)**:
- Chính k6 (Go, biên dịch, không GIL) đã thêm chỉ số nhận biết truyền theo luồng.
- k6 Operator dùng CRD TestRun / PrivateLoadZone để kiểm thử phân tán nguyên bản Kubernetes.
- Tốt nhất cho cổng CI/CD và kiểm thử SLA.

**Vegeta** — Go, đơn giản hơn k6. Bão hòa HTTP tốc độ không đổi. Không nhận biết LLM nhưng tốt cho kiểm thử gateway / giới hạn tốc độ.

**Locust 2.43.3 nguyên bản** — có bẫy GIL cho LLM. Chỉ dùng với phần mở rộng LLM-Locust.

### SLA gate in CI

Chạy k6 trên PR với:

- Mỗi lần 30-50 lượt ở RPS cơ sở.
- Cổng: P50/P95 TTFT, 5xx < 5%, TPOT dưới ngưỡng.
- Làm bản dựng thất bại khi vi phạm.

### Realistic prompt distribution

Xây từ mẫu lưu lượng thực (nếu bạn có) hoặc từ phân phối được công bố (ví dụ: prompt ShareGPT cho trò chuyện, HumanEval cho mã). Đưa trung bình + độ lệch chuẩn vào LLMPerf. Tránh vòng lặp một prompt bằng mọi giá.

### Numbers you should remember

- k6 Operator 1.0 GA: tháng 9 năm 2025.
- k6 v2026.1.0: chỉ số nhận biết truyền theo luồng.
- Lần chạy LLMPerf điển hình: 100-1000 yêu cầu ở độ đồng thời X.
- Cổng CI điển hình: 30-50 lượt mỗi PR.
- Bốn mẫu: ổn định, tăng dần, đột biến, kéo dài.

```figure
load-pattern-waves
```

## Use It

`code/main.py` mô phỏng kiểm thử tải với phân phối prompt thực tế, đo TPOT hiệu dụng và minh họa bẫy prompt đồng nhất.

## Ship It

Bài học này tạo ra `outputs/skill-load-test-plan.md`. Với khối lượng công việc và SLA, chọn công cụ và thiết kế bốn mẫu tải.

## Exercises

1. Chạy `code/main.py`. So sánh phân phối đồng nhất với thực tế — chênh lệch ở đâu?
2. Viết script k6 cho một cổng CI: TTFT P95 < 800 ms ở độ đồng thời 100, thời gian chạy 5 phút.
3. Kiểm thử kéo dài của bạn cho thấy bộ nhớ tăng 50 MB/giờ. Nêu ba nguyên nhân và việc đo đạc để phân biệt chúng.
4. Kiểm thử đột biến từ 10 RPS lên 100 RPS. Thời gian khôi phục dự kiến là bao nhiêu nếu có Karpenter + production-stack vLLM (Giai đoạn 17 · 03 + 18)?
5. GenAI-Perf báo cáo TPOT=6ms; LLMPerf báo cáo TPOT=11ms trên cùng máy chủ. Giải thích.

## Key Terms

| Thuật ngữ | Mọi người nói gì | Thực sự có nghĩa là gì |
|------|----------------|------------------------|
| LLMPerf | "bộ kiểm thử LLM" | Công cụ đo chuẩn Anyscale, nhận biết truyền theo luồng |
| GenAI-Perf | "công cụ NVIDIA" | Bộ kiểm thử tham chiếu NVIDIA |
| LLM-Locust | "Locust cho LLM" | Phần mở rộng Locust sửa bẫy GIL |
| guidellm | "đo chuẩn tổng hợp" | Công cụ tổng hợp quy mô lớn |
| k6 Operator | "k6 K8s" | k6 phân tán dựa trên CRD |
| GIL trap (Bẫy GIL) | "chi phí phụ client Python" | Tồn đọng tokenization làm tăng độ trễ được báo cáo |
| Prompt-uniformity trap (Bẫy prompt đồng nhất) | "lời nói dối một prompt" | Vòng lặp cùng prompt trúng bộ nhớ đệm, làm tăng thông lượng |
| Steady-state (Trạng thái ổn định) | "tải không đổi" | RPS phẳng trong N phút |
| Ramp (Tăng dần) | "tăng tuyến tính" | Từ 0 đến mục tiêu trong một khoảng thời gian |
| Spike (Đột biến) | "kiểm thử bùng phát" | Đột ngột nhân lên rồi hoàn nguyên |
| Soak (Kéo dài) | "kiểm thử dài" | Nhiều giờ để phát hiện rò rỉ |

## Further Reading

- [TianPan — Load Testing LLM Applications](https://tianpan.co/blog/2026-03-19-load-testing-llm-applications)
- [PremAI — Load Testing LLMs 2026](https://blog.premai.io/load-testing-llms-tools-metrics-realistic-traffic-simulation-2026/)
- [NVIDIA NIM — Introduction to LLM Inference Benchmarking](https://docs.nvidia.com/nim/large-language-models/1.0.0/benchmarking.html)
- [TrueFoundry — LLM-Locust](https://www.truefoundry.com/blog/llm-locust-a-tool-for-benchmarking-llm-performance)
- [LLMPerf](https://github.com/ray-project/llmperf)
- [k6 Operator](https://github.com/grafana/k6-operator)
